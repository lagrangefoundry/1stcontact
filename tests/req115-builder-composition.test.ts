// @vitest-environment jsdom
/**
 * REQ-115 — the browser composition (DOC-28 §7.1, §12 T1).
 *
 * Mounted against the ACTUALLY-INSTALLED shared `webui-*` components, not
 * stand-ins: the consumption route is most of this ticket's risk, and a mocked
 * shell would prove nothing about it.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ slug: 'alpha', latest: null }, { slug: 'beta', latest: 1 }]

/**
 * `app.js` imports the webui components by bare specifier, so it is loaded
 * dynamically: on a machine without them installed a static import would fail
 * the whole file at transform time rather than reporting a skip.
 */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let createDisplayPanel: (opts?: Record<string, unknown>) => never
let APP_ID: string
let SITE_TAB: { id: string; label: string }
let STORAGE_KEYS: { split: string; panel: string }

if (!WEBUI_INSTALLED) console.warn(`REQ-115 composition suites skipped: ${WEBUI_SKIP_REASON}`)

/** A `Storage`-shaped map, so assertions can read the exact keys written. */
function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ createDisplayPanel } = await import('../apps/control-app/src/builder/panel.js'))
    ;({ APP_ID, SITE_TAB, STORAGE_KEYS } = await import(
      '../apps/control-app/src/builder/config.js'
    ))
  }
  // jsdom ships neither; the split primitive observes its container.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-115 shell + split', () => {
  it('test_UAT_FC_REQ-115_shell_mounts_one_site_tab_and_hosts_the_panel', () => {
    const storage = memoryStorage()
    const app = mountBuilder(root, { sites: SITES, storage })

    // AC 2 — one tab, addressed by its stable id, host-filled via getPanel.
    expect(app.shell.getActiveTab()).toBe(SITE_TAB.id)
    expect(SITE_TAB.id).toBe('site')
    const panelHost = app.shell.getPanel(SITE_TAB.id)
    expect(panelHost).toBeTruthy()
    expect(panelHost.contains(app.panel.element)).toBe(true)
    expect(root.textContent).toContain(SITE_TAB.label)
  })

  it('test_UAT_FC_REQ-115_split_shows_panel_and_chat_pane', () => {
    const storage = memoryStorage()
    const app = mountBuilder(root, { sites: SITES, storage })

    // AC 4 — display panel | assistant pane, with a real divider. REQ-122
    // replaced the placeholder this used to look for with the live panel; the
    // criterion is about the split's two halves, not about what fills them.
    expect(app.split.element.contains(app.panel.element)).toBe(true)
    expect(app.split.element.querySelector('.builder-chat')).toBeTruthy()
    expect(app.split.element.querySelector('.split__divider, [class*="divider"]')).toBeTruthy()

    // Collapse to rail and reopen to the prior width.
    const before = app.split.getSplit()
    app.split.collapse('secondary')
    expect(app.split.isCollapsed()).toBeTruthy()
    app.split.expand()
    expect(app.split.isCollapsed()).toBeFalsy()
    expect(app.split.getSplit()).toBeCloseTo(before, 5)
  })

  it('test_UAT_FC_REQ-115_layout_state_persists_under_the_app_namespace', () => {
    const storage = memoryStorage()
    const app = mountBuilder(root, { sites: SITES, storage })

    app.split.setSplit(42)
    app.split.setMode('primary-only')
    app.panel.setSite('beta')

    // AC 5 — every persisted key is namespaced by appId; nothing is written bare.
    const keys = [...storage.map.keys()]
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) expect(key.startsWith(`${APP_ID}:`)).toBe(true)
    expect(keys.some((k) => k.startsWith(`${APP_ID}:${STORAGE_KEYS.split}:`))).toBe(true)
    expect(keys.some((k) => k.startsWith(`${APP_ID}:${STORAGE_KEYS.panel}:`))).toBe(true)

    // Survives a reload: same backing store, fresh mount.
    app.destroy()
    document.body.replaceChildren()
    const root2 = document.createElement('div')
    document.body.append(root2)
    const again = mountBuilder(root2, { sites: SITES, storage })
    expect(again.split.getSplit()).toBeCloseTo(42, 5)
    expect(again.split.getMode()).toBe('primary-only')
    expect(again.panel.getSite()).toBe('beta')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-115 display panel mode contract', () => {
  it('test_UAT_FC_REQ-115_mode_switch_swaps_the_source_without_remounting', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    const { panel } = app

    const pane = panel.element
    const frame = panel.frame
    expect(panel.getMode()).toBe('view')
    expect(frame.getAttribute('src')).toBe('/preview/alpha/draft/')

    panel.setMode('edit')
    // AC 7 — the pane is the SAME node; only the source changed.
    expect(panel.element).toBe(pane)
    expect(panel.frame).toBe(frame)
    expect(frame.getAttribute('src')).toBe('/preview/alpha/edit/')
    expect(app.shell.getPanel(SITE_TAB.id).contains(pane)).toBe(true)

    panel.setMode('view')
    expect(panel.frame).toBe(frame)
    expect(frame.getAttribute('src')).toBe('/preview/alpha/draft/')
  })

  it('test_UAT_FC_REQ-115_registering_a_mode_is_an_entry_not_a_branch', () => {
    // AC 7 — a mode the panel has never heard of, added from outside, works
    // end to end. Nothing in the panel names it.
    const panel = createDisplayPanel({ site: 'alpha' })
    panel.registerMode({ id: 'view', label: 'View', src: () => '/preview/alpha/draft/' })

    let mountedInto: HTMLElement | null = null
    panel.registerMode({
      id: 'revisions',
      label: 'Revisions',
      mount: (host: HTMLElement) => {
        mountedInto = host
        host.append(document.createTextNode('revision diff'))
      },
    })

    const frame = panel.frame
    panel.setMode('revisions')
    expect(panel.getMode()).toBe('revisions')
    expect(mountedInto).toBeTruthy()
    expect(panel.element.textContent).toContain('revision diff')
    // A non-document mode hides the frame rather than pointing it somewhere.
    expect(frame.hidden).toBe(true)
    expect(panel.getSrc()).toBe('')

    panel.setMode('view')
    expect(panel.frame).toBe(frame)
    expect(frame.hidden).toBe(false)
    expect(() => panel.setMode('nope')).toThrow(/unknown mode/)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-115 toolbar', () => {
  it('test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    const link = app.toolbar.get('open-new-tab') as HTMLAnchorElement

    // AC 8 — identical URL, and it stays identical as the pane changes.
    expect(link.getAttribute('href')).toBe(app.panel.frame.getAttribute('src'))
    app.panel.setMode('edit')
    expect(link.getAttribute('href')).toBe(app.panel.frame.getAttribute('src'))
    app.panel.setSite('beta')
    expect(link.getAttribute('href')).toBe(app.panel.frame.getAttribute('src'))
    expect(link.target).toBe('_blank')
  })

  it('test_UAT_FC_REQ-115_site_selector_switches_the_displayed_site', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    const select = app.toolbar.get('site-selector') as HTMLSelectElement

    // AC 6 — options come from the store listing, not a hardcoded set.
    expect([...select.options].map((o) => o.value)).toEqual(['alpha', 'beta'])
    select.value = 'beta'
    select.dispatchEvent(new Event('change'))
    expect(app.panel.getSite()).toBe('beta')
    expect(app.panel.frame.getAttribute('src')).toBe('/preview/beta/draft/')
  })

  it('test_UAT_FC_REQ-115_toolbar_controls_follow_the_active_mode', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })

    // Mode-aware, not a fixed strip: a mode that shows no document does not
    // get "open in new tab".
    app.panel.registerMode({
      id: 'assets',
      label: 'Assets',
      mount: (host: HTMLElement) => host.append(document.createTextNode('assets')),
      actions: ['site-selector', 'mode-toggle'],
    })
    const toolbarEl = app.toolbar.element
    app.panel.setMode('assets')
    expect(app.toolbar.ids()).toEqual(['site-selector', 'mode-toggle'])
    expect(app.toolbar.get('open-new-tab')).toBeNull()
    // The toolbar itself is never rebuilt out of the layout.
    expect(app.toolbar.element).toBe(toolbarEl)

    app.panel.setMode('view')
    expect(app.toolbar.ids()).toContain('open-new-tab')
    expect(app.toolbar.ids()).toContain('publish')
  })

  it('test_UAT_FC_REQ-115_publish_button_calls_publish_for_the_shown_site', async () => {
    const publish = vi.fn().mockResolvedValue({ id: 1 })
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), publish })

    app.panel.setSite('beta')
    ;(app.toolbar.get('publish') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(publish).toHaveBeenCalledWith('beta'))
  })
})
