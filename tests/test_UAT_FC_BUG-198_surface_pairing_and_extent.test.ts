import { describe, expect, it } from 'vitest'
import { diffManifests, type ValueElement, type ValueManifest } from '../tools/generate/src/cli/capture/values-diff'

/**
 * BUG-198 — two values-diff instrument gaps found on hearingzone510.com
 * (repro-console iteration 3). Fixtures are the iteration's own manifest values.
 *
 *  1. The reference records Zyro's testimonial panel as a field (an inline-SVG
 *     rectangle, REQ-370); our reproduction paints the same panel as a coloured
 *     box, recorded only as the surface its runs sit on. The panel pairs against
 *     that surface instead of reading as a CRITICAL `missing`.
 *  2. A run's surface EXTENT is compared (`surfaceBox`, side edges), and a fill
 *     measured on exactly one side is a `surfaceFill` delta.
 */

type Box = { x: number; y: number; width: number; height: number }

function run(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#ffffff', fontFamily: 'Montserrat', fontSizePx: 16, fontWeight: 400, ...over }
}
function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [] }
}
const onSurface = (box: Box) => ({ self: false, box, borderRadiusPx: 0, boxShadow: null, border: null })

/** Expected-manifest #57: the panel as the reference capture records it (REQ-370). */
const PANEL: Box = { x: 645.796875, y: 3878.40625, width: 606.171875, height: 296 }
function refPanel(box: Box = PANEL): ValueElement {
  return {
    text: '(generic)',
    role: 'generic',
    a11yRole: 'generic',
    textless: true,
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    surfaceFill: '#224e7a',
    box,
    borderRadiusPx: 0,
    border: null,
    boxShadow: null,
  }
}
const QUOTE_BOX: Box = { x: 705, y: 3940, width: 555, height: 96 }
/** A testimonial run, on either side, sitting on the panel. */
function quote(surfaceBox: Box, fill = '#224e7a'): ValueElement {
  return run('So glad I chose the Hearing Zone.', { box: QUOTE_BOX, surfaceFill: fill, surface: onSurface(surfaceBox) })
}

describe('BUG-198 item 1 — a reference panel pairs against the surface our runs sit on', () => {
  it('test_UAT_FC_BUG-198_svg_panel_pairs_with_our_div_surface', () => {
    // Ours: the same panel, painted as a box (606.15625 wide) behind the run.
    const ours = { ...PANEL, width: 606.15625 }
    const r = diffManifests(mani('ref', [refPanel(), quote(PANEL)]), mani('ours', [quote(ours)]))
    expect(r.unmatched).toBe(0)
    expect(r.deltas.filter((d) => d.property === 'missing')).toEqual([])
    const card = r.objects.find((o) => o.kind === 'box')!
    expect(card.paired).toBe(true)
    expect(card.deltaCount).toBe(0)
  })

  it('test_UAT_FC_BUG-198_a_differently_filled_surface_pairs_and_reports_its_fill', () => {
    const r = diffManifests(mani('ref', [refPanel()]), mani('ours', [quote(PANEL, '#d6d6d6')]))
    expect(r.unmatched).toBe(0)
    const fill = r.deltas.filter((d) => d.property === 'surfaceFill' && d.text === '(generic)')
    expect(fill).toHaveLength(1)
    expect(fill[0]).toMatchObject({ expected: '#224e7a', actual: '#d6d6d6' })
  })

  it('test_UAT_FC_BUG-198_a_panel_no_surface_of_ours_overlaps_stays_missing', () => {
    const elsewhere: Box = { x: 0, y: 200, width: 1280, height: 300 }
    const r = diffManifests(mani('ref', [refPanel()]), mani('ours', [quote(elsewhere)]))
    expect(r.unmatched).toBe(1)
    expect(r.deltas.filter((d) => d.property === 'missing')).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-198_one_surface_pairs_with_one_panel', () => {
    // Two reference panels, one surface of ours (carried by two runs): one pairs,
    // the other is honestly missing.
    const left: Box = { x: 28.96875, y: 3878.40625, width: 604.84375, height: 296 }
    const r = diffManifests(
      mani('ref', [refPanel(), refPanel(left)]),
      mani('ours', [quote(PANEL), run('-B. Kenney', { surfaceFill: '#224e7a', surface: onSurface(PANEL) })]),
    )
    expect(r.unmatched).toBe(1)
  })
})

const LEARN = 'Learn to train your brain to hear better.'
const LEARN_BOX: Box = { x: 463.796875, y: 7.596875, width: 352.40625, height: 23.4 }
const GRADIENT = { angleDeg: 0, stops: [{ color: '#f2b374', position: null }, { color: '#f0dac4', position: null }] }

describe('BUG-198 item 2 — the extent of a run surface is compared', () => {
  it('test_UAT_FC_BUG-198_a_bar_reproduced_as_a_run_sized_card_reports_surface_box', () => {
    const ref = run(LEARN, {
      role: 'link',
      box: LEARN_BOX,
      surfaceGradient: GRADIENT,
      surface: onSurface({ x: 0, y: 0, width: 1280, height: 40 }),
    })
    const ours = run(LEARN, {
      role: 'link',
      box: LEARN_BOX,
      surfaceGradient: GRADIENT,
      surface: onSurface({ x: 463.796875, y: 7.59375, width: 352.40625, height: 23.390625 }),
    })
    const r = diffManifests(mani('ref', [ref]), mani('ours', [ours]))
    const d = r.deltas.filter((x) => x.property === 'surfaceBox')
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ expected: '(0, 0) 1280×40', actual: '(464, 8) 352×23', tier: 'HIGH' })
    const row = r.objects.find((o) => o.label === LEARN)!.params.find((p) => p.name === 'surface')!
    expect(row).toMatchObject({ expected: '(0, 0) 1280×40', actual: '(464, 8) 352×23', mismatch: true })
  })

  it('test_UAT_FC_BUG-198_a_same_fill_vertical_slab_of_the_band_reads_clean', () => {
    // The reference's address band, reproduced as a stack of full-bleed slabs.
    const box: Box = { x: 40, y: 4880, width: 300, height: 24 }
    const ref = run('3346 Lakeshore Ave', { box, surfaceFill: '#d6d6d6', surface: onSurface({ x: 0, y: 4279, width: 1280, height: 757 }) })
    const ours = run('3346 Lakeshore Ave', { box, surfaceFill: '#d6d6d6', surface: onSurface({ x: 0, y: 4864, width: 1280, height: 82 }) })
    const r = diffManifests(mani('ref', [ref]), mani('ours', [ours]))
    expect(r.deltas.filter((x) => x.property === 'surfaceBox')).toEqual([])
    const row = r.objects[0].params.find((p) => p.name === 'surface')!
    expect(row.mismatch).toBe(false)
  })

  it('test_UAT_FC_BUG-198_a_fill_measured_on_exactly_one_side_is_a_surface_fill_delta', () => {
    const ref = run(LEARN, { box: LEARN_BOX, surfaceFill: null })
    const ours = run(LEARN, { box: LEARN_BOX, surfaceFill: '#ffffff' })
    const r = diffManifests(mani('ref', [ref]), mani('ours', [ours]))
    const d = r.deltas.filter((x) => x.property === 'surfaceFill')
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ expected: '(none)', actual: '#ffffff' })
  })

  it('test_UAT_FC_BUG-198_a_fill_not_recorded_on_one_side_stays_inert', () => {
    const ref = run(LEARN, { box: LEARN_BOX })
    const ours = run(LEARN, { box: LEARN_BOX, surfaceFill: '#ffffff' })
    const r = diffManifests(mani('ref', [ref]), mani('ours', [ours]))
    expect(r.deltas.filter((x) => x.property === 'surfaceFill')).toEqual([])
  })
})
