/**
 * **What the page is showing**, read off a rendered document and put back onto
 * one ([[REQ-215]]).
 *
 * The two preview channels are two renders of the same page and the operator
 * experiences them as one page with a toggle. Anything the reader's own
 * interaction produced — which page they are on, how far down it, which panels
 * they opened — belongs to the *page*, not to the render of it, so a channel
 * switch has to carry it across. This module is the one place that knows how to
 * take it and how to give it back.
 *
 * THE TWO CHANNELS GIVE IT BACK DIFFERENTLY, AND THE DIFFERENCE IS THE POINT.
 *
 * - **Draft** has the live script, so a panel is opened by **activating the
 *   control that opens it** — the way a visitor opens it. Focus moves in, the
 *   scroll lock goes on, `aria-expanded` becomes honest. Setting the marker by
 *   hand would produce a panel that looked right and behaved as though nothing
 *   had happened.
 * - **Edit** has no script and must not gain one ([[REQ-116]]: a click there
 *   means "edit this", and a live page would give the same click a second
 *   meaning). So the markers are set directly. That is not a re-implementation
 *   of the behaviour — REQ-212 made the open state a pair of plain attributes
 *   *because the overlay presentation is CSS and CSS can only read the DOM*, so
 *   setting them is exactly what the script itself does, and the panel lands
 *   where it lands in View because the same gated rules lay it out.
 *
 * NOTHING HERE SHIPS INTO THE PAGE. This module runs in the builder, which
 * reaches the same-origin preview document the same way it reaches it to mount
 * the edit bridge. The rendered document gains no script and no listener.
 *
 * THE HANDLE IS THE L1 DIALOG ROLE'S `id`, and only that. A behaviour module
 * that hides content behind its own behaviour — `account-chrome`'s sign-in
 * dialog, the account portal's erasure disclosure — has no id in this namespace
 * and keeps the settled state it declares for the edit channel. Reaching into
 * one from here would mean this module knowing what an `account-chrome` is,
 * which is precisely what the carousel's own settled-state rule says the channel
 * must never need to know.
 */
import { L1_EDIT_MARKER_ATTR } from '@1stcontact/site-schema'
import {
  L1_DIALOG_ATTR,
  L1_DIALOG_CLOSES_ATTR,
  L1_DIALOG_LOCK_ATTR,
  L1_DIALOG_NOSCRIM_ATTR,
  L1_DIALOG_OPEN_ATTR,
  L1_DIALOG_OPENS_ATTR,
  L1_DIALOG_READY_ATTR,
} from './dialog'

/**
 * The state a channel switch carries.
 *
 * `dialogs` is a LIST rather than one id because several panels may be open at
 * once — REQ-212's script opens and closes each independently and lifts the
 * scroll lock only when the last of them closes. What the *chrome* offers is a
 * separate question; the carrier does not get to be lossy about the page.
 */
export interface L1PageState {
  /** The `id`s of the panels that are open, in document order. */
  dialogs: readonly string[]
  /** The document's vertical scroll offset, in CSS pixels. */
  scrollY: number
}

/** A panel the page declares, for chrome that offers a choice between them. */
export interface L1DialogEntry {
  id: string
  /** Something to call it in a list — never an id if anything better exists. */
  label: string
}

/** The state a page is in before anyone has touched it: the visitor's first frame. */
export const L1_INITIAL_PAGE_STATE: L1PageState = { dialogs: [], scrollY: 0 }

function shells(doc: Document): Element[] {
  return [...doc.querySelectorAll(`[${L1_DIALOG_ATTR}]`)]
}

function idOf(shell: Element): string {
  return shell.getAttribute(L1_DIALOG_ATTR) ?? ''
}

/** Is this the edit render? The same one-attribute test the edit bridge binds on. */
function isEditRender(doc: Document): boolean {
  return doc.body?.hasAttribute(L1_EDIT_MARKER_ATTR) === true
}

/**
 * The panels this page declares.
 *
 * Read from the DOCUMENT rather than from the definition, so chrome offering a
 * choice needs nothing new from the renderer and cannot list a panel the render
 * in front of the user does not have.
 *
 * The label is the panel's accessible name if it has one, else the first heading
 * inside it, else its first words. The id is the last resort — it is an author's
 * slug, and a list of slugs is a list nobody can read.
 */
export function listL1Dialogs(doc: Document): L1DialogEntry[] {
  return shells(doc)
    .filter((shell) => idOf(shell) !== '')
    .map((shell) => {
      const panel = shell.firstElementChild
      const label =
        panel?.getAttribute('aria-label')?.trim() ||
        firstWords(panel?.querySelector('h1,h2,h3,h4,h5,h6') ?? null) ||
        firstWords(firstLeafWithText(panel)) ||
        idOf(shell)
      return { id: idOf(shell), label }
    })
}

/**
 * The panel's first words, short enough for a control.
 *
 * A LEAF, not the panel's whole `textContent`: the subtree concatenates without
 * separators, so a prompt followed by a Close button reads as one run-together
 * word. What names a panel is the first thing written in it.
 */
function firstLeafWithText(panel: Element | null | undefined): Element | null {
  if (!panel) return null
  for (const el of panel.querySelectorAll('*')) {
    if (el.children.length === 0 && (el.textContent ?? '').trim() !== '') return el
  }
  return null
}

function firstWords(el: Element | null): string {
  const text = (el?.textContent ?? '').trim().replace(/\s+/g, ' ')
  return text.length > 40 ? `${text.slice(0, 40)}…` : text
}

/**
 * What this window is showing.
 *
 * Works on either channel unchanged, because the open marker means the same
 * thing in both — which is the property that makes carrying state between them
 * a copy rather than a translation.
 */
export function readL1PageState(win: Window): L1PageState {
  const doc = win.document
  return {
    dialogs: shells(doc)
      .filter((shell) => shell.hasAttribute(L1_DIALOG_OPEN_ATTR))
      .map(idOf)
      .filter((id) => id !== ''),
    scrollY: Math.round(win.scrollY || doc.documentElement.scrollTop || 0),
  }
}

/**
 * Put this window into that state.
 *
 * Scroll first: an open panel locks the page behind it (`overflow: hidden`), and
 * a scroll offset applied after the lock is applied to a document that can no
 * longer take it.
 */
export function applyL1PageState(win: Window, state: L1PageState): void {
  const doc = win.document
  const wanted = new Set(state.dialogs)
  // Only when it would move. A page already where it should be is the common
  // case by a distance — every load of an unscrolled page — and asking the
  // window to go where it already is is a call that can only cost something.
  if (Math.round(win.scrollY || 0) !== state.scrollY) {
    try {
      win.scrollTo(0, state.scrollY)
    } catch {
      /* a document that cannot scroll is not an error worth losing the panels over */
    }
  }
  if (isEditRender(doc)) applyToEditRender(doc, wanted)
  else driveDraftRender(doc, wanted)
}

/**
 * The edit render: say it, do not run it.
 *
 * The ready marker is what brings the overlay stylesheet into force at all. It
 * is set unconditionally — including for a state with nothing open, which is
 * what makes Edit show a *closed* panel rather than the settled in-flow one. The
 * settled render is the honest answer when nobody has said what state the page
 * was in (an edit URL opened on its own, in its own tab); inside the builder
 * something always has, and its first answer is "the page as a visitor meets
 * it".
 */
function applyToEditRender(doc: Document, wanted: Set<string>): void {
  const root = doc.documentElement
  root.setAttribute(L1_DIALOG_READY_ATTR, '')
  let anyOpen = false
  for (const shell of shells(doc)) {
    if (wanted.has(idOf(shell))) {
      shell.setAttribute(L1_DIALOG_OPEN_ATTR, '')
      anyOpen = true
    } else {
      shell.removeAttribute(L1_DIALOG_OPEN_ATTR)
    }
  }
  if (anyOpen) root.setAttribute(L1_DIALOG_LOCK_ATTR, '')
  else root.removeAttribute(L1_DIALOG_LOCK_ATTR)
}

/**
 * The draft render: drive it, do not say it.
 *
 * Every transition here is a real activation of a real control, so the page's
 * own script does the opening and the closing and everything it owns — focus,
 * the trap, the lock, `aria-expanded` — is true afterwards. A panel with no
 * control that opens it cannot have been opened by a reader either, so there is
 * nothing to reproduce and nothing is forced.
 *
 * Closing falls back to the scrim because a panel is not obliged to contain a
 * Close: dispatching the click on the shell itself is the same gesture as
 * clicking beside the panel, and a panel that has opted out of scrim dismissal
 * declines it exactly as it declines a reader's.
 */
function driveDraftRender(doc: Document, wanted: Set<string>): void {
  for (const shell of shells(doc)) {
    const id = idOf(shell)
    if (id === '') continue
    const open = shell.hasAttribute(L1_DIALOG_OPEN_ATTR)
    if (wanted.has(id) === open) continue
    if (wanted.has(id)) {
      activate(control(doc, L1_DIALOG_OPENS_ATTR, id))
      continue
    }
    const closer = control(doc, L1_DIALOG_CLOSES_ATTR, id)
    if (closer) activate(closer)
    else if (!shell.hasAttribute(L1_DIALOG_NOSCRIM_ATTR)) activate(shell)
  }
}

/**
 * The control that names this panel — found by COMPARING the attribute rather
 * than by building a selector out of an author's string. That is REQ-212's own
 * script's approach (`shellFor`), and the reason is the same: an id is an
 * author's value, and a value that reaches a selector has to be escaped for a
 * grammar it was never written against.
 */
function control(doc: Document, attr: string, id: string): Element | null {
  for (const el of doc.querySelectorAll(`[${attr}]`)) {
    if (el.getAttribute(attr) === id) return el
  }
  return null
}

/**
 * Activate a control the way a reader does.
 *
 * `click()` rather than a constructed event, because the event has to belong to
 * the DOCUMENT'S OWN realm: this module runs in the builder, and a `MouseEvent`
 * built from the builder's globals is an event the framed document's listeners
 * are not looking at. The element's own method is the one thing guaranteed to
 * dispatch in the right realm — and it is what the reader's pointer does.
 */
function activate(el: Element | null): void {
  const target = el as (Element & { click?: () => void }) | null
  if (typeof target?.click === 'function') target.click()
}
