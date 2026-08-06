import { mountShell } from '@gendevlabs/webui-shell'
import { mountSplit } from '@gendevlabs/webui-split'
import { APP_ID, SITE_TAB, STORAGE_KEYS, TABS } from './config.js'
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
  const { sites = [], publish = async () => {}, storage } = options

  const shell = mountShell(root, {
    appId: APP_ID,
    // Passed straight through: a TABS entry IS a shell tab spec, and narrowing
    // it here to `{id, label}` silently dropped `fill` (and would drop `badge`
    // next). The shell validates the shape, so there is nothing to guard.
    tabs: TABS,
    tabStyle: 'underline',
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
   * Edit is a registered stub: the mode exists and the pane switches to it, but
   * the edit RENDER is REQ-116 (T2) and the editing itself is REQ-117 (T3).
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
      split.destroy()
      panel.destroy()
      shell.destroy()
    },
  }
}
