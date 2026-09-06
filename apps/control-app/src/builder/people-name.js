/**
 * A person's name — the parts, the resolution rules, and the two ways one gets
 * replaced ([[REQ-193]], [[CHAT-38]]).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, exactly as `people-axes.js` is and for
 * the same reason: the rules below are model facts, and they are read from both
 * sides of the seam — the browser panel that draws the record pane, and the
 * `names.ts` resolver that writes the rows in workerd. Two definitions would be
 * two answers free to disagree about what a greeting is or what the parts are
 * called.
 *
 * THE DISPLAYED NAME IS STORED AND NEVER ASSEMBLED. There is no function here
 * that builds a name out of parts, and there must not be one: mononyms
 * (Prince, Sukarno), family-name-first cultures, Spanish double surnames and
 * patronymics all render correctly from a stored string and all render wrongly
 * from any concatenation rule anybody has ever written. The parts exist for
 * salutation and sorting, not for display.
 *
 * EVERY PART BUT THE DISPLAYED NAME IS OPTIONAL, and that is load-bearing rather
 * than lenient. A required family name makes a mononym unrepresentable, and a
 * self-declaring contact who answers *just my name* has given a complete answer.
 */

/**
 * The parts, declared once, in the order a record pane asks for them.
 *
 * DECLARED RATHER THAN WRITTEN OUT AT EACH SURFACE. The record pane's fields,
 * the name-change dialog's inputs, the wire keys the transport forwards and the
 * patch the route assembles are four lists of the same seven things; a part
 * added to the model has to appear in all four or it is a box that saves
 * nothing. Here it is one line.
 *
 * `displayName` IS FIRST AND IS THE ONLY REQUIRED ONE — see the module note.
 */
export const NAME_PARTS = [
  { name: 'displayName', label: 'Name', column: 'display_name' },
  { name: 'knownAs', label: 'Known as', column: 'known_as' },
  { name: 'title', label: 'Title', column: 'title' },
  { name: 'givenName', label: 'Given name', column: 'given_name' },
  { name: 'middleNames', label: 'Middle names', column: 'middle_names' },
  { name: 'familyName', label: 'Family name', column: 'family_name' },
  { name: 'suffix', label: 'Suffix', column: 'suffix' },
]

/** Just the keys, for a caller sifting a patch. */
export const NAME_PART_NAMES = NAME_PARTS.map((part) => part.name)

/* ── Why a name was replaced ─────────────────────────────────────────────── */

/**
 * The old value was never right — a typo, an autocorrect, `Marting`.
 *
 * THE DEFAULT, AND THE SAFE ONE. Corrections are common and accidental; name
 * changes are rare and deliberate. A corrected name is kept for audit and is
 * never searched and never displayed, so the common case and the safe case are
 * the same case.
 */
export const CORRECTED = 'corrected'

/**
 * A genuine former name. Searchable, and displayable as *formerly*.
 *
 * AN EXPLICIT ACT, NEVER AN INFERENCE. Getting this wrong in the safe direction
 * leaves a stale typo out of a search result; getting it wrong the other way
 * surfaces a deadname, or greets a customer by a name they deliberately left
 * behind. That is not a small failure, and it is why nothing derives this value.
 */
export const CHANGED = 'changed'

/** A supersession recorded with no reason, or an unknown one, is a correction. */
export function supersessionReason(value) {
  return value === CHANGED ? CHANGED : CORRECTED
}

/* ── Reading a name ──────────────────────────────────────────────────────── */

/** Empty, blank and absent are one state: no value. */
function text(value) {
  const said = typeof value === 'string' ? value.trim() : ''
  return said === '' ? null : said
}

/**
 * What the name column says for somebody who has none yet ([[REQ-189]]).
 *
 * A SENTENCE AND NOT A DASH, because it is a fact about the person rather than
 * a fault in the cell, and a blank or a glyph reads as the second.
 */
export const NO_NAME_YET = 'No name yet'

/**
 * The displayed name of a name record, or null.
 *
 * A REDACTED ROW READS AS NO NAME. Erasure clears the text and keeps the row
 * ([[DOC-37]]), so the current name of an erased person is a row whose
 * `display_name` is empty — and every reader has to answer "no name" for it, not
 * draw an empty cell.
 */
export function displayNameFrom(name) {
  return name ? text(name.displayName) : null
}

/** The displayed name of a person as the API reports them, or null. */
export function displayNameOf(person) {
  return person ? displayNameFrom(person.name) : null
}

/**
 * What to put in the greeting — the highest-frequency read in the record.
 *
 * FOR A PRODUCT WHOSE JOB IS CONTACTING PEOPLE, *what do I put in the greeting*
 * is asked more often than anything else here, and it derives from the parts
 * badly: Robert gets "Hi Robert," when everyone alive calls him Bob. So
 * `known_as` is stored, and this is the fallback chain when it is not —
 * `given_name`, then the displayed name.
 *
 * IT ALSO ABSORBS THE PREFERRED-NAME CASE, which is why there is no separate
 * legal-versus-preferred distinction anywhere in this model.
 *
 * NO TITLE EVER APPEARS HERE. A greeting that reaches for `title` is a greeting
 * that will one day be `Hi Mr,` — and the whole reason a title is never required
 * is that a greeting must not need one.
 */
export function greetingFrom(name) {
  if (!name) return null
  return text(name.knownAs) ?? text(name.givenName) ?? text(name.displayName)
}

/** The greeting for a person as the API reports them, or null. */
export function greetingOf(person) {
  return person ? greetingFrom(person.name) : null
}

/**
 * The former names it is safe to show, said the way an operator reads them.
 *
 * ONLY WHAT THE SERVER SENT. `corrected` supersessions never leave `names.ts`,
 * so a client cannot surface one by accident — this formats what arrived and
 * makes no decision about which names those are.
 */
export function formerlyLabel(formerNames) {
  const names = (formerNames ?? []).map(text).filter(Boolean)
  return names.length === 0 ? null : `formerly ${names.join(', ')}`
}
