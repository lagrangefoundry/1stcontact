import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { provisionBusiness, type IdentityEnv } from '../apps/control-app/src/identity'
import { BUSINESSES_PATH } from '../apps/control-app/src/router'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount, type AccountSeed } from './support/invite-account'

/**
 * story-e674c60a — **`GET /api/businesses`, through the deployed entry point**.
 *
 * AC-2144 is a claim about what the chrome can learn in ONE call before any
 * business is chosen, so it is driven through the Worker's own `fetch` — the
 * admission `index.ts` computes ahead of routing is what the endpoint answers
 * from, and calling `route()` with a hand-built admission would prove the
 * payload builder while saying nothing about that wiring. Real D1 with the
 * deployed schema, a real RS256 Access token against a real JWKS, and businesses
 * written by the shipped `provisionBusiness` (accounts seeded through
 * `inviteAccount`, the fixture composing the shipped invite path). The JWKS fetch
 * is the only stub: Cloudflare Access is the one true external boundary here.
 */

const PLATFORM = 'rec-e674-platform'
const TEAM = 'https://rec-e674-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)
const KID = 'rec-e674-key'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
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

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: KID, typ: 'JWT' }
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

interface Payload {
  account: { name: string | null; email: string } | null
  businesses: Array<{
    id: string
    name: string
    selectable: boolean
    lapse: { reason: string; endedAt: string | null } | null
  }>
}

const ask = (token: string | null, over: Partial<Env> = {}): Promise<Response> =>
  worker.fetch(
    new Request(
      `https://app.example${BUSINESSES_PATH}`,
      token ? { headers: { 'cf-access-jwt-assertion': token } } : undefined,
    ),
    workerEnv(over),
  )

/** An invitee who has accepted the terms, so the API answers rather than the interstitial. */
async function invite(spec: AccountSeed) {
  const result = await inviteAccount(identityEnv(), spec)
  await acceptTerms(identityEnv(), result.user.id)
  return result
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-e674c60a — the businesses endpoint', () => {
  it('test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call', async () => {
    stubJwks()
    const email = 'rec-e674-owner@example.test'
    const live = await invite({ email, accountName: 'Live Salon', displayName: 'Robin Owner', endsAt: null })
    const lapsed = await provisionBusiness(identityEnv(), {
      accountUserId: live.user.id,
      name: 'Lapsed Studio',
      email,
    })
    // Push the second business's grant into the past — "access expired".
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(new Date(Date.now() - 60_000).toISOString(), lapsed.businessId)
      .run()
    // A third business belonging to somebody else entirely.
    const stranger = await invite({ email: 'rec-e674-stranger@example.test', accountName: 'Not Yours', endsAt: null })

    // ONE CALL, NO BUSINESS PREFIX: it is asked before any business is chosen.
    const response = await ask(await mint(email))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    const body = (await response.json()) as Payload

    // The signed-in account, in the same answer.
    expect(body.account).toEqual({ name: 'Robin Owner', email })

    // Exactly the caller's memberships — the lapsed one included, not filtered.
    const byId = new Map(body.businesses.map((b) => [b.id, b]))
    expect([...byId.keys()].sort()).toEqual([live.businessId, lapsed.businessId].sort())

    const liveRow = byId.get(live.businessId)!
    expect(liveRow.name).toBe('Live Salon')
    expect(liveRow.selectable).toBe(true)
    expect(liveRow.lapse).toBeNull()

    const lapsedRow = byId.get(lapsed.businessId)!
    expect(lapsedRow.name).toBe('Lapsed Studio')
    expect(lapsedRow.selectable).toBe(false)
    expect(lapsedRow.lapse).not.toBeNull()
    expect(typeof lapsedRow.lapse!.reason).toBe('string')
    expect(lapsedRow.lapse!.reason.length).toBeGreaterThan(0)

    // The pairing holds on every row: a reason exactly when not selectable.
    for (const b of body.businesses) expect(b.lapse === null).toBe(b.selectable)

    // Not an oracle: another account's business is absent, as though it did not exist.
    expect(JSON.stringify(body)).not.toContain(stranger.businessId)
    expect(JSON.stringify(body)).not.toContain('Not Yours')

    // With no verified identity (unconfigured local development) it reports the
    // resolved scope as a single selectable business — and still never caches.
    const open = await ask(null, { ACCESS_DEV_OPEN: '1', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' })
    expect(open.status).toBe(200)
    expect(open.headers.get('cache-control')).toContain('no-store')
    const openBody = (await open.json()) as Payload
    expect(openBody.businesses).toHaveLength(1)
    expect(openBody.businesses[0]).toMatchObject({ id: PLATFORM, selectable: true, lapse: null })
  })
})
