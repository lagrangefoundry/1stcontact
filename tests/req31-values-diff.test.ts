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
  diffManifests,
  flattenCapture,
  normalizeGradient,
  type Capture,
  type ContentRun,
  type Section,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-31 — the fidelity verification loop's mechanical half
 * ([[DOC-13]] §6). The diff UATs drive the real `cmdValuesDiff` command entry
 * point with a written capture bundle (expected) and a written actual manifest
 * (no browser) — proving the six gigabytealchemy value-deltas are mechanically
 * flagged. The capture UAT drives a REAL headless Chromium against a served
 * fixture, proving the gradient + left-bar values are read out of the DOM (the
 * Part-1 extension that made the deltas representable at all).
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'req31-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders ─────────────────────────────────────────────────────────

/** A ContentRun with sensible defaults, overridable per field. */
function run(text: string, over: Partial<ContentRun> = {}): ContentRun {
  return {
    role: 'body',
    text,
    color: '#000000',
    fontFamily: 'sans',
    fontSizePx: 18,
    fontWeight: 400,
    ...over,
  }
}

/** A ValueElement with the same defaults (the actual side). */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    role: 'body',
    text,
    color: '#000000',
    fontFamily: 'sans',
    fontSizePx: 18,
    fontWeight: 400,
    ...over,
  }
}

/** Wrap content runs in a single-section Capture and write its bundle. */
function writeRefBundle(dir: string, content: ContentRun[], items: ContentRun[][] = []): string {
  const section: Section = {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: { kind: 'color', color: '#ffffff' },
    layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null },
    content,
    items: items.map((c) => ({ content: c })),
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
  const manifest: ValueManifest = { source: 'draft:test', elements }
  const p = path.join(dir, 'actual.json')
  writeFileSync(p, JSON.stringify(manifest, null, 2))
  return p
}

// The six known gigabytealchemy value-deltas, as (correct reference | buggy repro).
const GOLD = { angleDeg: 90 as number | null, stops: ['#f6c453', '#d98c30'] }
const EMERALD = { widthPx: 4, color: '#34d399' }
const AMBER = { widthPx: 4, color: '#f59e0b' }

const REF_RUNS: ContentRun[] = [
  run('Gigabyte Alchemy', { role: 'heading', fontSizePx: 72, fontWeight: 600, gradient: GOLD }),
  run('Tools for clarity, presence, and positive connection', { color: '#f5e6a3', fontSizePx: 24 }),
  run('© Gigabyte Alchemy', { color: '#94a3b8', fontSizePx: 14 }),
]
const REF_ITEMS: ContentRun[][] = [
  [run('Callout one', { borderLeft: EMERALD, paddingLeftPx: 24 })],
  [run('Callout two', { borderLeft: AMBER, paddingLeftPx: 24 })],
]

/** The buggy reproduction: white subhead, shrunken vertical-gradient wordmark,
 *  missing left-bars, cream footer — every delta the eye missed. */
const BUGGY_ACTUAL: ValueElement[] = [
  el('Gigabyte Alchemy', { role: 'heading', fontSizePx: 48, fontWeight: 600, gradient: { angleDeg: 180, stops: ['#f6c453', '#d98c30'] } }),
  el('Tools for clarity, presence, and positive connection', { color: '#ffffff', fontSizePx: 24 }),
  el('© Gigabyte Alchemy', { color: '#e8dfd3', fontSizePx: 14 }),
  el('Callout one', { borderLeft: null, paddingLeftPx: 24 }),
  el('Callout two', { borderLeft: null, paddingLeftPx: 24 }),
]

/** A faithful reproduction: every value matches the reference. */
const FAITHFUL_ACTUAL: ValueElement[] = [
  el('Gigabyte Alchemy', { role: 'heading', fontSizePx: 72, fontWeight: 600, gradient: { ...GOLD } }),
  el('Tools for clarity, presence, and positive connection', { color: '#f5e6a3', fontSizePx: 24 }),
  el('© Gigabyte Alchemy', { color: '#94a3b8', fontSizePx: 14 }),
  el('Callout one', { borderLeft: { ...EMERALD }, paddingLeftPx: 24 }),
  el('Callout two', { borderLeft: { ...AMBER }, paddingLeftPx: 24 }),
]

/** Does the report carry a delta for this element text + property? */
function hasDelta(deltas: { text: string; property: string }[], textSub: string, property: string): boolean {
  return deltas.some((d) => d.text.includes(textSub) && d.property === property)
}

// ── the anti-recurrence AC: all six deltas flagged ───────────────────────────

describe('REQ-31 values-diff — flags all known value-deltas', () => {
  it('test_UAT_FC_REQ-31_flags_all_six_known_deltas', async () => {
    const dir = freshDir()
    writeRefBundle(dir, REF_RUNS, REF_ITEMS)
    const actualPath = writeActualManifest(dir, BUGGY_ACTUAL)

    const report = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actualPath })

    // Every one of the six flagged, each by its element + property.
    expect(hasDelta(report.deltas, 'Tools for clarity', 'color')).toBe(true) // 1 subhead gold→white
    expect(hasDelta(report.deltas, 'Gigabyte Alchemy', 'fontSizePx')).toBe(true) // 2 wordmark 72→48
    expect(hasDelta(report.deltas, 'Gigabyte Alchemy', 'gradient')).toBe(true) // 3 wordmark 90°→180°
    expect(hasDelta(report.deltas, 'Callout one', 'borderLeft')).toBe(true) // 4 emerald bar dropped
    expect(hasDelta(report.deltas, 'Callout two', 'borderLeft')).toBe(true) // 5 amber bar dropped
    expect(hasDelta(report.deltas, '© Gigabyte Alchemy', 'color')).toBe(true) // 6 footer slate→cream
    expect(report.matched).toBe(5)
  })

  it('test_UAT_FC_REQ-31_faithful_reproduction_has_no_deltas', async () => {
    const dir = freshDir()
    writeRefBundle(dir, REF_RUNS, REF_ITEMS)
    const actualPath = writeActualManifest(dir, FAITHFUL_ACTUAL)

    const report = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actualPath })
    expect(report.deltas).toEqual([])
    expect(report.matched).toBe(5)
    expect(report.unmatched).toBe(0)
  })
})

// ── near-neighbour colours must not collapse ─────────────────────────────────

describe('REQ-31 values-diff — colour precision', () => {
  it('test_UAT_FC_REQ-31_near_neighbour_colours_diff', () => {
    // #f5e6a3 (subhead gold) vs #fbba72 (heading gold) — both read "gold" by eye.
    const expected: ValueManifest = { source: 'ref', elements: [el('Subhead', { color: '#f5e6a3' })] }
    const actual: ValueManifest = { source: 'draft', elements: [el('Subhead', { color: '#fbba72' })] }
    const report = diffManifests(expected, actual)
    expect(hasDelta(report.deltas, 'Subhead', 'color')).toBe(true)
  })

  it('test_UAT_FC_REQ-31_case_insensitive_colour_matches', () => {
    const expected: ValueManifest = { source: 'ref', elements: [el('X', { color: '#F5E6A3' })] }
    const actual: ValueManifest = { source: 'draft', elements: [el('X', { color: '#f5e6a3' })] }
    expect(diffManifests(expected, actual).deltas).toEqual([])
  })
})

// ── ranking + alignment ──────────────────────────────────────────────────────

describe('REQ-31 values-diff — ranking and alignment', () => {
  it('test_UAT_FC_REQ-31_deltas_ranked_most_severe_first', () => {
    const expected: ValueManifest = {
      source: 'ref',
      elements: [
        el('A', { letterSpacingPx: 0 }), // low-severity delta
        el('B', { color: '#000000' }), // high-severity delta
      ],
    }
    const actual: ValueManifest = {
      source: 'draft',
      elements: [el('A', { letterSpacingPx: 3 }), el('B', { color: '#ffffff' })],
    }
    const report = diffManifests(expected, actual)
    expect(report.deltas.length).toBe(2)
    // Colour (severity 90) sorts ahead of letter-spacing (severity 20).
    expect(report.deltas[0].property).toBe('color')
    expect(report.deltas[1].property).toBe('letterSpacingPx')
  })

  it('test_UAT_FC_REQ-31_missing_element_flagged', () => {
    const expected: ValueManifest = { source: 'ref', elements: [el('Present'), el('Gone')] }
    const actual: ValueManifest = { source: 'draft', elements: [el('Present')] }
    const report = diffManifests(expected, actual)
    expect(report.unmatched).toBe(1)
    expect(hasDelta(report.deltas, 'Gone', 'missing')).toBe(true)
  })

  it('test_UAT_FC_REQ-31_repeated_text_pairs_in_document_order', () => {
    const expected: ValueManifest = {
      source: 'ref',
      elements: [el('Learn more', { color: '#111111' }), el('Learn more', { color: '#222222' })],
    }
    const actual: ValueManifest = {
      source: 'draft',
      elements: [el('Learn more', { color: '#111111' }), el('Learn more', { color: '#999999' })],
    }
    const report = diffManifests(expected, actual)
    // First occurrence matches; only the second disagrees.
    expect(report.deltas.length).toBe(1)
    expect(report.deltas[0].actual).toBe('#999999')
  })
})

// ── gradient normalization ───────────────────────────────────────────────────

describe('REQ-31 gradient normalization', () => {
  it('test_UAT_FC_REQ-31_normalize_gradient_direction_and_stops', () => {
    const horiz = normalizeGradient('linear-gradient(90deg, rgb(246, 196, 83), rgb(217, 140, 48))')
    expect(horiz?.angleDeg).toBe(90)
    expect(horiz?.stops).toEqual(['#f6c453', '#d98c30'])
    // `to right` is the keyword form of 90deg.
    expect(normalizeGradient('linear-gradient(to right, #fff, #000)')?.angleDeg).toBe(90)
    // A bare colour-first gradient defaults to `to bottom` (180deg).
    expect(normalizeGradient('linear-gradient(#fff, #000)')?.angleDeg).toBe(180)
    // Non-gradients yield null.
    expect(normalizeGradient('none')).toBeNull()
  })

  it('test_UAT_FC_REQ-31_gradient_direction_delta_only', () => {
    // Same stops, different direction → a gradient delta (the wordmark bug).
    const expected: ValueManifest = {
      source: 'ref',
      elements: [el('WM', { gradient: { angleDeg: 90, stops: ['#f6c453', '#d98c30'] } })],
    }
    const actual: ValueManifest = {
      source: 'draft',
      elements: [el('WM', { gradient: { angleDeg: 180, stops: ['#f6c453', '#d98c30'] } })],
    }
    expect(hasDelta(diffManifests(expected, actual).deltas, 'WM', 'gradient')).toBe(true)
  })
})

// ── Part 1: the capture actually records these values from the DOM ───────────

describe('REQ-31 capture records per-element values (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let cwd: string
  let capture: Capture

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      cwd = mkdtempSync(path.join(tmpdir(), 'req31-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/values.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
  })

  itB('test_UAT_FC_REQ-31_capture_records_gradient_direction', () => {
    const manifest = flattenCapture(capture)
    const wm = manifest.elements.find((e) => e.text === 'Gigabyte Alchemy')
    expect(wm, 'wordmark run present').toBeDefined()
    // The horizontal 90deg text-fill gradient is read out of the DOM, not lost.
    expect(wm?.gradient?.angleDeg).toBe(90)
    expect(wm?.gradient?.stops).toEqual(['#f6c453', '#d98c30'])
  })

  itB('test_UAT_FC_REQ-31_capture_records_left_bar_treatment', () => {
    const manifest = flattenCapture(capture)
    const callout = manifest.elements.find((e) => e.text.includes('emerald left bar'))
    expect(callout, 'callout run present').toBeDefined()
    expect(callout?.borderLeft?.widthPx).toBe(4)
    expect(callout?.borderLeft?.color).toBe('#34d399')
  })

  itB('test_UAT_FC_REQ-31_capture_json_persists_value_fields', () => {
    // The values live in capture.json — the single structured artifact the diff
    // and a human both read — not just in the in-memory object.
    const raw = JSON.parse(readFileSync(path.join(cwd, 'storage', 'references', '127.0.0.1', 'values.html', 'capture.json'), 'utf8')) as Capture
    const runs = raw.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])
    const wm = runs.find((r) => r.text === 'Gigabyte Alchemy')
    expect(wm?.gradient?.angleDeg).toBe(90)
    expect(wm?.fontSizePx).toBe(72)
  })
})

// ── local fixture server (mirrors capture.test.ts) ───────────────────────────

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
