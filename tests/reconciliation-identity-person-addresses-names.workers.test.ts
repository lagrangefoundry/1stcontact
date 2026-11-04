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
import { peopleOf, type Person } from '../apps/control-app/src/people'
import { PERSON_INVITE_PATH } from '../apps/control-app/src/router'
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
 *  - AC-2171 a re-invite neither restamps nor supersedes an existing name.
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
