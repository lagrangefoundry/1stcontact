/**
 * The multi-mode display panel (DOC-8 §3.2, DOC-28 §7.1).
 *
 * The left pane is NOT "the preview" — it is a pane that can show any of several
 * modes, of which View is one. Two properties follow, and both are structural
 * rather than conventions:
 *
 *   1. A mode is an ENTRY, not a branch. `registerMode(spec)` adds to a map;
 *      there is no switch anywhere in here that a new mode has to be threaded
 *      through. A later mode (template chooser, asset browser, revision diff)
 *      is an added entry and nothing else.
 *   2. Switching modes does NOT rebuild the pane, and since [[BUG-79]] it does
 *      not reload it either. **A document mode owns its own frame**, created
 *      when the mode is registered and kept for the panel's lifetime, so a
 *      switch is a swap of which frame is visible and no navigation at all.
 *
 * WHY A FRAME EACH, AND NOT ONE FRAME RE-POINTED. The single frame was a `src`
 * per mode, so View↔Edit destroyed the document the operator was looking at and
 * built a new one. [[REQ-215]] carried the page state across that navigation and
 * put it back on `load`, which is the right thing to carry and is not enough: a
 * restore applied to a document that has only just arrived is not the same as
 * never having lost it. The pane blanked, the render restarted, and the offset
 * was re-applied against a layout that is not necessarily final at `load`. A
 * frame that was never navigated has nothing to restore.
 *
 * HIDDEN MEANS `visibility`, NOT `display` — see `builder.css`. A `display: none`
 * iframe is out of layout and does not keep its scroll offset, which would give
 * back by the back door exactly what this change exists to stop losing. The idle
 * frames are laid out, unpainted and untouchable.
 *
 * ONLY THE SHOWN FRAME CARRIES `.builder-panel__frame`. That class is the address
 * every other surface already uses for "the frame the pane is showing" — the
 * viewport-fill UAT measures it, the browser suites drive the edit loop through
 * it — and each of them means the visible one. The shared geometry lives on
 * `.builder-panel__pane`, which every frame carries.
 *
 * A FRAME NAVIGATES ONLY WHEN WHAT IT SHOWS IS OUT OF DATE: it has never been
 * pointed anywhere, the site changed, an explicit `refresh()`, or a write
 * (`reloadDocument`). A mode switch is none of those — and `prime` gets the
 * first of them out of the way behind the visible page, so that the FIRST flip
 * is in place as well as every one after it.
 *
 * A HOST MAY ASK TO BE TOLD when the displayed document is about to go and when
 * a new one has arrived (`onBeforeNavigate`, and the `document` event). The pane
 * does not know what is worth keeping across a swap — that is [[REQ-215]]'s
 * question and it belongs to the builder — but it is the only thing that knows
 * WHEN, so it says when and holds no opinion about what.
 *
 * A mode that renders something other than a document supplies `mount(host)`
 * instead of `src(state)`; the frames are hidden and a host element is used
 * instead. The toolbar reads `actions` off the active mode, which is why the
 * toolbar is mode-aware rather than a fixed strip assuming an iframe beneath it.
 */

/**
 * @typedef {object} ModeSpec
 * @property {string} id                            stable address for this mode
 * @property {string} label                         provisional chrome text
 * @property {(state: PanelState) => string} [src]  document URL for this mode
 * @property {(host: HTMLElement, state: PanelState) => void} [mount] non-document mode
 * @property {string[]} [actions]                   toolbar action ids valid in this mode
 */

/** @typedef {{ site: string | null, mode: string | null }} PanelState */

/** The class every frame carries; the geometry is declared against it. */
const PANE_CLASS = 'builder-panel__pane'
/** The class the SHOWN frame additionally carries. See the header note. */
const SHOWN_CLASS = 'builder-panel__frame'

export function createDisplayPanel(options = {}) {
  const element = document.createElement('div')
  element.className = 'builder-panel'

  const host = document.createElement('div')
  host.className = 'builder-panel__host'
  host.hidden = true

  element.append(host)

  /** @type {Map<string, ModeSpec>} */
  const modes = new Map()
  /**
   * One record per document mode: its frame, the URL that frame was last asked
   * for, and whether what it holds is out of date.
   *
   * @type {Map<string, { id: string, el: HTMLIFrameElement, src: string, stale: boolean }>}
   */
  const frames = new Map()
  /**
   * `document` fires when the frame has loaded one ([[REQ-215]]), AND when an
   * already-loaded one is revealed ([[BUG-79]]).
   *
   * Chrome that reads the page rather than the state around it — the panel
   * selector lists the panels the RENDER declares — needs the same
   * subscribe-with-the-element lifetime every other toolbar control has, and
   * binding to the frame directly would outlive the control that bound.
   *
   * The second case is the one the frame-per-mode model adds: revealing a loaded
   * document fires no `load`, and the edit bridge, Marked Points and the carry
   * all bind on this announcement. Without it a flip would show a document
   * nothing was bound to.
   */
  const listeners = { mode: [], src: [], site: [], document: [] }
  const storage = options.storage ?? null
  /**
   * "The document you can see is about to be replaced" ([[REQ-215]]).
   *
   * It fires BEFORE the next `src` is computed, because what a mode resolves to
   * now depends on what the outgoing document held — which page it was on, how
   * far down it, which panels were open. Announcing it after the URL had been
   * decided would be announcing it too late to matter.
   *
   * Since [[BUG-79]] "replaced" usually means "swapped away from" rather than
   * "navigated", and it fires just the same: the outgoing document is still the
   * only place that state can be read from either way.
   */
  const onBeforeNavigate = options.onBeforeNavigate ?? null

  let activeId = null
  let site = options.site ?? null
  let currentSrc = ''
  /** The record whose frame is on screen — or was, while a mount mode shows. */
  let current = null

  const state = () => ({ site, mode: activeId })

  function emit(event, value) {
    for (const cb of listeners[event].slice()) cb(value)
  }

  /**
   * Resolved before comparing, because the two sides are not written the same
   * way: what a frame was last asked for is whatever string it was given, and
   * what a mode resolves to now is derived fresh. Comparing them as text would
   * call a frame out of date over a difference that is not one.
   */
  function href(url) {
    try {
      return new URL(url, document.baseURI).href
    } catch {
      return url
    }
  }

  function sameUrl(a, b) {
    return a === b || (b !== '' && href(a) === href(b))
  }

  function makeFrame(id) {
    const el = document.createElement('iframe')
    el.className = PANE_CLASS
    el.setAttribute('title', 'Site preview')
    // Per frame rather than one listener on one element, because there is no
    // longer one element — and the announcement is only true of the frame the
    // operator can see.
    el.addEventListener('load', () => {
      if (current?.id === id) emit('document', el.contentDocument)
      prime()
    })
    const rec = { id, el, src: '', stale: true }
    frames.set(id, rec)
    element.append(el)
    return rec
  }

  /** Show this frame and hide every other. `null` hides them all (a mount mode). */
  function display(rec) {
    for (const f of frames.values()) f.el.classList.toggle(SHOWN_CLASS, f === rec)
    if (rec) current = rec
  }

  /** Point a frame somewhere. The one call that navigates. */
  function navigate(rec, url) {
    rec.src = url
    rec.stale = false
    rec.el.setAttribute('src', url)
  }

  /**
   * Mark every frame's content out of date, so the next mode that shows one
   * re-renders rather than serving what it happened to be holding.
   */
  function invalidate(except = null) {
    for (const f of frames.values()) if (f !== except) f.stale = true
  }

  /**
   * Load the channels nobody is looking at, once the one they are has arrived.
   *
   * WHY AT ALL: a frame that has never been pointed anywhere has to navigate the
   * first time its mode is shown, and that first flip is the one that still
   * blanks and loses the operator's place. Priming it behind the visible page
   * makes every flip in place, including the first.
   *
   * WHY ONLY FOR A DIFFERENT URL, and never merely because a frame is stale.
   * Those are two different reasons to be out of date and only one of them is
   * worth paying for unasked: a different PAGE (a change of site) is a document
   * this frame has never held, while a stale one is the same page whose content
   * has been written to — and re-rendering that for nobody is exactly the cost
   * `reloadDocument` declines. A stale frame re-renders when it is shown.
   *
   * AFTER the visible frame's load, so the page in front of the operator is
   * never behind a render they did not ask for.
   */
  function prime() {
    if (site === null) return
    for (const [id, mode] of modes) {
      if (!mode.src || id === current?.id) continue
      const rec = frames.get(id)
      if (!rec) continue
      const want = mode.src({ site, mode: id })
      if (!sameUrl(rec.src, want)) navigate(rec, want)
    }
  }

  /** Re-derive what the pane shows from the active mode. Never rebuilds it. */
  function show() {
    const mode = activeId === null ? null : modes.get(activeId)
    if (!mode) return
    onBeforeNavigate?.()
    if (mode.mount) {
      display(null)
      host.hidden = false
      host.replaceChildren()
      mode.mount(host, state())
      currentSrc = ''
      emit('src', currentSrc)
      return
    }
    host.hidden = true
    const rec = frames.get(mode.id) ?? makeFrame(mode.id)
    const next = site === null ? '' : mode.src(state())
    currentSrc = next
    display(rec)
    if (rec.stale || !sameUrl(rec.src, next)) navigate(rec, next)
    // Already holding the right document: revealing it fires no `load`, so the
    // announcement has to be made here or nothing downstream rebinds.
    else emit('document', rec.el.contentDocument)
    emit('src', currentSrc)
  }

  function registerMode(spec) {
    if (!spec || typeof spec.id !== 'string' || spec.id === '') {
      throw new Error('registerMode: a mode needs a non-empty string id')
    }
    if (modes.has(spec.id)) throw new Error(`registerMode: duplicate mode "${spec.id}"`)
    if (!spec.src && !spec.mount) {
      throw new Error(`registerMode: mode "${spec.id}" needs either src() or mount()`)
    }
    modes.set(spec.id, spec)
    // The frame exists from REGISTRATION, not from first activation ([[BUG-79]]).
    // An empty iframe costs nothing and it is what `prime` needs something to
    // point at: the channel the operator has not opened yet is loaded behind the
    // one they are looking at, so the FIRST flip is in place too rather than
    // only every flip after it.
    if (spec.src) makeFrame(spec.id)
    // The first registered mode becomes active, so a host never has to sequence
    // register-then-select for the common single-mode case.
    if (activeId === null) {
      activeId = spec.id
      show()
      emit('mode', activeId)
    }
    return api
  }

  function setMode(id) {
    if (!modes.has(id)) throw new Error(`setMode: unknown mode "${id}"`)
    if (id === activeId) return
    activeId = id
    storage?.setItem('mode', id)
    // NOTHING IS INVALIDATED HERE. That omission is the whole of [[BUG-79]]:
    // moving between channels does not make either one's document any less
    // current, so neither is re-fetched and the one being left keeps its layout
    // and its scroll for when the operator comes back.
    show()
    emit('mode', id)
  }

  function setSite(slug) {
    if (slug === site) return
    site = slug
    storage?.setItem('site', slug ?? '')
    // Another site's page is not this page: every frame is now holding the
    // wrong document, whether it is the one on screen or not.
    invalidate()
    show()
    emit('site', site)
  }

  /**
   * Apply persisted site/mode. Called once by the host after every mode is
   * registered — restoring during registration would depend on registration
   * order, which is exactly the coupling the entry model exists to avoid.
   */
  function restore() {
    const savedSite = storage?.getItem('site')
    if (savedSite) setSite(savedSite)
    const savedMode = storage?.getItem('mode')
    if (savedMode && modes.has(savedMode)) setMode(savedMode)
    return api
  }

  const api = {
    element,
    registerMode,
    setMode,
    setSite,
    restore,
    /**
     * The frame the pane is showing, or `null` before anything has been shown.
     *
     * A GETTER since [[BUG-79]], because there is more than one frame now. Its
     * readers are unchanged: every one of them means "the document in front of
     * the operator", which is what this answers.
     */
    get frame() {
      return current?.el ?? null
    },
    /**
     * Re-derive what the pane shows, without the site or the mode having moved
     * ([[REQ-179]]).
     *
     * A mode's `src()` is a function of more than the state this panel holds:
     * `previewUrl` now carries the selected business, so switching business
     * changes the URL for an unchanged slug. Nothing inside the panel can
     * observe that, and `setSite(sameSlug)` is deliberately a no-op — so
     * without this a business switch would leave the frame showing the previous
     * business's page while every other surface had moved.
     *
     * It re-derives; it never rebuilds. It invalidates every frame, because a
     * caller reaching for this is saying the URL it cannot see has moved — and
     * that is as true of the idle frames as of the shown one.
     */
    refresh() {
      invalidate()
      show()
    },
    /**
     * The displayed document has been written to: re-render it, and mark every
     * other frame out of date ([[BUG-79]]).
     *
     * `draft` and `edit` render at request time (REQ-119), so a write is
     * published by re-fetching and there is no artifact to keep in step. That
     * was `frame.contentWindow.location.reload()` at three call sites while
     * there was one frame. With several, "reload the preview" has to mean the
     * one on screen AND a note against the others: a hidden frame must not
     * serve a pre-write render the next time it is shown, and must not pay for
     * a render nobody is looking at either.
     *
     * THE DOCUMENT'S OWN `reload`, as the three call sites always used — kept
     * because it reloads WHERE THE FRAME IS rather than where it was sent. The
     * operator may have followed a link inside it, and re-assigning the mode's
     * `src` would take them back to the page they left, which is the loss this
     * ticket is about wearing another costume. Re-assigning is the fallback for
     * a frame with no reachable window at all.
     */
    reloadDocument() {
      invalidate(current)
      if (!current) return
      current.stale = false
      try {
        const win = current.el.contentWindow
        if (typeof win?.location?.reload === 'function') {
          win.location.reload()
          return
        }
      } catch {
        /* a window that cannot be reached is re-pointed instead */
      }
      navigate(current, current.src)
    },
    getModes: () => [...modes.values()],
    getMode: () => activeId,
    getSite: () => site,
    /**
     * The URL the pane is displaying. "Open in new tab" uses exactly this, so
     * the tab and the iframe can never disagree (DOC-8 §4.3).
     */
    getSrc: () => currentSrc,
    on(event, cb) {
      if (!listeners[event]) throw new Error(`on: unknown event "${event}"`)
      listeners[event].push(cb)
      return () => {
        const i = listeners[event].indexOf(cb)
        if (i >= 0) listeners[event].splice(i, 1)
      }
    },
    destroy() {
      element.remove()
      modes.clear()
      frames.clear()
      current = null
      for (const key of Object.keys(listeners)) listeners[key].length = 0
    },
  }

  return api
}
