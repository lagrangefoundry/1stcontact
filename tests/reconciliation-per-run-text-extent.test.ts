import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  flattenSignals,
  type RawSignals,
  type ValueManifest,
} from '../tools/generate/src/cli'
import type { ValueDelta } from '../tools/generate/src/cli/capture'

/**
 * Reconciliation UATs for story-d5de22a5 — AC-1605: a run's rendered extent is
 * measured off **the node that owns its glyphs**.
 *
 * Drives the real `EXTRACT_SCRIPT` under jsdom and then the real `flattenSignals` →
 * `diffManifests` pipeline. Browser-free, so unlike the free-coded evidence it
 * executes everywhere.
 *
 * Relationship to the free-coded evidence: `bug25-multiline-run-geometry.test.ts`
 * carries five `test_UAT_FC_BUG-25_*` tests — but four of them are gated behind
 * `it.runIf(browserOk)` and only the fold test (`…_distinct_run_boxes_stack_and_pin_
 * in_the_fold`) runs without Chromium. So in an environment with no browser the
 * *capture* claim AC-1605 makes has nothing executing behind it at all. This file
 * is that missing evidence, plus the diff clause the AC's Verification closes on,
 * which no sibling makes under any name.
 *
 * On the nested-span shape — see `test_UAT_AC1605_a_nested_span_gives_each_owner_
 * its_own_extent` below. The AC's Criterion and its Verification disagree about
 * that one case, and the Criterion is what is asserted here.
 */

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/**
 * Layout stubbed per element by class, and glyph extents stubbed per **text node**
 * keyed on that node's own text. The per-text-node stub is the whole point: it is
 * what lets a multi-run element's runs be measured separately, exactly as a real
 * browser measures them, so the extractor's choice of node is observable.
 */
function extract(html: string, elBoxes: Record<string, Box>, textBoxes: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const b = elBoxes[(this as Element).className || '']
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  dom.window.Range.prototype.getBoundingClientRect = function () {
    const n = (this as Range).startContainer as Node
    // A Range over a TEXT NODE — the BUG-25 path.
    if (n && n.nodeType === 3) {
      const b = textBoxes[(n.textContent ?? '').trim()]
      return b ? rect(...b) : rect(0, 0, 0, 0)
    }
    // A Range over an element's contents — the single-run path.
    const b = elBoxes[((n as Element)?.className as string) || '']
    return b ? rect(b[0], b[1], b[2], Math.min(b[3], 24)) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 2000 })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

const SOLO = 'Single run heading'
const LINE_1 = 'Line one here'
const LINE_2 = 'Line two here'
const OUTER = 'Outer bit'
const INNER = 'inner bit'

/** The shared element boxes. The `<p>` is a full-width block — 1200px. */
const EL_BOXES: Record<string, Box> = {
  band: [0, 0, 1280, 600],
  solo: [40, 40, 1200, 48],
  para: [40, 120, 1200, 60],
  mixed: [40, 220, 1200, 40],
  inner: [300, 220, 200, 40],
}

/** Per-text-node glyph extents. Each line is far narrower than the shared block. */
function page(lineOneWidth = 180): RawSignals {
  const html =
    `<!doctype html><html><body><div class="band" style="background-color:rgb(255,255,255)">` +
    `<h1 class="solo">${SOLO}</h1>` +
    `<p class="para">${LINE_1}<br>${LINE_2}</p>` +
    `<h2 class="mixed">${OUTER} <span class="inner">${INNER}</span></h2>` +
    `</div></body></html>`
  return extract(html, EL_BOXES, {
    [SOLO]: [40, 44, 320, 40],
    [LINE_1]: [40, 124, lineOneWidth, 24],
    [LINE_2]: [40, 154, 190, 24],
    [OUTER]: [40, 224, 120, 32],
    [INNER]: [300, 224, 200, 32],
  })
}

const manifest = (s: RawSignals, source: string): ValueManifest => flattenSignals(s, source)
const elementFor = (m: ValueManifest, text: string) => m.elements.find((e) => e.text === text)!

describe('story-d5de22a5 — AC-1605 a run is measured off the node owning its glyphs', () => {
  it('test_UAT_AC1605_a_single_run_element_contributes_its_own_rendered_text_box', () => {
    // "An element contributes its own rendered text box only when it owns exactly
    // one text run." The heading owns one, so its extent is the element's own
    // contents Range — not a per-text-node measurement.
    const solo = elementFor(manifest(page(), 'x'), SOLO)

    expect(solo.renderedTextBox).toEqual({ x: 40, y: 40, width: 1200, height: 24 })
    // …which is the element-level measurement, distinct from the text node's own
    // rect, so this really is the ownRun branch and not the BUG-25 one.
    expect(solo.renderedTextBox!.width).not.toBe(320)
  })

  it('test_UAT_AC1605_each_run_of_a_br_broken_paragraph_gets_its_own_text_node_rect', () => {
    // The central claim. A `<p>` broken by `<br>` owns two runs, so neither may
    // take the shared element box: each is measured off its own text node.
    const m = manifest(page(), 'x')
    const one = elementFor(m, LINE_1)
    const two = elementFor(m, LINE_2)

    // Each matches that run's own text-node rect…
    expect(one.renderedTextBox).toEqual({ x: 40, y: 124, width: 180, height: 24 })
    expect(two.renderedTextBox).toEqual({ x: 40, y: 154, width: 190, height: 24 })
    // …they DIFFER from each other — the pathology is that they came out identical…
    expect(one.renderedTextBox).not.toEqual(two.renderedTextBox)
    // …and each is far narrower than the shared 1200px block box.
    const shared = EL_BOXES.para[2]
    expect(one.renderedTextBox!.width).toBeLessThan(shared)
    expect(two.renderedTextBox!.width).toBeLessThan(shared)
    // The runs also stack rather than sharing a y, so a fold placing them
    // absolutely cannot print one on top of the other.
    expect(one.renderedTextBox!.y).not.toBe(two.renderedTextBox!.y)
  })

  it('test_UAT_AC1605_a_nested_span_gives_each_owner_its_own_extent', () => {
    // A heading with a nested span. NOTE — the AC's Criterion and Verification
    // disagree here, and the Criterion is what is asserted:
    //
    //   Criterion: "An element contributes its own rendered text box only when it
    //   owns exactly one text run." The <h2> owns exactly one text node ("Outer
    //   bit") and the <span> owns exactly one ("inner bit"), so BOTH take the
    //   ownRun branch and are measured at element level. That is what the code
    //   does (`runCounts.get(el) === 1`, extract.ts:1123).
    //
    //   Verification: asks that each run match "that run's own text-node rect",
    //   which for the <h2>'s run it does not — it is the element measurement.
    //
    // What the AC is actually protecting against is the extents coming out
    // IDENTICAL, which is what makes runs print on top of one another. That is
    // asserted here, and the wording gap is forwarded for an ac-level pass.
    const m = manifest(page(), 'x')
    const outer = elementFor(m, OUTER)
    const inner = elementFor(m, INNER)

    // Two distinct owners, two distinct extents — never the same box twice.
    expect(outer.renderedTextBox).not.toEqual(inner.renderedTextBox)
    expect(inner.renderedTextBox!.x).toBe(300)
    expect(outer.renderedTextBox!.x).toBe(40)
    // Each is its own owner's element-level measurement.
    expect(outer.renderedTextBox!.width).toBe(EL_BOXES.mixed[2])
    expect(inner.renderedTextBox!.width).toBe(EL_BOXES.inner[2])
  })

  it('test_UAT_AC1605_a_one_line_difference_is_reported_for_that_line_alone', () => {
    // The AC's closing clause: with per-run extents, a reproduction that differs on
    // ONE line of the paragraph surfaces a rendered-text-extent delta for that line
    // and no other. Sharing the block box would make both lines report the same
    // 1200px width, so a real per-line difference would be invisible.
    const deltas: ValueDelta[] = diffManifests(
      manifest(page(180), 'ref'),
      manifest(page(260), 'repro'), // line one is 44% wider; line two identical
    ).deltas

    const extent = deltas.filter((d) => d.property === 'renderedTextBox')
    expect(extent, 'exactly one line is flagged').toHaveLength(1)
    expect(extent[0].text).toBe(LINE_1)
    // The untouched sibling line is silent — the isolation the axis exists for.
    expect(extent.some((d) => d.text === LINE_2)).toBe(false)

    // And an identical pair raises nothing, so the axis is not simply always on.
    expect(
      diffManifests(manifest(page(180), 'ref'), manifest(page(180), 'repro')).deltas.filter(
        (d) => d.property === 'renderedTextBox',
      ),
    ).toEqual([])
  })
})
