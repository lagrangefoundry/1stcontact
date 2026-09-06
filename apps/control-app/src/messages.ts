/**
 * Outgoing messages — one record per message, joined to the contact it went to
 * ([[REQ-198]], [[CHAT-39]]).
 *
 * WHY A RECORD EXISTS AT ALL. An "invite" that leaves nothing behind is
 * indistinguishable from one that was never pressed. The operator's question the
 * next morning is *did that reach them*, and without a record the only evidence
 * available is the person not showing up — which arrives days late and says
 * nothing about why. So every send writes a ticket, and the Contacts pane reads
 * them back.
 *
 * QUEUE FIRST, THEN SEND, THEN UPDATE. The record is written `queued` BEFORE the
 * provider is called and updated after. Written afterwards from what came back,
 * a crash between "the operator pressed Invite" and "the provider accepted the
 * message" leaves nothing at all — and the person it was for is waiting for mail
 * nobody knows was lost. It costs one extra write and it is the whole difference
 * between a failed send that left evidence and one that vanished.
 *
 * THE SENDING PORT IS PASSED IN, NEVER IMPORTED. [[REQ-196]] owns the port and
 * its adapters; this module owns the recording around one. That is what keeps
 * the provider decision reversible at one adapter and no call sites, and it is
 * what satisfies [[REQ-196]]'s falsifier — *a code path where running the tests
 * can send mail* — from this side of the seam: a suite drives
 * {@link sendRecordedEmail} with a stub, and there is no import here that could
 * reach a network.
 *
 * THE BODY IS THE RENDERED MESSAGE. The template changes; what we sent does not.
 * `template_key` is kept beside it because *which template did this come from*
 * is also worth asking — it is simply a different question from *what did this
 * person actually receive*, and only the second one can be answered by storing
 * the text.
 */

import type { TicketStore, Ticket, MultiTenantTicketStoreHandle } from './tickets'

/** The ticket type. Spelled once; every query and every create reads it here. */
export const EMAIL_TYPE = 'email'

/**
 * The delivery lifecycle, in the order a message moves through it.
 *
 * FIVE VALUES AND TWO WRITERS. `queued` → `sent` | `failed` is the send path's;
 * `sent` → `delivered` | `bounced` is the webhook's. Nothing moves backwards,
 * and no writer owns both halves — which is why a bounce arriving before the
 * send path has finished updating cannot undo the record of the attempt.
 */
export const QUEUED = 'queued'
export const SENT = 'sent'
export const DELIVERED = 'delivered'
export const BOUNCED = 'bounced'
export const FAILED = 'failed'

export const MESSAGE_STATUSES = [QUEUED, SENT, DELIVERED, BOUNCED, FAILED] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

/**
 * The sending port, as this module needs it ([[REQ-196]]).
 *
 * DECLARED STRUCTURALLY RATHER THAN IMPORTED, so the recorder depends on the
 * SHAPE of a sender and not on any particular one. `providerId` is not optional
 * because it is the only thing that can later join a delivery or bounce event
 * back to this record; an adapter that discarded it would make
 * {@link applyDeliveryEvent} unimplementable.
 */
export interface SendEmail {
  (message: { to: string; from: string; subject: string; body: string }): Promise<{
    providerId: string
  }>
}

/** What the caller asks to send. Everything here is decided before the attempt. */
export interface OutgoingMessage {
  /** The person. */
  contactId: string
  /** The ADDRESS it went to — a bounce is a fact about one of these, not about a person. */
  addressId: string
  /** Which template it rendered from. A key, not a ticket uid ([[REQ-197]]). */
  templateKey: string
  subject: string
  from: string
  to: string
  /** The RENDERED body, as sent. */
  body: string
}

/** One message, as the pane lists it. */
export interface MessageRecord {
  uid: string
  contactId: string
  addressId: string
  templateKey: string
  subject: string
  from: string
  to: string
  status: MessageStatus
  providerId: string | null
  queuedAt: string
  sentAt: string | null
  /** Why it failed, in the provider's own words. Null unless it did. */
  failure: string | null
  body: string
}

const str = (fields: Record<string, unknown>, name: string): string | null => {
  const value = fields[name]
  return typeof value === 'string' && value !== '' ? value : null
}

/** A stored ticket as the rest of the product reads it. */
export function toMessageRecord(ticket: Ticket): MessageRecord {
  const f = (ticket.fields ?? {}) as Record<string, unknown>
  return {
    uid: ticket.uid,
    contactId: str(f, 'contact_id') ?? '',
    addressId: str(f, 'address_id') ?? '',
    templateKey: str(f, 'template_key') ?? '',
    subject: str(f, 'subject') ?? '',
    from: str(f, 'from') ?? '',
    to: str(f, 'to') ?? '',
    status: (str(f, 'status') ?? QUEUED) as MessageStatus,
    providerId: str(f, 'provider_id'),
    queuedAt: str(f, 'queued_at') ?? ticket.created_at,
    sentAt: str(f, 'sent_at'),
    failure: str(f, 'failure'),
    body: ticket.body ?? '',
  }
}

/**
 * A subject that is safe as a ticket title.
 *
 * THE STORE REFUSES AN EMPTY TITLE, universally, so a message whose subject
 * rendered to nothing would fail to be recorded — at exactly the moment the
 * record is the only evidence that anything happened. The subject is still
 * stored verbatim in `fields.subject`; this is the title only.
 */
function titleFor(subject: string): string {
  const trimmed = subject.trim()
  return trimmed === '' ? '(no subject)' : trimmed
}

/**
 * Record, send, record the outcome — the whole of the send path ([[REQ-198]]).
 *
 * IT NEVER THROWS ON A SEND FAILURE. The failure is the thing being recorded, so
 * turning it into an exception would hand the caller the one outcome the record
 * exists to preserve and leave them to remember to look. The record comes back
 * with `status = 'failed'` and the reason on it, and the caller decides what to
 * say. A failure to WRITE the record is a different matter and does throw — at
 * that point there is no evidence and nothing has been attempted.
 *
 * THE UPDATE IS UNCONDITIONAL ON THE VERSION IT READ. The record is one turn old
 * and nothing else can be writing it: the webhook keys on `provider_id`, which
 * does not exist on the row until this function puts it there. So there is no
 * compare-and-set here and no lost update it could prevent.
 */
export async function sendRecordedEmail(
  store: TicketStore,
  message: OutgoingMessage,
  send: SendEmail,
  now: () => string = () => new Date().toISOString(),
): Promise<MessageRecord> {
  const queuedAt = now()
  const { ticket } = await store.create({
    type: EMAIL_TYPE,
    title: titleFor(message.subject),
    fields: {
      contact_id: message.contactId,
      address_id: message.addressId,
      template_key: message.templateKey,
      subject: message.subject,
      from: message.from,
      to: message.to,
      status: QUEUED,
      queued_at: queuedAt,
    },
    body: message.body,
  })

  try {
    const { providerId } = await send({
      to: message.to,
      from: message.from,
      subject: message.subject,
      body: message.body,
    })
    const sent = await store.update({
      uid: ticket.uid,
      patch: { fields: { status: SENT, provider_id: providerId, sent_at: now() } },
    })
    return toMessageRecord(sent.ticket)
  } catch (err) {
    // THE REASON IS STORED, not merely the fact. "Failed" alone tells an
    // operator nothing about whether pressing Invite again will help; "domain
    // not verified" and "mailbox full" call for opposite actions.
    const failure = err instanceof Error ? err.message : String(err)
    const failed = await store.update({
      uid: ticket.uid,
      patch: { fields: { status: FAILED, failure } },
    })
    return toMessageRecord(failed.ticket)
  }
}

/**
 * One contact's messages, most recent first.
 *
 * ORDERED BY WHEN IT WAS QUEUED and not by when it was sent, because a queued
 * message has no send time and a failed one never will — ordering on a stamp
 * half the rows lack would put exactly the interesting ones at the bottom.
 */
export async function messagesFor(
  store: TicketStore,
  contactId: string,
): Promise<MessageRecord[]> {
  if (contactId === '') return []
  const { tickets } = await store.query({
    predicate: `type="${EMAIL_TYPE}" AND fields.contact_id="${contactId}"`,
    limit: 'all',
  })
  return tickets
    .map(toMessageRecord)
    .sort((a, b) => (a.queuedAt < b.queuedAt ? 1 : a.queuedAt > b.queuedAt ? -1 : 0))
}

/**
 * The contacts holding at least one bounced message.
 *
 * REPORTED WITH THE LIST RATHER THAN STORED ON THE ADDRESS. A `bounced_at`
 * column on `user_emails` would be a second home for a fact the record already
 * carries, and the two would be free to disagree — the record is what the
 * webhook writes, so it is what the list reads.
 *
 * ONE QUERY FOR THE WHOLE LIST, not one per row. The store scans by type and
 * filters, so asking per contact would be the same scan N times over.
 */
export async function bouncedContactIds(store: TicketStore): Promise<string[]> {
  const { tickets } = await store.query({
    predicate: `type="${EMAIL_TYPE}" AND fields.status="${BOUNCED}"`,
    limit: 'all',
  })
  const ids = new Set<string>()
  for (const ticket of tickets) {
    const id = str((ticket.fields ?? {}) as Record<string, unknown>, 'contact_id')
    if (id) ids.add(id)
  }
  return [...ids].sort()
}

/** What a verified provider event says. */
export interface DeliveryEvent {
  providerId: string
  status: typeof DELIVERED | typeof BOUNCED
  /** The provider's reason for a bounce, where it gives one. */
  reason?: string
}

/** What became of an event: the record it landed on, or nothing it could match. */
export interface DeliveryOutcome {
  matched: boolean
  businessId: string | null
  message: MessageRecord | null
}

/**
 * Land a delivery event on the record it belongs to — the webhook's whole job.
 *
 * IT TAKES THE BASE HANDLE BECAUSE THE EVENT HAS NO TENANT. The provider knows a
 * message id and nothing about businesses, so there is no scope to resolve from.
 * The sanctioned shape for that is to hold the base, `listTenants()`, and take
 * one ORDINARY scoped handle per tenant until the record is found ([[DOC-40]]
 * §7): search wide, read deep. No unscoped read exists and none is created here
 * — every row this function sees arrived through a tenant-scoped query with the
 * same refusals every other read in the system gets.
 *
 * IT COSTS ONE SCAN PER REGISTERED BUSINESS PER EVENT, and stops at the first
 * match. That is the honest price of a beta with a handful of them; the upgrade
 * when there are thousands is a pointer index from `provider_id` to
 * `(tenant, uid)`, which is a narrow cross-tenant INDEX and still not a
 * cross-tenant read.
 *
 * THE PROVIDER'S ID IS FILTERED IN JS AND NEVER INTERPOLATED INTO A PREDICATE.
 * It is the one value in this file that arrives from outside; the predicate
 * grammar is parsed rather than bound, so a value carrying a quote or the word
 * `AND` would be parsed as syntax. The store matches predicates in JS after a
 * type scan anyway, so filtering here costs exactly nothing and removes the
 * question.
 *
 * AN UNMATCHED EVENT WRITES NOTHING and says so. Providers retry, and they also
 * deliver events for messages sent by something else entirely; inventing a
 * record for one would put a message in a contact's history that we never sent.
 */
export async function applyDeliveryEvent(
  base: MultiTenantTicketStoreHandle,
  event: DeliveryEvent,
): Promise<DeliveryOutcome> {
  if (event.providerId === '') return { matched: false, businessId: null, message: null }
  const tenants = await base.listTenants()
  for (const tenant of tenants) {
    if (tenant.status !== 'active') continue
    const store = await base.forTenant(tenant.id)
    const { tickets } = await store.query({ predicate: `type="${EMAIL_TYPE}"`, limit: 'all' })
    const found = tickets.find(
      (ticket) =>
        str((ticket.fields ?? {}) as Record<string, unknown>, 'provider_id') === event.providerId,
    )
    if (!found) continue
    const patch: Record<string, unknown> = { status: event.status }
    // THE REASON IS THE POINT OF A BOUNCE. Which address is bad is on the record
    // already; why it is bad is what tells the operator whether to correct a typo
    // or stop writing to a mailbox that is full.
    if (event.status === BOUNCED && event.reason) patch.failure = event.reason
    const updated = await store.update({ uid: found.uid, patch: { fields: patch } })
    return {
      matched: true,
      businessId: tenant.id,
      message: toMessageRecord(updated.ticket),
    }
  }
  return { matched: false, businessId: null, message: null }
}
