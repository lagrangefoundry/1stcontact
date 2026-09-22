/**
 * The operator console ([[REQ-297]], re-housed by [[REQ-298]]) — a FULL-SURFACE
 * VIEW, and no content of its own.
 *
 * WHAT THIS MODULE KNOWS. How to be opened, how to take over the shell's content
 * region, how to be got out of, and how to hand an empty element to somebody
 * else. It does not know what a site is, what a business is or what spend is,
 * and the absence is the design rather than an early stage of one — the same
 * claim [[REQ-297]] made of it, at the seam that still exists. What moved is the
 * REGISTRY: it used to compose a list of controls, and the thing that composes a
 * list of named sections is now the detail pane inside the body this mounts.
 *
 * IT IS A VIEW AND NO LONGER A DIALOG, and every difference below is behaviour
 * rather than style:
 *
 *   - IT IS NOT LAYERED OVER ANYTHING. No backdrop, no scrim, no `z-index` above
 *     the builder. The content region shows the console INSTEAD of the tab
 *     panels, so nothing of the builder is behind it and nothing of the builder
 *     has to be made inert.
 *   - IT FILLS THE CONTENT REGION, the full height and width the active tab's
 *     panel would have had. That is what makes the split inside it worth
 *     dragging, and it is why the panels are hidden with `display: none` rather
 *     than removed: the shell's own height chain is a `:has()` on a live
 *     `.shell-panel.is-fill.is-active`, and a panel that is merely not painted
 *     still satisfies it.
 *   - ESCAPE DOES NOT CLOSE IT. There is no `keydown` listener in this file and
 *     that absence is the feature — `modal.js` binds one at creation, which is
 *     the right reflex for a thing you glance at and the wrong one for a surface
 *     somebody has spent twenty minutes in with a divider dragged and a pane
 *     scrolled.
 *
 * IT IS STILL NOT A TAB. [[REQ-179]]'s argument was structural and survived the
 * re-housing whole: the strip is uniformly business-scoped and this console is
 * about every business at once, so no entry is added to it. What "behaves like a
 * tab" means here is the two things that are testable — it occupies the region a
 * panel would, and the strip still navigates away from it.
 *
 * NOTHING HERE IS THE GATE. The action that opens it is rendered on
 * `ownsPlatformBusiness` and every route the body reads asks the same question
 * again for itself ([[DOC-42]] §7). A console that is merely unrendered is
 * refused to nobody who can type a URL.
 */

import {
  CONSOLE_ACTION_ID,
  CONSOLE_CLOSE_LABEL,
  CONSOLE_HINT,
  CONSOLE_LABEL,
} from './config.js'

/**
 * The one marker on the shell root, and the one CSS rule it drives.
 *
 * A CLASS AND NOT A BESPOKE ATTRIBUTE, because `builder-shell--no-business` and
 * `builder-shell--publishing` are already exactly this: a state of the builder,
 * written on the shell root, read by one rule in `builder.css`. A third state
 * spelled a different way would make the three look like three mechanisms.
 */
export const CONSOLE_OPEN_CLASS = 'builder-shell--console'

/** A `<div class="builder-console__…">` with optional text. Local, like every pane's. */
function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * Open the console over the shell's content region.
 *
 * THE BODY IS A `mount(container)` AND NOTHING MORE — the same contract a
 * control had, with the plural taken out. It is handed an empty element and owns
 * everything inside it; it may return a `destroy()`, which runs on every route
 * out, which is what stops one of them leaking a subscription the other releases.
 *
 * A BODY THAT THROWS WHILE MOUNTING DOES NOT TAKE THE CONSOLE DOWN. It is
 * reported inside the view and the chrome still renders, so the operator keeps
 * the way out they arrived with rather than being stranded on a blank surface
 * with the panels hidden behind it.
 *
 * THIS IS THE SECOND PLACE THIS APP INSERTS MARKUP INTO THE SHELL'S INTERNALS,
 * and naming it is the point. The first is the business switcher prepended into
 * `.shell-bar`, which `app.js` documents because `webui-shell` offers a trailing
 * `actions` slot and no leading one. There is likewise no declared slot for a
 * view that REPLACES the panels, and inventing a helper to hide that would make
 * two exceptions look like none. (The block helpers in `app.js` also reach for
 * `.shell-panels`, but only to set `inert` and to place a banner beside it —
 * they add no surface of their own and survive any markup change that keeps the
 * class. These two do not.) The day `webui-shell` grows either slot, each is a
 * one-line change.
 *
 * @param {object} spec
 * @param {{element: Element, getActiveTab: () => string}} spec.shell the shell handle
 * @param {(el: Element) => ({destroy?: () => void}|void)} [spec.mount] the body
 * @param {() => void} [spec.onOpen] run once the view is up — see `app.js`
 * @param {() => void} [spec.onClose] run once it is down, before the tab is restored
 * @returns {{element: Element, close: () => void, returnTo: string|null}}
 */
export function openOperatorConsole({
  shell,
  mount = () => {},
  onOpen = () => {},
  onClose = () => {},
} = {}) {
  const root = shell.element
  const content = root.querySelector('.shell-content') ?? root
  const strip = root.querySelector('.shell-tabs')
  const action = root.querySelector(`[data-action="${CONSOLE_ACTION_ID}"]`)

  /**
   * WHERE DISMISSAL GOES BACK TO, taken before anything is suppressed. The shell
   * keeps an active tab internally — it has no concept of none — so this is
   * still the truth about which panel would be showing; what the console
   * suppresses is only the CLAIM the strip makes about it.
   */
  const returnTo = shell.getActiveTab?.() ?? null

  const element = el('section', 'builder-console')
  element.setAttribute('aria-label', CONSOLE_LABEL)

  const header = el('header', 'builder-console__header')
  const titles = el('div', 'builder-console__titles')
  titles.append(
    el('h2', 'builder-console__heading', CONSOLE_LABEL),
    el('p', 'builder-console__hint', CONSOLE_HINT),
  )
  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.className = 'builder-console__close'
  dismiss.textContent = CONSOLE_CLOSE_LABEL
  header.append(titles, dismiss)

  const body = el('div', 'builder-console__body')
  element.append(header, body)

  /**
   * NO TAB READS AS SELECTED WHILE THE CONSOLE IS UP, and it is done the way the
   * shell itself does it rather than by out-specifying its stylesheet.
   *
   * WHY NOT ONE CSS RULE UNDER THE ROOT CLASS. Selected styling is
   * `.shell-tab.is-active` under TWO different `data-tabstyle` values, each with
   * its own declarations; a rule here that undid them would have to mirror both
   * and would silently stop mirroring them the day upstream adds a third. The
   * shell's own mechanism is the class and `aria-selected`, so suppressing is
   * removing exactly what it set — which also means a SCREEN READER is told the
   * truth rather than being left with a tab claiming to be current while its
   * panel is off screen.
   */
  const restore = []
  for (const tab of strip?.querySelectorAll('.shell-tab') ?? []) {
    restore.push({ tab, active: tab.classList.contains('is-active') })
    tab.classList.remove('is-active')
    tab.setAttribute('aria-selected', 'false')
  }

  let closed = false
  let handle = null

  const close = () => {
    if (closed) return
    closed = true
    try {
      handle?.destroy?.()
    } catch {
      // A body that cannot be torn down must not keep the view on screen.
    }
    element.remove()
    root.classList.remove(CONSOLE_OPEN_CLASS)
    strip?.removeEventListener('click', dismissOnTabClick, true)
    for (const { tab, active } of restore) {
      tab.classList.toggle('is-active', active)
      tab.setAttribute('aria-selected', String(active))
    }
    action?.removeAttribute('aria-pressed')
    action?.classList.remove('is-active')
    onClose()
  }

  /**
   * THE STRIP STAYS LIVE, AND CLICKING A TAB DISMISSES THE CONSOLE AND GOES
   * THERE. The strip is the builder's primary navigation and must not stop
   * working because a view is open — this is where "behaves like a tab" is
   * actually testable.
   *
   * IN THE CAPTURE PHASE, WHICH IS THE WHOLE OF THE ORDERING. The shell's own
   * handler is on the button and fires on the bubble, so closing here happens
   * FIRST: the panels are back and the previous tab's selection is restored
   * before `select(id)` runs and repaints. Clicking the tab that was already
   * active is then genuinely a no-op in the shell — no change, so no
   * `onTabChange`, so no surface posted — which is the right record, because as
   * far as the record is concerned nothing moved.
   */
  function dismissOnTabClick(ev) {
    if (!(ev.target instanceof Element)) return
    if (!ev.target.closest('.shell-tab')) return
    close()
  }

  dismiss.addEventListener('click', close)
  strip?.addEventListener('click', dismissOnTabClick, true)

  content.append(element)
  root.classList.add(CONSOLE_OPEN_CLASS)
  // THE ACTION IS MARKED WHILE THE VIEW IS UP. `aria-pressed` rather than a
  // class alone, because the header control has genuinely become a toggle: it is
  // the way in, and the thing it opened is still there.
  action?.setAttribute('aria-pressed', 'true')
  action?.classList.add('is-active')

  try {
    handle = mount(body) ?? null
  } catch (err) {
    body.replaceChildren(
      el(
        'p',
        'builder-console__error',
        `This console could not be opened: ${err instanceof Error ? err.message : String(err)}`,
      ),
    )
  }

  onOpen()
  return { element, close, returnTo }
}

/**
 * The header action that opens it — or NOTHING, for a session that does not own
 * the 1st Contact business.
 *
 * UNCHANGED BY [[REQ-298]] AND DELIBERATELY SO. What the action opens moved; the
 * gate, the slot and the shape of this function did not, because the argument
 * for all three was about where a cross-business surface belongs and that
 * argument was accepted.
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
