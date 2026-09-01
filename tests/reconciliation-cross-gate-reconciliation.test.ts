/**
 * UATs for the cross-gate reconciliation slice of story-24098299 — the
 * acceptance boundary one layer out from the three-probe geometry gate.
 *
 *   AC-852  one verb (`1c gate`) reconciles the geometry gate, reference
 *           coverage, the perceptual eye and the value eye into ONE report, with
 *           the two browser-free signals evaluated first
 *   AC-853  a perceptual breach fails the run regardless of the value gates, and
 *           the floor the run was held to is echoed into the report
 *   AC-854  reference coverage is reported every run — mirrored-vs-referenced
 *           media and page height per captured section
 *   AC-855  a failing run names its likely cause and the one next step it implies
 *   AC-856  value deltas are evidence, not exit code; a bundle with no retained
 *           reference manifest is a hard error, never a vacuous pass
 *
 * The defect the slice exists for: `joyfulculinarycreations.com` reproduced 80%
 * wrong by pixel count and PASSED. `l1-gate` grades geometry only (by design) and
 * `values-diff` can only compare elements present in BOTH manifests, so a capture
 * that missed the page's substance leaves it nothing to raise a delta against.
 * Only the perceptual eye saw it, and nothing compared the three to each other.
 *
 * Every probe drives a real entry point — `cmdGate` / `referenceCoverage` /
 * `formatGateReport`, and the `1c` CLI itself (`cli.run(['gate', …])`) for the
 * exit-code and flag-parsing criteria — over real components. The only seams used
 * are the offline ones `diff` (`--actual-image`) and `values-diff`
 * (`--actual-manifest`) already expose, so nothing we own is mocked and no
 * headless browser is ever started.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import * as cli from '../tools/generate/src/cli/index'
import {
  cmdGate,
  formatGateReport,
  referenceCoverage,
  writeMultiState,
  writeRasterPng,
  PERCEPTUAL_MEAN_FLOOR,
  PERCEPTUAL_PCT_FLOOR,
  type BrowserDriverFactory,
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

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `xgate-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
  vi.restoreAllMocks()
  process.exitCode = 0
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
 * A ladder oracle the three-probe gate passes cleanly: one run per width, nothing
 * below it to overrun under content perturbation. `bottomPx` places that run so
 * the reference page's implied height — and therefore its px-per-section density
 * — is under the fixture's control. `overhangPx` pushes the run's right edge past
 * the viewport so the geometry gate itself fails (the `structural-failure` case).
 */
function cleanOracle(
  sections: ValueManifest['sections'],
  bottomPx = 148,
  overhangPx = 0,
): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections,
      elements: [
        el('Front door heading', {
          x: 20,
          y: bottomPx - 48,
          width: width - 40 + overhangPx,
          height: 48,
        }),
      ],
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
  /** How many of the mirrored images the reference manifest attributes to an element. */
  referenced?: number
  /** Push the reference run past the viewport so the geometry gate fails. */
  overhangPx?: number
}

/** Write a capture bundle: `capture.json` + `multistate.json` + a black reference shot. */
async function writeCaptureBundle(spec: BundleSpec): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-07-25T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
    sections: [section(spec.content)],
    assets: Array.from({ length: spec.images }, (_, i) => imageAsset(i)),
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  const oracle = cleanOracle(spec.sections, spec.pageBottomPx ?? 148, spec.overhangPx ?? 0)
  for (let i = 0; i < (spec.referenced ?? 0); i++) {
    for (const p of oracle.projections) {
      p.manifest.elements.push({
        ...el('', { x: 0, y: 400 + i * 120, width: 100, height: 100 }),
        src: imageAsset(i).src,
      })
    }
  }
  await writeMultiState(fsReferenceBundle(dir), oracle)
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

/** A uniform raster — the two eyes' pixel input. */
function flat(w: number, h: number, value: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(value)
  return { data, width: w, height: h, channels: 3 }
}

/**
 * A raster whose first `pctOver`% of pixels sit at `value` and the rest at 0 —
 * lets a fixture drive `pctOverThreshold` independently of `meanDiff`.
 */
function speckled(w: number, h: number, value: number, pctOver: number): Raster {
  const data = new Uint8Array(w * h * 3)
  const over = Math.round((w * h * pctOver) / 100)
  for (let i = 0; i < over; i++) {
    data[i * 3] = value
    data[i * 3 + 1] = value
    data[i * 3 + 2] = value
  }
  return { data, width: w, height: h, channels: 3 }
}

/** Our reproduction's screenshot, written from an arbitrary raster. */
async function shotOf(raster: Raster): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(raster, file)
  return file
}

/** Our reproduction's screenshot, `value` away from the all-black reference. */
function actualShot(value: number): Promise<string> {
  return shotOf(flat(64, 64, value))
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

/** A driver factory that fails the test if the reconciliation ever starts a browser. */
function neverDriver(): { factory: BrowserDriverFactory; calls: () => number } {
  const spy = vi.fn(async () => {
    throw new Error('a browser-free signal started a headless browser')
  })
  return { factory: spy as unknown as BrowserDriverFactory, calls: () => spy.mock.calls.length }
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('story-24098299 — cross-gate reconciliation', () => {
  it('test_UAT_AC852_one_verb_reconciles_four_signals_browser_free_first', async () => {
    const ref = await writeCaptureBundle({ images: 0, content: [HEADING], sections: [] })
    const out = freshDir('out')
    const driver = neverDriver()

    // (a) One verb, one report, four signals side by side — driven offline
    //     through the seams `diff` and `values-diff` already expose, and with no
    //     site slug supplied.
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(4),
      actualManifestPath: actualManifest(),
      out,
      driverFactory: driver.factory,
    })

    expect(report.l1Pass).toBe(true)
    expect(report.coverage).toMatchObject({
      mirroredImages: expect.any(Number),
      referencedImages: expect.any(Number),
      sections: expect.any(Number),
      pageHeightPx: expect.any(Number),
      pxPerSection: expect.any(Number),
    })
    expect(report.perceptual).toMatchObject({
      meanDiff: expect.any(Number),
      pctOverThreshold: expect.any(Number),
      regions: expect.any(Number),
    })
    expect(report.values).toMatchObject({
      deltas: expect.any(Number),
      matched: expect.any(Number),
      unmatched: expect.any(Number),
    })
    // …and, on top of them, a verdict, an operator-facing diagnosis and one next step.
    expect(report.verdict).toBe('pass')
    expect(report.diagnosis.length).toBeGreaterThan(0)
    expect(report.nextStep.length).toBeGreaterThan(0)
    expect(driver.calls()).toBe(0)

    // (b) With an output directory the run leaves its machine-readable report
    //     alongside the perceptual artifacts and the values report.
    expect(existsSync(path.join(out, 'gate.json'))).toBe(true)
    expect(existsSync(path.join(out, 'values-diff.json'))).toBe(true)
    expect(existsSync(path.join(out, 'regions.json'))).toBe(true)
    expect(existsSync(path.join(out, 'diff.png'))).toBe(true)

    // (c) Ordering is observable: a bundle carrying no reference manifest fails
    //     before a headless browser is ever asked for a page.
    const stale = freshDir('stale')
    const staleDriver = neverDriver()
    await expect(
      cmdGate({
        ref: stale,
        actualImagePath: await actualShot(4),
        actualManifestPath: actualManifest(),
        driverFactory: staleDriver.factory,
      }),
    ).rejects.toThrow(/multistate\.json/)
    expect(staleDriver.calls()).toBe(0)

    // (d) The verb is the CLI's, and its exit status follows the verdict.
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {})
    const shot = await actualShot(4)
    const manifest = actualManifest()

    process.exitCode = 0
    await cli.run(['gate', '--ref', ref, '--actual-image', shot, '--actual-manifest', manifest, '--json'])
    expect(process.exitCode).toBe(0)
    const printed = JSON.parse(stdout.mock.calls.at(-1)![0] as string)
    expect(printed.verdict).toBe('pass')
    expect(printed).toHaveProperty('l1Pass')
    expect(printed).toHaveProperty('coverage')
    expect(printed).toHaveProperty('perceptual')
    expect(printed).toHaveProperty('values')
    expect(printed).toHaveProperty('diagnosis')
    expect(printed).toHaveProperty('nextStep')

    process.exitCode = 0
    await cli.run([
      'gate',
      '--ref',
      ref,
      '--actual-image',
      await actualShot(200),
      '--actual-manifest',
      manifest,
      '--json',
    ])
    expect(process.exitCode).toBe(1)
    expect(JSON.parse(stdout.mock.calls.at(-1)![0] as string).pass).toBe(false)
  })

  it('test_UAT_AC853_perceptual_breach_fails_regardless_and_floor_is_echoed', async () => {
    // A bundle whose geometry gate passes and whose value eye has nothing to
    // raise a delta against: the perceptual eye is the only gate left that can
    // fail this run.
    const ref = await writeCaptureBundle({ images: 0, content: [], sections: [] })
    const manifest = actualManifest()

    // (a) Mean over the floor → breach → fail, even with l1-gate green and zero
    //     value deltas.
    const meanBreach = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(meanBreach.l1Pass).toBe(true)
    expect(meanBreach.values.deltas).toBe(0)
    expect(meanBreach.perceptual.meanDiff).toBeGreaterThan(meanBreach.floor.mean)
    expect(meanBreach.perceptualBreach).toBe(true)
    expect(meanBreach.pass).toBe(false)

    // (b) Either bound is sufficient: mean WITHIN the floor, percent-over-threshold
    //     above it, still a breach. 30% of pixels at 40/255 → mean 12, pct 30.
    const pctOnly = await cmdGate({
      ref,
      actualImagePath: await shotOf(speckled(64, 64, 40, 30)),
      actualManifestPath: manifest,
      out: freshDir('out'),
      floor: { mean: 20, pct: 25 },
    })
    expect(pctOnly.perceptual.meanDiff).toBeLessThanOrEqual(pctOnly.floor.mean)
    expect(pctOnly.perceptual.pctOverThreshold).toBeGreaterThan(pctOnly.floor.pct)
    expect(pctOnly.perceptualBreach).toBe(true)
    expect(pctOnly.pass).toBe(false)

    // (c) The floor is never implicit: the report carries the exact bounds, and
    //     the human read states them on their own line with within/over.
    const clean = await cmdGate({
      ref,
      actualImagePath: await actualShot(4),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(clean.floor).toEqual({ mean: PERCEPTUAL_MEAN_FLOOR, pct: PERCEPTUAL_PCT_FLOOR })
    expect(clean.pass).toBe(true)
    expect(formatGateReport(clean, ref)).toContain(
      `✓ within floor (mean ≤ ${PERCEPTUAL_MEAN_FLOOR}, pct ≤ ${PERCEPTUAL_PCT_FLOOR}%)`,
    )
    expect(formatGateReport(meanBreach, ref)).toContain(
      `✗ over floor (mean ≤ ${PERCEPTUAL_MEAN_FLOOR}, pct ≤ ${PERCEPTUAL_PCT_FLOOR}%)`,
    )

    // (d) Each bound is a per-run dial: tightening the floor turns that same
    //     previously-passing reproduction into a failing one.
    const tight = await cmdGate({
      ref,
      actualImagePath: await actualShot(4),
      actualManifestPath: manifest,
      out: freshDir('out'),
      floor: { mean: 1 },
    })
    expect(tight.floor).toEqual({ mean: 1, pct: PERCEPTUAL_PCT_FLOOR })
    expect(tight.perceptualBreach).toBe(true)
    expect(tight.pass).toBe(false)

    // (e) A non-numeric override is refused with a message naming the flag.
    vi.spyOn(console, 'log').mockImplementation(() => {})
    await expect(
      cli.run([
        'gate',
        '--ref',
        ref,
        '--actual-image',
        await actualShot(4),
        '--actual-manifest',
        manifest,
        '--mean-floor',
        'soon',
      ]),
    ).rejects.toThrow(/--mean-floor/)
  })

  it('test_UAT_AC854_reference_coverage_is_reported_every_run', async () => {
    // (a) Media coverage: 9 mirrored images, 2 attributed to reference elements.
    const sparseMedia = await writeCaptureBundle({
      images: 9,
      content: [],
      sections: [],
      referenced: 2,
    })
    const mediaRun = await cmdGate({
      ref: sparseMedia,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })
    expect(mediaRun.coverage.mirroredImages).toBe(9)
    expect(mediaRun.coverage.referencedImages).toBe(2)
    expect(mediaRun.coverage.unreferencedImages).toEqual([
      'assets/2.jpg',
      'assets/3.jpg',
      'assets/4.jpg',
      'assets/5.jpg',
      'assets/6.jpg',
      'assets/7.jpg',
      'assets/8.jpg',
    ])
    const mediaFinding = mediaRun.coverage.findings.find((f) => f.kind === 'unreferenced-image')
    expect(mediaFinding).toBeDefined()
    expect(mediaFinding!.detail).toMatch(/7 of 9 mirrored image asset\(s\)/)
    const mediaText = formatGateReport(mediaRun, sparseMedia)
    expect(mediaText).toContain('2 of 9 mirrored image asset(s) referenced')
    // …the long list is truncated in the human-readable output.
    expect(mediaText).toMatch(/unreferenced: .*…\+1/)

    // (b) Segmentation density: a ~4900px page recorded as two bands.
    const sparseSections = await writeCaptureBundle({
      images: 0,
      content: [],
      sections: [
        { index: 0, overlay: null, contentAnchorRatio: null },
        { index: 1, overlay: null, contentAnchorRatio: null },
      ],
      pageBottomPx: 4900,
    })
    const sectionRun = await cmdGate({
      ref: sparseSections,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })
    expect(sectionRun.coverage.sections).toBe(2)
    expect(sectionRun.coverage.pageHeightPx).toBe(4900)
    expect(sectionRun.coverage.pxPerSection).toBe(2450)
    const densityFinding = sectionRun.coverage.findings.find((f) => f.kind === 'section-density')
    expect(densityFinding).toBeDefined()
    expect(densityFinding!.detail).toContain('4900px')
    expect(densityFinding!.detail).toContain('2 section(s)')
    expect(densityFinding!.detail).toContain('2450 px/section')
    expect(formatGateReport(sectionRun, sparseSections)).toContain('2 across 4900px (2450 px/section)')

    // (c) A clean bundle still reports every count — coverage is reported on
    //     passing runs too — and a coverage finding alone, with the perceptual eye
    //     within its floor, does not fail the run.
    const cleanRun = await cmdGate({
      ref: await writeCaptureBundle({ images: 2, content: [], sections: [], referenced: 2 }),
      actualImagePath: await actualShot(4),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })
    expect(cleanRun.pass).toBe(true)
    expect(cleanRun.coverage.findings).toHaveLength(0)
    expect(cleanRun.coverage.mirroredImages).toBe(2)
    expect(cleanRun.coverage.referencedImages).toBe(2)
    expect(cleanRun.coverage.sections).toBe(0)
    expect(cleanRun.coverage.pageHeightPx).toBeGreaterThan(0)

    const findingButPassing = await cmdGate({
      ref: sparseMedia,
      actualImagePath: await actualShot(4),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })
    expect(findingButPassing.coverage.findings.length).toBeGreaterThan(0)
    expect(findingButPassing.perceptualBreach).toBe(false)
    expect(findingButPassing.pass).toBe(true)

    // (d) Coverage is asked ONCE, at the widest resting-state projection on the
    //     reference's primary engine — not averaged across the width ladder, and
    //     not read off a secondary engine.
    const oneAsk = freshDir('one-ask')
    mkdirSync(path.join(oneAsk, 'assets'), { recursive: true })
    writeFileSync(
      path.join(oneAsk, 'capture.json'),
      JSON.stringify({
        url: 'http://fixture.test/',
        host: 'fixture.test',
        path: '/',
        capturedAt: '2026-07-25T00:00:00.000Z',
        viewport: { width: 1280, height: 800 },
        theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
        sections: [section([])],
        assets: [imageAsset(0), imageAsset(1), imageAsset(2)],
      } satisfies Capture),
    )
    const oracle = cleanOracle([])
    // Only the narrowest chromium cell attributes image 1…
    oracle.projections[0].manifest.elements.push({
      ...el('', { x: 0, y: 200, width: 100, height: 100 }),
      src: imageAsset(1).src,
    })
    // …the widest chromium cell attributes image 0…
    oracle.projections.at(-1)!.manifest.elements.push({
      ...el('', { x: 0, y: 200, width: 100, height: 100 }),
      src: imageAsset(0).src,
    })
    // …and a wider firefox cell attributes image 2, on the wrong engine.
    oracle.projections.push({
      engine: 'firefox',
      viewport: { width: 1920, height: 900 },
      state: 'rest',
      manifest: {
        source: 'ref@firefox:1920:rest',
        viewport: { width: 1920, height: 900 },
        sections: [],
        elements: [{ ...el('', { x: 0, y: 200, width: 100, height: 100 }), src: imageAsset(2).src }],
      },
    })
    await writeMultiState(fsReferenceBundle(oneAsk), oracle)
    const asked = await referenceCoverage(fsReferenceBundle(oneAsk))
    expect(asked.referencedImages).toBe(1)
    expect(asked.unreferencedImages).toEqual(['assets/1.jpg', 'assets/2.jpg'])
  })

  it('test_UAT_AC855_failing_run_names_its_likely_cause_and_next_step', async () => {
    const manifest = actualManifest()

    // (a) structural-failure — the geometry gate itself failed. The next step is
    //     that gate's own residuals, not the eyes.
    const broken = await writeCaptureBundle({
      images: 0,
      content: [],
      sections: [],
      overhangPx: 600,
    })
    const structural = await cmdGate({
      ref: broken,
      actualImagePath: await actualShot(200),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(structural.l1Pass).toBe(false)
    expect(structural.verdict).toBe('structural-failure')
    expect(structural.pass).toBe(false)
    expect(structural.diagnosis).toMatch(/not geometrically faithful/)
    expect(structural.nextStep).toMatch(/l1-gate/)

    // (b) capture-incomplete — floor breached AND coverage suspect. The value
    //     gates are not disagreeing, they are BLIND; the fix is in the CAPTURE.
    const impoverished = await writeCaptureBundle({ images: 3, content: [], sections: [] })
    const captureIncomplete = await cmdGate({
      ref: impoverished,
      actualImagePath: await actualShot(200),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(captureIncomplete.l1Pass).toBe(true)
    expect(captureIncomplete.perceptualBreach).toBe(true)
    expect(captureIncomplete.verdict).toBe('capture-incomplete')
    expect(captureIncomplete.pass).toBe(false)
    expect(captureIncomplete.diagnosis).toMatch(/BLIND/)
    expect(captureIncomplete.nextStep).toMatch(/CAPTURE defect, not a reproduction defect/)

    // (c) reproduction-wrong — floor breached, coverage clean, value eye sees
    //     deltas. Both eyes agree and the reference is trustworthy: ours to fix.
    const ourFault = await writeCaptureBundle({ images: 0, content: [HEADING], sections: [] })
    const reproductionWrong = await cmdGate({
      ref: ourFault,
      actualImagePath: await actualShot(200),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(reproductionWrong.verdict).toBe('reproduction-wrong')
    expect(reproductionWrong.coverage.findings).toHaveLength(0)
    expect(reproductionWrong.values.deltas).toBeGreaterThan(0)
    expect(reproductionWrong.diagnosis).toMatch(/the defect is ours/)
    expect(reproductionWrong.nextStep).toMatch(/values-diff/)

    // (d) unexplained-disagreement — floor breached and NOTHING else sees it. A
    //     pixel moved that no recorded value axis carries: a framework gap.
    const silent = await writeCaptureBundle({ images: 0, content: [], sections: [] })
    const unexplained = await cmdGate({
      ref: silent,
      actualImagePath: await actualShot(200),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(unexplained.verdict).toBe('unexplained-disagreement')
    expect(unexplained.l1Pass).toBe(true)
    expect(unexplained.coverage.findings).toHaveLength(0)
    expect(unexplained.values.deltas).toBe(0)
    expect(unexplained.diagnosis).toMatch(/no ValueElement axis carries/)
    expect(unexplained.nextStep).toMatch(/FRAMEWORK gap/)

    // (e) pass — the eyes agree; remaining value deltas point at the value verb.
    const passing = await cmdGate({
      ref: ourFault,
      actualImagePath: await actualShot(4),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(passing.verdict).toBe('pass')
    expect(passing.nextStep).toMatch(/values-diff/)

    // (f) Coverage is consulted BEFORE the value-delta count: a breach carrying
    //     BOTH coverage findings and value deltas is capture-incomplete, not
    //     reproduction-wrong, and says which to work first.
    const both = await cmdGate({
      ref: await writeCaptureBundle({ images: 3, content: [HEADING], sections: [] }),
      actualImagePath: await actualShot(200),
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(both.coverage.findings.length).toBeGreaterThan(0)
    expect(both.values.deltas).toBeGreaterThan(0)
    expect(both.verdict).toBe('capture-incomplete')
    expect(both.nextStep).toMatch(/Close the extraction gap \(or re-capture\) first/)
    expect(both.nextStep).toMatch(/not yet evidence/)

    // Each of the five causes is its own named verdict with its own next step —
    // "fix the capture" and "fix the reproduction" no longer present identically.
    const named = [structural, captureIncomplete, reproductionWrong, unexplained, passing]
    expect(new Set(named.map((r) => r.verdict)).size).toBe(5)
    expect(new Set(named.map((r) => r.nextStep)).size).toBe(5)
  })

  it('test_UAT_AC856_value_deltas_are_evidence_and_a_manifestless_bundle_is_a_hard_error', async () => {
    // (a) A reproduction the perceptual eye reads within its floor and the
    //     geometry gate passes is reported as PASSING even while the value eye
    //     still reports deltas — the report states the count and sends the
    //     operator to the value verb, which already exits non-zero on any delta.
    const ref = await writeCaptureBundle({ images: 0, content: [HEADING], sections: [] })
    const shot = await actualShot(4)
    const manifest = actualManifest()
    const report = await cmdGate({
      ref,
      actualImagePath: shot,
      actualManifestPath: manifest,
      out: freshDir('out'),
    })
    expect(report.l1Pass).toBe(true)
    expect(report.perceptualBreach).toBe(false)
    expect(report.values.deltas).toBeGreaterThan(0)
    expect(report.verdict).toBe('pass')
    expect(report.pass).toBe(true)
    expect(report.nextStep).toContain(`${report.values.deltas} delta(s)`)
    expect(report.nextStep).toMatch(/values-diff/)

    // …and the exit status agrees: the delta count never enters the verdict.
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {})
    process.exitCode = 0
    await cli.run(['gate', '--ref', ref, '--actual-image', shot, '--actual-manifest', manifest, '--json'])
    expect(process.exitCode).toBe(0)
    const printed = JSON.parse(stdout.mock.calls.at(-1)![0] as string)
    expect(printed.pass).toBe(true)
    expect(printed.values.deltas).toBeGreaterThan(0)

    // The same report reads the deltas out as evidence, next to the other gates.
    expect(formatGateReport(report, ref)).toMatch(
      new RegExp(`values-diff\\s+${report.values.deltas} delta\\(s\\)`),
    )

    // (b) A bundle with NO retained reference manifest is a hard error naming the
    //     bundle and telling the operator to re-capture — never a clean run.
    const predates = freshDir('predates')
    mkdirSync(path.join(predates, 'assets'), { recursive: true })
    writeFileSync(
      path.join(predates, 'capture.json'),
      JSON.stringify({
        url: 'http://fixture.test/',
        host: 'fixture.test',
        path: '/',
        capturedAt: '2026-07-25T00:00:00.000Z',
        viewport: { width: 1280, height: 800 },
        theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
        sections: [section([])],
        assets: [],
      } satisfies Capture),
    )
    await writeRasterPng(flat(64, 64, 0), path.join(predates, 'screenshot.full.png'))
    await expect(
      cmdGate({ ref: predates, actualImagePath: shot, actualManifestPath: manifest, out: freshDir('out') }),
    ).rejects.toThrow(new RegExp(`${predates.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    await expect(
      cmdGate({ ref: predates, actualImagePath: shot, actualManifestPath: manifest, out: freshDir('out') }),
    ).rejects.toThrow(/re-capture with `1c capture page/)
    await expect(referenceCoverage(fsReferenceBundle(predates))).rejects.toThrow(/multistate\.json/)

    // (c) …and one whose retained manifest is EMPTY is likewise a hard error
    //     naming the bundle, rather than coverage against nothing reporting clean.
    const empty = freshDir('empty')
    mkdirSync(path.join(empty, 'assets'), { recursive: true })
    writeFileSync(path.join(empty, 'capture.json'), JSON.stringify({
      url: 'http://fixture.test/',
      host: 'fixture.test',
      path: '/',
      capturedAt: '2026-07-25T00:00:00.000Z',
      viewport: { width: 1280, height: 800 },
      theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
      sections: [section([])],
      assets: [],
    } satisfies Capture))
    await writeMultiState(fsReferenceBundle(empty), { url: 'http://fixture.test/', notes: [], projections: [] })
    await writeRasterPng(flat(64, 64, 0), path.join(empty, 'screenshot.full.png'))
    await expect(referenceCoverage(fsReferenceBundle(empty))).rejects.toThrow(new RegExp(empty.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    await expect(referenceCoverage(fsReferenceBundle(empty))).rejects.toThrow(/empty multistate\.json/)

    // …and neither refusal is reachable through the verb as a report at all: the
    // run rejects with a re-capture instruction rather than returning a clean
    // bill. (For the empty ladder the browser-free half of the verb refuses at
    // the fold, one step ahead of coverage — the bundle is named by the coverage
    // reading above, and by the verb itself for the manifest-less bundle in (b).)
    await expect(
      cmdGate({ ref: empty, actualImagePath: shot, actualManifestPath: manifest, out: freshDir('out') }),
    ).rejects.toThrow(/re-capture with .?1c capture page/)
  })
})
