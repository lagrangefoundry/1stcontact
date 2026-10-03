import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms, TERMS_ACCEPT_PATH, TERMS_VERSION } from '../apps/control-app/src/terms'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import {
  BUSINESSES_PATH,
  PEOPLE_PATH,
  PERSON_ADD_PATH,
  PERSON_DELEGATE_PATH,
  PERSON_DELEGATE_REVOKE_PATH,
  PERSON_DETAIL_PATH,
} from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * REQ-369 — **an owner delegates their business, end to end, through the
 * deployed Worker.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `worker.fetch` inside workerd,
 * against a real D1 with the deployed schema. The owner arrives on a real RS256
 * Access token; the delegate arrives on the link that was actually MAILED —
 * read out of the recorded message and redeemed for a session cookie — which is
 * the only way a delegate ever gets in.
 *
 * THE CLAIMS:
 *   1. Make delegate resolves the contact's address to a PLATFORM user (creating
 *      one, or attaching to the account that address already signs into),
 *      writes a `delegate` membership, and mails one message from the
 *      `delegate` template naming the business.
 *   2. The delegate signs in, accepts the terms, and gets a starter business of
 *      their own BESIDE the delegated one; the selector reports each with its
 *      role and whether it is live.
 *   3. A delegate runs the business (adds a contact) and cannot manage
 *      delegates.
 *   4. The refusals: a delegate delegating, no primary address, already an owner.
 *   5. Revoke keeps the row, removes the business from the selector and refuses
 *      a request naming it; re-inviting reinstates the same row.
 *
 * NO MAIL CREDENTIAL IS CONFIGURED, so `mailerFor` returns the adapter that
 * records and delivers nothing ([[REQ-196]]).
 */

const PLATFORM = 'req369-platform'
const TEAM = 'https://req369-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)
const ORIGIN = 'https://app.example'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

const identityEnv = (): IdentityEnv => ({
  DB: env.DB as D1Database,
  SITES: env.SITES as R2Bucket,
  TENANT_ID: PLATFORM,
})

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    MAIL_FROM: 'no-reply@example.test',
    SESSION_COOKIE_NAME: 'session',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req369-key', typ: 'JWT' }
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

/** How a request authenticates: an Access token (the owner) or a session cookie (the delegate). */
type Auth = { token: string } | { cookie: string }
const authHeaders = (auth: Auth): Record<string, string> =>
  'token' in auth ? { 'cf-access-jwt-assertion': auth.token } : { cookie: auth.cookie }

const at = (businessId: string | null, path: string) =>
  `${ORIGIN}${businessId ? `/b/${businessId}` : ''}${path}`

function post(auth: Auth, path: string, body: unknown, businessId: string | null = null) {
  return worker.fetch(
    new Request(at(businessId, path), {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders(auth) },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )
}

function get(auth: Auth, path: string, businessId: string | null = null) {
  return worker.fetch(new Request(at(businessId, path), { headers: authHeaders(auth) }), workerEnv())
}

let seq = 0
const anEmail = (): string => `req369-${(seq += 1)}@example.test`

/** An owner with a business of their own, signed up — setup, not a claim. */
async function anOwner(name: string) {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id)
  return { email, businessId: seeded.businessId, auth: { token: await mint(email) } as Auth }
}

/** Add a contact to the owner's business through the tab's own route. */
async function addTo(owner: { auth: Auth; businessId: string }, email: string, displayName = 'Dee Legate') {
  const res = await post(owner.auth, PERSON_ADD_PATH, { email, displayName }, owner.businessId)
  expect(res.status).toBe(200)
  return (await res.json<{ person: { id: string } }>()).person.id
}

const storeOf = (businessId: string) =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId })

/** The link that was MAILED to this contact, read from the recorded message. */
async function mailedLink(businessId: string, contactId: string): Promise<string> {
  const messages = await messagesFor(await storeOf(businessId), contactId)
  const match = /https:\/\/[^"\s<]*\/sign-in\/[A-Za-z0-9_-]+/.exec(messages[0]?.body ?? '')
  expect(match, 'no sign-in link in the delegate invitation').not.toBeNull()
  return match![0]
}

/** Follow the mailed link the way a browser does, and keep the cookie. */
async function signInWith(link: string): Promise<Auth> {
  const redeemed = await worker.fetch(
    new Request(`${ORIGIN}${new URL(link).pathname}`, { method: 'POST' }),
    workerEnv(),
  )
  expect(redeemed.status).toBe(303)
  return { cookie: (redeemed.headers.get('set-cookie') ?? '').split(';')[0] }
}

async function platformUserOf(email: string) {
  return env.DB.prepare(
    'SELECT u.id AS id, u.account_id AS account_id FROM users u JOIN user_emails e ON e.user_id = u.id ' +
      'WHERE u.tenant_id = ? AND e.email = ?',
  )
    .bind(PLATFORM, email)
    .first<{ id: string; account_id: string }>()
}

async function membershipOf(userId: string, businessId: string) {
  return env.DB.prepare(
    'SELECT id, role, status, revoked_at, granted_at FROM memberships WHERE user_id = ? AND business_id = ?',
  )
    .bind(userId, businessId)
    .first<{ id: string; role: string; status: string; revoked_at: string | null; granted_at: string }>()
}

type Listed = { id: string; name: string; role?: string | null; live?: boolean; selectable: boolean }
async function selectorOf(auth: Auth): Promise<Listed[]> {
  const res = await get(auth, BUSINESSES_PATH)
  expect(res.status).toBe(200)
  return (await res.json<{ businesses: Listed[] }>()).businesses
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
  jwks = { keys: [{ ...jwk, kid: 'req369-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-369 — Make delegate, then sign in as the delegate', () => {
  it('test_UAT_FC_REQ-369_make_delegate_creates_a_platform_user_a_delegate_membership_and_one_invitation', async () => {
    stubJwks()
    const owner = await anOwner('Alice Plumbing')
    const address = anEmail()
    const contactId = await addTo(owner, address)
    expect(await platformUserOf(address), 'nobody signs in at that address yet').toBeNull()

    const res = await post(owner.auth, PERSON_DELEGATE_PATH, { id: contactId }, owner.businessId)
    expect(res.status).toBe(200)
    const { result } = await res.json<{ result: { status: string; to: string; delegate: { status: string } } }>()
    expect(result.to).toBe(address)
    expect(result.delegate.status).toBe('active')

    // THE MEMBERSHIP HANGS OFF A PLATFORM USER, not the contact row.
    const user = await platformUserOf(address)
    expect(user, 'no platform user was created for the delegate').not.toBeNull()
    expect(user!.id).not.toBe(contactId)
    const membership = await membershipOf(user!.id, owner.businessId)
    expect(membership?.role).toBe('delegate')
    expect(membership?.revoked_at).toBeNull()

    // ONE MESSAGE, recorded against the CONTACT, from the delegate template,
    // naming the business and carrying a sign-in link.
    const messages = await messagesFor(await storeOf(owner.businessId), contactId)
    expect(messages).toHaveLength(1)
    expect(messages[0].templateKey).toBe('delegate')
    expect(messages[0].to).toBe(address)
    expect(messages[0].subject).toContain('Alice Plumbing')
    expect(messages[0].body).toContain('Alice Plumbing')

    // THE OWNER'S LIST BADGES THEM, and the pane says where they stand.
    const list = await (await get(owner.auth, PEOPLE_PATH, owner.businessId)).json<{
      canDelegate: boolean
      canInvite: boolean
      delegates: string[]
    }>()
    expect(list.canDelegate).toBe(true)
    expect(list.delegates).toContain(contactId)
    const detail = await (
      await get(owner.auth, `${PERSON_DETAIL_PATH}?id=${contactId}`, owner.businessId)
    ).json<{ delegate: { status: string } | null }>()
    expect(detail.delegate?.status).toBe('active')
  })

  it('test_UAT_FC_REQ-369_the_delegate_signs_in_gets_their_own_starter_business_and_sees_both_marked', async () => {
    stubJwks()
    const owner = await anOwner('Bob Bakery')
    const address = anEmail()
    const contactId = await addTo(owner, address)
    await post(owner.auth, PERSON_DELEGATE_PATH, { id: contactId }, owner.businessId)

    // THE OWNER'S BUSINESS IS PUBLISHED: one revision on its starter site.
    const site = await env.DB.prepare('SELECT id FROM sites WHERE tenant_id = ?')
      .bind(owner.businessId)
      .first<{ id: string }>()
    await env.DB.prepare(
      "INSERT INTO site_revisions (site_id, id, published_at, changes, sha) VALUES (?, 1, ?, '{}', 'x')",
    )
      .bind(site!.id, new Date().toISOString())
      .run()

    const delegate = await signInWith(await mailedLink(owner.businessId, contactId))
    const accepted = await post(delegate, TERMS_ACCEPT_PATH, { version: TERMS_VERSION })
    expect(accepted.status).toBe(204)

    const listed = await selectorOf(delegate)
    const delegated = listed.find((b) => b.id === owner.businessId)
    const own = listed.filter((b) => b.id !== owner.businessId)
    expect(delegated, 'the delegated business is not in the selector').toBeTruthy()
    expect(delegated!.role).toBe('delegate')
    expect(delegated!.live).toBe(true)
    expect(delegated!.selectable).toBe(true)
    // EVERYONE GETS A STARTER BUSINESS, DELEGATES INCLUDED, owned by their own
    // account — not the owner's.
    expect(own).toHaveLength(1)
    expect(own[0].role).toBe('owner')
    expect(own[0].live).toBe(false)
    const user = await platformUserOf(address)
    const ownedBy = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
      .bind(own[0].id)
      .first<{ owner_account_id: string }>()
    expect(ownedBy?.owner_account_id).toBe(user!.account_id)
  })

  it('test_UAT_FC_REQ-369_a_delegate_runs_the_business_but_cannot_manage_delegates', async () => {
    stubJwks()
    const owner = await anOwner('Carol Cafe')
    const address = anEmail()
    const contactId = await addTo(owner, address)
    await post(owner.auth, PERSON_DELEGATE_PATH, { id: contactId }, owner.businessId)
    const delegate = await signInWith(await mailedLink(owner.businessId, contactId))
    await post(delegate, TERMS_ACCEPT_PATH, { version: TERMS_VERSION })

    // RUNNING THE BUSINESS: adding a contact is open to a delegate.
    const added = await post(delegate, PERSON_ADD_PATH, { email: anEmail() }, owner.businessId)
    expect(added.status).toBe(200)
    const list = await (await get(delegate, PEOPLE_PATH, owner.businessId)).json<{
      canInvite: boolean
      canDelegate: boolean
    }>()
    expect(list.canInvite).toBe(true)
    expect(list.canDelegate).toBe(false)

    // DELEGATION MANAGEMENT IS NOT: neither appointing nor revoking.
    const other = await addTo(owner, anEmail())
    const appoint = await post(delegate, PERSON_DELEGATE_PATH, { id: other }, owner.businessId)
    expect(appoint.status).toBe(403)
    const revoke = await post(delegate, PERSON_DELEGATE_REVOKE_PATH, { id: contactId }, owner.businessId)
    expect(revoke.status).toBe(403)
    expect((await membershipOf((await platformUserOf(address))!.id, owner.businessId))?.revoked_at).toBeNull()
  })

  it('test_UAT_FC_REQ-369_an_address_that_already_signs_in_attaches_to_that_account', async () => {
    stubJwks()
    const owner = await anOwner('Dan Dental')
    const existing = await anOwner('Existing Co')
    const before = await platformUserOf(existing.email)
    const contactId = await addTo(owner, existing.email)

    const res = await post(owner.auth, PERSON_DELEGATE_PATH, { id: contactId }, owner.businessId)
    expect(res.status).toBe(200)
    const after = await platformUserOf(existing.email)
    // NO SECOND PERSON: the membership is on the account they already have.
    expect(after!.id).toBe(before!.id)
    expect((await membershipOf(before!.id, owner.businessId))?.role).toBe('delegate')
    // And their own selector now lists it, beside their own business.
    const listed = await selectorOf(existing.auth)
    expect(listed.find((b) => b.id === owner.businessId)?.role).toBe('delegate')
    expect(listed.find((b) => b.id === existing.businessId)?.role).toBe('owner')
  })
})

describe('REQ-369 — refusals', () => {
  it('test_UAT_FC_REQ-369_a_contact_with_no_primary_address_is_refused_and_nothing_is_written', async () => {
    stubJwks()
    const owner = await anOwner('Eve Electric')
    const address = anEmail()
    const contactId = await addTo(owner, address)
    await env.DB.prepare('UPDATE user_emails SET is_primary = 0 WHERE user_id = ?').bind(contactId).run()

    const res = await post(owner.auth, PERSON_DELEGATE_PATH, { id: contactId }, owner.businessId)
    expect(res.status).toBe(409)
    expect((await res.json<{ error: string }>()).error).toMatch(/no primary address/i)
    expect(await platformUserOf(address)).toBeNull()
    expect(await messagesFor(await storeOf(owner.businessId), contactId)).toEqual([])
  })

  it('test_UAT_FC_REQ-369_an_owner_of_the_business_cannot_be_made_its_delegate', async () => {
    stubJwks()
    const owner = await anOwner('Fay Florist')
    const self = await addTo(owner, owner.email)
    const res = await post(owner.auth, PERSON_DELEGATE_PATH, { id: self }, owner.businessId)
    expect(res.status).toBe(409)
    expect((await res.json<{ error: string }>()).error).toMatch(/already own/i)
    const user = await platformUserOf(owner.email)
    expect((await membershipOf(user!.id, owner.businessId))?.role).toBe('owner')
  })

  it('test_UAT_FC_REQ-369_an_unknown_contact_is_not_found', async () => {
    stubJwks()
    const owner = await anOwner('Gus Garage')
    const res = await post(owner.auth, PERSON_DELEGATE_PATH, { id: 'usr_nobody' }, owner.businessId)
    expect(res.status).toBe(404)
  })
})

describe('REQ-369 — revoke', () => {
  it('test_UAT_FC_REQ-369_revoke_keeps_the_row_removes_the_business_and_reinviting_reinstates_it', async () => {
    stubJwks()
    const owner = await anOwner('Hal Hardware')
    const address = anEmail()
    const contactId = await addTo(owner, address)
    await post(owner.auth, PERSON_DELEGATE_PATH, { id: contactId }, owner.businessId)
    const delegate = await signInWith(await mailedLink(owner.businessId, contactId))
    await post(delegate, TERMS_ACCEPT_PATH, { version: TERMS_VERSION })
    const user = (await platformUserOf(address))!
    const granted = await membershipOf(user.id, owner.businessId)

    const res = await post(owner.auth, PERSON_DELEGATE_REVOKE_PATH, { id: contactId }, owner.businessId)
    expect(res.status).toBe(200)

    // THE ROW IS KEPT, stamped.
    const revoked = await membershipOf(user.id, owner.businessId)
    expect(revoked?.id).toBe(granted?.id)
    expect(revoked?.role).toBe('delegate')
    expect(revoked?.revoked_at).not.toBeNull()
    // GONE FROM THE SELECTOR, and refused when named.
    expect((await selectorOf(delegate)).map((b) => b.id)).not.toContain(owner.businessId)
    expect((await get(delegate, PEOPLE_PATH, owner.businessId)).status).not.toBe(200)
    // THE OWNER'S LIST NO LONGER BADGES THEM, and the pane says they were one.
    const list = await (await get(owner.auth, PEOPLE_PATH, owner.businessId)).json<{ delegates: string[] }>()
    expect(list.delegates).not.toContain(contactId)
    const detail = await (
      await get(owner.auth, `${PERSON_DETAIL_PATH}?id=${contactId}`, owner.businessId)
    ).json<{ delegate: { status: string } | null }>()
    expect(detail.delegate?.status).toBe('revoked')

    // REVOKING AGAIN IS REFUSED rather than reported as a change.
    const again = await post(owner.auth, PERSON_DELEGATE_REVOKE_PATH, { id: contactId }, owner.businessId)
    expect(again.status).toBe(409)

    // RE-INVITING REINSTATES THE SAME ROW.
    const reinvite = await post(owner.auth, PERSON_DELEGATE_PATH, { id: contactId }, owner.businessId)
    expect(reinvite.status).toBe(200)
    const back = await membershipOf(user.id, owner.businessId)
    expect(back?.id).toBe(granted?.id)
    expect(back?.revoked_at).toBeNull()
    expect((await selectorOf(delegate)).map((b) => b.id)).toContain(owner.businessId)
  })
})
