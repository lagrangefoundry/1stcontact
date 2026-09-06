import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { peopleOf } from '../apps/control-app/src/people'
import { greetingOf } from '../apps/control-app/src/builder/people-name.js'
import { applySchema } from './support/d1-site-factory'
import seedSql from '../db/dev-seed.sql?raw'

/**
 * REQ-193 — **the development fixture holds four shapes of name, not one**.
 *
 * WHY THE SEED IS THIS TICKET'S BUSINESS. `users.display_name` is gone, so
 * [[REQ-192]]'s fixture had to move to `user_names` or stop applying at all.
 * Moving it was the opportunity to make it demonstrate something: a fixture
 * where everybody is `Firstname Lastname` exercises one row of the table seven
 * times and proves nothing about the six columns allowed to be empty.
 *
 * SO THE CAST CARRIES THE SHAPES THAT ARE OTHERWISE UNREACHABLE BY CLICKING —
 * a mononym, a `known_as` that no parse of the parts would produce, a greeting
 * that falls through to `given_name`, a genuine former name beside a corrected
 * typo, and a supersession with no reason at all. Each is a claim the schema
 * makes and nothing a human looks at demonstrates.
 *
 * IT RUNS IN WORKERD THROUGH `peopleOf`, for the reason REQ-192's own suite
 * records: asserting "there is a row whose `display_name` is `Carol`" restates
 * the seed in a second dialect and passes forever, including on the day the
 * resolver stops returning her.
 */

const PLATFORM = 'acct_51a6746495c8057e886ff98d4208e6b9'
const PLUMBING = 'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61'

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

/**
 * Comments are stripped BEFORE the split on `;`, not after — the file's prose
 * explains a design and prose contains semicolons, so splitting first cuts a
 * comment in half and feeds SQLite the remainder.
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

/** Everybody in a business, keyed by the address they are reached at. */
async function cast(businessId: string) {
  const people = await peopleOf(identityEnv(), { businessId })
  return new Map(people.map((p) => [p.email, p]))
}

describe('REQ-193 — the seeded names', () => {
  beforeAll(async () => {
    await applySchema(env.DB as D1Database)
    await applySeed()
  })

  it('test_UAT_FC_REQ-193_the_seed_gives_every_person_exactly_one_current_name', async () => {
    // The partial unique index would have refused a second live row, so this is
    // really the claim that the seed APPLIES — the shape it would have failed on
    // is the one where a superseded row was written without its stamp.
    const people = await cast(PLUMBING)
    const platform = await cast(PLATFORM)

    for (const person of [...people.values(), ...platform.values()]) {
      expect(person.name).not.toBeNull()
      expect(person.name?.displayName).toBeTruthy()
    }
  })

  it('test_UAT_FC_REQ-193_a_seeded_mononym_has_no_given_name_and_no_family_name', async () => {
    // Carol is the acceptance criterion a required `family_name` would have made
    // unrepresentable, standing in the fixture rather than only in a test.
    const carol = (await cast(PLUMBING)).get('carol@example.com')

    expect(carol?.name?.displayName).toBe('Carol')
    expect(carol?.name?.givenName).toBeNull()
    expect(carol?.name?.familyName).toBeNull()
    expect(greetingOf(carol)).toBe('Carol')
  })

  it('test_UAT_FC_REQ-193_a_seeded_display_name_is_stored_and_not_assembled', async () => {
    // `Dr Alice Nowak` carries the title; nothing concatenated it on. The proof
    // is Carol above, whose parts are empty and who displays anyway — an
    // assembler would have produced an empty string for her.
    const alice = (await cast(PLATFORM)).get('alice@plumbing.example')

    expect(alice?.name?.displayName).toBe('Dr Alice Nowak')
    expect(alice?.name?.title).toBe('Dr')
    expect(alice?.name?.givenName).toBe('Alice')
  })

  it('test_UAT_FC_REQ-193_a_seeded_known_as_is_the_greeting_and_no_parse_would_find_it', async () => {
    // Nobody alive calls Robert Robert. `known_as` is the highest-frequency read
    // in the record precisely because it does not derive from the parts, and the
    // fixture is where that stops being an assertion about a hypothetical.
    const bob = (await cast(PLUMBING)).get('bob@example.com')

    expect(bob?.name?.displayName).toBe('Robert Fenwick')
    expect(bob?.name?.knownAs).toBe('Bob')
    expect(greetingOf(bob)).toBe('Bob')
  })

  it('test_UAT_FC_REQ-193_a_seeded_person_with_no_known_as_is_greeted_by_given_name', async () => {
    // The middle rung of the fallback chain, exercised by the fixture and not
    // only by a constructed row.
    const dave = (await cast(PLUMBING)).get('dave@example.com')

    expect(dave?.name?.knownAs).toBeNull()
    expect(greetingOf(dave)).toBe('Dave')
  })

  it('test_UAT_FC_REQ-193_a_seeded_name_change_is_a_former_name_and_a_typo_is_not', async () => {
    // THE DISTINCTION THE WHOLE DESIGN TURNS ON, in the fixture. Alice holds two
    // superseded rows: `Alice Kowalczyk`, a real former name, and `Alise Nowak`,
    // a typo. Only the first travels. If `Alise` ever appears here the filter has
    // regressed in exactly the direction that surfaces a deadname.
    const alice = (await cast(PLATFORM)).get('alice@plumbing.example')

    expect(alice?.formerNames).toEqual(['Alice Kowalczyk'])
  })

  it('test_UAT_FC_REQ-193_a_seeded_supersession_with_no_reason_is_a_correction', async () => {
    // Bob's `Robert Fennwick` carries a null reason, and the default is the safe
    // one: it does not reach the client, so it cannot be searched or shown.
    const bob = (await cast(PLUMBING)).get('bob@example.com')

    expect(bob?.formerNames).toEqual([])
  })

  it('test_UAT_FC_REQ-193_a_seeded_name_change_moved_no_key', async () => {
    // Alice's former and current names hold the same `user_id` and different
    // `id`s, so every membership, entitlement and address still points at her.
    const { results } = await (env.DB as D1Database)
      .prepare('SELECT id, display_name FROM user_names WHERE user_id = ? ORDER BY created_at ASC')
      .bind('usr_4a1cb8e07f3d492ea60b25d8fc19e73a')
      .all<{ id: string; display_name: string }>()

    expect(results.map((r) => r.display_name)).toEqual([
      'Alice Kowalczyk',
      'Alise Nowak',
      'Dr Alice Nowak',
    ])
    expect(new Set(results.map((r) => r.id)).size).toBe(3)

    const memberships = await (env.DB as D1Database)
      .prepare('SELECT COUNT(*) AS n FROM memberships WHERE user_id = ?')
      .bind('usr_4a1cb8e07f3d492ea60b25d8fc19e73a')
      .first<{ n: number }>()
    expect(memberships?.n).toBe(3)
  })
})
