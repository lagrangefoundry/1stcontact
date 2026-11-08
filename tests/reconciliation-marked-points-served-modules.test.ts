/**
 * story-44d0a572 — **Marked Points**: the builder runs the SAME anchor and
 * measurement definitions as `relate` / `solve` / `measure_drawing` (AC-2421).
 *
 * WHAT MAKES THIS EVIDENCE. Nothing here reads a source file as text.
 *
 * 1. `1c assets` is driven through the CLI's own `run` entry point. The tree it
 *    wrote is walked from `/builder/main.js` (the browser entry, the one module
 *    that hands `anchors` and `measureScript` to the builder) by resolving real
 *    import specifiers, so "the browser loads them" is a fact about the bytes
 *    on disk. The EMITTED modules are then imported and run, and must answer
 *    exactly what the source modules answer. A hand-copied anchors module that
 *    had drifted would fail that comparison.
 *
 * 2. In a real Chromium, the emitted `/builder/points.js` runs over a real edit
 *    render, built from the emitted framework modules imported BY URL (the URLs
 *    `main.js` imports). No measurement is injected, so the controller takes its
 *    own default path, `evaluateMeasure(api.measureScript)`. Its `near:` must
 *    equal what `measure_drawing`'s path (`measureScript(svg)` evaluated in a
 *    page) plus the source `nearestAnchors` give for the same drawing and point.
 *    A broken `evaluateMeasure` gives no `near:` and fails here.
 *
 * IT SKIPS VISIBLY RATHER THAN PASSING VACUOUSLY. Where no Chromium can be
 * launched, the browser case skips itself and prints why (the same gating as the
 * REQ-209 and REQ-211 browser suites). The graph-and-parity case needs no
 * browser and always runs.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../tools/generate/src/cli'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import * as sourceAnchors from '../packages/site-schema/src/anchors'
import * as sourceMarkedPoints from '../packages/framework/src/l1/marked-points'
import { measureScript as sourceMeasureScript } from '../tools/generate/src/cli/capture/measure-svg'
import type { L1Node } from '@1stcontact/site-schema'

const REPO = path.resolve(__dirname, '..')
const DIST = path.join(REPO, 'apps', 'control-app', 'dist-assets')
const IMPORT_MAP = path.join(REPO, 'apps', 'control-app', 'src', 'generated', 'importmap.json')
const ENTRY = '/builder/main.js'
const ANCHORS_URL = '/framework/site-schema-anchors.js'
const MEASURE_URL = '/framework/measure-svg.js'
const ORIGIN = 'http://builder.test'
const PREVIEW_PATH = '/preview/acme/edit/'

/** A drawing in a font every Chromium resolves, so the measurement is real. */
const MARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 86">' +
  '<text id="one" x="0" y="62" font-family="monospace" font-size="62" font-weight="700">1</text>' +
  '<text id="st" x="40" y="30" font-family="monospace" font-size="20">st</text>' +
  '</svg>'

/** The measurement shape `measureScript` resolves to, for the parity case. */
const MEASUREMENT = {
  viewBox: [0, 0, 320, 86],
  fonts: [
    {
      key: 'f0',
      requested: 'Satoshi',
      resolved: 'Satoshi',
      generic: false,
      capHeight: 0.7,
      xHeight: 0.5,
      ascender: 0.75,
      descender: -0.25,
    },
  ],
  nodes: [
    {
      ref: '#one',
      text: '1',
      font: 'f0',
      fontSize: 62,
      box: [0, 15.5, 34.4, 62] as [number, number, number, number],
      ink: [1.2, 18.6, 24.8, 43.4] as [number, number, number, number],
      baseline: 62,
      advanceStart: 0,
      advanceWidth: 34.4,
    },
  ],
  warnings: [],
}

/** The specifiers a browser would fetch — code only, never prose in a comment. */
function specifiersOf(code: string): string[] {
  const ts = createRequire(import.meta.url)('typescript') as typeof import('typescript')
  return ts.preProcessFile(code, true, true).importedFiles.map((f) => f.fileName)
}

/** Every module URL reachable from `entry`, resolving specifiers the browser's way. */
function reachable(entry: string, imports: Record<string, string>): Set<string> {
  const reached = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const url = queue.shift()!
    if (reached.has(url)) continue
    reached.add(url)
    const file = path.join(DIST, url.replace(/^\//, ''))
    if (!fs.existsSync(file) || !/\.m?js$/.test(url)) continue
    for (const spec of specifiersOf(fs.readFileSync(file, 'utf8'))) {
      const target = spec.startsWith('/')
        ? spec
        : spec.startsWith('.')
          ? path.posix.join(path.posix.dirname(url), spec)
          : imports[spec]
      if (target) queue.push(target)
    }
  }
  return reached
}

const fontIndex = (m: { fonts: Array<{ key: string }> }) =>
  Object.fromEntries(m.fonts.map((f) => [f.key, f]))

/** See `test_UAT_FC_REQ-209_measure_in_a_browser.test.ts` — playwright is tools/generate's. */
async function loadChromium(): Promise<typeof import('playwright').chromium | undefined> {
  try {
    const require = createRequire(path.join(REPO, 'tools/generate/package.json'))
    const entry = pathToFileURL(require.resolve('playwright')).href
    const mod = (await import(/* @vite-ignore */ entry)) as Record<string, never>
    return (mod.chromium ?? (mod.default as Record<string, never>)?.chromium) as never
  } catch {
    return undefined
  }
}

async function launchAnyChromium(
  chromium: typeof import('playwright').chromium,
): Promise<import('playwright').Browser | undefined> {
  for (const opts of [{}, { channel: 'chrome' as const }]) {
    try {
      return await chromium.launch(opts)
    } catch {
      /* try the next */
    }
  }
  return undefined
}

/** A page with a run of copy [0.0] and a drawing [0.1], rendered for edit. */
async function renderEditPreview(cwd: string): Promise<string> {
  cmdNew('acme', { cwd })
  const homePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', text: 'A painted band.', axes: { fontSizePx: 32 } },
      { kind: 'image', src: 'assets/mark.svg', alt: 'The wordmark' },
    ],
  }
  home.l1.root = root
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
  const { outDir } = await cmdRender('acme', { cwd, edit: true })
  return outDir
}

const TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

describe('story-44d0a572 — the builder is served the anchor and measurement modules the tools run', () => {
  let map: { imports: Record<string, string>; styles: string[] }
  let cwd = ''
  let outDir = ''
  let browser: import('playwright').Browser | undefined
  let why = ''

  beforeAll(async () => {
    const log = console.log
    console.log = () => {}
    try {
      await run(['assets'])
    } finally {
      console.log = log
    }
    map = JSON.parse(fs.readFileSync(IMPORT_MAP, 'utf8'))
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ac2421-'))
    outDir = await renderEditPreview(cwd)

    const chromium = await loadChromium()
    if (!chromium) why = 'playwright is not installed in tools/generate'
    else {
      browser = await launchAnyChromium(chromium)
      if (!browser) why = 'no Chromium could be launched (run `npx playwright install chromium`)'
    }
    if (why) console.warn(`AC-2421 browser case SKIPPED — ${why}. The default measure path is unverified here.`)
  }, 240_000)

  afterAll(async () => {
    await browser?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC2421_the_builder_entry_loads_the_served_anchor_and_measure_modules_and_they_answer_as_the_source', async () => {
    // ── THE PRODUCTION ENTRY REACHES BOTH MODULES, AND points.js ─────────────
    const reached = reachable(ENTRY, map.imports)
    expect(reached, `${ANCHORS_URL} is not reached from ${ENTRY}`).toContain(ANCHORS_URL)
    expect(reached, `${MEASURE_URL} is not reached from ${ENTRY}`).toContain(MEASURE_URL)
    expect(reached).toContain('/builder/points.js')
    // main.js imports them itself: it is the module that hands them to the builder.
    const mainSpecs = specifiersOf(fs.readFileSync(path.join(DIST, 'builder', 'main.js'), 'utf8'))
    expect(mainSpecs).toContain(ANCHORS_URL)
    expect(mainSpecs).toContain(MEASURE_URL)

    // ── THE EMITTED MODULES, RUN, ANSWER EXACTLY AS THE SOURCE MODULES ───────
    const servedAnchors = await import(
      /* @vite-ignore */ pathToFileURL(path.join(DIST, ANCHORS_URL.slice(1))).href
    )
    const servedMeasure = await import(
      /* @vite-ignore */ pathToFileURL(path.join(DIST, MEASURE_URL.slice(1))).href
    )
    expect(servedAnchors.ANCHOR_NAMES).toEqual(sourceAnchors.ANCHOR_NAMES)
    const fonts = fontIndex(MEASUREMENT)
    const centre = { x: 160, y: 43 }
    for (const at of [
      { x: 10, y: 21 },
      { x: 0, y: 0 },
      { x: 30, y: 60 },
      { x: 200, y: 80 },
    ]) {
      const served = servedAnchors.nearestAnchors(MEASUREMENT.nodes, fonts, at, centre)
      const source = sourceAnchors.nearestAnchors(MEASUREMENT.nodes, fonts, at, centre)
      expect(served, `nearestAnchors at (${at.x}, ${at.y})`).toEqual(source)
    }
    // The measuring script is a string a page evaluates; the served one must be
    // byte-identical to the one `measure_drawing` evaluates.
    expect(servedMeasure.measureScript(MARK_SVG)).toBe(sourceMeasureScript(MARK_SVG))
  })

  it('test_UAT_AC2421_in_a_browser_the_default_measure_path_gives_near_equal_to_measure_drawing_and_nearest_anchors', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)

    // ── measure_drawing's path: the source script, evaluated in a blank page ─
    const blank = await browser!.newPage()
    let measured: typeof MEASUREMENT
    try {
      await blank.setContent('<!doctype html><html><body></body></html>')
      measured = (await blank.evaluate(sourceMeasureScript(MARK_SVG))) as typeof MEASUREMENT
    } finally {
      await blank.close()
    }
    expect(measured.nodes.length, 'measure_drawing measured no nodes').toBeGreaterThan(0)

    // ── the builder's path: emitted points.js + emitted framework modules ────
    const page = await browser!.newPage({ viewport: { width: 800, height: 600 } })
    page.setDefaultTimeout(15_000)
    try {
      await page.route(`${ORIGIN}/**`, async (route) => {
        const url = new URL(route.request().url())
        let file: string | null = null
        let body: string | Buffer | null = null
        if (url.pathname.endsWith('.svg')) body = MARK_SVG
        else if (/^\/(framework|builder|webui)\//.test(url.pathname)) file = path.join(DIST, url.pathname.slice(1))
        else if (url.pathname.startsWith(PREVIEW_PATH)) {
          const rel = url.pathname.slice(PREVIEW_PATH.length) || 'index.html'
          file = path.join(outDir, rel)
        }
        if (file && fs.existsSync(file) && fs.statSync(file).isFile()) body = fs.readFileSync(file)
        if (body === null) return route.fulfill({ status: 404, body: '' })
        const ext = path.extname(url.pathname.endsWith('/') ? 'index.html' : url.pathname)
        return route.fulfill({ status: 200, body, contentType: TYPES[ext] ?? 'application/octet-stream' })
      })
      await page.goto(`${ORIGIN}${PREVIEW_PATH}`)
      // Page-side code is passed as STRINGS: a function would be serialised after
      // Vite's transform, which rewrites `import()` into a helper the page lacks.
      await page.waitForFunction(
        `(() => { const img = document.querySelector('img'); return !!img && img.complete && img.naturalWidth > 0 })()`,
      )

      // The api object is the one `main.js` builds, from the same URLs. No
      // `measure` is passed: the controller measures the drawing itself.
      await page.evaluate(`(async () => {
        const [{ createMarkedPoints }, editClient, edit, markedPoints, anchors, measure] = await Promise.all([
          import('/builder/points.js'),
          import('/framework/edit-client.js'),
          import('/framework/site-schema-edit.js'),
          import('/framework/marked-points.js'),
          import(${JSON.stringify(ANCHORS_URL)}),
          import(${JSON.stringify(MEASURE_URL)}),
        ])
        const ctl = createMarkedPoints({
          api: {
            resolveEditTarget: editClient.resolveEditTarget,
            L1_EDIT_PAGE_ATTR: edit.L1_EDIT_PAGE_ATTR,
            markedPoints,
            anchors,
            measureScript: measure.measureScript,
          },
          insertToken: () => {},
          removeToken: () => {},
        })
        ctl.bind(document)
        ctl.setActive(true)
        window.__ctl = ctl
      })()`)

      const rect = await page.locator('img').boundingBox()
      expect(rect, 'the drawing has no box in the edit render').not.toBeNull()
      expect(rect!.width).toBeGreaterThan(0)
      await page.mouse.click(rect!.x + rect!.width * 0.05, rect!.y + rect!.height * 0.25)
      // Bounded (the page default, 15s): a broken default measure path never
      // produces a near: row, and this times out naming that.
      await page.waitForFunction(`((window.__ctl.list()[0] || {}).near || []).length > 0`)
      const { point, title } = (await page.evaluate(`(() => {
        const mark = document.querySelector('.fc-point[data-point="A"]')
        return { point: window.__ctl.list()[0], title: mark ? mark.title : null }
      })()`)) as { point: Record<string, never>; title: string | null }

      // ── SAME LINES, SAME DISTANCES, AS THE TOOLS COMPUTE ──────────────────
      const drawing = point.drawing as { x: number; y: number; viewBox: number[] }
      expect(drawing.viewBox).toEqual([0, 0, 320, 86])
      const expected = sourceAnchors.nearestAnchors(
        measured.nodes as never,
        fontIndex(measured) as never,
        { x: drawing.x, y: drawing.y },
        { x: 160, y: 43 },
      )
      const near = point.near as Array<{ anchor: string; label: string; axis: string; delta: number }>
      expect(near.length).toBe(expected.length)
      near.forEach((line, i) => {
        const want = expected[i] as { anchor: string; label: string; axis: string; delta: number }
        expect(line.anchor).toBe(want.anchor)
        expect(line.label).toBe(want.label)
        expect(line.axis).toBe(want.axis)
        expect(line.delta).toBeCloseTo(want.delta, 6)
      })

      // The mark's tooltip is the point's formatted expansion, near: included.
      expect(title).toBe(sourceMarkedPoints.formatMarkedPoint(point as never))
      expect(title).toMatch(/^\s+near:\s+\S/m)
    } finally {
      await page.close()
    }
  })
})
