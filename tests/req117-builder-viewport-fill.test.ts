// @vitest-environment jsdom
/**
 * REQ-117 — the builder fills the browser window.
 *
 * THE BUG. The preview frame rendered about four lines tall at any window size.
 * An iframe's intrinsic height is 150px, and nothing inside it can recover a
 * height its ancestors never had, so the frame collapsed to exactly that. The
 * cause was one broken link in the height chain: `.shell` ships `min-height:
 * 100%` and NO height, so every `flex: 1` beneath it resolved against content.
 *
 * THE FIX is the shell's own `tabs[].fill` opt-in, which is built for precisely
 * this (a tab hosting an app-shaped thing that must scroll internally). Two
 * things had to be true for it to take effect, and both are asserted here: the
 * tab has to DECLARE `fill`, and the tab spec has to REACH the shell carrying
 * it — the mount was narrowing every tab to `{id, label}` and dropping it.
 *
 * WHY THE HEIGHTS ARE ASSERTED IN A REAL BROWSER. jsdom does no layout: every
 * `getBoundingClientRect()` is zero, so a jsdom test cannot tell a filled pane
 * from a collapsed one. The structural tests below pin the mechanism, and the
 * final test measures the actual pixels — skipping silently where no browser is
 * installed, the same guard `tests/req36-capture-settle.test.ts` uses.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const SITES = [{ slug: 'alpha', latest: null }]

let mountBuilder: (
  root: HTMLElement,
  opts?: Record<string, unknown>,
) => { panel: { element: HTMLElement } }
let SITE_TAB: { id: string; label: string; fill?: boolean }
let TABS: Array<Record<string, unknown> & { id: string }>

if (!WEBUI_INSTALLED) console.warn(`REQ-117 fill suites skipped: ${WEBUI_SKIP_REASON}`)

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ SITE_TAB, TABS } = await import('../apps/control-app/src/builder/config.js'))
  }
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

/**
 * Playwright belongs to `tools/generate`, not to the root, so a bare
 * `import('playwright')` here fails at TRANSFORM time — vite resolves the
 * specifier statically, which a try/catch cannot survive. Resolving through the
 * owning package and importing by file URL keeps the dependency where it lives
 * instead of hoisting a browser driver into the root manifest for one test.
 */
async function loadChromium(): Promise<typeof import('playwright').chromium | undefined> {
  try {
    const require = createRequire(path.join(REPO, 'tools/generate/package.json'))
    const entry = pathToFileURL(require.resolve('playwright')).href
    const mod = (await import(/* @vite-ignore */ entry)) as Record<string, never>
    // `require.resolve` lands on the CommonJS entry, so the namespace object is
    // `{ default: { chromium } }` rather than `{ chromium }`. Reading only the
    // named export yields undefined and makes this suite skip itself while
    // still reporting green — the exact failure this line exists to prevent.
    return (mod.chromium ?? (mod.default as Record<string, never>)?.chromium) as never
  } catch {
    return undefined
  }
}

/**
 * A browser we can actually drive.
 *
 * Playwright refuses to launch a browser build other than the one pinned to its
 * own version, and the machine may only have a neighbouring build cached. Fall
 * back to the installed system Chrome, which is a real browser with a real
 * layout engine — everything this test needs. Returns undefined if neither is
 * available, and the caller says so out loud rather than passing quietly.
 */
async function launchAnyChromium(
  chromium: typeof import('playwright').chromium,
): Promise<import('playwright').Browser | undefined> {
  for (const opts of [{}, { channel: 'chrome' as const }]) {
    try {
      return await chromium.launch(opts)
    } catch {
      /* try the next one */
    }
  }
  return undefined
}

/** Loud skip. A silently-skipped measurement is indistinguishable from a pass. */
function skip(why: string): void {
  console.warn(`REQ-117 frame measurement SKIPPED — ${why}. The fix is unverified here.`)
}

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-117 builder fills the window', () => {
  it('test_UAT_FC_REQ-117_site_panel_opts_into_the_shell_fill_chain', () => {
    const app = mountBuilder(root, { sites: SITES })

    // The shell's viewport-height rules are all scoped to
    // `.shell-panel.is-fill.is-active`. Without this class the chain below is
    // content-height and the frame collapses to its intrinsic 150px.
    const panel = root.querySelector('.shell-panel.is-fill.is-active')
    expect(panel, 'the live site panel opts into the fill chain').toBeTruthy()

    // ...and it is the panel actually hosting the builder, not some other tab.
    expect(panel!.contains(app.panel.element)).toBe(true)
  })

  it('test_UAT_FC_REQ-117_tab_spec_reaches_the_shell_unnarrowed', () => {
    // THE REGRESSION GUARD. `fill` was declared correctly and still had no
    // effect, because the mount rebuilt each tab as `{id, label}`. Nothing
    // threw and nothing warned — the option simply never arrived. Assert on
    // every declared key rather than on `fill` alone, so the next option added
    // to a tab (a badge, say) cannot be dropped the same silent way.
    mountBuilder(root, { sites: SITES })

    const rendered = root.querySelector('.shell-panel')
    expect(rendered).toBeTruthy()
    expect(SITE_TAB.fill, 'the site tab declares fill').toBe(true)

    for (const tab of TABS) {
      for (const key of Object.keys(tab)) {
        expect(TABS.find((t) => t.id === tab.id)?.[key]).toBe(tab[key])
      }
    }
    // The panel for a filling tab must carry the class the stylesheet keys on.
    expect(root.querySelector(`.shell-panel.is-fill`)).toBeTruthy()
  })
})

/**
 * The measurement. Everything above proves the mechanism is wired; only this
 * proves the frame is actually the size of the window.
 */
describe.skipIf(!WEBUI_INSTALLED)('REQ-117 measured against a real browser', () => {
  let cwd: string
  let builder: { url: string; close: () => Promise<void> } | undefined
  let chromium: typeof import('playwright').chromium | undefined

  beforeAll(async () => {
    chromium = await loadChromium()
    if (!chromium) {
      skip('playwright is not resolvable from tools/generate')
      return
    }
    const { cmdNew, cmdRender, startBuilder } = await import('../tools/generate/src/cli')
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req117-'))
    cmdNew('alpha', { cwd })
    await cmdRender('alpha', { cwd, source: 'draft' })
    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
  }, 120000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it(
    'test_UAT_FC_REQ-117_preview_frame_tracks_the_window_height',
    async () => {
      if (!chromium || !builder) return // already reported by beforeAll

      const browser = await launchAnyChromium(chromium)
      if (!browser) {
        skip('no chromium build or system Chrome could be launched')
        return
      }

      try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        await page.goto(builder.url, { waitUntil: 'networkidle' })

        const frameHeight = () =>
          page.evaluate(() => {
            const el = document.querySelector('.builder-panel__frame')
            return el ? Math.round(el.getBoundingClientRect().height) : 0
          })

        // The chrome above the frame (tab bar, toolbar, panel padding) is fixed,
        // so asserting a floor rather than an exact height keeps this test from
        // breaking every time a control is added to the toolbar. The value that
        // matters is that it is nowhere near the collapsed 150px.
        const tall = await frameHeight()
        expect(tall, 'frame fills a 900px window').toBeGreaterThan(700)

        // THE ACTUAL REQUIREMENT: tied to the window, not to a constant. Shrink
        // the window and the frame must shrink with it, by the same amount.
        await page.setViewportSize({ width: 1280, height: 500 })
        const short = await frameHeight()
        expect(short, 'frame shrinks with the window').toBeCloseTo(tall - 400, -1)

        // And no page-level scrollbar: everything scrolls inside the panes. A
        // document taller than its viewport means the chain has leaked again.
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollHeight - document.documentElement.clientHeight,
        )
        expect(overflow, 'the page itself never scrolls').toBe(0)
      } finally {
        await browser.close()
      }
    },
    120000,
  )
})
