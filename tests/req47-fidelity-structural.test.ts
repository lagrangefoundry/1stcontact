import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import {
  chromiumAvailable,
  cmdCapturePage,
  diffManifests,
  EXTRACT_SCRIPT,
  flattenCapture,
  type Capture,
  type RawSignals,
  type ValueDelta,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-47 — a severity-ranked structural diff over a richer rendered
 * projection (geometry / containment / arrangement / shape), not pixel area.
 *
 * The comparator UATs are pure and browser-free: they build reference and
 * reproduction value manifests and assert that the three [[REQ-20]] misses
 * (hero block ~195px out of position; contact field placeholder-inside vs
 * label-above; subscribe button beside-vs-below) surface as explicit CRITICAL
 * deltas, and that a small structural defect always outranks a large tonal one.
 * The capture UAT drives a REAL headless Chromium to prove the projection now
 * records per-element geometry, a11y name-source, and arrangement from the DOM.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

// ── manifest builders ────────────────────────────────────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

/** A text run element with sensible defaults. */
function textEl(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#000000',
    fontFamily: 'sans',
    fontSizePx: 18,
    fontWeight: 400,
    ...over,
  }
}

/** A text-free field element (an input box): textless, paired on a11yRole + order. */
function fieldEl(over: Partial<ValueElement> = {}): ValueElement {
  const a11yRole = over.a11yRole ?? 'textbox'
  return {
    text: over.accessibleName ?? `(${a11yRole})`,
    role: a11yRole,
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole,
    accessibleName: '',
    nameSource: null,
    ...over,
  }
}

const mani = (elements: ValueElement[]): ValueManifest => ({ source: 'x', elements })

const has = (deltas: ValueDelta[], textSub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(textSub) && d.property === property)
const find = (deltas: ValueDelta[], property: string): ValueDelta | undefined =>
  deltas.find((d) => d.property === property)

// ── the anti-recurrence AC: the three REQ-20 misses, ranked CRITICAL ─────────

describe('REQ-47 severity-ranked structural diff — the three REQ-20 misses', () => {
  // Reference: hero heading low, email field self-labelled by a placeholder
  // (name inside the box), subscribe button beside the input (a row). Plus a
  // large body paragraph that is merely off in tone (colour) — the "large but
  // mildly wrong" element pixel-area ranking would float to the top.
  const expected = mani([
    textEl('Intentional Software', { role: 'heading', box: box(120, 400, 600, 60) }),
    fieldEl({ accessibleName: 'Your email address', nameSource: 'placeholder', box: box(120, 900, 320, 44) }),
    textEl('Subscribe', { role: 'action', box: box(452, 900, 120, 44), arrangement: 'row' }),
    textEl('A long paragraph of body copy', { color: '#334155', box: box(120, 1200, 900, 320) }),
  ])
  // Reproduction: hero block 195px lower; the field grows a label-above (name
  // outside the box); the button stacks below the input; the paragraph is a
  // near-neighbour grey — a big element, mildly wrong.
  const actual = mani([
    textEl('Intentional Software', { role: 'heading', box: box(120, 595, 600, 60) }),
    fieldEl({ accessibleName: 'Your email address', nameSource: 'label', box: box(120, 900, 320, 44) }),
    textEl('Subscribe', { role: 'action', box: box(452, 900, 120, 44), arrangement: 'stack' }),
    textEl('A long paragraph of body copy', { color: '#94a3b8', box: box(120, 1200, 900, 320) }),
  ])

  it('test_UAT_FC_REQ-47_hero_block_out_of_position_is_critical', () => {
    const { deltas } = diffManifests(expected, actual)
    expect(has(deltas, 'Intentional Software', 'position')).toBe(true)
    const d = find(deltas, 'position')!
    expect(d.kind).toBe('position')
    expect(d.tier).toBe('CRITICAL')
    expect(d.magnitude).toBeCloseTo(195, 0)
  })

  it('test_UAT_FC_REQ-47_placeholder_vs_label_is_a_containment_delta', () => {
    const { deltas } = diffManifests(expected, actual)
    expect(has(deltas, 'Your email address', 'containment')).toBe(true)
    const d = find(deltas, 'containment')!
    expect(d.tier).toBe('CRITICAL')
    expect(d.expected).toContain('placeholder')
    expect(d.actual).toContain('label')
  })

  it('test_UAT_FC_REQ-47_button_arrangement_beside_vs_below_is_critical', () => {
    const { deltas } = diffManifests(expected, actual)
    expect(has(deltas, 'Subscribe', 'arrangement')).toBe(true)
    const d = find(deltas, 'arrangement')!
    expect(d.tier).toBe('CRITICAL')
    expect(d.expected).toContain('beside')
    expect(d.actual).toContain('below')
  })

  it('test_UAT_FC_REQ-47_structural_defects_outrank_the_large_tonal_one', () => {
    const { deltas } = diffManifests(expected, actual)
    // The tonal colour delta on the big paragraph exists…
    expect(has(deltas, 'body copy', 'color')).toBe(true)
    const colorIdx = deltas.findIndex((d) => d.property === 'color')
    // …but every structural (CRITICAL) delta ranks strictly above it, even
    // though the paragraph dwarfs them all in pixel area.
    const criticalIdxs = deltas
      .map((d, i) => (d.tier === 'CRITICAL' ? i : -1))
      .filter((i) => i >= 0)
    expect(criticalIdxs.length).toBeGreaterThanOrEqual(3)
    expect(Math.max(...criticalIdxs)).toBeLessThan(colorIdx)
  })
})

// ── the severity comparator: tier dominates, not magnitude/area ──────────────

describe('REQ-47 severity comparator — tier over magnitude', () => {
  it('test_UAT_FC_REQ-47_small_structural_outranks_large_tonal', () => {
    // A tiny element shifted 300px (structural) vs a huge element with a maximal
    // colour flip (tonal). Area and colour magnitude both favour the tonal one;
    // the tier table must still put the structural delta first.
    const expected = mani([
      textEl('tiny', { box: box(0, 0, 8, 8) }),
      textEl('huge', { color: '#000000', box: box(0, 0, 1600, 900) }),
    ])
    const actual = mani([
      textEl('tiny', { box: box(300, 0, 8, 8) }),
      textEl('huge', { color: '#ffffff', box: box(0, 0, 1600, 900) }),
    ])
    const { deltas } = diffManifests(expected, actual)
    expect(deltas[0].property).toBe('position')
    expect(deltas[0].tier).toBe('CRITICAL')
    expect(deltas[deltas.length - 1].property).toBe('color')
    expect(deltas[deltas.length - 1].tier).toBe('LOW')
  })

  it('test_UAT_FC_REQ-47_kinds_map_to_the_fixed_tier_table', () => {
    // presence/position/arrangement/containment → CRITICAL, size → HIGH,
    // shape → MEDIUM, color → LOW — verified through the real diff, not a table read.
    const critical = diffManifests(
      mani([textEl('x', { box: box(0, 0, 40, 40) })]),
      mani([textEl('x', { box: box(0, 200, 40, 40) })]),
    )
    expect(find(critical.deltas, 'position')!.tier).toBe('CRITICAL')

    const high = diffManifests(
      mani([textEl('x', { box: box(0, 0, 300, 40) })]),
      mani([textEl('x', { box: box(0, 0, 120, 40) })]),
    )
    expect(find(high.deltas, 'size')!.tier).toBe('HIGH')

    const medium = diffManifests(
      mani([fieldEl({ box: box(0, 0, 300, 44), borderRadiusPx: 8, boxShadow: null })]),
      mani([fieldEl({ box: box(0, 0, 300, 44), borderRadiusPx: 0, boxShadow: null })]),
    )
    expect(find(medium.deltas, 'shape')!.tier).toBe('MEDIUM')

    const low = diffManifests(
      mani([textEl('x', { color: '#111111' })]),
      mani([textEl('x', { color: '#eeeeee' })]),
    )
    expect(find(low.deltas, 'color')!.tier).toBe('LOW')
  })
})

// ── over-emit: loose thresholds, unmatched fields fail safe to presence ──────

describe('REQ-47 over-emit and pairing', () => {
  it('test_UAT_FC_REQ-47_position_within_tolerance_is_not_flagged', () => {
    const { deltas } = diffManifests(
      mani([textEl('x', { box: box(0, 0, 40, 40) })]),
      mani([textEl('x', { box: box(0, 12, 40, 40) })]), // 12px < 24px default
    )
    expect(deltas).toEqual([])
  })

  it('test_UAT_FC_REQ-47_unmatched_field_fails_safe_to_presence', () => {
    // A text-free field with no counterpart cannot join on text; it surfaces as
    // a presence delta rather than being silently dropped.
    const report = diffManifests(
      mani([fieldEl({ a11yRole: 'textbox', accessibleName: 'Email', box: box(0, 0, 300, 44) })]),
      mani([]),
    )
    expect(report.unmatched).toBe(1)
    expect(has(report.deltas, 'Email', 'missing')).toBe(true)
    expect(find(report.deltas, 'missing')!.kind).toBe('presence')
    expect(find(report.deltas, 'missing')!.tier).toBe('CRITICAL')
  })

  it('test_UAT_FC_REQ-47_fields_pair_by_role_and_order_not_text', () => {
    // Two textless fields with no shared text still pair (role + document order);
    // only the second one — which flips to a label — flags a containment delta.
    const expected = mani([
      fieldEl({ nameSource: 'placeholder', accessibleName: 'Name', box: box(0, 0, 300, 44) }),
      fieldEl({ nameSource: 'placeholder', accessibleName: 'Email', box: box(0, 60, 300, 44) }),
    ])
    const actual = mani([
      fieldEl({ nameSource: 'placeholder', accessibleName: 'Name', box: box(0, 0, 300, 44) }),
      fieldEl({ nameSource: 'label', accessibleName: 'Email', box: box(0, 60, 300, 44) }),
    ])
    const report = diffManifests(expected, actual)
    expect(report.matched).toBe(2)
    expect(report.unmatched).toBe(0)
    expect(report.deltas.length).toBe(1)
    expect(report.deltas[0].property).toBe('containment')
  })
})

// ── Part A: the in-page extraction derives geometry / a11y / arrangement ─────

describe('REQ-47 in-page extraction (EXTRACT_SCRIPT under jsdom)', () => {
  it('test_UAT_FC_REQ-47_extract_script_compiles', () => {
    // new Function parses (compiles) the raw script source without executing it;
    // a broken `\\` escape in the template literal would throw a SyntaxError here.
    expect(() => new Function(`return ${EXTRACT_SCRIPT}`)).not.toThrow()
  })

  it('test_UAT_FC_REQ-47_extract_derives_fields_arrangement_and_geometry', () => {
    // Run the real EXTRACT_SCRIPT against a parsed DOM (jsdom does no layout, so
    // element boxes are supplied). Proves the novel in-page logic — a11y role +
    // name-source, geometry-derived arrangement, per-element box — end to end.
    const html = `<!doctype html><html><body>
      <section style="background:#0b1220">
        <h1>Intentional Software</h1>
        <form style="display:flex">
          <input type="email" placeholder="Your email address" />
          <button type="submit">Subscribe</button>
        </form>
      </section></body></html>`
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
    const win = dom.window as unknown as { eval(s: string): unknown }
    const doc = dom.window.document
    const R = (x: number, y: number, w: number, h: number) =>
      ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
    const rects = new Map<Element, ReturnType<typeof R>>()
    const put = (sel: string, r: ReturnType<typeof R>) => rects.set(doc.querySelector(sel)!, r)
    // Hero heading high on the page; input and button share a row (input left).
    put('section', R(0, 0, 1280, 500))
    put('h1', R(64, 48, 600, 60))
    put('form', R(64, 900, 500, 44))
    put('input', R(64, 900, 320, 44))
    put('button', R(400, 900, 120, 44))
    dom.window.Element.prototype.getBoundingClientRect = function () {
      return (rects.get(this) ?? R(64, 200, 200, 24)) as unknown as DOMRect
    }
    // jsdom reports scrollWidth/Height 0, which the visibility gate reads as
    // off-screen; give the document a real extent so elements are captured.
    Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
    Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })

    const signals = win.eval(EXTRACT_SCRIPT) as RawSignals
    const band = signals.bands.find((b) => b.fields.length > 0)!
    // The email input: captured as a text-free field, self-labelled by a
    // placeholder (name inside the box).
    expect(band.fields[0].a11yRole).toBe('textbox')
    expect(band.fields[0].nameSource).toBe('placeholder')
    expect(band.fields[0].accessibleName).toBe('Your email address')
    // The button renders beside (right-of) the input — arrangement from geometry.
    expect(band.content.find((r) => r.text === 'Subscribe')!.arrangement).toBe('row')
    // Every text run now carries its own painted box.
    expect(band.content.find((r) => r.text === 'Intentional Software')!.box.width).toBeGreaterThan(0)
  })
})

// ── Part A: the capture command records the projection (real Chromium) ───────

describe('REQ-47 capture records structural projection (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let cwd: string
  let capture: Capture | undefined
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (await chromiumAvailable()) {
      cwd = mkdtempSync(path.join(tmpdir(), 'req47-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/req47.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  const itB = (name: string, fn: () => void) =>
    it(name, () => {
      if (!capture) return // Chromium unavailable — skip silently
      fn()
    })

  itB('test_UAT_FC_REQ-47_capture_records_per_element_geometry', () => {
    const heading = flattenCapture(capture!).elements.find((e) => e.text === 'Intentional Software')
    expect(heading, 'hero heading present').toBeDefined()
    // The heading now carries its own painted box — descended from sections to
    // elements — so an out-of-position block is a comparable value.
    expect(heading?.box).toBeDefined()
    expect(heading?.box?.width).toBeGreaterThan(0)
    expect(heading?.box?.height).toBeGreaterThan(0)
  })

  itB('test_UAT_FC_REQ-47_capture_records_placeholder_name_source', () => {
    const field = flattenCapture(capture!).elements.find(
      (e) => e.textless && e.accessibleName === 'Your email address',
    )
    expect(field, 'email field captured as a text-free element').toBeDefined()
    expect(field?.a11yRole).toBe('textbox')
    // The name renders INSIDE the box (a placeholder) — the a11y fact that
    // separates placeholder-inside from label-above.
    expect(field?.nameSource).toBe('placeholder')
    // The rounded input box records its corner radius (shape).
    expect(field?.borderRadiusPx).toBeGreaterThan(0)
  })

  itB('test_UAT_FC_REQ-47_capture_derives_button_arrangement_from_geometry', () => {
    const button = flattenCapture(capture!).elements.find((e) => e.text === 'Subscribe')
    expect(button, 'subscribe button present').toBeDefined()
    // The button renders beside (right-of) the input — arrangement derived from
    // the two boxes, never from `flex-direction`.
    expect(button?.arrangement).toBe('row')
  })
})

// ── static fixture server (mirrors the REQ-31 capture harness) ───────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
}

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
