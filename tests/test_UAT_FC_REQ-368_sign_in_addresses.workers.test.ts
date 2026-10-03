import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { acceptTerms, TERMS_VERSION } from '../apps/control-app/src/terms'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { SIGN_IN_ADDRESSES_PATH } from '../apps/control-app/src/router'
import { sessionIdentity, SIGN_IN_PATH } from '../apps/control-app/src/sessions'
import { ADDRESS_UNAVAILABLE, type SignInAddress } from '../apps/control-app/src/sign-in-addresses'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-368]] — **the addresses a person signs in with, managed from the profile
 * portal**, end to end through the Worker's own `fetch` against real D1.
 *
 * Every link is read out of the RECORDED MESSAGE and redeemed by POST, exactly
 * as a browser does — so "validated" here is the stamp a real sign-in leaves,
 * not a row a fixture wrote. Each case is one rule of the ticket: the happy
 * path, and each refusal the ticket names.
 */

const PLATFORM = 'req368-platform'
const HOST = 'app.req368.test'
const ORIGIN = `https://${HOST}`
const FROM = 'no-reply@req368.test'
const TEAM = 'https://req368-team.cloudflareaccess.com'
const AUD = 'a'.repeat(64)

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
    SESSION_COOKIE_NAME: 'session',
    SESSION_COOKIE_DOMAIN: 'req368.test',
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

/** A real Access token, signed by the key the stubbed JWKS publishes. */
async function accessToken(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req368-key', typ: 'JWT' }
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

function call(path: string, init: RequestInit = {}) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, init), workerEnv())
}

let seq = 0
const anEmail = (): string => `req368-${(seq += 1)}@example.test`

/** A 1st Contact account that has accepted the terms — and has never signed in. */
async function aMember(): Promise<{ email: string; userId: string }> {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id, TERMS_VERSION)
  return { email, userId: seeded.user.id }
}

/**
 * Ask for a link at `address`, read it out of the recorded message, and redeem
 * it. Returns the `Cookie` header the browser would send from then on.
 */
async function signInThrough(userId: string, address: string): Promise<string> {
  await call(SIGN_IN_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: address }),
  })
  const store = await ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: PLATFORM },
  )
  const sent = (await messagesFor(store, userId)).filter((m) => m.to === address)
  expect(sent.length, `no link was mailed to ${address}`).toBe(1)
  const link = /https:\/\/[^"\s<]*\/sign-in\/[A-Za-z0-9_-]+/.exec(sent[0].body)
  expect(link).not.toBeNull()
  const redeemed = await call(new URL(link![0]).pathname, { method: 'POST' })
  expect(redeemed.status).toBe(303)
  return (redeemed.headers.get('set-cookie') ?? '').split(';')[0]
}

type Credential = { cookie: string } | { access: string }

function headersFor(who: Credential): Record<string, string> {
  return 'cookie' in who ? { cookie: who.cookie } : { 'cf-access-jwt-assertion': who.access }
}

async function listed(who: Credential): Promise<SignInAddress[]> {
  const response = await call(SIGN_IN_ADDRESSES_PATH, { headers: headersFor(who) })
  expect(response.status).toBe(200)
  return ((await response.json()) as { emails: SignInAddress[] }).emails
}

function change(who: Credential, body: Record<string, unknown>): Promise<Response> {
  return call(SIGN_IN_ADDRESSES_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headersFor(who) },
    body: JSON.stringify(body),
  })
}

const entry = (rows: SignInAddress[], email: string): SignInAddress => {
  const found = rows.find((row) => row.email === email)
  expect(found, `${email} is not on the list`).toBeDefined()
  return found!
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req368-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-368 — several addresses, one account', () => {
  it('test_UAT_FC_REQ-368_an_added_address_signs_into_the_same_account_and_is_validated_by_doing_so', async () => {
    const { email, userId } = await aMember()
    const me = { cookie: await signInThrough(userId, email) }

    // The address the person signed in through is listed, primary and validated.
    const before = await listed(me)
    expect(before).toHaveLength(1)
    expect(entry(before, email)).toMatchObject({ primary: true, validated: true })

    // ADDING DOES NOT VALIDATE. The new address is listed, not primary, and not
    // validated — so it may not be made primary yet.
    const second = anEmail()
    const added = await change(me, { action: 'add', email: second.toUpperCase() })
    expect(added.status).toBe(200)
    const afterAdd = ((await added.json()) as { emails: SignInAddress[] }).emails
    expect(entry(afterAdd, second)).toMatchObject({
      primary: false,
      validated: false,
      canMakePrimary: false,
    })

    // A link mailed to the new address signs into THE SAME account, and that
    // sign-in is what validates it.
    const viaSecond = await signInThrough(userId, second)
    const signedIn = await sessionIdentity(workerEnv(), PLATFORM, viaSecond)
    expect(signedIn?.subjectId).toBe(userId)
    expect(entry(await listed({ cookie: viaSecond }), second)).toMatchObject({
      validated: true,
      canMakePrimary: true,
      removable: true,
    })
  })

  it('test_UAT_FC_REQ-368_an_address_held_by_another_account_is_refused_without_saying_so', async () => {
    const other = await aMember()
    const { email, userId } = await aMember()
    const me = { cookie: await signInThrough(userId, email) }

    const refused = await change(me, { action: 'add', email: other.email })
    expect(refused.status).toBe(409)
    const message = ((await refused.json()) as { error: string }).error
    // THE WORDING IS THE ONE EVERY UNAVAILABLE ADDRESS GETS. It must not confirm
    // that some other account holds this address.
    expect(message).toBe(ADDRESS_UNAVAILABLE)
    expect(message).not.toMatch(/another|other account|already (in use|registered|taken)|exists/i)
    expect((await listed(me)).map((row) => row.email)).toEqual([email])

    // And the other account still signs in through it, unchanged.
    const held = await env.DB.prepare('SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, other.email)
      .first<{ user_id: string }>()
    expect(held?.user_id).toBe(other.userId)
  })
})

describe('REQ-368 — primary', () => {
  it('test_UAT_FC_REQ-368_a_validated_address_can_be_made_primary_and_the_old_one_then_removed', async () => {
    const { email, userId } = await aMember()
    const me = { cookie: await signInThrough(userId, email) }
    const second = anEmail()
    await change(me, { action: 'add', email: second })
    await signInThrough(userId, second)

    const promoted = await change(me, { action: 'primary', id: entry(await listed(me), second).id })
    expect(promoted.status).toBe(200)
    const rows = ((await promoted.json()) as { emails: SignInAddress[] }).emails
    expect(rows.filter((row) => row.primary).map((row) => row.email)).toEqual([second])

    // THE PRIMARY IS WHO YOU ARE SHOWN AS: the session now resolves to it.
    expect((await sessionIdentity(workerEnv(), PLATFORM, me.cookie))?.email).toBe(second)

    // The old primary is no longer primary, so it may now be removed.
    const old = entry(rows, email)
    expect(old.removable).toBe(true)
    const removed = await change(me, { action: 'remove', id: old.id })
    expect(removed.status).toBe(200)
    expect((await listed(me)).map((row) => row.email)).toEqual([second])
  })

  it('test_UAT_FC_REQ-368_an_unvalidated_address_cannot_be_made_primary', async () => {
    const { email, userId } = await aMember()
    const me = { cookie: await signInThrough(userId, email) }
    const second = anEmail()
    await change(me, { action: 'add', email: second })

    const refused = await change(me, { action: 'primary', id: entry(await listed(me), second).id })
    expect(refused.status).toBe(409)
    expect(((await refused.json()) as { error: string }).error).toMatch(/validated/i)
    expect(entry(await listed(me), email).primary).toBe(true)
  })

  it('test_UAT_FC_REQ-368_the_primary_cannot_be_removed_until_another_is_primary', async () => {
    const { email, userId } = await aMember()
    const me = { cookie: await signInThrough(userId, email) }
    const second = anEmail()
    await change(me, { action: 'add', email: second })
    await signInThrough(userId, second)

    // Two validated addresses, so only the primary rule stands in the way.
    const primary = entry(await listed(me), email)
    expect(primary.removable).toBe(false)
    const refused = await change(me, { action: 'remove', id: primary.id })
    expect(refused.status).toBe(409)
    expect(((await refused.json()) as { error: string }).error).toMatch(/primary/i)
    expect((await listed(me)).map((row) => row.email).sort()).toEqual([email, second].sort())
  })
})

describe('REQ-368 — at least one validated address is kept', () => {
  it('test_UAT_FC_REQ-368_the_last_validated_address_cannot_be_removed', async () => {
    // A primary that has never been validated — an account seen only through
    // Access — with one validated second address. The second is then the last
    // validated address, and is not primary, so only that rule protects it.
    stubJwks()
    const { email, userId } = await aMember()
    const viaAccess = { access: await accessToken(email) }
    const second = anEmail()
    expect((await change(viaAccess, { action: 'add', email: second })).status).toBe(200)
    await signInThrough(userId, second)

    const rows = await listed(viaAccess)
    expect(entry(rows, email)).toMatchObject({ primary: true, validated: false })
    const last = entry(rows, second)
    expect(last).toMatchObject({ validated: true, removable: false })

    const refused = await change(viaAccess, { action: 'remove', id: last.id })
    expect(refused.status).toBe(409)
    expect(((await refused.json()) as { error: string }).error).toMatch(/at least one validated/i)
    expect((await listed(viaAccess)).map((row) => row.email).sort()).toEqual([email, second].sort())
  })

  it('test_UAT_FC_REQ-368_an_unvalidated_address_can_be_removed', async () => {
    const { email, userId } = await aMember()
    const me = { cookie: await signInThrough(userId, email) }
    const second = anEmail()
    await change(me, { action: 'add', email: second })

    const removable = entry(await listed(me), second)
    expect(removable.removable).toBe(true)
    expect((await change(me, { action: 'remove', id: removable.id })).status).toBe(200)
    expect((await listed(me)).map((row) => row.email)).toEqual([email])
  })
})

describe('REQ-368 — only your own addresses', () => {
  it('test_UAT_FC_REQ-368_another_persons_address_cannot_be_removed_or_made_primary', async () => {
    const victim = await aMember()
    const victimCookie = await signInThrough(victim.userId, victim.email)
    const victimSecond = anEmail()
    await change({ cookie: victimCookie }, { action: 'add', email: victimSecond })
    const target = entry(await listed({ cookie: victimCookie }), victimSecond)

    const { email, userId } = await aMember()
    const me = { cookie: await signInThrough(userId, email) }
    expect((await change(me, { action: 'remove', id: target.id })).status).toBe(404)
    expect((await change(me, { action: 'primary', id: target.id })).status).toBe(404)
    expect(entry(await listed({ cookie: victimCookie }), victimSecond).id).toBe(target.id)
  })

  it('test_UAT_FC_REQ-368_nobody_signed_in_can_read_or_change_any_address', async () => {
    // Refused at the gate, before the route: there is no person to answer about.
    expect((await call(SIGN_IN_ADDRESSES_PATH)).status).toBe(401)
    const blind = await call(SIGN_IN_ADDRESSES_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'add', email: anEmail() }),
    })
    expect(blind.status).toBe(401)
  })
})
