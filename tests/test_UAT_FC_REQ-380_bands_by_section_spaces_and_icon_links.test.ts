/**
 * REQ-380 — three residuals on bluelotusintegralhealing.com, a Zyro page.
 *
 * - **issue 1** (fold) — `buildSolidBands` grouped band rows by adjacency in the
 *   row STREAM, so a contact section and a footer whose rows the responsive table
 *   interleaves shredded into ten slices, each cut off at the next fragment's top
 *   while its own copy ran on below. Rows are now grouped in PAGE order by fill
 *   and captured section, a group a same-fill captured backdrop already covers
 *   emits no band (its runs name the backdrop), and no band ends up painted over
 *   a content leaf it sits under.
 * - **issue 2** (capture) — a run whose `white-space` preserves spaces keeps every
 *   one of them, not one per run of them.
 * - **issue 3** (capture + pipeline) — an inline `<svg>` that is a link's only ink
 *   is recorded as a media field whose markup the pipeline mirrors as a bundle
 *   asset, so the fold emits a linked image the reproduction can serve.
 *
 * The fold cases drive the real `foldToL1` over a synthetic ladder shaped like
 * the bundle that filed the ticket. The capture cases run the REAL page script
 * under jsdom, as REQ-370's do (jsdom lays nothing out, so the fixture states the
 * boxes a browser would report), and the pipeline case feeds that script's own
 * output through `runCapturePipeline` behind a fake driver.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { foldToL1 } from '../tools/generate/src'
import { localizeAssets } from '../tools/generate/src/l1'
import {
  flattenSignals,
  runCapturePipeline,
  type BrowserDriver,
  type MultiStateCapture,
  type SectionValues,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src/cli/capture'
import { CAPTURE_SCHEMA, EXTRACT_SCRIPT, type RawRun, type RawSignals } from '../tools/generate/src/cli'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

// ── fold fixtures ─────────────────────────────────────────────────────────────

const LADDER = [768, 1280]
const WHITE = '#ffffff'
const BLUE = '#249ed3'

const section = (index: number, y: number, height: number, w: number, fill: string): SectionValues =>
  ({ index, box: { x: 0, y, width: w, height }, surfaceFill: fill, overlay: null, contentAnchorRatio: null }) as SectionValues

const el = (o: Partial<ValueElement>): ValueElement =>
  ({ text: '', role: 'generic', color: '#333333', fontFamily: 'Lato', fontSizePx: 16, fontWeight: 400, lineHeightPx: 24, ...o }) as ValueElement

/** A full-width run standing on a band of `fill`. */
const row = (text: string, y: number, w: number, fill: string): ValueElement =>
  el({ text, surfaceFill: fill, box: { x: 40, y, width: w - 80, height: 24 } })

/**
 * The contact section (white, 1994–2554) and the footer (blue, 2554–2946), with
 * their rows in the STREAM order the responsive table produced: each label once
 * per section, alternating. The footer logo stands in the blue section.
 */
function blueLotus(opts: { backdrops: boolean }): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((w) => {
    const elements: ValueElement[] = []
    if (opts.backdrops) {
      elements.push(
        el({ textless: true, surfaceFill: WHITE, box: { x: 0, y: 1993, width: w, height: 561 } }),
        el({ textless: true, surfaceFill: BLUE, box: { x: 0, y: 2553, width: w, height: 393 } }),
      )
    }
    elements.push(
      row('Get in Touch', 2080, w, WHITE),
      row('Blue Lotus Integral Healing', 2586, w, BLUE),
      row('Contact', 2241, w, WHITE),
      row('contact', 2706, w, BLUE),
      row('Your Name*', 2306, w, WHITE),
      row('Your Name*', 2640, w, BLUE),
      row('Your Email Address*', 2400, w, WHITE),
      row('Your Email Address*', 2729, w, BLUE),
      row('© 2025. All rights reserved.', 2824, w, BLUE),
      el({
        textless: true,
        role: 'img',
        a11yRole: 'img',
        objectFit: 'cover',
        intrinsicAspect: 1.06,
        src: 'https://assets.example.test/logo.png',
        alt: 'Blue Lotus',
        box: { x: 505, y: 2617, width: 270, height: 254 },
      }),
    )
    const sections = [section(0, 1994, 560, w, WHITE), section(1, 2554, 392, w, BLUE)]
    return {
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: { source: `req380:${w}`, elements, sections, viewport: { width: w, height: 800 } },
    } as unknown as StateProjection
  })
  return { url: 'http://fixture.test/', notes: [], projections }
}

interface Placed {
  node: L1Node
  ancestors: L1Node[]
  /** Page-absolute rect at 1280 (ancestors' offsets summed). */
  rect?: { x: number; y: number; width: number; height: number }
}

/** Every node in paint (pre-)order, with its page-absolute rect at 1280. */
function placed(doc: L1Document): Placed[] {
  const out: Placed[] = []
  const kf = (n: L1Node) =>
    (n as { geometry?: { keyframes: Array<{ at: number; x: number; y: number; width?: number; height?: number }> } })
      .geometry?.keyframes.find((k) => k.at === 1280)
  const visit = (node: L1Node, ancestors: L1Node[], ox: number, oy: number): void => {
    const k = kf(node)
    const rect = k ? { x: ox + k.x, y: oy + k.y, width: k.width ?? 0, height: k.height ?? 0 } : undefined
    out.push({ node, ancestors, rect })
    const kids = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
    kids.forEach((c) => visit(c, [...ancestors, node], rect?.x ?? ox, rect?.y ?? oy))
  }
  visit(doc.root, [], 0, 0)
  return out
}
const idOf = (n: L1Node): string | undefined => (n as { id?: string }).id
const textOf = (n: L1Node): string | undefined => (n as { text?: unknown }).text as string | undefined

/** Each run's `backedBy` names a node whose 1280 rect holds the run's top. */
function expectRunsBackedInside(nodes: Placed[]): string[] {
  const byId = new Map(nodes.filter((p) => idOf(p.node)).map((p) => [idOf(p.node)!, p]))
  const named: string[] = []
  for (const p of nodes) {
    if (typeof textOf(p.node) !== 'string') continue
    const backedBy = (p.node as { backedBy?: string }).backedBy
    expect(backedBy, `'${textOf(p.node)}' names its backing surface`).toBeTruthy()
    const surface = byId.get(backedBy!)!.rect!
    expect(p.rect!.y, `'${textOf(p.node)}' at y ${p.rect!.y} lies on ${backedBy}`).toBeGreaterThanOrEqual(surface.y)
    expect(p.rect!.y).toBeLessThan(surface.y + surface.height)
    named.push(backedBy!)
  }
  return named
}

// ── issue 1 ───────────────────────────────────────────────────────────────────

describe('REQ-380 issue 1 — band rows are grouped by the section they sit in, not by stream adjacency', () => {
  it('test_UAT_FC_REQ-380_two_same_fill_sections_fold_to_one_band_each_whatever_the_stream_order', () => {
    const nodes = placed(foldToL1(blueLotus({ backdrops: false })))
    const bands = nodes.filter((p) => /^section-band-/.test(idOf(p.node) ?? ''))
    expect(bands.map((b) => (b.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill).sort()).toEqual([
      BLUE,
      WHITE,
    ])
    // Each band covers its whole section: from the section's top past its last run.
    const white = bands.find((b) => (b.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill === WHITE)!
    const blue = bands.find((b) => (b.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill === BLUE)!
    expect(white.rect!.y).toBe(1994)
    expect(white.rect!.y + white.rect!.height).toBe(2554)
    expect(blue.rect!.y).toBe(2554)
    expect(blue.rect!.y + blue.rect!.height).toBeGreaterThan(2824)
    // And every run's backing surface is the band it actually stands on.
    expectRunsBackedInside(nodes)
  })

  it('test_UAT_FC_REQ-380_a_band_never_paints_over_a_content_leaf_it_sits_under', () => {
    const nodes = placed(foldToL1(blueLotus({ backdrops: false })))
    const order = nodes.map((p) => p.node)
    const logo = nodes.find((p) => p.node.kind === 'image')!
    const overlaps = (a: Placed['rect'], b: Placed['rect']) =>
      !!a && !!b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
    for (const band of nodes.filter((p) => /^section-band-/.test(idOf(p.node) ?? ''))) {
      if (!overlaps(band.rect, logo.rect)) continue
      const holdsIt = logo.ancestors.includes(band.node) || logo.ancestors.some((a) => idOf(a) === idOf(band.node))
      expect(
        holdsIt || order.indexOf(band.node) < order.indexOf(logo.node),
        `${idOf(band.node)} paints beneath the logo`,
      ).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-380_a_section_a_same_fill_backdrop_already_paints_gets_no_band_and_its_runs_name_the_backdrop', () => {
    const nodes = placed(foldToL1(blueLotus({ backdrops: true })))
    expect(nodes.filter((p) => /^section-band-/.test(idOf(p.node) ?? '')).map((p) => idOf(p.node))).toEqual([])
    const named = expectRunsBackedInside(nodes)
    expect(new Set(named).size, 'one backdrop per section').toBe(2)
    for (const id of named) expect(id).toMatch(/^backdrop-\d+$/)
  })
})

// ── capture harness (real EXTRACT_SCRIPT under jsdom) ─────────────────────────

type Rect = { x: number; y: number; w: number; h: number }
const domRect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

function extract(bodyHtml: string, boxes: Record<string, Rect>): RawSignals {
  const dom = new JSDOM(`<!doctype html><html><body style="margin:0">${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://www.example.test/',
  })
  const fallback: Rect = { x: 0, y: 0, w: 1280, h: 400 }
  dom.window.Element.prototype.getBoundingClientRect = function (this: Element) {
    const b = boxes[this.id] ?? fallback
    return domRect(b.x, b.y, b.w, b.h)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  return (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}
const runsOf = (s: RawSignals): RawRun[] => s.bands.flatMap((b) => [...b.content, ...b.items.flat()])
const fieldsOf = (s: RawSignals) => s.bands.flatMap((b) => b.fields)

// ── issue 2 ───────────────────────────────────────────────────────────────────

describe('REQ-380 issue 2 — a preserving run keeps every space it lays out', () => {
  const signals = extract(
    `<section id="s" style="background-color:#ffffff">
       <p id="a" style="white-space:break-spaces;color:#333333">Ready to begin?  Please complete the form</p>
       <p id="b" style="white-space:pre-wrap;color:#333333">First line
second   line</p>
       <p id="c" style="color:#333333">together.  Through   the work</p>
     </section>`,
    {
      s: { x: 0, y: 0, w: 1280, h: 600 },
      a: { x: 234, y: 40, w: 812, h: 24 },
      b: { x: 40, y: 120, w: 600, h: 48 },
      c: { x: 40, y: 240, w: 600, h: 24 },
    },
  )

  it('test_UAT_FC_REQ-380_a_break_spaces_run_keeps_its_interior_double_space', () => {
    const a = runsOf(signals).find((r) => r.text.startsWith('Ready'))!
    expect(a.text).toBe('Ready to begin?  Please complete the form')
    expect(a.whiteSpace).toBe('break-spaces')
  })

  it('test_UAT_FC_REQ-380_a_pre_wrap_run_keeps_its_space_runs_and_its_segment_break', () => {
    const b = runsOf(signals).find((r) => r.text.startsWith('First'))!
    expect(b.text).toBe('First line\nsecond   line')
  })

  it('test_UAT_FC_REQ-380_a_collapsing_run_still_collapses', () => {
    const c = runsOf(signals).find((r) => r.text.startsWith('together'))!
    expect(c.text).toBe('together. Through the work')
    expect(c.whiteSpace).toBeNull()
  })

  it('test_UAT_FC_REQ-380_the_kept_spaces_reach_the_rendered_page', () => {
    const doc = foldToL1({
      url: 'http://fixture.test/',
      notes: [],
      projections: LADDER.map((w) => ({
        engine: 'chromium',
        viewport: { width: w, height: 800 },
        state: 'rest',
        manifest: {
          source: `req380:${w}`,
          sections: [],
          viewport: { width: w, height: 800 },
          elements: [
            el({ text: 'together.  Through', whiteSpace: 'break-spaces', box: { x: 40, y: 100, width: 600, height: 24 } }),
          ],
        },
      })) as unknown as StateProjection[],
    })
    const run = placed(doc).find((p) => textOf(p.node)?.startsWith('together'))!
    expect(textOf(run.node)).toBe('together.  Through')
    const { html, css } = renderL1Document(doc)
    expect(html).toContain('together.  Through')
    expect(css).toContain('white-space: break-spaces')
  })

  it('test_UAT_FC_REQ-380_the_capture_schema_names_the_bump', () => {
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(18)
  })
})

// ── issue 3 ───────────────────────────────────────────────────────────────────

const FOOTER = `<footer id="s" style="background-color:#249ed3">
  <p id="p" style="color:#ffffff">© 2025. All rights reserved.</p>
  <div id="icons">
    <a id="fb" href="https://www.facebook.com/profile.php?id=1" target="_blank" rel="noopener" title="Go to Facebook page" style="color:#ffffff"><svg id="fbi" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M24 12C24 5.4 18.6 0 12 0S0 5.4 0 12c0 6 4.4 11 10.1 11.9V15.5H7.1V12h3V9.4C10.1 6.4 11.9 4.8 14.7 4.8V8h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12Z"></path></svg></a>
    <a id="ig" href="https://www.instagram.com/x/" aria-label="Instagram" style="color:#ffffff"><svg id="igi" width="24" height="24" viewBox="0 0 24 24"><circle fill="currentColor" cx="12" cy="12" r="6"></circle></svg></a>
  </div>
  <a id="more" href="/about" style="color:#ffffff">About us <svg id="arrow" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M0 6h12"></path></svg></a>
</footer>`
const FOOTER_BOXES: Record<string, Rect> = {
  s: { x: 0, y: 0, w: 1280, h: 392 },
  p: { x: 58, y: 270, w: 503, h: 18 },
  icons: { x: 48, y: 230, w: 128, h: 32 },
  fb: { x: 52, y: 234, w: 24, h: 24 },
  fbi: { x: 52, y: 234, w: 24, h: 24 },
  ig: { x: 84, y: 234, w: 24, h: 24 },
  igi: { x: 84, y: 234, w: 24, h: 24 },
  more: { x: 600, y: 270, w: 90, h: 18 },
  arrow: { x: 676, y: 273, w: 12, h: 12 },
}

/** A fake driver returning fixed signals and no intercepted responses. */
function fakeDriver(signals: RawSignals): () => Promise<BrowserDriver> {
  const driver: BrowserDriver = {
    async navigate() {},
    async screenshot() {
      return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    },
    async query<T>() {
      return signals as T
    },
    responses: () => [],
    diagnostics: () => ({ consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }),
    async content() {
      return '<html><body></body></html>'
    },
    async close() {},
  }
  return async () => driver
}

describe('REQ-380 issue 3 — an inline-SVG icon that is a link’s only ink is recorded and reproduced', () => {
  const signals = extract(FOOTER, FOOTER_BOXES)
  const icons = fieldsOf(signals).filter((f) => typeof f.src === 'string' && f.src.startsWith('assets/inline-svg-'))

  it('test_UAT_FC_REQ-380_each_icon_link_is_a_media_field_with_its_href_name_and_box', () => {
    expect(icons.map((f) => f.href)).toEqual(['https://www.facebook.com/profile.php?id=1', 'https://www.instagram.com/x/'])
    const [fb, ig] = icons
    expect(fb.src).toMatch(/^assets\/inline-svg-[0-9a-f]{8}\.svg$/)
    expect(fb.src).not.toBe(ig.src)
    expect(fb.alt).toBe('Go to Facebook page')
    expect(ig.alt).toBe('Instagram')
    expect(fb.objectFit).toBe('contain')
    expect(fb.intrinsicAspect).toBe(1)
    expect(fb.newTab).toBe(true)
    expect(fb.box).toMatchObject({ x: 52, y: 234, width: 24, height: 24 })
  })

  it('test_UAT_FC_REQ-380_the_icon_markup_is_self_contained', () => {
    const markup = icons[0].svgMarkup!
    expect(markup).toMatch(/^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
    expect(markup).toContain('viewBox="0 0 24 24"')
    expect(markup).toContain('d="M24 12C24')
    expect(markup, 'no page class survives into a file with no stylesheet').not.toMatch(/class=/)
  })

  it('test_UAT_FC_REQ-380_an_svg_beside_its_links_own_copy_stays_unrecorded', () => {
    expect(fieldsOf(signals).some((f) => f.box && f.box.width === 12)).toBe(false)
    expect(icons).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-380_the_pipeline_mirrors_the_icon_and_the_fold_serves_it_as_a_linked_image', async () => {
    const result = await runCapturePipeline('https://www.example.test/', { driverFactory: fakeDriver(signals) })
    // The bundle carries the icon as an image asset at exactly the path its field names.
    const asset = result.capture.assets.find((a) => a.localPath === icons[0].src)!
    expect(asset).toMatchObject({ kind: 'image', src: icons[0].src, width: 24, height: 24 })
    expect(new TextDecoder().decode(result.assetBytes.get(asset.localPath)!)).toBe(icons[0].svgMarkup)
    expect(JSON.stringify(result.capture), 'the markup is not copied into capture.json').not.toContain('d="M24 12C24')

    // The fold turns the field into a linked image, and the mirror resolves it.
    const manifest = flattenSignals(signals, 'req380')
    const doc = foldToL1({
      url: 'https://www.example.test/',
      notes: [],
      projections: LADDER.map((w) => ({
        engine: 'chromium',
        viewport: { width: w, height: 800 },
        state: 'rest',
        manifest: { ...manifest, viewport: { width: w, height: 800 } },
      })) as unknown as StateProjection[],
    })
    const images = placed(doc)
      .map((p) => p.node)
      .filter((n): n is Extract<L1Node, { kind: 'image' }> => n.kind === 'image')
    const fb = images.find((n) => n.link?.href === 'https://www.facebook.com/profile.php?id=1')!
    expect(fb, 'the Facebook icon folds to an image linked to its page').toBeTruthy()
    expect(fb.alt).toBe('Go to Facebook page')
    const localized = localizeAssets(doc, result.capture.assets)
    expect(localized.unmirrored).toEqual([])
    expect(localized.rewritten.length + images.length).toBeGreaterThan(0)
    const served = placed(localized.doc)
      .map((p) => p.node)
      .find((n) => n.kind === 'image' && n.link?.href === 'https://www.facebook.com/profile.php?id=1') as { src: string }
    expect(served.src).toBe(`/${icons[0].src}`)
  })
})
