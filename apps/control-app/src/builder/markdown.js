/**
 * The builder's markdown engines, in one place (BUG-42).
 *
 * Two third-party libraries stand behind every piece of markdown this app shows:
 * `marked` renders it, DOMPurify scrubs the result. Both are lazily imported
 * from a CDN behind their components' own seams, and until they arrive
 * `renderSafe` deliberately degrades to ESCAPED SOURCE rather than raw HTML.
 *
 * THAT DEGRADATION IS RIGHT, AND IT IS ALSO THE BUG. It is the correct answer
 * when the engines are *absent* — offline should be a plainer panel, not a blank
 * one. It is the wrong answer when they are merely *late*, which is exactly the
 * cold load: an uncached CDN import loses the race against a local fetch, the
 * transcript is painted as escaped source, and `mountChat` renders each message
 * once and offers no way to redraw it. On the next load the import is served
 * from cache, wins the race, and the identical code looks correct — which is the
 * whole of the "it renders after a refresh" report.
 *
 * SO THE ENGINES BECOME SOMETHING TO WAIT FOR, ONCE, FOR THE WHOLE APP. The
 * loads start at import — no surface has to remember to kick them off — and
 * `markdownReady` is how a surface says "not before the renderer exists".
 *
 * IT NEVER REJECTS. A blocked or unreachable CDN settles it just as a successful
 * load does, because the caller's question is "is waiting still going to change
 * anything?" and the answer to that is no either way. Offline stays a plainer
 * panel; it does not become a panel that waits forever.
 */

import { getSanitizer, loadSanitizer, renderSafe } from '@lagrangefoundry/webui-chat'
import { loadMarked } from '@lagrangefoundry/webui-markdown'

/**
 * Settles when both engines have loaded — or failed, which is the same signal.
 *
 * Started here, at import, so the wait is over the loads that are ALREADY in
 * flight rather than ones a waiter has to remember to start.
 */
export const markdownReady = Promise.all([
  loadMarked().catch(() => {}),
  loadSanitizer().catch(() => {}),
]).then(() => {})

/**
 * Render markdown to HTML that is safe to insert.
 *
 * Re-exported from the chat component rather than reached for directly, so the
 * one policy — render, then sanitize; escape when there is no sanitizer — is
 * shared by every surface in the builder. Material descriptions are LLM output
 * written from files a client supplied, which is the trust level the chat panel
 * already scrubs for; the Library must not be the one surface that inserts that
 * HTML unscrubbed.
 */
export { renderSafe }

/** Whether the sanitizer is present — i.e. whether `renderSafe` will render or escape. */
export function markdownEngineReady() {
  return getSanitizer() != null
}
