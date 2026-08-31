import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  FONT_BARRIER,
  FONTS_READY,
  IMAGES_DECODED,
  SETTLE_CSS,
  SETTLE_SCROLL,
} from '../tools/generate/src/cli/capture/page-scripts'
import { withBrowserSession } from '../tools/generate/src/cli/capture/cf-driver'
import { screenshotUrl, VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import { runMultiStateCapture } from '../tools/generate/src/cli/capture/pipeline'
import type {
  BrowserDriver,
  CapturedResponse,
  InteractionState,
  PageDiagnostics,
  Viewport,
} from '../tools/generate/src/cli/capture/types'
import type { RawSignals } from '../tools/generate/src/cli/capture/extract'
import { fakeBrowser } from './support/fake-puppeteer'

/**
 * Cloud browser capture — the preconditions, the honest limits, and the two
 * absences (story-080c6036).
 *
 * These are the claims about this story that do not run inside workerd:
 *
 *  - AC-1465 asks what a capture path that cannot actuate a pseudo-state does
 *    with a multi-state request. It is answered through the real
 *    `runMultiStateCapture` loop against drivers that differ in exactly one
 *    respect — whether they actuate.
 *  - AC-1466 asks what the capture preconditions actually DO. Every call site
 *    wraps them in `.catch(() => undefined)` on purpose, because a page missing
 *    an API must not fail a capture — which means a broken script would be
 *    silently skipped and the capture would succeed while measuring an unsettled
 *    page. So they are executed against a real DOM and their effects asserted.
 *  - AC-1467 asks that a cloud capture and a local capture be the SAME capture.
 *    Drift there does not surface as a failure; the capture still succeeds and
 *    simply measures the wrong page. So identity is asserted, not assumed.
 *  - AC-1468 is about what is ABSENT from a bundle, which cannot be asserted by
 *    running anything: a deployment that pulled in the local stack would fail at
 *    bundle time, in a deploy, long after every test had passed.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel: string): string => fs.readFileSync(path.join(REPO, rel), 'utf8')

// ── AC-1465 — an unactuatable interaction state is skipped and reported ──────

/** Enough of a page for `flattenSignals` to project. The subject here is the
 *  state loop, not the extraction, so the document is deliberately bare. */
function emptySignals(viewport: Viewport): RawSignals {
  return {
    viewport: { width: viewport.width, height: viewport.height },
    bands: [],
    colorUsage: [],
    fontFaces: [],
    typeScale: [],
    spacingScalePx: [],
    containerMaxWidthPx: null,
    images: [],
    bodyBackground: '#ffffff',
  }
}

/**
 * Two capture paths that differ in exactly one respect. The non-actuating one
 * omits `actuate` and `canActuate` entirely — which is precisely the shape the
 * cloud driver has, and the shape the multi-state loop has to be honest about.
 */
class StubDriver implements BrowserDriver {
  actuated: InteractionState[] = []
  private viewport: Viewport = { width: 1280, height: 800 }

  constructor(actuates: boolean) {
    if (actuates) {
      this.actuate = async (state: InteractionState) => {
        this.actuated.push(state)
      }
      this.canActuate = () => true
    }
  }

  actuate?: (state: InteractionState) => Promise<void>
  canActuate?: () => boolean

  async navigate(_url: string, viewport?: Viewport): Promise<void> {
    if (viewport) this.viewport = viewport
  }
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array()
  }
  async query<T = unknown>(): Promise<T> {
    return emptySignals(this.viewport) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics(): PageDiagnostics {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<!doctype html><html></html>'
  }
  async close(): Promise<void> {}
}

describe('AC-1465 — an unactuatable interaction state is skipped and reported, never faked', () => {
  it('test_UAT_AC1465_rest_only_with_a_note_when_the_path_cannot_actuate', async () => {
    const viewport: Viewport = { width: 1280, height: 800 }
    const states: InteractionState[] = ['rest', 'hover', 'focus']

    // A capture path that offers no actuation — the cloud path's shape.
    const cannot = new StubDriver(false)
    const restOnly = await runMultiStateCapture('https://example.com/', {
      engines: ['chromium'],
      viewports: [viewport],
      states,
      isEngineAvailable: async () => true,
      driverFactoryFor: () => async () => cannot,
    })

    // Only the resting-state projection is produced.
    expect(restOnly.projections).toHaveLength(1)
    expect(restOnly.projections[0].state).toBe('rest')
    // And NO projection is labelled with a non-resting state. A silent no-op
    // would emit an unactuated resting frame labelled `hover`, which compares
    // clean against a reference that also has no hover effect and reads as
    // proof where there is none.
    expect(restOnly.projections.map((p) => p.state)).not.toContain('hover')
    expect(restOnly.projections.map((p) => p.state)).not.toContain('focus')
    expect(cannot.actuated).toEqual([])

    // A note is emitted naming the engine, the viewport width, and the states
    // that were skipped, so the dropped cells are visible rather than silent.
    const note = restOnly.notes.find((n) => n.includes('skipped'))
    expect(note, `notes were: ${JSON.stringify(restOnly.notes)}`).toBeDefined()
    expect(note).toContain('chromium')
    expect(note).toContain(String(viewport.width))
    expect(note).toContain('hover')
    expect(note).toContain('focus')

    // A capture path that DOES actuate is unchanged: every requested state is
    // projected and no skip note is emitted.
    const can = new StubDriver(true)
    const full = await runMultiStateCapture('https://example.com/', {
      engines: ['chromium'],
      viewports: [viewport],
      states,
      isEngineAvailable: async () => true,
      driverFactoryFor: () => async () => can,
    })
    expect(full.projections.map((p) => p.state)).toEqual(states)
    expect(can.actuated).toEqual(states)
    expect(full.notes.filter((n) => n.includes('skipped'))).toEqual([])
  })
})

// ── AC-1466 — every capture path applies the same preconditions ──────────────

/** Evaluate a page script the way a driver's `evaluate(string)` does. */
async function evaluate(dom: JSDOM, script: string): Promise<unknown> {
  const runner = dom.window.eval(`(async () => (${script}))`) as () => Promise<unknown>
  return runner()
}

function page(body: string): JSDOM {
  const dom = new JSDOM(`<!doctype html><html><body>${body}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  // jsdom has no layout, so scrolling is a no-op it warns about. The scripts
  // only care that it does not throw.
  Object.defineProperty(dom.window, 'scrollTo', { value: () => {}, writable: true })
  Object.defineProperty(dom.window, 'innerHeight', { value: 600, writable: true })
  return dom
}

describe('AC-1466 — the capture preconditions, executed against a real document', () => {
  it('test_UAT_AC1466_preconditions_land_motion_reveal_scroll_images_and_fonts', async () => {
    // (a) Declared motion is landed on its final frame instantly, and blocks
    //     held in a pre-animation hidden state are revealed — read off the
    //     injected stylesheet, which is not executable.
    expect(SETTLE_CSS).toContain('animation-duration:0s!important')
    expect(SETTLE_CSS).toContain('animation-delay:0s!important')
    expect(SETTLE_CSS).toContain('transition-duration:0s!important')
    expect(SETTLE_CSS).toContain('.elementor-invisible')
    expect(SETTLE_CSS).toContain('visibility:visible!important')
    expect(SETTLE_CSS).toContain('opacity:1!important')

    // (b) The full-height scroll runs and promotes deferred images: a deferred
    //     image acquires its real source and eager loading, or it is captured
    //     blank and nothing flags the gap.
    const scrolled = page(
      '<img id="a" data-src="/hero.png"><img id="b" src="/already.png" loading="lazy">',
    )
    expect(await evaluate(scrolled, SETTLE_SCROLL)).toBe(true)
    const a = scrolled.window.document.getElementById('a') as HTMLImageElement
    const b = scrolled.window.document.getElementById('b') as HTMLImageElement
    expect(a.getAttribute('src')).toBe('/hero.png')
    // The IDL property, not the attribute: jsdom does not implement `loading`
    // as an attribute reflection, so reading the attribute would assert jsdom's
    // gap rather than the script's behaviour.
    expect(a.loading).toBe('eager')
    expect(b.loading).toBe('eager')

    // Degrades rather than failing: a page with no images completes.
    expect(await evaluate(page('<h1>Nothing deferred here</h1>'), SETTLE_SCROLL)).toBe(true)

    // (c) Every image is awaited to completion before measurement — an
    //     incomplete image HOLDS the wait, which is the wait's whole job.
    const pending = page('<img id="a" src="/hero.png">')
    const pendingImg = pending.window.document.getElementById('a') as HTMLImageElement
    Object.defineProperty(pendingImg, 'complete', { value: false, configurable: true })
    let settled = false
    const wait = evaluate(pending, IMAGES_DECODED).then((v) => {
      settled = true
      return v
    })
    await Promise.resolve()
    expect(settled).toBe(false)
    pendingImg.dispatchEvent(new pending.window.Event('load'))
    expect(await wait).toBe(true)

    // ...and a broken image RELEASES it rather than hanging: a 404 must not
    // cost the capture, because the screenshot is still worth taking.
    const broken = page('<img id="a" src="/gone.png">')
    const brokenImg = broken.window.document.getElementById('a') as HTMLImageElement
    Object.defineProperty(brokenImg, 'complete', { value: false, configurable: true })
    const brokenWait = evaluate(broken, IMAGES_DECODED)
    brokenImg.dispatchEvent(new broken.window.Event('error'))
    expect(await brokenWait).toBe(true)

    // (d) A document with no font API completes rather than failing the
    //     capture — jsdom has no FontFaceSet, which is exactly that engine.
    const noFontApi = page('<h1 style="font-family: Inter">Hello</h1>')
    expect(await evaluate(noFontApi, FONTS_READY)).toBe(true)
    expect(await evaluate(noFontApi, FONT_BARRIER)).toBe(true)

    // ...and where the API exists, the barrier requests the EXACT face of every
    // visible run — family, real weight, style and that run's own text — while
    // requesting nothing for a hidden run.
    const fonts = page(
      '<h1 style="font-family: Inter; font-weight: 700">Visible</h1>' +
        '<p style="display:none; font-family: Inter">Hidden</p>',
    )
    const asked: Array<[string, string]> = []
    Object.defineProperty(fonts.window.document, 'fonts', {
      value: {
        ready: Promise.resolve(),
        load: (shorthand: string, text: string) => {
          asked.push([shorthand, text])
          return Promise.resolve([])
        },
      },
      configurable: true,
    })
    expect(await evaluate(fonts, FONT_BARRIER)).toBe(true)
    expect(asked.map(([, text]) => text)).toEqual(['Visible'])
    expect(asked[0][0]).toContain('Inter')
    expect(asked[0][0]).toContain('700')
    // A hidden run is not painted, so loading its face would measure nothing.
    expect(asked.map(([, text]) => text)).not.toContain('Hidden')
  })
})

// ── AC-1467 — one definition, applied by every capture path ──────────────────

describe('AC-1467 — a cloud capture and a local capture are the same capture', () => {
  it('test_UAT_AC1467_both_paths_draw_preconditions_from_one_source_and_apply_width_last', async () => {
    // Each capture path draws its preconditions from the SHARED definition
    // rather than carrying its own transcription, so a second copy is a
    // detectable regression rather than a silent drift.
    const scripts = read('tools/generate/src/cli/capture/page-scripts.ts')
    expect(scripts).toContain('animation-delay:0s!important')
    expect(scripts).toContain('document.createTreeWalker')

    for (const driver of ['playwright-driver', 'cf-driver']) {
      const src = read(`tools/generate/src/cli/capture/${driver}.ts`)
      expect(src, driver).toContain("from './page-scripts'")
      // Every precondition, by name, imported rather than restated.
      for (const symbol of [
        'FONT_BARRIER',
        'FONTS_READY',
        'IMAGES_DECODED',
        'SETTLE_CSS',
        'SETTLE_SCROLL',
      ]) {
        expect(src, `${driver} imports ${symbol}`).toContain(symbol)
      }
      // The literals themselves are absent from both drivers — the prose about
      // them stays, and should.
      expect(src, driver).not.toContain('animation-delay:0s!important')
      expect(src, driver).not.toContain('document.createTreeWalker')
    }

    // And the shared source is what the cloud path actually EVALUATES, which is
    // a stronger claim than any source match: the exact script text, not a
    // paraphrase of it, reaches the page.
    const browser = fakeBrowser()
    await withBrowserSession(browser.launch, async (session) => {
      await screenshotUrl('https://example.com/', VIEWPORTS.mobile, session.driverFactory())
    })
    expect(browser.log.evaluated).toContain(FONTS_READY)
    expect(browser.log.evaluated).toContain(SETTLE_SCROLL)
    expect(browser.log.evaluated).toContain(IMAGES_DECODED)
    expect(browser.log.evaluated).toContain(FONT_BARRIER)

    // The order the target width is applied in, preserved exactly: the page is
    // LOADED at the capture path's default width and the target is applied at
    // capture time. Laying a page out at the target width from the start is
    // observably different and would silently change every existing screenshot.
    expect(browser.log.viewports).toEqual([VIEWPORTS.desktop, VIEWPORTS.mobile])
  })
})

// ── AC-1468 — the shipped deployment carries only the cloud browser dependency ─

/** Every relative specifier a module imports or re-exports, resolved to a file. */
function localImports(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8')
  const out: string[] = []
  const pattern = /(?:from|import)\s*(?:\(\s*)?['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(src)) !== null) {
    const spec = m[1]
    if (!spec.startsWith('.')) continue
    const base = path.resolve(path.dirname(file), spec.replace(/\?raw$/, ''))
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.js`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.js'),
    ]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        out.push(candidate)
        break
      }
    }
  }
  return out
}

/** Every bare (package) specifier a module imports. */
function packageImports(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8')
  const out: string[] = []
  const pattern = /(?:from|import)\s*(?:\(\s*)?['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(src)) !== null) {
    if (!m[1].startsWith('.')) out.push(m[1])
  }
  return out
}

/** Every `.ts` file under `dir`, excluding declaration files. */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) out.push(full)
  }
  return out.sort()
}

/** Transitive closure of local modules reachable from `entry`. */
function reachable(entry: string): Set<string> {
  const seen = new Set<string>()
  const stack = [entry]
  while (stack.length > 0) {
    const file = stack.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    for (const next of localImports(file)) stack.push(next)
  }
  return seen
}

describe('AC-1468 — the shipped deployment depends on the cloud browser capability alone', () => {
  it('test_UAT_AC1468_worker_graph_reaches_no_local_browser_stack_and_one_lease', () => {
    const entries = [
      // The deployed application's real entry point.
      'apps/control-app/src/index.ts',
      // ...and the screenshot capability's own entry point, so its graph is
      // checked even before a route reaches it.
      'apps/control-app/src/shot.ts',
    ]

    for (const entry of entries) {
      const offenders: string[] = []
      for (const file of reachable(path.join(REPO, entry))) {
        if (packageImports(file).some((p) => p === 'playwright' || p.startsWith('playwright/'))) {
          offenders.push(path.relative(REPO, file))
        }
      }
      expect(offenders, `${entry} reaches Playwright through: ${offenders.join(', ')}`).toEqual([])
    }

    // The barrel re-exports `playwright-driver`, so importing it is how the
    // local stack would arrive without anyone naming it.
    for (const entry of entries) {
      for (const file of reachable(path.join(REPO, entry))) {
        if (!file.startsWith(path.join(REPO, 'apps'))) continue
        const rel = path.relative(REPO, file)
        expect(fs.readFileSync(file, 'utf8'), rel).not.toMatch(
          /from\s+['"][^'"]*cli\/capture['"]/,
        )
      }
    }

    // EXACTLY ONE place in the codebase decides how a browser is acquired, so
    // the lease is the only lease. Swept over every source file rather than
    // over a reachability graph on purpose: `shot.ts` is deliberately not yet
    // reached from `index.ts` — no route answers it — so a graph walk from the
    // entry point would pass vacuously.
    const namers: string[] = []
    for (const dir of ['apps', 'tools', 'packages']) {
      for (const file of walk(path.join(REPO, dir))) {
        if (packageImports(file).some((p) => p.startsWith('@cloudflare/puppeteer'))) {
          namers.push(path.relative(REPO, file))
        }
      }
    }
    expect(namers).toEqual(['apps/control-app/src/shot.ts'])

    // The cloud browser library is a DECLARED dependency of the deployed
    // application: pnpm is strict, so an undeclared import resolves in the repo
    // root and fails in a deploy, which is the worst place to find out.
    const app = JSON.parse(read('apps/control-app/package.json')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    expect(app.dependencies?.['@cloudflare/puppeteer']).toBeTruthy()
    // ...and the local browser-automation stack is declared for the LOCAL
    // TOOLCHAIN only, never for the deployed application.
    expect(app.dependencies?.playwright).toBeUndefined()
    expect(app.devDependencies?.playwright).toBeUndefined()
    const toolchain = JSON.parse(read('tools/generate/package.json')) as {
      dependencies?: Record<string, string>
    }
    expect(toolchain.dependencies?.playwright).toBeTruthy()
  })
})
