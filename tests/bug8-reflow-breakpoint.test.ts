/**
 * BUG-8 — a reflow at a captured breakpoint must reproduce EXACTLY at that
 * breakpoint (the 768px cascade regression guard).
 *
 * The original l1-gate re-run on gigabytealchemy failed `sampleFidelity` at 768px
 * only: a three-card grid reflows mobile-stack → tablet-row at the 768 breakpoint,
 * the cards narrow (279→171px), so the 375→768 span classifies `snap`. The
 * analytic `evalGeometry` matched the segment ENDING at a breakpoint with a CLOSED
 * upper bound, so at the exact interior width 768 the `snap` ending there returned
 * the held lower (375) keyframe — the stale, wider pre-reflow box — and every
 * element below inherited the cascade.
 *
 * The fix (REQ-92, commit 6ebc8ee8) made the segment interval half-open
 * `[a.at, b.at)`, mirroring the renderer's highest-`min-width`-wins CSS: at an
 * exact interior breakpoint the segment STARTING there is active. Capture and fold
 * were always correct — the 768 cell is NOT dropped, every card keeps its 768
 * keyframe; the bug was purely in the analytic evaluator.
 *
 * These UATs lock that class shut from the fold→gate seam BUG-8 names: a reflow at
 * a captured breakpoint (a) keeps a keyframe at that breakpoint for every present
 * element, and (b) reproduces the reflowed (upper) frame there — never the held
 * lower frame. They fail if the half-open interval is ever reverted to closed.
 */
import { describe, expect, it } from 'vitest'
import {
  foldToL1,
  evaluateLayout,
  sampleFidelityProbe,
  type OracleSource,
} from '../tools/generate/src'
import type { MultiStateCapture, ValueElement } from '../tools/generate/src/cli/capture'

const WIDTHS = [375, 768, 1024]

/** A card-heading `ValueElement` at one width — a text run pinned to a box. */
function card(text: string, x: number, y: number, width: number): ValueElement {
  return {
    text,
    role: 'subheading',
    a11yRole: 'heading',
    color: '#111827',
    fontFamily: 'Arial',
    fontSizePx: 20,
    fontWeight: 600,
    box: { x, y, width, height: 28 },
  }
}

/**
 * A three-card grid that reflows at the 768 breakpoint, mirroring the real
 * gigabytealchemy geometry: stacked at 375 (each 279px wide), a row at 768 (each
 * narrows to 171px — so 375→768 is a `snap`), a wider row at 1024 (229px).
 */
function reflowCapture(): MultiStateCapture {
  const perWidth: Record<number, ValueElement[]> = {
    375: [card('Presence', 48, 1804, 279), card('Positivity', 48, 2028, 279), card('Connection', 48, 2226, 279)],
    768: [card('Presence', 48, 1831, 171), card('Positivity', 299, 1831, 171), card('Connection', 549, 1831, 171)],
    1024: [card('Presence', 48, 1517, 229), card('Positivity', 357, 1517, 229), card('Connection', 667, 1517, 229)],
  }
  return {
    url: 'https://fixture.test/reflow',
    notes: [],
    projections: WIDTHS.map((width) => ({
      engine: 'chromium' as const,
      viewport: { width, height: 3000 },
      state: 'rest' as const,
      manifest: { source: 'fixture:reflow', elements: perWidth[width], sections: [], viewport: { width, height: 3000 }, engine: 'chromium' as const, state: 'rest' as const },
    })),
  }
}

/** The evaluated box for a text leaf by its content, at `width`. */
function leafBox(doc: ReturnType<typeof foldToL1>, text: string, width: number) {
  const leaf = evaluateLayout(doc, width).leaves.find((l) => l.kind === 'text' && l.text === text)
  expect(leaf, `no leaf for ${text} at ${width}`).toBeTruthy()
  return leaf!.box
}

describe('BUG-8 reflow at a captured breakpoint reproduces exactly', () => {
  it('test_UAT_FC_BUG-8_every_card_keeps_a_keyframe_at_the_reflow_breakpoint', () => {
    const doc = foldToL1(reflowCapture())
    // Walk to each card's text leaf and confirm it carries a keyframe at 768 — the
    // fold does NOT drop the reflowed 768 cell (the ticket's disproven hypothesis).
    const tracks = new Map<string, number[]>()
    const walk = (n: import('../packages/site-schema/src/index').L1Node): void => {
      if (n.kind === 'text' && n.geometry) {
        tracks.set(n.text, n.geometry.keyframes.map((k) => k.at))
      }
      for (const c of (n as { children?: import('../packages/site-schema/src/index').L1Node[] }).children ?? []) walk(c)
    }
    walk(doc.root)
    for (const name of ['Presence', 'Positivity', 'Connection']) {
      expect(tracks.get(name), `${name} track`).toEqual(WIDTHS)
    }
  })

  it('test_UAT_FC_BUG-8_reflowed_frame_wins_at_the_exact_breakpoint_not_the_held_lower_frame', () => {
    const doc = foldToL1(reflowCapture())
    // At exactly 768 the reflowed (upper) frame must render — never the 375 frame
    // a closed-interval `snap` would hold. Positivity is the clearest tell: its
    // reflowed 768 box (299,1831,171) is far from its held 375 box (48,2028,279).
    const box = leafBox(doc, 'Positivity', 768)
    expect(Math.round(box.x)).toBe(299)
    expect(Math.round(box.y)).toBe(1831)
    expect(Math.round(box.width)).toBe(171)
    // Guard against the exact regression: it must NOT be the held 375 frame.
    expect(Math.round(box.x)).not.toBe(48)
    expect(Math.round(box.width)).not.toBe(279)
  })

  it('test_UAT_FC_BUG-8_sampleFidelity_clean_at_every_width_including_the_breakpoint', () => {
    const capture = reflowCapture()
    const doc = foldToL1(capture)
    const report = sampleFidelityProbe(doc, capture as unknown as OracleSource)
    expect(report.unmatched).toEqual([])
    // No residual at ANY width — the breakpoint (768) is the one that regressed.
    expect(report.residuals, JSON.stringify(report.residuals)).toEqual([])
    expect(report.residuals.filter((r) => r.width === 768)).toEqual([])
  })
})
