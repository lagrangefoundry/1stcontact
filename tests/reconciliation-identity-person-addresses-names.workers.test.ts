import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  emailsOf,
  ensurePlatformOperator,
  newId,
  provisionBusiness,
  userEmailInsert,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { peopleOf, personDetail, type Person } from '../apps/control-app/src/people'
import { currentNameOf, formerNamesOf } from '../apps/control-app/src/names'
import {
  ADMIN_BUSINESSES_PATH,
  PEOPLE_PATH,
  PERSON_INVITE_PATH,
  PERSON_RECORD_PATH,
  PERSON_STATUS_PATH,
} from '../apps/control-app/src/router'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * STORY-7b1025b8 — *the invite provisions the account, login binds it*, as
 * reshaped by BUNDLE-37: a person's addresses are a table ([[REQ-191]]) and a
 * person's name is a superseding row ([[REQ-193]]).
 *
 * Covers the criteria this bundle adds or restates:
 *  - AC-2247 the person record carries no address; addresses are rows, casefolded,
 *    at most one primary, one person per address per business;
 *  - AC-2248 admission and the invite resolve a person through any address;
 *  - AC-1744 case/padding are the same person, with the schema enforcing it;
 *  - AC-2171 a re-invite neither restamps nor supersedes an existing name;
 *  - AC-2249 correcting the address rewrites the primary row and moves no key;
 *  - AC-2251 a name is a superseding row, corrected unless marked changed;
 *  - AC-2252 (the route half) clearing every part leaves no name, and clearing
 *    the displayed name while a part remains is refused.
 *
 * EVIDENCE. workerd against real D1 with the deployed baseline. Invites go
 * through the Worker's own `fetch` with a real RS256 Access token verified
 * against a stubbed JWKS (the one external boundary). Constraints are proved by
 * the database refusing the write; rows are read back out of D1.
 */

const PLATFORM = 'story7b1025b8-b37-platform'
const TEAM = 'https://story7b1025b8-b37-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)
const KID = 'story7b1025b8-b37-key'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(tenantId = PLATFORM): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
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

let seq = 0
const anEmail = (): string => `story7b1025b8-b37-${(seq += 1)}@example.test`

interface InviteBody {
  created: boolean
  person: Person
}

async function postInvite(
  token: string,
  body: Record<string, unknown>,
  businessId: string,
): Promise<{ status: number; body: InviteBody }> {
  const response = await worker.fetch(
    new Request(`https://app.example/b/${businessId}${PERSON_INVITE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )
  const status = response.status
  const text = await response.text()
  expect(status, `invite refused: ${text}`).toBe(200)
  return { status, body: JSON.parse(text) as InviteBody }
}

/** An owner of the 1st Contact business, seeded the way production seeds one. */
async function anOperatorToken(): Promise<string> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const [personId] = await peopleAt(PLATFORM, email)
  if (!personId) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), personId)
  return mint(email)
}

/** An owner of a customer business, and that business. */
async function aCustomerOwner(): Promise<{ token: string; businessId: string }> {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, accountName: 'Customer Co', endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id)
  return { token: await mint(email), businessId: seeded.businessId }
}

async function accountIdOf(userId: string): Promise<string> {
  const row = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
    .bind(userId)
    .first<{ account_id: string }>()
  if (!row) throw new Error(`no person ${userId}`)
  return row.account_id
}

/** Every person the business holds at an address, through the address table. */
async function peopleAt(tenantId: string, email: string): Promise<string[]> {
  const { results } = await env.DB.prepare(
    'SELECT DISTINCT user_id FROM user_emails WHERE tenant_id = ? AND email = ?',
  )
    .bind(tenantId, email)
    .all<{ user_id: string }>()
  return (results ?? []).map((r) => r.user_id)
}

async function countPeople(tenantId: string): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE tenant_id = ?')
    .bind(tenantId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

async function invitedAtOf(userId: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT invited_at FROM users WHERE id = ?')
    .bind(userId)
    .first<{ invited_at: string | null }>()
  return row?.invited_at ?? null
}

/** The record editor's route, as the Contacts pane posts to it. */
async function postRecord(token: string, body: Record<string, unknown>, businessId: string): Promise<Response> {
  return worker.fetch(
    new Request(`https://app.example/b/${businessId}${PERSON_RECORD_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )
}

/** Everything that names a person: their key, memberships, grants and current name. */
async function footprint(userId: string): Promise<Record<string, unknown>> {
  const user = await env.DB.prepare('SELECT id, tenant_id, account_id FROM users WHERE id = ?')
    .bind(userId)
    .first<Record<string, unknown>>()
  const memberships = await env.DB.prepare(
    'SELECT id, user_id, business_id, role FROM memberships WHERE user_id = ? ORDER BY id',
  )
    .bind(userId)
    .all<Record<string, unknown>>()
  const grants = await env.DB.prepare(
    'SELECT e.id, e.business_id, e.account_id FROM entitlements e ' +
      'JOIN memberships m ON m.business_id = e.business_id WHERE m.user_id = ? ORDER BY e.id',
  )
    .bind(userId)
    .all<Record<string, unknown>>()
  const name = await env.DB.prepare(
    'SELECT id, user_id, display_name FROM user_names WHERE user_id = ? AND superseded_at IS NULL',
  )
    .bind(userId)
    .first<Record<string, unknown>>()
  return { user, memberships: memberships.results ?? [], grants: grants.results ?? [], name }
}

/** Every name row a person has held, superseded ones first in supersession order. */
async function nameHistoryOf(userId: string) {
  const { results } = await env.DB.prepare(
    'SELECT id, display_name, superseded_at, superseded_reason FROM user_names ' +
      'WHERE user_id = ? ORDER BY superseded_at IS NULL ASC, superseded_at ASC, id ASC',
  )
    .bind(userId)
    .all<{ id: string; display_name: string; superseded_at: string | null; superseded_reason: string | null }>()
  return results ?? []
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
  vi.restoreAllMocks()
  resetJwksCache()
})

describe('a person and their addresses', () => {
  it('test_UAT_AC2247_the_person_carries_no_address_and_addresses_are_casefolded_rows_with_at_most_one_primary', async () => {
    stubJwks()
    const token = await anOperatorToken()

    // The person record carries no address column — asked of the database.
    const { results: columns } = await env.DB.prepare('PRAGMA table_info(users)').all<{ name: string }>()
    expect((columns ?? []).map((c) => c.name)).not.toContain('email')

    // An invited person is written together with their first address, primary.
    const first = anEmail()
    const invited = await postInvite(token, { email: first }, PLATFORM)
    expect(invited.body.created).toBe(true)
    const personId = invited.body.person.id
    let held = await emailsOf(identityEnv(), personId)
    expect(held.map((e) => [e.email, e.is_primary])).toEqual([[first, 1]])

    // A second address is a second row beside the first.
    const second = anEmail()
    await userEmailInsert(identityEnv(), { userId: personId, tenantId: PLATFORM, email: second, primary: false }).run()
    held = await emailsOf(identityEnv(), personId)
    expect(held.map((e) => e.email).sort()).toEqual([first, second].sort())

    // The schema refuses a second primary for the same person.
    await expect(
      env.DB.prepare('UPDATE user_emails SET is_primary = 1 WHERE user_id = ? AND email = ?')
        .bind(personId, second)
        .run(),
    ).rejects.toThrow(/UNIQUE constraint failed/i)
    held = await emailsOf(identityEnv(), personId)
    expect(held.filter((e) => e.is_primary === 1).map((e) => e.email)).toEqual([first])

    // Every surface showing one address shows the primary.
    const listed = (await peopleOf(identityEnv(), { businessId: PLATFORM })).find((p) => p.id === personId)
    expect(listed?.email).toBe(first)

    // …and it is the PRIMARY that is shown, not the oldest: move the flag to the
    // newer address and every one-address surface follows it.
    await env.DB.batch([
      env.DB.prepare('UPDATE user_emails SET is_primary = 0 WHERE user_id = ? AND email = ?').bind(personId, first),
      env.DB.prepare('UPDATE user_emails SET is_primary = 1 WHERE user_id = ? AND email = ?').bind(personId, second),
    ])
    const relisted = (await peopleOf(identityEnv(), { businessId: PLATFORM })).find((p) => p.id === personId)
    expect(relisted?.email).toBe(second)
    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, personId)
    expect(detail?.person.email).toBe(second)
    expect(detail?.emails[0]?.email).toBe(second)
    expect(detail?.emails[0]?.isPrimary).toBe(true)
    expect(detail?.emails.map((e) => e.email)).toEqual([second, first])
    await provisionBusiness(identityEnv(), { accountId: await accountIdOf(personId), name: 'Primary Moved Co' })
    for (const address of [first, second]) {
      const admitted = await admit(identityEnv(), address)
      expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
      expect(admitted.ok && admitted.user.id).toBe(personId)
      expect(admitted.ok && admitted.user.email).toBe(second)
    }

    // Within one business an address reaches exactly one person.
    const rival = await postInvite(token, { email: anEmail() }, PLATFORM)
    await expect(
      userEmailInsert(identityEnv(), {
        userId: rival.body.person.id,
        tenantId: PLATFORM,
        email: first,
        primary: false,
      }).run(),
    ).rejects.toThrow(/UNIQUE constraint failed/i)
    expect(await peopleAt(PLATFORM, first)).toEqual([personId])

    // The same address in another business is an unrelated person there.
    const owner = await aCustomerOwner()
    const there = await postInvite(owner.token, { email: first }, owner.businessId)
    expect(there.body.created).toBe(true)
    expect(there.body.person.id).not.toBe(personId)
    expect(await peopleAt(owner.businessId, first)).toEqual([there.body.person.id])
    expect(await peopleAt(PLATFORM, first)).toEqual([personId])
  })

  it('test_UAT_AC2179_the_contacts_list_route_carries_the_primary_address_not_the_oldest', async () => {
    // The server half of the Contacts list row: the address `/api/people` hands
    // the panel for a person holding two addresses is the one flagged primary,
    // even when that is the NEWER address.
    stubJwks()
    const owner = await aCustomerOwner()
    const older = anEmail()
    const invited = await postInvite(owner.token, { email: older }, owner.businessId)
    expect(invited.body.created).toBe(true)
    const personId = invited.body.person.id
    const newer = anEmail()
    await userEmailInsert(identityEnv(), {
      userId: personId,
      tenantId: owner.businessId,
      email: newer,
      primary: false,
    }).run()
    await env.DB.batch([
      env.DB.prepare('UPDATE user_emails SET is_primary = 0 WHERE user_id = ? AND email = ?').bind(personId, older),
      env.DB.prepare('UPDATE user_emails SET is_primary = 1 WHERE user_id = ? AND email = ?').bind(personId, newer),
    ])

    const response = await worker.fetch(
      new Request(`https://app.example/b/${owner.businessId}${PEOPLE_PATH}`, {
        headers: { 'cf-access-jwt-assertion': owner.token },
      }),
      workerEnv(),
    )
    expect(response.status).toBe(200)
    const listed = (await response.json()) as { people: Array<{ id: string; email: string }> }
    const row = listed.people.find((p) => p.id === personId)
    expect(row?.email).toBe(newer)
    expect(row?.email).not.toBe(older)
  })

  it('test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates', async () => {
    // RUNTIME EVIDENCE that the role is read by the ownership question and by
    // nothing else: a membership carrying a role the product never writes
    // (`staff`) is an ordinary member everywhere except at the owner-only routes.
    stubJwks()
    const operatorToken = await anOperatorToken() // the platform business exists
    const owner = await aCustomerOwner()
    const staffEmail = anEmail()
    const staff = await inviteAccount(identityEnv(), { email: staffEmail, accountName: 'Staff Own Co', endsAt: null })
    await acceptTerms(identityEnv(), staff.user.id)
    const now = new Date().toISOString()
    for (const businessId of [owner.businessId, PLATFORM]) {
      await env.DB.prepare(
        'INSERT INTO memberships (id, user_id, business_id, role, status, granted_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
        .bind(newId('mem'), staff.user.id, businessId, 'staff', 'active', now)
        .run()
    }
    const staffToken = await mint(staffEmail)
    const at = (businessId: string, path: string, init: RequestInit = {}, token = staffToken) =>
      worker.fetch(
        new Request(`https://app.example/b/${businessId}${path}`, {
          ...init,
          headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
        }),
        workerEnv(),
      )

    // Admitted, with the business in their list and selectable, carrying `staff`.
    const admitted = await admit(identityEnv(), staffEmail)
    expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
    const membership = admitted.ok ? admitted.businesses.find((b) => b.businessId === owner.businessId) : undefined
    expect(membership?.role).toBe('staff')
    expect(membership?.selectable).toBe(true)

    // A real contact in the owner's business, put there through the product path,
    // so the list comparison below compares something and the refusals have a target.
    const contact = await postInvite(owner.token, { email: anEmail(), displayName: 'Kept Name' }, owner.businessId)
    expect(contact.body.created).toBe(true)
    const contactId = contact.body.person.id
    const stateOf = async () =>
      env.DB.prepare(
        'SELECT u.status AS status, n.display_name AS displayName FROM users u ' +
          'LEFT JOIN user_names n ON n.user_id = u.id AND n.superseded_at IS NULL WHERE u.id = ?',
      )
        .bind(contactId)
        .first<{ status: string; displayName: string | null }>()
    const contactBefore = await stateOf()
    expect(contactBefore?.displayName).toBe('Kept Name')

    // Business-scoped reads behave exactly as they do for the owner.
    const ownerList = await at(owner.businessId, PEOPLE_PATH, {}, owner.token)
    const staffList = await at(owner.businessId, PEOPLE_PATH)
    expect(ownerList.status).toBe(200)
    expect(staffList.status).toBe(200)
    const ownerPeople = (await ownerList.json()) as { people: Array<{ id: string }>; canInvite: boolean }
    const staffPeople = (await staffList.json()) as { people: Array<{ id: string }>; canInvite: boolean }
    expect(ownerPeople.people.length).toBeGreaterThan(0)
    expect(ownerPeople.people.map((p) => p.id)).toContain(contactId)
    expect(staffPeople.people.map((p) => p.id)).toContain(contactId)
    expect(staffPeople.people.map((p) => p.id)).toEqual(ownerPeople.people.map((p) => p.id))
    // … and the ownership question is the one thing that differs.
    expect(ownerPeople.canInvite).toBe(true)
    expect(staffPeople.canInvite).toBe(false)

    // Refused at the owner-gated routes: invite, record edit, sign-in status.
    const target = contactId
    const before = await countPeople(owner.businessId)
    const invite = await at(owner.businessId, PERSON_INVITE_PATH, {
      method: 'POST',
      body: JSON.stringify({ email: anEmail() }),
    })
    expect(invite.status).toBe(403)
    expect(await countPeople(owner.businessId)).toBe(before)
    const record = await at(owner.businessId, PERSON_RECORD_PATH, {
      method: 'POST',
      body: JSON.stringify({ id: target, displayName: 'Not Allowed' }),
    })
    expect(record.status).toBe(403)
    const status = await at(owner.businessId, PERSON_STATUS_PATH, {
      method: 'POST',
      body: JSON.stringify({ id: target, status: 'suspended' }),
    })
    expect(status.status).toBe(403)
    // Neither refusal wrote anything: the target's name and status are unchanged.
    const contactAfter = await stateOf()
    expect(contactAfter?.displayName).toBe('Kept Name')
    expect(contactAfter?.status).toBe(contactBefore?.status)
    expect(contactAfter?.status).not.toBe('suspended')

    // The owner passes the same invite gate.
    const ownerInvite = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
    expect(ownerInvite.status).toBe(200)

    // Add-a-business: a `staff` member of the 1st Contact business is refused
    // (404, the admin route's answer), where an owner of it is let through.
    const addAsStaff = await worker.fetch(
      new Request(`https://app.example${ADMIN_BUSINESSES_PATH}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': staffToken },
        body: JSON.stringify({ accountEmail: staffEmail, name: 'Should Not Exist' }),
      }),
      workerEnv(),
    )
    expect(addAsStaff.status).toBe(404)
    const addAsOwner = await worker.fetch(
      new Request(`https://app.example${ADMIN_BUSINESSES_PATH}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': operatorToken },
        body: JSON.stringify({}),
      }),
      workerEnv(),
    )
    expect(addAsOwner.status).toBe(400)
  })

  it('test_UAT_AC2248_admission_and_the_invite_resolve_a_person_through_any_of_their_addresses', async () => {
    stubJwks()
    const token = await anOperatorToken()
    const primary = anEmail()
    const secondary = anEmail()

    const invited = await postInvite(token, { email: primary }, PLATFORM)
    const personId = invited.body.person.id
    await userEmailInsert(identityEnv(), { userId: personId, tenantId: PLATFORM, email: secondary, primary: false }).run()

    // Inviting the secondary address reaches the same person and writes nothing new.
    const before = await countPeople(PLATFORM)
    const again = await postInvite(token, { email: secondary }, PLATFORM)
    expect(again.body.created).toBe(false)
    expect(again.body.person.id).toBe(personId)
    expect(await countPeople(PLATFORM)).toBe(before)
    expect(await peopleAt(PLATFORM, primary)).toEqual([personId])
    expect(await peopleAt(PLATFORM, secondary)).toEqual([personId])
    expect(await emailsOf(identityEnv(), personId)).toHaveLength(2)

    // A login at the secondary address is that person, carrying the primary.
    await provisionBusiness(identityEnv(), { accountId: await accountIdOf(personId), name: 'Secondary Co' })
    const admitted = await admit(identityEnv(), secondary)
    expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
    expect(admitted.ok && admitted.user.id).toBe(personId)
    expect(admitted.ok && admitted.user.email).toBe(primary)
  })

  it('test_UAT_AC1744_case_and_padding_are_the_same_person_at_the_invite_route_and_at_login_with_the_schema_casefolding', async () => {
    stubJwks()
    const token = await anOperatorToken()
    const email = anEmail()
    const typed = `  ${email.replace('story', 'StOrY').replace('example', 'EXAMPLE')}  `

    const first = await postInvite(token, { email: typed }, PLATFORM)
    expect(first.body.created).toBe(true)
    const personId = first.body.person.id
    const stored = await emailsOf(identityEnv(), personId)
    expect(stored.map((e) => e.email)).toEqual([email])

    // The schema refuses an address not already casefolded and trimmed.
    const now = new Date().toISOString()
    await expect(
      env.DB.prepare(
        'INSERT INTO user_emails (id, user_id, tenant_id, email, is_primary, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, 0, ?, ?)',
      )
        .bind(newId('eml'), personId, PLATFORM, `Mixed-${email}`.replace('mixed', 'MIXED'), now, now)
        .run(),
    ).rejects.toThrow(/CHECK constraint failed/i)

    const again = await postInvite(token, { email: email.toUpperCase() }, PLATFORM)
    expect(again.body.created).toBe(false)
    expect(again.body.person.id).toBe(personId)
    expect(await peopleAt(PLATFORM, email)).toEqual([personId])

    await provisionBusiness(identityEnv(), { accountId: await accountIdOf(personId), name: 'Cased Co' })
    const admitted = await admit(identityEnv(), ` ${email.toUpperCase()} `)
    expect(admitted.ok, `refused: ${!admitted.ok ? admitted.reason : ''}`).toBe(true)
    expect(admitted.ok && admitted.user.id).toBe(personId)
  })
})

describe('a re-invite', () => {
  it('test_UAT_AC2171_a_re_invite_does_not_restamp_and_never_supersedes_an_existing_current_name', async () => {
    stubJwks()
    const owner = await aCustomerOwner()
    const email = anEmail()

    const first = await postInvite(owner.token, { email }, owner.businessId)
    expect(first.body.person.name).toBeNull()
    const personId = first.body.person.id
    const stamp = await invitedAtOf(personId)
    expect(stamp).toBeTruthy()

    const second = await postInvite(owner.token, { email, displayName: 'Bob Smith' }, owner.businessId)
    expect(second.body.created).toBe(false)
    expect(second.body.person.id).toBe(personId)
    expect(await invitedAtOf(personId), 'a re-invite restamped the invitation').toBe(stamp)
    expect(second.body.person.name?.displayName).toBe('Bob Smith')

    const third = await postInvite(owner.token, { email, displayName: 'Robert Smith' }, owner.businessId)
    expect(third.body.created).toBe(false)
    expect(await invitedAtOf(personId)).toBe(stamp)
    expect(third.body.person.name?.displayName, 'the invite superseded an existing name').toBe('Bob Smith')

    const { results } = await env.DB.prepare(
      'SELECT display_name, superseded_at FROM user_names WHERE user_id = ?',
    )
      .bind(personId)
      .all<{ display_name: string; superseded_at: string | null }>()
    expect(results).toEqual([{ display_name: 'Bob Smith', superseded_at: null }])
  })
})

describe('correcting an address', () => {
  it('test_UAT_AC2249_correcting_the_address_rewrites_the_primary_row_and_neither_that_nor_repriming_moves_a_key', async () => {
    stubJwks()
    const token = await anOperatorToken()
    const first = anEmail()
    const second = anEmail()
    const corrected = anEmail()

    // A person with a business of their own, a name, and a second address.
    const invited = await postInvite(token, { email: first, displayName: 'Casey Typo' }, PLATFORM)
    const personId = invited.body.person.id
    await provisionBusiness(identityEnv(), { accountId: await accountIdOf(personId), name: 'Correction Co' })
    await userEmailInsert(identityEnv(), { userId: personId, tenantId: PLATFORM, email: second, primary: false }).run()
    const before = await footprint(personId)
    expect((before.memberships as unknown[]).length).toBeGreaterThan(0)
    expect(before.name).not.toBeNull()

    // The owner corrects the address through the record route.
    const response = await postRecord(token, { id: personId, email: `  ${corrected.toUpperCase()} ` }, PLATFORM)
    expect(response.status, await response.clone().text()).toBe(200)

    // The primary row was rewritten in place: still two addresses, the new one primary.
    const held = await emailsOf(identityEnv(), personId)
    expect(held).toHaveLength(2)
    expect(held.filter((e) => e.is_primary === 1).map((e) => e.email)).toEqual([corrected])
    expect(held.map((e) => e.email).sort()).toEqual([corrected, second].sort())

    // The old address reaches nobody; the new one admits the same person.
    const atOld = await admit(identityEnv(), first)
    expect(atOld.ok).toBe(false)
    const atNew = await admit(identityEnv(), corrected)
    expect(atNew.ok, `refused: ${!atNew.ok ? atNew.reason : ''}`).toBe(true)
    expect(atNew.ok && atNew.user.id).toBe(personId)

    // Nothing that names the person moved.
    expect(await footprint(personId)).toEqual(before)

    // A person holding no address at all gains the corrected one, as primary.
    const bare = await postInvite(token, { email: anEmail() }, PLATFORM)
    const bareId = bare.body.person.id
    await env.DB.prepare('DELETE FROM user_emails WHERE user_id = ?').bind(bareId).run()
    expect(await emailsOf(identityEnv(), bareId)).toEqual([])
    const given = anEmail()
    const gave = await postRecord(token, { id: bareId, email: given }, PLATFORM)
    expect(gave.status, await gave.clone().text()).toBe(200)
    const gained = await emailsOf(identityEnv(), bareId)
    expect(gained.map((e) => [e.email, e.is_primary])).toEqual([[given, 1]])

    // Swapping which address is primary moves no key either, and both still resolve.
    await env.DB.prepare('UPDATE user_emails SET is_primary = 0 WHERE user_id = ?').bind(personId).run()
    await env.DB.prepare('UPDATE user_emails SET is_primary = 1 WHERE user_id = ? AND email = ?')
      .bind(personId, second)
      .run()
    expect(await footprint(personId)).toEqual(before)
    for (const address of [corrected, second]) {
      const admitted = await admit(identityEnv(), address)
      expect(admitted.ok && admitted.user.id, address).toBe(personId)
    }
    expect(await peopleAt(PLATFORM, corrected)).toEqual([personId])
    expect(await peopleAt(PLATFORM, second)).toEqual([personId])
  })
})

describe('a name is a row that is superseded, never updated', () => {
  it('test_UAT_AC2251_a_name_is_superseded_as_corrected_unless_marked_changed_and_only_changed_former_names_reach_the_client', async () => {
    stubJwks()
    const owner = await aCustomerOwner()
    const contact = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
    const personId = contact.body.person.id

    // The person record carries no name column.
    const { results: columns } = await env.DB.prepare('PRAGMA table_info(users)').all<{ name: string }>()
    expect((columns ?? []).map((c) => c.name)).not.toContain('display_name')

    // A first name, with every optional part, arrives flat and is stored as authored.
    const named = await postRecord(
      owner.token,
      {
        id: personId,
        displayName: 'Sarah Jonse',
        knownAs: 'Sal',
        title: 'Dr',
        givenName: 'Sarah',
        middleNames: 'Anne',
        familyName: 'Jonse',
        suffix: 'PhD',
      },
      owner.businessId,
    )
    expect(named.status, await named.clone().text()).toBe(200)
    expect(await currentNameOf(identityEnv(), personId)).toMatchObject({
      displayName: 'Sarah Jonse',
      knownAs: 'Sal',
      title: 'Dr',
      givenName: 'Sarah',
      middleNames: 'Anne',
      familyName: 'Jonse',
      suffix: 'PhD',
    })

    // Corrected with no reason, then changed with reason `changed`, then resubmitted unchanged.
    for (const body of [
      { id: personId, displayName: 'Sarah Jones', familyName: 'Jones' },
      { id: personId, displayName: 'Sarah Patel', familyName: 'Patel', nameReason: 'changed' },
      { id: personId, displayName: 'Sarah Patel' },
    ]) {
      const response = await postRecord(owner.token, body, owner.businessId)
      expect(response.status, await response.clone().text()).toBe(200)
    }

    const history = await nameHistoryOf(personId)
    expect(history, 'the unchanged submission wrote a row').toHaveLength(3)
    expect(history.filter((r) => r.superseded_at === null).map((r) => r.display_name)).toEqual(['Sarah Patel'])
    const reasonOf = new Map(history.map((r) => [r.display_name, r.superseded_reason]))
    expect(reasonOf.get('Sarah Jonse')).toBe('corrected')
    expect(reasonOf.get('Sarah Jones')).toBe('changed')
    // A patch carried the parts it did not name forward.
    expect((await currentNameOf(identityEnv(), personId))?.knownAs).toBe('Sal')

    // The schema refuses a second current row.
    const now = new Date().toISOString()
    await expect(
      env.DB.prepare(
        'INSERT INTO user_names (id, user_id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(`nam_ac2251_smuggled_${seq}`, personId, 'Smuggled', now, now)
        .run(),
    ).rejects.toThrow(/UNIQUE constraint failed/i)

    // Only the former name that was a genuine change reaches the client.
    expect(await formerNamesOf(identityEnv(), personId)).toEqual(['Sarah Jones'])
    const listed = (await peopleOf(identityEnv(), { businessId: owner.businessId })).find((p) => p.id === personId)
    expect(listed?.formerNames).toEqual(['Sarah Jones'])
    const detail = await personDetail(identityEnv(), { businessId: owner.businessId }, personId)
    expect(detail?.person.formerNames).toEqual(['Sarah Jones'])

    // A reason the route does not recognise is recorded as a correction.
    const odd = await postRecord(
      owner.token,
      { id: personId, displayName: 'Sarah Okonkwo', nameReason: 'whatever' },
      owner.businessId,
    )
    expect(odd.status, await odd.clone().text()).toBe(200)
    const after = await nameHistoryOf(personId)
    expect(after.find((r) => r.display_name === 'Sarah Patel')?.superseded_reason).toBe('corrected')
    expect(await formerNamesOf(identityEnv(), personId)).toEqual(['Sarah Jones'])

    // A mononym — a displayed name and nothing else — is a complete name.
    const prince = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
    const mono = await postRecord(owner.token, { id: prince.body.person.id, displayName: 'Prince' }, owner.businessId)
    expect(mono.status, await mono.clone().text()).toBe(200)
    expect(await currentNameOf(identityEnv(), prince.body.person.id)).toMatchObject({
      displayName: 'Prince',
      knownAs: null,
      title: null,
      givenName: null,
      middleNames: null,
      familyName: null,
      suffix: null,
    })
  })

  it('test_UAT_AC2252_clearing_every_part_through_the_route_leaves_no_name_and_clearing_only_the_displayed_name_is_refused', async () => {
    stubJwks()
    const owner = await aCustomerOwner()
    const contact = await postInvite(owner.token, { email: anEmail() }, owner.businessId)
    const personId = contact.body.person.id
    const set = await postRecord(
      owner.token,
      { id: personId, displayName: 'Robert Smith', knownAs: 'Bob' },
      owner.businessId,
    )
    expect(set.status, await set.clone().text()).toBe(200)

    // Clearing the displayed name while Known as remains is refused with a sentence.
    const refused = await postRecord(owner.token, { id: personId, displayName: '' }, owner.businessId)
    expect(refused.status).toBe(400)
    expect(((await refused.json()) as { error: string }).error).toMatch(/needs something to show/i)
    expect((await currentNameOf(identityEnv(), personId))?.displayName).toBe('Robert Smith')

    // Clearing every part leaves the person with no current name.
    const cleared = await postRecord(owner.token, { id: personId, knownAs: '', displayName: '' }, owner.businessId)
    expect(cleared.status, await cleared.clone().text()).toBe(200)
    expect(await currentNameOf(identityEnv(), personId)).toBeNull()
    const listed = (await peopleOf(identityEnv(), { businessId: owner.businessId })).find((p) => p.id === personId)
    expect(listed?.name).toBeNull()
  })
})
