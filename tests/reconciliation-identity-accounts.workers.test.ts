import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  accountById,
  accountInsert,
  admit,
  ensurePlatformOperator,
  findAccount,
  newId,
  peopleOnAccount,
  provisionBusiness,
  STARTER_HEADING,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { invitePerson, openGrant, personDetail } from '../apps/control-app/src/people'
import { seedContact } from './support/contact'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * STORY-7b1025b8, plan item 4 of BUNDLE-37 — **the account is a record, and
 * people belong to it** ([[REQ-194]]).
 *
 * WHAT THIS FILE PROVES. The account criteria the story gained or had restated
 * when the account became a table of its own: the invite mints an account beside
 * the person and the schema refuses a person without one (AC-2253); an account may
 * hold several people and provisioning makes all of them owners (AC-2254); the
 * role is a foothold read by one ownership question only (AC-2257); a business key
 * is opaque and distinct from its owning account's key (AC-1741); provisioning
 * writes a business owned by the account plus a starter site named `unnamed`
 * (AC-1742); and a non-null grant subject is an account key while the capacity
 * grant keeps its null subject (AC-2115); a business names the account that owns
 * it, the platform business is owned by nobody and no business key reads `acct_`
 * (AC-2255, the database half — the deployment-config half is the node sibling
 * `reconciliation-identity-accounts.test.ts`); and provisioning refuses an
 * account that does not exist or holds nobody, while the operator's lookup
 * answers with an account (AC-2256).
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1 with
 * the deployed baseline applied by the helper the store suites use. Behaviour is
 * driven through the shipped calls (`invitePerson`, `provisionBusiness`, `admit`,
 * `openGrant`, `personDetail`, `ensurePlatformOperator`), and rows are read back
 * out of D1 rather than trusted from a return value. The only direct writes are
 * the ones a criterion demands: the second person on an account (the shape v1
 * does not build) and the schema refusals, which must be driven at the database
 * to be refusals at all.
 */

const PLATFORM = 'story7b1025b8-accounts-platform'

function identityEnv(tenantId = PLATFORM): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

let seq = 0
const anEmail = (): string => `story7b1025b8-accounts-${(seq += 1)}@example.test`

async function count(table: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>()
  return row?.n ?? 0
}

async function accountOf(personId: string): Promise<string> {
  const row = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
    .bind(personId)
    .first<{ account_id: string }>()
  return row!.account_id
}

async function columnsOf(table: string): Promise<{ name: string; notnull: number }[]> {
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{
    name: string
    notnull: number
  }>()
  return results ?? []
}

function businessIds(admission: Admission): string[] {
  return admission.ok ? admission.businesses.map((b) => b.businessId) : []
}

/**
 * The product source, comments stripped — the same stripping the REQ-190/194
 * repository scans use, because the files argue in prose about the very words
 * the scan looks for. Loaded through Vite's glob (workerd has no filesystem).
 */
const PRODUCT_SOURCE = import.meta.glob(
  [
    '../apps/**/*.{ts,js}',
    '../packages/**/*.{ts,js}',
    '../tools/**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/dist-assets/**',
    '!**/generated/**',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

beforeAll(async () => {
  await applySchema()
})

// ─── The account record ─────────────────────────────────────────────────────

describe('the account is a record people belong to', () => {
  it('test_UAT_AC2253_an_invite_mints_an_opaque_account_and_the_schema_refuses_a_person_without_one', async () => {
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
    expect(invited.created).toBe(true)

    // Read the person's account back from storage, not from the return value.
    const accountId = await accountOf(invited.person.id)
    expect(accountId).toBe(invited.person.accountId)
    expect(accountId).toMatch(/^acct_[0-9a-f]{32}$/)

    const account = await accountById(identityEnv(), accountId)
    expect(account?.tenant_id, 'the account belongs to the inviting business').toBe(PLATFORM)
    expect(account?.status).toBe('active')
    expect(await peopleOnAccount(identityEnv(), accountId)).toEqual([invited.person.id])

    // Break glass gives a newly created operator an account of their own too.
    const operatorEmail = anEmail()
    await ensurePlatformOperator({ ...identityEnv(), PLATFORM_ADMINS: operatorEmail }, operatorEmail)
    const operator = await env.DB.prepare(
      'SELECT u.id AS id, u.account_id AS account_id FROM users u ' +
        'WHERE u.id = (SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?)',
    )
      .bind(PLATFORM, operatorEmail)
      .first<{ id: string; account_id: string }>()
    expect(operator?.account_id).toMatch(/^acct_[0-9a-f]{32}$/)
    expect(await peopleOnAccount(identityEnv(), operator!.account_id)).toEqual([operator!.id])

    // The schema refuses a person with no account, and one naming a missing account.
    const peopleBefore = await count('users')
    await expect(
      env.DB.prepare(
        'INSERT INTO users (id, tenant_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(newId('usr'), PLATFORM, 'active', '2026-01-01', '2026-01-01')
        .run(),
    ).rejects.toThrow()
    await expect(
      env.DB.prepare(
        'INSERT INTO users (id, tenant_id, account_id, status, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?)',
      )
        .bind(newId('usr'), PLATFORM, newId('acct'), 'active', '2026-01-01', '2026-01-01')
        .run(),
    ).rejects.toThrow()
    expect(await count('users')).toBe(peopleBefore)
  })

  it('test_UAT_AC2254_an_account_holding_two_people_makes_both_owners_of_its_new_business', async () => {
    const firstEmail = anEmail()
    const secondEmail = anEmail()
    const first = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: firstEmail })
    const accountId = first.person.accountId
    // The shape v1 does not build: a second person on the same account, as a row.
    const second = await seedContact(identityEnv(), {
      tenantId: PLATFORM,
      email: secondEmail,
      accountId,
    })

    expect([...(await peopleOnAccount(identityEnv(), accountId))].sort()).toEqual(
      [first.person.id, second].sort(),
    )

    const business = await provisionBusiness(identityEnv(), { accountId, name: 'Shared Ltd' })
    const { results: members } = await env.DB.prepare(
      'SELECT user_id, role, status FROM memberships WHERE business_id = ?',
    )
      .bind(business.businessId)
      .all<{ user_id: string; role: string; status: string }>()
    expect((members ?? []).map((m) => m.user_id).sort()).toEqual([first.person.id, second].sort())
    expect((members ?? []).every((m) => m.role === 'owner' && m.status === 'active')).toBe(true)

    // Each person is admitted with that business in their list.
    for (const email of [firstEmail, secondEmail]) {
      const admission = await admit(identityEnv(), email)
      expect(admission.ok, `${email} is admitted`).toBe(true)
      expect(businessIds(admission)).toContain(business.businessId)
    }
  })

  it('test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value', async () => {
    const files = Object.keys(PRODUCT_SOURCE)
    // The glob really reached the product: the identity module is among the files.
    const identityKey = files.find((f) => f.endsWith('apps/control-app/src/identity.ts'))
    expect(identityKey, 'the scan reaches the identity module').toBeTruthy()
    expect(files.length).toBeGreaterThan(50)

    const offenders = files
      .filter((f) => /['"](owner|support|staff|admin)['"]/.test(code(PRODUCT_SOURCE[f])))
      .map((f) => f.replace(/^\.\.\//, ''))
    expect(offenders).toEqual(['apps/control-app/src/identity.ts'])

    const identity = code(PRODUCT_SOURCE[identityKey!])
    // Two writes (provisioning, the break-glass seed) and one read (ownership).
    expect([...identity.matchAll(/['"]owner['"]/g)]).toHaveLength(3)
    expect([...identity.matchAll(/role === 'owner'/g)]).toHaveLength(1)

    // People sharing an account are not told apart by role: both hold `owner`.
    const first = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
    const second = await seedContact(identityEnv(), {
      tenantId: PLATFORM,
      email: anEmail(),
      accountId: first.person.accountId,
    })
    const business = await provisionBusiness(identityEnv(), {
      accountId: first.person.accountId,
      name: 'Two Owners Ltd',
    })
    const { results } = await env.DB.prepare(
      'SELECT user_id, role FROM memberships WHERE business_id = ? ORDER BY user_id',
    )
      .bind(business.businessId)
      .all<{ user_id: string; role: string }>()
    expect(results ?? []).toEqual(
      [first.person.id, second].sort().map((user_id) => ({ user_id, role: 'owner' })),
    )
  })
})

// ─── Businesses and their owning account ────────────────────────────────────

describe('a business is owned by an account', () => {
  it('test_UAT_AC1741_business_key_is_opaque_biz_and_distinct_from_its_owning_account_key', async () => {
    const human = { accountName: 'Sarah Chen Catering', displayName: 'Sarah Chen', endsAt: null }
    const first = await inviteAccount(identityEnv(), { email: anEmail(), ...human })
    const second = await inviteAccount(identityEnv(), { email: anEmail(), ...human })

    expect(first.businessId).not.toBe(second.businessId)
    for (const seeded of [first, second]) {
      expect(seeded.businessId).toMatch(/^biz_[0-9a-f]{32}$/)
      for (const word of ['sarah', 'chen', 'catering']) {
        expect(seeded.businessId.toLowerCase()).not.toContain(word)
      }
      const accountId = await accountOf(seeded.user.id)
      expect(accountId).toMatch(/^acct_[0-9a-f]{32}$/)
      expect(seeded.businessId, 'the business key is not its account key').not.toBe(accountId)
      const tenant = await env.DB.prepare('SELECT name, owner_account_id FROM tenants WHERE id = ?')
        .bind(seeded.businessId)
        .first<{ name: string; owner_account_id: string }>()
      expect(tenant).toEqual({ name: 'Sarah Chen Catering', owner_account_id: accountId })
    }
  })

  it('test_UAT_AC1742_provisioning_writes_an_account_owned_business_grant_and_unnamed_starter_site', async () => {
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
    const accountId = invited.person.accountId

    // The invite wrote no tenant, membership, grant or site for that account.
    expect(
      await env.DB.prepare('SELECT id FROM tenants WHERE owner_account_id = ?').bind(accountId).first(),
    ).toBeNull()
    expect(
      await env.DB.prepare('SELECT id FROM memberships WHERE user_id = ?').bind(invited.person.id).first(),
    ).toBeNull()
    expect(
      await env.DB.prepare('SELECT id FROM entitlements WHERE account_id = ?').bind(accountId).first(),
    ).toBeNull()

    const business = await provisionBusiness(identityEnv(), { accountId, name: 'Harbour Bakery' })

    const tenant = await env.DB.prepare('SELECT name, status, owner_account_id FROM tenants WHERE id = ?')
      .bind(business.businessId)
      .first<{ name: string; status: string; owner_account_id: string }>()
    expect(tenant).toEqual({ name: 'Harbour Bakery', status: 'active', owner_account_id: accountId })

    const { results: memberships } = await env.DB.prepare(
      'SELECT user_id, role, status FROM memberships WHERE business_id = ?',
    )
      .bind(business.businessId)
      .all<{ user_id: string; role: string; status: string }>()
    expect(memberships).toEqual([{ user_id: invited.person.id, role: 'owner', status: 'active' }])

    const { results: grants } = await env.DB.prepare(
      'SELECT source, status, account_id FROM entitlements WHERE business_id = ?',
    )
      .bind(business.businessId)
      .all<{ source: string; status: string; account_id: string | null }>()
    expect(grants).toEqual([{ source: 'admin_grant', status: 'active', account_id: null }])

    const { results: sites } = await env.DB.prepare('SELECT id, slug FROM sites WHERE tenant_id = ?')
      .bind(business.businessId)
      .all<{ id: string; slug: string }>()
    expect((sites ?? []).map((s) => s.slug)).toEqual(['unnamed'])
    expect(business.siteSlug).toBe('unnamed')
    const page = await env.DB.prepare('SELECT page FROM site_pages WHERE site_id = ? AND name = ?')
      .bind(sites![0].id, 'home.json')
      .first<{ page: string }>()
    expect(page?.page).toContain(STARTER_HEADING)

    // A second business provisioned the same way: same name, different site key.
    const second = await provisionBusiness(identityEnv(), { accountId, name: 'Harbour Bakery' })
    const secondSite = await env.DB.prepare('SELECT id, slug FROM sites WHERE tenant_id = ?')
      .bind(second.businessId)
      .first<{ id: string; slug: string }>()
    expect(secondSite?.slug).toBe('unnamed')
    expect(secondSite?.id).toBeTruthy()
    expect(secondSite?.id).not.toBe(sites![0].id)

    // Empty account, empty name: refused before anything is written.
    const snapshot = async () => ({
      tenants: await count('tenants'),
      memberships: await count('memberships'),
      entitlements: await count('entitlements'),
    })
    const before = await snapshot()
    await expect(provisionBusiness(identityEnv(), { accountId: '  ', name: 'No Owner' })).rejects.toThrow()
    await expect(provisionBusiness(identityEnv(), { accountId, name: '   ' })).rejects.toThrow()
    expect(await snapshot()).toEqual(before)
  })

  it('test_UAT_AC2115_a_non_null_grant_subject_is_an_account_key_and_the_capacity_grant_names_none', async () => {
    const entitlementCols = await columnsOf('entitlements')
    expect(entitlementCols.map((c) => c.name)).toContain('business_id')
    expect(entitlementCols.find((c) => c.name === 'account_id')?.notnull).toBe(0)
    const membershipCols = (await columnsOf('memberships')).map((c) => c.name)
    expect(membershipCols).toContain('business_id')
    expect(membershipCols).not.toContain('account_id')

    // The invite writes no grant.
    const before = await count('entitlements')
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
    expect(await count('entitlements'), 'the invite wrote a grant').toBe(before)
    const accountId = invited.person.accountId

    // Provisioning writes a capacity grant: the business, no subject.
    const business = await provisionBusiness(identityEnv(), { accountId, name: 'Object Ltd' })
    const { results: written } = await env.DB.prepare(
      'SELECT business_id, account_id FROM entitlements WHERE business_id = ?',
    )
      .bind(business.businessId)
      .all<{ business_id: string; account_id: string | null }>()
    expect(written).toEqual([{ business_id: business.businessId, account_id: null }])

    // A grant naming the account's key is listed for the person's account; one
    // naming the person's id is not.
    const byAccount = await openGrant(identityEnv(), {
      businessId: business.businessId,
      accountId,
      plan: 'paywall',
    })
    const byPerson = await openGrant(identityEnv(), {
      businessId: business.businessId,
      accountId: invited.person.id,
      plan: 'paywall',
    })
    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, invited.person.id)
    const listed = detail!.grants.map((g) => g.id)
    expect(listed).toContain(byAccount.id)
    expect(listed).not.toContain(byPerson.id)

    // No column named for an account holds a business id.
    const { results: misfiled } = await env.DB.prepare(
      'SELECT e.id FROM entitlements e JOIN tenants t ON t.id = e.account_id',
    ).all<{ id: string }>()
    expect(misfiled ?? []).toHaveLength(0)

    // Three grants against one business — none, account A, account B — read back apart.
    const target = newId('biz')
    const a = newId('acct')
    const b = newId('acct')
    await env.DB.batch([
      accountInsert(identityEnv(), { id: a, tenantId: PLATFORM }),
      accountInsert(identityEnv(), { id: b, tenantId: PLATFORM }),
    ])
    const ids = {
      none: (await openGrant(identityEnv(), { businessId: target, plan: 'pro' })).id,
      a: (await openGrant(identityEnv(), { businessId: target, accountId: a, plan: 'pro' })).id,
      b: (await openGrant(identityEnv(), { businessId: target, accountId: b, plan: 'pro' })).id,
    }
    const { results } = await env.DB.prepare(
      'SELECT id, business_id, account_id FROM entitlements WHERE business_id = ?',
    )
      .bind(target)
      .all<{ id: string; business_id: string; account_id: string | null }>()
    const read = new Map((results ?? []).map((r) => [r.id, r]))
    expect(read.size).toBe(3)
    expect(read.get(ids.none)).toEqual({ id: ids.none, business_id: target, account_id: null })
    expect(read.get(ids.a)).toEqual({ id: ids.a, business_id: target, account_id: a })
    expect(read.get(ids.b)).toEqual({ id: ids.b, business_id: target, account_id: b })
  })

  it('test_UAT_AC2255_a_business_names_its_owning_account_the_platform_is_owned_by_nobody_and_no_business_key_reads_acct', async () => {
    // Provisioned through invite-then-provision: the owner is the account, not the person.
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email: anEmail() })
    const accountId = await accountOf(invited.person.id)
    const business = await provisionBusiness(identityEnv(), { accountId, name: 'Owned Ltd' })
    expect(business.businessId).toMatch(/^biz_[0-9a-f]{32}$/)
    const owned = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
      .bind(business.businessId)
      .first<{ owner_account_id: string | null }>()
    expect(owned?.owner_account_id).toBe(accountId)
    expect(owned?.owner_account_id).not.toBe(invited.person.id)

    // Seeding the break-glass operator leaves the platform business with no owner,
    // while the operator still gets an account of their own on it.
    const operatorEmail = anEmail()
    await ensurePlatformOperator({ ...identityEnv(), PLATFORM_ADMINS: operatorEmail }, operatorEmail)
    const platform = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
      .bind(PLATFORM)
      .first<{ owner_account_id: string | null }>()
    expect(platform).not.toBeNull()
    expect(platform?.owner_account_id).toBeNull()
    const operator = await env.DB.prepare(
      'SELECT u.account_id AS account_id FROM users u ' +
        'WHERE u.id = (SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?)',
    )
      .bind(PLATFORM, operatorEmail)
      .first<{ account_id: string }>()
    expect(operator?.account_id).toMatch(/^acct_[0-9a-f]{32}$/)
    expect((await accountById(identityEnv(), operator!.account_id))?.tenant_id).toBe(PLATFORM)

    // Every business key and every account key, read from the database.
    const tenants = await env.DB.prepare('SELECT id FROM tenants').all<{ id: string }>()
    const accounts = await env.DB.prepare('SELECT id FROM accounts').all<{ id: string }>()
    const businessKeys = (tenants.results ?? []).map((r) => r.id)
    const accountKeys = (accounts.results ?? []).map((r) => r.id)
    expect(businessKeys).toContain(business.businessId)
    expect(accountKeys).toContain(accountId)
    expect(businessKeys.filter((id) => id.startsWith('acct_'))).toEqual([])
    expect(accountKeys.filter((id) => !id.startsWith('acct_'))).toEqual([])
    expect(businessKeys.filter((id) => accountKeys.includes(id))).toEqual([])
  })
})

describe('provisioning needs a real payer', () => {
  it('test_UAT_AC2256_provisioning_refuses_a_missing_or_empty_account_and_the_operator_lookup_answers_with_an_account', async () => {
    // A key that names no account is refused before anything is written.
    await expect(
      provisionBusiness(identityEnv(), { accountId: newId('acct'), name: 'Ghost AC2256 Ltd' }),
    ).rejects.toThrow(/No such account/)

    // An account that exists but holds nobody is refused too.
    const empty = newId('acct')
    await accountInsert(identityEnv(), { id: empty, tenantId: PLATFORM }).run()
    await expect(
      provisionBusiness(identityEnv(), { accountId: empty, name: 'Nobody AC2256 Ltd' }),
    ).rejects.toThrow(/nobody on it/)

    for (const name of ['Ghost AC2256 Ltd', 'Nobody AC2256 Ltd']) {
      const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM tenants WHERE name = ?')
        .bind(name)
        .first<{ n: number }>()
      expect(row?.n, `a tenant named ${name} was written`).toBe(0)
    }

    // The operator's lookup takes an address, in any case, and answers with the account.
    const email = anEmail()
    const invited = await invitePerson(identityEnv(), { businessId: PLATFORM }, { email })
    const accountId = await accountOf(invited.person.id)
    await provisionBusiness(identityEnv(), { accountId, name: 'Looked Up Ltd' })
    const found = await findAccount(identityEnv(), email.toUpperCase())
    expect(found?.id).toBe(accountId)
    expect(found?.id).not.toBe(invited.person.id)
    expect(await findAccount(identityEnv(), 'nobody-ac2256@example.test')).toBeNull()
  })
})
