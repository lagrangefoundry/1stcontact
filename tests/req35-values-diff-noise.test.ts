import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  cmdValuesDiff,
  colorDistance,
  diffManifests,
  flattenCapture,
  type Capture,
  type ContentRun,
  type Section,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-35 — values-diff noise reduction. The values-diff (REQ-31)
 * mechanically flags every field-level delta, but on a real re-import ~84 of the
 * deltas were *noise*: sub-step typography jitter (line-height rounds by font
 * metric, weights snap to the nearest loaded face, ±1px size clamp) and bad
 * reference data (a colour the capture had to infer as #000/#fff). These UATs
 * prove the jitter is suppressed by default, that a genuine off-by-one-step
 * error still flags, that `--strict` restores exact matching, and that an
 * inferred reference colour never produces a hard delta — while the flagship
 * near-neighbour colour precision (gold-vs-gold) is preserved.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'req35-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders (mirror req31) ──────────────────────────────────────────

function run(text: string, over: Partial<ContentRun> = {}): ContentRun {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [] }
}

/** Wrap content runs in a single-section Capture and write its bundle. */
function writeRefBundle(dir: string, content: ContentRun[]): string {
  const section: Section = {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: { kind: 'color', color: '#ffffff' },
    layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null, contentAnchorRatio: null },
    content,
    items: [],
  }
  const capture: Capture = {
    url: 'https://ref.example/',
    host: 'ref.example',
    path: '/',
    capturedAt: '2026-07-03T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [section],
    assets: [],
  }
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  return dir
}

function writeActualManifest(dir: string, elements: ValueElement[]): string {
  const p = path.join(dir, 'actual.json')
  writeFileSync(p, JSON.stringify({ source: 'draft:test', elements } satisfies ValueManifest, null, 2))
  return p
}

const hasDelta = (deltas: { text: string; property: string }[], textSub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(textSub) && d.property === property)

// ── sub-step typography jitter is suppressed by default ──────────────────────

describe('REQ-35 values-diff — typography jitter suppressed by default', () => {
  it('test_UAT_FC_REQ-35_font_size_1px_jitter_not_flagged', () => {
    // ±1px viewport-clamp rounding is noise; a 2px+ step is a real delta.
    const ref = mani('ref', [el('Body', { fontSizePx: 24 })])
    expect(diffManifests(ref, mani('a', [el('Body', { fontSizePx: 25 })])).deltas).toEqual([])
    expect(hasDelta(diffManifests(ref, mani('a', [el('Body', { fontSizePx: 27 })])).deltas, 'Body', 'fontSizePx')).toBe(true)
  })

  it('test_UAT_FC_REQ-35_line_height_metric_jitter_not_flagged', () => {
    // Line-height rounds by font metric; a small drift on a 28px line-height is
    // noise, a large one is a real delta. Tolerance scales with the value.
    const ref = mani('ref', [el('Body', { lineHeightPx: 28 })])
    expect(diffManifests(ref, mani('a', [el('Body', { lineHeightPx: 30 })])).deltas).toEqual([])
    expect(hasDelta(diffManifests(ref, mani('a', [el('Body', { lineHeightPx: 40 })])).deltas, 'Body', 'lineHeightPx')).toBe(true)
  })

  it('test_UAT_FC_REQ-35_line_height_tolerance_is_proportional', () => {
    // The same 3px drift is noise on a 40px heading line-height (7.5%) but a
    // real delta on a 14px caption line-height (21%) — an absolute px tolerance
    // could not tell them apart.
    const heading = diffManifests(mani('ref', [el('H', { lineHeightPx: 40 })]), mani('a', [el('H', { lineHeightPx: 43 })]))
    expect(heading.deltas).toEqual([])
    const caption = diffManifests(mani('ref', [el('C', { lineHeightPx: 14 })]), mani('a', [el('C', { lineHeightPx: 17 })]))
    expect(hasDelta(caption.deltas, 'C', 'lineHeightPx')).toBe(true)
  })

  it('test_UAT_FC_REQ-35_letter_spacing_subpixel_jitter_not_flagged', () => {
    const ref = mani('ref', [el('Body', { letterSpacingPx: 0.5 })])
    expect(diffManifests(ref, mani('a', [el('Body', { letterSpacingPx: 0.8 })])).deltas).toEqual([])
    expect(hasDelta(diffManifests(ref, mani('a', [el('Body', { letterSpacingPx: 2 })])).deltas, 'Body', 'letterSpacingPx')).toBe(true)
  })

  it('test_UAT_FC_REQ-35_nearest_loaded_weight_not_flagged', () => {
    // A single-step weight snap (400↔500, the nearest loaded face) is noise; a
    // two-step gap (400↔600) is a real weight choice.
    const ref = mani('ref', [el('Body', { fontWeight: 400 })])
    expect(diffManifests(ref, mani('a', [el('Body', { fontWeight: 500 })])).deltas).toEqual([])
    expect(hasDelta(diffManifests(ref, mani('a', [el('Body', { fontWeight: 600 })])).deltas, 'Body', 'fontWeight')).toBe(true)
  })
})

// ── --strict restores exact matching (the opt-out) ───────────────────────────

describe('REQ-35 values-diff — strict mode restores exact matching', () => {
  it('test_UAT_FC_REQ-35_strict_surfaces_suppressed_jitter', () => {
    const ref = mani('ref', [el('Body', { fontSizePx: 24, lineHeightPx: 28, fontWeight: 400 })])
    const actual = mani('a', [el('Body', { fontSizePx: 25, lineHeightPx: 30, fontWeight: 500 })])
    // Default: all three are within tolerance → clean.
    expect(diffManifests(ref, actual).deltas).toEqual([])
    // Strict: every jitter tolerance collapses to exact → all three flagged.
    const strict = diffManifests(ref, actual, { strict: true })
    expect(hasDelta(strict.deltas, 'Body', 'fontSizePx')).toBe(true)
    expect(hasDelta(strict.deltas, 'Body', 'lineHeightPx')).toBe(true)
    expect(hasDelta(strict.deltas, 'Body', 'fontWeight')).toBe(true)
  })

  it('test_UAT_FC_REQ-35_per_metric_override_widens_one_tolerance', () => {
    // A caller can loosen a single metric without touching the others.
    const ref = mani('ref', [el('Body', { fontSizePx: 24 })])
    const actual = mani('a', [el('Body', { fontSizePx: 27 })]) // Δ3
    expect(hasDelta(diffManifests(ref, actual).deltas, 'Body', 'fontSizePx')).toBe(true)
    expect(diffManifests(ref, actual, { fontSizeTolerancePx: 4 }).deltas).toEqual([])
  })
})

// ── colour precision preserved: ΔE kills rounding, not near-neighbours ────────

describe('REQ-35 values-diff — perceptual colour tolerance', () => {
  it('test_UAT_FC_REQ-35_color_distance_scale', () => {
    expect(colorDistance('#000000', '#000000')).toBe(0)
    expect(colorDistance('#000000', '#ffffff')).toBeGreaterThan(700)
    // A single-channel ±1 rounding step is perceptually ~1.6 — sub-threshold.
    expect(colorDistance('#808080', '#818080')).toBeLessThan(3)
    // The flagship near-neighbour golds are ~113 apart — far above any tolerance.
    expect(colorDistance('#f5e6a3', '#fbba72')).toBeGreaterThan(50)
    // Unparseable input is never silently treated as a match.
    expect(colorDistance('#f5e6a3', 'not-a-colour')).toBe(Infinity)
  })

  it('test_UAT_FC_REQ-35_imperceptible_rounding_not_flagged', () => {
    const ref = mani('ref', [el('Body', { color: '#808080' })])
    expect(diffManifests(ref, mani('a', [el('Body', { color: '#818080' })])).deltas).toEqual([])
  })

  it('test_UAT_FC_REQ-35_near_neighbour_gold_still_flagged', () => {
    // The whole reason the tool exists — gold-vs-gold must survive the tolerance.
    const ref = mani('ref', [el('Subhead', { color: '#f5e6a3' })])
    const report = diffManifests(ref, mani('a', [el('Subhead', { color: '#fbba72' })]))
    expect(hasDelta(report.deltas, 'Subhead', 'color')).toBe(true)
  })
})

// ── inferred reference colours do not produce hard deltas ────────────────────

describe('REQ-35 values-diff — inferred reference colour is low-confidence', () => {
  it('test_UAT_FC_REQ-35_inferred_reference_colour_skipped', async () => {
    // The capture mislabelled a dark footer's text as #000000 (fallback). Our
    // faithful repro renders it light — a colour delta that would never clear.
    // Marked inferred, it is not a hard delta.
    const dir = freshDir()
    writeRefBundle(dir, [run('© Footer', { color: '#000000', colorInferred: true })])
    const actualPath = writeActualManifest(dir, [el('© Footer', { color: '#e2e8f0' })])
    const report = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actualPath })
    expect(report.matched).toBe(1)
    expect(hasDelta(report.deltas, '© Footer', 'color')).toBe(false)
  })

  it('test_UAT_FC_REQ-35_confident_reference_colour_still_flagged', () => {
    // Control: the identical mismatch on a *confident* reference colour is a
    // real delta — the suppression is scoped to inferred values only.
    const ref = mani('ref', [el('© Footer', { color: '#000000' })])
    const report = diffManifests(ref, mani('a', [el('© Footer', { color: '#e2e8f0' })]))
    expect(hasDelta(report.deltas, '© Footer', 'color')).toBe(true)
  })
})

// ── source fix: the capture emits colorInferred for unresolvable colours ──────

describe('REQ-35 capture flags inferred colours (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let cwd: string
  let capture: Capture

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      cwd = mkdtempSync(path.join(tmpdir(), 'req35-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/req35-inferred.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
  })

  itB('test_UAT_FC_REQ-35_transparent_colour_flagged_inferred', () => {
    const els = flattenCapture(capture).elements
    const ghost = els.find((e) => e.text.includes('Transparent inferred'))
    const solid = els.find((e) => e.text.includes('Solid confident'))
    expect(ghost, 'ghost run present').toBeDefined()
    expect(solid, 'solid run present').toBeDefined()
    // The transparent-colour run is flagged low-confidence; the solid one is not.
    expect(ghost?.colorInferred).toBe(true)
    expect(solid?.colorInferred).toBeFalsy()
  })
})

// ── local fixture server (mirrors capture.test.ts / req31) ───────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
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
