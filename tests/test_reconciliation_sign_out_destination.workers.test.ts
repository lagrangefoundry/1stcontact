import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { acceptTerms, TERMS_VERSION } from '../apps/control-app/src/terms'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { BUSINESSES_PATH } from '../apps/control-app/src/router'
import { SIGN_IN_PATH, SIGN_OUT_PATH } from '../apps/control-app/src/sessions'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * story-e0ca0a36 — **where signing out sends you**, through the Worker's own
 * `fetch` inside workerd against a real D1 with the deployed schema.
 *
 * The session signed out of is a real one: a link is asked for, read back out of
 * the RECORDED MESSAGE, and redeemed. "No longer admits" is observed on a real
 * builder route (`GET /api/businesses`) with Access configured and `fetch`
 * unstubbed, so no Access verification can succeed and a cookie-only request is
 * admitted only if the session row is alive.
 *
 * The expected Location is written out literally, not computed through the
 * production helper, so a change to the helper cannot carry the test with it.
 */

const PLATFORM = 'signout-dest-platform'
const HOST = 'app.signout-dest.test'
const ORIGIN = `https://${HOST}`
const COOKIE_DOMAIN = 'signout-dest.test'
const COOKIE_NAME = 'session'
const FROM = 'no-reply@signout-dest.test'
const TEAM = 'https://signout-dest-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

/** `<team>/cdn-cgi/access/logout?returnTo=<this origin>/sign-in`, encoded. */
const EDGE_LOGOUT = `${TEAM}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(`${ORIGIN}/sign-in`)}`

let signing: CryptoKeyPair

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    MAIL_FROM: FROM,
    SESSION_COOKIE_NAME: COOKIE_NAME,
    SESSION_COOKIE_DOMAIN: COOKIE_DOMAIN,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('ASSET-BYTES', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A real, signed Access token — shaped like what the edge forwards. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'signout-dest-key', typ: 'JWT' }
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

function call(
  path: string,
  init: RequestInit & { headers?: Record<string, string> } = {},
  overrides: Partial<Env> = {},
) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, init), workerEnv(overrides))
}

const storeFor = () =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: PLATFORM })

let seq = 0
const anEmail = (): string => `signout-dest-${(seq += 1)}@example.test`

async function aMember(): Promise<{ email: string; userId: string }> {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id, TERMS_VERSION)
  return { email, userId: seeded.user.id }
}

const cookieHeaderFrom = (setCookie: string): string => setCookie.split(';')[0]

/** Sign in for real and return the cookie a browser would hold. */
async function aSignedInBrowser(): Promise<{ cookie: string; email: string }> {
  const { email, userId } = await aMember()
  await call(SIGN_IN_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const messages = await messagesFor(await storeFor(), userId)
  const link = /https:\/\/[^"\s<]*\/sign-in\/[A-Za-z0-9_%-]+/.exec(messages[0]?.body ?? '')
  expect(link, 'no sign-in link was recorded').not.toBeNull()
  const redeemed = await call(new URL(link![0]).pathname, { method: 'POST' })
  expect(redeemed.status).toBe(303)
  const cookie = cookieHeaderFrom(redeemed.headers.get('set-cookie') ?? '')
  expect(cookie.startsWith(`${COOKIE_NAME}=`), 'redemption set no session cookie').toBe(true)
  return { cookie, email }
}

/** Who a builder route admits this request as — or the refusal status. */
async function admittedAs(headers: Record<string, string>): Promise<string | number> {
  const response = await call(BUSINESSES_PATH, { headers })
  if (response.status !== 200) return response.status
  const payload = (await response.json()) as { person?: { email?: string } }
  return payload.person?.email ?? 'admitted-without-email'
}

function clears(setCookie: string | null): boolean {
  return (setCookie ?? '').startsWith(`${COOKIE_NAME}=`) && (setCookie ?? '').includes('Max-Age=0')
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
})

describe('story-e0ca0a36 — signing out with an Access credential', () => {
  it('test_UAT_AC2366_signing_out_with_an_access_credential_goes_to_the_team_access_logout_returning_here', async () => {
    const { email } = await aMember()
    const jwt = await mint(email)

    // Each form of Access credential, alone.
    for (const [label, headers] of [
      ['CF_Authorization cookie', { cookie: `CF_Authorization=${jwt}` }],
      ['assertion header', { 'cf-access-jwt-assertion': jwt }],
    ] as const) {
      const out = await call(SIGN_OUT_PATH, { method: 'POST', headers: { ...headers } })
      expect(out.status, label).toBe(303)
      expect(out.headers.get('location'), label).toBe(EDGE_LOGOUT)
      expect(clears(out.headers.get('set-cookie')), `${label}: our cookie was not cleared`).toBe(true)
    }

    // Nothing the caller sends moves returnTo: a query, a form body, and
    // forwarded-host headers all leave the Location exactly as above.
    const hostile = await call(`${SIGN_OUT_PATH}?returnTo=${encodeURIComponent('https://evil.example/')}`, {
      method: 'POST',
      headers: {
        cookie: `CF_Authorization=${jwt}`,
        'content-type': 'application/x-www-form-urlencoded',
        'x-forwarded-host': 'evil.example',
        referer: 'https://evil.example/page',
      },
      body: new URLSearchParams({ returnTo: 'https://evil.example/' }).toString(),
    })
    expect(hostile.status).toBe(303)
    expect(hostile.headers.get('location')).toBe(EDGE_LOGOUT)
    expect(hostile.headers.get('location')).not.toContain('evil.example')

    // Holding a live session of ours AND an Access credential: the Access
    // logout still wins, our session is ended, and our cookie is cleared.
    for (const access of [
      (cookie: string) => ({ cookie: `${cookie}; CF_Authorization=${jwt}` }),
      (cookie: string) => ({ cookie, 'cf-access-jwt-assertion': jwt }),
    ]) {
      const browser = await aSignedInBrowser()
      expect(await admittedAs({ cookie: browser.cookie })).toBe(browser.email)

      const out = await call(SIGN_OUT_PATH, { method: 'POST', headers: access(browser.cookie) })
      expect(out.status).toBe(303)
      expect(out.headers.get('location'), 'a session holder was not sent to the edge logout').toBe(EDGE_LOGOUT)
      expect(clears(out.headers.get('set-cookie')), 'our cookie was left behind').toBe(true)
      expect(await admittedAs({ cookie: browser.cookie }), 'the session survived sign-out').toBe(401)
    }

    // No team domain configured: the same request stays on our origin.
    for (const headers of [{ cookie: `CF_Authorization=${jwt}` }, { 'cf-access-jwt-assertion': jwt }]) {
      const out = await call(
        SIGN_OUT_PATH,
        { method: 'POST', headers: { ...headers } },
        { ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' },
      )
      expect(out.status).toBe(303)
      expect(out.headers.get('location')).toBe('/sign-in')
    }
  })
})

describe('story-e0ca0a36 — the chrome is told nothing about the credential', () => {
  // The DOM half of AC-2365 runs in jsdom: test_reconciliation_sign_out_account_dialog.test.ts.
  it('test_UAT_AC2365_the_businesses_payload_carries_no_session_field', async () => {
    const { cookie, email } = await aSignedInBrowser()

    const bySession = await call(BUSINESSES_PATH, { headers: { cookie } })
    expect(bySession.status).toBe(200)
    const sessionBody = (await bySession.json()) as Record<string, unknown>
    expect(sessionBody).not.toHaveProperty('session')
    expect((sessionBody.person as { email?: string } | undefined)?.email).toBe(email)
    expect(JSON.stringify(sessionBody)).not.toMatch(/"session"\s*:/)
  })
})
