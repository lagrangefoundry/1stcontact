import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  emailsOf,
  ensurePlatformOperator,
  newId,
  userEmailInsert,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import {
  addContact,
  openGrant,
  peopleOf,
  personDetail,
  setPersonRecord,
  InvalidPersonRecordError,
} from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'
import { seedContact } from './support/contact'

/**
 * REQ-191 — **a person's email addresses are a table, not a column.**
 *
 * WHAT THIS FILE PROVES. That the address stopped being the person. `users`
 * carried `email TEXT NOT NULL` under `UNIQUE (tenant_id, email)`, which said
 * three things nobody meant: one human holds exactly one address; a second
 * address is a second human who can never be reconciled with the first; and
 * changing someone's address mutates the key `admit` resolves them through. The
 * address is `user_emails` now, and the person keeps one key however many
 * addresses they hold and whichever of them they are reached at.
 *
 * WHAT MAKES IT EVIDENCE. Every assertion runs inside workerd against a real D1
 * with the deployed baseline applied by the same helper the store suites use, so
 * what is proved is the schema that will ship. The constraints are proved by the
 * DATABASE REFUSING — a second primary, a duplicate address, an uncasefolded one
 * — because an invariant asserted by reading a row back is an invariant the
 * application could be maintaining by hand, which is the arrangement this ticket
 * exists to replace. The behaviour is driven through the shipped functions
 * (`admit`, `addContact`, `personDetail`, `setPersonRecord`), never through a
 * second copy of their SQL written here.
 *
 * WHAT IT DELIBERATELY DOES NOT DRIVE. Nothing in the product adds a SECOND
 * address yet — which surface does that, and re-primaries it, is [[REQ-189]]'s
 * territory or later — so the suites below seed the second address through
 * `userEmailInsert`, the same statement builder the invite writes the first one
 * with. That is the honest shape: the model is what this ticket makes right.
 */

const PLATFORM = 'req191-platform'
const OTHER = 'req191-other-business'

function identityEnv(tenantId = PLATFORM): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

let seq = 0
const anEmail = (): string => `req191-${(seq += 1)}@example.test`

/** A second address on somebody who already exists — never primary. */
async function addAddress(userId: string, tenantId: string, email: string): Promise<void> {
  await userEmailInsert(identityEnv(), { userId, tenantId, email, primary: false }).run()
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-191 — the shape', () => {
  it('test_UAT_FC_REQ-191_users_carries_no_address_column', async () => {
    // THE DEFECT, STATED AS ITS ABSENCE. Asked of the database rather than of
    // the migration text, because the claim is about the deployed table and a
    // file-scan would pass against a schema that had drifted from it. A `SELECT`
    // of a column that is not there is a SQLite error, and that error is the
    // assertion.
    await expect(env.DB.prepare('SELECT email FROM users LIMIT 1').all()).rejects.toThrow()
  })

  it('test_UAT_FC_REQ-191_a_person_holds_several_addresses_and_exactly_one_is_primary', async () => {
    // A PERSON HOLDS AS MANY AS THEY HAVE. The first is written by the invite
    // and is primary because it is their only one; the second is an ordinary row
    // beside it, and neither displaces the other.
    const first = anEmail()
    const second = anEmail()
    const invited = await addContact(identityEnv(), { businessId: PLATFORM }, { email: first })
    await addAddress(invited.person.id, PLATFORM, second)

    const held = await emailsOf(identityEnv(), invited.person.id)
    expect(held.map((e) => e.email).sort()).toEqual([first, second].sort())
    expect(held.filter((e) => e.is_primary === 1).map((e) => e.email)).toEqual([first])

    // AND EXACTLY ONE IS ENFORCED BY A CONSTRAINT RATHER THAN BY CODE.
    // `idx_user_emails_one_primary` is a partial unique index over `user_id`, so
    // the second primary is refused by the database. Proved by the refusal: an
    // invariant the application maintains is an invariant that eventually is not
    // maintained, and only the database can be asked whether it is holding it.
    await expect(
      userEmailInsert(identityEnv(), {
        userId: invited.person.id,
        tenantId: PLATFORM,
        email: anEmail(),
      }).run(),
    ).rejects.toThrow(/UNIQUE constraint failed/i)
  })

  it('test_UAT_FC_REQ-191_an_address_resolves_to_exactly_one_person_in_a_business', async () => {
    // ONE ADDRESS, ONE PERSON — within the business that holds it. The
    // constraint moved off `users` and onto `user_emails` and still means the
    // same thing, which is what stops a business ending up with two records for
    // one human.
    const email = anEmail()
    const person = await seedContact(identityEnv(), { tenantId: PLATFORM, email })
    const other = await seedContact(identityEnv(), { tenantId: PLATFORM, email: anEmail() })
    expect(other).not.toBe(person)

    await expect(
      userEmailInsert(identityEnv(), { userId: other, tenantId: PLATFORM, email, primary: false }).run(),
    ).rejects.toThrow(/UNIQUE constraint failed/i)
  })

  it('test_UAT_FC_REQ-191_the_same_address_in_two_businesses_is_two_unrelated_people', async () => {
    // THE RECURSION, WHICH A GLOBAL CONSTRAINT WOULD BREAK ([[DOC-42]] §1). The
    // same human is a member of 1st Contact and a contact of Alice's Plumbing,
    // as two unrelated rows — and a globally-unique address would also be an
    // existence oracle across the barrier, telling one business that another
    // already knows an address.
    const email = anEmail()
    const here = await addContact(identityEnv(), { businessId: PLATFORM }, { email })
    const there = await addContact(identityEnv(), { businessId: OTHER }, { email })

    expect(there.created).toBe(true)
    expect(there.person.id).not.toBe(here.person.id)
    expect(here.person.email).toBe(email)
    expect(there.person.email).toBe(email)

    // And neither business can see the other's row.
    const ours = await peopleOf(identityEnv(), { businessId: PLATFORM })
    expect(ours.map((p) => p.id)).not.toContain(there.person.id)
  })

  it('test_UAT_FC_REQ-191_addresses_are_stored_casefolded_and_the_schema_enforces_it', async () => {
    // CASEFOLDED BY THE SCHEMA, NOT BY CONVENTION. `normaliseEmail` is a
    // function anyone can forget to call and the index is byte-exact, so a
    // differently-cased address used to be a second person `admit` never finds.
    // The CHECK refuses the unnormalised form outright, so forgetting is a
    // failed write rather than a silent lockout.
    const typed = `REQ191-Mixed-${(seq += 1)}@Example.TEST`
    const person = await seedContact(identityEnv(), { tenantId: PLATFORM, email: anEmail() })
    await expect(
      env.DB.prepare(
        'INSERT INTO user_emails (id, user_id, tenant_id, email, is_primary, created_at, updated_at) ' +
          'VALUES (?, ?, ?, ?, 0, ?, ?)',
      )
        .bind(newId('eml'), person, PLATFORM, typed, '2026-01-01', '2026-01-01')
        .run(),
    ).rejects.toThrow(/CHECK constraint failed/i)

    // And the shipped writer normalises, so the check never fires for it.
    const invited = await addContact(
      identityEnv(),
      { businessId: PLATFORM },
      { email: `  ${typed} ` },
    )
    expect(invited.person.email).toBe(typed.trim().toLowerCase())
  })
})

describe('REQ-191 — what reads it', () => {
  it('test_UAT_FC_REQ-191_admit_resolves_identity_through_user_emails', async () => {
    // THE FRONT DOOR READS THE ADDRESS TABLE, AND ANY ROW IN IT. A person
    // reached at their second address is the person their first address
    // reaches — otherwise the door refuses somebody it knows perfectly well.
    const first = anEmail()
    const second = anEmail()
    const account = await inviteAccount(identityEnv(), { email: first, endsAt: null })
    await acceptTerms(identityEnv(), account.user.id)
    await addAddress(account.user.id, PLATFORM, second)

    const atPrimary = await admit(identityEnv(), first)
    const atSecondary = await admit(identityEnv(), second)
    expect(atPrimary.ok && atSecondary.ok).toBe(true)
    expect(atSecondary.ok && atSecondary.user.id).toBe(account.user.id)
    // The admission carries the PRIMARY address whichever one was presented, so
    // the chrome shows the person one identity rather than whichever address
    // they happened to type.
    expect(atSecondary.ok && atSecondary.user.email).toBe(first)

    // AND IT READS NOTHING ELSE. Delete the address rows and the person is
    // unfindable — which is what proves the resolution goes through this table
    // rather than through something left behind on `users`.
    await env.DB.prepare('DELETE FROM user_emails WHERE user_id = ?').bind(account.user.id).run()
    const gone = await admit(identityEnv(), first)
    expect(gone.ok).toBe(false)
    expect(!gone.ok && gone.reason).toBe('no_user')
  })

  it('test_UAT_FC_REQ-191_repriming_an_address_changes_no_key_and_no_foreign_key', async () => {
    // THE POINT OF THE WHOLE TICKET. Which address is primary is a flag on a
    // row; the person's key, the membership that names it and the grant beside
    // it are all untouched by moving it.
    const first = anEmail()
    const second = anEmail()
    const account = await inviteAccount(identityEnv(), { email: first, endsAt: null })
    await acceptTerms(identityEnv(), account.user.id)
    await addAddress(account.user.id, PLATFORM, second)

    const before = await footprint(account.user.id)

    // Cleared first, because the partial unique index refuses two primaries —
    // the constraint doing its job in the middle of an ordinary operation.
    await env.DB.prepare('UPDATE user_emails SET is_primary = 0 WHERE user_id = ?')
      .bind(account.user.id)
      .run()
    await env.DB.prepare(
      'UPDATE user_emails SET is_primary = 1 WHERE user_id = ? AND email = ?',
    )
      .bind(account.user.id, second)
      .run()

    expect(await footprint(account.user.id)).toEqual(before)

    // The person is still reachable at both, and now presents as the second.
    const again = await admit(identityEnv(), first)
    expect(again.ok && again.user.id).toBe(account.user.id)
    expect(again.ok && again.user.email).toBe(second)
  })

  it('test_UAT_FC_REQ-191_the_detail_pane_gets_every_address_primary_first', async () => {
    // `peopleOf` SHOWS ONE AND `personDetail` SHOWS ALL, which is the split a
    // list and a pane want. A pane that showed only the primary would make a
    // second address unobservable — the state that lets an operator invite one
    // human twice.
    const first = anEmail()
    const second = anEmail()
    const invited = await addContact(identityEnv(), { businessId: PLATFORM }, { email: first })
    await addAddress(invited.person.id, PLATFORM, second)

    const listed = (await peopleOf(identityEnv(), { businessId: PLATFORM })).find(
      (p) => p.id === invited.person.id,
    )
    expect(listed?.email).toBe(first)

    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, invited.person.id)
    expect(detail?.emails.map((e) => e.email)).toEqual([first, second])
    expect(detail?.emails.map((e) => e.isPrimary)).toEqual([true, false])
  })

  it('test_UAT_FC_REQ-191_inviting_at_a_secondary_address_matches_the_existing_person', async () => {
    // [[DOC-42]] §9's falsifier is "an invite that inserts rather than updates",
    // and a second address is where it would fire: matching only the primary
    // would make the invite create the very duplicate the address table exists
    // to prevent, at the one surface whose whole job is to avoid it.
    const first = anEmail()
    const second = anEmail()
    const invited = await addContact(identityEnv(), { businessId: PLATFORM }, { email: first })
    await addAddress(invited.person.id, PLATFORM, second)

    const before = await countPeople(PLATFORM)
    const again = await addContact(identityEnv(), { businessId: PLATFORM }, { email: second })

    expect(again.created).toBe(false)
    expect(again.person.id).toBe(invited.person.id)
    expect(await countPeople(PLATFORM)).toBe(before)
    // And it added nothing: an invite is a pipeline transition, not an edit of
    // who somebody is.
    expect((await emailsOf(identityEnv(), invited.person.id)).length).toBe(2)
  })

  it('test_UAT_FC_REQ-191_correcting_the_address_rewrites_the_primary_row', async () => {
    // THE RECORD EDITOR CORRECTS WHO SOMEBODY IS. A typo in the address they
    // were invited at is fixed in place — leaving the wrong one behind as a
    // second identity would keep resolving the person it was meant to stop
    // resolving — and the addresses that are not the primary are not its
    // business.
    const first = anEmail()
    const second = anEmail()
    const corrected = anEmail()
    const invited = await addContact(identityEnv(), { businessId: PLATFORM }, { email: first })
    await addAddress(invited.person.id, PLATFORM, second)

    const saved = await setPersonRecord(
      identityEnv(),
      { businessId: PLATFORM },
      invited.person.id,
      { email: `  ${corrected.toUpperCase()} ` },
    )
    expect(saved.email).toBe(corrected)

    const held = await emailsOf(identityEnv(), invited.person.id)
    expect(held.map((e) => e.email)).toEqual([corrected, second])
    // The old address is gone, so it resolves to nobody.
    expect((await admit(identityEnv(), first)).ok).toBe(false)

    // AND A DUPLICATE IS A SENTENCE, NOT A 500. The constraint is on
    // `user_emails` now, so the code that recognises it has to name that table.
    const rival = anEmail()
    await addContact(identityEnv(), { businessId: PLATFORM }, { email: rival })
    await expect(
      setPersonRecord(identityEnv(), { businessId: PLATFORM }, invited.person.id, { email: rival }),
    ).rejects.toBeInstanceOf(InvalidPersonRecordError)
  })

  it('test_UAT_FC_REQ-191_entitlements_name_their_subject_by_key', async () => {
    // A GRANT USED TO CARRY AN ADDRESS beside `account_id` — a string foreign
    // key to a person, so the same subject had two representations and an
    // address change had two places to land. The column is gone; the subject is
    // the key.
    await expect(env.DB.prepare('SELECT email FROM entitlements LIMIT 1').all()).rejects.toThrow()

    const account = await inviteAccount(identityEnv(), { email: anEmail(), endsAt: null })
    const grant = await openGrant(identityEnv(), {
      businessId: account.businessId,
      accountId: account.user.id,
      plan: 'pro',
    })
    expect(grant.accountId).toBe(account.user.id)
  })

  it('test_UAT_FC_REQ-191_the_break_glass_seed_writes_a_person_and_an_address', async () => {
    // `ensurePlatformOperator` is the one writer that has to work against a
    // database being brought up from empty, and it is the one this ticket most
    // easily breaks: a person written without an address is a person `admit`
    // can never find, so the repair would leave its holder exactly as locked out
    // as before. Run TWICE, because every admission by a holder runs it and a
    // second run must add nothing.
    const email = anEmail()
    await ensurePlatformOperator(identityEnv(), email)
    await ensurePlatformOperator(identityEnv(), email.toUpperCase())

    const rows = await env.DB.prepare('SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?')
      .bind(PLATFORM, email)
      .all<{ user_id: string }>()
    expect((rows.results ?? []).length).toBe(1)

    const admitted = await admit(identityEnv(), email)
    expect(admitted.ok).toBe(true)
    expect(admitted.ok && admitted.user.email).toBe(email)
  })
})

/** The rows a re-priming must not touch: the person's key, and what names it. */
async function footprint(userId: string): Promise<Record<string, unknown>> {
  const user = await env.DB.prepare('SELECT id, tenant_id, status FROM users WHERE id = ?')
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
  return { user, memberships: memberships.results ?? [], grants: grants.results ?? [] }
}

async function countPeople(tenantId: string): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE tenant_id = ?')
    .bind(tenantId)
    .first<{ n: number }>()
  return row?.n ?? 0
}
