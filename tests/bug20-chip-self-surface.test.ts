/**
 * BUG-20 — a **self-painting chip** run (a `rounded-full` "Coming soon" badge, a
 * tag pill, a button-shaped link) folds to a text leaf that carries its OWN
 * surface, and the values-diff stops reporting a saturated pill radius as a
 * defect.
 *
 * Root cause (measured against the retained gigabytealchemy capture, not the
 * ticket's original guess): the fold already carried `borderLeft` /
 * `surfaceGradient` / radius onto **card** boxes. What it could not carry was a
 * run whose own element *is* the painted surface. The capture reads
 * `borderRadiusPx` / `boxShadow` / `border` from the element's OWN computed style
 * (unlike `surfaceFill` / `surfaceGradient` / `borderLeft`, which walk ancestors
 * to find the enclosing card) — so a badge is one element that is simultaneously a
 * styled run and a painted pill. L1 forced those into disjoint `text` / `box`
 * leaves, so the badge folded to a bare text leaf and lost its pill entirely
 * (`radius 33554400px` → `radius 0px`).
 *
 * The fix adds the self-surface axes to the L1 text leaf (the L1 capability gap —
 * closed in L1, never with a new module) and folds them for chip runs only.
 *
 * The UATs drive the real `foldToL1` / `renderL1Document` entry points over
 * synthetic multi-viewport captures (real components, no mocks) and cross-check
 * against the retained real gigabytealchemy capture.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src'
import { foldToL1 } from '../tools/generate/src'
import { diffManifests, type ValueManifest } from '../tools/generate/src/cli'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** The saturating sentinel a `rounded-full` utility computes to in a real browser. */
const ROUNDED_FULL = 33554400

function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'text', color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400, box, ...over }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 1200 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A card holding a heading, a body run, and a `rounded-full` badge — the real shape. */
function cardWithBadge(): MultiStateCapture {
  return multiFrom((w) => [
    run('Our Work', { x: 40, y: 100, width: w - 80, height: 30 }, { surfaceFill: '#f8f5f2', borderLeft: { widthPx: 4, color: '#ffb900' } }),
    run('We build things carefully.', { x: 40, y: 140, width: w - 80, height: 24 }, { surfaceFill: '#f8f5f2', borderLeft: { widthPx: 4, color: '#ffb900' } }),
    run('Coming soon', { x: 40, y: 180, width: 110, height: 24 }, {
      surfaceFill: '#dbeafe',
      borderLeft: { widthPx: 4, color: '#50a2ff' },
      borderRadiusPx: ROUNDED_FULL,
    }),
  ])
}

const textLeaves = (doc: ReturnType<typeof foldToL1>) =>
  (doc.root.children ?? []).filter((n): n is Extract<typeof n, { kind: 'text' }> => n.kind === 'text')

describe('BUG-20 — chip runs carry their own surface', () => {
  it('test_UAT_FC_BUG-20_badge_run_folds_to_a_text_leaf_carrying_its_own_pill', () => {
    const doc = foldToL1(cardWithBadge())
    const badge = textLeaves(doc).find((t) => t.text === 'Coming soon')
    expect(badge, 'the badge run must survive as a text leaf').toBeDefined()

    // The pill is carried on the run itself — radius clamped into the envelope's
    // length range, which paints the identical shape (any radius >= half the
    // height saturates), plus the chip's own fill.
    expect(badge!.axes?.borderRadiusPx).toBeGreaterThan(0)
    expect(badge!.axes?.borderRadiusPx).toBeLessThanOrEqual(100_000)
    expect(badge!.axes?.borderRadiusPx! * 2).toBeGreaterThanOrEqual(24)
    expect(badge!.axes?.surfaceFill).toBe('#dbeafe')
  })

  it('test_UAT_FC_BUG-20_bare_runs_carry_no_chip_surface', () => {
    const doc = foldToL1(cardWithBadge())
    // A run sitting ON a card is not a chip: its fill/borderLeft are the enclosing
    // card's (ancestor-attributed) and stay on the card box, not on the run.
    for (const t of textLeaves(doc).filter((t) => t.text !== 'Coming soon')) {
      expect(t.axes?.borderRadiusPx, `${t.text} must not gain a chip radius`).toBeUndefined()
      expect(t.axes?.surfaceFill, `${t.text} must not gain a chip fill`).toBeUndefined()
    }
  })

  it('test_UAT_FC_BUG-20_chip_paints_once_no_duplicate_badge_box_behind_it', () => {
    const doc = foldToL1(cardWithBadge())
    const boxes = (doc.root.children ?? []).filter((n) => n.kind === 'box')
    // The chip paints itself, so no box may carry the badge's own fill — a
    // duplicate would double-paint the pill behind the run.
    for (const b of boxes) {
      expect(b.axes?.surfaceFill, 'no box may duplicate the chip fill').not.toBe('#dbeafe')
    }
  })

  it('test_UAT_FC_BUG-20_renderer_emits_the_chip_surface_on_the_text_element', () => {
    const doc = foldToL1(cardWithBadge())
    const { html, css } = renderL1Document(doc)
    const badge = textLeaves(doc).find((t) => t.text === 'Coming soon')!
    expect(html).toContain('Coming soon')
    // The run's own element paints the pill, so a re-capture reading its OWN
    // computed style finds the radius + fill exactly as the reference did.
    expect(css).toMatch(/border-radius:\s*\d+px/)
    expect(css).toContain('#dbeafe')
    expect(badge.axes?.borderRadiusPx).toBeDefined()
  })

  it('test_UAT_FC_BUG-20_card_treatments_stay_on_the_card_box', () => {
    const doc = foldToL1(cardWithBadge())
    const boxes = (doc.root.children ?? []).filter((n) => n.kind === 'box')
    // BUG-14's card reconstruction is untouched: the enclosing card still owns the
    // ancestor-attributed accent bar, defined by its non-chip runs.
    const withBar = boxes.filter((b) => b.axes?.borderLeft)
    expect(withBar.length, 'the card keeps its coloured left border').toBeGreaterThan(0)
    expect(withBar[0].axes!.borderLeft).toEqual({ widthPx: 4, color: '#ffb900' })
  })

  it('test_UAT_FC_BUG-20_chip_axes_stay_inside_the_l1_envelope', () => {
    // A saturating sentinel radius must not escape the envelope's length bound —
    // robustness by construction (DOC-23), and it renders identically clamped.
    const doc = foldToL1(cardWithBadge())
    const result = validateL1(doc)
    expect(result.ok, JSON.stringify('errors' in result ? result.errors : [])).toBe(true)

    const badge = textLeaves(doc).find((t) => t.text === 'Coming soon')!
    const overrun = structuredClone(doc)
    const target = (overrun.root.children ?? []).find(
      (n) => n.kind === 'text' && n.text === badge.text,
    ) as Extract<(typeof doc.root.children)[number], { kind: 'text' }>
    target.axes = { ...target.axes, borderRadiusPx: ROUNDED_FULL }
    expect(validateL1(overrun).ok, 'an unclamped sentinel radius must be rejected').toBe(false)
  })

  it('test_UAT_FC_BUG-20_a_modestly_rounded_single_run_card_is_not_a_chip', () => {
    // The discriminator is pill SATURATION, not "has a radius". A single-run card
    // paints a modest rounding + shadow on its own element too (BUG-14); treating
    // that as a chip would delete the card box and its accent bar.
    const doc = foldToL1(
      multiFrom((w) => [
        run('Band', { x: 50, y: 60, width: w - 100, height: 40 }, { surfaceFill: '#f0ece6' }),
        run('Card', { x: 120, y: 200, width: 300, height: 40 }, {
          surfaceFill: '#ffffff',
          borderLeft: { widthPx: 4, color: '#ffb900' },
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
          borderRadiusPx: 12, // 12*2 = 24 < 40 → not saturated → still a card
        }),
      ]),
    )
    const card = (doc.root.children ?? []).find((n) => n.kind === 'box' && (n.id ?? '').startsWith('card-'))
    expect(card, 'the single-run card must still fold a card box').toBeDefined()
    expect(card!.axes?.borderLeft).toEqual({ widthPx: 4, color: '#ffb900' })
    expect(card!.axes?.borderRadiusPx).toBe(12)
    // ...and the run itself stays a bare text leaf.
    const cardRun = textLeaves(doc).find((t) => t.text === 'Card')!
    expect(cardRun.axes?.borderRadiusPx).toBeUndefined()
  })

  it('test_UAT_FC_BUG-20_real_gigabytealchemy_badges_fold_as_pills', () => {
    const bundle = path.join('storage', 'references', 'gigabytealchemy.ai', 'index', 'multistate.json')
    if (!existsSync(bundle)) return // the retained capture is gitignored third-party material
    const multi = JSON.parse(readFileSync(bundle, 'utf8')) as MultiStateCapture
    const doc = foldToL1(multi)

    const badges = textLeaves(doc).filter((t) => /Coming soon|In development/i.test(t.text))
    expect(badges.length, 'the real capture holds the badge runs').toBeGreaterThan(0)
    for (const b of badges) {
      expect(b.axes?.borderRadiusPx, `"${b.text}" must render as a pill`).toBeGreaterThan(0)
    }
    // The card accent bars survive the change (the BUG-14 hierarchy is intact).
    const bars = (doc.root.children ?? []).filter((n) => n.kind === 'box' && n.axes?.borderLeft)
    expect(bars.length, 'card accent bars are still folded').toBeGreaterThan(0)
  })
})

// ── the diff side: a saturated pill radius is not a magnitude ─────────────────

/** A badge run: short body text in a box, with the radius under test. */
const badgeEl = (radiusPx: number, over: Partial<ValueElement> = {}): ValueElement => ({
  role: 'body',
  text: 'Coming soon',
  color: '#000000',
  fontFamily: 'sans',
  fontSizePx: 14,
  fontWeight: 400,
  box: { x: 40, y: 180, width: 110, height: 24 },
  borderRadiusPx: radiusPx,
  ...over,
})
const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })
const shapeDeltas = (a: ValueManifest, b: ValueManifest) =>
  diffManifests(a, b).deltas.filter((d) => d.property === 'shape')

describe('BUG-20 — the diff treats a pill radius as saturated, not as a magnitude', () => {
  it('test_UAT_FC_BUG-20_two_pills_with_different_sentinel_radii_are_not_a_shape_defect', () => {
    // The reference `rounded-full` computes to 33554400px; our clamped fold emits
    // 100000px. Both paint the identical pill (any radius >= half the 24px height
    // saturates), so counting the raw gap was reporting a defect where no pixel
    // differs.
    const ref = mani('ref', [badgeEl(ROUNDED_FULL)])
    const ours = mani('act', [badgeEl(100_000)])
    expect(shapeDeltas(ref, ours)).toHaveLength(0)
  })

  it('test_UAT_FC_BUG-20_a_pill_flattened_to_a_square_is_still_a_shape_defect', () => {
    // The regression this ticket fixes: a badge that lost its pill entirely must
    // keep flagging. Saturation must not blunt the real signal.
    const ref = mani('ref', [badgeEl(ROUNDED_FULL)])
    const flattened = mani('act', [badgeEl(0)])
    expect(shapeDeltas(ref, flattened).length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-20_a_shadow_difference_between_two_pills_still_flags', () => {
    // Saturation applies only to the radius; the shadow is an independent
    // treatment and must still be compared between two pills.
    const ref = mani('ref', [badgeEl(ROUNDED_FULL, { boxShadow: '0 1px 2px rgba(0,0,0,0.25)' })])
    const noShadow = mani('act', [badgeEl(100_000)])
    expect(shapeDeltas(ref, noShadow).length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-20_non_pill_radius_drift_is_unaffected', () => {
    // A card's 12px vs 4px rounding is a real, visible difference — neither side
    // saturates, so the ordinary magnitude comparison still governs.
    const ref = mani('ref', [badgeEl(12)])
    const drifted = mani('act', [badgeEl(4)])
    expect(shapeDeltas(ref, drifted).length).toBeGreaterThan(0)
  })
})
