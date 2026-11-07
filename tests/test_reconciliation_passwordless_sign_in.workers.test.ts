import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { acceptTerms, TERMS_VERSION } from '../apps/control-app/src/terms'
import { ensurePlatformOperator, type IdentityEnv } from '../apps/control-app/src/identity'
import { addContact } from '../apps/control-app/src/people'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import {
  BUSINESSES_PATH,
  PERSON_INVITE_PATH,
  PERSON_STATUS_PATH,
} from '../apps/control-app/src/router'
import { SIGN_IN_PATH, SIGN_OUT_PATH, SIGNIN_RATE_LIMIT } from '../apps/control-app/src/sessions'
import { inviteAccount } from './support/invite-account'
import { personByEmail } from './support/person'
import { applySchema } from './support/d1-site-factory'

/**
 * story-e0ca0a36 — **passwordless sign-in, through the Worker's own `fetch`.**
 *
 * Every case drives `worker.fetch` inside workerd against a real D1 with the
 * deployed schema. Mail goes through the real template → port → record path
 * (no provider key, so the capturing sender), and the emailed link is read back
 * out of the RECORDED MESSAGE in the contact's history, never out of a spy.
 *
 * "Admitted as X" is observed on a real builder route — `GET /api/businesses`,
 * whose payload names the admitted person's email — with Access configured for
 * real verification and `fetch` left unstubbed unless the case needs Access, so
 * a session-only admission cannot be an Access admission in disguise.
 *
 * The clock is advanced by faking `Date` only; D1 holds the component's ISO
 * timestamps, so aging is decided by the same clock the component reads.
 */

const PLATFORM = 'pwless-platform'
const HOST = 'app.pwless.test'
const ORIGIN = `https://${HOST}`
const COOKIE_DOMAIN = 'pwless.test'
const COOKIE_NAME = 'session'
const FROM = 'no-reply@pwless.test'
const TEAM = 'https://pwless-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

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

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'pwless-key', typ: 'JWT' }
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

/** Move the clock forward by faking `Date` only. */
function advanceClock(ms: number): void {
  const now = Date.now()
  vi.useFakeTimers({ toFake: ['Date'], now })
  vi.setSystemTime(now + ms)
}

function call(
  path: string,
  init: RequestInit & { headers?: Record<string, string> } = {},
  overrides: Partial<Env> = {},
) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, init), workerEnv(overrides))
}

function askJson(email: string, overrides: Partial<Env> = {}, headers: Record<string, string> = {}) {
  return call(
    SIGN_IN_PATH,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ email }),
    },
    overrides,
  )
}

function askForm(email: string, overrides: Partial<Env> = {}) {
  return call(
    SIGN_IN_PATH,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email }).toString(),
    },
    overrides,
  )
}

const storeFor = (businessId = PLATFORM) =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId })

let seq = 0
const anEmail = (): string => `pwless-${(seq += 1)}@example.test`

/** An active 1st Contact account in the platform business, terms accepted. */
async function aMember(): Promise<{ email: string; userId: string; businessId: string }> {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id, TERMS_VERSION)
  return { email, userId: seeded.user.id, businessId: seeded.businessId }
}

/** An owner of the platform business, seeded the way production seeds one. */
async function anOperator(): Promise<{ email: string; userId: string }> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const person = await personByEmail(identityEnv(), PLATFORM, email)
  if (!person) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), person.id, TERMS_VERSION)
  return { email, userId: person.id }
}

async function messagesOf(contactId: string, businessId = PLATFORM) {
  return messagesFor(await storeFor(businessId), contactId)
}

const LINK = /https:\/\/[^"\s<]*\/sign-in\/[A-Za-z0-9_%-]+/g

/** Every sign-in link in the contact's recorded messages of one template. */
async function linksIn(contactId: string, templateKey: string, businessId = PLATFORM): Promise<string[]> {
  const messages = (await messagesOf(contactId, businessId)).filter((m) => m.templateKey === templateKey)
  // A body may carry its link more than once (e.g. as an href and as text).
  return messages.flatMap((m) => [...new Set(m.body.match(LINK) ?? [])])
}

/** Ask for a link and return the newly mailed one. */
async function freshLink(email: string, userId: string): Promise<string> {
  const before = new Set(await linksIn(userId, 'signin'))
  await askJson(email)
  const added = (await linksIn(userId, 'signin')).filter((l) => !before.has(l))
  expect(added.length, 'no new sign-in link was mailed').toBe(1)
  return added[0]
}

const pathOf = (link: string): string => new URL(link).pathname
const tokenOf = (link: string): string => decodeURIComponent(link.split('/').pop() ?? '')
const cookieHeaderFrom = (setCookie: string): string => setCookie.split(';')[0]

async function signIn(email: string, userId: string): Promise<string> {
  const redeemed = await call(pathOf(await freshLink(email, userId)), { method: 'POST' })
  expect(redeemed.status, redeemed.status === 303 ? '' : await redeemed.clone().text()).toBe(303)
  return cookieHeaderFrom(redeemed.headers.get('set-cookie') ?? '')
}

async function tokenRow(token: string) {
  return env.DB.prepare('SELECT id, subject_id, purpose, used_at, expires_at FROM login_tokens WHERE id = ?')
    .bind(token)
    .first<{ id: string; subject_id: string; purpose: string; used_at: string | null; expires_at: string }>()
}

async function tokenCountFor(subjectId: string): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_tokens WHERE subject_id = ?')
    .bind(subjectId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

async function allTokenCount(): Promise<number> {
  return (await env.DB.prepare('SELECT COUNT(*) AS n FROM login_tokens').first<{ n: number }>())!.n
}

async function sessionCountFor(subjectId: string): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM sessions WHERE subject_id = ?')
    .bind(subjectId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

/** Who a builder route admits this request as — or the refusal status. */
async function admittedAs(headers: Record<string, string>): Promise<string | number> {
  const response = await call(BUSINESSES_PATH, { headers })
  if (response.status !== 200) return response.status
  const payload = (await response.json()) as { person?: { email?: string } }
  return payload.person?.email ?? 'admitted-without-email'
}

function warned(event: string, spy: ReturnType<typeof vi.spyOn>): unknown[] {
  return spy.mock.calls
    .map((args) => String(args[0]))
    .filter((line) => line.includes(`"event":"${event}"`))
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'pwless-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-e0ca0a36 — requesting a link', () => {
  it('test_UAT_AC2343_a_known_active_person_receives_one_emailed_link_and_sees_the_acknowledgement', async () => {
    // The page loads with no Access token at all — fetch is not even stubbed.
    const form = await call(SIGN_IN_PATH)
    expect(form.status).toBe(200)
    const formBody = await form.text()
    expect(formBody).toContain(`<form method="post" action="${SIGN_IN_PATH}"`)
    expect(formBody).toContain('name="email"')

    // An invite first, so the history the sign-in lands in already holds one.
    stubJwks()
    const operator = await anOperator()
    const email = anEmail()
    const contact = await addContact(identityEnv(), { businessId: PLATFORM }, { email })
    const invited = await call(`/b/${PLATFORM}${PERSON_INVITE_PATH}`, {
      method: 'POST',
      headers: { 'cf-access-jwt-assertion': await mint(operator.email), 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [contact.person.id] }),
    })
    expect(invited.status).toBe(200)
    vi.unstubAllGlobals()
    resetJwksCache()

    // Form submission → the "Check your email" page.
    const byForm = await askForm(email)
    expect(byForm.status).toBe(200)
    expect(byForm.headers.get('content-type')).toContain('text/html')
    expect(await byForm.text()).toContain('Check your email')

    let signins = (await messagesOf(contact.person.id)).filter((m) => m.templateKey === 'signin')
    expect(signins.length, 'exactly one sign-in message for one request').toBe(1)
    expect(signins[0].to).toBe(email)
    const links = signins[0].body.match(LINK) ?? []
    expect(links.length).toBeGreaterThan(0)
    const link = new URL(links[0])
    expect(link.origin).toBe(ORIGIN)
    expect(link.pathname).toMatch(/^\/sign-in\/[A-Za-z0-9_%-]+$/)
    expect(link.search, 'the token travelled in a query string').toBe('')

    // Recorded beside the invite in the same contact's history.
    const keys = (await messagesOf(contact.person.id)).map((m) => m.templateKey)
    expect(keys).toContain('invite')
    expect(keys).toContain('signin')

    // JSON submission → the fixed acknowledgement body, one more message.
    const byJson = await askJson(email)
    expect(byJson.status).toBe(200)
    expect(await byJson.json()).toEqual({ acknowledged: true })
    signins = (await messagesOf(contact.person.id)).filter((m) => m.templateKey === 'signin')
    expect(signins.length).toBe(2)
  })

  it('test_UAT_AC2344_issuing_answers_identically_for_known_unknown_inactive_capped_and_failing', async () => {
    const warn = vi.spyOn(console, 'warn')

    // (a) known active
    const known = await aMember()
    // (b) nobody
    const nobody = 'nobody-holds-this@example.test'
    // (c) inactive
    const inactive = await aMember()
    await env.DB.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").bind(inactive.userId).run()
    // (d) over the cap
    const capped = await aMember()
    for (let i = 0; i < SIGNIN_RATE_LIMIT; i += 1) await askJson(capped.email)
    // (e) a send that fails inside the platform: no sender configured
    const failing = await aMember()

    for (const encoding of ['json', 'form'] as const) {
      const ask = (email: string, overrides: Partial<Env> = {}) =>
        encoding === 'json' ? askJson(email, overrides) : askForm(email, overrides)

      const a = await ask(known.email)
      const aBody = await a.text()

      const tokensBefore = await allTokenCount()
      const b = await ask(nobody)
      expect(await allTokenCount(), `${encoding}: an unknown address minted a token`).toBe(tokensBefore)

      const inactiveTokens = await tokenCountFor(inactive.userId)
      const c = await ask(inactive.email)
      expect(await tokenCountFor(inactive.userId)).toBe(inactiveTokens)
      expect((await messagesOf(inactive.userId)).length, `${encoding}: an inactive person was mailed`).toBe(0)

      const cappedMessages = (await messagesOf(capped.userId)).length
      const d = await ask(capped.email)
      expect((await messagesOf(capped.userId)).length, `${encoding}: the cap was exceeded`).toBe(cappedMessages)

      const failuresBefore = warned('signin_issue_failed', warn).length
      const e = await ask(failing.email, { MAIL_FROM: '' })
      expect(warned('signin_issue_failed', warn).length, `${encoding}: the failure was not logged`).toBe(
        failuresBefore + 1,
      )

      for (const [label, response] of [['b', b], ['c', c], ['d', d], ['e', e]] as const) {
        expect(response.status, `${encoding} (${label}) status`).toBe(a.status)
        const body = await response.text()
        expect(body, `${encoding} (${label}) body differs from (a)`).toBe(aBody)
        // The failure reason never reaches the caller.
        expect(body).not.toContain('MAIL_FROM')
      }
    }
  })

  it('test_UAT_AC2345_sign_in_mail_to_one_person_is_capped_at_five_per_rolling_hour', async () => {
    const warn = vi.spyOn(console, 'warn')
    const { email, userId } = await aMember()

    const answers: string[] = []
    for (let i = 0; i < 5; i += 1) answers.push(await (await askJson(email)).text())
    expect((await messagesOf(userId)).length).toBe(5)

    const sixth = await askJson(email)
    answers.push(await sixth.text())
    expect(sixth.status).toBe(200)
    expect((await messagesOf(userId)).length, 'a sixth link was sent within the hour').toBe(5)
    expect(await tokenCountFor(userId)).toBe(5)
    expect(new Set(answers).size, 'the cap changed the acknowledgement').toBe(1)
    expect(warned('signin_rate_limited', warn).length).toBeGreaterThan(0)

    advanceClock(HOUR + MINUTE)
    const seventh = await askJson(email)
    expect(await seventh.text()).toBe(answers[0])
    expect((await messagesOf(userId)).length, 'the window passed and still nothing was sent').toBe(6)
    expect(await tokenCountFor(userId)).toBe(6)
  })

  it('test_UAT_AC2346_an_address_resolves_only_within_the_business_of_the_request_host', async () => {
    const owner = await aMember()
    const shared = anEmail()
    const elsewhere = await addContact(identityEnv(), { businessId: owner.businessId }, { email: shared })

    const tokensBefore = await allTokenCount()
    const answer = await askJson(shared)
    expect(answer.status).toBe(200)
    expect(await allTokenCount(), 'a token was minted for a contact of another business').toBe(tokensBefore)
    expect(await tokenCountFor(elsewhere.person.id)).toBe(0)
    expect((await messagesOf(elsewhere.person.id, owner.businessId)).length).toBe(0)

    // The same address in the platform business: now exactly one link, to THAT contact.
    const here = await addContact(identityEnv(), { businessId: PLATFORM }, { email: shared })
    await askJson(shared)
    expect((await linksIn(here.person.id, 'signin')).length).toBe(1)
    expect(await tokenCountFor(here.person.id)).toBe(1)
    expect((await messagesOf(elsewhere.person.id, owner.businessId)).length).toBe(0)
  })

  it('test_UAT_AC2355_the_issue_endpoint_allows_cross_origin_calls_only_from_the_cookie_domain', async () => {
    const { email } = await aMember()
    for (const inside of [`https://${COOKIE_DOMAIN}`, `https://www.${COOKIE_DOMAIN}`]) {
      const preflight = await call(SIGN_IN_PATH, {
        method: 'OPTIONS',
        headers: {
          origin: inside,
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      })
      expect(preflight.status).toBe(204)
      expect(preflight.headers.get('access-control-allow-origin')).toBe(inside)
      expect(preflight.headers.get('access-control-allow-methods')).toContain('POST')
      expect(preflight.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('content-type')
      expect(preflight.headers.get('vary')).toContain('Origin')

      const post = await askJson(email, {}, { origin: inside })
      expect(post.status).toBe(200)
      expect(post.headers.get('access-control-allow-origin')).toBe(inside)
    }

    const stranger = 'https://elsewhere.example'
    const preflight = await call(SIGN_IN_PATH, {
      method: 'OPTIONS',
      headers: { origin: stranger, 'access-control-request-method': 'POST' },
    })
    expect(preflight.headers.get('access-control-allow-origin')).toBeNull()
    const post = await askJson(email, {}, { origin: stranger })
    expect(post.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('story-e0ca0a36 — the emailed link', () => {
  it('test_UAT_AC2347_opening_a_link_shows_a_continue_page_and_leaves_it_unused', async () => {
    const { email, userId } = await aMember()
    const link = await freshLink(email, userId)
    const path = pathOf(link)

    for (let i = 0; i < 3; i += 1) {
      const response = await call(path)
      expect(response.status).toBe(200)
      expect(response.headers.get('set-cookie')).toBeNull()
      const body = await response.text()
      expect(body).toContain(`<form method="post" action="${path}"`)
      expect(body.match(/<button/g)?.length, 'more than one control on the Continue page').toBe(1)
      expect(body).toContain('Continue')
      expect(body).toContain('signing you in')
    }
    const head = await call(path, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(head.headers.get('set-cookie')).toBeNull()
    expect((await tokenRow(tokenOf(link)))?.used_at, 'a GET consumed the token').toBeNull()

    // The page does not depend on the token: an invented one gets the same page shape.
    const invented = `${SIGN_IN_PATH}/never-minted-token`
    const inventedPage = await call(invented)
    expect(inventedPage.status).toBe(200)
    expect(await inventedPage.text()).toContain(`action="${invented}"`)

    const redeemed = await call(path, { method: 'POST' })
    expect(redeemed.status).toBe(303)
    expect(redeemed.headers.get('set-cookie')).toContain(`${COOKIE_NAME}=`)
  })

  it('test_UAT_AC2348_pressing_continue_signs_in_with_a_cookie_the_builder_and_apex_read', async () => {
    const { email, userId } = await aMember()
    const link = await freshLink(email, userId)

    const redeemed = await call(pathOf(link), { method: 'POST' })
    expect(redeemed.status).toBe(303)
    expect(redeemed.headers.get('location')).toBe('/')
    expect(redeemed.headers.get('cache-control')).toContain('no-store')
    const setCookie = redeemed.headers.get('set-cookie') ?? ''
    expect(setCookie.startsWith(`${COOKIE_NAME}=`)).toBe(true)
    expect(setCookie).toContain(`Domain=${COOKIE_DOMAIN}`)
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Lax')
    expect((await tokenRow(tokenOf(link)))?.used_at).not.toBeNull()

    // Admitted on the cookie alone — Access configured, fetch unstubbed.
    const cookie = cookieHeaderFrom(setCookie)
    expect(await admittedAs({ cookie })).toBe(email)

    // Posting it again creates no second session.
    const again = await call(pathOf(link), { method: 'POST' })
    expect(again.status).toBe(200)
    expect(again.headers.get('set-cookie')).toBeNull()
    expect(await sessionCountFor(userId)).toBe(1)
  })

  it('test_UAT_AC2349_expired_used_and_unknown_links_get_one_identical_page_offering_a_fresh_link', async () => {
    const used = await aMember()
    const usedLink = await freshLink(used.email, used.userId)
    expect((await call(pathOf(usedLink), { method: 'POST' })).status).toBe(303)

    const expired = await aMember()
    const expiredLink = await freshLink(expired.email, expired.userId)

    // Past the 30-minute sign-in token lifetime.
    advanceClock(31 * MINUTE)

    const responses = [
      await call(pathOf(usedLink), { method: 'POST' }),
      await call(pathOf(expiredLink), { method: 'POST' }),
      await call(`${SIGN_IN_PATH}/a-token-nobody-ever-minted`, { method: 'POST' }),
    ]
    const bodies: string[] = []
    for (const response of responses) {
      expect(response.status).toBe(200)
      expect(response.headers.get('set-cookie')).toBeNull()
      bodies.push(await response.text())
    }
    expect(new Set(bodies).size, 'the three refusals were distinguishable').toBe(1)
    expect(bodies[0]).toContain('cannot be used')
    expect(bodies[0]).toContain(`<form method="post" action="${SIGN_IN_PATH}"`)
    expect(bodies[0]).toContain('name="email"')
    expect((await tokenRow(tokenOf(expiredLink)))?.used_at).toBeNull()
  })

  it('test_UAT_AC2350_a_cross_site_post_is_refused_and_the_link_stays_usable', async () => {
    const { email, userId } = await aMember()
    const link = await freshLink(email, userId)

    const refused = await call(pathOf(link), {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
    })
    expect(refused.status).toBe(403)
    expect(refused.headers.get('set-cookie')).toBeNull()
    expect((await tokenRow(tokenOf(link)))?.used_at).toBeNull()
    expect(await sessionCountFor(userId)).toBe(0)

    const accepted = await call(pathOf(link), { method: 'POST', headers: { origin: ORIGIN } })
    expect(accepted.status).toBe(303)
    expect(accepted.headers.get('set-cookie')).toContain(`${COOKIE_NAME}=`)
    expect((await tokenRow(tokenOf(link)))?.used_at).not.toBeNull()
  })
})

describe('story-e0ca0a36 — sessions at the builder', () => {
  it('test_UAT_AC2351_signing_out_ends_the_session_clears_the_cookie_and_succeeds_unsigned', async () => {
    const { email, userId } = await aMember()
    const cookie = await signIn(email, userId)
    expect(await admittedAs({ cookie })).toBe(email)

    const shape = async (response: Response) => ({
      status: response.status,
      location: response.headers.get('location'),
      setCookie: response.headers.get('set-cookie'),
    })

    const out = await shape(await call(SIGN_OUT_PATH, { method: 'POST', headers: { cookie } }))
    expect(out.status).toBe(303)
    expect(out.location).toBe(SIGN_IN_PATH)
    expect(out.setCookie).toContain(`${COOKIE_NAME}=`)
    expect(out.setCookie).toContain('Max-Age=0')

    // The old cookie no longer admits anybody (Access configured, fetch unstubbed).
    expect(await admittedAs({ cookie })).toBe(401)

    // No cookie, and a dead one: the same response.
    expect(await shape(await call(SIGN_OUT_PATH, { method: 'POST' }))).toEqual(out)
    expect(await shape(await call(SIGN_OUT_PATH, { method: 'POST', headers: { cookie } }))).toEqual(out)
  })

  it('test_UAT_AC2352_the_builder_admits_on_a_session_or_access_and_a_dead_session_falls_through', async () => {
    const { email, userId } = await aMember()
    const cookie = await signIn(email, userId)

    // Session only — fetch is unstubbed, so no Access verification could succeed.
    const bySession = await call(BUSINESSES_PATH, { headers: { cookie } })
    expect(bySession.status).toBe(200)
    const sessionPayload = await bySession.json()

    stubJwks()
    // Access only.
    const byAccess = await call(BUSINESSES_PATH, { headers: { 'cf-access-jwt-assertion': await mint(email) } })
    expect(byAccess.status).toBe(200)
    const accessPayload = await byAccess.json()
    expect((accessPayload as { person: { email: string } }).person.email).toBe(email)
    // The same downstream outcome, whichever producer answered.
    expect(sessionPayload).toEqual(accessPayload)

    // A dead session plus a valid Access token: admitted on Access, not refused.
    for (const dead of [`${COOKIE_NAME}=never-issued-session`, cookie]) {
      if (dead === cookie) {
        await call(SIGN_OUT_PATH, { method: 'POST', headers: { cookie } })
      }
      expect(
        await admittedAs({ cookie: dead, 'cf-access-jwt-assertion': await mint(email) }),
        `a dead session (${dead.slice(0, 24)}) locked out an Access holder`,
      ).toBe(email)
    }

    // Neither: refused, as before.
    expect(await admittedAs({})).toBe(401)
    expect(await admittedAs({ cookie })).toBe(401)
  })

  it('test_UAT_AC2354_withdrawing_a_login_ends_every_session_and_stops_further_links', async () => {
    const { email, userId } = await aMember()
    const first = await signIn(email, userId)
    const second = await signIn(email, userId)
    expect(first).not.toBe(second)
    expect(await admittedAs({ cookie: first })).toBe(email)
    expect(await admittedAs({ cookie: second })).toBe(email)

    // Withdrawn through the people route, by an owner of the platform business.
    stubJwks()
    const operator = await anOperator()
    const withdrawn = await call(`/b/${PLATFORM}${PERSON_STATUS_PATH}`, {
      method: 'POST',
      headers: { 'cf-access-jwt-assertion': await mint(operator.email), 'content-type': 'application/json' },
      body: JSON.stringify({ id: userId, status: 'suspended' }),
    })
    expect(withdrawn.status).toBe(200)
    vi.unstubAllGlobals()
    resetJwksCache()

    expect(await admittedAs({ cookie: first })).toBe(401)
    expect(await admittedAs({ cookie: second })).toBe(401)

    const messagesBefore = (await messagesOf(userId)).length
    const tokensBefore = await tokenCountFor(userId)
    const answer = await askJson(email)
    const standard = await askJson('nobody-at-all-here@example.test')
    expect(answer.status).toBe(standard.status)
    expect(await answer.text()).toBe(await standard.text())
    expect((await messagesOf(userId)).length, 'a withdrawn person was mailed a link').toBe(messagesBefore)
    expect(await tokenCountFor(userId)).toBe(tokensBefore)
  })
})

describe('story-e0ca0a36 — the invite carries a token', () => {
  it('test_UAT_AC2353_an_invites_call_to_action_is_a_redeemable_link_that_needs_no_access', async () => {
    stubJwks()
    const owner = await aMember()
    const invite = async (personId: string) => {
      const response = await call(PERSON_INVITE_PATH, {
        method: 'POST',
        headers: { 'cf-access-jwt-assertion': await mint(owner.email), 'content-type': 'application/json' },
        body: JSON.stringify({ ids: [personId] }),
      })
      expect(response.status).toBe(200)
      const { results } = (await response.json()) as { results: Array<{ status: string }> }
      expect(results[0].status).toBe('sent')
      const links = await linksIn(personId, 'invite', owner.businessId)
      expect(links.length, 'no sign-in link in the invite').toBe(1)
      return links[0]
    }

    const invitee = await addContact(identityEnv(), { businessId: owner.businessId }, { email: anEmail() })
    const link = await invite(invitee.person.id)
    expect(link).not.toBe(ORIGIN)
    expect(link).not.toBe(`${ORIGIN}/`)
    expect(new URL(link).origin).toBe(ORIGIN)
    expect(new URL(link).pathname).toMatch(/^\/sign-in\/[A-Za-z0-9_%-]+$/)
    const row = await tokenRow(tokenOf(link))
    expect(row?.subject_id).toBe(invitee.person.id)
    expect(row?.purpose).toBe('invite')

    // Two more invites, minted now, to be aged before they are pressed.
    const mid = await addContact(identityEnv(), { businessId: owner.businessId }, { email: anEmail() })
    const midLink = await invite(mid.person.id)
    const later = await addContact(identityEnv(), { businessId: owner.businessId }, { email: anEmail() })
    const laterLink = await invite(later.person.id)

    // From here on there is no Access token anywhere and fetch is unstubbed.
    vi.unstubAllGlobals()
    resetJwksCache()

    const page = await call(pathOf(link))
    expect(page.status).toBe(200)
    expect(await page.text()).toContain('Continue')
    const redeemed = await call(pathOf(link), { method: 'POST' })
    expect(redeemed.status).toBe(303)
    const setCookie = redeemed.headers.get('set-cookie') ?? ''
    expect(setCookie.startsWith(`${COOKIE_NAME}=`)).toBe(true)
    expect(await sessionCountFor(invitee.person.id)).toBe(1)

    // Still redeemable well past a sign-in link's 30 minutes…
    advanceClock(29 * DAY)
    const stillLive = await call(pathOf(midLink), { method: 'POST' })
    expect(stillLive.status, 'an invite died before 30 days').toBe(303)
    expect(stillLive.headers.get('set-cookie')).toContain(`${COOKIE_NAME}=`)
    // …and refused once 30 days have passed.
    vi.setSystemTime(Date.now() + 2 * DAY)
    const aged = await call(pathOf(laterLink), { method: 'POST' })
    expect(aged.status).toBe(200)
    expect(aged.headers.get('set-cookie')).toBeNull()
    expect(await aged.text()).toContain('cannot be used')
  })
})
