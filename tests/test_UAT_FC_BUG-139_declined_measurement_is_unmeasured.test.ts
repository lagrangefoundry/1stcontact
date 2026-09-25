/**
 * BUG-139 — a measurement the run DECLINED is counted as unmeasured.
 *
 * THE DEFECT, in one sentence: the comparator said out loud that it could not
 * make a measurement, and the number the round is told to drive down counted the
 * refusal as zero.
 *
 * REQ-270 taught the diff to refuse. `contentAnchorRatio` is a DOM-descendant
 * walk on the reference side and a geometric slice on ours, and those disagree
 * exactly when the reference's own sections overlap — an absolutely-positioned
 * header sitting over the hero is its own reference section, so the reference
 * excludes its runs from the hero's anchor and a geometric partition cannot. On
 * `gigabytealchemy.ai` that is 0.53 against 0.39 on byte-identical geometry, and
 * comparing them would blame the reproduction for a phantom 112px shift. So the
 * diff declines, which is right.
 *
 * What it could not do is make the refusal COST anything. The fact lived only in
 * `values-diff.json`'s `sectionPairing` array — which `gate.json` does not
 * summarise and no reader of the gate opens — so the console's four-part tally
 * had no part for it: not an axis (both sides can read `contentAnchorRatio`), not
 * a band (§1 paired, at IoU 1), not a population (nothing element-level), and not
 * a probe (that part read one GLOBAL string, set only in the flat-L1 degenerate
 * case). The headline printed `unmeasured 1 — 0 axes, 1 band, 0 populations, 0
 * probes` with no `≥` and no silent part, because every part the report carried
 * was counted. A refusal that costs nothing in the number a round is paid to
 * drive down is a refusal no round will ever be paid to fix.
 *
 * This is [[BUG-111]]'s hole one row over. That one closed the unpaired-band case
 * by lifting the fact out of the same array; this closes it for a band that DID
 * pair and lost one axis on it.
 *
 * WHAT IS EXERCISED. The whole chain the defect spans, through the real functions
 * at every seam: `diffManifests` (the refusal and its lift) → `reconcileGates`
 * (the `values` block and the pass rung) → `gate.json` on disk →
 * `readGateReport` → `unmeasuredOf` → `headlineOf`/`breakdownOf` → `buildPrompt`,
 * which is the surface the round actually reads. The manifests are synthetic
 * because the reference bundles are not in the repository, but they are the
 * gigabytealchemy shape the ticket was filed from, not a shape invented to make
 * the assertion easy.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { diffManifests, type SectionValues, type ValueManifest } from '../tools/generate/src/cli/capture'
import { formatGateReport, reconcileGates } from '../tools/generate/src/cli/gate'
import type { GateReport } from '../tools/generate/src/cli/gate'
import { breakdownOf, headlineOf, unmeasuredOf } from '../tools/repro-console/src/unmeasured'
import { buildPrompt, readGateReport, type RoundContext } from '../tools/repro-console/src/ai'

// ── the page, as the reference and the reproduction each see it ───────────────
//
// The gigabytealchemy shape: a 192px header painted OVER an 800px hero, which the
// reference records as its own band and a geometric partition of the reproduction
// cannot. Below it, a band both sides agree on — so the run is not a segmentation
// disaster, it is a healthy page with one band the anchor cannot be read on.

const HEADER = { x: 0, y: 0, width: 1280, height: 192 }
const HERO = { x: 0, y: 0, width: 1280, height: 800 }
const BELOW = { x: 0, y: 800, width: 1280, height: 500 }

const section = (s: Partial<SectionValues> & Pick<SectionValues, 'index'>): SectionValues =>
  ({ overlay: null, contentAnchorRatio: null, ...s }) as SectionValues

const manifest = (source: string, sections: SectionValues[]): ValueManifest =>
  ({ source, elements: [], sections, viewport: { width: 1280, height: 800 } }) as unknown as ValueManifest

/** The reference: header, hero, and the band below — the hero's anchor at 0.53. */
const overlappingReference = (): ValueManifest =>
  manifest('ref', [
    section({ index: 0, box: HEADER, contentAnchorRatio: null }),
    section({ index: 1, box: HERO, contentAnchorRatio: 0.53 }),
    section({ index: 2, box: BELOW, contentAnchorRatio: 0.5 }),
  ])

/** The same page with nothing overlapping — what closing the gap would look like. */
const flatReference = (): ValueManifest =>
  manifest('ref', [
    section({ index: 0, box: HERO, contentAnchorRatio: 0.53 }),
    section({ index: 1, box: BELOW, contentAnchorRatio: 0.5 }),
  ])

/** Our side: a geometric partition, two bands, the hero's anchor at 0.39. */
const reproduction = (): ValueManifest =>
  manifest('ours', [
    section({ index: 0, box: HERO, contentAnchorRatio: 0.39 }),
    section({ index: 1, box: BELOW, contentAnchorRatio: 0.5 }),
  ])

// ── the gate harness ─────────────────────────────────────────────────────────
//
// Every other gate clean and within its floor, so "passes, and is NOT silent" is
// the whole of what the assertions are about.

const CLEAN_COVERAGE = {
  mirroredImages: 0,
  referencedImages: 0,
  unreferencedImages: [],
  sections: 3,
  pageHeightPx: 1300,
  pxPerSection: 433,
  findings: [],
}

function gateOn(values: ReturnType<typeof diffManifests>): GateReport {
  return reconcileGates({
    l1Gate: { pass: true, onSample: { pass: true, byWidth: [{ width: 1280, findings: [] }] } },
    coverage: CLEAN_COVERAGE,
    perceptual: { meanDiff: 0, pctOverThreshold: 0, regions: [] },
    values,
  })
}

const dirs: string[] = []
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

/** `gate.json` where the console reads it, so the chain runs through a file. */
function writeGateReport(report: unknown): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'bug139-'))
  dirs.push(dir)
  const file = path.join(dir, 'gate.json')
  writeFileSync(file, JSON.stringify(report, null, 2))
  return file
}

/** The round's own prompt, built from the gate the way the console builds it. */
function promptFor(file: string): string {
  const gate = readGateReport(file)!
  return buildPrompt('BRIEF', {
    n: 5,
    slug: 'repro-gigabytealchemy-ai',
    originalUrl: 'https://gigabytealchemy.ai/',
    bundleDir: '/bundle',
    evidenceDir: path.dirname(file),
    pageDocument: '/page.json',
    siteDir: '/site',
    gate,
    rail: { summary: 'rail' },
    knownGaps: [],
  } as unknown as RoundContext)
}

// ── the behaviours ───────────────────────────────────────────────────────────

describe('BUG-139 a declined per-band measurement is counted as unmeasured', () => {
  it('test_UAT_FC_BUG-139_declined_band_measurement_is_lifted_out_of_section_pairing', () => {
    const diff = diffManifests(overlappingReference(), reproduction())

    // The refusal itself is REQ-270's and is unchanged: §1 paired (IoU 1) and its
    // anchor was declined rather than compared.
    const pairing = diff.sectionPairing.find((p) => p.label === '§1')!
    expect(pairing.actualLabel, 'the band DID pair — this is not the unpaired case').toBe('§0')
    expect(pairing.anchorComparable).toBe(false)

    // …and it now leaves the array in a shape a consumer that only COUNTS
    // declinations can read, which is the whole of the fix on the `1c` side.
    expect(diff.notComparableAxes).toEqual([
      { scope: '§1', axis: 'contentAnchor', reason: pairing.anchorReason },
    ])
    // Named, not inferred: the axis is what an operator acts on, and the reason
    // names the band that made it incomparable.
    expect(diff.notComparableAxes[0].reason).toContain('§0')

    // Derived from the same pass that decides it, so the lift cannot disagree with
    // the rows it summarises — one declining row, one entry.
    expect(diff.notComparableAxes.length).toBe(
      diff.sectionPairing.filter((p) => p.anchorComparable === false).length,
    )

    // PRESENT AND EMPTY on a page that declined nothing, never absent: an empty
    // array is the measurement "asked, and nothing was declined", and the console
    // reads an absent field as a report too old to speak for the fact at all.
    const clean = diffManifests(flatReference(), reproduction())
    expect(clean.notComparableAxes).toEqual([])
    expect(Object.keys(clean)).toContain('notComparableAxes')
  })

  it('test_UAT_FC_BUG-139_the_gate_carries_the_declination_and_a_passing_run_names_it', () => {
    const report = gateOn(diffManifests(overlappingReference(), reproduction()))

    // The run passes — pixels identical, no delta above the floor — which is
    // exactly the case the silence mattered in.
    expect(report.verdict).toBe('pass')
    expect(report.values.deltas, 'the declined anchor is not a delta, and must not become one').toBe(0)

    // `gate.json` carries it, where before this the only mention of `sectionPairing`
    // in the whole of `gate-core.ts` was a comment.
    expect(report.values.notComparableAxes).toEqual([
      { scope: '§1', axis: 'contentAnchor', reason: expect.stringContaining('§0') },
    ])

    // …and the pass rung says so, per band and per axis, beside the other five
    // ways a passing run can be not-silent.
    expect(report.nextStep).toContain('DECLINED rather than compared')
    expect(report.nextStep).toContain('§1.contentAnchor')
    expect(report.nextStep).toContain('`values.notComparableAxes`')

    // The operator's terminal read carries the same row, and is silent on a run
    // that declined nothing.
    expect(formatGateReport(report, 'gigabytealchemy.ai/index')).toContain('DECLINED rather than compared')
    expect(formatGateReport(gateOn(diffManifests(flatReference(), reproduction())), 'x')).not.toContain(
      'DECLINED rather than compared',
    )
  })

  it('test_UAT_FC_BUG-139_the_round_headline_counts_the_declination', () => {
    const file = writeGateReport(gateOn(diffManifests(overlappingReference(), reproduction())))
    const set = unmeasuredOf(JSON.parse(readFileSync(file, 'utf8')))

    // THE TICKET'S OWN ARITHMETIC. The run declined TWO measurements: §0 is
    // unpaired (the band part, which BUG-111 already counted) and §1's anchor is
    // declined (the probe part, which nothing counted).
    expect(headlineOf(set)).toBe('unmeasured 2')
    const parts = new Map(set.parts.map((p) => [p.id, p.count]))
    expect(parts.get('axes')).toBe(0)
    expect(parts.get('bands')).toBe(1)
    expect(parts.get('populations')).toBe(0)
    expect(parts.get('probes')).toBe(1)

    // …and the breakdown takes the number back to WHICH measurement, with the
    // reason, because "1 probe" alone is not something a round can act on.
    const breakdown = breakdownOf(set)
    expect(breakdown).toContain('1 probe (§1.contentAnchor — ')
    expect(breakdown).toContain('not the same measurement')
    // Nothing is silent — every part of this report is carried and counted.
    expect(set.silent).toEqual([])

    // The surface the round actually reads, through the console's own builder.
    const prompt = promptFor(file)
    expect(prompt).toContain('**unmeasured 2**')
    expect(prompt).toContain('This is the number to drive down')
    expect(prompt).toContain('§1.contentAnchor')
  })

  it('test_UAT_FC_BUG-139_a_report_that_cannot_speak_for_declinations_is_not_counted_as_zero', () => {
    const report = gateOn(diffManifests(overlappingReference(), reproduction())) as GateReport & {
      values: { notComparableAxes?: unknown }
    }

    // A report written before this field existed — the shape every gate.json
    // already on disk has.
    const values = { ...report.values }
    delete values.notComparableAxes
    const old = unmeasuredOf(JSON.parse(readFileSync(writeGateReport({ ...report, values }), 'utf8')))

    // CANNOT SAY, NOT NONE. Summing the missing part as zero would make the
    // field's ARRIVAL read as the unmeasured count going UP — a quantity showing
    // up reported as a movement in the thing it measures, which is the
    // false-progress inversion the whole module exists to refuse.
    expect(old.parts.find((p) => p.id === 'probes')!.count).toBeNull()
    expect(old.silent).toContain('probes')
    expect(headlineOf(old)).toBe('unmeasured ≥ 1')
    expect(breakdownOf(old)).toContain('not counted, and not zero')

    // The global all-bands refusal still counts BESIDE the per-band rows rather
    // than instead of them: they are the same kind of fact at two grains, and a
    // run carrying both has declined both.
    const both = unmeasuredOf({
      values: {
        ...report.values,
        sectionsNotComparable: 'the reproduction segments into ONE body-spanning band',
      },
    })
    expect(both.parts.find((p) => p.id === 'probes')!.count).toBe(2)
    expect(both.parts.find((p) => p.id === 'probes')!.detail).toContain('body-spanning band')
    expect(both.parts.find((p) => p.id === 'probes')!.detail).toContain('§1.contentAnchor')
  })

  it('test_UAT_FC_BUG-139_the_headline_falls_when_the_comparator_stops_declining', () => {
    // The point of counting it: the number MOVES when the refusal goes away, so a
    // round is paid for closing it. Same reproduction, a reference whose bands no
    // longer overlap — the anchor becomes comparable, and the two numbers that
    // were never compared become a delta the round can work.
    const before = unmeasuredOf(gateOn(diffManifests(overlappingReference(), reproduction())))
    const after = unmeasuredOf(gateOn(diffManifests(flatReference(), reproduction())))

    expect(before.total).toBe(2)
    expect(after.total).toBe(0)
    expect(after.parts.find((p) => p.id === 'probes')!.count).toBe(0)
    expect(after.silent, 'and the after-report speaks for every part').toEqual([])

    // WHAT "0" MEANS HERE, stated precisely, because the difference is the ticket's
    // whole point. With the overlap gone the anchor is COMPARED — and 0.53 against
    // 0.39 is the pair the ticket describes as silent "only because 0.14 happened to
    // fall 0.01 under the tolerance", so it reads clean rather than unmeasured. That
    // is a measurement that came back within bounds; the `1` above was no
    // measurement at all. A number that cannot tell those apart is the defect.
    const compared = diffManifests(flatReference(), reproduction())
    expect(compared.sectionPairing.find((p) => p.label === '§0')!.anchorComparable).toBeUndefined()
    expect(compared.notComparableAxes).toEqual([])
    expect(compared.deltas.filter((d) => d.property === 'contentAnchor')).toEqual([])

    // …and a gap the tolerance does NOT absorb still lands as the delta it is, so
    // dropping the declination does not trade one silence for another.
    const wide = diffManifests(flatReference(), manifest('ours', [
      section({ index: 0, box: HERO, contentAnchorRatio: 0.05 }),
      section({ index: 1, box: BELOW, contentAnchorRatio: 0.5 }),
    ]))
    expect(wide.deltas.filter((d) => d.property === 'contentAnchor').length).toBe(1)
  })
})
