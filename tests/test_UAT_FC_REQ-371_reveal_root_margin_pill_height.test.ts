/**
 * REQ-371 — four residuals on bluelotusintegralhealing.com, a Zyro page.
 *
 * - **issue 1** (capture) — the reveal settle lands ANY content parked in a
 *   scroll-reveal pre-state (transparent + displaced), not only images, so a
 *   Zyro text/form/footer wrapper the observer never activated is captured.
 * - **issue 2** (renderer) — a flowing box holding pinned children is its own
 *   block formatting context, so its first in-flow child's top margin no longer
 *   collapses out and moves every pinned surface down by that margin.
 * - **issue 3** (fold) — a self-painting run (pill) whose box is taller than its
 *   lines carries the difference as padding, so it keeps its box height.
 * - **issue 4** (fold + values-diff) — a backdrop's captured `zIndex` is not a
 *   dropped axis (its layer is the fold's decision), and a `clip-path: inset(0)`
 *   clips nothing, so it is not a mask edge.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import { chromiumAvailable } from '../tools/generate/src/cli/capture'
import { paintsMaskEdge } from '../tools/generate/src/cli/capture/mask-geometry'
import { REVEAL_MEDIA } from '../tools/generate/src/cli'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

// ── issue 1 — capture (the real page script under jsdom) ──────────────────────

describe('REQ-371 issue 1 — any content parked in a scroll-reveal pre-state is landed', () => {
  const html = `
    <style>
      .transition.transition--slide:not(.transition--root-hidden){opacity:0;transform:translateY(20%)}
      .transition.transition--slide:not(.transition--root-hidden)[data-animation-state=active]{opacity:1;transform:translate(0%)}
      .menu{opacity:0;transform:translateY(-8px);visibility:hidden}
    </style>
    <div id="active" class="transition transition--slide" data-animation-state="active"><h2>About Me</h2></div>
    <div id="heading" class="transition transition--slide"><h2>Get in Touch</h2></div>
    <div id="form" class="transition transition--slide"><form><input id="email" type="email"></form></div>
    <div id="empty" class="transition transition--slide"></div>
    <div class="slick-slider"><div id="slide" style="opacity:0;transform:translateX(100%)">Slide two</div></div>
    <ul id="menu" class="menu"><li>Services</li></ul>`
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, { runScripts: 'dangerously', pretendToBeVisual: true })
  // jsdom lays nothing out; give every element the box a browser would report.
  dom.window.Element.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, width: 1280, height: 120, left: 0, top: 0, right: 1280, bottom: 120, toJSON() {} } as DOMRect
  }
  const landed = (dom.window as unknown as { eval(s: string): unknown }).eval(REVEAL_MEDIA) as number
  const opacity = (id: string) => dom.window.getComputedStyle(dom.window.document.getElementById(id)!).opacity
  const marked = (id: string) => dom.window.document.getElementById(id)!.hasAttribute('data-1c-revealed')

  it('test_UAT_FC_REQ-371_an_unactivated_text_wrapper_and_a_form_wrapper_are_landed_and_marked', () => {
    expect(opacity('heading')).toBe('1')
    expect(opacity('form')).toBe('1')
    expect(marked('heading') && marked('form')).toBe(true)
    expect(landed, 'the landed count is what the settle forced').toBe(2)
  })

  it('test_UAT_FC_REQ-371_an_empty_wrapper_a_carousel_slide_and_a_closed_menu_are_left_alone', () => {
    expect(opacity('empty')).toBe('0')
    expect(opacity('slide')).toBe('0')
    expect(opacity('menu')).toBe('0')
    expect(marked('active'), 'an already-revealed wrapper is untouched').toBe(false)
  })
})

// ── issue 2 — renderer ────────────────────────────────────────────────────────

const itBrowser = it.runIf(await chromiumAvailable())

const pinnedAndFlow: L1Document = {
  widths: [320, 1280],
  root: {
    kind: 'box',
    children: [
      {
        kind: 'box',
        id: 'backdrop',
        axes: { surfaceFill: '#249ed3' },
        geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 1280, height: 84 }] },
      },
      {
        kind: 'box',
        id: 'hero',
        axes: { surfaceFill: '#30499c' },
        geometry: { place: 'flow', keyframes: [{ at: 320, x: 0, y: 84, width: 1280, height: 400 }] },
      },
    ],
  } as L1Node,
}

describe('REQ-371 issue 2 — the root does not let its first section margin collapse out', () => {
  it('test_UAT_FC_REQ-371_a_flowing_box_holding_pinned_children_is_its_own_formatting_context', () => {
    const { css } = renderL1Document(pinnedAndFlow)
    expect(css).toMatch(/\.l1-0\s*\{[^}]*display: flow-root/)
    const flowOnly = renderL1Document({
      widths: [320, 1280],
      root: { kind: 'box', children: [{ kind: 'text', text: 'Copy' }] } as L1Node,
    }).css
    expect(flowOnly, 'a box with nothing pinned in it keeps plain block layout').not.toContain('flow-root')
  })

  itBrowser(
    'test_UAT_FC_REQ-371_a_pinned_surface_paints_where_l1_puts_it_beside_a_margined_flow_child',
    async () => {
      const { chromium } = await import('playwright')
      const browser = await chromium.launch({ args: ['--single-process'] })
      try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
        const { html, css } = renderL1Document(pinnedAndFlow)
        await page.setContent(`<!doctype html><html><head><style>body{margin:0}${css}</style></head><body>${html}</body></html>`)
        const y = await page.evaluate(() => ({
          root: document.querySelector('.l1-0')!.getBoundingClientRect().y,
          backdrop: document.getElementById('backdrop')!.getBoundingClientRect().y,
          hero: document.getElementById('hero')!.getBoundingClientRect().y,
        }))
        expect(y).toEqual({ root: 0, backdrop: 0, hero: 84 })
      } finally {
        await browser.close()
      }
    },
    60_000,
  )
})

// ── issue 3 / 4 — fold fixtures ───────────────────────────────────────────────

const LADDER = [768, 1280]

function multiFrom(elementsAt: (w: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `req371:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

const run = (t: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement => ({
  text: t,
  role: 'link',
  color: '#ffffff',
  fontFamily: 'Lato',
  fontSizePx: 16,
  fontWeight: 500,
  box,
  renderedTextBox: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : undefined,
  ...over,
})

const band = (y: number, h: number, over: Partial<ValueElement> = {}): ValueElement => ({
  text: '',
  role: 'generic',
  textless: true,
  box: { x: 0, y, width: 1280, height: h },
  surfaceFill: '#249ed3',
  ...over,
})

type Walked = { node: L1Node }
const walk = (doc: L1Document): Walked[] => {
  const out: Walked[] = []
  const visit = (n: L1Node): void => {
    out.push({ node: n })
    for (const c of (n as { children?: L1Node[] }).children ?? []) visit(c)
  }
  visit(doc.root)
  return out
}

describe('REQ-371 issue 3 — a min-height pill keeps its height', () => {
  // Zyro's `.grid-button--primary`: min-height 56, flex-centred, no padding, 1px border.
  const pill = (): ValueElement =>
    run('1. About BQH', { x: 233.98, y: 654, width: 193.88, height: 56 }, {
      renderedTextBox: { x: 282.09, y: 672.5, width: 97.66, height: 19 },
      paddingTopPx: 0,
      paddingBottomPx: 0,
      surfaceFill: '#30499c',
      borderRadiusPx: 28,
      border: { widthPx: 1, color: '#ffffff', style: 'solid' },
      href: '/what-is-bqh',
    })

  it('test_UAT_FC_REQ-371_the_inset_around_the_lines_is_carried_as_padding_summing_to_the_box', () => {
    const doc = foldToL1(multiFrom(() => [pill(), run('Anchor', { x: 28, y: 900, width: 80, height: 20 }, { lineHeightPx: 20 })]))
    const node = walk(doc).find((n) => (n.node as { text?: unknown }).text === '1. About BQH')!.node as L1Node & {
      padding?: { topPx?: number; bottomPx?: number }
      geometry?: { keyframes: Array<{ at: number; y: number }> }
    }
    // 1 border + 17.5 + 19 line + 17.5 + 1 border = 56. REQ-383 (issue 4) — kept at
    // the fold's hundredth precision rather than rounded 18/17, which set the
    // glyphs half a pixel low.
    expect(node.padding).toEqual({ topPx: 17.5, bottomPx: 17.5 })
    expect(node.geometry!.keyframes.find((k) => k.at === 1280)!.y, 'pinned at its border box, not its lines').toBeCloseTo(654, 0)
  })

  it('test_UAT_FC_REQ-371_a_pill_whose_own_padding_already_fills_its_box_is_unchanged', () => {
    const doc = foldToL1(
      multiFrom(() => [
        run('Book now', { x: 40, y: 300, width: 160, height: 44 }, {
          renderedTextBox: { x: 60, y: 312.5, width: 120, height: 19 },
          lineHeightPx: 20,
          paddingTopPx: 12,
          paddingBottomPx: 12,
          surfaceFill: '#30499c',
          borderRadiusPx: 22,
        }),
        run('Anchor', { x: 28, y: 900, width: 80, height: 20 }, { lineHeightPx: 20 }),
      ]),
    )
    const node = walk(doc).find((n) => (n.node as { text?: unknown }).text === 'Book now')!.node as { padding?: unknown }
    expect(node.padding).toEqual({ topPx: 12, bottomPx: 12 })
  })
})

describe('REQ-371 issue 4 — a backdrop level and a no-op clip are not dropped axes', () => {
  it('test_UAT_FC_REQ-371_a_z_indexed_inset_zero_band_folds_with_no_residual', () => {
    const residuals: Array<{ capturedAxes: string[] }> = []
    foldToL1(
      multiFrom(() => [
        band(0, 84, { surfaceFill: '#ffffff', zIndex: 13 }),
        band(966, 513, { zIndex: 13, maskEdge: 'inset(0px)' }),
        run('About Me', { x: 40, y: 1000, width: 200, height: 40 }, { role: 'heading', lineHeightPx: 40 }),
      ]),
      { residuals },
    )
    expect(residuals).toEqual([])
  })

  it('test_UAT_FC_REQ-371_an_inset_zero_clip_is_no_mask_edge_but_a_rounded_or_feathered_one_is', () => {
    expect(paintsMaskEdge('inset(0px)')).toBe(false)
    expect(paintsMaskEdge('inset(0px 0px 0px 0px)')).toBe(false)
    expect(paintsMaskEdge('inset(0px round 8px)')).toBe(true)
    expect(paintsMaskEdge('inset(10px)')).toBe(true)
    expect(paintsMaskEdge('radial-gradient(black 60%, transparent 100%)')).toBe(true)
    expect(paintsMaskEdge(null)).toBe(false)
  })
})
