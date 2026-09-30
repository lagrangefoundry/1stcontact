/**
 * REQ-351 — five places the fold answered a question from the wrong evidence.
 *
 * Filed off iteration 4 of the joyfulculinarycreations.com reproduction, where
 * three of them together were **40.7% of the page's total pixel disagreement at
 * zero value deltas** — the worst combination there is, because a mistake both
 * sides make the same way agrees with itself and the instrument reports nothing.
 *
 *  1. **The page canvas came from the tallest band.** `<body>`'s own background
 *     is recorded at every projection, and was consulted only if the tallest-band
 *     search came back empty — which on a real page it never does. Grey won over
 *     the white the browser was asked about directly: 133/255 mean over the three
 *     strips where the page lets its canvas show, 22.34% of the page's diff mass.
 *  2. **A run's composited backdrop became an opaque card plate.** A quote
 *     standing directly on a photograph under a scrim reports the colour the
 *     browser resolved (`#636a63` — declared nowhere on the page). `shapeBoxAt`
 *     correctly declined that band-wide rect as a card shape and the fill from the
 *     same element survived, so a 689 x 154px plate was painted back over the very
 *     photograph it was sampled from. 18.34% of the diff mass.
 *  3. **A height response measured at one width was asserted at all of them.**
 *     `HEIGHT_PROBE_VIEWPORTS` held one entry, at 1280. A hero that is `100vh` at
 *     1024 and above and a content height below was given `heightFactor: 1`
 *     everywhere: `calc(305.5px + (100vh - 1024px))` = **49.5px** at 768x768, a
 *     band shorter than one line of its own copy, and 36 `escape` findings.
 *  4. **L1 could not say otherwise.** `viewportResponse` hung off the geometry as
 *     ONE scalar pair for the whole node, so "tracks the viewport at 1024 and
 *     above, fixed below" had no representation at all. It lives on the keyframe
 *     now, beside the `atHeight` it is measured from.
 *  5. **A whitespace-only run that reserves a line was dropped.**
 *     `' '.trim() === ''` in JavaScript, so a deliberate `&nbsp;` spacer read
 *     as "never had substance". The round's highest-severity delta (CRITICAL,
 *     severity 4060) and its only `unmatched`.
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import {
  upgradeL1LegacyViewportResponse,
  validateL1,
  type L1Document,
} from '../packages/site-schema/src/index'
import {
  CAPTURE_SCHEMA,
  HEIGHT_PROBE_VIEWPORTS,
  RESPONSIVE_VIEWPORTS,
  foldToL1,
  hasTextSubstance,
  staleCaptureAxes,
} from '../tools/generate/src'
import type {
  Capture,
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

// ── fixture plumbing ─────────────────────────────────────────────────────────

const LADDER = [768, 1024, 1280] as const
const LADDER_H: Record<number, number> = { 768: 1024, 1024: 768, 1280: 800 }

/** A text run at one width, spanning the fields the fold reads. */
function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  const el = {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
  const b = el.box
  return b
    ? ({ ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 21 } } as ValueElement)
    : el
}

type SectionSpec = {
  box: { x: number; y: number; width: number; height: number }
  surfaceFill?: string | null
  backgroundImageUrl?: string
  overlay?: { color: string; opacity: number; blendMode?: string } | null
}

interface ProjSpec {
  width: number
  height: number
  elements: ValueElement[]
  sections?: SectionSpec[]
  /** The measured `<body>` background, as the extractor records it. */
  bodyBackground?: string
}

function multi(specs: ProjSpec[]): MultiStateCapture {
  const projections: StateProjection[] = specs.map((s) => ({
    engine: 'chromium',
    viewport: { width: s.width, height: s.height },
    state: 'rest',
    manifest: {
      source: `t:${s.width}x${s.height}`,
      elements: s.elements,
      sections: (s.sections ?? []).map((sec, index) => ({
        index,
        overlay: sec.overlay ?? null,
        contentAnchorRatio: null,
        ...sec,
      })) as never,
      viewport: { width: s.width, height: s.height },
      ...(s.bodyBackground ? { bodyBackground: s.bodyBackground } : {}),
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** Every node in a folded document, flattened. */
function allNodes(doc: L1Document): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const walk = (n: Record<string, unknown>): void => {
    out.push(n)
    for (const c of (n.children as Array<Record<string, unknown>>) ?? []) walk(c)
  }
  walk(doc.root as never)
  return out
}

/**
 * A page whose TALLEST band is grey and whose recorded canvas is white, plus the
 * two 15px gaps where no band paints — the exact shape of issue 1, with the
 * reference page's own proportions (grey 2280px of band against white's 1060px).
 */
function canvasPage(recordCanvas: boolean): MultiStateCapture {
  const GREY = '#7a7a7a'
  const WHITE = '#ffffff'
  return multi(
    LADDER.map((width) => ({
      width,
      height: LADDER_H[width],
      ...(recordCanvas ? { bodyBackground: WHITE } : {}),
      elements: [
        // A full-bleed run per band, so the band reconstruction has content to
        // read a fill off. Grey twice, white twice — grey wins on total height.
        run({
          text: 'grey band one',
          surfaceFill: GREY,
          box: { x: 0, y: 0, width, height: 29 },
          surface: { self: false, box: { x: 0, y: 0, width, height: 1330 } } as never,
        }),
        run({
          text: 'white band',
          surfaceFill: WHITE,
          box: { x: 0, y: 1400, width, height: 29 },
          surface: { self: false, box: { x: 0, y: 1345, width, height: 535 } } as never,
        }),
        run({
          text: 'grey band two',
          surfaceFill: GREY,
          box: { x: 0, y: 1950, width, height: 29 },
          surface: { self: false, box: { x: 0, y: 1895, width, height: 950 } } as never,
        }),
      ],
      sections: [
        { box: { x: 0, y: 0, width, height: 1330 }, surfaceFill: GREY },
        { box: { x: 0, y: 1330, width, height: 15 }, surfaceFill: null },
        { box: { x: 0, y: 1345, width, height: 535 }, surfaceFill: WHITE },
        { box: { x: 0, y: 1880, width, height: 15 }, surfaceFill: null },
        { box: { x: 0, y: 1895, width, height: 950 }, surfaceFill: GREY },
      ],
    })),
  )
}

describe('REQ-351 — the fold reads the evidence it has', () => {
  // ── 1. the page canvas ──────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-351_the_page_canvas_is_the_recorded_body_background_not_the_tallest_band', () => {
    const doc = foldToL1(canvasPage(true))
    // The recorded canvas, at every one of the page's three projections. The
    // tallest band is grey by 2280px to 535px and does not get a say: a band that
    // is merely the tallest is evidence about BANDS, not about `<body>`.
    expect(doc.background, 'the canvas the capture measured').toBe('#ffffff')

    // And it reaches the served page, which is where the 133/255 was paid: the
    // two 15px testimonial margins show the canvas and nothing else.
    const { css } = renderL1Document(doc)
    expect(css).toContain('background-color: #ffffff')

    // The grey bands are still there — this is a precedence fix, not a deletion.
    const fills = allNodes(doc).map((n) => (n.axes as { surfaceFill?: string })?.surfaceFill)
    expect(fills, 'the grey bands still paint themselves').toContain('#7a7a7a')
  })

  it('test_UAT_FC_REQ-351_a_bundle_that_recorded_no_canvas_still_falls_back_to_the_tallest_band', () => {
    // The fallback is kept, and is reached only when no projection measured a
    // canvas at all — a pre-schema-10 bundle, or a page that paints nothing on
    // `<body>`. Inverting the precedence must not make an older bundle worse.
    const doc = foldToL1(canvasPage(false))
    expect(doc.background, 'the tallest band, for want of a measurement').toBe('#7a7a7a')
  })

  it('test_UAT_FC_REQ-351_the_bundles_primary_record_carries_the_canvas_and_says_so_when_it_does_not', () => {
    // The capture-side half of issue 1. `capture.json`'s top level carried
    // `url host path title capturedAt captureSchema viewport theme sections
    // assets` and NO canvas, so every reader holding the primary record had to
    // infer one. The stamp is what makes "this bundle cannot answer that" a
    // finding an operator can act on rather than a silent wrong colour.
    expect(CAPTURE_SCHEMA, 'the extractor records the canvas as of this schema').toBeGreaterThanOrEqual(10)

    const base = {
      url: 'http://fixture.test/',
      host: 'fixture.test',
      path: '/',
      title: 't',
      capturedAt: '2026-01-01T00:00:00.000Z',
      viewport: { width: 1280, height: 800 },
      theme: { fonts: [], colors: [], scale: [] },
      sections: [],
      assets: [],
    } as unknown as Capture

    const behind = staleCaptureAxes({ ...base, captureSchema: 9 })
    expect(
      behind.map((a) => a.axis),
      'a schema-9 bundle is told the canvas is missing',
    ).toContain('bodyBackground')

    const current = staleCaptureAxes({
      ...base,
      captureSchema: CAPTURE_SCHEMA,
      bodyBackground: '#ffffff',
    } as Capture)
    expect(
      current.map((a) => a.axis),
      'a bundle that carries it is not asked to re-capture for it',
    ).not.toContain('bodyBackground')
  })

  // ── 2. the composited band backdrop ─────────────────────────────────────────

  /**
   * The testimonial shape: a section painting a photograph under a 0.67 `darken`
   * scrim, and a 689-wide quote standing directly on it — `surface.self: false`
   * with a band-wide (1280) surface box. The fill the capture reports for that
   * run is `darken(#141e14 @ .67)` over `#ffffff` = `#636a63`, a colour the page
   * declares nowhere.
   */
  function compositedBandPage(over: Partial<ValueElement> = {}): MultiStateCapture {
    return multi(
      LADDER.map((width) => {
        const quoteWidth = Math.round(width * 0.538) // 689 at 1280 — well under 0.7
        return {
          width,
          height: LADDER_H[width],
          bodyBackground: '#ffffff',
          elements: [
            // A full-bleed line above, so the page's content width is the page's
            // — the band/card split is a judgement about the run's width against
            // the widest content on the page, and a one-run fixture would make
            // every run full-width by construction.
            run({
              text: 'What people are saying',
              surfaceFill: '#ffffff',
              box: { x: 0, y: 320, width, height: 29 },
              surface: { self: false, box: { x: 0, y: 280, width, height: 200 } } as never,
            }),
            run({
              text: "It's not just about eating your veggies",
              surfaceFill: '#636a63',
              box: { x: (width - quoteWidth) / 2, y: 45, width: quoteWidth, height: 78 },
              surface: { self: false, box: { x: 0, y: 0, width, height: 267 } } as never,
              ...over,
            }),
          ],
          sections: [
            {
              box: { x: 0, y: 0, width, height: 267 },
              surfaceFill: '#ffffff',
              backgroundImageUrl: '/assets/market-vegetables-produce-6329164.jpg',
              overlay: { color: '#141e14', opacity: 0.67, blendMode: 'darken' },
            },
            { box: { x: 0, y: 280, width, height: 200 }, surfaceFill: '#ffffff' },
          ],
        }
      }),
    )
  }

  it('test_UAT_FC_REQ-351_a_run_standing_on_a_photographic_band_contributes_no_card_plate', () => {
    const doc = foldToL1(compositedBandPage())
    const nodes = allNodes(doc)

    // The band's own record is untouched and complete — the image and the scrim
    // are what the browser composited FROM, and they are strictly better evidence
    // than the colour it composited TO.
    const backdrop = nodes.find(
      (n) => (n.axes as { backgroundImageUrl?: string })?.backgroundImageUrl !== undefined,
    )
    expect(backdrop, 'the band keeps its photograph').toBeTruthy()
    expect((backdrop!.axes as { overlay?: unknown }).overlay, 'and its scrim').toBeTruthy()

    // And nothing anywhere paints the composite back over it.
    const fills = nodes.map((n) => (n.axes as { surfaceFill?: string })?.surfaceFill)
    expect(fills, 'no opaque plate of the resolved colour').not.toContain('#636a63')

    const { css } = renderL1Document(doc)
    expect(css, 'nor in the served stylesheet').not.toContain('#636a63')
  })

  it('test_UAT_FC_REQ-351_a_run_on_a_photographic_band_keeps_a_treatment_it_measured_on_itself', () => {
    // The narrowest correct rule, and why the blunt one was rejected: a border,
    // an accent rule, a radius and a shadow are measured on the run's OWN element
    // and are nobody else's. Only the colour is a composite. So the row survives
    // as a card for its border — with the fill dropped.
    const doc = foldToL1(compositedBandPage({ borderLeft: { widthPx: 4, color: '#00d492' } }))
    const nodes = allNodes(doc)
    const accented = nodes.find(
      (n) => (n.axes as { borderLeft?: unknown })?.borderLeft !== undefined,
    )
    expect(accented, 'the accent rule the run bears itself survives as a card').toBeTruthy()
    expect(
      (accented!.axes as { surfaceFill?: string }).surfaceFill,
      'and that card carries no colour, because the colour was the band’s',
    ).toBeUndefined()
    const fills = nodes.map((n) => (n.axes as { surfaceFill?: string })?.surfaceFill)
    expect(fills, 'the composite is nowhere in the document').not.toContain('#636a63')
  })

  it('test_UAT_FC_REQ-351_a_run_on_a_plain_solid_band_still_reports_that_bands_fill', () => {
    // The guard that makes the rule narrow rather than blunt. A run on a band the
    // section record says paints a FLAT COLOUR reports a colour that is not a
    // composite of anything, and on a page whose bands reconstruct from their runs
    // that fill is the only evidence the band has. Dropping it here would delete
    // band fills across every site.
    const NAVY = '#0b1f3a'
    const doc = foldToL1(
      multi(
        LADDER.map((width) => ({
          width,
          height: LADDER_H[width],
          bodyBackground: '#ffffff',
          elements: [
            run({
              text: 'a full-bleed line on a navy band',
              surfaceFill: NAVY,
              box: { x: 0, y: 40, width, height: 29 },
              surface: { self: false, box: { x: 0, y: 0, width, height: 200 } } as never,
            }),
          ],
          sections: [{ box: { x: 0, y: 0, width, height: 200 }, surfaceFill: NAVY }],
        })),
      ),
    )
    const fills = allNodes(doc).map((n) => (n.axes as { surfaceFill?: string })?.surfaceFill)
    expect(fills, 'a plain band keeps the fill its runs reported').toContain(NAVY)
  })

  // ── 3. one probe per ladder width ───────────────────────────────────────────

  it('test_UAT_FC_REQ-351_the_height_axis_is_probed_at_every_ladder_width', () => {
    // Issue 3's capture half. One probe made the response a single-point
    // measurement; with the response now carried per keyframe, an unprobed width
    // says nothing at all — honest, but silent. So the number of probed widths is
    // exactly the number of widths at which the axis is measurable.
    expect(
      HEIGHT_PROBE_VIEWPORTS.map((v) => v.width).sort((a, b) => a - b),
      'every ladder width is probed',
    ).toEqual(RESPONSIVE_VIEWPORTS.map((v) => v.width).sort((a, b) => a - b))

    // And each probe differs from its ladder height, which is what makes the pair
    // readable as a finite difference at all.
    for (const probe of HEIGHT_PROBE_VIEWPORTS) {
      const ladder = RESPONSIVE_VIEWPORTS.find((v) => v.width === probe.width)!
      expect(probe.height, `probe at ${probe.width} differs from the ladder`).not.toBe(ladder.height)
    }
  })

  it('test_UAT_FC_REQ-351_a_height_rule_measured_at_one_width_is_not_applied_at_another', () => {
    // The defect end to end, on the node it was filed on: the hero section band
    // (`section-bg-0`), which tracks the viewport at 1024 and above and is a
    // content height below — measured at both, by a probe at every ladder width.
    // One node-level factor could state only ONE of those, and stating
    // `heightFactor: 1` at 768 emitted `calc(305.5px + (100vh - 1024px))`: 49.5px
    // at a 768-tall viewport, a band shorter than one line of the copy on it.
    const CONTENT_H = 305.5
    const heroHeight = (width: number, vh: number): number => (width >= 1024 ? vh : CONTENT_H)
    const at = (width: number, height: number): ProjSpec => {
      const hero = heroHeight(width, height)
      return {
        width,
        height,
        bodyBackground: '#ffffff',
        elements: [
          run({
            text: 'Fresh, seasonal, yours',
            box: { x: 24, y: 80, width: Math.min(400, width - 48), height: 29 },
          }),
          run({
            text: 'What people are saying',
            surfaceFill: '#ffffff',
            box: { x: 0, y: hero + 40, width, height: 29 },
            surface: { self: false, box: { x: 0, y: hero, width, height: 200 } } as never,
          }),
        ],
        sections: [
          // The hero paints a photograph, so it folds through the section-background
          // path and its box IS its height — exactly the node the ticket names.
          {
            box: { x: 0, y: 0, width, height: hero },
            surfaceFill: '#000000',
            backgroundImageUrl: '/assets/hero.jpg',
          },
          { box: { x: 0, y: hero, width, height: 200 }, surfaceFill: '#ffffff' },
        ],
      }
    }
    const specs: ProjSpec[] = LADDER.map((w) => at(w, LADDER_H[w]))
    // A height probe at every ladder width — 200px taller, as the capture takes them.
    for (const w of LADDER) specs.push(at(w, LADDER_H[w] + 200))
    const doc = foldToL1(multi(specs))

    const hero = allNodes(doc).find(
      (n) => (n.axes as { backgroundImageUrl?: string })?.backgroundImageUrl === '/assets/hero.jpg',
    )!
    const geo = hero.geometry as {
      keyframes: Array<{
        at: number
        height?: number
        atHeight?: number
        viewportResponse?: { yFactor?: number; heightFactor?: number }
      }>
    }
    const kf = (at: number): (typeof geo.keyframes)[number] => geo.keyframes.find((k) => k.at === at)!

    // At 768 the reference measured 305.5px whatever the viewport height, so the
    // keyframe states no height response. This is the assertion that was
    // unauthorable before: the same node says something different at 1280.
    expect(kf(768).viewportResponse?.heightFactor ?? 0, 'pinned at 768').toBe(0)
    expect(kf(768).height, 'at the height the reference measured').toBeCloseTo(CONTENT_H, 1)
    expect(kf(1280).viewportResponse?.heightFactor, 'and tracks the viewport at 1280').toBe(1)

    // Which is what the served CSS has to say, since the pixels were paid there.
    const { html, css } = renderL1Document(doc)
    const cls = html.match(new RegExp(`class="([^"]+)" id="${hero.id}"`))![1].split(' ')[0]
    /** Every height declaration the renderer emitted for this node, by media block. */
    const heightRules = (): Array<{ media: string; decl: string }> => {
      const out: Array<{ media: string; decl: string }> = []
      let media = ''
      for (const line of css.split('\n')) {
        const m = line.match(/@media \(min-width: (\d+)px\)/)
        if (m) media = m[1]
        // A bare `}` at the start of a line closes the media block; a rule line is
        // indented and ends with `}` after its declarations, so it does not match.
        else if (line === '}') media = ''
        if (line.includes(`.${cls} `) || line.includes(`.${cls}{`)) {
          const h = line.match(/height: ([^;}]+)/)
          if (h) out.push({ media, decl: h[1] })
        }
      }
      return out
    }
    const rules = heightRules()
    // Below 1024 nothing is a viewport function — the old code emitted
    // `calc(305.5px + (100vh - 1024px))` here, which is 49.5px at 768x768.
    const below = rules.filter((r) => r.media === '' || Number(r.media) < 1024)
    expect(below.length, 'the 768 band has a height rule at all').toBeGreaterThan(0)
    expect(
      below.map((r) => r.decl).join(' '),
      'and it is not a viewport function',
    ).not.toContain('100vh')
    // At and above 1024 it is, because that is where the rule was measured.
    expect(
      rules.filter((r) => Number(r.media) >= 1024).map((r) => r.decl).join(' '),
      'the hero tracks the viewport where it was measured to',
    ).toContain('100vh')
  })

  // ── 4. L1 says it per width, and the renderer honours that ──────────────────

  /** A minimal document stating one response at 1024 and none at 768. */
  function perWidthDoc(): L1Document {
    return {
      background: '#ffffff',
      widths: [768, 1024],
      root: {
        kind: 'box',
        id: 'hero',
        axes: { surfaceFill: '#030717' },
        geometry: {
          keyframes: [
            { at: 768, x: 0, y: 0, width: 768, height: 305.5, atHeight: 1024 },
            {
              at: 1024,
              x: 0,
              y: 0,
              width: 1024,
              height: 768,
              atHeight: 768,
              viewportResponse: { heightFactor: 1 },
            },
          ],
          segments: ['snap'],
        },
      },
    } as unknown as L1Document
  }

  it('test_UAT_FC_REQ-351_l1_states_a_height_response_at_one_width_and_not_at_another', () => {
    // Issue 4 — the ceiling issue 3 ran into. "100vh at 1024 and above, a content
    // height below" had NO representation: `viewportResponse` was one object for
    // the whole node and `.strict()` refused any per-width variant. The only
    // workaround was to split the node in two with `visibility` ranges, which
    // duplicates the paint and the content.
    const result = validateL1(perWidthDoc())
    expect(result.ok ? [] : result.errors.map((e) => e.message), 'the document is authorable').toEqual([])

    const { html, css } = renderL1Document(perWidthDoc())
    const cls = html.match(/class="([^"]+)" id="hero"/)![1].split(' ')[0]
    const rules = css.split('}').filter((r) => r.includes(`.${cls} `) || r.includes(`.${cls} {`))
    const pinned = rules.filter((r) => r.includes('305.5px'))
    expect(pinned.length, 'the 768 height is emitted').toBeGreaterThan(0)
    expect(pinned.join(' '), 'and is not a viewport function').not.toContain('100vh')
    // `768 + 1 * (100vh - 768)` where the base IS the capture height → plain 100vh.
    expect(css, 'the 1024 height is').toContain('(100vh - 768px)')
  })

  it('test_UAT_FC_REQ-351_a_keyframe_response_without_the_height_it_was_measured_from_is_refused', () => {
    // The pair the response is meaningless without. Applied against a missing
    // `atHeight` the renderer would silently treat 0 as the capture height,
    // turning `100vh` into `y + 100vh`. The rule used to be asked of the geometry;
    // it is asked of the keyframe now, because that is where both halves live.
    const doc = perWidthDoc()
    const kfs = (doc.root as { geometry: { keyframes: Array<Record<string, unknown>> } }).geometry.keyframes
    delete kfs[1].atHeight
    const result = validateL1(doc)
    expect(result.ok).toBe(false)
    const messages = result.ok ? [] : result.errors.map((e) => e.message)
    expect(messages.join(' ')).toContain('requires the keyframe to carry `atHeight`')
  })

  it('test_UAT_FC_REQ-351_a_node_level_response_is_no_longer_a_place_to_put_one', () => {
    // There is deliberately no geometry-level default left to inherit from. Two
    // ways to say the same thing is two things to keep in agreement, and the one
    // that held a single rule for a whole ladder IS the defect — so the envelope's
    // `.strict()` refuses it rather than quietly honouring the shape that was
    // wrong. (A stored document carrying the old form fails loudly at the gate,
    // which is what a schema change is for.)
    const doc = perWidthDoc()
    const geo = (doc.root as { geometry: Record<string, unknown> }).geometry
    geo.viewportResponse = { heightFactor: 1 }
    const result = validateL1(doc)
    expect(result.ok).toBe(false)
    const messages = result.ok ? [] : result.errors.map((e) => e.message)
    expect(messages.join(' ')).toContain('viewportResponse')
  })

  it('test_UAT_FC_REQ-351_a_document_folded_before_this_change_is_lifted_not_rejected', () => {
    // The consequence of refusing the old shape, and the reason refusing it is
    // still right. A bundle's retained `l1.json` is a DERIVED artifact of whichever
    // fold wrote it, so every stored bundle carries the node-level pair — and the
    // recovery threw on one, mid-run, with a schema error. The field's meaning is
    // exact (`this pair, at every width`), so it lifts losslessly onto each
    // keyframe; rejecting it would make a refold the price of reading a bundle at
    // all. `readL1` does this on the way out.
    const legacy = {
      background: '#ffffff',
      widths: [768, 1024],
      root: {
        kind: 'box',
        id: 'hero',
        axes: { surfaceFill: '#030717' },
        geometry: {
          keyframes: [
            { at: 768, x: 0, y: 0, width: 768, height: 305.5, atHeight: 1024 },
            // No `atHeight`: nothing measured this width, so there is no origin to
            // apply a factor against and the lift must not invent one.
            { at: 1024, x: 0, y: 0, width: 1024, height: 768 },
          ],
          segments: ['snap'],
          viewportResponse: { heightFactor: 1 },
        },
      },
    }
    // As written it is refused — which is the point of refusing it.
    expect(validateL1(legacy).ok, 'the old shape is not authorable').toBe(false)

    const lifted = upgradeL1LegacyViewportResponse(legacy)
    const result = validateL1(lifted)
    expect(result.ok ? [] : result.errors.map((e) => e.message), 'lifted, it reads').toEqual([])
    const kfs = (lifted as { root: { geometry: { keyframes: Array<Record<string, unknown>> } } }).root
      .geometry.keyframes
    expect(kfs[0].viewportResponse, 'the measured width carries the rule').toEqual({ heightFactor: 1 })
    expect(kfs[1].viewportResponse, 'the width with no origin carries none').toBeUndefined()
    expect(
      (lifted as { root: { geometry: Record<string, unknown> } }).root.geometry.viewportResponse,
      'and the node-level field is gone, not duplicated',
    ).toBeUndefined()

    // Idempotent, and it does not overwrite a per-width value with a node-wide one:
    // the keyframe's own measurement is strictly better evidence.
    expect(upgradeL1LegacyViewportResponse(lifted)).toEqual(lifted)
    const mixed = JSON.parse(JSON.stringify(legacy))
    mixed.root.geometry.keyframes[0].viewportResponse = { heightFactor: 0.5 }
    const liftedMixed = upgradeL1LegacyViewportResponse(mixed)
    expect(liftedMixed.root.geometry.keyframes[0].viewportResponse).toEqual({ heightFactor: 0.5 })
  })

  // ── 5. a run that occupies a line box occupies a line box ───────────────────

  it('test_UAT_FC_REQ-351_a_run_whose_whole_content_is_a_non_breaking_space_keeps_its_line', () => {
    // The round's highest-severity delta (CRITICAL, 4060) and its only
    // `unmatched`: a deliberate `&nbsp;` spacer holding a 21.59px line open, which
    // the fold dropped because `' '.trim() === ''` in JavaScript.
    const doc = foldToL1(
      multi(
        LADDER.map((width) => ({
          width,
          height: LADDER_H[width],
          bodyBackground: '#ffffff',
          elements: [
            run({ text: 'a heading', box: { x: 24, y: 100, width: 400, height: 29 } }),
            run({ text: ' ', box: { x: 24, y: 140, width: 162.06, height: 21.59 } }),
            run({ text: 'and the line after it', box: { x: 24, y: 180, width: 400, height: 29 } }),
          ],
        })),
      ),
    )
    const spacers = allNodes(doc).filter(
      (n) => n.kind === 'text' && typeof n.text === 'string' && (n.text as string).trim() === '',
    )
    expect(spacers.map((n) => n.text), 'the spacer is a text leaf').toEqual([' '])
    // And it has geometry, because a line box is the thing it was there to hold.
    const geo = spacers[0].geometry as { keyframes: Array<{ at: number; width: number }> }
    expect(geo.keyframes.find((k) => k.at === 1280)?.width).toBeCloseTo(162.06, 1)
  })

  it('test_UAT_FC_REQ-351_substance_is_ascii_whitespace_only_and_is_decided_in_one_place', () => {
    // The predicate itself, because three stages have to agree about which runs
    // exist — the fold's leaf decision, the L1 oracle's reference-side run list
    // and the round-trip projection. A run one of them keeps and another drops is
    // an `unmatched` nobody can act on.
    for (const blank of ['', ' ', '\t', '\n', '  \r\n ', undefined, null]) {
      expect(hasTextSubstance(blank as string | undefined), `${JSON.stringify(blank)} is blank`).toBe(false)
    }
    // Every one of these OCCUPIES SPACE: no-break space, figure space, narrow
    // no-break space, word joiner, zero-width space. The author wrote them to
    // hold a line and the browser lays a line box out for them.
    for (const kept of [' ', ' ', ' ', '⁠', '​', 'x', ' x ']) {
      expect(hasTextSubstance(kept), `${JSON.stringify(kept)} has substance`).toBe(true)
    }
  })
})
