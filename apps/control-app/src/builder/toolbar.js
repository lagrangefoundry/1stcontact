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

/**
 * @typedef {{
 *   panel: object,
 *   getSite: () => string|null,
 *   api: object,
 *   subscribe: (event: string, cb: Function) => Function,
 *   cleanup: (off: Function) => Function,
 * }} ActionContext
 */

/**
 * The site an action acts on, when the host supplied no `getSite` ([[REQ-179]]).
 *
 * A toolbar is a tab's control strip, and an action must never discover the
 * SCOPE by asking the pane — that is the sideways reach this ticket removed, and
 * a default that quietly did it would put the pattern back one action at a time.
 * So the fallback is "no site", which makes an unwired action visibly inert
 * rather than plausibly wrong: `colors` and `publish` both decline on a null
 * site key already, so a host that forgot to supply the scope gets buttons that do
 * nothing instead of buttons that act on whatever the pane happens to show.
 */
const NO_SITE = () => null

export function createToolbar(options) {
  const { panel, actions, context = {} } = options
  // Supplied by the host, which is the module that knows the scope. See NO_SITE.
  const getSite = context.getSite ?? NO_SITE

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

  /**
   * Give an action's element the same lifetime for a release that is NOT a panel
   * subscription ([[REQ-252]]).
   *
   * {@link subscribe} exists because the strip re-renders on exactly the events
   * its controls listen for, so a subscription outliving its element writes to a
   * detached node forever. That reasoning has nothing to do with the panel — it
   * is about the element's lifetime — and a control subscribing to anything else
   * (the page index's listing, say) needs the same guarantee without having to
   * keep its own list to be disposed from somewhere the toolbar cannot see.
   */
  function cleanup(off) {
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
      const el = spec.create({ panel, ...context, getSite, toolbar: api, subscribe, cleanup })
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
 * THERE IS NO SITE SELECTOR HERE ANY MORE ([[REQ-179]]).
 *
 * There was, and it was the one place a site was chosen — which is the right
 * rule and was the wrong place. A toolbar belongs to one tab, so a scope chosen
 * in it scopes one tab, and every other tab had to reach sideways into the site
 * tab's panel to discover what was selected. The business is what everything
 * belongs to ([[DOC-40]] §2), so its control moved up into the shell's own
 * chrome, where every tab is already inside it (`business.js`).
 *
 * IT WAS DELETED RATHER THAN LEFT BESIDE THE NEW ONE. Two controls that can
 * disagree about the same scope is precisely what the old rule forbade, and
 * keeping this one "for now" would have been that state, chosen deliberately.
 *
 * A SITE selector will be back, one level down, when a business can hold several
 * sites — subordinate to the business switcher, inside the site tab, where a
 * per-tab control is the correct shape. `panel.getSite()` becomes meaningful
 * again at that point; today it is display state and nothing reads it to
 * discover a scope.
 */

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
 * Open in new tab — the DRAFT render of the page the pane is on (DOC-28 §10).
 *
 * An iframe can distort layout, so a real tab is the honest view — and that is
 * a claim about the *production* render, which is the one thing the tab has to
 * be for the control to mean anything ([[DOC-8]] §3.3, the same action framed
 * as a production-fidelity check). It is only meaningful for a mode that shows
 * a document, which is why modes opt in.
 *
 * IT IS NOT `panel.getSrc()` ([[BUG-131]]). "The same URL the iframe loads" was
 * right while there was one channel and became wrong when [[REQ-116]] added the
 * second: the edit channel is a deliberately crippled render — every region
 * outlined, addresses stamped on the markup, every panel open at once, no link
 * target, no form action and no client script at all — so opening THAT in a tab
 * hands the operator the editor's scaffolding with no editor attached to it, and
 * inverts the one purpose the control has. In Edit the tab and the iframe
 * **must** disagree, and this is where they do.
 *
 * THE HOST SAYS WHICH RENDER IS THE HONEST ONE. `honestUrl` maps the pane's
 * current URL onto the production channel; naming `draft` in here would put a
 * channel name in a module that otherwise knows only about strips and buttons,
 * and `app.js` is already the one place that composes channel URLs.
 *
 * THE HREF STILL TRACKS NAVIGATION. It is re-derived on the pane's `src` event,
 * so moving between pages — in either channel — re-points the link at that
 * page's draft render rather than freezing it on the first one.
 *
 * @param {(src: string) => string} honestUrl the production render of this URL
 */
export function openInNewTabAction(honestUrl) {
  return {
    id: 'open-new-tab',
    create({ panel, subscribe }) {
      const link = document.createElement('a')
      link.className = 'builder-toolbar__open'
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = 'Open in new tab'
      const sync = () => link.setAttribute('href', honestUrl(panel.getSrc()))
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
    create({ getSite }) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'builder-toolbar__colors'
      btn.textContent = 'Colors'
      btn.addEventListener('click', () => {
        const site = getSite()
        if (!site) return
        // Nothing awaits the answer: manage mode resolves to null by
        // construction, and the caller that DOES want a value is a color
        // field, not this button.
        void openPalette(site)
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
    create({ getSite }) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'builder-toolbar__publish'
      btn.textContent = 'Publish'
      btn.addEventListener('click', async () => {
        const site = getSite()
        if (!site) return
        btn.disabled = true
        try {
          await publish(site)
        } finally {
          btn.disabled = false
        }
      })
      return btn
    },
  }
}

/**
 * The panel selector — which of this page's modals the edit render is showing
 * ([[REQ-215]]).
 *
 * IT IS AN ESCAPE HATCH AND AN ENTRANCE IN ONE. A modal reproduced in Edit
 * covers the page and every control in that render is inert, including the
 * panel's own Close — so without this, an operator who switched to Edit with a
 * panel open could leave it only by switching back to View, closing it there and
 * switching again. The same control is also how you reach the copy inside a
 * modal you never opened in View at all.
 *
 * IT READS THE PAGE, NOT THE DEFINITION. The panels come from the rendered
 * document, so it needs nothing new from the renderer and cannot offer a panel
 * the render in front of the operator does not have. A page that declares none
 * shows no control rather than an empty one.
 *
 * PICKING ONE DOES NOT RELOAD. Applying a state to the edit render is two
 * attributes on a document that is already there, so the panel appears at once
 * and the operator does not lose their place to see it.
 */
export function panelsAction(carry) {
  return {
    id: 'panels',
    create({ panel, subscribe }) {
      const wrap = document.createElement('label')
      wrap.className = 'builder-toolbar__panels'
      const caption = document.createElement('span')
      caption.textContent = 'Panel'
      const select = document.createElement('select')
      wrap.append(caption, select)

      const sync = (doc) => {
        const entries = doc ? carry.listDialogs(doc) : []
        wrap.hidden = entries.length === 0
        select.replaceChildren(new Option('No panel', ''))
        for (const entry of entries) select.append(new Option(entry.label, entry.id))
        // Assign, then read back: a carried id the current page no longer
        // declares leaves the select on its first option, and taking the value
        // FROM the select rather than from what we asked for is what keeps the
        // control and the carry from disagreeing about a panel that is gone.
        select.value = carry.openDialog()
        if (select.value !== carry.openDialog()) carry.setOpenDialog(select.value)
      }
      sync(panel.frame.contentDocument)
      // Through the toolbar, so the subscription dies with this element — the
      // strip is rebuilt on every mode and site change and this is created anew
      // each time.
      subscribe('document', sync)

      select.addEventListener('change', () => {
        carry.setOpenDialog(select.value)
        carry.apply(panel.frame.contentWindow)
      })
      return wrap
    },
  }
}

/**
 * How a row of the page listing reads, by the KIND the listing gave it
 * ([[REQ-252]]).
 *
 * A TABLE AND NOT A BRANCH, because the listing already decided what this page
 * is — `editPageList` puts `kind` on every row deliberately, `'web'` included,
 * so that no reader has to infer it from the shape of anything else. Naming the
 * kinds here is what makes a third one a row in this object rather than a second
 * opinion about what a page is, held in a control that has no business having
 * one.
 *
 * THE PREFIX IS WHAT DISTINGUISHES A MESSAGE FROM A PAGE OF THE SAME NAME. A
 * site can hold `Your two XGD papers` as both the page a recipient lands on and
 * the mail that sends them there, and a list naming both identically is a list
 * where choosing the wrong one is the operator's fault rather than the control's.
 * A web page carries no prefix, because "this is an ordinary page" is what the
 * absence of a mark has always meant here and a label on every row would make
 * the marked ones no longer stand out.
 *
 * AND `stranded` IS WHY IT HAS NO ADDRESS, not merely that it has none. A
 * message is reached by the form that sends it, never by a link, so "unreachable"
 * about a message describes a page that is working correctly and sends its
 * author looking for a link they must never add. `editPageList`'s own
 * human-readable form draws exactly this distinction; this is the control saying
 * the same thing.
 *
 * AN UNKNOWN KIND READS AS A WEB PAGE. A listing from an origin newer than this
 * client is a real possibility and the honest fallback is the unmarked one: a
 * page named without a claim about what it is, rather than a row labelled with a
 * word this build does not understand.
 */
const KINDS = {
  web: { prefix: '', stranded: 'unreachable' },
  email: { prefix: 'Email: ', stranded: 'no form sends it' },
}

/**
 * The page selector — which page of the site the pane is showing ([[REQ-248]]).
 *
 * IT IS THE ONLY WAY TO REACH AN UNLINKED PAGE. Moving between pages means
 * clicking a link inside the render, so a page nothing links to could not be
 * opened at all — it appeared in no list and could be clicked from nowhere, and
 * the assistant could not point anyone at it either. That is why this control
 * exists, and why it lists every page rather than the navigable ones.
 *
 * AND IT SAYS WHICH THOSE ARE. An unreachable page is either deliberate — a
 * gated landing page — or a mistake nobody has noticed, and the two are
 * indistinguishable until something says so. The mark is the point of the
 * control rather than a decoration on it, so it is stated in the row's own text
 * rather than in a colour or a title attribute nobody hovers.
 *
 * IT NEVER HIDES ITSELF, which is where it parts company with the panel
 * selector beside it. That one is about what THIS PAGE offers and has nothing to
 * say about a page with no modals. This one answers *where am I* as well as
 * *where else could I be*, and a site with one page still has the first
 * question — a control that vanished there would answer neither.
 *
 * A PAGE THE LISTING DOES NOT HOLD IS STILL NAMED. The render is the truth about
 * what the operator is looking at; a page deleted or renamed since the listing
 * was taken is still on screen, and a control that quietly named some other page
 * would be the one thing this must never do. So the shown page is admitted to
 * the list as its own row rather than silently dropped — the same end
 * `panelsAction`'s assign-then-read-back reaches, by making the assignment
 * impossible to lose instead of by detecting that it was.
 */
export function pagesAction(pages) {
  return {
    id: 'pages',
    create({ panel, subscribe }) {
      const wrap = document.createElement('label')
      wrap.className = 'builder-toolbar__pages'
      const caption = document.createElement('span')
      caption.textContent = 'Page'
      const select = document.createElement('select')
      wrap.append(caption, select)

      /**
       * What an operator recognises the page by: its title, and failing that
       * something that is at least an address. An untitled page listed as an
       * empty row is a row nobody can choose on purpose.
       */
      const nameOf = (row) =>
        String(row.title ?? '').trim() ||
        String(row.slug ?? '').trim() ||
        String(row.id ?? '')

      const labelOf = (row) => {
        const kind = KINDS[String(row.kind ?? '')] ?? KINDS.web
        const named = `${kind.prefix}${nameOf(row)}`
        return row.reachable === false ? `${named} — ${kind.stranded}` : named
      }

      const sync = () => {
        const rows = pages.list()
        const here = pages.current()
        const options = rows.map((row) => new Option(labelOf(row), row.slug))
        if (here !== '' && !rows.some((row) => row.slug === here)) {
          options.unshift(new Option(here, here))
        }
        // A site with no pages at all has nothing to offer and nothing to
        // report; every other site, including a one-page one, keeps the control.
        wrap.hidden = options.length === 0
        select.replaceChildren(...options)
        select.value = here
      }

      sync()
      // Re-taken on every document the pane shows, which is what makes a page
      // added while the tab is open choosable without a reload: the assistant's
      // write reloads the render, and the listing is re-read with it.
      const reload = () => {
        // The document in front of the operator is now the answer to "which
        // page", superseding whatever this control last asked for.
        pages.arrived()
        void pages.refresh().then(() => {
          // The strip is rebuilt on every mode and site change, so a listing
          // that arrives after this control was thrown away belongs to a select
          // nobody can see. `disposeActions` empties the strip, which is what
          // takes this element's parent away — the same lifetime
          // `actionCleanups` gives every subscription, applied to the one thing
          // here that is not one.
          if (wrap.parentNode !== null) sync()
        })
      }
      reload()
      // Through the toolbar, so both subscriptions die with this element.
      subscribe('document', reload)
      // The pane moved — a channel switch, or this control's own navigation.
      subscribe('src', sync)

      select.addEventListener('change', () => pages.open(select.value))
      return wrap
    },
  }
}

/**
 * The subject line — what a message arrives as ([[REQ-252]]).
 *
 * IT IS THE ONE PART OF A MESSAGE THAT IS NOT IN THE BODY. Every other word an
 * email page holds is copy in the render, reachable by clicking it; the subject
 * is page metadata, so before this there was nowhere in the builder it appeared
 * at all and an operator could neither read what their contacts were receiving
 * nor change it. It is also the first thing a recipient reads, which makes "not
 * shown anywhere" the wrong place for it to be.
 *
 * IN THE STRIP AND NOT BEHIND A SURFACE OF ITS OWN. The alternative was a
 * page-properties panel, and there is none in this builder to put it in — so a
 * subject field would have arrived with a panel wrapped around it, and the one
 * field an operator wants while looking at the message would be two clicks away
 * from the message. Here it sits beside the copy it belongs to, visible without
 * being asked for, which is the whole of what was missing.
 *
 * ONLY IN EDIT, and that is the mode declaring it rather than this control
 * checking. View must behave exactly as published (DOC-28 §7.1), and a box that
 * writes to the draft is not that. Naming it from one mode is the same
 * enforcement `mark-points` and `panels` get, and it means there is no channel
 * in which the field is present and inert.
 *
 * ONLY ON A MESSAGE. A web page has no subject and never will, so the control
 * hides itself rather than showing a disabled box — the same call `panelsAction`
 * makes for a page with no modals, and for the same reason: a permanently empty
 * control teaches an operator to stop reading that part of the strip.
 *
 * IT READS THE LISTING THE PAGE CONTROL ALREADY HOLDS. The subject travels on
 * the row — `editPageList` puts the whole `email` block there — so this needs no
 * request of its own to draw, and cannot draw a subject the control beside it
 * disagrees about. It re-reads on the same two events, so moving to another page
 * moves the field with it.
 *
 * AND IT SHOWS WHAT CAME BACK. Clearing the box does not store nothing — the
 * command puts the page's title there instead, because a message with no subject
 * line is not a thing this product sends — so the field is filled from the
 * write's own answer rather than from what was typed into it. An operator who
 * clears it watches the title appear, which is the honest report of what a
 * recipient will now read.
 *
 * @param pages the page index ([[REQ-248]]), for the listing and which row is shown
 * @param save  `(site, pageId, subject) => Promise<{page}>` — the write
 */
export function subjectAction(pages, save) {
  return {
    id: 'subject',
    create({ getSite, subscribe, cleanup }) {
      const wrap = document.createElement('label')
      wrap.className = 'builder-toolbar__subject'
      const caption = document.createElement('span')
      caption.textContent = 'Subject'
      const input = document.createElement('input')
      input.type = 'text'
      input.placeholder = 'What it arrives as'
      wrap.append(caption, input)

      /** The row the pane is showing, or null when that is not a message. */
      const mailed = () => {
        const here = pages.current()
        const row = pages.list().find((r) => r.slug === here) ?? null
        return row !== null && row.kind === 'email' ? row : null
      }

      /** The subject the store last told us this page has. */
      let stored = ''

      const sync = () => {
        const row = mailed()
        wrap.hidden = row === null
        if (row === null) {
          stored = ''
          return
        }
        stored = String(row.email?.subject ?? '')
        // NOT WHILE IT IS BEING TYPED IN. The listing is re-taken on every
        // document the pane shows, including the reload this control's own write
        // provokes, so redrawing unconditionally would take the cursor out of a
        // box somebody is still using.
        if (document.activeElement !== input) input.value = stored
      }

      sync()
      // THREE THINGS CAN CHANGE THE ANSWER, and they are genuinely three. The
      // pane moved to another page (`src`); a new document arrived, which may be
      // a different page again (`document`); and the LISTING changed, which is
      // how a subject the assistant rewrote reaches this box — the rows are
      // re-taken asynchronously, long after the document event that provoked it,
      // and a control that read only the panel's events would go on showing the
      // subject that has already been replaced.
      subscribe('document', () => {
        // `pagesAction` clears the index's pending page on this same event, and
        // it is a control like this one rather than something this can depend on
        // running first. Reading on the microtask queue instead of synchronously
        // is what makes the order between the two irrelevant.
        queueMicrotask(sync)
      })
      subscribe('src', sync)
      // Owned by the toolbar's own cleanup, exactly as the two above are — the
      // strip is rebuilt on every mode and site change, and a listing that
      // arrives afterwards belongs to a box nobody can see.
      cleanup(pages.onRefreshed(sync))

      input.addEventListener('change', async () => {
        const site = getSite()
        const row = mailed()
        const asked = input.value
        if (!site || row === null || asked === stored) return
        input.disabled = true
        try {
          const out = await save(site, String(row.id ?? ''), asked)
          const written = out?.page?.email?.subject
          // The store's answer, not the typing — see the header. Absent, the
          // field keeps what was typed rather than blanking itself, because a
          // reply this client did not understand is no reason to discard work.
          if (typeof written === 'string') input.value = written
          stored = input.value
          // The listing still carries the old subject, and the control beside
          // this one is drawn from it. Re-taking is what stops the two
          // disagreeing until the next document happens to arrive.
          void pages.refresh()
        } catch (err) {
          // A REFUSAL IS THE ANSWER, NOT A FAILURE. The placeholder rule guards a
          // subject exactly as it guards the copy, and its sentence names the
          // token that went missing — so it is put in front of the operator and
          // the box is put back to what is actually stored, rather than left
          // holding a subject the store refused.
          input.value = stored
          input.title = err?.message ? String(err.message) : 'That subject was refused.'
          input.setAttribute('aria-invalid', 'true')
          return
        } finally {
          input.disabled = false
        }
        input.removeAttribute('aria-invalid')
        input.title = ''
      })

      return wrap
    },
  }
}

/**
 * Mark Points — the toggle that reassigns edit mode's primary gesture
 * ([[REQ-210]], DOC-52 §4.3).
 *
 * A TOGGLE AND NOT A MODIFIER-CLICK. Alt-click would avoid a mode, but it is a
 * power-user idiom, it is undiscoverable, and it does not exist on touch. The
 * cost is that a click no longer opens the segment's modal while it is on —
 * which is precisely why the state has to be *visible*, and why this is a
 * pressed button in the strip rather than a preference somewhere.
 *
 * THE CONTROLLER IS NOT OWNED HERE. The strip throws its controls away on every
 * mode and site change, so state kept in this closure would be lost the first
 * time the reader switched channel — with the marks still on the page. The
 * button reads and drives a controller that outlives it, and re-reads on
 * creation so a rebuilt strip shows the state that is actually in force.
 */
export function markPointsAction(controller) {
  return {
    id: 'mark-points',
    create() {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'builder-toolbar__points'
      btn.textContent = 'Mark Points'
      const sync = () => {
        const on = controller.isActive()
        btn.setAttribute('aria-pressed', String(on))
        btn.title = on
          ? 'Mark Points is on — a click places a point instead of opening its editor.'
          : 'Mark Points — point at the page instead of describing where you mean.'
      }
      // DERIVED ON THE TWO OCCASIONS IT CAN CHANGE, and subscribed to nothing.
      // The mode moves only when this button is pressed or when the strip is
      // rebuilt (which re-runs `create`), so a subscription would buy nothing
      // and would be exactly the detached-updater leak `actionCleanups` exists
      // to prevent.
      sync()
      btn.addEventListener('click', () => {
        controller.toggle()
        sync()
      })
      return btn
    },
  }
}
