/**
 * REQ-88 (round 6) — the four defects an operator found on the gigabytealchemy
 * reproduction that every numeric gate passed, and the modelling gaps behind them.
 *
 * Each is a case where the fold had the evidence and threw it away:
 *
 *  1. **Accent rules were drawn on the wrong box.** `border-l-4 pl-6` paints the
 *     bar on a *wrapper*; the capture reported the bar's width+colour but not
 *     whose box it was, so the fold drew it on the run — indented by the wrapper's
 *     padding, and overlapping the first glyph (a border paints inside its own
 *     border box). Now the bearer's rect is captured and used.
 *  2. **Single-line runs could wrap.** A shrink-to-fit run's box IS its glyph
 *     extent, so the reproduction's slack is a fraction of a pixel and each engine
 *     measures glyphs differently. Six checklist items, the CTA and the footer
 *     wrapped in Gecko and collided with the absolutely-positioned run below.
 *     `nowrapFromPx` restates the line count the reference already fixed — as a
 *     width, because those same items legitimately wrap at 320 and a flag could
 *     only ever be set for runs that never wrap anywhere.
 *  3. **`100vh` was unrepresentable.** Height depends on viewport *height*, which
 *     a width ladder cannot see — and the two axes moved together in the ladder,
 *     so the hero was unidentifiable even in principle. A same-width height probe
 *     makes it a finite difference.
 *  4. **A centred column was modelled as a straight line.** `mx-auto max-w-*` is
 *     flat then rises at half rate; interpolating across that knee put the left
 *     margin at 2.3x the reference's between samples, and holding the last
 *     keyframe understated it above the widest.
 *
 * Plus the latent gap the same audit surfaced: padding was pinned to the widest
 * sample while geometry keyframed.
 */
import { describe, expect, it } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { diffMultiState, foldToL1, partitionProbes, rawRunToElement, sampleFidelityProbe } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** The ladder's viewport heights — deliberately varying, as the real one does. */
const LADDER_H: Record<number, number> = { 320: 800, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }

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

/** A run that renders on exactly `lines` lines (what `renderedTextBox` reports). */
function lines(el: ValueElement, n: number): ValueElement {
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 29 * n - 8 } }
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

/** Every node in a folded document, flattened. */
function allNodes(doc: ReturnType<typeof foldToL1>): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const walk = (n: Record<string, unknown>): void => {
    out.push(n)
    for (const c of (n.children as Array<Record<string, unknown>>) ?? []) walk(c)
  }
  walk(doc.root as never)
  return out
}

const textNode = (doc: ReturnType<typeof foldToL1>, text: string): Record<string, unknown> =>
  allNodes(doc).find((n) => n.kind === 'text' && n.text === text)!

describe('REQ-88 round 6 — accent bearers, unbreakable runs, and the viewport axes', () => {
  // ── 1. The accent rule is painted on the box that bears it ──────────────────

  it('test_UAT_FC_REQ-88_accent_rule_takes_its_bearing_wrappers_rect_not_the_runs', () => {
    // The reference shape: <div class="border-l-4 border-emerald-400 pl-6"><p>…
    // The wrapper spans the content column (x=88 w=896) and paints the bar; the
    // run inside is inset by pl-6 + the border (x=116 w=868). Before the fix the
    // fold had only the bar's width/colour, so it drew a 4px rule down x=116 —
    // where the text itself starts, overlapping the first glyph.
    const ms = multi(
      LADDER.map((width) => {
        const origin = Math.max(0, (width - 1152) / 2) + 24
        const extent = Math.min(896, Math.min(1152, width) - 48)
        return {
          width,
          height: LADDER_H[width],
          elements: [
            lines(
              run({
                text: 'These are foundations',
                box: { x: origin + 28, y: 1756, width: extent - 28, height: 29 },
                borderLeft: { widthPx: 4, color: '#00d492' },
                // The band resolves as the surface — viewport-wide, so not a card.
                surface: {
                  self: false,
                  box: { x: 0, y: 1287, width, height: 594 },
                  borderRadiusPx: 8,
                  boxShadow: null,
                  border: null,
                },
                accentBox: { x: origin, y: 1756, width: extent, height: 29 },
              }),
              1,
            ),
          ],
        }
      }),
    )
    const doc = foldToL1(ms)
    const card = allNodes(doc).find(
      (n) => n.kind === 'box' && (n.axes as { borderLeft?: unknown } | undefined)?.borderLeft,
    )
    expect(card, 'the accent must be emitted on a box').toBeTruthy()
    const kf = (card!.geometry as { keyframes: Array<{ at: number; x: number; width: number }> }).keyframes
    const at1280 = kf.find((k) => k.at === 1280)!
    // The bearer's rect, NOT the run's (which is x=116 w=868).
    expect(at1280.x).toBe(88)
    expect(at1280.width).toBe(896)
    // And no radius leaks in from the band the surface walk landed on.
    expect((card!.axes as { borderRadiusPx?: number }).borderRadiusPx).toBeUndefined()
  })

  it('test_UAT_FC_REQ-88_accent_on_the_runs_own_element_keeps_the_runs_rect', () => {
    // A card that paints BOTH its fill and its accent on one element carries no
    // separate bearer; the resolved surface shape stays authoritative for both.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(
            run({
              text: 'Sanctum Voice',
              box: { x: 124, y: 2151, width: 167, height: 32 },
              borderLeft: { widthPx: 4, color: '#ffb900' },
              surfaceFill: '#ffffff',
              surface: {
                self: false,
                box: { x: 88, y: 2119, width: 896, height: 332 },
                borderRadiusPx: 8,
                boxShadow: null,
                border: null,
              },
            }),
            1,
          ),
        ],
      })),
    )
    const doc = foldToL1(ms)
    const card = allNodes(doc).find(
      (n) => n.kind === 'box' && (n.axes as { borderLeft?: unknown } | undefined)?.borderLeft,
    )!
    const kf = (card.geometry as { keyframes: Array<{ at: number; x: number; width: number }> }).keyframes
    expect(kf[kf.length - 1].x).toBe(88)
    expect(kf[kf.length - 1].width).toBe(896)
    // The card's own rounding survives — it was resolved, not fallen back to.
    expect((card.axes as { borderRadiusPx?: number }).borderRadiusPx).toBe(8)
  })

  // ── 2. A run the reference never broke cannot break ─────────────────────────

  it('test_UAT_FC_REQ-88_single_line_runs_fold_unbreakable_and_render_nowrap', () => {
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          // One line at every width — a shrink-to-fit checklist item.
          lines(run({ text: 'Open source and community-driven', box: { x: 24, y: 100, width: 261, height: 24 } }), 1),
          // Wraps in the reference at every width — must stay breakable.
          lines(run({ text: 'A long paragraph of body copy', box: { x: 24, y: 200, width: 800, height: 87 } }), 3),
        ],
      })),
    )
    const doc = foldToL1(ms)
    const pinned = textNode(doc, 'Open source and community-driven')
    const flowing = textNode(doc, 'A long paragraph of body copy')
    // Single-line at every width → pinned from the ladder's floor.
    expect((pinned.axes as { nowrapFromPx?: number }).nowrapFromPx).toBe(320)
    expect((flowing.axes as { nowrapFromPx?: number }).nowrapFromPx).toBeUndefined()

    const { css } = renderL1Document(doc)
    // At the floor the pin is unconditional — no media query gates it.
    expect(css).toContain('white-space: nowrap')
    // Exactly one run is pinned — `nowrap` is not sprayed across the document.
    expect(css.match(/white-space: nowrap/g)!.length).toBe(1)
  })

  it('test_UAT_FC_REQ-88_a_run_pinned_only_above_a_width_is_gated_by_that_width', () => {
    // The case an all-or-nothing flag cannot express, and the one that actually
    // broke: the checklist items are one line from 768 up and three at 320. A flag
    // set only for never-wrapping runs would skip every one of them.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(
            run({ text: 'Designed for developers', box: { x: 24, y: 100, width: Math.min(414, width - 48), height: 24 } }),
            width >= 768 ? 1 : 3,
          ),
        ],
      })),
    )
    const doc = foldToL1(ms)
    expect((textNode(doc, 'Designed for developers').axes as { nowrapFromPx?: number }).nowrapFromPx).toBe(768)
    const { css } = renderL1Document(doc)
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*white-space: nowrap/)
    // And it must NOT be pinned unconditionally — at 320 the reference wrapped it,
    // so nothing before the first media block may carry the pin.
    expect(css.slice(0, css.indexOf('@media'))).not.toContain('white-space: nowrap')
  })

  it('test_UAT_FC_REQ-88_the_pin_starts_only_where_every_wider_sample_is_single_line', () => {
    // Responsive type can grow faster than its column, so "one line here" does not
    // imply "one line above here". The threshold is the smallest width whose whole
    // suffix is single-line — 1440, not the earlier 1024 that also happened to fit.
    const singleAt = new Set([1024, 1440])
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(
            run({ text: 'Grows with its column', box: { x: 24, y: 100, width: 300, height: 24 } }),
            singleAt.has(width) ? 1 : 2,
          ),
        ],
      })),
    )
    const doc = foldToL1(ms)
    expect((textNode(doc, 'Grows with its column').axes as { nowrapFromPx?: number }).nowrapFromPx).toBe(1440)
  })

  it('test_UAT_FC_REQ-88_a_run_that_wraps_at_any_captured_width_stays_breakable', () => {
    // Single-line on desktop, two lines at 320. Pinning it would push its second
    // line onto whatever is absolutely positioned below it at mobile — the exact
    // collision this axis exists to prevent, inverted.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(
            run({ text: 'Reflows at mobile', box: { x: 24, y: 100, width: Math.min(600, width - 48), height: 24 } }),
            width <= 375 ? 2 : 1,
          ),
        ],
      })),
    )
    const doc = foldToL1(ms)
    // Pinned from 768 up, where the reference stopped wrapping — never at 320/375.
    expect((textNode(doc, 'Reflows at mobile').axes as { nowrapFromPx?: number }).nowrapFromPx).toBe(768)
  })

  it('test_UAT_FC_REQ-88_an_unmeasurable_line_count_is_not_read_as_one_line', () => {
    // A run with no `renderedTextBox` (a synthetic or pre-REQ-58 manifest) has an
    // UNKNOWN line count. Defaulting that to "one line" would pin real paragraphs.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [run({ text: 'Unmeasured run', box: { x: 24, y: 100, width: 400, height: 29 } })],
      })),
    )
    const doc = foldToL1(ms)
    expect((textNode(doc, 'Unmeasured run').axes as { nowrapFromPx?: number }).nowrapFromPx).toBeUndefined()
  })

  // ── 3. The viewport-height axis ─────────────────────────────────────────────

  /**
   * The ladder plus a probe: 1280 re-shot at height 1000. The hero section is
   * `min-h-screen`, so its height equals the viewport height and everything below
   * it starts one viewport height down.
   */
  function heroPage(withProbe: boolean): MultiStateCapture {
    const specs: ProjSpec[] = []
    const at = (width: number, height: number): ProjSpec => ({
      width,
      height,
      elements: [
        lines(run({ text: 'Hero title', box: { x: 24, y: 79, width: 400, height: 90 } }), 1),
        lines(run({ text: 'Below the fold', box: { x: 24, y: height + 96, width: 400, height: 40 } }), 1),
        // A full-bleed run per band so the band reconstruction has content.
        lines(
          run({ text: 'hero band', surfaceFill: '#030717', box: { x: 0, y: 300, width, height: 29 } }),
          1,
        ),
        lines(
          run({ text: 'lower band', surfaceFill: '#e8dfd3', box: { x: 0, y: height + 200, width, height: 29 } }),
          1,
        ),
      ],
      sections: [
        { box: { x: 0, y: 0, width, height } },
        { box: { x: 0, y: height, width, height: 600 } },
      ],
    })
    for (const width of LADDER) specs.push(at(width, LADDER_H[width]))
    if (withProbe) specs.push(at(1280, 1000))
    return multi(specs)
  }

  it('test_UAT_FC_REQ-88_a_height_probe_makes_the_hero_track_the_viewport', () => {
    const doc = foldToL1(heroPage(true))
    const hero = allNodes(doc).find((n) => n.id === 'section-band-0')!
    const geo = hero.geometry as {
      keyframes: Array<{ at: number; height?: number; atHeight?: number }>
      viewportResponse?: { yFactor?: number; heightFactor?: number }
    }
    // The hero grows with the viewport, one-for-one, and does not move.
    expect(geo.viewportResponse?.heightFactor).toBe(1)
    expect(geo.viewportResponse?.yFactor).toBeUndefined()
    // Every keyframe records the height it was measured at, so the response has
    // an origin and still evaluates to the captured pixels at capture size.
    for (const kf of geo.keyframes) expect(kf.atHeight).toBe(LADDER_H[kf.at])

    const { css } = renderL1Document(doc)
    // `base + 1 * (100vh - base)` where base IS the capture height → plain 100vh.
    expect(css).toMatch(/height: calc\(800px \+ \(100vh - 800px\)\)/)
  })

  it('test_UAT_FC_REQ-88_content_below_a_viewport_hero_is_pushed_down_with_it', () => {
    // The half of the rule that a per-node view would miss: a `100vh` hero is not
    // a local fact. If only the hero grew, a shorter viewport would open a gap and
    // a taller one would overlap the section below.
    const doc = foldToL1(heroPage(true))
    const below = textNode(doc, 'Below the fold')
    const geo = below.geometry as { viewportResponse?: { yFactor?: number } }
    expect(geo.viewportResponse?.yFactor).toBe(1)
    // The hero title sits above the fold and must NOT move.
    const title = textNode(doc, 'Hero title')
    expect((title.geometry as { viewportResponse?: unknown }).viewportResponse).toBeUndefined()
  })

  it('test_UAT_FC_REQ-88_without_a_height_probe_no_height_response_is_invented', () => {
    // The ladder alone varies width and height together, so the axis is not
    // identifiable. The honest answer is to emit nothing rather than to guess
    // from a correlation — this is what the probe viewport exists to change.
    const doc = foldToL1(heroPage(false))
    for (const n of allNodes(doc)) {
      expect((n.geometry as { viewportResponse?: unknown } | undefined)?.viewportResponse).toBeUndefined()
    }
  })

  // ── 4. The centred content column ───────────────────────────────────────────

  /** A page laid out in a real `max-w-6xl mx-auto px-6` + `max-w-4xl` column. */
  function columnPage(): MultiStateCapture {
    return multi(
      LADDER.map((width) => {
        const origin = Math.max(0, (width - 1152) / 2) + 24
        const extent = Math.min(896, Math.min(1152, width) - 48)
        return {
          width,
          height: LADDER_H[width],
          elements: [
            lines(run({ text: 'Full column run', box: { x: origin, y: 400, width: extent, height: 29 } }), 1),
            lines(run({ text: 'Inset by an accent', box: { x: origin + 28, y: 500, width: extent - 28, height: 29 } }), 1),
          ],
        }
      }),
    )
  }

  it('test_UAT_FC_REQ-88_a_centred_column_is_recovered_and_anchored_to', () => {
    const doc = foldToL1(columnPage())
    expect(doc.column).toEqual({ containerPx: 1152, insetPx: 24, maxWidthPx: 896 })

    const full = textNode(doc, 'Full column run')
    expect((full.geometry as { anchor?: unknown }).anchor).toEqual({
      x: { px: 0, fraction: 0 },
      width: { px: 0, fraction: 1 },
    })
    const inset = textNode(doc, 'Inset by an accent')
    expect((inset.geometry as { anchor?: unknown }).anchor).toEqual({
      x: { px: 28, fraction: 0 },
      width: { px: -28, fraction: 1 },
    })
  })

  it('test_UAT_FC_REQ-88_x_anchors_even_when_width_is_not_a_column_function', () => {
    // The axes are fitted independently, and that is the whole point. Coupling
    // them anchored one hero line (whose width happened to equal the column
    // extent) while its neighbours kept drifting keyframes — 24px vs 55.5px at
    // 1150, a 31px split in text the reference keeps flush.
    const ms = multi(
      LADDER.map((width) => {
        const origin = Math.max(0, (width - 1152) / 2) + 24
        const extent = Math.min(896, Math.min(1152, width) - 48)
        return {
          width,
          height: LADDER_H[width],
          elements: [
            // Several runs filling the column, so its extent is unambiguous.
            ...['Fills it', 'Also fills', 'Fills too'].map((t, i) =>
              lines(run({ text: t, box: { x: origin, y: 100 + i * 40, width: extent, height: 29 } }), 1),
            ),
            // Same left edge, but its own narrower maximum: x fits, width caps.
            lines(run({ text: 'Capped', box: { x: origin, y: 500, width: Math.min(768, extent), height: 29 } }), 1),
            // Same left edge, width is a glyph extent — no column relation at all.
            lines(run({ text: 'Shrink to fit', box: { x: origin, y: 600, width: 120 + width / 100, height: 29 } }), 1),
          ],
        }
      }),
    )
    const doc = foldToL1(ms)
    // All three must take their LEFT from the column — alignment is shared.
    for (const t of ['Fills it', 'Capped', 'Shrink to fit']) {
      expect((textNode(doc, t).geometry as { anchor?: { x?: unknown } }).anchor?.x, t).toBeTruthy()
    }
    // A nested `max-w-*` is a capped column term, not a reason to drop the anchor.
    expect((textNode(doc, 'Capped').geometry as { anchor?: { width?: unknown } }).anchor?.width).toEqual({
      px: 0,
      fraction: 1,
      maxPx: 768,
    })
    // A glyph extent is nobody's column function — width stays keyframed.
    expect((textNode(doc, 'Shrink to fit').geometry as { anchor?: { width?: unknown } }).anchor?.width).toBeUndefined()
  })

  it('test_UAT_FC_REQ-88_a_full_bleed_band_is_never_anchored_to_the_column', () => {
    // A band sits at x=0 absolutely. Expressing that as `origin + (-origin)` and
    // interpolating the residual walks it off the left edge between samples, so
    // the inset-track fallback is refused for anything spanning the viewport.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(run({ text: 'band', surfaceFill: '#030717', box: { x: 0, y: 300, width, height: 29 } }), 1),
          lines(
            run({
              text: 'column run',
              box: { x: Math.max(0, (width - 1152) / 2) + 24, y: 400, width: Math.min(896, Math.min(1152, width) - 48), height: 29 },
            }),
            1,
          ),
        ],
      })),
    )
    const doc = foldToL1(ms)
    expect((textNode(doc, 'band').geometry as { anchor?: unknown }).anchor).toBeUndefined()
    expect((textNode(doc, 'column run').geometry as { anchor?: { x?: unknown } }).anchor?.x).toBeTruthy()
  })

  it('test_UAT_FC_REQ-88_column_anchored_css_is_exact_between_and_above_the_samples', () => {
    const { css } = renderL1Document(foldToL1(columnPage()))
    // Closed form, not a piecewise line: one static rule, no media queries for x.
    expect(css).toContain('left: calc(max(0px, (100vw - 1152px) / 2) + 24px)')
    expect(css).toContain('width: min(896px, (min(1152px, 100vw) - 48px))')
    // The old failure mode: a lerp of `left` between the 1024 and 1280 keyframes,
    // which reads 55.5px at 1150 where the reference is still flat at 24px.
    expect(css).not.toMatch(/left: calc\(24px \+ \(64 \* \(100vw - 1024px\)/)
  })

  it('test_UAT_FC_REQ-88_a_page_with_no_centred_column_keeps_its_keyframes', () => {
    // Left-aligned content at a constant gutter: no container ever engages, so
    // there is nothing to fit and the fold must not invent one.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(run({ text: 'Flush left', box: { x: 40, y: 100, width: width - 80, height: 29 } }), 1),
        ],
      })),
    )
    const doc = foldToL1(ms)
    expect(doc.column).toBeUndefined()
    expect((textNode(doc, 'Flush left').geometry as { anchor?: unknown }).anchor).toBeUndefined()
  })

  it('test_UAT_FC_REQ-88_an_anchor_without_a_column_is_rejected_by_the_envelope', () => {
    // A dangling anchor would render as plausible-looking geometry taken from the
    // keyframes, hiding the broken reference. The envelope refuses it instead.
    const bad = {
      widths: [320, 1280],
      root: {
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'x',
            geometry: {
              keyframes: [
                { at: 320, x: 0, y: 0, width: 100 },
                { at: 1280, x: 0, y: 0, width: 100 },
              ],
              anchor: { width: { fraction: 1 } },
            },
          },
        ],
      },
    }
    const result = validateL1(bad)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.some((e) => /requires the document to declare a `column`/.test(e.message))).toBe(
      true,
    )
  })

  // ── 5. Padding keyframes with the geometry it insets ────────────────────────

  it('test_UAT_FC_REQ-88_padding_that_varies_across_the_ladder_gets_a_track', () => {
    // Geometry and type both keyframed; padding did not, so the widest sample's
    // inset was replayed at 320 — eating content width from inside a border box.
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(
            run({
              text: 'Padded control',
              box: { x: 24, y: 100, width: 200, height: 48 },
              paddingLeftPx: width >= 1024 ? 32 : 12,
              paddingRightPx: width >= 1024 ? 32 : 12,
              paddingTopPx: 12,
              paddingBottomPx: 12,
            }),
            1,
          ),
        ],
      })),
    )
    const doc = foldToL1(ms)
    const node = textNode(doc, 'Padded control')
    const tracks = node.responsivePadding as Record<string, { keyframes: Array<{ at: number; value: number }> }>
    expect(tracks.leftPx.keyframes).toEqual(
      LADDER.map((at) => ({ at, value: at >= 1024 ? 32 : 12 })),
    )
    // A side that does NOT vary stays a plain scalar — a track earns its place.
    expect(tracks.topPx).toBeUndefined()
    expect((node.padding as { topPx?: number }).topPx).toBe(12)

    const { css } = renderL1Document(doc)
    expect(css).toContain('padding-left: 12px')
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]*padding-left: 32px/)
  })
})

/**
 * REQ-88 — a height probe is *evidence*, never a ladder cell.
 *
 * Every responsive consumer keys a projection on `(engine, width, state)`; none
 * carries viewport height, because height is not what a responsive comparison is
 * about. A probe re-shoots a ladder width, so it collides on that key — and the
 * collision is silent and severe. Both consumers below reported a page-wide
 * failure on a reproduction that had not changed.
 */
describe('REQ-88 — height probes are evidence, not ladder cells', () => {
  /** The ladder plus one probe re-shooting 1280 at a second height. */
  function withProbe(): MultiStateCapture {
    const at = (width: number, height: number): ProjSpec => ({
      width,
      height,
      elements: [lines(run({ text: 'Only run', box: { x: 24, y: 40, width: 200, height: 29 } }), 1)],
    })
    return multi([...LADDER.map((w) => at(w, LADDER_H[w])), at(1280, 1000)])
  }

  it('test_UAT_FC_REQ-88_a_probe_is_partitioned_out_of_the_width_ladder', () => {
    const { ladder, probes } = partitionProbes(withProbe().projections)
    expect(ladder.map((p) => p.viewport.width)).toEqual(LADDER)
    expect(probes.map((p) => `${p.viewport.width}x${p.viewport.height}`)).toEqual(['1280x1000'])
  })

  it('test_UAT_FC_REQ-88_the_multi_viewport_diff_emits_one_cell_per_ladder_width', () => {
    // The probe shares 1280's key, so before the split it both overwrote that
    // cell's *reproduction* — diffing the ladder reference against the probe's
    // taller render — and emitted a second 1280 cell. On the real capture that
    // was 59 phantom deltas against a reproduction that had not changed.
    const ms = withProbe()
    const cells = diffMultiState(ms, ms)
    expect(cells.length).toBe(LADDER.length)
    expect(cells.map((c) => c.viewportWidth).sort((a, b) => a - b)).toEqual(LADDER)
    // Self-diff: identical inputs must produce no deltas at all.
    for (const c of cells) expect(c.report?.deltas ?? []).toEqual([])
  })

  it('test_UAT_FC_REQ-88_the_fidelity_probe_does_not_count_a_probe_as_a_coverage_gap', () => {
    // `oracleBoxes` drains a FIFO leaf queue per (key, width). A second full set of
    // 1280 oracle rows finds those queues already empty and reports every text run
    // on the page as `unmatched` — 55 of them on the real capture, turning a
    // passing gate into a page-wide FAIL with nothing actually wrong.
    const ms = withProbe()
    const report = sampleFidelityProbe(foldToL1(ms), ms as never)
    expect(report.unmatched).toEqual([])
    expect(report.residuals).toEqual([])
    expect(report.pass).toBe(true)
  })

  it('test_UAT_FC_REQ-88_the_accent_bearer_rect_survives_the_manifest_projection', () => {
    // `rawRunToElement` is the projection that builds the multi-state manifest the
    // fold reads. Carrying `accentBox` only on the ContentRun path left it
    // stranded: capture recorded the bearer's rect and nothing downstream saw it,
    // so the accent fix silently did nothing on a real capture.
    const raw = {
      role: 'body',
      text: 'Quoted',
      color: '#111111',
      fontFamily: 'Inter',
      fontSizePx: 18,
      fontWeight: 400,
      lineHeightPx: 29,
      letterSpacingPx: 0,
      gradientCss: null,
      borderLeftWidthPx: 4,
      borderLeftColor: '#00d492',
      accentBox: { x: 88, y: 1756, width: 896, height: 29 },
      paddingLeftPx: 0,
      box: { x: 116, y: 1756, width: 868, height: 29 },
    }
    expect(rawRunToElement(raw as never).accentBox).toEqual({ x: 88, y: 1756, width: 896, height: 29 })
    // No accent painted → no bearer rect to carry.
    expect(rawRunToElement({ ...raw, borderLeftWidthPx: 0, borderLeftColor: null } as never).accentBox).toBeUndefined()
  })
})
