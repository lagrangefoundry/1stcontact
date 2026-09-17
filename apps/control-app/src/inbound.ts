/**
 * Inbound mail — the pipeline, the record, and the pending queue
 * ([[REQ-267]], [[EPIC-13]]).
 *
 * WHAT ARRIVES. Cloudflare Email Routing delivers to an Email Worker, which is
 * the only thing that ever sees the message. It carries an ENVELOPE (`from`,
 * `to` — what SMTP actually did), the top-level headers (what the sender
 * claimed), the raw bytes, and three actions: reject, forward, reply.
 *
 * WHAT IT DOES, IN THIS ORDER: resolve the business from the envelope recipient,
 * record, then forward. The order is the whole design. A forward that throws
 * must not cost us the record; a record that throws must not silently swallow
 * the customer's mail — so capture is wrapped and forwarding happens either way.
 * *Never break the business's mail* is the promise [[EPIC-13]] is built on;
 * capture is the product on top of it.
 *
 * AND IT NEVER REJECTS FOR A CAPTURE REASON. `setReject` returns a permanent
 * SMTP error, which tells a real correspondent their mail bounced. The only
 * thing that earns it is a recipient domain no business owns — where we
 * genuinely are not the mailbox and there is nobody to file the message under.
 *
 * `From` PROVES NOTHING. An SMTP sender is unauthenticated, so resolving
 * `alice@example.com` to a contact says who the sender CLAIMS to be. The
 * alignment verdict the platform reports is stored beside the claim as the
 * evidence for it — never as a check that gates it, and never as a conclusion.
 * Nothing on this path writes consent: a spoofed `From` that could manufacture
 * an opt-in would turn the record we keep as evidence into evidence of something
 * that did not happen.
 *
 * AND IT NEVER CREATES A CONTACT. A stranger's message is recorded and lands in
 * the pending queue, where a human promotes or discards it. A speculative
 * contact per stranger would fill the list with spam and would break the one
 * property [[DOC-54]] rests on — that a forwarding test from an unmatched sender
 * creates no contact, no timeline entry and no metric.
 */

import {
  EMAIL_RECEIVED,
} from './builder/contact-events.js'
import { recordEvent, type EventEnv } from './events'
import { newId, normaliseEmail, type IdentityEnv } from './identity'
import {
  SYNTHETIC_BLOB_PREFIX,
  domainOf,
  markerOf,
  type Marker,
} from './gutter'
import {
  addressIn,
  decodeWords,
  headerValue,
  parseMessage,
  type MimeAttachment,
} from './mime'
import { addContact } from './people'
import type { Scope } from './scope'
import type { Ticket, TicketStore, TicketStoreEnv } from './tickets'

/** The ticket type one received message is recorded as. Spelled once. */
export const INBOUND_EMAIL_TYPE = 'inbound_email'

/** What became of a message we took delivery of. */
export const CAPTURED = 'captured'
/** Too big to read, so the envelope was recorded and the body never was. */
export const REFUSED = 'refused'

/**
 * How the platform's authentication verdict came out.
 *
 * FOUR VALUES BECAUSE THREE WOULD LIE. `pass` and `fail` are verdicts;
 * `none` is a sender with no policy published, which is ordinary for a small
 * business's correspondent and is NOT a failure; `unknown` is us not having been
 * told, which is a fact about the delivery path rather than about the sender.
 * Collapsing the last two would make "we could not tell" indistinguishable from
 * "they have not set it up", and only one of those is worth chasing.
 */
export const ALIGNMENTS = ['pass', 'fail', 'none', 'unknown'] as const
export type Alignment = (typeof ALIGNMENTS)[number]

/**
 * The largest message this pipeline will PARSE.
 *
 * A CONFIGURATION CONSTANT AND NOT THE PLATFORM'S LIMIT. Email Routing has a
 * limit of its own on what it will accept at all, which is the number to read
 * from current Cloudflare documentation rather than restate here; this one is
 * about a Worker's memory. Parsing decodes the whole message into a string and
 * then into bytes, so the peak is a small multiple of the message — and a Worker
 * that dies on the largest message loses it entirely, which is the outcome this
 * bound exists to convert into a recorded refusal.
 *
 * THE REFUSAL IS RECORDED, WHICH IS THE POINT ([[REQ-267]] §5). `rawSize` is
 * available before the body is read, so a message over the bound leaves a ticket
 * carrying its envelope and its size and no body. A refusal that leaves no trace
 * is indistinguishable from mail that never arrived.
 */
export const MAX_MESSAGE_BYTES = 8 * 1024 * 1024

/** The R2 prefix a message's attachment bytes live under. */
export const INBOUND_BLOB_PREFIX = 'inbound/'

/**
 * The schema, declared here and registered in `tickets.ts`.
 *
 * THE SAME TREATMENT `TEMPLATE_SCHEMA` AND `ACCEPTANCE_SCHEMA` GET, for the same
 * reason: the shape belongs beside the code that reads it back, and what belongs
 * in the pack is the fact that this platform's tickets come in this type at all.
 *
 * A SECOND TYPE AND NOT A `direction` FIELD ON `email`. The outbound type
 * requires `contact_id`, `address_id`, `template_key` and `queued_at` — four
 * things a received message does not have and cannot invent — and its delivery
 * lifecycle (`queued → sent → delivered`) describes an attempt WE made. Widening
 * it would mean making every one of those optional, after which the schema stops
 * saying anything about either shape.
 *
 * `contact_id` IS OPTIONAL, AND THAT ABSENCE IS THE PENDING QUEUE
 * ([[REQ-267]] §6). Pending is a state of the MESSAGE, not a new entity: the
 * ticket is written either way, and what an unmatched message lacks is a
 * resolved contact. So the queue is a read over this type with no `contact_id`,
 * scoped to the business — not a second representation of a person.
 */
export const INBOUND_EMAIL_SCHEMA = {
  fields: {
    /**
     * Our own key for this message, minted before anything is written.
     *
     * IT EXISTS BECAUSE THE BLOBS NEED A PREFIX AND THE TICKET UID ARRIVES TOO
     * LATE. Attachment bytes are written before the ticket that names them, so
     * that a create carrying attachment metadata is one write rather than a
     * create followed by an update the type's own lock would have to make an
     * exception for.
     */
    mail_id: { type: 'string', required: true },
    /** What SMTP said, which is the only thing about the sender that is a fact. */
    envelope_from: { type: 'string', required: true },
    /** What SMTP delivered TO — the address that decided the business. */
    envelope_to: { type: 'string', required: true },
    /** What the sender WROTE, kept beside the envelope precisely because they differ. */
    header_from: { type: 'string' },
    header_to: { type: 'string' },
    subject: { type: 'string' },
    /** The `Date:` header, which is the sender's clock and not ours. */
    sent_at: { type: 'string' },
    /**
     * Threading, recorded and never inferred ([[REQ-267]] §5).
     *
     * STORING THE IDENTIFIERS IS THIS TICKET; RENDERING A THREAD FROM THEM IS
     * NOT. Without them the activity log is a heap of unrelated messages, and
     * they cannot be reconstructed later from anything else — which is the whole
     * test for what belongs in a record written once.
     */
    message_id: { type: 'string' },
    in_reply_to: { type: 'string' },
    references: { type: 'string' },
    alignment: {
      type: 'enum',
      enum: [...ALIGNMENTS],
      required: true,
      default: 'unknown',
    },
    /** The verdict header verbatim — the evidence the summary above came from. */
    auth_results: { type: 'string' },
    /**
     * The person this claims to be from, when the address resolved to one.
     *
     * A `string` AND NOT A `uid`, for `email`'s reason: it is a key into the
     * identity schema — a `users` row — and declaring it `uid` would make the
     * store try to resolve it as a ticket and refuse every capture.
     */
    contact_id: { type: 'string' },
    received_at: { type: 'string', required: true },
    size: { type: 'integer', required: true, min: 0 },
    status: { type: 'enum', enum: [CAPTURED, REFUSED], required: true, default: CAPTURED },
    /** Why a message was refused, in words. Absent unless it was. */
    refusal: { type: 'string' },
    /**
     * What came attached — metadata only, and the bytes are in R2.
     *
     * ONE JSON OBJECT PER ENTRY rather than three parallel lists of names, types
     * and keys. Parallel lists are three facts about one thing kept in three
     * places, held together only by index — and the first time one of them is
     * filtered they come apart silently. The store's field vocabulary has no
     * record type, so the honest alternative is one self-describing string per
     * attachment, which is what this is.
     *
     * NOTHING SERVES THESE ([[REQ-267]] §5). Bytes arriving by mail are bytes an
     * anonymous party chose; a download surface re-opens [[EPIC-17]] F1 from the
     * anonymous side and belongs with F1's separate-origin work.
     */
    attachments: { type: 'list' },
    /**
     * The test gutter's mark ([[DOC-54]], [[REQ-267]] §7).
     *
     * ON THE TICKET AND NOT ONLY ON THE ROWS IT CAUSED, because a message from a
     * stranger causes no row at all — it goes to the pending queue, which is a
     * read over these tickets. Without the flag here, a probe's mail would be
     * queued for a human to triage, which is precisely the customer-visible
     * pollution the gutter exists to prevent.
     */
    synthetic: { type: 'boolean', required: true, default: false },
    run_id: { type: 'string' },
  },
  // NOT REQUIRED. A message over the size bound has no body by construction, and
  // a `multipart/related` carrying only an image has none either — refusing to
  // record one would lose exactly the message whose arrival is most worth
  // knowing about.
  body: { required: false },
  /**
   * A RECEIVED MESSAGE IS WHAT ARRIVED, and cannot be edited ([[REQ-263]]'s rule
   * for `email`, applied to the other direction for the same reason). Evidence
   * that can be rewritten is not evidence, and this evidence is a stranger's
   * words — the one kind nobody may quietly improve.
   *
   * `fields.contact_id` IS THE ONE EXCEPTION, and it is not content. Promotion
   * attaches an already-stored message to the contact it just created
   * ([[REQ-267]] §6); freezing it would mean the queue could be triaged and the
   * message could never follow the person, which is the opposite of preserving
   * the record.
   */
  immutable: [
    {
      freeze: ['body', 'title', 'fields.*'],
      except: ['fields.contact_id'],
      message: 'a received message is what arrived; it cannot be edited',
    },
  ],
}

/** What this module needs: the identity schema, and the ticket store. */
export type InboundEnv = IdentityEnv & TicketStoreEnv & EventEnv

/**
 * The half of `ForwardableEmailMessage` this pipeline uses.
 *
 * DECLARED HERE RATHER THAN IMPORTED FROM THE PLATFORM TYPES, and it is the same
 * seam `SendEmail` is on the way out ([[REQ-196]]). What it buys is that the
 * whole pipeline is an ordinary function over an ordinary object: a suite drives
 * it with a message it composed, inside workerd, against a real database — and
 * there is no import here that could reach a mail server. The deployed handler
 * passes the platform's own object, which is structurally this.
 */
export interface InboundMessage {
  /** The ENVELOPE sender. Unauthenticated, and the record says so. */
  from: string
  /** The ENVELOPE recipient — what decides the business, and nothing else does. */
  to: string
  headers: Headers
  raw: ReadableStream<Uint8Array>
  rawSize: number
  setReject(reason: string): void
  /**
   * `Promise<unknown>` AND NOT `Promise<void>`, because the platform's own
   * `forward` resolves to a send result this pipeline has no use for. Declaring
   * the narrower return would make the real message structurally unassignable to
   * this seam — a type error about a value nobody reads.
   */
  forward(rcptTo: string, headers?: Headers): Promise<unknown>
}

/**
 * What the pipeline is handed rather than imports ([[REQ-196]]'s idiom).
 *
 * THE STORE OPENER IS PASSED IN, AND THAT IS NOT ONLY TASTE. `tickets.ts`
 * registers this module's schema, so importing `ticketStoreFor` back would make
 * the two modules import each other — which ESM tolerates until the day one of
 * those imports is read at module scope rather than inside a function, and then
 * fails as an undefined binding at boot. `events.ts` records the same hazard for
 * the same pair of files. Handing the opener down costs one line at the one call
 * site that has an `Env`.
 *
 * AND THE CLOCK IS THE OTHER HALF. A suite proving that a run's window closes
 * has to be able to move time, and the alternative — sleeping — is a test that is
 * slow when it passes and flaky when it does not.
 */
export interface InboundDeps {
  openStore(scope: Scope): Promise<TicketStore>
  now?(): Date
}

/** Why a message was not forwarded, or that it was. */
export type ForwardOutcome = 'forwarded' | 'no_destination' | 'reserved' | 'failed'

/** What the pipeline did, for the invocation log and for the suites. */
export interface InboundOutcome {
  /** `rejected` is the only outcome that writes nothing at all. */
  outcome: 'captured' | 'refused' | 'rejected' | 'capture_failed'
  businessId: string | null
  /** The ticket, when one was written. */
  messageUid: string | null
  /** The contact it was filed against, or null — which is the pending queue. */
  contactId: string | null
  synthetic: boolean
  forwarded: ForwardOutcome
  /** What capture threw, when it did. The message was still forwarded. */
  error?: string
}

/**
 * Take delivery of one message.
 *
 * IT RETURNS RATHER THAN THROWS, for every outcome including a capture that
 * failed. The caller is a platform handler with nobody to report to but the
 * invocation log, and an exception there is a message the runtime may retry —
 * which for a pipeline that has already written a ticket means writing it twice.
 */
export async function receiveMail(
  env: InboundEnv,
  message: InboundMessage,
  deps: InboundDeps,
): Promise<InboundOutcome> {
  const now = deps.now ?? (() => new Date())
  const recipient = normaliseEmail(message.to)
  const domain = domainOf(recipient)
  const business = await businessOfDomain(env, domain)

  // AN UNRESOLVABLE RECIPIENT DOMAIN IS REFUSED, NOT FILED ([[REQ-267]] §3). We
  // are not the mailbox for it and there is no business to file it under, so a
  // permanent SMTP error is both true and the only answer that tells the sender
  // anything useful. This is the one tenancy boundary on the inbound path: every
  // write below is scoped by the business this produced.
  if (!business) {
    message.setReject('This address is not served here.')
    return {
      outcome: 'rejected',
      businessId: null,
      messageUid: null,
      contactId: null,
      synthetic: false,
      forwarded: 'no_destination',
    }
  }

  const marker = await markerOf(env, recipient, now())
  const scope: Scope = { businessId: business.businessId }

  let captured: CaptureResult = {
    outcome: 'capture_failed',
    messageUid: null,
    contactId: null,
  }
  try {
    captured = await capture(env, scope, message, marker, now, deps.openStore)
  } catch (err) {
    // THE CAPTURE FAILURE IS SWALLOWED HERE AND REPORTED BELOW, deliberately.
    // The business's mail reaching a human is the promise; capture is the
    // product on top of it. Rethrowing would make a bug in our parser into a
    // bounced message for their customer.
    captured.error = err instanceof Error ? err.message : String(err)
  }

  const forwarded = await forward(message, marker, business.forwardTo)

  return {
    outcome: captured.outcome,
    businessId: business.businessId,
    messageUid: captured.messageUid,
    contactId: captured.contactId,
    synthetic: marker.runId !== null,
    forwarded,
    ...(captured.error === undefined ? {} : { error: captured.error }),
  }
}

/** What `capture` reports back to {@link receiveMail}. */
interface CaptureResult {
  outcome: 'captured' | 'refused' | 'capture_failed'
  messageUid: string | null
  contactId: string | null
  error?: string
}

/**
 * Write the record — the whole of what capture means.
 *
 * SEPARATE FROM THE FORWARD, AND THAT SEPARATION IS THE ACCEPTANCE CRITERION.
 * Nothing in here can reach `forward`, and nothing in `forward` can reach a
 * store, so "recording and forwarding are independent" is a property of the call
 * graph rather than a promise about ordering.
 */
async function capture(
  env: InboundEnv,
  scope: Scope,
  message: InboundMessage,
  marker: Marker,
  now: () => Date,
  openStore: (scope: Scope) => Promise<TicketStore>,
): Promise<CaptureResult> {
  const receivedAt = now().toISOString()
  const mailId = newId('inm')
  const envelopeFrom = normaliseEmail(message.from)
  const store = await openStore(scope)
  const synthetic = marker.runId !== null

  const base: Record<string, unknown> = {
    mail_id: mailId,
    envelope_from: envelopeFrom,
    envelope_to: normaliseEmail(message.to),
    received_at: receivedAt,
    size: Math.max(0, Math.trunc(message.rawSize)),
    synthetic,
    ...(marker.runId ? { run_id: marker.runId } : {}),
  }

  // THE BOUND IS CHECKED BEFORE THE STREAM IS READ, which is the only place it
  // can be checked and still mean anything: `rawSize` is available up front, and
  // a bound applied after the read is a bound that has already spent the memory.
  if (message.rawSize > MAX_MESSAGE_BYTES) {
    const { ticket } = await store.create({
      type: INBOUND_EMAIL_TYPE,
      title: '(message too large)',
      fields: {
        ...base,
        alignment: alignmentOf(message.headers).verdict,
        auth_results: authResultsOf(message.headers),
        status: REFUSED,
        refusal: `The message is ${message.rawSize} bytes, over the ${MAX_MESSAGE_BYTES}-byte bound, so its body was not read.`,
      },
      body: '',
    })
    return { outcome: 'refused', messageUid: ticket.uid, contactId: null }
  }

  const parsed = parseMessage(await readAll(message.raw))
  const alignment = alignmentOf(message.headers, parsed.headers)
  const subject = decodeWords(headerValue(parsed.headers, 'subject'))

  // THE ADDRESS IS RESOLVED THROUGH THE ONE MECHANISM ([[DOC-44]], [[REQ-191]]):
  // `user_emails`, keyed `(tenant_id, email)`, matched on ANY of a person's
  // addresses. A second lookup written here would be a second answer to "who is
  // this", free to disagree with the one the front door uses.
  //
  // AND IT IS THE ENVELOPE SENDER, NOT THE `From:` HEADER. The header is a
  // string the sender typed; the envelope is what SMTP actually carried. Neither
  // is authenticated — which is what `alignment` is for — but only one of them
  // is a fact about the delivery.
  const contactId = await contactByAddress(env, scope, envelopeFrom)

  const stored = await storeAttachments(env, scope, mailId, parsed.attachments, synthetic)

  const { ticket } = await store.create({
    type: INBOUND_EMAIL_TYPE,
    title: subject.trim() === '' ? '(no subject)' : subject.trim(),
    fields: {
      ...base,
      header_from: decodeWords(headerValue(parsed.headers, 'from')),
      header_to: decodeWords(headerValue(parsed.headers, 'to')),
      subject,
      sent_at: headerValue(parsed.headers, 'date'),
      message_id: headerValue(parsed.headers, 'message-id'),
      in_reply_to: headerValue(parsed.headers, 'in-reply-to'),
      references: headerValue(parsed.headers, 'references'),
      alignment: alignment.verdict,
      auth_results: alignment.evidence,
      status: CAPTURED,
      ...(contactId ? { contact_id: contactId } : {}),
      ...(stored.length > 0 ? { attachments: stored.map((one) => JSON.stringify(one)) } : {}),
    },
    // THE BODY IS THE MESSAGE, PLAIN TEXT FIRST. HTML is kept when there is no
    // plain part, as received and never sanitised — it is evidence, and the
    // surface that shows it renders it inert ([[REQ-267]] §9).
    body: parsed.text !== '' ? parsed.text : parsed.html,
  })

  // NO CONTACT MEANS NO EVENT, AND NO CONTACT ROW EITHER ([[REQ-267]] §6). A
  // stranger's message is recorded and waits in the pending queue; inventing a
  // contact for every one of them would fill the list with spam and would break
  // the property [[DOC-54]] rests on.
  if (contactId) {
    await recordEvent(env, scope, {
      contactId,
      kind: EMAIL_RECEIVED,
      ref: ticket.uid,
      // THE EVENT IS THE ENVELOPE AND THE TICKET IS THE BODY ([[EPIC-13]] §OQ2).
      // The spine keeps [[EPIC-11]]'s promise that it is milestones and not
      // noise: enough to read the history without the history holding the mail.
      detail: {
        subject,
        from: addressIn(decodeWords(headerValue(parsed.headers, 'from'))) || envelopeFrom,
        alignment: alignment.verdict,
        size: message.rawSize,
        attachments: stored.length,
        message_uid: ticket.uid,
        ...(headerValue(parsed.headers, 'message-id') === ''
          ? {}
          : { message_id: headerValue(parsed.headers, 'message-id') }),
      },
      // THE MARK IS PASSED AND IS STILL DERIVED. `recordEvent` takes it as a
      // FLOOR over the contact's own — a synthetic message to a real contact is
      // a synthetic event, and a real message to a synthetic contact is one too.
      ...(synthetic ? { synthetic: true, runId: marker.runId } : {}),
    })
  }

  return { outcome: 'captured', messageUid: ticket.uid, contactId }
}

/**
 * Forward the message on, which is the business's own mail working.
 *
 * THE RESERVED NAMESPACE NEVER FORWARDS ([[REQ-267]] §7), and the test is
 * `reserved` rather than "has a live run": an address that LOOKS like ours must
 * not reach a customer's inbox whether or not its run id resolves. The two
 * halves of the marker fail in opposite directions on purpose.
 *
 * A FAILURE IS REPORTED AND NEVER THROWN. The record is already written by the
 * time this runs, and an exception here would lose the outcome of the half that
 * succeeded.
 */
async function forward(
  message: InboundMessage,
  marker: Marker,
  destination: string | null,
): Promise<ForwardOutcome> {
  if (marker.reserved) return 'reserved'
  if (!destination) return 'no_destination'
  try {
    await message.forward(destination)
    return 'forwarded'
  } catch {
    return 'failed'
  }
}

/** A business's inbound configuration, as the pipeline needs it. */
interface InboundDomain {
  businessId: string
  forwardTo: string | null
}

/**
 * Which business a recipient domain belongs to.
 *
 * `sending_domains` IS THE TABLE AND IS NOT REINVENTED ([[REQ-259]], `0012`). It
 * already holds `(domain, business_id)` with a unique index on the domain, so a
 * recipient domain resolves to exactly one business by lookup — and a second
 * table for inbound would be a second answer to "whose domain is this".
 */
async function businessOfDomain(
  env: InboundEnv,
  domain: string,
): Promise<InboundDomain | null> {
  if (domain === '') return null
  const row = await env.DB.prepare(
    'SELECT business_id, forward_to FROM sending_domains WHERE domain = ?',
  )
    .bind(domain)
    .first<{ business_id: string; forward_to: string | null }>()
  return row ? { businessId: row.business_id, forwardTo: row.forward_to } : null
}

/** The contact one address reaches inside this business, or null. */
async function contactByAddress(
  env: InboundEnv,
  scope: Scope,
  address: string,
): Promise<string | null> {
  if (address === '') return null
  const row = await env.DB.prepare(
    'SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?',
  )
    .bind(scope.businessId, address)
    .first<{ user_id: string }>()
  return row?.user_id ?? null
}

/** One stored attachment, as the ticket records it. */
export interface StoredAttachment {
  key: string
  name: string
  type: string
  size: number
}

/**
 * Write the attachment bytes, and say where they went.
 *
 * DIRECT TO R2 RATHER THAN THROUGH THE TICKET STORE'S `attach`. The store's blob
 * keys are content-addressed under `t/<tenant>/blob/<sha>` — the right shape for
 * material a client uploaded, and the wrong one here for one reason:
 * [[DOC-54]] §2.5 requires a SYNTHETIC blob to be findable by a prefix listing,
 * because a bucket has no `WHERE` clause and the reaper's sweep is a listing.
 * A content address cannot carry that, and mixing test bytes into the store's
 * content-addressed space would make a probe's attachment dedup against a real
 * one.
 *
 * A FAILED WRITE IS REPORTED AS AN ABSENT ATTACHMENT AND NEVER AS A LOST
 * MESSAGE. Nothing serves these bytes ([[REQ-267]] §5), so what a failure costs
 * is a file nobody can yet reach; losing the message over it would be trading
 * the valuable half for the deferred one.
 */
async function storeAttachments(
  env: InboundEnv,
  scope: Scope,
  mailId: string,
  attachments: readonly MimeAttachment[],
  synthetic: boolean,
): Promise<StoredAttachment[]> {
  if (attachments.length === 0 || !env.BLOBS) return []
  const prefix = synthetic ? SYNTHETIC_BLOB_PREFIX : ''
  const stored: StoredAttachment[] = []
  for (let i = 0; i < attachments.length; i += 1) {
    const one = attachments[i]
    // THE KEY IS OURS AND CARRIES NOTHING THE SENDER CHOSE. A filename is a
    // string a stranger typed; it goes in the metadata, where it is displayed,
    // and never into a key where `../` would mean something.
    const key = `${prefix}${INBOUND_BLOB_PREFIX}${scope.businessId}/${mailId}/${i}`
    try {
      await env.BLOBS.put(key, one.bytes)
      stored.push({ key, name: one.filename, type: one.contentType, size: one.bytes.length })
    } catch {
      // Reported by absence — see above.
    }
  }
  return stored
}

/** Every byte of the message. */
async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      total += value.length
    }
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}

/** The alignment verdict, and the header it was read out of. */
export interface AlignmentVerdict {
  verdict: Alignment
  evidence: string
}

/**
 * What the platform said about this sender ([[REQ-267]] §4).
 *
 * READ OFF `Authentication-Results`, WHICH IS WHERE IT ARRIVES. Nothing in the
 * Email Worker type surfaces an SPF or DMARC verdict as a property; the evidence
 * is a header the receiving edge stamped on the message, and the spelling of
 * that header is an RFC 8601 convention rather than a Cloudflare invention —
 * which is what makes reading it a parse rather than a guess.
 *
 * THE TOP-LEVEL `Headers` FIRST, AND THE PARSED BLOCK AS A FALLBACK. The
 * platform hands the handler its own `Headers`; the parsed block is what a suite
 * composing a message can set, and a message carrying several
 * `Authentication-Results` lines — one per hop — is ordinary.
 *
 * ABSENT IS `unknown` AND NOT `fail`. A message with no verdict has not failed
 * anything; treating it as a failure would label every message on a delivery
 * path that does not stamp the header as suspicious, which trains the reader to
 * ignore the label exactly where it matters.
 */
export function alignmentOf(
  headers: Headers,
  parsed?: Map<string, string[]>,
): AlignmentVerdict {
  const evidence = authResultsOf(headers) || (parsed ? parsedAuthResults(parsed) : '')
  if (evidence === '') return { verdict: 'unknown', evidence: '' }
  const match = /\bdmarc\s*=\s*([a-z]+)/i.exec(evidence)
  if (!match) return { verdict: 'unknown', evidence }
  const said = match[1].toLowerCase()
  const verdict: Alignment =
    said === 'pass' ? 'pass' : said === 'none' ? 'none' : said === 'fail' ? 'fail' : 'unknown'
  return { verdict, evidence }
}

function authResultsOf(headers: Headers): string {
  return (headers.get('authentication-results') ?? '').trim()
}

function parsedAuthResults(headers: Map<string, string[]>): string {
  const lines = headers.get('authentication-results') ?? []
  return lines.join(' ').trim()
}

/** One received message, as a reader wants it. */
export interface InboundRecord {
  uid: string
  mailId: string
  envelopeFrom: string
  envelopeTo: string
  headerFrom: string
  subject: string
  receivedAt: string
  sentAt: string
  alignment: Alignment
  status: typeof CAPTURED | typeof REFUSED
  refusal: string
  contactId: string | null
  size: number
  attachments: StoredAttachment[]
  synthetic: boolean
  /** The message, as text. Never markup — see [[REQ-267]] §9. */
  body: string
}

const str = (fields: Record<string, unknown>, name: string): string => {
  const value = fields[name]
  return typeof value === 'string' ? value : ''
}

/** A stored ticket as the rest of the product reads it. */
export function toInboundRecord(ticket: Ticket): InboundRecord {
  const f = (ticket.fields ?? {}) as Record<string, unknown>
  const attachments: StoredAttachment[] = []
  const list = f.attachments
  if (Array.isArray(list)) {
    for (const entry of list) {
      try {
        const one: unknown = JSON.parse(String(entry))
        if (one && typeof one === 'object') attachments.push(one as StoredAttachment)
      } catch {
        // A metadata entry we cannot read is one attachment nobody can name; the
        // message it belongs to still renders, which is the fact that matters.
      }
    }
  }
  const status = str(f, 'status') === REFUSED ? REFUSED : CAPTURED
  const alignment = ALIGNMENTS.find((one) => one === str(f, 'alignment')) ?? 'unknown'
  return {
    uid: ticket.uid,
    mailId: str(f, 'mail_id'),
    envelopeFrom: str(f, 'envelope_from'),
    envelopeTo: str(f, 'envelope_to'),
    headerFrom: str(f, 'header_from'),
    subject: str(f, 'subject'),
    receivedAt: str(f, 'received_at') || ticket.created_at,
    sentAt: str(f, 'sent_at'),
    alignment,
    status,
    refusal: str(f, 'refusal'),
    contactId: str(f, 'contact_id') || null,
    size: typeof f.size === 'number' ? f.size : 0,
    attachments,
    synthetic: f.synthetic === true,
    body: ticket.body ?? '',
  }
}

/**
 * One contact's received mail, newest first.
 *
 * THE COUNTERPART OF `messagesFor`, and deliberately a separate read rather than
 * a widened one: the two types have different fields and different questions,
 * and the surface that shows them interleaves them by time, which it can do with
 * two lists and cannot undo if they arrive pre-merged.
 *
 * SCOPED BY THE STORE HANDLE. `forTenant` is terminal, so this read cannot reach
 * another business's mail even given a contact id from one.
 */
export async function inboundFor(
  store: TicketStore,
  contactId: string,
  opts: { includeSynthetic?: boolean } = {},
): Promise<InboundRecord[]> {
  if (contactId === '') return []
  const { tickets } = await store.query({
    predicate: `type="${INBOUND_EMAIL_TYPE}" AND fields.contact_id="${contactId}"`,
    limit: 'all',
  })
  return tickets
    .map(toInboundRecord)
    .filter((record) => opts.includeSynthetic || !record.synthetic)
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : a.receivedAt > b.receivedAt ? -1 : 0))
}

/**
 * The pending queue: received mail from an address that matched nobody, and that
 * this business has not already discarded ([[REQ-267]] §6).
 *
 * A READ AND NOT A TABLE. Pending is a state of the message — no resolved
 * contact — so the queue is a query over the messages themselves. A second table
 * would be a second representation of a person this ticket is specifically not
 * creating.
 *
 * SYNTHETIC MESSAGES NEVER APPEAR, whatever their sender resolved to. The
 * reserved namespace must not put a triage decision in front of a human, which
 * is the same rule that keeps it out of every other customer-visible read.
 */
export async function pendingInbound(
  env: InboundEnv,
  store: TicketStore,
  scope: Scope,
): Promise<InboundRecord[]> {
  const { tickets } = await store.query({
    predicate: `type="${INBOUND_EMAIL_TYPE}"`,
    limit: 'all',
  })
  const suppressed = await suppressedAddresses(env, scope)
  return tickets
    .map(toInboundRecord)
    .filter(
      (record) =>
        record.contactId === null &&
        !record.synthetic &&
        !suppressed.has(record.envelopeFrom),
    )
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : a.receivedAt > b.receivedAt ? -1 : 0))
}

/** Refused because the message names nobody this business can act on. */
export class UnknownMessageError extends Error {
  readonly name = 'UnknownMessageError'
  constructor() {
    super('No such message in this business.')
  }
}

/** What promoting one pending message produced. */
export interface PromotionOutcome {
  contactId: string
  created: boolean
  /** Every message from that address that followed the person, this one included. */
  attached: string[]
}

/**
 * Promote a pending sender to a contact, and give them their mail.
 *
 * `addContact` IS THE ONE PATH ([[DOC-44]], [[REQ-199]]) and this does not mint a
 * contact by a second route. What it adds is the attachment: the message is
 * already stored, so promotion is a contact plus a pointer, never a re-capture.
 *
 * EVERY MESSAGE FROM THAT ADDRESS FOLLOWS, not only the one pressed. An operator
 * promoting somebody who has written three times means *this person is a
 * contact* — a queue that then kept the other two would be asking them the same
 * question twice more about a decision they have already made.
 *
 * AND THE TIMELINE GETS THE EVENTS IT NEVER HAD. The messages were recorded
 * without a contact, so no `email.received` row was written for them; they are
 * written now, stamped `occurredAt` from when the mail actually arrived, which
 * is the split `contact_events` keeps `occurred_at` and `recorded_at` apart for.
 */
export async function promotePending(
  env: InboundEnv,
  store: TicketStore,
  scope: Scope,
  messageUid: string,
): Promise<PromotionOutcome> {
  const { tickets } = await store.query({
    predicate: `type="${INBOUND_EMAIL_TYPE}"`,
    limit: 'all',
  })
  const found = tickets.map(toInboundRecord).find((one) => one.uid === messageUid)
  if (!found || found.synthetic) throw new UnknownMessageError()

  const added = await addContact(env, scope, { email: found.envelopeFrom })
  const contactId = added.person.id

  const attached: string[] = []
  for (const record of tickets.map(toInboundRecord)) {
    if (record.synthetic) continue
    if (record.envelopeFrom !== found.envelopeFrom) continue
    if (record.contactId !== null) continue
    await store.update({ uid: record.uid, patch: { fields: { contact_id: contactId } } })
    await recordEvent(env, scope, {
      contactId,
      kind: EMAIL_RECEIVED,
      occurredAt: record.receivedAt,
      ref: record.uid,
      detail: {
        subject: record.subject,
        from: record.envelopeFrom,
        alignment: record.alignment,
        size: record.size,
        attachments: record.attachments.length,
        message_uid: record.uid,
        via: 'promote',
      },
    })
    attached.push(record.uid)
  }
  return { contactId, created: added.created, attached }
}

/**
 * Stop asking about this sender ([[REQ-267]] §6).
 *
 * STICKY, PER BUSINESS AND PER ADDRESS. A decision that does not persist
 * re-surfaces the same sender every day and trains the client to ignore the
 * queue — after which the one message in a hundred that mattered is missed by a
 * habit we taught them.
 *
 * IT SUPPRESSES THE QUEUE AND NOTHING ELSE. Later mail from that address is
 * still recorded and still forwarded: a triage decision may not break the
 * business's mail, and the record is evidence that must not depend on whether
 * somebody found the sender interesting.
 *
 * IDEMPOTENT. Discarding twice is one row, because the schema says so — the
 * partial unique index over live rows is what makes the second press a no-op
 * rather than a second answer.
 */
export async function discardSender(
  env: InboundEnv,
  scope: Scope,
  address: string,
): Promise<void> {
  const normalised = normaliseEmail(address)
  if (normalised === '') return
  await env.DB.prepare(
    'INSERT INTO inbound_suppressions (id, business_id, address, created_at) ' +
      'VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
  )
    .bind(newId('sup'), scope.businessId, normalised, new Date().toISOString())
    .run()
}

/**
 * Undo a discard — a control, and not an erasure ([[REQ-267]] §6).
 *
 * THE MESSAGES IT HID WERE NEVER DELETED, so this brings them back rather than
 * reconstructing them. The row stays as the record of a decision that was taken
 * and is stamped revoked, which is the shape `memberships` and `asset_grants`
 * already use.
 */
export async function restoreSender(
  env: InboundEnv,
  scope: Scope,
  address: string,
): Promise<void> {
  await env.DB.prepare(
    'UPDATE inbound_suppressions SET revoked_at = ? ' +
      'WHERE business_id = ? AND address = ? AND revoked_at IS NULL',
  )
    .bind(new Date().toISOString(), scope.businessId, normaliseEmail(address))
    .run()
}

/** The addresses this business has discarded and not restored. */
export async function suppressedAddresses(
  env: InboundEnv,
  scope: Scope,
): Promise<Set<string>> {
  const { results } = await env.DB.prepare(
    'SELECT address FROM inbound_suppressions WHERE business_id = ? AND revoked_at IS NULL',
  )
    .bind(scope.businessId)
    .all<{ address: string }>()
  return new Set((results ?? []).map((row) => row.address))
}
