/**
 * BUG-161 — three ways the instrument reported the loudest disagreement on a page
 * as clean, and excluded from every count the records that would have caught it.
 *
 * Filed from iteration 3 of `joyfulculinarycreations.com`, where the three
 * defects compose into one silence:
 *
 *   1. the actual side's band `surfaceFill` was read off a box the page has
 *      painted OVER. The fold emits a full-bleed `backdrop-7` (`#ffffff`) and a
 *      full-bleed `section-band-1` (`#28542d`) at the same rectangle; the slicer
 *      keeps the outermost/earliest and read the band's fill off it, so the
 *      comparator called `#ffffff == #ffffff` over 525px of dark green — 52.57%
 *      of the round's ranked region score, and zero value deltas.
 *   2. `bandPaintActual` lifted three reproduction paint boxes out of
 *      `unpairedActual` on the unchecked premise that "the reference represents
 *      the same fact on its section record" — the very claim defect 1 falsifies —
 *      and the console's unmeasured set counted them in none of its four parts.
 *   3. `coverage` called all seven mirrored images "referenced" while one of them
 *      (`assets/10.jpg`, 845 KB, clipped to nothing by the fold) painted a flat
 *      `(122,122,122)` across its whole box. `coverage.findings` was `[]`.
 *
 * Evidence shape, per leg:
 *
 *   - Issue 1 drives the extractor's own `sliceBackgroundColor` OFFLINE, sliced
 *     out of `EXTRACT_SCRIPT` by its own source text and built with a stubbed
 *     `getComputedStyle` — the pattern BUG-153 established for exactly this
 *     reason: that string is evaluated in a browser, this sandbox has none, and a
 *     browser-gated leg would report SKIPPED and leave the fix with no evidence.
 *   - Issues 2 and 3 drive the real `diffManifests`, `unmeasuredOf`,
 *     `unpaintedImages`, `reconcileGates` and `cmdDiff` entry points against
 *     synthetic manifests and PNG pairs. No mocks, no browser.
 */
import { afterAll, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { cmdDiff, unpaintedImages, writeRasterPng, type Raster } from '../tools/generate/src/cli'
import { reconcileGates } from '../tools/generate/src/cli/gate-core'
import { breakdownOf, headlineOf, unmeasuredOf } from '../tools/repro-console/src/unmeasured'

// ── issue 1: the extractor's band-fill read, run offline ─────────────────────

/** A stubbed box-painting element: the one computed property the read needs. */
interface StubEl {
  bg: string
}

/** A slice as `bandSlicesIn` hands it on: the kept element, its box, its layers. */
interface StubSlice {
  el: StubEl
  box: { x: number; y: number; width: number; height: number }
  layers: { el: StubEl; box: { x: number; y: number; width: number; height: number } }[]
}

/**
 * `sliceBackgroundColor` over the colour helpers it calls, sliced out of
 * `EXTRACT_SCRIPT` by the functions' own source text rather than by line number,
 * so it cannot silently start testing different code after an edit above it.
 *
 * `rgbaOf`'s canvas probe is unavailable here (there is no `document`), and it
 * already falls through to its `rgb()/rgba()` regex path for exactly that case —
 * which is why the stub styles below are written in that form.
 */
function sliceBackgroundColorOffline(): (slice: StubSlice) => string | null {
  const colorFrom = EXTRACT_SCRIPT.indexOf('function h2(n)')
  const colorTo = EXTRACT_SCRIPT.indexOf("// REQ-72 — resolve a gradient's colour tokens", colorFrom)
  const sliceFrom = EXTRACT_SCRIPT.indexOf('function sliceBackgroundColor(slice)')
  const sliceTo = EXTRACT_SCRIPT.indexOf('// Which slice owns this box.', sliceFrom)
  expect(colorFrom).toBeGreaterThan(0)
  expect(colorTo).toBeGreaterThan(colorFrom)
  expect(sliceFrom).toBeGreaterThan(0)
  expect(sliceTo).toBeGreaterThan(sliceFrom)
  const src = `${EXTRACT_SCRIPT.slice(colorFrom, colorTo)}\n${EXTRACT_SCRIPT.slice(sliceFrom, sliceTo)}`
  const build = new Function('getComputedStyle', `${src}\nreturn sliceBackgroundColor;`) as (
    gcs: (el: StubEl) => { backgroundColor: string },
  ) => (slice: StubSlice) => string | null
  return build((el: StubEl) => ({ backgroundColor: el.bg }))
}

const BAND_BOX = { x: 0, y: 2949, width: 1280, height: 525 }

describe('BUG-161 issue 1 — a band paints what is on TOP of it', () => {
  const sliceBackgroundColor = sliceBackgroundColorOffline()

  it('test_UAT_FC_BUG-161_a_coincident_opaque_layer_is_the_bands_fill', () => {
    // The filed shape, transcribed: `backdrop-7` is the kept slice element and
    // paints white; `section-band-1` coincides with it exactly and paints
    // `#28542d` over it. Before the fix this read `#ffffff` and the comparator
    // agreed with the reference about a colour the page does not show.
    const fill = sliceBackgroundColor({
      el: { bg: 'rgb(255, 255, 255)' },
      box: BAND_BOX,
      layers: [{ el: { bg: 'rgb(40, 84, 45)' }, box: { ...BAND_BOX } }],
    })

    expect(fill).toBe('#28542d')
  })

  it('test_UAT_FC_BUG-161_the_topmost_of_several_coincident_opaque_layers_wins', () => {
    // Document-ordered smallest-last by `bandSlicesIn`'s own sort, so the LAST
    // coincident opaque layer is the one painting on top — the same order
    // `sliceBackgroundImage` reads its image off.
    const fill = sliceBackgroundColor({
      el: { bg: 'rgb(255, 255, 255)' },
      box: BAND_BOX,
      layers: [
        { el: { bg: 'rgb(40, 84, 45)' }, box: { ...BAND_BOX } },
        { el: { bg: 'rgb(10, 20, 30)' }, box: { ...BAND_BOX } },
      ],
    })

    expect(fill).toBe('#0a141e')
  })

  it('test_UAT_FC_BUG-161_a_translucent_coincident_layer_is_a_scrim_not_the_fill', () => {
    // The regression this fix must not cause. A full-bleed TRANSLUCENT fill is a
    // scrim, which `overlayInBox` already records as the band's overlay and which
    // the fold layers ABOVE the fill it veils; taking it as the fill would paint
    // it twice, and paint it solid over the photograph it was darkening.
    const fill = sliceBackgroundColor({
      el: { bg: 'rgb(3, 7, 23)' },
      box: BAND_BOX,
      layers: [{ el: { bg: 'rgba(3, 7, 23, 0.3)' }, box: { ...BAND_BOX } }],
    })

    expect(fill).toBe('#030717')
  })

  it('test_UAT_FC_BUG-161_a_layer_with_its_own_geometry_is_not_the_bands_fill', () => {
    // REQ-270's hero, in colour. A photograph (or any layer) sitting INSIDE a
    // taller fill paints part of the band and is not what the band paints; only a
    // box coinciding with the slice can be its fill.
    const fill = sliceBackgroundColor({
      el: { bg: 'rgb(3, 7, 23)' },
      box: { x: 0, y: 0, width: 1280, height: 900 },
      layers: [{ el: { bg: 'rgb(200, 30, 30)' }, box: { x: 0, y: 0, width: 1280, height: 800 } }],
    })

    expect(fill).toBe('#030717')
  })

  it('test_UAT_FC_BUG-161_a_slice_that_paints_nothing_still_reports_nothing', () => {
    // REQ-271's distinction survives: "paints no fill" and "paints white" are
    // different facts, and a slice with no opaque layer over it must still be able
    // to say the first one.
    const fill = sliceBackgroundColor({
      el: { bg: 'rgba(0, 0, 0, 0)' },
      box: BAND_BOX,
      layers: [{ el: { bg: 'rgba(0, 0, 0, 0)' }, box: { ...BAND_BOX } }],
    })

    expect(fill).toBeNull()
  })
})

// ── issue 2: the band-paint exclusion, and the count it was missing ──────────

function manifest(source: string, elements: ValueElement[], sections: ValueManifest['sections']): ValueManifest {
  return { source, elements, sections, viewport: { width: 1280, height: 800 } }
}

/** The reference's one text run, so the pairing has something to match on. */
const RUN = {
  text: 'What people are saying',
  role: 'heading',
  color: '#111111',
  fontFamily: 'Georgia',
  fontSizePx: 32,
  fontWeight: 700,
  box: { x: 80, y: 3000, width: 400, height: 40 },
} as ValueElement

/** A full-bleed textless box coinciding with the band — a reproduction's band paint. */
function bandPaint(surfaceFill: string | null): ValueElement {
  return {
    text: '(generic)',
    role: 'generic',
    a11yRole: 'generic',
    textless: true,
    box: { ...BAND_BOX },
    ...(surfaceFill === null ? {} : { surfaceFill }),
  } as ValueElement
}

const section = (surfaceFill: string | null) => [
  { index: 0, overlay: null, contentAnchorRatio: 0.38, surfaceFill, box: { ...BAND_BOX } },
]

describe('BUG-161 issue 2 — the band-paint exclusion is tested, not assumed', () => {
  it('test_UAT_FC_BUG-161_a_box_its_band_record_misreports_is_an_unpaired_object', () => {
    // The filed case, as the manifests actually read it: the reproduction's box
    // paints `#28542d` and the band record excusing it says `#ffffff`. The
    // exclusion's stated premise — "the reference represents the same fact on its
    // section record, so there is nothing on that side to pair them with" — is
    // false here, so the box is an ordinary unpaired object and the count says so.
    const report = diffManifests(
      manifest('ref', [RUN], section('#ffffff')),
      manifest('repro', [RUN, bandPaint('#28542d')], section('#ffffff')),
    )

    expect(report.bandPaintActual).toEqual([])
    expect(report.unpairedActual).toHaveLength(1)
    expect(report.unpairedActual[0].box).toEqual(BAND_BOX)
  })

  it('test_UAT_FC_BUG-161_a_box_its_band_record_reports_stays_lifted_out', () => {
    // And the exclusion is EARNED rather than removed: once the band record
    // reports the colour the box paints — which is what issue 1's extractor fix
    // makes it do — the section pass really is comparing the fact, and the box is
    // not counted as an unpaired object. The `surfaceFill` delta comes from there.
    const report = diffManifests(
      manifest('ref', [RUN], section('#ffffff')),
      manifest('repro', [RUN, bandPaint('#28542d')], section('#28542d')),
    )

    expect(report.unpairedActual).toEqual([])
    expect(report.bandPaintActual).toHaveLength(1)
    const fill = report.deltas.filter((d) => d.property === 'surfaceFill' && d.text === '§0')
    expect(fill).toHaveLength(1)
    expect([fill[0].expected, fill[0].actual]).toEqual(['#ffffff', '#28542d'])
  })

  it('test_UAT_FC_BUG-161_an_unmeasured_band_fill_does_not_demote_the_box', () => {
    // Only a DISAGREEMENT demotes. A band record that cannot say what it paints
    // (a bundle older than capture schema 3) is already reported as an unmeasured
    // axis one level up, and counting it here as well would count one silence
    // twice — the mirror of the error being fixed.
    const report = diffManifests(
      manifest('ref', [RUN], section('#ffffff')),
      manifest('repro', [RUN, bandPaint('#28542d')], [
        { index: 0, overlay: null, contentAnchorRatio: 0.38, box: { ...BAND_BOX } },
      ]),
    )

    expect(report.unpairedActual).toEqual([])
    expect(report.bandPaintActual).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-161_band_paint_is_counted_in_the_unmeasured_populations', () => {
    // The round's headline. Three reproduction paint boxes were measured by
    // nothing and counted by nothing: `unmeasured 4` where the honest number was
    // 7. A section record cannot hold a box's own `opacity`, `filter`,
    // `blendMode`, `borderRadiusPx` or `boxShadow` however faithfully it reports
    // its fill — so a band-paint box never leaves the comparison fully compared.
    const set = unmeasuredOf({
      values: {
        unmeasuredAxes: [],
        unpairedSections: 0,
        unpairedActualSections: 0,
        unmatched: 0,
        unpairedActual: 2,
        bandPaintActual: 3,
        notComparableAxes: [],
      },
    })

    expect(set.parts.find((p) => p.id === 'populations')?.count).toBe(5)
    expect(headlineOf(set)).toBe('unmeasured 5')
    expect(breakdownOf(set)).toMatch(/5 populations \(3 of these are a band's own paint/)
  })

  it('test_UAT_FC_BUG-161_a_report_that_cannot_say_makes_the_part_silent', () => {
    // The module's own discipline, applied to the new component: a report that
    // does not carry `bandPaintActual` cannot speak for this part, and reading its
    // silence as zero would manufacture the clean bill the set exists to refuse.
    const set = unmeasuredOf({
      values: {
        unmeasuredAxes: [],
        unpairedSections: 1,
        unpairedActualSections: 0,
        unmatched: 0,
        unpairedActual: 0,
        notComparableAxes: [],
      },
    })

    expect(set.parts.find((p) => p.id === 'populations')?.count).toBeNull()
    expect(set.silent).toContain('populations')
    expect(headlineOf(set)).toBe('unmeasured ≥ 1')
  })
})

// ── issue 3: a referenced image that paints nothing ──────────────────────────

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'bug161-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

type Fill = (x: number, y: number) => [number, number, number]

function raster(w: number, h: number, fill: Fill): Raster {
  const data = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y)
      const i = (y * w + x) * 3
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
  }
  return { data, width: w, height: h, channels: 3 }
}

const FLAT: Fill = () => [122, 122, 122]
/** A photograph's worth of texture: a deterministic pattern with real variance. */
const PHOTO: Fill = (x, y) => [(x * 7 + y * 13) % 256, (x * 3 + y * 29) % 256, (x * 17 + y * 5) % 256]

/** The reference manifest as a node source: one image element at a known box. */
const IMAGE_SOURCE = {
  viewport: { width: 128, height: 128 },
  elements: [{ src: 'assets/10.jpg', textless: true, box: { x: 32, y: 32, width: 64, height: 64 } }],
  sections: [],
}

describe('BUG-161 issue 3 — a referenced image that paints nothing is a coverage finding', () => {
  it('test_UAT_FC_BUG-161_a_flat_crop_under_a_textured_reference_is_reported', () => {
    // The filed measurement, reproduced: `ours variance 0.0` against `ref variance
    // 1035.535` over the image element's own box. Three identical channels across
    // the whole crop is the page background showing through a box that was
    // supposed to hold a photograph.
    const ref = raster(128, 128, (x, y) => (x >= 32 && x < 96 && y >= 32 && y < 96 ? PHOTO(x, y) : [255, 255, 255]))
    const actual = raster(128, 128, (x, y) => (x >= 32 && x < 96 && y >= 32 && y < 96 ? FLAT(x, y) : [255, 255, 255]))

    const found = unpaintedImages(ref, actual, IMAGE_SOURCE, 1)

    expect(found).toHaveLength(1)
    expect(found[0].handle).toBe('assets/10.jpg')
    expect(found[0].box).toEqual({ x: 32, y: 32, w: 64, h: 64 })
    expect(found[0].variance.actual).toBe(0)
    expect(found[0].variance.ref).toBeGreaterThan(100)
  })

  it('test_UAT_FC_BUG-161_an_image_that_paints_is_not_reported', () => {
    // The count is earned: a reproduction that paints the image — even a
    // different one — is not a content-completeness failure. A wrong image is a
    // colour finding the ranked regions already carry.
    const ref = raster(128, 128, PHOTO)
    const actual = raster(128, 128, (x, y) => PHOTO(y, x))

    expect(unpaintedImages(ref, actual, IMAGE_SOURCE, 1)).toEqual([])
  })

  it('test_UAT_FC_BUG-161_a_flat_reference_crop_carries_no_evidence_either_way', () => {
    // And it never guesses. A reference crop that is itself flat — a solid-colour
    // logo, a spacer — says nothing about whether we painted it, so nothing is
    // reported rather than a finding invented from an absence.
    const ref = raster(128, 128, () => [200, 200, 200])
    const actual = raster(128, 128, FLAT)

    expect(unpaintedImages(ref, actual, IMAGE_SOURCE, 1)).toEqual([])
  })

  it('test_UAT_FC_BUG-161_the_diff_report_carries_the_unpainted_images', async () => {
    // The hop that matters first: `1c diff` is the only stage holding both
    // rasters, so it is the only place the measurement can be made — and it has to
    // reach `regions.json` or the gate cannot read it.
    const dir = freshDir()
    const refPng = await writeRasterPng(
      raster(128, 128, (x, y) => (x >= 32 && x < 96 && y >= 32 && y < 96 ? PHOTO(x, y) : [255, 255, 255])),
      path.join(dir, 'ref.png'),
    )
    const actualPng = await writeRasterPng(
      raster(128, 128, (x, y) => (x >= 32 && x < 96 && y >= 32 && y < 96 ? FLAT(x, y) : [255, 255, 255])),
      path.join(dir, 'actual.png'),
    )

    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: actualPng,
      out: path.join(dir, 'out'),
      nodeSources: { ref: IMAGE_SOURCE },
    })

    expect(report.unpaintedImages?.map((i) => i.handle)).toEqual(['assets/10.jpg'])
    const written = JSON.parse(readFileSync(path.join(dir, 'out', 'regions.json'), 'utf8'))
    expect(written.unpaintedImages).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-161_the_gate_reports_it_as_coverage_not_as_capture_incompleteness', () => {
    // `coverage.referencedImages` counts references in the reference manifest, so
    // a mirrored asset the reproduction drops entirely still reads as covered
    // there. The finding belongs beside that number — but on the REPRODUCTION's
    // side of it: `capture-incomplete` means "the value gates are blind because
    // the reference is impoverished", and it outranks the delta count, so folding
    // this in undiscriminated would send the operator to fix a complete capture.
    const gate = reconcileGates({
      perceptual: {
        meanDiff: 40,
        pctOverThreshold: 60,
        regions: [{}],
        unpaintedImages: [{ handle: 'assets/10.jpg' }],
      },
      l1Gate: {
        pass: true,
        onSample: { pass: true, byWidth: [] },
        offSample: { pass: true, byWidth: [] },
        contentRobustness: { pass: true, byWidth: [] },
        sampleFidelity: { pass: true, maxDeltaPx: 0, byWidth: [] },
      },
      coverage: {
        mirroredImages: 7,
        referencedImages: 7,
        unreferencedImages: [],
        sections: 11,
        pageHeightPx: 4843,
        pxPerSection: 440,
        findings: [],
      },
      values: {
        deltas: [],
        matched: 1,
        unmatched: 0,
        unpairedActual: [],
        unpairedSections: [],
        unpairedActualSections: [],
        notComparableAxes: [],
      },
    })

    const finding = gate.coverage.findings.find((f) => f.kind === 'unpainted-image')
    expect(finding).toBeDefined()
    expect(finding?.side).toBe('reproduction')
    expect(finding?.detail).toMatch(/`10\.jpg`/)
    // Not the capture's fault, and not unexplained either: the instrument named
    // the defect, so the run is told to work the finding rather than to go and add
    // an L1 axis for a pixel nothing accounts for.
    expect(gate.verdict).toBe('reproduction-wrong')
    expect(gate.nextStep).toMatch(/Work the coverage finding\(s\) — `unpainted-image`/)
  })
})
