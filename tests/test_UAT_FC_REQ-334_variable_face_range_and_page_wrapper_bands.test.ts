/**
 * REQ-334 — two capture-side shortfalls measured on the
 * joyfulculinarycreations.com reproduction, both of which make the bundle say
 * something the page does not.
 *
 *  1. FACES — a VARIABLE family is one file answering a whole weight range, and
 *     Google Fonts declares that one file in one `@font-face` block per weight.
 *     `fontFacesByFamilyOf` deduplicated by `src` and kept the FIRST block, so
 *     Oswald's six blocks (200…700) collapsed to a single face at 200 and every
 *     run asking for 300 or 500 resolved to the lightest instance — 59 of that
 *     round's 65 value deltas, with the page's one STATIC family (Lato, one file
 *     per weight) clean as the internal control.
 *
 *  2. BANDS — the geometric fallback that recovers a page's bands from its paint
 *     was gated on the whole DOCUMENT degenerating to one band root. A page
 *     builder's `<body>` has three children (`<header>`, one full-page wrapper
 *     `<div>`, `<footer>`), so the gate failed and the 4440px wrapper was emitted
 *     as ONE section carrying its own transparent background: a page painting a
 *     photographic hero, three grey bands, a white band and a yellow footer
 *     arrived as two sections, both `background: none`. Nothing downstream can
 *     compare a band that is not in the list — all twelve of that round's
 *     unmeasured axes traced to it.
 *
 * Both tests drive real entry points. The face tests run the real
 * `runCapturePipeline` over an injected driver — the browser is the one external
 * boundary, and everything behind it (byte parsing, asset mirroring, the face
 * merge, `buildTheme`, `fontResourcesFromTheme`, `renderL1Document`) is real. The
 * band tests run the real `EXTRACT_SCRIPT` under jsdom and the real
 * `buildSections`, the same harness BUG-15 and BUG-22 use.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  runCapturePipeline,
  type BrowserDriver,
  type Capture,
  type CapturedResponse,
  type RawSignals,
} from '../tools/generate/src/cli/capture'
import { buildSections } from '../tools/generate/src/cli/capture/sections'
import { fontResourcesFromTheme } from '../tools/generate/src/cli/capture/theme'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1, type L1Document } from '../packages/site-schema/src/index'

// ── issue 1 — a variable face keeps the range its stylesheet declares ─────────

const ORIGIN = 'https://joyful.test'
const PAGE = `${ORIGIN}/`

/** One `@font-face` block in the shape Google Fonts serves. */
const block = (family: string, file: string, weight: number, style = 'normal'): string =>
  `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};` +
  `font-display:swap;src:url(${ORIGIN}/${file}) format('woff2');}`

const bytes = (s: string): Uint8Array => new TextEncoder().encode(s)

function response(url: string, contentType: string, body: string): CapturedResponse {
  return { url, status: 200, contentType, body: bytes(body) }
}

/**
 * A text run painting `family` at `weight`, in the one band the fake page has.
 * `buildTheme` reads the family's role and PAINTED weights off these.
 */
const run = (family: string, weight: number, role: 'heading' | 'body') => ({
  role,
  text: `${family} ${weight}`,
  color: '#111111',
  fontFamily: family,
  fontSizePx: role === 'heading' ? 64 : 18,
  fontWeight: weight,
  box: { x: 0, y: 0, width: 800, height: 80 },
})

function signals(runs: ReturnType<typeof run>[]): RawSignals {
  return {
    viewport: { width: 1280, height: 800 },
    bands: [
      {
        box: { x: 0, y: 0, width: 1280, height: 800 },
        backgroundColor: '#ffffff',
        backgroundImage: 'none',
        colorScheme: 'light',
        fontFamily: 'Oswald, raleway',
        textAlign: 'left',
        paddingTopPx: 0,
        paddingBottomPx: 0,
        overlay: null,
        content: runs,
        items: [],
        fields: [],
      },
    ],
    colorUsage: [],
    fontFaces: [], // cross-origin: the CSSOM path sees none, exactly as on Google Fonts
    typeScale: [18, 64],
    spacingScalePx: [],
    containerMaxWidthPx: null,
    images: [],
    bodyBackground: '#ffffff',
    title: 'Joyful',
  } as unknown as RawSignals
}

/** A driver that replays fixed responses — the browser is the external boundary. */
function fakeDriver(raw: RawSignals, responses: CapturedResponse[]): BrowserDriver {
  return {
    navigate: async () => {},
    screenshot: async () => new Uint8Array([0x89, 0x50]),
    query: async <T,>() => raw as unknown as T,
    responses: () => responses,
    diagnostics: () => ({ consoleErrors: [], pageErrors: [], failedRequests: [] }) as never,
    content: async () => '<html></html>',
    close: async () => {},
  }
}

/**
 * The page as joyfulculinarycreations.com serves it: Oswald is VARIABLE (one
 * latin-subset file declared six times, 200…700) and Lato is STATIC (one file per
 * weight). Lato is the control — the capture always got it right.
 */
async function joyfulCapture(): Promise<Capture> {
  const oswaldCss = [200, 300, 400, 500, 600, 700]
    .map((w) => block('Oswald', 'oswald-tk3iwkuhhaijg752gt8g.woff2', w))
    .join('')
  const latoCss = [300, 400, 700].map((w) => block('Lato', `lato-${w}.woff2`, w)).join('')
  const responses: CapturedResponse[] = [
    response(PAGE, 'text/html', '<html><body></body></html>'),
    response(`${ORIGIN}/oswald.css`, 'text/css', oswaldCss),
    response(`${ORIGIN}/lato.css`, 'text/css', latoCss),
    response(`${ORIGIN}/oswald-tk3iwkuhhaijg752gt8g.woff2`, 'font/woff2', 'OSWALD'),
    ...[300, 400, 700].map((w) => response(`${ORIGIN}/lato-${w}.woff2`, 'font/woff2', `LATO${w}`)),
  ]
  const raw = signals([run('Oswald', 500, 'heading'), run('Lato', 400, 'body')])
  const { capture } = await runCapturePipeline(PAGE, { driverFactory: async () => fakeDriver(raw, responses) })
  return capture
}

describe('REQ-334 issue 1 — a variable face carries every weight its sheet declares', () => {
  it('test_UAT_FC_REQ-334_six_blocks_naming_one_file_become_one_face_over_the_whole_range', async () => {
    // Wrong before: `if (merged.some((f) => f.src === src)) continue` kept the
    // FIRST block, so the six Oswald blocks became one face at 200 — the lowest.
    const capture = await joyfulCapture()
    const oswald = capture.theme.fonts.find((f) => f.family === 'Oswald')
    expect(oswald?.faces).toEqual([
      { src: 'assets/oswald-tk3iwkuhhaijg752gt8g.woff2', weight: [200, 700], style: 'normal' },
    ])
  })

  it('test_UAT_FC_REQ-334_a_static_family_still_declares_one_face_per_weight', async () => {
    // The control, internal to the same bundle: Lato is one file per weight, so
    // nothing here is a redeclaration and nothing must widen.
    const capture = await joyfulCapture()
    const lato = capture.theme.fonts.find((f) => f.family === 'Lato')
    expect(lato?.faces.map((f) => f.weight)).toEqual([300, 400, 700])
    expect(new Set(lato?.faces.map((f) => f.src)).size).toBe(3)
  })

  it('test_UAT_FC_REQ-334_the_served_document_declares_the_pair_not_the_lowest_weight', async () => {
    // What the reproduction's own `home.html` says, which is the axis the widths
    // in the value gate were measuring: `font-weight: 200` painted every Oswald
    // run at the lightest instance.
    const capture = await joyfulCapture()
    const doc: L1Document = {
      widths: [1280],
      resources: { fonts: fontResourcesFromTheme(capture.theme.fonts) },
      root: {
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'Dreaming of healthier meals',
            geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 815 }] },
            axes: { color: '#111111', fontFamily: 'Oswald', fontSizePx: 64, fontWeight: 500 },
          },
        ],
      },
    } as L1Document
    const checked = validateL1(doc)
    expect(checked.ok ? [] : checked.errors).toEqual([])
    const { css } = renderL1Document(doc)
    expect(css).toContain('font-weight: 200 700')
    // …and the whole-range declaration is the ONLY Oswald face, not one beside a
    // pinned 200 that would still win for every run asking below 300.
    expect(css.match(/@font-face \{ font-family: "Oswald"[^}]*\}/g)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-334_the_same_file_under_a_different_style_stays_a_separate_declaration', async () => {
    // Karla mirrors two files, one normal and one italic. Widening is scoped to
    // one family AND one style, so an italic block can never stretch the normal
    // face's range — and a file redeclared under another style is still settled
    // first-wins, exactly as the cascade settles it.
    const css =
      [200, 500, 800].map((w) => block('Karla', 'karla-normal.woff2', w)).join('') +
      [200, 800].map((w) => block('Karla', 'karla-italic.woff2', w, 'italic')).join('')
    const responses: CapturedResponse[] = [
      response(PAGE, 'text/html', '<html><body></body></html>'),
      response(`${ORIGIN}/karla.css`, 'text/css', css),
      response(`${ORIGIN}/karla-normal.woff2`, 'font/woff2', 'N'),
      response(`${ORIGIN}/karla-italic.woff2`, 'font/woff2', 'I'),
    ]
    const raw = signals([run('Karla', 400, 'body')])
    const { capture } = await runCapturePipeline(PAGE, {
      driverFactory: async () => fakeDriver(raw, responses),
    })
    expect(capture.theme.fonts[0].faces).toEqual([
      { src: 'assets/karla-normal.woff2', weight: [200, 800], style: 'normal' },
      { src: 'assets/karla-italic.woff2', weight: [200, 800], style: 'italic' },
    ])
  })
})

// ── issue 2 — a full-page wrapper is segmented into the bands it paints ───────

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Run the real EXTRACT_SCRIPT over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, Box>, docHeight: number): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: `${ORIGIN}/` })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const b = boxByClass[(this as Element).className || '']
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => docHeight })
  dom.window.Range.prototype.getBoundingClientRect = function () {
    const node = (this as Range).startContainer as Element
    const b = boxByClass[(node && node.className) || '']
    return b ? rect(b[0], b[1], b[2], Math.min(b[3], 24)) : rect(0, 0, 0, 0)
  }
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

const DOC_H = 4100

/**
 * The Elementor / WordPress shape: `<header>` + one full-page wrapper `<div>` +
 * `<footer>` as the body's children, with the wrapper's visually distinct panels
 * nested one level down. The wrapper itself paints nothing.
 */
function pageBuilderPage(): RawSignals {
  const html =
    `<!doctype html><html><body>` +
    `<header class="hdr" style="position:absolute"><p class="navline">Joyful Culinary</p></header>` +
    `<div class="wrap">` +
    `<section class="hero" style="background-color:rgb(0,0,0);` +
    `background-image:url(${ORIGIN}/hero.jpeg)"><h1 class="h1">Dreaming of healthier meals</h1></section>` +
    `<section class="white" style="background-color:rgb(255,255,255)"><p class="lede">Who uses our services</p></section>` +
    `<section class="grey" style="background-color:rgb(122,122,122)"><p class="quote">So fabulous.</p></section>` +
    `</div>` +
    `<footer class="ftr" style="background-color:rgb(237,194,81)"><p class="navfoot">Meet the Chef</p></footer>` +
    `</body></html>`
  return extract(
    html,
    {
      hdr: [0, 0, 1280, 100],
      navline: [40, 30, 300, 40],
      wrap: [0, 0, 1280, 3800],
      hero: [0, 0, 1280, 900],
      h1: [200, 400, 880, 97],
      white: [0, 900, 1280, 1400],
      lede: [200, 1000, 880, 40],
      grey: [0, 2300, 1280, 1500],
      quote: [200, 2400, 880, 40],
      ftr: [0, 3800, 1280, 300],
      navfoot: [200, 3900, 300, 32],
    },
    DOC_H,
  )
}

describe('REQ-334 issue 2 — a full-page wrapper is segmented into its painted bands', () => {
  it('test_UAT_FC_REQ-334_a_page_wrapper_beside_a_header_and_footer_is_still_sliced', () => {
    // Wrong before: the gate read `bandRoots.length === 1`, and this body has
    // three children, so the 3800px wrapper was emitted as ONE band with its own
    // (transparent) background — the page's band structure simply absent.
    const bands = pageBuilderPage().bands
    expect(bands.some((b) => b.box.height >= DOC_H * 0.6)).toBe(false)
    expect(bands.map((b) => b.backgroundColor)).toEqual([
      null, // the header paints nothing of its own
      '#000000',
      '#ffffff',
      '#7a7a7a',
      '#edc251',
    ])
  })

  it('test_UAT_FC_REQ-334_each_recovered_band_carries_its_own_measured_paint', () => {
    // `background: {"kind":"none"}` on every section is what left the comparator
    // with nothing to pair: `values-diff` reported 10 unpaired reproduction bands
    // and ZERO section deltas. A recovered band has to arrive with its own fill.
    const sections = buildSections(pageBuilderPage(), (src) => `assets/${src.split('/').pop()}`)
    expect(sections.map((s) => s.background.kind)).toEqual(['none', 'image', 'color', 'color', 'color'])
    expect(sections.find((s) => s.background.kind === 'image')?.background.image).toBe('assets/hero.jpeg')
    expect(sections.map((s) => s.box.height)).toEqual([100, 900, 1400, 1500, 300])
  })

  it('test_UAT_FC_REQ-334_an_absolutely_positioned_header_is_not_swallowed_into_the_wrapper', () => {
    // The header overlaps the wrapper's first slice. Only the wrapper's own
    // SUBTREE is a candidate for its slices, so the header stays exactly the one
    // band the top-level scan found rather than being reported twice.
    const bands = pageBuilderPage().bands
    expect(bands.filter((b) => b.box.y === 0 && b.box.height === 100)).toHaveLength(1)
    expect(bands.map((b) => [b.box.y, b.box.height])).toEqual([
      [0, 100],
      [0, 900],
      [900, 1400],
      [2300, 1500],
      [3800, 300],
    ])
  })

  it('test_UAT_FC_REQ-334_a_conventionally_segmented_page_is_unchanged', () => {
    // No root is page-tall, so nothing is sliced and every band is the body child
    // the top-level scan named — the answer this extractor has always given.
    const html =
      `<!doctype html><html><body>` +
      `<section class="a" style="background-color:rgb(0,0,0)"><h1 class="ah">Hero</h1></section>` +
      `<section class="b" style="background-color:rgb(255,255,255)"><p class="bp">Body</p></section>` +
      `<section class="c" style="background-color:rgb(237,194,81)"><p class="cp">Foot</p></section>` +
      `</body></html>`
    const bands = extract(
      html,
      {
        a: [0, 0, 1280, 1400],
        ah: [200, 400, 880, 97],
        b: [0, 1400, 1280, 1400],
        bp: [200, 1500, 880, 40],
        c: [0, 2800, 1280, 1300],
        cp: [200, 2900, 880, 40],
      },
      DOC_H,
    ).bands
    expect(bands.map((b) => [b.box.y, b.box.height, b.backgroundColor])).toEqual([
      [0, 1400, '#000000'],
      [1400, 1400, '#ffffff'],
      [2800, 1300, '#edc251'],
    ])
  })

  it('test_UAT_FC_REQ-334_a_wrapper_that_really_is_one_band_gains_no_invented_sections', () => {
    // A page-tall root whose paint is a single slice must not be split: the
    // geometric pass reports [] rather than inventing a second band, so the
    // wrapper is emitted whole exactly as before.
    const html =
      `<!doctype html><html><body>` +
      `<div class="wrap"><section class="only" style="background-color:rgb(255,255,255)">` +
      `<p class="p">One uniform page</p></section></div>` +
      `</body></html>`
    const bands = extract(
      html,
      { wrap: [0, 0, 1280, 4000], only: [0, 0, 1280, 4000], p: [200, 100, 880, 40] },
      DOC_H,
    ).bands
    expect(bands).toHaveLength(1)
    expect(bands[0].box.height).toBe(4000)
  })
})
