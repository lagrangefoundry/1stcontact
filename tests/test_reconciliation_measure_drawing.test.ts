/**
 * story-d2bee21c — the consultant can measure a drawing and solve where to put a
 * node instead of guessing at it from screenshots (REQ-209, DOC-52 §3.1–3.4, §5).
 *
 * TWO KINDS OF EVIDENCE, AND WHICH IS WHICH.
 *
 * - The vocabulary, the arithmetic (`relate`, `solve`, `assert`) and the surface
 *   that carries them are driven through the operations the consultant's tools
 *   invoke, over a real site store. The ONE thing replaced is the browser — an
 *   external boundary — by a measurer that answers with a measurement and records
 *   every call. The wordmark fixture is DOC-52 §5.3's own measurement of the
 *   1st Contact mark, so the numbers the ticket argues from are the numbers
 *   asserted against.
 * - What only a rendering engine can answer (per-glyph extents, ink against
 *   advance, the face that resolved, transforms resolved to root) is measured by
 *   the shipped `measureScript` in a real Chromium, fed to the same operations as
 *   their measurer. Where no Chromium can launch (no browser installed, or an OS
 *   sandbox that refuses one) those cases mark themselves SKIPPED with the reason
 *   — never a green tick for a measurement nobody took. Each still WRITES its
 *   drawing through `write_image` first, so the fixture's acceptance by the
 *   drawing validator is checked everywhere.
 */

import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ANCHOR_NAMES, anchorAxis, anchorValue } from '../packages/site-schema/src/anchors'
import { measureScript } from '../tools/generate/src/cli/capture/measure-svg'
import type { RawMeasurement, RawNodeMeasurement } from '../tools/generate/src/cli/capture/measure-svg'
import {
  aiCore,
  createL1Toolbox,
  l1Operations,
  nodeOperations,
  L1_DECLARATION,
  L1_INSTANCES,
} from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox as createL1ToolboxCore } from '../tools/generate/src/cli/ai/toolbox-core'
import type { DrawingMeasurer } from '../tools/generate/src/cli/ai/measure-core'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

const REPO = path.resolve(__dirname, '..')

// ── fixtures ─────────────────────────────────────────────────────────────────

type Box = [number, number, number, number]

const FONT = {
  key: 'f0',
  requested: 'Satoshi',
  resolved: 'Satoshi',
  generic: false,
  capHeight: 0.7,
  xHeight: 0.5,
  ascender: 0.75,
  descender: -0.25,
}

/**
 * The wordmark as DOC-52 §5.3 measures it, plus one node of every kind the
 * refusals turn on. `#one` ink ends at 26.0 while its pen lands at 34.4 (8.4
 * apart); aligning `#ord` to `#one` by cap-top is 3.6 and by ink-top is 4.4.
 */
function wordmark(): RawMeasurement {
  const nodes: RawNodeMeasurement[] = [
    {
      ref: '#one',
      id: 'one',
      kind: 'text',
      text: '1',
      font: 'f0',
      fontSize: 62,
      box: [0, 15.5, 34.4, 46.5],
      ink: [1.2, 18.6, 24.8, 43.4],
      baseline: 62,
      advanceStart: 0,
      advanceWidth: 34.4,
      attrs: { x: '0', y: '62', cx: null, cy: null },
      scale: [1, 1],
      skewed: false,
      path: '0.0',
    },
    {
      ref: '#ord',
      id: 'ord',
      kind: 'text',
      text: 'st',
      font: 'f0',
      fontSize: 20,
      box: [34.4, 14, 18.2, 20],
      ink: [35.1, 14.2, 16.8, 14.8],
      baseline: 29,
      advanceStart: 34.4,
      advanceWidth: 18.2,
      attrs: { x: '34.4', y: '29', cx: null, cy: null },
      scale: [1, 1],
      skewed: false,
      path: '0.1',
    },
    {
      ref: '0.2',
      id: null,
      kind: 'line',
      box: [80, 76.25, 160, 3.5],
      attrs: { x: null, y: null, cx: null, cy: null },
      scale: [1, 1],
      skewed: false,
      path: '0.2',
    },
    {
      ref: '#bar',
      id: 'bar',
      kind: 'rect',
      box: [10, 70, 40, 4],
      attrs: { x: '10', y: '70', cx: null, cy: null },
      scale: [1, 1],
      skewed: false,
      path: '0.3',
    },
    {
      ref: '#dot',
      id: 'dot',
      kind: 'circle',
      box: [300, 10, 6, 6],
      attrs: { x: null, y: null, cx: '303', cy: '13' },
      scale: [1, 1],
      skewed: false,
      path: '0.4',
    },
    {
      ref: '#swash',
      id: 'swash',
      kind: 'path',
      box: [100, 0, 20, 10],
      attrs: { x: null, y: null, cx: null, cy: null },
      scale: [1, 1],
      skewed: false,
      path: '0.5',
    },
    {
      // Inside a rotate(10): moving it on one axis is not one attribute's job.
      ref: '#tilt',
      id: 'tilt',
      kind: 'text',
      text: 'T',
      font: 'f0',
      fontSize: 10,
      box: [200, 40, 6, 10],
      ink: [200, 43, 6, 7],
      baseline: 50,
      advanceStart: 200,
      advanceWidth: 6,
      attrs: { x: '200', y: '50', cx: null, cy: null },
      scale: [1, 1],
      skewed: true,
      path: '0.6.0',
    },
    {
      // Per-glyph x positions — a list, not one number.
      ref: '#glyphs',
      id: 'glyphs',
      kind: 'text',
      text: 'abc',
      font: 'f0',
      fontSize: 10,
      box: [1, 80, 3, 10],
      ink: [1, 83, 3, 7],
      baseline: 90,
      advanceStart: 1,
      advanceWidth: 3,
      attrs: { x: '1 2 3', y: '90', cx: null, cy: null },
      scale: [1, 1],
      skewed: false,
      path: '0.7',
    },
    {
      // Inside a scale(0, 1) group: nothing on x moves it.
      ref: '#flat',
      id: 'flat',
      kind: 'rect',
      box: [0, 0, 0, 5],
      attrs: { x: '4', y: '0', cx: null, cy: null },
      scale: [0, 1],
      skewed: false,
      path: '0.8.0',
    },
    {
      // Inside a scale(2) group, authored at y=20 locally, so its baseline is 40.
      ref: '#big',
      id: 'big',
      kind: 'text',
      text: 'B',
      font: 'f0',
      fontSize: 40,
      box: [240, 10, 30, 38],
      ink: [242, 12, 26, 28],
      baseline: 40,
      advanceStart: 240,
      advanceWidth: 30,
      attrs: { x: '120', y: '20', cx: null, cy: null },
      scale: [2, 2],
      skewed: false,
      path: '0.9.0',
    },
  ]
  return {
    viewBox: [0, 0, 320, 86],
    space: 'root user units, y-down; nested transforms resolved',
    fonts: [FONT],
    nodes,
    warnings: [],
  }
}

/** `measurement` with `ref` moved by `dx`, `dy` in root space, as writing it would. */
function moved(measurement: RawMeasurement, ref: string, dx: number, dy: number): RawMeasurement {
  const shift = (b: Box | null | undefined): Box | null | undefined =>
    b ? [b[0] + dx, b[1] + dy, b[2], b[3]] : b
  return {
    ...measurement,
    nodes: measurement.nodes.map((node) =>
      node.ref !== ref
        ? node
        : {
            ...node,
            box: shift(node.box) as Box,
            ink: shift(node.ink),
            baseline: node.baseline == null ? node.baseline : node.baseline + dy,
            advanceStart: node.advanceStart == null ? node.advanceStart : node.advanceStart + dx,
          },
    ),
  }
}

/** A drawing the validator accepts; its geometry comes from the measurer. */
const A_DRAWING =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 86">' +
  '<text id="one" x="0" y="62" font-family="Satoshi" font-size="62">1</text>' +
  '<text id="ord" x="34.4" y="29" font-family="Satoshi" font-size="20">st</text>' +
  '</svg>'

/** A measurer whose answer can be swapped, recording every drawing it was handed. */
function fakeMeasurer(initial: RawMeasurement = wordmark()) {
  const calls: string[] = []
  let answer = initial
  return {
    calls,
    answer: (next: RawMeasurement) => {
      answer = next
    },
    measure: (async (svg: string) => {
      calls.push(svg)
      return answer
    }) as DrawingMeasurer,
  }
}

let site: SiteFixture | undefined

afterEach(() => {
  site?.dispose()
  site = undefined
})

/** The operations over a fresh real store, with `A_DRAWING` already written. */
async function surface(measurer: DrawingMeasurer | null) {
  site = makeMemorySite()
  const ops = l1Operations(site.slug, site.opts, {}, measurer)
  await ops.write_image({ name: 'wordmark', svg: A_DRAWING })
  return ops
}

async function assetBytes(name: string): Promise<string | null> {
  const bytes = await site!.store.readAsset(site!.slug, name)
  return bytes ? new TextDecoder().decode(bytes) : null
}

/** Everything the site holds: config, pages and every asset's bytes. */
async function siteSnapshot(): Promise<string> {
  const assets = [...(await site!.store.listAssets(site!.slug))].sort()
  const bytes = await Promise.all(assets.map((a) => assetBytes(a)))
  const config = await l1Operations(site!.slug, site!.opts, {}, null).describe_site({})
  return JSON.stringify({ assets, bytes, config })
}

/** A tool answer, with the untrusted-content markers a read is wrapped in removed. */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

interface Operation {
  op: string
  tool: string
  effect: string
  description?: string
  params?: Record<string, { description?: string }>
}
interface Group {
  group: string
  effect: string
  operations: string[]
}

// ── the real browser, where one can be launched ──────────────────────────────

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

let browser: import('playwright').Browser | undefined
let why = ''

/**
 * The site's declared face — a real font file served by `@font-face`, so the
 * measurement is of a named face rather than whatever a platform supplies.
 */
const SITE_FONT = 'SitePlex'
const SITE_FONT_URL = `data:font/woff2;base64,${readFileSync(
  path.join(REPO, 'apps/control-app/src/builder/fonts/ibm-plex-sans-400-latin.woff2'),
).toString('base64')}`

/**
 * The page a drawing is measured in: the site's `@font-face`, plus a page
 * stylesheet that would restyle any bare `<text>` it could reach — which the
 * measurement must not be perturbed by.
 */
const SITE_PAGE =
  '<!doctype html><html><head><style>' +
  `@font-face { font-family: '${SITE_FONT}'; src: url(${SITE_FONT_URL}) format('woff2'); }` +
  'text, tspan { font-size: 200px !important; font-family: monospace !important; }' +
  '</style></head><body><p>page</p></body></html>'

/** A measurer backed by Chromium, running the shipped script in the site's page. */
const realMeasurer: DrawingMeasurer = async (svg: string) => {
  const page = await browser!.newPage()
  try {
    await page.setContent(SITE_PAGE)
    return (await page.evaluate(measureScript(svg))) as RawMeasurement
  } finally {
    await page.close()
  }
}

beforeAll(async () => {
  const chromium = await loadChromium()
  if (!chromium) {
    why = 'playwright is not installed in tools/generate'
  } else {
    for (const opts of [{}, { channel: 'chrome' as const }]) {
      try {
        browser = await chromium.launch(opts)
        break
      } catch {
        /* try the next */
      }
    }
    if (!browser) why = 'no Chromium could be launched (run `npx playwright install chromium`)'
  }
  if (!browser) {
    console.warn(`story-d2bee21c browser cases SKIPPED — ${why}. The measurement is unverified here.`)
  }
}, 120_000)

afterAll(async () => {
  await browser?.close()
})

/** Write `svg` as a site drawing and hand back the operations that will measure it. */
async function written(name: string, svg: string) {
  site = makeMemorySite()
  const ops = l1Operations(site.slug, site.opts, {}, browser ? realMeasurer : null)
  await ops.write_image({ name, svg })
  expect(await site.store.listAssets(site.slug)).toContain(`${name}.svg`)
  return ops
}

type Measured = { nodes: Record<string, unknown>[]; fonts: Record<string, unknown>[] } & Record<
  string,
  unknown
>

const byRef = (m: Measured, ref: string) => m.nodes.find((n) => n.ref === ref) as Record<string, never>
const right = (b: number[]) => b[0] + b[2]

// ── the ACs ──────────────────────────────────────────────────────────────────

describe('story-d2bee21c the anchor vocabulary', () => {
  it('test_UAT_AC2393_anchors_are_a_closed_set_of_17_with_an_inferred_axis', async () => {
    const expected: Record<string, 'x' | 'y'> = {
      left: 'x',
      right: 'x',
      top: 'y',
      bottom: 'y',
      'centre-x': 'x',
      'centre-y': 'y',
      'ink-left': 'x',
      'ink-right': 'x',
      'ink-top': 'y',
      'ink-bottom': 'y',
      baseline: 'y',
      'cap-top': 'y',
      'x-top': 'y',
      ascender: 'y',
      descender: 'y',
      'advance-start': 'x',
      'advance-end': 'x',
    }
    // Exactly the seventeen, no more and no fewer.
    expect([...ANCHOR_NAMES].sort()).toEqual(Object.keys(expected).sort())
    expect(ANCHOR_NAMES).toHaveLength(17)

    // Every one resolves against a measured text node, on the axis its name fixes.
    const ops = await surface(fakeMeasurer().measure)
    for (const [anchor, axis] of Object.entries(expected)) {
      expect(anchorAxis(anchor), anchor).toBe(axis)
      const out = (await ops.relate({
        drawing: 'wordmark',
        a: `#one.${anchor}`,
        b: `#one.${anchor}`,
      })) as { axis: string; delta: number; a: { axis: string } }
      expect(out.axis, anchor).toBe(axis)
      expect(out.a.axis, anchor).toBe(axis)
      expect(out.delta, anchor).toBe(0)
    }

    // A misspelt anchor is refused with the valid names listed.
    const one = { node: wordmark().nodes[0], font: FONT }
    let misspelt = ''
    try {
      anchorValue(one, 'cap-tip')
    } catch (error) {
      misspelt = (error as Error).message
    }
    for (const name of Object.keys(expected)) expect(misspelt, name).toContain(name)
    await expect(
      ops.relate({ drawing: 'wordmark', a: '#one.cap-tip', b: '#one.cap-top' }),
    ).rejects.toThrow(/not an anchor reference/)

    // Ink, font and advance anchors on a node with no text point to the box anchors.
    for (const anchor of ['ink-top', 'cap-top', 'advance-start']) {
      const other = anchorAxis(anchor) === 'x' ? '#one.left' : '#one.top'
      await expect(
        ops.relate({ drawing: 'wordmark', a: `#bar.${anchor}`, b: other }),
      ).rejects.toThrow(/box anchor \(left, right, centre-x, top, bottom, centre-y\)/)
    }
  })
})

describe('story-d2bee21c what a measurement reports', () => {
  it('test_UAT_AC2394_measurement_is_root_space_primitives_fonts_once_no_internals', async (ctx) => {
    const NESTED =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">' +
      `<g transform="translate(40,10)"><text id="t" x="5" y="30" font-family="${SITE_FONT}" font-size="20">Hi</text></g>` +
      `<text id="u" x="5" y="30" font-family="${SITE_FONT}" font-size="20">Hi</text>` +
      '</svg>'
    const ops = await written('nested', NESTED)
    if (!browser) ctx.skip(`no browser: ${why}`)

    const out = (await ops.measure_drawing({ drawing: 'nested' })) as Measured
    expect(out.drawing).toBe('nested')
    expect(out.viewBox).toEqual([0, 0, 200, 80])
    // Two text nodes in one font: one font entry, with its proportions.
    expect(out.fonts).toHaveLength(1)
    for (const key of ['capHeight', 'xHeight', 'ascender', 'descender']) {
      expect(typeof out.fonts[0][key], key).toBe('number')
    }
    const t = byRef(out, '#t') as unknown as Record<string, number[] & number>
    const u = byRef(out, '#u') as unknown as Record<string, number[] & number>
    expect(t.kind).toBe('text')
    // The translated node reports its local position plus the translation.
    expect(t.box[0]).toBeCloseTo(u.box[0] + 40, 2)
    expect(t.box[1]).toBeCloseTo(u.box[1] + 10, 2)
    expect(t.box[2]).toBeCloseTo(u.box[2], 2)
    expect(t.baseline).toBeCloseTo(40, 2)
    expect(t.advanceStart).toBeCloseTo(45, 2)
    expect(t.ink[1]).toBeCloseTo(u.ink[1] + 10, 2)
    expect(t.advanceWidth).toBeGreaterThan(0)
    // The arithmetic's internals are never shown to the model.
    for (const node of out.nodes) {
      for (const hidden of ['attrs', 'scale', 'skewed', 'path']) {
        expect(node, `${String(node.ref)} ${hidden}`).not.toHaveProperty(hidden)
      }
    }
  })

  it('test_UAT_AC2395_text_reports_per_glyph_extents_and_tspan_runs_union_into_the_parent', async (ctx) => {
    const RUNS =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80">' +
      `<text id="t" x="0" y="50" font-family="${SITE_FONT}" font-size="40">` +
      '<tspan id="a">1st</tspan><tspan id="b"> Con</tspan><tspan id="c">tact</tspan>' +
      '</text></svg>'
    const ops = await written('runs', RUNS)
    if (!browser) ctx.skip(`no browser: ${why}`)

    const out = (await ops.measure_drawing({ drawing: 'runs' })) as Measured
    const t = byRef(out, '#t') as unknown as Record<string, never>
    const runs = ['#a', '#b', '#c'].map((ref) => byRef(out, ref) as unknown as Record<string, never>)
    // One glyph extent per character, in root space, on every text node.
    for (const node of [t, ...runs]) {
      const glyphs = node.glyphs as { char: string; box: number[] }[]
      expect(glyphs, node.ref).toHaveLength((node.text as string).length)
      for (const g of glyphs) expect(g.box, node.ref).toHaveLength(4)
    }
    expect((t.glyphs as unknown[]).length).toBe('1st Contact'.length)
    // Runs with no authored x land after the run before them, without overlap.
    const [a, b, c] = runs.map((r) => r.box as number[])
    expect(b[0]).toBeGreaterThanOrEqual(right(a) - 0.01)
    expect(c[0]).toBeGreaterThanOrEqual(right(b) - 0.01)
    expect(c[0]).toBeGreaterThanOrEqual(b[0])
    // The parent's box is the union of its runs.
    const tb = t.box as number[]
    expect(tb[0]).toBeCloseTo(a[0], 1)
    expect(right(tb)).toBeCloseTo(right(c), 1)
  })

  it('test_UAT_AC2396_ink_advance_and_font_lines_are_distinct_values', async (ctx) => {
    // DOC-52 §5.3's wordmark: where the "1" ends is two answers, 8.4 apart.
    const fixture = await surface(fakeMeasurer().measure)
    const inkVsAdvance = (await fixture.relate({
      drawing: 'wordmark',
      a: '#one.ink-right',
      b: '#one.advance-end',
    })) as { delta: number }
    expect(Math.abs(inkVsAdvance.delta)).toBeCloseTo(8.4, 3)
    // Aligning by ink-top and by cap-top give different deltas.
    const byCap = (await fixture.relate({ drawing: 'wordmark', a: '#ord.cap-top', b: '#one.cap-top' })) as {
      delta: number
    }
    const byInk = (await fixture.relate({ drawing: 'wordmark', a: '#ord.ink-top', b: '#one.ink-top' })) as {
      delta: number
    }
    expect(byCap.delta).toBeCloseTo(3.6, 3)
    expect(byInk.delta).toBeCloseTo(4.4, 3)
    site!.dispose()
    site = undefined

    const MARK =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80">' +
      `<text id="one" x="0" y="62" font-family="${SITE_FONT}" font-size="62">1</text>` +
      `<text id="st" x="60" y="62" font-family="${SITE_FONT}" font-size="62">st</text>` +
      `<text id="h" x="160" y="62" font-family="${SITE_FONT}" font-size="62">H</text>` +
      '</svg>'
    const ops = await written('mark', MARK)
    if (!browser) ctx.skip(`no browser: ${why}`)

    const relate = async (a: string, b: string) =>
      ((await ops.relate({ drawing: 'mark', a, b })) as { delta: number }).delta
    expect(Math.abs(await relate('#one.ink-right', '#one.advance-end'))).toBeGreaterThan(0.5)
    expect(Math.abs(await relate('#st.ink-top', '#st.cap-top'))).toBeGreaterThan(0.1)
    expect(Math.abs(await relate('#h.cap-top', '#h.ink-top'))).toBeLessThan(0.5)
  })

  it('test_UAT_AC2397_fonts_report_requested_and_resolved_face', async (ctx) => {
    const drawing = (family: string) =>
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">' +
      `<text id="w" x="0" y="40" font-family="${family}" font-size="40">Ax</text></svg>`
    const opsPlatform = await written('platform', drawing('system-ui, -apple-system, sans-serif'))
    await opsPlatform.write_image({ name: 'absent', svg: drawing('Nonesuch Whatever, serif') })
    await opsPlatform.write_image({ name: 'declared', svg: drawing(SITE_FONT) })
    if (!browser) ctx.skip(`no browser: ${why}`)

    const fontOf = async (name: string) => {
      const out = (await opsPlatform.measure_drawing({ drawing: name })) as Measured
      expect(out.fonts, name).toHaveLength(1)
      return { font: out.fonts[0] as Record<string, string>, node: byRef(out, '#w') }
    }
    const platform = await fontOf('platform')
    expect(platform.font.requested).toMatch(/system-ui/)
    expect(platform.font.resolved).not.toBe(platform.font.requested)

    const absent = await fontOf('absent')
    expect(absent.font.requested).toMatch(/Nonesuch/)
    expect(absent.font.resolved).toBe('serif')

    const declared = await fontOf('declared')
    expect(declared.font.requested).toBe(SITE_FONT)
    expect(declared.font.resolved).toBe(SITE_FONT)
    // The page's own `text { font-size: 200px !important }` did not reach it.
    expect(declared.node.fontSize).toBe(40)
  })

  it('test_UAT_AC2398_unidd_nodes_by_path_defs_skipped_degenerate_flagged', async (ctx) => {
    const MIXED =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">' +
      '<defs><linearGradient id="g"><stop offset="0" stop-color="#000000"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>' +
      '<rect x="10" y="10" width="30" height="20" fill="url(#g)"/>' +
      `<text id="e" x="0" y="45" font-family="${SITE_FONT}" font-size="10"></text>` +
      '</svg>'
    const ops = await written('mixed', MIXED)
    if (!browser) ctx.skip(`no browser: ${why}`)

    const out = (await ops.measure_drawing({ drawing: 'mixed' })) as Measured
    const rect = out.nodes.find((n) => n.kind === 'rect')!
    expect(rect.ref).toMatch(/^0(\.\d+)+$/)
    expect(rect.id).toBeNull()
    // Nothing from <defs> appears.
    for (const node of out.nodes) {
      expect(['defs', 'lineargradient', 'lineargradient', 'stop']).not.toContain(
        String(node.kind).toLowerCase(),
      )
      expect(node.ref).not.toBe('#g')
    }
    // The empty text is present, flagged, not missing.
    expect(byRef(out, '#e')).toBeDefined()
    expect(byRef(out, '#e').degenerate).toBe(true)
  })
})

describe('story-d2bee21c relate and solve', () => {
  it('test_UAT_AC2399_relate_returns_b_minus_a_and_refuses_mixed_axes', async () => {
    const ops = await surface(fakeMeasurer().measure)
    const out = (await ops.relate({
      drawing: 'wordmark',
      a: '#ord.cap-top',
      b: '#one.cap-top',
    })) as { a: { value: number; anchor: string }; b: { value: number }; axis: string; delta: number }
    // #one cap-top = 62 − 0.7·62 = 18.6; #ord cap-top = 29 − 0.7·20 = 15.
    expect(out.a.anchor).toBe('cap-top')
    expect(out.a.value).toBeCloseTo(15, 6)
    expect(out.b.value).toBeCloseTo(18.6, 6)
    expect(out.axis).toBe('y')
    expect(out.delta).toBeCloseTo(out.b.value - out.a.value, 3)
    expect(out.delta).toBeGreaterThan(0)
    const reversed = (await ops.relate({ drawing: 'wordmark', a: '#one.cap-top', b: '#ord.cap-top' })) as {
      delta: number
    }
    expect(reversed.delta).toBeCloseTo(-3.6, 3)
    // Rounded to three decimals.
    const thirds = fakeMeasurer(moved(wordmark(), '#bar', 1 / 3, 0))
    const fine = (await l1Operations(site!.slug, site!.opts, {}, thirds.measure).relate({
      drawing: 'wordmark',
      a: '#one.left',
      b: '#bar.left',
    })) as { delta: number }
    expect(fine.delta).toBe(10.333)

    await expect(
      ops.relate({ drawing: 'wordmark', a: '#ord.top', b: '#one.left' }),
    ).rejects.toThrow(/lies on the y axis and '#one\.left' on the x axis/)
  })

  it('test_UAT_AC2400_unknown_nodes_and_malformed_refs_are_refused_with_the_fix', async () => {
    const measurer = fakeMeasurer()
    const ops = await surface(measurer.measure)
    const refs = wordmark().nodes.map((n) => n.ref)

    let missing = ''
    await ops.relate({ drawing: 'wordmark', a: '#missing.top', b: '#one.top' }).catch((e: Error) => {
      missing = e.message
    })
    expect(missing).toMatch(/no node called '#missing'/)
    expect(missing).toContain(refs.join(', '))

    let malformed = ''
    await ops.relate({ drawing: 'wordmark', a: 'wordmark', b: '#one.top' }).catch((e: Error) => {
      malformed = e.message
    })
    expect(malformed).toMatch(/<node>\.<anchor>/)
    expect(malformed).toMatch(/e\.g\. '#\w+\.[\w-]+'/)
    expect(malformed).not.toBe(missing)

    // The same two refusals through solve…
    await expect(
      ops.solve({ drawing: 'wordmark', so: '#missing.top', equals: '#one.top' }),
    ).rejects.toThrow(refs.join(', '))
    await expect(
      ops.solve({ drawing: 'wordmark', so: 'wordmark', equals: '#one.top' }),
    ).rejects.toThrow(/<node>\.<anchor>/)

    // …and through assert, as reasons rather than refusals.
    const out = (await ops.write_image({
      name: 'wordmark',
      svg: A_DRAWING,
      replace: true,
      assert: ['#missing.top = #one.top', 'wordmark = #one.top'],
    })) as { asserted: { why?: string }[] }
    expect(out.asserted[0].why).toContain(refs.join(', '))
    expect(out.asserted[1].why).toMatch(/<node>\.<anchor>/)

    // A drawing with nothing measurable says so.
    measurer.answer({ ...wordmark(), nodes: [] })
    await expect(
      ops.relate({ drawing: 'wordmark', a: '#one.top', b: '#one.top' }),
    ).rejects.toThrow(/nothing measurable/)
  })

  it('test_UAT_AC2401_solve_returns_node_attr_value_and_applying_it_zeroes_relate', async () => {
    const measurer = fakeMeasurer()
    const ops = await surface(measurer.measure)
    type Solved = { node: string; attr: string; value: number; from: number; axis: string; delta: number }
    const relate = async (a: string, b: string) =>
      ((await ops.relate({ drawing: 'wordmark', a, b })) as { delta: number }).delta

    // Equals, with `move` omitted.
    const s = (await ops.solve({ drawing: 'wordmark', so: '#ord.cap-top', equals: '#one.cap-top' })) as Solved
    expect(s).toMatchObject({ node: '#ord', attr: 'y', from: 29, axis: 'y' })
    expect(s.value).toBeCloseTo(32.6, 3)
    expect(s.delta).toBeCloseTo(3.6, 3)
    measurer.answer(moved(wordmark(), '#ord', 0, s.value - s.from))
    expect(await relate('#ord.cap-top', '#one.cap-top')).toBeCloseTo(0, 3)

    // Offset: lands n past `equals`, so relate reads −n afterwards.
    measurer.answer(wordmark())
    const o = (await ops.solve({
      drawing: 'wordmark',
      so: '#ord.ink-left',
      equals: '#one.ink-right',
      offset: 2,
    })) as Solved
    expect(o).toMatchObject({ node: '#ord', attr: 'x', axis: 'x' })
    measurer.answer(moved(wordmark(), '#ord', o.value - o.from, 0))
    expect(await relate('#ord.ink-left', '#one.ink-right')).toBeCloseTo(-2, 3)

    // Under a scale(2): the value is in local space, so the root move is twice it.
    measurer.answer(wordmark())
    const b = (await ops.solve({ drawing: 'wordmark', move: '#big', so: '#big.baseline', equals: '#one.baseline' })) as Solved
    expect(b).toMatchObject({ node: '#big', attr: 'y', from: 20 })
    expect(b.delta).toBeCloseTo(22, 3)
    expect(b.value).toBeCloseTo(31, 3)
    measurer.answer(moved(wordmark(), '#big', 0, (b.value - b.from) * 2))
    expect(await relate('#big.baseline', '#one.baseline')).toBeCloseTo(0, 3)

    // The attribute per kind: x/y for rect, cx/cy for circle.
    measurer.answer(wordmark())
    const r = (await ops.solve({ drawing: 'wordmark', so: '#bar.left', equals: '#one.left' })) as Solved
    expect(r).toMatchObject({ node: '#bar', attr: 'x', from: 10, value: 0 })
    const c = (await ops.solve({ drawing: 'wordmark', so: '#dot.centre-y', equals: '#one.baseline' })) as Solved
    expect(c).toMatchObject({ node: '#dot', attr: 'cy', from: 13 })
    expect(c.value).toBeCloseTo(13 + (62 - 13), 3)
    const cx = (await ops.solve({ drawing: 'wordmark', so: '#dot.left', equals: '#one.left' })) as Solved
    expect(cx.attr).toBe('cx')
  })

  it('test_UAT_AC2402_solve_refuses_what_one_translation_cannot_do', async () => {
    const ops = await surface(fakeMeasurer().measure)
    const refusal = async (request: Record<string, unknown>) => {
      try {
        await ops.solve({ drawing: 'wordmark', ...request })
      } catch (error) {
        return (error as Error).message
      }
      throw new Error(`solve ${JSON.stringify(request)} returned a value instead of refusing`)
    }
    const messages = [
      await refusal({ so: '#swash.top', equals: '#one.top' }),
      await refusal({ so: '#tilt.baseline', equals: '#one.baseline' }),
      await refusal({ so: '#glyphs.left', equals: '#one.left' }),
      await refusal({ move: '#one', so: '#ord.cap-top', equals: '#one.cap-top' }),
      await refusal({ so: '#flat.left', equals: '#one.left' }),
      await refusal({ so: '#ord.top', equals: '#one.left' }),
    ]
    expect(messages[0]).toMatch(/<path> has no single attribute/)
    expect(messages[0]).toMatch(/<text>, <tspan>, <rect>, <circle>, <ellipse>/)
    expect(messages[0]).toMatch(/put it in a <g>/)
    expect(await refusal({ so: '0.2.top', equals: '#one.top' })).toMatch(/<line> has no single attribute/)
    expect(messages[1]).toMatch(/rotated or skewed/)
    expect(messages[1]).toMatch(/adjust the transform by hand|untransformed/)
    expect(messages[2]).toMatch(/x="1 2 3".*list rather than one number/)
    expect(messages[3]).toMatch(/'#one' is not the node '#ord\.cap-top' is an anchor of/)
    expect(messages[3]).toMatch(/Move the node the anchor belongs to/)
    expect(messages[4]).toMatch(/scaled to nothing on the x axis/)
    expect(messages[5]).toMatch(/y axis and .* x axis/)
    // Each refusal is its own sentence.
    expect(new Set(messages).size).toBe(messages.length)
  })
})

describe('story-d2bee21c recorded relations and assert', () => {
  it('test_UAT_AC2403_measure_reports_recorded_relations_with_their_current_delta', async () => {
    const measurer = fakeMeasurer(moved(wordmark(), '#ord', 0, 3.6))
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, measurer.measure)
    const recordedSvg = A_DRAWING.replace(
      '<text',
      '<!-- #ord.cap-top = #one.cap-top --><!-- #gone.top = #one.top + 2 --><!-- a plain note --><text',
    )
    await ops.write_image({ name: 'wordmark', svg: recordedSvg })
    // Accepted unchanged: the comment is in what the site holds.
    expect(await assetBytes('wordmark.svg')).toBe(recordedSvg)

    type Recorded = { relation: string; delta?: number; holds?: boolean; why?: string }
    const recorded = async () =>
      ((await ops.measure_drawing({ drawing: 'wordmark' })) as { recorded: Recorded[] }).recorded

    const holding = await recorded()
    expect(holding).toHaveLength(2)
    expect(holding[0]).toMatchObject({ relation: '#ord.cap-top = #one.cap-top', holds: true })
    expect(holding[0].delta).toBeCloseTo(0, 6)
    expect(holding[1].relation).toBe('#gone.top = #one.top + 2')
    expect(holding[1].why).toMatch(/no node called '#gone'/)
    expect(holding[1].holds).toBeUndefined()

    // #ord's font-size changes, so its cap-top moves and the note no longer holds.
    await ops.write_image({ name: 'wordmark', svg: recordedSvg.replace('font-size="20"', 'font-size="24"'), replace: true })
    measurer.answer(wordmark())
    const stale = await recorded()
    expect(stale[0].delta).toBeCloseTo(3.6, 3)
    expect(stale[0].holds).toBe(false)

    // Within 0.05 is holding.
    measurer.answer(moved(wordmark(), '#ord', 0, 3.56))
    expect((await recorded())[0].holds).toBe(true)

    // No recorded relations: an empty list.
    await ops.write_image({ name: 'plain', svg: A_DRAWING })
    const plain = (await ops.measure_drawing({ drawing: 'plain' })) as { recorded: unknown[] }
    expect(plain.recorded).toEqual([])
  })

  it('test_UAT_AC2404_assert_always_writes_and_reports_each_relation_against_the_written_drawing', async () => {
    const measurer = fakeMeasurer()
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, measurer.measure)
    const stated = [
      '#ord.cap-top = #one.cap-top',
      'make it line up',
      '#ord.cap-tip = #one.cap-top',
      '#gone.top = #one.top',
      '#ord.ink-left = #one.ink-right + 2',
    ]
    const out = (await ops.write_image({ name: 'wordmark', svg: A_DRAWING, assert: stated })) as {
      asset: unknown
      asserted: { relation: string; delta?: number; holds?: boolean; why?: string }[]
    }

    // Written although the relations do not hold.
    expect(await assetBytes('wordmark.svg')).toBe(A_DRAWING)
    expect(out.asset).toBeDefined()
    // One entry per stated relation, in order, none dropped.
    expect(out.asserted.map((a) => a.relation)).toEqual(stated)
    expect(out.asserted[0].delta).toBeCloseTo(3.6, 3)
    expect(out.asserted[0].holds).toBe(false)
    expect(out.asserted[1].why).toMatch(/not a relation/)
    expect(out.asserted[2].why).toBeTruthy()
    expect(out.asserted[3].why).toMatch(/no node called '#gone'/)
    expect(out.asserted[4].delta).toBeCloseTo(-7.1, 3)
    for (const entry of out.asserted.slice(1, 4)) expect(entry.holds).toBeUndefined()

    // Evaluated against the drawing as written — the stored bytes went to the measurer.
    expect(measurer.calls).toEqual([await assetBytes('wordmark.svg')])

    // The 0.05 boundary.
    const check = async (dy: number) => {
      measurer.answer(moved(wordmark(), '#ord', 0, dy))
      const r = (await ops.write_image({
        name: 'wordmark',
        svg: A_DRAWING,
        replace: true,
        assert: ['#ord.cap-top = #one.cap-top'],
      })) as { asserted: { delta: number; holds: boolean }[] }
      return r.asserted[0]
    }
    expect(await check(3.56)).toEqual({ relation: '#ord.cap-top = #one.cap-top', delta: 0.04, holds: true })
    expect((await check(3.54)).holds).toBe(false)
    expect((await check(3.6)).holds).toBe(true)
  })

  it('test_UAT_AC2405_write_image_without_assert_renders_nothing', async () => {
    const measurer = fakeMeasurer()
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, measurer.measure)
    const absent = (await ops.write_image({ name: 'a', svg: A_DRAWING })) as Record<string, unknown>
    const empty = (await ops.write_image({ name: 'b', svg: A_DRAWING, assert: [] })) as Record<string, unknown>
    expect(measurer.calls).toHaveLength(0)
    for (const out of [absent, empty]) {
      expect(out).toHaveProperty('asset')
      expect(out).not.toHaveProperty('asserted')
    }
    // The same with no browser at all.
    const bare = l1Operations(site.slug, site.opts, {}, null)
    const none = (await bare.write_image({ name: 'c', svg: A_DRAWING })) as Record<string, unknown>
    expect(none).not.toHaveProperty('asserted')
    expect(await site.store.listAssets(site.slug)).toEqual(
      expect.arrayContaining(['a.svg', 'b.svg', 'c.svg']),
    )
  })
})

describe('story-d2bee21c the operations on the consultant surface', () => {
  it('test_UAT_AC2406_with_no_browser_the_operations_are_offered_and_refuse_with_the_reason', async () => {
    site = makeMemorySite()
    // The ordinary host build: no measurer given. Start-up does not fail.
    const box = await createL1Toolbox(site.slug, {}, { store: site.store })
    const offered = box.toolNames() as string[]
    expect(offered).toEqual(expect.arrayContaining(['measure_drawing', 'relate', 'solve', 'write_image']))

    const written = unwrap(
      await box.run('write_image', {
        name: 'wordmark',
        svg: A_DRAWING,
        assert: ['#ord.cap-top = #one.cap-top', '#ord.left = #one.right'],
      }),
    )
    expect(await assetBytes('wordmark.svg')).toBe(A_DRAWING)
    const asserted = (JSON.parse(written) as { asserted: { relation: string; why: string }[] }).asserted
    expect(asserted).toHaveLength(2)
    for (const entry of asserted) expect(entry.why).toMatch(/no browser.*cannot be measured/)

    const calls: [string, Record<string, unknown>][] = [
      ['measure_drawing', { drawing: 'wordmark' }],
      ['relate', { drawing: 'wordmark', a: '#ord.top', b: '#one.top' }],
      ['solve', { drawing: 'wordmark', so: '#ord.top', equals: '#one.top' }],
    ]
    for (const [tool, input] of calls) {
      const answer = await box.run(tool, input)
      expect(answer, tool).toMatch(/no browser/)
      expect(answer, tool).toMatch(/cannot be measured/)
    }
  })

  it('test_UAT_AC2407_write_image_description_gives_the_three_authoring_rules', async () => {
    const op = (L1_DECLARATION.operations as Operation[]).find((o) => o.op === 'write_image')!
    const text = op.description!
    expect(text).toMatch(/ONE `<text>` with `<tspan>` children/)
    expect(text).toMatch(/never several `<text>` elements/)
    expect(text).toMatch(/`system-ui`, `-apple-system` and a bare `sans-serif` are not faces/)
    expect(text).toMatch(/Name a real font/)
    expect(text).toMatch(/Give a node an `id` when you mean to position it precisely/)
    const assertDoc = op.params!.assert.description!
    expect(assertDoc).toMatch(/<node>\.<anchor> = <node>\.<anchor>/)
    expect(assertDoc).toMatch(/never blocks the write/)
    expect(assertDoc).toMatch(/costs a render, and nothing else does/)

    // It is the description the consultant is actually given.
    site = makeMemorySite()
    const box = await createL1Toolbox(site.slug, {}, { store: site.store })
    expect(box.toolNames()).toContain('write_image')
    // …from the declaration this test read: the shipped surface, not a copy.
    expect((L1_DECLARATION.operations as Operation[]).filter((o) => o.tool === 'write_image')).toHaveLength(1)
  })

  it('test_UAT_AC2408_drawing_operations_are_a_read_effect_group_reading_the_sites_own_drawings', async () => {
    const operations = L1_DECLARATION.operations as Operation[]
    const groups = L1_DECLARATION.groups as Group[]
    const granted = (L1_INSTANCES.consultant as { l1: { groups: string[] } }).l1.groups
    const measuring = groups.find((g) => g.group === 'MeasureDrawings')!
    expect(measuring.effect).toBe('read')
    expect(measuring.operations.sort()).toEqual(['measure_drawing', 'relate', 'solve'])
    expect(granted).toContain('MeasureDrawings')
    for (const tool of ['measure_drawing', 'relate', 'solve']) {
      expect(operations.find((o) => o.tool === tool)!.effect, tool).toBe('read')
    }
    // Declared just before write_image.
    const order = groups.map((g) => g.group)
    expect(order.indexOf('MeasureDrawings')).toBe(order.indexOf('DrawImages') - 1)

    // Through the consultant's own toolbox, over a real store, with a measurer.
    site = makeMemorySite()
    const measurer = fakeMeasurer()
    const editOpts = site.opts
    const box = await createL1ToolboxCore(
      site.slug,
      {},
      {
        lib: await aiCore(),
        store: site.store,
        extraOps: nodeOperations(site.slug, editOpts),
        measurer: measurer.measure,
      },
    )
    expect(box.toolNames()).toEqual(expect.arrayContaining(['measure_drawing', 'relate', 'solve']))
    await box.run('write_image', { name: 'wordmark', svg: A_DRAWING })
    const before = await siteSnapshot()

    const measured = JSON.parse(unwrap(await box.run('measure_drawing', { drawing: 'wordmark' }))) as {
      drawing: string
      nodes: { ref: string }[]
    }
    expect(measured.drawing).toBe('wordmark')
    expect(measured.nodes.map((n) => n.ref)).toContain('#ord')
    // It measured the drawing as the site stores it.
    expect(measurer.calls).toEqual([await assetBytes('wordmark.svg')])

    const unknown = await box.run('measure_drawing', { drawing: 'nothing' })
    expect(unknown).toMatch(/no drawing called 'nothing\.svg'/)
    expect(measurer.calls).toHaveLength(1)
    await box.run('relate', { drawing: 'wordmark', a: '#ord.top', b: '#one.top' })
    await box.run('solve', { drawing: 'wordmark', so: '#ord.top', equals: '#one.top' })

    // Nothing about the site changed.
    expect(await siteSnapshot()).toBe(before)
  })
})
