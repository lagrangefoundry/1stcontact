import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  flattenSignals,
  type RawSignals,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-d5de22a5 — AC-1608: a band's translucent veil is
 * captured as its own **overlay** value, and compared as a section-level axis.
 *
 * Drives the real `EXTRACT_SCRIPT` under jsdom and then the real `flattenSignals` →
 * `diffManifests` pipeline.
 *
 * Relationship to the free-coded evidence: `bug24-scrim-alpha.test.ts` carries four
 * browser-free `test_UAT_FC_BUG-24_*` tests — but all four are about the **fold**
 * (a scrim folding onto the section background box, rendering above the image, and
 * so on), taking the overlay value as an input. Its capture-side tests, the ones
 * that establish the value exists in the first place, sit under
 * `describe('BUG-24 capture resolves a colour-with-alpha scrim (real Chromium)')`
 * and skip without a browser. So the capture claim AC-1608 makes, and the
 * section-level diff axis, have no browser-free evidence. That is what this file adds.
 *
 * SCOPE LIMIT, stated rather than implied. AC-1608's Verification also asks for a
 * veil authored in a **modern colour syntax** (`color-mix(in oklab, …)` /
 * `oklch(… / .3)`) to record the same colour and alpha as the `rgba(...)` one, and
 * to be excluded from the backdrop index. That resolution runs through the REQ-52
 * **canvas colour probe** (`extract.ts` `rgbaOf` → `colorCtx`), and jsdom implements
 * no 2d canvas — `rgbaOf` documents and takes its `rgb()/rgba()`-regex fallback
 * there. Verified empirically: an `oklch(… / .3)` veil records `overlay: null` under
 * jsdom. Asserting that clause here would require hand-writing a colour parser into
 * the harness, which would measure the harness rather than the browser, so it is NOT
 * asserted. It remains covered only by the real-Chromium block in
 * `bug24-scrim-alpha.test.ts`, which skips where no browser exists.
 */

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

function extract(html: string, boxes: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const b = boxes[(this as Element).className || '']
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  dom.window.Range.prototype.getBoundingClientRect = function () {
    const n = (this as Range).startContainer as Element
    const b = boxes[(n && n.className) || '']
    return b ? rect(b[0], b[1], b[2], Math.min(b[3], 24)) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 900 })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

const BAND_BOX: Box = [0, 0, 1280, 600]
const VEIL_HEX = '#020617'

/** A hero band painting a photograph, blanketed by a veil authored as `veilCss`. */
function heroBand(veilCss: string, veilBox: Box = BAND_BOX): ValueManifest {
  const html =
    `<!doctype html><html><body>` +
    `<section class="hero" style="background-color:rgb(17,17,17);background-image:url(hero.jpg)">` +
    `<div class="veil" style="${veilCss}"></div>` +
    `<h1 class="title" style="color:rgb(255,255,255)">Dreaming of healthier meals</h1>` +
    `</section></body></html>`
  return flattenSignals(extract(html, { hero: BAND_BOX, veil: veilBox, title: [40, 240, 600, 56] }), 'x')
}

const overlayOf = (m: ValueManifest) => m.sections[0]?.overlay ?? null

describe('story-d5de22a5 — AC-1608 a band veil is captured as its own overlay', () => {
  it('test_UAT_AC1608_a_translucent_veil_is_recorded_as_colour_plus_alpha', () => {
    // The scrim that darkens a hero photograph so text stays legible. It is a
    // separate layer over the backdrop, which the band's own backgroundColor and
    // backgroundImage can never reveal — so it must be its own value.
    const overlay = overlayOf(heroBand('background-color:rgba(2, 6, 23, 0.3)'))

    expect(overlay, 'the veil is captured').not.toBeNull()
    expect(overlay!.color).toBe(VEIL_HEX)
    expect(overlay!.opacity).toBe(0.3)
  })

  it('test_UAT_AC1608_only_a_genuinely_translucent_layer_is_an_overlay', () => {
    // "a fully opaque background and a fully transparent one are both not one."
    // Opaque: the band simply has that colour; transparent: there is no veil.
    expect(overlayOf(heroBand('background-color:rgb(2, 6, 23)')), 'opaque is not a veil').toBeNull()
    expect(overlayOf(heroBand('background-color:rgba(2, 6, 23, 0)')), 'transparent is not a veil').toBeNull()

    // And a translucent layer that does not blanket the band is not a veil either,
    // so the axis cannot be tripped by any small tinted box inside a hero.
    expect(
      overlayOf(heroBand('background-color:rgba(2, 6, 23, 0.3)', [0, 0, 200, 100])),
      'a small translucent box does not blanket the band',
    ).toBeNull()
  })

  it('test_UAT_AC1608_a_captured_veil_is_not_also_indexed_as_a_backdrop', () => {
    // The coupling the AC names: the full-bleed-translucent exclusion of AC-816
    // keys on the fill being READ as translucent. So a veil that is captured as an
    // overlay must not ALSO appear in the backdrop index — that would paint it
    // twice, and opaquely, blacking out the photograph it was veiling.
    const m = heroBand('background-color:rgba(2, 6, 23, 0.3)')

    expect(overlayOf(m)!.color).toBe(VEIL_HEX)
    // No captured element carries the veil colour as an opaque surface fill.
    expect(m.elements.map((e) => e.surfaceFill).filter(Boolean)).not.toContain(VEIL_HEX)
  })

  it('test_UAT_AC1608_values_diff_compares_the_overlay_as_a_section_axis', () => {
    // The compare half: a reproduction whose veil alpha is off beyond tolerance
    // raises a section-level `overlay` delta carrying both values, and a matching
    // one raises none.
    const ref = heroBand('background-color:rgba(2, 6, 23, 0.3)')

    const differs = diffManifests(ref, heroBand('background-color:rgba(2, 6, 23, 0.6)')).deltas
    const overlay = differs.filter((d) => d.property === 'overlay')
    expect(overlay, 'an off veil alpha is reported once, on the section').toHaveLength(1)
    expect(overlay[0].expected).toContain('0.3')
    expect(overlay[0].actual).toContain('0.6')

    // A matching veil raises nothing at all — the axis is additive, never a
    // fabricated delta.
    expect(diffManifests(ref, heroBand('background-color:rgba(2, 6, 23, 0.3)')).deltas).toEqual([])

    // …and a re-render rounding difference inside the tolerance is absorbed, so the
    // axis is not simply "any difference at all".
    expect(
      diffManifests(ref, heroBand('background-color:rgba(2, 6, 23, 0.35)')).deltas.filter(
        (d) => d.property === 'overlay',
      ),
    ).toEqual([])
  })
})
