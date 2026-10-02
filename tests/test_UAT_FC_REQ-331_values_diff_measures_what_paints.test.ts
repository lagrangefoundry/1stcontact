/**
 * REQ-331 — the instrument half of loop 1 / iteration 1 against the `faelan.com`
 * reference bundle: four defects in the RULER that were hiding real fold output
 * or manufacturing defects of their own.
 *
 * Three of these RAISE the delta count, and that is the point — per REQ-277 an
 * instrument that sharpens is not a regression. What each one was worth:
 *
 *   6. no box-shadow VALUE axis          a wrong alpha AND a missing layer, on
 *      (presence only, inside `shape`)   three photographs, reported as ZERO
 *   7. `position` compared the           a 4px glyph displacement on the one run
 *      reference's GLYPH box against     where the page's drift was smallest read
 *      the reproduction's LINE box       as exact
 *   8. `arrangement` is relative to a    the page's highest-severity delta, about
 *      sorted PREDECESSOR                an element whose own box agrees to 0.01px
 *   9. a no-op `filter` read as present  one false MEDIUM delta, charging the fold
 *                                        for correctly declining to emit an
 *                                        identity declaration
 *
 * Every UAT drives the exported engine (`diffManifests`) — the code path
 * `1c values-diff` runs — against projected manifests of the shape the real
 * capture emits. Each has both rails: the difference is reported AND a matching
 * pair still reads clean, so none of these can be satisfied by reporting more.
 */
import { describe, expect, it } from 'vitest'
import { diffManifests, type ValueDelta, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'Inter', fontSizePx: 24, fontWeight: 400, ...over }
}

function img(over: Partial<ValueElement> = {}): ValueElement {
  return {
    role: 'img',
    text: '(img)',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    box: box(59, 32, 222, 222),
    borderRadiusPx: 8,
    ...over,
  }
}

const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })
const deltas = (ref: ValueElement[], act: ValueElement[]): ValueDelta[] =>
  diffManifests(mani('ref', ref), mani('act', act)).deltas
const on = (ds: ValueDelta[], property: string): ValueDelta | undefined => ds.find((d) => d.property === property)

/** The reference's two-layer shadow, and the one-layer opaque thing the fold used to make of it. */
const REF_SHADOW = 'rgba(0, 0, 0, 0.6) 0px 15px 50px 0px, rgba(255, 255, 255, 0.15) 0px 0px 30px 0px'
const OLD_SHADOW = 'rgb(0, 0, 0) 0px 15px 50px 0px'

describe('REQ-331 — the values-diff measures what paints', () => {
  // ── Issue 6 — the shadow as a VALUE ────────────────────────────────────────
  it('test_UAT_FC_REQ-331_a_wrong_shadow_alpha_and_a_missing_layer_are_reported', () => {
    // THE MEASURED SILENCE. Both sides carry a shadow, so the old
    // `!!exp.boxShadow !== !!actShadow` was `true !== true === false`; both radii
    // were 8, so the radius term was 0; no delta of any kind, printed directly
    // above two strings that plainly differ — on three elements.
    const ds = deltas([img({ boxShadow: REF_SHADOW })], [img({ boxShadow: OLD_SHADOW })])
    const d = on(ds, 'boxShadow')
    expect(d, 'the shadow difference is reported').toBeDefined()
    // The report names the values, not a boolean — the repair is to copy the
    // reference's shadow into place, so it has to be legible.
    expect(d!.expected).toContain('#00000099')
    expect(d!.expected).toContain('#ffffff26')
    expect(d!.actual).toContain('#000000')
    expect(d!.actual).not.toContain('#ffffff26')
    // And it is its OWN property rather than folded into `shape`, so the repair
    // order can rank a wrong shadow separately from a wrong corner radius.
    expect(on(ds, 'shape')).toBeUndefined()
  })

  it('test_UAT_FC_REQ-331_an_identical_shadow_written_either_way_reads_clean', () => {
    // The other rail, twice over. A matching shadow is no delta; and neither is
    // one written with its optional spread omitted, because `0 15px 50px` and
    // `0 15px 50px 0` are the same shadow and a comparator that read them as
    // different would be a new false positive in place of an old false negative.
    expect(on(deltas([img({ boxShadow: REF_SHADOW })], [img({ boxShadow: REF_SHADOW })]), 'boxShadow')).toBeUndefined()
    const terse = 'rgba(0, 0, 0, 0.6) 0px 15px 50px, rgba(255, 255, 255, 0.15) 0px 0px 30px'
    expect(on(deltas([img({ boxShadow: REF_SHADOW })], [img({ boxShadow: terse })]), 'boxShadow')).toBeUndefined()
  })

  it('test_UAT_FC_REQ-331_a_lost_shadow_is_reported_and_two_unshadowed_sides_are_not', () => {
    // PRESENCE AS THE DEGENERATE CASE. An element that paints no shadow omits the
    // field entirely, so a comparison guarded on BOTH sides carrying it would go
    // silent exactly where a shadow was lost altogether — the loudest case the
    // axis has. Reading an absent field as "no layers" is what keeps the old
    // presence boolean's one real signal after narrowing `shape` off it.
    const lost = deltas([img({ boxShadow: REF_SHADOW })], [img()])
    expect(on(lost, 'boxShadow'), 'a shadow the reproduction never painted').toBeDefined()
    const gained = deltas([img()], [img({ boxShadow: OLD_SHADOW })])
    expect(on(gained, 'boxShadow'), 'a shadow the reproduction invented').toBeDefined()
    // The rail: two sides that both paint nothing are not a difference, so the
    // widened guard cannot be satisfied by reporting every unshadowed element.
    expect(on(deltas([img()], [img()]), 'boxShadow')).toBeUndefined()
    // And a layer that moves no pixel is not a shadow: a fully transparent
    // declaration against no declaration at all reads clean, by the same
    // painted-effect rule issue 9 applies to a filter.
    expect(on(deltas([img({ boxShadow: 'rgba(0, 0, 0, 0) 0px 15px 50px 0px' })], [img()]), 'boxShadow')).toBeUndefined()
  })

  it('test_UAT_FC_REQ-331_a_wrong_corner_radius_is_still_a_shape_delta', () => {
    // `shape` narrowed to the corners; it did not go away. A card reproduced
    // square where the reference rounds it is the defect that property names.
    const ds = deltas([img({ borderRadiusPx: 16 })], [img({ borderRadiusPx: 0 })])
    expect(on(ds, 'shape')).toBeDefined()
    expect(on(ds, 'shape')!.expected).toContain('16px')
  })

  // ── Issue 7 — the glyph box, symmetrically ─────────────────────────────────
  it('test_UAT_FC_REQ-331_a_displaced_glyph_box_is_reported_when_the_layout_box_agrees', () => {
    // `box` does not mean the same rect on both sides for a bare inline run: the
    // reference records the GLYPH rect there (its line box lives in `inlineBox`)
    // and the reproduction records the LINE box. So the two `box.y` values agreed
    // at 172 while the glyphs sat 4px apart — on the one run where the page's
    // displacement was smallest, which is the run the instrument could not see it
    // on at all.
    const ref = el('Artist •', {
      box: box(102.39, 172, 76.78, 28),
      renderedTextBox: box(102.39, 172, 76.78, 28),
      inlineBox: box(102.39, 168, 267.64, 36),
    })
    const act = el('Artist •', {
      box: box(102.39, 172, 76.78, 36),
      renderedTextBox: box(102.39, 176, 76.78, 28),
    })
    const d = on(deltas([ref], [act]), 'position')
    expect(d, 'the 4px glyph displacement is reported').toBeDefined()
    expect(d!.expected).toContain('172')
    expect(d!.actual).toContain('176')
    expect(d!.magnitude).toBeCloseTo(4, 3)
  })

  it('test_UAT_FC_REQ-331_glyphs_that_agree_report_nothing_and_a_moved_box_is_named_once', () => {
    // Rail one: same glyph rect, same box — clean.
    const same = el('Artist •', { box: box(102.39, 172, 76.78, 28), renderedTextBox: box(102.39, 172, 76.78, 28) })
    expect(on(deltas([same], [{ ...same }]), 'position')).toBeUndefined()

    // Rail two: when the LAYOUT box has moved, the glyph rect has moved with it
    // and the run must be reported ONCE. Two deltas for one movement would
    // double-count it in the repair order.
    const moved = el('Artist •', { box: box(102.39, 188, 76.78, 28), renderedTextBox: box(102.39, 188, 76.78, 28) })
    expect(deltas([same], [moved]).filter((d) => d.property === 'position')).toHaveLength(1)
  })

  // ── Issue 8 — arrangement is a fact about a neighbour ──────────────────────
  it('test_UAT_FC_REQ-331_no_arrangement_delta_for_an_element_whose_own_geometry_moved', () => {
    // `arrangement` is assigned by sorting a side's own elements top-to-bottom
    // and relating each to the one BEFORE it, so one element's displacement
    // re-sorts the list and relabels a DIFFERENT element. On faelan.com the page
    // drift moved a photograph past the headline in the sort order, which changed
    // `Alley scene`'s predecessor and produced the highest-severity delta on the
    // page — against an element whose own box agrees to 0.01px in x and width.
    // BUG-174 — arrangement is read off the paired elements' boxes, so the
    // neighbour is in the fixture: above it on the reference, beside it here.
    const ref = img({ alt: 'Alley scene', box: box(427.63, 129.04, 490.73, 327) })
    const act = img({ alt: 'Alley scene', box: box(427.63, 145.03, 490.73, 327) })
    const ds = deltas([el('FAELAN', { box: box(427.63, 20, 490.73, 60) }), ref], [el('FAELAN', { box: box(0, 145.03, 400, 60) }), act])
    expect(on(ds, 'arrangement'), 'not blamed for its neighbour').toBeUndefined()
    // The real defect — this element IS 16px low — is still reported, by the
    // axis that is about this element.
    expect(on(ds, 'position')).toBeDefined()
  })

  it('test_UAT_FC_REQ-331_a_genuine_arrangement_difference_is_still_reported', () => {
    // The rail: where the element's own geometry agrees, a row-vs-stack
    // difference is a real composition defect and still surfaces at CRITICAL.
    // BUG-174 — the neighbour moved from above it to beside it; it did not move.
    const at = box(427.63, 129.04, 490.73, 327)
    const ds = deltas(
      [el('FAELAN', { box: box(427.63, 20, 490.73, 60) }), img({ alt: 'Alley scene', box: at })],
      [el('FAELAN', { box: box(0, 129.04, 400, 60) }), img({ alt: 'Alley scene', box: at })],
    )
    expect(on(ds, 'arrangement')).toBeDefined()
    expect(on(ds, 'arrangement')!.tier).toBe('CRITICAL')
  })

  it('test_UAT_FC_REQ-331_the_report_says_how_long_each_sides_element_list_was', () => {
    // `matched: 11` and `unpairedActual: []` were printed beside each other while
    // the two lists held 11 and 14 elements — the reproduction emits band
    // containers the reference has no counterpart for, and those are deliberately
    // left out of the tally. The asymmetry is not a defect, but an axis derived
    // from a list's own sort order is only readable if a reader can see it.
    const report = diffManifests(
      mani('ref', [el('FAELAN', { box: box(216, 64, 448, 96) })]),
      mani('act', [
        el('FAELAN', { box: box(216, 64, 448, 96) }),
        img({ alt: 'band', box: box(0, 0, 1280, 816) }),
      ]),
    )
    expect(report.elementCounts).toEqual({ expected: 1, actual: 2 })
  })

  // ── Issue 9 — a treatment is present when it PAINTS ────────────────────────
  it('test_UAT_FC_REQ-331_an_identity_filter_is_not_reported_as_a_missing_treatment', () => {
    // `blur(0px)` is the identity. The fold drops it deliberately — carrying it
    // would cost a composite layer and move no pixel — and the comparator, which
    // measured whether the STRING is non-empty, charged the fold a MEDIUM delta
    // for doing the documented thing. One false delta of twenty.
    expect(on(deltas([img({ filter: 'blur(0px)' })], [img({ filter: null })]), 'filter')).toBeUndefined()
    // The whole identity table, not just blur: a stack of no-ops paints nothing.
    const noops = 'saturate(1) brightness(1) grayscale(0) hue-rotate(0deg)'
    expect(on(deltas([img({ filter: noops })], [img({ filter: null })]), 'filter')).toBeUndefined()
  })

  it('test_UAT_FC_REQ-331_a_filter_that_paints_is_still_reported_as_missing', () => {
    // The rail, in both directions. A real blur dropped by the reproduction is a
    // defect; so is a blur the reproduction invented.
    expect(on(deltas([img({ filter: 'blur(8px)' })], [img({ filter: null })]), 'filter')).toBeDefined()
    expect(on(deltas([img({ filter: null })], [img({ filter: 'grayscale(1)' })]), 'filter')).toBeDefined()
    // An unreadable function counts as painting: the safe direction for an
    // unknown treatment is to assume it does something, so a missed report is
    // never the result of ignorance.
    expect(on(deltas([img({ filter: 'drop-shadow(0 2px 4px #000)' })], [img({ filter: null })]), 'filter')).toBeDefined()
  })
})
