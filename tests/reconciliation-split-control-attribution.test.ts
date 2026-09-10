import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  flattenSignals,
  type RawSignals,
  type ValueManifest,
} from '../tools/generate/src/cli'
import type { ValueDelta } from '../tools/generate/src/cli/capture'

/**
 * Reconciliation UATs for story-d5de22a5 — AC-1606, **attribution** for a split
 * control: pairing decides which two elements are compared, attribution decides
 * which node's value each axis reads.
 *
 * Drives the real `EXTRACT_SCRIPT` under jsdom (layout stubbed per element,
 * computed styles real) and then the real `flattenSignals` → `diffManifests`
 * pipeline the CLI runs. Browser-free.
 *
 * Relationship to the free-coded evidence: `bug22-split-control-surface.test.ts`
 * carries six `test_UAT_FC_BUG-22_*` tests covering the captured discriminator, the
 * phantom `shape` delta, the surface-geometry defect, a genuinely square backing
 * box, self-painting controls, and band-run noise. Those remain BUG-22's own
 * evidence and are neither renamed nor replaced. These add the two clauses AC-1606's
 * Verification asks for that no sibling makes:
 *   • the **border** axis resolving against the bearing node — the sibling suite
 *     asserts shape, size and position, but never authors a border at all;
 *   • **inertness**: a manifest carrying no backing-surface reference (a bundle
 *     captured before BUG-22 existed) produces the pre-existing per-node comparison
 *     unchanged, so the resolution cannot retroactively rewrite old bundles.
 */

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Run the real EXTRACT_SCRIPT over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const b = boxByClass[(this as Element).className || '']
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 4400 })
  // jsdom measures no glyphs; a real capture always has a Range for the run, and
  // its presence is what marks an element a TEXT RUN (whose padded box is
  // deliberately not size-compared, REQ-64).
  dom.window.Range.prototype.getBoundingClientRect = function () {
    const node = (this as Range).startContainer as Element
    const b = boxByClass[(node && node.className) || '']
    return b ? rect(b[0], b[1], b[2], Math.min(b[3], 24)) : rect(0, 0, 0, 0)
  }
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

/** jsdom does not expand the shorthands — author the longhands. */
const radius = (px: number) =>
  `border-top-left-radius:${px}px;border-top-right-radius:${px}px;` +
  `border-bottom-left-radius:${px}px;border-bottom-right-radius:${px}px`

/**
 * A hairline on the TOP edge only. `boxBorderOf` reports the thickest painted side,
 * so a top border is a box border; `accentBarOf` reads the LEFT edge only, so this
 * exercises the border axis without also tripping the accent-bar axis.
 */
const hairline = (px: number, color = 'rgb(17,17,17)') =>
  `border-top-width:${px}px;border-top-style:solid;border-top-color:${color}`

const CONTROL: Box = [413, 3900, 123, 50]

/** The reference: one node carries label, fill, rounding, hairline and box. */
function referencePage(): RawSignals {
  const html =
    `<!doctype html><html><body><div class="band" style="background-color:rgb(255,255,255)">` +
    `<p class="lede">Stay in the loop.</p>` +
    `<button class="btn" style="background-color:rgb(0,153,102);${radius(8)};${hairline(2)}">Subscribe</button>` +
    `</div></body></html>`
  return extract(html, { band: [0, 3800, 1280, 300], lede: [413, 3840, 400, 24], btn: CONTROL })
}

/**
 * The reproduction as the L1 fold emits it: a text label plus a sibling backing box
 * that paints the surface. Defaults to a FAITHFUL backing box — same rect, radius
 * and hairline as the reference control.
 */
function reproductionPage(opts: { backing?: Box; backingRadiusPx?: number; backingBorderPx?: number } = {}): RawSignals {
  const backing = opts.backing ?? CONTROL
  const r = opts.backingRadiusPx ?? 8
  const b = opts.backingBorderPx ?? 2
  const html =
    `<!doctype html><html><body><div class="l1" style="position:relative">` +
    `<div class="l1-band" style="position:absolute;background-color:rgb(255,255,255)"></div>` +
    `<p class="l1-lede" style="position:absolute">Stay in the loop.</p>` +
    `<div class="l1-card" style="position:absolute;background-color:rgb(0,153,102);${radius(r)};${hairline(b)}"></div>` +
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

const manifest = (s: RawSignals, source: string): ValueManifest => flattenSignals(s, source)

const diff = (expected: ValueManifest, actual: ValueManifest): ValueDelta[] =>
  diffManifests(expected, actual).deltas

const on = (deltas: ValueDelta[], text: string, property: string) =>
  deltas.filter((d) => d.text === text && d.property === property)

describe('story-d5de22a5 — AC-1606 split-control surface-axis attribution', () => {
  it('test_UAT_AC1606_a_faithful_split_control_raises_no_surface_axis_delta', () => {
    // The reproduction splits the control into a label plus a backing box painting
    // the IDENTICAL radius, border and rect. Nothing renders differently, so no
    // surface axis may fire — reading them off the text node the pair was keyed on
    // would manufacture a phantom on every one of them.
    const deltas = diff(manifest(referencePage(), 'ref'), manifest(reproductionPage(), 'repro'))

    for (const axis of ['shape', 'border', 'size', 'position']) {
      expect(on(deltas, 'Subscribe', axis), `no ${axis} delta for a faithful split control`).toEqual([])
    }
  })

  it('test_UAT_AC1606_the_border_axis_resolves_against_the_bearing_node', () => {
    // The border is the axis the sibling suite never authors. The label carries no
    // border at all, so if the axis read the label the delta would be
    // "2px solid → none" on every faithful reproduction. It must read the backing
    // box — and must still fire when the backing box genuinely loses the hairline.
    const ref = manifest(referencePage(), 'ref')

    // The label's own border really is absent — the phantom's source.
    const label = manifest(reproductionPage(), 'repro').elements.find((e) => e.text === 'Subscribe')!
    expect(label.border ?? null, 'the label itself has no border').toBeNull()
    expect(label.surface?.border?.widthPx, 'the hairline lives on the backing box').toBe(2)

    // Faithful backing box → silent.
    expect(on(diff(ref, manifest(reproductionPage(), 'repro')), 'Subscribe', 'border')).toEqual([])

    // Backing box that genuinely lost the hairline → the delta is real and fires.
    const lost = diff(ref, manifest(reproductionPage({ backingBorderPx: 0 }), 'repro'))
    expect(on(lost, 'Subscribe', 'border'), 'a genuinely missing hairline is still reported').toHaveLength(1)
  })

  it('test_UAT_AC1606_size_is_measured_against_the_backing_box_rect_not_the_label', () => {
    // BUG-21's real defect: the backing box is twice the reference height. The
    // label's own box matches the reference, so a per-node comparison is silent on
    // the largest visual error on the page.
    const deltas = diff(
      manifest(referencePage(), 'ref'),
      manifest(reproductionPage({ backing: [388, 3875, 173, 100] }), 'repro'),
    )
    const size = on(deltas, 'Subscribe', 'size')

    expect(size).toHaveLength(1)
    // Reported against the SURFACE's rect — labelled as such so the operator knows
    // which node to fix — carrying the reference 50 against our 100.
    expect(size[0].expected).toContain('surface')
    expect(size[0].expected).toContain('50')
    expect(size[0].actual).toContain('100')
  })

  it('test_UAT_AC1606_a_control_self_painting_on_both_sides_keeps_its_own_axes', () => {
    // Resolution fires only where the two sides genuinely disagree about node
    // identity. A chip that paints its own surface on both sides is self-bearing,
    // so the own-axis comparison is untouched in both directions.
    const chip = (r: number): ValueManifest =>
      manifest(
        extract(
          `<!doctype html><html><body><div class="band" style="background-color:rgb(255,255,255)">` +
            `<span class="chip" style="background-color:rgb(219,234,254);${radius(r)}">Coming soon</span>` +
            `</div></body></html>`,
          { band: [0, 100, 1280, 120], chip: [40, 140, 110, 24] },
        ),
        'x',
      )

    expect(on(diff(chip(12), chip(12)), 'Coming soon', 'shape'), 'identical chips agree').toEqual([])
    expect(on(diff(chip(12), chip(0)), 'Coming soon', 'shape'), 'a lost pill is still a defect').toHaveLength(1)
  })

  it('test_UAT_AC1606_a_manifest_with_no_backing_surface_reference_stays_inert', () => {
    // "A bundle captured before the reference existed carries none, and the
    // resolution stays inert — such a bundle behaves exactly as it did." Strip the
    // captured `surface` from both sides to reproduce a pre-BUG-22 bundle, and the
    // pre-existing per-node comparison must return unchanged — phantom and all.
    const strip = (m: ValueManifest): ValueManifest => ({
      ...m,
      elements: m.elements.map(({ surface: _surface, ...rest }) => rest),
    })

    const ref = manifest(referencePage(), 'ref')
    const repro = manifest(reproductionPage(), 'repro')

    // With the reference present, the faithful split control is silent (above).
    expect(on(diff(ref, repro), 'Subscribe', 'shape')).toEqual([])

    // Without it, the old per-node reading returns: the label's own 0px radius is
    // compared against the reference's 8px, reproducing the historical phantom.
    const legacy = diff(strip(ref), strip(repro))
    const shape = on(legacy, 'Subscribe', 'shape')
    expect(shape, 'a pre-BUG-22 bundle compares per node, exactly as it did').toHaveLength(1)
    expect(shape[0].expected).toContain('8')
    expect(shape[0].actual).toContain('radius 0px')

    // …and no surface-labelled geometry is invented for a bundle that never
    // recorded a bearing node.
    expect(legacy.filter((d) => d.expected.includes('surface'))).toEqual([])
  })
})
