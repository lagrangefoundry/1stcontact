/**
 * REQ-352 — a band's content anchor is ONE measurement over ONE population,
 * whichever code path produced the band.
 *
 * `contentAnchorRatio` — where the text a band carries sits vertically, as a
 * fraction of the band's height — used to be measured two different ways inside
 * the page script, and which one a band got depended only on the branch that
 * built it. A geometric slice took every run whose centre fell in its box; a
 * single `<body>`-child band walked its own DOM DESCENDANTS. Those agree on a
 * conventionally nested page and disagree exactly where one band OVERLAPS
 * another: an absolutely-positioned `<header>` over a hero is its own band, so
 * its runs are not descendants of the hero and the walk excluded them, while a
 * geometric box is a partition and cannot. A reference site takes the DOM branch
 * and its L1 reproduction takes the geometric one, so the two `contentAnchorRatio`
 * numbers were not the same measurement — 0.53 against 0.39 on byte-identical
 * geometry on gigabytealchemy.ai — and REQ-270's guard correctly declined to
 * compare them rather than reporting a phantom 112px content shift.
 *
 * REQ-270 taught the diff to decline and BUG-139 taught the console to count the
 * declination. Neither made the axis COMPARABLE, so it was permanently unmeasured
 * on the commonest layout on the web. This is the other half: the extractor
 * measures both sides over the one geometric population, from the runs and boxes
 * the page already handed back, in one implementation (`anchor.ts`) rather than
 * two.
 *
 * A second, independent split sat beside it and is closed here too: a capture
 * bundle's SECTION coalesces consecutive bands that share a style signature and
 * publishes their UNION box, but took its anchor from the FIRST band — a ratio
 * against a box that is not the one the section publishes the moment two bands
 * coalesce.
 *
 * Every leg is browser-free on purpose. The derivation moved OUT of the page
 * script, so what has to be proven is arithmetic over `RawSignals` — and the
 * decisive claim (the two sides agree) is a claim about two functions consuming
 * the same geometry, which a real Chromium run would obscure rather than sharpen.
 */
import { describe, expect, it } from 'vitest'
import {
  ANCHOR_POPULATION_SCHEMA,
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  diffManifests,
  flattenCapture,
  flattenSignals,
  staleCaptureAxes,
  type Capture,
  type RawBand,
  type RawRun,
  type RawSignals,
  type Section,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
// Not on the package surface — the capture pipeline is its only caller, and this
// suite asks the reference side its question at the same seam the pipeline does.
import { buildSections } from '../tools/generate/src/cli/capture/sections'
import { run } from './support/fake-capture-driver'

// ── the shape: an absolutely-positioned header over a full-bleed hero ─────────
//
// gigabytealchemy.ai's geometry, and an ordinary one — a fixed wordmark over a
// full-bleed hero is what a page builder emits by default, so this recurs by
// construction rather than by accident.

const WORDMARK = { x: 88, y: 80, width: 300, height: 32 } // centre 96 → inside BOTH the header and the hero
const HERO_COPY = { x: 88, y: 500, width: 700, height: 60 } // centre 530 → inside the hero only
const BELOW_COPY = { x: 88, y: 900, width: 700, height: 40 } // centre 920 → inside the band below

const HEADER_BOX = { x: 0, y: 0, width: 1280, height: 192 }
const HERO_BOX = { x: 0, y: 0, width: 1280, height: 800 }
const BELOW_BOX = { x: 0, y: 800, width: 1280, height: 400 }

/**
 * The hero's anchor over the ONE population — every run whose centre falls in its
 * box, whichever band collected it. The wordmark (80…112) and the hero copy
 * (500…560) span 80…560, whose centre is 320, which is 0.40 of an 800px band.
 */
const HERO_ANCHOR_ONE_POPULATION = 0.4

/**
 * What a DOM-DESCENDANT walk of the hero element reported instead: the wordmark
 * belongs to the `<header>`, so it was excluded and the span was the hero copy
 * alone (500…560, centre 530 → 0.66). The number this ticket exists to retire.
 */
const HERO_ANCHOR_DOM_WALK = 0.66

function band(box: RawBand['box'], backgroundColor: string, content: RawRun[]): RawBand {
  return {
    box,
    backgroundColor,
    backgroundImage: 'none',
    colorScheme: 'dark',
    fontFamily: 'Inter',
    textAlign: 'left',
    paddingTopPx: 0,
    paddingBottomPx: 0,
    overlay: null,
    content,
    items: [],
    fields: [],
  } as RawBand
}

function signals(bands: RawBand[]): RawSignals {
  return {
    viewport: { width: 1280, height: 800 },
    bands,
    colorUsage: [],
    fontFaces: [],
    typeScale: [40],
    spacingScalePx: [40],
    containerMaxWidthPx: null,
    images: [],
  } as RawSignals
}

/**
 * The REFERENCE page as the extractor sees it: a conventionally nested site whose
 * `<header>` is `position: absolute` over the hero, so the `<body>`-children scan
 * yields three bands and the header's box lies WHOLLY INSIDE the hero's. This is
 * the side that used to take the DOM-descendant branch.
 */
const referenceSignals = (): RawSignals =>
  signals([
    band(HEADER_BOX, '#0b1120', [run({ text: 'Gigabyte Alchemy', box: WORDMARK })]),
    band(HERO_BOX, '#030717', [run({ text: 'Alchemy for your bytes', box: HERO_COPY })]),
    band(BELOW_BOX, '#e8dfd3', [run({ text: 'What we do', box: BELOW_COPY })]),
  ])

/**
 * The REPRODUCTION of that page as the extractor sees it: an L1 render emits ONE
 * element into `<body>` and every band inside it is an absolutely-positioned
 * SIBLING, so the geometric slicer partitions the page and the wordmark lands in
 * the hero slice with nothing marking it as another section's. That is why the
 * population has to be geometric on both sides rather than "exclude the nested
 * section's runs": this side cannot answer that question at all.
 */
const reproductionSignals = (): RawSignals =>
  signals([
    band(HERO_BOX, '#030717', [
      run({ text: 'Gigabyte Alchemy', box: WORDMARK }),
      run({ text: 'Alchemy for your bytes', box: HERO_COPY }),
    ]),
    band(BELOW_BOX, '#e8dfd3', [run({ text: 'What we do', box: BELOW_COPY })]),
  ])

// ── the reference bundle, at a chosen capture schema ─────────────────────────

function captureOf(sections: Section[], captureSchema: number): Capture {
  return {
    url: 'https://gigabytealchemy.test/',
    host: 'gigabytealchemy.test',
    path: '/',
    capturedAt: '2026-09-29T20:39:39.000Z',
    captureSchema,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections,
    assets: [],
  } as unknown as Capture
}

/** The bundle a capture of {@link referenceSignals} writes, stamped as asked. */
function referenceBundle(captureSchema: number): Capture {
  return captureOf(buildSections(referenceSignals(), () => undefined), captureSchema)
}

/** That bundle with its hero anchor forced back to the DOM-walk value. */
function domPopulationBundle(captureSchema: number): Capture {
  const sections = buildSections(referenceSignals(), () => undefined)
  sections[1].layout.contentAnchorRatio = HERO_ANCHOR_DOM_WALK
  return captureOf(sections, captureSchema)
}

const heroOf = (m: ValueManifest) => m.sections.find((s) => s.box?.height === HERO_BOX.height)!
const anchorDeltas = (d: ReturnType<typeof diffManifests>) => d.deltas.filter((x) => x.property === 'contentAnchor')

// ── 1. The headline: one population, both sides ───────────────────────────────

describe('REQ-352 — one population, whichever path the band took', () => {
  /**
   * The claim the whole ticket rests on. The reference's hero section and the
   * reproduction's hero band are measured from the same geometry by the same
   * derivation, so they report the SAME number — and it is the one that includes
   * the wordmark, not the DOM walk's that excluded it.
   */
  it('test_UAT_FC_REQ-352_a_header_over_a_hero_is_measured_the_same_on_both_sides', () => {
    const reference = flattenCapture(referenceBundle(CAPTURE_SCHEMA))
    const reproduction = flattenSignals(reproductionSignals(), 'draft:repro')

    expect(
      heroOf(reference).contentAnchorRatio,
      'the reference measures the hero over every run whose centre falls in it — the wordmark included',
    ).toBe(HERO_ANCHOR_ONE_POPULATION)
    expect(
      heroOf(reference).contentAnchorRatio,
      'and so is NOT the DOM-descendant walk that excluded the header it sits under',
    ).not.toBe(HERO_ANCHOR_DOM_WALK)
    expect(
      heroOf(reproduction).contentAnchorRatio,
      'the reproduction, whose bands are a geometric partition, reports the same number',
    ).toBe(HERO_ANCHOR_ONE_POPULATION)

    // Stated as the invariant rather than as two numbers that happen to match:
    // the two sides are the same measurement now, which is what makes the axis
    // comparable at all.
    expect(heroOf(reproduction).contentAnchorRatio).toBe(heroOf(reference).contentAnchorRatio)
  })

  /**
   * And the two sides say WHICH population they were measured over, so the
   * comparator can tell a current bundle from an older one without guessing.
   * Carried, not compared — the two legitimately differ on an older bundle.
   */
  it('test_UAT_FC_REQ-352_each_side_carries_the_population_it_was_measured_over', () => {
    expect(
      heroOf(flattenCapture(referenceBundle(CAPTURE_SCHEMA))).anchorPopulation,
      'a bundle taken today was measured geometrically',
    ).toBe('geometric')
    expect(
      heroOf(flattenCapture(referenceBundle(8))).anchorPopulation,
      'a bundle taken before the schema bump carries the DOM-walk population',
    ).toBe('dom')
    expect(
      heroOf(flattenSignals(reproductionSignals(), 'draft:repro')).anchorPopulation,
      'the reproduction is measured by the extractor running now, so it is always geometric',
    ).toBe('geometric')
  })
})

// ── 2/3. The guard stops firing on a current bundle, and is kept for an older one ──

describe('REQ-352 — the guard fires on a stale population, not on the shape', () => {
  /**
   * Behaviour 2. The hero still has the header sitting inside it — the shape that
   * used to be permanently unmeasured — but a bundle taken at the current schema
   * is the same measurement as the reproduction, so it is COMPARED, no phantom
   * delta is recorded, and nothing lands in `notComparableAxes`.
   */
  it('test_UAT_FC_REQ-352_a_current_bundle_of_that_shape_is_compared_not_declined', () => {
    const diff = diffManifests(
      flattenCapture(referenceBundle(CAPTURE_SCHEMA)),
      flattenSignals(reproductionSignals(), 'draft:repro'),
    )

    const hero = diff.sectionPairing.find((p) => p.actualBox?.height === HERO_BOX.height)!
    expect(hero.anchorComparable, 'the anchor is comparable, so the guard records nothing about it').toBeUndefined()
    expect(anchorDeltas(diff), 'and the two sides agree, so there is no delta either').toEqual([])
    expect(
      diff.notComparableAxes,
      'the unmeasured set\'s `probes` part is what this drives to 0 — nothing declines to be measured here',
    ).toEqual([])
  })

  /**
   * Behaviour 3. The guard is KEPT, not deleted. A bundle taken before the bump
   * still carries a DOM-population anchor; comparing it against a geometric one
   * is exactly the phantom delta REQ-270 exists to refuse — even though the
   * geometry is byte-identical and the gap (0.26) is far outside any tolerance a
   * reader would accept.
   */
  it('test_UAT_FC_REQ-352_an_older_bundle_of_that_shape_is_still_declined_and_says_to_recapture', () => {
    const diff = diffManifests(
      flattenCapture(domPopulationBundle(8)),
      flattenSignals(reproductionSignals(), 'draft:repro'),
    )

    const hero = diff.sectionPairing.find((p) => p.actualBox?.height === HERO_BOX.height)!
    expect(hero.anchorComparable, 'two populations, so not the same measurement').toBe(false)
    expect(anchorDeltas(diff), 'and no phantom content shift is reported against the reproduction').toEqual([])

    // The reason names the section that made it incomparable, as it always did —
    // and now also names the remedy, which is the thing a round can actually do.
    expect(hero.anchorReason).toContain('§0')
    expect(hero.anchorReason, 'the remedy is a re-capture, so the reason says so').toMatch(/RE-CAPTURE/)
    expect(hero.anchorReason).toContain(`capture schema ${ANCHOR_POPULATION_SCHEMA}`)
    expect(diff.notComparableAxes.length, 'and it is still counted as unmeasured, not clean').toBe(1)

    // Behaviour 7 — the population is CARRIED, not compared. The two sides
    // legitimately differ here (`dom` against `geometric`); what the comparator
    // does about that is decline the anchor above, never record a delta on the
    // population itself, which would blame the reproduction for the bundle's age.
    expect(
      diff.deltas.filter((d) => d.property === 'anchorPopulation'),
      'the sides differ on the population and that is not a defect in either',
    ).toEqual([])
  })
})

// ── 4. The ordinary page is untouched ────────────────────────────────────────

describe('REQ-352 — a page with no overlapping sections is unchanged', () => {
  /**
   * Behaviour 4. On a conventionally nested page with no overlap the two
   * populations always coincided, so the anchor value must not move and the delta
   * must still fire at the same magnitude. The risk this pins is the one the
   * ticket named: the fix touches the path every ordinary page takes.
   */
  it('test_UAT_FC_REQ-352_an_ordinary_page_keeps_its_anchor_and_still_reports_a_delta', () => {
    // No band lies inside another: a 600px hero, then a 400px band below it.
    const hero = { x: 0, y: 0, width: 1280, height: 600 }
    const below = { x: 0, y: 600, width: 1280, height: 400 }
    const ordinary = signals([
      // Centred copy: 280…320, centre 300 → 0.50 of a 600px band, which is what a
      // DOM walk of this band reported too. There is nothing else inside the hero
      // for a geometric population to add.
      band(hero, '#ffffff', [run({ text: 'Centred hero copy', box: { x: 88, y: 280, width: 700, height: 40 } })]),
      band(below, '#f4f1ea', [run({ text: 'Below', box: { x: 88, y: 700, width: 700, height: 40 } })]),
    ])
    // The reproduction places the hero's copy low — a REAL content shift, and the
    // kind the guard must never absorb.
    const drifted = signals([
      band(hero, '#ffffff', [run({ text: 'Centred hero copy', box: { x: 88, y: 430, width: 700, height: 40 } })]),
      band(below, '#f4f1ea', [run({ text: 'Below', box: { x: 88, y: 700, width: 700, height: 40 } })]),
    ])

    const reference = flattenCapture(captureOf(buildSections(ordinary, () => undefined), CAPTURE_SCHEMA))
    expect(reference.sections[0].contentAnchorRatio, 'the ordinary page reads exactly what it always read').toBe(0.5)

    const diff = diffManifests(reference, flattenSignals(drifted, 'draft:repro'))
    expect(
      diff.sectionPairing[0].anchorComparable,
      'nothing overlaps, so the anchor means the same thing on both sides and is compared',
    ).toBeUndefined()
    const deltas = anchorDeltas(diff)
    expect(deltas.length, 'and a real 150px content shift is still reported').toBe(1)
    expect(deltas[0].expected).toContain('0.50')
    expect(deltas[0].actual).toContain('0.75')
  })
})

// ── 5. A coalesced section anchors against its own box ───────────────────────

describe('REQ-352 — a coalesced section measures its own box', () => {
  /**
   * The second split. A capture section coalesces consecutive bands that share a
   * style signature and publishes their UNION box, but the anchor came from the
   * FIRST band — a ratio against a box that is not the one the section publishes.
   * On joyfulculinarycreations.com that was reported as a live `contentAnchor`
   * delta of `top (0.22)` against a reproduction's `center (0.55)`, on content the
   * reproduction had placed correctly.
   */
  it('test_UAT_FC_REQ-352_a_coalesced_section_anchors_every_band_it_swallowed', () => {
    // Two consecutive bands, same fill, same scheme, same family — so they
    // coalesce into one 600px section.
    const coalescing = signals([
      band({ x: 0, y: 0, width: 1280, height: 300 }, '#ffffff', [
        run({ text: 'High in the first band', box: { x: 88, y: 30, width: 700, height: 40 } }),
      ]),
      band({ x: 0, y: 300, width: 1280, height: 300 }, '#ffffff', [
        run({ text: 'Low in the second', box: { x: 88, y: 530, width: 700, height: 40 } }),
      ]),
    ])

    const sections = buildSections(coalescing, () => undefined)
    expect(sections, 'the two bands share a signature, so they are one section').toHaveLength(1)
    expect(sections[0].box).toMatchObject({ y: 0, height: 600 })

    // 30…70 ∪ 530…570 spans 30…570, whose centre is 300 — the middle of the
    // section's own 600px box.
    expect(
      sections[0].layout.contentAnchorRatio,
      'every coalesced band\'s text, measured against the box the section publishes',
    ).toBe(0.5)

    // The number it used to report: the FIRST band's text (centre 50) over the
    // FIRST band's box (300px) — 0.17, a ratio against a box no longer published.
    expect(sections[0].layout.contentAnchorRatio).not.toBe(0.17)
  })
})

// ── 6. One derivation, and it is not in the page script ─────────────────────

describe('REQ-352 — one implementation, not two', () => {
  /**
   * The defect was two implementations, so the guardrail is that there is now
   * one. The page script MEASURES (a run's line box, a band's box) and derives
   * nothing: the anchor is arithmetic over what the page handed back, done once in
   * `anchor.ts` and read by both sides. A second anchor function reappearing in
   * the page script is how this defect comes back.
   */
  it('test_UAT_FC_REQ-352_the_page_script_measures_but_no_longer_derives_an_anchor', () => {
    expect(EXTRACT_SCRIPT, 'no DOM-descendant anchor walk').not.toMatch(/anchorRatioOf/)
    expect(EXTRACT_SCRIPT, 'and no geometric twin of it either').not.toMatch(/anchorRatioInBox/)
    expect(EXTRACT_SCRIPT, 'nothing in the page derives an anchor at all').not.toMatch(/anchorRatio/)

    // And a band carries no anchor field to disagree about: it records the runs it
    // carries and its own box, which is everything the derivation needs.
    const bands = reproductionSignals().bands
    expect(Object.keys(bands[0])).not.toContain('contentAnchorRatio')
  })
})

// ── 7. A bundle is dated by its own anchor ──────────────────────────────────

describe('REQ-352 — a bundle whose anchor was measured by an older instrument is named', () => {
  /**
   * The schema probe. Every run and every box the recomputation needs is already
   * in the bundle, so a stored anchor that disagrees with the one a current
   * extractor would measure dates the bundle — which is what tells a round that
   * re-capturing is the lever, rather than leaving it to re-run a fold against a
   * frozen oracle.
   */
  it('test_UAT_FC_REQ-352_a_stale_anchor_population_is_named_as_the_axis_the_bundle_lacks', () => {
    const axes = staleCaptureAxes(domPopulationBundle(8))
    expect(
      axes.map((a) => a.axis).join(' | '),
      'the bundle stores 0.66 where its own runs say 0.40, so it was measured by an older instrument',
    ).toMatch(/contentAnchorRatio measured over one population/)
  })

  /**
   * And the probe only ever REMOVES the axis from a finding. A page whose two
   * populations coincide shows no disagreement, which proves nothing about when it
   * was taken — so an older bundle of an ordinary page is not accused of a defect
   * it cannot be shown to have.
   */
  it('test_UAT_FC_REQ-352_an_older_bundle_whose_populations_coincide_is_not_accused', () => {
    const ordinary = signals([
      band({ x: 0, y: 0, width: 1280, height: 600 }, '#ffffff', [
        run({ text: 'Centred hero copy', box: { x: 88, y: 280, width: 700, height: 40 } }),
      ]),
    ])
    const axes = staleCaptureAxes(captureOf(buildSections(ordinary, () => undefined), 8))
    expect(
      axes.map((a) => a.axis).join(' | '),
      'no overlap and no coalescing, so the stored anchor is already what a current extractor measures',
    ).not.toMatch(/contentAnchorRatio measured over one population/)
  })
})
