/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document…", the **surface-reconstruction** upgrade
 * (BUG-13/14/17/19/20/21/22/24 + REQ-88, bundle BUNDLE-10).
 *
 * The story's earlier criteria are proven in the two companion files:
 *   - AC-689…AC-696 → tests/reconciliation-l1-fold.test.ts (the text-only fold)
 *   - AC-729…AC-733 → tests/reconciliation-l1-fold-full-language.test.ts
 *
 * This file proves the criteria this upgrade added, one UAT per AC:
 *
 *   AC-752  a section band tiles full-bleed between the page's own captured
 *           section edges — its top snapped up to the edge that opens it, its
 *           bottom clamped to the first edge past its content, never crossing
 *           into the band above
 *   AC-753  a distributed full-bleed bar (a footer / nav strip) folds as a band,
 *           while an evenly-tiled card grid stays separate cards
 *   AC-754  a card adopts the captured surface-bearing element's own rect and
 *           radius (that rect being its grouping identity), a viewport-wide
 *           surface is refused as a card, and with no surface shape the card is
 *           exactly its runs' union — nothing invented
 *   AC-755  a run whose own element paints its surface folds as a chip on the
 *           text leaf and contributes no card box
 *   AC-756  no folded surface box is outset by padding its captured box already
 *           includes, and no padding is inferred
 *   AC-757  an accent rule folds onto the bearing element's rect, not the run
 *           that element insets
 *   AC-758  a section's background image and translucent scrim fold to one box
 *           painted beneath the cards and the content
 *
 * Every probe drives the real `foldToL1` / `validateL1` / `renderL1Document`
 * entry points over synthetic multi-viewport captures — real components, no
 * mocks of anything we own.
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src'
import { foldToL1 } from '../tools/generate/src'
import type {
  MultiStateCapture,
  SectionValues,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

/** The fixed sampled width ladder `1c capture page` walks. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]

const CREAM = '#e8dfd3'
const DARK = '#030717'
const NAVY = '#0f172b'
const TILE = '#ece6dd'
const PANEL = '#f8f5f2'
const HERO_URL = 'https://cdn.example.com/hero.jpg'
const VEIL = { color: '#020618', opacity: 0.3 }
/** The saturating sentinel a `rounded-full` utility computes to in a real browser. */
const ROUNDED_FULL = 33554400

type Rect = NonNullable<ValueElement['box']>

/** A styled text run at one width. */
function run(text: string, box: Rect, over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'text', color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400, box, ...over }
}

/** A captured section band entry. */
function section(index: number, box: Rect, over: Partial<SectionValues> = {}): SectionValues {
  return { index, overlay: null, contentAnchorRatio: null, box, ...over }
}

/** A resting `MultiStateCapture` over the ladder from per-width elements + sections. */
function multiFrom(
  elementsAt: (width: number) => ValueElement[],
  sectionsAt: (width: number) => SectionValues[] = () => [],
): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `fold@${width}`,
      elements: elementsAt(width),
      sections: sectionsAt(width),
      viewport: { width, height: 1200 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

type Doc = ReturnType<typeof foldToL1>
type Kid = {
  kind: string
  id?: string
  text?: string
  axes?: Record<string, unknown>
  padding?: Record<string, number>
  geometry: { keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> }
}

const childrenOf = (doc: Doc): Kid[] => ((doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as unknown as Kid[])
const boxesOf = (doc: Doc): Kid[] => childrenOf(doc).filter((n) => n.kind === 'box')
const bandsOf = (doc: Doc): Kid[] => boxesOf(doc).filter((b) => (b.id ?? '').startsWith('section-band-'))
const cardsOf = (doc: Doc): Kid[] => boxesOf(doc).filter((b) => (b.id ?? '').startsWith('card-'))
const textsOf = (doc: Doc): Kid[] => childrenOf(doc).filter((n) => n.kind === 'text')
const kfAt = (n: Kid, at: number) => n.geometry.keyframes.find((k) => k.at === at)
const rectAt = (n: Kid, at: number): Rect => {
  const k = kfAt(n, at)
  expect(k, `${n.id ?? n.text} must have a keyframe at ${at}`).toBeDefined()
  return { x: k!.x, y: k!.y, width: k!.width, height: k!.height as number }
}

// ── AC-752: a band tiles full-bleed between the captured section edges ─────────

/**
 * A dark hero section closing at y=800, then a cream section whose first text run
 * does not start until y=896 — the 96px of section padding neither band may eat.
 */
function heroThenPaddedSection(): MultiStateCapture {
  return multiFrom(
    (w) => [
      run('Intentional Software', { x: 40, y: 300, width: w - 80, height: 40 }, { surfaceFill: DARK }),
      run('A Different Approach', { x: 40, y: 896, width: w - 80, height: 40 }, { surfaceFill: CREAM }),
    ],
    (w) => [
      section(0, { x: 0, y: 0, width: w, height: 800 }),
      section(1, { x: 0, y: 800, width: w, height: 600 }),
    ],
  )
}

describe('AC-752 — a section band is bounded by the page’s own captured section edges', () => {
  it('test_UAT_AC752_band_tiles_full_bleed_between_captured_section_edges', () => {
    const doc = foldToL1(heroThenPaddedSection())
    const dark = bandsOf(doc).find((b) => b.axes?.surfaceFill === DARK)
    const cream = bandsOf(doc).find((b) => b.axes?.surfaceFill === CREAM)
    expect(dark, 'the hero fill folds to a section band').toBeDefined()
    expect(cream, 'the following section fill folds to a section band').toBeDefined()

    const dk = kfAt(dark!, 1280)!
    const ck = kfAt(cream!, 1280)!

    // TOP — snapped up to the section edge that OPENS the band, not the first run.
    // Taking the run leaves a 96px sliver of the page showing above the band.
    expect(ck.y, 'the cream band opens at its section edge').toBe(800)
    expect(ck.y).not.toBe(896)

    // …and the snap never crosses into the band above's content. Edge y=0 also sits
    // at-or-below the cream band's first run; taking the smallest qualifying edge
    // would climb the band over the whole hero.
    expect(ck.y, 'the snap may not cross the band above').toBeGreaterThanOrEqual(dk.y + (dk.height ?? 0))
    expect(ck.y).not.toBe(0)

    // BOTTOM — clamped to the captured section edge, not the next band's first run,
    // so the padded section that follows is not painted near-black.
    expect(dk.y + (dk.height ?? 0), 'the hero band stops at its section edge').toBe(800)
    expect(dk.y + (dk.height ?? 0)).not.toBe(896)

    // …but a band still tiles past its OWN content while it stays in its section:
    // the hero's text ends at y=340 and the band must cover the whole section.
    expect(dk.y + (dk.height ?? 0), 'the band tiles past its own content').toBeGreaterThan(340)

    // Every band keyframe is full-bleed at every sampled width.
    for (const band of [dark!, cream!]) {
      expect(band.geometry.keyframes.map((k) => k.at)).toEqual(LADDER)
      for (const k of band.geometry.keyframes) {
        expect(k.x, `${band.id} x at ${k.at}`).toBe(0)
        expect(k.width, `${band.id} width at ${k.at}`).toBe(k.at)
      }
    }
  })
})

// ── AC-753: a distributed bar is a band; an evenly-tiled grid stays cards ──────

describe('AC-753 — a distributed full-bleed bar folds as a band, a tiled grid does not', () => {
  it('test_UAT_AC753_distributed_bar_folds_as_a_band_while_a_tiled_grid_stays_cards', () => {
    // A tan section band, then a footer bar: three narrow navy runs on one row,
    // hugging the left and right edges with a large central gap (space-between).
    const bar = foldToL1(
      multiFrom((w) => [
        run('Heading', { x: 50, y: 100, width: w - 100, height: 40 }, { surfaceFill: CREAM }),
        run('Intro', { x: 50, y: 160, width: w - 100, height: 40 }, { surfaceFill: CREAM }),
        run('© Studio 2025', { x: 50, y: 900, width: 160, height: 24 }, { surfaceFill: NAVY }),
        run('LinkedIn', { x: w - 160, y: 900, width: 60, height: 24 }, { surfaceFill: NAVY }),
        run('GitHub', { x: w - 90, y: 900, width: 50, height: 24 }, { surfaceFill: NAVY }),
      ]),
    )
    const navyBand = bandsOf(bar).find((b) => b.axes?.surfaceFill === NAVY)
    expect(navyBand, 'the distributed footer bar folds to one section band').toBeDefined()
    // One full-bleed band, not one tiny box per run.
    for (const k of navyBand!.geometry.keyframes) {
      expect(k.x, `bar band x at ${k.at}`).toBe(0)
      expect(k.width, `bar band width at ${k.at}`).toBe(k.at)
    }
    expect(cardsOf(bar).filter((c) => c.axes?.surfaceFill === NAVY), 'no per-run navy cards remain').toHaveLength(0)

    // …and the fill actually paints across the strip in the rendered output.
    expect(renderL1Document(bar).css.toLowerCase()).toContain(NAVY)

    // An evenly-tiled card grid spans the same width with several small, EVEN gaps.
    // It is explicitly not a bar and must stay separate card boxes.
    const grid = foldToL1(
      multiFrom((w) => [
        run('Section heading', { x: 50, y: 100, width: w - 100, height: 40 }, { surfaceFill: CREAM }),
        run('Presence', { x: 100, y: 300, width: 220, height: 30 }, { surfaceFill: TILE }),
        run('Positivity', { x: 360, y: 300, width: 220, height: 30 }, { surfaceFill: TILE }),
        run('Connection', { x: 620, y: 300, width: 220, height: 30 }, { surfaceFill: TILE }),
      ]),
    )
    expect(bandsOf(grid).some((b) => b.axes?.surfaceFill === TILE), 'a tile row is not a bar').toBe(false)
    expect(cardsOf(grid).filter((c) => c.axes?.surfaceFill === TILE), 'the tiles stay separate cards').toHaveLength(3)
  })
})

// ── AC-754: a card is the captured surface rect; that rect is its identity ─────

/** A run whose surface is painted by an ancestor with its own rect + rounding. */
function onSurface(text: string, box: Rect, surfaceBox: Rect, over: Partial<ValueElement> = {}): ValueElement {
  return run(text, box, {
    surfaceFill: PANEL,
    surface: { self: false, box: surfaceBox, borderRadiusPx: 8, boxShadow: null, border: null },
    ...over,
  })
}

/** A full-width section fill, so the panels under test read as cards on a band. */
const bandRun = (w: number): ValueElement =>
  run('Our Mission', { x: 24, y: 1351, width: w - 48, height: 40 }, { surfaceFill: '#d9ccba' })

describe('AC-754 — a card adopts the captured surface rect and radius', () => {
  it('test_UAT_AC754_card_adopts_the_captured_surface_rect_radius_and_identity', () => {
    // 1. The panel's own measured rect and rounding, at EVERY sampled width — not
    //    the runs' union (inset by an asymmetric 36/32 margin no vertical-rhythm
    //    estimate could recover) and not that union outset by any estimate. Both
    //    runs are square; the rounding lives on the panel element.
    const surfaceAt = (w: number): Rect => ({ x: 24, y: 2119, width: Math.round(w * 0.6), height: 332 })
    const one = foldToL1(
      multiFrom((w) => [
        bandRun(w),
        onSurface('Sanctum Voice', { x: 60, y: 2151, width: 120, height: 32 }, surfaceAt(w)),
        onSurface('Your private space to think out loud', { x: 60, y: 2199, width: Math.round(w * 0.6) - 72, height: 44 }, surfaceAt(w)),
      ]),
    )
    expect(validateL1(one).ok, 'the fold stays inside the L1 envelope').toBe(true)
    const panel = cardsOf(one).find((b) => b.axes?.surfaceFill === PANEL)
    expect(panel, 'the two runs fold into ONE card').toBeDefined()
    for (const w of LADDER) expect(rectAt(panel!, w), `card rect at ${w}`).toEqual(surfaceAt(w))
    expect(panel!.axes?.borderRadiusPx, 'the radius comes from the surface-bearing box').toBe(8)

    // 2. The rect is the card's grouping IDENTITY: three sibling tiles each with
    //    their own surface neither merge into one box nor drift off their rects.
    const TILES: Rect[] = [
      { x: 88, y: 1525, width: 277, height: 192 },
      { x: 397, y: 1525, width: 277, height: 192 },
      { x: 707, y: 1525, width: 277, height: 192 },
    ]
    const siblings = foldToL1(
      multiFrom((w) => [
        bandRun(w),
        ...TILES.flatMap((t, i) => [
          onSurface(`Title ${i}`, { x: t.x + 24, y: t.y + 24, width: 229, height: 28 }, t),
          onSurface(`Body ${i}`, { x: t.x + 24, y: t.y + 64, width: 229, height: 104 }, t),
        ]),
      ]),
    )
    expect(
      cardsOf(siblings)
        .map((b) => rectAt(b, 1280))
        .sort((a, b) => a.x - b.x),
    ).toEqual(TILES)

    // 3. A surface as wide as the viewport is the BAND, not a card: the run keeps
    //    its own box, so a narrow accent rule is not stretched across the section.
    const RUN_BOX = { x: 116, y: 1757, width: 868, height: 29 }
    const wide = foldToL1(
      multiFrom((w) => [
        run('These aren’t just features', RUN_BOX, {
          surfaceFill: '#d9ccba',
          borderLeft: { widthPx: 4, color: '#00d492' },
          surface: { self: false, box: { x: 0, y: 1288, width: w, height: 595 }, borderRadiusPx: 12, boxShadow: null, border: null },
        }),
      ]),
    )
    const quote = cardsOf(wide).find((b) => (b.axes?.borderLeft as { color?: string } | undefined)?.color === '#00d492')
    expect(quote, 'the accent run still folds a card box').toBeDefined()
    const qk = rectAt(quote!, 1280)
    expect({ x: qk.x, width: qk.width, height: qk.height }, 'the band rect is refused').toEqual({
      x: RUN_BOX.x,
      width: RUN_BOX.width,
      height: RUN_BOX.height,
    })
    expect(quote!.axes?.borderRadiusPx, 'the band’s rounding does not leak onto it').toBeUndefined()

    // 4. Where the capture resolved NO surface shape, the card is exactly the union
    //    of its runs — no padding estimated, no edge pushed out or pulled in.
    const noShape = foldToL1(
      multiFrom((w) => [
        run('Band', { x: 0, y: 60, width: w, height: 40 }, { surfaceFill: '#f0ece6' }),
        run('Card title', { x: 120, y: 200, width: 300, height: 32 }, {
          surfaceFill: '#ffffff',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
        }),
        run('Card body', { x: 100, y: 248, width: 320, height: 24 }, {
          surfaceFill: '#ffffff',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
        }),
      ]),
    )
    const union = cardsOf(noShape).find((b) => b.axes?.surfaceFill === '#ffffff')
    expect(union, 'the multi-run card still folds a box').toBeDefined()
    expect(rectAt(union!, 1280)).toEqual({ x: 100, y: 200, width: 320, height: 72 })
  })
})

// ── AC-755: a self-painting run folds as a chip and contributes no card box ────

/** A card holding a heading, a body run, and a `rounded-full` badge. */
const cardWithBadge = (): MultiStateCapture =>
  multiFrom((w) => [
    run('Our Work', { x: 40, y: 100, width: w - 80, height: 30 }, { surfaceFill: PANEL, borderLeft: { widthPx: 4, color: '#ffb900' } }),
    run('We build things carefully.', { x: 40, y: 140, width: w - 80, height: 24 }, { surfaceFill: PANEL, borderLeft: { widthPx: 4, color: '#ffb900' } }),
    run('Coming soon', { x: 40, y: 180, width: 110, height: 24 }, {
      surfaceFill: '#dbeafe',
      borderLeft: { widthPx: 4, color: '#50a2ff' },
      borderRadiusPx: ROUNDED_FULL,
    }),
  ])

/** The submit control's captured border box — inside the viewport at every width. */
const controlBoxAt = (w: number): Rect => ({ x: w >= 768 ? 413 : 40, y: 3900, width: 123, height: 50 })

/** A page holding a band plus one padded control — the reproduction's contact CTA. */
const pageWithControl = (): MultiStateCapture =>
  multiFrom((w) => [
    run('Get in touch', { x: 40, y: 3800, width: w - 80, height: 30 }, { surfaceFill: '#f0ece6' }),
    run('Subscribe', controlBoxAt(w), {
      surfaceFill: '#009966',
      borderRadiusPx: 8,
      paddingTopPx: 12,
      paddingRightPx: 24,
      paddingBottomPx: 12,
      paddingLeftPx: 24,
    }),
  ])

describe('AC-755 — a run whose own element paints its surface folds as a chip', () => {
  it('test_UAT_AC755_self_painting_runs_fold_as_chips_and_emit_no_card_box', () => {
    // ── family 1: a saturated pill (a `rounded-full` badge) ────────────────────
    const badgeDoc = foldToL1(cardWithBadge())
    const badge = textsOf(badgeDoc).find((t) => t.text === 'Coming soon')
    expect(badge, 'the badge survives as a text leaf').toBeDefined()
    expect(badge!.axes?.surfaceFill, 'the fill rides on the text leaf').toBe('#dbeafe')
    // The authored sentinel radius is clamped into the L1 length range — which
    // paints the identical pill (any radius ≥ half the height saturates).
    const badgeRadius = badge!.axes?.borderRadiusPx as number
    expect(badgeRadius).toBeGreaterThanOrEqual(12)
    expect(badgeRadius).toBeLessThanOrEqual(100_000)
    // …and no box behind it duplicates the pill.
    for (const b of boxesOf(badgeDoc)) expect(b.axes?.surfaceFill, `${b.id}`).not.toBe('#dbeafe')
    // The surface is emitted on the text element itself.
    const badgeCss = renderL1Document(badgeDoc).css
    expect(badgeCss).toContain('#dbeafe')
    expect(badgeCss).toMatch(/border-radius:\s*\d+px/)
    // A bare run on the card gains no chip surface — its fill is the card's.
    for (const t of textsOf(badgeDoc).filter((t) => t.text !== 'Coming soon')) {
      expect(t.axes?.surfaceFill, `${t.text} must not gain a chip fill`).toBeUndefined()
      expect(t.axes?.borderRadiusPx, `${t.text} must not gain a chip radius`).toBeUndefined()
    }
    // Chip axes stay inside the envelope: valid as folded, rejected unclamped.
    expect(validateL1(badgeDoc).ok).toBe(true)
    const overrun = structuredClone(badgeDoc)
    const target = (((overrun.root as { children?: unknown[] }).children ?? []) as Kid[]).find(
      (n) => n.text === 'Coming soon',
    )!
    target.axes = { ...target.axes, borderRadiusPx: ROUNDED_FULL }
    expect(validateL1(overrun).ok, 'an unclamped sentinel radius is rejected').toBe(false)

    // ── family 2: a padded control (an authored vertical inset) ────────────────
    const ctrlDoc = foldToL1(pageWithControl())
    const ctrl = textsOf(ctrlDoc).find((t) => t.text === 'Subscribe')
    expect(ctrl, 'the control survives as a text leaf').toBeDefined()
    expect(ctrl!.axes?.surfaceFill).toBe('#009966')
    expect(ctrl!.axes?.borderRadiusPx).toBe(8)
    for (const w of LADDER) {
      const k = kfAt(ctrl!, w)!
      expect({ x: k.x, width: k.width }, `control box at ${w}`).toEqual({
        x: controlBoxAt(w).x,
        width: controlBoxAt(w).width,
      })
    }
    // No card box behind it — and nothing bleeds past the narrowest viewport.
    for (const b of boxesOf(ctrlDoc)) {
      expect(b.axes?.surfaceFill, `${b.id} must not duplicate the control fill`).not.toBe('#009966')
      const k = kfAt(b, 320)
      if (!k) continue
      expect(k.x, `${b.id} left edge at 320`).toBeGreaterThanOrEqual(0)
      expect(k.x + k.width, `${b.id} right edge at 320`).toBeLessThanOrEqual(320)
    }
    expect(renderL1Document(ctrlDoc).css).toContain('#009966')

    // ── the deliberate non-chip: a modestly-rounded single-run card ────────────
    const cardDoc = foldToL1(
      multiFrom((w) => [
        run('Band', { x: 50, y: 60, width: w - 100, height: 40 }, { surfaceFill: '#f0ece6' }),
        run('Card', { x: 120, y: 200, width: 300, height: 40 }, {
          surfaceFill: '#ffffff',
          borderLeft: { widthPx: 4, color: '#ffb900' },
          borderRadiusPx: 12, // 12*2 = 24 < 40 → not saturated → still a card
        }),
      ]),
    )
    const card = cardsOf(cardDoc)[0]
    expect(card, 'the single-run card keeps its card box').toBeDefined()
    expect(card.axes?.borderLeft, 'and keeps its accent rule').toEqual({ widthPx: 4, color: '#ffb900' })
    expect(card.axes?.borderRadiusPx).toBe(12)
    expect(textsOf(cardDoc).find((t) => t.text === 'Card')!.axes?.borderRadiusPx).toBeUndefined()
  })
})

// ── AC-756: nothing is outset by padding the captured box already includes ─────

describe('AC-756 — no surface box is outset by included padding, and none is inferred', () => {
  it('test_UAT_AC756_surface_boxes_match_their_captured_boxes_and_invent_no_padding', () => {
    const doc = foldToL1(pageWithControl())
    const ctrl = textsOf(doc).find((t) => t.text === 'Subscribe')!

    // The captured box is a BORDER box, so the control folds at its captured width
    // and height at every sampled width — never at twice its height, and never
    // bleeding past the viewport edges at the narrowest width.
    for (const w of LADDER) {
      const captured = controlBoxAt(w)
      const k = kfAt(ctrl, w)!
      expect(k.x, `x at ${w}`).toBe(captured.x)
      expect(k.width, `width at ${w}`).toBe(captured.width)
      expect(k.x, `left edge inside the viewport at ${w}`).toBeGreaterThanOrEqual(0)
      expect(k.x + k.width, `right edge inside the viewport at ${w}`).toBeLessThanOrEqual(w)
    }
    // The padding stays an INSET inside that pinned box — read per edge from that
    // edge's own captured value, never a vertical sum applied horizontally.
    expect(ctrl.padding).toEqual({ topPx: 12, rightPx: 24, bottomPx: 12, leftPx: 24 })

    // No folded box anywhere carries the doubled surface the outset produced.
    for (const b of boxesOf(doc)) {
      for (const k of b.geometry.keyframes) {
        expect(k.x, `${b.id} left edge at ${k.at}`).toBeGreaterThanOrEqual(0)
        expect(k.x + k.width, `${b.id} right edge at ${k.at}`).toBeLessThanOrEqual(k.at)
      }
    }

    // …and the control renders at its captured size, padding inset within it.
    const { html, css } = renderL1Document(doc)
    expect(html).toContain('Subscribe')
    const rule = css.split('\n').find((l) => l.includes('#009966') && l.includes('padding-top'))
    expect(rule, 'the control carries its own surface + padding').toBeDefined()
    expect(rule!).toMatch(/padding-top:\s*12px/)
    expect(rule!).toMatch(/padding-left:\s*24px/)
    expect(css).toMatch(/width:\s*123px/)
    expect(css, 'the doubled surface (2x height, +50 width) is gone').not.toMatch(/width:\s*173px/)
    expect(css).not.toMatch(/height:\s*100px/)

    // A card whose surface the capture did not resolve gains no padding at all —
    // no scalar derived from one width's row height, applied on all four sides.
    const noShape = foldToL1(
      multiFrom((w) => [
        run('Band', { x: 0, y: 60, width: w, height: 40 }, { surfaceFill: '#f0ece6' }),
        run('Card title', { x: 120, y: 200, width: 300, height: 32 }, {
          surfaceFill: '#ffffff',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
        }),
        run('Card body', { x: 100, y: 248, width: 320, height: 24 }, {
          surfaceFill: '#ffffff',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
        }),
      ]),
    )
    const union = cardsOf(noShape).find((b) => b.axes?.surfaceFill === '#ffffff')!
    // Exactly the union of its two runs (x 100..420, y 200..272) at every width.
    for (const w of LADDER) expect(rectAt(union, w), `union at ${w}`).toEqual({ x: 100, y: 200, width: 320, height: 72 })
  })
})

// ── AC-757: an accent rule folds onto the bearing element's rect ───────────────

describe('AC-757 — an accent rule is drawn on the rect of the element that bears it', () => {
  it('test_UAT_AC757_accent_rule_uses_the_bearing_rect_not_the_run_it_insets', () => {
    // 1. A fill-less wrapper bears the rule and insets its run by 28px. The run's
    //    composited fill resolves past the wrapper to the section band, which the
    //    fold discards as viewport-wide — so the rule must land on the wrapper's
    //    own measured rect, not on the run (which would indent it and, because a
    //    border paints inside its own border box, overlap the first glyph).
    const RUN_BOX = { x: 116, y: 1756, width: 868, height: 29 }
    const BEARER = { x: 88, y: 1756, width: 896, height: 29 }
    const wrapped = foldToL1(
      multiFrom((w) => [
        run('Section heading', { x: 40, y: 1300, width: w - 80, height: 40 }, { surfaceFill: CREAM }),
        run('These aren’t just features', RUN_BOX, {
          surfaceFill: CREAM,
          borderLeft: { widthPx: 4, color: '#00d492' },
          accentBox: BEARER,
          surface: { self: false, box: { x: 0, y: 1288, width: w, height: 595 }, borderRadiusPx: 12, boxShadow: null, border: null },
        }),
      ]),
    )
    const rule = cardsOf(wrapped).find((b) => (b.axes?.borderLeft as { color?: string } | undefined)?.color === '#00d492')
    expect(rule, 'the accent rule folds a box').toBeDefined()
    for (const w of LADDER) expect(rectAt(rule!, w), `bearing rect at ${w}`).toEqual(BEARER)
    expect(rectAt(rule!, 1280).x, 'not the run it insets').not.toBe(RUN_BOX.x)
    expect(rectAt(rule!, 1280).width, 'not the viewport-wide band').not.toBe(1280)
    // A rule falling back to the bearing rect inherits no radius from the surface
    // it bypassed — the wrapper is a different element, with square corners.
    expect(rule!.axes?.borderRadiusPx).toBeUndefined()

    // 2. A card painting BOTH a fill and its accent keeps ONE rect for both: the
    //    bearing rect is consulted only when no card-shaped surface was resolved.
    const SURFACE = { x: 88, y: 2119, width: 896, height: 332 }
    const both = foldToL1(
      multiFrom((w) => [
        bandRun(w),
        onSurface('Panel title', { x: 124, y: 2151, width: 167, height: 32 }, SURFACE, {
          borderLeft: { widthPx: 4, color: '#00d492' },
          accentBox: { x: 60, y: 2119, width: 960, height: 332 },
        }),
      ]),
    )
    const combined = cardsOf(both).find((b) => b.axes?.surfaceFill === PANEL)
    expect(combined, 'the panel folds one card').toBeDefined()
    expect(rectAt(combined!, 1280), 'the fill’s rect serves both').toEqual(SURFACE)
    expect(combined!.axes?.borderLeft).toEqual({ widthPx: 4, color: '#00d492' })
    expect(combined!.axes?.borderRadiusPx).toBe(8)

    // 3. A run whose accent is painted on its OWN element keeps its own rect (the
    //    capture records no separate bearing rect for a self-painted accent).
    const OWN = { x: 120, y: 200, width: 300, height: 40 }
    const self = foldToL1(
      multiFrom((w) => [
        run('Band', { x: 0, y: 60, width: w, height: 40 }, { surfaceFill: '#f0ece6' }),
        run('Self-accented', OWN, {
          surfaceFill: '#ffffff',
          borderLeft: { widthPx: 4, color: '#ffb900' },
          accentBox: null,
        }),
      ]),
    )
    const own = cardsOf(self).find((b) => (b.axes?.borderLeft as { color?: string } | undefined)?.color === '#ffb900')
    expect(own, 'the self-accented run folds a card').toBeDefined()
    for (const w of LADDER) expect(rectAt(own!, w), `own rect at ${w}`).toEqual(OWN)
  })
})

// ── AC-758: a section's background image and scrim fold to one box ────────────

describe('AC-758 — a section image and its translucent scrim fold to one box beneath the content', () => {
  it('test_UAT_AC758_section_image_and_scrim_fold_to_one_box_painted_beneath', () => {
    // A hero painting BOTH a photo and a veil, over a page that also holds a band,
    // a card and content runs — so paint order is observable.
    const doc = foldToL1(
      multiFrom(
        (w) => [
          run('Intentional Software', { x: 40, y: 200, width: w - 80, height: 40 }, { surfaceFill: CREAM }),
          run('Card copy', { x: 120, y: 800, width: 300, height: 40 }, {
            surfaceFill: '#ffffff',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
          }),
        ],
        (w) => [section(0, { x: 0, y: 0, width: w, height: 600 }, { overlay: { ...VEIL }, backgroundImageUrl: HERO_URL })],
      ),
    )
    const bgs = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('section-bg-'))
    expect(bgs, 'one box per painting section').toHaveLength(1)
    // Both axes on ONE box: the URL and the scrim colour carrying its own alpha.
    expect(bgs[0].axes?.backgroundImageUrl).toBe(HERO_URL)
    expect(bgs[0].axes?.overlay).toEqual(VEIL)
    // A keyframe at each present sampled width.
    expect(bgs[0].geometry.keyframes.map((k) => k.at)).toEqual(LADDER)

    // Document order: the background box precedes every card and every content leaf.
    const kids = childrenOf(doc)
    const bgIdx = kids.findIndex((n) => n.id === bgs[0].id)
    const firstCard = kids.findIndex((n) => (n.id ?? '').startsWith('card-'))
    const firstText = kids.findIndex((n) => n.kind === 'text')
    expect(firstCard, 'the fixture holds a card').toBeGreaterThan(-1)
    expect(bgIdx, 'the image/scrim paints beneath the cards').toBeLessThan(firstCard)
    expect(bgIdx, 'the image/scrim paints beneath the content').toBeLessThan(firstText)

    // The veil renders as a TRANSLUCENT layer above the photo, not an opaque fill.
    const { css } = renderL1Document(doc)
    expect(css, 'the scrim keeps its alpha as an 8-digit hex (0.3 → 0x4d)').toContain('#0206184d')
    expect(
      css.match(/background-image:\s*linear-gradient\(#0206184d, #0206184d\), url\("[^"]*hero\.jpg"\)/),
      `the scrim must be layered above the image in:\n${css.slice(0, 2000)}`,
    ).not.toBeNull()

    // A scrim over a solid band (no image) still folds.
    const scrimOnly = foldToL1(
      multiFrom(
        () => [],
        (w) => [section(0, { x: 0, y: 0, width: w, height: 600 }, { overlay: { ...VEIL } })],
      ),
    )
    const scrimBox = boxesOf(scrimOnly).find((b) => b.id === 'section-bg-0')
    expect(scrimBox, 'an image-less scrim still folds a box').toBeDefined()
    expect(scrimBox!.axes?.overlay).toEqual(VEIL)
    expect(scrimBox!.axes?.backgroundImageUrl).toBeUndefined()

    // A section painting neither an image nor a scrim folds no box — and neither
    // does a gradient- or solid-only band.
    const plain = foldToL1(
      (() => {
        const ms = multiFrom(
          (w) => [
            run('Gradient band', { x: 0, y: 100, width: w, height: 40 }, {
              surfaceGradient: {
                angleDeg: 180,
                stops: [
                  { color: '#ffffff', position: 0 },
                  { color: '#000000', position: 1 },
                ],
              },
            }),
            run('Solid band', { x: 0, y: 200, width: w, height: 40 }, { surfaceFill: CREAM }),
          ],
          (w) => [section(0, { x: 0, y: 0, width: w, height: 600 })],
        )
        return ms
      })(),
    )
    expect(boxesOf(plain).filter((b) => (b.id ?? '').startsWith('section-bg-')), 'no box for a plain band').toHaveLength(0)
  })
})
