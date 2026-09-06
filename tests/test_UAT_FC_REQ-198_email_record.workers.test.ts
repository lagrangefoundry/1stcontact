import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  productTypePack,
  ticketStoreFor,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import {
  bouncedContactIds,
  messagesFor,
  sendRecordedEmail,
  toMessageRecord,
  EMAIL_TYPE,
  type OutgoingMessage,
  type SendEmail,
} from '../apps/control-app/src/messages'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-198 — **every outgoing message is a record on the contact.**
 *
 * WHAT THIS FILE PROVES. That a send leaves durable evidence whether or not it
 * worked: the record is written `queued` BEFORE the provider is called, updated
 * to `sent` with the provider's id when it is accepted, and left `failed` with
 * the reason when it is not. And that what is stored is the message as sent —
 * the rendered body, the address it went to — rather than a pointer at a
 * template that will have changed by the time anybody asks.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1 with
 * the deployed baseline applied, through the same `ticketStoreFor` the Worker
 * calls, and drives the shipped `sendRecordedEmail` rather than a second copy of
 * its sequence written here. The queue-first claim is proved from INSIDE the
 * sending port — the stub reads the store at the moment it is called, which is
 * the only vantage point from which "before" is a fact rather than a reading of
 * the source.
 *
 * THE PORT IS A STUB AND THAT IS THE DESIGN, not a concession ([[REQ-196]]).
 * The recorder takes the sender as an argument and imports no adapter, so there
 * is no code path here that could reach a provider — which is [[REQ-196]]'s
 * falsifier ("a code path where running the tests can send mail") answered from
 * this side of the seam.
 */

const BUSINESS = 'req198-business'
const OTHER = 'req198-other-business'

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
    contactId: `usr_req198_${seq}`,
    addressId: `uem_req198_${seq}`,
    templateKey: 'invite',
    subject: `Welcome ${seq}`,
    from: 'no-reply@1stcontact.io',
    to: `req198-${seq}@example.test`,
    body: 'Welcome. Your link is https://app.example/in/abc',
    ...over,
  }
}

/** A provider that accepts everything and hands back an id. */
const accepts = (providerId: string): SendEmail => async () => ({ providerId })

/** A provider that refuses, the way a real one refuses: with a reason. */
const refuses = (reason: string): SendEmail => async () => {
  throw new Error(reason)
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-198 — the type', () => {
  it('test_UAT_FC_REQ-198_the_email_type_is_registered_in_the_product_pack', () => {
    // Registered rather than merely written down: an unregistered type is
    // refused by the store at create, so every send would fail at the moment the
    // record is the only evidence anything was attempted.
    expect(productTypePack().has(EMAIL_TYPE)).toBe(true)
    const fields = (productTypePack().schema(EMAIL_TYPE).fields ?? {}) as Record<string, unknown>
    expect(Object.keys(fields).sort()).toEqual(
      [
        'address_id',
        'contact_id',
        'failure',
        'from',
        'provider_id',
        'queued_at',
        'sent_at',
        'status',
        'subject',
        'template_key',
        'to',
      ].sort(),
    )
  })

  it('test_UAT_FC_REQ-198_a_record_that_names_no_address_is_refused', async () => {
    // THE ADDRESS IS REQUIRED BECAUSE A BOUNCE IS A FACT ABOUT ONE. A contact
    // holds several ([[REQ-191]]), so a record naming only the person could not
    // say which of them is bad — which is most of the value of keeping it. The
    // schema refuses rather than the caller remembering.
    const store = await storeFor()
    await expect(
      store.create({
        type: EMAIL_TYPE,
        title: 'No address',
        fields: {
          contact_id: 'usr_x',
          template_key: 'invite',
          subject: 'Hi',
          from: 'no-reply@1stcontact.io',
          to: 'someone@example.test',
          status: 'queued',
          queued_at: new Date().toISOString(),
        },
        body: 'text',
      }),
    ).rejects.toThrow(/address_id/)
  })
})

describe('REQ-198 — queue first, then send, then update', () => {
  it('test_UAT_FC_REQ-198_the_record_exists_as_queued_before_the_provider_is_called', async () => {
    // THE CLAIM, PROVED FROM INSIDE THE PORT. "Before" is only a fact if
    // something observes it at that instant; a read taken afterwards cannot
    // distinguish queue-then-send from send-then-record. So the stub reads the
    // store from within the call, which is exactly where a crash would land.
    const store = await storeFor()
    const message = outgoing()
    let seenAtCallTime: unknown = null

    const observing: SendEmail = async () => {
      const found = await messagesFor(store, message.contactId)
      seenAtCallTime = found.map((m) => ({ status: m.status, providerId: m.providerId }))
      return { providerId: 'prov_observed' }
    }

    await sendRecordedEmail(store, message, observing)
    expect(seenAtCallTime).toEqual([{ status: 'queued', providerId: null }])
  })

  it('test_UAT_FC_REQ-198_a_successful_send_records_sent_and_the_providers_id', async () => {
    // `providerId` IS THE JOIN KEY and is why it is not optional on the port: it
    // is the only thing a later delivery or bounce event can be matched back to.
    const store = await storeFor()
    const message = outgoing()
    const record = await sendRecordedEmail(store, message, accepts('prov_sent_1'))

    expect(record.status).toBe('sent')
    expect(record.providerId).toBe('prov_sent_1')
    expect(record.sentAt).not.toBeNull()
    expect(record.failure).toBeNull()

    // Read back through a SECOND handle, so what is asserted is the row rather
    // than the object the call returned.
    const again = await messagesFor(await storeFor(), message.contactId)
    expect(again.map((m) => m.status)).toEqual(['sent'])
    expect(again[0].providerId).toBe('prov_sent_1')
  })

  it('test_UAT_FC_REQ-198_a_failed_send_leaves_a_record_and_says_why', async () => {
    // THE FALSIFIER, STATED AS A TEST: *a send path where a failure produces no
    // row*. The reason is stored too — "failed" alone does not tell an operator
    // whether pressing Invite again will help.
    const store = await storeFor()
    const message = outgoing()
    const record = await sendRecordedEmail(store, message, refuses('domain is not verified'))

    expect(record.status).toBe('failed')
    expect(record.failure).toBe('domain is not verified')
    expect(record.providerId).toBeNull()

    const again = await messagesFor(await storeFor(), message.contactId)
    expect(again).toHaveLength(1)
    expect(again[0].failure).toBe('domain is not verified')
  })

  it('test_UAT_FC_REQ-198_a_send_failure_is_reported_rather_than_thrown', async () => {
    // IT DOES NOT THROW, deliberately: the failure is the thing being recorded,
    // and raising it would hand the caller the one outcome the record exists to
    // preserve and leave them to remember to look for it.
    const store = await storeFor()
    await expect(
      sendRecordedEmail(store, outgoing(), refuses('mailbox full')),
    ).resolves.toMatchObject({ status: 'failed' })
  })
})

describe('REQ-198 — what is stored is what was sent', () => {
  it('test_UAT_FC_REQ-198_the_body_is_the_rendered_message_and_survives_a_later_template_change', async () => {
    // THE TEMPLATE CHANGES; WHAT WE SENT DOES NOT. The record is the answer to
    // *what did this person actually receive*, so the text is stored rather than
    // referenced. Proved by rendering the same key differently afterwards and
    // reading the first record back unchanged.
    const store = await storeFor()
    const first = outgoing({ body: 'Version one of the invite.', templateKey: 'invite' })
    await sendRecordedEmail(store, first, accepts('prov_body_1'))

    const second = outgoing({
      contactId: first.contactId,
      body: 'Version two, rewritten entirely.',
      templateKey: 'invite',
    })
    await sendRecordedEmail(store, second, accepts('prov_body_2'))

    const found = await messagesFor(store, first.contactId)
    expect(found.map((m) => m.body).sort()).toEqual(
      ['Version one of the invite.', 'Version two, rewritten entirely.'].sort(),
    )
    // AND `template_key` IS STILL THERE BESIDE IT. Which template it came from
    // is worth asking; it is simply a different question from what was received.
    expect(found.every((m) => m.templateKey === 'invite')).toBe(true)
  })

  it('test_UAT_FC_REQ-198_the_record_names_both_the_person_and_the_address', async () => {
    const store = await storeFor()
    const message = outgoing()
    await sendRecordedEmail(store, message, accepts('prov_pair'))
    const [record] = await messagesFor(store, message.contactId)
    expect(record.contactId).toBe(message.contactId)
    expect(record.addressId).toBe(message.addressId)
    expect(record.to).toBe(message.to)
  })
})

describe('REQ-198 — the reads the Contacts pane makes', () => {
  it('test_UAT_FC_REQ-198_a_contacts_messages_come_back_most_recent_first', async () => {
    // ORDERED ON `queued_at` AND NOT ON WHEN IT WAS SENT: a queued message has
    // no send time and a failed one never will, so ordering on that stamp would
    // sink exactly the rows worth looking at.
    const store = await storeFor()
    const contactId = `usr_req198_order`
    const at = (iso: string) => () => iso
    await sendRecordedEmail(
      store,
      outgoing({ contactId, subject: 'First' }),
      accepts('prov_o1'),
      at('2026-09-01T09:00:00.000Z'),
    )
    await sendRecordedEmail(
      store,
      outgoing({ contactId, subject: 'Second' }),
      accepts('prov_o2'),
      at('2026-09-03T09:00:00.000Z'),
    )
    await sendRecordedEmail(
      store,
      outgoing({ contactId, subject: 'Third' }),
      accepts('prov_o3'),
      at('2026-09-02T09:00:00.000Z'),
    )

    const found = await messagesFor(store, contactId)
    expect(found.map((m) => m.subject)).toEqual(['Second', 'Third', 'First'])
  })

  it('test_UAT_FC_REQ-198_a_bounced_message_names_its_contact_to_the_list_read', async () => {
    // WHAT MAKES THE BOUNCE VISIBLE FROM THE LIST. A bad address is the most
    // valuable signal a beta produces and it is worth nothing if it takes a
    // click to find, so the list's own read carries the contacts holding one.
    const store = await storeFor()
    const bad = outgoing()
    const good = outgoing()
    const bounced = await sendRecordedEmail(store, bad, accepts('prov_bounce_me'))
    await sendRecordedEmail(store, good, accepts('prov_fine'))
    await store.update({ uid: bounced.uid, patch: { fields: { status: 'bounced' } } })

    const ids = await bouncedContactIds(store)
    expect(ids).toContain(bad.contactId)
    expect(ids).not.toContain(good.contactId)
  })

  it('test_UAT_FC_REQ-198_one_businesss_messages_are_unreadable_from_another', async () => {
    // THE BARRIER, ASSERTED RATHER THAN ASSUMED. The handle carries the tenant,
    // so a contact id from one business reaches nothing through another's store
    // — which is the guarantee that lets `/api/people/messages` take an id from
    // the wire without checking whose it is.
    const mine = await storeFor(BUSINESS)
    const theirs = await storeFor(OTHER)
    const message = outgoing()
    await sendRecordedEmail(mine, message, accepts('prov_isolated'))

    expect(await messagesFor(theirs, message.contactId)).toEqual([])
    expect(await bouncedContactIds(theirs)).toEqual([])
  })

  it('test_UAT_FC_REQ-198_an_unknown_contact_reads_as_no_messages_rather_than_an_error', async () => {
    // AN EMPTY LIST AND NOT A REFUSAL, so this read is not a second way to ask
    // whether a person exists — the answer is the same one a real contact with
    // no messages gives.
    const store = await storeFor()
    expect(await messagesFor(store, 'usr_nobody_at_all')).toEqual([])
    expect(await messagesFor(store, '')).toEqual([])
  })
})

describe('REQ-198 — the record shape the pane reads', () => {
  it('test_UAT_FC_REQ-198_a_stored_ticket_maps_onto_the_record_the_pane_draws', async () => {
    // ONE MAPPING, SHARED. The route and the pane both read a message through
    // `toMessageRecord`, so a field renamed on the ticket cannot mean one thing
    // to the list and another to the detail.
    const store = await storeFor()
    const message = outgoing()
    await sendRecordedEmail(store, message, accepts('prov_shape'))
    const { tickets } = await store.query({
      predicate: `type="${EMAIL_TYPE}" AND fields.provider_id="prov_shape"`,
      limit: 'all',
    })
    expect(tickets).toHaveLength(1)
    const record = toMessageRecord(tickets[0])
    expect(record).toMatchObject({
      contactId: message.contactId,
      addressId: message.addressId,
      templateKey: 'invite',
      subject: message.subject,
      from: 'no-reply@1stcontact.io',
      to: message.to,
      status: 'sent',
      providerId: 'prov_shape',
      body: message.body,
    })
  })
})
