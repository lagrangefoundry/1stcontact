import { mountShell } from '@lagrangefoundry/webui-shell'
import { mountSplit } from '@lagrangefoundry/webui-split'
import { createChatPanel } from './chat.js'
import {
  ACCOUNT_ACTION_ID,
  ACCOUNT_LABEL,
  APP_FONT,
  APP_ID,
  LIBRARY_TAB,
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
import { markdownReady as defaultMarkdownReady } from './markdown.js'
import { createDisplayPanel } from './panel.js'
import { openPalettePopup } from './palette-popup.js'
import { createUploadOverlay } from './upload.js'
import {
  colorsAction,
  createToolbar,
  modeToggleAction,
  openInNewTabAction,
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
     */
    businesses = [],
    /** Who is signed in, for the avatar and the account surface behind it. */
    account = null,
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
        content: accountAvatar(account),
        title: ACCOUNT_LABEL,
        ariaLabel: ACCOUNT_LABEL,
        onClick: () =>
          openAccountSurface({
            // Inside the shell root, for the reason every other builder dialog
            // is: the `--shell-*` tokens and the app font are declared on
            // `.shell`, and a dialog beside it resolves neither.
            host: shell.element,
            account,
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
    loadSites ?? (businesses.length > 0 ? () => fetchSites() : async () => sites)

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

  const panel = createDisplayPanel({
    storage: shell.storage(STORAGE_KEYS.panel),
    site: sites[0]?.slug ?? null,
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
      src: ({ site }) => previewUrl(site, 'draft'),
      actions: ['mode-toggle', 'colors', 'open-new-tab', 'publish'],
    })
    .registerMode({
      id: 'edit',
      label: 'Edit',
      src: ({ site }) => previewUrl(site, 'edit'),
      // `colors` in BOTH channels: a palette is a property of the site, not of
      // one rendering of it, so there is no mode in which changing it is
      // meaningless (REQ-133).
      actions: ['mode-toggle', 'colors', 'open-new-tab', 'publish'],
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
      onChanged: () => panel.frame.contentWindow?.location.reload(),
      ...opts,
    })

  const toolbar = createToolbar({
    panel,
    // THE SCOPE, HANDED DOWN ([[REQ-179]]). A toolbar action acts on the site
    // the shell's scope names; it does not ask the pane which one that is. See
    // `NO_SITE` in `toolbar.js` for what an unwired host gets and why.
    context: { getSite: () => currentSite },
    actions: [
      modeToggleAction(),
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
    onSiteChanged: () => panel.frame.contentWindow?.location.reload(),
  })

  const splitHost = document.createElement('div')
  splitHost.className = 'builder-split'

  const layout = document.createElement('div')
  layout.className = 'builder-layout'
  layout.append(toolbar.element, splitHost)
  shell.getPanel(SITE_TAB.id).append(layout)

  /**
   * Bind the edit loop to whatever the frame is currently showing (REQ-117).
   *
   * It re-binds on every `load` rather than once at mount, because the document
   * inside the iframe is REPLACED on each navigation — switching site, switching
   * mode, and the refresh after a save all produce a new `contentDocument`, and
   * a bridge holding the old one is bound to a document nobody can see.
   *
   * View mode needs no guard here: `mountL1EditBridge` refuses to bind on a
   * document without the edit marker, so this is a no-op there by construction
   * rather than by us remembering to check (DOC-28 §7.1).
   */
  let editor = null
  const rebind = () => {
    editor?.destroy()
    editor = null
    // No bridge supplied → no editing. The browser entry always supplies one;
    // a host that does not (a test mounting only the chrome) gets the pane and
    // the toolbar with no edit loop, rather than a module that fails to load.
    if (!editBridge) return
    const doc = panel.frame.contentDocument
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
      onSaved: () => panel.frame.contentWindow?.location.reload(),
    })
  }
  panel.frame.addEventListener('load', rebind)

  /**
   * The Library (REQ-161), in its own tab beside the site.
   *
   * IT FOLLOWS THE SHELL'S SCOPE for the badge and the "used on this site"
   * filter, by the same rule the assistant does ([[REQ-179]]): a scope is chosen
   * in exactly one place. What it does NOT do is scope its LIST to that site —
   * see `library.js` for why the badge is a view and never a boundary.
   *
   * The list IS scoped to the business, though, and that is not the same thing:
   * material is business-wide ([[DOC-38]] §7.7), so a business switch changes
   * the list itself rather than merely the badge on it, which is why
   * `selectBusiness` re-reads it rather than only calling `siteChanged()`.
   */
  const library = createLibraryPanel({
    storage: shell.storage(STORAGE_KEYS.library),
    getSite: () => currentSite,
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
    for (const file of files) {
      let result = null
      let failure = null
      try {
        result = await sendUpload({ file, role, slug: currentSite ?? undefined })
      } catch (err) {
        failure = err
      }
      if (source === 'chat') {
        chat.getChat()?.appendMessage('user', uploadNote(file, result, failure))
      }
    }
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
  async function showSite(slug) {
    const mine = ++generation
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
      chat.setSession({
        sessionId: `unconfigured:${slug}`,
        turns: [],
        ready: false,
        error: aiStatus.message ?? 'The assistant is not available.',
      })
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
      chat.setSession(session)
    } catch (err) {
      // The note this writes is markdown too, so the failure path waits as well.
      await markdownReady
      if (mine !== generation) return
      // A session that cannot be opened at all is reported the way an unusable
      // one is — in the pane, with the transcript it does not have. `ready:false`
      // is the same story the origin tells when it CAN answer, so the pane needs
      // no second failure mode.
      chat.setSession({
        sessionId: `unopened:${slug}`,
        turns: [],
        ready: false,
        error: `The assistant could not be reached: ${err.message}`,
      })
    }
  }

  /**
   * The pane REPORTS what it is displaying, and everything that is about a site
   * follows that report ([[REQ-179]]).
   *
   * Nothing interrogates the pane any more. This is the one subscription, and
   * it is what a site change — from wherever — means: the assistant is a session
   * per site and is re-opened; the Library's badge and its "used on this site"
   * filter redraw. The Library's LIST is not re-read here, because a site change
   * within one business does not change it (`selectBusiness` re-reads it,
   * because a BUSINESS change does).
   *
   * It is also what makes an in-tab site selector a later addition rather than a
   * later untangling: when a business can hold several sites, that control calls
   * `panel.setSite` and everything below already follows.
   */
  const unbindSite = panel.on('site', (slug) => {
    currentSite = slug
    void showSite(slug)
    library.siteChanged()
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
   *   5. the Library, whose list is business-wide and is therefore genuinely a
   *      different list — not merely a redrawn badge.
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
    const list = await loadSitesFor(currentBusiness).catch(() => [])
    const slug = list.some((entry) => entry.slug === currentSite)
      ? currentSite
      : (list[0]?.slug ?? null)

    if (slug === currentSite) {
      // SAME SLUG, DIFFERENT BUSINESS — and `setSite` is deliberately a no-op on
      // an unchanged slug, so the subscription above will not fire and the two
      // things it does have to be done here instead. This is the case that makes
      // "the scope moved" and "the site changed" genuinely different events: a
      // reload, or two businesses that happen to name a site the same way.
      void showSite(slug)
      library.siteChanged()
    } else {
      panel.setSite(slug)
    }
    currentSite = slug
    // An unchanged slug under a changed business is still a changed URL — the
    // prefix is part of it. See `panel.refresh`.
    panel.refresh()

    // ALWAYS RE-READ, unlike the site case above: material is business-wide
    // ([[DOC-38]] §7.7), so this is a different list rather than the same list
    // with a different badge on it.
    await library.refresh().catch(() => {})
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
     * What the overlay calls when a drop is committed — named so the refusal on
     * an unconfigured deployment is provable without simulating a browser
     * gesture (REQ-173). It is the same function the overlay is handed, not a
     * second path to it.
     */
    receiveFiles,
    destroy() {
      banner?.remove()
      panel.frame.removeEventListener('load', rebind)
      unbindSite()
      switcher.destroy()
      unwatchChat()
      unwatchLibrary()
      upload.destroy()
      library.destroy()
      chat.destroy()
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
function uploadNote(file, result, failure) {
  if (failure || !result) {
    return `📎 **${file.name}** — that didn't upload: ${failure?.message ?? 'the upload failed'}`
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
