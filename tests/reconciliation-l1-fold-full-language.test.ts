/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document…", the **full-language** upgrade (REQ-92 / REQ-90 /
 * BUG-6 / BUG-11).
 *
 * The original text-only criteria (AC-689…AC-696) are proven in the companion file
 * tests/reconciliation-l1-fold.test.ts. This file proves the criteria the upgrade
 * added, one UAT per AC:
 *
 *   AC-729  a text-free media element folds to an image leaf carrying its resolved
 *           src + alt, height-bearing keyframes and its image axes; a src-less
 *           media element is signalled, never emitted as a broken <img>
 *   AC-730  a text-free element that paints a standalone surface folds to a box
 *           leaf carrying its surface axes and a height-bearing geometry track
 *   AC-731  run-composited surfaces are reconstructed: the dominant solid run fill
 *           becomes the page band, differing/gradient surfaces become backing box
 *           leaves ordered ahead of the content
 *   AC-732  the text pixel-mover families fold onto the leaf (and render), the
 *           geometry-affecting ones deliberately do not, and the document font
 *           table keeps only the families a folded text leaf actually paints
 *   AC-733  nothing is silently dropped: every unexpressed element becomes a typed
 *           residual, a form control with geometry binds to its module instead,
 *           and the channel is opt-in
 *
 * Every probe drives the real `foldToL1` / `validateL1` / `renderL1Document` entry
 * points over synthetic multi-viewport captures — real components, no mocks.
 */
import { describe, expect, it } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, type FoldedForm, type FoldResidual } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

/** The fixed sampled width ladder `1c capture page` walks. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** Build a resting `MultiStateCapture` over the ladder from a per-width element list. */
function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: { source: `fold@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 1200 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A styled text run at one width (has a box → folds to a real text leaf). */
function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 18,
    fontWeight: 400,
    box,
    ...over,
  }
}

/** A text-free element at one width — the media / surface / control shape. */
function textless(over: Partial<ValueElement> & Pick<ValueElement, 'role'>): ValueElement {
  return {
    text: '',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    ...over,
  }
}

/** The root box's direct children — the folded leaves, in document order. */
function leavesOf(doc: ReturnType<typeof foldToL1>) {
  return doc.root.kind === 'box' ? (doc.root.children ?? []) : []
}

// ── AC-729: a text-free media element folds to an image leaf ──────────────────

describe('AC-729 a text-free media element folds to an image leaf with its resolved source and alternative text', () => {
  it('test_UAT_AC729_media_folds_to_image_leaf_with_src_alt_and_axes', () => {
    // REQ-136 widened this AC with "the leaf carries its framing" — the captured
    // pan and colour adjustment. Those are proven by their own siblings,
    // test_UAT_AC1133_* and test_UAT_AC1134_* in
    // tests/reconciliation-l1-fold-framing-and-adjustment.test.ts; this test
    // remains the media-element fold the AC is named for.
    const residuals: FoldResidual[] = []
    const doc = foldToL1(
      multiFrom((w) => [
        // (a) a fully-painted <img>: every image axis the language expresses.
        textless({
          role: 'hero-media',
          objectFit: 'cover',
          intrinsicAspect: 1.5,
          src: 'https://cdn.example.com/hero.jpg',
          alt: 'A plated dish',
          borderRadiusPx: 12,
          opacity: 0.9,
          blendMode: 'multiply',
          border: { widthPx: 2, color: '#112233', style: 'solid' },
          boxShadow: 'rgba(0, 0, 0, 0.4) 0px 4px 12px 1px',
          box: { x: 10, y: 200, width: w - 20, height: 300 },
        }),
        // (b) a bare <img>: axes it does not paint must be OMITTED, not defaulted.
        //     Its alt falls back to the accessible name.
        textless({
          role: 'inline-media',
          objectFit: 'contain',
          src: '/assets/logo.svg',
          alt: null,
          accessibleName: 'Company logo',
          box: { x: 0, y: 600, width: 120, height: 40 },
        }),
        // (c) present only from 1024 up → a bounded visibility rule.
        ...(w >= 1024
          ? [
              textless({
                role: 'wide-media',
                intrinsicAspect: 2,
                src: '/assets/wide.png',
                box: { x: 0, y: 700, width: w, height: 220 },
              }),
            ]
          : []),
      ]),
      { residuals },
    )
    expect(validateL1(doc).ok).toBe(true)

    const images = leavesOf(doc).filter((n) => n.kind === 'image')
    expect(images.map((n) => n.kind === 'image' && n.src)).toEqual([
      'https://cdn.example.com/hero.jpg',
      '/assets/logo.svg',
      '/assets/wide.png',
    ])
    // Every image leaf carries a stable identifier.
    for (const img of images) expect(img.kind === 'image' && img.id).toMatch(/^image-\d+$/)

    const hero = images[0]
    const logo = images[1]
    const wide = images[2]

    if (hero.kind !== 'image' || logo.kind !== 'image' || wide.kind !== 'image') throw new Error('expected image leaves')

    // The source resolved at capture time and the element's alternative text.
    expect(hero.alt).toBe('A plated dish')
    // No alt → the accessible name; neither → the empty string.
    expect(logo.alt).toBe('Company logo')
    expect(wide.alt).toBe('')

    // The image axes the language expresses, and ONLY the ones it paints.
    expect(hero.axes).toEqual({
      objectFit: 'cover',
      borderRadiusPx: 12,
      opacity: 0.9,
      blendMode: 'multiply',
      border: { widthPx: 2, color: '#112233', style: 'solid' },
      boxShadow: { offsetXPx: 0, offsetYPx: 4, blurPx: 12, spreadPx: 1, color: '#000000' },
    })
    expect(logo.axes).toEqual({ objectFit: 'contain' })

    // A geometry track pinning all four sides at every present sampled width:
    // an image's extent is not derivable from its content, so height is pinned.
    expect(hero.geometry?.keyframes.map((k) => k.at)).toEqual(LADDER)
    for (const kf of hero.geometry!.keyframes) {
      expect(kf.height).toBe(300)
      expect(kf.width).toBe(kf.at - 20)
      expect(kf.x).toBe(10)
      expect(kf.y).toBe(200)
    }

    // Its visibility rule follows the widths it is present at.
    expect(wide.geometry?.keyframes.map((k) => k.at)).toEqual([1024, 1280, 1440])
    expect(wide.visibility).toEqual({ fromPx: 1024 })
    expect(hero.visibility).toBeUndefined()

    // Strong observation: the emitted markup carries the captured source.
    const { html } = renderL1Document(doc)
    expect(html).toContain('<img')
    expect(html).toContain('src="https://cdn.example.com/hero.jpg"')
    expect(html).toContain('alt="A plated dish"')

    // Everything above was expressible → nothing signalled.
    expect(residuals).toEqual([])

    // A media element captured with no resolvable source produces no leaf at all:
    // it is signalled as a residual rather than emitted as a broken image.
    const brokenResiduals: FoldResidual[] = []
    const brokenDoc = foldToL1(
      multiFrom((w) => [
        textless({
          role: 'broken-media',
          objectFit: 'cover',
          intrinsicAspect: 1,
          src: null,
          box: { x: 0, y: 200, width: w, height: 300 },
        }),
      ]),
      { residuals: brokenResiduals },
    )
    expect(leavesOf(brokenDoc).filter((n) => n.kind === 'image')).toEqual([])
    expect(validateL1(brokenDoc).ok).toBe(true)
    const signalled = brokenResiduals.find((r) => r.kind === 'image')
    expect(signalled?.reason).toMatch(/src/i)
    expect(signalled?.widths).toEqual(LADDER)
  })
})

// ── AC-730: a text-free painted surface folds to a box leaf ───────────────────

describe('AC-730 a text-free element that paints a standalone surface folds to a box leaf', () => {
  it('test_UAT_AC730_standalone_painted_surface_folds_to_box_leaf_with_surface_axes', () => {
    const gradient = {
      angleDeg: 180,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 },
      ],
    }
    const residuals: FoldResidual[] = []
    const doc = foldToL1(
      multiFrom((w) => [
        // A decorative panel painting every surface axis the language expresses.
        textless({
          role: 'decorative-panel',
          a11yRole: 'separator',
          surfaceFill: '#f0eee9',
          surfaceGradient: gradient,
          borderRadiusPx: 8,
          opacity: 0.85,
          border: { widthPx: 1, color: '#d8d2c8', style: 'solid' },
          boxShadow: 'rgba(0, 0, 0, 0.3) 0px 6px 18px 2px',
          backdropFilter: 'blur(12px)',
          blendMode: 'multiply',
          box: { x: 40, y: 500, width: w - 80, height: 120 },
        }),
        // A hairline divider painting exactly ONE surface axis — the axes it does
        // not paint must be omitted rather than emitted at their default.
        textless({
          role: 'divider',
          a11yRole: 'separator-thin',
          borderRadiusPx: 6,
          box: { x: 0, y: 700, width: w, height: 4 },
        }),
      ]),
      { residuals },
    )
    expect(validateL1(doc).ok).toBe(true)

    const boxes = leavesOf(doc).filter((n) => n.kind === 'box')
    expect(boxes).toHaveLength(2)
    const [panel, divider] = boxes
    if (panel.kind !== 'box' || divider.kind !== 'box') throw new Error('expected box leaves')

    // A stable identifier per box leaf.
    expect(panel.id).toMatch(/^box-\d+$/)
    expect(divider.id).toMatch(/^box-\d+$/)

    expect(panel.axes).toEqual({
      surfaceFill: '#f0eee9',
      surfaceGradient: gradient,
      borderRadiusPx: 8,
      opacity: 0.85,
      border: { widthPx: 1, color: '#d8d2c8', style: 'solid' },
      boxShadow: { offsetXPx: 0, offsetYPx: 6, blurPx: 18, spreadPx: 2, color: '#000000' },
      backdropBlurPx: 12,
      blendMode: 'multiply',
    })
    // Only the painted axis survives on the divider.
    expect(divider.axes).toEqual({ borderRadiusPx: 6 })

    // A geometry track pinning all four sides at every present sampled width —
    // a box's extent is not derivable from its content, so height is pinned.
    expect(panel.geometry?.keyframes.map((k) => k.at)).toEqual(LADDER)
    for (const kf of panel.geometry!.keyframes) {
      expect(kf.height).toBe(120)
      expect(kf.width).toBe(kf.at - 80)
    }
    // Present at every sampled width → no visibility rule.
    expect(panel.visibility).toBeUndefined()

    // Expressed, not signalled.
    expect(residuals).toEqual([])

    // Strong observation: the surface actually paints through the renderer.
    const { css } = renderL1Document(doc)
    expect(css).toContain('background-color: #f0eee9')
    expect(css).toContain('background-image: linear-gradient(180deg, #ff0000 0%, #0000ff 100%)')
    expect(css).toContain('border: 1px solid #d8d2c8')
    expect(css).toContain('backdrop-filter: blur(12px)')
    expect(css).toContain('mix-blend-mode: multiply')
  })
})

// ── AC-731: run-composited surfaces → page band + backing boxes ───────────────

describe('AC-731 run-composited surfaces are reconstructed as a page background band plus backing box leaves', () => {
  // BUG-14 rebuilt the reconstruction as section-band → card → text: the band runs
  // group into ONE full-bleed band instead of a backing box per run. The AC holds —
  // no composited surface is lost, and none is invented for a run already on its band.
  it('test_UAT_AC731_dominant_run_fill_becomes_band_and_differing_surfaces_back_their_runs', () => {
    const BAND = '#f8f5f2'
    const PANEL = '#e8dfd3'
    const gradient = {
      angleDeg: 90,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 },
      ],
    }
    const ms = multiFrom((w) => [
      // Three runs sit on the dominant composited fill…
      run('Band A', { x: 20, y: 40, width: w - 40, height: 40 }, { surfaceFill: BAND }),
      run('Band B', { x: 20, y: 100, width: w - 40, height: 40 }, { surfaceFill: BAND }),
      run('Band C', { x: 20, y: 160, width: w - 40, height: 40 }, { surfaceFill: BAND }),
      // …one on a DIFFERENT panel fill…
      run('Card title', { x: 40, y: 300, width: 200, height: 40 }, { surfaceFill: PANEL }),
      // …and one whose solid composite EQUALS the band but carries a gradient the
      //   body cannot paint.
      run('Gradient run', { x: 40, y: 400, width: 200, height: 40 }, { surfaceFill: BAND, surfaceGradient: gradient }),
    ])
    const doc = foldToL1(ms)
    expect(validateL1(doc).ok).toBe(true)

    // The solid fill the greatest number of runs sit on becomes the page band.
    expect(doc.background).toBe(BAND)

    const kinds = leavesOf(doc).map((n) => n.kind)
    const boxes = leavesOf(doc).filter((n) => n.kind === 'box')
    const texts = leavesOf(doc).filter((n) => n.kind === 'text')

    // The document is emitted in more than one leaf kind.
    expect(new Set(kinds).size).toBeGreaterThan(1)
    expect(texts).toHaveLength(5)

    // BUG-14 — the three band runs coalesce into ONE full-bleed section band (no
    // rectangle per paragraph); the panel run and the gradient run each fold a
    // card. Three backing boxes for five runs.
    expect(boxes).toHaveLength(3)
    const bands = boxes.filter((b) => (b.id ?? '').startsWith('section-band-'))
    const cards = boxes.filter((b) => (b.id ?? '').startsWith('card-'))
    expect(bands).toHaveLength(1)
    expect(cards).toHaveLength(2)

    // The band carries the dominant fill and tiles full-bleed from its first run.
    expect(bands[0].kind === 'box' && bands[0].axes?.surfaceFill).toBe(BAND)
    for (const kf of bands[0].geometry!.keyframes) expect(kf.x).toBe(0)

    // The cards carry their own surfaces — the differing panel fill, and the
    // gradient the body cannot paint.
    const fills = cards.map((b) => (b.kind === 'box' ? b.axes?.surfaceFill : undefined))
    expect(fills).toEqual([PANEL, BAND])
    const gradients = cards.map((b) => (b.kind === 'box' ? b.axes?.surfaceGradient : undefined))
    expect(gradients).toEqual([undefined, gradient])

    for (const b of boxes) {
      if (b.kind !== 'box') throw new Error('expected box leaf')
      // Every backing box is keyframed across the whole ladder with all four
      // sides pinned…
      expect(b.geometry?.keyframes.map((k) => k.at)).toEqual(LADDER)
      for (const kf of b.geometry!.keyframes) expect(kf.height).toBeGreaterThanOrEqual(40)
      // …and the backed runs' visibility rule (present at every width here → none).
      expect(b.visibility).toBeUndefined()
    }

    // All backing boxes are ordered AHEAD of the content leaves, so every leaf
    // paints over its own surface.
    expect(kinds.slice(0, 3)).toEqual(['box', 'box', 'box'])
    expect(kinds.slice(3).every((k) => k === 'text')).toBe(true)

    // Strong observation: both the body band and the panel fill paint.
    const { css } = renderL1Document(doc)
    expect(css).toContain(`body { background-color: ${BAND} }`)
    expect(css).toContain(`background-color: ${PANEL}`)
    expect(css).toContain('background-image: linear-gradient(90deg,')
  })
})

// ── AC-732: text pixel-mover families + painted-only font table ───────────────

describe('AC-732 the fold carries the text pixel-mover families and populates the font resource table with painted families only', () => {
  it('test_UAT_AC732_text_treatments_fold_and_render_and_font_table_keeps_painted_families', () => {
    const gradient = {
      angleDeg: 90,
      stops: [
        { color: '#d4a017', position: 0 },
        { color: '#ff7a00', position: 100 },
      ],
    }
    const capture = multiFrom((w) => [
      run('Wordmark', { x: 20, y: 40, width: w - 40, height: 60 }, { gradient, fontFamily: 'Oswald, sans-serif' }),
      run('Underlined', { x: 20, y: 120, width: w - 40, height: 30 }, { textDecoration: 'underline' }),
      run('Small Caps', { x: 20, y: 170, width: w - 40, height: 30 }, { fontVariant: 'small-caps' }),
      run('Bullet Item', { x: 40, y: 220, width: w - 60, height: 30 }, { listMarker: 'disc' }),
      run('Glow', { x: 20, y: 270, width: w - 40, height: 30 }, { textShadow: 'rgb(0, 0, 0) 0px 2px 6px' }),
      // Geometry-affecting treatments: the pinned geometry is already
      // post-transform, so these must NOT be folded onto the leaf.
      run(
        'Rotated',
        { x: 20, y: 320, width: w - 40, height: 30 },
        { transformRotateDeg: 12, transformScale: 1.4, maskEdge: 'linear-gradient(#000, transparent)' },
      ),
    ])

    const doc = foldToL1(capture, {
      // Two supplied faces; only `Oswald` is painted by a folded text leaf.
      fonts: [
        { family: 'Oswald', src: 'assets/oswald.woff2', weight: 700 },
        { family: 'Unpainted', src: 'assets/unpainted.woff2', weight: 400 },
      ],
    })
    expect(validateL1(doc).ok).toBe(true)

    const byText = new Map(leavesOf(doc).map((n) => [n.kind === 'text' ? n.text : '', n]))
    const axesOf = (text: string) => {
      const n = byText.get(text)
      if (!n || n.kind !== 'text') throw new Error(`no text leaf for ${text}`)
      return n.axes ?? {}
    }

    // Each recorded treatment the language expresses appears on its leaf…
    expect(axesOf('Wordmark').gradientFill).toEqual(gradient)
    expect(axesOf('Underlined').textDecoration).toBe('underline')
    expect(axesOf('Small Caps').fontVariantCaps).toBe('small-caps')
    expect(axesOf('Bullet Item').listMarker).toBe('disc')
    expect(axesOf('Glow').textShadow).toEqual({ offsetXPx: 0, offsetYPx: 2, blurPx: 6, color: '#000000' })
    // …and a treatment the element does not paint is omitted.
    expect(axesOf('Underlined').gradientFill).toBeUndefined()
    expect(axesOf('Glow').listMarker).toBeUndefined()

    // The geometry-affecting treatments are deliberately NOT folded (folding them
    // would apply the effect twice against the post-transform box already pinned).
    const rotated = byText.get('Rotated')
    if (!rotated || rotated.kind !== 'text') throw new Error('no Rotated leaf')
    expect(rotated.transform).toBeUndefined()
    expect(rotated.mask).toBeUndefined()

    // Strong observation: each treatment paints through the renderer.
    const { css } = renderL1Document(doc)
    expect(css).toContain('background-image: linear-gradient(90deg, #d4a017 0%, #ff7a00 100%)')
    expect(css).toContain('background-clip: text')
    expect(css).toContain('text-decoration-line: underline')
    expect(css).toContain('font-variant-caps: small-caps')
    expect(css).toContain('list-style-type: disc')
    expect(css).toMatch(/text-shadow:\s*0px 2px 6px #000000/)

    // Re-folding the same reproduction yields the same treatments (idempotent).
    const again = foldToL1(capture, {
      fonts: [
        { family: 'Oswald', src: 'assets/oswald.woff2', weight: 700 },
        { family: 'Unpainted', src: 'assets/unpainted.woff2', weight: 400 },
      ],
    })
    expect(JSON.stringify(again)).toEqual(JSON.stringify(doc))

    // The font table binds ONLY the families a folded text leaf actually paints —
    // the supplied face no text references is dropped.
    expect(doc.resources?.fonts?.map((f) => f.family)).toEqual(['Oswald'])
    expect(doc.resources?.fonts?.[0]).toMatchObject({ src: 'assets/oswald.woff2', weight: 700 })
    // …and it resolves the captured face rather than a fallback.
    expect(css).toContain('@font-face')
    expect(css).toContain('assets/oswald.woff2')
  })
})

// ── AC-733: nothing silently dropped — typed residuals, opt-in channel ────────

describe('AC-733 no captured element is silently dropped: an unexpressed element becomes a typed residual, and a form control with geometry binds to its module instead', () => {
  /** A capture mixing one expressible run with every currently-unexpressed shape. */
  const unexpressible = (): MultiStateCapture =>
    multiFrom((w) => [
      run('Expressible Heading', { x: 20, y: 40, width: w - 40, height: 48 }),
      // (a) a media element with no resolvable source
      textless({
        role: 'broken-media',
        objectFit: 'cover',
        intrinsicAspect: 1.5,
        src: null,
        box: { x: 0, y: 200, width: w, height: 240 },
      }),
      // (b) a text run with no box at any sampled width
      run('Ghost Run', undefined),
      // (c) an empty-string run
      run('', { x: 20, y: 480, width: 120, height: 20 }),
      // (d) a form control with NO geometry at any sampled width — it has no seam
      //     to mount at, so it cannot bind to a behavior module either
      textless({
        role: 'field',
        a11yRole: 'textbox',
        accessibleName: 'Email',
        surfaceFill: '#ffffff',
        borderRadiusPx: 6,
        border: { widthPx: 1, color: '#cbd5e1', style: 'solid' },
      }),
      // (e) a text-free element that is neither media, a painted surface, nor a
      //     known control
      textless({ role: 'generic', box: { x: 20, y: 600, width: 100, height: 10 } }),
    ])

  it('test_UAT_AC733_unexpressed_elements_are_typed_residuals_and_the_channel_is_opt_in', () => {
    const residuals: FoldResidual[] = []
    const doc = foldToL1(unexpressible(), { residuals })
    expect(validateL1(doc).ok).toBe(true)

    // Only the expressible run became a leaf — nothing was synthesized.
    expect(leavesOf(doc).map((n) => (n.kind === 'text' ? n.text : n.kind))).toEqual(['Expressible Heading'])

    // One typed residual per unexpressed element, each naming its object kind…
    expect(residuals).toHaveLength(5)
    const byKind = (kind: FoldResidual['kind'], match: RegExp) =>
      residuals.find((r) => r.kind === kind && match.test(r.reason))

    const media = byKind('image', /src/i)
    const ghost = byKind('text', /geometry/i)
    const empty = byKind('text', /empty/i)
    const field = byKind('field', /no geometry at any sampled width/i)
    const unknown = byKind('box', /neither media/i)
    for (const [name, r] of Object.entries({ media, ghost, empty, field, unknown })) {
      expect(r, `${name} residual`).toBeDefined()
      // …the reason it has no leaf, and the sampled widths it appeared at.
      expect(r!.reason.length).toBeGreaterThan(0)
      expect(r!.widths).toEqual(LADDER)
    }

    // …and the painted pixel-mover axes it carried.
    expect(media!.capturedAxes).toEqual(expect.arrayContaining(['objectFit', 'intrinsicAspect']))
    expect(field!.capturedAxes).toEqual(
      expect.arrayContaining(['surfaceFill', 'borderRadiusPx', 'border', 'accessibleName']),
    )

    // The fold still never synthesizes a raw `<input>`: the unbindable control got
    // no leaf of any kind, and with no geometry there was no seam to mount at.
    expect(leavesOf(doc).some((n) => n.kind === 'box' || n.kind === 'slot')).toBe(false)

    // A form control that DOES carry geometry is no longer a residual: it folds to
    // a `control` leaf bound to the behavior module mounted at its form's seam.
    // Binding one and dropping one are different outcomes; only the unbindable
    // control takes the residual channel.
    const bound: FoldResidual[] = []
    const forms: FoldedForm[] = []
    const boundDoc = foldToL1(
      multiFrom((w) => [
        run('Contact us', { x: 20, y: 40, width: w - 40, height: 40 }),
        textless({
          role: 'field',
          a11yRole: 'textbox',
          accessibleName: 'Email',
          surfaceFill: '#ffffff',
          borderRadiusPx: 6,
          box: { x: 20, y: 520, width: 240, height: 48 },
        }),
        textless({
          role: 'field',
          a11yRole: 'textbox',
          accessibleName: 'Message',
          surfaceFill: '#ffffff',
          borderRadiusPx: 6,
          box: { x: 20, y: 580, width: 240, height: 96 },
        }),
      ]),
      { residuals: bound, forms },
    )
    expect(bound.filter((r) => r.kind === 'field')).toEqual([])
    expect(leavesOf(boundDoc).filter((n) => n.kind === 'slot')).toHaveLength(1)
    const controlNames: string[] = []
    const walk = (n: { kind: string; control?: string; children?: unknown[] }): void => {
      if (n.kind === 'control' && n.control) controlNames.push(n.control)
      for (const c of (n.children ?? []) as Array<typeof n>) walk(c)
    }
    walk(forms[0].form as never)
    expect(controlNames.sort()).toEqual(['email', 'message'])

    // An element the fold CAN express produces no residual.
    const expressible = multiFrom((w) => [
      run('Heading', { x: 20, y: 40, width: w - 40, height: 48 }, { textShadow: 'rgb(0, 0, 0) 0px 2px 6px' }),
      textless({
        role: 'hero-media',
        objectFit: 'cover',
        src: 'https://cdn.example.com/hero.jpg',
        alt: 'Hero',
        box: { x: 0, y: 120, width: w, height: 300 },
      }),
      textless({ role: 'divider', a11yRole: 'separator', surfaceFill: '#e8dfd3', box: { x: 0, y: 460, width: w, height: 4 } }),
    ])
    const collected: FoldResidual[] = []
    foldToL1(expressible, { residuals: collected })
    expect(collected).toEqual([])

    // A caller that does not ask for residuals receives the SAME reproduction
    // document, with no residual channel.
    const withCollector: FoldResidual[] = []
    const a = foldToL1(unexpressible(), { residuals: withCollector })
    const b = foldToL1(unexpressible())
    expect(withCollector.length).toBe(5)
    expect(JSON.stringify(b)).toEqual(JSON.stringify(a))
  })
})
