import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import {
  addressesOf,
  attachCustomHosts,
  canonicalAddress,
  revokeHostname,
} from '../apps/control-app/src/hostname'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-258]] — **a custom host serves one site, at its root, and no other.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `worker.fetch` — `public-site`'s
 * real handler with its real route grammar — inside workerd, against a REAL D1
 * database carrying the deployed migration list and a REAL R2 bucket holding a
 * published revision. The hosts are attached through `attachCustomHosts`, the
 * shipped operation, so the rows these assertions resolve through are the rows a
 * real attachment writes, past the same syntactic rule and the same unique
 * indexes. Nothing about the resolution is simulated: the `status = 'active'`
 * filter and the canonical subquery are executed by SQLite, which is the whole
 * point of proving them here rather than against a map.
 *
 * WHAT WAS TRUE BEFORE. `public-url.ts` said it outright: *"`public-site`
 * resolves a site from that grammar and from `APEX_SITE_KEY`, and from nothing
 * else — there is no host→site resolution."* Attaching a customer's domain
 * produced a correct row, a correct link, and a hostname that resolved nowhere.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR, in the ticket's own words:
 *
 *   - *a `site_domains` row with `kind = 'custom'` whose host resolves nowhere*;
 *   - *`/site/<other-key>/…` serving anything other than a 404 on a custom host*
 *     — the CROSS-TENANT GUARD, and the reason this ticket and not a later one:
 *     routing a customer's domain to this Worker is what creates the exposure;
 *   - *an already-mailed `/site/<key>/…` link on a custom host that stops
 *     working*;
 *   - *a site served at both the root and the prefix with a 200 on each*;
 *   - *two hosts reaching one site with nothing recording which is canonical*;
 *   - *a read of `site_domains` that does not filter to `status = 'active'`*.
 *
 * AND ONE THIS FILE HOLDS FROM THE OTHER SIDE: the product's own front door is
 * unchanged. `1stcontact.io` still serves every site under `/site/<key>/`,
 * because that grammar is load-bearing for the platform apex and for every link
 * already in the post — this ticket makes it redundant on a custom host and
 * deletes it nowhere.
 */

const ALICE = 'req258-alice'
const BOB = 'req258-bob'

const APEX = 'alicesplumbing.test'
const WWW = `www.${APEX}`
const PLATFORM_ORIGIN = 'https://1stcontact.io'

const ALICE_HOME = '<!doctype html><title>Alice</title>ALICE-HOME'
const ALICE_ABOUT = '<!doctype html><title>About Alice</title>ALICE-ABOUT'
const BOB_HOME = '<!doctype html><title>Bob</title>BOB-HOME'

interface Seeded {
  aliceKey: string
  alicePlatformHost: string
  bobKey: string
}

let seeded: Seeded

function identityEnv(): IdentityEnv {
  return { DB: env.DB, SITES: env.SITES } as unknown as IdentityEnv
}

/** The Worker as this deployment runs it: no apex site, no session, no bindings. */
function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    // EMPTY, WHICH IS WHAT EVERY `wrangler.toml` IN THIS REPO DECLARES. A
    // deployment with no apex site is the honest baseline for these cases: it
    // means every 200 below came from the HOST resolving, and not from a
    // fallback that would have served the same bytes anyway.
    APEX_SITE_KEY: '',
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
  } as Env
}

async function call(origin: string, path: string, method = 'GET'): Promise<Response> {
  return worker.fetch(
    new Request(`${origin}${path}`, { method }),
    workerEnv(),
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )
}

beforeAll(async () => {
  await applySchema()

  const alice = await seedFormSite({
    tenantId: ALICE,
    outHtml: ALICE_HOME,
    outFiles: { 'about.html': ALICE_ABOUT },
  })
  const bob = await seedFormSite({ tenantId: BOB, outHtml: BOB_HOME })

  await attachCustomHosts(identityEnv(), alice.siteKey, {
    canonicalHost: APEX,
    aliases: [WWW],
  })

  seeded = {
    aliceKey: alice.siteKey,
    // The platform hostname `seedFormSite` claimed before the domain arrived.
    alicePlatformHost: alice.host as string,
    bobKey: bob.siteKey,
  }
})

describe('REQ-258 — a bound host serves one site', () => {
  it('test_UAT_FC_REQ-258_the_host_resolves_the_site_and_serves_it_at_the_root', async () => {
    // THE WHOLE TICKET IN ONE ASSERTION. No `APEX_SITE_KEY`, no `/site/` prefix,
    // nothing in the URL naming a site — and the site's published bytes come
    // back, because the `Host:` header resolved through `site_domains`.
    const res = await call(`https://${APEX}`, '/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('ALICE-HOME')

    // And a path beneath it, so this is a site at the root and not one page
    // answered by accident.
    const about = await call(`https://${APEX}`, '/about')
    expect(about.status).toBe(200)
    expect(await about.text()).toContain('ALICE-ABOUT')
  })

  it('test_UAT_FC_REQ-258_an_already_mailed_prefixed_link_keeps_working_and_is_not_a_second_address', async () => {
    // `recipientSiteUrl` has been minting `https://<host>/site/<key>/…` into
    // gated-download mail. Those links are permanent and unrecallable, so the
    // prefix cannot simply 404 — and it must not 200 either, or the site has two
    // addresses and a search engine has two copies of it.
    const res = await call(`https://${APEX}`, `/site/${seeded.aliceKey}/about?utm=mail`)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('/about?utm=mail')

    const root = await call(`https://${APEX}`, `/site/${seeded.aliceKey}/`)
    expect(root.status).toBe(301)
    expect(root.headers.get('location')).toBe('/')
  })

  it('test_UAT_FC_REQ-258_another_sites_key_is_a_404_on_a_customers_host', async () => {
    // THE CROSS-TENANT GUARD, and it is the rule that matters. Without it
    // `alicesplumbing.test` serves Bob's site to anyone holding his key, from
    // Alice's domain, under Alice's certificate. A 404 and not a 403: a refusal
    // that said which would answer questions about sites the asker has no
    // business knowing exist.
    const res = await call(`https://${APEX}`, `/site/${seeded.bobKey}/`)
    expect(res.status).toBe(404)
    expect(await res.text()).not.toContain('BOB-HOME')

    // Not a redirect either — a 301 would confirm the site exists.
    const deep = await call(`https://${APEX}`, `/site/${seeded.bobKey}/index.html`)
    expect(deep.status).toBe(404)
  })

  it('test_UAT_FC_REQ-258_the_products_own_front_door_is_unchanged', async () => {
    // A HOST WITH NO ROW IS NOT BOUND, and there the prefix grammar is the whole
    // job. This ticket makes it redundant on a custom host and deletes it
    // nowhere: it is load-bearing for the platform apex and for every link
    // already in the post.
    const bob = await call(PLATFORM_ORIGIN, `/site/${seeded.bobKey}/`)
    expect(bob.status).toBe(200)
    expect(await bob.text()).toContain('BOB-HOME')

    const alice = await call(PLATFORM_ORIGIN, `/site/${seeded.aliceKey}/`)
    expect(alice.status).toBe(200)
    expect(await alice.text()).toContain('ALICE-HOME')
  })

  it('test_UAT_FC_REQ-258_www_is_not_the_address_and_301s_to_the_one_that_is', async () => {
    // Both records are written, because a visitor who types `www.` must not meet
    // a certificate error — so two hosts reach one site and `canonical` is what
    // says which of them is the address.
    const res = await call(`https://${WWW}`, '/about?ref=card')
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(`https://${APEX}/about?ref=card`)
  })

  it('test_UAT_FC_REQ-258_the_prefix_and_the_wrong_host_cost_one_hop_and_not_two', async () => {
    // A visitor following an old link from a stale address meets BOTH rules at
    // once. Redirecting twice would put an extra round trip in front of exactly
    // the person this compatibility exists for.
    const res = await call(`https://${WWW}`, `/site/${seeded.aliceKey}/about`)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(`https://${APEX}/about`)
  })

  it('test_UAT_FC_REQ-258_attaching_a_domain_makes_it_the_address_and_demotes_the_platform_hostname', async () => {
    // `addressForLinks` has always preferred a custom address over the platform
    // one, on the reasoning that a business which pointed its own domain at us
    // has said where it wants to be seen. Attaching writes that preference down
    // as `canonical`, so it becomes a SERVING behaviour rather than only a link
    // one — and the platform hostname keeps working, as a redirect.
    const live = await addressesOf(identityEnv(), seeded.aliceKey)
    expect(canonicalAddress(live)?.host).toBe(APEX)
    expect(live.map((a) => a.host).sort()).toEqual(
      [APEX, WWW, seeded.alicePlatformHost].sort(),
    )

    const res = await call(`https://${seeded.alicePlatformHost}`, '/about')
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(`https://${APEX}/about`)
  })

  it('test_UAT_FC_REQ-258_a_revoked_host_stops_resolving', async () => {
    // *"Every read is filtered to `active`; the column without the filter would
    // be decoration."* Revocation is the only way a hostname that has to go can
    // go at all, because an owner cannot change their own — so a resolver that
    // ignored `status` would serve a revoked host forever while the record said
    // it had been taken back.
    const site = await seedFormSite({ tenantId: 'req258-revoked', outHtml: 'REVOKED-HOME' })
    const host = 'revoked.example.test'
    await attachCustomHosts(identityEnv(), site.siteKey, { canonicalHost: host })

    const before = await call(`https://${host}`, '/?probe=before')
    expect(before.status).toBe(200)
    expect(await before.text()).toContain('REVOKED-HOME')

    expect(await revokeHostname(identityEnv(), host)).not.toBeNull()

    // A DIFFERENT URL, AND THAT IS NOT A DODGE. Every 200 is stored in the edge
    // cache under its full URL for `PUBLISHED_CACHE`'s 60 seconds, so a revoked
    // host keeps serving whatever is already warm there until the entry expires
    // — an inherited property of publishing without revision-scoped URLs, and
    // one a revocation should eventually purge. What THIS case is about is the
    // resolution, so it asks a question the cache has never been asked.
    const after = await call(`https://${host}`, '/?probe=after')
    // The host resolves to nothing, so the request falls back to this
    // deployment's apex — which is unset, and answers exactly as an unpublished
    // site does.
    expect(after.status).toBe(404)
  })

  it('test_UAT_FC_REQ-258_a_lead_posted_at_the_root_of_a_bound_host_names_that_host_site', async () => {
    // THE WRITE PATH RESOLVES THROUGH THE SAME RULE. A form on a page served at
    // the root of a customer's domain posts to `/api/lead` on that origin, which
    // carries no site key at all — so without host resolution the endpoint has
    // no target and answers `405`, and every enquiry from every custom domain is
    // silently lost.
    //
    // NO `LEAD_INTAKE` BINDING IS WIRED, deliberately: what is under test is
    // whether the endpoint RESOLVED, and `lead.ts` answers a refusal rather than
    // `405` once it has a target. The `405` is the *unresolved* answer and is
    // what this case is distinguishing against.
    const resolved = await call(`https://${APEX}`, '/api/lead', 'POST')
    expect(resolved.status).not.toBe(405)

    // And the guard holds on the write path too: a form posting to another
    // site's key from Alice's domain resolves to nothing and meets the ordinary
    // refusal, rather than filing an enquiry into Bob's contact list.
    const crossed = await call(`https://${APEX}`, `/site/${seeded.bobKey}/api/lead`, 'POST')
    expect(crossed.status).toBe(405)
  })

  it('test_UAT_FC_REQ-258_a_mailed_download_link_is_relocated_before_the_gate_sees_it', async () => {
    // The gated page is matched ahead of everything else, because what it
    // answers is minted for one person and must never reach the shared cache.
    // The address rules are asked FIRST all the same — this is the path most
    // likely to be carrying the old shape, and an arrival should be recorded
    // against the request that actually displayed the page.
    const res = await call(`https://${APEX}`, `/site/${seeded.aliceKey}/api/download/tok123`)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('/api/download/tok123')

    // And another site's key on this host is refused rather than relocated.
    const crossed = await call(`https://${APEX}`, `/site/${seeded.bobKey}/api/download/tok123`)
    expect(crossed.status).toBe(404)
  })
})
