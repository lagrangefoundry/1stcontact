/**
 * BUG-153 items 1, 2 and 4 — three ways the values instrument reported a page it
 * had not measured, and reported the silence as `0`.
 *
 * The run this was filed from read `unmeasured 0` — `unmeasuredAxes: []`,
 * `notComparableAxes: []`, `unpairedSections: 0`, `unpairedActual: 0` — beside a
 * `structural-failure` verdict on a reproduction where 91.76% of the ranked pixel
 * score carried no value delta under it at all. Every number was wrong in the
 * same direction, and each for its own reason:
 *
 *   - item 1: `transformRotateDeg` was read off the leaf while the page painted
 *     the rotation on an ancestor, so four photographs rotated 3–8° projected `0`
 *     on BOTH sides and compared clean;
 *   - item 2: `mask` was compared by PRESENCE, so a feather that erases a fifth
 *     of a photograph was indistinguishable from the reference's, which erases
 *     nothing — and the axis went from 3 MEDIUM deltas to 0 while the page got
 *     further away;
 *   - item 4: three of the reproduction's fourteen elements paired with nothing
 *     and `unpairedActual` said `0`.
 *
 * Evidence is the real bundle's own numbers, transcribed: the mask strings and
 * the 330.33 × 222.17 box are `expected-manifest.json` element 5 against
 * `actual-manifest.json` element 6 of
 * `storage/tmp/repro-console/repro-faelan-com/iteration-2`; the rotations are
 * `.photo-circle{transform:rotate(-5deg)}` and its three siblings in
 * `storage/references/faelan.com/index/assets/index.BM9-dqc-.css`. Both are
 * untracked, so the numbers are inlined rather than read.
 *
 * Item 1's extractor leg is driven OFFLINE, out of `EXTRACT_SCRIPT`'s own text
 * with stub styles, because that string is evaluated in a browser and this
 * sandbox has none — a browser-gated leg here would report SKIPPED and leave the
 * fix with no evidence at all.
 */
import { describe, expect, it } from 'vitest'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { maskCoverage } from '../tools/generate/src/cli/capture/mask-geometry'
import { reconcileGates } from '../tools/generate/src/cli/gate-core'

// ── item 1, level 1: the extractor's own code, run offline ──────────────────

/** A stubbed element: a computed style, and the chain it hangs off. */
interface StubEl {
  nodeType: number
  style: Record<string, string>
  parentElement: StubEl | null
}

function stub(transform: string | undefined, parent: StubEl | null = null): StubEl {
  return { nodeType: 1, style: transform === undefined ? {} : { transform }, parentElement: parent }
}

/**
 * `transformFields` and the two helpers it calls, sliced out of `EXTRACT_SCRIPT`
 * and built with stubbed browser globals.
 *
 * The slice is by the function's own source text rather than by line number, so
 * it cannot silently start testing a different function after an edit above it.
 */
function transformFieldsOffline(): (el: StubEl, s: Record<string, string>) => Record<string, unknown> {
  const from = EXTRACT_SCRIPT.indexOf('function decomposeTransform(')
  const to = EXTRACT_SCRIPT.indexOf('// REQ-48 (item 1) -- declared motion', from)
  expect(from).toBeGreaterThan(0)
  expect(to).toBeGreaterThan(from)
  const src = EXTRACT_SCRIPT.slice(from, to)
  // The only two globals the slice reaches for. `documentElement` is the walk's
  // stop condition and is a sentinel no stub chain contains.
  const build = new Function(
    'getComputedStyle',
    'document',
    `${src}\nreturn transformFields`,
  ) as (
    gcs: (n: StubEl) => Record<string, string>,
    doc: { documentElement: unknown },
  ) => (el: StubEl, s: Record<string, string>) => Record<string, unknown>
  return build((n: StubEl) => n.style, { documentElement: Symbol('html') })
}

describe('BUG-153 item 1 — the projection reads the transform the page paints', () => {
  const transformFields = transformFieldsOffline()

  it('test_UAT_FC_BUG-153_rotation_on_the_wrapper_reaches_the_photograph', () => {
    // The filed shape verbatim: `<img>` inside a wrapper div the stylesheet
    // rotates. `transform` is not inherited, so the leaf's own computed value is
    // `none` and the old projection wrote `0` — the same `0` the reproduction
    // wrote, which is why four rotated photographs compared clean.
    const wrapper = stub('matrix(0.996195, -0.0871557, 0.0871557, 0.996195, 0, 0)') // rotate(-5deg)
    const img = stub('none', wrapper)

    expect(transformFields(img, img.style)).toEqual({ transformRotateDeg: -5, transformScale: 1 })
  })

  it('test_UAT_FC_BUG-153_the_four_collage_rotations_all_read_through', () => {
    // All four of the page's photographs, so the fix is a rule and not a case:
    // -5°, 3°, -8°, 4°, each painted by the wrapper and none by the image.
    const rot = (deg: number): string => {
      const r = (deg * Math.PI) / 180
      return `matrix(${Math.cos(r)}, ${Math.sin(r)}, ${-Math.sin(r)}, ${Math.cos(r)}, 0, 0)`
    }
    const read = (deg: number): unknown =>
      transformFields(stub('none', stub(rot(deg))), { transform: 'none' }).transformRotateDeg

    expect([-5, 3, -8, 4].map(read)).toEqual([-5, 3, -8, 4])
  })

  it('test_UAT_FC_BUG-153_transforms_compose_up_the_whole_chain', () => {
    // Not just the parent: rotation is additive and uniform scale multiplicative
    // over the chain, so a photograph in a rotated wrapper in a scaled section
    // reports what the eye sees, not what its own rule says.
    const section = stub('matrix(2, 0, 0, 2, 0, 0)') // scale(2)
    const wrapper = stub('matrix(0.9848, 0.1736, -0.1736, 0.9848, 0, 0)', section) // rotate(10deg)
    const img = stub('matrix(0.9848, 0.1736, -0.1736, 0.9848, 0, 0)', wrapper) // rotate(10deg)

    expect(transformFields(img, img.style)).toEqual({ transformRotateDeg: 20, transformScale: 2 })
  })

  it('test_UAT_FC_BUG-153_an_upright_page_still_reads_upright', () => {
    // The identity is EARNED: a chain with no transform anywhere reports 0/1 and
    // carries no unreadable flag, so a non-zero reading always means the page
    // really is transformed.
    expect(transformFields(stub('none', stub(undefined)), { transform: 'none' })).toEqual({
      transformRotateDeg: 0,
      transformScale: 1,
    })
  })

  it('test_UAT_FC_BUG-153_an_undecomposable_transform_is_not_projected_as_upright', () => {
    // The third outcome the old shape could not express. `matrix3d` fell back to
    // the identity, which put a zero meaning "we did not look" into the same
    // field as a zero meaning "upright". Both value fields are ABSENT now, and
    // the flag says why.
    const wrapper = stub('matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)')
    const fields = transformFields(stub('none', wrapper), { transform: 'none' })

    expect(fields).toEqual({ transformUnreadable: true })
    expect(fields.transformRotateDeg).toBeUndefined()
  })
})

// ── the diff's fixtures ─────────────────────────────────────────────────────

const REF_MASK = 'radial-gradient(92% 92%, rgb(0, 0, 0) 72%, rgba(0, 0, 0, 0) 100%)'
const OUR_MASK = 'radial-gradient(closest-side, rgb(0, 0, 0) calc(100% - 62px), rgba(0, 0, 0, 0) 100%)'
/** `expected-manifest.json` element 5's box, to the hundredth of a pixel. */
const PHOTO_BOX = { x: 58.84, y: 30.17, width: 330.33, height: 222.17 }

function photo(over: Partial<ValueElement> = {}): ValueElement {
  return {
    text: '(img)',
    a11yRole: 'img',
    textless: true,
    box: { ...PHOTO_BOX },
    ...over,
  } as ValueElement
}

function manifest(source: string, elements: ValueElement[], sections: ValueManifest['sections'] = []): ValueManifest {
  return { source, elements, sections, viewport: { width: 1280, height: 800 } }
}

describe('BUG-153 item 1 — a difference in effective rotation is a delta the diff reports', () => {
  it('test_UAT_FC_BUG-153_a_rotated_reference_against_an_upright_repro_is_a_transform_delta', () => {
    // The point of reading the ancestor: once both sides carry a real number the
    // comparator that has always existed starts paying. Before the projection fix
    // this pair was `0` against `0`.
    const report = diffManifests(
      manifest('ref', [photo({ transformRotateDeg: -5, transformScale: 1 })]),
      manifest('repro', [photo({ transformRotateDeg: 0, transformScale: 1 })]),
    )

    const transform = report.deltas.filter((d) => d.property === 'transform')
    expect(transform).toHaveLength(1)
    expect(transform[0].expected).toBe('rot -5°')
    expect(transform[0].actual).toBe('rot 0°')
  })

  it('test_UAT_FC_BUG-153_an_unreadable_transform_is_reported_unmeasured_not_compared', () => {
    // The silence the fix refuses to keep. The element carries no rotation to
    // compare, the comparator correctly skips it — and the run SAYS so, naming
    // the side, instead of letting `unmeasuredAxes: []` assert that nothing went
    // unmeasured.
    const report = diffManifests(
      manifest('ref', [photo({ transformUnreadable: true })]),
      manifest('repro', [photo({ transformRotateDeg: 0, transformScale: 1 })]),
    )

    expect(report.deltas.filter((d) => d.property === 'transform')).toEqual([])
    const rows = report.unmeasuredAxes.filter((u) => u.axis === 'transformRotateDeg')
    expect(rows).toHaveLength(1)
    expect(rows[0].side).toBe('reference')
    expect(rows[0].reason).toMatch(/matrix3d|cannot decompose/)
  })

  it('test_UAT_FC_BUG-153_a_readable_page_reports_no_unmeasured_transform', () => {
    // Earned, like the identity above: the row appears only where a reading was
    // actually declined.
    const report = diffManifests(
      manifest('ref', [photo({ transformRotateDeg: -5, transformScale: 1 })]),
      manifest('repro', [photo({ transformRotateDeg: -5, transformScale: 1 })]),
    )

    expect(report.unmeasuredAxes.filter((u) => u.axis === 'transformRotateDeg')).toEqual([])
  })
})

// ── item 2 ──────────────────────────────────────────────────────────────────

describe('BUG-153 item 2 — the mask axis compares what the mask does', () => {
  it('test_UAT_FC_BUG-153_a_wrong_mask_geometry_is_a_delta', () => {
    // The filed pair, on the filed box. The reference attenuates only the extreme
    // corners; ours is fully opaque over about a third of the box and erases a
    // fifth of it outright. Presence matched on both sides, so this scored 0.
    const report = diffManifests(
      manifest('ref', [photo({ maskEdge: REF_MASK })]),
      manifest('repro', [photo({ maskEdge: OUR_MASK })]),
    )

    const mask = report.deltas.filter((d) => d.property === 'mask')
    expect(mask).toHaveLength(1)
    // Named as what each side PAINTS, not as the two strings, which is the whole
    // reason the old comparator could not use them.
    expect(mask[0].expected).toMatch(/^99\.\d% opaque/)
    expect(mask[0].actual).toMatch(/^3[01]\.\d% opaque \/ 2[01]\.\d% erased$/)
  })

  it('test_UAT_FC_BUG-153_the_same_mask_spelled_differently_is_not_a_delta', () => {
    // The rationale the old comparator was protecting, kept. A vendor prefix is
    // not a defect, and neither is `farthest-side` where the gradient is centred
    // and `closest-side` means the same rect.
    const report = diffManifests(
      manifest('ref', [photo({ maskEdge: REF_MASK })]),
      manifest('repro', [photo({ maskEdge: `-webkit-${REF_MASK}` })]),
    )

    expect(report.deltas.filter((d) => d.property === 'mask')).toEqual([])
  })

  it('test_UAT_FC_BUG-153_a_missing_mask_is_still_the_presence_delta_it_always_was', () => {
    // REQ-48's original reading is not replaced, only extended: a feather present
    // on one side and absent on the other is still reported, and still as
    // presence, because there is no geometry on one side to compare.
    const report = diffManifests(
      manifest('ref', [photo({ maskEdge: REF_MASK })]),
      manifest('repro', [photo({ maskEdge: null })]),
    )

    const mask = report.deltas.filter((d) => d.property === 'mask')
    expect(mask).toHaveLength(1)
    expect([mask[0].expected, mask[0].actual]).toEqual(['present', 'none'])
  })

  it('test_UAT_FC_BUG-153_an_unresolvable_mask_pair_is_unmeasured_not_clean', () => {
    // The narrower silence the fix refuses to swap in for the wide one. A
    // `clip-path` polygon has no coverage this projection can resolve, the two
    // sides differ, and the run says the axis went uncompared rather than
    // printing a clean 0.
    const report = diffManifests(
      manifest('ref', [photo({ maskEdge: 'polygon(0 0, 100% 0, 100% 80%)' })]),
      manifest('repro', [photo({ maskEdge: 'polygon(0 0, 100% 0, 100% 40%)' })]),
    )

    expect(report.deltas.filter((d) => d.property === 'mask')).toEqual([])
    expect(report.unmeasuredAxes.filter((u) => u.axis === 'maskEdge')).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-153_the_coverage_resolves_the_filed_arithmetic', () => {
    // The ticket closes the arithmetic by hand for one photograph: under
    // `closest-side` with a 62px feather, ours is opaque to `(165.16 − 62)/165.16
    // = 0.625` of the ending ellipse — 30.6% of the box — and erases everything
    // past `t = 1`, which is 21.5% of the box (a box minus its inscribed ellipse
    // is always `1 − π/4`). The resolver is a sampling grid, so it lands within a
    // fraction of a point of each.
    const ours = maskCoverage(OUR_MASK, PHOTO_BOX)
    expect(ours?.opaque).toBeCloseTo(0.306, 2)
    expect(ours?.erased).toBeCloseTo(0.215, 2)
    // And it DECLINES rather than guessing where it cannot resolve the shape.
    expect(maskCoverage('linear-gradient(black, transparent)', PHOTO_BOX)).toBeUndefined()
    expect(maskCoverage(REF_MASK, { width: 0, height: 0 })).toBeUndefined()
  })
})

// ── item 4 ──────────────────────────────────────────────────────────────────

/** A full-bleed textless box coinciding with a band — a reproduction's band paint. */
function bandPaint(y: number, height: number): ValueElement {
  return {
    text: 'FAELANArtist • Musician• Creator',
    a11yRole: 'generic',
    textless: true,
    box: { x: 0, y, width: 1280, height },
  } as ValueElement
}

const BANDS = [
  { index: 0, overlay: null, contentAnchorRatio: 0.5, box: { x: 0, y: 0, width: 1280, height: 800 } },
  { index: 1, overlay: null, contentAnchorRatio: 0.5, box: { x: 0, y: 800, width: 1280, height: 311 } },
  { index: 2, overlay: null, contentAnchorRatio: 0.5, box: { x: 0, y: 1111, width: 1280, height: 84 } },
]

describe('BUG-153 item 4 — the elements lifted out of the unpaired tally are reported', () => {
  const ref = manifest('ref', [photo({ maskEdge: null })], BANDS)
  const repro = manifest(
    'repro',
    [photo({ maskEdge: null }), bandPaint(0, 800), bandPaint(800, 311), bandPaint(1111, 84)],
    BANDS,
  )

  it('test_UAT_FC_BUG-153_band_paint_is_counted_where_a_reader_can_see_it', () => {
    // REQ-271's exclusion is right and stays — a full-bleed band box has nothing
    // on the reference side to pair with, and counting it as an unpaired object
    // would state a gap no fold could close. What was wrong was that the
    // exclusion was invisible: `unpairedActual: 0` beside `elementCounts
    // { expected: 1, actual: 4 }`, with three elements unaccounted for.
    const report = diffManifests(ref, repro)

    expect(report.unpairedActual).toEqual([])
    expect(report.bandPaintActual).toHaveLength(3)
    // The three numbers now add up, which is the fact the report could not state.
    expect(report.matched + report.unpairedActual.length + report.bandPaintActual.length).toBe(
      report.elementCounts.actual,
    )
  })

  it('test_UAT_FC_BUG-153_a_real_extra_object_is_still_unpaired_not_reclassified', () => {
    // The count is EARNED: an object that merely sits on a band, rather than
    // being the band's own paint, is still reported as unpaired.
    const stray = photo({ box: { x: 40, y: 900, width: 200, height: 120 }, maskEdge: null })
    const report = diffManifests(ref, manifest('repro', [photo({ maskEdge: null }), bandPaint(0, 800), stray], BANDS))

    expect(report.unpairedActual).toHaveLength(1)
    expect(report.bandPaintActual).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-153_the_gate_counts_the_reclassified_elements_and_names_them', () => {
    // The hop that matters: `gate.json` is what the round reads, and the fact has
    // to survive into it or it may as well not exist. Counted in the values block
    // and named on the pass rung, exactly as REQ-308's reclassified bands are one
    // level up.
    const diff = diffManifests(ref, repro)
    const gate = reconcileGates({
      perceptual: { meanDiff: 0, pctOverThreshold: 0, regions: [] },
      l1Gate: {
        pass: true,
        onSample: { pass: true, byWidth: [] },
        offSample: { pass: true, byWidth: [] },
        contentRobustness: { pass: true, byWidth: [] },
        sampleFidelity: { pass: true, maxDeltaPx: 0, byWidth: [] },
      },
      coverage: { sections: 3, elements: 1, findings: [] },
      values: diff,
    })

    expect(gate.values.bandPaintActual).toBe(3)
    expect(gate.values.unpairedActual).toBe(0)
    // The pass rung is where a passing run says what it is nonetheless carrying.
    expect(gate.verdict).toBe('pass')
    expect(gate.nextStep).toMatch(/3 reproduction element\(s\) are a band's own PAINT/)
  })
})
