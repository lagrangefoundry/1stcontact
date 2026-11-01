import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  ensurePlatformOperator,
  findAccount,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { invitePerson, openGrant } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PEOPLE_PATH, PERSON_DETAIL_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * story-0034d937 — **the Contacts tab, at the origin.**
 *
 * The half of the story the browser cannot prove: who is in the list, that a
 * person across the business barrier is indistinguishable from nobody, and that
 * a grant names its business. Every case drives the deployed `fetch` inside
 * workerd, against a real D1 with the deployed migrations and a real RS256
 * Access token verified against a stubbed JWKS — the JWKS fetch being the only
 * external boundary. Rows are written by shipped entry points (`inviteAccount`,
 * `invitePerson`, `openGrant`); the uninvited contact is a direct `users` insert
 * because nothing shipped writes a bare contact yet (the CRM capture is its
 * eventual writer). The browser half is the jsdom sibling.
 */

const PLATFORM = 'contacts-platform'
const TEAM = 'https://contacts-team.cloudflareaccess.com'
const AUD = 'c'.repeat(64)

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
  const header = { alg: 'RS256', kid: 'contacts-key', typ: 'JWT' }
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
const anEmail = (): string => `contacts-${(seq += 1)}@example.test`
/** Real time between seeds, so `created_at` orders them without a millisecond tie. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

async function anAccount(email: string, name: string) {
  const seeded = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id)
  return seeded
}

async function anOperator(email: string) {
  await ensurePlatformOperator(identityEnv(), email)
  const account = await findAccount(identityEnv(), email)
  if (!account) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), account.id)
  return account
}

/** A contact: known to a business and never invited. */
async function addContact(tenantId: string, email: string): Promise<string> {
  const id = `usr_contact_${(seq += 1)}`
  const now = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, tenantId, email, 'active', now, now)
    .run()
  return id
}

const get = (token: string, businessId: string, pathAndQuery: string): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/b/${encodeURIComponent(businessId)}${pathAndQuery}`, {
      headers: { 'cf-access-jwt-assertion': token },
    }),
    workerEnv(),
  )

type Listed = { id: string; email: string; createdAt: string; lastSeenAt: string | null }

async function listOf(token: string, businessId: string): Promise<Listed[]> {
  const response = await get(token, businessId, PEOPLE_PATH)
  expect(response.status).toBe(200)
  return (await response.json<{ people: Listed[] }>()).people
}

async function idsInTenant(tenantId: string): Promise<string[]> {
  const { results } = await env.DB.prepare('SELECT id FROM users WHERE tenant_id = ?')
    .bind(tenantId)
    .all<{ id: string }>()
  return (results ?? []).map((r) => r.id).sort()
}

const isOrdered = (rows: Listed[]) =>
  rows.every((row, i) => i === 0 || rows[i - 1].createdAt <= row.createdAt)

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
  jwks = { keys: [{ ...jwk, kid: 'contacts-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-0034d937 — the list is the scoped business, for every business', () => {
  it('test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    await tick()
    const ownerEmail = anEmail()
    const customer = await anAccount(ownerEmail, "Alice's Plumbing")
    await tick()
    const platformContact = anEmail()
    await addContact(PLATFORM, platformContact)
    await tick()
    const bob = anEmail()
    await invitePerson(identityEnv(), { businessId: customer.businessId }, { email: bob })
    await tick()
    const customerContact = anEmail()
    await addContact(customer.businessId, customerContact)

    const operator = await mint(operatorEmail)

    // The 1st Contact business: exactly its own rows, the contact included, oldest first.
    const ours = await listOf(operator, PLATFORM)
    expect(ours.map((p) => p.id).sort()).toEqual(await idsInTenant(PLATFORM))
    expect(isOrdered(ours)).toBe(true)
    const ourEmails = ours.map((p) => p.email)
    expect(ourEmails).toContain(platformContact)
    expect(ourEmails.indexOf(operatorEmail)).toBeLessThan(ourEmails.indexOf(ownerEmail))
    expect(ourEmails.indexOf(ownerEmail)).toBeLessThan(ourEmails.indexOf(platformContact))
    expect(ourEmails).not.toContain(bob)
    expect(ourEmails).not.toContain(customerContact)

    // The same request scoped to the customer's business: theirs, and none of ours.
    const theirs = await listOf(operator, customer.businessId)
    expect(theirs.map((p) => p.id).sort()).toEqual(await idsInTenant(customer.businessId))
    expect(theirs.map((p) => p.email)).toEqual([bob, customerContact])
    for (const email of ourEmails) expect(theirs.map((p) => p.email)).not.toContain(email)

    // On the same terms for the customer's own owner — no branch on which business it is.
    const asOwner = await listOf(await mint(ownerEmail), customer.businessId)
    expect(asOwner.map((p) => p.id)).toEqual(theirs.map((p) => p.id))

    // A sign-in moves nobody.
    const before = ours.map((p) => p.id)
    const signedIn = await admit(identityEnv(), ownerEmail)
    expect(signedIn.ok).toBe(true)
    const after = await listOf(operator, PLATFORM)
    expect(after.find((p) => p.email === ownerEmail)!.lastSeenAt).toBeTruthy()
    expect(after.map((p) => p.id)).toEqual(before)
  })
})

describe('story-0034d937 — the business barrier', () => {
  it('test_UAT_AC2181_detail_across_the_barrier_is_the_same_404_as_an_id_that_does_not_exist', async () => {
    stubJwks()
    const aliceEmail = anEmail()
    const alice = await anAccount(aliceEmail, 'Business A')
    const bob = anEmail()
    const invited = await invitePerson(identityEnv(), { businessId: alice.businessId }, { email: bob })
    // Alice herself is a row of 1st Contact's (business B), not of her own.
    const elsewhere = alice.user.id
    const token = await mint(aliceEmail)

    const across = await get(token, alice.businessId, `${PERSON_DETAIL_PATH}?id=${elsewhere}`)
    const nobody = await get(token, alice.businessId, `${PERSON_DETAIL_PATH}?id=usr_no_such_person`)
    expect(across.status).toBe(404)
    expect(nobody.status).toBe(404)
    const acrossBody = await across.text()
    const nobodyBody = await nobody.text()
    expect(acrossBody).toBe(nobodyBody)
    expect(JSON.parse(acrossBody)).toEqual({ error: 'No such person in this business.' })

    const own = await get(token, alice.businessId, `${PERSON_DETAIL_PATH}?id=${invited.person.id}`)
    expect(own.status).toBe(200)
    const detail = await own.json<{ person: { id: string; email: string } }>()
    expect(detail.person.id).toBe(invited.person.id)
    expect(detail.person.email).toBe(bob)
  })
})

describe('story-0034d937 — every grant names its business', () => {
  it('test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id', async () => {
    stubJwks()
    const operatorEmail = anEmail()
    await anOperator(operatorEmail)
    const holder = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Holder Ltd' })
    const other = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Somebody Else Ltd' })
    const gone = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Gone Ltd' })

    await openGrant(identityEnv(), { businessId: other.businessId, accountId: holder.user.id, plan: 'support' })
    await openGrant(identityEnv(), { businessId: gone.businessId, accountId: holder.user.id, plan: 'pro' })
    await env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(gone.businessId).run()

    const response = await get(
      await mint(operatorEmail),
      PLATFORM,
      `${PERSON_DETAIL_PATH}?id=${holder.user.id}`,
    )
    expect(response.status).toBe(200)
    const detail = await response.json<{
      operates: Array<{ businessId: string }>
      grants: Array<{ businessId: string; businessName: string | null; plan: string }>
    }>()

    // A grant on a business they do not run carries that business's name.
    const stray = detail.grants.find((g) => g.businessId === other.businessId)!
    expect(stray.businessName).toBe('Somebody Else Ltd')
    expect(detail.operates.some((b) => b.businessId === other.businessId)).toBe(false)

    // A grant whose business row is gone is still listed, with a null name.
    const dangling = detail.grants.find((g) => g.businessId === gone.businessId)
    expect(dangling, 'the grant on a vanished business was dropped').toBeTruthy()
    expect(dangling!.businessName).toBeNull()
    expect(dangling!.plan).toBe('pro')
  })
})
