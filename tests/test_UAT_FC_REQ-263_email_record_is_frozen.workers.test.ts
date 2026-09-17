import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  productTypePack,
  ticketStoreBase,
  ticketStoreFor,
  type LockRule,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import {
  applyDeliveryEvent,
  messagesFor,
  sendRecordedEmail,
  EMAIL_TYPE,
  type OutgoingMessage,
} from '../apps/control-app/src/messages'
import type { SendEmail } from '../apps/control-app/src/mail'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-263 — **the record of a sent message cannot be edited**.
 *
 * WHAT THIS FILE PROVES. That the refusal comes from the STORE and not from a
 * caller remembering to check: a patch that would rewrite what was sent is
 * refused by the same `update` the product calls, carrying the declared prose,
 * while the delivery lifecycle the provider and its webhooks write goes through
 * untouched. A lock that also broke delivery tracking would be the opposite of
 * preserving the record, so half of what is asserted here is what still works.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1 with
 * the deployed baseline applied, through the same `ticketStoreFor` the Worker
 * calls, against the shipped `productTypePack` — so what is proved is the
 * declaration that will actually be deployed rather than a fixture's rehearsal
 * of it. The send and webhook cases drive `sendRecordedEmail` and
 * `applyDeliveryEvent` themselves rather than a second copy of their sequence
 * written here, which is what makes them a regression test for the lock and not
 * merely a restatement of it.
 *
 * THE MECHANISM IS NOT UNDER TEST HERE. `@lagrangefoundry/ticketing` owns the
 * lock engine and its own conformance corpus proves it ([[REQ-160]]). What this
 * repository owns is the DECLARATION — which selectors, and which four
 * exceptions — so the cases below pin the consequences of those choices on this
 * type, not the engine's behaviour in general.
 */

const BUSINESS = 'req263-business'

const scopeOf = (businessId: string): Scope => ({ businessId })

function storeEnv(): TicketStoreEnv {
  return { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }
}

const storeFor = (businessId = BUSINESS): Promise<TicketStore> =>
  ticketStoreFor(storeEnv(), scopeOf(businessId))

let seq = 0

/** A message with every field the type requires, so a case can vary one. */
function outgoing(over: Partial<OutgoingMessage> = {}): OutgoingMessage {
  seq += 1
  return {
    contactId: `usr_req263_${seq}`,
    addressId: `uem_req263_${seq}`,
    templateKey: 'invite',
    templateUid: 'tpl_req263_invite_v1',
    subject: `Welcome ${seq}`,
    from: 'no-reply@1stcontact.io',
    to: `req263-${seq}@example.test`,
    body: 'Welcome. Your link is https://app.example/in/abc',
    ...over,
  }
}

/** A provider that accepts everything and hands back an id. */
const accepts = (providerId: string): SendEmail => async () => ({ providerId })

/** The record as the store has it now, read back fresh rather than remembered. */
async function readBack(store: TicketStore, uid: string) {
  const { ticket } = await store.get({ uid })
  return ticket
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-263 — the declaration', () => {
  it('test_UAT_FC_REQ-263_the_email_type_declares_a_write_lock_on_its_content', () => {
    // DECLARED, rather than merely intended. The rule is read off the pack the
    // Worker builds, so this fails if the declaration is dropped, renamed, or
    // moved to a type nothing sends — none of which the behavioural cases below
    // would distinguish from a store that simply stopped enforcing.
    const rules = (productTypePack().schema(EMAIL_TYPE).immutable ?? []) as LockRule[]
    expect(rules).toHaveLength(1)
    const [rule] = rules

    // NO `when`. The record is written before the provider is called, so there
    // is no window in which editing the copy would be legitimate — and the one
    // window a `fields.status != queued` predicate would leave open is exactly
    // the one in which an edit would be invisible.
    expect(rule.when).toBeUndefined()

    // `fields.*` AND NOT AN ENUMERATION. A field added to this type later is
    // then frozen by default and discovered as a loud refusal, where a list
    // would leave a silent hole nothing reports.
    expect(rule.freeze.sort()).toEqual(['body', 'fields.*', 'title'])

    // The four the provider and its webhooks write, and nothing else.
    expect([...(rule.except ?? [])].sort()).toEqual([
      'fields.failure',
      'fields.provider_id',
      'fields.sent_at',
      'fields.status',
    ])
    expect(rule.message).toBe('a message record is what was sent; it cannot be edited')
  })
})

describe('REQ-263 — what the lock refuses', () => {
  it('test_UAT_FC_REQ-263_a_patch_editing_the_subject_of_a_queued_record_is_refused', async () => {
    // FROZEN FROM CREATE, which is the whole of the no-`when` decision. The
    // record is `queued` here — the provider has not answered yet — and the copy
    // is already unwritable, because that is the one moment an edit would leave
    // no trace anywhere.
    const store = await storeFor()
    const { ticket } = await store.create({
      type: EMAIL_TYPE,
      title: 'Welcome',
      fields: {
        contact_id: 'usr_frozen',
        address_id: 'uem_frozen',
        template_key: 'invite',
        subject: 'Welcome',
        from: 'no-reply@1stcontact.io',
        to: 'frozen@example.test',
        status: 'queued',
        queued_at: new Date().toISOString(),
      },
      body: 'The original words.',
    })

    let caught: unknown = null
    try {
      await store.update({ uid: ticket.uid, patch: { fields: { subject: 'Rewritten' } } })
    } catch (err) {
      caught = err
    }

    // THE DECLARED PROSE, not a generic refusal. An operator who sees this has
    // to be told why the store said no, and the rule's own message is the only
    // place that sentence exists.
    expect(String((caught as Error)?.message)).toBe(
      'a message record is what was sent; it cannot be edited',
    )
    // `details.immutable` IS THE DISCRIMINATOR. The taxonomy stays at four
    // codes, so a caller that must act on "locked" differently from "invalid"
    // reads this rather than parsing prose.
    expect(caught).toMatchObject({
      code: 'validation',
      details: { immutable: true, touched: ['fields.subject'] },
    })

    // And nothing landed — the refusal is not a report of a write that happened.
    expect((await readBack(store, ticket.uid)).fields.subject).toBe('Welcome')
  })

  it('test_UAT_FC_REQ-263_the_rendered_body_and_the_title_are_frozen_too', async () => {
    // THE BODY IS THE MESSAGE. "What did this person actually receive" is the
    // question this record answers months later, and a body that can be edited
    // answers it with whatever somebody typed since. The title is the subject as
    // the store lists it, so leaving it writable would let a listing disagree
    // with the record it lists.
    const store = await storeFor()
    const record = await sendRecordedEmail(store, outgoing(), accepts('prov_body'))

    await expect(
      store.update({ uid: record.uid, patch: { body: 'Different words entirely.' } }),
    ).rejects.toMatchObject({ details: { immutable: true, touched: ['body'] } })
    await expect(
      store.update({ uid: record.uid, patch: { title: 'A different subject' } }),
    ).rejects.toMatchObject({ details: { immutable: true, touched: ['title'] } })

    const stored = await readBack(store, record.uid)
    expect(stored.body).toBe('Welcome. Your link is https://app.example/in/abc')
    expect(stored.title).toBe(record.subject)
  })

  it('test_UAT_FC_REQ-263_a_patch_mixing_a_lifecycle_field_with_content_is_refused_whole', async () => {
    // THE HALF THAT WAS ALLOWED DOES NOT LAND. A gate that dropped the frozen
    // half and applied the rest would leave a record whose lifecycle advanced on
    // the strength of a write the store also says it refused — and the caller
    // would have no way to tell which parts of its patch took effect. All or
    // nothing is the only answer that leaves the record legible.
    const store = await storeFor()
    const record = await sendRecordedEmail(store, outgoing(), accepts('prov_mixed'))

    await expect(
      store.update({
        uid: record.uid,
        patch: { fields: { status: 'delivered', subject: 'Rewritten while we were at it' } },
      }),
    ).rejects.toMatchObject({ details: { immutable: true } })

    const stored = await readBack(store, record.uid)
    expect(stored.fields.status).toBe('sent')
    expect(stored.fields.subject).toBe(record.subject)
  })
})

describe('REQ-263 — what the lock still allows', () => {
  it('test_UAT_FC_REQ-263_the_send_path_records_queued_then_sent_through_the_lock', async () => {
    // THE REGRESSION THAT MATTERS MOST. `status`, `provider_id` and `sent_at`
    // are excepted precisely so this keeps working; a lock that froze them would
    // have turned every send into a refusal at the moment the record was
    // supposed to gain its outcome. Driven through the shipped send path rather
    // than a hand-written patch, so it is that path this protects.
    const store = await storeFor()
    const record = await sendRecordedEmail(store, outgoing(), accepts('prov_sent'))

    expect(record.status).toBe('sent')
    expect(record.providerId).toBe('prov_sent')
    expect(record.sentAt).not.toBeNull()

    const stored = await readBack(store, record.uid)
    expect(stored.fields.status).toBe('sent')
    expect(stored.fields.provider_id).toBe('prov_sent')
  })

  it('test_UAT_FC_REQ-263_a_delivery_webhook_hours_later_still_writes_its_outcome', async () => {
    // A `bounced` EVENT WRITES TWO EXCEPTED FIELDS AT ONCE — the status and the
    // provider's reason. The reason is the point of a bounce: which address is
    // bad is on the record already, and why is what tells an operator whether to
    // fix a typo or stop writing to that mailbox. Freezing `failure` would have
    // left every bounce recorded as a bare fact.
    const message = outgoing()
    const store = await storeFor()
    await sendRecordedEmail(store, message, accepts('prov_bounce'))

    const outcome = await applyDeliveryEvent(ticketStoreBase(storeEnv()), {
      providerId: 'prov_bounce',
      status: 'bounced',
      reason: 'mailbox full',
    })

    expect(outcome.matched).toBe(true)
    expect(outcome.message?.status).toBe('bounced')
    expect(outcome.message?.failure).toBe('mailbox full')

    const [stored] = await messagesFor(store, message.contactId)
    expect(stored.status).toBe('bounced')
    expect(stored.failure).toBe('mailbox full')
  })

  it('test_UAT_FC_REQ-263_a_sent_record_can_still_be_archived', async () => {
    // ARCHIVE IS THE ERASURE PATH ([[DOC-37]]), so a lock that blocked it would
    // be a retention policy nobody asked for — and would collide head-on with
    // deleting a business. The engine does not gate archive at all; this pins
    // that the declaration does not accidentally reach it, because a lock that
    // made a tenant undeletable would be discovered far too late.
    const store = await storeFor()
    const record = await sendRecordedEmail(store, outgoing(), accepts('prov_archive'))

    await expect(store.update({ uid: record.uid, patch: { body: 'no' } })).rejects.toBeTruthy()
    const { ticket: archived } = await store.archive({ uid: record.uid })
    expect(archived.uid).toBe(record.uid)
    await expect(store.get({ uid: record.uid })).rejects.toMatchObject({ code: 'not_found' })
  })

  it('test_UAT_FC_REQ-263_a_frozen_record_can_still_be_commented_on', async () => {
    // A COMMENT IS ITS OWN TICKET pointing at the subject, so annotating a
    // frozen record stays possible — which is what makes freezing it acceptable
    // at all. An operator noting why a message bounced has somewhere to put it
    // that is not the record of what was sent.
    const store = await storeFor()
    const record = await sendRecordedEmail(store, outgoing(), accepts('prov_comment'))

    const { comment } = await store.comment({
      uid: record.uid,
      kind: 'note',
      body: 'Rang them instead; the address was a typo on the form.',
    })
    expect(comment.uid).toBeTruthy()

    const { comments } = await store.comments({ uid: record.uid })
    expect(comments.map((c) => c.body)).toContain(
      'Rang them instead; the address was a typo on the form.',
    )
  })
})

describe('REQ-263 — seeing the lock without attempting a write', () => {
  it('test_UAT_FC_REQ-263_a_read_of_a_message_reports_it_as_locked', async () => {
    // A UI THAT CANNOT TELL renders an edit form that throws on submit. The
    // block rides on the read, so the question "may this be edited?" is answered
    // before anything is offered — and `except` is reported beside `frozen`
    // because "something is locked" is not the answer the caller needs.
    const store = await storeFor()
    const record = await sendRecordedEmail(store, outgoing(), accepts('prov_locked'))

    const stored = await readBack(store, record.uid)
    expect(stored.locked).toBeTruthy()
    expect(stored.locked?.frozen.sort()).toEqual(['body', 'fields.*', 'title'])
    expect([...(stored.locked?.except ?? [])].sort()).toEqual([
      'fields.failure',
      'fields.provider_id',
      'fields.sent_at',
      'fields.status',
    ])
    expect(stored.locked?.message).toBe('a message record is what was sent; it cannot be edited')
  })

  it('test_UAT_FC_REQ-263_the_block_rides_on_a_listing_and_only_on_locked_types', async () => {
    // A LISTING IS WHERE A UI DECIDES WHETHER TO OFFER AN EDIT CONTROL, so a
    // block that appeared only on `get` would be a block the Contacts pane could
    // not use without a second read per row. And a type with no rule emits
    // exactly the shape it always did — `locked` is absent rather than null, so
    // nothing that predates this has a new key to account for.
    const message = outgoing()
    const store = await storeFor()
    await sendRecordedEmail(store, message, accepts('prov_listed'))

    const { tickets } = await store.query({
      predicate: `type="${EMAIL_TYPE}" AND fields.provider_id="prov_listed"`,
      limit: 'all',
    })
    expect(tickets).toHaveLength(1)
    expect(tickets[0].locked?.frozen).toContain('fields.*')

    const { ticket: brief } = await store.create({
      type: 'brief',
      title: 'Decisions',
      fields: { site_slug: 'home' },
      body: 'Ship the one-pager first.',
    })
    expect('locked' in (brief as object)).toBe(false)
  })
})
