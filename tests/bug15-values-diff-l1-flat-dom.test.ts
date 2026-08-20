/**
 * BUG-15 — `1c values-diff` could not read an L1-rendered page, so it was a
 * frozen scoreboard: it returned byte-identical output (every reference element
 * "missing (present → absent)") across two renders that changed completely.
 *
 * Root cause: the in-page extractor segments the page into style-scope *bands* =
 * the top-level `<body>` children ≥8px tall. The L1 renderer emits a FLAT tree of
 * absolutely-positioned leaves under one wrapper; abs-positioned children leave no
 * in-flow box, so the wrapper collapses to height 0, is dropped by the ≥8px scan,
 * and the actual manifest comes back EMPTY — every target then reads "missing",
 * identically, whatever we rendered.
 *
 * Fix: when the top-level band scan finds nothing yet the body still paints
 * content, fall back to one body-spanning band so the flat tree's runs are still
 * collected (paired downstream by text). Semantic sites always have real ≥8px
 * bands, so the fallback stays dormant for them (the no-regression UAT).
 *
 * The extraction UATs run the real `EXTRACT_SCRIPT` under jsdom (getBoundingClient-
 * Rect stubbed per element, mirroring the REQ-63 harness); the scoreboard UAT then
 * drives the pure `diffManifests` over the extracted manifests.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  flattenSignals,
  diffManifests,
  type RawSignals,
} from '../tools/generate/src/cli'

type Box = [x: number, y: number, w: number, h: number]
interface Leaf {
  text: string
  box: Box
}

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Run the real EXTRACT_SCRIPT over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const cls = (this as Element).className || ''
    const b = boxByClass[cls]
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

/**
 * A flat L1-shaped page: all leaves nested under one wrapper (`l1-0`) whose box
 * collapses to height 0 (abs children leave no in-flow height) — exactly what the
 * L1 renderer produces. Each leaf carries a UNIQUE class (`l1-1`, `l1-2`, …) as
 * the renderer does, so they are not mistaken for a repeated item group.
 */
function flatL1(leaves: Leaf[]): RawSignals {
  const inner = leaves
    .map((l, i) => `<p class="l1-${i + 1}" style="position:absolute">${l.text}</p>`)
    .join('')
  const html = `<!doctype html><html><body><div class="l1-0" style="position:relative">${inner}</div></body></html>`
  const boxes: Record<string, Box> = { 'l1-0': [0, 0, 0, 0] }
  leaves.forEach((l, i) => (boxes[`l1-${i + 1}`] = l.box))
  return extract(html, boxes)
}

const FULL: Leaf[] = [
  { text: 'Front door heading', box: [20, 100, 600, 48] },
  { text: 'Body copy line', box: [20, 170, 600, 48] },
  { text: 'Caption row', box: [20, 240, 600, 48] },
]

const contentTexts = (s: RawSignals): string[] => s.bands.flatMap((b) => b.content).map((r) => r.text)
const missingTexts = (deltas: { property: string; text: string }[]): string[] =>
  deltas.filter((d) => d.property === 'missing').map((d) => d.text).sort()

describe('BUG-15 — values-diff reads the flat, absolutely-positioned L1 DOM', () => {
  it('test_UAT_AC1315_extract_populates_content_from_collapsed_flat_tree', () => {
    // The wrapper collapses to height 0, so the ≥8px top-level band scan finds
    // nothing. Pre-fix the actual manifest was empty; post-fix the body-band
    // fallback collects every leaf.
    const sig = flatL1(FULL)
    expect(sig.bands.length).toBeGreaterThan(0)
    const texts = contentTexts(sig)
    expect(texts).toContain('Front door heading')
    expect(texts).toContain('Body copy line')
    expect(texts).toContain('Caption row')
  })

  it('test_UAT_AC1315_scoreboard_moves_when_render_changes', () => {
    // The reference (target) and two DIFFERENT reproductions of it.
    const target = flattenSignals(flatL1(FULL), 'target')
    const renderHeadingOnly = flattenSignals(flatL1([FULL[0]]), 'renderA')
    const renderComplete = flattenSignals(flatL1(FULL), 'renderB')

    const reportA = diffManifests(target, renderHeadingOnly)
    const reportB = diffManifests(target, renderComplete)

    // A complete reproduction pairs every element — NOT "~all missing".
    expect(reportB.matched).toBe(3)
    expect(reportB.unmatched).toBe(0)
    // A partial reproduction genuinely misses the two absent runs.
    expect(reportA.matched).toBe(1)
    expect(reportA.unmatched).toBe(2)
    // The scoreboard MOVES when the render changes (the frozen byte-identical
    // output was the whole bug): matched count differs and the missing set differs.
    expect(reportA.matched).not.toBe(reportB.matched)
    expect(missingTexts(reportA.deltas)).toEqual(['Body copy line', 'Caption row'])
    expect(missingTexts(reportB.deltas)).toEqual([])
    expect(missingTexts(reportA.deltas)).not.toEqual(missingTexts(reportB.deltas))
  })

  it('test_UAT_AC1315_semantic_multiband_dom_bypasses_fallback', () => {
    // No-regression guard: a conventional multi-section page still segments into
    // its real top-level bands — the body-span fallback stays dormant (it must
    // fire ONLY when the ≥8px scan is empty), so a normal site is unaffected.
    const html =
      '<!doctype html><html><body>' +
      '<section class="s1"><h1 class="t1">Alpha</h1></section>' +
      '<section class="s2"><h1 class="t2">Beta</h1></section>' +
      '</body></html>'
    const sig = extract(html, {
      s1: [0, 0, 1280, 200],
      s2: [0, 200, 1280, 200],
      t1: [20, 40, 600, 48],
      t2: [20, 240, 600, 48],
    })
    // Two real bands, one per section — NOT one collapsed body-span band.
    expect(sig.bands.length).toBe(2)
    expect(contentTexts(sig).sort()).toEqual(['Alpha', 'Beta'])
  })
})
