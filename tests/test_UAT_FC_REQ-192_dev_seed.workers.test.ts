import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { admit, type IdentityEnv } from '../apps/control-app/src/identity'
import { peopleOf, personDetail } from '../apps/control-app/src/people'
import { needsAcceptance, TERMS_VERSION } from '../apps/control-app/src/terms'
import { accessOf, stageOf, MEMBER, NOT_MEMBER, LEAD, INVITED } from '../apps/control-app/src/builder/people-axes.js'
import { applySchema } from './support/d1-site-factory'
import seedSql from '../db/dev-seed.sql?raw'

/**
 * REQ-192 — **the development fixture, as rows in a real D1**.
 *
 * WHY THIS SUITE RUNS IN WORKERD AND NOT AGAINST A PARSED STRING. `db/dev-seed.sql`
 * is a file of literals, and the only interesting question about it is what the
 * PRODUCT sees once they are in the database. A test that read the file and
 * asserted "there is a row with `pipeline_stage = 'lead'`" would restate the seed
 * in a second dialect and pass forever, including on the day `admit` stops
 * admitting anybody it names. So the schema is applied from
 * `db/migrations/0001_baseline.sql`, the seed is applied on top of it, and every
 * assertion below goes through the function the Worker actually calls — `admit`,
 * `peopleOf`, `needsAcceptance`, `accessOf`, `stageOf`.
 *
 * THE CAST IS THE ACCEPTANCE. REQ-192's table names the states that are otherwise
 * only reachable by accident: several businesses on one account (REQ-178), a
 * grant that ended so the business is present and unselectable (DOC-42 §10.1), an
 * invitee who never came (REQ-188's middle state), and a lead who was never
 * invited (the Contact state). Each has a case below, because each is easy to
 * break and covered by nothing else a human looks at.
 *
 * THE SECOND ADDRESS IS THE CASE WITH THE LEAST ELSE COVERING IT. REQ-191 moved
 * the address off `users` so that one human could hold several, and nothing
 * reachable by clicking produces that state — so the claim it makes is asserted
 * by the schema and demonstrated by nothing. Alice holds two here, and the test
 * below reaches her at both and gets the same person back.
 */

/** `TENANT_ID` — the deployment's own business. Pinned to wrangler.toml node-side. */
const PLATFORM = 'acct_51a6746495c8057e886ff98d4208e6b9'

const PLUMBING = 'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61'
const LETTINGS = 'acct_7b93de5140fa4c28bd06e91a7c4f83b2'
const OLD_SALON = 'acct_2e58ca6f9d074b13a8fe30dd51b6947c'

const ALICE = 'alice@plumbing.example'
/** The same person, at the address that is not flagged primary ([[REQ-191]]). */
const ALICE_SECOND = 'alice@oldsalon.example'

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

/**
 * Apply the seed the same way `applySchema` applies the baseline.
 *
 * Comments are stripped BEFORE the split on `;`, not after, for the reason
 * `d1-site-factory` records: the file's prose explains a design and prose
 * contains semicolons, so splitting first cuts a comment in half and feeds
 * SQLite the remainder.
 */
async function applySeed(): Promise<void> {
  const statements = seedSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  for (const statement of statements) await env.DB.prepare(statement).run()
}

/** Every row the seed can have touched, ordered, as one comparable value. */
async function snapshot(): Promise<string> {
  const parts: string[] = []
  for (const table of ['tenants', 'users', 'user_emails', 'memberships', 'entitlements']) {
    const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all()
    const rows = (results ?? []).map((r) => JSON.stringify(r)).sort()
    parts.push(`${table}\n${rows.join('\n')}`)
  }
  return parts.join('\n\n')
}

beforeAll(async () => {
  await applySchema()
  await applySeed()
})

describe('REQ-192 — the development fixture', () => {
  /**
   * The seed's whole purpose, in one call: somebody to sign in as.
   *
   * THROUGH `admit` AND NOT THROUGH A SELECT, because the question is not whether
   * the rows are there but whether they compose into an admission. `admit` reads
   * `users` in the deployment's own business, then joins `memberships` to
   * `tenants` to `entitlements`; a seed that got any one of those wrong writes
   * rows that look perfect and admit nobody.
   */
  it('test_UAT_FC_REQ-192_alice_signs_in', async () => {
    const admission = await admit(identityEnv(), ALICE)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return
    expect(admission.user.email).toBe(ALICE)
    expect(admission.user.tenant_id).toBe(PLATFORM)
  })

  /**
   * REQ-178's several-businesses-per-account, which is the case that deleted the
   * singular `accountId`. Ordered by `granted_at`, because that is the order
   * `businessesFor` returns and therefore the one `resolveScope` picks the
   * default from — Plumbing first, as DOC-42 §1 names it.
   */
  it('test_UAT_FC_REQ-192_alice_holds_three_businesses', async () => {
    const admission = await admit(identityEnv(), ALICE)
    if (!admission.ok) throw new Error('Alice was not admitted.')
    expect(admission.businesses.map((b) => b.businessId)).toEqual([PLUMBING, LETTINGS, OLD_SALON])
    expect(admission.businesses.map((b) => b.name)).toEqual([
      "Alice's Plumbing",
      "Alice's Lettings",
      "Alice's Old Salon",
    ])
    expect(admission.businesses.every((b) => b.role === 'owner')).toBe(true)
  })

  /**
   * REQ-191's whole claim, and the one state nothing reachable by clicking
   * produces: the PERSON is the key, and an address is an attribute of them.
   *
   * REACHED AT EITHER ADDRESS, ALICE IS THE SAME ROW — same `users.id`, same
   * three businesses. That is what the table bought: before it, a second address
   * was a second human who could never be reconciled with the first, and
   * changing somebody's address mutated the key `admit` resolved them through.
   *
   * AND THE PRIMARY IS STILL THE ONE SHOWN. `admit` finds her by whichever
   * address arrived, and `PRIMARY_EMAIL_SQL` decides what the admission then
   * SAYS her address is — so signing in at the secondary must not silently
   * relabel her everywhere. Two answers to "which address is hers" is exactly
   * what one definition site exists to prevent.
   */
  it('test_UAT_FC_REQ-192_alice_holds_two_addresses_and_is_one_person', async () => {
    const primary = await admit(identityEnv(), ALICE)
    const secondary = await admit(identityEnv(), ALICE_SECOND)
    expect(primary.ok).toBe(true)
    expect(secondary.ok).toBe(true)
    if (!primary.ok || !secondary.ok) return

    expect(secondary.user.id).toBe(primary.user.id)
    expect(secondary.businesses.map((b) => b.businessId)).toEqual(
      primary.businesses.map((b) => b.businessId),
    )
    // The head of the list, not the address the caller arrived at.
    expect(secondary.user.email).toBe(ALICE)
  })

  /**
   * The non-primary half, which is the one easy to get wrong.
   * `idx_user_emails_one_primary` is a PARTIAL unique index, so two primaries is
   * a constraint violation and zero is legal — and with zero,
   * `PRIMARY_EMAIL_SQL` falls back to the oldest address and the panel shows
   * something plausible. One flagged and one not is the state the detail panel
   * is built to render, so it is the state that gets seeded.
   */
  it('test_UAT_FC_REQ-192_alices_second_address_is_not_primary', async () => {
    const admission = await admit(identityEnv(), ALICE)
    if (!admission.ok) throw new Error('Alice was not admitted.')
    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, admission.user.id)

    expect(detail?.emails.map((e) => e.email)).toEqual([ALICE, ALICE_SECOND])
    expect(detail?.emails.map((e) => e.isPrimary)).toEqual([true, false])
  })

  /**
   * DOC-42 §4: `tenant_id` is where a person is KNOWN and `memberships` is what
   * they may OPERATE. Alice is known to this deployment's business and operates
   * only her own — an earlier draft of §4 mapped "may log in" onto `memberships`
   * and was wrong, and a seed that gave her a membership here would make that
   * wrong reading pass.
   */
  it('test_UAT_FC_REQ-192_alice_holds_no_membership_on_the_platform_business', async () => {
    const admission = await admit(identityEnv(), ALICE)
    if (!admission.ok) throw new Error('Alice was not admitted.')
    expect(admission.businesses.some((b) => b.businessId === PLATFORM)).toBe(false)
  })

  /**
   * The state this fixture exists for: present and unselectable.
   *
   * Membership admits and entitlement does not (DOC-42 §4, §5), so Alice arrives
   * signed in holding a business she can see and cannot open. It is hard to reach
   * by clicking, easy to break, and `expired` rather than `revoked` — the two are
   * different acts, fixed by different remedies, and a fixture that conflated
   * them would leave one of `lapseFor`'s branches untested by inspection.
   */
  it('test_UAT_FC_REQ-192_a_lapsed_business_is_present_and_unselectable', async () => {
    const admission = await admit(identityEnv(), ALICE)
    if (!admission.ok) throw new Error('Alice was not admitted.')
    const salon = admission.businesses.find((b) => b.businessId === OLD_SALON)
    expect(salon?.selectable).toBe(false)
    expect(salon?.lapse?.reason).toBe('expired')
    expect(salon?.lapse?.endedAt).toBeTruthy()

    const others = admission.businesses.filter((b) => b.businessId !== OLD_SALON)
    expect(others.every((b) => b.selectable)).toBe(true)
    expect(others.every((b) => b.lapse === null)).toBe(true)
  })

  /**
   * DOC-44 §3's two axes, as three rows differing only in which stamps are set.
   *
   * ALL FOUR CORNERS MATTER AND THREE ARE HERE. Access is `tos_accepted_at` and
   * the pipeline is `pipeline_stage`, and they are independent — a fixture
   * holding only Bob would let a single three-valued reading pass unnoticed,
   * which is the shape REQ-188 had to correct.
   */
  it('test_UAT_FC_REQ-192_alices_business_holds_a_member_an_invitee_and_a_lead', async () => {
    const people = await peopleOf(identityEnv(), { businessId: PLUMBING })
    const by = (email: string) => people.find((p) => p.email === email)

    expect(people.map((p) => p.email).sort()).toEqual([
      'bob@example.com',
      'carol@example.com',
      'dave@example.com',
    ])

    // Invited, and came.
    expect(accessOf(by('bob@example.com'))).toBe(MEMBER)
    expect(stageOf(by('bob@example.com'))).toBe(INVITED)

    // REQ-188's middle state: asked, and never arrived.
    expect(accessOf(by('carol@example.com'))).toBe(NOT_MEMBER)
    expect(stageOf(by('carol@example.com'))).toBe(INVITED)
    expect(by('carol@example.com')?.invitedAt).toBeTruthy()

    // The Contact state — known to the business, never asked.
    expect(accessOf(by('dave@example.com'))).toBe(NOT_MEMBER)
    expect(stageOf(by('dave@example.com'))).toBe(LEAD)
    expect(by('dave@example.com')?.invitedAt).toBeFalsy()
  })

  /**
   * The product's honest answer, asserted so it is not mistaken for a defect.
   *
   * `admit` resolves a person against the deployment's own business, so a row in
   * Alice's Plumbing is `no_user` at this door — Bob's login reaches no app
   * because Alice's Plumbing does not have one (DOC-42 §1). `bin/access-sim` will
   * still offer him, which is how the refusal gets seen rather than assumed.
   */
  it('test_UAT_FC_REQ-192_alices_people_are_not_users_of_this_deployment', async () => {
    for (const email of ['bob@example.com', 'carol@example.com', 'dave@example.com']) {
      const admission = await admit(identityEnv(), email)
      expect(admission.ok).toBe(false)
      if (!admission.ok) expect(admission.reason).toBe('no_user')
    }
  })

  /**
   * `needsAcceptance` compares the STORED VERSION against `TERMS_VERSION`, not
   * merely the presence of a stamp — so a seed carrying an older string produces
   * a person who is signed up and still refused by `guardTerms`, which reads as a
   * broken fixture rather than as the re-acceptance it actually is. Bumping the
   * terms is exactly when that rots, so the two are pinned together here.
   */
  it('test_UAT_FC_REQ-192_seeded_members_have_accepted_the_current_terms', async () => {
    const { results } = await env.DB.prepare(
      'SELECT id, tos_version FROM users WHERE tos_accepted_at IS NOT NULL',
    ).all<{ id: string; tos_version: string | null }>()

    expect((results ?? []).length).toBeGreaterThan(0)
    for (const row of results ?? []) expect(row.tos_version).toBe(TERMS_VERSION)

    const admission = await admit(identityEnv(), ALICE)
    if (!admission.ok) throw new Error('Alice was not admitted.')
    expect(needsAcceptance(admission.user, TERMS_VERSION)).toBe(false)
  })

  /**
   * The seed creates no platform operator, and both halves are checked because
   * REQ-185 split them into two independent facts: `platform_operator` is the
   * hosting half and an `owner` membership on this deployment's own business is
   * the ownership half. `PLATFORM_ADMINS` writes both, and two ways to create the
   * same rows is the legacy path CLAUDE.md forbids — so this file must write
   * neither.
   */
  it('test_UAT_FC_REQ-192_the_seed_creates_no_platform_operator', async () => {
    const operators = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM users WHERE platform_operator = 1',
    ).first<{ n: number }>()
    expect(operators?.n).toBe(0)

    const memberships = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM memberships WHERE business_id = ?',
    )
      .bind(PLATFORM)
      .first<{ n: number }>()
    expect(memberships?.n).toBe(0)
  })

  /**
   * Re-running it changes nothing — the acceptance clause, checked as bytes.
   *
   * NOT "IT DOES NOT ERROR", WHICH IS THE WEAKER CLAIM AND THE EASY ONE TO PASS.
   * Every statement is `INSERT OR IGNORE` against a fixed primary key, so a
   * second run must leave `created_at`, `granted_at` and `updated_at` exactly
   * where the first run put them. Comparing whole rows is what catches an
   * `INSERT OR REPLACE` slipping in later: that would also not error, and would
   * silently move every timestamp forward.
   */
  it('test_UAT_FC_REQ-192_re_running_the_seed_changes_nothing', async () => {
    const before = await snapshot()
    await applySeed()
    expect(await snapshot()).toBe(before)
  })
})
