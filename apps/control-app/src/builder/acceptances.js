/**
 * What a contact can have agreed to, asked for, or been shown — the registry
 * ([[REQ-240]], [[DOC-44]]).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, on `contact-events.js`'s and
 * `people-axes.js`'s precedent: the one definition has to be reachable from both
 * sides of the seam — the browser panel that draws a contact's agreements, and a
 * workerd test writing `user_acceptances` rows through the shipped function. A
 * key spelt at either end is a second answer to what `newsletter` is called,
 * free to drift by one character in silence.
 *
 * THREE TYPES, BECAUSE THEY BEHAVE DIFFERENTLY, and the type is what every
 * caller branches on rather than the key:
 *
 *   {@link DOCUMENT}    acceptance of a written document. Versioned by WHICH
 *                       document — a ticket — so bumping the copy leaves every
 *                       prior acceptance outstanding without a row being
 *                       rewritten. Not revocable by the contact.
 *   {@link PREFERENCE}  revocable, at will, by the contact. Both directions are
 *                       facts and both are recorded, because an untouched box
 *                       today is not the same fact as a withdrawal last week.
 *   {@link REQUEST}     no state at all: "they asked for the papers" is a
 *                       statement about something that happened, and there is
 *                       nothing to revoke. An event and nothing else.
 *
 * THE KEY SET IS CLOSED AND THE TYPE TABLE IS ITS ONLY DEFINITION. Unlike an
 * event `kind` — which is deliberately unconstrained because the set of things
 * that can happen to a contact grows without a migration — an acceptance key
 * decides how the write behaves, so a key nobody declared is a write nobody
 * designed. Per-business custom keys slot into this same table later; they do
 * not arrive by being spelt at a call site.
 *
 * `beta_requested` AND NOT `beta_inclusion`. They asked to be in the beta;
 * whether they ARE in it is the business's decision and lives in entitlements. A
 * label reading "Beta: on" would be read as "I am in the beta", which may be
 * false — so the label says what the fact is.
 */

/* ── The three types ─────────────────────────────────────────────────────── */

/** Acceptance of a written document. Versioned, and not revocable by them. */
export const DOCUMENT = 'document'
/** A standing choice they may change at will, in both directions. */
export const PREFERENCE = 'preference'
/** A thing they asked for once. No state, because there is nothing to revoke. */
export const REQUEST = 'request'

/* ── The system-defined keys ─────────────────────────────────────────────── */

/** The terms of service of the business they are a contact of. */
export const T_AND_C_ACCEPTED = 't_and_c_accepted'
/** That business's privacy policy. */
export const PRIVACY_POLICY_ACCEPTED = 'privacy_policy_accepted'
/** They want the mailing list. Revocable — this is the one an unsubscribe flips. */
export const NEWSLETTER = 'newsletter'
/** They asked to be let into the beta. NOT whether they are in it. */
export const BETA_REQUESTED = 'beta_requested'
/** They asked for the papers. A request, so it has no state. */
export const WHITEPAPERS = 'whitepapers'

/**
 * The registry itself: type and on-screen name, per key.
 *
 * THE LABEL IS NOT THE WORDING. What a contact was SHOWN is recorded on the
 * event, because it is a fact about the page they were on that day — a form's
 * checkbox label, a form's config, or the document ticket. This is what an
 * operator's screen calls the key when it lists what somebody has agreed to,
 * which is a different question and has a different answer.
 */
const REGISTRY = {
  [T_AND_C_ACCEPTED]: { type: DOCUMENT, label: 'Terms and conditions' },
  [PRIVACY_POLICY_ACCEPTED]: { type: DOCUMENT, label: 'Privacy policy' },
  [NEWSLETTER]: { type: PREFERENCE, label: 'Newsletter' },
  [BETA_REQUESTED]: { type: PREFERENCE, label: 'Asked to join the beta' },
  [WHITEPAPERS]: { type: REQUEST, label: 'Asked for the papers' },
}

/** Every key this platform defines, in the order a panel offers them. */
export const ACCEPTANCE_KEYS = Object.keys(REGISTRY)

/** Is this a key anybody declared? Unknown keys are refused at the write. */
export function isAcceptanceKey(key) {
  return Object.hasOwn(REGISTRY, key)
}

/** Which of the three this key is, or null for a key nobody declared. */
export function acceptanceType(key) {
  return Object.hasOwn(REGISTRY, key) ? REGISTRY[key].type : null
}

/** What this key is called on an operator's screen. */
export function acceptanceLabel(key) {
  return Object.hasOwn(REGISTRY, key) ? REGISTRY[key].label : String(key ?? '')
}

/**
 * Does this key carry a state row?
 *
 * FALSE IS THE WHOLE OF WHAT A {@link REQUEST} IS. A request has no current
 * value to read and nothing to withdraw, so giving it a row would be inventing a
 * state the rest of the system then has to have an opinion about — and the row
 * would say "true" forever, which is not a fact anybody asked for.
 */
export function holdsState(key) {
  const type = acceptanceType(key)
  return type === DOCUMENT || type === PREFERENCE
}

/**
 * May the CONTACT take this back?
 *
 * ONLY A {@link PREFERENCE}. A document acceptance is a thing that happened —
 * un-agreeing to terms you have already acted under is not a state this system
 * can represent honestly, and the account simply stops being entered. A request
 * has nothing to take back.
 */
export function isRevocable(key) {
  return acceptanceType(key) === PREFERENCE
}

/**
 * Is this key versioned by a document ticket?
 *
 * The same question as {@link DOCUMENT}, spelt as the thing callers actually ask
 * — "do I have to name which document this acceptance was of".
 */
export function needsDocument(key) {
  return acceptanceType(key) === DOCUMENT
}
