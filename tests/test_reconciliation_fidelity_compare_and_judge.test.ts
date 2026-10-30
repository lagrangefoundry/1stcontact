import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import * as cli from '../tools/generate/src/cli/index'
import { fidelityOperations, fidelitySurfaceFor } from '../tools/generate/src/cli/ai/fidelity-core'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { memorySiteStore } from '../tools/generate/src/store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { ASSETS_PREFIX, bundleNameFor } from '../tools/generate/src/store/reference-store'
import type { ReferenceBundle, ReferenceStore } from '../tools/generate/src/store/reference-store'
import { bundleDir, fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
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
import { siteSeed } from './support/site-seed'
import { encodePng, decodePng } from '../tools/generate/src/cli/png'
import { round } from '../tools/generate/src/cli/perceptual-core'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { PERCEPTUAL_MEAN_FLOOR, PERCEPTUAL_PCT_FLOOR } from '../tools/generate/src/cli/gate'
import { resolvePicture } from '../tools/generate/src/cli/picture'
import { VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import { flattenSignals } from '../tools/generate/src/cli/capture/values-diff'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture/values-diff'
import type { RawSignals } from '../tools/generate/src/cli/capture/extract'
import type {
  BrowserDriver,
  Capture,
  CaptureAsset,
  CapturedResponse,
  ContentRun,
  Section,
  Viewport,
} from '../tools/generate/src/cli/capture/types'

/**
 * story-47fb84e6 — the assistant can compare and judge.
 *
 * Driven through the fidelity surface's production operations over a real
 * `ReferenceStore`. Where a criterion is about what the MODEL is handed, the
 * operation runs through the composed Toolbox — validation, grant, error mapping
 * and the untrusted-content rendering included — exactly as a consultant turn
 * runs it. Where a criterion claims equality with `1c diff` or `1c gate`, the
 * reference store is on disk and the CLI itself (`cli.run`) is pointed at the
 * very bundle the surface read, through the offline seams those verbs already
 * expose (`--actual`, `--actual-image`, `--actual-manifest`).
 *
 * The browser is the one double: it is the external boundary the
 * `BrowserDriver` seam exists to have injected, and it RECORDS every lease and
 * navigation so the tests can assert on which pictures were taken and — for the
 * refusal — that none was.
 */

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `judge-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
  vi.restoreAllMocks()
  process.exitCode = 0
})

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
    private readonly signals: RawSignals,
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
    return structuredClone(this.signals) as T
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

/** The draft's own preview URL — where the surface reads the live page from. */
const DRAFT_URL = `${ORIGIN}/preview/studio/draft/`

/** Write one complete bundle whose full-page shot is `shot`. */
async function seedBundle(bundle: ReferenceBundle, shot: Uint8Array): Promise<void> {
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
}

/** An in-memory reference store holding one complete bundle whose full-page shot is `shot`. */
async function seededReferences(shot: Uint8Array): Promise<ReferenceStore> {
  const store = memoryReferenceStore()
  await seedBundle(store.bundle(BUNDLE), shot)
  return store
}

/**
 * A reference store ON DISK, so the CLI's `--ref <bundleDir>` can name the very
 * bundle the surface reads through the port. `dirOf` is that directory.
 */
function diskReferences(): { store: ReferenceStore; dirOf: (name: string) => string } {
  const cwd = freshDir('refs')
  return { store: fsReferenceStore(cwd), dirOf: (name) => bundleDir(cwd, name) }
}

async function deps(
  shots: Map<string, Uint8Array>,
  references: ReferenceStore,
  log: BrowserLog = { leases: 0, navigated: [] },
  signals: RawSignals = signalsFor(VIEWPORTS.desktop.width),
): Promise<FidelityDeps> {
  const fallback = await png(solid(64, 64, [255, 255, 255]))
  const lease = () => {
    log.leases += 1
    return new RecordingDriver(shots, fallback, log, signals)
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

// ── the composed Toolbox, as a consultant turn runs it ──────────────────────

/**
 * A Toolbox for one site with the fidelity surface composed beside the L1 one,
 * under the full grant — the same composition `host-core.ts` builds per session.
 */
async function lookingBox(fidelity: FidelityDeps) {
  const lib = await aiCore()
  const store = memorySiteStore()
  const seed = siteSeed({ slug: 'studio' })
  store.seed('studio', { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
  return createL1Toolbox(
    'studio',
    {},
    {
      lib,
      store,
      config: null,
      audit: null,
      extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, fidelity) }],
    },
  )
}

const UNTRUSTED_OPEN = '<<<untrusted>>>\n'
const UNTRUSTED_CLOSE = '\n<<</untrusted>>>'

/**
 * Run one operation through the Toolbox and read back what the model would be
 * handed. It must be a SUCCESS: not an error, and inside the untrusted-content
 * frame this surface's results are declared to carry.
 */
async function viaToolbox<T>(
  box: Awaited<ReturnType<typeof lookingBox>>,
  op: string,
  input: Record<string, unknown>,
): Promise<T> {
  const rendered = String(await box.run(op, input))
  expect(rendered, rendered.slice(0, 400)).not.toMatch(/^Error:/)
  expect(rendered.startsWith(UNTRUSTED_OPEN), rendered.slice(0, 400)).toBe(true)
  expect(rendered.endsWith(UNTRUSTED_CLOSE)).toBe(true)
  return JSON.parse(rendered.slice(UNTRUSTED_OPEN.length, rendered.length - UNTRUSTED_CLOSE.length)) as T
}

// ── the CLI, as an operator runs it ──────────────────────────────────────────

/** Run `1c <argv> --json` in process and return the JSON it printed. */
async function cliJson<T>(argv: string[]): Promise<T> {
  const stdout = vi.spyOn(console, 'log').mockImplementation(() => {})
  try {
    await cli.run([...argv, '--json'])
    expect(stdout).toHaveBeenCalled()
    return JSON.parse(stdout.mock.calls.at(-1)![0] as string) as T
  } finally {
    stdout.mockRestore()
  }
}

/** Bytes to a file the CLI can be pointed at. */
function fileOf(bytes: Uint8Array | string, name: string): string {
  const file = path.join(freshDir('input'), name)
  writeFileSync(file, bytes)
  return file
}

/** What `1c diff --json` prints. */
interface CliDiffReport {
  dims: { w: number; h: number }
  meanDiff: number
  pctOverThreshold: number
  bands: number[]
  regions: { id: number; bbox: { x: number; y: number; w: number; h: number }; meanDiff: number }[]
}

/** What `1c gate --json` prints. */
interface CliGateReport {
  pass: boolean
  verdict: string
  diagnosis: string
  nextStep: string
  floor: { mean: number; pct: number }
  perceptual: { meanDiff: number; pctOverThreshold: number; regions: number }
  values: { deltas: number; matched: number; unmatched: number }
  coverage: FidelityReport['coverage'] & { pageHeightPx: number }
}

/**
 * `1c gate` on the bundle at `dir`, judging the same draft picture and the same
 * live-page read the surface's browser returned — through the offline seams the
 * verb already has, so the CLI and the surface are handed identical inputs.
 */
function cliGate(dir: string, draft: Uint8Array, signals: RawSignals): Promise<CliGateReport> {
  return cliJson<CliGateReport>([
    'gate',
    '--ref',
    dir,
    '--actual-image',
    fileOf(draft, 'actual.png'),
    '--actual-manifest',
    fileOf(JSON.stringify(flattenSignals(structuredClone(signals), DRAFT_URL)), 'actual.json'),
    '--out',
    freshDir('gate-out'),
  ])
}

/**
 * The surface's report and the CLI's report are the same judgement. The CLI
 * rounds the two perceptual scalars to two places when it reports them, so those
 * are compared at the precision the CLI states; everything else is compared
 * exactly. `pageHeightPx` is the one coverage field the surface does not return.
 */
function expectSameJudgement(surface: FidelityReport, gate: CliGateReport): void {
  expect(surface.verdict).toBe(gate.verdict)
  expect(surface.pass).toBe(gate.pass)
  expect(surface.diagnosis).toBe(gate.diagnosis)
  expect(surface.nextStep).toBe(gate.nextStep)
  expect(surface.floor).toEqual(gate.floor)
  expect(surface.values).toEqual(gate.values)
  expect(round(surface.perceptual.meanDiff)).toBe(gate.perceptual.meanDiff)
  expect(round(surface.perceptual.pctOverThreshold)).toBe(gate.perceptual.pctOverThreshold)
  expect(surface.perceptual.regions).toBe(gate.perceptual.regions)
  const { pageHeightPx: _height, ...coverage } = gate.coverage
  expect(surface.coverage).toEqual(coverage)
}

describe('story-47fb84e6 — compare', () => {
  it('test_UAT_AC2036_compare_reports_exactly_the_1c_diff_verdict_with_regions_as_coordinates', async () => {
    const base = solid(80, 60, [30, 60, 90])
    const changed = withPatch(base, { x: 10, y: 10, w: 24, h: 24 }, [200, 60, 90])
    const refPng = await png(base)
    const draftPng = await png(changed)

    // One bundle, on disk, read by both: the surface through the store port and
    // `1c diff` through `--ref <bundleDir>`.
    const references = diskReferences()
    await seedBundle(references.store.bundle(BUNDLE), refPng)
    const box = await lookingBox(await deps(new Map([['/draft/', draftPng]]), references.store))

    // The assistant's call, through the composed Toolbox.
    const got = await viaToolbox<CompareResult>(box, 'compare', {
      a: { kind: 'reference', bundle: BUNDLE },
      b: { kind: 'draft' },
    })

    // `1c diff`'s verdict for the equivalent invocation — the CLI itself, over
    // the same reference bundle, with the very bytes the draft was shot as.
    const diff = await cliJson<CliDiffReport>([
      'diff',
      '--ref',
      references.dirOf(BUNDLE),
      '--actual',
      fileOf(draftPng, 'draft.png'),
      '--out',
      freshDir('diff-out'),
    ])

    expect(got.size).toEqual({ width: diff.dims.w, height: diff.dims.h })
    // The CLI reports its scalars to two places; at that precision they agree.
    expect(round(got.meanDifference)).toBe(diff.meanDiff)
    expect(round(got.percentDifferent)).toBe(diff.pctOverThreshold)
    expect(got.bands.map(round)).toEqual(diff.bands)
    // The regions are the CLI's regions, in its order, exactly.
    expect(got.regions.map((r) => r.rank)).toEqual(diff.regions.map((r) => r.id))
    expect(got.regions.map((r) => r.area)).toEqual(diff.regions.map((r) => r.bbox))
    expect(got.regions.map((r) => r.meanDifference)).toEqual(diff.regions.map((r) => r.meanDiff))

    // The patch is genuinely found, so the equality is not two empty answers.
    expect(diff.regions.length).toBeGreaterThan(0)
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
  }, 60000)

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

// ── bundles built to land on each verdict ────────────────────────────────────
//
// The same construction `1c gate`'s own UATs use (story-24098299): a ladder
// oracle the three-probe gate passes unless a run is pushed past the viewport,
// image assets the reference manifest does or does not attribute, and one
// reference run the value gate can raise a delta against when the reproduction
// does not carry it.

const LADDER = [320, 375, 768, 1024, 1280, 1440]

function oracleRun(text: string, box: ValueElement['box']): ValueElement {
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

/** One run per width; `overhangPx` pushes it past the viewport so the structural gate fails. */
function ladderOracle(overhangPx: number): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [oracleRun('Front door heading', { x: 20, y: 100, width: width - 40 + overhangPx, height: 48 })],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

function fixtureSection(content: ContentRun[]): Section {
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

function fixtureImage(n: number): CaptureAsset {
  return { id: `img-${n}`, kind: 'image', src: `https://fixture.test/media/${n}.jpg`, localPath: `assets/${n}.jpg` }
}

/** The reference run a reproduction that renders nothing fails to carry — a value delta. */
const HEADING: ContentRun = {
  role: 'heading',
  text: 'Front door heading',
  color: '#111827',
  fontFamily: 'Inter',
  fontSizePx: 40,
  fontWeight: 600,
}

interface VerdictBundle {
  /** Mirrored image assets no reference element attributes — a coverage finding when > 0. */
  unreferencedImages: number
  /** Whether the reference carries {@link HEADING}, which the draft does not. */
  heading: boolean
  /** Push the oracle's run past the viewport, so the structural gate fails. */
  overhangPx?: number
}

/** Write a bundle whose reference screenshot is 64×64 black. */
async function writeVerdictBundle(bundle: ReferenceBundle, spec: VerdictBundle): Promise<void> {
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-07-25T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
    sections: [fixtureSection(spec.heading ? [HEADING] : [])],
    assets: Array.from({ length: spec.unreferencedImages }, (_, i) => fixtureImage(i)),
  }
  await writeBundle(bundle, {
    capture,
    screenshot: await png(solid(64, 64, [0, 0, 0])),
    renderedHtml: '<html><body></body></html>',
    rawHtml: '<html><body></body></html>',
    assetBytes: new Map(),
  })
  await writeMultiState(bundle, ladderOracle(spec.overhangPx ?? 0))
}

/** A live page with nothing on it: the reproduction carries no value element at all. */
const EMPTY_PAGE: RawSignals = {
  viewport: { width: 1280, height: 900 },
  bands: [],
  colorUsage: [],
  fontFaces: [],
  typeScale: [],
  spacingScalePx: [],
  containerMaxWidthPx: null,
  images: [],
  bodyBackground: '#ffffff',
}

describe('story-47fb84e6 — check_fidelity', () => {
  it('test_UAT_AC2039_check_fidelity_returns_the_full_reconciled_report_over_the_real_bundle', async () => {
    const shot = await png(solid(40, 40, [7, 7, 7]))
    // One bundle, on disk, judged by both: the surface through the store port
    // and `1c gate` through `--ref <bundleDir>`.
    const references = diskReferences()
    await seedBundle(references.store.bundle(BUNDLE), shot)
    const page = signalsFor(VIEWPORTS.desktop.width)
    const box = await lookingBox(
      await deps(new Map([['/draft/', shot]]), references.store, undefined, page),
    )

    const report = await viaToolbox<FidelityReport>(box, 'check_fidelity', {
      actual: { kind: 'draft' },
      reference: BUNDLE,
    })

    // `1c gate` on the same bundle, handed the same draft picture and the same
    // read of the live page, reaches the same report.
    const gate = await cliGate(references.dirOf(BUNDLE), shot, page)
    expectSameJudgement(report, gate)
    expect(VERDICTS).toContain(gate.verdict)

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
  }, 60000)

  it('test_UAT_AC2040_each_of_the_five_verdicts_has_its_own_condition_and_next_step', async () => {
    // Every verdict is reached THROUGH check_fidelity — the composed Toolbox, the
    // real bundle, the real gates — and, for the very same bundle, draft picture
    // and live-page read, through `1c gate`. The two must agree on every one.
    const references = diskReferences()
    const bundles: Record<string, VerdictBundle> = {
      'fixture.test/broken': { unreferencedImages: 0, heading: false, overhangPx: 600 },
      'fixture.test/broken-everything': { unreferencedImages: 3, heading: true, overhangPx: 600 },
      'fixture.test/silent': { unreferencedImages: 0, heading: false },
      'fixture.test/impoverished': { unreferencedImages: 3, heading: false },
      'fixture.test/our-fault': { unreferencedImages: 0, heading: true },
    }
    for (const [name, spec] of Object.entries(bundles)) {
      await writeVerdictBundle(references.store.bundle(name), spec)
    }

    // A draft 4/255 off the black reference is within the perceptual floor; one
    // 200/255 off breaches it.
    const QUIET = 4
    const LOUD = 200
    const judge = async (name: string, grey: number): Promise<FidelityReport> => {
      const draft = await png(solid(64, 64, [grey, grey, grey]))
      const box = await lookingBox(
        await deps(new Map([['/draft/', draft]]), references.store, undefined, EMPTY_PAGE),
      )
      const surface = await viaToolbox<FidelityReport>(box, 'check_fidelity', {
        actual: { kind: 'draft' },
        reference: name,
      })
      expectSameJudgement(surface, await cliGate(references.dirOf(name), draft, EMPTY_PAGE))
      return surface
    }

    // structural-failure — the structural gate fails…
    const structural = await judge('fixture.test/broken', LOUD)
    expect(structural.verdict).toBe('structural-failure')
    // …and it wins whatever else holds: coverage findings, value deltas and a breach.
    const everything = await judge('fixture.test/broken-everything', LOUD)
    expect(everything.coverage.findings.length).toBeGreaterThan(0)
    expect(everything.values.deltas).toBeGreaterThan(0)
    expect(everything.verdict).toBe('structural-failure')

    // pass — structural gate passes and the floor holds; nothing outstanding.
    const pass = await judge('fixture.test/silent', QUIET)
    expect(pass.verdict).toBe('pass')
    expect(pass.values.deltas).toBe(0)
    expect(pass.nextStep.toLowerCase()).toContain('nothing outstanding')

    // pass with value deltas left — the next step names their count instead.
    const passWithDeltas = await judge('fixture.test/our-fault', QUIET)
    expect(passWithDeltas.verdict).toBe('pass')
    expect(passWithDeltas.values.deltas).toBeGreaterThan(0)
    expect(passWithDeltas.nextStep).toContain(`${passWithDeltas.values.deltas} delta(s)`)
    expect(passWithDeltas.nextStep.toLowerCase()).not.toContain('nothing outstanding')

    // capture-incomplete — floor breached, coverage has findings, no value deltas.
    const incomplete = await judge('fixture.test/impoverished', LOUD)
    expect(incomplete.verdict).toBe('capture-incomplete')
    expect(incomplete.coverage.findings.length).toBeGreaterThan(0)
    expect(incomplete.values.deltas).toBe(0)
    expect(incomplete.perceptual.pctOverThreshold).toBeGreaterThan(incomplete.floor.pct)
    expect(incomplete.nextStep).toMatch(/CAPTURE defect/)

    // reproduction-wrong — floor breached, coverage clean, value deltas present;
    // the next step names the count.
    const wrong = await judge('fixture.test/our-fault', LOUD)
    expect(wrong.verdict).toBe('reproduction-wrong')
    expect(wrong.coverage.findings).toEqual([])
    expect(wrong.values.deltas).toBeGreaterThan(0)
    expect(wrong.nextStep).toContain(`Work the ${wrong.values.deltas} `)

    // unexplained-disagreement — floor breached, coverage clean, no value deltas.
    const unexplained = await judge('fixture.test/silent', LOUD)
    expect(unexplained.verdict).toBe('unexplained-disagreement')
    expect(unexplained.coverage.findings).toEqual([])
    expect(unexplained.values.deltas).toBe(0)
    expect(unexplained.nextStep).toMatch(/FRAMEWORK gap/)

    expect(pass.pass).toBe(true)
    expect(passWithDeltas.pass).toBe(true)
    for (const v of [structural, everything, incomplete, wrong, unexplained]) expect(v.pass).toBe(false)

    // Five verdicts, five distinct next steps.
    const five = [structural, pass, incomplete, wrong, unexplained]
    expect(new Set(five.map((v) => v.verdict)).size).toBe(5)
    expect(new Set(five.map((v) => v.nextStep)).size).toBe(5)
  }, 180000)

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
