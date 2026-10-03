/**
 * REQ-366 — two content losses on joyfulculinarycreations.com, both invisible to
 * every value delta.
 *
 * - **issue 1** — the primary nav collapses into a hamburger below 1280 and its
 *   labels repeat in the footer, so "Meet the Chef" occurs once at 320–1024 and
 *   twice from 1280. The responsive table paired occurrences in document order,
 *   which stitched the HEADER link at 1280 to the FOOTER link at 320–1024; the
 *   fold built one node from that row, the footer's clipping container took it,
 *   and the whole header nav was rebased 4572px above the footer menu and clipped
 *   away. Fixed at both links: the table aligns by page position when a key's
 *   count changes, and a leaf joins a clip region only if that ancestor holds it
 *   at every width it is laid out at.
 * - **issue 2** — an empty element whose only ink is a `::before` glyph (an icon
 *   font) or a border rule (a page-builder divider) was never recorded, so it was
 *   never drawn. The capture now records the glyph as a run and the rule as a
 *   field, and the schema stamp moves to 13 so an older bundle says it is owed a
 *   re-capture.
 *
 * The capture cases run the REAL `EXTRACT_SCRIPT` under jsdom, as REQ-338's do.
 * jsdom lays nothing out and does not implement pseudo-element styles, so the
 * fixtures state the boxes and the `::before` computed style a browser presents.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { foldToL1 } from '../tools/generate/src'
import { buildResponsiveTable, type LabelledProjection } from '../tools/generate/src/cli/responsive-table'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  staleCaptureAxes,
  type Capture,
  type RawRun,
  type RawSignals,
} from '../tools/generate/src/cli'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

// ── fixtures: the nav/footer shape, as the reference measured it ─────────────

const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** Page heights per width — the footer sits thousands of px lower on a phone. */
const PAGE_H: Record<number, number> = { 320: 7600, 375: 6800, 768: 6600, 1024: 4300, 1280: 4800, 1440: 4900 }
/** Where the footer's "Meet the Chef" sits, per width (the bundle's multistate.json). */
const FOOTER_Y: Record<number, number> = { 320: 7478.8, 375: 6688.6, 768: 6474, 1024: 4188.4, 1280: 4677.4, 1440: 4777.4 }

function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'link', color: '#ffffff', fontFamily: 'Arial', fontSizePx: 16, fontWeight: 400, lineHeightPx: 20, box, ...over }
}

/** One element marking the bottom of the page, so its extent is the reference's. */
const pageFoot = (w: number): ValueElement => run('© 2026', { x: 20, y: PAGE_H[w] - 30, width: 120, height: 20 })

/** The footer's clipping menu box per width (the `.l1-93 { overflow: hidden }` ancestor). */
const footerClip = (w: number) => ({ id: '0.4.2', x: 0, y: FOOTER_Y[w] - 35, width: w, height: 105 })

/** The nav shape: header link only from 1280, footer link at every width. */
function navElements(w: number, opts: { footerClip?: boolean } = {}): ValueElement[] {
  const els: ValueElement[] = []
  if (w >= 1280) els.push(run('Meet the Chef', { x: w === 1280 ? 642.2 : 802.2, y: 70, width: 120, height: 46 }))
  els.push(
    run(
      'Meet the Chef',
      { x: w / 3, y: FOOTER_Y[w], width: 120, height: 20 },
      opts.footerClip ? { clip: footerClip(w) } : {},
    ),
  )
  els.push(pageFoot(w))
  return els
}

function labelled(elementsAt: (w: number) => ValueElement[]): LabelledProjection[] {
  return LADDER.map((width) => ({
    size: { name: String(width), width },
    manifest: { source: `req366:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
}

function multiFrom(elementsAt: (w: number) => ValueElement[], ladder = LADDER): MultiStateCapture {
  const projections: StateProjection[] = ladder.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `req366:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** Every node with the chain of containers above it. */
function walk(doc: L1Document): Array<{ node: L1Node; ancestors: L1Node[] }> {
  const out: Array<{ node: L1Node; ancestors: L1Node[] }> = []
  const visit = (node: L1Node, ancestors: L1Node[]): void => {
    out.push({ node, ancestors })
    const kids = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
    kids.forEach((child) => visit(child, [...ancestors, node]))
  }
  visit(doc.root, [])
  return out
}

const keyframesOf = (node: L1Node) =>
  (node as { geometry?: { keyframes: Array<{ at: number; x: number; y: number }> } }).geometry?.keyframes ?? []
const textOf = (node: L1Node) => (node as { text?: string }).text

// ── issue 1, link 1 — the responsive table ───────────────────────────────────

describe('REQ-366 issue 1 — a run present at only some widths is not stitched to a same-text run elsewhere', () => {
  const rows = buildResponsiveTable(labelled((w) => navElements(w))).rows.filter((r) => r.label === 'Meet the Chef')

  it('test_UAT_FC_REQ-366_the_narrow_width_occurrence_pairs_with_the_occurrence_at_the_same_place_on_the_page', () => {
    expect(rows, 'two occurrences from 1280 means two rows').toHaveLength(2)
    const footer = rows.find((r) => r.cells.every((c) => c.present))!
    expect(footer, 'one row carries the footer link across the whole ladder').toBeTruthy()
    // Every cell of that row is the FOOTER link — never the header's y 70.
    for (const c of footer.cells) expect(c.element!.box!.y, `${c.width}px`).toBe(FOOTER_Y[c.width])
  })

  it('test_UAT_FC_REQ-366_the_occurrence_with_no_counterpart_is_its_own_presence_flip_row', () => {
    const header = rows.find((r) => !r.cells.every((c) => c.present))!
    expect(header.presenceFlips).toBe(true)
    expect(header.cells.filter((c) => c.present).map((c) => c.width)).toEqual([1280, 1440])
    expect(header.cells.filter((c) => c.present).map((c) => c.element!.box!.y)).toEqual([70, 70])
  })

  it('test_UAT_FC_REQ-366_equal_counts_still_pair_in_document_order', () => {
    // Where the count holds, nothing changed: occurrence i pairs with occurrence i,
    // whatever the geometry says (a reflow may well reorder positions).
    const t = buildResponsiveTable(
      labelled((w) => [
        run('Read more', { x: 10, y: w < 1024 ? 900 : 100, width: 80, height: 20 }),
        run('Read more', { x: 10, y: w < 1024 ? 100 : 900, width: 80, height: 20 }),
        pageFoot(w),
      ]),
    ).rows.filter((r) => r.label === 'Read more')
    expect(t).toHaveLength(2)
    expect(t[0].cells.map((c) => c.element!.box!.y)).toEqual([900, 900, 900, 100, 100, 100])
    expect(t[1].cells.map((c) => c.element!.box!.y)).toEqual([100, 100, 100, 900, 900, 900])
  })
})

// ── issue 1, link 2 — the fold and the clip region ───────────────────────────

describe('REQ-366 issue 1 — the header link is not folded into the footer’s clipping container', () => {
  it('test_UAT_FC_REQ-366_the_header_link_is_laid_out_at_its_own_widths_outside_any_clip_region', () => {
    // A second footer link reaches past the menu's edge, so the footer's clip
    // region IS built — the shape in which the header nav vanished.
    const doc = foldToL1(
      multiFrom((w) => [
        ...navElements(w, { footerClip: true }),
        run('Get in Touch', { x: w - 40, y: FOOTER_Y[w], width: 120, height: 20 }, { clip: footerClip(w) }),
      ]),
    )
    const nodes = walk(doc).filter((n) => textOf(n.node) === 'Meet the Chef')
    expect(nodes).toHaveLength(2)
    const header = nodes.find((n) => keyframesOf(n.node).length === 2)!
    expect(header, 'the header link carries keyframes at 1280 and 1440 only').toBeTruthy()
    expect(keyframesOf(header.node).map((k) => [k.at, k.y])).toEqual([
      [1280, 70],
      [1440, 70],
    ])
    expect(header.ancestors.some((a) => (a as { clip?: boolean }).clip === true), 'not inside a clip region').toBe(false)
    const footer = nodes.find((n) => n !== header)!
    expect(keyframesOf(footer.node).map((k) => k.at), 'the footer link carries the whole ladder').toEqual(LADDER)
  })

  it('test_UAT_FC_REQ-366_a_leaf_the_clipping_ancestor_does_not_hold_at_one_of_its_widths_is_not_nested', () => {
    // The defence in depth, independent of the table: a leaf whose clip frame is
    // missing at a width it is laid out at must not be rebased into the region,
    // because nested it would be clipped to that box at EVERY width.
    const ladder = [320, 768, 1280]
    const clip = (w: number) => ({ id: '0.7', x: 0, y: 300, width: w, height: 200 })
    const doc = foldToL1(
      multiFrom(
        (w) => [
          run('slide', { x: w - 60, y: 320, width: 300, height: 40 }, { clip: clip(w) }),
          run('inside below 1280 only', { x: 40, y: 360, width: 200, height: 20 }, w < 1280 ? { clip: clip(w) } : {}),
        ],
        ladder,
      ),
    )
    const clippers = walk(doc).filter((n) => (n.node as { clip?: boolean }).clip === true)
    expect(clippers, 'the escaping slide still gets its clip region').toHaveLength(1)
    const partial = walk(doc).find((n) => textOf(n.node) === 'inside below 1280 only')!
    expect(partial.ancestors.includes(clippers[0].node)).toBe(false)
  })
})

// ── issue 2 — the capture records an empty element's ink ─────────────────────

type Rect = { x: number; y: number; w: number; h: number }
const domRect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/**
 * Run the real extractor. `pseudos` states, per element id, the `::before`
 * computed style a browser would report — jsdom does not implement it.
 */
function extract(
  bodyHtml: string,
  boxes: Record<string, Rect>,
  pseudos: Record<string, Record<string, string>> = {},
): RawSignals {
  const dom = new JSDOM(`<!doctype html><html><body style="margin:0">${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  })
  const fallback: Rect = { x: 0, y: 0, w: 1280, h: 400 }
  dom.window.Element.prototype.getBoundingClientRect = function (this: Element) {
    const b = boxes[this.id] ?? fallback
    return domRect(b.x, b.y, b.w, b.h)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  const real = dom.window.getComputedStyle.bind(dom.window)
  dom.window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
    const base = real(el)
    if (!pseudo) return base
    const over: Record<string, string> = { content: 'none', ...(pseudo === '::before' ? pseudos[el.id] : {}) }
    return new Proxy(base, {
      get(t, k) {
        if (typeof k === 'string' && k in over) return over[k]
        const v = Reflect.get(t, k, t)
        return typeof v === 'function' ? v.bind(t) : v
      },
    })
  }) as typeof dom.window.getComputedStyle
  return (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}

const runsOf = (s: RawSignals): RawRun[] => s.bands.flatMap((b) => [...b.content, ...b.items.flat()])
const fieldsOf = (s: RawSignals) => s.bands.flatMap((b) => b.fields)

const ICON_HTML = `
  <section id="s" style="background-color:#ffffff;width:1280px;height:600px">
    <div id="box"><a id="a" href="/services"><i id="ico" class="fas fa-laptop" aria-hidden="true"></i></a></div>
    <p id="p" style="color:#111111">Cooking lessons in your own kitchen</p>
    <span id="rule" style="display:block;border-top:2.5px solid #ffffff;width:300px"></span>
    <div id="outlined" style="border:2px solid #000000;width:160px;height:40px"></div>
  </section>`
const ICON_BOXES: Record<string, Rect> = {
  s: { x: 0, y: 0, w: 1280, h: 600 },
  box: { x: 256, y: 16, w: 48, h: 48 },
  a: { x: 256, y: 16, w: 48, h: 48 },
  ico: { x: 264, y: 24, w: 32, h: 32 },
  p: { x: 40, y: 120, w: 600, h: 24 },
  rule: { x: 224, y: 496, w: 304, h: 2.5 },
  outlined: { x: 40, y: 200, w: 160, h: 40 },
}
const ICON_PSEUDO = {
  ico: {
    content: '"\\f109"',
    fontFamily: '"Font Awesome 5 Free"',
    fontWeight: '900',
    fontSize: '32px',
    color: 'rgb(204, 153, 85)',
  },
}

describe('REQ-366 issue 2 — an element whose only ink is a ::before glyph or a border is recorded', () => {
  const signals = extract(ICON_HTML, ICON_BOXES, ICON_PSEUDO)

  it('test_UAT_FC_REQ-366_an_icon_glyph_painted_by_an_empty_element_is_recorded_as_a_run', () => {
    const icon = runsOf(signals).find((r) => r.pseudoGlyph)
    expect(icon, 'the icon is a record at all').toBeTruthy()
    expect(icon!.pseudoGlyph).toBe('before')
    expect(icon!.text, 'the text is the generated glyph, unescaped').toBe('')
    // Its type is the pseudo-element's — the icon face, not the copy's.
    expect(icon!.fontFamily).toContain('Font Awesome 5 Free')
    expect(icon!.fontWeight).toBe(900)
    expect(icon!.fontSizePx).toBe(32)
    expect(icon!.color.toLowerCase()).toBe('#cc9955')
    // And its box is the element's.
    expect(icon!.box).toMatchObject({ x: 264, y: 24, width: 32, height: 32 })
    // The ordinary copy is unaffected and is not rejoined with the glyph.
    const copy = runsOf(signals).find((r) => r.text.startsWith('Cooking'))!
    expect(copy.pseudoGlyph).toBeUndefined()
    expect(copy.text).toBe('Cooking lessons in your own kitchen')
  })

  it('test_UAT_FC_REQ-366_an_empty_element_whose_only_ink_is_a_border_rule_is_recorded_as_a_field', () => {
    const rule = fieldsOf(signals).find((f) => f.box && Math.abs(f.box.y - 496) < 0.01)
    expect(rule, 'the divider is a field, as an <hr> is').toBeTruthy()
    expect(rule!.borderWidthPx).toBeGreaterThan(0)
    expect((rule!.borderColor ?? '').toLowerCase()).toMatch(/^#ffffff/)
  })

  it('test_UAT_FC_REQ-366_an_outlined_box_is_not_a_border_rule', () => {
    // A 160×40 outline paints a border AROUND space; recording it would put a
    // field on one side of a diff only.
    expect(fieldsOf(signals).some((f) => f.box && f.box.y === 200 && f.box.width === 160)).toBe(false)
  })

  it('test_UAT_FC_REQ-366_an_empty_element_with_no_generated_content_records_nothing', () => {
    const plain = extract(ICON_HTML, ICON_BOXES, {})
    expect(runsOf(plain).some((r) => r.pseudoGlyph)).toBe(false)
  })
})

describe('REQ-366 issue 2 — a bundle taken before schema 13 says it is owed a re-capture', () => {
  const bundle = (schema: number): Capture =>
    ({
      url: 'https://joyfulculinarycreations.test/',
      host: 'joyfulculinarycreations.test',
      path: '/',
      capturedAt: '2026-10-02T23:18:22.456Z',
      captureSchema: schema,
      viewport: { width: 1280, height: 800 },
      theme: { subScales: {} },
      sections: [],
      assets: [],
    }) as unknown as Capture

  it('test_UAT_FC_REQ-366_a_schema_12_bundle_names_the_empty_element_ink_axis', () => {
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(13)
    const axes = staleCaptureAxes(bundle(12)).map((a) => a.axis)
    expect(axes.some((a) => a.includes('empty element'))).toBe(true)
    expect(staleCaptureAxes(bundle(CAPTURE_SCHEMA))).toEqual([])
  })
})
