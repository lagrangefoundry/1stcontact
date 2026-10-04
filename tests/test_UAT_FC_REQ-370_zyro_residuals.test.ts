/**
 * REQ-370 — six residuals on hearingzone510.com, a Zyro page.
 *
 * - **issue 1** (fold) — a hero `<img>` the capture recorded BENEATH its own
 *   backdrop scrim (photo `zIndex 0`, veil `zIndex 2`) was emitted after the band
 *   in reading order and painted over its own veil. It now travels with the
 *   backdrop, immediately before it, clipped to its box.
 * - **issue 2** (capture) — an inline `<svg>` whose only shape is a solid
 *   rectangle covering it is recorded as a painted field with that fill.
 * - **issue 3** (L1 + capture + fold) — `white-space: break-spaces` keeps spaces
 *   that take width: L1 has a `whiteSpace` axis, the renderer emits it (and pins
 *   only the wrap mode when `nowrapFromPx` applies), the capture keeps the edge
 *   space and records the value, and the fold carries it onto the run.
 * - **issue 4** (fold) — a run that IS its own surface (a button) is placed where
 *   its lines are, not on the button's border.
 * - **issue 5** (capture) — a link's `tel:`/`mailto:` target is recorded.
 * - **issue 6** (capture) — an image parked in a scroll-reveal pre-state is landed.
 *
 * The capture cases run the REAL page scripts under jsdom, as REQ-366's do; jsdom
 * lays nothing out, so the fixtures state the boxes a browser would report, and
 * it does not inherit SVG `fill`, so the panel's fill is declared on its shape
 * (Chromium resolves the page's `svg{fill:…}` onto the path the same way).
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import {
  CAPTURE_COVERAGE,
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  REVEAL_MEDIA,
  staleCaptureAxes,
  type Capture,
  type RawRun,
  type RawSignals,
} from '../tools/generate/src/cli'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

// ── fold fixtures ─────────────────────────────────────────────────────────────

const LADDER = [768, 1280]

function multiFrom(elementsAt: (w: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `req370:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

const text = (t: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement => ({
  text: t,
  role: 'heading',
  color: '#ffffff',
  fontFamily: 'Prata',
  fontSizePx: 48,
  fontWeight: 400,
  lineHeightPx: 62.4,
  box,
  ...over,
})

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
const kfAt = (node: L1Node, at: number) =>
  (node as { geometry?: { keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> } })
    .geometry?.keyframes.find((k) => k.at === at)

/** The hearingzone hero: a 45% #1d1e20 veil over a photograph, one headline on top. */
function hero(opts: { photoLevel: number }) {
  return multiFrom((w) => [
    text('Hear what matters.', { x: 28, y: 884, width: w - 56, height: 62.4 }, {
      surfaceFill: '#1d1e20',
      surface: { self: false, box: { x: 0, y: 40, width: w, height: 1157 }, borderRadiusPx: 0, boxShadow: null, border: null },
      zIndex: 3,
    }),
    {
      text: 'black and white bed linen',
      textless: true,
      role: 'img',
      a11yRole: 'img',
      objectFit: 'cover',
      intrinsicAspect: 1.4,
      src: 'https://assets.example.test/hero.png',
      alt: 'black and white bed linen',
      box: { x: 0, y: 40, width: w, height: 1168.56 },
      zIndex: opts.photoLevel,
      color: '', fontFamily: '', fontSizePx: 0, fontWeight: 0,
    },
    {
      text: '(generic)',
      textless: true,
      role: 'generic',
      a11yRole: 'generic',
      surfaceFill: '#1d1e20',
      opacity: 0.45,
      box: { x: 0, y: 40, width: w, height: 1157 },
      zIndex: 2,
      color: '', fontFamily: '', fontSizePx: 0, fontWeight: 0,
    },
  ])
}

// ── issue 1 ───────────────────────────────────────────────────────────────────

describe('REQ-370 issue 1 — a photograph captured beneath its backdrop scrim paints beneath it', () => {
  it('test_UAT_FC_REQ-370_the_hero_photo_precedes_its_scrim_in_paint_order_and_is_clipped_to_it', () => {
    const doc = foldToL1(hero({ photoLevel: 0 }))
    const nodes = walk(doc)
    const photo = nodes.find((n) => n.node.kind === 'image')!
    const veil = nodes.find((n) => n.node.kind === 'box' && n.node.axes?.opacity === 0.45)!
    expect(photo && veil, 'both layers are folded').toBeTruthy()
    // Same parent, photo first — so the veil darkens it, as on the page. REQ-382:
    // the photo stands in the clip that crops it, and that clip is the veil's sibling.
    const parentOf = (n: { ancestors: L1Node[] }) => n.ancestors[n.ancestors.length - 1]
    const clip = parentOf(photo)
    expect(clip.kind === 'container' && clip.clip).toBe(true)
    const outer = photo.ancestors[photo.ancestors.length - 2]
    expect(outer).toBe(parentOf(veil))
    const siblings = (outer as { children: L1Node[] }).children
    expect(siblings.indexOf(clip)).toBeLessThan(siblings.indexOf(veil.node))
    // And the headline still paints over both.
    const head = nodes.find((n) => (n.node as { text?: string }).text === 'Hear what matters.')!
    const order = nodes.map((n) => n.node)
    expect(order.indexOf(head.node)).toBeGreaterThan(order.indexOf(veil.node))
    // The 11.56px the photograph overhangs its clipping wrapper is not painted —
    // REQ-382: cut off by the clip at the veil's box, not by shrinking the photo.
    for (const at of LADDER) expect(kfAt(clip, at)!.height).toBe(kfAt(veil.node, at)!.height)
  })

  it('test_UAT_FC_REQ-370_a_photo_captured_above_the_fill_is_left_in_the_content', () => {
    // A photograph the reference stacks OVER the fill really does paint over it.
    const doc = foldToL1(hero({ photoLevel: 5 }))
    const nodes = walk(doc)
    const photo = nodes.find((n) => n.node.kind === 'image')!
    const veil = nodes.find((n) => n.node.kind === 'box' && n.node.axes?.opacity === 0.45)!
    const order = nodes.map((n) => n.node)
    expect(order.indexOf(photo.node)).toBeGreaterThan(order.indexOf(veil.node))
    expect(kfAt(photo.node, 1280)!.height, 'and keeps its own box').toBe(1168.56)
  })
})

// ── issue 4 ───────────────────────────────────────────────────────────────────

describe('REQ-370 issue 4 — a run that is its own surface sits where its lines are', () => {
  const button = (w: number): ValueElement =>
    text('SCHEDULE AN APPOINTMENT', { x: w / 2 - 168, y: 1076.61, width: 335.98, height: 52 }, {
      role: 'link',
      fontFamily: 'Montserrat',
      fontSizePx: 18,
      fontWeight: 500,
      lineHeightPx: 24.3,
      textAlign: 'center',
      renderedTextBox: { x: w / 2 - 140, y: 1091.45, width: 279.33, height: 22 },
      surfaceFill: '#f07219',
      borderRadiusPx: 24,
      border: { widthPx: 3, color: '#f07219', style: 'solid' },
      surface: {
        self: true,
        box: { x: w / 2 - 168, y: 1076.61, width: 335.98, height: 52 },
        borderRadiusPx: 24,
        boxShadow: null,
        border: { widthPx: 3, color: '#f07219', style: 'solid' },
      },
    })

  it('test_UAT_FC_REQ-370_a_button_label_is_vertically_centred_on_its_glyphs_not_pinned_at_the_border_box_top', () => {
    const doc = foldToL1(multiFrom((w) => [button(w)]))
    const label = walk(doc).find((n) => (n.node as { text?: string }).text === 'SCHEDULE AN APPOINTMENT')!
    // The line box is centred on the glyphs: 1091.45 + 22/2 − 24.3/2 = 1090.3 on
    // the page, wherever the fold nests the run.
    const parentY = label.ancestors.reduce((y, a) => y + (kfAt(a, 1280)?.y ?? 0), 0)
    const border = label.ancestors.reduce(
      (b, a) => b + (((a as { axes?: { border?: { widthPx: number } } }).axes?.border?.widthPx ?? 0) as number),
      0,
    )
    expect(parentY + border + kfAt(label.node, 1280)!.y).toBeCloseTo(1090.3, 1)
  })

  it('test_UAT_FC_REQ-370_a_run_whose_box_is_its_line_box_is_unchanged', () => {
    const doc = foldToL1(
      multiFrom((w) => [
        text('Plain heading', { x: 28, y: 300, width: 400, height: 62.4 }, {
          renderedTextBox: { x: 28, y: 298, width: 380, height: 65 },
          surface: { self: true, box: { x: 28, y: 300, width: 400, height: 62.4 }, borderRadiusPx: 0, boxShadow: null, border: null },
        }),
        text('Anchor', { x: 28, y: 900, width: w - 56, height: 20 }, { fontSizePx: 16, lineHeightPx: 20 }),
      ]),
    )
    const run = walk(doc).find((n) => (n.node as { text?: string }).text === 'Plain heading')!
    expect(kfAt(run.node, 1280)!.y).toBe(300)
  })
})

// ── issue 3 (L1 + renderer + fold) ────────────────────────────────────────────

const docWith = (node: L1Node): L1Document => ({ widths: [320, 1280], root: { kind: 'box', children: [node] } })

describe('REQ-370 issue 3 — L1 can say a run keeps spaces that take width', () => {
  it('test_UAT_FC_REQ-370_the_envelope_accepts_the_two_preserving_values_and_nothing_else', () => {
    const ok = validateL1(docWith({ kind: 'text', text: 'Where To Find Us ', axes: { whiteSpace: 'break-spaces' } }))
    expect(ok.ok).toBe(true)
    expect(validateL1(docWith({ kind: 'text', text: 'x', axes: { whiteSpace: 'pre-wrap' } })).ok).toBe(true)
    const bad = validateL1(docWith({ kind: 'text', text: 'x', axes: { whiteSpace: 'nowrap' } } as unknown as L1Node))
    expect(bad.ok, 'a raw white-space value is not an L1 value').toBe(false)
  })

  it('test_UAT_FC_REQ-370_the_renderer_emits_it_and_pins_only_the_wrap_mode_beside_nowrapFromPx', () => {
    const { css, html } = renderL1Document(
      docWith({ kind: 'text', text: 'Where To Find Us ', axes: { whiteSpace: 'break-spaces', nowrapFromPx: 768 } }),
    )
    expect(css).toContain('white-space: break-spaces')
    expect(css, '`white-space: nowrap` would collapse the kept space').not.toContain('white-space: nowrap')
    expect(css).toContain('text-wrap-mode: nowrap')
    expect(html).toContain('Where To Find Us </')
    // A run without the axis renders exactly as before.
    const plain = renderL1Document(docWith({ kind: 'text', text: 'x', axes: { nowrapFromPx: 768 } })).css
    expect(plain).toContain('white-space: nowrap')
    expect(plain).not.toContain('text-wrap-mode')
  })

  it('test_UAT_FC_REQ-370_the_fold_carries_the_captured_value_and_the_kept_space_onto_the_run', () => {
    const doc = foldToL1(
      multiFrom(() => [
        text('Where To Find Us ', { x: 426, y: 4380, width: 429, height: 62.4 }, { whiteSpace: 'break-spaces', textAlign: 'center' }),
        text('Hours', { x: 40, y: 4900, width: 80, height: 20 }, { fontSizePx: 16, lineHeightPx: 20, whiteSpace: null }),
      ]),
    )
    const nodes = walk(doc).map((n) => n.node) as Array<L1Node & { text?: unknown; axes?: { whiteSpace?: string } }>
    const kept = nodes.find((n) => n.text === 'Where To Find Us ')!
    expect(kept, 'the edge space survives the fold').toBeTruthy()
    expect(kept.axes?.whiteSpace).toBe('break-spaces')
    expect(nodes.find((n) => n.text === 'Hours')!.axes?.whiteSpace).toBeUndefined()
  })
})

// ── capture cases (real EXTRACT_SCRIPT under jsdom) ───────────────────────────

type Rect = { x: number; y: number; w: number; h: number }
const domRect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

function page(bodyHtml: string, boxes: Record<string, Rect>, url = 'https://www.example.test/') {
  const dom = new JSDOM(`<!doctype html><html><body style="margin:0">${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url,
  })
  const fallback: Rect = { x: 0, y: 0, w: 1280, h: 400 }
  dom.window.Element.prototype.getBoundingClientRect = function (this: Element) {
    const b = boxes[this.id] ?? fallback
    return domRect(b.x, b.y, b.w, b.h)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  return dom
}
const run = (dom: JSDOM, script: string): unknown => (dom.window as unknown as { eval(s: string): unknown }).eval(script)
const extract = (bodyHtml: string, boxes: Record<string, Rect>): RawSignals =>
  run(page(bodyHtml, boxes), EXTRACT_SCRIPT) as RawSignals
const runsOf = (s: RawSignals): RawRun[] => s.bands.flatMap((b) => [...b.content, ...b.items.flat()])
const fieldsOf = (s: RawSignals) => s.bands.flatMap((b) => b.fields)

describe('REQ-370 issue 3 — the capture keeps a space that takes width', () => {
  const signals = extract(
    `<section id="s" style="background-color:#d6d6d6">
       <h3 id="h" style="white-space:break-spaces;color:#1d1e20">Where To Find Us </h3>
       <p id="p" style="color:#1d1e20">  Ordinary copy  </p>
     </section>`,
    { s: { x: 0, y: 0, w: 1280, h: 600 }, h: { x: 426, y: 40, w: 429, h: 62 }, p: { x: 40, y: 200, w: 600, h: 24 } },
  )

  it('test_UAT_FC_REQ-370_a_break_spaces_run_keeps_its_trailing_space_and_records_the_value', () => {
    const h = runsOf(signals).find((r) => r.text.startsWith('Where'))!
    expect(h.text).toBe('Where To Find Us ')
    expect(h.whiteSpace).toBe('break-spaces')
  })

  it('test_UAT_FC_REQ-370_a_collapsing_run_is_trimmed_and_records_null', () => {
    const p = runsOf(signals).find((r) => r.text.includes('Ordinary'))!
    expect(p.text).toBe('Ordinary copy')
    expect(p.whiteSpace).toBeNull()
  })

  it('test_UAT_FC_REQ-370_white_space_is_a_recorded_capture_property', () => {
    expect(CAPTURE_COVERAGE.get('white-space')?.verdict).toBe('recorded')
    expect(CAPTURE_COVERAGE.get('white-space-collapse')?.verdict).toBe('recorded')
  })
})

describe('REQ-370 issue 2 — an SVG that is only a filled rectangle is a painted field', () => {
  const signals = extract(
    `<section id="s" style="background-color:#d6d6d6">
       <div id="panel"><svg id="rect" preserveAspectRatio="none" viewBox="0 0 80 80"><path style="fill:rgb(34, 78, 122)" d="M0 0H80V80H0V0Z"></path></svg></div>
       <svg id="icon" viewBox="0 0 24 24"><path style="fill:rgb(0, 0, 0)" d="M12 2L2 22h20z"></path></svg>
       <p id="p" style="color:#ffffff">So glad I chose the Hearing Zone.</p>
     </section>`,
    {
      // The Customer Reviews band, rebased to the top of the fixture's page.
      s: { x: 0, y: 0, w: 1280, h: 572 },
      panel: { x: 618, y: 171, w: 606, h: 296 },
      rect: { x: 618, y: 171, w: 606, h: 296 },
      icon: { x: 40, y: 12, w: 24, h: 24 },
      p: { x: 677, y: 233, w: 555, h: 96 },
    },
  )

  it('test_UAT_FC_REQ-370_the_rectangle_panel_is_recorded_with_its_box_and_fill', () => {
    const panel = fieldsOf(signals).find((f) => f.box && Math.abs(f.box.width - 606) < 1)
    expect(panel, 'a record 606px wide exists').toBeTruthy()
    expect(panel!.surfaceFill).toBe('#224e7a')
    expect(panel!.box).toMatchObject({ x: 618, y: 171, height: 296 })
  })

  it('test_UAT_FC_REQ-370_an_icon_svg_is_still_not_recorded', () => {
    expect(fieldsOf(signals).some((f) => f.box && f.box.width === 24)).toBe(false)
  })
})

describe('REQ-370 issue 5 — tel: and mailto: link targets are recorded', () => {
  const signals = extract(
    `<section id="s" style="background-color:#ffffff">
       <a id="t" href="tel:5108658113">SCHEDULE AN APPOINTMENT</a>
       <a id="m" href="mailto:info@hearingzone510.com">info@hearingzone510.com</a>
       <a id="j" href="javascript:alert(1)">bad</a>
       <a id="i" href="/about">About</a>
     </section>`,
    {
      s: { x: 0, y: 0, w: 1280, h: 400 },
      t: { x: 40, y: 20, w: 300, h: 50 },
      m: { x: 40, y: 100, w: 300, h: 24 },
      j: { x: 40, y: 160, w: 60, h: 24 },
      i: { x: 40, y: 220, w: 60, h: 24 },
    },
  )
  const hrefOf = (t: string) => runsOf(signals).find((r) => r.text === t)?.href

  it('test_UAT_FC_REQ-370_a_tel_and_a_mailto_href_are_recorded_as_written', () => {
    expect(hrefOf('SCHEDULE AN APPOINTMENT')).toBe('tel:5108658113')
    expect(hrefOf('info@hearingzone510.com')).toBe('mailto:info@hearingzone510.com')
  })

  it('test_UAT_FC_REQ-370_every_other_non_web_scheme_is_still_refused', () => {
    expect(hrefOf('bad')).toBeNull()
    expect(hrefOf('About')).toBe('/about')
  })

  it('test_UAT_FC_REQ-370_a_recorded_tel_href_folds_to_a_working_link', () => {
    const doc = foldToL1(
      multiFrom(() => [
        text('510-865-8113', { x: 1046, y: 62, width: 190, height: 56 }, { role: 'link', a11yRole: 'link', href: 'tel:510-865-8113' }),
      ]),
    )
    const node = walk(doc).find((n) => (n.node as { text?: string }).text === '510-865-8113')!.node as { link?: { href: string } }
    expect(node.link?.href).toBe('tel:510-865-8113')
  })
})

describe('REQ-370 issue 6 — an image parked in a scroll-reveal pre-state is landed before measuring', () => {
  const html = `
    <style>
      .transition--root-hidden [data-animation-role=image]{opacity:0;transform:translateY(20%)}
      .faded{opacity:0}
    </style>
    <div class="transition transition--root-hidden"><div id="zyro" data-animation-role="image"><img id="a" src="https://x.test/oakland.png"></div></div>
    <div class="slick-slider"><div id="slide" style="opacity:0;transform:translateX(100%)"><img id="b" src="https://x.test/slide.png"></div></div>
    <div id="fade" class="faded"><img id="c" src="https://x.test/fade.png"></div>`
  const boxes = { a: { x: 40, y: 1080, w: 328, h: 438 }, b: { x: 40, y: 100, w: 300, h: 200 }, c: { x: 40, y: 400, w: 300, h: 200 } }
  const dom = page(html, boxes)
  for (const img of Array.from(dom.window.document.images)) {
    Object.defineProperty(img, 'complete', { get: () => true })
    Object.defineProperty(img, 'naturalWidth', { get: () => 328 })
  }
  const landed = run(dom, REVEAL_MEDIA) as number
  const opacity = (id: string) => dom.window.getComputedStyle(dom.window.document.getElementById(id)!).opacity

  it('test_UAT_FC_REQ-370_a_transparent_displaced_reveal_wrapper_is_landed_and_marked', () => {
    expect(landed).toBe(1)
    expect(opacity('zyro')).toBe('1')
    expect(dom.window.document.getElementById('zyro')!.hasAttribute('data-1c-revealed')).toBe(true)
  })

  it('test_UAT_FC_REQ-370_a_carousel_slide_and_a_plain_fade_are_left_alone', () => {
    expect(opacity('slide')).toBe('0')
    expect(opacity('fade')).toBe('0')
  })
})

describe('REQ-370 — a bundle taken before schema 15 says it is owed a re-capture', () => {
  const bundle = (schema: number): Capture =>
    ({
      url: 'https://www.hearingzone510.com/',
      captureSchema: schema,
      sections: [
        {
          content: [{ text: 'Where To Find Us', role: 'heading', color: '#000000', fontFamily: 'Prata', fontSizePx: 48, fontWeight: 400 }],
          items: [],
          fields: [],
        },
      ],
    }) as unknown as Capture

  it('test_UAT_FC_REQ-370_a_schema_14_bundle_names_the_white_space_axis_as_missing', () => {
    // BUG-187 moved the schema past 15; a 15 bundle still carries the white-space axis.
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(15)
    expect(staleCaptureAxes(bundle(14)).map((a) => a.axis).join(' | ')).toMatch(/whiteSpace/)
    expect(staleCaptureAxes(bundle(15)).map((a) => a.axis).join(' | ')).not.toMatch(/whiteSpace/)
  })
})
