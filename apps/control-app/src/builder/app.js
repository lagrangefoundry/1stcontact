import { mountShell } from '@lagrangefoundry/webui-shell'
import { mountSplit } from '@lagrangefoundry/webui-split'
import { APP_FONT, APP_ID, SITE_TAB, STORAGE_KEYS, TABS } from './config.js'
import { mountEditor } from './editor.js'
import { createDisplayPanel } from './panel.js'
import {
  createToolbar,
  modeToggleAction,
  openInNewTabAction,
  publishAction,
  siteSelectorAction,
} from './toolbar.js'
import { previewUrl } from './api.js'

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
  const { sites = [], publish = async () => {}, storage, editBridge = null } = options

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
      actions: ['site-selector', 'mode-toggle', 'open-new-tab', 'publish'],
    })
    .registerMode({
      id: 'edit',
      label: 'Edit',
      src: ({ site }) => previewUrl(site, 'edit'),
      actions: ['site-selector', 'mode-toggle', 'open-new-tab', 'publish'],
    })
    .restore()

  const toolbar = createToolbar({
    panel,
    actions: [
      siteSelectorAction(sites, SITE_TAB.label),
      modeToggleAction(),
      openInNewTabAction(),
      publishAction(publish),
    ],
  })

  // The chat pane is a placeholder: webui-chat is phase-1 non-scope (DOC-28 §12).
  const chat = document.createElement('div')
  chat.className = 'builder-chat-placeholder'
  chat.textContent = 'Chat arrives with the next phase.'

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
    secondary: chat,
    initialSplit: 65,
    collapse: { side: 'secondary', style: 'rail' },
    storage: shell.storage(STORAGE_KEYS.split),
  })

  return {
    shell,
    split,
    panel,
    toolbar,
    destroy() {
      panel.frame.removeEventListener('load', rebind)
      editor?.destroy()
      toolbar.destroy()
      split.destroy()
      panel.destroy()
      shell.destroy()
    },
  }
}
