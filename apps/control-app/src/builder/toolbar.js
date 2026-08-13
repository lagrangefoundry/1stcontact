/**
 * The builder toolbar (DOC-28 §10) — mode-aware by construction.
 *
 * The toolbar does not assume an iframe beneath it. It renders the controls the
 * ACTIVE MODE declares (`mode.actions`), so a mode that shows something other
 * than a document simply does not list "open in new tab" and the control is not
 * rendered. Adding a control is registering an action spec and naming it from a
 * mode; nothing here branches on which mode is active.
 *
 * The root element is created once and reused: a mode change re-populates the
 * strip, it never replaces the toolbar (which would drop it out of the layout
 * and lose focus).
 */

/**
 * @typedef {object} ActionSpec
 * @property {string} id
 * @property {(ctx: ActionContext) => HTMLElement} create
 */

/** @typedef {{ panel: object, api: object, subscribe: (event: string, cb: Function) => Function }} ActionContext */

export function createToolbar(options) {
  const { panel, actions, context = {} } = options

  const element = document.createElement('div')
  element.className = 'builder-toolbar'
  element.setAttribute('role', 'toolbar')

  /** @type {Map<string, ActionSpec>} */
  const registry = new Map()
  for (const spec of actions ?? []) registry.set(spec.id, spec)

  /** Live handles keyed by action id, so actions can refresh themselves. */
  const mounted = new Map()

  /**
   * Panel unsubscribes owned by the CURRENT set of rendered actions.
   *
   * An action that keeps itself in sync (the "open in new tab" href tracks
   * `src`) has to subscribe to the panel, but `render` throws its element away
   * on every mode and site change. Subscribing directly would leave the old
   * callback registered against a detached node — and since the strip re-renders
   * on exactly the events those callbacks listen for, the pile grows for as long
   * as the builder is open, every entry writing to an element no longer in the
   * document. Routing through {@link subscribe} makes the subscription's
   * lifetime the element's lifetime, which is what it was always meant to be.
   */
  let actionCleanups = []

  /** Subscribe on behalf of the action being created; disposed with it. */
  function subscribe(event, cb) {
    const off = panel.on(event, cb)
    actionCleanups.push(off)
    return off
  }

  function disposeActions() {
    for (const off of actionCleanups) off()
    actionCleanups = []
    mounted.clear()
    element.replaceChildren()
  }

  function render() {
    const mode = panel.getModes().find((m) => m.id === panel.getMode())
    const ids = mode?.actions ?? []
    disposeActions()
    for (const id of ids) {
      const spec = registry.get(id)
      if (!spec) throw new Error(`toolbar: mode "${mode?.id}" names unknown action "${id}"`)
      const el = spec.create({ panel, ...context, toolbar: api, subscribe })
      el.dataset.action = id
      mounted.set(id, el)
      element.append(el)
    }
  }

  /** Toolbar-level subscriptions — released by {@link api.destroy}, not by a render. */
  let offPanel = []

  const api = {
    element,
    render,
    get: (id) => mounted.get(id) ?? null,
    ids: () => [...mounted.keys()],
    /**
     * Release everything this toolbar holds. Called by the composition's own
     * `destroy` so a remount does not stack a second strip's worth of listeners
     * on a panel that outlives it.
     */
    destroy() {
      for (const off of offPanel) off()
      offPanel = []
      disposeActions()
      element.remove()
    },
  }

  // Re-render on every mode change; the strip is derived state, never manual.
  offPanel = [panel.on('mode', render), panel.on('site', render)]
  render()

  return api
}

// ── the T1 action set ────────────────────────────────────────────────────────

/**
 * Site selector — switches which site's draft the pane shows. Populated from
 * the sites the store actually holds, never a hardcoded list.
 *
 * `label` is injected rather than written here: it names the same thing the tab
 * names, and that name has exactly one definition (`config.js`). Taking it as a
 * parameter also keeps this module free of app-specific naming.
 */
export function siteSelectorAction(sites, label) {
  return {
    id: 'site-selector',
    create({ panel }) {
      const select = document.createElement('select')
      select.className = 'builder-toolbar__site'
      select.setAttribute('aria-label', label)
      for (const { slug } of sites) {
        const opt = document.createElement('option')
        opt.value = slug
        opt.textContent = slug
        select.append(opt)
      }
      if (panel.getSite()) select.value = panel.getSite()
      select.addEventListener('change', () => panel.setSite(select.value))
      return select
    },
  }
}

/** View/Edit toggle — one button per registered mode; swaps the render channel. */
export function modeToggleAction() {
  return {
    id: 'mode-toggle',
    create({ panel }) {
      const group = document.createElement('div')
      group.className = 'builder-toolbar__modes'
      group.setAttribute('role', 'group')
      for (const mode of panel.getModes()) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.dataset.mode = mode.id
        btn.textContent = mode.label
        btn.setAttribute('aria-pressed', String(mode.id === panel.getMode()))
        btn.addEventListener('click', () => panel.setMode(mode.id))
        group.append(btn)
      }
      return group
    },
  }
}

/**
 * Open in new tab — points at the SAME url the iframe loads. An iframe can
 * distort layout, so a real tab is the honest view (DOC-28 §10); it is only
 * meaningful for a mode that shows a document, which is why modes opt in.
 */
export function openInNewTabAction() {
  return {
    id: 'open-new-tab',
    create({ panel, subscribe }) {
      const link = document.createElement('a')
      link.className = 'builder-toolbar__open'
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = 'Open in new tab'
      const sync = () => link.setAttribute('href', panel.getSrc())
      sync()
      // Through the toolbar, so the subscription dies with this element rather
      // than outliving it on the panel — see `actionCleanups`.
      subscribe('src', sync)
      return link
    },
  }
}

/**
 * Colors — opens the palette popup in manage mode (REQ-133 §1).
 *
 * ONE MORE ACTION SPEC, not a branch. The toolbar renders whatever the active
 * mode names, so this is registered exactly like the others and appears wherever
 * a mode lists it — which is both channels, because a palette is a property of
 * the site rather than of one rendering of it.
 *
 * It is deliberately NOT a display-panel mode: the popup has a second entry
 * point (a color field opening it to pick a value), and a mode cannot be opened
 * by a modal that is waiting for an answer. Same surface, two callers.
 */
export function colorsAction(openPalette) {
  return {
    id: 'colors',
    create({ panel }) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'builder-toolbar__colors'
      btn.textContent = 'Colors'
      btn.addEventListener('click', () => {
        const slug = panel.getSite()
        if (!slug) return
        // Nothing awaits the answer: manage mode resolves to null by
        // construction, and the caller that DOES want a value is a color
        // field, not this button.
        void openPalette(slug)
      })
      return btn
    },
  }
}

/**
 * Publish — a thin call over the existing `publish` (DOC-12 §5): snapshot, diff,
 * append to history, render. No new publish semantics live here.
 */
export function publishAction(publish) {
  return {
    id: 'publish',
    create({ panel }) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'builder-toolbar__publish'
      btn.textContent = 'Publish'
      btn.addEventListener('click', async () => {
        const slug = panel.getSite()
        if (!slug) return
        btn.disabled = true
        try {
          await publish(slug)
        } finally {
          btn.disabled = false
        }
      })
      return btn
    },
  }
}
