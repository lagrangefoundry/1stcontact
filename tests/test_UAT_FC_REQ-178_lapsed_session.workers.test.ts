import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  provisionBusiness,
  provisionInvite,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { BUSINESSES_PATH } from '../apps/control-app/src/router'
import { resolveScope, ScopeRefusedError } from '../apps/control-app/src/scope'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-178 — **what a lapsed account reaches once membership admits it**
 * ([[DOC-42]] §10.1).
 *
 * THE CLAIM. `no_entitlement` stopped being a refusal, and a refusal that
 * becomes a 503 is worse than the refusal it replaced. The sibling file proves
 * the admission decision; this one proves the consequence — that the person who
 * is now let in lands somewhere legible rather than on a configuration error, and
 * that widening the door did not widen anything else.
 *
 * WHAT MAKES THIS EVIDENCE. Every HTTP case drives the WORKER'S OWN `fetch` —
 * the deployed entry point, with a real RS256 Access token verified against a
 * real JWKS, inside workerd against real D1 with the deployed schema. The
 * resolver cases call `resolveScope` directly, because "returns no business"
 * is an answer with no HTTP shape of its own; what that answer DOES have an
 * HTTP shape is asserted through the Worker beside it.
 *
 * THE FOUR THINGS PROVED:
 *
 *   1. THE CHROME LOADS. It is the document that draws the switcher, and the
 *      switcher is the only surface that says why each business is closed. A
 *      session refused the chrome would be told nothing at all.
 *   2. `/api/businesses` ANSWERS, with every business present and marked. This is
 *      the state the payload matters most in.
 *   3. A BUSINESS-SCOPED ROUTE REFUSES 403, NOT 503. The distinction is the whole
 *      repair: 503 is a configuration failure an operator can act on, shown to
 *      the one person whose problem is a payment.
 *   4. NAMING A LAPSED BUSINESS STILL REFUSES. Asking for a specific closed
 *      business is a different act from asking for whichever one is open, and
 *      only the second one was widened.
 */

const PLATFORM = 'req178l-platform'
const TEAM = 'https://req178l-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

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
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
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
  const header = { alg: 'RS256', kid: 'req178l-key', typ: 'JWT' }
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
const anEmail = (): string => `req178l-${(seq += 1)}@example.test`

/** An invitee who has also accepted the terms — otherwise every route is the interstitial. */
async function invite(
  spec: Parameters<typeof provisionInvite>[1],
): Promise<Awaited<ReturnType<typeof provisionInvite>>> {
  const result = await provisionInvite(identityEnv(), spec)
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
 * An account holding two businesses, both lapsed — the shape the whole file is
 * about, built through the shipped entry points rather than seeded.
 */
async function aWhollyLapsedAccount(): Promise<{
  email: string
  first: string
  second: string
}> {
  const email = anEmail()
  const first = await invite({ email, accountName: 'Salon', endsAt: null })
  const second = await provisionBusiness(identityEnv(), {
    accountUserId: first.user.id,
    name: 'Studio',
    email,
  })
  await lapse(first.businessId)
  await lapse(second.businessId)
  return { email, first: first.businessId, second: second.businessId }
}

const ask = async (path: string, token: string): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${path}`, {
      headers: { 'cf-access-jwt-assertion': token },
    }),
    workerEnv(),
  )

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
  jwks = { keys: [{ ...jwk, kid: 'req178l-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-178 — the resolver answers "no business"', () => {
  it('test_UAT_FC_REQ-178_a_wholly_lapsed_account_resolves_to_no_business', async () => {
    // Null rather than a throw. This used to be an unreachable branch guarded by
    // an invariant error; making it reachable without making it an answer would
    // have turned a lapsed customer's every request into a 503.
    const { email } = await aWhollyLapsedAccount()
    const admission = await admit(identityEnv(), email)
    expect(admission.ok).toBe(true)

    expect(await resolveScope(identityEnv(), admission)).toBeNull()
  })

  it('test_UAT_FC_REQ-178_naming_a_lapsed_business_is_still_refused', async () => {
    // Only the UNNAMED case was widened. Asking for a specific closed business is
    // a different act, and it keeps its refusal — with the id the caller named,
    // which is what distinguishes it from having asked for nothing at all.
    const { email, first } = await aWhollyLapsedAccount()
    const admission = await admit(identityEnv(), email)

    await expect(resolveScope(identityEnv(), admission, first)).rejects.toBeInstanceOf(
      ScopeRefusedError,
    )
  })

  it('test_UAT_FC_REQ-178_one_live_business_among_lapsed_ones_still_resolves', async () => {
    // The widening did not cost the ordinary answer: an account with something
    // open resolves to it, and to the first SELECTABLE one rather than the first
    // one listed.
    const email = anEmail()
    const dead = await invite({ email, accountName: 'Lapsed', endsAt: null })
    const live = await provisionBusiness(identityEnv(), {
      accountUserId: dead.user.id,
      name: 'Live',
      email,
    })
    await lapse(dead.businessId)

    const admission = await admit(identityEnv(), email)
    expect(await resolveScope(identityEnv(), admission)).toEqual({ businessId: live.businessId })
  })
})

describe('REQ-178 — what the admitted session reaches', () => {
  it('test_UAT_FC_REQ-178_the_chrome_loads_for_a_wholly_lapsed_account', async () => {
    // The document that draws the switcher. Refusing it would leave the person
    // with no surface at all on which the reason could be stated.
    stubJwks()
    const { email } = await aWhollyLapsedAccount()

    const response = await ask('/', await mint(email))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('test_UAT_FC_REQ-178_the_businesses_endpoint_answers_with_every_one_marked', async () => {
    // The payload in the state it matters most in: both businesses present, both
    // unselectable, each carrying the reason that says which of "pay us" and
    // "talk to us" is the fix ([[REQ-180]] §1).
    stubJwks()
    const { email, first, second } = await aWhollyLapsedAccount()

    const response = await ask(BUSINESSES_PATH, await mint(email))
    expect(response.status).toBe(200)
    const payload = (await response.json()) as {
      account: { email: string } | null
      businesses: Array<{ id: string; selectable: boolean; lapse: { reason: string } | null }>
    }

    expect(payload.account?.email).toBe(email)
    expect(payload.businesses.map((b) => b.id).sort()).toEqual([first, second].sort())
    expect(payload.businesses.every((b) => b.selectable === false)).toBe(true)
    expect(payload.businesses.every((b) => b.lapse?.reason === 'expired')).toBe(true)
  })

  it('test_UAT_FC_REQ-178_a_business_scoped_route_refuses_403_and_not_503', async () => {
    // The repair, stated as the status code. 503 is a configuration failure an
    // operator can act on; putting one in front of a customer whose card expired
    // is both wrong and unactionable. The body is the account-level message and
    // not the site list, so a client cannot mistake the refusal for an empty one.
    stubJwks()
    const { email } = await aWhollyLapsedAccount()

    const response = await ask('/api/sites', await mint(email))
    expect(response.status).toBe(403)
    expect(await response.text()).toContain('switcher')
  })

  it('test_UAT_FC_REQ-178_an_account_with_a_live_business_is_unaffected', async () => {
    // The control. Everything above is reached only by an account with nothing
    // open; an ordinary one still gets its sites, through the same code path that
    // now carries a nullable scope.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Working', endsAt: null })

    const response = await ask('/api/sites', await mint(email))
    expect(response.status).toBe(200)
  })
})
