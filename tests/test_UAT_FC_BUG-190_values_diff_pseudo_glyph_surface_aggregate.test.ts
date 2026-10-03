import { describe, expect, it } from 'vitest'
import { diffManifests, type ValueElement, type ValueManifest } from '../tools/generate/src/cli/capture/values-diff'
import { projectContentRun } from '../tools/generate/src/cli/capture/value-axes'
import type { ContentRun } from '../tools/generate/src/cli/capture/types'

/**
 * BUG-190 — three values-diff instrument defects found on
 * joyfulculinarycreations.com (repro-console iteration 7). Fixtures are the
 * iteration's own manifest values.
 *
 *  1. A reference `::before` glyph run (REQ-366 `pseudoGlyph`) records its HOST
 *     box as `renderedTextBox`; ours records the glyph advance. The diff must
 *     measure host against host, and not report the `pseudo` mechanism when we
 *     draw the same codepoint as text.
 *  2. Reference on an ancestor's surface, ours painting its own small plate:
 *     reported as an invented surface.
 *  3. The systemic aggregate groups by property, so its label names the
 *     property its rows actually hold.
 */

const CHECK = ''

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [] }
}

/** The reference check icon as the bundle stores it, projected by the real reference reader. */
function refGlyph(text: string, box: { x: number; y: number; width: number; height: number }): ValueElement {
  const run = {
    role: 'body',
    text,
    color: '#f8bb1b',
    fontFamily: 'Font Awesome 5 Free',
    fontSizePx: 18,
    fontWeight: 900,
    pseudoGlyph: 'before',
    box,
    renderedTextBox: box,
    pseudo: 'before',
  } as unknown as ContentRun
  return projectContentRun(run)
}

function ourGlyph(
  text: string,
  box: { x: number; y: number; width: number; height: number },
  glyph: { x: number; y: number; width: number; height: number },
): ValueElement {
  return el(text, {
    color: '#f8bb1b',
    fontFamily: 'Font Awesome 5 Free',
    fontWeight: 900,
    box,
    renderedTextBox: glyph,
    pseudo: null,
  })
}

describe('BUG-190 item 1 — a pseudo-glyph run is measured host against host', () => {
  it('test_UAT_FC_BUG-190_pseudo_glyph_projection_carries_the_flag', () => {
    expect(refGlyph(CHECK, { x: 386.66, y: 1417.89, width: 22.5, height: 18 }).pseudoGlyph).toBe('before')
  })

  it('test_UAT_FC_BUG-190_same_glyph_in_same_host_reads_clean', () => {
    // Reference: host box 22.5×18 as renderedTextBox. Ours: the same host box, a
    // glyph advance of 18. Same ink — no renderedTextBox, position or pseudo row.
    const host = { x: 386.65625, y: 1417.890625, width: 22.5, height: 18 }
    const expected = mani('ref', [refGlyph(CHECK, host)])
    const actual = mani('draft', [ourGlyph(CHECK, { ...host, y: 1417.875 }, { ...host, y: 1417.875, width: 18 })])
    const report = diffManifests(expected, actual)
    expect(report.deltas.filter((d) => d.text === CHECK)).toEqual([])
  })

  it('test_UAT_FC_BUG-190_centred_glyph_in_same_host_has_no_text_position_row', () => {
    // U+F46D: reference host at x 518 (40×40), ours the same host with the glyph
    // centred at 523 (30 wide). Identical ink; formerly a CRITICAL position row.
    const g = ''
    const host = { x: 518.328125, y: 3746.9375, width: 40, height: 40 }
    const report = diffManifests(
      mani('ref', [refGlyph(g, host)]),
      mani('draft', [ourGlyph(g, host, { x: 523.328125, y: 3746.9375, width: 30, height: 40 })]),
    )
    expect(report.deltas.filter((d) => d.text === g)).toEqual([])
  })

  it('test_UAT_FC_BUG-190_different_host_size_is_reported_as_size', () => {
    // U+F109: the reference host is fixed at 40×40, ours grew to the glyph's 50.
    // That host difference is real (the glyph is no longer centred) and is
    // reported against the host box, as `size`.
    const g = ''
    const report = diffManifests(
      mani('ref', [refGlyph(g, { x: 255, y: 3746.9375, width: 40, height: 40 })]),
      mani('draft', [
        ourGlyph(g, { x: 255, y: 3746.9375, width: 50, height: 40 }, { x: 255, y: 3746.9375, width: 50, height: 40 }),
      ]),
    )
    const rows = report.deltas.filter((d) => d.text === g)
    expect(rows.map((d) => d.property)).toEqual(['size'])
    expect(rows[0].expected).toContain('40')
    expect(rows[0].actual).toContain('50')
  })

  it('test_UAT_FC_BUG-190_ordinary_text_run_still_compares_rendered_text_box', () => {
    // No pseudoGlyph: the glyph-extent axis is untouched.
    const box = { x: 100, y: 100, width: 200, height: 24 }
    const report = diffManifests(
      mani('ref', [el('Hello', { box, renderedTextBox: { ...box, width: 120 } })]),
      mani('draft', [el('Hello', { box, renderedTextBox: { ...box, width: 100 } })]),
    )
    expect(report.deltas.some((d) => d.property === 'renderedTextBox')).toBe(true)
  })

  it('test_UAT_FC_BUG-190_pseudo_still_compared_when_not_drawn_as_the_same_text', () => {
    // A pseudo-element the reproduction does not draw at all (not a glyph run).
    const report = diffManifests(
      mani('ref', [el('Card', { pseudo: 'before' })]),
      mani('draft', [el('Card', { pseudo: null })]),
    )
    expect(report.deltas.some((d) => d.property === 'pseudo')).toBe(true)
  })
})

describe('BUG-190 item 2 — own plate over an ancestor surface', () => {
  const band = { self: false, box: { x: 0, y: 0, width: 1280, height: 800 }, borderRadiusPx: 0, boxShadow: null, border: null }
  const plate = { self: true, box: { x: 642.19, y: 70, width: 142.19, height: 46 }, borderRadiusPx: 0, boxShadow: null, border: null }

  it('test_UAT_FC_BUG-190_invented_own_plate_is_reported', () => {
    const report = diffManifests(
      mani('ref', [el('Meet the Chef', { surfaceFill: '#000000', surface: band })]),
      mani('draft', [el('Meet the Chef', { surfaceFill: '#000000', surface: plate })]),
    )
    const rows = report.deltas.filter((d) => d.text === 'Meet the Chef')
    expect(rows).toHaveLength(1)
    expect(rows[0].property).toBe('surfaceFill')
    expect(rows[0].expected).toBe('surface band 1280×800')
    expect(rows[0].actual).toBe('own plate 142×46')
  })

  it('test_UAT_FC_BUG-190_own_surface_of_comparable_size_is_not_reported', () => {
    // A self-painting run whose plate is the same panel the reference sits on.
    const panel = { ...band, box: { x: 0, y: 0, width: 300, height: 200 } }
    const own = { ...plate, box: { x: 0, y: 0, width: 300, height: 200 } }
    const report = diffManifests(
      mani('ref', [el('Panel', { surfaceFill: '#222222', surface: panel })]),
      mani('draft', [el('Panel', { surfaceFill: '#222222', surface: own })]),
    )
    expect(report.deltas).toEqual([])
  })
})

describe('BUG-190 item 3 — the systemic aggregate names its property', () => {
  it('test_UAT_FC_BUG-190_aggregate_groups_by_property', () => {
    // One filter row and six pseudo rows: both `treatment` kind. The aggregate
    // must be a `pseudo` drift ×6, not a `filter` drift ×7.
    const exp: ValueElement[] = [el('hero', { filter: 'brightness(0.67)' })]
    const act: ValueElement[] = [el('hero', { filter: null })]
    for (let i = 0; i < 6; i++) {
      exp.push(el(`icon ${i}`, { pseudo: 'before' }))
      act.push(el(`icon ${i}`, { pseudo: null }))
    }
    const report = diffManifests(mani('ref', exp), mani('draft', act))
    const agg = report.deltas.filter((d) => d.systemic)
    expect(agg).toHaveLength(1)
    expect(agg[0].property).toBe('pseudo')
    expect(agg[0].count).toBe(6)
    expect(agg[0].expected).toBe('systemic pseudo drift ×6')
  })
})
