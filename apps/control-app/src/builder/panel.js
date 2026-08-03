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
 *   2. Switching modes does NOT rebuild the pane. The root element and the
 *      iframe are created once at mount and live for the panel's lifetime;
 *      `setMode` changes the frame's `src`, so scroll context, layout, and the
 *      surrounding split are untouched. This is what makes View↔Edit a swap
 *      rather than a remount.
 *
 * A mode that renders something other than a document supplies `mount(host)`
 * instead of `src(state)`; the frame is hidden and a host element is used
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

export function createDisplayPanel(options = {}) {
  const element = document.createElement('div')
  element.className = 'builder-panel'

  const frame = document.createElement('iframe')
  frame.className = 'builder-panel__frame'
  frame.setAttribute('title', 'Site preview')

  const host = document.createElement('div')
  host.className = 'builder-panel__host'
  host.hidden = true

  element.append(frame, host)

  /** @type {Map<string, ModeSpec>} */
  const modes = new Map()
  const listeners = { mode: [], src: [], site: [] }
  const storage = options.storage ?? null

  let activeId = null
  let site = options.site ?? null
  let currentSrc = ''

  const state = () => ({ site, mode: activeId })

  function emit(event, value) {
    for (const cb of listeners[event].slice()) cb(value)
  }

  /** Re-derive what the pane shows from the active mode. Never rebuilds it. */
  function refresh() {
    const mode = activeId === null ? null : modes.get(activeId)
    if (!mode) return
    if (mode.mount) {
      frame.hidden = true
      host.hidden = false
      host.replaceChildren()
      mode.mount(host, state())
      currentSrc = ''
    } else {
      host.hidden = true
      frame.hidden = false
      const next = site === null ? '' : mode.src(state())
      currentSrc = next
      // Re-assigning an unchanged src would reload the document for nothing.
      if (frame.getAttribute('src') !== next) frame.setAttribute('src', next)
    }
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
    // The first registered mode becomes active, so a host never has to sequence
    // register-then-select for the common single-mode case.
    if (activeId === null) {
      activeId = spec.id
      refresh()
      emit('mode', activeId)
    }
    return api
  }

  function setMode(id) {
    if (!modes.has(id)) throw new Error(`setMode: unknown mode "${id}"`)
    if (id === activeId) return
    activeId = id
    storage?.setItem('mode', id)
    refresh()
    emit('mode', id)
  }

  function setSite(slug) {
    if (slug === site) return
    site = slug
    storage?.setItem('site', slug ?? '')
    refresh()
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
    frame,
    registerMode,
    setMode,
    setSite,
    restore,
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
      for (const key of Object.keys(listeners)) listeners[key].length = 0
    },
  }

  return api
}
