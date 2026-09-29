/**
 * REQ-347 — a page's declared paint order was destroyed at the capture and had
 * nowhere to land in L1, so a hero headline reproduced underneath an opaque
 * photograph; and a framed photograph's ring was written onto the picture inside
 * the frame instead of onto the frame.
 *
 * ## Issue 1 — `z-index` was read off the leaf
 *
 * `z-index` does not inherit and is almost never declared on the leaf: a page
 * positions a WRAPPER and stacks that. `getComputedStyle(h1).zIndex` on
 * `<div style="z-index:20"><h1></h1></div>` is `auto` — correct for the `<h1>`,
 * and wrong for the painted result. faelan.com declares `20 / 15 / 10 / 5`
 * verbatim in its own stylesheet and its bundle held ELEVEN `zIndex` records, all
 * equal to `0`. With nothing to order by, the fold emitted the hero copy before
 * the collage, the renderer emitted no `z-index` anywhere, DOM order decided, and
 * a 64px `<h1>` plus its whole tagline were painted under an opaque photograph:
 * invisible on the page, 64.1% of that round's ranked pixel residual, and ZERO
 * value deltas, because both sides agreed on the same wrong zero.
 *
 * The machinery was already in the same record: `transformRotateDeg` walks the
 * ancestor chain (REQ-333) and is right. `zIndex` was the one axis still read off
 * the leaf alone.
 *
 * And fixing the capture is necessary and not sufficient. `stacked` is documented
 * as NOT a paint axis (the renderer emits nothing for it), and `sticky.lift` is a
 * field of the pin — so L1 could say "these two boxes deliberately overlap" and
 * could not say which one is on top. The axis is new here: `paintOrder`.
 *
 * ## Issue 2 — the frame's ring was written onto the picture's box
 *
 * REQ-333 started attributing a single-purpose wrapper's ring, radius, shadow and
 * mask to the image it frames, and kept writing them onto the IMAGE's rect. Under
 * the global `box-sizing: border-box` those are two different rectangles: the
 * wrapper's border box is 224 and the image's content box inside it is 216.
 * `224` occurred zero times in the whole capture and the radius came back 108
 * (50% of 216) instead of 112. Reproduced, a 216px border box with a 4px ring
 * leaves 208px of picture at a 4px offset — the ring 4px inward, everything
 * inside it shifted and 3.8% differently scaled. 35.9% of the same round's ranked
 * residual, and a residual the comparator could never report: `box` named an
 * un-bordered rect on the reference side and a bordered one on ours, so the same
 * two numbers read as a perfect match across an 8px error.
 *
 * ## How this is measured
 *
 * The capture leg drives the REAL `EXTRACT_SCRIPT` over a parsed DOM (jsdom does
 * no layout, so the supplied rects ARE the measurement and can be set to the
 * rotated bounding boxes a real engine reports). The fold and renderer legs drive
 * the real `foldToL1` / `renderL1Document`. Every number is faelan.com's own.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { foldToL1 } from '../tools/generate/src'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  type MultiStateCapture,
  type RawField,
  type RawSignals,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src/cli/capture'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** The axis-aligned bounding box a real engine reports for a rotated `w x h` box. */
function rotatedAabb(
  x: number,
  y: number,
  w: number,
  h: number,
  deg: number,
): { x: number; y: number; width: number; height: number } {
  const r = (deg * Math.PI) / 180
  const W = w * Math.abs(Math.cos(r)) + h * Math.abs(Math.sin(r))
  const H = w * Math.abs(Math.sin(r)) + h * Math.abs(Math.cos(r))
  return { x: x + w / 2 - W / 2, y: y + h / 2 - H / 2, width: W, height: H }
}

/**
 * faelan.com's hero, as its own stylesheet declares it: one `.photo-layer` at
 * `z-index: 10` holding an absolutely-placed `.header-text` at 20, a ringed
 * `.photo-circle` at 15, a `.photo-torn` at 5, and a `.photo-soft-1` that
 * declares no level at all but IS a stacking context (it carries a transform).
 *
 * `#loose` sits outside the layer with nothing positioned above it — the rail
 * that a page declaring no stacking still records none. `#own` declares its level
 * on the leaf itself, which is the reading that always worked.
 */
const FRAME = { x: 928, y: 60, w: 224, h: 224, deg: -5 }
const PICTURE = { x: 932, y: 64, w: 216, h: 216 }
const TORN = { x: 60, y: 40, w: 320, h: 205.7, deg: 3 }

function heroSignals(): RawSignals {
  const ring = `border-top-width: 4px; border-right-width: 4px; border-bottom-width: 4px; border-left-width: 4px;
    border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid;
    border-top-color: rgba(255, 255, 255, 0.3); border-right-color: rgba(255, 255, 255, 0.3);
    border-bottom-color: rgba(255, 255, 255, 0.3); border-left-color: rgba(255, 255, 255, 0.3);
    border-top-left-radius: 50%; border-top-right-radius: 50%;
    border-bottom-left-radius: 50%; border-bottom-right-radius: 50%`
  const html = `<!doctype html><html><body>
    <section id="hero">
      <div id="header-text" style="position: absolute; z-index: 20"><h1 id="title">FAELAN</h1></div>
      <div id="circle" style="position: absolute; z-index: 15; transform: rotate(-5deg); overflow: hidden; overflow-x: hidden; overflow-y: hidden; ${ring}">
        <img id="circle-img" src="circle.jpg" alt="Faelan" style="object-fit: cover">
      </div>
      <div id="torn" style="position: absolute; z-index: 5; transform: rotate(3deg)">
        <img id="torn-img" src="torn.jpg" alt="Ghostship" style="object-fit: cover;
          border-top-left-radius: 8px; border-top-right-radius: 8px;
          border-bottom-left-radius: 8px; border-bottom-right-radius: 8px">
      </div>
      <div id="layer" style="position: relative; z-index: 10">
        <div id="soft" style="position: absolute; transform: rotate(-8deg)">
          <img id="soft-img" src="soft.jpg" alt="Violin" style="object-fit: cover">
        </div>
      </div>
      <img id="own" src="own.jpg" alt="Own level" style="position: absolute; z-index: 3; object-fit: cover">
      <img id="loose" src="loose.jpg" alt="Loose" style="object-fit: cover">
    </section></body></html>`

  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const doc = dom.window.document
  const R = (b: { x: number; y: number; width: number; height: number }) =>
    ({ ...b, left: b.x, top: b.y, right: b.x + b.width, bottom: b.y + b.height, toJSON() {} })
  const rects = new Map<Element, ReturnType<typeof R>>()
  const put = (id: string, b: { x: number; y: number; width: number; height: number }) =>
    rects.set(doc.getElementById(id)!, R(b))

  put('hero', { x: 0, y: 0, width: 1280, height: 900 })
  put('layer', { x: 0, y: 0, width: 1280, height: 900 })
  put('header-text', { x: 102, y: 64, width: 268, height: 96 })
  put('title', { x: 102, y: 64, width: 268, height: 96 })
  // The wrapper's rect is the rotated AABB of its 224px BORDER box; the image
  // inside it is the rotated AABB of its 216px content box. Both are what a real
  // engine reports, and neither is a layout box.
  put('circle', rotatedAabb(FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.deg))
  put('circle-img', rotatedAabb(PICTURE.x, PICTURE.y, PICTURE.w, PICTURE.h, FRAME.deg))
  put('torn', rotatedAabb(TORN.x, TORN.y, TORN.w, TORN.h, TORN.deg))
  put('torn-img', rotatedAabb(TORN.x, TORN.y, TORN.w, TORN.h, TORN.deg))
  put('soft', rotatedAabb(192, 360, 260, 259, -8))
  put('soft-img', rotatedAabb(192, 360, 260, 259, -8))
  put('own', { x: 700, y: 700, width: 120, height: 90 })
  put('loose', { x: 40, y: 760, width: 120, height: 90 })

  dom.window.Element.prototype.getBoundingClientRect = function () {
    return (rects.get(this) ?? R({ x: 0, y: 0, width: 100, height: 20 })) as unknown as DOMRect
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 900 })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

const signals = heroSignals()
const fields = signals.bands.flatMap((b) => b.fields) as RawField[]
const runs = signals.bands.flatMap((b) => b.content)
const field = (alt: string): RawField => {
  const f = fields.find((x) => (x as { alt?: string }).alt === alt)
  if (!f) throw new Error(`no field with alt ${JSON.stringify(alt)} (have ${fields.map((x) => (x as { alt?: string }).alt).join(', ')})`)
  return f
}
const run = (text: string) => {
  const r = runs.find((x) => (x as { text?: string }).text === text)
  if (!r) throw new Error(`no run ${JSON.stringify(text)}`)
  return r as { zIndex?: number }
}

// ── issue 1, capture leg ────────────────────────────────────────────────────

describe('REQ-347 issue 1 — the level a page declares is read off the chain that declares it', () => {
  it('test_UAT_FC_REQ-347_a_wrappers_z_index_is_attributed_to_the_leaf_it_stacks', () => {
    // THE FAILURE, on the record that made it visible: a headline the page lifts to
    // `z-index: 20` recorded `0`, because `z-index` does not inherit and the capture
    // asked the `<h1>` rather than the `.header-text` that carries the declaration.
    expect(run('FAELAN').zIndex).toBe(20)

    // The same walk on the two photographs whose wrappers declare a level.
    expect(field('Faelan').zIndex).toBe(15)
    expect(field('Ghostship').zIndex).toBe(5)

    // AND THE ORDER THAT COSTS THE PAGE: the type is above the photograph it was
    // painted under. This is the whole of issue 1 in one comparison.
    expect(run('FAELAN').zIndex!).toBeGreaterThan(field('Ghostship').zIndex!)
  })

  it('test_UAT_FC_REQ-347_a_stacking_context_that_declares_no_level_seals_its_subtree_at_zero', () => {
    // THE RAIL THAT KEEPS THE WALK FROM RE-ORDERING THE COLLAGE. `.photo-soft-1` is
    // `position:absolute; transform:rotate(-8deg)` with NO z-index: the transform
    // makes it a stacking context, so it and everything inside it paint as one unit
    // at level 0 of the layer above — BELOW `.photo-torn`'s declared 5. Walking past
    // it to `.photo-layer`'s 10 would say the opposite and lift it over two
    // photographs the reference paints on top of it.
    expect(field('Violin').zIndex).toBe(0)
    expect(field('Violin').zIndex!).toBeLessThan(field('Ghostship').zIndex!)
  })

  it('test_UAT_FC_REQ-347_a_leafs_own_level_still_wins_and_an_unstacked_page_records_nothing', () => {
    // The reading that always worked is unchanged: an element that declares its own
    // level is still read at itself, not at anything above it.
    expect(field('Own level').zIndex).toBe(3)

    // And the rail in the other direction — a page that stacks nothing records
    // nothing. This widened where the value is looked for; it did not invent one.
    expect(field('Loose').zIndex).toBe(0)
  })
})

// ── issue 2, capture leg ────────────────────────────────────────────────────

describe('REQ-347 issue 2 — a framed photograph is measured on the frame', () => {
  it('test_UAT_FC_REQ-347_a_framed_images_box_is_the_frames_border_box', () => {
    const circle = field('Faelan')

    // THE FAILURE: `224` did not occur anywhere in the bundle. The wrapper declares
    // `width:224px;height:224px;border:4px` under `box-sizing:border-box`, so its
    // border box is 224 and the picture inside it is 216 — and the ring, which is
    // painted at 224, was written onto the 216.
    expect(circle.box!.width).toBeCloseTo(224, 2)
    expect(circle.box!.height).toBeCloseTo(224, 2)
    expect(circle.box!.x).toBeCloseTo(FRAME.x, 2)
    expect(circle.box!.y).toBeCloseTo(FRAME.y, 2)

    // The percentage radius resolves against the box it is attributed to, so moving
    // the box moves the radius with it: 50% of 224 is 112, which is the disc the
    // page draws. 108 — 50% of the picture inside the ring — is a smaller circle.
    expect(circle.borderRadiusPx).toBe(112)
    expect(circle.borderWidthPx).toBe(4)
    expect(circle.borderColor).toBe('#ffffff4d')
  })

  it('test_UAT_FC_REQ-347_an_image_that_frames_itself_keeps_its_own_box', () => {
    // THE RAIL. Only a FRAME moves the box. A photograph whose radius is on the
    // `<img>` has no frame (its wrapper paints nothing), so its box is its own
    // un-inflated layout box exactly as REQ-333 left it.
    const torn = field('Ghostship')
    expect(torn.box!.width).toBeCloseTo(TORN.w, 1)
    expect(torn.box!.height).toBeCloseTo(TORN.h, 1)
    expect(torn.borderRadiusPx).toBe(8)
    expect(torn.borderWidthPx).toBe(0)

    // And an image with no framing anywhere gains none.
    const loose = field('Loose')
    expect(loose.box!.width).toBe(120)
    expect(loose.borderRadiusPx).toBe(0)
  })

  it('test_UAT_FC_REQ-347_a_framed_images_clip_is_the_frames_clip', () => {
    // The wrapper is the element that CROPS (`overflow: hidden` is on it), so the
    // clip box has to be measured there too. Left on the picture it would be
    // smaller than the box now recorded, and the fold would read a leaf as escaping
    // a region that in fact contains it.
    const clip = field('Faelan').clip as { width?: number } | null
    const frameAabb = rotatedAabb(FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.deg)
    expect(clip?.width).toBeCloseTo(frameAabb.width, 2)
  })

  it('test_UAT_FC_REQ-347_the_bundle_stamp_says_a_stored_capture_is_behind', () => {
    // BOTH FIXES ARE CAPTURE-SIDE AND INVISIBLE TO A RE-FOLD: a stored bundle keeps
    // its wrong values until it is re-captured. The schema stamp is what says so out
    // loud instead of leaving the next round to re-measure a residual whose fix has
    // already shipped.
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(9)
  })
})

// ── the L1 half: a node-level paint order, folded and rendered ───────────────

function multi(elements: ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements, sections: [] as never, viewport: { width, height: 900 } },
  }))
  return { url: 'http://faelan.test/', notes: [], projections }
}

function picture(over: Partial<ValueElement>): ValueElement {
  return {
    role: 'img',
    text: '',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    objectFit: 'cover',
    src: 'a.jpg',
    ...over,
  } as ValueElement
}

function textRun(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'heading',
    color: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 64,
    fontWeight: 700,
    lineHeightPx: 96,
    ...over,
  } as ValueElement
}

function panel(over: Partial<ValueElement>): ValueElement {
  return {
    role: 'generic',
    text: '',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    surfaceFill: '#0b101e',
    ...over,
  } as ValueElement
}

function nodesOf(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (nodes: readonly L1Node[]): void => {
    for (const n of nodes) {
      out.push(n)
      walk(n.kind === 'container' ? n.children : ((n as { children?: L1Node[] }).children ?? []))
    }
  }
  walk([doc.root])
  return out
}

const imageByAlt = (doc: L1Document, alt: string): L1Node =>
  nodesOf(doc).find((n) => n.kind === 'image' && (n as { alt?: string }).alt === alt)!

/** The hero the round measured: a headline at 20 over three photographs. */
const heroCapture = (): MultiStateCapture =>
  multi([
    textRun({
      text: 'FAELAN',
      box: { x: 102, y: 64, width: 268, height: 96 },
      renderedTextBox: { x: 102, y: 64, width: 268, height: 70 },
      zIndex: 20,
    }),
    picture({ alt: 'Faelan', box: { x: 928, y: 60, width: 224, height: 224 }, zIndex: 15 }),
    picture({ alt: 'Ghostship', box: { x: 60, y: 40, width: 320, height: 205.7 }, zIndex: 5 }),
    picture({ alt: 'Violin', box: { x: 192, y: 360, width: 260, height: 259 }, zIndex: 0 }),
  ])

describe('REQ-347 — L1 carries the paint order, and the renderer emits it', () => {
  it('test_UAT_FC_REQ-347_a_captured_level_folds_onto_the_node_and_reaches_the_css', () => {
    const doc = foldToL1(heroCapture())

    // THE AXIS L1 DID NOT HAVE. `stacked` is a declaration the renderer emits
    // nothing for, and `sticky.lift` is a field of the pin — so before this the
    // document could not say which of two overlapping boxes is on top at all.
    const headline = nodesOf(doc).find((n) => n.kind === 'text')
    expect(headline?.paintOrder).toBe(20)
    expect(imageByAlt(doc, 'Faelan').paintOrder).toBe(15)
    expect(imageByAlt(doc, 'Ghostship').paintOrder).toBe(5)

    // AND THE ORDER THE PAGE LOSES WITHOUT IT: the headline is above the photograph
    // that was painted over it.
    expect(headline!.paintOrder!).toBeGreaterThan(imageByAlt(doc, 'Ghostship').paintOrder!)

    // It survives the substrate and reaches the browser. `grep -c 'z-index'` on the
    // reproduction's own HTML read 0 for this page.
    expect(validateL1(doc).ok).toBe(true)
    const { css } = renderL1Document(doc)
    expect(css).toContain('z-index: 20')
    expect(css).toContain('z-index: 15')
    expect(css).toContain('z-index: 5')
  })

  it('test_UAT_FC_REQ-347_level_zero_is_the_absence_of_a_level', () => {
    // `z-index: auto` and `z-index: 0` both arrive as 0 and both mean "document
    // order decides", which is exactly what the field's absence means — so a page
    // that stacks nothing folds and renders byte-for-byte as it did before this
    // axis existed. The schema refuses the second spelling outright.
    const doc = foldToL1(heroCapture())
    expect(imageByAlt(doc, 'Violin').paintOrder).toBeUndefined()

    const flat = foldToL1(
      multi([picture({ alt: 'Plain', box: { x: 0, y: 0, width: 100, height: 100 }, zIndex: 0 })]),
    )
    expect(nodesOf(flat).some((n) => n.paintOrder !== undefined)).toBe(false)
    expect(renderL1Document(flat).css).not.toContain('z-index')

    expect(validateL1({ ...doc, root: { ...doc.root, paintOrder: 0 } } as L1Document).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-347_a_run_and_a_panel_carry_a_level_too', () => {
    // NOT AN IMAGE AXIS. The loss that named this was a HEADLINE painted under a
    // photograph, and a scrim over a hero is the same axis again — so it is read at
    // every leaf branch, exactly as `transform` is.
    const doc = foldToL1(
      multi([
        textRun({
          text: 'Angled pull-quote',
          box: { x: 40, y: 40, width: 400, height: 40 },
          renderedTextBox: { x: 40, y: 40, width: 400, height: 21 },
          zIndex: 7,
        }),
        panel({ box: { x: 40, y: 200, width: 300, height: 120 }, zIndex: -2 }),
      ]),
    )
    expect(nodesOf(doc).find((n) => n.kind === 'text')?.paintOrder).toBe(7)
    expect(nodesOf(doc).find((n) => n.kind === 'box' && n.paintOrder !== undefined)?.paintOrder).toBe(-2)
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-347_a_backdrops_layer_stays_the_folds_decision', () => {
    // THE ONE PLACE A CAPTURED LEVEL MUST NOT BE WRITTEN. The background layer is
    // built by putting the content-free surfaces FIRST in document order — that
    // ordering IS what makes them backgrounds — and every node in it is a sibling
    // of the content, not the child of a separate stacking context. So a level
    // written onto a backdrop would let it climb out of that layer and paint over
    // the content it is the ground for: a page whose hero wrapper declares
    // `z-index: 10` and whose copy declares nothing would hide its own words
    // behind its own photograph. Where a backdrop paints is already stated, by
    // where the fold puts it.
    const doc = foldToL1(
      multi([
        panel({
          box: { x: 0, y: 0, width: 1440, height: 700 },
          backgroundImageUrl: 'https://faelan.test/hero.jpg',
          zIndex: 10,
        }),
        textRun({
          text: 'FAELAN',
          box: { x: 102, y: 64, width: 268, height: 96 },
          renderedTextBox: { x: 102, y: 64, width: 268, height: 70 },
        }),
      ]),
    )
    const backdrop = nodesOf(doc).find(
      (n) => n.kind === 'box' && (n as { axes?: { backgroundImageUrl?: string } }).axes?.backgroundImageUrl,
    )
    expect(backdrop, 'the photograph folded as a backdrop').toBeDefined()
    expect(backdrop!.paintOrder).toBeUndefined()
    expect(nodesOf(doc).every((n) => n.paintOrder === undefined)).toBe(true)
    expect(renderL1Document(doc).css).not.toContain('z-index')
  })

  it('test_UAT_FC_REQ-347_an_out_of_envelope_level_clamps_rather_than_dropping', () => {
    // THE OPPOSITE OF `foldTransform`'s RULE, and for a reason about what the axis
    // IS. A rotation past ten turns is not a design that can be half-honoured; a
    // RANK has no such property. `z-index: 2147483647` — the cookie-banner idiom —
    // means "above everything", and clamping preserves that relation exactly, where
    // dropping it would silently return the node to document order, which is the
    // defect rather than a safe default.
    const doc = foldToL1(
      multi([
        picture({ alt: 'Top', box: { x: 0, y: 0, width: 100, height: 100 }, zIndex: 2147483647 }),
        picture({ alt: 'Bottom', box: { x: 200, y: 0, width: 100, height: 100 }, zIndex: -2147483647 }),
      ]),
    )
    expect(imageByAlt(doc, 'Top').paintOrder).toBe(1000)
    expect(imageByAlt(doc, 'Bottom').paintOrder).toBe(-1000)
    expect(validateL1(doc).ok).toBe(true)
  })
})
