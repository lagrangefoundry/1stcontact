import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { EMAIL_RECEIVED } from '../apps/control-app/src/builder/contact-events.js'
import { eventsOf } from '../apps/control-app/src/events'
import { openRun, reservedAddressFor, SYNTHETIC_BLOB_PREFIX } from '../apps/control-app/src/gutter'
import { newId } from '../apps/control-app/src/identity'
import {
  discardSender,
  inboundFor,
  INBOUND_EMAIL_TYPE,
  MAX_MESSAGE_BYTES,
  pendingInbound,
  promotePending,
  receiveMail,
  toInboundRecord,
  type InboundEnv,
} from '../apps/control-app/src/inbound'
import { peopleOf } from '../apps/control-app/src/people'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { seedContact } from './support/contact'
import { inboundMessage, rawMessage } from './support/inbound-message'

/**
 * [[REQ-267]] — **inbound mail, end to end.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs the shipped `receiveMail` inside
 * workerd against a real D1 carrying `db/migrations` and a real R2 bucket. The
 * only thing standing in for the world is the PLATFORM — an SMTP delivery, as
 * `inboundMessage` — because the alternative is a suite that can only be run by
 * sending actual mail. Nothing internal is mocked: the identity lookup, the
 * ticket store, the event spine and the blob writes are all the real ones.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a message filed under the business its `To:` header names* — tenancy from
 *     anything but the envelope recipient is a message in a stranger's CRM;
 *   - *a stranger's message minting a contact* — which would fill the list with
 *     spam and break the property the whole test gutter rests on;
 *   - *a discard that does not stick* — which trains the client to ignore the
 *     queue, after which the one message that mattered is missed;
 *   - *a capture failure costing the customer their mail* — the promise
 *     [[EPIC-13]] is built on, and the one this pipeline may never break;
 *   - *a message over the bound being read before it is refused* — the bound is
 *     about memory, and a bound applied after the read has already spent it;
 *   - *a reserved-namespace message reaching a customer's inbox, or their
 *     screen* — marking real traffic as test is the attack [[DOC-54]] names, and
 *     forwarding a probe's mail is its mirror image;
 *   - *an expired or unknown run id still marking mail invisible* — without the
 *     window, a run id that leaked into a spam filter's logs is a permanent
 *     make-my-mail-invisible token;
 *   - *an inbound path that writes consent* — a spoofed `From` that could
 *     manufacture an opt-in turns evidence into evidence of something that did
 *     not happen.
 */

const BUSINESS = 'biz_req267_inbound'
const OTHER_BUSINESS = 'biz_req267_other'
const DOMAIN = 'alicesplumbing.test'
const OTHER_DOMAIN = 'bobsbakery.test'
const FORWARD_TO = 'alice@personal.test'

function inboundEnv(): InboundEnv {
  return env as unknown as InboundEnv
}

function scopeOf(businessId = BUSINESS): Scope {
  return { businessId }
}

/** The deps the pipeline is handed rather than imports. */
function deps(now?: () => Date) {
  const env_ = inboundEnv()
  return {
    openStore: (scope: Scope) => ticketStoreFor(env_, scope),
    ...(now ? { now } : {}),
  }
}

/** A domain this business receives mail on, forwarded where it says. */
async function seedDomain(
  domain: string,
  businessId: string,
  forwardTo: string | null,
): Promise<void> {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO sending_domains ' +
      '(id, business_id, zone_id, domain, status, dmarc_ours, created_at, updated_at, forward_to) ' +
      "VALUES (?, ?, 'zone', ?, 'verified', 0, ?, ?, ?)",
  )
    .bind(newId('snd'), businessId, domain, new Date().toISOString(), new Date().toISOString(), forwardTo)
    .run()
}

/** Every `inbound_email` ticket this business holds, marked ones included. */
async function allMessages(businessId = BUSINESS) {
  const store = await ticketStoreFor(inboundEnv(), scopeOf(businessId))
  const { tickets } = await store.query({
    predicate: `type="${INBOUND_EMAIL_TYPE}"`,
    limit: 'all',
  })
  return tickets.map(toInboundRecord)
}

beforeAll(async () => {
  await applySchema()
  await seedDomain(DOMAIN, BUSINESS, FORWARD_TO)
  await seedDomain(OTHER_DOMAIN, OTHER_BUSINESS, null)
})

describe('REQ-267 — a known sender', () => {
  it('test_UAT_FC_REQ-267_a_known_sender_produces_a_ticket_one_event_and_appears_on_the_contact', async () => {
    const address = `sender-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })
    const message = inboundMessage({
      from: address,
      to: `hello@${DOMAIN}`,
      headers: { 'authentication-results': 'mx.test; spf=pass; dkim=pass; dmarc=pass' },
      raw: rawMessage({
        from: `Sender <${address}>`,
        to: `hello@${DOMAIN}`,
        subject: 'About the leaking tap',
        body: 'Could you come on Thursday?',
      }),
    })

    const outcome = await receiveMail(inboundEnv(), message, deps())

    expect(outcome.outcome).toBe('captured')
    expect(outcome.businessId).toBe(BUSINESS)
    expect(outcome.contactId).toBe(contactId)

    // THE TICKET IS THE BODY. Read back through the shipped reader rather than
    // out of a raw row, so what is asserted is what the product will show.
    const store = await ticketStoreFor(inboundEnv(), scopeOf())
    const received = await inboundFor(store, contactId)
    expect(received).toHaveLength(1)
    expect(received[0].subject).toBe('About the leaking tap')
    expect(received[0].body).toContain('Thursday')
    expect(received[0].envelopeFrom).toBe(address)
    expect(received[0].alignment).toBe('pass')

    // AND THE EVENT IS THE ENVELOPE — one row, not one per part and not one per
    // read. Its `ref` points at the ticket, which is what makes the body
    // reachable from the timeline without the timeline holding it.
    const events = await eventsOf(inboundEnv(), scopeOf(), contactId)
    const inbound = events.filter((one) => one.kind === EMAIL_RECEIVED)
    expect(inbound).toHaveLength(1)
    expect(inbound[0].ref).toBe(received[0].uid)
    expect(inbound[0].detail.subject).toBe('About the leaking tap')
    // The BODY is deliberately not on the spine — milestones, not noise.
    expect(JSON.stringify(inbound[0].detail)).not.toContain('Thursday')
  })

  it('test_UAT_FC_REQ-267_inbound_mail_writes_no_consent_state_of_any_kind', async () => {
    const address = `consent-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })
    const before = await countAcceptances(contactId)

    await receiveMail(
      inboundEnv(),
      inboundMessage({
        from: address,
        to: `hello@${DOMAIN}`,
        raw: rawMessage({
          from: address,
          to: `hello@${DOMAIN}`,
          subject: 'Yes please add me to everything',
          body: 'I consent to the newsletter and the terms.',
        }),
      }),
      deps(),
    )

    // A SPOOFED `From` THAT COULD MANUFACTURE AN OPT-IN would turn the record we
    // keep as evidence into evidence of something that did not happen. The
    // message says the words and the acceptance table is untouched.
    expect(await countAcceptances(contactId)).toBe(before)
  })
})

describe('REQ-267 — the envelope decides the business', () => {
  it('test_UAT_FC_REQ-267_the_envelope_recipient_decides_the_business_not_the_to_header', async () => {
    const address = `crossed-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })

    const outcome = await receiveMail(
      inboundEnv(),
      inboundMessage({
        from: address,
        // SMTP delivered here …
        to: `hello@${DOMAIN}`,
        raw: rawMessage({
          from: address,
          // … and the header says somebody else entirely, which is what a Bcc
          // looks like and what a forgery looks like.
          to: `hello@${OTHER_DOMAIN}`,
          subject: 'Bcc to us',
          body: 'body',
        }),
      }),
      deps(),
    )

    expect(outcome.businessId).toBe(BUSINESS)
    expect(await allMessages(OTHER_BUSINESS)).toHaveLength(0)
    const received = await inboundFor(await ticketStoreFor(inboundEnv(), scopeOf()), contactId)
    expect(received).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-267_an_unresolvable_recipient_domain_is_rejected_and_writes_nothing', async () => {
    const before = (await allMessages()).length
    const message = inboundMessage({
      from: 'stranger@example.test',
      to: 'someone@nobody-here.test',
      raw: rawMessage({
        from: 'stranger@example.test',
        to: 'someone@nobody-here.test',
        subject: 'Lost',
        body: 'body',
      }),
    })

    const outcome = await receiveMail(inboundEnv(), message, deps())

    expect(outcome.outcome).toBe('rejected')
    expect(message.rejected).not.toBeNull()
    expect(message.forwards).toEqual([])
    expect((await allMessages()).length).toBe(before)
  })
})

describe('REQ-267 — what the sender proved', () => {
  it('test_UAT_FC_REQ-267_a_dmarc_failure_is_captured_and_recorded_on_ticket_and_event', async () => {
    const address = `spoofed-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })

    await receiveMail(
      inboundEnv(),
      inboundMessage({
        from: address,
        to: `hello@${DOMAIN}`,
        headers: { 'authentication-results': 'mx.test; spf=fail; dkim=none; dmarc=fail' },
        raw: rawMessage({
          from: address,
          to: `hello@${DOMAIN}`,
          subject: 'Probably not them',
          body: 'wire me money',
        }),
      }),
      deps(),
    )

    // CAPTURED AND NOT DISCARDED. A small business receives real mail from
    // misconfigured senders every day; what must never happen is it being
    // threaded onto the contact as their words without the reader being told.
    const received = await inboundFor(await ticketStoreFor(inboundEnv(), scopeOf()), contactId)
    expect(received[0].alignment).toBe('fail')
    const events = await eventsOf(inboundEnv(), scopeOf(), contactId)
    expect(events.find((one) => one.kind === EMAIL_RECEIVED)?.detail.alignment).toBe('fail')
  })

  it('test_UAT_FC_REQ-267_an_absent_verdict_is_recorded_as_unknown_not_as_a_failure', async () => {
    const address = `silent-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })
    await receiveMail(
      inboundEnv(),
      inboundMessage({
        from: address,
        to: `hello@${DOMAIN}`,
        raw: rawMessage({
          from: address,
          to: `hello@${DOMAIN}`,
          subject: 'No stamp',
          body: 'body',
        }),
      }),
      deps(),
    )
    const received = await inboundFor(await ticketStoreFor(inboundEnv(), scopeOf()), contactId)
    expect(received[0].alignment).toBe('unknown')
  })
})

describe('REQ-267 — recording and forwarding are independent', () => {
  it('test_UAT_FC_REQ-267_a_message_whose_capture_threw_is_still_forwarded', async () => {
    const message = inboundMessage({
      from: 'anyone@example.test',
      to: `hello@${DOMAIN}`,
      raw: rawMessage({
        from: 'anyone@example.test',
        to: `hello@${DOMAIN}`,
        subject: 'Capture will fail',
        body: 'body',
      }),
    })

    // THE STORE IS WHAT BREAKS, which is the realistic failure: a validation
    // change, a blob binding gone, a component upgrade. The message is still the
    // customer's mail and still has to reach them.
    const outcome = await receiveMail(inboundEnv(), message, {
      openStore: () => Promise.reject(new Error('the store is down')),
    })

    expect(outcome.outcome).toBe('capture_failed')
    expect(outcome.error).toContain('the store is down')
    expect(message.forwards).toEqual([FORWARD_TO])
  })

  it('test_UAT_FC_REQ-267_a_message_that_could_not_be_forwarded_is_still_recorded', async () => {
    const address = `unforwardable-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })
    const message = inboundMessage({
      from: address,
      to: `hello@${DOMAIN}`,
      forwardThrows: true,
      raw: rawMessage({
        from: address,
        to: `hello@${DOMAIN}`,
        subject: 'Forward will fail',
        body: 'body',
      }),
    })

    const outcome = await receiveMail(inboundEnv(), message, deps())

    expect(outcome.forwarded).toBe('failed')
    expect(outcome.outcome).toBe('captured')
    const received = await inboundFor(await ticketStoreFor(inboundEnv(), scopeOf()), contactId)
    expect(received.map((one) => one.subject)).toContain('Forward will fail')
  })
})

describe('REQ-267 — a stranger waits in the queue', () => {
  it('test_UAT_FC_REQ-267_a_stranger_creates_no_contact_and_no_event_and_is_pending', async () => {
    const address = `stranger-${newId('t')}@example.test`
    const before = (await peopleOf(inboundEnv(), scopeOf())).length

    await receiveMail(
      inboundEnv(),
      inboundMessage({
        from: address,
        to: `hello@${DOMAIN}`,
        raw: rawMessage({
          from: address,
          to: `hello@${DOMAIN}`,
          subject: 'Do you do gutters',
          body: 'and how much',
        }),
      }),
      deps(),
    )

    // NO ROW. Not a lead, not a placeholder, nothing — which is what
    // [[DOC-54]]'s forwarding-test argument depends on.
    expect((await peopleOf(inboundEnv(), scopeOf())).length).toBe(before)
    const store = await ticketStoreFor(inboundEnv(), scopeOf())
    const pending = await pendingInbound(inboundEnv(), store, scopeOf())
    expect(pending.map((one) => one.envelopeFrom)).toContain(address)
  })

  it('test_UAT_FC_REQ-267_promoting_runs_addContact_and_attaches_the_stored_messages', async () => {
    const address = `promoted-${newId('t')}@example.test`
    for (const subject of ['First ask', 'Second ask']) {
      await receiveMail(
        inboundEnv(),
        inboundMessage({
          from: address,
          to: `hello@${DOMAIN}`,
          raw: rawMessage({ from: address, to: `hello@${DOMAIN}`, subject, body: 'body' }),
        }),
        deps(),
      )
    }
    const store = await ticketStoreFor(inboundEnv(), scopeOf())
    const waiting = (await pendingInbound(inboundEnv(), store, scopeOf())).filter(
      (one) => one.envelopeFrom === address,
    )
    expect(waiting).toHaveLength(2)

    const promoted = await promotePending(inboundEnv(), store, scopeOf(), waiting[0].uid)

    // ONE CONTACT, BY THE ONE PATH. `addContact` is what a contact IS; a second
    // route to one is a second answer that eventually disagrees.
    expect(promoted.created).toBe(true)
    const people = await peopleOf(inboundEnv(), scopeOf())
    expect(people.find((one) => one.id === promoted.contactId)?.email).toBe(address)
    // AND BOTH MESSAGES FOLLOW THEM. Promoting somebody who has written twice
    // means *this person is a contact* — a queue that kept the second would ask
    // the same question again about a decision already taken.
    expect(promoted.attached).toHaveLength(2)
    const received = await inboundFor(store, promoted.contactId)
    expect(received.map((one) => one.subject).sort()).toEqual(['First ask', 'Second ask'])
    // THE TIMELINE GETS WHAT IT NEVER HAD, stamped when the mail arrived.
    const events = await eventsOf(inboundEnv(), scopeOf(), promoted.contactId)
    expect(events.filter((one) => one.kind === EMAIL_RECEIVED)).toHaveLength(2)
    // AND THE QUEUE IS EMPTY OF THEM.
    const after = await pendingInbound(inboundEnv(), store, scopeOf())
    expect(after.filter((one) => one.envelopeFrom === address)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-267_a_discard_is_sticky_and_later_mail_is_kept_but_not_requeued', async () => {
    const address = `discarded-${newId('t')}@example.test`
    await receiveMail(
      inboundEnv(),
      inboundMessage({
        from: address,
        to: `hello@${DOMAIN}`,
        raw: rawMessage({ from: address, to: `hello@${DOMAIN}`, subject: 'Spam one', body: 'x' }),
      }),
      deps(),
    )
    await discardSender(inboundEnv(), scopeOf(), address)

    const second = inboundMessage({
      from: address,
      to: `hello@${DOMAIN}`,
      raw: rawMessage({ from: address, to: `hello@${DOMAIN}`, subject: 'Spam two', body: 'x' }),
    })
    await receiveMail(inboundEnv(), second, deps())

    const store = await ticketStoreFor(inboundEnv(), scopeOf())
    const pending = await pendingInbound(inboundEnv(), store, scopeOf())
    expect(pending.filter((one) => one.envelopeFrom === address)).toHaveLength(0)
    // STILL RECORDED AND STILL FORWARDED. A triage decision may not break the
    // business's mail, and the record is evidence that must not depend on
    // whether anybody found the sender interesting.
    expect(second.forwards).toEqual([FORWARD_TO])
    const all = await allMessages()
    expect(all.filter((one) => one.envelopeFrom === address)).toHaveLength(2)
  })
})

describe('REQ-267 — the size bound', () => {
  it('test_UAT_FC_REQ-267_an_oversize_message_is_recorded_as_refused_with_no_body_read', async () => {
    const message = inboundMessage({
      from: 'huge@example.test',
      to: `hello@${DOMAIN}`,
      rawSize: MAX_MESSAGE_BYTES + 1,
      raw: rawMessage({
        from: 'huge@example.test',
        to: `hello@${DOMAIN}`,
        subject: 'Enormous',
        body: 'x',
      }),
    })

    const outcome = await receiveMail(inboundEnv(), message, deps())

    expect(outcome.outcome).toBe('refused')
    // THE BOUND IS ABOUT MEMORY, so it has to be applied BEFORE the read. A
    // pipeline that read the stream and then discarded it would leave an
    // identical ticket having spent exactly what the bound protects.
    expect(message.bodyRead).toBe(false)
    const refused = (await allMessages()).find((one) => one.uid === outcome.messageUid)
    expect(refused?.status).toBe('refused')
    expect(refused?.envelopeFrom).toBe('huge@example.test')
    expect(refused?.size).toBe(MAX_MESSAGE_BYTES + 1)
    expect(refused?.body).toBe('')
    // A REFUSAL THAT LEFT NO TRACE would be indistinguishable from mail that
    // never arrived — and it is still forwarded, because it is still their mail.
    expect(message.forwards).toEqual([FORWARD_TO])
  })
})

describe('REQ-267 — the synthetic mark', () => {
  it('test_UAT_FC_REQ-267_a_live_reserved_address_is_marked_never_forwarded_and_hidden', async () => {
    const runId = await openRun(inboundEnv(), { note: 'REQ-267 suite' })
    const address = `probe-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })

    const message = inboundMessage({
      from: address,
      to: reservedAddressFor(runId, DOMAIN),
      raw: rawMessage({
        from: address,
        to: reservedAddressFor(runId, DOMAIN),
        subject: 'A probe',
        body: 'manufactured',
      }),
    })
    const outcome = await receiveMail(inboundEnv(), message, deps())

    expect(outcome.synthetic).toBe(true)
    // NEVER FORWARDED. A probe's mail in a customer's inbox is the mirror image
    // of the attack the marker exists to prevent.
    expect(message.forwards).toEqual([])
    expect(outcome.forwarded).toBe('reserved')

    // AND IT IS IN NO CUSTOMER-VISIBLE READ. Not the contact's mail …
    const store = await ticketStoreFor(inboundEnv(), scopeOf())
    expect(await inboundFor(store, contactId)).toHaveLength(0)
    // … and not their timeline, even though the CONTACT is real — the mark is
    // taken as a floor over the parent's, which is the case a derivation from
    // `users` alone would get wrong.
    expect(await eventsOf(inboundEnv(), scopeOf(), contactId)).toHaveLength(0)
    // The row is there for the reaper, under a read that asked for it by name.
    const marked = await eventsOf(
      inboundEnv(),
      { businessId: BUSINESS, includeSynthetic: true },
      contactId,
    )
    expect(marked.filter((one) => one.synthetic && one.runId === runId)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-267_a_synthetic_attachment_is_written_under_the_reserved_prefix', async () => {
    const runId = await openRun(inboundEnv(), {})
    const message = inboundMessage({
      from: 'probe@example.test',
      to: reservedAddressFor(runId, DOMAIN),
      raw: rawMessage({
        from: 'probe@example.test',
        to: reservedAddressFor(runId, DOMAIN),
        subject: 'With a file',
        body: 'see attached',
        attachment: { filename: 'notes.txt', type: 'text/plain', content: 'synthetic bytes' },
      }),
    })
    await receiveMail(inboundEnv(), message, deps())

    // A BUCKET HAS NO `WHERE` CLAUSE, so the reaper's sweep is a prefix listing
    // and the prefix has to be in the key ([[DOC-54]] §2.5).
    const listed = await (env.BLOBS as R2Bucket).list({ prefix: SYNTHETIC_BLOB_PREFIX })
    expect(listed.objects.length).toBeGreaterThan(0)
    const stored = await (env.BLOBS as R2Bucket).get(listed.objects[0].key)
    expect(await stored?.text()).toBe('synthetic bytes')
  })

  it('test_UAT_FC_REQ-267_a_malformed_unknown_or_expired_marker_degrades_to_real_mail', async () => {
    const expired = await openRun(inboundEnv(), { windowMs: -1 })
    const unknown = `run_${'a'.repeat(32)}`
    const cases = [
      ['malformed', `bfm+not-a-run@${DOMAIN}`],
      ['unknown', `bfm+${unknown}@${DOMAIN}`],
      ['expired', reservedAddressFor(expired, DOMAIN)],
    ] as const

    for (const [why, to] of cases) {
      const address = `real-${why}-${newId('t')}@example.test`
      const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })
      const message = inboundMessage({
        from: address,
        to,
        raw: rawMessage({ from: address, to, subject: `Real ${why}`, body: 'body' }),
      })

      const outcome = await receiveMail(inboundEnv(), message, deps())

      // DEGRADES TO REAL. Marking real traffic as test is the attack worth
      // closing, so every check that cannot be completed fails OPEN.
      expect(outcome.synthetic, why).toBe(false)
      const store = await ticketStoreFor(inboundEnv(), scopeOf())
      expect((await inboundFor(store, contactId)).length, why).toBe(1)
      // AND THE RESERVED NAMESPACE STILL NEVER FORWARDS. The two halves of the
      // marker fail in opposite directions on purpose: an address that LOOKS
      // like ours must not reach a customer whether or not its run resolves.
      expect(message.forwards, why).toEqual([])
    }
  })

  it('test_UAT_FC_REQ-267_an_events_mark_is_derived_from_a_synthetic_contact', async () => {
    const runId = await openRun(inboundEnv(), {})
    const address = `syncontact-${newId('t')}@example.test`
    const contactId = await seedContact(inboundEnv(), { tenantId: BUSINESS, email: address })
    await env.DB.prepare('UPDATE users SET synthetic = 1, run_id = ? WHERE id = ?')
      .bind(runId, contactId)
      .run()

    // ORDINARY REAL MAIL to a real address, from a contact that happens to be a
    // probe's. Nothing in this path passes a mark.
    await receiveMail(
      inboundEnv(),
      inboundMessage({
        from: address,
        to: `hello@${DOMAIN}`,
        raw: rawMessage({
          from: address,
          to: `hello@${DOMAIN}`,
          subject: 'From a synthetic contact',
          body: 'body',
        }),
      }),
      deps(),
    )

    const visible = await eventsOf(inboundEnv(), scopeOf(), contactId)
    expect(visible).toHaveLength(0)
    const marked = await eventsOf(
      inboundEnv(),
      { businessId: BUSINESS, includeSynthetic: true },
      contactId,
    )
    expect(marked[0].synthetic).toBe(true)
    expect(marked[0].runId).toBe(runId)
    // AND THE CONTACT IS OUT OF THE LIST TOO, by the same default-deny read.
    expect((await peopleOf(inboundEnv(), scopeOf())).find((one) => one.id === contactId)).toBe(
      undefined,
    )
  })

  it('test_UAT_FC_REQ-267_every_gutter_column_defaults_to_real_not_null_on_four_tables', async () => {
    for (const table of ['users', 'contact_events', 'user_acceptances', 'asset_grants']) {
      const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{
        name: string
        notnull: number
        dflt_value: string | null
      }>()
      const column = (results ?? []).find((one) => one.name === 'synthetic')
      // `NOT NULL` IS NOT TIDINESS: a nullable flag makes an unstamped row
      // ambiguous under three-valued logic, and ambiguity in the reaper's delete
      // predicate is how a real contact gets collected.
      expect(column, table).toBeDefined()
      expect(column?.notnull, table).toBe(1)
      expect(String(column?.dflt_value), table).toBe('0')
      expect((results ?? []).some((one) => one.name === 'run_id'), table).toBe(true)
    }
  })
})

/** How many acceptances this contact holds — the consent surface, untouched. */
async function countAcceptances(contactId: string): Promise<number> {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM user_acceptances WHERE contact_id = ?',
  )
    .bind(contactId)
    .first<{ n: number }>()
  return row?.n ?? 0
}
