/**
 * A failure as the client reads it: one plain line, with the server's own text
 * behind a Details toggle ([[BUG-230]]).
 *
 * WHY THE SPLIT. What the server says when something goes wrong is written for us
 * — it can name a site id, an error code, a hostname — and a client who reads
 * `site_c78b…` in a yellow strip learns nothing except that the product is not
 * talking to them. So the line they read is ours and says what to do; the
 * server's sentence is kept, one click away, because it is what a support request
 * needs pasted into it.
 *
 * `<details>` AND NOT A CLICK HANDLER, for `people.js`'s reason: disclosure is
 * what the element is for, and it comes keyboard- and screen-reader-ready.
 *
 * REFUSALS THE CLIENT CAN ACT ON DO NOT COME HERE. They carry a `code`, and the
 * caller gives them their own words and action (today: the no-address dialog).
 */

/** The toggle's words. */
export const FAILURE_DETAILS_LABEL = 'Details'

/**
 * The nodes of a failure: `line`, and, when there is one, `detail` behind the
 * toggle. Nodes rather than a filled element, so a banner can put them beside its
 * own controls (`banner.js`'s dismiss) and a plain line can `replaceChildren`
 * with them.
 *
 * @param {string} line what the client reads
 * @param {string} [detail] what the server said
 * @returns {Node[]}
 */
export function failureContent(line, detail) {
  const text = document.createElement('span')
  text.className = 'builder-failure__line'
  text.textContent = line
  if (!detail) return [text]
  const details = document.createElement('details')
  details.className = 'builder-failure__details'
  const summary = document.createElement('summary')
  summary.textContent = FAILURE_DETAILS_LABEL
  const said = document.createElement('pre')
  said.textContent = detail
  details.append(summary, said)
  return [text, details]
}
