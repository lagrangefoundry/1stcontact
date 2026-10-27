import { describe, expect, it } from 'vitest'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { ASSETS_PREFIX, bundleNameFor } from '../tools/generate/src/store/reference-store'
import {
  writeBundle,
  writeForms,
  writeHints,
  writeL1,
  writeLadderScreenshots,
  writeMultiState,
} from '../tools/generate/src/cli/capture/bundle'
import { syntheticCapture, syntheticL1, syntheticMultiState } from './support/reference-fixtures'
import { signalsFor } from './support/fake-capture-driver'
import { encodePng, decodePng } from '../tools/generate/src/cli/png'
import { computeDiff, cropRaster } from '../tools/generate/src/cli/perceptual-core'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import {
  PERCEPTUAL_MEAN_FLOOR,
  PERCEPTUAL_PCT_FLOOR,
  reconcileGates,
} from '../tools/generate/src/cli/gate'
import type { ReferenceCoverage } from '../tools/generate/src/cli/gate'
import { resolvePicture } from '../tools/generate/src/cli/picture'
import { VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'

/**
 * story-47fb84e6 — the assistant can compare and judge.
 *
 * Driven through the fidelity surface's production operations over a real
 * in-memory `ReferenceStore`. The browser is the one double: it is the external
 * boundary the `BrowserDriver` seam exists to have injected, and it RECORDS every
 * lease and navigation so the tests can assert on which pictures were taken and
 * — for the refusal — that none was.
 */

const VERDICTS = [
  'pass',
  'structural-failure',
  'capture-incomplete',
  'reproduction-wrong',
  'unexplained-disagreement',
]

function solid(width: number, height: number, rgb: [number, number, number]): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = rgb[0]
    data[i * 3 + 1] = rgb[1]
    data[i * 3 + 2] = rgb[2]
  }
  return { data, width, height, channels: 3 }
}

function withPatch(
  base: Raster,
  box: { x: number; y: number; w: number; h: number },
  rgb: [number, number, number],
): Raster {
  const out = { ...base, data: new Uint8Array(base.data) }
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const i = (y * base.width + x) * 3
      out.data[i] = rgb[0]
      out.data[i + 1] = rgb[1]
      out.data[i + 2] = rgb[2]
    }
  }
  return out
}

const png = (raster: Raster): Promise<Uint8Array> => encodePng(raster)

/** What the browser double was asked to do, per test. */
interface BrowserLog {
  leases: number
  navigated: string[]
}

class RecordingDriver implements BrowserDriver {
  private url = ''
  constructor(
    private readonly shots: Map<string, Uint8Array>,
    private readonly fallback: Uint8Array,
    private readonly log: BrowserLog,
  ) {}
  async navigate(url: string, _viewport?: Viewport): Promise<void> {
    this.url = url
    this.log.navigated.push(url)
  }
  async screenshot(_viewport?: Viewport): Promise<Uint8Array> {
    for (const [fragment, bytes] of this.shots) {
      if (this.url.includes(fragment)) return bytes
    }
    return this.fallback
  }
  async query<T>(_script: string): Promise<T> {
    return signalsFor(VIEWPORTS.desktop.width) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>recorded</body></html>'
  }
  async close(): Promise<void> {}
}

const BUNDLE = bundleNameFor({ host: 'example.test', path: '/pricing' })
const ORIGIN = 'https://app.example.test'

type References = ReturnType<typeof memoryReferenceStore>

/** A reference store holding one complete bundle whose full-page shot is `shot`. */
async function seededReferences(shot: Uint8Array): Promise<References> {
  const store = memoryReferenceStore()
  const bundle = store.bundle(BUNDLE)
  await writeBundle(bundle, {
    capture: syntheticCapture(),
    screenshot: shot,
    renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
    rawHtml: '<html><body>raw</body></html>',
    assetBytes: new Map([[`${ASSETS_PREFIX}hero.jpg`, new Uint8Array([9, 9, 9])]]),
  })
  await writeMultiState(bundle, syntheticMultiState())
  await writeL1(bundle, syntheticL1())
  await writeForms(bundle, [])
  await writeHints(bundle, { viewport: VIEWPORTS.mobile, mediaBreakpoints: [], nodes: [] })
  return store
}

async function deps(
  shots: Map<string, Uint8Array>,
  references: References,
  log: BrowserLog = { leases: 0, navigated: [] },
): Promise<FidelityDeps> {
  const fallback = await png(solid(64, 64, [255, 255, 255]))
  const lease = () => {
    log.leases += 1
    return new RecordingDriver(shots, fallback, log)
  }
  return {
    slug: 'studio',
    origin: ORIGIN,
    references,
    driverFactory: async () => lease(),
    guardedDriver: () => async () => lease(),
  }
}

interface CompareResult {
  a: string
  b: string
  size: { width: number; height: number }
  meanDifference: number
  percentDifferent: number
  bands: number[]
  regions: {
    rank: number
    area: { x: number; y: number; w: number; h: number }
    meanDifference: number
  }[]
}

interface FidelityReport {
  verdict: string
  diagnosis: string
  nextStep: string
  pass: boolean
  floor: { mean: number; pct: number }
  perceptual: { meanDiff: number; pctOverThreshold: number; regions: number }
  values: { deltas: number; matched: number; unmatched: number }
  coverage: {
    mirroredImages: number
    referencedImages: number
    unreferencedImages: string[]
    sections: number
    pxPerSection: number
    findings: unknown[]
  }
}

describe('story-47fb84e6 — compare', () => {
  it('test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates', async () => {
    const base = solid(80, 60, [30, 60, 90])
    const changed = withPatch(base, { x: 10, y: 10, w: 24, h: 24 }, [200, 60, 90])
    const refPng = await png(base)
    const draftPng = await png(changed)

    const references = await seededReferences(refPng)
    const ops = fidelityOperations(await deps(new Map([['/draft/', draftPng]]), references))

    const got = (await ops.compare({
      a: { kind: 'reference', bundle: BUNDLE },
      b: { kind: 'draft' },
    })) as CompareResult

    // `1c diff`'s verdict for the same pair, through the same core it uses:
    // crop to the common rectangle, then the perceptual diff.
    const [ra, rb] = await Promise.all([decodePng(refPng, 'ref'), decodePng(draftPng, 'draft')])
    const w = Math.min(ra.width, rb.width)
    const h = Math.min(ra.height, rb.height)
    const expected = computeDiff(cropRaster(ra, w, h), cropRaster(rb, w, h))

    expect(got.size).toEqual({ width: w, height: h })
    expect(got.meanDifference).toBe(expected.meanDiff)
    expect(got.percentDifferent).toBe(expected.pctOverThreshold)
    expect(got.bands).toEqual(expected.bands)
    expect(got.regions.map((r) => r.rank)).toEqual(expected.regions.map((r) => r.id))
    expect(got.regions.map((r) => r.area)).toEqual(expected.regions.map((r) => r.bbox))
    expect(got.regions.map((r) => r.meanDifference)).toEqual(expected.regions.map((r) => r.meanDiff))

    // The patch is genuinely found, so the equality is not two empty answers.
    expect(got.regions.length).toBeGreaterThan(0)
    expect(got.meanDifference).toBeGreaterThan(0)

    // Coordinates, not files: no paths, heatmaps or crop images come back.
    expect(Object.keys(got).sort()).toEqual(
      ['a', 'b', 'bands', 'meanDifference', 'percentDifferent', 'regions', 'size'].sort(),
    )
    for (const region of got.regions) {
      expect(Object.keys(region).sort()).toEqual(['area', 'meanDifference', 'rank'])
    }
    expect(JSON.stringify(got)).not.toMatch(/\.png|heatmap|crop/i)
  })

  it('test_UAT_AC2037_compare_crops_to_the_common_top_left_rectangle_and_reports_its_size', async () => {
    // Identical colour over the shared rectangle; the larger reference has 20
    // columns and 50 rows outside it painted a different colour, which must not
    // count because only the top-left 80×150 is compared.
    const big = withPatch(solid(100, 200, [0, 0, 0]), { x: 80, y: 0, w: 20, h: 200 }, [255, 255, 255])
    const bigger = withPatch(big, { x: 0, y: 150, w: 100, h: 50 }, [255, 255, 255])
    const references = await seededReferences(await png(bigger))
    const shots = new Map([['/draft/', await png(solid(80, 150, [0, 0, 0]))]])
    const ops = fidelityOperations(await deps(shots, references))

    const got = (await ops.compare({
      a: { kind: 'reference', bundle: BUNDLE },
      b: { kind: 'draft' },
    })) as CompareResult

    expect(got.size).toEqual({ width: 80, height: 150 })
    expect(got.meanDifference).toBe(0)
    expect(got.regions).toEqual([])
  })

  it('test_UAT_AC2038_compare_takes_any_two_kinds_and_labels_each_side', async () => {
    const references = await seededReferences(await png(solid(20, 20, [128, 128, 128])))
    const shots = new Map([
      ['/draft/', await png(solid(20, 20, [0, 0, 0]))],
      ['/rev-2/', await png(solid(20, 20, [255, 255, 255]))],
    ])
    const log: BrowserLog = { leases: 0, navigated: [] }
    const ops = fidelityOperations(await deps(shots, references, log))

    const got = (await ops.compare({
      a: { kind: 'revision', revision: 2 },
      b: { kind: 'draft' },
    })) as CompareResult

    expect(got.a).toContain('revision 2')
    expect(got.b).toContain('draft')
    expect(got.meanDifference).toBe(255)
    // Neither side was a reference: both pictures were the site's own channels.
    expect(log.navigated).toEqual([
      `${ORIGIN}/preview/studio/rev-2/`,
      `${ORIGIN}/preview/studio/draft/`,
    ])
  })
})

describe('story-47fb84e6 — check_fidelity', () => {
  it('test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle', async () => {
    const shot = await png(solid(40, 40, [7, 7, 7]))
    const references = await seededReferences(shot)
    await writeLadderScreenshots(references.bundle(BUNDLE), [
      { viewport: VIEWPORTS.desktop, bytes: shot },
    ])
    const ops = fidelityOperations(await deps(new Map([['/draft/', shot]]), references))

    const report = (await ops.check_fidelity({
      actual: { kind: 'draft' },
      reference: BUNDLE,
    })) as FidelityReport

    expect(VERDICTS).toContain(report.verdict)
    expect(report.pass).toBe(report.verdict === 'pass')
    expect(typeof report.diagnosis).toBe('string')
    expect(report.diagnosis.length).toBeGreaterThan(0)
    expect(typeof report.nextStep).toBe('string')
    expect(report.nextStep.length).toBeGreaterThan(0)
    expect(report.floor).toEqual({ mean: PERCEPTUAL_MEAN_FLOOR, pct: PERCEPTUAL_PCT_FLOOR })

    expect(report.perceptual.meanDiff).toBe(0)
    expect(report.perceptual.pctOverThreshold).toBe(0)
    expect(report.perceptual).toHaveProperty('regions')

    expect(report.values).toHaveProperty('deltas')
    expect(report.values).toHaveProperty('matched')
    expect(report.values).toHaveProperty('unmatched')

    // Read from THIS bundle: its one mirrored asset is counted.
    expect(report.coverage.mirroredImages).toBe(1)
    for (const key of ['referencedImages', 'unreferencedImages', 'sections', 'pxPerSection', 'findings']) {
      expect(report.coverage).toHaveProperty(key)
    }
  })

  it('test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step', () => {
    // `reconcileGates` is the reconciliation `check_fidelity` and `1c gate` both
    // call, so these inputs give the same verdict through either.
    const clean: ReferenceCoverage = {
      mirroredImages: 3,
      referencedImages: 3,
      unreferencedImages: [],
      sections: 6,
      pageHeightPx: 4000,
      pxPerSection: 666,
      findings: [],
    }
    const suspect: ReferenceCoverage = {
      ...clean,
      referencedImages: 0,
      unreferencedImages: ['assets/hero.jpg', 'assets/logo.png', 'assets/x.png'],
      findings: [{ kind: 'unreferenced-image', detail: '3 mirrored images are referenced by nothing' }],
    }
    const quiet = { meanDiff: 1, pctOverThreshold: 1, regions: [] }
    const loud = { meanDiff: 90, pctOverThreshold: 80, regions: [{}, {}] }
    const noDeltas = { deltas: [], matched: 40, unmatched: 0 }
    const twoDeltas = {
      deltas: [{ property: 'color' }, { property: 'fontSizePx' }] as never,
      matched: 30,
      unmatched: 2,
    }

    const structural = reconcileGates({ l1Gate: { pass: false }, coverage: clean, perceptual: quiet, values: noDeltas })
    const pass = reconcileGates({ l1Gate: { pass: true }, coverage: clean, perceptual: quiet, values: noDeltas })
    const incomplete = reconcileGates({ l1Gate: { pass: true }, coverage: suspect, perceptual: loud, values: noDeltas })
    const wrong = reconcileGates({ l1Gate: { pass: true }, coverage: clean, perceptual: loud, values: twoDeltas })
    const unexplained = reconcileGates({ l1Gate: { pass: true }, coverage: clean, perceptual: loud, values: noDeltas })

    expect(structural.verdict).toBe('structural-failure')
    expect(pass.verdict).toBe('pass')
    expect(incomplete.verdict).toBe('capture-incomplete')
    expect(wrong.verdict).toBe('reproduction-wrong')
    expect(unexplained.verdict).toBe('unexplained-disagreement')

    // Structural failure wins whatever else holds.
    expect(
      reconcileGates({ l1Gate: { pass: false }, coverage: suspect, perceptual: loud, values: twoDeltas }).verdict,
    ).toBe('structural-failure')

    expect(pass.pass).toBe(true)
    for (const v of [structural, incomplete, wrong, unexplained]) expect(v.pass).toBe(false)

    expect(incomplete.values.deltas).toBe(0)
    expect(incomplete.perceptual.pctOverThreshold).toBe(80)
    expect(wrong.values.deltas).toBe(2)

    // The next steps the AC names.
    expect(pass.nextStep.toLowerCase()).toContain('nothing outstanding')
    const passWithDeltas = reconcileGates({ l1Gate: { pass: true }, coverage: clean, perceptual: quiet, values: twoDeltas })
    expect(passWithDeltas.verdict).toBe('pass')
    expect(passWithDeltas.nextStep).toContain('2')
    expect(passWithDeltas.nextStep.toLowerCase()).not.toContain('nothing outstanding')
    expect(wrong.nextStep).toContain('2')

    const steps = [structural, pass, incomplete, wrong, unexplained].map((v) => v.nextStep)
    expect(new Set(steps).size).toBe(5)
  })

  it('test_UAT_AC2041_the_reference_side_is_read_at_the_viewport_the_actual_asked_for', async () => {
    const fullPage = await png(solid(40, 40, [1, 1, 1]))
    const mobileShot = await png(solid(40, 40, [2, 2, 2]))
    const desktopShot = await png(solid(40, 40, [3, 3, 3]))
    const references = await seededReferences(fullPage)
    await writeLadderScreenshots(references.bundle(BUNDLE), [
      { viewport: VIEWPORTS.mobile, bytes: mobileShot },
      { viewport: VIEWPORTS.desktop, bytes: desktopShot },
    ])
    const d = await deps(new Map([['/draft/', mobileShot]]), references)

    const mobile = await resolvePicture({ kind: 'reference', bundle: BUNDLE, viewport: 'mobile' }, d)
    const desktop = await resolvePicture({ kind: 'reference', bundle: BUNDLE, viewport: 'desktop' }, d)
    expect((await decodePng(mobile.bytes, 'm')).data[0]).toBe(2)
    expect((await decodePng(desktop.bytes, 'd')).data[0]).toBe(3)
    expect(mobile.label).toContain('mobile')

    // Through check_fidelity: a mobile draft identical to the mobile ladder
    // member is judged against THAT member — against the desktop or full-page
    // shot it would show a difference.
    const report = (await fidelityOperations(d).check_fidelity({
      actual: { kind: 'draft', viewport: 'mobile' },
      reference: BUNDLE,
    })) as FidelityReport
    expect(report.perceptual.meanDiff).toBe(0)
  })

  it('test_UAT_AC2042_a_reference_without_a_ladder_member_falls_back_and_labels_it', async () => {
    const fullPage = await png(solid(40, 40, [4, 4, 4]))
    const references = await seededReferences(fullPage)
    const d = await deps(new Map([['/draft/', fullPage]]), references)

    const picture = await resolvePicture({ kind: 'reference', bundle: BUNDLE, viewport: 'mobile' }, d)
    expect((await decodePng(picture.bytes, 'f')).data[0]).toBe(4)
    expect(picture.label).toContain('full-page shot')
    expect(picture.label).toContain('no mobile ladder member')

    // The fallback travels into a comparison's side label.
    const got = (await fidelityOperations(d).compare({
      a: { kind: 'reference', bundle: BUNDLE, viewport: 'mobile' },
      b: { kind: 'draft', viewport: 'mobile' },
    })) as CompareResult
    expect(got.a).toContain('no mobile ladder member')

    // A bundle with no screenshot at all is refused as not found.
    const empty = memoryReferenceStore()
    await expect(
      resolvePicture({ kind: 'reference', bundle: 'nothing-here', viewport: 'mobile' }, await deps(new Map(), empty)),
    ).rejects.toThrow(/holds no screenshot.*List the references/s)
  })

  it('test_UAT_AC2043_check_fidelity_refuses_an_uncaptured_reference_before_any_browser_work', async () => {
    const references = await seededReferences(await png(solid(20, 20, [0, 0, 0])))
    const log: BrowserLog = { leases: 0, navigated: [] }
    const ops = fidelityOperations(await deps(new Map(), references, log))

    const error = await ops
      .check_fidelity({ actual: { kind: 'draft' }, reference: 'never-captured' })
      .then(
        () => null,
        (e: unknown) => e as Error,
      )

    // Refused, and before any browser was leased or navigated.
    expect(error).not.toBeNull()
    expect(log.leases).toBe(0)
    expect(log.navigated).toEqual([])

    // The refusal comes from reading the bundle's capture.json, and it names the
    // missing reference. It is the bundle reader's plain error, raised before
    // check_fidelity's own not-found wording is ever reached.
    expect(error).toBeInstanceOf(Error)
    expect(error!.message).toBe("Bundle 'never-captured' has no capture.json.")
    expect(error!.name).toBe('Error')
  })
})
