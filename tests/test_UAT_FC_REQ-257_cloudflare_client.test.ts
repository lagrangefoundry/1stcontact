import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  CLOUDFLARE_API_BASE,
  CloudflareAccountUnknownError,
  CloudflareApiError,
  CloudflareNotConfiguredError,
  cloudflareFor,
  requireCloudflare,
  type CloudflareClient,
} from '../apps/control-app/src/cloudflare'
import { readWranglerConfig } from './support/wrangler-toml'
import { secretHookHarness } from './support/secret-hook'
import { credentialShapesIn } from './support/credential-scan'

/**
 * [[REQ-257]] — **the Cloudflare client: one module, one token, and the
 * operations are enumerated rather than a generic passthrough.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the SHIPPED client against a
 * scripted transport and asserts the request it actually built — the method, the
 * path, the bearer header, the JSON body — and the values it read back out of
 * Cloudflare's envelope. Nothing here reaches `api.cloudflare.com`, and that is
 * not a convenience: the real client can DELETE A ZONE, and a suite holding a
 * live credential would not fail against the real API, it would succeed, and the
 * first time it happened it would take a customer's mail down with it.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. THE SURFACE IS ENUMERATED AND THERE IS NO PASSTHROUGH. *"A method that
 *     takes a path and a body"* is the ticket's own falsifier, and this suite
 *     pins the exact set of methods rather than trusting that nobody added one.
 *  2. **ABSENT BINDING MEANS REFUSE, NOT DEGRADE** — the fail-closed rule
 *     `lead.ts` and `gate.ts` already follow. No token is `null` from the
 *     constructor and a named error from the requiring form; it is never a
 *     client that optimistically does nothing.
 *  3. THE TOKEN IS A SECRET AND IS IN NO COMMITTED FILE, and the hook that
 *     pushes it carries the name and never a value.
 *  4. IT IS NOT THE EMBEDDER'S CREDENTIAL. `CLOUDFLARE_API_TOKEN` and
 *     `CLOUDFLARE_ACCOUNT_ID` are Workers AI's ([[BUG-73]]) and are
 *     both-or-neither; nothing in the DNS layer reads either, because a zone
 *     token under that name would be the wrong scope AND would break the project
 *     knowledge base to configure.
 *  5. THE ACCOUNT ID IS DISCOVERED, NOT CONFIGURED — read off a zone the token
 *     can already see, so it cannot drift from the account the token reaches.
 *  6. A REFUSAL IS REPORTED AND NEVER SWALLOWED, and a 404 on a zone read is an
 *     ANSWER rather than a failure — while a 403 on the same read is not.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const TOKEN = 'cf-dns-token-for-the-suite'

const harness = secretHookHarness(
  'bin/deploy.d/secrets/40-cloudflare-dns-token',
  'CLOUDFLARE_DNS_TOKEN',
)
afterAll(() => harness.dispose())

/** One request the client made, as the transport saw it. */
interface Seen {
  method: string
  url: string
  authorization: string | null
  body: unknown
}

/** A transport that records, and answers from a script. */
function scripted(
  answers: (seen: Seen) => { status?: number; payload?: unknown },
): { fetch: typeof fetch; seen: Seen[] } {
  const seen: Seen[] = []
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers as HeadersInit)
    const record: Seen = {
      method: init?.method ?? 'GET',
      url: String(input),
      authorization: headers.get('authorization'),
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
    }
    seen.push(record)
    const { status = 200, payload = { success: true, result: null } } = answers(record)
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  }) as unknown as typeof fetch
  return { fetch: impl, seen }
}

const ZONE = {
  id: 'cf-zone-alice',
  name: 'alicesplumbing.com',
  status: 'active',
  name_servers: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
  account: { id: 'cf-account-1st' },
}

function clientOver(fetchImpl: typeof fetch): CloudflareClient {
  const client = cloudflareFor({ CLOUDFLARE_DNS_TOKEN: TOKEN }, fetchImpl)
  if (client === null) throw new Error('the suite constructed no client')
  return client
}

describe('REQ-257 — the Cloudflare client', () => {
  it('test_UAT_FC_REQ-257_the_surface_is_enumerated_and_has_no_passthrough', () => {
    const client = clientOver(scripted(() => ({})).fetch)

    // THE EXACT SET, not a subset. A suite asserting only that the ten
    // operations exist would pass after an eleventh called `request` was added,
    // which is the one thing the ticket forbids.
    expect(Object.keys(client).sort()).toEqual(
      [
        'accountId',
        'createRecord',
        'createRoute',
        'createZone',
        'deleteRecord',
        'deleteRoute',
        'deleteZone',
        'listRecords',
        'listZones',
        'readZone',
        'updateRecord',
      ].sort(),
    )

    // And none of them takes a path: every method's first argument is an id or
    // an apex, so there is no way for a caller to name an endpoint.
    const source = readFileSync(
      path.join(REPO, 'apps', 'control-app', 'src', 'cloudflare.ts'),
      'utf8',
    )
    const surface = source.slice(
      source.indexOf('export interface CloudflareClient'),
      source.indexOf('/** Cloudflare\'s envelope'),
    )
    expect(
      surface,
      'the declared client surface mentions a path, which is the generic ' +
        'passthrough this ticket refuses',
    ).not.toMatch(/\bpath\s*:/)
  })

  it('test_UAT_FC_REQ-257_a_deployment_with_no_token_manages_no_dns', async () => {
    // THE FAIL-CLOSED RULE. Not a client that writes optimistically and
    // reconciles later; not a client that silently succeeds at nothing.
    expect(cloudflareFor({}, scripted(() => ({})).fetch)).toBeNull()
    expect(cloudflareFor({ CLOUDFLARE_DNS_TOKEN: '   ' }, scripted(() => ({})).fetch)).toBeNull()

    expect(() => requireCloudflare({}, scripted(() => ({})).fetch)).toThrow(
      CloudflareNotConfiguredError,
    )
    // The refusal names the secret and where it comes from, because an operator
    // meeting it has one question and it is "which value is missing".
    try {
      requireCloudflare({})
      expect.unreachable('a deployment with no token built a client')
    } catch (err) {
      expect((err as Error).message).toMatch(/CLOUDFLARE_DNS_TOKEN/)
      expect((err as Error).message).toMatch(/manages no DNS/)
    }
  })

  it('test_UAT_FC_REQ-257_every_call_is_bearer_authenticated_against_the_public_api', async () => {
    const transport = scripted((seen) => {
      if (seen.url.endsWith('/zones?per_page=50')) {
        return { payload: { success: true, result: [ZONE] } }
      }
      return { payload: { success: true, result: ZONE } }
    })
    const client = clientOver(transport.fetch)

    await client.listZones()
    await client.readZone('cf-zone-alice')

    expect(transport.seen).toHaveLength(2)
    for (const call of transport.seen) {
      expect(call.url.startsWith(CLOUDFLARE_API_BASE)).toBe(true)
      expect(call.authorization).toBe(`Bearer ${TOKEN}`)
    }
    expect(transport.seen[1].url).toBe(`${CLOUDFLARE_API_BASE}/zones/cf-zone-alice`)
  })

  it('test_UAT_FC_REQ-257_a_zone_is_reported_with_its_status_and_assigned_pair', async () => {
    // WHAT THE TICKET ASKS OF A ZONE READ: *"id, status, assigned nameservers"*.
    // The pair is what a customer is shown, and the status is Cloudflare's own —
    // both are read back rather than derived.
    const transport = scripted(() => ({ payload: { success: true, result: ZONE } }))
    const zone = await clientOver(transport.fetch).readZone('cf-zone-alice')

    expect(zone).toEqual({
      id: 'cf-zone-alice',
      apex: 'alicesplumbing.com',
      status: 'active',
      nameServers: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
      accountId: 'cf-account-1st',
    })
  })

  it('test_UAT_FC_REQ-257_a_missing_zone_is_an_answer_and_a_refused_one_is_not', async () => {
    // THE TWO MUST NOT ARRIVE AS THE SAME THING. A zone that is not there and a
    // token that may not see it lead to opposite actions, and a client that
    // reported both as `null` would have the backfill cheerfully report "not in
    // the account" for a permissions problem.
    const absent = scripted(() => ({ status: 404, payload: { success: false, errors: [] } }))
    expect(await clientOver(absent.fetch).readZone('cf-zone-gone')).toBeNull()

    const refused = scripted(() => ({
      status: 403,
      payload: { success: false, errors: [{ message: 'Insufficient permissions' }] },
    }))
    await expect(clientOver(refused.fetch).readZone('cf-zone-alice')).rejects.toThrow(
      CloudflareApiError,
    )
  })

  it('test_UAT_FC_REQ-257_the_account_id_is_read_off_a_zone_and_never_configured', async () => {
    // NO SECOND KEY. The account a zone is created into comes from the zones the
    // token can already see, so there is no value to get wrong and no way for it
    // to name an account the token cannot reach.
    const transport = scripted((seen) =>
      seen.method === 'GET'
        ? { payload: { success: true, result: [ZONE] } }
        : { payload: { success: true, result: { ...ZONE, id: 'cf-zone-new', name: 'bob.test' } } },
    )
    const client = clientOver(transport.fetch)

    const created = await client.createZone('bob.test')
    expect(created.id).toBe('cf-zone-new')

    const post = transport.seen.find((c) => c.method === 'POST')
    expect(post?.body).toEqual({ name: 'bob.test', account: { id: 'cf-account-1st' }, type: 'full' })

    // MEMOISED: a second create does not list the zones again.
    const listsBefore = transport.seen.filter((c) => c.method === 'GET').length
    await client.createZone('carol.test')
    expect(transport.seen.filter((c) => c.method === 'GET')).toHaveLength(listsBefore)
  })

  it('test_UAT_FC_REQ-257_an_account_with_no_zones_is_named_rather_than_confusing', async () => {
    // Unreachable for this deployment, which holds the two platform zones, and
    // named anyway so a fresh account fails with a sentence rather than with
    // Cloudflare complaining about a missing `account` field.
    const empty = scripted(() => ({ payload: { success: true, result: [] } }))
    await expect(clientOver(empty.fetch).createZone('bob.test')).rejects.toThrow(
      CloudflareAccountUnknownError,
    )
  })

  it('test_UAT_FC_REQ-257_records_are_written_whole_and_routes_are_addressed_by_zone', async () => {
    const transport = scripted((seen) => ({
      payload: {
        success: true,
        result: seen.url.includes('/workers/routes')
          ? { id: 'route-1', pattern: 'alicesplumbing.com/*', script: 'public-site' }
          : { id: 'rec-1', type: 'MX', name: 'alicesplumbing.com', content: 'mx.example.net', ttl: 1, priority: 10 },
      },
    }))
    const client = clientOver(transport.fetch)

    await client.createRecord('cf-zone-alice', {
      type: 'MX',
      name: 'alicesplumbing.com',
      content: 'mx.example.net',
      priority: 10,
    })
    await client.updateRecord('cf-zone-alice', 'rec-1', {
      type: 'MX',
      name: 'alicesplumbing.com',
      content: 'mx2.example.net',
      priority: 20,
    })
    await client.deleteRecord('cf-zone-alice', 'rec-1')
    await client.createRoute('cf-zone-alice', 'alicesplumbing.com/*', 'public-site')
    await client.deleteRoute('cf-zone-alice', 'route-1')

    const [create, update, remove, route, unroute] = transport.seen
    expect(create.method).toBe('POST')
    // TTL 1 IS CLOUDFLARE'S "AUTOMATIC" and is the default, so a caller that
    // holds no opinion does not silently pin one this deployment invented.
    expect(create.body).toEqual({
      type: 'MX',
      name: 'alicesplumbing.com',
      content: 'mx.example.net',
      ttl: 1,
      priority: 10,
    })
    // PUT AND NOT PATCH: a record is replaced wholesale, so what is written is
    // exactly what the caller described.
    expect(update.method).toBe('PUT')
    expect(update.url).toBe(`${CLOUDFLARE_API_BASE}/zones/cf-zone-alice/dns_records/rec-1`)
    expect(remove.method).toBe('DELETE')
    expect(route.url).toBe(`${CLOUDFLARE_API_BASE}/zones/cf-zone-alice/workers/routes`)
    expect(route.body).toEqual({ pattern: 'alicesplumbing.com/*', script: 'public-site' })
    expect(unroute.method).toBe('DELETE')
    expect(unroute.url).toBe(`${CLOUDFLARE_API_BASE}/zones/cf-zone-alice/workers/routes/route-1`)
  })

  it('test_UAT_FC_REQ-257_a_partial_zone_listing_is_a_refusal_and_not_a_first_page', async () => {
    // A SILENT FIRST PAGE IS WORSE THAN EITHER ANSWER. The drift check's whole
    // value is the diff, and a diff against a truncated upstream list reports
    // every zone past the cut as unrecorded.
    const many = Array.from({ length: 50 }, (_, i) => ({ ...ZONE, id: `z${i}`, name: `z${i}.test` }))
    const transport = scripted(() => ({ payload: { success: true, result: many } }))
    await expect(clientOver(transport.fetch).listZones()).rejects.toThrow(/does not paginate/)
  })

  it('test_UAT_FC_REQ-257_an_unreachable_api_is_reported_and_never_swallowed', async () => {
    const dead = (async () => {
      throw new TypeError('network is unreachable')
    }) as unknown as typeof fetch
    await expect(clientOver(dead).listZones()).rejects.toThrow(/could not be reached/)
  })

  it('test_UAT_FC_REQ-257_the_token_is_a_secret_and_is_in_no_committed_file', () => {
    // A `[vars]` entry is readable in the dashboard and echoed by
    // `wrangler deploy`, and this one can rewrite the MX records that carry a
    // customer's mail.
    const toml = readFileSync(WRANGLER, 'utf8')
    expect(
      toml.split('\n').filter((line) => /^\s*CLOUDFLARE_DNS_TOKEN\s*=/.test(line)),
      'CLOUDFLARE_DNS_TOKEN is assigned in wrangler.toml',
    ).toEqual([])

    const config = readWranglerConfig(WRANGLER)
    expect(config.topLevel.vars).not.toContain('CLOUDFLARE_DNS_TOKEN')
    expect(config.envs.production.vars).not.toContain('CLOUDFLARE_DNS_TOKEN')

    // The hook that pushes it carries the NAME and never a value — checked with
    // the repository's own definition of what a committed credential looks like.
    const hook = readFileSync(
      path.join(REPO, 'bin', 'deploy.d', 'secrets', '40-cloudflare-dns-token'),
      'utf8',
    )
    expect(credentialShapesIn(hook)).toEqual([])
  })

  it('test_UAT_FC_REQ-257_the_dns_layer_does_not_read_the_embedders_credential', () => {
    // THE TRAP THIS AVOIDS. `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
    // are Workers AI's REST transport ([[BUG-73]]) and are BOTH-OR-NEITHER —
    // `transportFor` throws `PartialAiCredentialError` on half of them. A zone
    // token wearing that name would be the wrong scope, and declaring the
    // account id in `wrangler.toml` so production could see it would take the
    // project knowledge base down to configure DNS.
    for (const file of ['cloudflare.ts', 'zones.ts', 'resolver.ts']) {
      const source = readFileSync(path.join(REPO, 'apps', 'control-app', 'src', file), 'utf8')
      const reads = source
        .split('\n')
        .filter((line) => /env\.CLOUDFLARE_(API_TOKEN|ACCOUNT_ID)/.test(line))
      expect(reads, `${file} reads the embedder's credential`).toEqual([])
    }
    // And the account id never became a var either, which is what would have
    // broken the embedder.
    const config = readWranglerConfig(WRANGLER)
    expect(config.topLevel.vars).not.toContain('CLOUDFLARE_ACCOUNT_ID')
    expect(config.envs.production.vars).not.toContain('CLOUDFLARE_ACCOUNT_ID')
  })

  it('test_UAT_FC_REQ-257_the_hook_pushes_rotates_and_warns_without_printing_the_value', () => {
    // The directory's standing contract ([[REQ-149]], [[REQ-196]]): supplying a
    // value is how a rotation is expressed, an unreadable store is not a yes,
    // and the value is never echoed.
    const value = 'cf-token-do-not-print-me'
    const pushed = harness.run({ value, stored: ['CLOUDFLARE_DNS_TOKEN'] })
    expect(pushed.code).toBe(0)
    expect(pushed.pushed).toBe(value)
    expect(pushed.out).not.toContain(value)

    const kept = harness.run({ stored: ['CLOUDFLARE_DNS_TOKEN'] })
    expect(kept.pushed).toBeNull()
    expect(kept.out).toMatch(/already on 1stcontact-control-app/)

    // WARN AND NOT FAIL, for `20-resend-api-key`'s reason: no customer surface
    // reaches this yet, so aborting every deploy would stop the pipeline over a
    // capability nobody can currently ask for. What it must not do is pass
    // silently.
    const missing = harness.run({ stored: [] })
    expect(missing.code).toBe(0)
    expect(missing.out).toMatch(/CLOUDFLARE_DNS_TOKEN is not set/)
    expect(missing.out).toMatch(/manage no DNS/)
    expect(missing.pushed).toBeNull()

    const unreadable = harness.run({ listFails: true })
    expect(unreadable.code).toBe(0)
    expect(unreadable.out).toMatch(/could not be read to check/)
    expect(unreadable.pushed).toBeNull()

    // A rehearsal changes nothing, or `--dry-run` stops being a rehearsal.
    const rehearsal = harness.run({ value, stored: [], dryRun: true })
    expect(rehearsal.pushed).toBeNull()
    expect(rehearsal.out).toMatch(/would push CLOUDFLARE_DNS_TOKEN/)
  })
})
