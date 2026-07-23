/**
 * BUG-7 — `evaluateLayout` row/flow layout.
 *
 * The analytic value-render (`tools/generate/src/l1/probes.ts`) previously gave
 * every in-flow child the full parent width and, for a `row` container, advanced
 * the cursor by the full parent width per child — so N row children spanned
 * N×parentWidth and overflowed. These UATs pin the corrected flex-row semantics:
 * row children sit side by side, each taking its own main-axis width (a declared
 * fixed width, or an equal share of the leftover extent), and the row's height is
 * the tallest child. Column stacking is unchanged. A genuinely-too-wide row still
 * surfaces a real clip (the fix removes *false* overflow, not real overflow).
 *
 * The final UAT verifies the analytic boxes against a real Chromium layout
 * (skipped when no browser engine is installed), per the ticket's "verify against
 * a rendered row fixture".
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import {
  captureL1,
  engineAvailable,
  evaluateLayout,
  offSampleProbe,
} from '../tools/generate/src'

const WIDTHS = [320, 375, 768, 1024, 1280, 1440]

/** A plain styled text leaf (no geometry ⇒ a flow child). */
function text(t: string): L1Node {
  return {
    kind: 'text',
    text: t,
    axes: { color: '#111827', fontFamily: 'Arial', fontSizePx: 16, fontWeight: 400 },
  }
}

/** A fixed-width box wrapping one text label (a deterministic row item). */
function fixedBox(label: string, widthPx: number, heightPx = 80): L1Node {
  return {
    kind: 'box',
    axes: { surfaceFill: '#e5e7eb' },
    sizing: { width: { mode: 'fixed', px: widthPx }, height: { mode: 'fixed', px: heightPx } },
    children: [text(label)],
  }
}

/** A row/stack container document over the given children. */
function containerDoc(layout: 'row' | 'stack', gapPx: number, children: L1Node[]): L1Document {
  const doc: L1Document = {
    widths: WIDTHS,
    background: '#ffffff',
    root: { kind: 'container', layout, gapPx, children },
  }
  const result = validateL1(doc)
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return doc
}

/** Map from a text leaf's content to its evaluated box at `width`. */
function textBoxes(doc: L1Document, width: number) {
  const { leaves, findings } = evaluateLayout(doc, width)
  const byText = new Map<string, { x: number; y: number; width: number; height: number }>()
  for (const l of leaves) if (l.kind === 'text' && l.text) byText.set(l.text, l.box)
  return { byText, findings }
}

describe('BUG-7 evaluateLayout flex-row semantics', () => {
  it('test_UAT_FC_BUG-7_row_children_tile_side_by_side', () => {
    // Three flex (unsized) text children in a 900px row with a 30px gap share the
    // leftover extent equally: (900 − 2·30) / 3 = 280px each, laid left to right.
    const doc = containerDoc('row', 30, [text('A'), text('B'), text('C')])
    const { byText, findings } = textBoxes(doc, 900)

    expect(byText.get('A')).toMatchObject({ x: 0, width: 280 })
    expect(byText.get('B')).toMatchObject({ x: 310, width: 280 })
    expect(byText.get('C')).toMatchObject({ x: 620, width: 280 })
    // Rightmost edge is exactly the viewport — no overflow, no overlap.
    expect(byText.get('C')!.x + byText.get('C')!.width).toBe(900)
    expect(findings).toEqual([])
  })

  it('test_UAT_FC_BUG-7_row_offsample_no_false_overflow', () => {
    // The exact regression: before the fix, N row children each took the full
    // width and were placed a full width apart, so the envelope probe reported
    // clip/overflow at intermediate widths. It must now be clean.
    const doc = containerDoc('row', 20, [text('one'), text('two'), text('three'), text('four')])
    const report = offSampleProbe(doc, { widths: [500, 900] })
    expect(report.pass, JSON.stringify(report.byWidth)).toBe(true)
  })

  it('test_UAT_FC_BUG-7_row_fixed_width_children_placed_by_own_width', () => {
    // A row mixing two fixed-width boxes and one flex child: the boxes take their
    // declared widths (200, 300); the flex child takes the remainder
    // (900 − 2·20 − 500 = 360). Each advances the cursor by its own width.
    const doc = containerDoc('row', 20, [
      fixedBox('A', 200),
      fixedBox('B', 300),
      text('C'),
    ])
    const { byText, findings } = textBoxes(doc, 900)

    expect(byText.get('A')).toMatchObject({ x: 0, width: 200 })
    expect(byText.get('B')).toMatchObject({ x: 220, width: 300 })
    expect(byText.get('C')).toMatchObject({ x: 540, width: 360 })
    expect(findings).toEqual([])
  })

  it('test_UAT_FC_BUG-7_row_genuine_overflow_still_flagged', () => {
    // Three 400px fixed boxes in a 900px row genuinely overflow (1200 > 900). The
    // fix removes *false* overflow, not real overflow — the clip must still fire.
    const doc = containerDoc('row', 0, [
      fixedBox('A', 400),
      fixedBox('B', 400),
      fixedBox('C', 400),
    ])
    const { byText, findings } = textBoxes(doc, 900)

    expect(byText.get('A')).toMatchObject({ x: 0 })
    expect(byText.get('B')).toMatchObject({ x: 400 })
    expect(byText.get('C')).toMatchObject({ x: 800 })
    expect(findings.some((f) => f.kind === 'clip')).toBe(true)
  })

  it('test_UAT_FC_BUG-7_column_stack_unchanged', () => {
    // Regression guard: a stack container still lays children full-width and
    // stacks them vertically (increasing y), never side by side.
    const doc = containerDoc('stack', 12, [text('first'), text('second'), text('third')])
    const { byText, findings } = textBoxes(doc, 900)

    for (const t of ['first', 'second', 'third']) {
      expect(byText.get(t)!.x).toBe(0)
      expect(byText.get(t)!.width).toBe(900)
    }
    expect(byText.get('second')!.y).toBeGreaterThan(byText.get('first')!.y)
    expect(byText.get('third')!.y).toBeGreaterThan(byText.get('second')!.y)
    expect(findings).toEqual([])
  })
})

// ── Browser-backed verification (skipped without a browser engine) ─────────────

const chromiumReady = await engineAvailable('chromium')
const itChromium = it.runIf(chromiumReady)

describe('BUG-7 row layout matches a real browser', () => {
  itChromium(
    'test_UAT_FC_BUG-7_row_matches_browser',
    async () => {
      // Three 200px boxes with a 20px gap in a full-width row. A real Chromium
      // lays them at x = 0 / 220 / 440; the analytic evaluator must agree.
      const doc = containerDoc('row', 20, [
        fixedBox('Alpha', 200),
        fixedBox('Bravo', 200),
        fixedBox('Charlie', 200),
      ])
      const width = 900
      const projections = await captureL1(doc, { engines: ['chromium'], widths: [width] })
      expect(projections.length).toBe(1)
      const captured = projections[0].manifest.elements

      const { byText } = textBoxes(doc, width)
      for (const label of ['Alpha', 'Bravo', 'Charlie']) {
        const real = captured.find((e) => e.text.trim() === label)
        expect(real?.box, `captured ${label}`).toBeDefined()
        const evalBox = byText.get(label)!
        // Analytic x within tolerance of the real render (side-by-side, in order).
        expect(Math.abs(real!.box!.x - evalBox.x), `${label} x drift`).toBeLessThanOrEqual(5)
        // Nothing overflows the viewport.
        expect(real!.box!.x + real!.box!.width).toBeLessThanOrEqual(width + 5)
      }
    },
    120000,
  )
})
