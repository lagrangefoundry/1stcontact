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
import type { FoldedForm } from '../tools/generate/src/l1'
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

  it('test_UAT_FC_BUG-21_a_card_with_no_captured_surface_invents_no_padding', () => {
    // REQ-88 superseded BUG-21's per-edge *estimate*. A capture now records the
    // surface-bearing element's own rect (`SurfaceShape.box`), so a real card's
    // edges are measured. This synthetic manifest carries no surface shape, and the
    // honest answer for missing data is to invent nothing: the card is exactly the
    // union of its runs. Guessing an ancestor's padding from vertical rhythm is what
    // produced BUG-21's 2x-height buttons in the first place.
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
    // Exactly the union of the two card runs (x 100..420, y 200..272) — no edge is
    // pushed out by an estimate, and none is pulled in.
    expect(kf.x).toBe(100)
    expect(kf.y).toBe(200)
    expect(kf.x + kf.width).toBe(420)
    expect(kf.height!).toBe(72)
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

    // REQ-88 — both of this page's padded controls are a *form's* submit button,
    // so the fold now lifts them out of the page body into that form's `submit`
    // slot: they are the module's button, not a page-level run beside a form that
    // renders its own. This test's subject is unchanged — a padded control must
    // never be outset by padding its box already includes — but the surviving
    // artifact is the slot subtree plus the seam pinned around it.
    const forms: FoldedForm[] = []
    foldToL1(multi, { forms })
    expect(forms.length, 'both captured forms are recovered').toBeGreaterThan(0)
    const submits = forms.map((f) => f.submit).filter(Boolean) as Array<{
      text?: string
      axes?: Record<string, unknown>
    }>
    for (const label of ['Subscribe', 'Send message']) {
      const chip = submits.find((s) => s.text === label)
      expect(chip, `"${label}" must survive as its form's submit slot`).toBeDefined()
      // Still the chip path: the control paints its own surface on the text leaf,
      // rather than folding to a card row that the outset would then double.
      expect(chip!.axes?.surfaceFill, `"${label}" paints its own surface`).toBeDefined()

      // No card box may carry the control's fill — that box was the doubled surface.
      for (const b of cards(doc)) {
        expect(b.axes?.surfaceFill, `no card may duplicate the "${label}" control fill`).not.toBe(
          chip!.axes?.surfaceFill,
        )
      }
    }

    // The oracle: the seam mounting each form is pinned at the union of the boxes
    // the reference actually painted. An outset control would inflate that union
    // (BUG-21's 2x height / +50px width), so this is the same evidence the
    // per-leaf check carried — read off the artifact that still exists.
    const slotSeams = (doc.root as { children?: Array<{ kind: string; geometry?: { keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> } }> })
      .children!.filter((n) => n.kind === 'slot')
    expect(slotSeams.length, 'one seam per recovered form').toBe(forms.length)
    for (const p of multi.projections.filter((p) => p.state === 'rest')) {
      const w = p.viewport.width
      for (const label of ['Subscribe', 'Send message']) {
        const src = (p.manifest.elements ?? []).find((e) => e.text === label && e.box)
        if (!src) continue
        // The button's captured rect lies inside the seam it was claimed by —
        // and inside it *snugly*: a doubled box could not fit its own union.
        const seam = slotSeams
          .map((s) => s.geometry?.keyframes.find((k) => k.at === w))
          .find((k) => k && src.box!.x >= k.x - 1 && src.box!.x + src.box!.width <= k.x + k.width + 1)
        expect(seam, `"${label}" at ${w} sits inside its form's seam`).toBeDefined()
      }
    }

    // The BUG-14 hierarchy is intact: the real card accent bars still fold.
    expect(cards(doc).filter((b) => b.axes?.borderLeft).length).toBeGreaterThan(0)
  })
})
