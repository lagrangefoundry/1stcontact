import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { accessLogoutUrl } from '../apps/control-app/src/access'
import { acceptTerms, TERMS_VERSION } from '../apps/control-app/src/terms'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { sessionIdentity, SIGN_IN_PATH, SIGN_OUT_PATH } from '../apps/control-app/src/sessions'
import { BUSINESSES_PATH } from '../apps/control-app/src/router'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-204 — **sign-out ends whichever credential the request carries**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the WORKER'S OWN `fetch` inside
 * workerd against a real D1 database with the deployed schema, and the session
 * it signs out of is a real one: an address is asked for a link, the token is
 * read back out of the RECORDED MESSAGE, and the cookie is the one redemption
 * set. So "the row is gone" is a row this deployment actually wrote.
 *
 * THE HOLE THIS FILLS, AND IT IS THIS TICKET'S OWN. The control shipped drawn
 * only for a session of ours, because `POST /sign-out` ends a session row and
 * clears a cookie we minted and can do nothing about a Cloudflare Access
 * credential. The premise was right and the conclusion was wrong: it left every
 * Access-admitted operator — which is us, in production and under
 * `bin/access-sim` locally — with a builder they could not leave. So the
 * endpoint now sends an Access caller to the edge's own logout, and the
 * conditional is gone.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a caller holding BOTH credentials sent to `/sign-in`* — admitted on the
 *     session, because that is tried first, and re-admitted by the Access cookie
 *     on the very next navigation. A sign-out that signs nobody out, by the one
 *     path nobody would think to check.
 *   - *our cookie left behind on the trip to the edge's logout* — the half we
 *     CAN end, left alive.
 *   - *an off-origin redirect from a deployment with no Access in front of it* —
 *     a URL assembled out of an empty team domain.
 */

const PLATFORM = 'req204-platform'
const HOST = 'app.req204.test'
const ORIGIN = `https://${HOST}`
const COOKIE_DOMAIN = 'req204.test'
const COOKIE_NAME = 'session'
const FROM = 'no-reply@req204.test'
const TEAM = 'https://req204-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)

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

/**
 * A real Access token, minted here.
 *
 * REAL RATHER THAN A PLACEHOLDER even though `/sign-out` never verifies one —
 * the endpoint runs ahead of the gate and asks only whether an edge credential
 * is present. A fixture shaped like the thing it stands for is what stops this
 * suite passing for a reason the deployment would not reproduce.
 */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req204-key', typ: 'JWT' }
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
const anEmail = (): string => `req204-${(seq += 1)}@example.test`

async function aMember(): Promise<{ email: string; userId: string }> {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id, TERMS_VERSION)
  return { email, userId: seeded.user.id }
}

/** The link that was actually mailed, read out of the recorded message. */
async function mailedLink(contactId: string): Promise<string> {
  const messages = await messagesFor(await storeFor(), contactId)
  expect(messages.length, 'no message was recorded for this contact').toBeGreaterThan(0)
  const match = /https:\/\/[^"\s<]*\/sign-in\/[A-Za-z0-9_-]+/.exec(messages[0].body)
  expect(match, 'no sign-in link in the recorded body').not.toBeNull()
  return match![0]
}

const cookieHeaderFrom = (setCookie: string): string => setCookie.split(';')[0]

/** Sign in for real, and come back with the cookie a browser would hold. */
async function aSignedInBrowser(): Promise<{ cookie: string; email: string }> {
  const { email, userId } = await aMember()
  await call(SIGN_IN_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const redeemed = await call(new URL(await mailedLink(userId)).pathname, { method: 'POST' })
  const cookie = cookieHeaderFrom(redeemed.headers.get('set-cookie') ?? '')
  expect(cookie, 'redemption set no session cookie').not.toBe('')
  return { cookie, email }
}

/** Where the edge ends its own session, as this deployment would name it. */
const EDGE_LOGOUT = accessLogoutUrl(TEAM, `${ORIGIN}${SIGN_IN_PATH}`)

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
})

describe('REQ-204 — where signing out sends you', () => {
  it('test_UAT_FC_REQ-204_a_session_of_ours_is_ended_and_lands_on_the_sign_in_page', async () => {
    const { cookie } = await aSignedInBrowser()

    const out = await call(SIGN_OUT_PATH, { method: 'POST', headers: { cookie } })

    expect(out.status).toBe(303)
    expect(out.headers.get('location')).toBe(SIGN_IN_PATH)
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0')
    // BOTH HALVES, as before this ticket: a cleared cookie over a live row is a
    // credential still good to whatever else is holding it.
    expect(await sessionIdentity(workerEnv(), PLATFORM, cookie)).toBeNull()
  })

  it('test_UAT_FC_REQ-204_an_access_credential_is_sent_to_the_edge_that_can_end_it', async () => {
    // THE OPERATOR'S CASE, and the whole of the revision. There is no session
    // row here to end; what this endpoint can do is send its holder where the
    // credential they DO hold is revoked, rather than to a sign-in page that
    // would re-admit them.
    const { email } = await aMember()

    const out = await call(SIGN_OUT_PATH, {
      method: 'POST',
      headers: { cookie: `CF_Authorization=${await mint(email)}` },
    })

    expect(out.status).toBe(303)
    expect(out.headers.get('location')).toBe(EDGE_LOGOUT)
    // Named rather than merely non-empty: the destination has to be the team
    // domain's logout, and it has to ask to come back to this origin.
    expect(out.headers.get('location')).toContain('/cdn-cgi/access/logout')
    expect(out.headers.get('location')).toContain(encodeURIComponent(`${ORIGIN}${SIGN_IN_PATH}`))
    // And ours is cleared on the way out even though it was not what admitted.
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it('test_UAT_FC_REQ-204_holding_both_credentials_ends_both', async () => {
    // THE CASE THAT WOULD OTHERWISE RE-ADMIT. `index.ts` admits this request on
    // the session, because the session is tried first — so an endpoint that
    // decided from the admission would send exactly this person to `/sign-in`
    // with a live Access cookie in their browser.
    const { cookie } = await aSignedInBrowser()
    const { email } = await aMember()

    const out = await call(SIGN_OUT_PATH, {
      method: 'POST',
      headers: { cookie: `${cookie}; CF_Authorization=${await mint(email)}` },
    })

    expect(out.headers.get('location')).toBe(EDGE_LOGOUT)
    // The session half is ended all the same. Choosing the edge as the
    // destination must not become a reason to leave our own row alive.
    expect(await sessionIdentity(workerEnv(), PLATFORM, cookie)).toBeNull()
  })

  it('test_UAT_FC_REQ-204_a_deployment_with_no_team_domain_never_redirects_off_origin', async () => {
    // A stale Access cookie can outlive the configuration that issued it. With
    // no team domain there is no edge to send anyone to, and a URL built out of
    // an empty string would be a redirect to `/cdn-cgi/…` on our own origin — a
    // 404 in place of a sign-out.
    const { email } = await aMember()

    const out = await call(
      SIGN_OUT_PATH,
      { method: 'POST', headers: { cookie: `CF_Authorization=${await mint(email)}` } },
      { ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '' },
    )

    expect(out.status).toBe(303)
    expect(out.headers.get('location')).toBe(SIGN_IN_PATH)
  })

  it('test_UAT_FC_REQ-204_the_chrome_is_told_nothing_about_which_credential_it_holds', async () => {
    // The client has no branch left, so it needs no field — and a field nothing
    // reads is drift. This is where the one added by the first cut of this
    // ticket is kept out.
    const { cookie } = await aSignedInBrowser()

    const response = await call(BUSINESSES_PATH, { headers: { cookie } })
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(Object.keys(body).sort()).toEqual(['businesses', 'person'])
  })
})
