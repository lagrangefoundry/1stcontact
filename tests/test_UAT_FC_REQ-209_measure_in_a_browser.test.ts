/**
 * REQ-209 — the measuring script, in a real browser (DOC-52 §3.3, §5.3).
 *
 * WHY A REAL BROWSER. Every number this file asserts is one only a rendering
 * engine can produce: the pen's position after a `<tspan>`, the painted extent of
 * a glyph as against its advance, the cap height of the face that actually
 * resolved, the box of a node inside a transformed group. jsdom answers none of
 * them — it has no `getBBox`, no `getExtentOfChar` and no canvas text metrics — so
 * a jsdom version of this file would assert the shape of the return value and
 * prove nothing about the measurement.
 *
 * IT SKIPS VISIBLY RATHER THAN PASSING VACUOUSLY. Where no Chromium can be
 * launched — no browser installed, or an OS sandbox that refuses to let one
 * start — every browser-dependent case below marks itself skipped and the reason
 * is printed. A green tick standing in for a measurement nobody took is the one
 * outcome this file must never produce, because it is indistinguishable from
 * evidence.
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { measureScript } from '../tools/generate/src/cli/capture/measure-svg'
import type { RawMeasurement } from '../tools/generate/src/cli/capture/measure-svg'

const REPO = path.resolve(__dirname, '..')

/** See `req117-builder-viewport-fill.test.ts` — playwright is tools/generate's. */
async function loadChromium(): Promise<typeof import('playwright').chromium | undefined> {
  try {
    const require = createRequire(path.join(REPO, 'tools/generate/package.json'))
    const entry = pathToFileURL(require.resolve('playwright')).href
    const mod = (await import(/* @vite-ignore */ entry)) as Record<string, never>
    return (mod.chromium ?? (mod.default as Record<string, never>)?.chromium) as never
  } catch {
    return undefined
  }
}

async function launchAnyChromium(
  chromium: typeof import('playwright').chromium,
): Promise<import('playwright').Browser | undefined> {
  for (const opts of [{}, { channel: 'chrome' as const }]) {
    try {
      return await chromium.launch(opts)
    } catch {
      /* try the next */
    }
  }
  return undefined
}

/**
 * The composed wordmark: ONE `<text>` with `<tspan>` children.
 *
 * The second and third runs carry no `x` at all, which is the authoring rule
 * this ticket ships — the browser advances the pen and the position is exactly
 * right in whatever font resolves, so there is nothing to guess and nothing to
 * re-tune on another machine.
 */
const COMPOSED =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 86">' +
  '<text id="mark" x="0" y="62" font-family="monospace" font-size="62" font-weight="700">' +
  '<tspan id="one">1</tspan>' +
  '<tspan id="ord" font-size="20" dy="-33">st</tspan>' +
  '<tspan id="rest" dy="33">Contact</tspan>' +
  '</text>' +
  '<line x1="80" y1="78" x2="240" y2="78" stroke="#e76f51" stroke-width="3.5"/>' +
  '<text id="empty" x="0" y="80" font-family="monospace" font-size="10"></text>' +
  '</svg>'

/** A mark that names no real font — the defect the authoring rule forbids. */
const PLATFORM_DEPENDENT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">' +
  '<text id="w" x="0" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="40">Ax</text>' +
  '</svg>'

/** A mark that names a font nothing has, behind a generic fallback. */
const ABSENT_FONT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">' +
  '<text id="w" x="0" y="40" font-family="Nonesuch Whatever, serif" font-size="40">Ax</text>' +
  '</svg>'

/** A node inside a translated group — the transform must be resolved away. */
const NESTED =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">' +
  '<g transform="translate(40,10)"><rect id="box" x="5" y="5" width="20" height="10"/></g>' +
  '</svg>'

let chromium: typeof import('playwright').chromium | undefined
let browser: import('playwright').Browser | undefined
let why = ''

beforeAll(async () => {
  chromium = await loadChromium()
  if (!chromium) {
    why = 'playwright is not installed in tools/generate'
    console.warn(
      `REQ-209 browser suite SKIPPED — ${why}. The measurement itself is unverified here.`,
    )
    return
  }
  browser = await launchAnyChromium(chromium)
  if (!browser) {
    why = 'no Chromium could be launched (run `npx playwright install chromium`)'
    console.warn(
      `REQ-209 browser suite SKIPPED — ${why}. The measurement itself is unverified here.`,
    )
  }
}, 120_000)

afterAll(async () => {
  await browser?.close()
})

/** Render one drawing in a blank page and hand back what the script says. */
async function measure(svg: string): Promise<RawMeasurement> {
  const page = await browser!.newPage()
  try {
    await page.setContent('<!doctype html><html><body></body></html>')
    return (await page.evaluate(measureScript(svg))) as RawMeasurement
  } finally {
    await page.close()
  }
}

const nodeOf = (m: RawMeasurement, ref: string) => m.nodes.find((n) => n.ref === ref)!

describe('REQ-209 measuring a drawing for real', () => {
  /**
   * The one assertion here that does NOT need a browser, and the reason it is
   * here rather than in the other file: everything below it is skipped wherever
   * Chromium cannot be launched, and a syntax error in the script would then be
   * invisible on exactly the machines that cannot catch it any other way. This
   * costs nothing and closes that window — the script is a string until a
   * browser evaluates it, so nothing else compiles it either.
   */
  it('test_UAT_FC_REQ_209_the_measuring_script_is_valid_javascript', () => {
    // Compiled, never called: `new Function` parses the body and does not run it.
    expect(() => new Function(`return ${measureScript(COMPOSED)}`)).not.toThrow()
  })

  it('test_UAT_FC_REQ_209_composed_runs_place_themselves', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(COMPOSED)
    const one = nodeOf(m, '#one')
    const ord = nodeOf(m, '#ord')
    const rest = nodeOf(m, '#rest')
    // Neither of the later runs was given an `x`, and both land after the one
    // before it. The pen did the work.
    expect(ord.advanceStart!).toBeGreaterThan(one.advanceStart!)
    expect(rest.advanceStart!).toBeGreaterThan(ord.advanceStart!)
    // And each starts exactly where the previous one's pen landed.
    expect(ord.advanceStart!).toBeCloseTo(one.advanceStart! + one.advanceWidth!, 1)
    expect(rest.advanceStart!).toBeCloseTo(ord.advanceStart! + ord.advanceWidth!, 1)
  })

  it('test_UAT_FC_REQ_209_ink_and_advance_are_measurably_different', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(COMPOSED)
    const one = nodeOf(m, '#one')
    const inkRight = one.ink![0] + one.ink![2]
    const advanceEnd = one.advanceStart! + one.advanceWidth!
    // "Where the 1 ends" has two answers, and at this size they are units apart —
    // which is why the vocabulary names the families separately.
    expect(advanceEnd).toBeGreaterThan(inkRight + 0.5)
  })

  it('test_UAT_FC_REQ_209_every_glyph_has_an_extent', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(COMPOSED)
    const rest = nodeOf(m, '#rest')
    expect(rest.glyphs).toHaveLength('Contact'.length)
    expect(rest.glyphs![0].char).toBe('C')
    // Left to right, each glyph past the one before — the question the ruler
    // grid was drawn into the picture to answer.
    for (let i = 1; i < rest.glyphs!.length; i += 1) {
      expect(rest.glyphs![i].box[0]).toBeGreaterThanOrEqual(rest.glyphs![i - 1].box[0])
    }
  })

  it('test_UAT_FC_REQ_209_a_node_with_no_id_appears_under_its_path', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(COMPOSED)
    const line = m.nodes.find((n) => n.kind === 'line')!
    expect(line.id).toBeNull()
    expect(line.ref).toMatch(/^0(\.\d+)+$/)
    expect(line.box[0]).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ_209_an_empty_node_is_flagged_not_omitted', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(COMPOSED)
    const empty = nodeOf(m, '#empty')
    // "Empty" must never be indistinguishable from "not measured".
    expect(empty.degenerate).toBe(true)
  })

  it('test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(COMPOSED)
    expect(m.fonts.length).toBeGreaterThan(0)
    const font = m.fonts[0]
    expect(font.capHeight).toBeGreaterThan(0.4)
    expect(font.capHeight).toBeLessThan(0.95)
    expect(font.xHeight).toBeLessThan(font.capHeight)
    expect(font.ascender).toBeGreaterThan(0)
    expect(font.descender).toBeLessThan(0)
    // Cap-top derived from the ratio lands on the real ink top of a capital.
    const rest = nodeOf(m, '#rest')
    const capTop = rest.baseline! - font.capHeight * rest.fontSize!
    expect(capTop).toBeCloseTo(rest.ink![1], 0)
  })

  it('test_UAT_FC_REQ_209_a_drawing_that_names_no_real_font_is_reported_as_such', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(PLATFORM_DEPENDENT)
    const font = m.fonts[0]
    expect(font.generic).toBe(true)
    // What was asked for and what came back are not the same thing, which is how
    // the authoring rule is caught in practice rather than only in principle.
    expect(font.resolved).not.toBe(font.requested)
  })

  it('test_UAT_FC_REQ_209_an_absent_family_falls_through_to_the_fallback', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(ABSENT_FONT)
    const font = m.fonts[0]
    expect(font.requested).toMatch(/Nonesuch/)
    expect(font.resolved).toBe('serif')
    expect(font.generic).toBe(true)
  })

  it('test_UAT_FC_REQ_209_a_nested_transform_is_resolved_away', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(NESTED)
    const box = nodeOf(m, '#box')
    // Authored at 5,5 inside a translate(40,10): reported where it actually is.
    expect(box.box[0]).toBeCloseTo(45, 3)
    expect(box.box[1]).toBeCloseTo(15, 3)
    expect(box.box[2]).toBeCloseTo(20, 3)
  })

  it('test_UAT_FC_REQ_209_the_viewbox_comes_back', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)
    const m = await measure(COMPOSED)
    expect(m.viewBox).toEqual([0, 0, 320, 86])
    expect(m.space).toMatch(/root user units/)
  })
})
