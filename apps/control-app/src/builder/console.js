/**
 * The operator console ([[REQ-297]]) — chrome and a registry, and no content.
 *
 * WHAT THIS MODULE KNOWS. How to be opened, how to name itself, and how to mount
 * a list of controls somebody else wrote. It does not know what a tenant is, what
 * spend is, or what any control it renders is about, and the absence is the
 * design rather than an early stage of one: the first control landed with this
 * file and the second will land without touching it.
 *
 * WHY THAT IS WORTH A MODULE OF ITS OWN. The alternative — a console whose first
 * control is written inline, to be "extracted when there is a second" — is the
 * shape that never gets extracted, because by the time a second control exists
 * the first one's markup is load-bearing for the surrounding chrome. Registering
 * from the start costs one indirection and makes the boundary checkable: a UAT
 * mounts this with no controls at all and with a control it invents, neither of
 * which is possible if the console has a subject.
 *
 * IT IS A DIALOG AND NOT A TAB, and `config.js` carries the reason: the tab strip
 * is uniformly business-scoped ([[REQ-179]]) and this console is about every
 * tenant at once, so a tab would be a second place where the business switcher is
 * present and silently does not apply. It composes `modal.js` — ours — so it
 * needs nothing from the shared `webui-*` components and renders wherever a DOM
 * does.
 *
 * NOTHING HERE IS THE GATE. The action that opens it is rendered on
 * `ownsPlatformBusiness` and every route a control reads asks the same question
 * again for itself ([[DOC-42]] §7). A console that is merely unrendered is
 * refused to nobody who can type a URL.
 */

import {
  CONSOLE_EMPTY,
  CONSOLE_HINT,
  CONSOLE_LABEL,
  CONSOLE_ACTION_ID,
} from './config.js'
import { createModalShell } from './modal.js'

/** A `<div class="builder-console__…">` with optional text. Local, like every pane's. */
function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * Open the console over `host`, mounting each registered control in order.
 *
 * A CONTROL IS `{id, label, hint?, mount(container)}` AND NOTHING MORE. It is
 * handed an empty element and owns everything inside it; it may return a
 * `destroy()` which is called when the dialog closes, on `modal.js`'s own
 * contract — every route out (the button, Escape, the backdrop) runs it, which is
 * what stops one of the three leaking a subscription the other two release.
 *
 * ORDER IS THE REGISTRY'S, not sorted here. Which control an operator sees first
 * is an editorial decision belonging to whoever assembled the list, and a console
 * that alphabetised it would silently re-rank them the day one is renamed.
 *
 * A CONTROL THAT THROWS WHILE MOUNTING DOES NOT TAKE THE CONSOLE DOWN. It is
 * reported in its own section and the rest of the console renders — the console's
 * value is that it is where several unrelated things are looked at, and one of
 * them failing must not hide the others.
 *
 * @param {object} spec
 * @param {Element} [spec.host] inside the shell root — see `modal.js`
 * @param {Array<{id: string, label: string, hint?: string, mount: (el: Element) => ({destroy?: () => void}|void)}>} [spec.controls]
 * @returns {{element: Element, close: () => void}}
 */
export function openOperatorConsole({ host = null, controls = [] } = {}) {
  const mounted = []
  const modal = createModalShell({
    host,
    title: CONSOLE_LABEL,
    onClose: () => {
      for (const control of mounted) {
        try {
          control.destroy?.()
        } catch {
          // A control that cannot be torn down must not keep the dialog open.
        }
      }
    },
  })

  const panel = el('div', 'builder-console')
  panel.append(el('h2', 'builder-console__heading', CONSOLE_LABEL))
  panel.append(el('p', 'builder-console__hint', CONSOLE_HINT))

  if (controls.length === 0) {
    // NOT A PLACEHOLDER AND NOT AN ERROR. The console has no subject of its own,
    // so with nothing registered there is genuinely nothing to show — and saying
    // so is what stops the next hand reading a blank dialog as a failure to load.
    panel.append(el('p', 'builder-console__empty', CONSOLE_EMPTY))
  }

  for (const control of controls) {
    const section = el('section', 'builder-console__control')
    section.dataset.control = control.id
    section.append(el('h3', 'builder-console__control-label', control.label))
    if (control.hint) section.append(el('p', 'builder-console__control-hint', control.hint))
    const body = el('div', 'builder-console__control-body')
    section.append(body)
    panel.append(section)
    try {
      const handle = control.mount(body)
      if (handle) mounted.push(handle)
    } catch (err) {
      body.replaceChildren(
        el(
          'p',
          'builder-console__control-error',
          `This control could not be opened: ${err instanceof Error ? err.message : String(err)}`,
        ),
      )
    }
  }

  modal.panel.append(panel)
  modal.mount()
  return { element: modal.element, close: modal.close }
}

/**
 * The header action that opens it — or NOTHING, for a session that does not own
 * the 1st Contact business.
 *
 * A LIST RATHER THAN A NULLABLE ACTION, because the shell's `actions` REPLACES
 * its defaults rather than extending them, so the call site spreads this into a
 * literal that already restates Theme, About and the account avatar. Returning
 * `[]` makes "absent" the same expression as "present" at that site, with no
 * conditional to get backwards.
 *
 * IT IS CHROME AND NOT THE GATE ([[REQ-170]]'s `canFulfil` exactly). The routes
 * behind the console each ask `ownsPlatformBusiness` again for themselves.
 */
export function consoleActions({ ownsPlatformBusiness = false, open = () => {} } = {}) {
  if (!ownsPlatformBusiness) return []
  return [
    {
      id: CONSOLE_ACTION_ID,
      content: CONSOLE_LABEL,
      title: CONSOLE_LABEL,
      ariaLabel: CONSOLE_LABEL,
      onClick: open,
    },
  ]
}
