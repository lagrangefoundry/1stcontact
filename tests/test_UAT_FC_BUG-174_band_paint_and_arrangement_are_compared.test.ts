/**
 * BUG-174 — two comparisons every site with full-bleed bands skipped, which
 * BUG-160 and BUG-161 had made visible and this makes MEASURED.
 *
 *   1. A band's own paint. A reproduction paints each band on a full-bleed box
 *      whose `opacity`, `filter`, `blendMode`, corner radius and shadow are element
 *      axes; the reference band was a section record carrying only its fill and
 *      imagery, so those five went uncompared on both sides and every such box sat
 *      in `values.bandPaintActual` permanently. The band record now carries them
 *      (capture schema 12), the section pass compares them, and a box whose five
 *      were all compared leaves the unmeasured count.
 *   2. `arrangement`. Each side related an element to the one before it in ITS
 *      OWN list, and the lists differ (a reference band's list starts at its own
 *      first run; a reproduction emits band containers the reference has no
 *      counterpart for), so 22 of 59 gigabytealchemy pairs read nothing on one
 *      side. Both sides are now related over the same population: the paired
 *      elements, each side in its own order.
 *
 * Evidence shape: the extractor's new reads run OFFLINE, sliced out of
 * `EXTRACT_SCRIPT` by their own source text (no browser in this sandbox — the
 * BUG-153/161 pattern). Everything downstream drives the real `buildSections`,
 * `flattenCapture`, `flattenSignals`, `diffManifests`, `reconcileGates` and
 * `unmeasuredOf`. No mocks.
 */
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  diffManifests,
  flattenCapture,
  flattenSignals,
  staleCaptureAxes,
  type BandPaint,
  type Capture,
  type RawBand,
  type RawSignals,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { buildSections } from '../tools/generate/src/cli/capture/sections'
import { reconcileGates } from '../tools/generate/src/cli/gate-core'
import { unmeasuredOf } from '../tools/repro-console/src/unmeasured'

// ── issue 1 · the extractor reads a band's own paint ─────────────────────────

/** The full source of one `function name(...) {...}` in the extract script. */
function fnSource(name: string): string {
  const from = EXTRACT_SCRIPT.indexOf(`function ${name}(`)
  expect(from, `function ${name} is in EXTRACT_SCRIPT`).toBeGreaterThan(0)
  let depth = 0
  for (let i = EXTRACT_SCRIPT.indexOf('{', from); i < EXTRACT_SCRIPT.length; i++) {
    if (EXTRACT_SCRIPT[i] === '{') depth++
    else if (EXTRACT_SCRIPT[i] === '}' && --depth === 0) return EXTRACT_SCRIPT.slice(from, i + 1)
  }
  throw new Error(`unbalanced ${name}`)
}

interface StubStyle {
  backgroundImage?: string
  backgroundColor?: string
  opacity?: string
  filter?: string
  mixBlendMode?: string
  boxShadow?: string
  radius?: string
}
interface StubEl {
  style: StubStyle
}
type StubBox = { x: number; y: number; width: number; height: number }
interface StubLayer {
  el: StubEl
  box: StubBox
}

/** `bandPaintOf` + `slicePaintLayer` over the real helpers they call, with a stubbed style. */
function extractorOffline(): {
  bandPaintOf: (el: StubEl, box: StubBox) => BandPaint
  slicePaintLayer: (slice: { el: StubEl; box: StubBox; layers: StubLayer[] }) => StubLayer
} {
  const names = ['rgbaOf', 'opacityOf', 'paintedOrNull', 'borderRadiusOf', 'boxShadowOf', 'bandPaintOf', 'slicePaintLayer']
  const src = `${names.map(fnSource).join('\n')}\nreturn { bandPaintOf: bandPaintOf, slicePaintLayer: slicePaintLayer };`
  const gcs = (el: StubEl) => {
    const s = el.style
    const r = s.radius ?? '0px'
    return {
      backgroundImage: s.backgroundImage ?? 'none',
      backgroundColor: s.backgroundColor ?? 'rgba(0, 0, 0, 0)',
      opacity: s.opacity ?? '1',
      filter: s.filter ?? 'none',
      mixBlendMode: s.mixBlendMode ?? 'normal',
      boxShadow: s.boxShadow ?? 'none',
      borderTopLeftRadius: r,
      borderTopRightRadius: r,
      borderBottomLeftRadius: r,
      borderBottomRightRadius: r,
    }
  }
  // `colorCtx` returns null so `rgbaOf` takes its `rgb()/rgba()` regex path — the
  // canvas probe needs a `document` this sandbox does not have.
  return new Function('getComputedStyle', 'colorCtx', src)(gcs, () => null)
}

const HERO: StubBox = { x: 0, y: 0, width: 1280, height: 800 }

describe('BUG-174 issue 1 — the extractor records a band\'s own paint', () => {
  const { bandPaintOf, slicePaintLayer } = extractorOffline()

  it('test_UAT_FC_BUG-174_the_band_paint_carries_all_five_axes', () => {
    // The filed case: the hero photograph paints at opacity .49 under a
    // brightness filter, and no record held either fact.
    const paint = bandPaintOf(
      { style: { opacity: '0.49', filter: 'brightness(0.67)', mixBlendMode: 'multiply', boxShadow: 'rgb(0, 0, 0) 0px 4px 12px 0px', radius: '12px' } },
      HERO,
    )
    expect(paint).toEqual({
      opacity: 0.49,
      filter: 'brightness(0.67)',
      blendMode: 'multiply',
      borderRadiusPx: 12,
      boxShadow: 'rgb(0, 0, 0) 0px 4px 12px 0px',
    })
    // And the no-op defaults are MEASURED nones, not absences.
    expect(bandPaintOf({ style: {} }, HERO)).toEqual({
      opacity: 1,
      filter: null,
      blendMode: null,
      borderRadiusPx: 0,
      boxShadow: null,
    })
  })

  it('test_UAT_FC_BUG-174_a_slice_is_painted_by_the_layer_its_imagery_or_fill_was_read_off', () => {
    const sliceEl: StubEl = { style: { backgroundColor: 'rgb(255, 255, 255)' } }
    const photo: StubLayer = { el: { style: { backgroundImage: 'url(hero.jpg)', opacity: '0.49' } }, box: { x: 0, y: 0, width: 1280, height: 700 } }
    const plate: StubLayer = { el: { style: { backgroundColor: 'rgb(0, 0, 0)' } }, box: { ...HERO } }
    const scrim: StubLayer = { el: { style: { backgroundColor: 'rgba(0, 0, 0, 0.3)' } }, box: { ...HERO } }

    // The image layer wins — it is the layer `sliceBackgroundImage` reads.
    expect(slicePaintLayer({ el: sliceEl, box: HERO, layers: [plate, photo] })).toBe(photo)
    // No image: the topmost coincident OPAQUE layer — `sliceBackgroundColor`'s
    // pick; a translucent scrim is the overlay, not the paint.
    expect(slicePaintLayer({ el: sliceEl, box: HERO, layers: [plate, scrim] })).toBe(plate)
    // Neither: the slice element itself.
    expect(slicePaintLayer({ el: sliceEl, box: HERO, layers: [scrim] }).el).toBe(sliceEl)
  })
})

// ── issue 1 · the diff compares it, and the box drains ───────────────────────

const PAINTED: BandPaint = { opacity: 1, filter: null, blendMode: null, borderRadiusPx: 0, boxShadow: null }
const COPY_BOX = { x: 88, y: 300, width: 600, height: 48 }

function rawBand(paint: BandPaint | undefined): RawBand {
  return {
    box: { ...HERO },
    backgroundColor: '#030717',
    backgroundImage: 'none',
    colorScheme: 'dark',
    fontFamily: 'Inter',
    textAlign: 'left',
    paddingTopPx: 0,
    paddingBottomPx: 0,
    overlay: null,
    ...(paint ? { paint } : {}),
    content: [],
    items: [],
    fields: [],
  } as RawBand
}

function signalsOf(paint: BandPaint | undefined): RawSignals {
  return {
    viewport: { width: 1280, height: 800 },
    bands: [rawBand(paint)],
    colorUsage: [],
    fontFaces: [],
    typeScale: [40],
    spacingScalePx: [40],
    containerMaxWidthPx: null,
    images: [],
  } as unknown as RawSignals
}

/** The reference bundle a capture of one hero band writes, through the real segmentation. */
function referenceOf(paint: BandPaint | undefined, captureSchema = CAPTURE_SCHEMA): ValueManifest {
  const capture = {
    url: 'https://bands.test/',
    host: 'bands.test',
    path: '/',
    capturedAt: '2026-10-01T00:00:00.000Z',
    captureSchema,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: buildSections(signalsOf(paint), () => undefined),
    assets: [],
  } as unknown as Capture
  return flattenCapture(capture)
}

const COPY: ValueElement = {
  text: 'Alchemy for your bytes',
  role: 'heading',
  color: '#ffffff',
  fontFamily: 'Inter',
  fontSizePx: 40,
  fontWeight: 700,
  box: { ...COPY_BOX },
} as ValueElement

/** The reproduction: its band record, plus the full-bleed box that paints it. */
function reproductionOf(bandPaint: BandPaint, box: Partial<BandPaint> = bandPaint): ValueManifest {
  const m = flattenSignals(signalsOf(bandPaint), 'repro')
  m.elements.push(
    { ...COPY },
    {
      text: '(generic)',
      role: 'generic',
      a11yRole: 'generic',
      textless: true,
      box: { ...HERO },
      surfaceFill: '#030717',
      ...box,
    } as ValueElement,
  )
  return m
}

function referenceWithCopy(paint: BandPaint | undefined, captureSchema?: number): ValueManifest {
  const m = referenceOf(paint, captureSchema)
  m.elements.push({ ...COPY })
  return m
}

const paintDeltas = (r: ReturnType<typeof diffManifests>) =>
  r.deltas.filter((d) => d.role === 'section' && ['opacity', 'filter', 'blendMode', 'shape', 'boxShadow'].includes(d.property))

describe('BUG-174 issue 1 — a band\'s paint is compared and the box leaves the unmeasured count', () => {
  it('test_UAT_FC_BUG-174_a_band_painting_at_a_different_opacity_is_an_opacity_delta', () => {
    const half = { ...PAINTED, opacity: 0.5 }
    const report = diffManifests(referenceWithCopy(PAINTED), reproductionOf(half))

    const op = paintDeltas(report)
    expect(op).toHaveLength(1)
    expect(op[0].property).toBe('opacity')
    expect(op[0].text).toBe('§0')
    expect([op[0].expected, op[0].actual]).toEqual(['1', '0.5'])
    // Compared, so not unmeasured: the box drains out of `bandPaintActual` into
    // the list that keeps the element accounting whole.
    expect(report.bandPaintActual).toEqual([])
    expect(report.bandPaintComparedActual).toHaveLength(1)
    expect(report.unpairedActual).toEqual([])
  })

  it('test_UAT_FC_BUG-174_a_band_whose_paint_matches_reports_nothing_and_nothing_unmeasured', () => {
    const report = diffManifests(referenceWithCopy(PAINTED), reproductionOf(PAINTED))

    expect(paintDeltas(report)).toEqual([])
    expect(report.bandPaintActual).toEqual([])
    expect(report.bandPaintComparedActual).toHaveLength(1)
    // And the console's unmeasured populations read zero for it.
    const set = unmeasuredOf({ values: report })
    expect(set.parts.find((p) => p.id === 'populations')?.count).toBe(0)
  })

  it('test_UAT_FC_BUG-174_each_paint_axis_is_compared', () => {
    const ref = referenceWithCopy({
      opacity: 1,
      filter: 'brightness(0.67)',
      blendMode: 'multiply',
      borderRadiusPx: 0,
      boxShadow: 'rgb(0, 0, 0) 0px 4px 12px 0px',
    })
    const repro = reproductionOf({ opacity: 1, filter: null, blendMode: null, borderRadiusPx: 24, boxShadow: null })
    const props = paintDeltas(diffManifests(ref, repro)).map((d) => d.property).sort()

    expect(props).toEqual(['blendMode', 'boxShadow', 'filter', 'shape'])
  })

  it('test_UAT_FC_BUG-174_a_bundle_before_the_paint_axes_stays_unmeasured_not_clean', () => {
    // A reference captured before schema 12 records no `paint`: the five axes are
    // UNMEASURED there. Nothing is compared against a default — no delta, however
    // the reproduction paints — and the box stays in `bandPaintActual`.
    const old = referenceWithCopy(undefined, 11)
    expect(old.sections[0].opacity).toBeUndefined()
    const report = diffManifests(old, reproductionOf({ ...PAINTED, opacity: 0.2 }))

    expect(paintDeltas(report)).toEqual([])
    expect(report.bandPaintActual).toHaveLength(1)
    expect(report.bandPaintComparedActual).toEqual([])
    // And the bundle's stamp says which axis a re-capture would add.
    const capture = { captureSchema: 11, sections: [] } as unknown as Capture
    expect(staleCaptureAxes(capture).map((a) => a.axis).join(' ')).toMatch(/band's own paint/)
  })

  it('test_UAT_FC_BUG-174_a_box_whose_paint_its_band_record_misreports_is_an_unpaired_object', () => {
    // BUG-161's premise test, five axes further: the band record says opacity 1
    // and the box that is supposedly that paint is at .3. The record does not
    // describe this box, so nothing compared it and it is an ordinary unpaired
    // object.
    const report = diffManifests(referenceWithCopy(PAINTED), reproductionOf(PAINTED, { ...PAINTED, opacity: 0.3 }))

    expect(report.unpairedActual).toHaveLength(1)
    expect(report.bandPaintActual).toEqual([])
    expect(report.bandPaintComparedActual).toEqual([])
  })

  it('test_UAT_FC_BUG-174_the_gate_names_no_band_paint_once_it_is_compared', () => {
    const diff = diffManifests(referenceWithCopy(PAINTED), reproductionOf(PAINTED))
    const gate = reconcileGates({
      perceptual: { meanDiff: 0, pctOverThreshold: 0, regions: [] },
      l1Gate: {
        pass: true,
        onSample: { pass: true, byWidth: [] },
        offSample: { pass: true, byWidth: [] },
        contentRobustness: { pass: true, byWidth: [] },
        sampleFidelity: { pass: true, maxDeltaPx: 0, byWidth: [] },
      },
      coverage: { sections: 1, elements: 1, findings: [] },
      values: diff,
    })

    expect(gate.values.bandPaintActual).toBe(0)
    expect(JSON.stringify(gate)).not.toMatch(/band's own PAINT/)
  })
})

// ── issue 2 · arrangement over one population ────────────────────────────────

function el(text: string, box: { x: number; y: number; width: number; height: number }, over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'body', color: '#111827', fontFamily: 'Inter', fontSizePx: 16, fontWeight: 400, box, ...over } as ValueElement
}
const manifest = (source: string, elements: ValueElement[]): ValueManifest => ({
  source,
  elements,
  sections: [],
  viewport: { width: 1280, height: 800 },
})
const arrangementRows = (r: ReturnType<typeof diffManifests>) => [
  ...r.unmeasuredAxes.filter((u) => u.axis === 'arrangement'),
  ...r.notComparableAxes.filter((u) => u.axis === 'arrangement'),
]
const arrangementDeltas = (r: ReturnType<typeof diffManifests>) => r.deltas.filter((d) => d.property === 'arrangement')

describe('BUG-174 issue 2 — arrangement is related over the paired elements on both sides', () => {
  it('test_UAT_FC_BUG-174_an_unpaired_container_cannot_become_a_predecessor', () => {
    // The reproduction emits a band container between two paired runs — the
    // shape the reference has no counterpart for. Over each side's own list the
    // container would be `Our Mission`'s predecessor on one side only; over the
    // PAIRED population both sides relate `Our Mission` to `Gigabyte Alchemy`.
    const ref = manifest('ref', [el('Gigabyte Alchemy', { x: 88, y: 100, width: 400, height: 40 }), el('Our Mission', { x: 88, y: 900, width: 400, height: 40 })])
    const container = el('(generic)', { x: 0, y: 800, width: 1280, height: 400 }, { textless: true, role: 'generic', a11yRole: 'generic' })
    const repro = manifest('repro', [ref.elements[0], container, ref.elements[1]].map((e) => ({ ...e })))
    const report = diffManifests(ref, repro)

    expect(arrangementDeltas(report)).toEqual([])
    expect(arrangementRows(report)).toEqual([])
  })

  it('test_UAT_FC_BUG-174_an_element_opening_a_band_is_still_compared', () => {
    // The filed population: on a DOM-built reference every run that opens a band
    // was captured with `arrangement: null`, because the capture related it within
    // its own band only — and the both-sides guard skipped it. Over the paired
    // population it has a predecessor on both sides, so the capture's null is
    // irrelevant and a genuine change is reported: the run before it moved down
    // beside it, while it did not move.
    const ref = manifest('ref', [
      el('Gigabyte Alchemy', { x: 88, y: 100, width: 400, height: 40 }, { arrangement: null }),
      el('Our Mission', { x: 88, y: 900, width: 400, height: 40 }, { arrangement: null }),
    ])
    const repro = manifest('repro', [
      el('Gigabyte Alchemy', { x: 520, y: 890, width: 400, height: 40 }, { arrangement: null }),
      el('Our Mission', { x: 88, y: 900, width: 400, height: 40 }, { arrangement: 'stack' }),
    ])
    const report = diffManifests(ref, repro)

    expect(report.unmeasuredAxes.filter((u) => u.axis === 'arrangement')).toEqual([])
    const d = arrangementDeltas(report)
    expect(d).toHaveLength(1)
    expect(d[0].text).toBe('Our Mission')
    expect([d[0].expected, d[0].actual]).toEqual(['below prev', 'beside (right-of prev)'])
  })

  it('test_UAT_FC_BUG-174_an_element_with_no_predecessor_is_skipped_not_unread', () => {
    // The one pair the axis legitimately skips: the first element in a side's
    // order has nothing before it. That is not a reading one side lacks, so it
    // is neither a delta nor an unmeasured row.
    const report = diffManifests(
      manifest('ref', [el('Only', { x: 88, y: 100, width: 400, height: 40 }, { arrangement: 'row' })]),
      manifest('repro', [el('Only', { x: 88, y: 100, width: 400, height: 40 })]),
    )

    expect(arrangementDeltas(report)).toEqual([])
    expect(arrangementRows(report)).toEqual([])
  })

  it('test_UAT_FC_BUG-174_a_still_element_whose_neighbour_moved_reports_its_arrangement', () => {
    const ref = manifest('ref', [
      el('Get in touch', { x: 88, y: 100, width: 300, height: 40 }),
      el('Send', { x: 400, y: 100, width: 120, height: 40 }),
    ])
    const repro = manifest('repro', [
      el('Get in touch', { x: 88, y: 40, width: 300, height: 40 }),
      el('Send', { x: 400, y: 100, width: 120, height: 40 }),
    ])
    const d = arrangementDeltas(diffManifests(ref, repro))

    expect(d).toHaveLength(1)
    expect(d[0].text).toBe('Send')
    expect(d[0].tier).toBe('CRITICAL')
    expect([d[0].expected, d[0].actual]).toEqual(['beside (right-of prev)', 'below prev'])
  })

  it('test_UAT_FC_BUG-174_the_gate_reports_no_arrangement_hole', () => {
    // BUG-160's gate row inverts: the comparison it reported missing now runs.
    const diff = diffManifests(
      manifest('ref', [el('Gigabyte Alchemy', { x: 88, y: 100, width: 400, height: 40 }), el('Our Mission', { x: 88, y: 900, width: 400, height: 40 })]),
      manifest('repro', [el('Gigabyte Alchemy', { x: 88, y: 100, width: 400, height: 40 }), el('Our Mission', { x: 88, y: 900, width: 400, height: 40 })]),
    )
    const gate = reconcileGates({
      perceptual: { meanDiff: 0, pctOverThreshold: 0, regions: [] },
      l1Gate: {
        pass: true,
        onSample: { pass: true, byWidth: [] },
        offSample: { pass: true, byWidth: [] },
        contentRobustness: { pass: true, byWidth: [] },
        sampleFidelity: { pass: true, maxDeltaPx: 0, byWidth: [] },
      },
      coverage: { sections: 0, elements: 2, findings: [] },
      values: diff,
    })

    expect(gate.values.unmeasuredAxes.filter((u) => u.axis === 'arrangement')).toEqual([])
  })
})
