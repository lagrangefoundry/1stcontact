import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { admit, provisionBusiness, type IdentityEnv } from '../apps/control-app/src/identity'
import { invitePerson } from '../apps/control-app/src/people'
import { inviteAccount } from './support/invite-account'
import { BUSINESSES_PATH, route } from '../apps/control-app/src/router'
import { storeFor } from '../apps/control-app/src/store'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PORTAL_PATH, PORTAL_SLUG, portalHomePage, portalSiteJson } from '../apps/control-app/src/portal'
import { applySchema } from './support/d1-site-factory'

/**
 * story-83ff6262 — **Customer portal** (workers side).
 *
 * Every case drives the control-app Worker's own `fetch` — the deployed entry
 * point — with a real RS256 Access token verified against a JWKS, inside workerd,
 * against real D1 and R2 with the deployed schema. The only stub is the Access
 * certificate endpoint, which is Cloudflare's, not ours.
 *
 * These are the claims only an admitted request against the real identity rows
 * can show: which business's portal arrives, that a foreign business is
 * indistinguishable from a missing one, and that nothing moves when the portal
 * is used.
 */

const PLATFORM = 'story83ff-platform'
const TEAM = 'https://story83ff-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 404 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'story83ff-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, email }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

function stubJwks(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url === certsUrl(TEAM)) {
        return new Response(JSON.stringify(jwks), { headers: { 'content-type': 'application/json' } })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

let seq = 0
const anEmail = (): string => `story83ff-${(seq += 1)}@example.test`

async function invite(
  spec: Parameters<typeof inviteAccount>[1],
): Promise<Awaited<ReturnType<typeof inviteAccount>>> {
  const result = await inviteAccount(identityEnv(), spec)
  await acceptTerms(identityEnv(), result.user.id)
  return result
}

async function lapse(businessId: string): Promise<void> {
  await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
    .bind(new Date(Date.now() - 1_000).toISOString(), businessId)
    .run()
}

/** Author a `portal` site into a business, with a heading that names its source. */
async function authorPortalIn(businessId: string, heading: string): Promise<void> {
  const store = await storeFor(workerEnv(), { businessId })
  if (!(await store.hasDraft(PORTAL_SLUG))) await store.createDraft(PORTAL_SLUG)
  const page = portalHomePage(BUSINESSES_PATH) as {
    modules: Array<{ slots: { body: { children: Array<{ text?: string }> } } }>
  }
  page.modules[0].slots.body.children[0].text = heading
  await store.write(PORTAL_SLUG, {
    siteJson: portalSiteJson(),
    pages: [{ name: 'home.json', page: page as unknown as Record<string, unknown> }],
    assets: [],
  })
}

async function ask(path: string, email: string, method = 'GET'): Promise<Response> {
  return worker.fetch(
    new Request(`https://app.example${path}`, {
      method,
      headers: { 'cf-access-jwt-assertion': await mint(email) },
    }),
    workerEnv(),
  )
}

function titleOf(html: string): string | null {
  return html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null
}

/**
 * The caller's account footprint: user, memberships, entitlements, businesses.
 *
 * The user row's sign-in bookkeeping (`first_seen_at`, `last_seen_at` and the
 * `updated_at` they bump) is dropped: admission stamps it on EVERY authenticated
 * request, whatever the route, so it records that the caller visited — not that
 * anything about the account changed.
 */
async function footprint(email: string): Promise<Record<string, unknown>> {
  const row = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
  if (!row) return { user: null }
  const {
    first_seen_at: _first,
    last_seen_at: _last,
    updated_at: _updated,
    ...user
  } = row as Record<string, unknown>
  const id = (user as { id: string }).id
  const memberships = await env.DB.prepare('SELECT * FROM memberships WHERE user_id = ? ORDER BY business_id')
    .bind(id)
    .all()
  const entitlements = await env.DB.prepare(
    'SELECT * FROM entitlements WHERE business_id IN (SELECT business_id FROM memberships WHERE user_id = ?) ' +
      'ORDER BY business_id',
  )
    .bind(id)
    .all()
  const businesses = await env.DB.prepare(
    'SELECT * FROM tenants WHERE id IN (SELECT business_id FROM memberships WHERE user_id = ?) ORDER BY id',
  )
    .bind(id)
    .all()
  return { user, memberships: memberships.results, entitlements: entitlements.results, businesses: businesses.results }
}

/** Row counts of every user table — an erasure-request row anywhere would show here. */
async function tableCounts(): Promise<Record<string, number>> {
  const tables = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name",
  ).all<{ name: string }>()
  const counts: Record<string, number> = {}
  for (const { name } of tables.results) {
    const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).first<{ n: number }>()
    counts[name] = row?.n ?? 0
  }
  return counts
}

beforeAll(async () => {
  await applySchema()
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'story83ff-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-83ff6262 — which portal an admitted account reaches', () => {
  it('test_UAT_AC2212_admitted_account_gets_the_host_business_portal_whatever_it_operates', async () => {
    stubJwks()
    const email = anEmail()
    const first = await invite({ email, accountName: 'Salon', endsAt: null })
    const second = await provisionBusiness(identityEnv(), {
      accountUserId: first.user.id,
      name: 'Studio',
      email,
    })

    // Unauthored host: the page is the shipped default, titled "Your account".
    const plain = await ask(PORTAL_PATH, email)
    expect(plain.status).toBe(200)
    expect(plain.headers.get('content-type')).toContain('text/html')
    expect(titleOf(await plain.text())).toBe('Your account')

    // Distinguishable portals in the host business (the one the caller is an
    // account of) and in both businesses the caller operates.
    await authorPortalIn(PLATFORM, 'Host business portal')
    await authorPortalIn(first.businessId, 'Operated business portal one')
    await authorPortalIn(second.businessId, 'Operated business portal two')

    // With an operated business as the current scope, the host's portal serves.
    for (const operated of [first.businessId, second.businessId]) {
      const scoped = await ask(`/b/${operated}${PORTAL_PATH}`, email)
      expect(scoped.status).toBe(200)
      const html = await scoped.text()
      expect(titleOf(html)).toBe('Your account')
      expect(html).toContain('Host business portal')
      expect(html).not.toContain('Operated business portal')
    }
    const unscoped = await ask(PORTAL_PATH, email).then((r) => r.text())
    expect(unscoped).toContain('Host business portal')
    expect(unscoped).not.toContain('Operated business portal')

    // Every grant lapsed, nothing selectable: still a 200 portal page.
    await lapse(first.businessId)
    await lapse(second.businessId)
    const lapsed = await ask(PORTAL_PATH, email)
    expect(lapsed.status).toBe(200)
    const lapsedHtml = await lapsed.text()
    expect(titleOf(lapsedHtml)).toBe('Your account')
    expect(lapsedHtml).toContain('Host business portal')
    expect(lapsedHtml).toContain('Delete account')
  })

  /**
   * ONE LEVEL DOWN, where the caller's own row is NOT in `TENANT_ID`. Bob is an
   * account of Salon — his `users` row lives in Salon's tenant — and runs a shop
   * of his own. Admitted against Salon (the deployment one level down), and
   * routed by a Worker whose `TENANT_ID` is still the platform, the portal he
   * gets is Salon's: the business he is an account OF, never the configured
   * tenant and never the one he operates.
   */
  it('test_UAT_AC2234_the_portal_is_the_business_the_caller_is_an_account_of_never_tenant_id', async () => {
    const owner = await invite({ email: anEmail(), accountName: 'Salon', endsAt: null })
    const bobEmail = anEmail()
    const bob = await invitePerson(identityEnv(), { businessId: owner.businessId }, { email: bobEmail, displayName: 'Bob' })
    const shop = await provisionBusiness(identityEnv(), { accountUserId: bob.person.id, name: "Bob's Shop", email: bobEmail })

    await authorPortalIn(PLATFORM, 'Host business portal')
    await authorPortalIn(owner.businessId, 'Salon portal for its own accounts')
    await authorPortalIn(shop.businessId, "Bob's shop portal")

    const admission = await admit({ ...identityEnv(), TENANT_ID: owner.businessId }, bobEmail)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    // The premise: the caller's tenant is not the Worker's configured one.
    expect(admission.user.tenant_id).toBe(owner.businessId)
    expect(workerEnv().TENANT_ID).toBe(PLATFORM)

    for (const scope of [{ businessId: shop.businessId }, null]) {
      const res = await route(new Request(`https://app.example${PORTAL_PATH}`), workerEnv(), scope, { admission })
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toContain('Salon portal for its own accounts')
      expect(html).not.toContain('Host business portal')
      expect(html).not.toContain("Bob's shop portal")
    }
  })

  it('test_UAT_AC2217_another_accounts_business_is_indistinguishable_from_a_missing_one', async () => {
    stubJwks()
    const mine = anEmail()
    await invite({ email: mine, accountName: 'Salon', endsAt: null })
    const theirs = await invite({
      email: anEmail(),
      accountName: 'Someone Elses Bakery',
      endsAt: null,
    })
    await authorPortalIn(theirs.businessId, 'The bakery portal nobody else should see')

    const foreign = await ask(`/b/${theirs.businessId}${PORTAL_PATH}`, mine)
    const fictional = await ask(`/b/acct_doesnotexist0000${PORTAL_PATH}`, mine)

    expect(foreign.status).toBe(fictional.status)
    expect(foreign.status).not.toBe(200)
    expect(foreign.headers.get('content-type')).toBe(fictional.headers.get('content-type'))
    expect(foreign.headers.get('cache-control')).toBe(fictional.headers.get('cache-control'))

    const foreignBody = new Uint8Array(await foreign.arrayBuffer())
    const fictionalBody = new Uint8Array(await fictional.arrayBuffer())
    expect(Array.from(foreignBody)).toEqual(Array.from(fictionalBody))

    const words = new TextDecoder().decode(foreignBody)
    expect(words).not.toContain('Someone Elses Bakery')
    expect(words).not.toContain('The bakery portal nobody else should see')
    expect(words).not.toContain(theirs.businessId)
  })
})

describe('story-83ff6262 — using the portal destroys nothing', () => {
  it('test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists', async () => {
    stubJwks()
    const email = anEmail()
    const first = await invite({ email, accountName: 'Salon', endsAt: null })
    await provisionBusiness(identityEnv(), { accountUserId: first.user.id, name: 'Studio', email })

    const before = await footprint(email)
    const countsBefore = await tableCounts()
    expect((before.memberships as unknown[]).length).toBe(2)

    // The page as served: the two controls are plain buttons, nothing submits.
    const page = await ask(PORTAL_PATH, email)
    expect(page.status).toBe(200)
    const html = await page.text()
    expect(html).not.toMatch(/<form\b/i)
    const buttons = html.match(/<button\b[^>]*>/g) ?? []
    expect(buttons).toHaveLength(2)
    for (const b of buttons) {
      expect(b).toContain('type="button"')
      expect(b).not.toMatch(/formaction|formmethod/i)
    }

    // What a browser loads for the page — its sub-resources and the account
    // endpoint the module names. (Pressing the controls in a DOM against a real
    // origin, and recording the client's own requests, is the jsdom sibling's
    // AC2219 case; this one holds the D1 side.)
    const src = html.match(/data-account-src="([^"]+)"/)?.[1]
    expect(src).toBe(BUSINESSES_PATH)
    for (const p of [`${PORTAL_PATH}/theme.css`, `${PORTAL_PATH}/capabilities.js`, src!]) {
      expect((await ask(p, email)).status, p).toBe(200)
    }

    // Afterwards: user, memberships, entitlements and businesses unchanged, no
    // new row anywhere (so no erasure request was recorded), and the caller can
    // still load the portal, their account endpoint and the builder.
    expect(await footprint(email)).toEqual(before)
    expect(await tableCounts()).toEqual(countsBefore)
    expect((await ask(PORTAL_PATH, email)).status).toBe(200)
    expect((await ask(BUSINESSES_PATH, email)).status).toBe(200)
    expect((await ask('/', email)).status).toBe(200)
  })
})
