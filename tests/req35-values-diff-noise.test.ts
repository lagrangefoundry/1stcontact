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
 * UATs for the REQ-35 behaviours that SURVIVE the REQ-53 exact-by-default flip.
 *
 * REQ-35 originally made the measurement axes jitter-tolerant *by default*; that
 * default is superseded by REQ-53 (exact match is the default, `--tolerant` is
 * the opt-out). The tolerance policy itself — jitter caught by default, loose
 * matching only under the explicit opt-out / per-metric override — is asserted in
 * `req53-values-diff-exact.test.ts`.
 *
 * What remains REQ-35's own, and is orthogonal to the tolerance default, lives
 * here: the perceptual OKLab colour-distance metric, and the low-confidence
 * treatment of a reference colour the capture had to *infer* (fallback #000/#fff)
 * — never a hard delta regardless of the tolerance mode, because it is bad
 * reference data, not a real target.
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

// ── the OKLab ΔEOK colour-distance metric (pure, tolerance-independent) ───────

describe('REQ-35 values-diff — perceptual colour distance metric', () => {
  it('test_UAT_FC_REQ-35_color_distance_scale', () => {
    // REQ-48 item 8b: distance is ΔEOK (OKLab), scale 0..~1 not 0..~765.
    expect(colorDistance('#000000', '#000000')).toBe(0)
    expect(colorDistance('#000000', '#ffffff')).toBeGreaterThan(0.9)
    // A single-channel ±1 rounding step is ≈0.0015 ΔEOK — below the JND band a
    // `tolerant` colour pass uses (0.02), though exact-by-default now flags it.
    expect(colorDistance('#808080', '#818080')).toBeLessThan(0.01)
    // The flagship near-neighbour golds are ≈0.105 ΔEOK apart — the reason the
    // tool exists; above even the tolerant band.
    expect(colorDistance('#f5e6a3', '#fbba72')).toBeGreaterThan(0.05)
    // Unparseable input is never silently treated as a match.
    expect(colorDistance('#f5e6a3', 'not-a-colour')).toBe(Infinity)
  })

  it('test_UAT_FC_REQ-35_near_neighbour_gold_still_flagged', () => {
    // Gold-vs-gold must survive every mode — flagged under the exact default…
    const ref = mani('ref', [el('Subhead', { color: '#f5e6a3' })])
    const report = diffManifests(ref, mani('a', [el('Subhead', { color: '#fbba72' })]))
    expect(hasDelta(report.deltas, 'Subhead', 'color')).toBe(true)
    // …and still flagged even under the loose `tolerant` opt-out (0.105 > 0.02).
    const loose = diffManifests(ref, mani('a', [el('Subhead', { color: '#fbba72' })]), { tolerant: true })
    expect(hasDelta(loose.deltas, 'Subhead', 'color')).toBe(true)
  })
})

// ── inferred reference colours do not produce hard deltas (any mode) ──────────

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

// ── AC-1285 — the treatment is a reversible LAYER over an exact capture ───────

describe('AC-1285 — noise treatment is a reversible layer, with an operator dial', () => {
  /**
   * The property that distinguishes "a layer over an exact capture" from "a
   * looser capture": the same bundle, re-reported with the dial moved, yields a
   * different report while both sides' captured values stay byte-identical. Two
   * differences ride the same declared per-axis rule — the REQ-58 rendered-text
   * extent band (`renderedTextBoxToleranceRatio`, default 1.2% of the extent) —
   * one inside it and one well outside.
   */
  const REF_EXTENT = { x: 20, y: 100, width: 400, height: 24 }
  const SUBVISUAL = { x: 20, y: 100, width: 402, height: 24 } // +0.5% — inside the band
  const VISIBLE = { x: 20, y: 160, width: 440, height: 24 } //   +10%  — outside every rule

  function bundle(): { dir: string; actualPath: string } {
    const dir = freshDir()
    writeRefBundle(dir, [
      run('Sub-visual line', { renderedTextBox: { ...REF_EXTENT } }),
      run('Visible line', { renderedTextBox: { ...REF_EXTENT, y: 160 } }),
    ])
    const actualPath = writeActualManifest(dir, [
      el('Sub-visual line', { renderedTextBox: { ...SUBVISUAL } }),
      el('Visible line', { renderedTextBox: { ...VISIBLE } }),
    ])
    return { dir, actualPath }
  }

  /** The exact captured extents on BOTH sides, read back off disk. */
  function capturedExtents(dir: string, actualPath: string) {
    const capture = JSON.parse(readFileSync(path.join(dir, 'capture.json'), 'utf8')) as Capture
    const actual = JSON.parse(readFileSync(actualPath, 'utf8')) as ValueManifest
    const ref = capture.sections[0].content.map((r) => (r as ContentRun).renderedTextBox?.width)
    const act = actual.elements.map((e) => e.renderedTextBox?.width)
    return { ref, act }
  }

  it('test_UAT_AC1285_noise_layer_suppresses_at_report_time_and_is_reversible', async () => {
    const { dir, actualPath } = bundle()
    const before = readFileSync(path.join(dir, 'capture.json'), 'utf8')
    const beforeActual = readFileSync(actualPath, 'utf8')

    // (1) Default treatment: the visible difference is reported; the sub-visual
    //     one is absorbed by a DECLARED per-axis rule, not by a blanket fudge.
    const exact = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actualPath })
    expect(hasDelta(exact.deltas, 'Visible line', 'renderedTextBox')).toBe(true)
    expect(hasDelta(exact.deltas, 'Sub-visual line', 'renderedTextBox')).toBe(false)

    // (2) The SAME bundle, re-reported with that axis's dial widened past 10%:
    //     the previously reported delta is now absorbed. Nothing was re-captured.
    const widened = await cmdValuesDiff({
      refBundleDir: dir,
      actualManifestPath: actualPath,
      diffOptions: { renderedTextBoxToleranceRatio: 0.2 },
    })
    expect(hasDelta(widened.deltas, 'Visible line', 'renderedTextBox')).toBe(false)
    expect(hasDelta(widened.deltas, 'Sub-visual line', 'renderedTextBox')).toBe(false)

    // (3) The capture is untouched by either run — both sides still carry their
    //     exact extents, so the suppression happened at comparison time.
    expect(readFileSync(path.join(dir, 'capture.json'), 'utf8')).toBe(before)
    expect(readFileSync(actualPath, 'utf8')).toBe(beforeActual)
    const { ref, act } = capturedExtents(dir, actualPath)
    expect(ref).toEqual([400, 400])
    expect(act).toEqual([402, 440])

    // (4) Reversible without re-capturing: turn the dial back and the delta
    //     returns from the same stored bundle. A widened run is a decision about
    //     the REPORT, never a loss of captured signal.
    const again = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actualPath })
    expect(hasDelta(again.deltas, 'Visible line', 'renderedTextBox')).toBe(true)
    expect(again.deltas.length).toBe(exact.deltas.length)
  })

  it('test_UAT_AC1285_a_difference_outside_every_rule_survives_the_treatment', async () => {
    // The other half of the claim: only a difference a declared rule covers is
    // neutralised. A 10% extent gap is outside the default band AND outside the
    // loose `--tolerant` band (3%), so it survives the widest blanket treatment
    // the operator can ask for — a surviving delta is one the render shows.
    const { dir, actualPath } = bundle()
    const tolerant = await cmdValuesDiff({
      refBundleDir: dir,
      actualManifestPath: actualPath,
      diffOptions: { tolerant: true },
    })
    expect(hasDelta(tolerant.deltas, 'Visible line', 'renderedTextBox')).toBe(true)
    // …while the sub-visual one stays absorbed under the same run.
    expect(hasDelta(tolerant.deltas, 'Sub-visual line', 'renderedTextBox')).toBe(false)
  })
})

// ── source fix: the capture emits colorInferred for unresolvable colours ──────

describe('REQ-35 capture flags inferred colours (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let cwd: string
  let capture: Capture

  beforeAll(async () => {
    // Probe the browser before binding a socket — a serveDir-first hook hard-fails
    // rather than skipping where 127.0.0.1 cannot be bound, taking the file down.
    if (browserOk) {
      server = await serveDir(FIXTURES)
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
