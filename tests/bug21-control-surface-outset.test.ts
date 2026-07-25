/**
 * BUG-21 — a **padded control** (a button / submit link) folds to a surface whose
 * box is the control's own box, not that box outset a second time by padding it
 * already contains.
 *
 * Root cause (measured against the retained gigabytealchemy capture): the capture
 * reads `getBoundingClientRect`, a border-box that already includes the run's own
 * padding (BUG-17), and `Subscribe` / `Send message` carry exactly the reference's
 * padding (`12/24/12/24`, `12/32/12/32`). BUG-20's self-painting test only
 * recognised a *saturated* pill radius, so a `rounded-lg` button (8px on a 48px
 * box) fell through to BUG-14's card path — which outset the union of its runs by
 * `cardPadding`. For a lone run that estimate is `0.5 * height`, i.e. precisely its
 * own top+bottom padding, and it was applied to **all four** sides: every button
 * rendered at 2x its target height and ~50px too wide, bleeding past both screen
 * edges at 320 (`x=-1, width=322` on a 320 viewport).
 *
 * Two defects, fixed independently:
 *   1. a padded control is self-painting — its own box IS the surface (no outset);
 *   2. where an outset is legitimately required (an ancestor card's unseen
 *      padding), it is decided **per edge** from that edge's own captured padding —
 *      never the vertical sum applied horizontally.
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
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

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

/** The real shape of the reference's Subscribe control: its own padding + fill + modest radius. */
const BUTTON_BOX = { x: 413, y: 3900, width: 123, height: 50 }
const button = (over: Partial<ValueElement> = {}): ValueElement =>
  run('Subscribe', BUTTON_BOX, {
    a11yRole: 'button',
    surfaceFill: '#009966',
    borderRadiusPx: 8,
    paddingTopPx: 12,
    paddingRightPx: 24,
    paddingBottomPx: 12,
    paddingLeftPx: 24,
    ...over,
  })

/** A page holding a band plus one padded control — the reproduction's contact CTA. */
const pageWithButton = (): MultiStateCapture =>
  multiFrom((w) => [
    run('Get in touch', { x: 40, y: 3800, width: w - 80, height: 30 }, { surfaceFill: '#f0ece6' }),
    button(),
  ])

type Box = Extract<ReturnType<typeof foldToL1>['root']['children'], unknown[]>[number] & { kind: 'box' }
const boxes = (doc: ReturnType<typeof foldToL1>): Box[] =>
  ((doc.root.children ?? []) as Box[]).filter((n) => n.kind === 'box')
const cards = (doc: ReturnType<typeof foldToL1>): Box[] => boxes(doc).filter((b) => (b.id ?? '').startsWith('card-'))
const textLeaves = (doc: ReturnType<typeof foldToL1>) =>
  (doc.root.children ?? []).filter((n): n is Extract<typeof n, { kind: 'text' }> => n.kind === 'text')

describe('BUG-21 — a padded control surface is not outset by padding its box already includes', () => {
  it('test_UAT_FC_BUG-21_padded_control_surface_matches_its_captured_box_at_every_width', () => {
    const doc = foldToL1(pageWithButton())
    const control = textLeaves(doc).find((t) => t.text === 'Subscribe')
    expect(control, 'the control run must survive as a text leaf').toBeDefined()

    // The control paints its own surface, so the leaf carries the fill/radius and
    // its geometry is the captured border-box — unexpanded, at every width.
    expect(control!.axes?.surfaceFill).toBe('#009966')
    expect(control!.axes?.borderRadiusPx).toBe(8)
    for (const kf of control!.geometry.keyframes) {
      expect(kf.x, `x at ${kf.at}`).toBe(BUTTON_BOX.x)
      expect(kf.width, `width at ${kf.at}`).toBe(BUTTON_BOX.width)
    }
    // ...and the padding stays an inset inside that pinned box (BUG-17), so the
    // glyphs sit where the reference put them.
    expect(control!.padding).toEqual({ topPx: 12, rightPx: 24, bottomPx: 12, leftPx: 24 })
  })

  it('test_UAT_FC_BUG-21_no_outset_card_box_is_emitted_behind_a_padded_control', () => {
    const doc = foldToL1(pageWithButton())
    // The regression: a card box behind the control, outset on all four sides —
    // 2x the height and ~50px too wide, and negative x at the narrow widths.
    for (const b of cards(doc)) {
      expect(b.axes?.surfaceFill, 'no card may duplicate the control fill').not.toBe('#009966')
      for (const kf of b.geometry.keyframes) {
        expect(kf.x, `card ${b.id} must not bleed past the left screen edge at ${kf.at}`).toBeGreaterThanOrEqual(0)
      }
    }
    // Nothing anywhere in the fold may exceed the control's own box.
    for (const b of boxes(doc)) {
      const kf = b.geometry.keyframes.find((k) => k.at === 1280)
      if (!kf || b.axes?.surfaceFill !== '#009966') continue
      expect(kf.height).toBe(BUTTON_BOX.height)
      expect(kf.width).toBe(BUTTON_BOX.width)
    }
  })

  it('test_UAT_FC_BUG-21_control_surface_stays_within_the_viewport_at_320', () => {
    const doc = foldToL1(pageWithButton())
    // The mobile symptom: the Subscribe surface landed at x=-1, width=322 on a 320
    // viewport. Every painted surface must stay inside the viewport it was folded
    // for — a control can never bleed past both screen edges.
    for (const b of boxes(doc)) {
      const kf = b.geometry.keyframes.find((k) => k.at === 320)
      if (!kf) continue
      expect(kf.x, `${b.id} left edge at 320`).toBeGreaterThanOrEqual(0)
      expect(kf.x + kf.width, `${b.id} right edge at 320`).toBeLessThanOrEqual(320)
    }
  })

  it('test_UAT_FC_BUG-21_an_ancestor_padded_card_outsets_per_edge_not_by_the_vertical_sum', () => {
    // A genuine card: its runs carry NO padding of their own (the card element does),
    // so the ancestor's unseen padding is still inferred — but only on the edges a
    // run has not already padded. Here the body run is the leftmost AND is indented
    // (padding-left 24), so the card's left edge is that run's own box edge; every
    // other edge still takes the estimate.
    const doc = foldToL1(
      multiFrom((w) => [
        run('Band', { x: 0, y: 60, width: w, height: 40 }, { surfaceFill: '#f0ece6' }),
        run('Card title', { x: 120, y: 200, width: 300, height: 32 }, {
          surfaceFill: '#ffffff',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
        }),
        run('Card body', { x: 100, y: 248, width: 320, height: 24 }, {
          surfaceFill: '#ffffff',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
          paddingLeftPx: 24,
        }),
      ]),
    )
    const card = cards(doc).find((b) => b.axes?.surfaceFill === '#ffffff')
    expect(card, 'the multi-run card must still fold a card box').toBeDefined()
    const kf = card!.geometry.keyframes.find((k) => k.at === 1280)!
    // The leftmost run already padded its left edge, so the card stops there — the
    // pre-fix code pushed it a further ~19px out (the vertical-rhythm estimate).
    expect(kf.x).toBe(100)
    // The other three edges still take the inferred ancestor padding, so the card
    // is taller than its runs and reaches past their right edge.
    expect(kf.y).toBeLessThan(200)
    expect(kf.x + kf.width).toBeGreaterThan(420)
    expect(kf.height!).toBeGreaterThan(248 + 24 - 200)
  })

  it('test_UAT_FC_BUG-21_a_padded_run_carrying_an_ancestor_accent_stays_on_the_card_path', () => {
    // A `pl`-indented callout inside a bordered-left card: the accent bar is
    // ancestor-attributed and the chip axes cannot carry it, so this run must NOT be
    // treated as self-painting — the card keeps its bar.
    const doc = foldToL1(
      multiFrom((w) => [
        run('Band', { x: 0, y: 60, width: w, height: 40 }, { surfaceFill: '#f0ece6' }),
        run('Callout copy', { x: 120, y: 200, width: 300, height: 29 }, {
          surfaceFill: '#d9ccba',
          borderLeft: { widthPx: 4, color: '#00d492' },
          paddingTopPx: 8,
          paddingBottomPx: 8,
          paddingLeftPx: 16,
        }),
      ]),
    )
    const card = cards(doc).find((b) => b.axes?.borderLeft)
    expect(card, 'the accent-bar card must still be folded').toBeDefined()
    expect(card!.axes!.borderLeft).toEqual({ widthPx: 4, color: '#00d492' })
    const callout = textLeaves(doc).find((t) => t.text === 'Callout copy')!
    expect(callout.axes?.surfaceFill, 'the ancestor fill stays on the card, not the run').toBeUndefined()
  })

  it('test_UAT_FC_BUG-21_the_control_surface_renders_at_its_captured_size', () => {
    const doc = foldToL1(pageWithButton())
    expect(validateL1(doc).ok).toBe(true)
    const { html, css } = renderL1Document(doc)
    expect(html).toContain('Subscribe')
    // The renderer paints the control at the pinned border-box width with the
    // padding inset inside it (its height is natural — the text's own flow, BUG-17),
    // so a re-capture reads back the reference's own numbers.
    const rule = css.split('\n').find((l) => l.includes('#009966') && l.includes('padding-top'))
    expect(rule, 'the control run carries its own surface + padding').toBeDefined()
    expect(rule!).toMatch(/padding-top:\s*12px/)
    expect(rule!).toMatch(/padding-right:\s*24px/)
    expect(rule!).toMatch(/padding-bottom:\s*12px/)
    expect(rule!).toMatch(/padding-left:\s*24px/)
    // No rule may pin the doubled surface the outset produced (2x height, +50 width).
    expect(css).not.toMatch(/width:\s*173px/)
    expect(css).not.toMatch(/height:\s*100px/)
    expect(css).toMatch(/width:\s*123px/)
  })

  it('test_UAT_FC_BUG-21_real_gigabytealchemy_controls_match_the_oracle_boxes', () => {
    const bundle = path.join('storage', 'references', 'gigabytealchemy.ai', 'index', 'multistate.json')
    if (!existsSync(bundle)) return // the retained capture is gitignored third-party material
    const multi = JSON.parse(readFileSync(bundle, 'utf8')) as MultiStateCapture
    const doc = foldToL1(multi)

    // The oracle: the control's own captured box at each width. The fold must
    // reproduce it within the gate's 0.5px tolerance — no outset anywhere.
    for (const label of ['Subscribe', 'Send message']) {
      const leaf = textLeaves(doc).find((t) => t.text === label)
      expect(leaf, `"${label}" must survive as a text leaf`).toBeDefined()
      expect(leaf!.axes?.surfaceFill, `"${label}" paints its own surface`).toBeDefined()

      for (const p of multi.projections.filter((p) => p.state === 'rest')) {
        const w = p.viewport.width
        const src = (p.manifest.elements ?? []).find((e) => e.text === label && e.box)
        const kf = leaf!.geometry.keyframes.find((k) => k.at === w)
        if (!src || !kf) continue
        expect(Math.abs(kf.x - Math.round(src.box!.x)), `${label} x at ${w}`).toBeLessThanOrEqual(0.5)
        expect(Math.abs(kf.width - Math.round(src.box!.width)), `${label} width at ${w}`).toBeLessThanOrEqual(0.5)
      }

      // No card box may carry the control's fill — that box was the doubled surface.
      for (const b of cards(doc)) {
        expect(b.axes?.surfaceFill, `no card may duplicate the "${label}" control fill`).not.toBe(
          leaf!.axes?.surfaceFill,
        )
      }
    }

    // The BUG-14 hierarchy is intact: the real card accent bars still fold.
    expect(cards(doc).filter((b) => b.axes?.borderLeft).length).toBeGreaterThan(0)
  })
})
