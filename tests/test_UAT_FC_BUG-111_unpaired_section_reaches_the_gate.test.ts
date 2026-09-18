/**
 * BUG-111 — a reference section with no reproduction band was reported NOWHERE
 * the gate reads.
 *
 * BUG-102 classified it correctly: a band the other side does not segment is a
 * segmentation mismatch, not a value delta, so it produces no delta. The defect
 * is that it then produced nothing else either — no count, no coverage finding,
 * no rung on the pass report's `outstanding` list. The fact existed only as a
 * row in `values-diff.json`'s `sectionPairing`, which `gate.json` does not
 * summarise and no consumer of the gate opens.
 *
 * On the round this was filed from the reference had EIGHT sections and the
 * reproduction seven, and `1c gate` answered `"unmatched": 0`,
 * `"coverage": {"findings": []}`, `"verdict": "pass"` — `unmatched` being
 * expected-side ELEMENTS, which no band has ever been counted in. Read next to
 * `coverage.sections: 8` that says all eight bands were accounted for, and one
 * was not: reference §0, the 192px `position: absolute` header, carrying its own
 * `contentAnchorRatio: 0.66` and `textAlign: "left"` into nothing.
 *
 * Two levels here, because the fact has to survive two hops:
 *
 *   1. `diffManifests` — the counts exist on the report at all, on BOTH sides,
 *      carrying the geometry that locates the band;
 *   2. `cmdGate` — they reach `gate.json`, and the pass rung says so.
 *
 * The second is the ticket. The first is only how the second is possible.
 *
 * The reference geometry is the real evidence, transcribed as BUG-102's suite
 * transcribes it: `storage/references/gigabytealchemy.ai/index`'s widest rest
 * projection at 1280, whose `§0` (y 0…192, anchored 0.66) sits inside `§1` (the
 * hero, y 0…800). The bundle is untracked, so the numbers are inlined.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdGate,
  diffManifests,
  formatGateReport,
  formatReport,
  writeMultiState,
  writeRasterPng,
  type Capture,
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
import { fsReferenceBundle as fsBundle } from '../tools/generate/src/store/fs-reference-store'

// ── level 1 fixtures: the manifests, straight from the evidence ──────────────

const band = (index: number, y: number, height: number, over: Partial<SectionValues> = {}): SectionValues => ({
  index,
  overlay: null,
  contentAnchorRatio: 0.5,
  box: { x: 0, y, width: 1280, height },
  ...over,
})

const el = (text: string, y: number, height: number): ValueElement => ({
  text,
  role: 'body',
  color: '#000000',
  fontFamily: 'sans',
  fontSizePx: 18,
  fontWeight: 400,
  box: { x: 40, y, width: 600, height },
})

const manifest = (source: string, sections: SectionValues[], elements: ValueElement[] = []): ValueManifest => ({
  source,
  elements,
  sections,
})

/** gigabytealchemy.ai at 1280: eight sections, the header band over the hero. */
const REFERENCE_SECTIONS: SectionValues[] = [
  band(0, 0, 192, { contentAnchorRatio: 0.66, textAlign: 'left' }),
  band(1, 0, 800, { contentAnchorRatio: 0.53, overlay: { color: '#030717', opacity: 0.3 } }),
  band(2, 800, 487.5),
  band(3, 1287.5, 594.5),
  band(4, 1882, 1257.25),
  band(5, 3139.25, 548.75),
  band(6, 3688, 572),
  band(7, 4260, 116),
]

/** The reproduction's bands: no separate header, and no band for §6 at all. */
const REPRO_BANDS: SectionValues[] = [
  band(0, 0, 800, { contentAnchorRatio: 0.53, overlay: { color: '#030717', opacity: 0.3 } }),
  band(1, 800, 488),
  band(2, 1288, 594),
  band(3, 1882, 1257),
  band(4, 3139, 549),
  band(5, 4260, 116),
]

describe('BUG-111 — the values report counts the bands that went uncompared', () => {
  it('test_UAT_FC_BUG-111_unpaired_reference_sections_are_counted_with_their_geometry', () => {
    // The count the gate had nothing to read. `§0` (the 192px header the
    // reproduction folds into its hero) and `§6` (which the reproduction has no
    // band for at all) are both uncompared, and each carries the box that says
    // where on the page it sat — so a reader is not sent back to `sectionPairing`
    // to look it up, which is the trip this ticket exists to remove.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    expect(report.unpairedSections.map((s) => s.label)).toEqual(['§0', '§6'])
    expect(report.unpairedSections[0].box).toEqual({ x: 0, y: 0, width: 1280, height: 192 })
    expect(report.unpairedSections[1].box).toEqual({ x: 0, y: 3688, width: 1280, height: 572 })
    // BUG-102's classification is untouched: counted, still not a delta.
    expect(report.deltas.filter((d) => d.text === '§0' || d.text === '§6')).toEqual([])
  })

  it('test_UAT_FC_BUG-111_the_counts_agree_with_the_pairing_rows_they_summarise', () => {
    // Derived from the same pairing pass rather than recomputed, so the summary
    // and the rows it summarises cannot drift apart.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    expect(report.unpairedSections.map((s) => s.label)).toEqual(
      report.sectionPairing.filter((p) => p.actualLabel === null).map((p) => p.label),
    )
    expect(report.unpairedSections.length + report.sectionPairing.filter((p) => p.actualLabel).length).toBe(
      REFERENCE_SECTIONS.length,
    )
  })

  it('test_UAT_FC_BUG-111_repro_bands_with_no_reference_section_are_counted_too', () => {
    // The reference-side count alone would read as "the reproduction has fewer
    // bands". A page that segments DIFFERENTLY rather than more coarsely has
    // bands with no counterpart on BOTH sides, and the repro side was visible
    // nowhere at all — not even in `sectionPairing`, which only ever had a row
    // per reference section.
    const extraBand = band(6, 5000, 300)
    const report = diffManifests(
      manifest('ref', REFERENCE_SECTIONS),
      manifest('repro', [...REPRO_BANDS, extraBand]),
    )

    expect(report.unpairedActualSections.map((s) => s.label)).toEqual(['§6'])
    expect(report.unpairedActualSections[0].box).toEqual({ x: 0, y: 5000, width: 1280, height: 300 })
    // Symmetric, not a replacement: the reference side still reports its own.
    expect(report.unpairedSections.map((s) => s.label)).toEqual(['§0', '§6'])
  })

  it('test_UAT_FC_BUG-111_a_page_that_segments_the_same_reports_nothing', () => {
    // The counts are EARNED, not decorative. Two sides that segment identically
    // leave both lists empty, so a non-zero count always means a band really did
    // go uncompared.
    const report = diffManifests(manifest('ref', REPRO_BANDS), manifest('repro', REPRO_BANDS))

    expect(report.unpairedSections).toEqual([])
    expect(report.unpairedActualSections).toEqual([])
  })

  it('test_UAT_FC_BUG-111_flat_l1_stays_a_single_reason_not_eight_counts', () => {
    // BUG-102's flat-L1 verdict stands in for the whole per-section pass: the
    // reproduction is ONE body-spanning band, so the reference's eight sections
    // have nothing to compare against and `sectionsNotComparable` says so once.
    // Counting eight unpaired sections underneath it would be louder noise than
    // the single reason above them, and the one repro band is not "extra" — it
    // is the reason.
    const elements = [el('Hero heading', 320, 60), el('Footer note', 4300, 40)]
    const report = diffManifests(
      manifest('ref', REFERENCE_SECTIONS, elements),
      manifest('repro', [band(0, 0, 4376)], elements),
    )

    expect(report.sectionsNotComparable).toMatch(/ONE body-spanning band/)
    expect(report.unpairedSections).toEqual([])
    expect(report.unpairedActualSections).toEqual([])
  })

  it('test_UAT_FC_BUG-111_the_printed_values_report_names_both_sides', () => {
    // `1c values-diff`'s own text already named the reference side; the repro
    // side it never named. Both now, read off the report's counts rather than
    // re-derived here, so this text and the gate's rung cannot disagree.
    const text = formatReport(
      diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', [...REPRO_BANDS, band(6, 5000, 300)])),
    )

    expect(text).toMatch(/UNPAIRED SECTIONS\s+2 reference section\(s\)[^\n]*1 repro band\(s\)/)
    expect(text).toContain('ref only    §0 y 0…192')
    expect(text).toContain('repro only  §6 y 5000…5300')
  })
})

// ── level 2 fixtures: a real bundle, driven through the real `cmdGate` ───────

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug111-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

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
 * One ladder band, spanning the viewport width at every rung — pinned to a single
 * width it overflows the narrow rungs and the off-sample probe reads it as a
 * structural failure, which decides the verdict before the pass rung this suite
 * is about is ever reached.
 */
function bandValues(index: number, width: number): SectionValues {
  return { index, overlay: null, contentAnchorRatio: null, box: { x: 0, y: index * 400, width, height: 400 } }
}

/** A reference bundle with one 400px band per heading, at y 0, 400, 800 … */
async function writeBundle(headings: string[]): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const runs = headings.map(heading)
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-09-17T00:00:00.000Z',
    // REQ-270 — the stamp a bundle from the CURRENT extractor carries. Without it
    // coverage would (correctly) report `stale-capture`, and this suite would be
    // asserting against a bundle no live capture produces.
    captureSchema: CAPTURE_SCHEMA,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: runs.map((run, i) => captureSection(i, run)),
    assets: [],
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

function flat(w: number, h: number, value: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(value)
  return { data, width: w, height: h, channels: 3 }
}

/** Identical to the reference's shot, so the eye is within its floor and the run reaches the pass rung. */
async function actualShot(): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(flat(64, 64, 0), file)
  return file
}

/**
 * Our reproduction: every reference heading, so the ELEMENT pairing is clean and
 * the verdict is `pass` — and whichever band indices are named, so the SECTION
 * pairing is not. That gap is the whole fixture.
 */
function actualManifest(headings: string[], bandIndices: number[]): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  const manifest: ValueManifest = {
    source: 'draft:fixture',
    elements: headings.map((t, i) => reproOf(heading(t), { x: 20, y: i * 400 + 100, width: 1240, height: 48 })),
    sections: bandIndices.map((i, n) => ({ ...bandValues(i, 1280), index: n })),
  }
  writeFileSync(file, JSON.stringify(manifest))
  return file
}

// ── the ticket ──────────────────────────────────────────────────────────────

describe('BUG-111 — a passing gate names the reference band it never compared', () => {
  it('test_UAT_FC_BUG-111_gate_report_carries_the_unpaired_section_count', async () => {
    // The filed shape, end to end: three reference bands, a reproduction that
    // renders all three headings but segments into only two, at y 0 and y 800.
    // Every element pairs, the eye is quiet, the verdict is `pass` — and the
    // middle band (y 400…800) was never compared by anything. `gate.json` had no
    // field to say so, so `"unmatched": 0` sat two keys above `"sections": 3`
    // and read as "all three accounted for".
    const ref = await writeBundle(['One', 'Two', 'Three'])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2]),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('pass')
    expect(report.values.unmatched).toBe(0)
    expect(report.coverage.sections).toBe(3)
    expect(report.values.unpairedSections).toBe(1)
    expect(report.values.unpairedActualSections).toBe(0)
  })

  it('test_UAT_FC_BUG-111_the_pass_rung_names_it_in_its_outstanding_list', async () => {
    // The rung is the ticket. `outstanding` had one entry for deltas, one for
    // unpaired repro objects, one for `notComparable` and one for coverage
    // findings — and none for a band that went uncompared, so a run carrying one
    // and nothing else answered "Nothing outstanding from this gate."
    const ref = await writeBundle(['One', 'Two', 'Three'])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2]),
      out: freshDir('out'),
    })

    expect(report.nextStep).not.toBe('Nothing outstanding from this gate.')
    expect(report.nextStep).toMatch(/1 reference section\(s\) had no reproduction band to compare against/)
    expect(report.nextStep).toContain('`values.unpairedSections`')
    expect(report.nextStep).toMatch(/UNMEASURED rather than clean/)
  })

  it('test_UAT_FC_BUG-111_the_repro_side_gets_the_same_rung', async () => {
    // Symmetric, and one rung rather than two: the two counts are the same fact
    // seen from either side — the pages segment differently — and splitting them
    // would put two near-identical lines in a list whose whole value is that an
    // operator skims it.
    const ref = await writeBundle(['One', 'Two', 'Three'])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2, 7]),
      out: freshDir('out'),
    })

    expect(report.values.unpairedSections).toBe(1)
    expect(report.values.unpairedActualSections).toBe(1)
    expect(report.nextStep).toMatch(
      /1 reference section\(s\) had no reproduction band[^;]*and 1 reproduction band\(s\) had no reference section/,
    )
  })

  it('test_UAT_FC_BUG-111_a_run_whose_bands_all_pair_still_says_nothing_outstanding', async () => {
    // Not a permanent diagnostic row. A reproduction that segments exactly as the
    // reference does reads as it always did, and the verdict ladder is untouched:
    // an unpaired band is reported, never escalated (whether it should decide a
    // verdict is BUG-110's question, not this one).
    const ref = await writeBundle(['One', 'Two', 'Three'])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 1, 2]),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('pass')
    expect(report.pass).toBe(true)
    expect(report.values.unpairedSections).toBe(0)
    expect(report.values.unpairedActualSections).toBe(0)
    expect(report.nextStep).toBe('Nothing outstanding from this gate.')
  })

  it('test_UAT_FC_BUG-111_the_operator_report_prints_it_on_the_values_line', async () => {
    // An operator reading the terminal sees what the JSON carries. The counts on
    // the `values-diff` line above are about ELEMENTS — a band with no
    // counterpart is invisible in every one of them, and used to be visible only
    // by opening `values-diff.json` and reading `sectionPairing` by hand.
    const ref = await writeBundle(['One', 'Two', 'Three'])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2]),
      out: freshDir('out'),
    })

    const text = formatGateReport(report, ref)
    expect(text).toMatch(/1 reference section\(s\) and 0 repro band\(s\) had no counterpart/)
    expect(text).toMatch(/UNMEASURED, not clean/)
  })
})
