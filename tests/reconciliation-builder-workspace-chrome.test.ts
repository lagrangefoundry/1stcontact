// @vitest-environment jsdom
/**
 * story-e674c60a — **the builder workspace, chrome side**: the tab, the display
 * panel and its modes, the mode-declared toolbar, the split, and what persists.
 *
 * Mounted against the ACTUALLY-INSTALLED shared `webui-*` components, never
 * stand-ins. The consumption route is most of this story's risk and a mocked
 * shell would prove nothing about it, so these suites SKIP with a reported
 * reason on a machine that has not run the out-of-band install (story Technical
 * Context: a green run there proves less than it appears to).
 *
 * The one criterion with a machine-independent core — AC-960, whose real content
 * is a source-tree search — asserts that core unconditionally.
 */

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const SITES = [
  { slug: 'alpha', latest: null },
  { slug: 'beta', latest: 1 },
]

/**
 * `app.js` imports the webui components by bare specifier, so it is loaded
 * dynamically: on a machine without them a static import would fail the whole
 * file at transform time rather than reporting a skip.
 */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let mountShell: (root: HTMLElement, opts: Record<string, unknown>) => never
let APP_ID: string
let SITE_TAB: { id: string; label: string; fill?: boolean }
let TABS: Array<Record<string, unknown> & { id: string }>
let STORAGE_KEYS: { split: string; panel: string }

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a chrome suites skipped: ${WEBUI_SKIP_REASON}`)

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
    /**
     * AC-976's mutation check needs the shell directly, and a bare specifier
     * here would be resolved by vite at TRANSFORM time — failing the whole file
     * on a machine without the components instead of reporting a skip. Resolve
     * through the package's own declared entry and import by file URL, the same
     * route `webui.ts` uses to serve it.
     */
    const { webuiExports, webuiPackageDir } = await import('../tools/generate/src/cli/webui')
    const entry = webuiExports('webui-shell')['.'].replace(/^\.\//, '')
    const href = pathToFileURL(path.join(webuiPackageDir('webui-shell'), entry)).href
    ;({ mountShell } = (await import(/* @vite-ignore */ href)) as {
      mountShell: typeof mountShell
    })
  }
  // `config.js` imports nothing, so it loads on every machine — AC-960's search
  // half needs its declared label whether or not the components are present.
  ;({ APP_ID, SITE_TAB, TABS, STORAGE_KEYS } = await import(
    '../apps/control-app/src/builder/config.js'
  ))
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

// ── the tab chrome ───────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a workspace chrome', () => {
  it('test_UAT_AC959_opens_exactly_one_tab_addressed_by_a_stable_id', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })

    // AC-959 — the COUNT, not merely the presence of one: a second tab
    // appearing is the failure this guards. The shell renders one panel per
    // declared tab, so both counts must be exactly one.
    expect(TABS).toHaveLength(1)
    expect(root.querySelectorAll('.shell-panel')).toHaveLength(1)

    // Addressed by a stable identifier that never changes when the name does.
    expect(SITE_TAB.id).toBe('site')
    expect(app.shell.getActiveTab()).toBe(SITE_TAB.id)

    // The display panel is hosted INSIDE that tab's content area, not beside or
    // outside the tab chrome.
    const panelHost = app.shell.getPanel(SITE_TAB.id)
    expect(panelHost).toBeTruthy()
    expect(panelHost.contains(app.panel.element)).toBe(true)
    expect(root.querySelector('.shell-panel')!.contains(app.panel.element)).toBe(true)
  })

  it('test_UAT_AC976_every_option_declared_for_a_tab_reaches_the_chrome', () => {
    // AC-976 — a tab is declared ONCE, whole. `fill` was declared correctly and
    // still had no effect because the mount rebuilt each tab as `{id, label}`;
    // nothing threw and nothing warned, the option simply never arrived.
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })

    /**
     * The observable consequence of each declared key. Keyed by option name so
     * the loop below iterates over the DECLARATION rather than a fixed list: an
     * option added to `SITE_TAB` later has no entry here and fails this test
     * until someone states what it should do, which is exactly the silent drop
     * the criterion is about.
     */
    const delivered: Record<string, (value: unknown) => void> = {
      id: (value) => {
        expect(app.shell.getPanel(value as string)).toBeTruthy()
        expect(app.shell.getActiveTab()).toBe(value)
      },
      label: (value) => {
        expect(root.textContent).toContain(value as string)
      },
      fill: (value) => {
        // The shell's viewport-height rules are all scoped to
        // `.shell-panel.is-fill`; without the class the chain below is
        // content-height and the frame collapses to its intrinsic 150px.
        expect(value).toBe(true)
        const filled = root.querySelector('.shell-panel.is-fill.is-active')
        expect(filled, 'the live site panel opts into the fill chain').toBeTruthy()
        expect(filled!.contains(app.panel.element)).toBe(true)
      },
    }

    for (const tab of TABS) {
      for (const key of Object.keys(tab)) {
        expect(
          delivered[key],
          `tab option "${key}" is declared but nothing here proves it is delivered`,
        ).toBeTypeOf('function')
        delivered[key](tab[key])
      }
    }

    // MUTATION CHECK — the option is load-bearing, not decorative. A tab
    // declared WITHOUT it must not produce the class the height rules key on,
    // so the pane it hosts could not fill the viewport.
    const bare = document.createElement('div')
    document.body.append(bare)
    mountShell(bare, {
      appId: `${APP_ID}-mutation`,
      tabs: [{ id: SITE_TAB.id, label: SITE_TAB.label }],
      tabStyle: 'underline',
      storage: memoryStorage(),
    })
    expect(bare.querySelector('.shell-panel')).toBeTruthy()
    expect(
      bare.querySelector('.shell-panel.is-fill'),
      'without `fill` the panel does not enter the viewport-height chain',
    ).toBeNull()
  })
})

// ── the naming seam ──────────────────────────────────────────────────────────

describe('story-e674c60a naming', () => {
  it('test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site', () => {
    // AC-960 — the label is provisional chrome, so renaming it must be a
    // one-line change. The id is what code addresses; the label must never be a
    // repeated literal anywhere in the tree.
    const hits: string[] = []
    for (const rootDir of ['apps', 'tools', 'packages']) {
      for (const file of walk(path.join(REPO, rootDir))) {
        const lines = fs.readFileSync(file, 'utf8').split('\n')
        for (const [i, line] of lines.entries()) {
          if (line.includes(`'${SITE_TAB.label}'`) || line.includes(`"${SITE_TAB.label}"`)) {
            hits.push(`${path.relative(REPO, file)}:${i + 1}`)
          }
        }
      }
    }
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatch(/^apps\/control-app\/src\/builder\/config\.js:\d+$/)

    // …and that one occurrence is the declaration itself, so changing it there
    // changes every rendered occurrence.
    const line = Number(hits[0].split(':')[1])
    const configSrc = fs
      .readFileSync(path.join(REPO, 'apps/control-app/src/builder/config.js'), 'utf8')
      .split('\n')
    expect(configSrc[line - 1]).toContain('export const SITE_TAB')

    if (!WEBUI_INSTALLED) {
      console.warn(
        `story-e674c60a: the rendered tab label and site-selector accessible name are ` +
          `NOT VERIFIED here — ${WEBUI_SKIP_REASON}`,
      )
      return
    }

    // Both places the name is shown read from that single declaration.
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    expect(root.textContent).toContain(SITE_TAB.label)
    const select = app.toolbar.get('site-selector') as HTMLSelectElement
    expect(select.getAttribute('aria-label')).toBe(SITE_TAB.label)
  })
})

// ── the display panel's mode contract ────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a display panel modes', () => {
  it('test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    const { panel } = app

    // AC-968 — a change of SOURCE, not a teardown and remount of the layout.
    const pane = panel.element
    const surface = panel.frame
    expect(panel.getMode()).toBe('view')
    const first = surface.getAttribute('src')
    expect(first).toBe('/preview/alpha/draft/')

    panel.setMode('edit')
    const second = surface.getAttribute('src')
    expect(panel.element).toBe(pane)
    expect(panel.frame).toBe(surface)
    // The identity check is not passing on a switch that did nothing.
    expect(second).not.toBe(first)
    expect(second).toBe('/preview/alpha/edit/')

    panel.setMode('view')
    expect(panel.element).toBe(pane)
    expect(panel.frame).toBe(surface)
    expect(surface.getAttribute('src')).toBe(first)

    // Still the live, ATTACHED elements — not detached survivors of a remount.
    expect(pane.isConnected).toBe(true)
    expect(surface.isConnected).toBe(true)
    expect(app.shell.getPanel(SITE_TAB.id).contains(pane)).toBe(true)
  })

  it('test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end', () => {
    // AC-969 — registering a mode is an ADDED ENTRY. This mode is defined
    // entirely here: its own id, its own displayed source, its own control set.
    // Nothing in the panel names it or branches on it.
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })

    app.panel.registerMode({
      id: 'contributed',
      label: 'Contributed',
      src: ({ site }: { site: string }) => `/preview/${site}/published/`,
      actions: ['site-selector', 'publish'],
    })

    // It is offered among the selectable modes…
    expect(app.panel.getModes().map((m: { id: string }) => m.id)).toContain('contributed')

    app.panel.setMode('contributed')

    // …switching to it displays what IT declared…
    expect(app.panel.getMode()).toBe('contributed')
    expect(app.panel.frame.getAttribute('src')).toBe('/preview/alpha/published/')
    expect(app.panel.getSrc()).toBe('/preview/alpha/published/')

    // …and the toolbar renders exactly the controls it named.
    expect(app.toolbar.ids()).toEqual(['site-selector', 'publish'])

    // The mode's own source function is honoured as state changes.
    app.panel.setSite('beta')
    expect(app.panel.frame.getAttribute('src')).toBe('/preview/beta/published/')
  })
})

// ── the toolbar ──────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a toolbar', () => {
  it('test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    const toolbarEl = app.toolbar.element

    // Two modes declaring DIFFERENT control sets.
    app.panel.registerMode({
      id: 'documentish',
      label: 'Documentish',
      src: () => '/preview/alpha/draft/',
      actions: ['site-selector', 'mode-toggle', 'open-new-tab', 'publish'],
    })
    app.panel.registerMode({
      id: 'not-a-document',
      label: 'Assets',
      mount: (host: HTMLElement) => host.append(document.createTextNode('assets')),
      actions: ['site-selector', 'mode-toggle'],
    })

    app.panel.setMode('documentish')
    // AC-970 — exactly the declared list, no more and no fewer.
    expect(app.toolbar.ids()).toEqual([
      'site-selector',
      'mode-toggle',
      'open-new-tab',
      'publish',
    ])

    app.panel.setMode('not-a-document')
    // Re-derived on the mode change: the strip's contents are REPLACED.
    expect(app.toolbar.ids()).toEqual(['site-selector', 'mode-toggle'])
    // A mode showing something other than a document does not get "open in a
    // new tab", so the strip never assumes a document beneath it.
    expect(app.toolbar.get('open-new-tab')).toBeNull()
    expect(toolbarEl.querySelector('[data-action="open-new-tab"]')).toBeNull()
    // The toolbar itself is never rebuilt out of the layout.
    expect(app.toolbar.element).toBe(toolbarEl)

    // A mode naming a control that does not exist is REPORTED, not rendered as
    // a partial strip.
    app.panel.registerMode({
      id: 'bad',
      label: 'Bad',
      src: () => '/preview/alpha/draft/',
      actions: ['site-selector', 'no-such-control'],
    })
    expect(() => app.panel.setMode('bad')).toThrow(/unknown action "no-such-control"/)
  })

  it('test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    const displayed = () => app.panel.frame.getAttribute('src')
    const target = () =>
      (app.toolbar.get('open-new-tab') as HTMLAnchorElement).getAttribute('href')

    // AC-971 — compared DIRECTLY against the displayed document's URL rather
    // than against a reconstructed expectation, so a shared formatting mistake
    // cannot make this pass falsely.
    expect(target()).toBe(displayed())

    app.panel.setMode('edit')
    expect(target()).toBe(displayed())

    app.panel.setSite('beta')
    expect(target()).toBe(displayed())

    app.panel.setMode('view')
    expect(target()).toBe(displayed())

    // Not vacuous: the value actually moved as the pane changed.
    expect(displayed()).toBe('/preview/beta/draft/')
    expect((app.toolbar.get('open-new-tab') as HTMLAnchorElement).target).toBe('_blank')
  })

  // AC-967 lives in the MOUNTED suite: its subject is the store→origin→selector
  // chain, and a jsdom mount handed a literal listing stands in for the very
  // thing the criterion is about ("neither a hardcoded list nor a subset").
})

// ── the split, and what it remembers ─────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a split and persistence', () => {
  it('test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })

    // AC-973 — the display panel is the PRIMARY, beside the assistant pane.
    // REQ-122 replaced the placeholder that stood there with the live chat panel;
    // this criterion is about the split's two halves, not what fills the second.
    expect(app.split.element.contains(app.panel.element)).toBe(true)
    expect(app.split.element.querySelector('.builder-chat')).toBeTruthy()
    // …separated by a real divider the operator can drag.
    expect(app.split.element.querySelector('.split__divider, [class*="divider"]')).toBeTruthy()

    // Dragging changes their relative widths. jsdom does no layout, so the
    // split RATIO — the model the divider drives and the stylesheet consumes —
    // is what can be observed here; AC-975 measures real pixels in a browser.
    const initial = app.split.getSplit()
    app.split.setSplit(37)
    expect(app.split.getSplit()).toBeCloseTo(37, 5)
    expect(app.split.getSplit()).not.toBeCloseTo(initial, 5)

    // Collapses to a narrow rail…
    app.split.collapse('secondary')
    expect(app.split.isCollapsed()).toBeTruthy()

    // …and reopening restores the width it had BEFORE the collapse, not the
    // default it started from.
    app.split.expand()
    expect(app.split.isCollapsed()).toBeFalsy()
    expect(app.split.getSplit()).toBeCloseTo(37, 5)
    expect(app.split.getSplit()).not.toBeCloseTo(initial, 5)
  })

  it('test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced', () => {
    const storage = memoryStorage()
    const app = mountBuilder(root, { sites: SITES, storage })

    // Change all four things the operator can leave behind.
    app.split.setSplit(42)
    app.split.collapse('secondary')
    app.panel.setSite('beta')
    app.panel.setMode('edit')

    // AC-974 — every persisted key is namespaced to this workspace, so nothing
    // it writes can collide with another application sharing the storage.
    const keys = [...storage.map.keys()]
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) expect(key.startsWith(`${APP_ID}:`)).toBe(true)
    expect(keys.some((k) => k.startsWith(`${APP_ID}:${STORAGE_KEYS.split}:`))).toBe(true)
    expect(keys.some((k) => k.startsWith(`${APP_ID}:${STORAGE_KEYS.panel}:`))).toBe(true)

    // Discard the workspace and mount a fresh one against the SAME storage.
    app.destroy()
    document.body.replaceChildren()
    const root2 = document.createElement('div')
    document.body.append(root2)
    const again = mountBuilder(root2, { sites: SITES, storage })

    // All four are restored, reproducing the state the operator left.
    expect(again.split.getSplit()).toBeCloseTo(42, 5)
    expect(again.split.isCollapsed()).toBeTruthy()
    expect(again.panel.getSite()).toBe('beta')
    expect(again.panel.getMode()).toBe('edit')
  })
})

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // `dist-assets` is BUILD OUTPUT (`1c assets`, REQ-145): copies of the very
    // components and browser source these scans are checking for duplication of.
    // Walking it would report the build as a second definition site and as
    // vendored upstream source — the artifact accused of being the thing it was
    // copied from. It is gitignored for the same reason.
    if (entry.name === 'node_modules' || entry.name === 'dist-assets') continue
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(ts|js|mjs|astro|html)$/.test(entry.name)) yield full
  }
}
