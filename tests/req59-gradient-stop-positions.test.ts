import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  diffManifests,
  flattenCapture,
  normalizeGradient,
  type Capture,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-59 — text-fill gradient stop *positions* are a captured,
 * comparable axis. Before REQ-59 `capture` recorded stop colours + angle only,
 * so the gigabytealchemy wordmark delta ("cream holds to 60%" vs "orange too
 * soon") rendered visibly wrong while values-diff reported the gradient clean.
 * These UATs prove: the offsets are parsed from the computed gradient, the diff
 * flags a position-only mismatch that previously passed, and positionless stops
 * never fabricate a delta.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/** A ValueElement with sensible defaults, overridable per field. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements }
}

function hasDelta(deltas: { text: string; property: string }[], textSub: string, property: string): boolean {
  return deltas.some((d) => d.text.includes(textSub) && d.property === property)
}

// ── the parser records offsets ───────────────────────────────────────────────

describe('REQ-59 gradient stop positions — parsing', () => {
  it('test_UAT_FC_REQ-59_normalize_captures_stop_positions', () => {
    // The gigabytealchemy wordmark: cream holds to 60% before turning orange.
    const g = normalizeGradient('linear-gradient(90deg, #f5e6a3 0%, #f5e6a3 60%, #ff8c42 90%, #ff6b35 100%)')
    expect(g?.angleDeg).toBe(90)
    expect(g?.stops).toEqual([
      { color: '#f5e6a3', position: 0 },
      { color: '#f5e6a3', position: 60 },
      { color: '#ff8c42', position: 90 },
      { color: '#ff6b35', position: 100 },
    ])
  })

  it('test_UAT_FC_REQ-59_positionless_stops_record_null', () => {
    // A gradient with no explicit offsets records `position: null` per stop —
    // the offsets are evenly distributed and there is nothing to compare.
    const g = normalizeGradient('linear-gradient(90deg, rgb(246, 196, 83), rgb(217, 140, 48))')
    expect(g?.stops).toEqual([
      { color: '#f6c453', position: null },
      { color: '#d98c30', position: null },
    ])
  })
})

// ── the diff flags a position-only mismatch that used to pass ─────────────────

describe('REQ-59 gradient stop positions — values-diff', () => {
  it('test_UAT_FC_REQ-59_position_only_mismatch_flags', () => {
    // Identical colours AND angle; only the offsets differ (reference cream
    // holds to 60%, actual spreads it evenly so orange starts at ~33%). Before
    // REQ-59 this diffed clean — the exact wordmark blind spot.
    const stops = (a: number, b: number, c: number, d: number) => [
      { color: '#f5e6a3', position: a },
      { color: '#f5e6a3', position: b },
      { color: '#ff8c42', position: c },
      { color: '#ff6b35', position: d },
    ]
    const ref = mani('ref', [el('Wordmark', { gradient: { angleDeg: 90, stops: stops(0, 60, 90, 100) } })])
    const act = mani('a', [el('Wordmark', { gradient: { angleDeg: 90, stops: stops(0, 33, 66, 100) } })])
    expect(hasDelta(diffManifests(ref, act).deltas, 'Wordmark', 'gradient')).toBe(true)
  })

  it('test_UAT_FC_REQ-59_matching_positions_do_not_flag', () => {
    // Same colours, angle, AND offsets (within the ±2% default) → no delta.
    const stops = [
      { color: '#f5e6a3', position: 0 },
      { color: '#f5e6a3', position: 60 },
      { color: '#ff6b35', position: 100 },
    ]
    const ref = mani('ref', [el('Wordmark', { gradient: { angleDeg: 90, stops } })])
    const act = mani('a', [el('Wordmark', { gradient: { angleDeg: 90, stops: stops.map((s) => ({ ...s })) } })])
    expect(hasDelta(diffManifests(ref, act).deltas, 'Wordmark', 'gradient')).toBe(false)
  })

  it('test_UAT_FC_REQ-59_positionless_stops_do_not_false_flag', () => {
    // Positionless stops (older / offset-free capture) compare colour-only and
    // never fabricate a position delta.
    const stops = [
      { color: '#f5e6a3', position: null },
      { color: '#ff6b35', position: null },
    ]
    const ref = mani('ref', [el('Wordmark', { gradient: { angleDeg: 90, stops } })])
    const act = mani('a', [el('Wordmark', { gradient: { angleDeg: 90, stops: stops.map((s) => ({ ...s })) } })])
    expect(hasDelta(diffManifests(ref, act).deltas, 'Wordmark', 'gradient')).toBe(false)
  })
})

// ── the capture reads offsets out of a real DOM ──────────────────────────────

describe('REQ-59 gradient stop positions — real Chromium capture', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'req59-cap-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/gradient-positions.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
  })

  itB('test_UAT_FC_REQ-59_capture_records_positions_from_dom', () => {
    const wm = flattenCapture(capture).elements.find((e) => e.text === 'Gigabyte Alchemy')
    expect(wm, 'wordmark run present').toBeDefined()
    // The offsets are read out of the computed background-image, not dropped.
    expect(wm?.gradient?.stops).toEqual([
      { color: '#f5e6a3', position: 0 },
      { color: '#f5e6a3', position: 60 },
      { color: '#ff8c42', position: 90 },
      { color: '#ff6b35', position: 100 },
    ])
  })
})

// ── local fixture server ─────────────────────────────────────────────────────

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8' }

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
