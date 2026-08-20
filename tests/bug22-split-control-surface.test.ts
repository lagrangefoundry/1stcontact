/**
 * BUG-22 — `values-diff` mis-attributed a **split control**, so the reproduction
 * scoreboard led its repair order with a no-op while the largest visual error on
 * the page went unreported.
 *
 * The two sides represent a control differently. The target is ONE node — a
 * `<button>` carrying the label, the fill, the rounding and the box together. The
 * L1 fold is a flat tree, so the same control is TWO nodes: a `text` node for the
 * label plus a sibling backing box that paints the surface. Pairing joins on
 * text, lands on the label, reads `borderRadiusPx` off it, finds 0 and reports
 * `radius 8px -> 0px` — a Type-A flat delta (head of the printed repair order)
 * with no value to copy, because the radius was correct at every stage. Worse,
 * the backing box's real defect (BUG-21: 2× the reference height, the two highest
 * per-pixel error regions on the page) had no comparison at all.
 *
 * The fix records WHICH box paints the surface behind a run (`ValueElement.surface`,
 * captured tightest-first like `surfaceFill`), so the diff resolves a split
 * control's surface axes — and the surface's geometry — against the bearing node.
 *
 * The UATs drive the real `EXTRACT_SCRIPT` under jsdom (the same harness BUG-15
 * uses: layout stubbed per element, computed styles real) and then the real
 * `flattenSignals` → `diffManifests` pipeline the CLI runs. Both fixture shapes
 * are measured from the retained gigabytealchemy capture: the reference control is
 * its "Subscribe" button (123×50 @1280, `#009966`, radius 8) and the reproduction
 * is that control as the draft actually folds it (backing box 173×100 at
 * 388,3875 plus a 123-wide label at 413,3900).
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { EXTRACT_SCRIPT, flattenSignals, diffManifests, type RawSignals } from '../tools/generate/src/cli'
import type { ValueDelta, ValueManifest } from '../tools/generate/src/cli/capture'

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Run the real EXTRACT_SCRIPT over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const cls = (this as Element).className || ''
    const b = boxByClass[cls]
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 4400 })
  // jsdom measures no glyphs, so stub the Range the extractor uses for
  // `renderedTextBox` — a real capture always has one, and its presence is what
  // marks an element a TEXT RUN (whose padded box is deliberately not size-compared,
  // REQ-64). Without it the fixture would diverge from every real bundle.
  dom.window.Range.prototype.getBoundingClientRect = function () {
    const node = (this as Range).startContainer as Element
    const b = boxByClass[(node && node.className) || '']
    return b ? rect(b[0], b[1], b[2], Math.min(b[3], 24)) : rect(0, 0, 0, 0)
  }
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

/** jsdom does not expand the `border-radius` shorthand — author the longhands. */
const radius = (px: number) =>
  `border-top-left-radius:${px}px;border-top-right-radius:${px}px;` +
  `border-bottom-left-radius:${px}px;border-bottom-right-radius:${px}px`

// ── the reference: one node carries label + surface (a conventional page) ──────
const CONTROL: Box = [413, 3900, 123, 50]

function referencePage(): RawSignals {
  const html =
    `<!doctype html><html><body><div class="band" style="background-color:rgb(255,255,255)">` +
    `<p class="lede">Stay in the loop.</p>` +
    `<button class="btn" style="background-color:rgb(0,153,102);${radius(8)}">Subscribe</button>` +
    `</div></body></html>`
  return extract(html, { band: [0, 3800, 1280, 300], lede: [413, 3840, 400, 24], btn: CONTROL })
}

/**
 * The reproduction as the L1 fold emits it: every leaf absolutely positioned under
 * one wrapper, the control's surface painted by a *sibling* backing box.
 * `backing` defaults to the draft's real (defective) 173×100 box.
 */
function reproductionPage(opts: { backing?: Box; backingRadiusPx?: number } = {}): RawSignals {
  const backing = opts.backing ?? ([388, 3875, 173, 100] as Box)
  const r = opts.backingRadiusPx ?? 8
  const html =
    `<!doctype html><html><body><div class="l1" style="position:relative">` +
    `<div class="l1-band" style="position:absolute;background-color:rgb(255,255,255)"></div>` +
    `<p class="l1-lede" style="position:absolute">Stay in the loop.</p>` +
    `<div class="l1-card" style="position:absolute;background-color:rgb(0,153,102);${radius(r)}"></div>` +
    `<p class="l1-label" style="position:absolute">Subscribe</p>` +
    `</div></body></html>`
  return extract(html, {
    l1: [0, 0, 0, 0],
    'l1-band': [0, 3800, 1280, 300],
    'l1-lede': [413, 3840, 400, 24],
    'l1-card': backing,
    'l1-label': [413, 3900, 123, 24],
  })
}

const diff = (expected: RawSignals, actual: RawSignals): ValueDelta[] =>
  diffManifests(flattenSignals(expected, 'ref'), flattenSignals(actual, 'repro')).deltas

const on = (deltas: ValueDelta[], text: string, property: string) =>
  deltas.filter((d) => d.text === text && d.property === property)

describe('BUG-22 — split text+box controls resolve against the surface-bearing node', () => {
  it('test_UAT_AC1311_capture_records_which_box_paints_the_surface', () => {
    // The discriminator the diff needs: on a conventional page the control paints
    // its own surface; in the flat L1 tree a sibling backing box does.
    const ref = flattenSignals(referencePage(), 'ref').elements.find((e) => e.text === 'Subscribe')
    const repro = flattenSignals(reproductionPage(), 'repro').elements.find((e) => e.text === 'Subscribe')

    expect(ref?.surface?.self, 'the reference button paints its own surface').toBe(true)
    expect(ref?.surface?.borderRadiusPx).toBe(8)
    expect(repro?.surface?.self, 'the L1 label is painted by a sibling backing box').toBe(false)
    expect(repro?.surface?.borderRadiusPx, 'the radius lives on the backing box').toBe(8)
    expect(repro?.borderRadiusPx, 'the label itself is square — the phantom source').toBe(0)
  })

  it('test_UAT_AC1311_no_phantom_shape_delta_when_the_backing_box_carries_the_radius', () => {
    const deltas = diff(referencePage(), reproductionPage())
    expect(
      on(deltas, 'Subscribe', 'shape'),
      'the radius is correct on the backing box — reporting it is a no-op repair instruction',
    ).toEqual([])
    // And the phantom no longer inflates the Type-A flat count that orders repairs.
    expect(deltas.filter((d) => d.valueType === 'A' && d.property === 'shape')).toEqual([])
  })

  it('test_UAT_AC1311_surface_geometry_defect_is_reported', () => {
    // BUG-21: the backing box is 2× the reference height (100 vs 50) and offset.
    // The label's own box matches, so without resolving the surface this defect
    // had no comparison at all — the scoreboard was silent on it.
    const deltas = diff(referencePage(), reproductionPage())
    const size = on(deltas, 'Subscribe', 'size')
    expect(size, 'the surface box size must be compared against the control box').toHaveLength(1)
    expect(size[0].expected).toContain('surface')
    expect(size[0].expected).toContain('50')
    expect(size[0].actual).toContain('100')
    expect(size[0].magnitude).toBeGreaterThanOrEqual(50)
  })

  it('test_UAT_AC1311_a_genuinely_square_backing_box_still_reports_the_shape_defect', () => {
    // The resolution must not become a blanket suppressor: when the reproduction
    // really did lose the rounding, the delta is real and must still fire.
    const deltas = diff(referencePage(), reproductionPage({ backing: [413, 3900, 123, 50], backingRadiusPx: 0 }))
    const shape = on(deltas, 'Subscribe', 'shape')
    expect(shape).toHaveLength(1)
    expect(shape[0].expected).toContain('8')
    expect(shape[0].actual).toContain('radius 0px')
    // A faithful backing box leaves no surface-geometry delta behind.
    expect(on(deltas, 'Subscribe', 'size')).toEqual([])
  })

  it('test_UAT_AC1311_self_painting_controls_on_both_sides_are_unaffected', () => {
    // BUG-20's self-painting chip folds its surface onto the text leaf, so both
    // sides are `self` — the own-axis comparison stays in force, unchanged.
    const chip = (r: number): RawSignals =>
      extract(
        `<!doctype html><html><body><div class="band" style="background-color:rgb(255,255,255)">` +
          `<span class="chip" style="background-color:rgb(219,234,254);${radius(r)}">Coming soon</span>` +
          `</div></body></html>`,
        { band: [0, 100, 1280, 120], chip: [40, 140, 110, 24] },
      )
    expect(on(diff(chip(12), chip(12)), 'Coming soon', 'shape'), 'identical chips agree').toEqual([])
    expect(on(diff(chip(12), chip(0)), 'Coming soon', 'shape'), 'a lost pill is still a defect').toHaveLength(1)
  })

  it('test_UAT_AC1311_a_pre_surface_bundle_leaves_the_resolution_inert', () => {
    // Every bundle captured before the `surface` record existed carries none. The
    // resolution must then do NOTHING — not throw, and not read the label's zeros
    // as if they were a bearing box — leaving the pre-BUG-22 own-axis comparison
    // exactly as it was. Every other case here builds its manifests through
    // `flattenSignals`, where `surface` is always present, so this is the only
    // path that exercises the backward-compatibility guard.
    const strip = (m: ValueManifest): ValueManifest => ({
      ...m,
      elements: m.elements.map((el) => {
        const legacy = { ...el }
        delete legacy.surface
        return legacy
      }),
    })
    const legacyRef = strip(flattenSignals(referencePage(), 'ref'))
    const repro = flattenSignals(reproductionPage(), 'repro')

    const cases = [
      // A pre-`surface` reference bundle diffed against a current reproduction …
      ['pre-surface reference', diffManifests(legacyRef, repro).deltas],
      // … and a wholly legacy pair, where neither side records one.
      ['both sides pre-surface', diffManifests(legacyRef, strip(repro)).deltas],
    ] as const

    for (const [label, deltas] of cases) {
      // The diff ran to completion and still compared the page.
      expect(deltas.length, label).toBeGreaterThan(0)
      // No row is attributed to a surface — the bearing-box comparison never fired.
      expect(deltas.filter((d) => `${d.expected} ${d.actual}`.includes('surface')), label).toEqual([])
      expect(on(deltas, 'Subscribe', 'size'), label).toEqual([])
      expect(on(deltas, 'Subscribe', 'position'), label).toEqual([])
      // Inert means unchanged, not silenced: the label's own square corner is
      // still compared on its own axes, which is the shape row a legacy bundle
      // reported before the record existed.
      expect(on(deltas, 'Subscribe', 'shape'), label).toHaveLength(1)
    }
  })

  it('test_UAT_AC1311_band_runs_gain_no_surface_geometry_noise', () => {
    // Every run sits on *some* painted surface (its band). Resolution is scoped to
    // controls the two sides represent differently, so an ordinary run must not
    // start reporting its band's geometry once per run.
    const deltas = diff(referencePage(), reproductionPage())
    expect(on(deltas, 'Stay in the loop.', 'size')).toEqual([])
    expect(on(deltas, 'Stay in the loop.', 'shape')).toEqual([])
  })
})
