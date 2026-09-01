import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdGate,
  formatGateReport,
  referenceCoverage,
  writeMultiState,
  writeRasterPng,
  type Capture,
  type CaptureAsset,
  type ContentRun,
  type MultiStateCapture,
  type Raster,
  type Section,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

/**
 * UATs for REQ-94 — cross-gate reconciliation (`1c gate`).
 *
 * The defect: `joyfulculinarycreations.com` reproduced 80% wrong by pixel count
 * and PASSED, because the two gates that read structure are each blind to what
 * broke — `l1-gate` grades geometry only (by design), and `values-diff` can only
 * compare elements present in BOTH manifests, so a capture that missed the
 * page's imagery leaves it nothing to raise a delta against. Only the perceptual
 * eye saw it, and nothing compared the three to each other.
 *
 * Every UAT here drives the real `1c gate` entry point through the same offline
 * seams `diff` (`--actual-image`) and `values-diff` (`--actual-manifest`) already
 * expose, so the reconciliation is exercised end-to-end with no headless browser
 * and no mocking of anything we own.
 */

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `req94-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders ─────────────────────────────────────────────────────────

function el(text: string, box: ValueElement['box']): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box,
  }
}

/**
 * A ladder oracle the 3-probe gate passes cleanly: one run per width, nothing
 * below it to overrun under content perturbation. `bottomPx` places that run so
 * the reference page's implied height (and therefore its px-per-section density)
 * is under the fixture's control.
 */
function cleanOracle(sections: ValueManifest['sections'], bottomPx = 148): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections,
      elements: [el('Front door heading', { x: 20, y: bottomPx - 48, width: width - 40, height: 48 })],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

function section(content: ContentRun[]): Section {
  return {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: { kind: 'color', color: '#ffffff' },
    layout: {
      textOverImage: false,
      contentAlign: 'left',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio: null,
    },
    content,
    items: [],
    fields: [],
  }
}

function imageAsset(n: number): CaptureAsset {
  return {
    id: `img-${n}`,
    kind: 'image',
    src: `https://fixture.test/media/${n}.jpg`,
    localPath: `assets/${n}.jpg`,
  }
}

interface BundleSpec {
  /** Mirrored image assets the capture kept bytes for. */
  images: number
  /** Reference content runs — each one the value gate can raise a delta against. */
  content: ContentRun[]
  /** Sections the capture segmented the reference manifest into. */
  sections: ValueManifest['sections']
  /** Implied reference page height (drives the px-per-section proxy). */
  pageBottomPx?: number
}

/** Write a capture bundle: `capture.json` + `multistate.json` + a black reference shot. */
async function writeBundle(spec: BundleSpec): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-07-25T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [section(spec.content)],
    assets: Array.from({ length: spec.images }, (_, i) => imageAsset(i)),
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  await writeMultiState(fsReferenceBundle(dir), cleanOracle(spec.sections, spec.pageBottomPx ?? 148))
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

/** A uniform grey raster — the two eyes' pixel input. */
function flat(w: number, h: number, value: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(value)
  return { data, width: w, height: h, channels: 3 }
}

/** Our reproduction's screenshot, `value` away from the all-black reference. */
async function actualShot(value: number): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(flat(64, 64, value), file)
  return file
}

/** Our reproduction's value manifest. */
function actualManifest(elements: ValueElement[] = []): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  const manifest: ValueManifest = { source: 'draft:fixture', elements, sections: [] }
  writeFileSync(file, JSON.stringify(manifest))
  return file
}

/** One reference run the reproduction can either carry or drop. */
const HEADING: ContentRun = {
  role: 'heading',
  text: 'Front door heading',
  color: '#111827',
  fontFamily: 'Inter',
  fontSizePx: 40,
  fontWeight: 600,
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('REQ-94 — a failing perceptual eye is not outvoted by clean value gates', () => {
  it('test_UAT_FC_REQ-94_capture_incomplete_when_reference_is_impoverished', async () => {
    // The joyful shape: the capture mirrored imagery it never attributed to any
    // element, so the value gates have nothing to compare — while the perceptual
    // eye reads the page as wholly wrong. The gate must FAIL and must say the
    // defect is in the CAPTURE, not the reproduction.
    const ref = await writeBundle({ images: 3, content: [], sections: [] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.pass).toBe(false)
    expect(report.verdict).toBe('capture-incomplete')
    expect(report.perceptualBreach).toBe(true)
    expect(report.l1Pass).toBe(true)
    expect(report.values.deltas).toBe(0)
    // The coverage numbers that made the call: 0 of 3 mirrored images attributed.
    expect(report.coverage.mirroredImages).toBe(3)
    expect(report.coverage.referencedImages).toBe(0)
    expect(report.coverage.findings.map((f) => f.kind)).toContain('unreferenced-image')

    // The operator read must name the disagreement AND point at coverage.
    const text = formatGateReport(report, ref)
    expect(text).toContain('capture-incomplete')
    expect(text).toMatch(/mirrored image asset/)
    expect(text).toMatch(/CAPTURE defect, not a reproduction defect/)
  })

  it('test_UAT_FC_REQ-94_faithful_reproduction_passes_despite_value_deltas', async () => {
    // The gigabytealchemy shape: text-led, perceptually indistinguishable, and
    // the sharp instrument (values-diff) still has deltas to work. This must keep
    // passing — the new gate exists to catch what the value gates MISS, not to
    // duplicate a gate that already exits non-zero on every delta.
    const ref = await writeBundle({ images: 0, content: [HEADING], sections: [] })
    const report = await cmdGate({
      ref,
      // 4/255 everywhere: mean 4 (under the floor), and below the 32 per-pixel
      // threshold so no pixel counts as "over".
      actualImagePath: await actualShot(4),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.perceptualBreach).toBe(false)
    expect(report.verdict).toBe('pass')
    expect(report.pass).toBe(true)
    // …and the deltas are still reported, with the values-diff named as their home.
    expect(report.values.deltas).toBeGreaterThan(0)
    expect(report.nextStep).toMatch(/values-diff/)
  })

  it('test_UAT_FC_REQ-94_reproduction_wrong_when_coverage_is_clean', async () => {
    // Coverage clean → the reference is trustworthy, so a breaching perceptual eye
    // plus value deltas is OUR defect, and the values-diff already names it.
    const ref = await writeBundle({ images: 0, content: [HEADING], sections: [] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.pass).toBe(false)
    expect(report.verdict).toBe('reproduction-wrong')
    expect(report.coverage.findings).toHaveLength(0)
    expect(report.values.deltas).toBeGreaterThan(0)
    expect(formatGateReport(report, ref)).toMatch(/the defect is ours/)
  })

  it('test_UAT_FC_REQ-94_unexplained_disagreement_names_a_framework_gap', async () => {
    // Nothing but pixels sees the difference: structural gate green, coverage
    // clean, zero value deltas. That is a pixel-moving axis the value manifest
    // does not carry — a framework gap, and it must be labelled as one rather
    // than blamed on the capture or the reproduction.
    const ref = await writeBundle({ images: 0, content: [], sections: [] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.pass).toBe(false)
    expect(report.verdict).toBe('unexplained-disagreement')
    expect(report.values.deltas).toBe(0)
    expect(report.coverage.findings).toHaveLength(0)
    expect(formatGateReport(report, ref)).toMatch(/FRAMEWORK gap/)
  })
})

describe('REQ-94 — reference coverage reports numbers the pipeline already had', () => {
  it('test_UAT_FC_REQ-94_coverage_reports_mirrored_vs_referenced_images', async () => {
    // Two of three mirrored images are attributed to elements; the third is bytes
    // the capture kept and never placed on the page.
    const dir = freshDir('bundle')
    mkdirSync(path.join(dir, 'assets'), { recursive: true })
    const capture: Capture = {
      url: 'http://fixture.test/',
      host: 'fixture.test',
      path: '/',
      capturedAt: '2026-07-25T00:00:00.000Z',
      viewport: { width: 1280, height: 800 },
      theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
      sections: [section([])],
      assets: [imageAsset(0), imageAsset(1), imageAsset(2)],
    }
    writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
    const oracle = cleanOracle([])
    for (const p of oracle.projections) {
      p.manifest.elements.push(
        { ...el('', { x: 0, y: 0, width: 100, height: 100 }), src: imageAsset(0).src },
        { ...el('', { x: 0, y: 120, width: 100, height: 100 }), src: imageAsset(1).src },
      )
    }
    await writeMultiState(fsReferenceBundle(dir), oracle)

    const coverage = await referenceCoverage(fsReferenceBundle(dir))
    expect(coverage.mirroredImages).toBe(3)
    expect(coverage.referencedImages).toBe(2)
    expect(coverage.unreferencedImages).toEqual(['assets/2.jpg'])
    expect(coverage.findings.map((f) => f.kind)).toContain('unreferenced-image')
  })

  it('test_UAT_FC_REQ-94_coverage_flags_under_segmentation_by_page_density', async () => {
    // A ~4800px page recorded as two style-scope bands is the joyful signature.
    // A short page over the same two bands is not flagged — density, not count.
    const sparse = await writeBundle({
      images: 0,
      content: [],
      sections: [{ scrim: null, contentAnchorRatio: null }, { scrim: null, contentAnchorRatio: null }],
      pageBottomPx: 4900,
    })
    const sparseCoverage = await referenceCoverage(fsReferenceBundle(sparse))
    expect(sparseCoverage.sections).toBe(2)
    expect(sparseCoverage.pageHeightPx).toBe(4900)
    expect(sparseCoverage.pxPerSection).toBe(2450)
    expect(sparseCoverage.findings.map((f) => f.kind)).toContain('section-density')

    const dense = await writeBundle({
      images: 0,
      content: [],
      sections: [{ scrim: null, contentAnchorRatio: null }, { scrim: null, contentAnchorRatio: null }],
      pageBottomPx: 1200,
    })
    expect((await referenceCoverage(fsReferenceBundle(dense))).findings).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-94_coverage_refuses_a_bundle_with_no_reference_manifest', async () => {
    // Coverage measured against a manifest that does not exist would be a
    // fabricated clean bill — the one outcome this ticket exists to prevent.
    const dir = freshDir('stale')
    await expect(referenceCoverage(fsReferenceBundle(dir))).rejects.toThrow(/multistate\.json/)
  })
})

describe('REQ-94 — the perceptual floor is explicit and overridable', () => {
  it('test_UAT_FC_REQ-94_floor_is_reported_and_can_be_tightened', async () => {
    const ref = await writeBundle({ images: 0, content: [], sections: [] })
    const shot = await actualShot(4)
    const manifest = actualManifest()

    const dflt = await cmdGate({ ref, actualImagePath: shot, actualManifestPath: manifest, out: freshDir('out') })
    expect(dflt.floor).toEqual({ mean: 8, pct: 25 })
    expect(dflt.pass).toBe(true)

    // The floor is provisional (DOC-21 §4 wants it calibrated), so it must be a
    // per-run dial rather than a constant baked into the verdict.
    const tight = await cmdGate({
      ref,
      actualImagePath: shot,
      actualManifestPath: manifest,
      out: freshDir('out'),
      floor: { mean: 1 },
    })
    expect(tight.floor).toEqual({ mean: 1, pct: 25 })
    expect(tight.pass).toBe(false)
    expect(tight.verdict).toBe('unexplained-disagreement')
  })
})
