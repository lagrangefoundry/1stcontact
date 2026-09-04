import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  ticketStoreFor,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * story-e07c589b — **the four answers the rights statement carries beyond
 * provenance**: what the client said the file is *for*, and what the platform
 * managed to make of it.
 *
 * WHY A SUITE OF ITS OWN, ALONGSIDE THE ONE THAT PROVES THE SIX-PART STATEMENT.
 * The six parts of rights and provenance are stated by whoever ingests the file
 * and are all required-or-conditional. These four are not: they are optional
 * additions to the same shared block, and each exists for a reason the six
 * cannot serve — `role` because provenance cannot infer intention, and the
 * description trio because an empty body cannot tell "nothing has looked at
 * this yet" apart from "something looked and found nothing to say".
 *
 * WHAT IS BEING PROVED, AND WHERE. Exactly as the sibling suite: inside workerd,
 * through the single wiring point the Worker itself uses, against a real D1
 * database whose tables come from `db/migrations` applied in the deployment's
 * own order. Every refusal is observed by asking an account-scoped store to
 * create a record and watching it fail. A rule that is not actually wired into
 * the pack the Worker builds cannot make one of these tests pass.
 *
 * WHY EACH CLAIM TAKES AN ACCOUNT OF ITS OWN. Both criteria claim more than "a
 * create was refused" — they claim NO RECORD CAME INTO EXISTENCE as a result,
 * and AC-1589 claims a whole *listing* has a shape. Both are only observable in
 * a store nothing else has written to, so accounts are never shared between the
 * two tests and never between the phases within one.
 *
 * THIS SUITE CLAIMS THE VOCABULARY, NEVER THE MECHANISM. Who *asks* for a role
 * is the browser upload surface; what *decides* a description outcome is the
 * description pipeline; what *reads* a filename back is the Library listing.
 * None of those behaviours is asserted here. What is asserted is that the
 * vocabulary declares the four answers, carries them identically on both kinds
 * that hold the rights statement, refuses a value outside a closed set, and
 * accepts their absence.
 */

/** The two kinds that carry the rights and provenance statement. */
const CARRIERS = ['material', 'reference']

/** The two answers to *what the client said the file is for*. */
const ROLES = ['site', 'reference']

/** The six answers to *how the description went* — one real one and five not. */
const DESCRIPTION_OUTCOMES = [
  'ok',
  'no_describer',
  'no_text',
  'unsupported',
  'too_large',
  'failed',
]

/** The Worker's own bindings, scoped to one account. */
function ticketEnv(account: string): TicketStoreEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: account,
  }
}

/** An account-scoped store, through the single wiring point the Worker uses. */
function storeFor(account: string): Promise<TicketStore> {
  return ticketStoreFor(ticketEnv(account))
}

/**
 * A complete rights and provenance statement — the happy shape, stated once.
 *
 * Deliberately the *minimum* complete one: an upload, which is the origin that
 * has no address. Nothing in this suite turns on the six parts; they are here so
 * that every create below is refused (or accepted) for the reason under test and
 * never for a missing part of the statement it shares a block with.
 */
function statement(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    kind: 'document',
    ...over,
  }
}

beforeAll(async () => {
  await applySchema()
})

describe('story-e07c589b — what the client said the file is for', () => {
  it('test_UAT_AC1588_a_role_is_optional_refused_outside_the_two_answers_and_not_a_reading_of_republishability', async () => {
    // ── it is carried, unchanged, by both kinds that hold the statement ─────
    // Both roles on both carriers rather than one of each: the claim is that the
    // answer is carried IDENTICALLY on the two kinds, which a single sample per
    // kind could satisfy while the two enums had drifted apart.
    const stated = await storeFor('story-e07c589b-ac1588-stated')
    for (const carrier of CARRIERS) {
      for (const role of ROLES) {
        const { ticket } = await stated.create({
          type: carrier,
          title: `A ${carrier} the client said is for '${role}'`,
          fields: statement({ role }),
        })
        const { ticket: read } = await stated.get({ uid: ticket.uid })
        expect(read.type).toBe(carrier)
        expect(read.fields.role, `a ${carrier} reads '${role}' back unchanged`).toBe(role)
        // And the six parts it shares a block with are untouched by its presence.
        expect(read.fields).toMatchObject(statement())
      }
    }

    // ── its absence is an ordinary state, not a refusal ─────────────────────
    // The paths that ingest material without a client present — anything
    // programmatic — were never in a position to ask. Their records are valid
    // and their rights stand on provenance alone.
    for (const carrier of CARRIERS) {
      const { ticket } = await stated.create({
        type: carrier,
        title: `A ${carrier} nobody was asked about`,
        fields: statement(),
      })
      const { ticket: read } = await stated.get({ uid: ticket.uid })
      expect(read.uid, `a ${carrier} with no role is accepted`).toBeTruthy()
      expect(read.fields.role, 'it reads back with no such answer').toBeUndefined()
      // Absent, not blank: a positive "nothing was said" rather than an empty
      // value the reader would have to interpret.
      expect('role' in read.fields).toBe(false)
      // And the rights it does carry are complete all the same.
      expect(read.fields).toMatchObject(statement())
    }

    // ── a value outside the two is refused, never coerced and never dropped ─
    // Both silent outcomes are wrong in a way nobody would notice: a misspelling
    // that silently became 'site' would publish something nobody meant to
    // publish, and one that silently vanished would leave the answer unrecorded
    // with nothing said. The capitalised variants are the likeliest accidental
    // widening, and they widen precisely into the answer that publishes things.
    const refusing = await storeFor('story-e07c589b-ac1588-refused')
    const outside = [
      { label: 'an answer outside the two', value: 'assistant' },
      { label: 'a plausible synonym', value: 'reading' },
      { label: 'a permitted answer differing only in capitalisation', value: 'Site' },
      { label: 'a permitted answer shouted', value: 'REFERENCE' },
      { label: 'an empty answer', value: '' },
    ]
    for (const carrier of CARRIERS) {
      for (const { label, value } of outside) {
        await expect(
          refusing.create({
            type: carrier,
            title: `A ${carrier} naming ${label}`,
            fields: statement({ role: value }),
          }),
          `a ${carrier} naming ${label} is refused as a validation error`,
        ).rejects.toMatchObject({ code: 'validation' })
      }
    }

    // No record came into existence as a result — neither coerced to one of the
    // two, nor stored with the answer quietly dropped. The whole account is
    // empty, which is the only form "nothing was stored" can take.
    const { tickets: afterRefusals } = await refusing.list({ limit: 'all' })
    expect(afterRefusals, 'a refused role leaves nothing behind').toEqual([])

    // Non-vacuity: the listing does report records when there are any, so the
    // emptiness above is the refusal and not a listing that never reports.
    const { ticket: accepted } = await refusing.create({
      type: 'material',
      title: 'A material naming a permitted answer',
      fields: statement({ role: 'site' }),
    })
    const { tickets: withOne } = await refusing.list({ limit: 'all' })
    expect(withOne.map((t) => t.uid)).toEqual([accepted.uid])
    expect(withOne[0].fields.role).toBe('site')

    // ── and it is not a reading of the republish answer ─────────────────────
    // A capture of the client's OWN previous site is republishable and yet
    // plainly reference material, so the two come apart and neither may be
    // derived from the other. All four combinations are accepted and returned
    // exactly as supplied.
    const independent = await storeFor('story-e07c589b-ac1588-independent')
    for (const republishable of [true, false]) {
      for (const role of ROLES) {
        const { ticket } = await independent.create({
          type: 'material',
          title: `republishable=${republishable}, role=${role}`,
          fields: statement({ republishable, role }),
        })
        const { ticket: read } = await independent.get({ uid: ticket.uid })
        expect(read.fields.republishable, 'the republish answer as supplied').toBe(republishable)
        expect(read.fields.role, 'the role as supplied, not derived').toBe(role)
      }
    }
  })
})

describe('story-e07c589b — what the platform managed to make of the file', () => {
  it('test_UAT_AC1589_a_material_records_its_description_outcome_describer_and_filename_and_the_degraded_are_selectable_from_the_listing', async () => {
    // ── each of the six outcomes is recorded and read back unchanged ────────
    const described = await storeFor('story-e07c589b-ac1589-described')
    const filed: Array<{ uid: string; outcome: string }> = []
    for (const outcome of DESCRIPTION_OUTCOMES) {
      const { ticket } = await described.create({
        type: 'material',
        title: `A material whose description went '${outcome}'`,
        fields: statement({
          description_status: outcome,
          // Free text, not a closed set: the value names a describer as that
          // describer names itself, so a model id and an extractor's name are
          // both ordinary values and neither is a change to the vocabulary.
          description_model: outcome === 'ok' ? 'stub/vision-1' : `probe/${outcome}`,
          filename: `${outcome}.pdf`,
        }),
      })
      const { ticket: read } = await described.get({ uid: ticket.uid })
      expect(read.fields.description_status, 'how the description went').toBe(outcome)
      expect(read.fields.description_model, 'what produced it').toBe(
        outcome === 'ok' ? 'stub/vision-1' : `probe/${outcome}`,
      )
      expect(read.fields.filename, 'the name the file arrived under').toBe(`${outcome}.pdf`)
      filed.push({ uid: ticket.uid, outcome })
    }

    // ── the consequence: the degraded are picked out of the LISTING alone ───
    // This is why the three are declared vocabulary rather than fields the store
    // merely tolerates. Every entry carries all three, so revisiting material
    // the platform could not read is a query over the account's records rather
    // than a sweep that opens each one — no body is read here and no blob is
    // fetched.
    const { tickets: listing } = await described.list({ type: 'material', limit: 'all' })
    expect(listing).toHaveLength(DESCRIPTION_OUTCOMES.length)
    for (const row of listing) {
      expect(row.fields.description_status, 'every entry states its outcome').toBeDefined()
      expect(row.fields.description_model, 'every entry names its describer').toBeDefined()
      expect(row.fields.filename, 'every entry carries a name a client recognises').toBeDefined()
    }
    const degradedFromListing = listing
      .filter((row) => row.fields.description_status !== 'ok')
      .map((row) => row.uid)
      .sort()
    expect(degradedFromListing, 'the five ways a description is not a real one').toEqual(
      filed
        .filter((f) => f.outcome !== 'ok')
        .map((f) => f.uid)
        .sort(),
    )

    // And selectable by a predicate over the answers themselves, not only by
    // filtering a listing in the caller.
    const { tickets: noText } = await described.query({
      predicate: 'type=material AND fields.description_status=no_text',
      limit: 'all',
    })
    expect(noText.map((t) => t.uid)).toEqual([
      filed.find((f) => f.outcome === 'no_text')!.uid,
    ])

    // ── all three are optional, and each may stand alone ────────────────────
    // A reference created by a capture has none of them at the moment its bundle
    // lands, and material can arrive without a name. They are declared
    // independently, so a record may state an outcome with no describer named,
    // or a name with neither — the trio is not a compound field.
    const sparse = await storeFor('story-e07c589b-ac1589-sparse')
    const partials: Array<{ label: string; fields: Record<string, unknown> }> = [
      { label: 'none of the three, as a capture bundle lands', fields: {} },
      { label: 'an outcome with no describer and no name', fields: { description_status: 'no_describer' } },
      { label: 'a describer alone', fields: { description_model: 'unpdf' } },
      { label: 'a name alone', fields: { filename: 'brand-guide.pdf' } },
      {
        label: 'an outcome and a name but no describer',
        fields: { description_status: 'no_text', filename: 'scan.pdf' },
      },
    ]
    for (const carrier of CARRIERS) {
      for (const { label, fields } of partials) {
        const { ticket } = await sparse.create({
          type: carrier,
          title: `A ${carrier} stating ${label}`,
          fields: statement(fields),
        })
        const { ticket: read } = await sparse.get({ uid: ticket.uid })
        expect(read.uid, `a ${carrier} stating ${label} is accepted`).toBeTruthy()
        for (const name of ['description_status', 'description_model', 'filename']) {
          if (name in fields) {
            expect(read.fields[name], `${name} is returned as supplied`).toBe(fields[name])
          } else {
            expect(name in read.fields, `${name} is absent, not blank`).toBe(false)
          }
        }
      }
    }

    // ── an outcome outside the six is refused, and stores nothing ───────────
    const refusing = await storeFor('story-e07c589b-ac1589-refused')
    const outside = [
      { label: 'an outcome outside the six', value: 'degraded' },
      { label: 'a plausible synonym', value: 'error' },
      { label: 'a permitted outcome differing only in capitalisation', value: 'OK' },
      { label: 'an empty outcome', value: '' },
    ]
    for (const carrier of CARRIERS) {
      for (const { label, value } of outside) {
        await expect(
          refusing.create({
            type: carrier,
            title: `A ${carrier} recording ${label}`,
            fields: statement({ description_status: value }),
          }),
          `a ${carrier} recording ${label} is refused as a validation error`,
        ).rejects.toMatchObject({ code: 'validation' })
      }
    }
    const { tickets: afterRefusals } = await refusing.list({ limit: 'all' })
    expect(afterRefusals, 'a refused outcome leaves no record stored').toEqual([])

    // Non-vacuity, as above: the listing reports records when there are any.
    const { ticket: accepted } = await refusing.create({
      type: 'material',
      title: 'A material recording an outcome inside the six',
      fields: statement({ description_status: 'failed' }),
    })
    expect((await refusing.list({ limit: 'all' })).tickets.map((t) => t.uid)).toEqual([
      accepted.uid,
    ])

    // ── and the answers, not the empty body, carry the pre-description state ─
    // Before these fields existed an empty body had to mean both "nothing has
    // described this yet" and "something looked and found nothing to say". Here
    // the two records have IDENTICAL empty bodies and are told apart by their
    // fields alone — which is what makes the body the description's home and the
    // fields the home of whether there is one.
    const shadows = await storeFor('story-e07c589b-ac1589-shadows')
    const { ticket: untried } = await shadows.create({
      type: 'material',
      title: 'Nothing has tried to describe this',
      fields: statement({ filename: 'just-arrived.pdf' }),
    })
    const { ticket: tried } = await shadows.create({
      type: 'material',
      title: 'Something looked and found nothing to say',
      fields: statement({ description_status: 'no_text', filename: 'scanned.pdf' }),
    })
    const { ticket: readUntried } = await shadows.get({ uid: untried.uid })
    const { ticket: readTried } = await shadows.get({ uid: tried.uid })

    expect(readUntried.body, 'both bodies are empty').toBe('')
    expect(readTried.body, 'both bodies are empty').toBe('')
    expect(readTried.body, 'the bodies are identical, so they cannot be the discriminator').toBe(
      readUntried.body,
    )
    expect(
      'description_status' in readUntried.fields,
      'no outcome stated: nothing has yet tried',
    ).toBe(false)
    expect(
      readTried.fields.description_status,
      'an outcome stated: the attempt happened and this is how it went',
    ).toBe('no_text')
  })
})
