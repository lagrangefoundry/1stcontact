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
import { addContact, markInvited, personDetail } from '../apps/control-app/src/people'
import { acceptTerms } from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'
import { seedContact } from './support/contact'

/**
 * REQ-195 — **a contact's history is a table of immutable events.**
 *
 * WHAT THIS FILE PROVES. That what happens to a contact is recorded as facts
 * that are appended and never rewritten, and that the two things a `source`
 * column could not do — keep a second entry fact, and keep the difference
 * between when something happened and when we heard of it — are both done.
 * Provenance is the earliest row rather than a column, so there is no second
 * representation of it free to disagree.
 *
 * WHAT MAKES IT EVIDENCE. Every assertion runs inside workerd against a real D1
 * with the deployed baseline applied by the same helper the store suites use, so
 * what is proved is the schema that will ship. Immutability is proved by the
 * DATABASE REFUSING an `UPDATE` — a trigger, not a convention — because an
 * append-only log maintained by discipline is a log that is eventually edited,
 * and the edit is silent: a rewritten event leaves a timeline that reads
 * perfectly and is untrue. The emission is driven through the shipped functions
 * (`addContact`, `acceptTerms`, `ensurePlatformOperator`), never through a
 * second copy of their SQL written here.
 *
 * WHAT IT SEEDS DIRECTLY, AND WHY THAT IS HONEST. `email.sent`, `email.bounced`,
 * `list.joined` and the rest have no emitter in this repository — there is no
 * sender ([[REQ-196]]), no `email` ticket type ([[REQ-198]]) and no mailing list
 * — so those events are written through `recordEvent`, which is the shipped
 * write path those capabilities will call. This ticket builds the spine and the
 * emitters that exist today; it does not invent the ones that do not.
 */

const A = 'req195-business-a'
const B = 'req195-business-b'

function identityEnv(tenantId = A): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

const scope = (businessId = A) => ({ businessId })

let seq = 0
const anEmail = (): string => `req195-${(seq += 1)}@example.test`

const kinds = (events: Array<{ kind: string }>): string[] => events.map((e) => e.kind)

beforeAll(async () => {
  await applySchema()
})

describe('REQ-195 — an event is written once', () => {
  it('test_UAT_FC_REQ-195_the_database_refuses_to_rewrite_an_event', async () => {
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const written = await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: EMAIL_SENT,
    })

    // THE FALSIFIER, ASKED OF THE DATABASE. `events.ts` exports no update path,
    // but that is a fact about one module and this is a fact about the table:
    // anything holding the binding is refused, including a hand-written repair
    // typed into a console at three in the morning.
    await expect(
      env.DB.prepare("UPDATE contact_events SET kind = 'email.delivered' WHERE id = ?")
        .bind(written.id)
        .run(),
    ).rejects.toThrow()

    const [still] = await eventsOf(identityEnv(), scope(), contact)
    expect(still.kind).toBe(EMAIL_SENT)
  })

  it('test_UAT_FC_REQ-195_an_event_carries_no_status_column_to_rewrite', async () => {
    // THE OTHER HALF OF THE FALSIFIER, STATED AS AN ABSENCE. A `status` on an
    // event is the invitation to rewrite it — the shape that turns three
    // delivery facts into one row that only remembers the last. Asked of the
    // database rather than of the migration text, because the claim is about the
    // deployed table and a file scan would pass against a schema that had
    // drifted from it.
    await expect(env.DB.prepare('SELECT status FROM contact_events LIMIT 1').all()).rejects.toThrow()
  })

  it('test_UAT_FC_REQ-195_a_delivery_outcome_that_changes_appends_rather_than_replaces', async () => {
    // THE CASE THE IMMUTABILITY IS FOR. A message's outcome moves — sent, then
    // bounced, then a retry delivered — and the three are three rows against one
    // `ref`. Recorded as state on one record, the bounce disappears the moment
    // the retry succeeds, and the single most valuable signal a beta produces is
    // the one the timeline silently loses.
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    const message = 'email-abc123'
    for (const kind of [EMAIL_SENT, EMAIL_BOUNCED, EMAIL_DELIVERED]) {
      await recordEvent(identityEnv(), scope(), { contactId: contact, kind, ref: message })
    }

    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(kinds(history).sort()).toEqual([EMAIL_BOUNCED, EMAIL_DELIVERED, EMAIL_SENT].sort())
    // ALL THREE NAME THE SAME MESSAGE, which is what makes them one message's
    // history rather than three unrelated facts.
    expect(new Set(history.map((e) => e.ref))).toEqual(new Set([message]))
  })
})

describe('REQ-195 — one sequence, in the order things happened', () => {
  it('test_UAT_FC_REQ-195_inbound_and_outbound_are_one_time_ordered_sequence', async () => {
    // TWO LISTS ARE THE THING RULED OUT. A reply and a message we sent are the
    // same conversation, and presented apart a reader has to interleave them by
    // eye — which they will get wrong on the one occasion it matters.
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
    expect(history.map((e) => e.occurredAt)).toEqual([
      '2026-03-03T08:15:00.000Z',
      '2026-03-02T11:30:00.000Z',
      '2026-03-01T09:00:00.000Z',
    ])
    expect(kinds(history)).toEqual([EMAIL_SENT, EMAIL_RECEIVED, EMAIL_SENT])
  })

  it('test_UAT_FC_REQ-195_an_imported_event_keeps_when_it_happened_and_when_we_learned_of_it', async () => {
    // BOTH COLUMNS, BECAUSE THEY GENUINELY DIFFER. A mailing-list signup from
    // March, imported today, sorts under March — with one column an import reads
    // as a flood of activity this afternoon, which is exactly the reading a
    // timeline exists to prevent.
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: 'list.joined',
      occurredAt: '2026-03-04T12:00:00.000Z',
    })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: EMAIL_SENT,
      occurredAt: '2026-08-01T12:00:00.000Z',
    })

    const [, imported] = await eventsOf(identityEnv(), scope(), contact)
    expect(imported.kind).toBe('list.joined')
    expect(imported.occurredAt).toBe('2026-03-04T12:00:00.000Z')
    // Learned of AFTER it happened, and the row keeps the difference rather than
    // collapsing to whichever one was written.
    expect(imported.recordedAt > imported.occurredAt).toBe(true)
  })

  it('test_UAT_FC_REQ-195_a_kind_nothing_has_ever_seen_is_stored_and_read_back', async () => {
    // `kind` IS A DOTTED STRING AND NOT AN ENUM ([[DOC-44]] §4). The set of
    // things that can happen to a contact grows, and a constraint that has to be
    // migrated for every new one is a constraint that gets worked around.
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: 'consultation.booked',
      detail: { slot: '2026-09-10T14:00:00.000Z' },
    })

    const [booked] = await eventsOf(identityEnv(), scope(), contact)
    expect(booked.kind).toBe('consultation.booked')
    expect(booked.detail).toEqual({ slot: '2026-09-10T14:00:00.000Z' })
  })
})

describe('REQ-195 — provenance is the earliest event', () => {
  it('test_UAT_FC_REQ-195_a_contact_with_two_entry_events_keeps_both', async () => {
    // THE EXAMPLE THAT DECIDED THE SHAPE ([[DOC-44]] §4.1). Somebody who joined
    // the mailing list and LATER booked a consultation has two entry facts. A
    // `source` column keeps one of them; which one depends on whether it was
    // written once or overwritten, and neither answer is right.
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: 'list.joined',
      occurredAt: '2026-01-10T09:00:00.000Z',
    })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: 'consultation.booked',
      occurredAt: '2026-04-02T15:00:00.000Z',
    })

    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(kinds(history)).toEqual(['consultation.booked', 'list.joined'])

    const origin = await provenanceOf(identityEnv(), scope(), contact)
    expect(origin?.kind).toBe('list.joined')
    expect(origin?.occurredAt).toBe('2026-01-10T09:00:00.000Z')
  })

  it('test_UAT_FC_REQ-195_no_column_duplicates_provenance', async () => {
    // THE COLUMN THIS TABLE EXISTS INSTEAD OF. Two representations of one fact
    // is one of them being wrong, and the one that would be wrong is the column,
    // because it cannot hold the second entry event the test above keeps.
    await expect(env.DB.prepare('SELECT source FROM users LIMIT 1').all()).rejects.toThrow()
  })

  it('test_UAT_FC_REQ-195_provenance_is_read_past_the_timeline_cap', async () => {
    // NOT THE TAIL OF THE LIST. `eventsOf` is capped, so provenance taken off
    // its end would be quietly wrong for exactly the contacts with the longest
    // histories — which are the ones an operator is most likely to ask about.
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: contact,
      kind: 'list.joined',
      occurredAt: '2026-01-01T00:00:00.000Z',
    })
    for (let i = 1; i <= 3; i += 1) {
      await recordEvent(identityEnv(), scope(), {
        contactId: contact,
        kind: EMAIL_SENT,
        occurredAt: `2026-06-0${i}T00:00:00.000Z`,
      })
    }

    const capped = await eventsOf(identityEnv(), scope(), contact, 2)
    expect(capped).toHaveLength(2)
    expect(kinds(capped)).toEqual([EMAIL_SENT, EMAIL_SENT])

    const origin = await provenanceOf(identityEnv(), scope(), contact)
    expect(origin?.kind).toBe('list.joined')
  })

  it('test_UAT_FC_REQ-195_a_contact_with_no_history_has_no_invented_origin', async () => {
    // NULL IS THE HONEST ANSWER for a row that predates the spine. Deriving one
    // from `created_at` would be the `source` column arriving through the back
    // door, and it would claim a provenance nobody recorded.
    const contact = await seedContact(identityEnv(), { tenantId: A, email: anEmail() })
    expect(await provenanceOf(identityEnv(), scope(), contact)).toBeNull()
    expect(await eventsOf(identityEnv(), scope(), contact)).toEqual([])
  })
})

describe('REQ-195 — the acts that exist today emit', () => {
  it('test_UAT_FC_REQ-195_adding_a_contact_records_where_they_came_from', async () => {
    // ONE EVENT, AND IT IS THE PROVENANCE ROW. Adding and inviting came apart in
    // [[REQ-199]]: `contact.created` is where this person came from — a question
    // no column on `users` answers — and `contact.invited` is the pipeline
    // transition, written by the other act and written again every press.
    // Collapsed into one, a contact added by the surface that does NOT invite
    // would have no provenance at all.
    const made = await addContact(identityEnv(), scope(), { email: anEmail() })
    expect(made.created).toBe(true)

    const history = await eventsOf(identityEnv(), scope(), made.person.id)
    expect(kinds(history)).toEqual([CONTACT_CREATED])

    const origin = await provenanceOf(identityEnv(), scope(), made.person.id)
    expect(origin?.kind).toBe(CONTACT_CREATED)
    expect(origin?.detail).toEqual({ via: 'add' })
  })

  it('test_UAT_FC_REQ-195_a_second_invite_is_a_second_event_even_when_no_column_moves', async () => {
    // THE HISTORY AN OPERATOR ASKING "HAVE WE CHASED THEM?" IS LOOKING FOR.
    // `invited_at` is not restamped — it records when we FIRST asked — so
    // without the event a second press changes nothing anywhere and is
    // invisible. The stamp and the log answer two different questions and only
    // one of them had an answer before.
    const email = anEmail()
    const made = await addContact(identityEnv(), scope(), { email })
    const first = await markInvited(identityEnv(), scope(), made.person.id)
    const again = await markInvited(identityEnv(), scope(), made.person.id)
    expect(again.id).toBe(first.id)
    expect(again.invitedAt).toBe(first.invitedAt)

    const history = await eventsOf(identityEnv(), scope(), made.person.id)
    expect(kinds(history)).toEqual([CONTACT_INVITED, CONTACT_INVITED, CONTACT_CREATED])
  })

  it('test_UAT_FC_REQ-195_signing_up_is_recorded_as_the_persons_own_act', async () => {
    // THE ACCESS AXIS, WHICH IS THEIRS AND NOT OURS ([[DOC-44]] §3). Every other
    // event here is something the business did; this is the one the contact did,
    // and a history of what we did with the most important thing they did
    // missing is a history that reads as one-sided because it is.
    const made = await addContact(identityEnv(), scope(), { email: anEmail() })
    await acceptTerms(identityEnv(), made.person.id, '2026-09-01')

    const history = await eventsOf(identityEnv(), scope(), made.person.id)
    expect(history[0].kind).toBe(MEMBER_SIGNED_UP)
    // THE VERSION TRAVELS WITH THE ACT. The column holds the current one;
    // accepting new terms later is a new act with a new date, and only the log
    // can say which version was agreed when.
    expect(history[0].detail).toEqual({ version: '2026-09-01' })
  })

  it('test_UAT_FC_REQ-195_a_seeded_operator_records_where_they_came_from', async () => {
    // AND IT IS A DIFFERENT ORIGIN FROM AN INVITE, which is worth being able to
    // see months later. `ensurePlatformOperator` runs on every admission by a
    // holder, so the event is written inside the branch that CREATES the person
    // — otherwise the repair path appends an identical row per request and the
    // provenance event becomes a heartbeat.
    const platform = identityEnv('req195-platform')
    const email = anEmail()
    await ensurePlatformOperator(platform, email)
    await ensurePlatformOperator(platform, email)

    const who = await env.DB.prepare(
      'SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?',
    )
      .bind('req195-platform', email)
      .first<{ user_id: string }>()

    const history = await eventsOf(platform, scope('req195-platform'), who!.user_id)
    expect(kinds(history)).toEqual([CONTACT_CREATED])
    expect(history[0].detail).toEqual({ via: 'platform_admins' })
  })
})

describe('REQ-195 — the barrier', () => {
  it('test_UAT_FC_REQ-195_a_contacts_history_is_unreadable_from_another_business', async () => {
    // NOT FOUND AND NOT IN THIS BUSINESS ARE THE SAME ANSWER, which is what
    // stops the history becoming the existence oracle the rest of this system
    // refuses to be: an id guessed from another business reads as an empty
    // history, which is what an id that never existed reads as.
    const theirs = await seedContact(identityEnv(B), { tenantId: B, email: anEmail() })
    await recordEvent(identityEnv(B), scope(B), { contactId: theirs, kind: 'list.joined' })

    expect(await eventsOf(identityEnv(), scope(A), theirs)).toEqual([])
    expect(await provenanceOf(identityEnv(), scope(A), theirs)).toBeNull()
    expect(await eventsOf(identityEnv(B), scope(B), theirs)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-195_an_event_cannot_be_filed_against_another_businesss_contact', async () => {
    // THE WRITE IS SCOPED TOO, and refuses rather than writing a row nobody can
    // see. A write that succeeded into another business's timeline would be a
    // fact planted in a history its owner reads and cannot account for.
    const theirs = await seedContact(identityEnv(B), { tenantId: B, email: anEmail() })
    const before = await eventsOf(identityEnv(B), scope(B), theirs)

    await expect(
      recordEvent(identityEnv(), scope(A), { contactId: theirs, kind: EMAIL_SENT }),
    ).rejects.toBeInstanceOf(UnknownContactError)

    expect(await eventsOf(identityEnv(B), scope(B), theirs)).toHaveLength(before.length)
  })

  it('test_UAT_FC_REQ-195_the_business_on_an_event_is_the_contacts_own', async () => {
    // DERIVED, NEVER SUPPLIED. Every insert is `INSERT ... SELECT ... FROM
    // users`, so an event cannot be filed under a business its contact does not
    // belong to — the isolation is a property of the statement rather than of
    // every caller remembering to pass the right value.
    const contact = await seedContact(identityEnv(B), { tenantId: B, email: anEmail() })
    const written = await recordEvent(identityEnv(B), scope(B), {
      contactId: contact,
      kind: EMAIL_SENT,
    })
    expect(written.businessId).toBe(B)
  })
})

describe('REQ-195 — the detail the Contacts tab reads', () => {
  it('test_UAT_FC_REQ-195_a_message_sent_to_a_contact_reaches_their_detail', async () => {
    // THE ACCEPTANCE THIS TICKET SHARES WITH [[REQ-198]], from this side of the
    // seam: the event names the message by `ref` — the `email` ticket's uid —
    // and travels with the detail the pane draws from. What writes the ticket is
    // that ticket's business; that the record reaches the person it was sent to
    // is this one's.
    const made = await addContact(identityEnv(), scope(), { email: anEmail() })
    await recordEvent(identityEnv(), scope(), {
      contactId: made.person.id,
      kind: EMAIL_SENT,
      ref: 'email-9f2c',
      detail: { subject: 'Come and have a look' },
    })

    const detail = await personDetail(identityEnv(), scope(), made.person.id)
    expect(kinds(detail!.events)).toEqual([EMAIL_SENT, CONTACT_CREATED])
    expect(detail!.events[0].ref).toBe('email-9f2c')
    expect(detail!.provenance?.kind).toBe(CONTACT_CREATED)
  })

  it('test_UAT_FC_REQ-195_a_detail_read_from_another_business_carries_no_history', async () => {
    const theirs = await seedContact(identityEnv(B), { tenantId: B, email: anEmail() })
    await recordEvent(identityEnv(B), scope(B), { contactId: theirs, kind: EMAIL_SENT })
    // The person is not visible from A at all, which is [[REQ-170]]'s guarantee;
    // this asserts the history did not become a second way to ask.
    expect(await personDetail(identityEnv(), scope(A), theirs)).toBeNull()
  })
})
