import type { L1ControlElement } from '../../l1/render'

/**
 * `account-portal`'s **attribute bundles** — the module's half of the control
 * contract ([[DOC-25]] §10, REQ-96).
 *
 * The module says which elements exist and what makes them work; L1 says what
 * they look like. Two details here are load-bearing rather than defaults:
 *
 * `type="button"` on both. A bare `<button>` inside a form submits it, and the
 * one thing this surface must never do by accident is send anything
 * ([[REQ-183]] §4.1).
 *
 * `aria-expanded` STARTS TRUE, because the server renders the explanation open
 * and `client.js` folds it away ([[REQ-183]] D5). So the markup is accurate
 * before the script runs and accurate after — which is the property the whole
 * progressive-disclosure direction was chosen for. Declaring it false and
 * correcting it on load would leave a scriptless visitor a control announcing a
 * collapsed state over an expanded one.
 *
 * @param erasureId the DOM id of the disclosure both buttons control — passed
 *   rather than fixed, because two portals on one page must not both claim it.
 */
export function accountPortalControls(
  revealLabel: string,
  dismissLabel: string,
  erasureId: string,
): Record<string, L1ControlElement> {
  return {
    reveal: {
      tag: 'button',
      attrs: { type: 'button', 'aria-expanded': 'true', 'aria-controls': erasureId },
      text: revealLabel,
    },
    dismiss: {
      tag: 'button',
      attrs: { type: 'button', 'aria-controls': erasureId },
      text: dismissLabel,
    },
  }
}
