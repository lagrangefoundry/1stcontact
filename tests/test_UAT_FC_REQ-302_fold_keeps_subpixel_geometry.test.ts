/**
 * REQ-302 issue 6 — the fold writes derived geometry at the precision the
 * capture measured it, not rounded to a whole pixel.
 *
 * A capture records `x: 149.546875`. `l1KeyframeSchema` types `x`/`y`/`width`
 * as FINITE numbers, not integers, so L1 was always able to carry it. The fold
 * wrote `150`.
 *
 * That 0.45px is not invisible. It shifts every glyph in the run onto a
 * different sub-pixel grid, and on one measured reference three ranked regions
 * — 127.69 of 1043.47, 12.2% of the round's entire ranked score — were that
 * shift and nothing else: same text on both sides, same font, same colour,
 * ZERO values-diff deltas, and `149.546875 → 150` as the only measured
 * difference between them.
 *
 * The file already had `round2` (`Math.round(n * 100) / 100`) and was already
 * using it for `lineHeightPx` and `letterSpacingPx`, so the precision
 * convention existed and geometry simply was not using it. These UATs measure
 * that geometry now uses it — and that the two places the fold deliberately
 * does NOT round to nearest still do not.
 */
import { describe, expect, it } from 'vitest'
import { foldToL1 } from '../tools/generate/src'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** The sub-pixel x a real capture recorded, and the width beside it. */
const REF_X = 149.546875
const REF_W = 413.234375
const TEXT = 'Designed for developers building AI-enhanced workflows'

function el(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    ...over,
  } as ValueElement
}

function captureOf(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `req302@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: elementsAt(width),
    },
  })) as never
  return { url: 'http://req302.test/', notes: [], projections } as never
}

/** Every keyframe in the document, with the node it belongs to. */
function keyframesOf(doc: L1Document): { id?: string; kf: Record<string, number> }[] {
  const out: { id?: string; kf: Record<string, number> }[] = []
  const walk = (n: L1Node): void => {
    const geo = (n as { geometry?: { keyframes?: Record<string, number>[] } }).geometry
    for (const kf of geo?.keyframes ?? []) out.push({ id: (n as { id?: string }).id, kf })
    const kids = n.kind === 'container' ? n.children : ((n as { children?: L1Node[] }).children ?? [])
    kids.forEach(walk)
  }
  walk(doc.root)
  return out
}

/** How many decimal places `n` actually uses (0 for a whole number). */
const places = (n: number): number => {
  const s = String(n)
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}

describe('REQ-302 — the fold keeps the sub-pixel geometry the capture measured', () => {
  it('test_UAT_FC_REQ-302_a_sub_pixel_x_survives_the_fold_instead_of_rounding_to_a_whole_pixel', () => {
    // THE MEASURED FAILURE, in miniature: the run that cost 127.69 of one
    // reference's ranked score, at the x and width the capture recorded.
    const doc = foldToL1(
      captureOf(() => [
        el({ text: TEXT, box: { x: REF_X, y: 2683.25, width: REF_W, height: 24 } }),
      ]),
    )
    const kfs = keyframesOf(doc)
    expect(kfs.length).toBeGreaterThan(0)

    // The x is carried at two decimals, NOT rounded to 150. Asserted as a
    // value rather than as "not an integer": the point is that it is still
    // the measured position, within the precision the fold writes at.
    const xs = kfs.map((k) => k.kf.x).filter((v) => typeof v === 'number')
    expect(xs.length).toBeGreaterThan(0)
    for (const x of xs) expect(x, 'keyframe x').toBeCloseTo(REF_X, 1)
    expect(xs.some((x) => x === 150), 'no keyframe rounded away the sub-pixel').toBe(false)

    // ...and the fold's precision is two decimals, not unbounded: a keyframe
    // carrying `149.546875` verbatim would be the other failure — writing
    // more precision than a browser resolves into every generated stylesheet.
    for (const { kf } of kfs) {
      for (const v of Object.values(kf)) {
        if (typeof v === 'number') expect(places(v), `${v} is at the fold's precision`).toBeLessThanOrEqual(2)
      }
    }

    // The document is still a legal L1 document at this precision — which is
    // the reason the fix is available at all: the schema types these axes as
    // finite, never as integers.
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-302_the_sub_pixel_position_reaches_the_rendered_stylesheet', () => {
    // The fold keeping the number is worth nothing if the renderer rounds it
    // back. This is the end of the pipeline the 127.69 was measured at: the
    // emitted CSS must place the run at the measured position.
    const doc = foldToL1(
      captureOf(() => [
        el({ text: TEXT, box: { x: REF_X, y: 2683.25, width: REF_W, height: 24 } }),
      ]),
    )
    const { css } = renderL1Document(doc)
    expect(css).toContain('149.55')
    expect(css).not.toMatch(/left:\s*150px/)
  })

  it('test_UAT_FC_REQ-302_a_nowrap_width_still_rounds_up_and_never_down', () => {
    // The one place the fold deliberately does NOT round to nearest, and the
    // reason it does not. REQ-117's floor has to CONTAIN the measured content:
    // `Gigabyte Alchemy` measured 685.31 and a nearest-round pinned it at 685,
    // so the hero title reflowed onto a second line the reference never had.
    //
    // Two-decimal precision must not have quietly reverted that to nearest —
    // the ceiling is now at two decimals rather than at whole pixels, which is
    // a smaller over-allocation, still never an under-allocation.
    const measured = 685.3125
    const doc = foldToL1(
      captureOf(() => [
        // One line at every width — what the fold reads to decide it cannot wrap.
        {
          ...el({ text: 'Gigabyte Alchemy', box: { x: 24, y: 100, width: measured, height: 90 } }),
          renderedTextBox: { x: 24, y: 100, width: measured, height: 82 },
        } as ValueElement,
      ]),
    )
    const widths = keyframesOf(doc)
      .map((k) => k.kf.width)
      .filter((v) => typeof v === 'number')
    expect(widths.length).toBeGreaterThan(0)
    for (const w of widths) {
      expect(w, 'never narrower than the measured content').toBeGreaterThanOrEqual(measured)
      expect(w, 'and no wider than one hundredth of a pixel').toBeLessThan(measured + 0.01)
    }
  })
})
