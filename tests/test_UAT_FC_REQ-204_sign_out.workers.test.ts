import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { acceptTerms, TERMS_VERSION } from '../apps/control-app/src/terms'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { SIGN_IN_PATH } from '../apps/control-app/src/sessions'
import { BUSINESSES_PATH, businessesPayload } from '../apps/control-app/src/router'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-204 — **whether this session is one that can be ended, on the wire**.
 *
 * WHAT MAKES THIS EVIDENCE. The two cases that matter drive the WORKER'S OWN
 * `fetch` inside workerd against a real D1 database with the deployed schema, and
 * the session they use is a real one: an address is asked for a link, the token
 * is read back out of the RECORDED MESSAGE, and the cookie is the one redemption
 * set. So `session: true` is reported for a credential this deployment actually
 * issued, not for a header a suite invented.
 *
 * WHY IT IS TESTED AT THE WORKER AND NOT AT THE PAYLOAD BUILDER. The bit is
 * decided in `index.ts`, where the session cookie is tried before the gate, and
 * handed down as an injected dependency — so a suite that called
 * `businessesPayload` with a boolean it chose itself would prove the shape and
 * say nothing about the wiring, which is the half that can silently not exist.
 * The builder is exercised too, but only for the property the Worker cannot show:
 * that the answer is carried on both of its branches.
 *
 * THE FALSIFIER THIS FILE EXISTS FOR: *`session: true` for a caller admitted by
 * Cloudflare Access*. `POST /sign-out` ends a session row and can do nothing
 * about the gate, so that value would put a Sign out control in front of somebody
 * it cannot sign out — a control that does not do what it says, which is the
 * defect [[REQ-183]] §4.2 refuses for a Delete account button that deletes
 * nothing.
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
    MAIL_FROM: FROM,
    SESSION_COOKIE_NAME: COOKIE_NAME,
    SESSION_COOKIE_DOMAIN: COOKIE_DOMAIN,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('ASSET-BYTES', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A real Access token — signed by the key the stubbed JWKS publishes. */
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

function call(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, init), workerEnv())
}

const storeFor = (businessId = PLATFORM) =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId })

let seq = 0
const anEmail = (): string => `req204-${(seq += 1)}@example.test`

/** A 1st Contact account: a contact, a business, a grant, terms accepted. */
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
async function aSignedInBrowser(): Promise<string> {
  const { email, userId } = await aMember()
  await call(SIGN_IN_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const redeemed = await call(new URL(await mailedLink(userId)).pathname, { method: 'POST' })
  const cookie = cookieHeaderFrom(redeemed.headers.get('set-cookie') ?? '')
  expect(cookie, 'redemption set no session cookie').not.toBe('')
  return cookie
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req204-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-204 — the endpoint says whether there is a session to end', () => {
  it('test_UAT_FC_REQ-204_a_session_of_ours_is_reported_as_one_that_can_be_ended', async () => {
    const cookie = await aSignedInBrowser()

    const response = await call(BUSINESSES_PATH, { headers: { cookie } })

    expect(response.status).toBe(200)
    const body = (await response.json()) as { session: boolean; person: { email: string } | null }
    expect(body.session).toBe(true)
    // The same answer still carries who is asking — this is one more fact about
    // the session, not a replacement for the endpoint's subject.
    expect(body.person?.email).toBeTruthy()
  })

  it('test_UAT_FC_REQ-204_an_access_admitted_caller_is_reported_as_one_we_cannot_sign_out', async () => {
    // THE FALSIFIER, ON THE WIRE. Access admits this request — the gate is
    // configured and the token is real — and there is no session row anywhere for
    // `POST /sign-out` to end, so the honest answer is false and the chrome draws
    // no control.
    stubJwks()
    const { email } = await aMember()

    const response = await call(BUSINESSES_PATH, {
      headers: { 'cf-access-jwt-assertion': await mint(email) },
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as { session: boolean; person: { email: string } | null }
    expect(body.session).toBe(false)
    // And this caller IS admitted, which is what makes the false a statement
    // about the credential rather than about a request that failed.
    expect(body.person?.email).toBe(email)
  })

  it('test_UAT_FC_REQ-204_the_answer_is_carried_on_both_branches_of_the_payload', () => {
    // The admitted branch and the scope-only one — the second is the loopback
    // dev server and the Node transport, which have no session either. A field
    // present on one shape and absent on the other is a client reading
    // `undefined` and deciding it means true.
    const scopeOnly = businessesPayload(null, { businessId: PLATFORM } as never, null, false)
    expect(scopeOnly.session).toBe(false)
    expect(businessesPayload(null, null, null, true).session).toBe(true)
  })
})
