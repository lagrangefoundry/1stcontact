/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document with advisory structural hints", the **responsive-model**
 * acceptance criteria: what the fold fits from the ladder's evidence rather than
 * pinning to its widest sample.
 *
 *   AC-767  a numeric type axis / padding side that VARIES across the ladder folds
 *           to a per-width track; one that is invariant stays a plain scalar, and
 *           an axis reported at fewer than two widths cannot be shown to vary
 *   AC-768  a text leaf's width is ceiled to its own measured glyph extent (never
 *           narrower than the glyphs it must hold); box and image leaves, which
 *           carry no reflow constraint, round to nearest
 *   AC-769  a run is unbreakable from the smallest sampled width whose ENTIRE
 *           wider suffix the reference set on one line — never from a single width
 *   AC-770  a viewport-height response is read only from the capture's height
 *           probe, as a band height factor with the matching y factor below it;
 *           with no probe, nothing is emitted and the probe adds no keyframe
 *   AC-771  the centred column is recovered from the MODAL content edge and
 *           emitted only if it reproduces every sampled origin and extent
 *   AC-772  `x` and `width` anchor to that column INDEPENDENTLY, with a capped
 *           width term for a nested maximum (over-determined only), a bounded
 *           column fraction, a keyframed in-column offset across a layout-mode
 *           change, and no anchor at all for a full-bleed band
 *
 * Every probe is deterministic — fold, envelope validator, CSS emitter and the
 * analytic layout evaluator. No browser is required.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Column } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { evaluateLayout, foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** The ladder's viewport heights — deliberately varying, as the real capture's are. */
const LADDER_H: Record<number, number> = { 320: 800, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }

/** The authored `max-w-6xl mx-auto px-6` + nested `max-w-4xl` rule, as CSS computes it. */
const REF_CONTAINER = 1152
const REF_INSET = 24
const REF_MAX = 896
const refOrigin = (w: number): number => Math.max(0, (w - REF_CONTAINER) / 2) + REF_INSET
const refExtent = (w: number): number => Math.min(REF_MAX, Math.min(REF_CONTAINER, w) - 2 * REF_INSET)

/** A text run at one width, spanning the fields the fold reads. */
function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
}

/** A run the reference set on exactly `n` lines (what `renderedTextBox` reports). */
function lines(el: ValueElement, n: number): ValueElement {
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 29 * n - 8 } }
}

/** A text-free element (media / painted surface) at one width. */
function textless(over: Partial<ValueElement>): ValueElement {
  return {
    text: '',
    role: 'img',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    ...over,
  } as ValueElement
}

interface ProjSpec {
  width: number
  height: number
  elements: ValueElement[]
  sections?: Array<{ box: { x: number; y: number; width: number; height: number } }>
}

function multi(specs: ProjSpec[]): MultiStateCapture {
  const projections: StateProjection[] = specs.map((s) => ({
    engine: 'chromium',
    viewport: { width: s.width, height: s.height },
    state: 'rest',
    manifest: {
      source: `t:${s.width}x${s.height}`,
      elements: s.elements,
      sections: (s.sections ?? []) as never,
      viewport: { width: s.width, height: s.height },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A ladder-only capture whose elements are produced per width. */
const ladderOf = (at: (width: number) => ValueElement[]): MultiStateCapture =>
  multi(LADDER.map((width) => ({ width, height: LADDER_H[width], elements: at(width) })))

type Node = Record<string, unknown>

/** Every node in a folded document, flattened. */
function allNodes(doc: ReturnType<typeof foldToL1>): Node[] {
  const out: Node[] = []
  const walk = (n: Node): void => {
    out.push(n)
    for (const c of (n.children as Node[]) ?? []) walk(c)
  }
  walk(doc.root as never)
  return out
}

const textNode = (doc: ReturnType<typeof foldToL1>, text: string): Node =>
  allNodes(doc).find((n) => n.kind === 'text' && n.text === text)!

const nodeById = (doc: ReturnType<typeof foldToL1>, id: string): Node =>
  allNodes(doc).find((n) => n.id === id)!

interface Geo {
  keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number; atHeight?: number }>
  segments?: string[]
  viewportResponse?: { yFactor?: number; heightFactor?: number }
  anchor?: {
    x?: { px?: number; fraction?: number; maxPx?: number; pxTrack?: { keyframes: Array<{ at: number; value: number }>; segments?: string[] } }
    width?: { px?: number; fraction?: number; maxPx?: number; pxTrack?: { keyframes: Array<{ at: number; value: number }>; segments?: string[] } }
  }
}
const geoOf = (n: Node): Geo => n.geometry as Geo

type Track = { keyframes: Array<{ at: number; value: number }>; segments?: string[] }

describe('Reconciliation — story-8acc338d the responsive model fitted from the ladder', () => {
  // ── AC-767 — a track earns its place only by varying ────────────────────────

  it('test_UAT_AC767_varying_type_and_padding_axes_fold_to_per_width_tracks', () => {
    // The reference scales its hero type 36 → 72 across the ladder and doubles its
    // horizontal inset above `lg`, while line-height and the vertical inset hold
    // one value everywhere. Before this, every axis was taken from the widest
    // sample and replayed at 320 — desktop type on mobile, and a desktop inset
    // eating content width from inside a border box.
    const SIZE: Record<number, number> = { 320: 36, 375: 36, 768: 48, 1024: 60, 1280: 66, 1440: 72 }
    const doc = foldToL1(
      ladderOf((width) => [
        lines(
          run({
            text: 'Gigabyte Alchemy',
            box: { x: 24, y: 100, width: 260, height: 90 },
            fontSizePx: SIZE[width],
            lineHeightPx: 29, // invariant across the whole ladder
            paddingLeftPx: width >= 1024 ? 32 : 12, // varies
            paddingTopPx: 12, // invariant
          }),
          1,
        ),
        // Present at ONE sampled width only: an axis reported once cannot be shown
        // to vary, so it stays a single value rather than becoming a 1-point track.
        ...(width === 1440
          ? [lines(run({ text: 'Widest only', box: { x: 24, y: 400, width: 200, height: 29 }, fontSizePx: 21 }), 1)]
          : []),
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)

    const heading = textNode(doc, 'Gigabyte Alchemy')
    const responsive = heading.responsive as Record<string, Track>
    // A varying axis carries one keyframe per sampled width that reported it.
    expect(responsive.fontSizePx.keyframes).toEqual(LADDER.map((at) => ({ at, value: SIZE[at] })))
    // An axis identical at every sampled width gains no track…
    expect(responsive.lineHeightPx).toBeUndefined()
    // …and `axes` still carries the widest sample's representative value.
    expect((heading.axes as { fontSizePx: number; lineHeightPx: number }).fontSizePx).toBe(72)
    expect((heading.axes as { lineHeightPx: number }).lineHeightPx).toBe(29)

    // The same rule, per padding side.
    const pad = heading.responsivePadding as Record<string, Track>
    expect(pad.leftPx.keyframes).toEqual(LADDER.map((at) => ({ at, value: at >= 1024 ? 32 : 12 })))
    expect(pad.topPx).toBeUndefined()
    expect((heading.padding as { topPx?: number }).topPx).toBe(12)

    // Reported at a single width → single-valued, no track at all.
    const once = textNode(doc, 'Widest only')
    expect(once.responsive).toBeUndefined()
    expect((once.axes as { fontSizePx: number }).fontSizePx).toBe(21)

    // Rendered: the mobile value is the base rule and the desktop value arrives at
    // its own breakpoint — the page is no longer pinned to the widest sample.
    const { css } = renderL1Document(doc)
    const base = css.split('@media')[0]
    expect(base).toMatch(/font-size: 36px/)
    expect(base).not.toMatch(/font-size: 72px/)
    expect(css).toMatch(/@media \(min-width: 1440px\)[\s\S]*font-size: 72px/)
    expect(base).toMatch(/padding-left: 12px/)
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]*padding-left: 32px/)
  })

  // ── AC-768 — rounding is asymmetric by leaf kind ────────────────────────────

  it('test_UAT_AC768_text_width_ceils_to_its_glyph_extent_while_box_and_image_round', () => {
    // Fractions deliberately below AND above .5 at every sampled width. A
    // shrink-to-fit run's captured box IS its glyph extent, so rounding 685.31 down
    // to 685 makes the box narrower than the text it must hold and CSS answers by
    // wrapping — the hero title took a second line the reference never had.
    const TEXT_W: Record<number, number> = {
      320: 260.31,
      375: 300.72,
      768: 480.14,
      1024: 600.5,
      1280: 685.31,
      1440: 700.88,
    }
    const doc = foldToL1(
      ladderOf((width) => [
        lines(run({ text: 'Gigabyte Alchemy', box: { x: 24, y: 100, width: TEXT_W[width], height: 90 } }), 1),
        textless({
          a11yRole: 'img',
          src: '/media/hero.jpg',
          alt: 'Hero',
          objectFit: 'cover',
          box: { x: 24, y: 300, width: 300.4, height: 200.4 },
        }),
        textless({
          a11yRole: 'generic',
          role: 'generic',
          surfaceFill: '#eef2ff',
          box: { x: 24, y: 600, width: 240.6, height: 120.6 },
        }),
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)

    const title = textNode(doc, 'Gigabyte Alchemy')
    for (const kf of geoOf(title).keyframes) {
      const captured = TEXT_W[kf.at]
      // Never narrower than the glyphs the reference measured…
      expect(kf.width, `text width at ${kf.at}`).toBeGreaterThanOrEqual(captured)
      // …and no more than a pixel above: the smallest whole-pixel box that holds them.
      expect(kf.width - captured).toBeLessThanOrEqual(1)
      expect(kf.width).toBe(Math.ceil(captured))
    }

    // A box and an image leaf have no reflow constraint, and a repeated ceil would
    // grow a surface a pixel every re-capture → nearest, not up.
    const image = allNodes(doc).find((n) => n.kind === 'image')!
    const box = allNodes(doc).find((n) => n.kind === 'box' && typeof n.id === 'string' && /^box-/.test(n.id as string))!
    for (const kf of geoOf(image).keyframes) expect(kf.width).toBe(Math.round(300.4))
    for (const kf of geoOf(box).keyframes) expect(kf.width).toBe(Math.round(240.6))

    // The reproduction resolves to those same boxes — the hero title is laid out
    // at 686px where its glyphs measured 685.31, so it cannot reflow.
    const at1280 = evaluateLayout(doc, 1280)
    expect(at1280.leaves.find((l) => l.text === 'Gigabyte Alchemy')!.box.width).toBe(686)
    expect(at1280.leaves.find((l) => l.kind === 'image')!.box.width).toBe(300)
  })

  // ── AC-769 — the pin restates the reference's own line count ────────────────

  it('test_UAT_AC769_unbreakable_from_the_smallest_width_whose_wider_suffix_is_single_line', () => {
    // Five runs, one per case the suffix rule has to separate.
    const singleFrom = (width: number, from: number): number => (width >= from ? 1 : 3)
    const doc = foldToL1(
      ladderOf((width) => [
        // (a) one line at every sampled width → pinned from the ladder's floor.
        lines(run({ text: 'Always one line', box: { x: 24, y: 100, width: 261, height: 24 } }), 1),
        // (b) one line only from a middle width upward → pinned from that width.
        lines(run({ text: 'One line from md', box: { x: 24, y: 200, width: 414, height: 24 } }), singleFrom(width, 768)),
        // (c) one line at a middle width but wrapping at the widest → never pinned.
        //     "One line here" does not imply "one line above here".
        lines(run({ text: 'Wraps at the widest', box: { x: 24, y: 300, width: 300, height: 24 } }), width === 1024 ? 1 : 2),
        // (d) one line at 1024 AND 1440 but two at 1280 — the suffix starts at 1440,
        //     never at the earlier width that merely happened to fit.
        lines(
          run({ text: 'Grows with its column', box: { x: 24, y: 400, width: 300, height: 24 } }),
          width === 1024 || width === 1440 ? 1 : 2,
        ),
        // (e) no measurable line count (no `renderedTextBox`) — UNKNOWN must break
        //     the suffix, or a real paragraph gets pinned and overprints the run
        //     absolutely positioned below it.
        run({ text: 'Unmeasured run', box: { x: 24, y: 500, width: 400, height: 29 } }),
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)

    const nowrapOf = (text: string): number | undefined =>
      (textNode(doc, text).axes as { nowrapFromPx?: number }).nowrapFromPx

    expect(nowrapOf('Always one line')).toBe(320)
    expect(nowrapOf('One line from md')).toBe(768)
    // Wrapping at the widest sample breaks the suffix at once — not pinned at all,
    // and in particular not pinned from the middle width where it fit.
    expect(nowrapOf('Wraps at the widest')).toBeUndefined()
    expect(nowrapOf('Grows with its column')).toBe(1440)
    expect(nowrapOf('Unmeasured run')).toBeUndefined()

    // Rendered, the reference's line count is stated structurally rather than left
    // to each engine's glyph metrics: exactly the three pinned runs carry the pin —
    // one unconditionally, the others each gated by their own threshold — and the
    // two the reference never settled on one line carry none.
    const { css } = renderL1Document(doc)
    expect(css.match(/white-space: nowrap/g)!.length).toBe(3)
    expect(css.split('@media')[0]).toContain('white-space: nowrap')
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*white-space: nowrap/)
    expect(css).toMatch(/@media \(min-width: 1440px\)[\s\S]*white-space: nowrap/)
  })

  // ── AC-770 — the viewport-height axis comes only from the probe ─────────────

  /** The ladder, optionally plus one probe re-shooting 1280 at a second height. */
  function heroPage(withProbe: boolean): MultiStateCapture {
    const at = (width: number, height: number): ProjSpec => ({
      width,
      height,
      elements: [
        // Copy in the top half of a `min-h-screen` hero: it never moves.
        lines(run({ text: 'Hero title', box: { x: 24, y: 79, width: 400, height: 90 } }), 1),
        // Everything the hero pushes down travels a full viewport height.
        lines(run({ text: 'Below the fold', box: { x: 24, y: height + 96, width: 400, height: 40 } }), 1),
        lines(run({ text: 'hero band', surfaceFill: '#030717', box: { x: 0, y: 300, width, height: 29 } }), 1),
        lines(run({ text: 'lower band', surfaceFill: '#e8dfd3', box: { x: 0, y: height + 200, width, height: 29 } }), 1),
      ],
      sections: [
        { box: { x: 0, y: 0, width, height } },
        { box: { x: 0, y: height, width, height: 600 } },
      ],
    })
    const specs = LADDER.map((w) => at(w, LADDER_H[w]))
    return multi(withProbe ? [...specs, at(1280, 1000)] : specs)
  }

  it('test_UAT_AC770_a_viewport_height_response_is_fitted_only_from_the_height_probe', () => {
    const doc = foldToL1(heroPage(true))
    expect(validateL1(doc).ok).toBe(true)

    // The band takes its response from its own SECTION EDGES: the hero's copy sits
    // in the top half and never moves, while the band's bottom travels a full
    // viewport height. Both edges agree at every sampled width, so it is one rule.
    const band = nodeById(doc, 'section-band-0')
    expect(geoOf(band).viewportResponse?.heightFactor).toBe(1)

    // The other half of the derivative: everything the hero pushes down carries the
    // matching y factor, in the same units. Content above the fold does not.
    expect(geoOf(textNode(doc, 'Below the fold')).viewportResponse?.yFactor).toBe(1)
    expect(geoOf(textNode(doc, 'Hero title')).viewportResponse).toBeUndefined()

    // Each keyframe still evaluates to its captured pixels at the height it was
    // captured at: the response is measured FROM that origin, so `base + 1 *
    // (100vh - base)` is exactly `base` when the viewport is the capture height.
    for (const kf of geoOf(band).keyframes) expect(kf.atHeight).toBe(LADDER_H[kf.at])
    const { css } = renderL1Document(doc)
    expect(css).toMatch(/height: calc\(800px \+ \(100vh - 800px\)\)/)

    // The probe is EVIDENCE, never a keyframe: it adds no width to the ladder that
    // defines keyframes, screenshots and comparison cells.
    expect(doc.widths).toEqual(LADDER)
    expect(geoOf(band).keyframes.map((k) => k.at)).toEqual(LADDER)
    expect(geoOf(textNode(doc, 'Below the fold')).keyframes.map((k) => k.at)).toEqual(LADDER)

    // With the probe removed the axis is unidentifiable from a width ladder that
    // varies width and height together — so NOTHING is emitted, anywhere. A bundle
    // captured before the probe existed folds exactly as it did before.
    const noProbe = foldToL1(heroPage(false))
    for (const n of allNodes(noProbe)) {
      expect((n.geometry as Geo | undefined)?.viewportResponse, String(n.id ?? n.text)).toBeUndefined()
    }
  })

  // ── AC-771 — the centred column, from the modal content edge ────────────────

  /**
   * A page laid out in a real `max-w-6xl mx-auto px-6` column with a nested
   * `max-w-4xl` content cap — plus a header set 8px wider than its content on each
   * side, exactly as the reference does. The header's edge is the MINIMUM, so a
   * fit that took the minimum would compute a 16px inset and fail outright.
   */
  const columnPage = (): MultiStateCapture =>
    ladderOf((width) => {
      const origin = refOrigin(width)
      const extent = refExtent(width)
      return [
        lines(run({ text: 'Outdented header', box: { x: origin - 8, y: 40, width: extent + 16, height: 29 } }), 1),
        ...['Full column run', 'Second column run', 'Third column run'].map((text, i) =>
          lines(run({ text, box: { x: origin, y: 200 + i * 60, width: extent, height: 29 } }), 1),
        ),
      ]
    })

  it('test_UAT_AC771_a_centred_column_is_fitted_from_the_modal_content_edge', () => {
    const doc = foldToL1(columnPage())
    expect(validateL1(doc).ok).toBe(true)

    // The recovered constants are the authored rule — taken from the edge the most
    // content shares, not from the widest gutter on the page.
    const column = doc.column as L1Column
    expect(column).toEqual({ containerPx: REF_CONTAINER, insetPx: REF_INSET, maxWidthPx: REF_MAX })

    // Those constants reproduce the reference's rule below, between and above the
    // sampled ladder — not just at the samples. (Interpolating the knee put the
    // margin at 55.5px where the reference held 24px; holding the last keyframe
    // froze it where the reference kept growing.)
    const originOf = (c: L1Column, w: number): number => Math.max(0, (w - c.containerPx) / 2) + c.insetPx
    const extentOf = (c: L1Column, w: number): number =>
      Math.min(c.maxWidthPx ?? Infinity, Math.min(c.containerPx, w) - 2 * c.insetPx)
    for (const w of [200, 500, 640, 1150, 1600, 2400]) {
      expect(originOf(column, w), `origin at ${w}`).toBeCloseTo(refOrigin(w), 6)
      expect(extentOf(column, w), `extent at ${w}`).toBeCloseTo(refExtent(w), 6)
    }

    // And the emitted CSS is that closed form, not a piecewise line through the
    // keyframes — so the browser evaluates the rule itself at every width.
    const { css } = renderL1Document(doc)
    expect(css).toContain('left: calc(max(0px, (100vw - 1152px) / 2) + 24px)')
    expect(css).toContain('width: min(896px, (min(1152px, 100vw) - 48px))')

    // A page with no centred column keeps its keyframes untouched and declares no
    // column — an unfitted page carries no dead constant.
    const flush = foldToL1(
      ladderOf((width) => [lines(run({ text: 'Flush left', box: { x: 40, y: 100, width: width - 80, height: 29 } }), 1)]),
    )
    expect(flush.column).toBeUndefined()
    expect(geoOf(textNode(flush, 'Flush left')).anchor).toBeUndefined()
    expect(geoOf(textNode(flush, 'Flush left')).keyframes.map((k) => k.at)).toEqual(LADDER)

    // Origins no single column can reproduce → the fit is rejected outright rather
    // than emitted as an approximation.
    const ORIGINS: Record<number, number> = { 320: 24, 375: 24, 768: 100, 1024: 120, 1280: 130, 1440: 400 }
    const unfittable = foldToL1(
      ladderOf((width) => [
        lines(run({ text: 'Wandering', box: { x: ORIGINS[width], y: 100, width: 200, height: 29 } }), 1),
      ]),
    )
    expect(unfittable.column).toBeUndefined()
    expect(geoOf(textNode(unfittable, 'Wandering')).anchor).toBeUndefined()
  })

  // ── AC-772 — per-axis anchoring, guarded ────────────────────────────────────

  it('test_UAT_AC772_x_and_width_anchor_to_the_column_independently_and_guardedly', () => {
    // One page carrying every shape the anchor fit has to separate. All of them
    // share the column's left edge — alignment is a SHARED property — while their
    // widths are private and each fits, caps, or does not fit on its own.
    const doc = foldToL1(
      ladderOf((width) => {
        const origin = refOrigin(width)
        const extent = refExtent(width)
        return [
          // Fill the column, so its extent is unambiguous.
          ...['Fills it', 'Also fills', 'Fills too'].map((text, i) =>
            lines(run({ text, box: { x: origin, y: 100 + i * 40, width: extent, height: 29 } }), 1),
          ),
          // Left edge follows the column; width is a glyph extent that is nobody's
          // column function.
          lines(run({ text: 'Shrink to fit', box: { x: origin, y: 300, width: 120 + width / 100, height: 29 } }), 1),
          // A nested narrower maximum: fills the column until its own cap takes
          // over, with three samples below the cap to determine the fit.
          lines(run({ text: 'Capped', box: { x: origin, y: 400, width: Math.min(768, extent), height: 29 } }), 1),
          // The same shape with a cap only TWO samples support — a two-unknown fit
          // through two points is interpolation, not evidence.
          lines(run({ text: 'Under-determined cap', box: { x: origin, y: 500, width: Math.min(400, extent), height: 29 } }), 1),
          // A width whose fitted share of the column is implausibly steep: it is
          // tracking something else that merely correlates with the column.
          lines(run({ text: 'Steep', box: { x: origin, y: 600, width: 2.5 * extent, height: 29 } }), 1),
          // A full-bleed band.
          lines(run({ text: 'band', surfaceFill: '#030717', box: { x: 0, y: 700, width, height: 29 } }), 1),
        ]
      }),
    )
    expect(validateL1(doc).ok).toBe(true)
    expect(doc.column).toEqual({ containerPx: REF_CONTAINER, insetPx: REF_INSET, maxWidthPx: REF_MAX })

    // A node whose left edge follows the column but whose width does not: only the
    // `x` is anchored, and the width keeps its keyframes. Coupling the two split
    // text the reference keeps flush by 31px.
    const shrink = geoOf(textNode(doc, 'Shrink to fit'))
    expect(shrink.anchor?.x).toEqual({ px: 0, fraction: 0 })
    expect(shrink.anchor?.width).toBeUndefined()
    expect(shrink.keyframes.map((k) => k.at)).toEqual(LADDER)
    for (const kf of shrink.keyframes) expect(kf.width).toBe(Math.ceil(120 + kf.at / 100))

    // A nested narrower maximum anchors WITH a capped width term.
    expect(geoOf(textNode(doc, 'Capped')).anchor?.width).toEqual({ px: 0, fraction: 1, maxPx: 768 })

    // A cap supported by fewer than three samples below it is refused — the width
    // keeps its keyframes rather than "verifying" a two-point fit against its own cap.
    const under = geoOf(textNode(doc, 'Under-determined cap'))
    expect(under.anchor?.width).toBeUndefined()
    for (const kf of under.keyframes) expect(kf.width).toBe(Math.ceil(Math.min(400, refExtent(kf.at))))

    // An implausibly steep share of the column is refused, however exactly it fits:
    // extrapolating it off-sample sends the run kilometres wide.
    expect(geoOf(textNode(doc, 'Steep')).anchor?.width).toBeUndefined()

    // A node spanning the full viewport is never anchored and never given an offset
    // track — writing `x = 0` as `origin + (-origin)` walks it negative in between.
    expect(geoOf(textNode(doc, 'band')).anchor).toBeUndefined()
    expect(geoOf(nodeById(doc, 'section-band-0')).anchor).toBeUndefined()

    // Where no closed form fits an `x`, the small in-column OFFSET is keyframed
    // instead of the absolute position — and that track inherits the node's own
    // geometry transition flags, because a 3-up grid stacking below a breakpoint is
    // a layout MODE change, not a fit. Interpolating an inset across it slid the
    // third column 42px off the right edge.
    const GAP = 24
    const grid = foldToL1(
      ladderOf((width) => {
        const origin = refOrigin(width)
        const extent = refExtent(width)
        const stacked = width < 768
        const colW = stacked ? extent : (extent - 2 * GAP) / 3
        return [
          ...['Fills it', 'Also fills', 'Fills too'].map((text, i) =>
            lines(run({ text, box: { x: origin, y: 100 + i * 40, width: extent, height: 29 } }), 1),
          ),
          ...[0, 1, 2].map((i) =>
            lines(
              run({
                text: `Tile ${i}`,
                box: {
                  x: stacked ? origin : origin + i * (colW + GAP),
                  y: stacked ? 400 + i * 60 : 400,
                  width: colW,
                  height: 29,
                },
              }),
              1,
            ),
          ),
        ]
      }),
    )
    expect(validateL1(grid).ok).toBe(true)
    const tile = geoOf(textNode(grid, 'Tile 2'))
    const xTrack = tile.anchor?.x?.pxTrack
    expect(xTrack, 'the third grid column keyframes its in-column offset').toBeDefined()
    // It tracks the offset INSIDE the column, so the origin stays closed-form.
    expect(xTrack!.keyframes.map((k) => k.at)).toEqual(LADDER)
    expect(xTrack!.keyframes[0].value).toBe(0) // stacked below `md`: flush with the column
    expect(xTrack!.keyframes[2].value).toBeGreaterThan(400) // third of three at `md`
    // …and it agrees with the node's own geometry about where the mode change is.
    expect(xTrack!.segments).toEqual(tile.segments)
    expect(xTrack!.segments).toContain('snap')

    // The reproduction has no negative-x node and no horizontal overflow at any
    // probed width — sampled or not.
    const probed = [320, 375, 500, 640, 768, 900, 1024, 1150, 1280, 1440, 1600, 2000]
    for (const w of probed) {
      for (const leaf of evaluateLayout(grid, w).leaves) {
        expect(leaf.box.x, `${leaf.text ?? leaf.id} x at ${w}`).toBeGreaterThanOrEqual(-1)
        expect(leaf.box.x + leaf.box.width, `${leaf.text ?? leaf.id} right at ${w}`).toBeLessThanOrEqual(w + 2)
      }
    }
  })
})
