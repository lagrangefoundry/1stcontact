/**
 * The modal's **attribute vocabulary** ([[REQ-212]]), as a contract rather than
 * as a detail of the emitter that writes it ([[REQ-215]]).
 *
 * REQ-212 put these constants next to the code that renders them, which was
 * right while the renderer was their only reader. It no longer is: `page-state`
 * has to read the same markers to answer "which panel is open" and to put a
 * document into a state, and the builder runs that module in the browser. Two
 * spellings of `data-l1-open` — one in the emitter, one in the reader — agree
 * until the day one of them is renamed, and nothing would fail loudly when they
 * stopped.
 *
 * So the names live here, imported by both. This mirrors what
 * `@1stcontact/site-schema`'s `l1/edit.ts` already does for the edit stamp: the
 * attribute names are the contract, and the renderer is one party to it.
 *
 * WHY THE OPEN STATE IS AN ATTRIBUTE AT ALL, and not script-held state: the
 * overlay presentation is CSS, and CSS can only read the DOM. That is REQ-212's
 * own reason, and it is what makes a page's panel state legible to anything that
 * can see the document — which is the whole of REQ-215's mechanism.
 */

/** The shell class every overlay panel is wrapped in. */
export const L1_DIALOG_CLASS = 'l1-dlg'
/** On the shell: the `id` of the panel it holds — the handle on the pair. */
export const L1_DIALOG_ATTR = 'data-l1-dialog'
/** On the shell: this panel is open. Set by the script, or by a channel-switch. */
export const L1_DIALOG_OPEN_ATTR = 'data-l1-open'
/** On `<html>`: the overlay rules are in force. Without it, panels lie in flow. */
export const L1_DIALOG_READY_ATTR = 'data-l1-dialog-ready'
/** On `<html>`, while any panel is open: the scroll lock. */
export const L1_DIALOG_LOCK_ATTR = 'data-l1-dialog-lock'
/** On the shell: Escape does NOT close this one (the opt-out). */
export const L1_DIALOG_NOESC_ATTR = 'data-l1-dialog-noesc'
/** On the shell: a scrim click does NOT close this one (the opt-out). */
export const L1_DIALOG_NOSCRIM_ATTR = 'data-l1-dialog-noscrim'
/** On an action node: which panel activating it opens. */
export const L1_DIALOG_OPENS_ATTR = 'data-l1-opens'
/** On an action node: which panel activating it closes. */
export const L1_DIALOG_CLOSES_ATTR = 'data-l1-closes'
