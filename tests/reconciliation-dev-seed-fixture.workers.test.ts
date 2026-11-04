import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { admit, type IdentityEnv } from '../apps/control-app/src/identity'
import { peopleOf, personDetail } from '../apps/control-app/src/people'
import { needsAcceptance, TERMS_VERSION } from '../apps/control-app/src/terms'
import { accessOf, stageOf, MEMBER, NOT_MEMBER, LEAD, INVITED } from '../apps/control-app/src/builder/people-axes.js'
import { greetingOf } from '../apps/control-app/src/builder/people-name.js'
import { applySchema } from './support/d1-site-factory'
import seedSql from '../db/dev-seed.sql?raw'
import wranglerToml from '../apps/control-app/wrangler.toml?raw'

/**
 * Story story-5b5be809 — the development fixture, as the PRODUCT sees it.
 *
 * The baseline schema is applied to a real D1 inside workerd and
 * `db/dev-seed.sql` (the file `bin/seed` hands to wrangler) is applied on top.
 * Every assertion then goes through the functions the Worker itself calls —
 * `admit`, `peopleOf`, `personDetail`, `needsAcceptance`, `greetingOf` — so a
 * fixture whose rows look right but do not compose into the stated states fails.
 *
 * The deployment's tenant is read out of `wrangler.toml`, not restated, so the
 * claim "Alice signs in against the deployment as configured" is tested against
 * the configuration itself.
 */

const CONFIGURED_TENANT = (() => {
  const match = /^TENANT_ID\s*=\s*"([^"]+)"/m.exec(wranglerToml)
  if (!match) throw new Error('wrangler.toml declares no TENANT_ID')
  return match[1]
})()

const PLUMBING = 'biz_c1f0a4b7e2d84936ab5107cc9e3f2d61'
const LETTINGS = 'biz_7b93de5140fa4c28bd06e91a7c4f83b2'
const OLD_SALON = 'biz_2e58ca6f9d074b13a8fe30dd51b6947c'

const ALICE = 'alice@plumbing.example'
const ALICE_SECOND = 'alice@oldsalon.example'
const ALICE_ID = 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a'
const BOB_ID = 'usr_b62f8d40a1e74c93bf5017ce8a2d6b39'

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: CONFIGURED_TENANT }
}

/** Comments stripped before splitting on `;` — the fixture's prose contains semicolons. */
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

async function aliceAdmission() {
  const admission = await admit(identityEnv(), ALICE)
  if (!admission.ok) throw new Error(`Alice was not admitted: ${admission.reason}`)
  return admission
}

beforeAll(async () => {
  await applySchema()
  await applySeed()
})

describe('story-5b5be809 — the seeded cast, through the product', () => {
  it('test_UAT_AC2306_alice_is_one_person_at_either_address_with_the_primary_shown', async () => {
    const atPrimary = await admit(identityEnv(), ALICE)
    const atSecondary = await admit(identityEnv(), ALICE_SECOND)
    expect(atPrimary.ok).toBe(true)
    expect(atSecondary.ok).toBe(true)
    if (!atPrimary.ok || !atSecondary.ok) return

    // Same person, same three businesses.
    expect(atSecondary.user.id).toBe(atPrimary.user.id)
    expect(atPrimary.businesses.map((b) => b.businessId).sort()).toEqual(
      [PLUMBING, LETTINGS, OLD_SALON].sort(),
    )
    expect(atSecondary.businesses.map((b) => b.businessId)).toEqual(
      atPrimary.businesses.map((b) => b.businessId),
    )

    // The shown address is the primary whichever address she arrived at.
    expect(atPrimary.user.email).toBe(ALICE)
    expect(atSecondary.user.email).toBe(ALICE)

    // Exactly one address is primary, and it is the plumbing one.
    const detail = await personDetail(identityEnv(), { businessId: CONFIGURED_TENANT }, atPrimary.user.id)
    const emails = detail?.emails ?? []
    expect(emails.map((e) => e.email).sort()).toEqual([ALICE_SECOND, ALICE].sort())
    expect(emails.filter((e) => e.isPrimary).map((e) => e.email)).toEqual([ALICE])
  })

  it('test_UAT_AC2307_an_ended_grant_business_is_listed_but_not_selectable', async () => {
    const admission = await aliceAdmission()
    const byName = new Map(admission.businesses.map((b) => [b.name, b]))

    expect([...byName.keys()].sort()).toEqual(
      ["Alice's Lettings", "Alice's Old Salon", "Alice's Plumbing"],
    )
    expect(byName.get("Alice's Plumbing")?.selectable).toBe(true)
    expect(byName.get("Alice's Lettings")?.selectable).toBe(true)
    expect(byName.get("Alice's Old Salon")?.selectable).toBe(false)
    expect(byName.get("Alice's Old Salon")?.lapse?.reason).toBe('expired')

    // The two selectable ones are open-ended; the salon's grant ended in the past.
    const { results } = await env.DB.prepare(
      'SELECT business_id, ends_at FROM entitlements WHERE business_id IN (?, ?, ?)',
    )
      .bind(PLUMBING, LETTINGS, OLD_SALON)
      .all<{ business_id: string; ends_at: string | null }>()
    const ends = new Map(results.map((r) => [r.business_id, r.ends_at]))
    expect(ends.get(PLUMBING)).toBeNull()
    expect(ends.get(LETTINGS)).toBeNull()
    expect(Date.parse(ends.get(OLD_SALON) ?? '')).toBeLessThan(Date.now())
  })

  it('test_UAT_AC2308_alices_plumbing_holds_a_member_an_invitee_and_a_lead', async () => {
    const people = await peopleOf(identityEnv(), { businessId: PLUMBING })
    const by = (email: string) => people.find((p) => p.email === email)
    expect(people.map((p) => p.email).sort()).toEqual([
      'bob@example.com',
      'carol@example.com',
      'dave@example.com',
    ])

    // Bob: invited and signed up, at the current terms.
    const bob = by('bob@example.com')
    expect(accessOf(bob)).toBe(MEMBER)
    expect(stageOf(bob)).toBe(INVITED)
    expect(bob?.invitedAt).toBeTruthy()
    expect(bob?.termsAcceptedAt).toBeTruthy()
    const bobTerms = await env.DB.prepare('SELECT tos_version FROM users WHERE id = ?')
      .bind(BOB_ID)
      .first<{ tos_version: string | null }>()
    expect(bobTerms?.tos_version).toBe(TERMS_VERSION)

    // Carol: invited, never came.
    const carol = by('carol@example.com')
    expect(accessOf(carol)).toBe(NOT_MEMBER)
    expect(stageOf(carol)).toBe(INVITED)
    expect(carol?.invitedAt).toBeTruthy()
    expect(carol?.termsAcceptedAt).toBeNull()

    // Dave: a lead, never invited.
    const dave = by('dave@example.com')
    expect(accessOf(dave)).toBe(NOT_MEMBER)
    expect(stageOf(dave)).toBe(LEAD)
    expect(dave?.invitedAt).toBeNull()
    expect(dave?.termsAcceptedAt).toBeNull()

    // None is a user of the deployment's business, and the door says so honestly.
    const platformPeople = await peopleOf(identityEnv(), { businessId: CONFIGURED_TENANT })
    const platformEmails = platformPeople.map((p) => p.email)
    for (const email of ['bob@example.com', 'carol@example.com', 'dave@example.com']) {
      expect(platformEmails).not.toContain(email)
      const admission = await admit(identityEnv(), email)
      expect(admission.ok).toBe(false)
      if (!admission.ok) expect(admission.reason).toBe('no_user')
    }
  })

  it('test_UAT_AC2309_seeded_alice_signs_in_at_current_terms_with_no_platform_membership', async () => {
    const admission = await aliceAdmission()
    expect(admission.user.tenant_id).toBe(CONFIGURED_TENANT)

    // Not stopped by the terms gate: the stored version is the one in force.
    expect(needsAcceptance(admission.user, TERMS_VERSION)).toBe(false)
    const { results } = await env.DB.prepare(
      'SELECT tos_version FROM users WHERE tos_accepted_at IS NOT NULL',
    ).all<{ tos_version: string | null }>()
    expect(results.length).toBeGreaterThan(0)
    for (const row of results) expect(row.tos_version).toBe(TERMS_VERSION)

    // No membership links her to the platform business.
    expect(admission.businesses.some((b) => b.businessId === CONFIGURED_TENANT)).toBe(false)
    const platformMembership = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM memberships WHERE user_id = ? AND business_id = ?',
    )
      .bind(ALICE_ID, CONFIGURED_TENANT)
      .first<{ n: number }>()
    expect(platformMembership?.n).toBe(0)
  })

  it('test_UAT_AC2310_every_seeded_person_has_one_current_name_across_four_shapes', async () => {
    // Exactly one current name per seeded person.
    const { results: current } = await env.DB.prepare(
      'SELECT u.id AS id, COUNT(n.id) AS n FROM users u ' +
        'LEFT JOIN user_names n ON n.user_id = u.id AND n.superseded_at IS NULL GROUP BY u.id',
    ).all<{ id: string; n: number }>()
    expect(current.length).toBe(4)
    for (const row of current) expect(row.n, row.id).toBe(1)

    const plumbing = new Map(
      (await peopleOf(identityEnv(), { businessId: PLUMBING })).map((p) => [p.email, p]),
    )
    const platform = new Map(
      (await peopleOf(identityEnv(), { businessId: CONFIGURED_TENANT })).map((p) => [p.email, p]),
    )

    // Alice: title, known-as greeting, a former name and a correction that is not one.
    const alice = platform.get(ALICE)
    expect(alice?.name?.displayName).toBe('Dr Alice Nowak')
    expect(alice?.name?.title).toBe('Dr')
    expect(alice?.name?.knownAs).toBe('Ali')
    expect(greetingOf(alice)).toBe('Ali')
    expect(alice?.formerNames).toEqual(['Alice Kowalczyk'])

    // Bob: a reasonless supersession is a correction, not a former name.
    const bob = plumbing.get('bob@example.com')
    expect(bob?.formerNames).toEqual([])
    const bobSuperseded = await env.DB.prepare(
      'SELECT superseded_reason FROM user_names WHERE user_id = ? AND superseded_at IS NOT NULL',
    )
      .bind(BOB_ID)
      .all<{ superseded_reason: string | null }>()
    expect(bobSuperseded.results.map((r) => r.superseded_reason)).toEqual([null])

    // Carol: a mononym.
    const carol = plumbing.get('carol@example.com')
    expect(carol?.name?.displayName).toBe('Carol')
    expect(carol?.name?.givenName).toBeNull()
    expect(carol?.name?.familyName).toBeNull()

    // Dave: no known-as, greeted by his given name.
    const dave = plumbing.get('dave@example.com')
    expect(dave?.name?.knownAs).toBeNull()
    expect(greetingOf(dave)).toBe('Dave')

    // Superseding moved no key: all of Alice's names hang off her one id.
    const { results: aliceNames } = await env.DB.prepare(
      'SELECT id, user_id FROM user_names WHERE display_name IN (?, ?, ?)',
    )
      .bind('Alice Kowalczyk', 'Alise Nowak', 'Dr Alice Nowak')
      .all<{ id: string; user_id: string }>()
    expect(aliceNames.length).toBe(3)
    expect(new Set(aliceNames.map((r) => r.user_id))).toEqual(new Set([ALICE_ID]))
    expect(alice?.id).toBe(ALICE_ID)
  })
})
