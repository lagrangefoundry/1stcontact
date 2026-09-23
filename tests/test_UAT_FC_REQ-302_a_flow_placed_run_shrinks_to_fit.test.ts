/**
 * REQ-302 issue 1 — a relaxed run resets its width to `fit-content`, which is
 * shrink-to-fit in BOTH placement frames.
 *
 * REQ-117 made a run that cannot wrap treat its captured width as a FLOOR
 * rather than as a fixed size, so an operator who lengthens the copy grows the
 * box instead of overflowing it. The mechanism is a pair of declarations on
 * each relaxed rung — `width: <reset>; min-width: <captured>px` — and the reset
 * is load-bearing: the rungs are cumulative overrides of the same property, so
 * without it the lowest rung's interpolation stays live far outside the segment
 * it was fitted to (`calc(-836.545px + 314.545vw)` is 3190px at 1280px wide).
 *
 * REQ-117 wrote `auto`, and `auto` WAS shrink-to-fit — every placement was
 * absolute then, and on an absolutely positioned box `width: auto` shrinks to
 * its content.
 *
 * REQ-278's flow recovery changed the frame underneath it. A flow-placed run is
 * a block-level box with `position: relative`, and there `auto` means "fill the
 * containing block". So a relaxed run in flow stretched to its column — a
 * wordmark captured at 686px rendered at 1192px — and because the wordmark's
 * treatment is a `background-clip: text` gradient, the gradient was then painted
 * across the wrong area and the glyphs were left stranded in the flat head of
 * the ramp. It cost 609.22 of one round's 1043.47 ranked region score (58.4%)
 * and 10 of its 20 individual value deltas.
 *
 * `fit-content` is shrink-to-fit in both frames and still grows with longer
 * content, so REQ-117's stated purpose is unchanged and now holds in flow as
 * well. One declaration serves both, which is why the fix is a keyword and not
 * a second code path keyed on placement.
 */
import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { foldToL1, measuredTextHeights, promoteToFlow } from '../tools/generate/src/l1'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src/index'
import { chromiumAvailable, createEngineDriver } from '../tools/generate/src/cli'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const WORDMARK = 'Gigabyte Alchemy'
/** The width the wordmark was captured at, and must still render at. */
const WORDMARK_PX = 686

function el(over: Partial<ValueElement> & { text: string }): ValueElement {
  const base = {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
  // One rendered line at every width — what the fold reads to decide the run
  // cannot wrap, which is the gate REQ-117's floor sits behind.
  const b = base.box!
  return { ...base, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 21 } }
}

/**
 * A stack of runs tight enough that grown copy overruns the line below, which
 * is what makes `promoteToFlow` choose flow — so the frame under test is the
 * one REQ-278 actually produces, not one this fixture declares.
 */
function stackedCapture(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `req302@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: [
        el({ text: WORDMARK, box: { x: 24, y: 100, width: WORDMARK_PX, height: 90 } }),
        el({ text: 'Line one of the body copy here', box: { x: 24, y: 220, width: width - 48, height: 29 } }),
        el({ text: 'Line two of the body copy here', box: { x: 24, y: 260, width: width - 48, height: 29 } }),
      ],
    },
  })) as never
  return { url: 'http://req302.test/', notes: [], projections } as never
}

/** The width-ish declarations for one class, with the rung each sits under.
 *  Parsed, not substring-matched: `min-width: 686px` CONTAINS `width: 686px`. */
function widthDecls(css: string, cls: string): { at: number | null; prop: string; value: string }[] {
  const out: { at: number | null; prop: string; value: string }[] = []
  let at: number | null = null
  for (const line of css.split('\n')) {
    const media = /^@media\s*\(min-width:\s*(\d+)px\)/.exec(line)
    if (media) {
      at = Number(media[1])
      continue
    }
    if (/^\}/.test(line)) {
      at = null
      continue
    }
    const rule = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(line)
    if (!rule) continue
    for (const decl of rule[1].split(';')) {
      const m = /^\s*(min-width|max-width|width)\s*:\s*(.+?)\s*$/.exec(decl)
      if (m) out.push({ at, prop: m[1], value: m[2] })
    }
  }
  return out
}

/** The generated class carrying `text`. */
function classOf(html: string, text: string): string {
  const m = new RegExp(`class="([^"]+)"[^>]*>${text}<`).exec(html)
  if (!m) throw new Error(`no element rendering ${JSON.stringify(text)}`)
  return m[1].split(/\s+/)[0]
}

/** Every node whose track declares the given placement frame. */
function withPlace(doc: L1Document, place: 'absolute' | 'flow'): L1Node[] {
  const out: L1Node[] = []
  const walk = (node: L1Node): void => {
    const geo = (node as { geometry?: { place?: string } }).geometry
    if (geo && (geo.place ?? 'absolute') === place) out.push(node)
    const kids = node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
    kids.forEach(walk)
  }
  walk(doc.root)
  return out
}

/** The flow-recovered document for the stacked fixture. */
function flowDoc(): L1Document {
  const capture = stackedCapture()
  const base = foldToL1(capture)
  const { doc, promoted } = promoteToFlow(base, { scale: 2.5, measured: measuredTextHeights(capture) })
  if (promoted.length === 0) throw new Error('fixture did not promote anything to flow')
  return doc
}

describe('REQ-302 — a relaxed run is shrink-to-fit in the flow frame too', () => {
  it('test_UAT_FC_REQ-302_a_flow_placed_relaxed_run_resets_width_to_fit_content_not_auto', () => {
    const doc = flowDoc()
    // The frame under test is genuinely the flow one — otherwise this asserts
    // REQ-117's original case over again and proves nothing about the change.
    expect(withPlace(doc, 'flow').length).toBeGreaterThan(0)

    const { css, html } = renderL1Document(doc)
    const decls = widthDecls(css, classOf(html, WORDMARK))
    expect(decls.length).toBeGreaterThan(0)

    // THE FIX. Every relaxed rung resets to `fit-content`; `auto` — which in
    // this frame means "fill the containing block" — appears on none of them.
    const relaxed = decls.filter((d) => d.prop === 'width')
    expect(relaxed.length).toBeGreaterThan(0)
    expect(relaxed.every((d) => d.value === 'fit-content')).toBe(true)
    expect(relaxed.some((d) => d.value === 'auto')).toBe(false)

    // ...and REQ-117's floor is untouched: the captured width still survives
    // as the minimum, which is what keeps an unedited page pixel-identical.
    expect(decls.some((d) => d.prop === 'min-width' && d.value === `${WORDMARK_PX}px`)).toBe(true)

    // Each rung carries BOTH halves, asserted per rung rather than in
    // aggregate: a floor on one rung and a reset on another would leave the
    // interpolation live on the rung that has neither.
    const byRung = new Map<number | null, { prop: string; value: string }[]>()
    for (const d of decls) byRung.set(d.at, [...(byRung.get(d.at) ?? []), d])
    let floored = 0
    for (const [at, ds] of byRung) {
      if (!ds.some((d) => d.prop === 'min-width')) continue
      floored++
      expect(ds.some((d) => d.prop === 'width' && d.value === 'fit-content'), `rung ${at ?? 'base'}`).toBe(true)
    }
    expect(floored, 'the fixture actually floors some rungs').toBeGreaterThan(0)
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-302_the_same_keyword_serves_the_absolute_frame', () => {
    // One declaration for both frames, not a second code path keyed on
    // placement. The un-promoted (absolutely placed) document must relax the
    // same run the same way — if it did not, the emitter would have grown a
    // branch and REQ-117's original case would be reachable only one way.
    const base = foldToL1(stackedCapture())
    expect(withPlace(base, 'flow').length).toBe(0)
    const { css, html } = renderL1Document(base)
    const relaxed = widthDecls(css, classOf(html, WORDMARK)).filter((d) => d.prop === 'width')
    expect(relaxed.length).toBeGreaterThan(0)
    expect(relaxed.every((d) => d.value === 'fit-content')).toBe(true)
  })

  it('test_UAT_FC_REQ-302_a_flow_placed_run_renders_at_its_captured_width_not_its_columns', async () => {
    // THE MEASUREMENT. Everything above is about a keyword; this is about the
    // 609.22 of ranked score, which was a box 506px wider than the capture.
    // Only a browser can tell `fit-content` from `auto` here, because the
    // difference IS the layout frame resolving the keyword.
    if (!(await chromiumAvailable())) return
    const { css, html } = renderL1Document(flowDoc())
    const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'req302-flow-')), 'page.html')
    writeFileSync(file, page)

    const cls = classOf(html, WORDMARK)
    const probe = `(() => { var n = document.querySelector('.${cls}'); var r = n.getBoundingClientRect();
      var p = n.parentElement.getBoundingClientRect();
      return { width: r.width, parent: p.width, position: getComputedStyle(n).position }; })()`

    const driver = await createEngineDriver('chromium')()
    const seen: { at: number; width: number; parent: number; position: string }[] = []
    try {
      for (const at of [1280, 1440]) {
        await driver.navigate(pathToFileURL(file).href, { width: at, height: 900 })
        const m = await driver.query<{ width: number; parent: number; position: string }>(probe)
        seen.push({ at, ...m })
      }
    } finally {
      await driver.close()
    }

    for (const m of seen) {
      // It IS the in-flow frame — the one where `auto` means "fill the
      // containing block". Without this the measurement below could be
      // REQ-117's original absolute case passing again.
      expect(m.position, `@${m.at} the run is flow-placed`).toBe('relative')

      // THE NUMBER. Measured both ways on this exact fixture: with `auto` the
      // run renders 1256px wide in a 1280px column and 1416px in a 1440px one.
      // With `fit-content` it renders 686px at both — its captured width.
      // Asserted against the capture rather than against "narrower than its
      // parent", which does not discriminate: a run inset by a 24px margin is
      // narrower than its parent either way.
      expect(m.width, `@${m.at} renders at its captured width`).toBeCloseTo(WORDMARK_PX, 0)
    }

    // And the stretch is a stretch: the run's width must not follow the
    // column. The two ladder widths differ by 160px and the run must not.
    expect(seen[0].parent).not.toBe(seen[1].parent)
    expect(seen[0].width, 'the run is the same width in both columns').toBe(seen[1].width)
  }, 120000)
})
