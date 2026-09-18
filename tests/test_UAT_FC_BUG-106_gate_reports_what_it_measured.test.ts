import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdGate,
  formatGateReport,
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
import { fsReferenceBundle as fsBundle } from '../tools/generate/src/store/fs-reference-store'

/**
 * UATs for BUG-106 — a `pass` reports "0 deltas, 0 unmatched" when the value
 * gate measured nothing.
 *
 * The defect: `GateReport.values` was `Pick<ValuesDiffReport, 'deltas' |
 * 'matched' | 'unmatched'>`, so the two facts that say what those counts are
 * WORTH were structurally excluded — `unpairedActual` (repro objects that paired
 * with nothing, where `unmatched` counts the expected side only) and
 * `sectionsNotComparable` (BUG-102's verdict that the two pages' sections could
 * not be lined up at all, so every section-level value behind `deltas` is
 * UNMEASURED rather than clean). On top of that the pass rung set its `nextStep`
 * from the delta count alone, so it emitted "Nothing outstanding from this
 * gate." two keys above a `coverage.findings` entry in the same JSON.
 *
 * These drive the real `cmdGate` through the same offline seams BUG-100's suite
 * uses — a synthetic bundle, a pre-shot actual PNG and a pre-extracted actual
 * manifest — so there is no headless browser and nothing we own is mocked.
 */

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug106-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders ─────────────────────────────────────────────────────────

/** The one text run every reference band in this suite carries. */
function heading(text: string): ContentRun {
  return { role: 'heading', text, color: '#111827', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 600 }
}

/** The reproduction's copy of a reference run — same fields, so it pairs clean. */
function reproOf(run: ContentRun, box: ValueElement['box']): ValueElement {
  return {
    text: run.text,
    role: run.role,
    color: run.color,
    fontFamily: run.fontFamily,
    fontSizePx: run.fontSizePx,
    fontWeight: run.fontWeight,
    box,
  }
}

/** A run the reference never had — an object OUR side renders and theirs does not. */
function extraRepro(text: string, box: ValueElement['box']): ValueElement {
  return {
    text,
    role: 'body',
    color: '#334155',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    box,
  }
}

function captureSection(index: number, run: ContentRun): Section {
  return {
    box: { x: 0, y: index * 400, width: 1280, height: 400 },
    screenshot: { x: 0, y: index * 400, width: 1280, height: 400 },
    background: { kind: 'color', color: '#ffffff' },
    layout: {
      textOverImage: false,
      contentAlign: 'left',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio: null,
    },
    content: [run],
    items: [],
    fields: [],
  }
}

/**
 * One ladder band, sized to the rung it is captured at. The box spans the
 * viewport width at every width on the ladder for the reason BUG-100's fixture
 * gives: a band pinned to one width overflows the narrow rungs and the
 * off-sample probe reads it as a structural failure, which decides the verdict
 * before the pass rung this suite is about is ever reached.
 */
function bandValues(index: number, width: number): SectionValues {
  return { index, overlay: null, contentAnchorRatio: null, box: { x: 0, y: index * 400, width, height: 400 } }
}

interface BundleSpec {
  /** One reference band per entry, each carrying that heading. */
  headings: string[]
  /** Mirrored image assets the capture kept bytes for (an orphan → a coverage finding). */
  assets?: CaptureAsset[]
}

async function writeBundle(spec: BundleSpec): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const runs = spec.headings.map(heading)
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-09-17T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: runs.map((run, i) => captureSection(i, run)),
    assets: spec.assets ?? [],
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))

  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections: runs.map((_, i) => bandValues(i, width)),
      elements: runs.map((run, i) => reproOf(run, { x: 20, y: i * 400 + 100, width: width - 40, height: 48 })),
    } satisfies ValueManifest,
  }))
  const oracle: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }
  await writeMultiState(fsBundle(dir), oracle)
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

/** A uniform raster — the perceptual eye's pixel input. */
function flat(w: number, h: number, value: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(value)
  return { data, width: w, height: h, channels: 3 }
}

/**
 * Our reproduction's screenshot. `0` is identical to the reference's, so the eye
 * is within its floor and the run reaches the `pass` rung — which is the rung
 * this whole suite is about.
 */
async function actualShot(value: number): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(flat(64, 64, value), file)
  return file
}

interface ActualSpec {
  headings: string[]
  /** Runs the reference never had — each one lands in `unpairedActual`. */
  extras?: string[]
  /**
   * When true the reproduction is ONE body-spanning band — the flat-L1 shape
   * BUG-102 named, which makes the reference's sections not comparable at all.
   * When false it carries no band geometry, so the sections join normally.
   */
  flat?: boolean
}

function actualManifest(spec: ActualSpec): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  const elements: ValueElement[] = [
    ...spec.headings.map((t, i) => reproOf(heading(t), { x: 20, y: i * 400 + 100, width: 1240, height: 48 })),
    ...(spec.extras ?? []).map((t, i) => extraRepro(t, { x: 20, y: i * 60 + 1400, width: 600, height: 24 })),
  ]
  let bottom = 0
  for (const el of elements) if (el.box) bottom = Math.max(bottom, el.box.y + el.box.height)
  const sections: SectionValues[] = spec.flat
    ? [{ index: 0, overlay: null, contentAnchorRatio: null, box: { x: 0, y: 0, width: 1280, height: bottom + 40 } }]
    : []
  const manifest: ValueManifest = { source: 'draft:fixture', elements, sections }
  writeFileSync(file, JSON.stringify(manifest))
  return file
}

function imageAsset(src: string, localPath: string): CaptureAsset {
  return { id: `img-${localPath}`, kind: 'image', src, localPath }
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('BUG-106 — a passing gate says what it did not measure', () => {
  it('test_UAT_FC_BUG-106_pass_carries_the_not_comparable_reason', async () => {
    // The shape the ticket was filed from: the reproduction segments into ONE
    // body-spanning band, so the reference's sections have no band to be
    // compared against and every section-level value behind `deltas: 0` is
    // UNMEASURED. `gate.json` had nowhere to put that, so a reader of it alone
    // could not tell "measured everything, found nothing" from "measured
    // nothing".
    const ref = await writeBundle({ headings: ['One', 'Two', 'Three'] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest({ headings: ['One', 'Two', 'Three'], flat: true }),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('pass')
    expect(report.values.deltas).toBe(0)
    expect(report.values.sectionsNotComparable).toMatch(/UNMEASURED here, not clean/)
    expect(report.nextStep).not.toBe('Nothing outstanding from this gate.')
    expect(report.nextStep).toMatch(/section-level values were NOT compared/)
  })

  it('test_UAT_FC_BUG-106_pass_counts_unpaired_repro_objects', async () => {
    // `unmatched` counts unpaired EXPECTED objects only, so a reproduction that
    // renders objects the reference does not have read as a complete match. The
    // repro-side count is now carried alongside it rather than dropped.
    const ref = await writeBundle({ headings: ['One', 'Two'] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest({
        headings: ['One', 'Two'],
        extras: ['Phantom one', 'Phantom two'],
        flat: true,
      }),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('pass')
    expect(report.values.unmatched).toBe(0)
    expect(report.values.unpairedActual).toBe(2)
    expect(report.nextStep).toMatch(/2 repro object\(s\) paired with NOTHING/)
  })

  it('test_UAT_FC_BUG-106_pass_names_the_coverage_finding_it_is_carrying', async () => {
    // The third way the old sentence was false: "Nothing outstanding from this
    // gate." was emitted from the delta count alone, two keys above a
    // `coverage.findings` entry in the same JSON. The mirrored asset here is
    // named by nothing in the manifest, which is the genuine escalation BUG-100
    // left intact.
    const ref = await writeBundle({
      headings: ['One'],
      assets: [imageAsset('https://fixture.test/media/orphan.jpg', 'assets/orphan.jpg')],
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest({ headings: ['One'] }),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('pass')
    expect(report.coverage.findings.map((f) => f.kind)).toEqual(['unreferenced-image'])
    expect(report.nextStep).not.toBe('Nothing outstanding from this gate.')
    expect(report.nextStep).toMatch(/reference coverage reports `unreferenced-image`/)
  })

  it('test_UAT_FC_BUG-106_a_genuinely_silent_pass_still_says_nothing_outstanding', async () => {
    // The sentence is not removed, it is EARNED. A run with no deltas, no
    // unpaired repro objects, comparable sections and clean coverage still
    // reads exactly as it did — and the verdict ladder is untouched.
    const ref = await writeBundle({ headings: ['One', 'Two'] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest({ headings: ['One', 'Two'] }),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('pass')
    expect(report.pass).toBe(true)
    expect(report.values).toMatchObject({ deltas: 0, unmatched: 0, unpairedActual: 0 })
    expect(report.values.sectionsNotComparable).toBeUndefined()
    expect(report.coverage.findings).toEqual([])
    expect(report.nextStep).toBe('Nothing outstanding from this gate.')
  })

  it('test_UAT_FC_BUG-106_the_human_report_prints_both_facts', async () => {
    // An operator reading the terminal sees what the JSON carries, without
    // having to open `values-diff.json` to find out the counts were hollow.
    const ref = await writeBundle({ headings: ['One', 'Two'] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest({ headings: ['One', 'Two'], extras: ['Phantom'], flat: true }),
      out: freshDir('out'),
    })
    const text = formatGateReport(report, ref)

    expect(text).toMatch(/1 repro object\(s\) unpaired/)
    expect(text).toMatch(/section values NOT comparable/)
  })

  it('test_UAT_FC_BUG-106_the_verdict_ladder_is_unchanged', async () => {
    // Nothing here decides a verdict. Under a breaching perceptual eye the same
    // unreferenced asset still outranks the value-delta count and still reads
    // `capture-incomplete` — the rung order BUG-100's suite pins is intact.
    const ref = await writeBundle({
      headings: ['One', 'Two'],
      assets: [imageAsset('https://fixture.test/media/orphan.jpg', 'assets/orphan.jpg')],
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest({ headings: ['One', 'Two'], extras: ['Phantom'], flat: true }),
      out: freshDir('out'),
    })

    expect(report.perceptualBreach).toBe(true)
    expect(report.verdict).toBe('capture-incomplete')
    // …and the facts are carried on every verdict, not only on a pass.
    expect(report.values.unpairedActual).toBe(1)
    expect(report.values.sectionsNotComparable).toBeTruthy()
  })
})
