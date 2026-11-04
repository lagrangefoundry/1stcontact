import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  CONTACT_CREATED,
  CONTACT_INVITED,
  EMAIL_BOUNCED,
  EMAIL_DELIVERED,
  EMAIL_RECEIVED,
  EMAIL_SENT,
  MEMBER_SIGNED_UP,
} from '../apps/control-app/src/builder/contact-events.js'
import {
  UnknownContactError,
  eventsOf,
  provenanceOf,
  recordEvent,
} from '../apps/control-app/src/events'
import { ensurePlatformOperator, type IdentityEnv } from '../apps/control-app/src/identity'
import { invitePerson, personDetail } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'
import { seedContact } from './support/contact'

/**
 * Reconciliation UATs — story-4630e921 (REQ-195): a contact's history is an
 * append-only, business-scoped event record.
 *
 * Runs inside workerd against a real D1 with the shipped baseline migration
 * applied. Emission goes through the shipped functions (`invitePerson`,
 * `acceptTerms`, `ensurePlatformOperator`); kinds with no emitter yet
 * (`email.*`, `list.joined`, …) go through `recordEvent`, the scoped write path
 * those capabilities will call. One test per acceptance criterion.
 */

const A = 'recon195-business-a'
const B = 'recon195-business-b'

function identityEnv(tenantId = A): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

const scope = (businessId = A) => ({ businessId })

let seq = 0
const anEmail = (): string => `recon195-${(seq += 1)}@example.test`

const kinds = (events: Array<{ kind: string }>): string[] => events.map((e) => e.kind)

async function storedEventCount(contactId: string): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM contact_events WHERE contact_id = ?')
    .bind(contactId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

beforeAll(async () => {
  await applySchema()
})

describe('story-4630e921 — events are immutable facts', () => {
  it('test_UAT_AC2258_a_recorded_event_cannot_be_rewritten_and_has_no_status', async () => {
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const written = await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: EMAIL_SENT,
      occurredAt: '2026-05-01T10:00:00.000Z',
      ref: 'email-immut',
      detail: { subject: 'Hello' },
    })

    // A direct statement against the deployed store, not only the product path.
    await expect(
      env.DB.prepare("UPDATE contact_events SET kind = 'email.delivered' WHERE id = ?")
        .bind(written.id)
        .run(),
    ).rejects.toThrow()
    await expect(
      env.DB.prepare("UPDATE contact_events SET detail = '{}' WHERE id = ?").bind(written.id).run(),
    ).rejects.toThrow()

    const [still] = await eventsOf(identityEnv(), scope(), contact)
    expect(still.id).toBe(written.id)
    expect(still.kind).toBe(EMAIL_SENT)
    expect(still.occurredAt).toBe('2026-05-01T10:00:00.000Z')
    expect(still.recordedAt).toBe(written.recordedAt)
    expect(still.ref).toBe('email-immut')
    expect(still.detail).toEqual({ subject: 'Hello' })

    // No mutable-outcome column exists to rewrite.
    await expect(env.DB.prepare('SELECT status FROM contact_events LIMIT 1').all()).rejects.toThrow()
  })

  it('test_UAT_AC2259_a_changing_delivery_outcome_appends_against_the_same_ref', async () => {
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const message = 'email-outcome-1'
    for (const kind of [EMAIL_SENT, EMAIL_BOUNCED, EMAIL_DELIVERED]) {
      await recordEvent(identityEnv(), scope(), { contactId: contact, kind, ref: message })
    }

    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(history).toHaveLength(3)
    expect(new Set(kinds(history))).toEqual(new Set([EMAIL_SENT, EMAIL_BOUNCED, EMAIL_DELIVERED]))
    expect(new Set(history.map((e) => e.ref))).toEqual(new Set([message]))
    // The earlier bounce survives the later delivered.
    expect(kinds(history)).toContain(EMAIL_BOUNCED)
  })

  it('test_UAT_AC2260_erasing_a_contact_erases_only_that_contacts_events', async () => {
    const gone = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const kept = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const elsewhere = await seedContact(identityEnv(B), { tenantId: B, email: anEmail() })
    await recordEvent(identityEnv(), scope(), { contactId: gone, kind: EMAIL_SENT })
    await recordEvent(identityEnv(), scope(), { contactId: gone, kind: EMAIL_RECEIVED })
    await recordEvent(identityEnv(), scope(), { contactId: kept, kind: EMAIL_SENT })
    await recordEvent(identityEnv(B), scope(B), { contactId: elsewhere, kind: EMAIL_SENT })

    expect(await storedEventCount(gone)).toBe(2)
    const keptBefore = await storedEventCount(kept)
    const elsewhereBefore = await storedEventCount(elsewhere)

    // Deleting the contact is not refused because events exist.
    const erased = await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(gone).run()
    expect(erased.success).toBe(true)
    const remaining = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(gone).first()
    expect(remaining).toBeNull()

    expect(await storedEventCount(gone)).toBe(0)
    expect(await storedEventCount(kept)).toBe(keptBefore)
    expect(await storedEventCount(elsewhere)).toBe(elsewhereBefore)
  })
})

describe('story-4630e921 — one sequence, in the order things happened', () => {
  it('test_UAT_AC2261_history_is_one_newest_first_sequence_with_stable_ties_capped_at_100', async () => {
    // Interleaved inbound and outbound, ordered by occurred time.
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: EMAIL_SENT,
      occurredAt: '2026-03-01T09:00:00.000Z',
    })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: EMAIL_RECEIVED,
      occurredAt: '2026-03-02T11:30:00.000Z',
    })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: EMAIL_SENT,
      occurredAt: '2026-03-03T08:15:00.000Z',
    })
    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(kinds(history)).toEqual([EMAIL_SENT, EMAIL_RECEIVED, EMAIL_SENT])
    expect(history.map((e) => e.occurredAt)).toEqual([
      '2026-03-03T08:15:00.000Z',
      '2026-03-02T11:30:00.000Z',
      '2026-03-01T09:00:00.000Z',
    ])

    // Identical occurred times: newest-written first, the same on every read.
    const tied = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const same = '2026-04-01T12:00:00.000Z'
    const first = await recordEvent(identityEnv(), scope(), {
      contactId: tied,
      kind: 'tie.first',
      occurredAt: same,
    })
    const second = await recordEvent(identityEnv(), scope(), {
      contactId: tied,
      kind: 'tie.second',
      occurredAt: same,
    })
    for (let i = 0; i < 3; i += 1) {
      const read = await eventsOf(identityEnv(), scope(), tied)
      expect(read.map((e) => e.id)).toEqual([second.id, first.id])
    }

    // The default cap: at most 100 events, the 100 most recent.
    const busy = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: busy,
      kind: 'list.joined',
      occurredAt: '2025-01-01T00:00:00.000Z',
    })
    const base = Date.parse('2026-01-01T00:00:00.000Z')
    for (let i = 0; i < 100; i += 1) {
      await recordEvent(identityEnv(), scope(), {
        contactId: busy,
        kind: EMAIL_SENT,
        occurredAt: new Date(base + i * 60_000).toISOString(),
      })
    }
    const capped = await eventsOf(identityEnv(), scope(), busy)
    expect(capped).toHaveLength(100)
    expect(kinds(capped)).not.toContain('list.joined')
    expect(capped[0].occurredAt).toBe(new Date(base + 99 * 60_000).toISOString())

    // A smaller explicit cap keeps only the most recent.
    const two = await eventsOf(identityEnv(), scope(), contact, 2)
    expect(two.map((e) => e.occurredAt)).toEqual([
      '2026-03-03T08:15:00.000Z',
      '2026-03-02T11:30:00.000Z',
    ])

    // No events is an empty sequence, not an error.
    const quiet = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    expect(await eventsOf(identityEnv(), scope(), quiet)).toEqual([])
  })

  it('test_UAT_AC2262_an_event_keeps_occurred_and_recorded_times_and_sorts_by_occurred', async () => {
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const before = new Date().toISOString()
    const imported = await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: 'list.joined',
      occurredAt: '2026-03-04T12:00:00.000Z',
    })
    const after = new Date().toISOString()
    const current = await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: EMAIL_SENT,
    })

    expect(imported.occurredAt).toBe('2026-03-04T12:00:00.000Z')
    // Recorded at the time of the write, not the supplied occurred time.
    expect(imported.recordedAt).not.toBe(imported.occurredAt)
    expect(imported.recordedAt >= before && imported.recordedAt <= after).toBe(true)

    // No occurred time supplied: occurred equals recorded.
    expect(current.occurredAt).toBe(current.recordedAt)

    // Position follows the occurred time: the import sorts beneath the current event.
    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(history.map((e) => e.id)).toEqual([current.id, imported.id])
  })

  it('test_UAT_AC2263_an_unseen_kind_is_accepted_and_read_back_verbatim', async () => {
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const novel = 'consultation.booked'
    await expect(
      recordEvent(identityEnv(), scope(), {
        contactId: contact,
        kind: novel,
        detail: { slot: '2026-09-10T14:00:00.000Z' },
      }),
    ).resolves.toMatchObject({ kind: novel })

    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(kinds(history)).toEqual([novel])
    expect(history[0].detail).toEqual({ slot: '2026-09-10T14:00:00.000Z' })
  })
})

describe('story-4630e921 — provenance is the earliest event', () => {
  it('test_UAT_AC2264_provenance_is_the_earliest_event_past_the_cap_and_null_without_history', async () => {
    // Read past the cap.
    const long = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: long,
      kind: 'list.joined',
      occurredAt: '2026-01-01T00:00:00.000Z',
    })
    for (let i = 1; i <= 3; i += 1) {
      await recordEvent(identityEnv(), scope(), {
        contactId: long,
        kind: EMAIL_SENT,
        occurredAt: `2026-06-0${i}T00:00:00.000Z`,
      })
    }
    const capped = await eventsOf(identityEnv(), scope(), long, 2)
    expect(kinds(capped)).toEqual([EMAIL_SENT, EMAIL_SENT])
    const origin = await provenanceOf(identityEnv(), scope(), long)
    expect(origin?.kind).toBe('list.joined')
    expect(origin?.occurredAt).toBe('2026-01-01T00:00:00.000Z')

    // Two entry events both survive; provenance is the earlier.
    const twice = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: twice,
      kind: 'list.joined',
      occurredAt: '2026-01-10T09:00:00.000Z',
    })
    await recordEvent(identityEnv(), scope(), {
      contactId: twice,
      kind: 'consultation.booked',
      occurredAt: '2026-04-02T15:00:00.000Z',
    })
    expect(kinds(await eventsOf(identityEnv(), scope(), twice))).toEqual([
      'consultation.booked',
      'list.joined',
    ])
    expect((await provenanceOf(identityEnv(), scope(), twice))?.kind).toBe('list.joined')

    // No stored field duplicates provenance.
    await expect(env.DB.prepare('SELECT source FROM users LIMIT 1').all()).rejects.toThrow()
    const detail = await personDetail(identityEnv(), scope(), twice)
    expect(detail!.person).not.toHaveProperty('source')
    expect(detail!.person).not.toHaveProperty('provenance')

    // No events: no provenance, nothing inferred from creation date.
    const silent = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    expect(await provenanceOf(identityEnv(), scope(), silent)).toBeNull()
    expect((await personDetail(identityEnv(), scope(), silent))!.provenance).toBeNull()
  })
})

describe('story-4630e921 — the acts that exist today emit', () => {
  it('test_UAT_AC2265_first_invite_records_created_and_invited_and_reinvite_adds_one_invited', async () => {
    const email = anEmail()
    const first = await invitePerson(identityEnv(), scope(), { email })
    expect(first.created).toBe(true)

    expect(kinds(await eventsOf(identityEnv(), scope(), first.person.id))).toEqual([
      CONTACT_INVITED,
      CONTACT_CREATED,
    ])
    const origin = await provenanceOf(identityEnv(), scope(), first.person.id)
    expect(origin?.kind).toBe(CONTACT_CREATED)
    expect(origin?.detail).toEqual({ via: 'invite' })

    const again = await invitePerson(identityEnv(), scope(), { email })
    expect(again.created).toBe(false)
    expect(again.person.id).toBe(first.person.id)
    expect(again.person.invitedAt).toBe(first.person.invitedAt)
    expect(kinds(await eventsOf(identityEnv(), scope(), first.person.id))).toEqual([
      CONTACT_INVITED,
      CONTACT_INVITED,
      CONTACT_CREATED,
    ])
  })

  it('test_UAT_AC2266_accepting_terms_records_signed_up_with_the_terms_version', async () => {
    const made = await invitePerson(identityEnv(), scope(), { email: anEmail() })
    await acceptTerms(identityEnv(), made.person.id, '2026-09-01')

    const history = await eventsOf(identityEnv(), scope(), made.person.id)
    expect(history[0].kind).toBe(MEMBER_SIGNED_UP)
    expect(history[0].detail).toEqual({ version: '2026-09-01' })
    expect(kinds(history)).toEqual([MEMBER_SIGNED_UP, CONTACT_INVITED, CONTACT_CREATED])
  })

  it('test_UAT_AC2267_a_seeded_platform_operator_records_created_once', async () => {
    const tenant = 'recon195-platform'
    const platform = identityEnv(tenant)
    const email = anEmail()
    await ensurePlatformOperator(platform, email)
    await ensurePlatformOperator(platform, email)

    const who = await env.DB.prepare(
      'SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?',
    )
      .bind(tenant, email)
      .first<{ user_id: string }>()
    expect(who).not.toBeNull()

    const history = await eventsOf(platform, scope(tenant), who!.user_id)
    expect(kinds(history)).toEqual([CONTACT_CREATED])
    expect(history[0].detail).toEqual({ via: 'platform_admins' })
  })
})

describe('story-4630e921 — the business barrier', () => {
  it('test_UAT_AC2268_events_belong_to_the_contacts_business_and_cross_business_access_is_refused', async () => {
    const theirs = await seedContact(identityEnv(B), { tenantId: B, email: anEmail() })
    const written = await recordEvent(identityEnv(B), scope(B), {
      contactId: theirs,
      kind: 'list.joined',
    })
    expect(written.businessId).toBe(B)

    // Cross-business read: same answer as an id that never existed.
    expect(await eventsOf(identityEnv(), scope(A), theirs)).toEqual([])
    expect(await provenanceOf(identityEnv(), scope(A), theirs)).toBeNull()
    expect(await eventsOf(identityEnv(), scope(A), 'usr_never_existed')).toEqual([])
    expect(await provenanceOf(identityEnv(), scope(A), 'usr_never_existed')).toBeNull()
    expect(await eventsOf(identityEnv(B), scope(B), theirs)).toHaveLength(1)

    // Cross-business write: refused like an unknown contact, nothing written.
    const crossed = recordEvent(identityEnv(), scope(A), { contactId: theirs, kind: EMAIL_SENT })
    await expect(crossed).rejects.toBeInstanceOf(UnknownContactError)
    const unknown = recordEvent(identityEnv(), scope(A), {
      contactId: 'usr_never_existed',
      kind: EMAIL_SENT,
    })
    await expect(unknown).rejects.toBeInstanceOf(UnknownContactError)
    const crossedMessage = await crossed.catch((e: Error) => e.message)
    const unknownMessage = await unknown.catch((e: Error) => e.message)
    expect(crossedMessage).toBe(unknownMessage)

    expect(await storedEventCount(theirs)).toBe(1)
  })
})

describe('story-4630e921 — the detail the Contacts tab reads', () => {
  it('test_UAT_AC2269_contact_detail_carries_history_and_provenance_and_is_null_across_businesses', async () => {
    const made = await invitePerson(identityEnv(), scope(), { email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: made.person.id,
      kind: EMAIL_SENT,
      ref: 'email-9f2c',
      detail: { subject: 'Come and have a look' },
    })

    const detail = await personDetail(identityEnv(), scope(), made.person.id)
    expect(detail).not.toBeNull()
    expect(detail!.person.id).toBe(made.person.id)
    expect(kinds(detail!.events)).toEqual([EMAIL_SENT, CONTACT_INVITED, CONTACT_CREATED])
    expect(detail!.events[0].ref).toBe('email-9f2c')
    for (const e of detail!.events) {
      expect(Object.keys(e)).toEqual(
        expect.arrayContaining(['kind', 'occurredAt', 'recordedAt', 'ref', 'detail']),
      )
    }
    expect(detail!.provenance?.kind).toBe(CONTACT_CREATED)

    const theirs = await seedContact(identityEnv(B), { tenantId: B, email: anEmail() })
    await recordEvent(identityEnv(B), scope(B), { contactId: theirs, kind: EMAIL_SENT })
    expect(await personDetail(identityEnv(), scope(A), theirs)).toBeNull()
  })
})
