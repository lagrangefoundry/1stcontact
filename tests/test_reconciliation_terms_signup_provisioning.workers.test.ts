import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  admit,
  ensurePlatformOperator,
  STARTER_HEADING,
  STARTER_SLUG,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { addContact, markInvited } from '../apps/control-app/src/people'
import { TERMS_ACCEPT_PATH, TERMS_PATH, TERMS_VERSION } from '../apps/control-app/src/terms'
import { UNNAMED_BUSINESS_NAME } from '../apps/control-app/src/onboarding'
import { SITE_TAB, TABS } from '../apps/control-app/src/builder/config.js'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'

/**
 * STORY-161 (story-0cd18650) — the two criteria BUNDLE-38 added for REQ-203:
 * accepting the terms is signing up (AC-2341), and accepting from `/terms`
 * itself lands in the builder root (AC-2342).
 *
 * WHAT MAKES THIS EVIDENCE. Every acceptance is the interstitial's own POST,
 * driven through the Worker's `fetch` inside workerd against a real D1 with the
 * deployed schema applied, carrying a real RS256 Access token verified against
 * a real JWKS. Contacts are made by the shipped `addContact` / `markInvited`, and
 * nothing seeds them a membership, an entitlement or a business. Every outcome
 * is counted back out of D1 or read through the site store's own handle.
 */

const PLATFORM = 'story0cd18650-b38-platform'
const TEAM = 'https://story0cd18650-b38-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)
const KID = 'story0cd18650-b38-key'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    // A recognisable body, so a fall-through to the asset handler is visible.
    ASSETS: { fetch: async () => new Response('ASSET-BYTES', { status: 200 }) } as unknown as Fetcher,
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

const NAVIGATION = { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }

async function call(
  path: string,
  email: string,
  init: RequestInit & { headers?: Record<string, string> } = {},
): Promise<Response> {
  const headers = { ...(init.headers ?? {}), 'cf-access-jwt-assertion': await mint(email) }
  return worker.fetch(new Request(`https://app.example${path}`, { ...init, headers }), workerEnv())
}

/** The POST the interstitial's own control makes. */
async function accept(email: string): Promise<Response> {
  return call(TERMS_ACCEPT_PATH, email, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version: TERMS_VERSION }),
  })
}

let seq = 0
const anEmail = (): string => `story0cd18650-b38-${(seq += 1)}@example.test`

interface Contact {
  email: string
  userId: string
  accountId: string
}

/** A contact of 1st Contact and nothing else: no membership, grant or business. */
async function aContact(options: { displayName?: string; invited?: boolean } = {}): Promise<Contact> {
  const email = anEmail()
  const made = await addContact(identityEnv(), { businessId: PLATFORM }, {
    email,
    displayName: options.displayName ?? null,
  })
  if (options.invited) await markInvited(identityEnv(), { businessId: PLATFORM }, made.person.id)
  const row = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
    .bind(made.person.id)
    .first<{ account_id: string }>()
  return { email, userId: made.person.id, accountId: row!.account_id }
}

async function businessesOwnedBy(accountId: string): Promise<{ id: string; name: string }[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, name FROM tenants WHERE owner_account_id = ? ORDER BY created_at, id',
  )
    .bind(accountId)
    .all<{ id: string; name: string }>()
  return results ?? []
}

async function tenantCount(): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM tenants').first<{ n: number }>()
  return row?.n ?? 0
}

async function accountCount(): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM accounts').first<{ n: number }>()
  return row?.n ?? 0
}

async function acceptance(userId: string): Promise<{ tos_version: string | null; tos_accepted_at: string | null }> {
  const row = await env.DB.prepare('SELECT tos_version, tos_accepted_at FROM users WHERE id = ?')
    .bind(userId)
    .first<{ tos_version: string | null; tos_accepted_at: string | null }>()
  return row ?? { tos_version: null, tos_accepted_at: null }
}

/** What a person accepted at the previous document looks like on the day the constant moves. */
async function bumpTerms(userId: string): Promise<void> {
  await env.DB.prepare('UPDATE users SET tos_version = ? WHERE id = ?').bind('2020-01-01', userId).run()
}

beforeAll(async () => {
  await applySchema()
  await d1r2SiteStore(identityEnv()).createTenant({ id: PLATFORM, name: '1st Contact' })
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
  resetJwksCache()
})

describe('accepting the terms is signing up', () => {
  it('test_UAT_AC2341_accepting_with_nothing_held_provisions_the_accounts_own_business_once_and_a_failed_provisioning_records_no_acceptance', async () => {
    stubJwks()

    // A NAMED, INVITED CONTACT HOLDING NOTHING accepts.
    const named = await aContact({ displayName: 'Sarah Jones', invited: true })
    expect(await businessesOwnedBy(named.accountId)).toEqual([])
    const accountsBefore = await accountCount()

    const first = await accept(named.email)
    expect(first.status).toBe(204)

    // No new account row; exactly one business, owned by the account they had,
    // named after them.
    expect(await accountCount(), 'an accounts row was written').toBe(accountsBefore)
    const owned = await businessesOwnedBy(named.accountId)
    expect(owned).toHaveLength(1)
    expect(owned[0].name).toBe('Sarah Jones')
    const businessId = owned[0].id

    // An owner membership for the person and an active, open-ended grant.
    const membership = await env.DB.prepare(
      'SELECT role, status FROM memberships WHERE user_id = ? AND business_id = ?',
    )
      .bind(named.userId, businessId)
      .first<{ role: string; status: string }>()
    expect(membership).toEqual({ role: 'owner', status: 'active' })
    const grant = await env.DB.prepare('SELECT status, ends_at FROM entitlements WHERE business_id = ?')
      .bind(businessId)
      .first<{ status: string; ends_at: string | null }>()
    expect(grant?.status).toBe('active')
    expect(grant?.ends_at).toBeNull()

    // A starter site that is servable at once, read through the store's own handle.
    const store = await d1r2SiteStore(identityEnv()).forTenant(businessId)
    expect(await store.hasDraft(STARTER_SLUG)).toBe(true)
    const pages = await store.readPages(STARTER_SLUG)
    expect(JSON.stringify(pages)).toContain(STARTER_HEADING)

    // The acceptance was recorded after it, and a fresh admission lists that one
    // business as selectable.
    expect((await acceptance(named.userId)).tos_version).toBe(TERMS_VERSION)
    const admitted = await admit(identityEnv(), named.email)
    expect(admitted.ok).toBe(true)
    if (admitted.ok) {
      expect(admitted.businesses.map((b) => [b.businessId, b.selectable])).toEqual([[businessId, true]])
    }

    // IDEMPOTENT: accepting again, and again after a terms bump, provisions nothing.
    expect((await accept(named.email)).status).toBe(204)
    expect(await businessesOwnedBy(named.accountId)).toEqual(owned)
    await bumpTerms(named.userId)
    expect((await accept(named.email)).status).toBe(204)
    expect(await businessesOwnedBy(named.accountId)).toEqual(owned)
    expect((await acceptance(named.userId)).tos_version).toBe(TERMS_VERSION)

    // A CONTACT WITH NO NAME gets the visibly provisional placeholder.
    const nameless = await aContact()
    expect((await accept(nameless.email)).status).toBe(204)
    const unnamed = await businessesOwnedBy(nameless.accountId)
    expect(unnamed.map((b) => b.name)).toEqual([UNNAMED_BUSINESS_NAME])
    expect(UNNAMED_BUSINESS_NAME).toBe('Unnamed business')

    // HOLDING A BUSINESS ALREADY MEANS NOTHING IS PROVISIONED — an operator
    // re-accepting bumped terms, whose platform business names no owner.
    const operatorEmail = anEmail()
    await ensurePlatformOperator(identityEnv(), operatorEmail)
    const operator = await env.DB.prepare(
      'SELECT u.id AS id, u.account_id AS account_id FROM users u ' +
        'JOIN user_emails e ON e.user_id = u.id WHERE e.email = ?',
    )
      .bind(operatorEmail)
      .first<{ id: string; account_id: string }>()
    expect((await accept(operatorEmail)).status).toBe(204)
    await bumpTerms(operator!.id)
    const tenantsBefore = await tenantCount()
    expect((await accept(operatorEmail)).status).toBe(204)
    expect(await tenantCount(), 'an operator was given a business').toBe(tenantsBefore)
    expect(await businessesOwnedBy(operator!.account_id)).toEqual([])

    // ...and a person holding a business owned by SOMEBODY ELSE's account.
    const owner = await inviteAccount(identityEnv(), { email: anEmail(), endsAt: null })
    const member = await aContact()
    await env.DB.prepare(
      'INSERT INTO memberships (id, user_id, business_id, role, status, granted_by, granted_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(`mem-story0cd18650-${seq}`, member.userId, owner.businessId, 'owner', 'active', null, new Date().toISOString())
      .run()
    const tenantsBeforeMember = await tenantCount()
    expect((await accept(member.email)).status).toBe(204)
    expect(await tenantCount(), 'a member of another account was given a business').toBe(tenantsBeforeMember)
    expect(await businessesOwnedBy(member.accountId)).toEqual([])

    // A FAILED PROVISIONING RECORDS NO ACCEPTANCE. The business's membership write
    // is made to fail at the database, for this one contact only.
    const failing = await aContact({ displayName: 'Provisioning Fails Ltd' })
    expect(failing.userId).toMatch(/^[A-Za-z0-9_-]+$/)
    await env.DB.prepare(
      'CREATE TRIGGER story0cd18650_fail_provision BEFORE INSERT ON memberships ' +
        `WHEN NEW.user_id = '${failing.userId}' BEGIN SELECT RAISE(ABORT, 'provisioning failed'); END`,
    ).run()
    try {
      const failed = await accept(failing.email).catch(() => null)
      expect(failed === null || failed.status >= 500, 'a failed provisioning answered success').toBe(true)
    } finally {
      await env.DB.prepare('DROP TRIGGER IF EXISTS story0cd18650_fail_provision').run()
    }
    expect(await acceptance(failing.userId)).toEqual({ tos_version: null, tos_accepted_at: null })
    expect(await businessesOwnedBy(failing.accountId)).toEqual([])
    // Still admitted, still served the interstitial...
    const stillAdmitted = await admit(identityEnv(), failing.email)
    expect(stillAdmitted.ok).toBe(true)
    if (stillAdmitted.ok) expect(stillAdmitted.businesses).toEqual([])
    const again = await call('/', failing.email, { headers: NAVIGATION })
    expect(again.status).toBe(200)
    expect(await again.text()).toContain('Terms of service')
    // ...and the next press retries and succeeds.
    expect((await accept(failing.email)).status).toBe(204)
    expect((await businessesOwnedBy(failing.accountId)).map((b) => b.name)).toEqual(['Provisioning Fails Ltd'])
    expect((await acceptance(failing.userId)).tos_version).toBe(TERMS_VERSION)
  })
})

describe('where accepting sends them', () => {
  it('test_UAT_AC2342_accepting_from_the_terms_path_goes_to_the_builder_root_and_elsewhere_reloads_the_requested_url', async () => {
    stubJwks()
    const contact = await aContact({ invited: true })

    // THE INTERSTITIAL AT A BUILDER URL, and the terms at `/terms`, both carry
    // the accept control whose success branch sends `/terms` to `/` and reloads
    // every other URL in place.
    const atBuilderUrl = await call('/', contact.email, { headers: NAVIGATION })
    expect(atBuilderUrl.status).toBe(200)
    const interstitial = await atBuilderUrl.text()
    const atTerms = await call(TERMS_PATH, contact.email, { headers: NAVIGATION })
    expect(atTerms.status).toBe(200)
    const termsPage = await atTerms.text()

    const successBranch =
      /if \(res\.ok\) \{\s*if \(location\.pathname === "\/terms"\) location\.assign\('\/'\)\s*else location\.reload\(\)\s*return\s*\}/
    for (const [label, page] of [
      ['interstitial at /', interstitial],
      ['/terms', termsPage],
    ] as const) {
      expect(page, label).toContain('id="accept"')
      expect(page, label).toContain(JSON.stringify(TERMS_ACCEPT_PATH))
      expect(page, `${label}: success does not route /terms to / and reload elsewhere`).toMatch(successBranch)
      // It never navigates back to /terms.
      expect(page, label).not.toContain("location.assign('/terms')")
    }
    expect(TERMS_PATH).toBe('/terms')

    // ACCEPT, then the builder root answers with the builder itself, whose first
    // and default tab is Site.
    expect((await accept(contact.email)).status).toBe(204)
    const root = await call('/', contact.email, { headers: NAVIGATION })
    expect(root.status).toBe(200)
    const builder = await root.text()
    expect(builder).toContain('/builder/main.js')
    expect(builder).not.toContain('Terms of service')
    expect(TABS[0]).toBe(SITE_TAB)
    expect(SITE_TAB.id).toBe('site')

    // `/terms` stays readable afterwards, with the record instead of the control —
    // which is why reloading it would only show the terms again.
    const afterTerms = await (await call(TERMS_PATH, contact.email, { headers: NAVIGATION })).text()
    expect(afterTerms).toContain('Terms of service')
    expect(afterTerms).not.toContain('id="accept"')
    expect(afterTerms).toContain('Accepted on')
  })
})
