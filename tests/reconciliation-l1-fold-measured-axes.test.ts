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
