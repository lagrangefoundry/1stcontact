import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  diffManifests,
  collapseMultiViewport,
  formatCollapsedReport,
  clusterDefects,
  formatClusterReport,
  formatMultiViewportReport,
  selectMultiViewportPayload,
  parseArgs,
  EXTRACT_SCRIPT,
  type CollapsedDefect,
  type DefectCause,
  type RawSignals,
  type StateDiff,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-63 — the coverage audit that closes the values-diff's remaining
 * BLIND SPOTS: whole render-affecting CSS axes a visible difference could slip
 * through because nothing captured or compared them. Each new axis is additive
 * (an optional field), so it can only *reduce* false negatives — a matching or
 * absent axis must never fabricate a delta (the second assertion in each block).
 *
 * The comparator UATs drive `diffManifests` directly (pure, browser-free — the
 * same engine the CLI runs); one extraction UAT runs the real EXTRACT_SCRIPT
 * under jsdom to prove the new axes are read from computed styles end to end.
 */

// ── fixture builders ─────────────────────────────────────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
/** A text-free image element (pairs on a11yRole + order). */
function imgEl(over: Partial<ValueElement> = {}): ValueElement {
  return {
    role: 'img',
    text: '(img)',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    box: box(0, 0, 200, 200),
    ...over,
  }
}
function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [] }
}
const hasDelta = (deltas: { text: string; property: string }[], textSub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(textSub) && d.property === property)
const hasProp = (deltas: { property: string }[], property: string): boolean =>
  deltas.some((d) => d.property === property)

// ── typography treatment axes (whole properties, previously blind) ───────────

describe('REQ-63 values-diff — typography treatment axes are compared', () => {
  it('test_UAT_FC_REQ-63_font_style_italic_delta', () => {
    // The poster child: a heading rendered italic vs roman was invisible — no
    // colour, size, weight, or box field moves.
    const d = diffManifests(
      mani('ref', [el('Heading', { fontStyle: 'italic' })]),
      mani('a', [el('Heading', { fontStyle: null })]),
    )
    expect(hasDelta(d.deltas, 'Heading', 'fontStyle')).toBe(true)
    // Matching italic → no delta (only reduces false negatives).
    const same = diffManifests(
      mani('ref', [el('Heading', { fontStyle: 'italic' })]),
      mani('a', [el('Heading', { fontStyle: 'italic' })]),
    )
    expect(hasProp(same.deltas, 'fontStyle')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_text_decoration_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Link', { textDecoration: 'underline' })]),
      mani('a', [el('Link', { textDecoration: null })]),
    )
    expect(hasDelta(d.deltas, 'Link', 'textDecoration')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_text_transform_delta', () => {
    // A CSS `text-transform: uppercase` vs no transform — the rendered casing the
    // verbatim-text compare can't always separate from a hardcoded literal.
    const d = diffManifests(
      mani('ref', [el('Label', { textTransform: 'uppercase' })]),
      mani('a', [el('Label', { textTransform: null })]),
    )
    expect(hasDelta(d.deltas, 'Label', 'textTransform')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_font_variant_small_caps_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Brand', { fontVariant: 'small-caps' })]),
      mani('a', [el('Brand', { fontVariant: null })]),
    )
    expect(hasDelta(d.deltas, 'Brand', 'fontVariant')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_list_marker_delta', () => {
    // A bullet (disc) vs a suppressed marker (none) — the marker glyph is not a
    // text node, so nothing compared it before.
    const d = diffManifests(
      mani('ref', [el('Item', { role: 'listitem', listMarker: 'disc' })]),
      mani('a', [el('Item', { role: 'listitem', listMarker: null })]),
    )
    expect(hasDelta(d.deltas, 'Item', 'listMarker')).toBe(true)
  })
})

// ── effects (per element) ─────────────────────────────────────────────────────

describe('REQ-63 values-diff — effects axes are compared', () => {
  it('test_UAT_FC_REQ-63_backdrop_filter_presence_delta', () => {
    // A frosted-glass panel (backdrop-filter: blur) present in the reference,
    // absent in the repro — a pixel-obvious treatment no other field holds.
    const d = diffManifests(
      mani('ref', [el('Panel', { backdropFilter: 'blur(12px)' })]),
      mani('a', [el('Panel', { backdropFilter: null })]),
    )
    expect(hasDelta(d.deltas, 'Panel', 'backdropFilter')).toBe(true)
    const same = diffManifests(
      mani('ref', [el('Panel', { backdropFilter: 'blur(12px)' })]),
      mani('a', [el('Panel', { backdropFilter: 'blur(4px)' })]),
    )
    // Presence-compared (value strings drift): both present → no delta.
    expect(hasProp(same.deltas, 'backdropFilter')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_blend_mode_value_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Overlay', { blendMode: 'multiply' })]),
      mani('a', [el('Overlay', { blendMode: 'screen' })]),
    )
    expect(hasDelta(d.deltas, 'Overlay', 'blendMode')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_opacity_partial_delta', () => {
    // A ghosted (opacity 0.5) element vs a solid one — a tonal defect no colour
    // field holds; a 0.5 vs 0.5 re-render is not a delta.
    const d = diffManifests(
      mani('ref', [el('Ghost', { opacity: 0.5 })]),
      mani('a', [el('Ghost', { opacity: 1 })]),
    )
    expect(hasDelta(d.deltas, 'Ghost', 'opacity')).toBe(true)
    const same = diffManifests(
      mani('ref', [el('Ghost', { opacity: 0.5 })]),
      mani('a', [el('Ghost', { opacity: 0.5 })]),
    )
    expect(hasProp(same.deltas, 'opacity')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_outline_presence_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Field', { outline: '2px solid #3b82f6' })]),
      mani('a', [el('Field', { outline: null })]),
    )
    expect(hasDelta(d.deltas, 'Field', 'outline')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_pseudo_content_value_delta', () => {
    // An injected ::before icon present in the reference, absent in the repro.
    const d = diffManifests(
      mani('ref', [el('Chip', { pseudo: 'before' })]),
      mani('a', [el('Chip', { pseudo: null })]),
    )
    expect(hasDelta(d.deltas, 'Chip', 'pseudo')).toBe(true)
  })
})

// ── border cluster ───────────────────────────────────────────────────────────

describe('REQ-63 values-diff — border line style + media crop', () => {
  it('test_UAT_FC_REQ-63_border_style_dashed_vs_solid_delta', () => {
    // Same width + colour, different line style — a dashed rule vs a solid one
    // was invisible: only width + colour were compared.
    const d = diffManifests(
      mani('ref', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'dashed' } })]),
      mani('a', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'solid' } })]),
    )
    expect(hasDelta(d.deltas, 'Card', 'border')).toBe(true)
    // A reference that never captured a style (pre-REQ-63) must not fabricate a
    // style delta against a repro that did.
    const legacy = diffManifests(
      mani('ref', [el('Card', { border: { widthPx: 1, color: '#334155' } })]),
      mani('a', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'solid' } })]),
    )
    expect(hasProp(legacy.deltas, 'border')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_object_position_crop_delta', () => {
    // Same box + object-fit, different crop anchor (top vs centre) reframes the
    // photo — a media fact no size or fit field holds.
    const d = diffManifests(
      mani('ref', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
      mani('a', [imgEl({ objectFit: 'cover', objectPosition: '50% 50%' })]),
    )
    expect(hasProp(d.deltas, 'objectPosition')).toBe(true)
    const same = diffManifests(
      mani('ref', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
      mani('a', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
    )
    expect(hasProp(same.deltas, 'objectPosition')).toBe(false)
  })
})

// ── extraction: the real EXTRACT_SCRIPT reads the new axes from computed styles ─

describe('REQ-63 in-page extraction (EXTRACT_SCRIPT under jsdom)', () => {
  it('test_UAT_FC_REQ-63_extract_reads_typography_and_effects', () => {
    const html = `<!doctype html><html><body>
      <section style="background:#ffffff">
        <h1 style="font-style:italic;text-decoration:underline;text-transform:uppercase;font-variant:small-caps;opacity:0.6;mix-blend-mode:multiply;border:2px dashed #334155">Styled Heading</h1>
      </section></body></html>`
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
    const win = dom.window as unknown as { eval(s: string): unknown }
    const R = (x: number, y: number, w: number, h: number) =>
      ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
    dom.window.Element.prototype.getBoundingClientRect = function () {
      return R(64, 48, 600, 60) as unknown as DOMRect
    }
    Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
    Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })

    const signals = win.eval(EXTRACT_SCRIPT) as RawSignals
    const run = signals.bands.flatMap((b) => b.content).find((r) => r.text === 'Styled Heading')!
    expect(run, 'heading captured').toBeDefined()
    // Typography treatment axes — each read from computed styles (was blind).
    expect(run.fontStyle).toBe('italic')
    expect(run.textDecoration).toBe('underline')
    expect(run.textTransform).toBe('uppercase')
    expect(run.fontVariant).toBe('small-caps')
    // Effects — partial opacity + blend mode.
    expect(run.opacity).toBeCloseTo(0.6, 2)
    expect(run.blendMode).toBe('multiply')
    // Box border on a TEXT RUN (was fields-only) with its line style.
    expect(run.borderWidthPx).toBe(2)
    expect(run.borderStyle).toBe('dashed')
  })
})

// ── REQ-64 — Type-A axes that were captured/half-compared but had no delta ────

/**
 * REQ-64 coverage additions: the values-diff already saw *most* author-set
 * (Type-A) values; these close the last gaps so every Type-A value is directly
 * visible (a difference to COPY), not just its emergent shadow. Each is additive
 * (optional field) — a matching or absent axis must never fabricate a delta.
 */
describe('REQ-64 values-diff — Type-A coverage gaps (padding sides, text-align, font fallback)', () => {

  it('test_UAT_AC1313_element_padding_sides_still_compared', () => {
    // Only paddingLeft was compared; a card's internal top/right/bottom pad (a box
    // that reads narrower/taller) was invisible. AC-1313: per-ELEMENT padding is
    // untouched by the section-band padding retirement — a card's own internal pad
    // is a value the author sets, not a component of the emergent band gap.
    const d = diffManifests(
      mani('ref', [el('Card', { paddingTopPx: 8, paddingRightPx: 8, paddingBottomPx: 8 })]),
      mani('a', [el('Card', { paddingTopPx: 24, paddingRightPx: 24, paddingBottomPx: 24 })]),
    )
    expect(hasDelta(d.deltas, 'Card', 'paddingTopPx')).toBe(true)
    expect(hasDelta(d.deltas, 'Card', 'paddingRightPx')).toBe(true)
    expect(hasDelta(d.deltas, 'Card', 'paddingBottomPx')).toBe(true)
    // Matching padding → no delta.
    const same = diffManifests(
      mani('ref', [el('Card', { paddingTopPx: 8, paddingRightPx: 8, paddingBottomPx: 8 })]),
      mani('a', [el('Card', { paddingTopPx: 8, paddingRightPx: 8, paddingBottomPx: 8 })]),
    )
    expect(hasProp(same.deltas, 'paddingTopPx')).toBe(false)
    expect(hasProp(same.deltas, 'paddingRightPx')).toBe(false)
    expect(hasProp(same.deltas, 'paddingBottomPx')).toBe(false)
  })

  it('test_UAT_AC1313_element_text_align_still_compared', () => {
    // A centred-vs-left run was only visible indirectly as a position/box shift.
    // AC-1313: element-level text-align, like the band's, survives the retirement.
    const d = diffManifests(
      mani('ref', [el('Heading', { textAlign: 'center' })]),
      mani('a', [el('Heading', { textAlign: 'left' })]),
    )
    expect(hasDelta(d.deltas, 'Heading', 'textAlign')).toBe(true)
    const same = diffManifests(
      mani('ref', [el('Heading', { textAlign: 'center' })]),
      mani('a', [el('Heading', { textAlign: 'center' })]),
    )
    expect(hasProp(same.deltas, 'textAlign')).toBe(false)
  })

  it('test_UAT_AC1286_collapse_dedups_ladder_to_one_row_per_defect', () => {
    // The same colour wrong at two widths is ONE defect, not two — collapsed to a
    // single row carrying both widths. It is flat (ref constant, fires at all cells).
    const cell = (width: number): StateDiff => ({
      engine: 'chromium',
      viewportWidth: width,
      state: 'rest',
      missing: false,
      report: diffManifests(mani('ref', [el('Run', { color: '#111111' })]), mani('a', [el('Run', { color: '#222222' })])),
    })
    const defects = collapseMultiViewport([cell(375), cell(1280)])
    const colour = defects.filter((d) => d.property === 'color')
    expect(colour).toHaveLength(1) // deduped across the two widths
    expect(colour[0].widths).toEqual([375, 1280])
    expect(colour[0].repairClass).toBe('flat')
  })

  it('test_UAT_AC1286_constant_folds_to_a_scalar_varying_folds_to_a_range_systemic_is_excluded', () => {
    // Three ladder rungs. `Constant` is wrong the same way at every width (one
    // scalar to copy); `Fluid` is wrong at every width but against a reference that
    // CHANGES across the ladder (a range, not a scalar); a synthetic cross-element
    // `systemic` rollup rides along and must produce no per-defect row.
    const cell = (width: number, refSize: number): StateDiff => {
      const report = diffManifests(
        mani('ref', [el('Constant', { color: '#111111' }), el('Fluid', { fontSizePx: refSize })]),
        mani('a', [el('Constant', { color: '#222222' }), el('Fluid', { fontSizePx: 72 })]),
      )
      // REQ-48 item 8a — the aggregate row that stands in for a pervasive quiet
      // drift. It is a rollup ACROSS elements, so it is not itself a defect row.
      report.deltas.push({
        text: '30 elements', role: 'body', property: 'color', expected: '#111111', actual: '#333333',
        kind: 'color', tier: 'HIGH', magnitude: 0.05, severity: 999, systemic: true, count: 30, valueType: 'A',
      } as (typeof report.deltas)[number])
      return { engine: 'chromium', viewportWidth: width, state: 'rest', missing: false, report }
    }
    const cells = [cell(375, 36), cell(768, 48), cell(1280, 60)]
    const defects = collapseMultiViewport(cells)

    // Three cells of the constant defect → ONE row, all three widths, one scalar.
    const constant = defects.filter((d) => d.text === 'Constant' && d.property === 'color')
    expect(constant).toHaveLength(1)
    expect(constant[0].widths).toEqual([375, 768, 1280])
    expect(constant[0].expected).toBe('#111111') // a single value to transcribe
    expect(constant[0].expected).not.toContain('..')

    // The fluid one → ONE row whose expected value is rendered as a RANGE.
    const fluid = defects.filter((d) => d.text === 'Fluid' && d.property === 'fontSizePx')
    expect(fluid).toHaveLength(1)
    expect(fluid[0].expected).toBe('36 .. 60')

    // The systemic rollup produced no row of its own.
    expect(defects.some((d) => d.text === '30 elements')).toBe(false)

    // The header states BOTH numbers, so the compression is visible, not silent:
    // the unique-defect count and the larger raw total it came from.
    const report = formatCollapsedReport(cells)
    const counted = defects.filter((d) => !d.derived).length
    const rawTotal = cells.reduce((s, c) => s + c.report!.deltas.filter((d) => !d.systemic).length, 0)
    expect(rawTotal).toBeGreaterThan(counted) // there IS compression to state
    expect(report).toContain(`${counted} unique defect(s)`)
    expect(report).toContain(`from ${rawTotal} raw deltas across 3 width(s)`)
  })

  it('test_UAT_AC1286_the_json_document_carries_the_same_defects_as_the_text_view', () => {
    // The collapsed view is scriptable, not screen-only: `--collapse --json` emits
    // the same defect rows as a machine-readable document. Same defects, different
    // serialisation — so a consumer parsing the JSON sees what the operator reads.
    // `Run` is wrong at both widths (an all-ladder defect); `Card` only at 375 (a
    // narrow-only one), so both width-set renderings are exercised.
    const cell = (width: number): StateDiff => ({
      engine: 'chromium',
      viewportWidth: width,
      state: 'rest',
      missing: false,
      report: diffManifests(
        mani('ref', [el('Run', { color: '#111111' }), el('Card', { paddingTopPx: 8 })]),
        mani('a', [el('Run', { color: '#222222' }), el('Card', { paddingTopPx: width === 375 ? 24 : 8 })]),
      ),
    })
    const cells = [cell(375), cell(1280)]
    const allWidths = cells.length

    // The `--json` payload for `--collapse` is the collapsed defect list itself.
    const doc = JSON.parse(JSON.stringify(collapseMultiViewport(cells))) as CollapsedDefect[]
    expect(Array.isArray(doc)).toBe(true)
    // Every entry carries the fields the AC requires of the document.
    for (const d of doc) {
      expect(typeof d.text).toBe('string')
      expect(typeof d.property).toBe('string')
      expect(typeof d.expected).toBe('string')
      expect(typeof d.actual).toBe('string')
      expect(Array.isArray(d.widths)).toBe(true)
    }
    // …and the text view's rows are exactly those entries: same count, same
    // element/property pairs, same folded values, same width sets.
    const text = formatCollapsedReport(cells)
    const counted = doc.filter((d) => !d.derived)
    expect(text).toContain(`${counted.length} unique defect(s)`)
    for (const d of counted) {
      expect(text).toContain(d.property)
      expect(text).toContain(d.expected)
      // The text view abbreviates a full-ladder set to `@all` and otherwise lists
      // the widths; either way it names the SAME set the JSON entry carries.
      expect(text).toContain(d.widths.length === allWidths ? '@all' : `@${d.widths.join(',')}`)
    }
    // The narrow-only defect is genuinely present, so both renderings were exercised.
    expect(counted.some((d) => d.widths.length === 1 && d.widths[0] === 375)).toBe(true)
    expect(counted.some((d) => d.widths.length === allWidths)).toBe(true)
  })

  it('test_UAT_AC1288_collapse_marks_fluid_value_structural', () => {
    // A value that deltas at only SOME widths (matches our fixed value at the others)
    // is fluid → structural, even though each firing cell shows a single ref value.
    const bad: StateDiff = {
      engine: 'chromium',
      viewportWidth: 375,
      state: 'rest',
      missing: false,
      report: diffManifests(mani('ref', [el('H', { fontSizePx: 30 })]), mani('a', [el('H', { fontSizePx: 72 })])),
    }
    const clean: StateDiff = {
      engine: 'chromium',
      viewportWidth: 1280,
      state: 'rest',
      missing: false,
      report: diffManifests(mani('ref', [el('H', { fontSizePx: 72 })]), mani('a', [el('H', { fontSizePx: 72 })])),
    }
    const defects = collapseMultiViewport([bad, clean])
    const fs = defects.find((d) => d.property === 'fontSizePx')!
    expect(fs.repairClass).toBe('structural') // fires at 375 only ⇒ fluid vs our fixed 72
    expect(fs.widths).toEqual([375])
  })

  it('test_UAT_AC1287_position_is_derived_and_excluded_from_the_headline_count', () => {
    // A real cause (colour) plus a downstream position shadow: the second element
    // sits 120px lower — the cumulative integral of some gap above it, carrying no
    // information the gap/size axes don't. It must be reported (drill-down) but kept
    // OUT of the headline count, so one cause doesn't read as two.
    const cell: StateDiff = {
      engine: 'chromium',
      viewportWidth: 1280,
      state: 'rest',
      missing: false,
      report: diffManifests(
        mani('ref', [el('Cause', { color: '#111111', box: box(0, 0, 200, 40) }), el('Shadow', { box: box(0, 500, 200, 40) })]),
        mani('a', [el('Cause', { color: '#222222', box: box(0, 0, 200, 40) }), el('Shadow', { box: box(0, 620, 200, 40) })]),
      ),
    }
    // The 120px shift produces BOTH a `gap` delta (the real cause — the inter-row
    // spacing grew) and a `position` delta (its shadow). The gap is counted; the
    // position is derived. That is the whole point: count the cause, not the echo.
    const defects = collapseMultiViewport([cell])
    const pos = defects.find((d) => d.property === 'position')!
    const gap = defects.find((d) => d.property === 'gap')!
    const colour = defects.find((d) => d.property === 'color')!
    expect(pos.derived).toBe(true) // the shadow is derived (uncounted)
    expect(gap.derived).toBe(false) // the cause is a real, counted defect
    expect(colour.derived).toBe(false)
    // Headline counts the causes (colour + gap = 2); the position shadow surfaces as
    // a "+1 derived" note and its own uncounted section — never inflating the number.
    const report = formatCollapsedReport([cell])
    expect(report).toMatch(/2 unique defect\(s\) \(\+1 derived position drift, not counted\)/)
    expect(report).toContain('Derived (cumulative position drift')

    // The derived row is also absent from every REPAIR-CLASS group: the per-group
    // counts on the order line sum to the headline, so the shadow cannot re-enter
    // the list through a group. (2 counted = A-flat 1 colour + B 1 gap.)
    expect(report).toMatch(/A-flat 1 -> A-structural 0 -> B 1/)
    const groupCounts = report
      .split('\n')
      .filter((l) => l.includes(' -- ') && !l.includes('Derived ('))
      .map((l) => Number(l.trim().split('--').pop()))
    expect(groupCounts.reduce((s, n) => s + n, 0)).toBe(2) // == the headline count
  })

  it('test_UAT_AC1287_dimension_axes_are_not_derived_and_stay_counted', () => {
    // Dimension axes measure INDEPENDENT quantities rather than accumulating a
    // neighbour's error, so — unlike absolute position — they stay counted. A cell
    // set carrying position, spacing, box size and rendered-text-extent deltas must
    // mark only the position row derived.
    const rtb = (w: number, h: number) => ({ x: 0, y: 0, width: w, height: h })
    const cell: StateDiff = {
      engine: 'chromium',
      viewportWidth: 1280,
      state: 'rest',
      missing: false,
      report: diffManifests(
        mani('ref', [
          el('Cause', { box: box(0, 0, 200, 40) }),
          el('Shadow', { box: box(0, 500, 200, 40) }),
          el('Wrapper', { box: box(0, 700, 200, 90), renderedTextBox: rtb(200, 90) }),
          imgEl({ box: box(0, 900, 320, 40) }),
        ]),
        mani('a', [
          el('Cause', { box: box(0, 0, 200, 40) }),
          el('Shadow', { box: box(0, 620, 200, 40) }),
          el('Wrapper', { box: box(0, 820, 320, 44), renderedTextBox: rtb(300, 44) }),
          imgEl({ box: box(0, 1020, 1104, 40) }),
        ]),
      ),
    }
    const defects = collapseMultiViewport([cell])
    const by = (p: string) => defects.find((d) => d.property === p)

    // The one derived axis…
    expect(by('position')?.derived).toBe(true)
    // …and the dimension axes, which stay counted.
    expect(by('size')?.derived).toBe(false)
    expect(by('renderedTextBox')?.derived).toBe(false)
    expect(by('gap')?.derived).toBe(false)

    // The headline counts them and states how many derived rows were set aside, so
    // nothing disappears silently.
    const counted = defects.filter((d) => !d.derived)
    const derived = defects.filter((d) => d.derived)
    const report = formatCollapsedReport([cell])
    expect(report).toContain(`${counted.length} unique defect(s)`)
    expect(report).toContain(`+${derived.length} derived position drift, not counted`)
    expect(counted.map((d) => d.property)).toEqual(expect.arrayContaining(['size', 'renderedTextBox']))
  })

  it('test_UAT_AC1287_text_run_box_size_is_not_a_defect_glyph_extent_is', () => {
    // A left-aligned heading whose layout box is block-full-width (1104) vs the
    // reference's shrink-to-fit (320) is VISUALLY identical — same glyphs, same
    // position — so a `size` delta there is a false positive. The faithful text
    // signal is `renderedTextBox` (glyph extent), compared separately.
    const rtb = { x: 0, y: 0, width: 320, height: 40 }
    const text = diffManifests(
      mani('ref', [el('Heading', { box: box(0, 0, 320, 40), renderedTextBox: rtb })]),
      mani('a', [el('Heading', { box: box(0, 0, 1104, 40), renderedTextBox: rtb })]),
    )
    expect(hasProp(text.deltas, 'size')).toBe(false) // the 784px box difference is not reported
    // A real wrapping difference still surfaces — via renderedTextBox (glyph height),
    // not box size — so the visible signal is never lost.
    const wrapped = diffManifests(
      mani('ref', [el('Body', { box: box(0, 0, 200, 90), renderedTextBox: { x: 0, y: 0, width: 200, height: 90 } })]),
      mani('a', [el('Body', { box: box(0, 0, 320, 44), renderedTextBox: { x: 0, y: 0, width: 300, height: 44 } })]),
    )
    expect(hasProp(wrapped.deltas, 'renderedTextBox')).toBe(true)
    expect(hasProp(wrapped.deltas, 'size')).toBe(false)
    // A NON-text element (image/field — its box IS painted) still reports box size.
    const img = diffManifests(mani('ref', [imgEl({ box: box(0, 0, 320, 40) })]), mani('a', [imgEl({ box: box(0, 0, 1104, 40) })]))
    expect(hasProp(img.deltas, 'size')).toBe(true)
  })

  it('test_UAT_AC1289_defects_roll_up_into_causes_with_dispositions', () => {
    // REQ-76 — the noise-management view: counted defects group into ranked CAUSES,
    // each tagged fix/review/accept. Several properties share a cause (arrangement +
    // containment = layout structure), fontLoad is a capture artifact (accept), and
    // derived axes (position) never enter the cause list.
    const cd = (over: Partial<CollapsedDefect>): CollapsedDefect => ({
      text: 'x', property: 'gap', valueType: 'B', repairClass: 'emergent', widths: [1280], expected: 'a', actual: 'b', tier: 'HIGH', derived: false, ...over,
    })
    const causes = clusterDefects([
      cd({ property: 'gap', text: 'g1' }),
      cd({ property: 'gap', text: 'g2' }),
      cd({ property: 'arrangement', text: 'a1', tier: 'CRITICAL' }),
      cd({ property: 'containment', text: 'c1' }), // merges with arrangement → layout structure
      cd({ property: 'fontLoad', text: 'Wordmark' }),
      cd({ property: 'position', text: 'p1', derived: true }), // derived → excluded
      cd({ property: 'listMarker', text: 'm1', widths: [320, 375] }), // narrow-only
    ])
    const byCause = Object.fromEntries(causes.map((c) => [c.cause, c]))
    expect(byCause['vertical spacing'].count).toBe(2)
    expect(byCause['vertical spacing'].disposition).toBe('fix')
    expect(byCause['layout structure'].count).toBe(2) // arrangement + containment collapsed
    expect(byCause['layout structure'].tier).toBe('CRITICAL') // worst tier of members
    expect(byCause['capture artifact (webfont FOUT)'].disposition).toBe('accept')
    expect(byCause['list-marker treatment'].widths).toEqual([320, 375]) // viewport-aware
    expect(causes.some((c) => c.cause === 'position')).toBe(false) // derived never a cause
  })

  it('test_UAT_AC1289_unmapped_property_gets_its_own_review_cause_and_causes_are_ranked', () => {
    const cd = (over: Partial<CollapsedDefect>): CollapsedDefect => ({
      text: 'x', property: 'gap', valueType: 'B', repairClass: 'emergent', widths: [1280], expected: 'a', actual: 'b', tier: 'HIGH', derived: false, ...over,
    })
    // `opacity` has no entry in the property→cause table. It must surface as a cause
    // of its OWN with a `review` disposition rather than being absorbed into a
    // neighbour — so a newly added axis is visible the day it starts firing.
    const causes = clusterDefects([
      cd({ property: 'gap', text: 'g1' }),
      cd({ property: 'gap', text: 'g2' }),
      cd({ property: 'gap', text: 'g3' }),
      cd({ property: 'opacity', text: 'ghost', valueType: 'A', repairClass: 'flat' }),
      cd({ property: 'fontLoad', text: 'Wordmark' }),
    ])
    const unmapped = causes.find((c) => c.cause === 'opacity')!
    expect(unmapped, 'an unmapped property falls through to its own cause').toBeTruthy()
    expect(unmapped.disposition).toBe('review')
    expect(unmapped.count).toBe(1)
    // Ranked: the biggest cause leads, so the operator reads the list top-down.
    expect(causes[0].cause).toBe('vertical spacing')
    expect(causes[0].count).toBe(3)
    expect(causes.map((c) => c.count)).toEqual([...causes.map((c) => c.count)].sort((a, b) => b - a))
  })

  it('test_UAT_AC1289_disjoint_width_members_report_both_widths_not_the_whole_run', () => {
    // Clustering must not manufacture a cause the render does not show. A
    // mobile-only defect and a desktop-only defect of the same cause roll up
    // together, but the cause records the UNION of the widths its members fire at
    // — it never presents itself as firing across the whole run.
    const cd = (over: Partial<CollapsedDefect>): CollapsedDefect => ({
      text: 'x', property: 'gap', valueType: 'B', repairClass: 'emergent', widths: [1280], expected: 'a', actual: 'b', tier: 'HIGH', derived: false, ...over,
    })
    const causes = clusterDefects([
      cd({ text: 'mobile only', widths: [375] }),
      cd({ text: 'desktop only', widths: [1440] }),
    ])
    const spacing = causes.find((c) => c.cause === 'vertical spacing')!
    expect(spacing.count).toBe(2)
    expect(spacing.widths).toEqual([375, 1440]) // both, not a filled-in range
    expect(spacing.widths).not.toContain(768) // never a width no member fired at
  })

  it('test_UAT_AC1289_the_json_causes_match_the_text_report_and_carry_the_summary', () => {
    // The clustered view is scriptable, not screen-only: `--clusters --json` emits
    // the ranked causes as a document carrying count, tier, examples, width set and
    // disposition — the same causes the text report prints.
    const cell = (width: number): StateDiff => ({
      engine: 'chromium',
      viewportWidth: width,
      state: 'rest',
      missing: false,
      report: diffManifests(
        mani('ref', [
          el('Heading', { color: '#111111' }),
          el('Top', { box: box(0, 0, 200, 20) }),
          el('Bottom', { box: box(0, 60, 200, 20) }),
        ]),
        mani('a', [
          el('Heading', { color: '#222222' }),
          el('Top', { box: box(0, 0, 200, 20) }),
          el('Bottom', { box: box(0, 100, 200, 20) }),
        ]),
      ),
    })
    const cells = [cell(375), cell(1280)]

    // The `--clusters --json` payload is `clusterDefects(collapseMultiViewport(...))`.
    const doc = JSON.parse(JSON.stringify(clusterDefects(collapseMultiViewport(cells)))) as DefectCause[]
    expect(doc.length).toBeGreaterThan(0)
    for (const c of doc) {
      expect(typeof c.cause).toBe('string')
      expect(['fix', 'review', 'accept']).toContain(c.disposition)
      expect(typeof c.count).toBe('number')
      expect(typeof c.tier).toBe('string')
      expect(Array.isArray(c.widths)).toBe(true)
      expect(Array.isArray(c.examples)).toBe(true)
    }

    // The text view carries the same ranked causes, in the same order…
    const text = formatClusterReport(cells)
    for (const c of doc) expect(text).toContain(c.cause)
    const order = doc.map((c) => text.indexOf(c.cause))
    expect(order).toEqual([...order].sort((a, b) => a - b))

    // …and opens with the cause count plus the per-disposition defect totals.
    const counted = collapseMultiViewport(cells).filter((d) => !d.derived)
    expect(text).toContain(`${counted.length} counted defect(s) roll up to ${doc.length} cause(s)`)
    const totals = (dsp: DefectCause['disposition']) =>
      doc.filter((c) => c.disposition === dsp).reduce((s, c) => s + c.count, 0)
    expect(text).toContain(`fix ${totals('fix')} · review ${totals('review')} · accept ${totals('accept')}`)
  })

  it('test_UAT_AC1289_clusters_and_collapse_parse_as_independent_booleans', () => {
    // Precedence is a dispatcher decision, so it must not be a parsing artifact:
    // `--clusters --collapse --json` must yield three independent boolean flags
    // (neither swallowing the slug or each other), which is what lets the dispatch
    // choose the clustered document over the collapsed rows.
    const parsed = parseArgs(['values-diff', 'gigabytealchemy', '--multi-viewport', '--clusters', '--collapse', '--json'])
    expect(parsed.positionals).toEqual(['values-diff', 'gigabytealchemy'])
    expect(parsed.flags.clusters).toBe(true)
    expect(parsed.flags.collapse).toBe(true)
    expect(parsed.flags.json).toBe(true)

    // And the two documents are genuinely different shapes, so which one wins is
    // an observable difference rather than a distinction without one: causes carry
    // a disposition, collapsed rows carry a repair class.
    const cells: StateDiff[] = [
      {
        engine: 'chromium',
        viewportWidth: 1280,
        state: 'rest',
        missing: false,
        report: diffManifests(mani('ref', [el('Run', { color: '#111111' })]), mani('a', [el('Run', { color: '#222222' })])),
      },
    ]
    const collapsed = collapseMultiViewport(cells)
    const clustered = clusterDefects(collapsed)
    expect(collapsed[0]).toHaveProperty('repairClass')
    expect(collapsed[0]).not.toHaveProperty('disposition')
    expect(clustered[0]).toHaveProperty('disposition')
    expect(clustered[0]).not.toHaveProperty('repairClass')
  })

  it('test_UAT_AC1289_clusters_takes_precedence_over_collapse_in_both_serialisations', () => {
    // AC-1289's last Verification clause: `--clusters --collapse --json` must emit the
    // CLUSTERED CAUSES, not the collapsed rows. The dispatcher's choice is the pure
    // `selectMultiViewportPayload`, so the precedence is provable without a render.
    const cells: StateDiff[] = [375, 1280].map((viewportWidth) => ({
      engine: 'chromium',
      viewportWidth,
      state: 'rest',
      missing: false,
      report: diffManifests(
        mani('ref', [el('Run', { color: '#111111' }), el('Btn', { fontWeight: 400 })]),
        mani('a', [el('Run', { color: '#222222' }), el('Btn', { fontWeight: 700 })]),
      ),
    }))

    // --clusters --collapse --json → the ranked causes document, NOT the collapsed rows.
    const both = selectMultiViewportPayload(cells, { clusters: true, collapse: true, json: true })
    expect(both.view).toBe('clusters')
    const doc = JSON.parse(both.output) as DefectCause[]
    expect(doc.length).toBeGreaterThan(0)
    expect(doc.every((c) => typeof c.disposition === 'string')).toBe(true)
    expect(doc.some((c) => 'repairClass' in (c as unknown as Record<string, unknown>))).toBe(false)
    // …and it is the same document `--clusters --json` alone emits: collapse adds nothing.
    expect(both.output).toBe(selectMultiViewportPayload(cells, { clusters: true, collapse: false, json: true }).output)
    expect(both.output).toBe(JSON.stringify(clusterDefects(collapseMultiViewport(cells)), null, 2))
    // The losing view is genuinely different, so precedence is an observable choice.
    const collapsedOnly = selectMultiViewportPayload(cells, { clusters: false, collapse: true, json: true })
    expect(collapsedOnly.view).toBe('collapsed')
    expect(collapsedOnly.output).not.toBe(both.output)
    expect((JSON.parse(collapsedOnly.output) as CollapsedDefect[])[0]).toHaveProperty('repairClass')

    // Text mode makes the same call: clusters wins, and it is the cluster report.
    const bothText = selectMultiViewportPayload(cells, { clusters: true, collapse: true, json: false })
    expect(bothText.view).toBe('clusters')
    expect(bothText.output).toBe(formatClusterReport(cells))
    expect(bothText.output).not.toBe(formatCollapsedReport(cells))

    // With neither flag the raw per-cell view stands — the helper adds no view of its own.
    expect(selectMultiViewportPayload(cells, { clusters: false, collapse: false, json: false })).toEqual({
      view: 'cells',
      output: formatMultiViewportReport(cells),
    })
    expect(selectMultiViewportPayload(cells, { clusters: false, collapse: false, json: true }).output).toBe(
      JSON.stringify(cells, null, 2),
    )
  })

  it('test_UAT_AC1312_gap_axis_measures_relative_spacing_and_reports_the_correction', () => {
    // Two stacked rows; the gap between them differs (ref 40 vs ours 80). Reported as a
    // single `gap` delta whose expected→actual IS the correction (drift-free, relative).
    const d = diffManifests(
      mani('ref', [el('A', { box: box(0, 0, 200, 20) }), el('B', { box: box(0, 60, 200, 20) })]),
      mani('a', [el('A', { box: box(0, 0, 200, 20) }), el('B', { box: box(0, 100, 200, 20) })]),
    )
    const g = d.deltas.find((x) => x.property === 'gap')!
    expect(g).toBeTruthy()
    expect(g.expected).toBe('40px') // reference gap
    expect(g.actual).toBe('80px') // ours — 40px too big, the exact knob correction
    // Visible spacing, not structure-breaking: HIGH severity, and emergent geometry
    // (Type B) rather than a value to copy.
    expect(g.tier).toBe('HIGH')
    expect(g.valueType).toBe('B')
    // The two adjacent rows are named, so the operator knows which knob to turn.
    expect(g.text).toContain('A')
    expect(g.text).toContain('B')
  })

  it('test_UAT_AC1312_one_wrong_gap_is_exactly_one_delta_however_far_it_cascades', () => {
    // The drift-free property, and the whole reason the axis exists: one wrong gap
    // partway down the page shifts EVERYTHING below it. Absolute `position` turned
    // that single cause into a delta per element below; the relative gap axis must
    // yield exactly one.
    const ref = mani('ref', [
      el('Row one', { box: box(0, 0, 200, 20) }),
      el('Row two', { box: box(0, 60, 200, 20) }), // gap 40 — the wrong one
      el('Row three', { box: box(0, 120, 200, 20) }), // gap 40 — correct below it
      el('Row four', { box: box(0, 180, 200, 20) }), // gap 40 — correct below it
    ])
    const ours = mani('a', [
      el('Row one', { box: box(0, 0, 200, 20) }),
      el('Row two', { box: box(0, 100, 200, 20) }), // gap 80 — 40px too big
      el('Row three', { box: box(0, 160, 200, 20) }), // gap 40 — right, just displaced
      el('Row four', { box: box(0, 220, 200, 20) }), // gap 40 — right, just displaced
    ])
    const gaps = diffManifests(ref, ours).deltas.filter((x) => x.property === 'gap')
    expect(gaps).toHaveLength(1) // ONE cause, one delta — no cascade
    expect(gaps[0].expected).toBe('40px')
    expect(gaps[0].actual).toBe('80px')
    expect(gaps[0].text).toContain('Row one')
    expect(gaps[0].text).toContain('Row two')
  })

  it('test_UAT_AC1312_matching_gap_side_by_side_row_and_overlapping_rows_emit_nothing', () => {
    // A matching gap → no delta. And two elements on the SAME row (side by side) are one
    // visual row, so no spurious horizontal "gap".
    const same = diffManifests(
      mani('ref', [el('A', { box: box(0, 0, 200, 20) }), el('B', { box: box(0, 60, 200, 20) })]),
      mani('a', [el('A', { box: box(0, 0, 200, 20) }), el('B', { box: box(0, 60, 200, 20) })]),
    )
    expect(same.deltas.some((x) => x.property === 'gap')).toBe(false)
    const row = diffManifests(
      mani('ref', [el('L', { box: box(0, 0, 100, 20) }), el('R', { box: box(120, 0, 100, 20) })]),
      mani('a', [el('L', { box: box(0, 0, 100, 20) }), el('R', { box: box(120, 0, 100, 20) })]),
    )
    expect(row.deltas.some((x) => x.property === 'gap')).toBe(false)

    // A row of side-by-side cards is ONE row: it has one gap to the row above, not
    // one per card. Three cards abreast under a heading → a single gap delta.
    const cards = (y: number, headingGap: number) =>
      mani('m', [
        el('Heading', { box: box(0, 0, 600, 40) }),
        el('Card one', { box: box(0, y, 180, 100) }),
        el('Card two', { box: box(200, y, 180, 100) }),
        el('Card three', { box: box(400, y, 180, 100) }),
        el('Footer note', { box: box(0, y + 100 + headingGap, 600, 20) }),
      ])
    const cardGaps = diffManifests(cards(80, 40), cards(140, 40)).deltas.filter((x) => x.property === 'gap')
    expect(cardGaps).toHaveLength(1) // the heading→card-row gap, not one per card
    expect(cardGaps[0].expected).toBe('40px')
    expect(cardGaps[0].actual).toBe('100px')

    // Genuinely OVERLAPPING rows are skipped rather than reported as spacing drift:
    // a negative separation is not a gap the operator can widen.
    const overlap = diffManifests(
      mani('ref', [el('Base', { box: box(0, 0, 200, 100) }), el('Badge', { box: box(0, 40, 60, 20) })]),
      mani('a', [el('Base', { box: box(0, 0, 200, 100) }), el('Badge', { box: box(0, 10, 60, 20) })]),
    )
    expect(overlap.deltas.some((x) => x.property === 'gap')).toBe(false)
  })

  it('test_UAT_AC1312_gap_tolerance_is_6px_by_default_and_16px_under_tolerant', () => {
    // A difference inside the band emits nothing; one outside it emits the delta.
    const pair = (ourGap: number) =>
      [
        mani('ref', [el('A', { box: box(0, 0, 200, 20) }), el('B', { box: box(0, 60, 200, 20) })]),
        mani('a', [el('A', { box: box(0, 0, 200, 20) }), el('B', { box: box(0, 20 + ourGap, 200, 20) })]),
      ] as const
    const [r4, a4] = pair(44) // 4px off — inside the 6px default
    expect(diffManifests(r4, a4).deltas.some((x) => x.property === 'gap')).toBe(false)
    const [r10, a10] = pair(50) // 10px off — outside the default, inside `tolerant`
    expect(diffManifests(r10, a10).deltas.some((x) => x.property === 'gap')).toBe(true)
    expect(diffManifests(r10, a10, { tolerant: true }).deltas.some((x) => x.property === 'gap')).toBe(false)
    const [r20, a20] = pair(60) // 20px off — outside both bands
    expect(diffManifests(r20, a20, { tolerant: true }).deltas.some((x) => x.property === 'gap')).toBe(true)
  })

  it('test_UAT_AC1313_section_band_padding_is_captured_but_no_longer_compared', () => {
    // The section paddingTop/Bottom axis is dropped (a padding-vs-margin component the
    // gap axis supersedes) — a section padding mismatch must NOT fabricate a delta.
    const sect = (top: number, bot: number): ValueManifest => ({
      source: 's',
      elements: [],
      sections: [{ index: 0, overlay: null, contentAnchorRatio: null, paddingTopPx: top, paddingBottomPx: bot }],
    })
    const ref = sect(0, 0)
    const ours = sect(96, 128)
    // Still CAPTURED on both sides — the retirement is of the comparison, not of the
    // value; the sum it contributes to is what the gap axis measures.
    expect(ref.sections?.[0].paddingTopPx).toBe(0)
    expect(ours.sections?.[0].paddingTopPx).toBe(96)
    expect(ours.sections?.[0].paddingBottomPx).toBe(128)
    const d = diffManifests(ref, ours)
    expect(d.deltas.some((x) => x.property === 'paddingTopPx' || x.property === 'paddingBottomPx')).toBe(false)
  })

  it('test_UAT_AC1313_band_text_align_is_unaffected_by_the_padding_retirement', () => {
    // The retirement is scoped exactly to the band's VERTICAL PADDING. The same
    // section's text-align is a Type-A authored value and is still compared.
    const sect = (align: 'left' | 'center'): ValueManifest => ({
      source: 's',
      elements: [],
      sections: [{ index: 0, overlay: null, contentAnchorRatio: null, paddingTopPx: 0, paddingBottomPx: 0, textAlign: align }],
    })
    const differs = diffManifests(sect('center'), sect('left'))
    expect(differs.deltas.some((x) => x.property === 'textAlign' && x.text.startsWith('§'))).toBe(true)
    const same = diffManifests(sect('center'), sect('center'))
    expect(same.deltas.some((x) => x.property === 'textAlign')).toBe(false)
  })

  it('test_UAT_AC1288_deltas_tagged_A_or_B_repair_class', () => {
    // Every delta carries its repair class: A = an author-set value to COPY,
    // B = emergent geometry (a measure of how far off, fixed by getting A right).
    const d = diffManifests(
      mani('ref', [el('Run', { color: '#111111', box: box(0, 0, 100, 20) })]),
      mani('a', [el('Run', { color: '#eeeeee', box: box(80, 0, 100, 20) })]),
    )
    const color = d.deltas.find((x) => x.property === 'color')!
    const position = d.deltas.find((x) => x.property === 'position')!
    expect(color.valueType).toBe('A') // colour is author-set → copy it
    expect(position.valueType).toBe('B') // position emerges from layout → residual
    // Every delta is classified (no delta lacks a repair class).
    expect(d.deltas.every((x) => x.valueType === 'A' || x.valueType === 'B')).toBe(true)
  })

  it('test_UAT_AC1288_five_classification_cases_and_the_report_prints_in_repair_order', () => {
    // The whole classification table in one cell set, at two widths:
    //   1. `Flat`       — author-set, wrong identically at every width  → flat
    //   2. `Varying`    — author-set, reference DIFFERS across widths   → structural
    //   3. `NarrowOnly` — author-set, wrong at only some widths         → structural
    //   4. the `Top → Bottom` gap — emergent geometry                   → emergent
    // (Case 4 uses `gap` rather than `position`: position is a DERIVED axis and is
    // deliberately kept out of the repair-class groups — AC-1287 — so it could not
    // stand in for the Type-B group here.)
    // REQ-73 retired the section band-padding deltas, so there is no section-spacing
    // case: `§<n>` rows carry only overlay / contentAnchor / textAlign, and the
    // classifier no longer keys on them.
    const cell = (width: number): StateDiff => {
      const report = diffManifests(
        mani('ref', [
          el('Flat', { color: '#111111' }),
          el('Varying', { fontSizePx: width === 375 ? 36 : 72 }),
          el('NarrowOnly', { fontWeight: width === 375 ? 400 : 700 }),
          el('Top', { box: box(0, 0, 200, 20) }),
          el('Bottom', { box: box(0, 60, 200, 20) }), // gap 40
        ]),
        mani('a', [
          el('Flat', { color: '#222222' }),
          el('Varying', { fontSizePx: 96 }),
          el('NarrowOnly', { fontWeight: 700 }), // matches at 1280, differs at 375
          el('Top', { box: box(0, 0, 200, 20) }),
          el('Bottom', { box: box(0, 100, 200, 20) }), // gap 80 — emergent residual
        ]),
      )
      return { engine: 'chromium', viewportWidth: width, state: 'rest', missing: false, report }
    }
    const cells = [cell(375), cell(1280)]
    const defects = collapseMultiViewport(cells)
    const cls = (text: string) => defects.find((d) => d.text === text)?.repairClass

    expect(cls('Flat')).toBe('flat')
    expect(cls('Varying')).toBe('structural') // reference varies across the ladder
    expect(cls('NarrowOnly')).toBe('structural') // fires at only one of two widths
    // REQ-73 — no `§<n>` padding row can exist, so nothing reaches the classifier
    // by that route: the deltas the pipeline produced carry no section-scoped text.
    expect(defects.some((d) => d.text.startsWith('§'))).toBe(false)
    expect(defects.find((d) => d.property === 'gap')?.repairClass).toBe('emergent') // Type-B geometry

    // Every counted defect carries a class — none falls through unclassified.
    expect(defects.every((d) => ['flat', 'structural', 'emergent'].includes(d.repairClass))).toBe(true)

    // The report prints the three groups in repair order, each with its own count.
    const report = formatCollapsedReport(cells)
    const iFlat = report.indexOf('Type-A flat')
    const iStructural = report.indexOf('Type-A structural')
    const iEmergent = report.indexOf('Type-B - emergent residual')
    expect(iFlat).toBeGreaterThan(-1)
    expect(iStructural).toBeGreaterThan(iFlat) // flat → structural
    expect(iEmergent).toBeGreaterThan(iStructural) // structural → emergent
    // The order is stated up front, with the per-group counts.
    expect(report).toMatch(/A-flat 1 -> A-structural 2 -> B 1\s+\(fix in that order\)/)
    // …and each row carries the reference value to transcribe (a scalar for the flat
    // defect, the ladder range for the structural one).
    expect(report).toContain('#111111')
    expect(report).toContain('36 .. 72')
  })

  it('test_UAT_FC_REQ-79_reference_fout_does_not_flag_correct_render', () => {
    // REQ-79 supersedes the REQ-64 reverse direction: when the REFERENCE recorded a
    // FOUT fallback but OUR render resolved the intended face, that is our render being
    // CORRECT — a capture artifact on the reference side, never a reproduction defect.
    // It must NOT produce a fontLoad delta (else correct output reads as 30 phantom
    // CRITICALs, drowning real deltas — the joyful import bug).
    const correct = diffManifests(
      mani('ref', [el('Wordmark', { fontLoaded: false })]),
      mani('a', [el('Wordmark', { fontLoaded: true })]),
    )
    expect(hasProp(correct.deltas, 'fontLoad')).toBe(false)
    // Forward direction still fires: OUR render fell back off the intended face.
    const ourFallback = diffManifests(
      mani('ref', [el('Wordmark', { fontLoaded: true })]),
      mani('a', [el('Wordmark', { fontLoaded: false })]),
    )
    expect(hasDelta(ourFallback.deltas, 'Wordmark', 'fontLoad')).toBe(true)
    // Both resolved → no delta.
    const same = diffManifests(
      mani('ref', [el('Wordmark', { fontLoaded: true })]),
      mani('a', [el('Wordmark', { fontLoaded: true })]),
    )
    expect(hasProp(same.deltas, 'fontLoad')).toBe(false)
  })
})
