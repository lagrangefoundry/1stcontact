/**
 * The kinds of thing that happen to a contact, and what each is called on screen
 * ([[REQ-195]], [[DOC-44]] §4.1).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, on `people-axes.js`'s precedent: the one
 * definition has to be reachable from both sides of the seam — the browser panel
 * that draws a history, and a workerd test reading `contact_events` rows back. A
 * string literal written at either end is a second answer to what
 * `contact.invited` is spelt like, free to drift by one character in silence.
 *
 * `kind` IS A DOTTED STRING AND NOT AN ENUM, and this file is the reason that
 * costs nothing. [[DOC-44]] §4 says the set grows — `list.joined`,
 * `consultation.booked`, whatever a later capability records — so the schema
 * carries no CHECK and {@link eventLabel} answers for a kind it has never seen.
 * A label table that had to be complete would be a table somebody has to migrate
 * before they can record anything new, which is the constraint that gets worked
 * around rather than extended.
 *
 * THE NAMESPACE IS THE SUBJECT AND THE TAIL IS THE VERB, in the past tense:
 * `contact.created`, `email.bounced`. It reads as a fact that has already
 * happened, which is what an event is — `email.send` would read as an
 * instruction and would invite somebody to write a row before the thing had
 * occurred.
 */

/* ── The contact itself ──────────────────────────────────────────────────── */

/** They entered this business's world. The provenance event, for a contact we made. */
export const CONTACT_CREATED = 'contact.created'
/** We asked them in — the pipeline transition, once per press ([[REQ-188]]). */
export const CONTACT_INVITED = 'contact.invited'
/** They signed up: accepted the terms, which is the access axis and is their own act. */
export const MEMBER_SIGNED_UP = 'member.signed_up'

/* ── Public forms ([[REQ-223]]) ──────────────────────────────────────────── */

/**
 * They filled in a form on a published site.
 *
 * THIS IS THE PROVENANCE ROW FOR A CAPTURED VISITOR, and it is written on EVERY
 * submission — including the second one from an address already here, which
 * writes no `contact.created` because nothing about the person changed. What
 * changed is that they asked again, and that is a fact about the relationship
 * rather than about the row.
 *
 * ITS `detail` CARRIES WHAT THE COLUMNS CANNOT ([[REQ-223]] §4): which site and
 * page the submission came from, which form instance, what its submit button
 * said, the other fields the visitor filled in, and the consent wording they
 * were shown. That is unreconstructable later, and for an IE tenant it is what
 * evidences consent.
 */
export const FORM_SUBMITTED = 'form.submitted'

/**
 * We sent them the asset a form promised.
 *
 * IT IS THE AT-MOST-ONCE LEDGER AS WELL AS A TIMELINE ENTRY ([[REQ-223]] §5).
 * A second request for the same asset by the same address is acknowledged
 * identically and sends nothing, and the question *has this address had this
 * asset* is answered from these rows — which is why the asset's key is in the
 * detail rather than only in the message record.
 */
export const ASSET_SENT = 'asset.sent'

/* ── Mail ────────────────────────────────────────────────────────────────── */

/**
 * The delivery facts, which are EVENTS because the outcome moves and an event
 * does not ([[REQ-198]]). The message is a record with mutable state; these are
 * the transitions it went through, and each is a row rather than a rewrite —
 * otherwise the timeline loses the bounce the moment a retry succeeds.
 */
export const EMAIL_SENT = 'email.sent'
export const EMAIL_DELIVERED = 'email.delivered'
export const EMAIL_BOUNCED = 'email.bounced'
/** Inbound, symmetrically, so a conversation is one sequence and not two lists. */
export const EMAIL_RECEIVED = 'email.received'

const LABELS = {
  [CONTACT_CREATED]: 'Added as a contact',
  [CONTACT_INVITED]: 'Invited',
  [MEMBER_SIGNED_UP]: 'Signed up',
  [FORM_SUBMITTED]: 'Submitted a form',
  [ASSET_SENT]: 'Sent a download',
  [EMAIL_SENT]: 'Email sent',
  [EMAIL_DELIVERED]: 'Email delivered',
  [EMAIL_BOUNCED]: 'Email bounced',
  [EMAIL_RECEIVED]: 'Email received',
}

/**
 * What a kind is called on screen.
 *
 * AN UNKNOWN KIND STILL RENDERS, and renders as the dotted string itself rather
 * than as a blank or a dash. A row drawn empty is indistinguishable from a
 * timeline that failed to load; the raw kind is ugly and is the truth, and it
 * says which capability wrote it — which is exactly what somebody looking at an
 * unrecognised event needs to know.
 */
export function eventLabel(kind) {
  return LABELS[kind] ?? String(kind ?? '')
}

/**
 * Is this kind one we have a name for?
 *
 * NOT A VALIDATOR. Nothing refuses a kind on this answer — the set grows and a
 * gate here would be the enum the schema deliberately does not have. It exists
 * so a surface can decide whether to present a kind as a phrase or as a raw
 * value, which is a presentation question and not a correctness one.
 */
export function isKnownKind(kind) {
  return Object.hasOwn(LABELS, kind)
}
