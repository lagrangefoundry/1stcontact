/**
 * BUG-187 — ten of 64 values-diff deltas on www.hearingzone510.com compared
 * something the two sides did not hold in common.
 *
 *   1. `zIndex` compared a raw level across stacking contexts. Zyro grounds every
 *      section with `.block-background` at 13 and puts the copy in `.block-layout`
 *      at 14 → `.layout-element` at 1; the fold states the ground's place by
 *      document order and writes no level. Six HIGH `z:13 → z:0` deltas on grounds
 *      that paint correctly, while the page's one real inversion (the hero photo
 *      over its 45% scrim) read as an unexplained `z:2 → z:0`. Paint order is now
 *      the relative order of each OVERLAPPING pair, read through each element's
 *      stacking chain (`paintStack`).
 *   2. `clip-path: inset(0px)` read as a mask. Delivered concurrently by REQ-371
 *      (`paintsMaskEdge`, evidenced in its own UATs); not re-tested here.
 *   3. A bare text node beside a styled span (`<p>F<span>…</span></p>`) was
 *      recorded with its paragraph's box and glyph extent; it is now measured over
 *      its own range, as the reproduction measures its own span.
 *
 * Evidence shape: the capture leg drives the REAL `EXTRACT_SCRIPT` over a parsed
 * DOM (jsdom does no layout, so the supplied rects ARE the measurement — the
 * REQ-347 pattern), and the reference and a flat reproduction are both flattened
 * by the real `flattenSignals` and compared by the real `diffManifests`. Every
 * box is hearingzone510.com's own. No mocks.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  diffManifests,
  discriminatorIsCalibrated,
  flattenSignals,
  staleCaptureAxes,
  type Capture,
  type RawSignals,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'

type Rect = { x: number; y: number; width: number; height: number }

const SECTION: Rect = { x: 0, y: 40, width: 1280, height: 2100 }
const GROUND: Rect = { x: 0, y: 40, width: 1280, height: 2100 }
const PHOTO: Rect = { x: 0, y: 40, width: 1280, height: 1168.56 }
const SCRIM: Rect = { x: 0, y: 40, width: 1280, height: 1157 }
const PARA: Rect = { x: 43.05, y: 1362, width: 673.9, height: 162 }
const PARA_INK: Rect = { x: 43.05, y: 1364, width: 667.2, height: 157 }
const F_INK: Rect = { x: 43.05, y: 1364, width: 11.08, height: 22 }
const REST: Rect = { x: 43.05, y: 1361.5, width: 667.22, height: 162 }

/**
 * Run the real extractor over `html`. `rects` maps an element id to its rect;
 * `ink` maps a Range's subject — an element id, or a text node's own text — to
 * the glyph extent a real engine would report for it.
 */
function extract(html: string, rects: Record<string, Rect>, ink: Record<string, Rect>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const W = dom.window
  const R = (b: Rect) => ({ ...b, left: b.x, top: b.y, right: b.x + b.width, bottom: b.y + b.height, toJSON() {} })
  W.Element.prototype.getBoundingClientRect = function (this: Element) {
    const b = rects[this.id]
    return R(b ?? { x: 0, y: 0, width: 100, height: 20 }) as unknown as DOMRect
  }
  const proto = W.Range.prototype as unknown as {
    getBoundingClientRect: () => unknown
    getClientRects: () => unknown[]
  }
  proto.getBoundingClientRect = function (this: { startContainer: Node }) {
    const n = this.startContainer
    const b = n.nodeType === 3 ? ink[n.nodeValue ?? ''] : ink[(n as Element).id]
    return R(b ?? { x: 0, y: 0, width: 0, height: 0 })
  }
  proto.getClientRects = () => []
  Object.defineProperty(W.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(W.Element.prototype, 'scrollHeight', { configurable: true, get: () => 2200 })
  return (W as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}

/**
 * hearingzone510.com's hero as Zyro builds it: the ground at 13 holding the
 * photograph and its 45% scrim at 2, the copy in a layout at 14 → a cell at 1,
 * and the paragraph whose first letter is a bare text node.
 */
function reference(): ValueManifest {
  const html = `<!doctype html><html><body>
    <section id="hero" style="position: relative">
      <div id="ground" style="position: absolute; z-index: 13; overflow: hidden; background-color: rgb(214, 214, 214)">
        <img id="photo" src="photo.jpg" alt="black and white bed linen" style="position: absolute; object-fit: cover">
        <div id="scrim" style="position: absolute; z-index: 2; opacity: 0.45; background-color: rgb(29, 30, 32)"></div>
      </div>
      <div id="layout" style="position: relative; z-index: 14; display: grid">
        <div id="cell" style="position: relative; z-index: 1">
          <p id="para">F<span id="rest" style="color: rgb(0, 30, 66)">or over 20 years, Hearing Zone</span></p>
        </div>
      </div>
    </section></body></html>`
  const signals = extract(
    html,
    { hero: SECTION, ground: GROUND, photo: PHOTO, scrim: SCRIM, layout: SECTION, cell: PARA, para: PARA, rest: REST },
    { para: PARA_INK, F: F_INK, rest: REST, 'or over 20 years, Hearing Zone': REST },
  )
  return flattenSignals(signals, 'reference')
}

/**
 * The reproduction as the fold renders it: one flat container, the ground first
 * and no levels on any backdrop — and the photograph emitted AFTER its scrim,
 * which is the one real paint-order defect on the page. The copy's first letter
 * is its own span (a styled sub-run).
 */
function reproduction(): ValueManifest {
  const html = `<!doctype html><html><body>
    <section id="page" style="position: relative">
      <div id="ground" style="position: absolute; overflow: hidden; background-color: rgb(214, 214, 214)"></div>
      <div id="scrim" style="position: absolute; opacity: 0.45; background-color: rgb(29, 30, 32)"></div>
      <img id="photo" src="photo.jpg" alt="black and white bed linen" style="position: absolute; object-fit: cover">
      <p id="para" style="position: absolute; z-index: 1"><span id="f">F</span><span id="rest" style="color: rgb(0, 30, 66)">or over 20 years, Hearing Zone</span></p>
    </section></body></html>`
  const signals = extract(
    html,
    { page: SECTION, ground: GROUND, photo: PHOTO, scrim: SCRIM, para: PARA, f: F_INK, rest: REST },
    { f: F_INK, F: F_INK, rest: REST, 'or over 20 years, Hearing Zone': REST },
  )
  return flattenSignals(signals, 'reproduction')
}

const byText = (m: ValueManifest, text: string): ValueElement => {
  const e = m.elements.find((x) => x.text === text || x.accessibleName === text)
  if (!e) throw new Error(`no element ${JSON.stringify(text)} (have ${m.elements.map((x) => x.text).join(' | ')})`)
  return e
}
const ground = (m: ValueManifest): ValueElement => {
  const e = m.elements.find((x) => x.textless && x.surfaceFill === '#d6d6d6')
  if (!e) throw new Error('no ground')
  return e
}

const ref = reference()
const ours = reproduction()

describe('BUG-187 item 1 — paint order is the order of overlapping pairs, through the stacking chain', () => {
  it('test_UAT_FC_BUG-187_the_capture_records_each_elements_stacking_chain', () => {
    // The ground is one link at 13; the copy is two links (14 → 1) above its own
    // leaf. Neither integer alone says which is on top; the chains do.
    expect(ground(ref).paintStack?.map((l) => l.z)).toEqual([13])
    expect(byText(ref, 'F').paintStack?.map((l) => l.z)).toEqual([14, 1, 0])
    const scrim = ref.elements.find((x) => x.textless && x.opacity === 0.45)!
    expect(scrim.paintStack?.map((l) => l.z)).toEqual([13, 2])
    // The first link is the same box for the scrim and the ground, by document path.
    expect(scrim.paintStack?.[0].id).toBe(ground(ref).paintStack?.[0].id)
    // The legacy single level is unchanged — the fold still reads it.
    expect(ground(ref).zIndex).toBe(13)
  })

  it('test_UAT_FC_BUG-187_only_the_real_inversion_is_a_paint_order_delta', () => {
    const z = diffManifests(ref, ours).deltas.filter((d) => d.property === 'zIndex')
    // Not the ground at 13 against a flat 0 — the copy is above it on both sides.
    // Only the scrim, which the reference paints over the photograph and the
    // reproduction paints under it.
    expect(z).toHaveLength(1)
    expect(z[0]).toMatchObject({
      expected: 'above "black and white bed linen"',
      actual: 'below "black and white bed linen"',
      tier: 'HIGH',
      kind: 'zOrder',
    })
  })

  it('test_UAT_FC_BUG-187_a_level_that_reorders_nothing_is_not_a_delta', () => {
    // A level change on an element with no overlapping neighbour moves no pixel.
    const lone = (z: number): ValueManifest => ({
      source: 'lone',
      sections: [],
      elements: [{ text: 'logo', role: 'img', color: '', fontFamily: '', fontSizePx: 0, fontWeight: 0, textless: true, a11yRole: 'img', box: { x: 0, y: 0, width: 200, height: 60 }, zIndex: z }],
    })
    expect(diffManifests(lone(13), lone(0)).deltas.filter((d) => d.property === 'zIndex')).toEqual([])
  })

  it('test_UAT_FC_BUG-187_a_bundle_without_chains_orders_on_one_flat_level_and_says_so', () => {
    // Pre-schema-16 manifests: no chains on either side. Positioned siblings in
    // one container — the montage the flat reading was built for — still order
    // correctly on `zIndex` then document order, so a swapped overlapping pair is
    // caught; and the flat reading is declared for each side, not passed off as
    // the chain comparison.
    const at = (text: string, zIndex: number, y: number): ValueElement => ({
      text, role: 'body', color: '#000000', fontFamily: 'Prata', fontSizePx: 18, fontWeight: 400,
      box: { x: 0, y, width: 300, height: 200 }, zIndex,
    })
    const flatRef: ValueManifest = { source: 'ref', sections: [], elements: [at('portrait', 1, 0), at('caption', 5, 150)] }
    const flatOurs: ValueManifest = { source: 'ours', sections: [], elements: [at('portrait', 5, 0), at('caption', 1, 150)] }
    const report = diffManifests(flatRef, flatOurs)
    const z = report.deltas.filter((d) => d.property === 'zIndex')
    expect(z).toHaveLength(1)
    expect(z[0]).toMatchObject({ text: 'caption', expected: 'above "portrait"', actual: 'below "portrait"' })
    const declared = report.unmeasuredAxes.filter((a) => a.axis === 'paintStack').map((a) => a.side).sort()
    expect(declared).toEqual(['reference', 'reproduction'])
    // With chains on both sides, nothing is declared.
    expect(diffManifests(ref, ours).unmeasuredAxes.some((a) => a.axis === 'paintStack')).toBe(false)
  })

  it('test_UAT_FC_BUG-187_the_seeded_z_order_defect_still_fires', () => {
    const { results } = discriminatorIsCalibrated()
    expect(results.find((r) => r.name === 'wrong z-order')?.fired).toBe(true)
  })

  it('test_UAT_FC_BUG-187_a_schema_15_bundle_names_the_stacking_chain_as_missing', () => {
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(16)
    const bundle = {
      url: 'https://www.hearingzone510.com/',
      captureSchema: 15,
      sections: [{ content: [{ text: 'F', role: 'body', color: '#1d1e20', fontFamily: 'Prata', fontSizePx: 18, fontWeight: 400, zIndex: 1 }], items: [], fields: [] }],
    } as unknown as Capture
    expect(staleCaptureAxes(bundle).map((a) => a.axis).join(' | ')).toMatch(/paintStack/)
  })
})

describe('BUG-187 item 3 — a text node is measured by its own range', () => {
  it('test_UAT_FC_BUG-187_a_bare_text_node_beside_a_nested_run_gets_its_own_box', () => {
    const f = byText(ref, 'F')
    // Its glyph, not the paragraph's 667×157.
    expect(f.renderedTextBox).toMatchObject({ width: F_INK.width, height: F_INK.height })
    expect(f.box).toMatchObject({ width: F_INK.width, height: F_INK.height })
    // An element holding only its own run is still measured whole.
    expect(byText(ref, 'or over 20 years, Hearing Zone').renderedTextBox).toMatchObject({ width: REST.width })
  })

  it('test_UAT_FC_BUG-187_both_sides_measure_the_letter_the_same_way', () => {
    const report = diffManifests(ref, ours)
    expect(report.deltas.filter((d) => d.text === 'F' && d.property === 'renderedTextBox')).toEqual([])
  })
})
