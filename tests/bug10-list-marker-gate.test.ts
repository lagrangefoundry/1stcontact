import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { EXTRACT_SCRIPT, type RawSignals, type RawRun } from '../tools/generate/src/cli'

/**
 * BUG-10 — the capture stamped a phantom list marker on every non-list run.
 *
 * `list-style-type` has a CSS *initial value* of `disc` on EVERY element, so the
 * old `listMarkerOf` (which read the computed value unconditionally) recorded
 * `listMarker: 'disc'` on headings, the wordmark, and body copy — and the
 * renderer faithfully painted a bullet on all of them. The fix gates on
 * `display: list-item` (the only elements for which the browser generates a
 * ::marker box): a genuine <li> keeps its marker; everything else reports null.
 *
 * These UATs run the real EXTRACT_SCRIPT under jsdom. To mirror the real browser,
 * non-list elements carry an explicit `list-style-type` (jsdom does not apply the
 * UA `disc` default, so an inline value reproduces the exact computed-style input
 * a real browser presents for a plain heading/paragraph). The gate must suppress
 * it there while preserving a real list item's marker.
 */

/** Mount HTML in jsdom and run the real EXTRACT_SCRIPT, returning every text run. */
function extractRuns(bodyHtml: string): RawRun[] {
  const html = `<!doctype html><html><body>${bodyHtml}</body></html>`
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const win = dom.window as unknown as { eval(s: string): unknown }
  const R = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
  // jsdom does no layout (all boxes 0 → filtered as invisible), so give every
  // element a real painted box and a document large enough to contain it.
  dom.window.Element.prototype.getBoundingClientRect = function () {
    return R(64, 48, 600, 40) as unknown as DOMRect
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })

  const signals = win.eval(EXTRACT_SCRIPT) as RawSignals
  return signals.bands.flatMap((b) => [...b.content, ...b.items.flat()])
}

describe('BUG-10 — list marker gated on display:list-item', () => {
  it('test_UAT_FC_BUG-10_non_list_runs_have_no_phantom_marker', () => {
    // The wordmark <h1> and a body <p> both carry the initial-value disc a real
    // browser reports; neither is a list item, so neither must get a marker.
    const runs = extractRuns(`
      <section style="background:#ffffff">
        <h1 style="list-style-type:disc">Gigabyte Alchemy</h1>
        <p style="list-style-type:disc">A voice-first app that helps you think.</p>
      </section>`)

    const wordmark = runs.find((r) => r.text === 'Gigabyte Alchemy')!
    const body = runs.find((r) => r.text.startsWith('A voice-first'))!
    expect(wordmark, 'wordmark captured').toBeDefined()
    expect(body, 'body captured').toBeDefined()
    // Before the fix these were 'disc' — a bullet on the wordmark and every line.
    expect(wordmark.listMarker).toBeNull()
    expect(body.listMarker).toBeNull()
  })

  it('test_UAT_FC_BUG-10_genuine_list_item_keeps_its_marker', () => {
    // A real list item (display:list-item) with a painted marker must be recorded.
    const runs = extractRuns(`
      <section style="background:#ffffff">
        <ul><li style="list-style-type:disc">Pick a starting point.</li></ul>
      </section>`)
    const item = runs.find((r) => r.text === 'Pick a starting point.')!
    expect(item, 'list item captured').toBeDefined()
    expect(item.listMarker).toBe('disc')
  })

  it('test_UAT_FC_BUG-10_list_item_with_none_has_no_marker', () => {
    // list-style-type:none on a genuine list item still suppresses the marker.
    const runs = extractRuns(`
      <section style="background:#ffffff">
        <ul><li style="list-style-type:none">Unmarked item.</li></ul>
      </section>`)
    const item = runs.find((r) => r.text === 'Unmarked item.')!
    expect(item, 'list item captured').toBeDefined()
    expect(item.listMarker).toBeNull()
  })

  it('test_UAT_FC_BUG-10_mixed_list_and_non_list_fixture', () => {
    // The regression fixture: a heading beside a real list — only the list item
    // carries a marker.
    const runs = extractRuns(`
      <section style="background:#ffffff">
        <h2 style="list-style-type:disc">Steps</h2>
        <ul><li style="list-style-type:decimal">First do this.</li></ul>
      </section>`)
    const heading = runs.find((r) => r.text === 'Steps')!
    const item = runs.find((r) => r.text === 'First do this.')!
    expect(heading.listMarker).toBeNull()
    expect(item.listMarker).toBe('decimal')
  })
})
