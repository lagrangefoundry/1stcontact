/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document…", the **measured-axes** span (REQ-88 / BUG-17 / BUG-24).
 *
 * The text-only criteria (AC-689…AC-696) are proven in tests/reconciliation-l1-fold.test.ts,
 * the full-language ones (AC-729…AC-733) in tests/reconciliation-l1-fold-full-language.test.ts,
 * the seam/backdrop/re-fold ones (AC-812…AC-814) in
 * tests/reconciliation-l1-fold-seams-and-refold.test.ts, and the framing/adjustment
 * pair (AC-1133/AC-1134) in tests/reconciliation-l1-fold-framing-and-adjustment.test.ts.
 *
 * This file proves the criteria whose common shape is *an axis the fold measures
 * off the reference rather than authoring*:
 *
 *   AC-1345  a section folds a background box on an image **or** a scrim, each
 *            axis read from the widest width carrying *it*
 *   AC-1346  per-side padding folds as its own axis; a side that varies across
 *            the ladder earns a per-width track, an unvarying one stays scalar
 *   AC-1347  the no-wrap threshold is the measured single-line **suffix** of the
 *            ladder; unmeasurable breaks the suffix rather than reading as one line
 *   AC-1352  a same-width viewport-height probe pair folds to a measured height
 *            derivative, snapped to eighths, and never becomes a keyframe of its own
 *
 * Every probe drives the real `foldToL1` / `validateL1` / `renderL1Document` /
 * `partitionProbes` entry points over synthetic multi-viewport captures — real
 * components, no mocks.
 */
import { describe, expect, it } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, partitionProbes } from '../tools/generate/src'
import type {
  MultiStateCapture,
  SectionValues,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

/** The fixed sampled width ladder `1c capture page` walks. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** The ladder's viewport heights — deliberately varying, as the real one does. */
const LADDER_H: Record<number, number> = { 320: 800, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }

interface ProjSpec {
  width: number
  height: number
  elements: ValueElement[]
  sections?: SectionValues[]
}

/** Build a resting `MultiStateCapture` from explicit per-projection specs. */
function multi(specs: ProjSpec[]): MultiStateCapture {
  const projections: StateProjection[] = specs.map((s) => ({
    engine: 'chromium',
    viewport: { width: s.width, height: s.height },
    state: 'rest',
    manifest: {
      source: `fold@${s.width}x${s.height}`,
      elements: s.elements,
      sections: (s.sections ?? []) as never,
      viewport: { width: s.width, height: s.height },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** The ladder, one spec per width, at the ladder's own viewport heights. */
function overLadder(at: (width: number, height: number) => Omit<ProjSpec, 'width' | 'height'>): MultiStateCapture {
  return multi(LADDER.map((w) => ({ width: w, height: LADDER_H[w], ...at(w, LADDER_H[w]) })))
}

/** A styled text run at one width, spanning the fields the fold reads. */
function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
}

/** A run the reference set on exactly `n` lines (what `renderedTextBox` reports). */
function lines(el: ValueElement, n: number): ValueElement {
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 29 * n - 8 } }
}

/** A text-free element — the media / painted-panel shape. */
function textless(over: Partial<ValueElement> & { box: ValueElement['box'] }): ValueElement {
  return {
    text: '',
    role: 'img',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    ...over,
  }
}

/** Every node in a folded document, flattened in document order. */
function allNodes(doc: ReturnType<typeof foldToL1>): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const walk = (n: Record<string, unknown>): void => {
    out.push(n)
    for (const c of (n.children as Array<Record<string, unknown>>) ?? []) walk(c)
  }
  walk(doc.root as never)
  return out
}

const nodeWith = (doc: ReturnType<typeof foldToL1>, pred: (n: Record<string, unknown>) => boolean) =>
  allNodes(doc).find(pred)!

const textNode = (doc: ReturnType<typeof foldToL1>, text: string) =>
  nodeWith(doc, (n) => n.kind === 'text' && n.text === text)

// ── AC-1345: a section background box folds on an image OR a scrim ────────────

describe('AC-1345 a section folds a background box when it paints an image or a scrim', () => {
  const HERO = 'https://cdn.example.com/hero.jpg'
  const VEIL = { color: '#020618', opacity: 0.3 }

  /** A capture carrying only sections (no elements) — the band-level axes. */
  function sectionsOnly(sectionsAt: (width: number) => SectionValues[]): MultiStateCapture {
    return multi(LADDER.map((w) => ({ width: w, height: 1200, elements: [], sections: sectionsAt(w) })))
  }

  const bgBox = (doc: ReturnType<typeof foldToL1>, index = 0) =>
    allNodes(doc).find((n) => n.id === `section-bg-${index}`)

  it('test_UAT_AC1345_section_background_box_folds_on_image_or_scrim', () => {
    // ── Both axes: a photograph under a translucent veil — the motivating shape ─
    const veiled = foldToL1(
      sectionsOnly((width) => [
        {
          index: 0,
          overlay: { ...VEIL },
          contentAnchorRatio: null,
          backgroundImageUrl: HERO,
          box: { x: 0, y: 0, width, height: 600 },
        },
      ]),
    )
    expect(validateL1(veiled).ok).toBe(true)
    const hero = bgBox(veiled)
    expect(hero, 'the hero section folds to one background box').toBeDefined()
    const heroAxes = hero!.axes as Record<string, unknown>
    // ONE box carries both — the scrim is not a node of its own.
    expect(heroAxes.backgroundImageUrl).toBe(HERO)
    expect(heroAxes.overlay).toEqual(VEIL)
    // Its geometry pins all four sides at every width the section is present at.
    const heroGeo = hero!.geometry as { keyframes: Array<{ at: number; height?: number; width: number }> }
    expect(heroGeo.keyframes.map((k) => k.at)).toEqual(LADDER)
    for (const kf of heroGeo.keyframes) {
      expect(kf.height).toBe(600)
      expect(kf.width).toBe(kf.at)
    }

    // The veil paints OVER the photograph rather than the photograph painting at
    // full brightness: the colour keeps its alpha (0.3 → 0x4d) and is layered
    // ahead of the image in one `background-image` (first layer paints on top).
    const { css } = renderL1Document(veiled)
    expect(css).toContain('#0206184d')
    expect(
      css.match(/background-image:\s*linear-gradient\(#0206184d, #0206184d\), url\("[^"]*hero\.jpg"\)/),
      'scrim layered above the image',
    ).not.toBeNull()

    // ── Image-OR-scrim: a veil over a solid band, with no image at all ─────────
    const scrimOnly = foldToL1(
      sectionsOnly((width) => [
        { index: 0, overlay: { ...VEIL }, contentAnchorRatio: null, box: { x: 0, y: 0, width, height: 600 } },
      ]),
    )
    const solidBand = bgBox(scrimOnly)
    expect(solidBand, 'an image-less scrim section still folds a box').toBeDefined()
    expect((solidBand!.axes as Record<string, unknown>).overlay).toEqual(VEIL)
    expect((solidBand!.axes as Record<string, unknown>).backgroundImageUrl).toBeUndefined()

    // …an image with no veil folds exactly as before, with no scrim axis…
    const imageOnly = foldToL1(
      sectionsOnly((width) => [
        {
          index: 0,
          overlay: null,
          contentAnchorRatio: null,
          backgroundImageUrl: HERO,
          box: { x: 0, y: 0, width, height: 600 },
        },
      ]),
    )
    expect((bgBox(imageOnly)!.axes as Record<string, unknown>).backgroundImageUrl).toBe(HERO)
    expect((bgBox(imageOnly)!.axes as Record<string, unknown>).overlay).toBeUndefined()

    // …and a section painting NEITHER folds no box, so the widened predicate does
    // not start painting an empty rectangle over every plain band.
    const plain = foldToL1(
      sectionsOnly((width) => [
        { index: 0, overlay: null, contentAnchorRatio: null, box: { x: 0, y: 0, width, height: 600 } },
      ]),
    )
    expect(bgBox(plain)).toBeUndefined()

    // ── Each axis is read from the widest width carrying IT ────────────────────
    // The section paints the photograph only at the widest rung and the veil only
    // at a narrower one. Reading both off a single widest entry would drop the
    // scrim, because that entry does not carry one.
    const perAxis = foldToL1(
      sectionsOnly((width) => {
        if (width === 1440) {
          return [
            {
              index: 0,
              overlay: null,
              contentAnchorRatio: null,
              backgroundImageUrl: HERO,
              box: { x: 0, y: 0, width, height: 600 },
            },
          ]
        }
        if (width === 768) {
          return [
            { index: 0, overlay: { ...VEIL }, contentAnchorRatio: null, box: { x: 0, y: 0, width, height: 600 } },
          ]
        }
        return [{ index: 0, overlay: null, contentAnchorRatio: null, box: { x: 0, y: 0, width, height: 600 } }]
      }),
    )
    const split = bgBox(perAxis)
    expect(split, 'the split-axis section still folds one box').toBeDefined()
    expect((split!.axes as Record<string, unknown>).backgroundImageUrl).toBe(HERO)
    expect((split!.axes as Record<string, unknown>).overlay).toEqual(VEIL)
    // …and it is ONE box: the two axes did not fold two nodes.
    expect(allNodes(perAxis).filter((n) => String(n.id ?? '').startsWith('section-bg-'))).toHaveLength(1)
    // Only the widths that actually painted something are keyframed.
    expect(
      (split!.geometry as { keyframes: Array<{ at: number }> }).keyframes.map((k) => k.at),
    ).toEqual([768, 1440])
  })
})

// ── AC-1346: the per-side padding axis and its per-width track ────────────────

describe('AC-1346 a leaf carries the per-side padding the reference painted', () => {
  it('test_UAT_AC1346_per_side_padding_folds_and_a_varying_side_earns_a_track', () => {
    const BADGE = { paddingTopPx: 4, paddingRightPx: 12, paddingBottomPx: 4, paddingLeftPx: 12 }
    const PICTURE = { paddingTopPx: 8, paddingRightPx: 16, paddingBottomPx: 24, paddingLeftPx: 32 }
    const PANEL = { paddingTopPx: 20, paddingRightPx: 20, paddingBottomPx: 20, paddingLeftPx: 20 }

    const doc = foldToL1(
      overLadder((width) => ({
        elements: [
          // A padded run — the pill badge.
          lines(run({ text: 'Coming soon', box: { x: 24, y: 40, width: 160, height: 32 }, ...BADGE }), 1),
          // A padded image…
          textless({
            a11yRole: 'img',
            objectFit: 'cover',
            intrinsicAspect: 1.5,
            src: 'https://cdn.example.com/plate.jpg',
            alt: 'Plate',
            box: { x: 24, y: 120, width: width - 48, height: 300 },
            ...PICTURE,
          }),
          // …a padded painted panel…
          textless({
            role: 'separator',
            a11yRole: 'separator',
            surfaceFill: '#f0eee9',
            box: { x: 24, y: 460, width: width - 48, height: 200 },
            ...PANEL,
          }),
          // …and a run the reference padded nowhere at all.
          lines(
            run({
              text: 'Unpadded copy',
              box: { x: 24, y: 700, width: 200, height: 29 },
              paddingTopPx: 0,
              paddingRightPx: 0,
              paddingBottomPx: 0,
              paddingLeftPx: 0,
            }),
            1,
          ),
        ],
      })),
    )
    expect(validateL1(doc).ok).toBe(true)

    // Each leaf carries a padding axis whose four sides equal the captured values.
    expect(textNode(doc, 'Coming soon').padding).toEqual({ topPx: 4, rightPx: 12, bottomPx: 4, leftPx: 12 })
    expect(nodeWith(doc, (n) => n.kind === 'image').padding).toEqual({
      topPx: 8,
      rightPx: 16,
      bottomPx: 24,
      leftPx: 32,
    })
    // (`box-*` is a captured standalone surface — not the root, and not a
    // fold-synthesized `section-*` band.)
    expect(nodeWith(doc, (n) => String(n.id ?? '').startsWith('box-')).padding).toEqual({
      topPx: 20,
      rightPx: 20,
      bottomPx: 20,
      leftPx: 20,
    })
    // An all-zero padding emits NO axis — a page that pads nothing gains no bloat.
    expect(textNode(doc, 'Unpadded copy').padding).toBeUndefined()

    // The pad insets content INSIDE the pinned box rather than inflating it: the
    // document reset is border-box, and the sides emit as typed longhands.
    const { css } = renderL1Document(doc)
    expect(css).toContain('box-sizing: border-box')
    expect(css).toContain('padding-left: 12px')
    expect(css).toContain('padding-right: 12px')
    expect(css).toContain('padding-bottom: 24px')

    // ── A side that VARIES across the ladder earns its own per-width track ─────
    const responsive = foldToL1(
      overLadder((width) => ({
        elements: [
          lines(
            run({
              text: 'Padded control',
              box: { x: 24, y: 100, width: 200, height: 48 },
              paddingLeftPx: width >= 1024 ? 32 : 12,
              paddingRightPx: width >= 1024 ? 32 : 12,
              paddingTopPx: 12,
              paddingBottomPx: 12,
            }),
            1,
          ),
        ],
      })),
    )
    const control = textNode(responsive, 'Padded control')
    const tracks = control.responsivePadding as Record<string, { keyframes: Array<{ at: number; value: number }> }>
    expect(tracks.leftPx.keyframes).toEqual(LADDER.map((at) => ({ at, value: at >= 1024 ? 32 : 12 })))
    expect(tracks.rightPx.keyframes).toEqual(LADDER.map((at) => ({ at, value: at >= 1024 ? 32 : 12 })))
    // The sides that do NOT vary stay plain scalars — a track earns its place.
    expect(tracks.topPx).toBeUndefined()
    expect(tracks.bottomPx).toBeUndefined()
    expect((control.padding as { topPx?: number }).topPx).toBe(12)
    // The base scalar is the widest sample; the track carries the narrow value.
    const { css: responsiveCss } = renderL1Document(responsive)
    expect(responsiveCss).toContain('padding-left: 12px')
    expect(responsiveCss).toMatch(/@media \(min-width: 1024px\)[\s\S]*padding-left: 32px/)

    // A leaf whose padding is identical at every sampled width emits no track.
    const flat = foldToL1(
      overLadder(() => ({
        elements: [lines(run({ text: 'Even pad', box: { x: 24, y: 100, width: 200, height: 48 }, ...BADGE }), 1)],
      })),
    )
    expect(textNode(flat, 'Even pad').responsivePadding).toBeUndefined()
    expect(textNode(flat, 'Even pad').padding).toEqual({ topPx: 4, rightPx: 12, bottomPx: 4, leftPx: 12 })
  })
})

// ── AC-1347: the measured no-wrap threshold ───────────────────────────────────

describe('AC-1347 the no-wrap threshold is the reference’s own single-line suffix', () => {
  /** One run over the ladder, set on `linesAt(width)` lines by the reference. */
  function oneRun(text: string, linesAt: (width: number) => number, measured = true): MultiStateCapture {
    return overLadder((width) => {
      const el = run({ text, box: { x: 24, y: 100, width: Math.min(600, width - 48), height: 24 } })
      return { elements: [measured ? lines(el, linesAt(width)) : el] }
    })
  }

  const thresholdOf = (doc: ReturnType<typeof foldToL1>, text: string) =>
    (textNode(doc, text).axes as { nowrapFromPx?: number }).nowrapFromPx

  it('test_UAT_AC1347_nowrap_threshold_is_the_measured_single_line_suffix', () => {
    // Two lines at the narrow rungs, one line from 768 upward → the threshold is
    // that middle width. A flag could only ever be set for runs that never wrap,
    // and would therefore have skipped this run entirely.
    const midway = foldToL1(oneRun('Reflows at mobile', (w) => (w <= 375 ? 2 : 1)))
    expect(validateL1(midway).ok).toBe(true)
    expect(thresholdOf(midway, 'Reflows at mobile')).toBe(768)

    // ── The suffix rule ───────────────────────────────────────────────────────
    // One line at 1024 but two at 1280 (responsive type can grow faster than its
    // column): the threshold is the WIDER 1440, never the earlier 1024 that also
    // happened to fit — pinning must not claim more than the reference showed.
    const singleAt = new Set([1024, 1440])
    const suffix = foldToL1(oneRun('Grows with its column', (w) => (singleAt.has(w) ? 1 : 2)))
    expect(thresholdOf(suffix, 'Grows with its column')).toBe(1440)

    // A run the reference never set on one line emits NO threshold axis.
    const alwaysWraps = foldToL1(oneRun('A long paragraph of body copy', () => 3))
    expect(thresholdOf(alwaysWraps, 'A long paragraph of body copy')).toBeUndefined()

    // An UNMEASURABLE line count (no captured glyph extent) breaks the suffix
    // rather than reading as "one line" — an unknown must never pin a wrapping
    // paragraph to one unbreakable row that overprints the run below it.
    const unmeasured = foldToL1(oneRun('Unmeasured run', () => 1, false))
    expect(thresholdOf(unmeasured, 'Unmeasured run')).toBeUndefined()

    // ── Below the threshold the run still wraps as the reference did ───────────
    const { css } = renderL1Document(midway)
    // The pin is gated by the width it was measured from…
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*white-space: nowrap/)
    // …and nothing before the first media block carries it, so at 320/375 — where
    // the reference wrapped — the run is still breakable.
    expect(css.slice(0, css.indexOf('@media'))).not.toContain('white-space: nowrap')
    // A run pinned from the ladder's floor is unconditional instead.
    const everywhere = foldToL1(oneRun('Open source and community-driven', () => 1))
    expect(thresholdOf(everywhere, 'Open source and community-driven')).toBe(320)
    const floorCss = renderL1Document(everywhere).css
    expect(floorCss.slice(0, floorCss.indexOf('@media'))).toContain('white-space: nowrap')
  })
})

// ── AC-1352: the viewport-height probe pair ───────────────────────────────────

describe('AC-1352 a viewport-height probe pair folds to a measured height derivative', () => {
  /**
   * The ladder plus (optionally) a probe: 1280 re-shot at a second viewport
   * height. The hero section is full-viewport-height, so its height equals the
   * viewport height and everything below it starts one viewport height down.
   */
  function heroPage(opts: { probeHeight?: number } = {}): MultiStateCapture {
    const at = (width: number, height: number): ProjSpec => ({
      width,
      height,
      elements: [
        lines(run({ text: 'Hero title', box: { x: 24, y: 79, width: 400, height: 90 } }), 1),
        lines(run({ text: 'Below the fold', box: { x: 24, y: height + 96, width: 400, height: 40 } }), 1),
        lines(run({ text: 'hero band', surfaceFill: '#030717', box: { x: 0, y: 300, width, height: 29 } }), 1),
        lines(
          run({ text: 'lower band', surfaceFill: '#e8dfd3', box: { x: 0, y: height + 200, width, height: 29 } }),
          1,
        ),
      ],
      sections: [
        { box: { x: 0, y: 0, width, height } },
        { box: { x: 0, y: height, width, height: 600 } },
      ] as unknown as SectionValues[],
    })
    const specs = LADDER.map((w) => at(w, LADDER_H[w]))
    if (opts.probeHeight !== undefined) specs.push(at(1280, opts.probeHeight))
    return multi(specs)
  }

  const responseOf = (n: Record<string, unknown>) =>
    (n.geometry as { viewportResponse?: { yFactor?: number; heightFactor?: number } } | undefined)?.viewportResponse

  it('test_UAT_AC1352_probe_pair_folds_a_measured_snapped_height_response', () => {
    const doc = foldToL1(heroPage({ probeHeight: 1000 }))
    expect(validateL1(doc).ok).toBe(true)

    // ── The keyframe ladder SKIPS the probe ───────────────────────────────────
    // The re-shot projection never becomes a sampled width of its own, so no width
    // gains a keyframe the page was never laid out at, and 1280 is not doubled.
    expect(doc.widths).toEqual(LADDER)
    const { ladder, probes } = partitionProbes(heroPage({ probeHeight: 1000 }).projections)
    expect(ladder.map((p) => p.viewport.width)).toEqual(LADDER)
    expect(probes.map((p) => `${p.viewport.width}x${p.viewport.height}`)).toEqual(['1280x1000'])
    for (const n of allNodes(doc)) {
      const kfs = (n.geometry as { keyframes?: Array<{ at: number }> } | undefined)?.keyframes
      if (!kfs) continue
      const ats = kfs.map((k) => k.at)
      expect(ats).toEqual([...new Set(ats)]) // no duplicated 1280 rung
      for (const at of ats) expect(LADDER).toContain(at)
    }

    // ── The measured derivative ───────────────────────────────────────────────
    // The hero band grows with the viewport one-for-one and does not move; the
    // band below it starts a full viewport height down.
    const heroBand = nodeWith(doc, (n) => n.id === 'section-band-0')
    expect(responseOf(heroBand)?.heightFactor).toBe(1)
    expect(responseOf(heroBand)?.yFactor).toBeUndefined()
    expect(responseOf(textNode(doc, 'Below the fold'))?.yFactor).toBe(1)
    // Every keyframe records the height it was measured at, so the response has an
    // origin and still evaluates to the captured pixels at capture size.
    for (const kf of (heroBand.geometry as { keyframes: Array<{ at: number; atHeight?: number }> }).keyframes) {
      expect(kf.atHeight).toBe(LADDER_H[kf.at])
    }
    const { css } = renderL1Document(doc)
    expect(css).toMatch(/height: calc\(800px \+ \(100vh - 800px\)\)/)

    // ── Attribution: a band takes its response from its SECTION edges ─────────
    // The hero's own copy sits in the top half and does not move between the pair.
    // Read from the runs it contains, the band would look inert; read from its
    // section edges it grows — so the still run must not suppress the growth.
    expect(responseOf(textNode(doc, 'Hero title'))).toBeUndefined()
    expect(responseOf(heroBand)?.heightFactor).toBe(1)

    // ── A response indistinguishable from zero emits no axis at all ───────────
    const inert = foldToL1(
      multi([
        ...LADDER.map((w) => ({
          width: w,
          height: LADDER_H[w],
          elements: [lines(run({ text: 'Fixed block', box: { x: 24, y: 40, width: 200, height: 29 } }), 1)],
        })),
        {
          width: 1280,
          height: 1000,
          // Half a pixel of drift over 200px of viewport height — layout noise.
          elements: [lines(run({ text: 'Fixed block', box: { x: 24, y: 40.5, width: 200, height: 29 } }), 1)],
        },
      ]),
    )
    for (const n of allNodes(inert)) expect(responseOf(n)).toBeUndefined()

    // ── Snapping: eighths absorb sub-pixel noise, off-eighth is carried ───────
    const measured = (dy: number) =>
      foldToL1(
        multi([
          ...LADDER.map((w) => ({
            width: w,
            height: LADDER_H[w],
            elements: [lines(run({ text: 'Tracks the viewport', box: { x: 24, y: 40, width: 200, height: 29 } }), 1)],
          })),
          {
            width: 1280,
            height: 1000, // +200px of viewport height
            elements: [
              lines(run({ text: 'Tracks the viewport', box: { x: 24, y: 40 + dy, width: 200, height: 29 } }), 1),
            ],
          },
        ]),
      )
    // 199.5 / 200 = 0.9975 — the `100vh` rule, not a 0.9975 one.
    expect(responseOf(textNode(measured(199.5), 'Tracks the viewport'))?.yFactor).toBe(1)
    // 60 / 200 = 0.3, which is not near an eighth (0.25 / 0.375) — carried as measured.
    expect(responseOf(textNode(measured(60), 'Tracks the viewport'))?.yFactor).toBe(0.3)

    // ── The pair is required ─────────────────────────────────────────────────
    // With no re-shot projection the axis is not identifiable at all: the ladder
    // varies width and height together, so the honest answer is to emit nothing
    // rather than to guess from a correlation.
    const noProbe = foldToL1(heroPage())
    expect(validateL1(noProbe).ok).toBe(true)
    for (const n of allNodes(noProbe)) expect(responseOf(n)).toBeUndefined()

    // A re-shoot at the SAME viewport height as its ladder projection contributes
    // no response either — a finite difference over a zero difference is refused
    // rather than divided.
    const flatPair = foldToL1(heroPage({ probeHeight: LADDER_H[1280] }))
    expect(validateL1(flatPair).ok).toBe(true)
    for (const n of allNodes(flatPair)) expect(responseOf(n)).toBeUndefined()
  })
})

// ── AC-1350 / AC-1351: the centred content column and its per-axis anchors ────

/** The reference column both criteria are fitted against: `max-w-6xl mx-auto px-6`
 *  with a nested `max-w-4xl` content cap. */
const COLUMN = { containerPx: 1152, insetPx: 24, maxWidthPx: 896 }

interface ColumnShape {
  containerPx: number
  insetPx: number
  maxWidthPx?: number
}

/** Where a column's content starts at `width` — the closed form the fit recovers. */
const originOf = (width: number, c: ColumnShape = COLUMN): number =>
  Math.max(0, (width - c.containerPx) / 2) + c.insetPx

/** How wide that content runs at `width`. */
const extentOf = (width: number, c: ColumnShape = COLUMN): number => {
  const inner = Math.min(c.containerPx, width) - 2 * c.insetPx
  return c.maxWidthPx === undefined ? inner : Math.min(c.maxWidthPx, inner)
}

/** A page laid out in `c`: three runs filling the column, plus anything extra. */
function columnPage(
  extra: (width: number) => ValueElement[] = () => [],
  c: ColumnShape = COLUMN,
): MultiStateCapture {
  return overLadder((width) => ({
    elements: [
      ...['Full column run', 'Second column run', 'Third column run'].map((text, i) =>
        lines(
          run({ text, box: { x: originOf(width, c), y: 200 + i * 40, width: extentOf(width, c), height: 29 } }),
          1,
        ),
      ),
      ...extra(width),
    ],
  }))
}

describe('AC-1350 the centred content column is recovered as a document constant', () => {
  it('test_UAT_AC1350_column_is_fitted_from_content_and_rejected_unless_every_sample_reproduces', () => {
    // ── The clean fit ─────────────────────────────────────────────────────────
    const doc = foldToL1(columnPage())
    expect(validateL1(doc).ok).toBe(true)
    expect(doc.column).toEqual(COLUMN)
    // …and it is a REPRODUCTION of the page, not a resemblance: the recovered
    // constants replay every sampled origin and extent to within a pixel.
    for (const w of LADDER) {
      expect(Math.abs(originOf(w, doc.column!) - originOf(w)), `origin @${w}`).toBeLessThanOrEqual(1)
      expect(Math.abs(extentOf(w, doc.column!) - extentOf(w)), `extent @${w}`).toBeLessThanOrEqual(1)
    }

    // ── Modal origin, not the minimum ─────────────────────────────────────────
    // A real page has more than one gutter: this one sets its header 8px wider
    // than its content column. The extreme edge is the header's, which is not the
    // column the page is laid out in — taking the minimum makes the fit fail.
    const withHeader = foldToL1(
      columnPage((width) => [
        lines(
          run({
            text: 'Outdented header',
            box: { x: originOf(width) - 8, y: 100, width: extentOf(width) + 16, height: 29 },
          }),
          1,
        ),
      ]),
    )
    expect(withHeader.column).toEqual(COLUMN)
    expect(withHeader.column!.insetPx).toBe(24) // the content column's, not the header's 16

    // ── A full-bleed band contributes no evidence ─────────────────────────────
    // It spans the viewport and says nothing about the column its contents sit in.
    const withBand = foldToL1(
      columnPage((width) => [
        lines(run({ text: 'band', surfaceFill: '#030717', box: { x: 0, y: 60, width, height: 29 } }), 1),
      ]),
    )
    expect(withBand.column).toEqual(COLUMN)

    // ── The content cap ───────────────────────────────────────────────────────
    // Emitted where content stops short of what the container would allow…
    expect(doc.column!.maxWidthPx).toBe(896)
    // …and absent where the content fills the container at every width.
    const fills = foldToL1(columnPage(() => [], { containerPx: 1152, insetPx: 24 }))
    expect(fills.column).toEqual({ containerPx: 1152, insetPx: 24 })
    expect(fills.column!.maxWidthPx).toBeUndefined()

    // ── Rejection: a page with no centred column keeps its keyframes ──────────
    // Left-aligned content at a constant gutter — no container ever engages, so
    // there is nothing to fit and the fold must not invent one.
    const flush = foldToL1(
      overLadder((width) => ({
        elements: [lines(run({ text: 'Flush left', box: { x: 40, y: 100, width: width - 80, height: 29 } }), 1)],
      })),
    )
    expect(flush.column).toBeUndefined()
    expect((textNode(flush, 'Flush left').geometry as { anchor?: unknown }).anchor).toBeUndefined()

    // ── Rejection: one bad sample rejects the WHOLE column ────────────────────
    // Perturbing a single sampled origin beyond a pixel must not be absorbed by
    // fitting the remaining samples — the fit is verified against every one.
    const perturbed = foldToL1(
      overLadder((width) => ({
        elements: ['Full column run', 'Second column run', 'Third column run'].map((text, i) =>
          lines(
            run({
              text,
              box: {
                x: originOf(width) + (width === 1024 ? 6 : 0),
                y: 200 + i * 40,
                width: extentOf(width),
                height: 29,
              },
            }),
            1,
          ),
        ),
      })),
    )
    expect(perturbed.column).toBeUndefined()

    // ── Rejection: too little evidence to be identifiable ─────────────────────
    // At least three sampled widths are needed; a two-width capture fits nothing.
    const twoWidths = foldToL1(
      multi(
        [320, 1440].map((width) => ({
          width,
          height: LADDER_H[width],
          elements: [
            lines(
              run({ text: 'Full column run', box: { x: originOf(width), y: 200, width: extentOf(width), height: 29 } }),
              1,
            ),
          ],
        })),
      ),
    )
    expect(twoWidths.column).toBeUndefined()

    // ── A column nothing refers to is not emitted ─────────────────────────────
    // Every run here sits exactly on the column, so the fit itself succeeds — but
    // each is present at only ONE width, so no node can anchor to it. The column
    // is carried on the document only when some node actually uses it.
    const unreferenced = foldToL1(
      overLadder((width) => ({
        elements: [
          lines(
            run({ text: `Row at ${width}`, box: { x: originOf(width), y: 200, width: extentOf(width), height: 29 } }),
            1,
          ),
        ],
      })),
    )
    expect(unreferenced.column).toBeUndefined()
    for (const n of allNodes(unreferenced)) {
      expect((n.geometry as { anchor?: unknown } | undefined)?.anchor).toBeUndefined()
    }
    // The fit itself was never in doubt: the SAME page whose one run keeps its
    // identity across the ladder — so it spans enough frames to anchor — does
    // carry the column. The only difference is whether anything refers to it.
    const referenced = foldToL1(
      overLadder((width) => ({
        elements: [
          lines(run({ text: 'Row', box: { x: originOf(width), y: 200, width: extentOf(width), height: 29 } }), 1),
        ],
      })),
    )
    expect(referenced.column).toEqual(COLUMN)
    expect((textNode(referenced, 'Row').geometry as { anchor?: unknown }).anchor).toBeTruthy()
  })
})

describe('AC-1351 a node inside the column expresses its geometry against that column', () => {
  const anchorOf = (n: Record<string, unknown>) =>
    (n.geometry as { anchor?: { x?: unknown; width?: unknown } } | undefined)?.anchor

  it('test_UAT_AC1351_column_anchors_are_fitted_per_axis_with_cap_track_and_refusals', () => {
    // ── Both axes fit: the run IS the column ──────────────────────────────────
    const doc = foldToL1(columnPage())
    const full = textNode(doc, 'Full column run')
    expect(anchorOf(full)).toEqual({ x: { px: 0, fraction: 0 }, width: { px: 0, fraction: 1 } })

    // At an UNSAMPLED width the anchor is a closed form of the column, not an
    // interpolation of the captured absolute offsets: one static rule, no media
    // query re-deriving `left` between the 1024 and 1280 rungs (which read 55.5px
    // at 1150 where the reference is still flat at 24px).
    const { css } = renderL1Document(doc)
    expect(css).toContain('left: calc(max(0px, (100vw - 1152px) / 2) + 24px)')
    expect(css).toContain('width: min(896px, (min(1152px, 100vw) - 48px))')
    expect(css).not.toMatch(/left: calc\(24px \+ \(64 \* \(100vw - 1024px\)/)

    // ── Per-axis independence ─────────────────────────────────────────────────
    // Hero lines sharing a left edge but with differing widths: ALL take their
    // left from the column (alignment is shared across siblings, so they stay
    // flush at an unsampled width) while only the fitting ones anchor their width.
    const perAxis = foldToL1(
      columnPage((width) => [
        // Its own narrower maximum takes over above a breakpoint — a nested cap.
        lines(
          run({
            text: 'Capped',
            box: { x: originOf(width), y: 500, width: Math.min(768, extentOf(width)), height: 29 },
          }),
          1,
        ),
        // A shrink-to-fit glyph extent — nobody's column function.
        lines(
          run({ text: 'Shrink to fit', box: { x: originOf(width), y: 600, width: 120 + width / 100, height: 29 } }),
          1,
        ),
      ]),
    )
    for (const t of ['Full column run', 'Capped', 'Shrink to fit']) {
      expect(anchorOf(textNode(perAxis, t))?.x, t).toBeTruthy()
    }
    // A nested maximum is a CAPPED column term — not a reason to drop the anchor.
    expect(anchorOf(textNode(perAxis, 'Capped'))?.width).toEqual({ px: 0, fraction: 1, maxPx: 768 })
    // …and the run whose width does not fit keeps its width keyframes rather than
    // losing its left-edge anchor along with them.
    expect(anchorOf(textNode(perAxis, 'Shrink to fit'))?.width).toBeUndefined()
    expect(anchorOf(textNode(perAxis, 'Shrink to fit'))?.x).toBeTruthy()

    // ── The cap needs an over-determined fit ──────────────────────────────────
    // Three samples below the cap support it (above); with only TWO below, a
    // two-unknown fit through two points is interpolation, not evidence, and the
    // cap is refused rather than fitted.
    const shallowCap = foldToL1(
      columnPage((width) => [
        lines(
          run({
            text: 'Capped early',
            box: { x: originOf(width), y: 500, width: Math.min(400, extentOf(width)), height: 29 },
          }),
          1,
        ),
      ]),
    )
    expect(anchorOf(textNode(shallowCap, 'Capped early'))?.width).toBeUndefined()
    expect(anchorOf(textNode(shallowCap, 'Capped early'))?.x).toBeTruthy()

    // ── The plausible-share guard ────────────────────────────────────────────
    // A width that fits the column affinely but at a STEEP coefficient is
    // tracking something else that merely correlates with the column over the
    // sampled range; extrapolating it off-sample is how a run ends up kilometres
    // wide, so the fit is refused even though it reproduces every sample exactly.
    const NARROW: ColumnShape = { containerPx: 800, insetPx: 20, maxWidthPx: 400 }
    const steep = foldToL1(
      columnPage(
        (width) => [
          lines(
            run({
              text: 'Steep coefficient',
              box: { x: originOf(width, NARROW), y: 500, width: 2.5 * extentOf(width, NARROW) - 500, height: 29 },
            }),
            1,
          ),
        ],
        NARROW,
      ),
    )
    expect(steep.column).toEqual(NARROW)
    expect(anchorOf(textNode(steep, 'Steep coefficient'))?.width).toBeUndefined()
    expect(anchorOf(textNode(steep, 'Steep coefficient'))?.x).toBeTruthy()

    // ── The keyframed residual inset ─────────────────────────────────────────
    // A 3-up grid that stacks below a breakpoint changes layout MODE there, so its
    // third column's offset inside the column has no closed form. The column
    // origin still carries it and the residual becomes a track — one that inherits
    // the node's OWN geometry segments, so both halves of the position agree about
    // where the page's breakpoints are.
    const grid = foldToL1(
      columnPage((width) => [
        lines(
          run({
            text: 'Third tile',
            box: {
              x: originOf(width) + (width >= 768 ? (2 * extentOf(width)) / 3 : 0),
              y: 700,
              width: width >= 768 ? extentOf(width) / 3 : extentOf(width),
              height: 29,
            },
          }),
          1,
        ),
      ]),
    )
    const tile = textNode(grid, 'Third tile')
    const tileAnchor = anchorOf(tile) as { x?: { pxTrack?: { keyframes: unknown; segments?: unknown } } }
    expect(tileAnchor.x?.pxTrack, 'the residual inset is keyframed').toBeDefined()
    expect(tileAnchor.x!.pxTrack!.keyframes).toEqual(
      LADDER.map((at) => ({ at, value: at >= 768 ? Math.round(((2 * extentOf(at)) / 3) * 100) / 100 : 0 })),
    )
    // The track's segments are the node's own — the geometry already classifies
    // the mode change as a snap, and the inset must agree with it.
    const tileSegments = (tile.geometry as { segments?: unknown }).segments
    expect(tileAnchor.x!.pxTrack!.segments).toEqual(tileSegments)
    expect(tileSegments).toContain('snap')

    // ── Full-bleed refusal ───────────────────────────────────────────────────
    // A band's left edge is absolutely zero. Written as origin-plus-negative-origin
    // and interpolated, the residual walks it off the left edge between samples.
    const banded = foldToL1(
      columnPage((width) => [
        lines(run({ text: 'band', surfaceFill: '#030717', box: { x: 0, y: 60, width, height: 29 } }), 1),
      ]),
    )
    expect(anchorOf(textNode(banded, 'band'))).toBeUndefined()
    expect(anchorOf(textNode(banded, 'Full column run'))?.x).toBeTruthy()
    // Its left edge stays at zero rather than walking negative.
    for (const kf of (textNode(banded, 'band').geometry as { keyframes: Array<{ x: number }> }).keyframes) {
      expect(kf.x).toBe(0)
    }
    expect(renderL1Document(banded).css).not.toMatch(/left: calc\(max\(0px, \(100vw - 1152px\) \/ 2\) \+ -/)
  })
})
