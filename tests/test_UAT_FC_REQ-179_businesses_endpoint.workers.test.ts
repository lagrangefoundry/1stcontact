import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  provisionBusiness,
  provisionInvite,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { BUSINESSES_PATH } from '../apps/control-app/src/router'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-179 — **the endpoint the shell's switcher lists from**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the WORKER'S OWN `fetch` — the
 * deployed entry point, not `route()` — inside workerd, against a real D1
 * database with the deployed schema, with a real RS256 Access token verified
 * against a real JWKS. The businesses are provisioned through the shipped
 * `provisionInvite` / `provisionBusiness`, so what the endpoint reports is what
 * an invite and a second business actually wrote.
 *
 * DRIVING THE WORKER RATHER THAN THE ROUTER IS THE POINT OF THIS FILE. The
 * answer comes from the `Admission` that `index.ts` computed ahead of routing,
 * handed down as an injected dependency — so a suite that called `route()` with
 * an admission it constructed itself would prove the payload builder and say
 * nothing about the wiring, which is the half that can silently not exist.
 *
 * THE CLAIMS:
 *
 *   1. THE ENDPOINT EXISTS AND REPORTS THE SET. Its absence is the failure the
 *      ticket's ordering note is about — [[REQ-180]] and this ticket both need
 *      it, whichever lands first — so its existence is asserted here rather than
 *      assumed by the chrome that consumes it.
 *   2. A LAPSED BUSINESS IS SHOWN, MARKED UNSELECTABLE. Filtering it out would
 *      make "your grant expired" indistinguishable from "that business is gone"
 *      to the one person who owns both.
 *   3. IT IS NOT AN ORACLE. Another account's businesses are absent — the answer
 *      is about the caller and about nobody else.
 *   4. THE NO-ADMISSION PATH REPORTS THE RESOLVED SCOPE. On the loopback dev
 *      server there is no identity to ask, and the chrome still needs something
 *      to scope itself to.
 */

const PLATFORM = 'req179-platform'
const TEAM = 'https://req179-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)

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
  const header = { alg: 'RS256', kid: 'req179-key', typ: 'JWT' }
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

interface Payload {
  account: { name: string | null; email: string } | null
  businesses: Array<{
    id: string
    name: string
    selectable: boolean
    lapse: { reason: string; endedAt: string | null } | null
  }>
}

const ask = async (token: string | null, over: Partial<Env> = {}): Promise<Response> =>
  worker.fetch(
    new Request(
      `https://app.example${BUSINESSES_PATH}`,
      token ? { headers: { 'cf-access-jwt-assertion': token } } : undefined,
    ),
    workerEnv(over),
  )

let seq = 0
const anEmail = (): string => `req179-${(seq += 1)}@example.test`

/**
 * An invitee who has also ACCEPTED THE TERMS ([[REQ-169]]).
 *
 * Admission stopped being the last check: a person whose `tos_version` does not
 * match the constant is served the interstitial and refused every API route
 * until they accept, so an invitee who has not would answer this endpoint with a
 * plain-text refusal and every case here would fail parsing JSON. Acceptance is
 * proved in REQ-169's own UATs; here it is setup, and it belongs in one helper so
 * that the next case added to this file inherits it.
 */
async function invite(
  spec: Parameters<typeof provisionInvite>[1],
): Promise<Awaited<ReturnType<typeof provisionInvite>>> {
  const result = await provisionInvite(identityEnv(), spec)
  await acceptTerms(identityEnv(), result.user.id)
  return result
}

/** Push a business's grant into the past — the "card expired" shape. */
async function lapse(businessId: string): Promise<void> {
  await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE account_id = ?')
    .bind(new Date(Date.now() - 1_000).toISOString(), businessId)
    .run()
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
  jwks = { keys: [{ ...jwk, kid: 'req179-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-179 — the businesses endpoint', () => {
  it('test_UAT_FC_REQ-179_the_endpoint_reports_the_accounts_businesses_and_the_account', async () => {
    stubJwks()
    const email = anEmail()
    const first = await invite({
      email,
      accountName: 'Salon',
      displayName: 'Sam Salon',
      endsAt: null,
    })
    const second = await provisionBusiness(identityEnv(), {
      accountUserId: first.user.id,
      name: 'Studio',
      email,
    })

    const response = await ask(await mint(email))
    expect(response.status).toBe(200)
    const body = (await response.json()) as Payload

    // The switcher's list: every business, labelled by `tenants.name`, because
    // the id is deliberately opaque and there is nothing else to label a row
    // with.
    expect(body.businesses.map((b) => b.id).sort()).toEqual(
      [first.businessId, second.businessId].sort(),
    )
    expect(body.businesses.map((b) => b.name).sort()).toEqual(['Salon', 'Studio'])
    expect(body.businesses.every((b) => b.selectable)).toBe(true)

    // …and the account, in the same call, because it is what the avatar surface
    // shows and it is the one thing here that is NOT business-scoped.
    expect(body.account?.email).toBe(email)
    expect(body.account?.name).toBe('Sam Salon')
  })

  it('test_UAT_FC_REQ-179_a_lapsed_business_is_listed_and_marked_unselectable', async () => {
    stubJwks()
    const email = anEmail()
    const live = await invite({ email, accountName: 'Live', endsAt: null })
    const gone = await provisionBusiness(identityEnv(), {
      accountUserId: live.user.id,
      name: 'Gone',
      email,
    })
    await lapse(gone.businessId)

    const body = (await (await ask(await mint(email))).json()) as Payload

    // SHOWN, not filtered: "your grant expired" and "that business does not
    // exist" are different facts to the person who owns both, and a list that
    // omitted the lapsed one would make them indistinguishable.
    const byId = new Map(body.businesses.map((b) => [b.id, b]))
    expect(byId.get(gone.businessId)?.name).toBe('Gone')
    expect(byId.get(gone.businessId)?.selectable).toBe(false)
    // And the live one is unaffected — a lapsed grant is a property of the
    // business, never of the person ([[REQ-178]]).
    expect(byId.get(live.businessId)?.selectable).toBe(true)
  })

  it('test_UAT_FC_REQ-179_it_reports_nothing_about_anybody_else', async () => {
    stubJwks()
    const mine = anEmail()
    const theirs = anEmail()
    const own = await invite({ email: mine, accountName: 'Mine', endsAt: null })
    const other = await invite({
      email: theirs,
      accountName: 'Theirs',
      endsAt: null,
    })

    const body = (await (await ask(await mint(mine))).json()) as Payload

    // The endpoint answers ABOUT THE CALLER. It reports only what this caller
    // already passed `admit` for, so it discloses nothing a refused visitor
    // could not already infer — which is what keeps it from being an existence
    // oracle over every business in the system.
    expect(body.businesses.map((b) => b.id)).toEqual([own.businessId])
    expect(body.businesses.map((b) => b.name)).not.toContain('Theirs')
    expect(JSON.stringify(body)).not.toContain(other.businessId)
  })

  it('test_UAT_FC_REQ-179_without_an_identity_it_reports_the_resolved_scope', async () => {
    // The loopback dev server: Access unconfigured, `ACCESS_DEV_OPEN` on, so
    // `admit` never runs and `resolveScope` answers from `TENANT_ID`. There is
    // exactly one business by construction on that path, and reporting it is
    // reporting the truth — an empty list would leave the chrome with nothing to
    // scope itself to and no way to tell that state from a broken one.
    const response = await ask(null, {
      ACCESS_DEV_OPEN: '1',
      ACCESS_TEAM_DOMAIN: '',
      ACCESS_AUD: '',
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as Payload

    // `lapse: null` because it is selectable ([[REQ-180]] §1 added the pairing:
    // a reason is present exactly when one is missing). Asserted as the whole
    // object rather than field by field, so a field appearing on this path
    // without anyone deciding it should fails here.
    expect(body.businesses).toEqual([
      { id: PLATFORM, name: PLATFORM, selectable: true, lapse: null },
    ])
    // No admission means no account to report, and saying so is better than
    // inventing one.
    expect(body.account).toBeNull()
  })

  it('test_UAT_FC_REQ-179_the_answer_is_never_cacheable', async () => {
    // It names an account's businesses. One cached copy is everybody's answer,
    // and this is the one endpoint where that would be a disclosure rather than
    // a stale page — the same rule every refusal in `index.ts` follows.
    stubJwks()
    const email = anEmail()
    await invite({ email, accountName: 'Cacheless', endsAt: null })
    const response = await ask(await mint(email))
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
})
