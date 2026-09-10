import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { EXTRACT_SCRIPT, type RawSignals, type RawRun } from '../tools/generate/src/cli'

/**
 * Reconciliation UAT for story-d5de22a5 — "Values-diff closes capture blind
 * spots", AC-631's **capture leg**.
 *
 * AC-631 has two legs, and its Criterion binds them together: the surface colour
 * "captured *and* compared" for an element is its effective rendered colour after
 * compositing translucent fills over what is painted behind them.
 *
 *   • The *compare* leg — two manifests carrying different surface colours produce
 *     a `surface` delta, matching ones do not — is owned by
 *     `test_UAT_AC631_surface_fill_is_composited_alpha_colour`
 *     (`reconcile-values-diff-fidelity.test.ts`), which drives the real
 *     `diffManifests`. That test derives its blended input from the compositing
 *     formula by hand and says so.
 *   • The *capture* leg — that `1c capture` records the blend in the first place —
 *     had no environment-independent evidence. Its only proof,
 *     `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band`
 *     (`tests/req58-wrapper-treatments.test.ts`), is real and correct but
 *     browser-gated behind `it.runIf(browserOk)`, so wherever Chromium is absent
 *     the clause "captured … is its effective rendered colour" has nothing
 *     executing behind it. This file is that missing leg.
 *
 * Boundary, following AC-711's capture leg
 * (`reconciliation-capture-list-marker.test.ts`): each case runs the real
 * `EXTRACT_SCRIPT` — the exact in-page script `1c capture` evaluates in the
 * browser — under jsdom, and reads the captured runs it returns. Nothing internal
 * is mocked, and no browser is required, so this holds in every environment.
 */

/**
 * Mount HTML in jsdom, run the real EXTRACT_SCRIPT, return every captured text run.
 *
 * jsdom performs no layout (every box would be 0 → filtered as invisible), so each
 * element declares its painted box with `data-box="x,y,w,h"`. Real boxes matter
 * more here than they do for AC-711's marker axis: the surface chain is ordered
 * **tightest-first by area**, so a card and the band behind it must have genuinely
 * different areas for the card to be found as the run's surface — which is exactly
 * what a real browser's layout provides.
 */
function extractRuns(bodyHtml: string): RawRun[] {
  const html = `<!doctype html><html><body>${bodyHtml}</body></html>`
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const win = dom.window as unknown as { eval(s: string): unknown }
  const R = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
  const DEFAULT: [number, number, number, number] = [0, 0, 1280, 1600]
  dom.window.Element.prototype.getBoundingClientRect = function (this: Element) {
    const declared = this.getAttribute?.('data-box')
    const [x, y, w, h] = declared ? (declared.split(',').map(Number) as [number, number, number, number]) : DEFAULT
    return R(x, y, w, h) as unknown as DOMRect
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })

  const signals = win.eval(EXTRACT_SCRIPT) as RawSignals
  return signals.bands.flatMap((b) => [...b.content, ...b.items.flat()])
}

/** Boxes for the three-layer band → card → run fixture, tightest last. */
const BAND_BOX = '0,0,1280,400'
const CARD_BOX = '100,100,600,200'
const RUN_BOX = '120,120,560,40'

/** The captured run whose text starts with `prefix` (runs carry the visible text). */
function run(runs: RawRun[], prefix: string): RawRun {
  const found = runs.find((r) => r.text.startsWith(prefix))
  expect(found, `run "${prefix}" captured`).toBeDefined()
  return found!
}

/** Split `#rrggbb` into its three channel values. */
function channels(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  expect(m, `'${hex}' is a #rrggbb colour`).not.toBeNull()
  return [parseInt(m![1], 16), parseInt(m![2], 16), parseInt(m![3], 16)]
}

// The band the card is laid over, and the card's own declared fill.
const BAND = '#3f6f4f'
const BAND_RGB: [number, number, number] = [0x3f, 0x6f, 0x4f]

describe('story-d5de22a5 — AC-631 composited surface fill (capture leg)', () => {
  it('test_UAT_AC631_capture_records_the_composited_surface_not_the_declared_fill', () => {
    // The fixture the AC names: a translucent WHITE card over a tinted band. The
    // card's declared `background-color` reads pure white, but what it renders —
    // and therefore what must be captured — is the pale tint the band shows
    // through it.
    const runs = extractRuns(`
      <section data-box="${BAND_BOX}" style="background-color:${BAND}">
        <div data-box="${CARD_BOX}" style="background-color:rgba(255, 255, 255, 0.5)">
          <p data-box="${RUN_BOX}" style="color:#111111">Translucent card copy.</p>
        </div>
      </section>`)

    const fill = run(runs, 'Translucent card copy.').surfaceFill
    expect(fill, 'a surface fill was captured for the card run').toBeTruthy()

    // NOT the declared channel — capturing #ffffff here is the bug this AC exists
    // to close, and it is what a reproduction would then paint.
    expect(fill).not.toBe('#ffffff')
    // NOT the bare band either: the card is a real surface, composited over it.
    expect(fill).not.toBe(BAND)

    // It is a genuine blend: every channel lies strictly between the band's and
    // white's, which is what "painter's over at alpha .5" means and what neither
    // of the two failure modes above would produce.
    const [r, g, b] = channels(fill!)
    const [br, bg, bb] = BAND_RGB
    expect(r, 'red between band and white').toBeGreaterThan(br)
    expect(r).toBeLessThan(255)
    expect(g, 'green between band and white').toBeGreaterThan(bg)
    expect(g).toBeLessThan(255)
    expect(b, 'blue between band and white').toBeGreaterThan(bb)
    expect(b).toBeLessThan(255)

    // …and it is the alpha-weighted midpoint, not merely "somewhere between":
    // 0.5·255 + 0.5·band, to within a rounding step.
    expect(r).toBeCloseTo((255 + br) / 2, -0.5)
    expect(g).toBeCloseTo((255 + bg) / 2, -0.5)
    expect(b).toBeCloseTo((255 + bb) / 2, -0.5)
  })

  it('test_UAT_AC631_same_effective_surface_is_captured_alike_from_different_declarations', () => {
    // The Criterion's consequence clause, stated at the capture end: "two elements
    // that render the same effective surface colour produce no surface-fill delta
    // even if their declared background colours differ". That can only hold if the
    // capture reports the EFFECTIVE colour — so the two declarations below, which
    // render identically, must be captured identically.

    // (a) translucent white over the tinted band — declared #ffffff.
    const translucent = extractRuns(`
      <section data-box="${BAND_BOX}" style="background-color:${BAND}">
        <div data-box="${CARD_BOX}" style="background-color:rgba(255, 255, 255, 0.5)">
          <p data-box="${RUN_BOX}" style="color:#111111">Blended card.</p>
        </div>
      </section>`)
    const blended = run(translucent, 'Blended card.').surfaceFill
    expect(blended).toBeTruthy()

    // (b) an OPAQUE card declared at that same blended hex, over a white page —
    //     a completely different declaration and a different thing behind it.
    const opaque = extractRuns(`
      <section data-box="${BAND_BOX}" style="background-color:#ffffff">
        <div data-box="${CARD_BOX}" style="background-color:${blended}">
          <p data-box="${RUN_BOX}" style="color:#111111">Opaque card.</p>
        </div>
      </section>`)

    // Same captured surface: the axis carries what is rendered, not what is
    // declared, so the diff compares like with like across the two sides of a
    // reproduction.
    expect(run(opaque, 'Opaque card.').surfaceFill).toBe(blended)
  })

  it('test_UAT_AC631_an_opaque_card_hides_the_band_behind_it', () => {
    // The guard that keeps the two legs above from passing for the wrong reason:
    // compositing must STOP at the first opaque fill. An opaque white card over
    // the same tinted band captures pure white — the band does not bleed into it.
    const runs = extractRuns(`
      <section data-box="${BAND_BOX}" style="background-color:${BAND}">
        <div data-box="${CARD_BOX}" style="background-color:#ffffff">
          <p data-box="${RUN_BOX}" style="color:#111111">Opaque white card.</p>
        </div>
      </section>`)

    expect(run(runs, 'Opaque white card.').surfaceFill).toBe('#ffffff')
  })
})
