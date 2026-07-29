import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { EXTRACT_SCRIPT, type RawSignals, type RawRun } from '../tools/generate/src/cli'

/**
 * Reconciliation UAT for story-d5de22a5 — "Values-diff closes capture blind
 * spots", AC-711's **painted-marker precondition**.
 *
 * AC-711 has two legs. The *comparison* leg (the list marker, alongside
 * font-style / decoration / transform / small-caps, is diffed per text run) is
 * covered by `reconcile-values-diff-treatments.test.ts`. This file covers the
 * *capture* leg the AC pins: an axis must record only what is painted.
 *
 * `list-style-type` has a CSS **initial value** of `disc` on EVERY element, so
 * reading it unconditionally stamped a phantom marker on ordinary headings,
 * wordmarks and body copy — which the fold carried and the renderer faithfully
 * painted as a bullet on every line. A ::marker box is generated only for an
 * element laid out as a list item, so the capture is gated on that: a non-list
 * run records no marker, a genuine list item keeps its own marker type
 * (including a non-`disc` type such as `decimal`), and `list-style-type: none`
 * still suppresses a real list item's marker.
 *
 * Boundary: each case runs the real `EXTRACT_SCRIPT` — the exact in-page script
 * `1c capture` evaluates in the browser — under jsdom, and reads the captured
 * runs it returns. Nothing internal is mocked. Non-list elements carry an
 * explicit `list-style-type` because jsdom does not apply the UA `disc` default;
 * the inline value reproduces the exact computed-style input a real browser
 * presents for a plain heading or paragraph, which is precisely the input the
 * precondition must suppress.
 */

/** Mount HTML in jsdom, run the real EXTRACT_SCRIPT, return every captured text run. */
function extractRuns(bodyHtml: string): RawRun[] {
  const html = `<!doctype html><html><body>${bodyHtml}</body></html>`
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const win = dom.window as unknown as { eval(s: string): unknown }
  const R = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
  // jsdom performs no layout (every box would be 0 → filtered as invisible), so
  // give each element a real painted box and a document large enough to hold it.
  dom.window.Element.prototype.getBoundingClientRect = function () {
    return R(64, 48, 600, 40) as unknown as DOMRect
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })

  const signals = win.eval(EXTRACT_SCRIPT) as RawSignals
  return signals.bands.flatMap((b) => [...b.content, ...b.items.flat()])
}

/** The captured run whose text starts with `prefix` (runs carry the visible text). */
function run(runs: RawRun[], prefix: string): RawRun {
  const found = runs.find((r) => r.text.startsWith(prefix))
  expect(found, `run "${prefix}" captured`).toBeDefined()
  return found!
}

describe('story-d5de22a5 — AC-711 painted-marker precondition (capture leg)', () => {
  it('test_UAT_AC711_list_marker_recorded_only_where_a_marker_is_painted', () => {
    // (1) Non-list runs carrying the CSS initial value record NO marker. Before
    //     the precondition these captured 'disc' — a bullet on the wordmark and
    //     on every line of body copy in the reproduction.
    const plain = extractRuns(`
      <section style="background:#ffffff">
        <h1 style="list-style-type:disc">Gigabyte Alchemy</h1>
        <p style="list-style-type:disc">A voice-first app that helps you think.</p>
      </section>`)
    expect(run(plain, 'Gigabyte Alchemy').listMarker, 'heading records no phantom marker').toBeNull()
    expect(run(plain, 'A voice-first').listMarker, 'body copy records no phantom marker').toBeNull()

    // (2) A genuine list item keeps its own marker type — both the default disc
    //     and a non-disc type, so the axis carries a real value, not a constant.
    for (const marker of ['disc', 'decimal'] as const) {
      const listed = extractRuns(`
        <section style="background:#ffffff">
          <ul><li style="list-style-type:${marker}">Pick a starting point.</li></ul>
        </section>`)
      expect(run(listed, 'Pick a starting point.').listMarker, `list item keeps its ${marker} marker`).toBe(marker)
    }

    // (3) A real list item whose marker is suppressed (list-style-type: none)
    //     records none — suppression survives the gate.
    const suppressed = extractRuns(`
      <section style="background:#ffffff">
        <ul><li style="list-style-type:none">Unmarked item.</li></ul>
      </section>`)
    expect(run(suppressed, 'Unmarked item.').listMarker, 'suppressed marker records none').toBeNull()

    // (4) The mixed fixture the AC names: non-list elements beside a genuine
    //     list. Only the list item carries a marker; the axis is comparable
    //     exactly where a marker is genuinely painted.
    const mixed = extractRuns(`
      <section style="background:#ffffff">
        <h2 style="list-style-type:disc">Steps</h2>
        <p style="list-style-type:disc">Follow these in order.</p>
        <ul><li style="list-style-type:decimal">First do this.</li></ul>
      </section>`)
    expect(run(mixed, 'Steps').listMarker).toBeNull()
    expect(run(mixed, 'Follow these in order.').listMarker).toBeNull()
    expect(run(mixed, 'First do this.').listMarker).toBe('decimal')
  })
})
