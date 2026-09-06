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
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { addContact, openGrant, personDetail } from '../apps/control-app/src/people'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'
import { seedContact } from './support/contact'

/**
 * REQ-194 — **the account is a table, and a business is owned by one.**
 *
 * WHAT THIS FILE PROVES. That the account stopped being a person. There was no
 * `accounts` table: `findAccount` returned a `UserRow`, `/api/businesses`
 * reported a person under the label `account`, a business was owned by whoever
 * happened to hold the first membership row on it, and `entitlements.account_id`
 * — the column [[REQ-184]] reserved for the subject — was `NULL` on every row
 * because there was nothing to put in it. Each of those is a way of saying "one
 * user is one account", which is a simplification [[DOC-42]] §6 says the model
 * must not foreclose on.
 *
 * WHAT MAKES IT EVIDENCE. Every assertion runs inside workerd against a real D1
 * with the deployed baseline applied by the same helper the store suites use, so
 * what is proved is the schema that will ship. The behaviour is driven through
 * the shipped functions (`addContact`, `provisionBusiness`, `admit`,
 * `personDetail`, `openGrant`), never through a second copy of their SQL written
 * here — the two places a fixture writes rows directly are `seedContact`, which
 * is how a suite builds the shape v1 does not produce, and the schema refusals,
 * which have to be driven at the database to be refusals at all.
 *
 * THE FALSIFIER THE TICKET NAMES IS DRIVEN DIRECTLY. "A query that assumes one
 * contact per account — a `LIMIT 1` over an account's people, or a foreign key
 * pointing at a person where the payer is meant." Both are asserted below by
 * building the two-people-one-account shape the product does not build yet and
 * checking that provisioning, admission and the grant lookup all handle it.
 */

const PLATFORM = 'req194-platform'

function identityEnv(tenantId = PLATFORM): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

let seq = 0
const anEmail = (): string => `req194-${(seq += 1)}@example.test`

async function accountOf(personId: string): Promise<string> {
  const row = await env.DB.prepare('SELECT account_id FROM users WHERE id = ?')
    .bind(personId)
    .first<{ account_id: string }>()
  return row!.account_id
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-194 — the account is a table', () => {
  it('test_UAT_FC_REQ-194_an_invite_mints_an_account_with_an_opaque_key', async () => {
    // A CONTACT BELONGS TO AN ACCOUNT, so the invite that makes the contact makes
    // the account. There is no state where a person names none: the column is
    // NOT NULL, which is the difference between this and the empty chair
    // `entitlements.account_id` was.
    const invited = await addContact(identityEnv(), { businessId: PLATFORM }, {
      email: anEmail(),
      displayName: 'Alice Waters',
    })
    expect(invited.created).toBe(true)
    expect(invited.person.accountId).toBeTruthy()

    // OPAQUE, AND UNDER THE PREFIX THAT NAMES THE NOUN. `acct_` minted BUSINESS
    // ids until this ticket; an id reading `acct_` is an account and nothing else.
    expect(invited.person.accountId).toMatch(/^acct_[0-9a-f]{32}$/)

    const account = await accountById(identityEnv(), invited.person.accountId)
    expect(account?.tenant_id, 'an account is scoped to the business it is of').toBe(PLATFORM)
    expect(account?.status).toBe('active')
    // The name is a BILLING label, seeded from the display name when the invite
    // carried one. Nothing reads it yet; what matters is that it is the account's
    // own column rather than a person's.
    expect(account?.name).toBe('Alice Waters')

    // ONE ACCOUNT, ONE PERSON — v1, and the whole of it.
    expect(await peopleOnAccount(identityEnv(), invited.person.accountId)).toEqual([
      invited.person.id,
    ])
  })

  it('test_UAT_FC_REQ-194_a_person_with_no_account_is_refused_by_the_schema', async () => {
    // AN INVARIANT THE SCHEMA HOLDS, NOT ONE THE APPLICATION MAINTAINS. A person
    // written against no account, or against an account that does not exist, is
    // a person `personDetail` would read back with a dangling subject and whose
    // grants could never be found. The refusal is the database's.
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
  })

  it('test_UAT_FC_REQ-194_a_business_names_the_account_that_owns_it', async () => {
    const seeded = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Salon' })
    const accountId = await accountOf(seeded.user.id)

    const business = await env.DB.prepare(
      'SELECT id, owner_account_id FROM tenants WHERE id = ?',
    )
      .bind(seeded.businessId)
      .first<{ id: string; owner_account_id: string | null }>()

    // THE PAYER, NOT THE PERSON. This used to be inferable only from whichever
    // membership row was written first — a different question, and one that gives
    // a different answer the day an account puts two people on one business.
    expect(business?.owner_account_id).toBe(accountId)
    expect(business?.owner_account_id).not.toBe(seeded.user.id)

    // AND THE BUSINESS'S OWN KEY IS UNDER THE BUSINESS PREFIX.
    expect(seeded.businessId).toMatch(/^biz_[0-9a-f]{32}$/)
  })

  it('test_UAT_FC_REQ-194_no_id_the_product_mints_for_a_business_reads_acct', async () => {
    // THE PREFIX IS A READING AID AND NOTHING BRANCHES ON IT ([[REQ-190]]) — which
    // is exactly why a wrong one is expensive: it is the only thing a person
    // reading a log has. `acct_` named businesses while the account had no table.
    // Asserted over everything the product has written into this database rather
    // than over the source, because it is the VALUES that end up in R2 keys.
    await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Studio' })

    const tenants = await env.DB.prepare('SELECT id FROM tenants').all<{ id: string }>()
    const accounts = await env.DB.prepare('SELECT id FROM accounts').all<{ id: string }>()
    const businessIds = (tenants.results ?? []).map((r) => r.id)
    const accountIds = (accounts.results ?? []).map((r) => r.id)

    expect(businessIds.length).toBeGreaterThan(0)
    expect(accountIds.length).toBeGreaterThan(0)
    // Fixtures register tenants under plain words (`req194-platform`); what must
    // never appear is a business wearing the account's prefix.
    expect(businessIds.filter((id) => id.startsWith('acct_'))).toEqual([])
    expect(accountIds.every((id) => id.startsWith('acct_'))).toBe(true)
    // And the two populations are disjoint, which is the property the prefix is
    // a shorthand for.
    expect(businessIds.filter((id) => accountIds.includes(id))).toEqual([])
  })

  it('test_UAT_FC_REQ-194_an_account_may_hold_several_people_and_all_of_them_operate_its_businesses', async () => {
    // THE SHAPE v1 DOES NOT BUILD, BUILT BY HAND. Nothing in the product joins a
    // second person to an existing account — and the point of the table is that
    // doing so is a ROW rather than a migration, which can only be shown by
    // writing the row. `seedContact` takes an existing account for exactly this.
    const first = await addContact(identityEnv(), { businessId: PLATFORM }, {
      email: anEmail(),
      displayName: 'Alice',
    })
    const accountId = first.person.accountId
    const second = await seedContact(identityEnv(), {
      tenantId: PLATFORM,
      email: anEmail(),
      displayName: 'Alice’s colleague',
      accountId,
    })

    expect(await peopleOnAccount(identityEnv(), accountId)).toEqual([first.person.id, second])

    // PROVISIONING WRITES A MEMBERSHIP FOR EVERY PERSON ON THE ACCOUNT, which is
    // the falsifier stated as behaviour: a `LIMIT 1` here would make one of the
    // two the account, silently, and the other a person who cannot open the
    // business their account pays for.
    const business = await provisionBusiness(identityEnv(), { accountId, name: 'Shared Ltd' })
    const members = await env.DB.prepare(
      'SELECT user_id, role FROM memberships WHERE business_id = ? ORDER BY user_id',
    )
      .bind(business.businessId)
      .all<{ user_id: string; role: string }>()
    expect((members.results ?? []).map((m) => m.user_id).sort()).toEqual(
      [first.person.id, second].sort(),
    )
    // ROLE STAYS A FOOTHOLD ([[REQ-194]] — access restrictions are punted). Both
    // people are `owner`; nothing in this ticket differentiates them by role, and
    // no permission check reads one.
    expect((members.results ?? []).every((m) => m.role === 'owner')).toBe(true)
  })

  it('test_UAT_FC_REQ-194_a_grant_names_its_subject_by_account_key', async () => {
    const seeded = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Grants' })
    const accountId = await accountOf(seeded.user.id)

    // THE SUBJECT IS AN ACCOUNT. `entitlements.account_id` was NULL on every row
    // because the only key anyone could have put there was a person's, which is
    // the confusion [[REQ-184]] left the column open against.
    const grant = await openGrant(identityEnv(), {
      businessId: seeded.businessId,
      accountId,
      plan: 'paywall',
    })
    expect(grant.accountId).toBe(accountId)

    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, seeded.user.id)
    const subjects = detail!.grants.filter((g) => g.accountId !== null)
    expect(subjects.map((g) => g.id)).toContain(grant.id)

    // AND A SUBJECT WRITTEN AS A PERSON IS NOT FOUND, which is what makes the
    // previous assertion mean something: the lookup is the account key, so the
    // old spelling simply does not resolve.
    const wrong = await openGrant(identityEnv(), {
      businessId: seeded.businessId,
      accountId: seeded.user.id,
      plan: 'paywall',
    })
    const after = await personDetail(identityEnv(), { businessId: PLATFORM }, seeded.user.id)
    expect(after!.grants.map((g) => g.id)).not.toContain(wrong.id)
  })

  it('test_UAT_FC_REQ-194_the_capacity_grant_keeps_its_null_subject_and_its_meaning', async () => {
    // [[REQ-184]]'s distinction survives untouched. Provisioning writes a grant to
    // the BUSINESS, with no subject — "this business holds a plan" — and that is
    // what makes it selectable. A grant naming an account must not.
    const seeded = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Capacity' })
    const accountId = await accountOf(seeded.user.id)

    const capacity = await env.DB.prepare(
      'SELECT account_id FROM entitlements WHERE business_id = ? AND source = ?',
    )
      .bind(seeded.businessId, 'admin_grant')
      .first<{ account_id: string | null }>()
    expect(capacity?.account_id).toBeNull()

    const second = await provisionBusiness(identityEnv(), { accountId, name: 'Second Ltd' })
    // Revoke the capacity grant and replace it with an account-subject one: the
    // business must go unselectable, because per-account access is not capacity.
    await env.DB.prepare("UPDATE entitlements SET status = 'revoked' WHERE business_id = ?")
      .bind(second.businessId)
      .run()
    await openGrant(identityEnv(), { businessId: second.businessId, accountId, plan: 'pro' })

    const admission = await admit(identityEnv(), seeded.user.email!)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    const entry = admission.businesses.find((b) => b.businessId === second.businessId)
    expect(entry?.selectable, 'an account-subject grant is not capacity').toBe(false)
    expect(
      admission.businesses.find((b) => b.businessId === seeded.businessId)?.selectable,
    ).toBe(true)
  })

  it('test_UAT_FC_REQ-194_find_account_answers_with_an_account', async () => {
    // IT RETURNED A `UserRow`, and that is where "an account is a user" actually
    // cost something: the value goes on to become a business's owner.
    const email = anEmail()
    const seeded = await inviteAccount(identityEnv(), { email, accountName: 'Lookup' })
    const found = await findAccount(identityEnv(), email.toUpperCase())
    expect(found?.id).toBe(await accountOf(seeded.user.id))
    expect(found?.id).not.toBe(seeded.user.id)
    expect(await findAccount(identityEnv(), 'nobody@example.test')).toBeNull()
  })

  it('test_UAT_FC_REQ-194_the_platform_business_is_owned_by_nobody', async () => {
    // 1st Contact is not somebody's product — it is the business whose product is
    // businesses ([[DOC-42]] §8) — so the row names no owner. Setting one from
    // break glass would make "who owns 1st Contact" mean "who logged in first",
    // which is worse than saying nothing. The operator still gets an account of
    // their own, exactly like an invited contact.
    const email = anEmail()
    await ensurePlatformOperator({ ...identityEnv(), PLATFORM_ADMINS: email }, email)

    const platform = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
      .bind(PLATFORM)
      .first<{ owner_account_id: string | null }>()
    expect(platform?.owner_account_id).toBeNull()

    const operator = await env.DB.prepare(
      'SELECT u.id AS id, u.account_id AS account_id FROM users u ' +
        'WHERE u.id = (SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?)',
    )
      .bind(PLATFORM, email)
      .first<{ id: string; account_id: string }>()
    expect(operator?.account_id).toMatch(/^acct_[0-9a-f]{32}$/)
    expect((await accountById(identityEnv(), operator!.account_id))?.tenant_id).toBe(PLATFORM)
  })

  it('test_UAT_FC_REQ-194_provisioning_refuses_an_account_that_does_not_exist_or_holds_nobody', async () => {
    // A BUSINESS WITH NO PAYER IS INVISIBLE RATHER THAN BROKEN: the switcher joins
    // through `memberships`, so a missing owner shows up only when somebody tries
    // to bill it. Both refusals happen before any row is written.
    await expect(
      provisionBusiness(identityEnv(), { accountId: newId('acct'), name: 'Ghost Ltd' }),
    ).rejects.toThrow(/No such account/)

    const empty = newId('acct')
    await accountInsert(identityEnv(), { id: empty, tenantId: PLATFORM }).run()
    await expect(
      provisionBusiness(identityEnv(), { accountId: empty, name: 'Nobody Ltd' }),
    ).rejects.toThrow(/nobody on it/)

    const before = await env.DB.prepare('SELECT COUNT(*) AS n FROM tenants WHERE name = ?')
      .bind('Ghost Ltd')
      .first<{ n: number }>()
    expect(before?.n).toBe(0)
  })
})
