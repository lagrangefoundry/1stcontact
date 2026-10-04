/**
 * REQ-377 — a sticky header on hearingzone510.com (a Zyro page), measured
 * mid-way through a smooth scroll back to the top, and three residuals behind it.
 *
 * - **issue 1** (capture) — under `html{scroll-behavior:smooth}` the settle's
 *   return to the top was an animation nothing waited for, so every read of the
 *   page caught a sticky header somewhere different. The settle now scrolls
 *   instantly and waits for `scrollY === 0`, does so again at the end of every
 *   driver's settle, and every read records the `scrollY` it was taken at.
 * - **issue 2** (capture + fold) — `position: sticky` / `fixed` reaches the
 *   bundle as each element's pinned ancestor, and the fold holds what that
 *   ancestor holds in one L1 `sticky` node, in a rail as tall as the page.
 * - **issue 4** (capture + fold) — a run over an inline-SVG panel records the
 *   panel's fill as its surface, and the fold does not paint that panel twice.
 *
 * Issue 3 is not code: the ticket defers it until a re-capture with issue 1 in
 * place, because its input is issue 1's drifted header.
 *
 * The capture cases run the REAL page scripts under jsdom, as REQ-370's do.
 * jsdom lays nothing out and does not scroll, so the fixture states the boxes a
 * browser reports and EMULATES a smooth-scrolling page: every `scrollTo` animates
 * over ~160ms unless it asks for `behavior: 'instant'`, and any new scroll
 * cancels the one in flight — what Chromium does under
 * `html{scroll-behavior:smooth}`.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import {
  CAPTURE_COVERAGE,
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  SCROLL_TO_TOP,
  SETTLE_CSS,
  SETTLE_SCROLL,
  runCapturePipeline,
  runMultiStateCapture,
  staleCaptureAxes,
  type BrowserDriver,
  type CapturedResponse,
  type Capture,
  type RawRun,
  type RawSignals,
} from '../tools/generate/src/cli'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

// ── a smooth-scrolling page under jsdom ───────────────────────────────────────

type Rect = { x: number; y: number; w: number; h: number }
const domRect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/**
 * A page whose boxes are stated in DOCUMENT coordinates and reported, as a
 * browser reports them, relative to the viewport at the current scroll — except
 * the ids in `stuck`, which a `position: sticky; top: 0` keeps at the viewport top.
 */
function smoothPage(bodyHtml: string, boxes: Record<string, Rect>, stuck: readonly string[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body style="margin:0">${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://www.example.test/',
  })
  const win = dom.window as unknown as Window & typeof globalThis
  let scroll = 0
  let timers: ReturnType<typeof setTimeout>[] = []
  for (const key of ['scrollY', 'pageYOffset']) {
    Object.defineProperty(win, key, { configurable: true, get: () => scroll })
  }
  win.scrollTo = ((a: number | ScrollToOptions, b?: number) => {
    const top = typeof a === 'object' ? (a.top ?? scroll) : (b ?? 0)
    const instant = typeof a === 'object' && (a.behavior as string) === 'instant'
    for (const t of timers) clearTimeout(t)
    timers = []
    if (instant) {
      scroll = top
      return
    }
    // The page's own `scroll-behavior: smooth`: the call returns at once and the
    // scroll arrives in steps.
    const from = scroll
    for (let k = 1; k <= 4; k++) timers.push(setTimeout(() => (scroll = from + ((top - from) * k) / 4), 40 * k))
  }) as typeof win.scrollTo
  const fallback: Rect = { x: 0, y: 0, w: 1280, h: 400 }
  win.Element.prototype.getBoundingClientRect = function (this: Element) {
    const b = boxes[this.id] ?? fallback
    const y = stuck.includes(this.id) ? Math.max(b.y, 0) : b.y - scroll
    return domRect(b.x, y, b.w, b.h)
  }
  Object.defineProperty(win.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(win.Element.prototype, 'scrollHeight', { configurable: true, get: () => 4000 })
  return { dom, scrollY: () => scroll, settle: () => { for (const t of timers) clearTimeout(t) } }
}
const run = (dom: JSDOM, script: string): unknown => (dom.window as unknown as { eval(s: string): unknown }).eval(script)
const runsOf = (s: RawSignals): RawRun[] => s.bands.flatMap((b) => [...b.content, ...b.items.flat()])
const fieldsOf = (s: RawSignals) => s.bands.flatMap((b) => b.fields)

/** The hearingzone header: a 40px sticky bar over the hero, and a 4000px page. */
const HEADER = `
  <div id="sticky" style="position:sticky;top:0">
    <section id="bar" style="background-color:#f2b374"><p id="learn" style="color:#1d1e20">Learn to train your brain to hear better.</p></section>
  </div>
  <section id="hero" style="background-color:#d6d6d6"><h1 id="hear" style="color:#1d1e20">Hear what matters.</h1></section>`
const HEADER_BOXES: Record<string, Rect> = {
  sticky: { x: 0, y: 0, w: 1280, h: 40 },
  bar: { x: 0, y: 0, w: 1280, h: 40 },
  learn: { x: 400, y: 8, w: 480, h: 24 },
  hero: { x: 0, y: 40, w: 1280, h: 1157 },
  hear: { x: 28, y: 884, w: 1224, h: 62 },
}
const STUCK = ['sticky', 'bar', 'learn']

// ── issue 1 ───────────────────────────────────────────────────────────────────

describe('REQ-377 issue 1 — the page is measured at rest', () => {
  it('test_UAT_FC_REQ-377_the_emulated_page_reproduces_the_race_the_ticket_measured', async () => {
    // The control: the pre-fix return to the top on this page, read at once.
    const page = smoothPage(HEADER, HEADER_BOXES, STUCK)
    run(page.dom, 'window.scrollTo(0, 2000)')
    await new Promise((r) => setTimeout(r, 200))
    run(page.dom, 'window.scrollTo(0, 0)')
    const signals = run(page.dom, EXTRACT_SCRIPT) as RawSignals
    page.settle()
    const learn = runsOf(signals).find((r) => r.text.startsWith('Learn'))!
    expect(signals.scrollY, 'the read caught the scroll mid-flight').toBeGreaterThan(0)
    expect(learn.box.y, 'and the stuck bar was recorded as far down the page').toBe(8 + signals.scrollY!)
  })

  it('test_UAT_FC_REQ-377_after_the_settle_scroll_the_sticky_header_reads_at_scroll_0', async () => {
    const page = smoothPage(HEADER, HEADER_BOXES, STUCK)
    await (run(page.dom, SETTLE_SCROLL) as Promise<unknown>)
    // Straight away, as captureOnce does — nothing else waits.
    const signals = run(page.dom, EXTRACT_SCRIPT) as RawSignals
    page.settle()
    expect(signals.scrollY).toBe(0)
    const learn = runsOf(signals).find((r) => r.text.startsWith('Learn'))!
    expect(learn.box.y, 'the bar at its scroll-0 place, 7.6 on the real page').toBe(8)
    const hear = runsOf(signals).find((r) => r.text.startsWith('Hear'))!
    expect(hear.box.y).toBe(884)
  })

  it('test_UAT_FC_REQ-377_a_page_that_scrolls_itself_after_the_settle_is_brought_home_again', async () => {
    const page = smoothPage(HEADER, HEADER_BOXES, STUCK)
    await (run(page.dom, SETTLE_SCROLL) as Promise<unknown>)
    // A page script scrolls once the network has gone quiet.
    run(page.dom, 'window.scrollTo(0, 1329)')
    await new Promise((r) => setTimeout(r, 200))
    expect(page.scrollY()).toBe(1329)
    const at = await (run(page.dom, SCROLL_TO_TOP) as Promise<number>)
    expect(at, 'SCROLL_TO_TOP resolves to where it ended').toBe(0)
    const signals = run(page.dom, EXTRACT_SCRIPT) as RawSignals
    page.settle()
    expect(runsOf(signals).find((r) => r.text.startsWith('Learn'))!.box.y).toBe(8)
  })

  it('test_UAT_FC_REQ-377_every_scroll_the_settle_performs_is_instant_and_both_drivers_end_at_the_top', () => {
    expect(SETTLE_CSS).toContain('html,body{scroll-behavior:auto!important;}')
    // The last thing each driver's settle does is go home and wait for it.
    for (const file of ['playwright-driver.ts', 'cf-driver.ts']) {
      const src = readFileSync(
        fileURLToPath(new URL(`../tools/generate/src/cli/capture/${file}`, import.meta.url)),
        'utf8',
      )
      const settle = src.slice(src.indexOf('private async settlePage()'))
      const body = settle.slice(0, settle.indexOf('\n  }\n'))
      expect(body.lastIndexOf('SCROLL_TO_TOP'), `${file}: settle ends with SCROLL_TO_TOP`).toBeGreaterThan(
        Math.max(body.indexOf('networkidle'), body.indexOf('waitForNetworkIdle')),
      )
    }
  })

  const signalsAt = (scrollY: number): RawSignals => ({
    viewport: { width: 1280, height: 4000 },
    bands: [],
    colorUsage: [],
    fontFaces: [],
    typeScale: [],
    spacingScalePx: [],
    containerMaxWidthPx: null,
    images: [],
    bodyBackground: '#ffffff',
    title: 'Hearing Zone',
    scrollY,
  })
  const driverAt = (scrollY: number): BrowserDriver => ({
    async navigate() {},
    async screenshot() {
      return new Uint8Array([137, 80, 78, 71])
    },
    async query<T>() {
      return signalsAt(scrollY) as T
    },
    responses: (): CapturedResponse[] => [],
    diagnostics: () => ({ consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }),
    async content() {
      return '<html></html>'
    },
    async close() {},
  })

  it('test_UAT_FC_REQ-377_the_bundle_records_the_scroll_it_was_measured_at', async () => {
    const result = await runCapturePipeline('http://example.test/', { driverFactory: async () => driverAt(0) })
    expect(result.capture.scrollY).toBe(0)
    expect(result.capture.captureSchema).toBe(CAPTURE_SCHEMA)
  })

  it('test_UAT_FC_REQ-377_a_projection_read_away_from_the_top_is_named_in_the_matrix_notes', async () => {
    const multi = await runMultiStateCapture('http://example.test/', {
      viewports: [
        { width: 1280, height: 800 },
        { width: 1280, height: 1000 },
      ],
      states: ['rest'],
      driverFactoryFor: () => async () => driverAt(106),
      isEngineAvailable: async () => true,
    })
    expect(multi.notes.filter((n) => /scrollY 106/.test(n))).toHaveLength(2)
    const clean = await runMultiStateCapture('http://example.test/', {
      viewports: [{ width: 1280, height: 800 }],
      states: ['rest'],
      driverFactoryFor: () => async () => driverAt(0),
      isEngineAvailable: async () => true,
    })
    expect(clean.notes.some((n) => /scrollY/.test(n))).toBe(false)
  })
})

// ── issue 2: the capture ──────────────────────────────────────────────────────

describe('REQ-377 issue 2 — what the page pins to the viewport reaches the bundle', () => {
  const page = smoothPage(
    `${HEADER}
     <div id="chat" style="position:fixed;top:auto;bottom:0"><p id="chatText" style="color:#000000">Chat with us</p></div>
     <aside id="side" style="position:sticky;top:auto"><p id="sideText" style="color:#000000">No offset</p></aside>`,
    {
      ...HEADER_BOXES,
      chat: { x: 1100, y: 720, w: 160, h: 60 },
      chatText: { x: 1110, y: 730, w: 140, h: 24 },
      side: { x: 900, y: 1300, w: 300, h: 200 },
      sideText: { x: 910, y: 1310, w: 280, h: 24 },
    },
    STUCK,
  )
  const signals = run(page.dom, EXTRACT_SCRIPT) as RawSignals
  const runAt = (prefix: string) => runsOf(signals).find((r) => r.text.startsWith(prefix))!

  it('test_UAT_FC_REQ-377_a_run_inside_a_sticky_ancestor_records_it_with_its_offset_and_path', () => {
    const learn = runAt('Learn')
    expect(learn.sticky).toMatchObject({ x: 0, y: 0, width: 1280, height: 40, topPx: 0 })
    expect(typeof learn.sticky!.id).toBe('string')
    expect(runAt('Hear').sticky, 'an in-flow run records that nothing pins it').toBeNull()
  })

  it('test_UAT_FC_REQ-377_a_fixed_ancestor_holds_at_its_own_viewport_top_and_sticky_top_auto_holds_nowhere', () => {
    expect(runAt('Chat').sticky).toMatchObject({ topPx: 720, y: 720, height: 60 })
    expect(runAt('No offset').sticky).toBeNull()
  })

  it('test_UAT_FC_REQ-377_position_is_a_recorded_capture_property', () => {
    expect(CAPTURE_COVERAGE.get('position')?.verdict).toBe('recorded')
    expect(CAPTURE_COVERAGE.get('top')?.verdict, 'the offset is read through `sticky`, not as a layout value').toBe(
      'declined',
    )
  })
})

// ── issue 2: the fold ─────────────────────────────────────────────────────────

const LADDER = [768, 1280]
const PIN = (w: number) => ({ id: '0.0', x: 0, y: 0, width: w, height: 140, topPx: 0 })

function multiFrom(elementsAt: (w: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `req377:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

const text = (t: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement => ({
  text: t,
  role: 'body',
  color: '#ffffff',
  fontFamily: 'Prata',
  fontSizePx: 16,
  fontWeight: 400,
  lineHeightPx: 24,
  box,
  ...over,
})
const ground = (fill: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement => ({
  text: '(generic)',
  textless: true,
  role: 'generic',
  a11yRole: 'generic',
  surfaceFill: fill,
  box,
  color: '',
  fontFamily: '',
  fontSizePx: 0,
  fontWeight: 0,
  ...over,
})

/** A pinned 140px header (bar + nav) over a page that runs to y 3000. */
function pinnedHeader(sticky: (w: number) => ValueElement['sticky'], pinned: Partial<ValueElement> = {}) {
  return multiFrom((w) => [
    ground('#f2b374', { x: 0, y: 0, width: w, height: 40 }, { sticky: sticky(w), ...pinned }),
    text('Learn to train your brain to hear better.', { x: 40, y: 8, width: 380, height: 24 }, {
      color: '#1d1e20',
      surfaceFill: '#f2b374',
      sticky: sticky(w),
      ...pinned,
    }),
    ground('#224e7a', { x: 0, y: 40, width: w, height: 100 }, { sticky: sticky(w), ...pinned }),
    text('Home', { x: w - 200, y: 76, width: 60, height: 24 }, { surfaceFill: '#224e7a', sticky: sticky(w), ...pinned }),
    text('Hear what matters.', { x: 28, y: 884, width: w - 56, height: 62 }, { color: '#1d1e20', sticky: null }),
    text('Where To Find Us', { x: 28, y: 2938, width: w - 56, height: 62 }, { color: '#1d1e20', sticky: null }),
  ])
}

type Walked = { node: L1Node; ancestors: L1Node[] }
function walk(doc: L1Document): Walked[] {
  const out: Walked[] = []
  const visit = (node: L1Node, ancestors: L1Node[]): void => {
    out.push({ node, ancestors })
    const kids = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
    kids.forEach((child) => visit(child, [...ancestors, node]))
  }
  visit(doc.root, [])
  return out
}
/** A node's page position at `at`: its own keyframe plus every positioned ancestor's. */
const pageAt = (n: Walked, at: number) =>
  [...n.ancestors, n.node].reduce(
    (acc, node) => {
      const kf = geo(node)?.keyframes.find((k) => k.at === at)
      return kf ? { x: acc.x + kf.x, y: acc.y + kf.y } : acc
    },
    { x: 0, y: 0 },
  )
const textNode = (nodes: Walked[], t: string) => nodes.find((n) => (n.node as { text?: string }).text === t)!
const geo = (node: L1Node) =>
  (node as { geometry?: { place?: string; keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> } })
    .geometry

describe('REQ-377 issue 2 — the fold holds a pinned header where the page holds it', () => {
  const doc = foldToL1(pinnedHeader(PIN))
  const nodes = walk(doc)
  const pin = nodes.find((n) => 'sticky' in n.node && n.node.sticky)

  it('test_UAT_FC_REQ-377_the_header_group_folds_to_one_sticky_node_holding_its_runs_and_grounds', () => {
    expect(pin, 'a node declares sticky').toBeTruthy()
    expect((pin!.node as { sticky: { topPx?: number } }).sticky.topPx).toBe(0)
    expect(geo(pin!.node)!.place, 'a pin is in flow: sticky and absolute are alternatives').toBe('flow')
    for (const t of ['Learn to train your brain to hear better.', 'Home']) {
      expect(textNode(nodes, t).ancestors, `${t} travels with the pin`).toContain(pin!.node)
    }
    const grounds = nodes.filter(
      (n) => (n.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill === '#224e7a' && n.node.kind !== 'text',
    )
    expect(grounds.length).toBeGreaterThan(0)
    for (const g of grounds) expect(g.ancestors.concat(g.node), 'the nav ground travels too').toContain(pin!.node)
    // Rebased, not moved: summed down the chain from the rail, Home is still where
    // the capture saw it.
    expect(pageAt(textNode(nodes, 'Home'), 1280)).toEqual({ x: 1080, y: 76 })
  })

  it('test_UAT_FC_REQ-377_the_pin_sits_in_a_rail_as_tall_as_the_page_and_the_body_does_not_travel', () => {
    const rail = pin!.ancestors[pin!.ancestors.length - 1]
    expect(rail).not.toBe(doc.root)
    expect(geo(rail)!.place).toBe('flow')
    for (const kf of geo(rail)!.keyframes) expect(kf.height).toBeGreaterThanOrEqual(3000)
    expect(doc.root.children?.[0], 'the rail is the root’s first child').toBe(rail)
    for (const t of ['Hear what matters.', 'Where To Find Us']) {
      expect(textNode(nodes, t).ancestors).not.toContain(pin!.node)
    }
  })

  it('test_UAT_FC_REQ-377_the_pin_renders_as_css_sticky_and_lifts_above_what_scrolls_past', () => {
    const { css } = renderL1Document(doc)
    expect(css).toContain('position: sticky')
    expect(css).toMatch(/position: sticky; top: 0px; z-index: 1/)
  })

  it('test_UAT_FC_REQ-377_the_pin_holds_at_the_level_the_page_declares_when_captured', () => {
    // The page's own `.top-blocks{z-index:18}`, as the capture's stacking chain
    // names it at the pinned ancestor's path.
    const levelled = foldToL1(pinnedHeader(PIN, { paintStack: [{ id: '0.0', z: 18 }] }))
    const held = walk(levelled).find((n) => 'sticky' in n.node && n.node.sticky)!
    expect((held.node as { paintOrder?: number }).paintOrder).toBe(18)
  })

  it('test_UAT_FC_REQ-377_a_sticky_box_that_does_not_hold_from_the_top_is_left_scrolling', () => {
    // A sidebar pinned at 20px from y 1300 holds through its own section, which the
    // capture does not record — so the fold does not invent a page-long pin for it.
    const sidebar = foldToL1(pinnedHeader((w) => ({ id: '0.4', x: 0, y: 1300, width: w, height: 140, topPx: 20 })))
    expect(walk(sidebar).some((n) => 'sticky' in n.node && n.node.sticky)).toBe(false)
    const unpinned = foldToL1(pinnedHeader(() => null))
    expect(walk(unpinned).some((n) => 'sticky' in n.node && n.node.sticky)).toBe(false)
  })
})

// ── issue 4 ───────────────────────────────────────────────────────────────────

describe('REQ-377 issue 4 — a run over an inline-SVG panel stands on the panel', () => {
  const page = smoothPage(
    `<section id="s" style="background-color:#d6d6d6">
       <div id="panel"><svg id="rect" preserveAspectRatio="none" viewBox="0 0 80 80"><path style="fill:rgb(34, 78, 122)" d="M0 0H80V80H0V0Z"></path></svg></div>
       <p id="p" style="color:#ffffff">So glad I chose the Hearing Zone.</p>
       <p id="q" style="color:#1d1e20">Customer Reviews</p>
     </section>`,
    {
      // The real bundle's right-hand testimonial, rebased to the fixture's top.
      s: { x: 0, y: 0, w: 1280, h: 572 },
      panel: { x: 646, y: 171, w: 606, h: 296 },
      rect: { x: 646, y: 171, w: 606, h: 296 },
      p: { x: 678, y: 234, w: 555, h: 96 },
      q: { x: 40, y: 40, w: 400, h: 48 },
    },
  )
  const signals = run(page.dom, EXTRACT_SCRIPT) as RawSignals

  it('test_UAT_FC_REQ-377_the_run_records_the_panel_fill_and_the_panel_as_its_surface', () => {
    const p = runsOf(signals).find((r) => r.text.startsWith('So glad'))!
    expect(p.surfaceFill).toBe('#224e7a')
    expect(p.surface).toMatchObject({ self: false, panel: true, box: { x: 646, y: 171, width: 606, height: 296 } })
    // The panel itself is still recorded as the painted field REQ-370 made it.
    expect(fieldsOf(signals).some((f) => f.surfaceFill === '#224e7a' && f.box?.width === 606)).toBe(true)
  })

  it('test_UAT_FC_REQ-377_a_run_beside_the_panel_still_reads_the_band', () => {
    const q = runsOf(signals).find((r) => r.text.startsWith('Customer'))!
    expect(q.surfaceFill).toBe('#d6d6d6')
    expect(q.surface?.panel).toBeUndefined()
  })

  it('test_UAT_FC_REQ-377_the_fold_paints_the_panel_once_not_again_as_a_card', () => {
    const panelBox = { x: 646, y: 171, width: 606, height: 296 }
    const fold = (panel: boolean) =>
      foldToL1(
        multiFrom(() => [
          ground('#d6d6d6', { x: 0, y: 0, width: 1280, height: 572 }),
          // REQ-370's panel field.
          ground('#224e7a', panelBox),
          text('So glad I chose the Hearing Zone.', { x: 678, y: 234, width: 555, height: 96 }, {
            surfaceFill: '#224e7a',
            surface: {
              self: false,
              box: panelBox,
              borderRadiusPx: 0,
              boxShadow: null,
              border: null,
              ...(panel ? { panel: true as const } : {}),
            },
          }),
        ]),
      )
    const painted = (doc: L1Document) =>
      walk(doc).filter(
        (n) => n.node.kind !== 'text' && (n.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill === '#224e7a',
      )
    expect(painted(fold(true)), 'one #224e7a surface: the captured panel').toHaveLength(1)
    // The control: the same fill with no `panel` flag is rebuilt as a surface of
    // its own as well — the double paint REQ-370 kept panels out of the walk for.
    expect(painted(fold(false)).length).toBeGreaterThan(1)
  })
})

// ── the stamp ─────────────────────────────────────────────────────────────────

describe('REQ-377 — a bundle taken before schema 17 says it is owed a re-capture', () => {
  const bundle = (schema: number, extra: Partial<Capture> = {}): Capture =>
    ({
      url: 'https://www.hearingzone510.com/',
      captureSchema: schema,
      sections: [
        {
          content: [{ text: 'Learn to train', role: 'body', color: '#000000', fontFamily: 'Prata', fontSizePx: 16, fontWeight: 400 }],
          items: [],
          fields: [],
        },
      ],
      ...extra,
    }) as unknown as Capture

  it('test_UAT_FC_REQ-377_a_schema_16_bundle_names_the_scroll_and_sticky_axes_as_missing', () => {
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(17)
    const named = staleCaptureAxes(bundle(16)).map((a) => a.axis).join(' | ')
    expect(named).toMatch(/scrollY/)
    expect(named).toMatch(/sticky/)
    expect(staleCaptureAxes(bundle(17))).toHaveLength(0)
  })
})
