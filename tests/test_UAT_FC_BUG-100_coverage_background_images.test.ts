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
  type SectionValues,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'
import { CAPTURE_SCHEMA } from '../tools/generate/src/cli/capture'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

/**
 * UATs for BUG-100 — reference coverage counts section background images as
 * unreferenced.
 *
 * The defect: `referenceCoverage` built its `referenced` set from
 * `manifest.elements[].src` alone, which is the one field a background image
 * structurally cannot reach — BUG-13 records a band's imagery on
 * `SectionValues.backgroundImageUrl` and BUG-27 records a nested backdrop box on
 * `ValueElement.backgroundImageUrl`, both explicitly "distinct from `src`". On
 * `gigabytealchemy.ai` — the bundle `gate-core.ts`'s own perceptual floor is
 * calibrated against, and a page with no `<img>` element anywhere — the set was
 * EMPTY, so the hero the capture recorded, the fold folded and the render paints
 * was reported as an asset "the capture kept the bytes but never attributed".
 *
 * It is not a cosmetic line. `reconcileGates` tests `coverage.findings.length`
 * BEFORE the value-delta count, so under a breaching perceptual eye one false
 * `unreferenced-image` converts `reproduction-wrong` into `capture-incomplete` —
 * which tells a loop-1 round the reference is impoverished and to stop.
 *
 * These drive the real `referenceCoverage` and the real `1c gate` entry point
 * through the same offline seams REQ-94's suite uses: no headless browser, and
 * nothing we own mocked.
 */

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug100-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders ─────────────────────────────────────────────────────────

/** The hero asset: absolute origin URL on the reference side, mirrored locally. */
const HERO_URL = 'https://fixture.test/images/AlchemistLabWithTech.png'
const HERO_LOCAL = 'assets/AlchemistLabWithTech.png'

function imageAsset(src: string, localPath: string): CaptureAsset {
  return { id: `img-${localPath}`, kind: 'image', src, localPath }
}

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
 * One reference content run, so the value gate has substance to raise a delta
 * against: a reproduction manifest that carries none of it is a real
 * `reproduction-wrong`, which is the verdict the false coverage finding used to
 * override.
 */
const HEADING: ContentRun = {
  role: 'heading',
  text: 'Front door heading',
  color: '#111827',
  fontFamily: 'Inter',
  fontSizePx: 40,
  fontWeight: 600,
}

function captureSection(): Section {
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
    content: [HEADING],
    items: [],
    fields: [],
  }
}

interface BundleSpec {
  /** Mirrored image assets the capture kept bytes for. */
  assets: CaptureAsset[]
  /** One entry per section band: the `background-image` handle it paints, if any. */
  sections: Array<string | null>
  /** Extra manifest elements (e.g. one carrying a media `src` or a backdrop box). */
  elements?: ValueElement[]
}

/**
 * A ladder oracle the 3-probe gate passes cleanly, plus a `capture.json` whose
 * mirrored assets are under the fixture's control. Bands span the
 * viewport at every rung and the page's implied height stays short, so neither
 * the off-sample probe nor the section-density proxy fires — this suite is about
 * the media proxy alone, and a structural failure or a density finding would
 * decide the verdict before the coverage rung is ever reached.
 */
async function writeBundle(spec: BundleSpec): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-09-17T00:00:00.000Z',
    // REQ-270 — this fixture stands in for a bundle taken by the CURRENT
    // extractor, so it carries the stamp one has. Without it coverage would
    // (correctly) report `stale-capture` and this suite would be asserting
    // against a bundle no live capture produces.
    captureSchema: CAPTURE_SCHEMA,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [captureSection()],
    assets: spec.assets,
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))

  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections: spec.sections.map((bg, index) => bandValues(index, width, bg)),
      elements: [el('Front door heading', { x: 20, y: 100, width: width - 40, height: 48 }), ...(spec.elements ?? [])],
    } satisfies ValueManifest,
  }))
  const oracle: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }
  await writeMultiState(fsReferenceBundle(dir), oracle)
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

/**
 * One section band, sized to the rung it is captured at. The box spans the
 * viewport width at every width on the ladder — a band pinned to one width would
 * overflow the narrow rungs and the off-sample probe would read the fold's
 * section-background box as a structural failure before the verdict ladder is
 * ever reached. `bg` is the CSS `background-image` handle the band paints
 * (BUG-13), or null for a band with no imagery.
 */
function bandValues(index: number, width: number, bg: string | null): SectionValues {
  const sv: SectionValues = {
    index,
    overlay: null,
    contentAnchorRatio: null,
    box: { x: 0, y: index * 400, width, height: 400 },
  }
  if (bg) sv.backgroundImageUrl = bg
  return sv
}

/** A uniform grey raster — the perceptual eye's pixel input. */
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

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('BUG-100 — coverage sees imagery the manifest paints as a background', () => {
  it('test_UAT_FC_BUG-100_section_background_image_counts_as_referenced', async () => {
    // The gigabytealchemy shape, and the ticket's own "how to know it is fixed":
    // a page whose imagery is entirely CSS `background-image`, so NO element
    // carries a media `src` and the old `referenced` set was empty by
    // construction. The hero is named by `sections[].backgroundImageUrl` and must
    // be counted.
    const dir = await writeBundle({
      assets: [imageAsset(HERO_URL, HERO_LOCAL)],
      sections: [null, HERO_URL, null],
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.mirroredImages).toBe(1)
    expect(coverage.referencedImages).toBe(1)
    expect(coverage.unreferencedImages).toEqual([])
    expect(coverage.findings).toEqual([])
  })

  it('test_UAT_FC_BUG-100_element_background_image_counts_as_referenced', async () => {
    // BUG-27's other home for a painted handle: a text-free backdrop box nested
    // below the band root, recorded on `ValueElement.backgroundImageUrl`.
    const backdrop = imageAsset('https://fixture.test/media/backdrop.jpg', 'assets/backdrop.jpg')
    const dir = await writeBundle({
      assets: [backdrop],
      sections: [null],
      elements: [{ ...el('', { x: 0, y: 200, width: 1280, height: 400 }), backgroundImageUrl: backdrop.src }],
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.referencedImages).toBe(1)
    expect(coverage.unreferencedImages).toEqual([])
    expect(coverage.findings).toEqual([])
  })

  it('test_UAT_FC_BUG-100_media_src_still_counts_as_referenced', async () => {
    // The pre-existing path is not regressed: a genuine `<img>` still counts.
    const photo = imageAsset('https://fixture.test/media/photo.jpg', 'assets/photo.jpg')
    const dir = await writeBundle({
      assets: [photo],
      sections: [null],
      elements: [{ ...el('', { x: 0, y: 200, width: 400, height: 300 }), src: photo.src }],
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.referencedImages).toBe(1)
    expect(coverage.unreferencedImages).toEqual([])
  })

  it('test_UAT_FC_BUG-100_orphaned_asset_is_still_reported', async () => {
    // The proxy is WIDENED, not disabled. An asset no field of the manifest names
    // is still bytes the capture kept and never attributed, and still reported —
    // alongside one that IS named, so the two are distinguished rather than the
    // check being switched off.
    const orphan = imageAsset('https://fixture.test/media/orphan.jpg', 'assets/orphan.jpg')
    const dir = await writeBundle({
      assets: [imageAsset(HERO_URL, HERO_LOCAL), orphan],
      sections: [HERO_URL],
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.mirroredImages).toBe(2)
    expect(coverage.referencedImages).toBe(1)
    expect(coverage.unreferencedImages).toEqual(['assets/orphan.jpg'])
    expect(coverage.findings.map((f) => f.kind)).toEqual(['unreferenced-image'])
  })

  it('test_UAT_FC_BUG-100_handles_match_by_mirrored_asset_basename', async () => {
    // The two projection paths name the same bytes differently: the ladder
    // (`flattenSignals`) carries the absolute origin URL, a single-width
    // projection (`flattenCapture`) carries the site-local `assets/…` mirror. A
    // handle in either form names the same asset, and a query string or fragment
    // on the URL does not make it a different one.
    const dir = await writeBundle({
      assets: [imageAsset(HERO_URL, HERO_LOCAL)],
      sections: [`/${HERO_LOCAL}?v=3#frag`],
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.referencedImages).toBe(1)
    expect(coverage.unreferencedImages).toEqual([])
  })
})

describe('BUG-100 — a CSS-painted hero no longer hijacks the verdict', () => {
  it('test_UAT_FC_BUG-100_breaching_run_reads_reproduction_wrong_not_capture_incomplete', async () => {
    // The consequence the ticket is actually about. Under a breaching perceptual
    // eye, `reconcileGates` consults coverage BEFORE the value-delta count — so
    // the false `unreferenced-image` used to override `reproduction-wrong` and
    // report `capture-incomplete`, telling the operator the reference was
    // impoverished and the deltas "are not yet evidence". With coverage clean the
    // run reads as ours, and the values-diff is named as where to work it.
    const ref = await writeBundle({
      assets: [imageAsset(HERO_URL, HERO_LOCAL)],
      sections: [HERO_URL],
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.perceptualBreach).toBe(true)
    expect(report.coverage.findings).toEqual([])
    expect(report.verdict).toBe('reproduction-wrong')
    expect(formatGateReport(report, ref)).toMatch(/the defect is ours/)
  })

  it('test_UAT_FC_BUG-100_a_genuinely_impoverished_reference_still_escalates', async () => {
    // …and the escalation it exists for is intact: mirrored bytes that nothing in
    // the manifest names, under the same breaching eye, still read as
    // `capture-incomplete`. The verdict ladder is unchanged; only the blindness
    // that produced false findings is gone.
    const ref = await writeBundle({
      assets: [imageAsset('https://fixture.test/media/orphan.jpg', 'assets/orphan.jpg')],
      sections: [null],
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('capture-incomplete')
    expect(report.coverage.findings.map((f) => f.kind)).toEqual(['unreferenced-image'])
    expect(formatGateReport(report, ref)).toMatch(/CAPTURE defect, not a reproduction defect/)
  })
})
