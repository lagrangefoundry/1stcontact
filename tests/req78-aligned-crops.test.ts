import { describe, expect, it } from 'vitest'
import {
  pickAnchors,
  alignedAreas,
  normText,
  areaSlug,
  subRenderOptions,
  type AnchorEl,
  type AlignedBox,
  type AlignedCropsOptions,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-78 — `1c aligned-crops`. The IO (render, screenshot, sharp) is an
 * orchestrator; the *decisions* — which elements anchor a crop, how anchors pair by
 * text, and each crop window (drift-aligned to the element's OWN top) — are pure and
 * pinned here. This is the logic that makes the AI's perceptual judge compare like
 * with like instead of a drift-shifted whole-page overlay.
 */

const box = (x: number, y: number, w: number, h: number): AlignedBox => ({ x, y, width: w, height: h })
const el = (text: string, role: string, y: number): AnchorEl => ({ text, role, box: box(0, y, 400, 40) })

describe('REQ-78 aligned-crops — anchor selection', () => {
  const refEls: AnchorEl[] = [
    el('Intentional Software', 'body', 318),
    el('A Different Approach', 'heading', 896),
    el('Presence', 'subheading', 1549),
    el('Our Mission', 'heading', 1384),
    el('Body copy here', 'body', 1000),
  ]

  it('test_UAT_FC_REQ-78_default_anchors_are_headings_in_document_order', () => {
    const anchors = pickAnchors(refEls)
    // Only heading-role elements, sorted by y (Our Mission at 1384 after Approach at 896).
    expect(anchors.map((a) => a.text)).toEqual(['A Different Approach', 'Our Mission'])
  })

  it('test_UAT_FC_REQ-78_explicit_areas_match_by_text_prefix_over_any_role', () => {
    const anchors = pickAnchors(refEls, ['Presence', 'Intentional'])
    // --areas selects by text prefix regardless of role, still y-sorted.
    expect(anchors.map((a) => a.text)).toEqual(['Intentional Software', 'Presence'])
  })
})

describe('REQ-78 aligned-crops — drift-aligned crop windows', () => {
  it('test_UAT_FC_REQ-78_window_uses_each_side_own_top_and_reports_drift', () => {
    const anchors = [el('Our Mission', 'heading', 1384), el('What We\'re Building', 'heading', 1978)]
    const ours = new Map<string, AlignedBox>([
      [normText('Our Mission'), box(0, 1338, 400, 40)], // -46 drift
      [normText('What We\'re Building'), box(0, 1923, 400, 40)], // -55 drift
    ])
    const areas = alignedAreas(anchors, ours, { viewportWidth: 1280, pad: 40 })
    expect(areas).toHaveLength(2)
    const om = areas[0]
    expect(om.refTop).toBe(1344) // 1384 - 40 pad
    expect(om.oursTop).toBe(1298) // 1338 - 40 pad — its OWN top, drift removed
    expect(om.drift).toBe(-46)
    expect(om.width).toBe(1280)
    // Height spans to just past the next anchor (594 gap + pad), capped by maxH default.
    expect(om.height).toBeGreaterThan(400)
  })

  it('test_UAT_FC_REQ-78_unpaired_anchor_is_dropped_not_misaligned', () => {
    const anchors = [el('Our Mission', 'heading', 1384), el('Ghost Section', 'heading', 2000)]
    const ours = new Map<string, AlignedBox>([[normText('Our Mission'), box(0, 1338, 400, 40)]])
    const areas = alignedAreas(anchors, ours, { viewportWidth: 1280 })
    // Ghost has no match in our render → dropped (surfaces elsewhere as missing-element).
    expect(areas.map((a) => a.anchor)).toEqual(['Our Mission'])
  })

  it('test_UAT_FC_REQ-78_last_area_uses_capped_height_and_clamps_top_at_zero', () => {
    const anchors = [el('Hero', 'heading', 20)]
    const ours = new Map<string, AlignedBox>([[normText('Hero'), box(0, 10, 400, 40)]])
    const [a] = alignedAreas(anchors, ours, { viewportWidth: 1280, pad: 40, maxH: 460 })
    expect(a.refTop).toBe(0) // 20 - 40 clamped to 0
    expect(a.oursTop).toBe(0)
    expect(a.height).toBe(460) // no next anchor → maxH
  })

  it('test_UAT_FC_REQ-78_normText_and_areaSlug_are_stable', () => {
    expect(normText('  Our   Mission ')).toBe('our mission')
    expect(normText('© Gigabyte Alchemy 2025')).toBe('© gigabyte alchemy ####') // year masked
    expect(areaSlug("What We're Building")).toBe('what-we-re-building')
  })
})

describe('REQ-79 aligned-crops — sandbox store routing', () => {
  const baseOpts = (over: Partial<AlignedCropsOptions>): AlignedCropsOptions => ({
    slug: 'joyfulculinary',
    refBundleDir: '/tmp/ref',
    viewportWidth: 1280,
    outDir: '/tmp/out',
    ...over,
  })

  it('test_UAT_FC_REQ-79_sandbox_flag_forwarded_to_render_and_serve', () => {
    // The regression: aligned-crops rendered/served from sites/ even under --sandbox,
    // diffing an absent/stale site against the reference. The sub-command options MUST
    // carry sandbox through so both render and serve target sandbox/.
    const sub = subRenderOptions(baseOpts({ sandbox: true, cwd: '/work' }))
    expect(sub.sandbox).toBe(true)
    expect(sub.cwd).toBe('/work')
    expect(sub.source).toBe('draft') // default source
  })

  it('test_UAT_FC_REQ-79_sites_tree_is_default_when_sandbox_unset', () => {
    const sub = subRenderOptions(baseOpts({ source: 'published' }))
    // No sandbox flag → falls through to the sites/ tree (sandbox undefined), source preserved.
    expect(sub.sandbox).toBeUndefined()
    expect(sub.source).toBe('published')
  })
})
