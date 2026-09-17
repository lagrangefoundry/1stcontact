/**
 * BUG-102 — `values-diff` joined the two sides' section-level values by ORDINAL
 * INDEX, so `§n` on the reference was not `§n` on the reproduction and every
 * section-level delta (`overlay`, `contentAnchor`, `textAlign`) was computed
 * between unrelated bands.
 *
 * The join is now by band GEOMETRY — vertical overlap in the shared full-page
 * document coordinate space — with three consequences these UATs pin:
 *
 *   1. a reference section whose only ordinal partner is an unrelated band is
 *      reported UNPAIRED instead of compared against it;
 *   2. a reproduction that segments into one body-spanning band (what every L1
 *      render is: the extractor's bands are the `<body>` children, and an L1
 *      render emits exactly one) reports section values NOT COMPARABLE, once,
 *      instead of a false delta on `§0` and silence on the rest;
 *   3. neither is a delta, so `1c values-diff`'s exit code is unchanged.
 *
 * The reference geometry below is transcribed from the real evidence in the
 * ticket: `storage/references/gigabytealchemy.ai/index/multistate.json`, the
 * widest-rest projection at 1280 — eight sections, whose `§0` (the page's
 * `position: absolute` header, y 0…192, anchored 0.66) sits inside `§1` (the
 * hero, y 0…800, anchored 0.53, carrying the scrim). The bundle is untracked,
 * so the numbers are inlined rather than read from disk.
 */
import { describe, expect, it } from 'vitest'
import {
  diffManifests,
  formatReport,
  type SectionValues,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

// ── fixtures ─────────────────────────────────────────────────────────────────

const band = (index: number, y: number, height: number, over: Partial<SectionValues> = {}): SectionValues => ({
  index,
  overlay: null,
  contentAnchorRatio: 0.5,
  box: { x: 0, y, width: 1280, height },
  ...over,
})

/** A text element, so a manifest has a painted extent to measure a band against. */
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

/** The reference: gigabytealchemy.ai at 1280, eight sections, header over hero. */
const REFERENCE_SECTIONS: SectionValues[] = [
  band(0, 0, 192, { contentAnchorRatio: 0.66 }),
  band(1, 0, 800, { contentAnchorRatio: 0.53, overlay: { color: '#030717', opacity: 0.3 } }),
  band(2, 800, 487.5),
  band(3, 1287.5, 594.5),
  band(4, 1882, 1257.25),
  band(5, 3139.25, 548.75),
  band(6, 3688, 572),
  band(7, 4260, 116),
]

/** A reproduction that DOES segment: the six L1 bands the ticket lists. */
const REPRO_BANDS: SectionValues[] = [
  band(0, 0, 800, { contentAnchorRatio: 0.53, overlay: { color: '#030717', opacity: 0.3 } }),
  band(1, 800, 488),
  band(2, 1288, 594),
  band(3, 1882, 1257),
  band(4, 3139, 549),
  band(5, 4260, 116),
]

const sectionDeltas = (report: { deltas: { role: string; text: string; property: string }[] }) =>
  report.deltas.filter((d) => d.role === 'section')

const pairingFor = (report: { sectionPairing: { label: string }[] }, label: string) =>
  report.sectionPairing.find((s) => s.label === label)

describe('BUG-102 — section-level values join by geometry, not by ordinal index', () => {
  it('test_UAT_FC_BUG-102_header_strip_does_not_pair_with_the_hero_band', () => {
    // The reference's 192px header strip and its 800px hero both start at y 0.
    // Ordinally, `§0` took the reproduction's hero band and produced a
    // `contentAnchor` delta of |0.66 − 0.50|. By geometry the hero band belongs to
    // `§1` (vertical IoU 1.0, against the header's 0.24), so `§0` has no
    // counterpart and the false delta is gone.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    expect(sectionDeltas(report).filter((d) => d.text === '§0')).toEqual([])
    expect(pairingFor(report, '§0')?.actualLabel).toBeNull()
    expect(pairingFor(report, '§1')?.actualLabel).toBe('§0')
    expect(pairingFor(report, '§1')?.overlap).toBeCloseTo(1, 2)
  })

  it('test_UAT_FC_BUG-102_every_paired_section_overlaps_in_the_page', () => {
    // The whole point of the join: a pairing that exists is a pairing between two
    // bands that occupy the same region of the document. Each reference section
    // below the header lands on the band at its own geometry, in order.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    const paired = report.sectionPairing.filter((s) => s.actualLabel !== null)
    expect(paired.map((s) => `${s.label}→${s.actualLabel}`)).toEqual([
      '§1→§0',
      '§2→§1',
      '§3→§2',
      '§4→§3',
      '§5→§4',
      '§7→§5',
    ])
    for (const s of paired) expect(s.overlap).toBeGreaterThanOrEqual(0.5)
  })

  it('test_UAT_FC_BUG-102_unpaired_reference_section_is_reported_not_deltaed', () => {
    // A section with no overlapping partner IS the finding worth reporting — but a
    // segmentation mismatch is not a value delta, so it stays out of `deltas` and
    // out of the exit code. `§0` (the header) and `§6` (y 3688…4260, which the
    // reproduction has no band for at all) are both named, with their geometry.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    const unpaired = report.sectionPairing.filter((s) => s.actualLabel === null)
    expect(unpaired.map((s) => s.label)).toEqual(['§0', '§6'])
    expect(unpaired.map((s) => s.overlap)).toEqual([0, 0])
    expect(unpaired[0].box).toEqual({ x: 0, y: 0, width: 1280, height: 192 })
    expect(unpaired[1].box).toEqual({ x: 0, y: 3688, width: 1280, height: 572 })
    // Reported, not deltaed.
    expect(report.deltas.filter((d) => d.text === '§0' || d.text === '§6')).toEqual([])
    expect(report.sectionsNotComparable).toBeUndefined()
  })

  it('test_UAT_FC_BUG-102_paired_sections_still_diff_overlay_anchor_and_align', () => {
    // This ticket changes WHICH two sections are compared, never HOW. A repro band
    // that overlaps its reference section still diffs on all three section axes.
    const expected = manifest('ref', [
      band(0, 0, 800, {
        contentAnchorRatio: 0.82,
        overlay: { color: '#020617', opacity: 0.45 },
        textAlign: 'center',
      }),
    ])
    const actual = manifest('repro', [
      band(0, 0, 790, { contentAnchorRatio: 0.4, overlay: null, textAlign: 'left' }),
    ])

    const report = diffManifests(expected, actual)
    expect(sectionDeltas(report).map((d) => d.property).sort()).toEqual([
      'contentAnchor',
      'overlay',
      'textAlign',
    ])
    expect(pairingFor(report, '§0')?.actualLabel).toBe('§0')
  })

  it('test_UAT_FC_BUG-102_sections_without_geometry_keep_the_ordinal_join', () => {
    // Pre-REQ-88 manifests carried `box` on image bands only. Geometry pairing needs
    // it on every section of both sides; without it the documented fallback is the
    // old ordinal join — silently comparing nothing would be worse.
    const noBox = (index: number, over: Partial<SectionValues>): SectionValues => ({
      index,
      overlay: null,
      contentAnchorRatio: null,
      ...over,
    })
    const report = diffManifests(
      manifest('ref', [noBox(0, { overlay: { color: '#020617', opacity: 0.45 } })]),
      manifest('repro', [noBox(0, { overlay: null })]),
    )

    expect(sectionDeltas(report).map((d) => `${d.text}:${d.property}`)).toEqual(['§0:overlay'])
    expect(pairingFor(report, '§0')?.actualLabel).toBe('§0')
    // No geometry to score the ordinal pair with.
    expect(pairingFor(report, '§0')?.overlap).toBe(0)
  })

  it('test_UAT_FC_BUG-102_flat_l1_reproduction_reports_sections_not_comparable', () => {
    // What every L1 reproduction actually is today: `<body>` holds ONE element, so
    // the extractor's band scan yields ONE band spanning the whole page. `§0` was
    // being compared against the entire document and `§1 … §7` were skipped in
    // silence. Say it once, plainly — and emit no per-section rows, which would be
    // eight lines about the reproduction's DOM shape rather than its fidelity.
    const elements = [el('Hero heading', 320, 60), el('Footer note', 4300, 40)]
    const report = diffManifests(
      manifest('ref', REFERENCE_SECTIONS, elements),
      manifest('repro', [band(0, 0, 4376, { contentAnchorRatio: 0.5 })], elements),
    )

    expect(report.sectionsNotComparable).toMatch(/ONE body-spanning band/)
    expect(report.sectionsNotComparable).toMatch(/UNMEASURED/)
    expect(report.sectionPairing).toEqual([])
    expect(sectionDeltas(report)).toEqual([])
  })

  it('test_UAT_FC_BUG-102_not_comparable_is_a_report_fact_not_a_delta', () => {
    // Exit semantics are unchanged: `1c values-diff` exits non-zero on any delta, so
    // a permanent diagnostic row would fail a clean page forever. A reproduction that
    // matches the reference element-for-element still reports ZERO deltas while
    // saying its sections could not be compared.
    const elements = [el('Hero heading', 320, 60), el('Footer note', 4300, 40)]
    const report = diffManifests(
      manifest('ref', REFERENCE_SECTIONS, elements),
      manifest('repro', [band(0, 0, 4376)], elements),
    )

    expect(report.deltas).toEqual([])
    expect(report.sectionsNotComparable).toBeDefined()
  })

  it('test_UAT_FC_BUG-102_one_band_that_is_not_page_spanning_still_pairs', () => {
    // The not-comparable verdict is about a body-spanning wrapper, not about the
    // section COUNT. A reproduction whose single band covers only part of its own
    // painted extent is a real band: it pairs by geometry like any other, and the
    // reference sections it does not overlap are reported unpaired.
    const elements = [el('Hero heading', 320, 60), el('Footer note', 4300, 40)]
    const report = diffManifests(
      manifest('ref', REFERENCE_SECTIONS, elements),
      manifest('repro', [band(0, 0, 800, { contentAnchorRatio: 0.53 })], elements),
    )

    expect(report.sectionsNotComparable).toBeUndefined()
    expect(pairingFor(report, '§1')?.actualLabel).toBe('§0')
    expect(pairingFor(report, '§0')?.actualLabel).toBeNull()
    expect(report.sectionPairing.filter((s) => s.actualLabel !== null)).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-102_a_repro_band_is_claimed_by_one_reference_section', () => {
    // One-to-one, best-overlap-first. Two reference sections both overlap the single
    // repro band; the better overlap takes it and the other is unpaired, rather than
    // both being compared against the same band.
    // The footer element puts the page's painted extent well below the band, so
    // this is a real band rather than the body-spanning wrapper of the case above.
    const elements = [el('Hero heading', 320, 60), el('Footer note', 4300, 40)]
    const report = diffManifests(
      manifest('ref', [band(0, 0, 192, { contentAnchorRatio: 0.66 }), band(1, 0, 800, { contentAnchorRatio: 0.53 })], elements),
      manifest('repro', [band(0, 0, 780, { contentAnchorRatio: 0.53 })], elements),
    )

    const claimed = report.sectionPairing.filter((s) => s.actualLabel === '§0')
    expect(claimed).toHaveLength(1)
    expect(claimed[0].label).toBe('§1')
  })

  it('test_UAT_FC_BUG-102_printed_report_names_the_unpaired_sections', () => {
    // The flat list names a section `§n` and nothing else, so an operator could not
    // see which band that was on either side. The printed report now says which
    // reference sections had no counterpart, and where in the page they sat.
    const text = formatReport(diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS)))

    expect(text).toMatch(/UNPAIRED SECTIONS\s+2 reference section\(s\)/)
    expect(text).toContain('§0 y 0…192')
    expect(text).toContain('§6 y 3688…4260')
  })

  it('test_UAT_FC_BUG-102_printed_report_states_the_not_comparable_verdict', () => {
    const elements = [el('Hero heading', 320, 60), el('Footer note', 4300, 40)]
    const text = formatReport(
      diffManifests(manifest('ref', REFERENCE_SECTIONS, elements), manifest('repro', [band(0, 0, 4376)], elements)),
    )

    expect(text).toMatch(/SECTIONS NOT COMPARABLE/)
    expect(text).toMatch(/ONE body-spanning band/)
    // …and never both verdicts at once.
    expect(text).not.toMatch(/UNPAIRED SECTIONS/)
  })
})
