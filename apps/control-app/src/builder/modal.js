/**
 * The dialog shell every builder modal wears (REQ-133 §7).
 *
 * The segment editor hand-rolled this — backdrop, Escape, close, the
 * shell-rooted host, the footer and its buttons — and the palette popup needs
 * the identical shell with entirely different contents. Copying it would give
 * the builder two dialogs that are the same dialog until one of them is fixed,
 * so it is extracted rather than duplicated. Everything here is chrome: nothing
 * in this module knows what is being edited, and nothing decides what an edit
 * means.
 *
 * WHERE IT MOUNTS. `host` MUST be inside the shell root, because the shell owns
 * both halves of a dialog's appearance: the `--shell-*` tokens are declared on
 * `.shell`, and so is the app font every descendant inherits. Appended to
 * `document.body` — a sibling of the shell — a dialog resolves neither: it
 * renders in the browser's default serif and falls through to the stylesheet's
 * hardcoded fallback hexes, so it merely resembles the current theme and does
 * not follow a theme switch at all. It defaults to `document.body` for a host
 * that has no shell (the suites that drive a modal against a bare document).
 */

/**
 * Open a dialog shell and return the handle its contents are built into.
 *
 * `onClose` runs BEFORE the element leaves the document, so a caller can destroy
 * whatever it mounted inside while that is still attached — and it runs on every
 * route out (the button, Escape, the backdrop), which is what stops one of the
 * three leaking a component the other two release.
 *
 * **`mount()` IS SEPARATE FROM CONSTRUCTION, AND THAT ORDERING IS LOAD-BEARING.**
 * A caller builds its contents into `panel` and appends the whole dialog once, at
 * the end. Appending first — the obvious simplification — silently changes the
 * segment editor's behaviour: `mountFields` ends its click-to-edit by calling
 * `control.focus()`, and REQ-117's `openLoneControl` fires that click while the
 * dialog is still detached, where focus does not move. Attached, the focus is
 * real, the browser's own focus handling then moves it away, and the control
 * confirms-and-reverts to a display cell before the operator has typed anything
 * — so the box they clicked into is no longer a box they can type in.
 *
 * Recorded rather than fixed here, because it is REQ-135/REQ-138 behaviour that
 * ships and is pinned by their UATs; the real repair is an `autoEdit` seam
 * upstream, which `openLoneControl` is already asking for.
 *
 * @param {object} spec
 * @param {Element} [spec.host] - where the dialog is appended (see the header)
 * @param {string} [spec.title] - the dialog's accessible name
 * @param {() => void} [spec.onClose]
 * @returns {{element: Element, panel: Element, close: () => void, mount: () => void}}
 */
export function createModalShell({ host = null, title = 'Edit', onClose = () => {} } = {}) {
  const mountPoint = host ?? document.body

  const element = document.createElement('div')
  element.className = 'builder-modal'
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  // The title survives as the ACCESSIBLE name even where it is not drawn.
  // Dropping a visible heading is a statement about redundant chrome, not about
  // the dialog being anonymous — a dialog with no name is announced as "dialog"
  // and nothing else.
  element.setAttribute('aria-label', title)

  const panel = document.createElement('div')
  panel.className = 'builder-modal__panel'

  const backdrop = document.createElement('div')
  backdrop.className = 'builder-modal__backdrop'
  element.append(backdrop, panel)

  // Guarded rather than assumed idempotent: Escape during the close of a dialog
  // that is already closing would run `onClose` twice, and a caller's `destroy`
  // is not obliged to tolerate that.
  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    onClose()
    element.remove()
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (ev) => {
    if (ev.key === 'Escape') close()
  }
  // Bound at CREATION, not at mount: `close` is a legitimate answer from the
  // moment the shell exists, including for a caller that fails while building
  // its contents and never mounts at all.
  document.addEventListener('keydown', onKey)
  backdrop.addEventListener('click', close)

  return { element, panel, close, mount: () => mountPoint.append(element) }
}

/** The dialog's action row. */
export function modalFooter(children) {
  const row = document.createElement('div')
  row.className = 'builder-modal__footer'
  row.append(...children)
  return row
}

/** A dialog button. `type="button"` always — none of these submits a form. */
export function modalButton(label, className, onClick) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = className
  b.textContent = label
  b.addEventListener('click', onClick)
  return b
}
