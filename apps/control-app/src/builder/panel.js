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
 * A WRITE NEVER RELOADS THE FRAME IN FRONT OF THE OPERATOR ([[BUG-248]]). The
 * newer page loads in a frame behind it, is scrolled to where they are, and is
 * swapped in — so the place they were reading is kept and nothing blanks.
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
 * @property {() => boolean} [offered]             [[REQ-419]] whether the mode toggle
 *   offers it yet (Comparisons, once the comps are raised); absent means always.
 *   The mode is otherwise like any other: switched to, and remembered
 */

/** @typedef {{ site: string | null, mode: string | null }} PanelState */

/** The class every frame carries; the geometry is declared against it. */
const PANE_CLASS = 'builder-panel__pane'
/** The class the SHOWN frame additionally carries. See the header note. */
const SHOWN_CLASS = 'builder-panel__frame'
/** [[REQ-391]] — the two halves of an animated swap, and how long it lasts. */
const LEAVING_CLASS = 'builder-panel__pane--leaving'
const ENTERING_CLASS = 'builder-panel__pane--entering'
const SWAP_MS = 320
/** [[BUG-248]] — the swap a refresh makes: the newer page fades in over the older. */
const REFRESH_SWAP = 'refresh'

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
  /**
   * [[BUG-248]] — the URL a refresh loads: `(url, still) => url`, where `still`
   * asks for the page without its entrance motion. The host's, because the
   * pane knows nothing about what a preview URL can say.
   */
  const stillUrl = options.stillUrl ?? ((url) => url)

  let activeId = null
  /** The timer that ends an animated swap ([[REQ-391]]). */
  let settle = null
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

  /**
   * [[REQ-391]] — frames held BEHIND a mode's own, with a document already in
   * them. A carousel preloads the looks either side of the one shown into these,
   * so moving to one is a swap of frames rather than a navigation, and the swap
   * can be animated because both documents are there to animate between.
   * They belong to the mode they were made for, are laid out like every frame,
   * and never navigate unless asked.
   */
  const spares = []

  /**
   * `register: false` makes a spare — a frame that is no mode's own until
   * {@link swapDocument} makes it one.
   */
  function makeFrame(id, register = true) {
    const el = document.createElement('iframe')
    el.className = PANE_CLASS
    el.setAttribute('title', 'Site preview')
    const rec = { id, el, src: '', stale: true, loaded: false }
    // Per frame rather than one listener on one element, because there is no
    // longer one element — and the announcement is only true of the frame the
    // operator can see.
    el.addEventListener('load', () => {
      rec.loaded = true
      if (current === rec) emit('document', el.contentDocument)
      if (refreshing?.to === rec) finishRefresh()
      prime()
    })
    if (register) frames.set(id, rec)
    else spares.push(rec)
    element.append(el)
    layOut(el)
    return rec
  }

  /**
   * [[BUG-248]] — a refresh under way: the shown frame (`from`), the frame the
   * newer page is loading into behind it (`to`), and where `from` was when it
   * was asked for (`where`, without the flag). `to` is out of `spares` until it
   * is swapped in or dropped, so a carousel preload cannot re-point it.
   */
  let refreshing = null

  /** Every frame there is: each mode's own, the spares, and one being refreshed into. */
  const allFrames = () => [...frames.values(), ...spares, ...(refreshing ? [refreshing.to] : [])]

  /**
   * The width every frame is laid out at, or `null` to fill the pane ([[REQ-388]]).
   *
   * A FIXED WIDTH IS LAID OUT, THEN SCALED — NEVER REFLOWED. The point of
   * choosing *Phone* is that the draft's phone layout is what is on screen, so
   * the frame is given exactly that width whatever the pane is; when the pane is
   * narrower it is shrunk to fit with a transform, which changes how big it looks
   * and not which layout is in force. When the pane is wider it is centred, with
   * the pane's own background either side.
   *
   * EVERY FRAME, NOT THE SHOWN ONE, for [[BUG-79]]'s reason: View and Edit are
   * two frames, and a width that held in one channel and not the other would
   * re-lay the page out under the operator on every flip.
   */
  let fixedWidth = null

  /** What the pane offers, in CSS pixels. */
  function paneSize() {
    return { w: element.clientWidth, h: element.clientHeight }
  }

  /** How much a fixed-width frame is shrunk to fit the pane. 1 when it fits, or when there is none. */
  function scaleOf(width) {
    const { w } = paneSize()
    return width === null || w <= 0 || w >= width ? 1 : w / width
  }

  function layOut(el) {
    const { style } = el
    if (fixedWidth === null) {
      for (const prop of ['width', 'height', 'left', 'right', 'transform', 'transformOrigin']) style[prop] = ''
      return
    }
    const { w, h } = paneSize()
    const scale = scaleOf(fixedWidth)
    style.width = `${fixedWidth}px`
    // Tall enough that, once shrunk, it still fills the pane top to bottom.
    style.height = h > 0 ? `${h / scale}px` : '100%'
    style.right = 'auto'
    style.left = scale < 1 || w <= 0 ? '0px' : `${Math.round((w - fixedWidth) / 2)}px`
    style.transformOrigin = '0 0'
    style.transform = scale < 1 ? `scale(${scale})` : ''
  }

  function layOutAll() {
    for (const f of allFrames()) layOut(f.el)
  }

  // The pane is resized by the divider and the window, and a shrunk frame has to
  // follow it. Absent `ResizeObserver` (a test DOM) the host re-fits by calling
  // `setViewport` again, which is the whole of what a resize does.
  const resizes = typeof ResizeObserver === 'function' ? new ResizeObserver(() => layOutAll()) : null
  resizes?.observe(element)

  /** Show this frame and hide every other. `null` hides them all (a mount mode). */
  function display(rec) {
    for (const f of allFrames()) f.el.classList.toggle(SHOWN_CLASS, f === rec)
    if (rec) current = rec
  }

  /**
   * Point a frame somewhere. The one call that navigates.
   *
   * NOWHERE IS `about:blank`, NEVER AN EMPTY `src` ([[BUG-207]]). A pane with no
   * site to show — a business with no sites — asks for `''`, and a browser does
   * not unload a frame for an empty `src`: it keeps the document it held, which
   * after leaving an entered business is ANOTHER CUSTOMER'S SITE. `rec.src`
   * still records `''`, so "nothing shown" reads the same to everything else.
   */
  function navigate(rec, url, actual = url) {
    rec.src = url
    rec.stale = false
    rec.loaded = false
    rec.el.setAttribute('src', actual === '' ? 'about:blank' : actual)
  }

  /**
   * Where a frame's document actually is — it may have followed a link since it
   * was pointed anywhere — or `null` when that cannot be read.
   */
  function locationOf(rec) {
    try {
      const href = rec.el.contentWindow?.location?.href
      return typeof href === 'string' && href !== '' && href !== 'about:blank' ? href : null
    } catch {
      return null
    }
  }

  /** The two halves of an animated swap ([[REQ-391]]), cleared once it has run. */
  function animate(outgoing, incoming, direction) {
    for (const rec of [outgoing, incoming]) {
      rec.el.classList.remove(LEAVING_CLASS, ENTERING_CLASS)
      rec.el.dataset.swap = direction
    }
    outgoing.el.classList.add(LEAVING_CLASS)
    incoming.el.classList.add(ENTERING_CLASS)
    clearTimeout(settle)
    settle = setTimeout(() => {
      for (const rec of [outgoing, incoming]) rec.el.classList.remove(LEAVING_CLASS, ENTERING_CLASS)
    }, SWAP_MS)
  }

  /** Abandon a refresh under way; its frame goes back to the spares, out of date. */
  function dropRefresh() {
    if (!refreshing) return
    refreshing.to.stale = true
    spares.push(refreshing.to)
    refreshing = null
  }

  /**
   * The newer page has loaded behind the shown one ([[BUG-248]]): put it where
   * the reader is, and swap it in.
   *
   * THE SCROLL IS READ NOW, NOT WHEN THE REFRESH WAS ASKED FOR, so a reader who
   * kept scrolling while it loaded lands where they are rather than where they
   * were. The browser clamps it to the new page's height.
   *
   * A READER WHO LEFT THE PAGE meanwhile — followed a link inside it — is on a
   * page loaded after the write, so the refresh is dropped rather than taking
   * them back.
   */
  function finishRefresh() {
    const { from: outgoing, to: incoming, where } = refreshing
    refreshing = null
    const now = stillUrl(locationOf(outgoing) ?? outgoing.src, false)
    if (current !== outgoing || !sameUrl(now, where)) {
      incoming.stale = true
      spares.push(incoming)
      return
    }
    try {
      const from = outgoing.el.contentWindow
      incoming.el.contentWindow?.scrollTo({ left: from?.scrollX ?? 0, top: from?.scrollY ?? 0, behavior: 'instant' })
    } catch {
      /* a document that cannot be read or scrolled is shown from its top */
    }
    onBeforeNavigate?.()
    outgoing.stale = true
    spares.push(outgoing)
    frames.set(outgoing.id, incoming)
    animate(outgoing, incoming, REFRESH_SWAP)
    display(incoming)
    emit('document', incoming.el.contentDocument)
  }

  /**
   * Mark every frame's content out of date, so the next mode that shows one
   * re-renders rather than serving what it happened to be holding.
   */
  function invalidate(except = null) {
    for (const f of allFrames()) if (f !== except) f.stale = true
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
    dropRefresh()
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

  function setMode(id, { remember = true } = {}) {
    if (!modes.has(id)) throw new Error(`setMode: unknown mode "${id}"`)
    if (id === activeId) return
    activeId = id
    // [[REQ-408]] — `remember: false` is a mode the HOST chose (Story, before the
    // first draft), which the next visit should not reopen as the client's own.
    if (remember) storage?.setItem('mode', id)
    // NOTHING IS INVALIDATED HERE. That omission is the whole of [[BUG-79]]:
    // moving between channels does not make either one's document any less
    // current, so neither is re-fetched and the one being left keeps its layout
    // and its scroll for when the operator comes back.
    show()
    emit('mode', id)
  }

  function setSite(next) {
    if (next === site) return
    site = next
    storage?.setItem('site', next ?? '')
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
     * The shown frame has not yet loaded what it was last pointed at ([[BUG-207]]).
     * While it is, `frame.contentWindow` is still the document being left, so
     * nothing read off it describes what the pane is about to show.
     */
    get loading() {
      return current ? !current.loaded : false
    },
    /**
     * Re-derive what the pane shows, without the site or the mode having moved
     * ([[REQ-179]]).
     *
     * A mode's `src()` is a function of more than the state this panel holds:
     * `previewUrl` now carries the selected business, so switching business
     * changes the URL for an unchanged site. Nothing inside the panel can
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
     * Point the displayed frame at `url` — the chrome doing what a link inside
     * the render does ([[REQ-248]]).
     *
     * IT NAVIGATES RATHER THAN RE-DERIVING. `refresh()` recomposes every mode's
     * `src` from the state around the pane, and that state is read from the
     * OUTGOING document — so asking it to move to another page would compose the
     * page being left. This says where to go and lets everything downstream
     * follow the arrival, which is what a link already does.
     *
     * THE OTHER CHANNELS ARE MARKED OUT OF DATE, not re-pointed. They are now
     * holding a different page, and re-rendering one for nobody is exactly the
     * cost `reloadDocument` declines; `prime` re-points them behind the visible
     * page once it has arrived, on the path it has always used.
     *
     * `currentSrc` MOVES WITH IT, so "open in new tab" lands on the page the
     * operator is actually looking at rather than the one the mode resolved to.
     */
    navigateDocument(url) {
      if (!current) return
      dropRefresh()
      invalidate(current)
      navigate(current, url)
      currentSrc = url
      emit('src', currentSrc)
    },
    /**
     * [[REQ-391]] — load `urls` into spare frames behind the displayed one, so
     * that {@link swapDocument} to any of them is instant. A url the displayed
     * frame or a spare already holds is not loaded again; a spare holding none
     * of them is re-used before another is made.
     */
    preload(urls) {
      if (!current) return
      const owned = spares.filter((r) => r.id === current.id)
      for (const url of urls) {
        if (!url || sameUrl(current.src, url)) continue
        if (owned.some((r) => !r.stale && sameUrl(r.src, url))) continue
        const free = owned.find((r) => !urls.some((u) => !r.stale && sameUrl(r.src, u)))
        const rec = free ?? makeFrame(current.id, false)
        if (!free) owned.push(rec)
        navigate(rec, url)
      }
    },
    /**
     * [[REQ-391]] — show `url` in place of the displayed document, ANIMATED: the
     * outgoing frame leaves and the incoming one arrives (`direction` is
     * `'next'` or `'previous'`, which side it comes from). A spare already
     * holding `url` is swapped in, so a preloaded document appears at once; any
     * other is navigated first. The incoming frame becomes the mode's own and
     * the outgoing one becomes a spare, still holding its document, so going
     * back is instant too.
     *
     * THE ANIMATION IS CSS'S, and so is honouring reduced motion: the two
     * classes below declare it, and a reader who asked for less motion gets an
     * instant swap from the same classes.
     */
    swapDocument(url, direction = 'next') {
      if (!current) return
      const outgoing = current
      if (sameUrl(outgoing.src, url) && !outgoing.stale) return
      dropRefresh()
      onBeforeNavigate?.()
      let incoming = spares.find((r) => r.id === outgoing.id && !r.stale && sameUrl(r.src, url))
      if (!incoming) {
        incoming = spares.find((r) => r.id === outgoing.id) ?? makeFrame(outgoing.id, false)
        navigate(incoming, url)
      }
      spares.splice(spares.indexOf(incoming), 1)
      spares.push(outgoing)
      frames.set(outgoing.id, incoming)
      animate(outgoing, incoming, direction)
      display(incoming)
      currentSrc = url
      emit('src', currentSrc)
      if (incoming.loaded) emit('document', incoming.el.contentDocument)
    },
    /**
     * The displayed document has been written to: re-render it, and mark every
     * other frame out of date ([[BUG-79]]).
     *
     * `draft` and `edit` render at request time (REQ-119), so a write is
     * published by re-fetching and there is no artifact to keep in step. A
     * hidden frame must not serve a pre-write render the next time it is shown,
     * and must not pay for a render nobody is looking at either — so the others
     * are only noted.
     *
     * THE NEWER PAGE LOADS BEHIND THE SHOWN ONE AND IS SWAPPED IN ([[BUG-248]]).
     * Reloading in place blanked the pane, lost the reader's place and replayed
     * every entrance. It loads WHERE THE FRAME IS rather than where it was sent —
     * the operator may have followed a link inside it — scrolled to where they
     * are (see {@link finishRefresh}). `still` (the default) asks for the page
     * without its entrance motion: a refresh is the same page, newer, and the
     * motion was seen when it was opened. `still: false` is the reader asking to
     * see it again.
     *
     * A refresh asked for while one is loading re-points the same frame, so the
     * newest page is the one swapped in.
     */
    reloadDocument({ still = true } = {}) {
      invalidate(current)
      if (!current) return
      // A mode with no frame is showing (the story board): the frame is only
      // noted, and re-renders when it is shown again.
      if (modes.get(activeId)?.mount) {
        current.stale = true
        return
      }
      current.stale = false
      // A FRAME STILL ON ITS WAY SOMEWHERE IS RE-POINTED ([[BUG-207]]). Until it
      // has loaded, its window is the document being LEFT — after a site
      // switch, the previous site — so where it "is" is not the page. What it
      // was asked for is.
      if (!current.loaded) {
        dropRefresh()
        navigate(current, current.src)
        return
      }
      const outgoing = current
      const where = stillUrl(locationOf(outgoing) ?? outgoing.src, false)
      let incoming = refreshing?.from === outgoing ? refreshing.to : null
      if (!incoming) {
        dropRefresh()
        incoming = spares.find((r) => r.id === outgoing.id && r.stale) ?? makeFrame(outgoing.id, false)
        spares.splice(spares.indexOf(incoming), 1)
      }
      refreshing = { from: outgoing, to: incoming, where }
      navigate(incoming, outgoing.src, stillUrl(where, still))
    },
    /**
     * Lay the draft out at `width` CSS pixels, or fill the pane with `null`
     * ([[REQ-388]]). See {@link fixedWidth}.
     */
    setViewport(width) {
      fixedWidth = typeof width === 'number' && Number.isFinite(width) && width > 0 ? width : null
      element.classList.toggle('builder-panel--fixed', fixedWidth !== null)
      layOutAll()
    },
    /**
     * The width the draft is LAID OUT at and how much of it is visible, in the
     * draft's own CSS pixels ([[REQ-388]]) — what the client is actually looking
     * at, which is what the assistant is told. A fixed width is its own width
     * whatever the pane is; filling the pane is the pane's.
     */
    viewport() {
      const { w, h } = paneSize()
      const scale = scaleOf(fixedWidth)
      return { width: fixedWidth ?? w, height: Math.round(h / scale) }
    },
    getModes: () => [...modes.values()],
    getMode: () => activeId,
    getSite: () => site,
    /**
     * The URL the pane is displaying.
     *
     * IT IS WHAT THE PANE SHOWS AND NOTHING WIDER ([[BUG-131]]). It used to
     * carry a second claim — that "open in new tab" uses exactly this, so the
     * tab and the iframe can never disagree — and that claim was true of one
     * channel and wrong of two: the edit render is deliberately non-functional,
     * so the honest tab for it is the draft render of the same page. Which
     * channel a tab should open is the toolbar action's question ([[DOC-8]]
     * §3.3, the production-fidelity check); this answers only where the pane is,
     * which is what that action derives the page from.
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
      resizes?.disconnect()
      element.remove()
      modes.clear()
      frames.clear()
      spares.length = 0
      current = null
      for (const key of Object.keys(listeners)) listeners[key].length = 0
    },
  }

  return api
}
