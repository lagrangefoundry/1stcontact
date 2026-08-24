/**
 * BUG-36 — `bin/publish` can actually authenticate against a deployed builder.
 *
 * THE BUG THESE PIN DOWN. `pushSite` sent its Access credential as a
 * `cf-access-jwt-assertion` header. That header is what Access SETS on the
 * request it forwards to the origin, carrying an identity it has already
 * verified; it is not an inbound credential, and Access ignores it. So
 * `bin/publish --production` could never have worked — and it did not fail
 * cleanly either: the client followed Access's 302 to the login page, got 200
 * with HTML, and `JSON.parse` threw on `<!DOCTYPE html>`.
 *
 * Two things are asserted throughout, because fixing only one leaves the
 * operator no better off: the RIGHT credential goes out (the service-token
 * pair), and a refusal READS as a refusal.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pushSite } from '../tools/generate/src/cli/push'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'

const REPO_ROOT = join(__dirname, '..')

/** A store holding one trivial site, which is all a push needs to have content. */
function storeWithSite(slug = 'xgd') {
  const store = memorySiteStore()
  store.seed(slug, { siteJson: { name: slug }, pages: { index: { kind: 'page' } } })
  return store
}

/** A `fetch` that records the one request made and answers with `response`. */
function recordingFetch(response: { status: number; body: string }) {
  const calls: { url: string; init: RequestInit }[] = []
  const impl = ((url: string, init: RequestInit) => {
    calls.push({ url, init })
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      text: () => Promise.resolve(response.body),
    })
  }) as unknown as typeof fetch
  return { impl, calls }
}

const headersOf = (init: RequestInit): Record<string, string> =>
  init.headers as Record<string, string>

describe('BUG-36 — the publish credential is the one Access accepts', () => {
  it('test_UAT_FC_BUG-36_push_sends_the_service_token_pair', async () => {
    // The whole fix in one assertion: Access exchanges this PAIR at the edge for
    // the JWT it forwards. Nothing else a client can send stands in for it.
    const { impl, calls } = recordingFetch({
      status: 200,
      body: '{"pages":1,"assets":0,"siteJson":true}',
    })
    await pushSite(storeWithSite(), 'xgd', {
      origin: 'https://app.1stcontact.io',
      access: { clientId: 'abc.access', clientSecret: 's3cret' },
      fetch: impl,
    })

    const headers = headersOf(calls[0].init)
    expect(headers['CF-Access-Client-Id']).toBe('abc.access')
    expect(headers['CF-Access-Client-Secret']).toBe('s3cret')
  })

  it('test_UAT_FC_BUG-36_push_never_sends_the_origin_assertion_header', async () => {
    // The deleted mistake, asserted as deleted. `cf-access-jwt-assertion` is the
    // far side's header; a client that sends one is asserting an identity it has
    // not proved, and Access is right to ignore it. Kept as a fallback it would
    // be a code path that has never once succeeded (CLAUDE.md: no legacy modes).
    const { impl, calls } = recordingFetch({ status: 200, body: '{"pages":1,"assets":0,"siteJson":true}' })
    await pushSite(storeWithSite(), 'xgd', {
      origin: 'https://app.1stcontact.io',
      access: { clientId: 'abc.access', clientSecret: 's3cret' },
      fetch: impl,
    })

    const names = Object.keys(headersOf(calls[0].init)).map((n) => n.toLowerCase())
    expect(names).not.toContain('cf-access-jwt-assertion')
  })

  it('test_UAT_FC_BUG-36_an_unauthenticated_push_reads_as_a_refusal', async () => {
    // The symptom the operator actually met. Access answers 302 to its login
    // page; with `redirect: 'follow'` that returns 200 HTML, `res.ok` is true,
    // and the failure surfaces as a JSON parse error about a doctype. Here the
    // 302 must arrive as itself and be NAMED — including how to get a credential.
    const { impl } = recordingFetch({ status: 302, body: '' })
    await expect(
      pushSite(storeWithSite(), 'xgd', { origin: 'https://app.1stcontact.io', fetch: impl }),
    ).rejects.toThrow(/302/)

    const { impl: again } = recordingFetch({ status: 302, body: '' })
    await expect(
      pushSite(storeWithSite(), 'xgd', { origin: 'https://app.1stcontact.io', fetch: again }),
    ).rejects.toThrow(/CF_ACCESS_CLIENT_ID[\s\S]*CF_ACCESS_CLIENT_SECRET/)
  })

  it('test_UAT_FC_BUG-36_an_opaque_redirect_reads_as_a_refusal_too', async () => {
    // `redirect: 'manual'` yields the 3xx itself under Node's fetch and an
    // OPAQUE response — status 0, no body — under a fetch that follows the spec
    // for browsers. Both mean "bounced to a login page", so both must say so
    // rather than one of them reporting "refused with 0: (no body)".
    const { impl } = recordingFetch({ status: 0, body: '' })
    await expect(
      pushSite(storeWithSite(), 'xgd', { origin: 'https://app.1stcontact.io', fetch: impl }),
    ).rejects.toThrow(/login page[\s\S]*CF_ACCESS_CLIENT_ID/)
  })

  it('test_UAT_FC_BUG-36_the_redirect_is_not_followed', async () => {
    // The mechanism behind the assertion above, pinned separately: if this
    // reverts to the default, the 302 test passes only until a real Access
    // deployment answers with a followable redirect.
    const { impl, calls } = recordingFetch({ status: 200, body: '{"pages":1,"assets":0,"siteJson":true}' })
    await pushSite(storeWithSite(), 'xgd', { origin: 'http://localhost:8788', fetch: impl })

    expect(calls[0].init.redirect).toBe('manual')
  })

  it('test_UAT_FC_BUG-36_a_local_push_needs_no_credential', async () => {
    // `wrangler dev` is not behind Access, and the ordinary local loop must not
    // acquire a credential requirement as a side effect of fixing production.
    const { impl, calls } = recordingFetch({ status: 200, body: '{"pages":1,"assets":0,"siteJson":true}' })
    await pushSite(storeWithSite(), 'xgd', { origin: 'http://localhost:8788', fetch: impl })

    const names = Object.keys(headersOf(calls[0].init)).map((n) => n.toLowerCase())
    expect(names).not.toContain('cf-access-client-id')
    expect(names).not.toContain('cf-access-client-secret')
  })
})

describe('BUG-36 — the operator scripts name the credential that exists', () => {
  const publish = readFileSync(join(REPO_ROOT, 'bin/publish'), 'utf8')

  it('test_UAT_FC_BUG-36_publish_refuses_production_without_both_halves', () => {
    // A service token is a PAIR. Half of one is not a weaker credential, it is a
    // request refused at the edge with a message about identity rather than
    // about the half that was missing locally — so it is caught here instead.
    expect(publish).toMatch(/CF_ACCESS_CLIENT_ID/)
    expect(publish).toMatch(/CF_ACCESS_CLIENT_SECRET/)
    expect(publish).toMatch(/-z "\$client_id" \|\| -z "\$client_secret"/)
    // Named fix, not just a named fault.
    expect(publish).toMatch(/bin\/access-token/)
  })

  it('test_UAT_FC_BUG-36_publish_no_longer_offers_a_single_value_token', () => {
    // `CF_ACCESS_TOKEN` never denoted anything Access accepts. Leaving the name
    // in place would keep sending operators to look for a value that cannot be
    // obtained, which is how this bug survived a written ACCESS.md.
    expect(publish).not.toMatch(/CF_ACCESS_TOKEN/)
    expect(publish).not.toMatch(/--token\b/)
  })

  it('test_UAT_FC_BUG-36_the_provisioner_is_executable_and_gated_on_the_api_token', () => {
    const path = join(REPO_ROOT, 'bin/access-token')
    // eslint-disable-next-line no-bitwise
    expect(statSync(path).mode & 0o111).not.toBe(0)

    const source = readFileSync(path, 'utf8')
    expect(source).toMatch(/CLOUDFLARE_API_TOKEN/)
    // The distinction the whole ticket turns on, written where it is acted on:
    // the API token PROVISIONS the service token and is never the credential
    // `bin/publish` presents.
    expect(source).toMatch(/non_identity/)
    expect(source).not.toMatch(/cf-access-jwt-assertion/)
  })

  it('test_UAT_FC_BUG-36_the_provisioner_writes_no_secret_to_disk', () => {
    // Cloudflare shows a client secret once. The temptation is to cache it; the
    // cost of doing so is a long-lived Access credential sitting in a repo tree.
    const source = readFileSync(join(REPO_ROOT, 'bin/access-token'), 'utf8')
    expect(source).not.toMatch(/open\([^)]*["']w["']/)
    expect(source).not.toMatch(/write_text|writeFileSync/)
  })
})
