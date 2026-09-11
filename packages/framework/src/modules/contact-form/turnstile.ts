/**
 * The Turnstile widget, stamped into a published page at serve time
 * ([[REQ-223]] §6).
 *
 * WHY THE SITEKEY IS NOT IN THE SNAPSHOT. It is DEPLOYMENT configuration — one
 * widget per deployment, rotated when a key is rotated — and a published
 * revision is an immutable record of what a site said ([[DOC-12]] §7). Baking a
 * credential-shaped value into every revision means a key rotation is a
 * republish of every site that has ever carried a form, and the pages that are
 * not republished keep pointing at a key that no longer verifies. So the module
 * renders the MOUNT and the serving Worker supplies the key, which is exactly
 * the division `account-chrome`'s session rewrite already keeps: the snapshot
 * carries the shape, the Worker carries the fact about this request.
 *
 * WHICH IS WHY THIS LIVES NEXT TO THE COMPONENT THAT EMITS THE MOUNT. Producer
 * and consumer in one file, so a change to the markup cannot leave a Worker
 * stamping an attribute onto an element that has moved.
 *
 * AN UNSTAMPED MOUNT IS INERT AND NOT BROKEN. `class="cf-turnstile"` with no
 * `data-sitekey` and no script does nothing at all — no widget, no error, no
 * layout. That is what a deployment with no Turnstile configured serves, and its
 * submissions are REFUSED rather than accepted: the failure is at the endpoint,
 * where it is loud, rather than on the page, where it would look like a form
 * that works.
 *
 * IT DOES NOT MAKE A PAGE SESSION-DEPENDENT. The sitekey is the same for every
 * visitor, so a stamped page is exactly as shareable-cacheable as the one that
 * came out of the bucket — unlike the chrome's state, which is about who asked.
 */

/** The marker the component puts on the mount. Read, never written, by a Worker. */
export const TURNSTILE_MOUNT_ATTR = 'data-turnstile-target'

/** Cloudflare's widget script. Named once, here, so nothing else may name it. */
export const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

/** Cloudflare's server-side verification endpoint. */
export const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Whether these bytes carry a Turnstile mount, and so want a sitekey stamping.
 *
 * Read off the markup rather than from a column, on {@link
 * module:account-chrome/session}'s reasoning: a page with no form in it is left
 * exactly as it was published, and cannot acquire a third-party script by
 * accident.
 */
export function hasTurnstileMount(html: string): boolean {
  return html.includes(TURNSTILE_MOUNT_ATTR)
}

/**
 * Stamp `sitekey` onto every Turnstile mount in `html`, and load the widget.
 *
 * EVERY MOUNT, not the first: two forms on one page is ordinary, and a page
 * where one of them is protected and the other silently is not is the worst of
 * the three possible outcomes.
 *
 * AN EMPTY SITEKEY IS THE IDENTITY. A deployment that has not configured
 * Turnstile serves the bytes it published, unchanged — see the note above about
 * where that failure is surfaced instead.
 *
 * THE SCRIPT GOES LAST IN `</body>`, and only when something was stamped. It is
 * `defer`red, so the widget renders after the form exists; injecting it into a
 * document with nothing to render into would be a third-party request bought for
 * nothing.
 */
export function applyTurnstileSitekey(html: string, sitekey: string): string {
  const key = (sitekey ?? '').trim()
  if (key === '' || !hasTurnstileMount(html)) return html
  // The attribute is inserted immediately after the marker, so the mount's own
  // class and its `data-fc-invariant` are untouched — this adds and never
  // rewrites, which is what keeps a stamped page byte-comparable with its source.
  const stamped = html
    .split(TURNSTILE_MOUNT_ATTR)
    .join(`${TURNSTILE_MOUNT_ATTR} data-sitekey="${escapeAttribute(key)}"`)
  const script = `<script src="${TURNSTILE_SCRIPT_URL}" async defer></script>`
  const close = stamped.lastIndexOf('</body>')
  if (close === -1) return `${stamped}${script}`
  return `${stamped.slice(0, close)}${script}${stamped.slice(close)}`
}

/**
 * The five entities the L1 emitter escapes, applied to a configured value.
 *
 * A SITEKEY IS NOT USER CONTENT and this is still not optional: it arrives from
 * a deployment's own configuration, which is exactly the class of value that
 * gets pasted in with a stray quote on it. Escaping at the sink is cheaper than
 * reasoning about the provenance of every string that reaches one.
 */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
