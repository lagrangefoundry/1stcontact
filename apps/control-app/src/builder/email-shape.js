/**
 * What counts as an email address, defined once ([[BUG-54]]).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, for the same reason `people-state.js`
 * is one: the rule has to be reachable from both sides of the seam — the
 * browser panel that refuses a typo while the operator is still looking at the
 * box, and `people.ts`, which is the authority and refuses it again for
 * anybody who reaches the route another way. Two regexes in two files would be
 * two answers free to drift, and the way they drift is the worst one: the
 * client accepts an address the server then rejects with a 400 the operator
 * cannot act on, or the client refuses one the system would have been happy
 * with.
 *
 * DELIBERATELY NOT RFC 5322. The full grammar admits quoted local parts,
 * bracketed literals and comments, and an address that passes it is still not
 * necessarily deliverable — so a permissive parser buys nothing here and costs
 * the one thing this check is for. What is actually being caught is a typed
 * mistake: a missing `@`, a pasted pair of addresses, a domain with no dot.
 * The operator's own specification is the rule, verbatim: one `@`, and after
 * it at least one `.` separator.
 *
 * IT IS A SHAPE CHECK AND NOT A DELIVERABILITY CHECK, and nothing in this
 * system should read it as one. There is no sender in this repository
 * ([[REQ-186]]), so nothing here can tell whether an address exists.
 */

/** The sentence a refusal says, so the panel and the route say the same one. */
export const EMAIL_SHAPE_ERROR = 'must be an address like name@example.com'

/**
 * Does this look like an address the operator meant to type?
 *
 * TRIMMED BUT NOT OTHERWISE REPAIRED. Surrounding whitespace is a paste
 * artifact and is dropped; whitespace *inside* is a sign the box holds
 * something other than one address, and is refused rather than stripped.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isEmailShape(value) {
  if (typeof value !== 'string') return false
  const address = value.trim()
  if (address === '' || /\s/.test(address)) return false
  // EXACTLY ONE `@`, which is what `split(...).length !== 2` says: zero is a
  // missing separator and two is usually two addresses pasted together.
  const parts = address.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (local === '') return false
  // AT LEAST ONE `.` SEPARATING TWO NON-EMPTY LABELS. `every` is what refuses
  // the leading, trailing and doubled dot in one clause: `.c`, `b.` and `b..c`
  // all produce an empty label, and none of them is a domain.
  const labels = domain.split('.')
  return labels.length >= 2 && labels.every((label) => label !== '')
}
