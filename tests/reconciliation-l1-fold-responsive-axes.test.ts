/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document…", the **responsive-axes** span (BUG-17 / BUG-18 / REQ-88).
 *
 * The original text-only criteria (AC-689…AC-696) are in
 * tests/reconciliation-l1-fold.test.ts and the full-language upgrade
 * (AC-729…AC-733, AC-1629) in tests/reconciliation-l1-fold-full-language.test.ts.
 * This file proves the criteria that make a folded axis a *function of width*
 * rather than a single desktop value, one UAT per AC:
 *
 *   AC-1625 a numeric axis (type or padding side) that differs across the ladder
 *           folds to a per-width keyframe track; one holding a single value stays
 *           a scalar and emits no track
 *   AC-1626 per-side padding folds onto the leaf as the typed `padding` axis and
 *           INSETS content within the pinned border box rather than inflating it
 *   AC-1627 a viewport-HEIGHT probe yields a measured `{yFactor, heightFactor}`
 *           response per node, and is never a keyframe of its own
 *   AC-1631 the nowrap threshold is a WIDTH derived from the ladder's single-line
 *           suffix — never the first single-line width found
 *
 * Every probe drives the real `foldToL1` / `partitionProbes` / `validateL1` /
 * `renderL1Document` entry points over synthetic multi-viewport captures — real
 * components, no mocks.
 *
 * Boundary: AC-1631 pins the FOLD's side of the nowrap axis (its derivation and
 * carrying). What the renderer spends the threshold on above that width is the
 * structured copy-editing capability's wrapping floor (CAP-70, STORY-83 /
 * AC-1010), proven in tests/reconciliation-nowrap-width-floor.test.ts — this file
 * must not re-prove it.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, partitionProbes } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

/** The fixed sampled width ladder `1c capture page` walks. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** The ladder's viewport heights — deliberately varying, as the real one does. */
const LADDER_H: Record<number, number> = { 320: 800, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }

interface ProjSpec {
  width: number
  height: number
  elements: ValueElement[]
  sections?: Array<{ box: { x: number; y: number; width: number; height: number } }>
}

/** A resting `MultiStateCapture` from an explicit projection list. */
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

/** A ladder-shaped capture from a per-width element list. */
function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  return multi(LADDER.map((width) => ({ width, height: LADDER_H[width], elements: elementsAt(width) })))
}

/** A styled text run at one width, spanning the fields the fold reads. */
function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
}

/** A run that renders on exactly `n` lines (what `renderedTextBox` reports). */
function lines(el: ValueElement, n: number): ValueElement {
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 29 * n - 8 } }
}

/** Every node in a folded document, flattened. */
function allNodes(doc: L1Document): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const walk = (n: Record<string, unknown>): void => {
    out.push(n)
    for (const c of (n.children as Array<Record<string, unknown>>) ?? []) walk(c)
  }
  walk(doc.root as never)
  return out
}

/** The folded text leaf carrying `text`. */
function textNode(doc: L1Document, text: string): Record<string, unknown> {
  const n = allNodes(doc).find((x) => x.kind === 'text' && x.text === text)
  expect(n, `a text leaf for ${JSON.stringify(text)}`).toBeDefined()
  return n!
}

type ScalarTrack = { keyframes: Array<{ at: number; value: number }>; segments?: unknown }

/** The body of the `@media (min-width: <at>px)` block, so an assertion cannot
 *  drift into a neighbouring breakpoint's rules. */
function mediaBlock(css: string, at: number): string {
  const marker = `@media (min-width: ${at}px) {`
  const i = css.indexOf(marker)
  expect(i, `a @media block at ${at}px in:\n${css.slice(0, 400)}`).toBeGreaterThan(-1)
  const rest = css.slice(i + marker.length)
  const end = rest.indexOf('\n}')
  return end === -1 ? rest : rest.slice(0, end)
}

// ── AC-1625: a varying numeric axis folds to a per-width track ────────────────

/** The size the reference scales the headline to at each captured width. */
const HEAD_SIZE: Record<number, number> = { 320: 28, 375: 30, 768: 40, 1024: 52, 1280: 64, 1440: 72 }
/** Its line height, varying on the same rungs — a second type axis. */
const HEAD_LEADING: Record<number, number> = { 320: 34, 375: 36, 768: 48, 1024: 62, 1280: 76, 1440: 86 }
/** And its tracking, varying too — the third numeric type axis the AC names. */
const HEAD_TRACKING: Record<number, number> = { 320: 0, 375: 0, 768: -0.5, 1024: -1, 1280: -1.5, 1440: -2 }

describe('AC-1625 a numeric axis that differs across the ladder folds to a per-width track', () => {
  it('test_UAT_AC1625_varying_axis_folds_to_a_track_and_a_constant_one_stays_scalar', () => {
    const doc = foldToL1(
      multiFrom((width) => [
        // The varying run: all three numeric type axes move, and the LEFT/RIGHT
        // padding sides move while top/bottom hold — so one element carries both
        // a varying and a constant side, which is what the AC asks to separate.
        lines(
          run({
            text: 'Fluid Headline',
            box: { x: 24, y: 100, width: Math.min(1160, width - 48), height: 90 },
            fontSizePx: HEAD_SIZE[width],
            lineHeightPx: HEAD_LEADING[width],
            letterSpacingPx: HEAD_TRACKING[width],
            paddingLeftPx: width >= 1024 ? 32 : 12,
            paddingRightPx: width >= 1024 ? 32 : 12,
            paddingTopPx: 12,
            paddingBottomPx: 12,
          }),
          1,
        ),
        // The constant run: every axis holds one value across the whole ladder.
        lines(
          run({
            text: 'Standing Tagline',
            box: { x: 24, y: 260, width: Math.min(600, width - 48), height: 29 },
            fontSizePx: 18,
            lineHeightPx: 29,
            letterSpacingPx: 0,
            paddingLeftPx: 8,
            paddingRightPx: 8,
            paddingTopPx: 8,
            paddingBottomPx: 8,
          }),
          1,
        ),
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)

    // ── The varying run: one track per varying axis ───────────────────────────
    const headline = textNode(doc, 'Fluid Headline')
    const tracks = headline.responsive as Record<string, ScalarTrack | undefined>
    expect(tracks, 'the varying run carries responsive type tracks').toBeDefined()

    for (const [axis, expected] of [
      ['fontSizePx', HEAD_SIZE],
      ['lineHeightPx', HEAD_LEADING],
      ['letterSpacingPx', HEAD_TRACKING],
    ] as Array<[string, Record<number, number>]>) {
      const track = tracks[axis]
      expect(track, `a ${axis} track`).toBeDefined()
      // One keyframe per sampled width the axis is present at, each equal to
      // that width's captured value.
      expect(track!.keyframes).toEqual(LADDER.map((at) => ({ at, value: expected[at] })))
      // Segments are OMITTED, so the default transition is `interpolate` —
      // mirroring geometry's fluid default rather than snapping between rungs.
      expect(track!.segments).toBeUndefined()
      // The widest keyframe equals the scalar the leaf would otherwise carry, so
      // a non-responsive consumer reading `axes.<name>` still sees the desktop
      // value the fold has always given it.
      const scalar = (headline.axes as Record<string, number>)[axis]
      expect(track!.keyframes[track!.keyframes.length - 1].value).toBe(scalar)
      expect(scalar).toBe(expected[1440])
    }

    // ── …and per padding SIDE, independently ─────────────────────────────────
    const padTracks = headline.responsivePadding as Record<string, ScalarTrack | undefined>
    expect(padTracks.leftPx?.keyframes).toEqual(LADDER.map((at) => ({ at, value: at >= 1024 ? 32 : 12 })))
    expect(padTracks.rightPx?.keyframes).toEqual(LADDER.map((at) => ({ at, value: at >= 1024 ? 32 : 12 })))
    // A side that does NOT vary on the SAME element earns no track and stays a
    // plain scalar — this is the pair the AC exists to separate.
    expect(padTracks.topPx).toBeUndefined()
    expect(padTracks.bottomPx).toBeUndefined()
    expect((headline.padding as Record<string, number>).topPx).toBe(12)
    expect((headline.padding as Record<string, number>).bottomPx).toBe(12)

    // ── The constant run: NO track at all, for either family ─────────────────
    const tagline = textNode(doc, 'Standing Tagline')
    expect(tagline.responsive).toBeUndefined()
    expect(tagline.responsivePadding).toBeUndefined()
    // …while its scalars are intact — the absence is "no track", not "no axis".
    expect((tagline.axes as Record<string, number>).fontSizePx).toBe(18)
    expect((tagline.padding as Record<string, number>).leftPx).toBe(8)

    // ── Rendering at a narrow sampled width paints the NARROW value ───────────
    const { css } = renderL1Document(doc)
    const base = css.split('@media')[0]
    // The base rule carries the mobile size (the smallest-width keyframe)…
    expect(base).toMatch(/font-size: 28px/)
    expect(base).toMatch(/padding-left: 12px/)
    // …and the desktop value appears ONLY above its breakpoint. If the track were
    // dropped and the scalar replayed everywhere, 72px would sit in the base rule.
    expect(base).not.toMatch(/font-size: 72px/)
    expect(base).not.toMatch(/padding-left: 32px/)
    // …and it appears in the widest breakpoint's own block, where the track
    // resolves to the flat desktop value.
    const widest = mediaBlock(css, 1440)
    expect(widest).toMatch(/font-size: 72px/)
    expect(widest).toMatch(/line-height: 86px/)
    expect(widest).toMatch(/letter-spacing: -2px/)
    expect(widest).toMatch(/padding-left: 32px/)
    // The padding step lands on ITS rung, not the type axis's: 1024 is where the
    // left/right pad reaches 32, and it is still 12 in the block below it.
    expect(mediaBlock(css, 1024)).toMatch(/padding-left: calc\(32px/)
    expect(mediaBlock(css, 768)).toMatch(/padding-left: calc\(12px/)
  })
})

// ── AC-1626: per-side padding folds onto the leaf and insets within the box ───

/** The captured border box of the padded badge at one width. */
const BADGE_BOX = (width: number) => ({ x: 24, y: 100, width: Math.min(240, width - 48), height: 48 })

describe('AC-1626 per-side padding folds onto the leaf and insets within its pinned box', () => {
  it('test_UAT_AC1626_per_side_padding_folds_and_insets_within_the_pinned_box', () => {
    const doc = foldToL1(
      multiFrom((width) => [
        // Asymmetric, non-zero on all four sides — and CONSTANT across the ladder,
        // so this is the static `padding` axis, not AC-1625's track.
        lines(
          run({
            text: 'Coming soon',
            box: BADGE_BOX(width),
            paddingTopPx: 4,
            paddingRightPx: 12,
            paddingBottomPx: 8,
            paddingLeftPx: 16,
          }),
          1,
        ),
        // No padding recorded at all.
        lines(run({ text: 'Unpadded copy', box: { x: 24, y: 200, width: 400, height: 29 } }), 1),
        // Recorded, but every side zero — the fold must treat this as "none".
        lines(
          run({
            text: 'Zero padded copy',
            box: { x: 24, y: 260, width: 400, height: 29 },
            paddingTopPx: 0,
            paddingRightPx: 0,
            paddingBottomPx: 0,
            paddingLeftPx: 0,
          }),
          1,
        ),
        // The AC names text, image AND box leaves — a padded media element proves
        // the axis is not text-only.
        {
          text: '',
          role: 'img',
          color: '',
          fontFamily: '',
          fontSizePx: 0,
          fontWeight: 0,
          textless: true,
          a11yRole: 'img',
          objectFit: 'cover',
          intrinsicAspect: 1.5,
          src: '/img/badge.png',
          alt: 'Badge',
          box: { x: 24, y: 320, width: 200, height: 120 },
          paddingTopPx: 6,
          paddingLeftPx: 10,
        } as ValueElement,
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)

    // ── The four sides fold independently, as captured ────────────────────────
    const badge = textNode(doc, 'Coming soon')
    expect(badge.padding).toEqual({ topPx: 4, rightPx: 12, bottomPx: 8, leftPx: 16 })

    // ── …and the pinned box is UNCHANGED by the fold of the padding ───────────
    // The capture measures a BORDER box, so the pad is already inside the
    // geometry. Inflating the box here would move everything below the badge.
    const kfs = badge.geometry as { keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> }
    expect(kfs.keyframes.map((k) => k.at)).toEqual(LADDER)
    for (const at of LADDER) {
      const kf = kfs.keyframes.find((k) => k.at === at)!
      const box = BADGE_BOX(at)
      expect(kf.x, `x at ${at}`).toBe(Math.round(box.x))
      expect(kf.y, `y at ${at}`).toBe(Math.round(box.y))
      // Neither the left+right pad (28px) nor the top+bottom pad has been added
      // to the captured extent.
      expect(kf.width, `width at ${at}`).toBe(Math.ceil(box.width))
    }

    // ── No positive side anywhere → no `padding` axis at all ──────────────────
    expect(textNode(doc, 'Unpadded copy').padding).toBeUndefined()
    expect(textNode(doc, 'Zero padded copy').padding).toBeUndefined()

    // ── The same axis on an image leaf, with absent sides dropped ─────────────
    const image = allNodes(doc).find((n) => n.kind === 'image')
    expect(image, 'a folded image leaf').toBeDefined()
    expect(image!.padding).toEqual({ topPx: 6, leftPx: 10 })

    // ── Render: the content is INSET inside the pinned box, not the box grown ──
    const { css } = renderL1Document(doc)
    // `box-sizing: border-box` is what makes the inset an inset: padding eats
    // into the declared width rather than adding to it.
    expect(css).toContain('box-sizing: border-box')
    expect(css).toContain('padding-top: 4px')
    expect(css).toContain('padding-right: 12px')
    expect(css).toContain('padding-bottom: 8px')
    expect(css).toContain('padding-left: 16px')
    // The badge's own declared extent is still the CAPTURED border-box width —
    // the proof that folding the pad did not inflate the geometry.
    expect(css).toMatch(new RegExp(`width: ${Math.ceil(BADGE_BOX(1440).width)}px`))
    // An absent side never emits — no side resets another.
    expect(css).toContain('padding-left: 10px')
    expect(css).not.toContain('padding-right: 0px')
  })
})

// ── AC-1631: the nowrap threshold is the ladder's single-line suffix ──────────

/** Fold a ladder whose run occupies `lineCount(width)` lines, and read its axis. */
function nowrapFrom(lineCount: (width: number) => number, text = 'Checklist item'): {
  axis: number | undefined
  doc: L1Document
} {
  const doc = foldToL1(
    multiFrom((width) => [
      lines(run({ text, box: { x: 24, y: 100, width: Math.min(300, width - 48), height: 24 } }), lineCount(width)),
    ]),
  )
  return { axis: (textNode(doc, text).axes as { nowrapFromPx?: number }).nowrapFromPx, doc }
}

describe('AC-1631 the nowrap threshold is a width derived from the ladder single-line suffix', () => {
  it('test_UAT_AC1631_nowrap_threshold_is_the_ladders_single_line_suffix', () => {
    // ── Single-line everywhere → the NARROWEST sampled width ─────────────────
    const everywhere = nowrapFrom(() => 1)
    expect(everywhere.axis).toBe(320)
    expect(validateL1(everywhere.doc).ok).toBe(true)

    // ── The suffix rule, not the first single-line width found ────────────────
    // One line at the narrow rungs AND at the wide ones, but wrapping at 768 and
    // 1024 in between. The threshold is the rung immediately ABOVE the widest
    // wrapping one (1280) — never 320, which is single-line but whose suffix is
    // broken. Responsive type can grow faster than its column, and a threshold
    // may never claim more than the reference showed.
    const dip = nowrapFrom((w) => (w === 768 || w === 1024 ? 2 : 1))
    expect(dip.axis).toBe(1280)
    expect(dip.axis).not.toBe(320)
    expect(validateL1(dip.doc).ok).toBe(true)

    // ── An unmeasurable line count BREAKS the suffix ──────────────────────────
    // The widest sample has no recorded glyph extent, while every narrower one
    // reads as a clean single line. Reading "unknown" as "one line" would pin a
    // real paragraph unbreakable and overprint whatever sits absolutely below it,
    // so the fold emits nothing.
    const unmeasurableAtWidest = foldToL1(
      multiFrom((width) => [
        width === 1440
          ? // No `renderedTextBox` → the line count cannot be measured here.
            run({ text: 'Widest unmeasured', box: { x: 24, y: 100, width: 300, height: 29 } })
          : lines(run({ text: 'Widest unmeasured', box: { x: 24, y: 100, width: 300, height: 29 } }), 1),
      ]),
    )
    const brokenSuffix = textNode(unmeasurableAtWidest, 'Widest unmeasured')
    expect((brokenSuffix.axes as { nowrapFromPx?: number }).nowrapFromPx).toBeUndefined()
    // The document is still a valid L1 envelope with the axis absent — the fold
    // emits nothing rather than a guess.
    expect(validateL1(unmeasurableAtWidest).ok).toBe(true)

    // ── A run that wrapped at the widest sample carries NO axis ───────────────
    const wrapsEverywhere = nowrapFrom(() => 3, 'A long paragraph of body copy')
    expect(wrapsEverywhere.axis).toBeUndefined()
    expect(validateL1(wrapsEverywhere.doc).ok).toBe(true)

    // Single-line at the narrow rungs but wrapping at the widest is the same
    // case: the suffix never closes, so nothing is carried.
    expect(nowrapFrom((w) => (w >= 1280 ? 2 : 1)).axis).toBeUndefined()

    // ── It is a WIDTH, not a flag ─────────────────────────────────────────────
    // Three runs on one page resolve to three DIFFERENT thresholds. A boolean
    // could only ever be set for a run that never wraps anywhere, which is the
    // defect this axis was introduced to fix.
    expect(new Set([everywhere.axis, dip.axis, nowrapFrom((w) => (w >= 768 ? 1 : 3)).axis])).toEqual(
      new Set([320, 1280, 768]),
    )
  })
})

// ── AC-1627: a viewport-HEIGHT probe yields a measured response, never a cell ──

/**
 * A page whose first section is viewport-height-relative (`min-h-screen`), the
 * content below it pushed down by the same amount, a card below the fold, and a
 * hero title that sits above it and must not move. `withProbe` re-shoots 1280 at
 * a second viewport height — the finite-difference pair.
 */
function heroPage(withProbe: boolean): MultiStateCapture {
  const at = (width: number, height: number): ProjSpec => ({
    width,
    height,
    elements: [
      // Above the fold — unaffected by viewport height.
      lines(run({ text: 'Hero title', box: { x: 24, y: 79, width: 400, height: 90 } }), 1),
      // Below the fold — pushed down one-for-one with the viewport.
      lines(run({ text: 'Below the fold', box: { x: 24, y: height + 96, width: 400, height: 40 } }), 1),
      // A full-bleed run per band, so the band reconstruction has content.
      lines(run({ text: 'hero band', surfaceFill: '#030717', box: { x: 0, y: 300, width, height: 29 } }), 1),
      lines(run({ text: 'lower band', surfaceFill: '#e8dfd3', box: { x: 0, y: height + 200, width, height: 29 } }), 1),
      // A narrow painted panel below the fold → reconstructed as a CARD surface,
      // which must inherit the response of the row it was reconstructed from.
      lines(
        run({ text: 'Card label', surfaceFill: '#ffffff', box: { x: 40, y: height + 300, width: 400, height: 60 } }),
        1,
      ),
    ],
    sections: [
      { box: { x: 0, y: 0, width, height } },
      { box: { x: 0, y: height, width, height: 600 } },
    ],
  })
  const specs = LADDER.map((w) => at(w, LADDER_H[w]))
  return multi(withProbe ? [...specs, at(1280, 1000)] : specs)
}

type Response = { yFactor?: number; heightFactor?: number } | undefined
const responseOf = (n: Record<string, unknown> | undefined): Response =>
  (n?.geometry as { viewportResponse?: Response } | undefined)?.viewportResponse

/** A deep clone with every `viewportResponse` removed — the document *minus* the
 *  height axis, so "the rest is unchanged" can be compared byte for byte. */
function stripResponses(doc: L1Document): unknown {
  return JSON.parse(JSON.stringify(doc, (key, value) => (key === 'viewportResponse' ? undefined : value)))
}

describe('AC-1627 a viewport-height probe yields a measured response and is never a keyframe', () => {
  it('test_UAT_AC1627_height_probe_yields_a_measured_response_and_is_never_a_keyframe', () => {
    const doc = foldToL1(heroPage(true))
    expect(validateL1(doc).ok).toBe(true)

    // ── The measured finite difference over the probe pair ────────────────────
    // The hero section is `min-h-screen`: its height tracks the viewport
    // one-for-one, and it does not move.
    const hero = allNodes(doc).find((n) => n.id === 'section-band-0')
    expect(hero, 'the hero band').toBeDefined()
    expect(responseOf(hero)?.heightFactor).toBe(1)
    expect(responseOf(hero)?.yFactor).toBeUndefined()

    // The content below it is pushed down by the same amount — the half a
    // per-node view would miss.
    expect(responseOf(textNode(doc, 'Below the fold'))?.yFactor).toBe(1)

    // ── A node UNAFFECTED by viewport height carries no response ──────────────
    // The hero title sits above the fold. Its box is identical in the probe pair,
    // so the measured difference is zero and the fold emits nothing rather than a
    // zero-valued axis.
    expect(responseOf(textNode(doc, 'Hero title'))).toBeUndefined()

    // ── A probe is evidence, never a keyframe ─────────────────────────────────
    // It adds no geometry keyframe, no extra ladder cell and no duplicate width.
    const { ladder, probes } = partitionProbes(heroPage(true).projections)
    expect(ladder.map((p) => p.viewport.width)).toEqual(LADDER)
    expect(probes.map((p) => `${p.viewport.width}x${p.viewport.height}`)).toEqual(['1280x1000'])
    for (const node of allNodes(doc)) {
      const geo = node.geometry as { keyframes?: Array<{ at: number; atHeight?: number }> } | undefined
      if (!geo?.keyframes) continue
      const ats = geo.keyframes.map((k) => k.at)
      // Every folded node keyframes on the ladder alone — 1280 appears once.
      expect(new Set(ats).size, `duplicate keyframe width on ${String(node.id ?? node.kind)}`).toBe(ats.length)
      for (const a of ats) expect(LADDER).toContain(a)
      // ── Each response is applied against its OWN keyframe's captured height ──
      // so a keyframe still evaluates to exactly its captured pixels at capture
      // size: `base + factor * (100vh - base)` is `base` when 100vh === base.
      for (const kf of geo.keyframes) expect(kf.atHeight).toBe(LADDER_H[kf.at])
    }
    // The identity, in the emitted CSS: at the 320-rung's captured height (800px)
    // the hero's calc reduces to the 800px it was captured at.
    expect(renderL1Document(doc).css).toMatch(/height: calc\(800px \+ \(100vh - 800px\)\)/)

    // ── A reconstructed surface inherits its representative row's response ─────
    const card = allNodes(doc).find((n) => typeof n.id === 'string' && (n.id as string).startsWith('card-'))
    expect(card, 'a reconstructed card surface').toBeDefined()
    expect(responseOf(card)).toEqual(responseOf(textNode(doc, 'Card label')))
    // …and that inherited response is the real one, not a shared `undefined`.
    expect(responseOf(card)?.yFactor).toBe(1)

    // ── No probe → no response invented, and nothing else changes ─────────────
    // The ladder alone varies width and height together, so the axis is not
    // identifiable. The honest answer is to emit nothing rather than to guess
    // from a correlation.
    const noProbe = foldToL1(heroPage(false))
    for (const node of allNodes(noProbe)) expect(responseOf(node)).toBeUndefined()
    // The rest of the document is byte-for-byte what it folded before: the probe
    // contributed the height axis and nothing else.
    expect(stripResponses(noProbe)).toEqual(stripResponses(doc))
  })
})
