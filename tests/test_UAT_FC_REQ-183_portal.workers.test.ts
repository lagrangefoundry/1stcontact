import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { BUSINESSES_PATH } from '../apps/control-app/src/router'
import { storeFor } from '../apps/control-app/src/store'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PORTAL_PATH, PORTAL_SLUG, portalHomePage, portalSiteJson } from '../apps/control-app/src/portal'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-183]] — **the portal is served, to the caller it belongs to, and it
 * changes nothing**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the WORKER'S OWN `fetch` — the
 * deployed entry point, with a real RS256 Access token verified against a real
 * JWKS, inside workerd against real D1 and real R2 with the deployed schema. The
 * node-side sibling proves the page is site content and that its words are true;
 * this one proves the three things only a real request can show: that the page
 * arrives, that it arrives from the right business, and that nothing moves when
 * it does.
 *
 * THE FOUR CLAIMS:
 *
 *   1. IT IS REACHED, and by the site pipeline: the response is the rendered
 *      page, and its sub-resources resolve under the same path.
 *   2. IT IS THE HOST BUSINESS'S. The portal a caller sees belongs to the
 *      business they are an ACCOUNT OF, not the one they are operating — and an
 *      authored portal in the first replaces the shipped default while one in the
 *      second is not consulted at all.
 *   3. A WHOLLY LAPSED ACCOUNT REACHES IT. This is the whole reason the ticket's
 *      B1 blocked on [[REQ-178]]: the population most likely to want the delete
 *      button is exactly the one a scoped route would have refused.
 *   4. NOTHING IS DESTROYED. The account, its memberships and its grants are
 *      unchanged after the portal has been fetched and its endpoint answered — so
 *      the button cannot be read by a later hand as evidence that the machinery
 *      behind it exists ([[REQ-183]] §4.1).
 */

const PLATFORM = 'req183-platform'
const TEAM = 'https://req183-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 404 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A REAL Access token, minted against the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req183-key', typ: 'JWT' }
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
        return new Response(JSON.stringify(jwks), {
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

let seq = 0
const anEmail = (): string => `req183-${(seq += 1)}@example.test`

/** An invitee who has also accepted the terms — otherwise every route is the interstitial. */
async function invite(
  spec: Parameters<typeof inviteAccount>[1],
): Promise<Awaited<ReturnType<typeof inviteAccount>>> {
  const result = await inviteAccount(identityEnv(), spec)
  await acceptTerms(identityEnv(), result.user.id)
  return result
}

/** Push a business's grant into the past — the "card expired" shape. */
async function lapse(businessId: string): Promise<void> {
  await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
    .bind(new Date(Date.now() - 1_000).toISOString(), businessId)
    .run()
}

/**
 * Author a portal into a business, through the store a route would use.
 *
 * `heading` replaces the shipped default's, so a rendered page says which of the
 * two sources it came from — the only way to tell them apart is by their words.
 */
async function authorPortalIn(businessId: string, heading: string): Promise<void> {
  const store = await storeFor(workerEnv(), { businessId })
  await store.createDraft(PORTAL_SLUG)
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

const ask = async (path: string, token: string): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${path}`, {
      headers: { 'cf-access-jwt-assertion': token },
    }),
    workerEnv(),
  )

/** The rows that must survive the visit ([[REQ-183]] §4.1). */
async function accountFootprint(email: string): Promise<Record<string, unknown>> {
  const user = await env.DB.prepare('SELECT id, email, status FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; status: string }>()
  if (!user) return { user: null, memberships: 0, entitlements: 0 }
  const memberships = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM memberships WHERE user_id = ?',
  )
    .bind(user.id)
    .first<{ n: number }>()
  const entitlements = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM entitlements WHERE business_id IN ' +
      '(SELECT business_id FROM memberships WHERE user_id = ?)',
  )
    .bind(user.id)
    .first<{ n: number }>()
  return { user, memberships: memberships?.n ?? 0, entitlements: entitlements?.n ?? 0 }
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
  jwks = { keys: [{ ...jwk, kid: 'req183-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-183 — the portal is reached through the site pipeline', () => {
  it('test_UAT_FC_REQ-183_an_admitted_account_reaches_its_portal', async () => {
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Salon', endsAt: null })

    const response = await ask(PORTAL_PATH, await mint(email))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')

    const html = await response.text()
    // The behaviour mounted, the control is there, and the explanation with it —
    // which is the whole surface this ticket lands.
    expect(html).toContain('data-account-portal')
    expect(html).toContain('Delete account')
    expect(html).toMatch(/one-way fingerprint/i)
    // And it reads its own facts from the endpoint that required an identity,
    // rather than from anything baked into the page.
    expect(html).toContain(`data-account-src="${BUSINESSES_PATH}"`)
  })

  it('test_UAT_FC_REQ-183_the_portals_own_sub_resources_resolve_under_it', async () => {
    // The page is rendered by the site pipeline, so it comes with the pipeline's
    // own artifacts — the theme and the vetted client behaviour. They are served
    // under the portal's path because the render emits them document-relative,
    // which is the property that lets the same site move to another origin.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Salon', endsAt: null })
    const token = await mint(email)

    const css = await ask(`${PORTAL_PATH}/theme.css`, token)
    expect(css.status).toBe(200)
    expect(await css.text()).toContain('account-portal__identity')

    const js = await ask(`${PORTAL_PATH}/capabilities.js`, await mint(email))
    expect(js.status).toBe(200)
    expect(await js.text()).toContain('data-account-portal')
  })

  it('test_UAT_FC_REQ-183_the_portal_is_the_host_businesss_and_not_the_operated_ones', async () => {
    // D2, proved where it could actually go wrong. The caller OPERATES a business
    // of their own and is an ACCOUNT OF the platform's; those are different rows
    // and a portal resolved from the operated one would serve the wrong page to
    // every customer. Both businesses are given an authored portal, so the answer
    // names which store was opened rather than merely being non-empty.
    stubJwks()
    const email = anEmail()
    const first = await invite({ email, accountName: 'Salon', endsAt: null })
    await authorPortalIn(PLATFORM, 'The portal of the business you are a customer of')
    await authorPortalIn(first.businessId, 'The portal of the business you operate')

    const html = await ask(PORTAL_PATH, await mint(email)).then((r) => r.text())
    expect(html).toContain('The portal of the business you are a customer of')
    expect(html).not.toContain('The portal of the business you operate')
  })

  it('test_UAT_FC_REQ-183_an_authored_portal_replaces_the_shipped_default', async () => {
    // The fallback is a starting point, not a ceiling: once a business holds a
    // `portal` site it is ordinary editable site content and it is what serves.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Salon', endsAt: null })
    await authorPortalIn(PLATFORM, 'Authored by hand')

    const html = await ask(PORTAL_PATH, await mint(email)).then((r) => r.text())
    expect(html).toContain('Authored by hand')
    // Asserted on the heading ELEMENT rather than on the words anywhere in the
    // document. The default's heading and the document title read the same, and
    // this authored copy changed only the first, so a document-wide match would
    // be asserting about a field the case never touched.
    expect(html).not.toMatch(/>Your account<\/p>/)
  })
})

describe('REQ-183 — who reaches it, and who does not', () => {
  it('test_UAT_FC_REQ-183_a_wholly_lapsed_account_still_reaches_its_portal', async () => {
    // B1, and the reason this ticket waited for [[REQ-178]]. Membership admits and
    // entitlement does not ([[DOC-42]] §5), so an account whose every grant has
    // lapsed arrives logged in with nothing to open — and the one surface it must
    // still reach is this one, because a compliance surface gated on being paid
    // up is worse than a missing one.
    stubJwks()
    const email = anEmail()
    const first = await invite({ email, accountName: 'Salon', endsAt: null })
    const second = await provisionBusiness(identityEnv(), {
      accountUserId: first.user.id,
      name: 'Studio',
      email,
    })
    await lapse(first.businessId)
    await lapse(second.businessId)

    const response = await ask(PORTAL_PATH, await mint(email))
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Delete account')
  })

  it('test_UAT_FC_REQ-183_someone_elses_business_looks_exactly_like_no_business', async () => {
    // §6's scope line. The portal answers only about the caller, so naming a
    // business they have nothing to do with must be indistinguishable from naming
    // one that was never created — anything else is an existence oracle over every
    // business in the system, to anyone who can pass a one-time PIN.
    stubJwks()
    const mine = anEmail()
    await invite({ email: mine, accountName: 'Salon', endsAt: null })
    const theirs = await invite({ email: anEmail(), accountName: 'Someone else', endsAt: null })

    const token = await mint(mine)
    const foreign = await ask(`/b/${theirs.businessId}${PORTAL_PATH}`, token)
    const fictional = await ask(`/b/acct_nosuchbusiness${PORTAL_PATH}`, await mint(mine))

    expect(foreign.status).toBe(fictional.status)
    expect(await foreign.text()).toBe(await fictional.text())
  })

  it('test_UAT_FC_REQ-183_the_portal_takes_no_verb_that_could_change_anything', async () => {
    // The portal reads and grants nothing (§6), and deletes nothing (§4.1). The
    // route is GET/HEAD only, so there is no method on it for a later hand to
    // hang a destructive action off without changing this.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Salon', endsAt: null })

    for (const method of ['POST', 'DELETE', 'PUT']) {
      const response = await worker.fetch(
        new Request(`https://app.example${PORTAL_PATH}`, {
          method,
          headers: { 'cf-access-jwt-assertion': await mint(email) },
        }),
        workerEnv(),
      )
      expect(response.status).toBe(405)
    }
  })
})

describe('REQ-183 — no deletion mechanism is built', () => {
  it('test_UAT_FC_REQ-183_the_account_still_exists_after_the_portal_has_been_used', async () => {
    // The acceptance's explicit guard. The surface lands and the machinery does
    // not ([[DOC-37]] is that work), so a later hand must not be able to read the
    // button as evidence the sweep is there. Everything the portal's own client
    // does — fetch the page, fetch the endpoint — is driven here, and the account,
    // its memberships and its grants are compared before and after.
    stubJwks()
    const email = anEmail()
    const first = await invite({ email, accountName: 'Salon', endsAt: null })
    await provisionBusiness(identityEnv(), {
      accountUserId: first.user.id,
      name: 'Studio',
      email,
    })
    const before = await accountFootprint(email)
    expect(before.memberships).toBe(2)

    expect((await ask(PORTAL_PATH, await mint(email))).status).toBe(200)
    const endpoint = await ask(BUSINESSES_PATH, await mint(email))
    expect(endpoint.status).toBe(200)

    expect(await accountFootprint(email)).toEqual(before)
  })
})
