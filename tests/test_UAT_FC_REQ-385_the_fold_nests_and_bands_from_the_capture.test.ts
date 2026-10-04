/**
 * REQ-385 — two places the fold wrote the wrong tree, both read off the
 * joyfulculinarycreations.com reproduction (round 9).
 *
 *  1. **Content nested under a surface absent where the content is present.**
 *     A band reconstructed from two off-screen carousel slides exists at 768+
 *     only (`visibility: {fromPx: 768}`). `nestBackingSurfaces` gave it the
 *     testimonial card visible at every width, because its containment test
 *     skipped every width where the PARENT was absent. The child inherits the
 *     parent's gate, so the whole testimonial section was `display: none` on
 *     phones.
 *  2. **Band membership decided from run geometry over the captured surface.**
 *     A centred footer stack's runs each record a band-wide `surface.box`, but
 *     no run is >= 0.7 of the page and the nav row has no dominant central gap,
 *     so neither band rule fired and every run became a run-sized `#edc251`
 *     plate.
 *
 * Entry point: `foldToL1` over a synthetic multi-viewport capture, then
 * `renderL1Document` for what the browser is served. Nothing is mocked.
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440] as const
const HEIGHT = 800

function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  const el = {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 26,
    ...over,
  } as ValueElement
  const b = el.box
  return b ? ({ ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 21 } } as ValueElement) : el
}

type Section = { box: { x: number; y: number; width: number; height: number }; surfaceFill?: string | null }

function multi(pageAt: (width: number) => { elements: ValueElement[]; sections: Section[] }): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => {
    const { elements, sections } = pageAt(width)
    return {
      engine: 'chromium',
      viewport: { width, height: HEIGHT },
      state: 'rest',
      manifest: {
        source: `t:${width}x${HEIGHT}`,
        elements,
        sections: sections.map((s, index) => ({ index, overlay: null, contentAnchorRatio: null, ...s })) as never,
        viewport: { width, height: HEIGHT },
        bodyBackground: '#ffffff',
      },
    }
  })
  return { url: 'http://fixture.test/', notes: [], projections }
}

const kidsOf = (n: L1Node): readonly L1Node[] =>
  n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []

/** Every node with the chain of ancestors above it. */
function withAncestors(doc: L1Document): Array<{ node: L1Node; ancestors: L1Node[] }> {
  const out: Array<{ node: L1Node; ancestors: L1Node[] }> = []
  const walk = (n: L1Node, ancestors: L1Node[]): void => {
    out.push({ node: n, ancestors })
    for (const k of kidsOf(n)) walk(k, [...ancestors, n])
  }
  walk(doc.root, [])
  return out
}

const textOf = (n: L1Node): string | undefined =>
  n.kind === 'text' ? (n as unknown as { text?: string }).text : undefined

/** Whether `node` is gated out of the document at `width` by its own or an ancestor's visibility. */
function hiddenAt(node: L1Node, ancestors: readonly L1Node[], width: number): boolean {
  return [...ancestors, node].some((n) => {
    const v = (n as unknown as { visibility?: { fromPx?: number; toPx?: number } }).visibility
    if (!v) return false
    return (v.fromPx !== undefined && width < v.fromPx) || (v.toPx !== undefined && width > v.toPx)
  })
}

describe('REQ-385 — the fold nests and bands from the capture', () => {
  // ── 1. a surface never owns content it does not exist beside ────────────────

  /**
   * A white page whose testimonial section holds two full-width slides on a
   * green band at 768+ only (the off-screen carousel the band is built from),
   * and a heading plus a quote that are on the page at every width — inside the
   * band's rect wherever the band exists.
   */
  function gatedBandPage(): MultiStateCapture {
    const GREEN = '#28542d'
    return multi((width) => {
      const wide = width >= 768
      const top = wide ? 1000 : 1400
      const elements: ValueElement[] = [
        run({ text: 'A full-bleed intro line', box: { x: 0, y: 100, width, height: 26 } }),
      ]
      if (wide) {
        elements.push(
          run({
            text: 'So fabulous. We are planning another',
            surfaceFill: GREEN,
            box: { x: 0, y: top + 20, width, height: 26 },
          }),
          run({
            text: 'I cannot say enough good things',
            surfaceFill: GREEN,
            box: { x: 0, y: top + 260, width, height: 26 },
          }),
        )
      }
      elements.push(
        run({ text: 'What people are saying', box: { x: 20, y: top + 80, width: Math.min(400, width - 40), height: 26 } }),
        run({ text: 'Dan H.', box: { x: 20, y: top + 160, width: 80, height: 18 } }),
      )
      return {
        elements,
        sections: [
          { box: { x: 0, y: 0, width, height: top }, surfaceFill: '#ffffff' },
          { box: { x: 0, y: top, width, height: 300 }, surfaceFill: wide ? GREEN : '#ffffff' },
        ],
      }
    })
  }

  it('test_UAT_FC_REQ-385_content_present_at_a_width_is_never_nested_under_a_surface_absent_there', () => {
    const doc = foldToL1(gatedBandPage())
    const nodes = withAncestors(doc)

    // The precondition the defect needs: a surface gated to the wide widths exists.
    const gated = nodes.filter(({ node }) => {
      const v = (node as unknown as { visibility?: { fromPx?: number } }).visibility
      return v?.fromPx !== undefined && v.fromPx > 375
    })
    expect(gated.length, 'the slides still make a band that exists at 768+ only').toBeGreaterThan(0)

    for (const text of ['What people are saying', 'Dan H.']) {
      const hit = nodes.find(({ node }) => textOf(node) === text)
      expect(hit, `${text} is folded`).toBeTruthy()
      for (const width of [320, 375]) {
        expect(hiddenAt(hit!.node, hit!.ancestors, width), `${text} is not gated out at ${width}`).toBe(false)
      }
    }
  })

  it('test_UAT_FC_REQ-385_the_served_page_does_not_hide_always_present_content_on_phones', () => {
    const doc = foldToL1(gatedBandPage())
    const { css, html } = renderL1Document(doc) as unknown as { css: string; html: string }
    // The renderer gates by class; the document names nodes by id. Join them on
    // the served markup, which carries both.
    const classOf = new Map<string, string[]>()
    for (const tag of html.matchAll(/<\w+\b[^>]*>/g)) {
      const id = /\bid="([^"]+)"/.exec(tag[0])?.[1]
      const cls = /\bclass="([^"]+)"/.exec(tag[0])?.[1]
      if (id && cls) classOf.set(id, cls.split(/\s+/))
    }
    const hiddenNarrow = new Set<string>()
    for (const block of css.matchAll(/@media \(max-width: 767px\) \{([\s\S]*?)\n\}/g)) {
      for (const rule of block[1].matchAll(/\.([\w-]+) \{ display: none \}/g)) hiddenNarrow.add(rule[1])
    }
    expect(hiddenNarrow.size, 'the wide-only band is still gated on the served page').toBeGreaterThan(0)

    const heading = withAncestors(doc).find(({ node }) => textOf(node) === 'What people are saying')!
    const chain = heading.ancestors.map((n) => n.id).filter((id): id is string => Boolean(id))
    for (const id of chain) {
      for (const cls of classOf.get(id) ?? []) {
        expect(hiddenNarrow.has(cls), `#${id} (.${cls}) is not display:none below 768`).toBe(false)
      }
    }
  })

  // ── 2. a captured band-wide surface decides band membership ─────────────────

  const YELLOW = '#edc251'

  /** A centred footer stack on a yellow band, every run recording the band as its surface. */
  function centredFooterPage(): MultiStateCapture {
    return multi((width) => {
      const footY = 2000
      const band = { x: 0, y: footY, width, height: 300 }
      const onBand = (text: string, x: number, y: number, w: number, over: Partial<ValueElement> = {}): ValueElement =>
        run({
          text,
          surfaceFill: YELLOW,
          box: { x, y, width: w, height: 26 },
          surface: { self: false, box: band } as never,
          ...over,
        })
      const cx = width / 2
      const follow = Math.min(width - 40, Math.round(width * 0.58)) // 748 at 1280 — under 0.7
      const links = ['Home', 'Meet the Chef', 'Our Services']
      const linkW = Math.min(100, (width - 40) / links.length - 10)
      return {
        elements: [
          // Full-bleed copy elsewhere, so the page's content width is the page's.
          run({ text: 'A full-bleed intro line', box: { x: 0, y: 100, width, height: 26 } }),
          onBand('Follow us for our latest updates', cx - follow / 2, footY + 60, follow),
          ...links.map((t, i) =>
            onBand(t, cx - (links.length * (linkW + 10)) / 2 + i * (linkW + 10), footY + 220, linkW),
          ),
          // Social rings: the border is the run's own; the colour is the band's.
          // The second has the shape the reference records — an accent rule on a
          // wrapper measured as `accentBox`.
          onBand('\uf09a', cx - 50, footY + 120, 42, { border: { widthPx: 3, color: '#ffffff' } } as Partial<ValueElement>),
          onBand('\uf16d', cx + 8, footY + 120, 42, {
            borderLeft: { widthPx: 3, color: '#ffffff' },
            accentBox: { x: cx + 8, y: footY + 120, width: 42, height: 42 },
          } as Partial<ValueElement>),
        ],
        sections: [
          { box: { x: 0, y: 0, width, height: footY }, surfaceFill: '#ffffff' },
          { box: band, surfaceFill: YELLOW },
        ],
      }
    })
  }

  it('test_UAT_FC_REQ-385_runs_whose_captured_surface_is_the_band_paint_no_plates_of_their_own', () => {
    const doc = foldToL1(centredFooterPage())
    const yellow = withAncestors(doc)
      .map(({ node }) => node)
      .filter((n) => (n as unknown as { axes?: { surfaceFill?: string } }).axes?.surfaceFill?.toLowerCase() === YELLOW)
    expect(yellow.length, 'the footer band itself is painted').toBeGreaterThan(0)
    for (const n of yellow) {
      const kfs = (n as unknown as { geometry?: { keyframes: Array<{ at: number; width?: number }> } }).geometry
        ?.keyframes ?? []
      for (const kf of kfs) {
        expect(kf.width, `${n.id} at ${kf.at} is full-bleed, not a run-sized plate`).toBe(kf.at)
      }
    }
  })

  it('test_UAT_FC_REQ-385_a_treatment_the_run_bears_itself_keeps_a_card_without_the_bands_colour', () => {
    const doc = foldToL1(centredFooterPage())
    const nodes = withAncestors(doc).map(({ node }) => node)
    const axesOf = (n: L1Node) => (n as unknown as { axes?: { border?: unknown; borderLeft?: unknown; surfaceFill?: string } }).axes ?? {}
    const bordered = nodes.filter((n) => axesOf(n).border !== undefined)
    const accented = nodes.filter((n) => axesOf(n).borderLeft !== undefined)
    expect(bordered.length, 'the ring keeps the border it owns').toBe(1)
    expect(accented.length, 'and the accent-rule ring keeps its rule').toBe(1)
    for (const n of [...bordered, ...accented]) {
      expect(axesOf(n).surfaceFill, `${n.id} does not repaint the band colour as its own`).toBeUndefined()
    }
  })
})
