import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { acceptTerms, TERMS_VERSION } from '../apps/control-app/src/terms'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import { addContact, setPersonStatus } from '../apps/control-app/src/people'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import {
  sessionIdentity,
  SIGN_IN_PATH,
  SIGN_OUT_PATH,
  SIGNIN_RATE_LIMIT,
} from '../apps/control-app/src/sessions'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-202 — **the sign-in link, end to end, through the Worker's own `fetch`.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case here drives `worker.fetch` inside workerd
 * against a real D1 database with the deployed schema applied. Nothing on the way
 * is short-circuited: the token is read back out of the RECORDED MESSAGE — the
 * `email` ticket [[REQ-198]] writes — rather than out of a spy, so a link that
 * reached the assertion is a link that was rendered from the template
 * ([[REQ-197]]), handed to the sending port ([[REQ-196]]) and written into the
 * contact's history on the way.
 *
 * THE HOLE THIS FILLS. [[REQ-134]] was built and nothing consumed it: there was
 * no `login_tokens` table, no issue route and no redeem route, and two surfaces
 * were already built against an endpoint that did not exist —
 * `account-chrome`'s Sign In control ([[REQ-200]]) and the invite's `ctaUrl`,
 * which pointed at the bare front door because there was no token to build a link
 * from.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *an issue endpoint that answers differently for a known and an unknown
 *     address* — a membership oracle to anyone with an email address;
 *   - *a GET of the emailed link that consumes the token* — mail scanners fetch
 *     every URL in a message, so that is a link spent before the recipient ever
 *     clicks;
 *   - *an invite whose `{{cta_url}}` is the bare origin* — the state before this
 *     ticket, in which the invitee meets Cloudflare Access and its own
 *     one-time-PIN email instead of the invitation they were sent;
 *   - *a withdrawn person whose sessions stay live* — a credential for an account
 *     the business has just closed.
 */

const PLATFORM = 'req202-platform'
const HOST = 'app.req202.test'
const ORIGIN = `https://${HOST}`
const COOKIE_DOMAIN = 'req202.test'
const COOKIE_NAME = 'session'
const FROM = 'no-reply@req202.test'
const TEAM = 'https://req202-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

/** The whole Worker environment, with Access configured for real verification. */
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

/** A real Access token — minted here, signed by the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req202-key', typ: 'JWT' }
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

/** POST an address the way `account-chrome`'s client does — JSON, no session. */
function askForALink(email: string) {
  return call(SIGN_IN_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

const storeFor = (businessId = PLATFORM) =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId })

let seq = 0
const anEmail = (): string => `req202-${(seq += 1)}@example.test`

/** A 1st Contact account: a contact, a business, a grant, terms accepted. */
async function aMember(): Promise<{ email: string; userId: string; businessId: string }> {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id, TERMS_VERSION)
  return { email, userId: seeded.user.id, businessId: seeded.businessId }
}

/**
 * The link that was actually mailed, read out of the recorded message.
 *
 * THE RECORD IS THE OBSERVATION, deliberately. A spy on the sending port would
 * prove that something was handed to a sender; this proves that the message was
 * rendered from a template and written into the contact's history, which is the
 * whole of what "sending goes through what already exists" claims.
 */
async function mailedLink(contactId: string, businessId = PLATFORM): Promise<string> {
  const messages = await messagesFor(await storeFor(businessId), contactId)
  expect(messages.length, 'no message was recorded for this contact').toBeGreaterThan(0)
  const match = /https:\/\/[^"\s<]*\/sign-in\/[A-Za-z0-9_-]+/.exec(messages[0].body)
  expect(match, `no sign-in link in the recorded body: ${messages[0].body.slice(0, 200)}`).not.toBeNull()
  return match![0]
}

const tokenOf = (link: string): string => link.split('/').pop() ?? ''

async function tokenRow(token: string) {
  return env.DB.prepare('SELECT id, subject_id, purpose, used_at, expires_at FROM login_tokens WHERE id = ?')
    .bind(token)
    .first<{ id: string; subject_id: string; purpose: string; used_at: string | null; expires_at: string }>()
}

/** Turn a `Set-Cookie` value into the `Cookie` header a browser would send back. */
const cookieHeaderFrom = (setCookie: string): string => setCookie.split(';')[0]

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req202-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-202 — issuing a link', () => {
  it('test_UAT_FC_REQ-202_issuing_for_a_known_and_an_unknown_address_are_indistinguishable', async () => {
    // THE PROPERTY THE ENDPOINT EXISTS UNDER. It is what an anonymous person
    // calls, so an answer that varied with whether the address is a contact would
    // let anyone test addresses against this business's list one at a time.
    const { userId } = await aMember()
    const known = await askForALink((await primaryOf(userId))!)
    const unknown = await askForALink('nobody-at-all@example.test')

    expect(known.status).toBe(unknown.status)
    expect(await known.text()).toBe(await unknown.text())
    // And the difference IS real underneath — one token was minted and one was
    // not — which is what makes the identical answer a property rather than a
    // coincidence of both paths failing.
    expect(await tokenCountFor(userId)).toBe(1)
  })

  it('test_UAT_FC_REQ-202_a_link_is_rendered_recorded_and_sent_as_one_message', async () => {
    // SENDING GOES THROUGH WHAT ALREADY EXISTS: the `signin` template
    // ([[REQ-197]]), the port ([[REQ-196]]) and the record ([[REQ-198]]). So a
    // sign-in link appears in the contact's history beside their invite, and a
    // bounced sign-in address is as visible as a bounced invite.
    const { email, userId } = await aMember()
    await askForALink(email)

    const messages = await messagesFor(await storeFor(), userId)
    expect(messages.length).toBe(1)
    expect(messages[0].templateKey).toBe('signin')
    expect(messages[0].to).toBe(email)
    expect(messages[0].from).toBe(FROM)
    // Not `queued`: the record is written before the provider is called and
    // updated after, so a terminal status is the proof the send completed.
    expect(messages[0].status).toBe('sent')
    // The template's `{{cta_url}}` substituted — the refusal [[REQ-197]] exists
    // for is that this is still a token.
    expect(messages[0].body).not.toContain('{{cta_url}}')
    expect(messages[0].body).toContain(`${ORIGIN}${SIGN_IN_PATH}/`)
  })

  it('test_UAT_FC_REQ-202_sign_in_mail_is_capped_per_subject', async () => {
    // The issue route is the one endpoint that cannot have access controls, so
    // the cap is the only control it has. Over the cap answers exactly as under
    // it — three states (nobody, under, over), one answer.
    const { email, userId } = await aMember()
    const answers: string[] = []
    for (let i = 0; i < SIGNIN_RATE_LIMIT + 2; i += 1) {
      answers.push(await (await askForALink(email)).text())
    }
    expect(new Set(answers).size, 'the cap changed what the caller was told').toBe(1)
    expect(await tokenCountFor(userId)).toBe(SIGNIN_RATE_LIMIT)
  })

  it('test_UAT_FC_REQ-202_a_withdrawn_contact_is_sent_nothing_and_holds_nothing', async () => {
    // Withdrawal has to be complete: no NEW link, and the sessions they already
    // hold ended. Half of it is a person who cannot sign in and is still signed
    // in.
    const { email, userId } = await aMember()
    await askForALink(email)
    const redeemed = await call(new URL(await mailedLink(userId)).pathname, { method: 'POST' })
    const cookie = cookieHeaderFrom(redeemed.headers.get('set-cookie') ?? '')
    expect(await sessionIdentity(workerEnv(), PLATFORM, cookie)).not.toBeNull()

    await setPersonStatus(identityEnv(), { businessId: PLATFORM }, userId, 'suspended')

    expect(await sessionIdentity(workerEnv(), PLATFORM, cookie)).toBeNull()
    const before = await tokenCountFor(userId)
    await askForALink(email)
    expect(await tokenCountFor(userId), 'a withdrawn contact was mailed a link').toBe(before)
  })
})

describe('REQ-202 — the Sign In control posts from another origin', () => {
  it('test_UAT_FC_REQ-202_the_apex_may_post_an_address_and_a_stranger_may_not', async () => {
    // `account-chrome` on the public apex posts here — [[REQ-200]] sets `signIn`
    // to the builder's own origin — and its client sends JSON, which is a
    // PREFLIGHTED request. Without this the Sign In control fails in a browser
    // console and works nowhere, which is the hole this ticket set out to fill.
    //
    // THE COOKIE DOMAIN IS THE RULE, not a list somebody maintains: the origins
    // that could usefully ask for a session are exactly the hosts that can read
    // one.
    const apex = await call(SIGN_IN_PATH, {
      method: 'OPTIONS',
      headers: { origin: `https://${COOKIE_DOMAIN}`, 'access-control-request-method': 'POST' },
    })
    expect(apex.status).toBe(204)
    expect(apex.headers.get('access-control-allow-origin')).toBe(`https://${COOKIE_DOMAIN}`)
    expect(apex.headers.get('vary')).toContain('Origin')

    const stranger = await call(SIGN_IN_PATH, {
      method: 'OPTIONS',
      headers: { origin: 'https://somebody-else.example', 'access-control-request-method': 'POST' },
    })
    expect(stranger.status).toBe(403)
    expect(stranger.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('test_UAT_FC_REQ-202_redeeming_refuses_a_cross_site_post', async () => {
    // LOGIN CSRF. An attacker holding a live token could otherwise navigate
    // somebody else's browser into THEIR session by posting this form cross-site,
    // and the victim then works believing it is their own account. A browser
    // sends `Origin` on every cross-site form POST, so the check costs one header
    // read.
    const { email, userId } = await aMember()
    await askForALink(email)
    const link = await mailedLink(userId)

    const refused = await call(new URL(link).pathname, {
      method: 'POST',
      headers: { origin: 'https://somebody-else.example' },
    })

    expect(refused.status).toBe(403)
    expect(refused.headers.get('set-cookie')).toBeNull()
    // AND THE TOKEN SURVIVES, so the refusal costs its rightful owner nothing.
    expect((await tokenRow(tokenOf(link)))?.used_at).toBeNull()
  })
})

describe('REQ-202 — the emailed link', () => {
  it('test_UAT_FC_REQ-202_a_get_of_the_link_serves_a_continue_control_and_consumes_nothing', async () => {
    // THE REASON THIS PAGE EXISTS. Enterprise mail scanners fetch every URL in a
    // message; a token redeemed on GET is spent before the recipient clicks —
    // intermittently, silently, and worst for the customers with the most
    // locked-down mail.
    const { email, userId } = await aMember()
    await askForALink(email)
    const link = await mailedLink(userId)
    const token = tokenOf(link)

    const first = await call(new URL(link).pathname)
    const second = await call(new URL(link).pathname)

    for (const response of [first, second]) {
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/html')
      const body = await response.text()
      expect(body).toContain('method="post"')
      expect(body).toContain('Continue')
      // No session was handed out by looking.
      expect(response.headers.get('set-cookie')).toBeNull()
    }
    expect((await tokenRow(token))?.used_at, 'a GET consumed the token').toBeNull()
  })

  it('test_UAT_FC_REQ-202_pressing_continue_signs_them_in_on_a_cookie_the_apex_can_read', async () => {
    const { email, userId } = await aMember()
    await askForALink(email)
    const link = await mailedLink(userId)

    const redeemed = await call(new URL(link).pathname, { method: 'POST' })

    // 303 rather than 200: the browser has just POSTed, and a reload after a back
    // button would otherwise re-post a token that is now spent.
    expect(redeemed.status).toBe(303)
    expect(redeemed.headers.get('location')).toBe('/')
    const setCookie = redeemed.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain(`${COOKIE_NAME}=`)
    // THE DOMAIN IS WHAT LETS THE BUILDER AND THE APEX SHARE ONE SESSION. A
    // host-only cookie would leave `account-chrome` on the public site unable to
    // see a session it had just been given ([[REQ-200]]).
    expect(setCookie).toContain(`Domain=${COOKIE_DOMAIN}`)
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Lax')
    expect((await tokenRow(tokenOf(link)))?.used_at).not.toBeNull()
  })

  it('test_UAT_FC_REQ-202_expired_used_and_unknown_all_offer_a_fresh_link', async () => {
    // WORDED, NOT PASSED THROUGH. A dead end at this exact point loses a person we
    // have already persuaded to click, so all three say the same thing and put the
    // way out on the page — and three different statuses would distinguish on the
    // wire what the copy deliberately does not.
    const used = await aMember()
    await askForALink(used.email)
    const usedLink = await mailedLink(used.userId)
    await call(new URL(usedLink).pathname, { method: 'POST' })

    const expired = await aMember()
    await askForALink(expired.email)
    const expiredLink = await mailedLink(expired.userId)
    await env.DB.prepare('UPDATE login_tokens SET expires_at = ? WHERE id = ?')
      .bind('2000-01-01T00:00:00.000Z', tokenOf(expiredLink))
      .run()

    const answers = await Promise.all(
      [
        new URL(usedLink).pathname,
        new URL(expiredLink).pathname,
        `${SIGN_IN_PATH}/not-a-token-anyone-ever-minted`,
      ].map((p) => call(p, { method: 'POST' })),
    )

    const bodies: string[] = []
    for (const response of answers) {
      expect(response.status).toBe(200)
      expect(response.headers.get('set-cookie')).toBeNull()
      bodies.push(await response.text())
    }
    expect(new Set(bodies).size, 'the three refusals were distinguishable').toBe(1)
    expect(bodies[0]).toContain('cannot be used')
    // The Sign In control, on the spot.
    expect(bodies[0]).toContain(`action="${SIGN_IN_PATH}"`)
    expect(bodies[0]).toContain('name="email"')
  })
})

describe('REQ-202 — a session is a second producer of a verified identity', () => {
  it('test_UAT_FC_REQ-202_a_session_reaches_the_builder_with_no_access_challenge', async () => {
    // THE WHOLE POINT OF THE TICKET, stated once. The Access gate is configured
    // and would refuse this request — `fetch` is not even stubbed, so a JWKS
    // lookup would throw rather than pass — and the caller reaches the builder
    // anyway, on a cookie.
    const { email, userId } = await aMember()
    await askForALink(email)
    const redeemed = await call(new URL(await mailedLink(userId)).pathname, { method: 'POST' })
    const cookie = cookieHeaderFrom(redeemed.headers.get('set-cookie') ?? '')

    const withCookie = await call('/', { headers: { cookie } })
    const without = await call('/')

    expect(withCookie.status).toBe(200)
    expect(await withCookie.text()).toContain('1st Contact builder')
    // And the same request without the cookie is refused by the gate, which is
    // what makes the first line a fact about the session rather than about a
    // deployment that had stopped checking anything.
    expect(without.status).toBe(401)
  })

  it('test_UAT_FC_REQ-202_access_still_admits_when_there_is_no_session', async () => {
    // ACCESS STAYS ([[CHAT-39]]). It is the operator's own route in and the way
    // back if this path breaks — a second SUPPORTED producer, not a legacy mode.
    stubJwks()
    const { email } = await aMember()

    const response = await call('/', { headers: { 'cf-access-jwt-assertion': await mint(email) } })

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('1st Contact builder')
  })

  it('test_UAT_FC_REQ-202_signing_out_ends_the_session_and_clears_the_cookie', async () => {
    const { email, userId } = await aMember()
    await askForALink(email)
    const redeemed = await call(new URL(await mailedLink(userId)).pathname, { method: 'POST' })
    const cookie = cookieHeaderFrom(redeemed.headers.get('set-cookie') ?? '')

    const out = await call(SIGN_OUT_PATH, { method: 'POST', headers: { cookie } })

    expect(out.status).toBe(303)
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0')
    // BOTH HALVES. Clearing the cookie without ending the row would leave a live
    // credential in whatever else is holding it.
    expect(await sessionIdentity(workerEnv(), PLATFORM, cookie)).toBeNull()
  })

  it('test_UAT_FC_REQ-202_a_stale_cookie_falls_through_to_access_rather_than_locking_anyone_out', async () => {
    // A cookie that resolves to nobody is not an admission AND NOT A REFUSAL.
    // Refusing here would make a stale cookie in some browser a lockout from a
    // builder Access would have let its holder into.
    stubJwks()
    const { email } = await aMember()

    const response = await call('/', {
      headers: {
        cookie: `${COOKIE_NAME}=a-session-that-was-never-minted`,
        'cf-access-jwt-assertion': await mint(email),
      },
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('1st Contact builder')
  })
})

describe('REQ-202 — the invite carries a token', () => {
  it('test_UAT_FC_REQ-202_an_invites_cta_url_is_a_redeemable_link_and_never_the_bare_origin', async () => {
    // THE SECOND SURFACE THIS TICKET FILLS. `ctaUrl` was `new URL(request.url).origin`
    // — the bare front door — because there was no token to build a link from, so
    // the invitee met Cloudflare Access and its own one-time-PIN email. Driven
    // through the real route, with a real owner, against real D1.
    stubJwks()
    const owner = await aMember()
    const invitee = await addContact(identityEnv(), { businessId: owner.businessId }, {
      email: anEmail(),
    })

    const response = await call('/api/people/invite', {
      method: 'POST',
      headers: {
        'cf-access-jwt-assertion': await mint(owner.email),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ids: [invitee.person.id] }),
    })
    expect(response.status).toBe(200)
    const { results } = (await response.json()) as { results: Array<{ status: string }> }
    expect(results[0].status).toBe('sent')

    const link = await mailedLink(invitee.person.id, owner.businessId)
    expect(link).not.toBe(ORIGIN)
    expect(link.startsWith(`${ORIGIN}${SIGN_IN_PATH}/`)).toBe(true)

    // AND IT IS REDEEMABLE — which is the half a URL-shape assertion cannot make.
    // Thirty days rather than thirty minutes, because an invite may sit unread
    // over a holiday.
    const row = await tokenRow(tokenOf(link))
    expect(row?.purpose).toBe('invite')
    expect(row?.subject_id).toBe(invitee.person.id)
    expect(Date.parse(row!.expires_at) - Date.now()).toBeGreaterThan(20 * 24 * 60 * 60_000)
  })
})

// ── small readers, kept out of the cases ─────────────────────────────────────

async function primaryOf(userId: string): Promise<string | null> {
  const row = await env.DB.prepare(
    'SELECT email FROM user_emails WHERE user_id = ? ORDER BY is_primary DESC LIMIT 1',
  )
    .bind(userId)
    .first<{ email: string }>()
  return row?.email ?? null
}

async function tokenCountFor(subjectId: string): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_tokens WHERE subject_id = ?')
    .bind(subjectId)
    .first<{ n: number }>()
  return row?.n ?? 0
}
