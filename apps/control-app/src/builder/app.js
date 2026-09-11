import { mountShell } from '@lagrangefoundry/webui-shell'
import { mountSplit } from '@lagrangefoundry/webui-split'
import { createChatPanel } from './chat.js'
import { createMarkedPoints } from './points.js'
import {
  ACCOUNT_ACTION_ID,
  ACCOUNT_LABEL,
  APP_FONT,
  APP_ID,
  BUSINESS_NONE_SELECTABLE_MESSAGE,
  LIBRARY_TAB,
  PEOPLE_TAB,
  SITE_TAB,
  STORAGE_KEYS,
  TABS,
} from './config.js'
import {
  accountAvatar,
  createBusinessSwitcher,
  openAccountSurface,
  resolveBusiness,
} from './business.js'
import { mountEditor } from './editor.js'
import { createLibraryPanel } from './library.js'
import { createPeoplePanel } from './people.js'
import { markdownReady as defaultMarkdownReady } from './markdown.js'
import { createPageCarry } from './carry.js'
import { createDisplayPanel } from './panel.js'
import { openPalettePopup } from './palette-popup.js'
import { createUploadOverlay } from './upload.js'
import {
  colorsAction,
  createToolbar,
  markPointsAction,
  modeToggleAction,
  openInNewTabAction,
  panelsAction,
  publishAction,
} from './toolbar.js'
import {
  fetchPalette,
  fetchSites,
  openChatSession,
  previewUrl,
  setBusinessScope,
  uploadMaterial,
  writePalette,
} from './api.js'
import { createSessionNotice, isSessionEnded, onSessionEnded } from './session.js'

/**
 * Mount the builder shell (REQ-115 / DOC-28 §12 T1).
 *
 * The composition is: shell (tab chrome + storage namespace) → the `site` tab's
 * panel → toolbar above a split → display panel | chat placeholder.
 *
 * Everything stateful hangs off `shell.storage(...)`, so persistence is
 * namespaced from the first commit. Retrofitting a namespace once several
 * panels persist state is materially more expensive (DOC-8 §9.2), and it is
 * free to do now.
 */
export function mountBuilder(root, options = {}) {
  const {
    /**
     * The businesses this account may operate ([[REQ-179]]), from
     * `/api/businesses`. Lapsed members are included and marked — the switcher
     * shows them, unselectable.
     *
     * EMPTY IS ORDINARY AND MEANS "NO IDENTITY BEHIND THIS HOST": the Node
     * transport, a suite mounting the chrome, an origin that could not answer.
     * The switcher renders nothing, no business prefix is set, and the origin
     * resolves every request through its own fallback — which is exactly what
     * every host did before this existed.
     *
     * NON-EMPTY WITH NOTHING SELECTABLE IS A DIFFERENT STATE, and a real person
     * rather than a headless host ([[DOC-42]] §10.1): an account whose every
     * grant has lapsed, admitted on its membership. It has businesses to show
     * and none to open, so the switcher renders them all marked, the tabs are
     * blocked and the chrome — switcher, account, theme, about — stays live.
     * See {@link blockTabs}.
     */
    businesses = [],
    /**
     * Who is signed in, for the avatar and the account surface behind it.
     *
     * A PERSON, AND NAMED FOR ONE ([[REQ-194]]). It was `account`, which is the
     * payer and the owner of businesses — a different noun, which now has a table
     * and a key of its own.
     */
    person = null,
    /**
     * The sites of the SELECTED business.
     *
     * A seam rather than a fetch, for the reason every other transport here is
     * one: a suite drives the whole switch without an origin. The default asks
     * the origin — the call is business-scoped by the prefix the switcher sets,
     * so "the sites of this business" needs no argument beyond the scope that is
     * already in force. With no businesses there is no second answer to ask for,
     * so the injected `sites` list stands.
     */
    loadSites = null,
    sites = [],
    publish = async () => {},
    storage,
    editBridge = null,
    /**
     * The framework's own page-state module ([[REQ-215]]), supplied by `main.js`
     * from `/framework/page-state.js`.
     *
     * It is what carries the page across a channel switch — which panels are
     * open, and how each channel is put back into that state. Injected for the
     * reason the edit bridge is: it is fetched from the origin by an absolute
     * URL only a browser can resolve. Absent, the carry keeps the page and the
     * scroll offset and holds no opinion about panels, which is what every host
     * without a real preview origin gets.
     */
    pageState = null,
    chatTransport = null,
    paletteTransport = null,
    /**
     * The renderer's own shade arithmetic (REQ-133). Supplied by `main.js` from
     * `/framework/site-schema-shade.js` — the SAME module the render path
     * resolves a reference through — so the popup's slider previews the color
     * the page will paint rather than a second opinion about it. Absent, the
     * slider reports the entry unshaded, which is honest: no arithmetic is
     * better than the wrong arithmetic.
     */
    shadeHex = (hex) => hex,
    /**
     * The Library's calls (REQ-161). `null` keeps the tab and its transport
     * defaults; a test injects `{list, item, save, fileUrl, upload}` to drive the
     * whole surface without an origin.
     */
    libraryTransport = null,
    peopleTransport = null,
    /**
     * When the markdown engines have settled (BUG-42). Awaited before a
     * conversation is handed to the pane, because the pane paints each turn once.
     * A test injects a promise it controls so the cold-load ordering — engines
     * still loading while a session arrives — is something it can hold open and
     * observe, rather than a race it has to hope loses.
     */
    markdownReady = defaultMarkdownReady,
    /**
     * Whether this deployment can reach a model, and what to say if not (REQ-173).
     *
     * `{ai: true}` BY DEFAULT, so every existing host and every test that does
     * not care about the key mounts exactly the builder it mounted before. The
     * browser entry supplies the real answer from `/api/status`; see
     * {@link blockEverything} for what a `false` does.
     */
    aiStatus = { ai: true, message: null },
  } = options

  /**
   * THE SHELL'S SCOPE ([[REQ-179]]) — one business, applying to every tab.
   *
   * Declared before the shell because the account action closes over it, and
   * kept as two plain values rather than a store because that is all it is: the
   * business every request is prefixed with, and the site every surface is
   * about. What a change to either MEANS is `selectBusiness` below, which is the
   * one place a scope moves.
   *
   * `currentSite` is kept by SUBSCRIPTION rather than by asking the pane
   * (`panel.on('site', …)` further down). The pane reports what it is
   * displaying; nothing interrogates it. That is the whole of the layering this
   * ticket is about — when a business can hold several sites, a site selector
   * goes inside the site tab and `panel.getSite()` becomes meaningful again, one
   * level down, without anything here having to be untangled first.
   */
  let currentBusiness = null
  let currentSite = null

  const shell = mountShell(root, {
    appId: APP_ID,
    // Passed straight through: a TABS entry IS a shell tab spec, and narrowing
    // it here to `{id, label}` silently dropped `fill` (and would drop `badge`
    // next). The shell validates the shape, so there is nothing to guard.
    tabs: TABS,
    tabStyle: 'underline',
    // The app typeface, through the shell's own token path. See APP_FONT.
    tokens: { font: APP_FONT },
    about: {
      title: '1st Contact builder',
      body: 'Edit your site on the page itself.',
    },
    /**
     * THE ACCOUNT LIVES HERE, IN THE HEADER'S TRAILING SLOT, AND NOT IN THE TAB
     * STRIP ([[REQ-179]]).
     *
     * It is the one surface that is not business-scoped ([[DOC-40]] §2), so a
     * tab for it would be the single place where the shell's switcher is present
     * and silently does not apply — and a control that is present and ignored
     * reads as a bug. The tab strip stays uniformly business-scoped, with no
     * exception to explain.
     *
     * THE SHELL'S OWN TWO CONTROLS ARE RESTATED HERE because `actions` REPLACES
     * the defaults rather than extending them: omitting them to add a third
     * would silently remove Theme and About. They are still the shell's
     * behaviours — each `onClick` receives the shell handle and calls it, so
     * nothing about theming or the about modal is decided in this file.
     */
    actions: [
      { id: 'theme', content: 'Theme', ariaLabel: 'Toggle color theme', onClick: (s) => s.toggleTheme() },
      { id: 'about', content: 'About', onClick: (s) => s.openAbout() },
      {
        id: ACCOUNT_ACTION_ID,
        content: accountAvatar(person),
        title: ACCOUNT_LABEL,
        ariaLabel: ACCOUNT_LABEL,
        onClick: () =>
          openAccountSurface({
            // Inside the shell root, for the reason every other builder dialog
            // is: the `--shell-*` tokens and the app font are declared on
            // `.shell`, and a dialog beside it resolves neither.
            host: shell.element,
            person,
            businesses,
            selected: currentBusiness,
          }),
      },
    ],
    ...(storage ? { storage } : {}),
  })

  /**
   * The unconfigured-deployment banner, and the block that comes with it (REQ-173).
   *
   * ONE FACT, STATED ONCE, AT THE TOP. Without a key the assistant cannot take a
   * turn, an image cannot be looked at and a document cannot be described — so
   * every surface fails, each in its own local dialect, and an operator is left
   * assembling a deployment-wide diagnosis out of a frozen chat pane and an
   * upload that 503s. `/api/status` answers the question once and this says it in
   * one sentence.
   *
   * AND IT BLOCKS, RATHER THAN LETTING THE OPERATOR TRY. A banner over a live
   * builder invites exactly the sequence it is warning about: the operator reads
   * it, drops a file anyway, and gets a second error to interpret. So the shell
   * is made `inert` — one attribute, covering the tabs, the toolbar, the pane,
   * the assistant and the Library together, with no per-surface disabling to keep
   * in step as surfaces are added.
   *
   * THE BANNER IS OUTSIDE THE INERT SUBTREE, which is the whole reason it is
   * mounted on `root` rather than inside `shell.element`. A warning a user cannot
   * select the text of is a warning they cannot paste into a support message.
   */
  const banner = aiStatus?.ai === false ? blockEverything(root, shell, aiStatus.message) : null
  const blocked = banner !== null

  /**
   * THE TABS GO, THE CHROME STAYS ([[REQ-179]] reopen, [[DOC-42]] §10.1).
   *
   * A member whose every grant has lapsed is admitted now rather than refused at
   * the door — membership admits and entitlement does not — so this mount is a
   * real session belonging to a real person, with nothing it may open. That is a
   * different state from the unconfigured deployment above, and it takes a
   * different block: {@link blockEverything} makes the whole shell inert, which
   * here would take the avatar with it, and the avatar is precisely what must
   * survive. It is where the account is, and the account is where this person
   * would see what they were charged, pay, or ask for erasure ([[DOC-37]],
   * [[REQ-183]]).
   *
   * THE LINE IS [[DOC-42]] §5's: the tab strip is the entitled product, and the
   * chrome is a fact about this person's relationship with us. So the switcher,
   * the account, Theme and About all stay live, and only what a grant buys goes.
   *
   * ORDER MATTERS AGAINST THE BLOCK ABOVE. An unconfigured deployment is a
   * bigger fact than a lapsed grant — nothing runs either way — so the wider
   * block wins and this one does not add a second banner under it.
   */
  const noBusiness = businesses.length > 0 && !businesses.some((b) => b.selectable !== false)
  if (noBusiness && !blocked) blockTabs(shell, BUSINESS_NONE_SELECTABLE_MESSAGE)

  /**
   * SAY IT ONCE, THE FIRST TIME ANY CALL FINDS OUT ([[BUG-52]]).
   *
   * The builder makes several calls at once and a lapsed session refuses all of
   * them, so the subscription fires repeatedly for one fact. `sessionNotice`
   * being non-null is the latch: a second refusal changes nothing on screen, and
   * in particular does not stack banners.
   *
   * ON `root`, ABOVE THE SHELL, for {@link blockEverything}'s reason — a message
   * whose text cannot be selected cannot be pasted into a support request. What
   * it deliberately does NOT do is make the shell `inert` or navigate anywhere;
   * see `session.js` for why an operator's unsaved work outranks tidiness here.
   */
  let sessionNotice = null
  const unwatchSession = onSessionEnded((error) => {
    if (sessionNotice) return
    sessionNotice = createSessionNotice({ reason: error?.reason, variant: 'banner' })
    root.prepend(sessionNotice.element)
  })

  /**
   * Where the selection is remembered ([[REQ-179]]).
   *
   * Through the shell's own namespaced storage, like everything else that
   * persists — `STORAGE_KEYS.business` is the one key not named after a tab,
   * because the selection is not one tab's.
   */
  const businessStorage = shell.storage(STORAGE_KEYS.business)

  /**
   * How the selected business's sites are found.
   *
   * WITH BUSINESSES, ASK THE ORIGIN. `/api/sites` is already business-scoped by
   * the prefix `setBusinessScope` puts on it, so "the sites of this business" is
   * the call that already exists, asked again — no new route, no new query, and
   * no site list smuggled into the businesses payload where the site store's own
   * relation would then have a second home.
   *
   * WITHOUT THEM, THE INJECTED LIST STANDS. There is no second business to ask
   * about and, on the hosts that take this path, frequently no origin to ask.
   */
  const loadSitesFor =
    loadSites ??
    (businesses.length > 0
      ? // AND WITH NO BUSINESS IN SCOPE, NOTHING IS ASKED FOR ([[REQ-179]]
        // reopen). An account whose every grant has lapsed reaches here with
        // businesses and no scope, and an unprefixed `/api/sites` would resolve
        // to the origin's own fallback — either a refusal to catch and discard,
        // or, worse, some other business's sites. An empty list is the true
        // answer to "the sites of no business".
        (id) => (id ? fetchSites() : Promise.resolve([]))
      : async () => sites)

  /**
   * THE BUSINESS SWITCHER, IN THE SHELL'S OWN HEADER ([[REQ-179]]).
   *
   * AND THIS IS THE ONE PLACE THIS APP TOUCHES SHELL-INTERNAL MARKUP.
   * `webui-shell` offers a trailing `actions` slot — which the account avatar
   * above uses, exactly as intended — and no LEADING one, so a control that
   * belongs before the tabs has nowhere declared to go. Prepending into
   * `.shell-bar` is that gap, made visible rather than hidden behind a helper:
   * when upstream grows a leading slot this becomes a one-line change, and until
   * then there is exactly one selector to update rather than a scattering.
   *
   * The fallback to the shell root is not defensive dressing — it keeps a
   * switcher on screen if that markup ever moves, so the failure is a misplaced
   * control rather than an invisible one.
   */
  const switcher = createBusinessSwitcher({
    businesses,
    onSelect: (id) => void selectBusiness(id),
  })
  const shellBar = shell.element.querySelector('.shell-bar')
  ;(shellBar ?? shell.element).prepend(switcher.element)

  /**
   * What the pane is showing, held across the swap that destroys it
   * ([[REQ-215]]). See `carry.js` — the panel says WHEN a document goes and
   * arrives, and this is what decides what is worth keeping.
   */
  const carry = createPageCarry({ pageState })

  const panel = createDisplayPanel({
    storage: shell.storage(STORAGE_KEYS.panel),
    site: sites[0]?.slug ?? null,
    // The pane is about to re-derive what it shows; take what the outgoing
    // document holds before the URL that replaces it is computed from it.
    onBeforeNavigate: () => carry.capture(panel.frame?.contentWindow),
  })

  /**
   * The two render channels the pane can show (DOC-28 §5.1). Both are entries
   * in the same registry — View is not privileged in the panel's internals, it
   * is simply the one registered first.
   *
   * Edit points at the `edit` channel, whose render stamps the segment
   * addresses (T2) the bridge resolves clicks against; `rebind` below mounts
   * the edit loop (T3) on the document the pane loads there.
   */
  panel
    .registerMode({
      id: 'view',
      label: 'View',
      // [[REQ-215]] — the SAME page, not the channel's front door: the reader
      // who switched channel on `/about` is still on `/about`.
      src: ({ site }) => previewUrl(site, 'draft', carry.pathFor(site)),
      actions: ['mode-toggle', 'colors', 'open-new-tab', 'publish'],
    })
    .registerMode({
      id: 'edit',
      label: 'Edit',
      src: ({ site }) => previewUrl(site, 'edit', carry.pathFor(site)),
      // `colors` in BOTH channels: a palette is a property of the site, not of
      // one rendering of it, so there is no mode in which changing it is
      // meaningless (REQ-133).
      //
      // `mark-points` in THIS ONE ONLY ([[REQ-210]]). View mode must behave
      // exactly as published (DOC-28 §7.1) — links work, nothing is
      // intercepted — and a control that reassigns the click there would be
      // precisely that interception. Naming it from the mode is also the whole
      // of the enforcement: the strip renders what the active mode lists, so
      // there is no channel in which the toggle is present and inert.
      //
      // `panels` in THIS ONE ONLY ([[REQ-215]]). It chooses which of the page's
      // modals the render is showing, and in View that choice belongs to the
      // reader's own hand — a control that made it from the chrome would be
      // driving a channel whose whole job is to behave exactly as published.
      actions: ['mode-toggle', 'mark-points', 'panels', 'colors', 'open-new-tab', 'publish'],
    })
    .restore()

  /**
   * THE REMEMBERED SITE, READ ONCE ([[REQ-179]]).
   *
   * This is the scope seeding itself from the pane's own persistence, and it is
   * the ONLY `panel.getSite()` in this module — everything after it either
   * subscribes to the pane's `site` event or reads `currentSite`. The
   * distinction that matters is not the call, it is the direction: a tab
   * reaching into another tab's panel to discover which scope it is in is what
   * this ticket removes; a scope reading, at bootstrap, the one value that was
   * persisted for exactly this purpose is not that.
   *
   * It is read AFTER `restore()` rather than subscribed before it, so a reload
   * opens ONE session: subscribing first would have `restore()` open a session
   * for the remembered site before a business was even resolved, and
   * `selectBusiness` would then open the same one again a round trip later.
   */
  currentSite = panel.getSite()

  /**
   * The palette popup, in the one place that can host it (REQ-133).
   *
   * It mounts into `shell.element` for the reason the segment modal does: the
   * `--shell-*` tokens and the app font are declared on `.shell`, and a dialog
   * outside it resolves neither.
   *
   * The frame is reloaded after a write rather than re-rendered by the origin:
   * `draft` and `edit` render at request time (REQ-119), so the bytes the next
   * fetch produces already carry the new color and there is no artifact for a
   * save to keep in step. A color change repaints the page, so the reload is
   * not optional — a palette write that left a stale frame on screen would read
   * as a write that did nothing.
   */
  const transport = paletteTransport ?? { get: fetchPalette, write: writePalette }
  const openPalette = (slug, opts = {}) =>
    openPalettePopup({
      host: shell.element,
      slug,
      transport,
      shadeHex,
      onChanged: () => panel.reloadDocument(),
      ...opts,
    })

  /**
   * Marked Points ([[REQ-210]]) — the reader points, and the pointing becomes
   * text in the message.
   *
   * IT IS CREATED HERE, ABOVE THE TOOLBAR AND ABOVE THE PANE, because it
   * outlives both: the strip rebuilds its controls on every mode and site
   * change, and the pane is remounted per conversation, while a placed point
   * has to survive until the render it was taken against is replaced. The two
   * composer calls it needs are declared below and reached through this closure
   * — the pane does not exist yet at this line, and cannot, because it takes
   * this controller's `expand`.
   */
  const points = createMarkedPoints({
    api: editBridge,
    insertToken: (token) => insertPointToken(token),
    removeToken: (label) => removePointToken(label),
  })

  const toolbar = createToolbar({
    panel,
    // THE SCOPE, HANDED DOWN ([[REQ-179]]). A toolbar action acts on the site
    // the shell's scope names; it does not ask the pane which one that is. See
    // `NO_SITE` in `toolbar.js` for what an unwired host gets and why.
    context: { getSite: () => currentSite },
    actions: [
      modeToggleAction(),
      markPointsAction(points),
      panelsAction(carry),
      colorsAction(openPalette),
      openInNewTabAction(),
      publishAction(publish),
    ],
  })

  /**
   * The assistant, in the split's secondary (REQ-122).
   *
   * It follows the SHELL'S SCOPE rather than owning a selector of its own
   * ([[REQ-179]]). The rule is unchanged and was never about the toolbar: a
   * scope is chosen in exactly ONE place, and a second control that could
   * disagree with it is worse than no control at all. Only the place changed —
   * from a toolbar that scoped one tab to the chrome every tab is inside.
   *
   * The transport seam is split the way the calls are (REQ-127): opening a
   * session is this module's, because only this module knows a site; running a
   * turn is the pane's, because only the pane knows when the operator sent
   * something. A test still injects one object and overrides either half.
   */
  const openSession = chatTransport?.openSession ?? openChatSession
  const chat = createChatPanel({
    storage: shell.storage(STORAGE_KEYS.chat),
    ...(chatTransport?.streamPrompt ? { transport: { streamPrompt: chatTransport.streamPrompt } } : {}),
    // BUG-43 — the same reload the palette popup and the segment editor perform,
    // for the same reason and by the same means: `draft` and `edit` render at
    // request time, so the bytes the next fetch produces already carry the
    // assistant's write and there is no artifact for it to keep in step. It was
    // the only writer that never triggered one, so its changes sat in the store
    // unseen until the operator reloaded by hand.
    //
    // Fired PER WRITE rather than at the end of the turn, so a request answered
    // by several edits shows the page unfolding as the assistant works.
    onSiteChanged: () => panel.reloadDocument(),
    // [[REQ-210]] — the pill's expansion is the assistant's ENTIRE channel for a
    // marked point: `screenshot` renders server-side and the marks live in the
    // reader's own browser overlay, so there is no render in which one appears.
    expandPrompt: (markdown) => points.expand(markdown),
  })

  /**
   * The two composer calls Marked Points needs.
   *
   * THROUGH `getChat()` RATHER THAN A HELD HANDLE, because the pane replaces its
   * chat on every conversation switch — a handle captured once would be writing
   * into a component that is no longer on screen. `null` before a site is
   * selected is ordinary and does nothing.
   */
  function insertPointToken(token) {
    const box = chat.getChat()
    if (!box) return
    const current = box.getInputMarkdown()
    box.setInputMarkdown(`${current}${current === '' || /\s$/.test(current) ? '' : ' '}${token} `)
    box.focus()
  }

  /**
   * Take a deleted point's pills out of the draft.
   *
   * NOT MERELY TIDY. Labels are reused the moment they are free, so a reference
   * left behind would quietly bind to a DIFFERENT point the next time that
   * letter is handed out — a message that says one thing and means another,
   * with nothing on screen to show it.
   */
  function removePointToken(label) {
    const box = chat.getChat()
    if (!box) return
    const current = box.getInputMarkdown()
    const next = current.replace(new RegExp(`\\[\\s*point\\s+${label}\\s*\\]\\s?`, 'gi'), '')
    if (next !== current) box.setInputMarkdown(next)
  }

  const splitHost = document.createElement('div')
  splitHost.className = 'builder-split'

  const layout = document.createElement('div')
  layout.className = 'builder-layout'
  layout.append(toolbar.element, splitHost)
  shell.getPanel(SITE_TAB.id).append(layout)

  /**
   * Bind the edit loop to whatever the pane is currently showing (REQ-117).
   *
   * It re-binds on the panel's `document` announcement rather than once at
   * mount, because the document in front of the operator CHANGES: switching
   * site and the refresh after a save each produce a new `contentDocument`, and
   * since [[BUG-79]] switching mode reveals a DIFFERENT FRAME'S — a bridge
   * holding the old one is bound to a document nobody can see either way.
   *
   * ON THE PANEL'S EVENT AND NOT THE FRAME'S, for the same reason: there is a
   * frame per channel now, so a listener on one of them would go deaf the
   * moment the operator flipped to the other. The panel announces whichever
   * document has just arrived in front of the operator, whether it arrived by
   * loading or by being revealed.
   *
   * View mode needs no guard here: `mountL1EditBridge` refuses to bind on a
   * document without the edit marker, so this is a no-op there by construction
   * rather than by us remembering to check (DOC-28 §7.1).
   */
  let editor = null
  const rebind = () => {
    editor?.destroy()
    editor = null
    /**
     * Marked Points adopts the new document too ([[REQ-210]]).
     *
     * A NEW DOCUMENT IS A NEW RENDER, so the points go with the old one — and
     * that is the design, not a limitation being worked around. A reader marks
     * a point BECAUSE they want that thing to move, and then it moves;
     * persistence would buy the minority case at the price of re-projection
     * machinery (anchor to node plus offset, re-project, invalidate when the
     * node disappears) that clearing makes unnecessary in its entirety.
     *
     * ABOVE the `editBridge` guard on purpose: a host with no bridge still has
     * a mode to leave, and leaving it with marks on the page would be worse
     * than never having drawn them.
     */
    points.bind(panel.frame?.contentDocument ?? null)
    /**
     * The document that just arrived is put into the state the one before it was
     * in ([[REQ-215]]).
     *
     * ON EVERY LOAD, not only on a channel switch — which is what makes editing
     * the copy inside an open modal work at all. A save re-renders the page and
     * reloads the frame, and a carry applied only when the mode moved would
     * close the panel on the operator's first edit.
     *
     * BEFORE the bridge is mounted below, so the segments the editor binds
     * against are the ones actually on screen.
     */
    carry.adopt(panel.frame?.contentWindow, currentSite)
    // No bridge supplied → no editing. The browser entry always supplies one;
    // a host that does not (a test mounting only the chrome) gets the pane and
    // the toolbar with no edit loop, rather than a module that fails to load.
    if (!editBridge) return
    const doc = panel.frame?.contentDocument
    if (!doc) return
    editor = mountEditor(doc, {
      slug: currentSite,
      bridge: editBridge,
      // INSIDE the shell root, which is where both halves of the modal's
      // appearance are declared: the `--shell-*` tokens and the app font. On
      // `document.body` — a sibling of the shell — it resolved neither.
      host: shell.element,
      /**
       * REQ-140 — the colour seam: the SAME popup the Colors button opens, in
       * pick mode, and the same shade arithmetic the renderer uses.
       *
       * `openPalette` is already bound to the host, the transport and the
       * post-write reload, so a colour field gets manage-editing inside the
       * picker for free — which is what makes an empty palette a workable
       * starting state rather than a dead end, and what makes "this colour is
       * nearly right" a one-gesture fix (REQ-133 §1).
       */
      colors: {
        open: (value) => openPalette(currentSite, { mode: 'pick', value }),
        shadeHex,
      },
      // The origin has already re-rendered the edit channel by the time a save
      // resolves, so the frame only has to reload — and reloading fires `load`,
      // which re-binds against the new document.
      onSaved: () => panel.reloadDocument(),
    })
  }
  const unbindDocument = panel.on('document', rebind)

  /**
   * Mark Points is an EDIT-MODE mode, so leaving edit mode leaves it
   * ([[REQ-210]], DOC-28 §7.1).
   *
   * The strip already stops OFFERING the toggle in View — a mode renders the
   * actions it names — but a toggle that is merely unreachable is still on, and
   * its capture-phase click would go on intercepting in a channel that must
   * behave exactly as published. Turning it off is what makes the strip's
   * omission true rather than decorative.
   */
  panel.on('mode', (mode) => {
    if (mode !== 'edit') points.setActive(false)
  })

  /**
   * The Library (REQ-161), in its own tab beside the site.
   *
   * IT IS SCOPED TO THE BUSINESS AND KNOWS NOTHING OF THE SITE ([[REQ-181]]).
   * It is handed no `getSite` because it asks no question a site could answer:
   * a business holds one site in v1, so material is either this business's or it
   * is not, and there is no second site for a badge to distinguish.
   *
   * That makes a business switch a DIFFERENT LIST rather than the same list
   * redrawn — `selectBusiness` clears it and re-reads it, and a site change does
   * nothing to it at all.
   *
   * IT IS ALSO WHY THE CHANGE FEED IS THE PANEL'S AND NOT THIS FILE'S
   * ([[REQ-201]]). A subscription is scoped exactly as the read it accompanies,
   * so it has to be opened and closed by whatever opens and closes the list —
   * and that is `refresh`/`clear`, which this host already calls in the right
   * order for the right reason.
   */
  const library = createLibraryPanel({
    storage: shell.storage(STORAGE_KEYS.library),
    markdownReady,
    // Where an expanded reader window goes (REQ-172) — inside the shell root,
    // for the reason the segment editor's host above states: the `--shell-*`
    // tokens and the app font are both declared on `.shell`, and a dialog
    // appended beside it resolves neither.
    getModalHost: () => shell.element,
    ...(libraryTransport ? { transport: libraryTransport } : {}),
  })
  shell.getPanel(LIBRARY_TAB.id).append(library.element)

  /**
   * The User tab ([[REQ-170]]) — the people of whichever business is open.
   *
   * MOUNTED BESIDE THE LIBRARY AND ON THE SAME TERMS. It is business-scoped in
   * exactly the way the Library is, so a business switch clears and re-reads it
   * rather than re-filtering: these are other people entirely, and leaving one
   * business's rows on screen under a header naming another is the outcome a
   * failed re-read may not produce ([[REQ-181]]'s rule, applied to people).
   *
   * NOT GATED HERE, and its absence would not be a gate if it were. Every
   * business has people and every owner may see their own; the one control that
   * is 1st Contact's alone is decided inside the panel from what `/api/people`
   * reports, and refused again by `/api/admin/businesses` for itself
   * ([[DOC-42]] §7).
   */
  const people = createPeoplePanel({
    storage: shell.storage(STORAGE_KEYS.people),
    ...(peopleTransport ? { transport: peopleTransport } : {}),
  })
  shell.getPanel(PEOPLE_TAB.id).append(people.element)

  /**
   * The upload overlay, watching BOTH entry points (REQ-161, DOC-8 open item #4).
   *
   * ONE INSTANCE, TWO WATCHERS, and that is the ticket's answer to "drag into
   * chat, or a dedicated panel?" — both, because they serve different moments,
   * and the same interaction because the decision they lead to is identical.
   *
   * It mounts into `shell.element` for the reason every other builder surface
   * does: the `--shell-*` tokens and the app font are declared on `.shell`, and
   * anything appended beside it resolves neither.
   */
  const upload = createUploadOverlay({
    host: shell.element,
    onUpload: (files, role, source) => void receiveFiles(files, role, source),
  })
  const unwatchChat = upload.watch(chat.element, 'chat')
  const unwatchLibrary = upload.watch(library.element, 'library')

  const sendUpload = libraryTransport?.upload ?? uploadMaterial

  /**
   * What happens after the drop.
   *
   * SEQUENTIALLY, and deliberately not in parallel. Each upload is described and
   * indexed on the origin before it answers, so firing five at once buys latency
   * back by making five model calls compete — and the client watching the
   * conversation would see the confirmations arrive in an order unrelated to the
   * one they dropped them in.
   *
   * A CHAT-ROUTE DROP APPEARS IN THE CONVERSATION. That is the ticket's own
   * acceptance, and it is two different things at once: the client can see what
   * they sent, and the assistant has it — the second half through the origin's
   * index refresh and the next turn's delta (DOC-39 §6.4), not through this
   * message. A Library-route drop reaches the assistant by exactly the same path;
   * what it does not do is put a line in a conversation it was not part of.
   */
  async function receiveFiles(files, role, source) {
    // BELT AND BRACES BESIDE `inert` (REQ-173). The shell being inert stops a
    // click, and a drag onto an inert subtree is not something the attribute is
    // specified to refuse — so the one action with a real origin behind it says
    // no here too, rather than sending bytes the route will 503.
    if (blocked) return
    // CLEARED BEFORE THE ROUND, NOT AFTER IT ([[REQ-221]]). A refusal left
    // standing above a list that has since accepted the file is a worse lie than
    // the silence it replaced, and clearing at the end would wipe the message
    // this very round is about.
    library.refused('')
    const refusals = []
    for (const file of files) {
      let result = null
      let failure = null
      try {
        result = await sendUpload({ file, role, slug: currentSite ?? undefined })
      } catch (err) {
        failure = err
      }
      if (failure || !result) refusals.push(`${file.name} — ${refusalReason(failure)}`)
      if (source === 'chat') {
        chat.getChat()?.appendMessage('user', uploadNote(file, result, failure))
      }
    }
    /**
     * A REFUSAL REACHES THE CLIENT FROM BOTH DROP AREAS ([[REQ-221]]).
     *
     * The conversation already reported one; the Library reported nothing at
     * all, so a file dropped there that the origin refused simply never appeared
     * and the client was left to conclude the product had ignored them. That is
     * the same experience as dropping a photograph into silence, arrived at
     * differently — and it is the experience this change exists to end, so it
     * cannot be the experience the change itself delivers.
     *
     * ONLY FOR THE NON-CHAT ROUTE, because a chat drop has already said it and
     * saying it twice in two surfaces would read as two separate failures.
     */
    if (source !== 'chat' && refusals.length) library.refused(refusals.join(' '))
    // ALWAYS, and from the origin rather than from what the uploads returned: the
    // list carries `description_status` and the site placement, both of which are
    // decided after the bytes leave here.
    await library.refresh().catch(() => {})
  }

  const split = mountSplit(splitHost, {
    id: STORAGE_KEYS.split,
    primary: panel.element,
    secondary: chat.element,
    initialSplit: 65,
    collapse: { side: 'secondary', style: 'rail' },
    storage: shell.storage(STORAGE_KEYS.split),
  })

  /**
   * The assistant follows the pane, and THIS is where a site becomes a session
   * (REQ-127).
   *
   * The chat pane is handed a conversation, not a slug — so the translation has
   * to happen somewhere, and it happens here because here is where a site is
   * chosen. That is the layering the ticket is about: the shell's chrome owns the
   * switcher ([[REQ-179]]), `app.js` owns the switch, and everything below holds
   * a session.
   *
   * THE GENERATION TOKEN LIVES HERE NOW, for the reason it ever existed: opening
   * a session is async, so a second switch can start before the first finishes,
   * and without the token a slow answer for an abandoned site would be swapped
   * into a pane the operator has already moved on from. It moved with the async;
   * it did not disappear.
   */
  let generation = 0

  /**
   * WHICH CONVERSATION A SESSION IS, TO THIS BUILDER ([[BUG-69]]).
   *
   * The origin's id names a site — `site-<slug>` — and that is unique wherever
   * it is resolved, because every request is business-scoped and the host reads
   * it against that business's own store. It is not unique HERE: slugs are per
   * business, so two businesses may each hold a site named the same way, and
   * `site-unnamed` beside one of them is a different conversation from
   * `site-unnamed` beside the other.
   *
   * SCOPED EXACTLY THE WAY A URL IS. `api.js` prefixes a path with the selected
   * business and leaves it bare when there is none; this does the same to an id,
   * for the same reason and with the same shape — the pane's notion of "the
   * conversation on screen" then moves precisely when the thing it names moves.
   *
   * The failure without it: a switch between two businesses whose sites share a
   * slug re-read the right transcript and the pane discarded it as one it was
   * already showing, leaving the previous business's conversation beside the new
   * business's site.
   */
  function conversationKey(businessId, sessionId) {
    return businessId ? `${businessId}/${sessionId}` : sessionId
  }

  async function showSite(slug) {
    const mine = ++generation
    // CAPTURED, NOT READ LATER. The open below is async and `currentBusiness`
    // may have moved on by the time it answers — the generation token already
    // stops that answer reaching the pane, and this keeps the key describing the
    // scope the read was actually made under either way.
    const scope = currentBusiness
    if (!slug) {
      chat.setSession(null)
      return
    }
    // A SESSION IS NOT OPENED AT ALL WITHOUT A KEY (REQ-173). The origin would
    // answer `ready: false` with the host's own wording, which is true but
    // describes the chat route rather than the deployment — and the banner has
    // already said the deployment-wide thing. So the pane is handed the same
    // sentence the banner carries, and no request is made.
    if (blocked) {
      const unconfigured = {
        sessionId: `unconfigured:${slug}`,
        turns: [],
        ready: false,
        error: aiStatus.message ?? 'The assistant is not available.',
      }
      chat.setSession(unconfigured, conversationKey(scope, unconfigured.sessionId))
      return
    }
    try {
      // BOTH WAITS, IN PARALLEL (BUG-42). The pane renders each turn as it is
      // appended and cannot redraw one, so a transcript handed over before the
      // markdown engines have settled is escaped source for the life of the page.
      // `markdownReady` never rejects, so this adds a failure mode to neither
      // branch — and running it alongside the open costs no latency beyond the
      // slower of the two.
      const [session] = await Promise.all([openSession(slug), markdownReady])
      if (mine !== generation) return
      chat.setSession(session, conversationKey(scope, session.sessionId))
    } catch (err) {
      // The note this writes is markdown too, so the failure path waits as well.
      await markdownReady
      if (mine !== generation) return
      // A session that cannot be opened at all is reported the way an unusable
      // one is — in the pane, with the transcript it does not have. `ready:false`
      // is the same story the origin tells when it CAN answer, so the pane needs
      // no second failure mode.
      const unopened = {
        sessionId: `unopened:${slug}`,
        turns: [],
        ready: false,
        error: `The assistant could not be reached: ${err.message}`,
      }
      chat.setSession(unopened, conversationKey(scope, unopened.sessionId))
    }
  }

  /**
   * The pane REPORTS what it is displaying, and everything that is about a site
   * follows that report ([[REQ-179]]).
   *
   * Nothing interrogates the pane any more. This is the one subscription, and it
   * is what a site change — from wherever — means: the assistant is a session per
   * site and is re-opened.
   *
   * THE LIBRARY IS NOT HERE ([[REQ-181]]). It was, for a badge and a filter that
   * were about the open site; both are gone, and the list itself is the
   * business's rather than the site's. A site change is nothing to it. A BUSINESS
   * change is everything, and `selectBusiness` is where that is handled.
   *
   * It is also what makes an in-tab site selector a later addition rather than a
   * later untangling: when a business can hold several sites, that control calls
   * `panel.setSite` and everything below already follows.
   */
  const unbindSite = panel.on('site', (slug) => {
    currentSite = slug
    void showSite(slug)
  })

  /**
   * THE ONE PLACE A SCOPE MOVES ([[REQ-179]]).
   *
   * Every surface the builder has is business-scoped, and each of them used to
   * find out separately: the assistant followed the pane's `site` event, the
   * Library asked the pane on every draw, the uploads asked it per file. That
   * worked while a site was the widest thing anything cared about. It does not
   * survive the tab set the product is growing into ([[DOC-40]] §2) — a person's
   * job crosses tabs, and a scope re-set per tab makes the common path the
   * painful one.
   *
   * So the switch happens HERE, once, in the module that knows all of them —
   * the same layering `showSite` already followed, widened by one level.
   *
   * FIVE THINGS MOVE TOGETHER, and the order is what makes them agree:
   *   1. the URL prefix, so every request after this line is about the new
   *      business — set FIRST, because the site read below is one of them;
   *   2. the remembered selection, so a reload lands here rather than back at
   *      the first admissible business;
   *   3. the pane's site, and its frame — `panel.refresh()` because the URL
   *      changed even when the slug did not (the prefix is part of it);
   *   4. the assistant, which is a session per site and must be re-opened;
   *   5. the Library, whose list is the BUSINESS's material and is therefore
   *      genuinely a different list — cleared before the re-read, so no row from
   *      the business being left behind can survive a re-read that fails.
   *
   * THE REMEMBERED SITE SURVIVES A SWITCH THAT STILL OFFERS IT. Slugs are unique
   * per business rather than globally, so the same slug in two businesses is two
   * different sites and the scoped URL already tells them apart. Dropping to the
   * first site of the new business regardless would throw away a selection for
   * no reason on the one path a returning operator takes.
   */
  async function selectBusiness(businessId) {
    currentBusiness = businessId ?? null
    setBusinessScope(currentBusiness)
    businessStorage.setItem('id', currentBusiness ?? '')
    switcher.set(currentBusiness)

    // A failure to list is not a failure to run: the pane keeps what it had, and
    // the operator sees an unchanged builder rather than an empty one.
    //
    // A REFUSED SESSION IS THE ONE FAILURE THAT STOPS HERE ([[BUG-52]]). It used
    // to arrive as `[]` like any other, and an empty list is what then emptied
    // the pane, the Library and the Contacts tab — the empty account this bug is
    // named for. The notice above has already said what happened, so the honest
    // response is to change nothing: everything below this line rewrites a
    // surface, and every one of those rewrites would be a lie about a store this
    // session can no longer read.
    const list = await loadSitesFor(currentBusiness).catch((error) =>
      isSessionEnded(error) ? null : [],
    )
    if (list === null) return
    const slug = list.some((entry) => entry.slug === currentSite)
      ? currentSite
      : (list[0]?.slug ?? null)

    if (slug === currentSite) {
      // SAME SLUG, DIFFERENT BUSINESS — and `setSite` is deliberately a no-op on
      // an unchanged slug, so the subscription above will not fire and what it
      // does has to be done here instead. This is the case that makes "the scope
      // moved" and "the site changed" genuinely different events: a reload, or
      // two businesses that happen to name a site the same way.
      //
      // CALLING IT WAS NEVER ENOUGH ON ITS OWN ([[BUG-69]]). The session the
      // origin answers with is named after the slug, so on this path it came
      // back with the id already on screen and the pane treated the swap as a
      // no-op — the right transcript, read and discarded. `conversationKey`
      // is what makes the two tellable apart.
      void showSite(slug)
    } else {
      panel.setSite(slug)
    }
    currentSite = slug
    // An unchanged slug under a changed business is still a changed URL — the
    // prefix is part of it. See `panel.refresh`.
    panel.refresh()

    // CLEARED, THEN ALWAYS RE-READ ([[REQ-181]]). This is a different business's
    // material rather than the same list under a different badge — and because
    // the re-read is allowed to fail, the rows are dropped first. Leaving the
    // previous business's material on screen under a header naming this one is
    // the one outcome a failure here may not produce.
    //
    // THE CHANGE FEED RIDES ON THIS PAIR AND NEEDS NOTHING ADDED HERE
    // ([[REQ-201]]). `clear` closes the subscription raised under the OLD
    // business and `refresh` opens one under the new scope, from the cursor its
    // own read returned. That places both halves inside the panel, which is
    // where they can be true of every caller rather than of this one — and it is
    // why a switch remains a clear-and-re-read and never a patch.
    library.clear()
    await library.refresh().catch(() => {})
    people.clear()
    await people.refresh().catch(() => {})
  }

  /**
   * Which business this mount opens on.
   *
   * The remembered id is a HINT — `resolveBusiness` falls back silently when the
   * account can no longer operate it, which is the state browser storage
   * outliving a grant produces. With no businesses at all it resolves to null,
   * which sets no prefix and leaves every URL exactly as it was.
   */
  const initialBusiness = resolveBusiness(businesses, businessStorage.getItem('id'))
  switcher.set(initialBusiness)
  void selectBusiness(initialBusiness)

  return {
    shell,
    split,
    panel,
    toolbar,
    chat,
    /**
     * The shell's scope, and the only way to move it ([[REQ-179]]).
     *
     * Exposed so a suite can drive a business switch the way an operator does —
     * and so a host that grows a second entry point to the same act (a deep link
     * carrying a business, say) reaches THIS function rather than reimplementing
     * the five steps it sequences.
     */
    scope: {
      getBusiness: () => currentBusiness,
      getSite: () => currentSite,
      setBusiness: (id) => selectBusiness(id),
    },
    /** The switcher itself, for the chrome assertions. */
    switcher,
    /**
     * The palette popup's second entry point (REQ-133 §1).
     *
     * The toolbar's Colors button is the first; this is the seam a color field
     * opens it through to PICK a value — `openPalette(slug, {mode: 'pick',
     * value})` resolves to a palette reference, or to null if the operator
     * cancelled. Exposed here rather than imported directly by whatever needs it
     * so that the host, the transport and the shade arithmetic are bound once,
     * in the one module that knows all three.
     */
    openPalette,
    library,
    upload,
    /** The REQ-173 banner, or `null` on a deployment that can reach a model. */
    banner,
    /**
     * The signed-out notice, or `null` while the session is good ([[BUG-52]]).
     *
     * A getter rather than a value: it appears mid-session, long after this
     * object is returned, and the whole claim worth proving is that a builder
     * that mounted healthy grows one when its session lapses under it.
     */
    get sessionNotice() {
      return sessionNotice?.element ?? null
    },
    /**
     * What the overlay calls when a drop is committed — named so the refusal on
     * an unconfigured deployment is provable without simulating a browser
     * gesture (REQ-173). It is the same function the overlay is handed, not a
     * second path to it.
     */
    receiveFiles,
    destroy() {
      banner?.remove()
      unwatchSession()
      sessionNotice?.element.remove()
      unbindDocument()
      unbindSite()
      switcher.destroy()
      unwatchChat()
      unwatchLibrary()
      upload.destroy()
      library.destroy()
      chat.destroy()
      points.destroy()
      editor?.destroy()
      toolbar.destroy()
      split.destroy()
      panel.destroy()
      shell.destroy()
    },
  }
}

/**
 * Put the reason at the top and make everything below it unusable (REQ-173).
 *
 * `inert` IS THE WHOLE MECHANISM. It removes the subtree from the tab order,
 * from hit testing and from the accessibility tree in one attribute — so the
 * block covers every surface the builder has and every surface it grows, with
 * nothing per-panel to remember. The class beside it is what makes the state
 * VISIBLE: an app that silently ignores clicks reads as broken, and the banner is
 * only believed if the thing it is talking about looks disabled.
 *
 * @returns the banner element, so the caller can take it away again.
 */
function blockEverything(root, shell, message) {
  const banner = document.createElement('div')
  banner.className = 'builder-banner'
  // `alert` rather than `status`: this is not progress, it is the reason nothing
  // below responds, and a screen reader should reach it without being asked.
  banner.setAttribute('role', 'alert')
  banner.textContent = message ?? 'This builder is not configured, so nothing here can run.'
  root.prepend(banner)
  shell.element.setAttribute('inert', '')
  shell.element.classList.add('builder-shell--blocked')
  return banner
}

/**
 * Take the tabs away and leave the chrome ([[REQ-179]] reopen).
 *
 * INERT ON THE TAB STRIP AND THE PANELS, NOT ON THE SHELL. The header keeps the
 * switcher, the avatar and the shell's own two controls — see the call site for
 * why that boundary is [[DOC-42]] §5's and not a layout preference. `inert` is
 * one attribute over each subtree rather than a per-surface disabling to keep in
 * step as surfaces are added, which is the same reasoning
 * {@link blockEverything} uses one level up.
 *
 * THE BANNER SITS IN THE CONTENT AREA, ABOVE THE PANELS AND OUTSIDE THEM. Where
 * the product would be, which is where a person looks when it is not there — and
 * outside the inert subtree, because a message whose text cannot be selected is a
 * message that cannot be pasted into a support request.
 *
 * IT DEGRADES RATHER THAN THROWS if the shell's markup moves. A banner with no
 * block is a visible wrong state an operator can report; a silent no-op is a
 * lapsed account looking at a builder whose every call 403s.
 */
function blockTabs(shell, message) {
  const tabs = shell.element.querySelector('.shell-tabs')
  const panels = shell.element.querySelector('.shell-panels')
  const content = shell.element.querySelector('.shell-content')

  const banner = document.createElement('div')
  banner.className = 'builder-banner builder-banner--no-business'
  // `alert` rather than `status`, for {@link blockEverything}'s reason: this is
  // not progress, it is why nothing below it responds.
  banner.setAttribute('role', 'alert')
  banner.textContent = message
  if (content && panels) content.insertBefore(banner, panels)
  else (content ?? shell.element).prepend(banner)

  tabs?.setAttribute('inert', '')
  panels?.setAttribute('inert', '')
  shell.element.classList.add('builder-shell--no-business')
  return banner
}

/**
 * What a chat-route drop says in the conversation (REQ-161).
 *
 * IN THE CLIENT'S VOICE AND AS THE CLIENT'S TURN, because that is what it is:
 * they handed us a file, and the transcript should read as though they did.
 *
 * IT REPORTS WHAT ACTUALLY HAPPENED, including the parts that went wrong. An
 * upload that stored the bytes but could not index them is the failure DOC-39 §4
 * calls INVISIBILITY rather than staleness — search will never return it — and a
 * confirmation that said "added" and nothing else would make that state
 * indistinguishable from a working one to the only person who could tell us.
 */
/**
 * Why an upload was refused, in the origin's own words ([[REQ-221]]).
 *
 * THE ORIGIN'S SENTENCE AND NOT A SUBSTITUTE FOR IT. `CopyError` carries the
 * `error` field off the refusal envelope, and that field is written for the
 * client — `material.ts` composes it knowing the ceiling, the format and the
 * remedy. Anything this side invented would be a worse sentence about a fact it
 * knows less about.
 *
 * THE FALLBACK IS FOR A FAILURE WITH NO WORDS: a dropped connection, an origin
 * that answered non-JSON. Those have no client-facing sentence anywhere, so this
 * is the only place one can come from.
 *
 * IT DOES NOT NAME THE FILE, because both callers do — the chat note prefixes it
 * and the Library's notice lists it — and the origin's own messages deliberately
 * leave the naming to them.
 */
function refusalReason(failure) {
  return failure?.message ?? 'the upload failed'
}

function uploadNote(file, result, failure) {
  if (failure || !result) {
    return `📎 **${file.name}** — that didn't upload: ${refusalReason(failure)}`
  }
  const lines = [`📎 **${file.name}**`]
  if (result.site_asset) lines.push(`Added, and it's on your site as \`${result.site_asset}\`.`)
  else if (result.role === 'reference') {
    lines.push("Added. I'll read it — it won't appear on your site.")
  } else lines.push('Added.')
  if (result.site_asset_error) {
    lines.push(`I couldn't put it on the site yet: ${result.site_asset_error}`)
  }
  if (result.indexed === false) {
    lines.push("I've stored it, but I can't search it yet.")
  }
  return lines.join('\n\n')
}
