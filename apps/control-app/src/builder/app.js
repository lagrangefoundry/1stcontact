import { mountShell } from '@lagrangefoundry/webui-shell'
import { mountSplit } from '@lagrangefoundry/webui-split'
import { createChatPanel } from './chat.js'
import { APP_FONT, APP_ID, SITE_TAB, STORAGE_KEYS, TABS } from './config.js'
import { mountEditor } from './editor.js'
import { createDisplayPanel } from './panel.js'
import { openPalettePopup } from './palette-popup.js'
import {
  colorsAction,
  createToolbar,
  modeToggleAction,
  openInNewTabAction,
  publishAction,
  siteSelectorAction,
} from './toolbar.js'
import { fetchPalette, openChatSession, previewUrl, writePalette } from './api.js'

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
  } = options

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
    ...(storage ? { storage } : {}),
  })

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
      actions: ['site-selector', 'mode-toggle', 'colors', 'open-new-tab', 'publish'],
    })
    .registerMode({
      id: 'edit',
      label: 'Edit',
      src: ({ site }) => previewUrl(site, 'edit'),
      // `colors` in BOTH channels: a palette is a property of the site, not of
      // one rendering of it, so there is no mode in which changing it is
      // meaningless (REQ-133).
      actions: ['site-selector', 'mode-toggle', 'colors', 'open-new-tab', 'publish'],
    })
    .restore()

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
    actions: [
      siteSelectorAction(sites, SITE_TAB.label),
      modeToggleAction(),
      colorsAction(openPalette),
      openInNewTabAction(),
      publishAction(publish),
    ],
  })

  /**
   * The assistant, in the split's secondary (REQ-122).
   *
   * It follows the panel's site rather than owning a selector of its own: the
   * toolbar's selector is the one place a site is chosen, and a second control
   * that could disagree with it is worse than no control at all.
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
      slug: panel.getSite(),
      bridge: editBridge,
      // INSIDE the shell root, which is where both halves of the modal's
      // appearance are declared: the `--shell-*` tokens and the app font. On
      // `document.body` — a sibling of the shell — it resolved neither.
      host: shell.element,
      // The origin has already re-rendered the edit channel by the time a save
      // resolves, so the frame only has to reload — and reloading fires `load`,
      // which re-binds against the new document.
      onSaved: () => panel.frame.contentWindow?.location.reload(),
    })
  }
  panel.frame.addEventListener('load', rebind)

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
   * chosen. That is the layering the ticket is about: the toolbar owns the site
   * selector, `app.js` owns the switch, and everything below holds a session.
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
    try {
      const session = await openSession(slug)
      if (mine !== generation) return
      chat.setSession(session)
    } catch (err) {
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

  // Subscribed BEFORE the first call so a `restore()` that has already run and a
  // change made a second from now take the identical path.
  const unbindSite = panel.on('site', (slug) => void showSite(slug))
  void showSite(panel.getSite())

  return {
    shell,
    split,
    panel,
    toolbar,
    chat,
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
    destroy() {
      panel.frame.removeEventListener('load', rebind)
      unbindSite()
      chat.destroy()
      editor?.destroy()
      toolbar.destroy()
      split.destroy()
      panel.destroy()
      shell.destroy()
    },
  }
}
