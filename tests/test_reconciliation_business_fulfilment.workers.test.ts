import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  ensurePlatformOperator,
  findAccount,
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { invitePerson } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { ADMIN_BUSINESSES_PATH, BUSINESSES_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * **Business Fulfilment: only the operator adds a business, and a business
 * arrives whole** (story-387c9dfe — AC-2149 … AC-2157).
 *
 * Every case drives the worker's own `fetch` inside workerd, against a real D1
 * with the deployed schema and a real RS256 Access token verified against a
 * stubbed JWKS — the only external boundary. Admission is resolved in
 * `index.ts` ahead of routing, so these prove the wiring as well as the route.
 * Success is read back through `admit`, which is what the product reads.
 *
 * The gate is *owner of the 1st Contact business* ([[REQ-185]]), so the operator
 * is seeded through `ensurePlatformOperator` — the path `PLATFORM_ADMINS` takes —
 * and an account through the `inviteAccount` fixture, which is the two shipped
 * calls (`invitePerson` then `provisionBusiness`) in order ([[REQ-186]]).
 */

const PLATFORM = 'recon-fulfil-platform'
const TEAM = 'https://recon-fulfil-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)
const KID = 'recon-fulfil-key'

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
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
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
const anEmail = (): string => `recon-fulfil-${(seq += 1)}@example.test`

/** An invitee who has accepted the terms — fully admitted. */
async function customer(email: string, accountName: string) {
  const result = await inviteAccount(identityEnv(), { email, accountName, endsAt: null })
  await acceptTerms(identityEnv(), result.user.id)
  return result
}

/** An owner of the 1st Contact business — what the fulfilment gate asks for. */
async function operator(email: string) {
  await ensurePlatformOperator(identityEnv(), email)
  const account = await findAccount(identityEnv(), email)
  if (!account) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), account.id)
  return account
}

const addBusiness = async (token: string | null, body: unknown, over: Partial<Env> = {}) =>
  worker.fetch(
    new Request(`https://app.example${ADMIN_BUSINESSES_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'cf-access-jwt-assertion': token } : {}),
      },
      body: JSON.stringify(body),
    }),
    workerEnv(over),
  )

const businessCount = async (email: string): Promise<number> => {
  const result = await admit(identityEnv(), email)
  return result.ok ? result.businesses.length : 0
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
  jwks = { keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('Business Fulfilment — the operator adds a business, nobody else can', () => {
  it('test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created', async () => {
    stubJwks()
    const email = anEmail()
    await customer(email, 'Salon')

    const response = await addBusiness(await mint(email), { accountEmail: email, name: 'Studio' })

    expect(response.status).toBe(404)
    expect(await businessCount(email)).toBe(1)

    // Holding the hosting column without owning the 1st Contact business is
    // refused too: `platform_operator` does not open the fulfilment gate.
    const hosting = anEmail()
    await customer(hosting, 'Bakery')
    await env.DB.prepare('UPDATE users SET platform_operator = 1 WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, hosting)
      .run()
    const own = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM memberships m JOIN users u ON u.id = m.user_id ' +
        'WHERE u.email = ? AND m.business_id = ?',
    )
      .bind(hosting, PLATFORM)
      .first<{ n: number }>()
    expect(own?.n).toBe(0)

    const refused = await addBusiness(await mint(hosting), { accountEmail: hosting, name: 'Studio' })
    expect(refused.status).toBe(404)
    expect(await businessCount(hosting)).toBe(1)
  })

  it('test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business', async () => {
    stubJwks()
    const email = anEmail()
    await customer(email, 'Salon')

    const response = await addBusiness(await mint(email), { accountEmail: email, name: 'Studio' })
    const body = await response.text()

    expect(response.status).toBe(404)
    expect(body).toContain('Not found.')
    expect(body.toLowerCase()).not.toContain('admin')
    expect(body.toLowerCase()).not.toContain('business')
  })

  it('test_UAT_AC2151_loopback_dev_open_door_cannot_add_a_business', async () => {
    const email = anEmail()
    const response = await addBusiness(
      null,
      { accountEmail: email, name: 'Studio' },
      { ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '', ACCESS_DEV_OPEN: '1' },
    )

    expect(response.status).toBe(404)
    // Nothing was provisioned for the named address.
    expect(await businessCount(email)).toBe(0)
  })

  it('test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable', async () => {
    stubJwks()
    const owner = anEmail()
    const op = anEmail()
    await customer(owner, 'Salon')
    await operator(op)

    const response = await addBusiness(await mint(op), { accountEmail: owner, name: 'Studio', endsAt: null })
    expect(response.status).toBe(200)
    const created = (await response.json()) as { businessId: string; name: string; siteSlug: string }
    expect(created.name).toBe('Studio')
    expect(created.businessId).toBeTruthy()
    expect(created.siteSlug).toBeTruthy()

    const result = await admit(identityEnv(), owner)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.businesses.map((b) => b.name).sort()).toEqual(['Salon', 'Studio'])
    const added = result.businesses.find((b) => b.businessId === created.businessId)
    expect(added?.selectable).toBe(true)
    expect(added?.lapse).toBeNull()
  })

  it('test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation', async () => {
    stubJwks()
    const owner = anEmail()
    const op = anEmail()
    const invited = await customer(owner, 'Salon')
    await operator(op)

    const response = await addBusiness(await mint(op), { accountEmail: owner, name: 'Studio', endsAt: null })
    expect(response.status).toBe(200)
    const created = (await response.json()) as { businessId: string; siteSlug: string }

    const business = await env.DB.prepare('SELECT name, status FROM tenants WHERE id = ?')
      .bind(created.businessId)
      .first<{ name: string; status: string }>()
    expect(business).toEqual({ name: 'Studio', status: 'active' })

    const membership = await env.DB.prepare(
      'SELECT role, status FROM memberships WHERE user_id = ? AND business_id = ?',
    )
      .bind(invited.user.id, created.businessId)
      .first<{ role: string; status: string }>()
    expect(membership).toEqual({ role: 'owner', status: 'active' })

    const grant = await env.DB.prepare('SELECT status, granted_by FROM entitlements WHERE business_id = ?')
      .bind(created.businessId)
      .first<{ status: string; granted_by: string | null }>()
    expect(grant?.status).toBe('active')
    expect(grant?.granted_by).toBe(op)

    expect(created.siteSlug).toBe(created.businessId)
  })

  it('test_UAT_AC2154_creating_an_account_provisions_its_first_business', async () => {
    // The invite makes the person and nothing else: on its own it leaves an
    // account with no business, which the door refuses as `no_membership`.
    const email = anEmail()
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email, displayName: null })
    const bare = await admit(identityEnv(), email)
    expect(bare.ok === false && bare.reason).toBe('no_membership')

    // Provisioning the first business is the second step, and afterwards the
    // account is admitted with exactly that one business, under its name.
    const result = await provisionBusiness(identityEnv(), {
      accountUserId: invited.person.id,
      name: 'Salon',
      email,
      endsAt: null,
    })

    expect(result.businessId).toBeTruthy()
    const business = await env.DB.prepare('SELECT name FROM tenants WHERE id = ?')
      .bind(result.businessId)
      .first<{ name: string }>()
    expect(business?.name).toBe('Salon')
    const admitted = await admit(identityEnv(), email)
    expect(admitted.ok).toBe(true)
    if (!admitted.ok) return
    expect(admitted.businesses.map((b) => b.businessId)).toEqual([result.businessId])
  })

  it('test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404', async () => {
    stubJwks()
    const op = anEmail()
    await operator(op)

    const response = await addBusiness(await mint(op), {
      accountEmail: 'recon-fulfil-never-invited@example.test',
      name: 'Studio',
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'No account with that email address.' })
  })

  it('test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400', async () => {
    stubJwks()
    const op = anEmail()
    await operator(op)
    const token = await mint(op)
    const before = await businessCount(op)

    for (const body of [{ accountEmail: op }, { name: 'Studio' }, { accountEmail: op, name: '   ' }]) {
      const response = await addBusiness(token, body)
      expect(response.status, JSON.stringify(body)).toBe(400)
      const error = ((await response.json()) as { error: string }).error
      expect(error).toContain('accountEmail and name are required')
    }
    expect(await businessCount(op)).toBe(before)
  })

  it('test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses', async () => {
    stubJwks()
    const email = anEmail()
    await customer(email, 'Salon')

    const response = await worker.fetch(
      new Request(`https://app.example${BUSINESSES_PATH}`, {
        headers: { 'cf-access-jwt-assertion': await mint(email) },
      }),
      workerEnv(),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>

    expect(Object.keys(body).sort()).toEqual(['account', 'businesses'])
  })
})
