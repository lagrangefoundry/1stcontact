/**
 * BUG-179 — the values-diff compared the wrong thing in 18 of 23 deltas on
 * joyfulculinarycreations.com, and read clean over five nav links that no pixel
 * showed. Each case below is one of the ticket's items, reduced to the smallest
 * manifest that reproduces it.
 *
 *   1. A run its nearest clipping ancestor cuts off is compared as `visibleFraction`.
 *   2. A paint axis is read off the union of reproduction layers sharing the box.
 *   3. `paintedSurfaces` breaks an area tie by paint order (topmost first).
 *   4. A `zIndex` level the fold cannot author is not a delta while the ORDER holds
 *      (BUG-187 superseded the clamp: paint order is compared per overlapping pair).
 *   5. A coalesced reference section is compared against every band it covers.
 *   6. A band's fill may be painted by a descendant covering ≥ 99% of it.
 *   7. A one-quantum line-height difference is not a delta; layout findings name their probe.
 *
 * Evidence shape: `diffManifests` and `layoutCollisions` are the real entry
 * points, driven on synthetic manifests. The extractor's reads (items 3 and 6)
 * run offline, sliced out of `EXTRACT_SCRIPT` by their own source text (no
 * browser in this sandbox — the BUG-153/161/174 pattern). No mocks.
 */
import { describe, expect, it } from 'vitest'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  type SectionValues,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { layoutCollisions } from '../tools/generate/src/cli/gate-core'
import type { EnvelopeReport } from '../tools/generate/src/l1/probes'

type Box = { x: number; y: number; width: number; height: number }

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'generic',
    color: '#ffffff',
    fontFamily: 'Lato',
    fontSizePx: 16,
    fontWeight: 400,
    ...over,
  }
}

function box(text: string, b: Box, over: Partial<ValueElement> = {}): ValueElement {
  return el(text, { textless: true, a11yRole: 'generic', fontSizePx: 0, fontWeight: 0, fontFamily: '', box: b, ...over })
}

function manifest(elements: ValueElement[], sections: SectionValues[] = []): ValueManifest {
  return { source: 'test', elements, sections }
}

const HERO: Box = { x: 0, y: 0, width: 1280, height: 800 }
const NAV: Box = { x: 642, y: 70, width: 142, height: 46 }
const LOGO_CLIP = { id: '1.1', x: 20, y: 70, width: 232, height: 66 }

describe('BUG-179 item 1 — a run clipped away by its ancestor is measured', () => {
  it('test_UAT_FC_BUG-179_a_clipped_away_run_reports_its_visible_fraction', () => {
    // The reference records clipping (the logo carries one), and its nav link is
    // unclipped. Ours folded the link into a footer clip container 4500px away.
    const expected = manifest([el('Meet the Chef', { box: NAV }), el('logo', { box: LOGO_CLIP, clip: LOGO_CLIP })])
    const actual = manifest([
      el('Meet the Chef', { box: NAV, clip: { id: '1.0.65', x: 250, y: 4642, width: 780, height: 95 } }),
      el('logo', { box: LOGO_CLIP, clip: LOGO_CLIP }),
    ])
    const vis = diffManifests(expected, actual).deltas.filter((d) => d.property === 'visibleFraction')
    expect(vis).toHaveLength(1)
    expect(vis[0]).toMatchObject({ text: 'Meet the Chef', expected: '100% visible', actual: '0% visible', tier: 'CRITICAL' })
  })

  it('test_UAT_FC_BUG-179_visible_fraction_is_silent_when_the_reference_never_recorded_clipping', () => {
    // A bundle older than REQ-332 carries no `clip` anywhere: "nothing clips it"
    // and "not recorded" are indistinguishable, so the axis does not fire.
    const expected = manifest([el('Meet the Chef', { box: NAV })])
    const actual = manifest([el('Meet the Chef', { box: NAV, clip: { id: '9', x: 0, y: 4000, width: 10, height: 10 } })])
    expect(diffManifests(expected, actual).deltas.filter((d) => d.property === 'visibleFraction')).toEqual([])
  })
})

describe('BUG-179 item 2 — coincident reproduction layers paint as one', () => {
  const PAINT = ['backgroundImage', 'filter', 'opacity', 'paddingTopPx', 'paddingBottomPx']

  it('test_UAT_FC_BUG-179_a_hero_painted_on_a_coincident_layer_is_not_missing', () => {
    const filter = 'brightness(0.67) contrast(0.88) saturate(1.06)'
    const expected = manifest([
      box('(generic)', HERO, { backgroundImageUrl: 'https://ref.example/HERO.jpeg', filter, opacity: 0.49 }),
    ])
    // Pair-by-box cannot choose: both layers have IoU 1, and it takes the first.
    const actual = manifest([
      box('(generic)', HERO, { backgroundImageUrl: null, filter: null, opacity: 1 }),
      box('(generic)', HERO, { backgroundImageUrl: '/assets/HERO.jpeg', filter, opacity: 0.49 }),
    ])
    const fired = diffManifests(expected, actual).deltas.filter((d) => PAINT.includes(d.property))
    expect(fired).toEqual([])
  })

  it('test_UAT_FC_BUG-179_a_split_quote_band_is_compared_against_both_layers', () => {
    const band: Box = { x: 0, y: 2668, width: 1280, height: 267 }
    const expected = manifest([
      box('"It\'s not just about…', band, {
        backgroundImageUrl: 'https://ref.example/market.jpg',
        paddingTopPx: 45,
        paddingBottomPx: 45,
        opacity: 1,
      }),
    ])
    const actual = manifest([
      box('"It\'s not just about…', band, { backgroundImageUrl: null, paddingTopPx: 0, paddingBottomPx: 0, opacity: 1 }),
      box('(generic)', band, { backgroundImageUrl: '/assets/market.jpg', paddingTopPx: 45, paddingBottomPx: 45, opacity: 1 }),
    ])
    const report = diffManifests(expected, actual)
    expect(report.deltas.filter((d) => PAINT.includes(d.property))).toEqual([])
    // The card shows what was compared, not the layer the pairing happened to take.
    const card = report.objects.find((o) => o.label.startsWith('"It'))!
    expect(card.params.find((p) => p.name === 'backgroundImage')).toMatchObject({ actual: 'market.jpg', mismatch: false })
  })

  it('test_UAT_FC_BUG-179_an_extra_paint_on_the_reproduction_is_still_reported', () => {
    // The reference paints no photograph. A coincident plain layer must not
    // excuse the one our paired layer paints.
    const expected = manifest([box('(generic)', HERO, { backgroundImageUrl: null })])
    const actual = manifest([
      box('(generic)', HERO, { backgroundImageUrl: '/assets/extra.jpg' }),
      box('(generic)', HERO, { backgroundImageUrl: null }),
    ])
    const bg = diffManifests(expected, actual).deltas.filter((d) => d.property === 'backgroundImage')
    expect(bg).toHaveLength(1)
    expect(bg[0]).toMatchObject({ expected: '(none)', actual: 'extra.jpg' })
  })
})

describe('BUG-179 item 4 — paint order is compared as a rank', () => {
  it('test_UAT_FC_BUG-179_a_z_index_clamped_by_the_fold_is_not_a_delta', () => {
    // BUG-187 — compared as the order of OVERLAPPING elements, which is what a
    // clamp can and cannot change: `z:9999` authored as `z:1000` keeps the logo
    // over the hero, so it is not a delta; a level that drops it under is.
    const logo: Box = { x: 20, y: 70, width: 232, height: 66 }
    const z = (e: number, a: number) =>
      diffManifests(
        manifest([box('(generic)', HERO, { zIndex: 2 }), box('(img)', logo, { zIndex: e })]),
        manifest([box('(generic)', HERO, { zIndex: 2 }), box('(img)', logo, { zIndex: a })]),
      ).deltas.filter((d) => d.property === 'zIndex')
    expect(z(9999, 1000)).toEqual([])
    // A real reordering is still reported.
    expect(z(5, 1)).toHaveLength(1)
  })
})

describe('BUG-179 item 5 — a coalesced reference section covers several reproduction bands', () => {
  it('test_UAT_FC_BUG-179_a_coalesced_section_is_compared_against_every_band_it_covers', () => {
    const section = (index: number, b: Box, opacity: number): SectionValues => ({
      index,
      overlay: null,
      contentAnchorRatio: null,
      surfaceFill: '#7a7a7a',
      opacity,
      box: b,
    })
    // The reference's 0.5 belongs to its first 267.5px — the 50% overlay — which
    // ours paints as a band of its own above a plain 1064px one.
    const expected = manifest([], [section(3, { x: 0, y: 1336, width: 1280, height: 1331.5 }, 0.5)])
    const actual = manifest(
      [],
      [
        section(2, { x: 0, y: 1336, width: 1280, height: 267.5 }, 0.5),
        section(3, { x: 0, y: 1603.5, width: 1280, height: 1064 }, 1),
      ],
    )
    const report = diffManifests(expected, actual)
    expect(report.deltas.filter((d) => d.text === '§3')).toEqual([])
    expect(report.unpairedActualSections).toEqual([])
  })
})

describe('BUG-179 item 7 — rounding noise and probe names', () => {
  it('test_UAT_FC_BUG-179_a_one_quantum_line_height_difference_is_not_a_delta', () => {
    const lh = (a: number) =>
      diffManifests(
        manifest([el('Personal Chef Services', { lineHeightPx: 37.13 })]),
        manifest([el('Personal Chef Services', { lineHeightPx: a })]),
      ).deltas.filter((d) => d.property === 'lineHeightPx')
    expect(lh(37.12)).toEqual([])
    const real = lh(37)
    expect(real).toHaveLength(1)
    expect(real[0].magnitude).toBeCloseTo(0.13, 5)
  })

  it('test_UAT_FC_BUG-179_every_layout_finding_names_its_probe', () => {
    const report = (detail: string): EnvelopeReport =>
      ({
        pass: false,
        byWidth: [{ width: 320, findings: [{ kind: 'escape', detail, paths: ['0.1'] }] }],
      }) as unknown as EnvelopeReport
    const found = layoutCollisions({
      onSample: report('on'),
      offSample: report('off'),
      contentRobustness: report('grown'),
    })
    expect(found.map((c) => [c.probe, c.detail])).toEqual([
      ['onSample', 'at 320px: on'],
      ['offSample', 'at 320px: off'],
      ['contentRobustness', 'at 320px: grown'],
    ])
  })
})

// ── items 3 and 6 · the extractor's surface reads, offline ───────────────────

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

interface StubEl {
  name: string
  bg: string
  rect: Box
  parent?: StubEl
  contains: (o: StubEl) => boolean
}

function stub(name: string, bg: string, rect: Box, parent?: StubEl): StubEl {
  const self: StubEl = {
    name,
    bg,
    rect,
    parent,
    contains: (o) => {
      for (let n: StubEl | undefined = o; n; n = n.parent) if (n === self) return true
      return false
    },
  }
  return self
}

/** `paintedSurfaces` + `coveringDescendantFill` over the real helpers they call, on a stubbed document. */
function surfacesOffline(all: StubEl[]): {
  paintedSurfaces: () => Array<{ el: StubEl }>
  coveringDescendantFill: (el: StubEl, box: Box) => string | null
} {
  const names = ['h2', 'rgbaOf', 'rgbToHex', 'absBox', 'paintedSurfaces', 'coveringDescendantFill']
  const src =
    `var SURFACE_INDEX = null; var COVERING_FILL_MIN = 0.99;\n${names.map(fnSource).join('\n')}\n` +
    'return { paintedSurfaces: paintedSurfaces, coveringDescendantFill: coveringDescendantFill };'
  const document = { body: { querySelectorAll: () => all } }
  const window = { scrollX: 0, scrollY: 0 }
  const gcs = (e: StubEl) => ({
    backgroundColor: e.bg,
    backgroundImage: 'none',
    borderLeftWidth: '0px',
    borderLeftStyle: 'none',
    display: 'block',
    visibility: 'visible',
  })
  for (const e of all) {
    ;(e as unknown as { getBoundingClientRect: () => object }).getBoundingClientRect = () => ({
      left: e.rect.x,
      top: e.rect.y,
      width: e.rect.width,
      height: e.rect.height,
    })
  }
  // `colorCtx` returns null so `rgbaOf` takes its `rgb()/rgba()` regex path.
  return new Function('getComputedStyle', 'colorCtx', 'document', 'window', src)(gcs, () => null, document, window)
}

describe('BUG-179 items 3 and 6 — the extractor reads the paint on top', () => {
  it('test_UAT_FC_BUG-179_an_area_tie_puts_the_box_painted_on_top_first', () => {
    // `section-bg-2` (the parent, opaque white) and `backdrop-6` (the veil painted
    // over it) share the band's 1280x267 exactly.
    const band: Box = { x: 0, y: 2668, width: 1280, height: 267 }
    const parent = stub('section-bg-2', 'rgb(255, 255, 255)', band)
    const veil = stub('backdrop-6', 'rgba(20, 30, 20, 0.73)', band, parent)
    const { paintedSurfaces } = surfacesOffline([parent, veil])
    expect(paintedSurfaces().map((s) => s.el.name)).toEqual(['backdrop-6', 'section-bg-2'])
  })

  it('test_UAT_FC_BUG-179_a_band_painted_by_a_covering_descendant_records_its_fill', () => {
    const footer: Box = { x: 0, y: 4440, width: 1280, height: 303.31 }
    const band = stub('footer', 'rgba(0, 0, 0, 0)', footer)
    const inner = stub('inner', 'rgb(237, 194, 81)', { x: 0, y: 4441, width: 1280, height: 302.31 }, band)
    const chip = stub('chip', 'rgb(0, 0, 255)', { x: 100, y: 4500, width: 50, height: 50 }, inner)
    expect(surfacesOffline([band, inner, chip]).coveringDescendantFill(band, footer)).toBe('#edc251')
    // A descendant covering only half the band is a panel, not the band's fill.
    const half = stub('half', 'rgb(237, 194, 81)', { x: 0, y: 4440, width: 640, height: 303.31 }, band)
    expect(surfacesOffline([band, half]).coveringDescendantFill(band, footer)).toBeNull()
  })
})
