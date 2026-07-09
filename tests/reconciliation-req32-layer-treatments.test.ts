import { describe, expect, it } from 'vitest'
import { LAYER_CSS, renderLayer } from '../packages/framework/src/index'
import { generateThemeCss } from '../packages/framework/src/tokens/css'
import { validateSite } from '../packages/site-schema/src/index'

/**
 * Reconciliation UATs for story-4f50c054 — the layer art-direction treatments
 * folded into the freely-positioned-layer capability by BUNDLE-3 (REQ-32 cap 5).
 * These are the five ACs that generalise the REQ-15 layer child: text-child
 * typography, the `lines` titled block, image shadow/border, the soft-mask
 * feather control, and the faithful positioning geometry.
 *
 * One UAT per acceptance criterion (AC-517..AC-521), asserting the existing
 * implementation at its external boundaries:
 *
 *  - the public `validateSite` contract from `@1stcontact/site-schema` (the
 *    extended treatment / typography schema and the strict raw-CSS rejection);
 *  - the framework's public `renderLayer` (the computed token-backed styles) and
 *    the static `LAYER_CSS` block (positioning geometry, feather stop, gaps);
 *  - `generateThemeCss` for the backfilled `xl` shadow token.
 *
 * Nothing internal is mocked. AC-482..AC-487 (the base layer contract) are
 * covered by reconciliation-req15-layer.test.ts and are not repeated here.
 */

const PHOTO = { id: 'photo', src: '/assets/photo.jpg', alt: 'Montage' }

/** A minimal, schema-valid site; a `layer` is attached to module `m1` per test. */
function minimalSite(): Record<string, any> {
  return {
    id: 'site-layer-treatments',
    config: { businessName: 'Acme Co' },
    theme: {
      palette: {
        bg: '#ffffff',
        surface: '#f9fafb',
        surfaceSubtle: '#f3f4f6',
        surfaceInverse: '#111827',
        text: '#111827',
        muted: '#6b7280',
        primary: '#2563eb',
        accent: '#f59e0b',
        border: '#e5e7eb',
      },
      typography: {
        family: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
        scale: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem',
        },
        weights: { regular: '400', medium: '500', semibold: '600', bold: '700', black: '900' },
        lineHeights: { tight: '1.1', normal: '1.5', relaxed: '1.75' },
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
      },
      radius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
      shadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },
      container: { narrow: '40rem', default: '72rem', wide: '90rem', bleed: '100%' },
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
    nav: { pattern: 'in-page-anchors', entries: [] },
    pages: [
      {
        id: 'page-home',
        slug: 'home',
        title: 'Home',
        modules: [
          {
            id: 'm1',
            type: 'layer',
            version: 1,
            variant: 'full',
            dials: {},
            content: {},
          },
        ],
      },
    ],
  }
}

describe('story-4f50c054 — layer text typography (REQ-32 cap 5)', () => {
  // AC-517 (acceptance_criterion-5681b434): A layer text child may carry a
  // structured `typography` field; every field resolves to a theme-token custom
  // property or a fixed framework value; no raw CSS is accepted; an unstyled
  // text child renders exactly as before.
  it('test_UAT_AC517_text_children_carry_token_backed_typography', async () => {
    const layer = {
      children: [
        {
          kind: 'text',
          text: '**FAELAN**',
          typography: {
            size: '5xl',
            weight: 'black',
            color: 'primary',
            font: 'display',
            tracking: 'wide',
            align: 'left',
            leading: 'tight',
            shadow: 'glow',
          },
          position: { x: 8, y: 8, z: 20 },
        },
      ],
    }
    // The structured typography validates.
    const site = minimalSite()
    site.pages[0].modules[0].layer = layer
    expect(validateSite(site).ok, 'text typography should validate').toBe(true)

    // Every field is emitted as a theme-token custom property or fixed value.
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('font-size: var(--font-size-5xl);')
    expect(stack).toContain('font-weight: var(--font-weight-black);')
    expect(stack).toContain('color: var(--color-primary);')
    expect(stack).toContain('font-family: var(--font-family-display);')
    expect(stack).toContain('line-height: var(--line-height-tight);')
    expect(stack).toContain('letter-spacing: 0.03em;') // tracking → em (fixed set)
    expect(stack).toContain('text-align: left;')
    expect(stack).toContain('text-shadow: 4px 4px 20px rgba(0,0,0,0.9), 0 0 40px rgba(255,255,255,0.3);')
    // The declarations ride on the `.fc-layer__text` run; the markdown children
    // (here the `<strong>`) inherit it.
    expect(stack).toMatch(/fc-layer__text" style="[^"]*font-size: var\(--font-size-5xl\)/)
    expect(stack).toContain('<strong>FAELAN</strong>')

    // A text child with no typography emits no style declarations at all.
    const plain = await renderLayer({
      children: [{ kind: 'text', text: '**Hi**', position: { x: 10, y: 10, z: 1 } }],
    } as any)
    expect(plain).not.toContain('fc-layer__text" style=')

    // A raw `css` field smuggled onto the typography object fails validation
    // with a path-pointed error at the typography location.
    const bad = minimalSite()
    bad.pages[0].modules[0].layer = {
      children: [
        {
          kind: 'text',
          text: 'x',
          typography: { size: '5xl', css: 'color: red' },
          position: { x: 0, y: 0, z: 0 },
        },
      ],
    }
    const badResult = validateSite(bad)
    expect(badResult.ok).toBe(false)
    if (!badResult.ok) {
      expect(
        badResult.errors.some((e) =>
          e.path.startsWith('/pages/0/modules/0/layer/children/0/typography'),
        ),
      ).toBe(true)
    }
  })

  // AC-518 (acceptance_criterion-ce02493a): A text child may carry `lines`
  // (mutually exclusive with `text`), rendered as one positioned flow block
  // whose lines follow document order, each keeping its own typography, so the
  // inter-line gap is content-based and fixed at any viewport height.
  it('test_UAT_AC518_titled_block_lines_flow_as_one_positioned_block', async () => {
    const layer = {
      children: [
        {
          kind: 'text',
          lines: [
            { text: 'FAELAN', typography: { size: '5xl', weight: 'black' } },
            { text: 'Artist • [Musician](https://x.test) • Creator', typography: { size: '2xl' } },
          ],
          position: { x: 8, y: 8, z: 21 },
        },
      ],
    }
    const site = minimalSite()
    site.pages[0].modules[0].layer = layer
    expect(validateSite(site).ok, 'a lines titled-block should validate').toBe(true)

    const stack = await renderLayer(layer as any)
    // Exactly one positioned child, one flowing block, two typography-styled runs.
    expect((stack.match(/fc-layer__child--text/g) ?? []).length).toBe(1)
    expect(stack).toContain('<div class="fc-layer__block">')
    expect((stack.match(/fc-layer__text/g) ?? []).length).toBe(2)
    // Each line keeps its own token-backed typography.
    expect(stack).toContain('font-size: var(--font-size-5xl);')
    expect(stack).toContain('font-size: var(--font-size-2xl);')
    expect(stack).toContain('FAELAN')
    expect(stack).toContain('>Musician</a>')

    // The inter-line gap is a fixed content-based `rem` in the static stylesheet
    // (not a viewport-height-derived value), so it does not scale with band
    // height — the reproduction-faithful realisation of "gap stays fixed".
    expect(LAYER_CSS).toContain('.fc-layer__block > * + * { margin-top: 0.5rem; }')

    // `text` and `lines` are mutually exclusive: both, or neither, fail validation.
    const both = minimalSite()
    both.pages[0].modules[0].layer = {
      children: [{ kind: 'text', text: 'x', lines: [{ text: 'y' }], position: { x: 0, y: 0, z: 0 } }],
    }
    expect(validateSite(both).ok).toBe(false)

    const neither = minimalSite()
    neither.pages[0].modules[0].layer = {
      children: [{ kind: 'text', position: { x: 0, y: 0, z: 0 } }],
    }
    expect(validateSite(neither).ok).toBe(false)
  })
})

describe('story-4f50c054 — layer image shadow + border (REQ-32 cap 5)', () => {
  // AC-519 (acceptance_criterion-aca2fb20): An image child treatment may carry a
  // `shadow` step (incl. the backfilled `xl` token) and a token-backed `border`.
  // Both are emitted as `var(--shadow-*)` / `var(--color-*)`; a `none` width
  // emits no border; a raw shadow/border string is rejected.
  it('test_UAT_AC519_image_shadow_and_border_are_token_backed', async () => {
    const layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shape: 'circle', shadow: 'xl', border: { width: 'thin', color: 'accent' } },
          position: { x: 5, y: 5, z: 1, width: 20 },
        },
      ],
    }
    const site = minimalSite()
    site.pages[0].modules[0].layer = layer
    expect(validateSite(site).ok, 'shadow + border treatment should validate').toBe(true)

    // The framework emits token-backed styles on the <img> — never raw CSS.
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('box-shadow: var(--shadow-xl);')
    expect(stack).toContain('border: 1px solid var(--color-accent);')
    // Both declarations ride on the image element, alongside the shape class.
    expect(stack).toMatch(/<img[^>]+style="[^"]*box-shadow: var\(--shadow-xl\);/)
    expect(stack).toContain('fc-layer__child--shape-circle')

    // The per-site stylesheet emits `--shadow-xl` even for a theme that did not
    // declare one (the token is optional and backfilled from defaults).
    const css = generateThemeCss()
    expect(css).toContain('--shadow-xl:')
    // A theme that omits `xl` still validates (optional token).
    expect(validateSite(minimalSite()).ok).toBe(true)

    // A `width: none` border emits no border declaration at all.
    const noBorder = await renderLayer({
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shadow: 'md', border: { width: 'none', color: 'accent' } },
          position: { x: 0, y: 0, z: 1, width: 30 },
        },
      ],
    } as any)
    expect(noBorder).toContain('box-shadow: var(--shadow-md);')
    expect(noBorder).not.toContain('border:')

    // A raw-CSS field smuggled onto the border is rejected by the strict schema,
    // with a path-pointed error at the border object.
    const rawCss = minimalSite()
    rawCss.pages[0].modules[0].layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { border: { width: 'thin', color: 'accent', style: 'outline: 2px' } },
          position: { x: 0, y: 0, z: 0 },
        },
      ],
    }
    const rawResult = validateSite(rawCss)
    expect(rawResult.ok).toBe(false)
    if (!rawResult.ok) {
      expect(
        rawResult.errors.some((e) =>
          e.path.startsWith('/pages/0/modules/0/layer/children/0/treatment/border'),
        ),
      ).toBe(true)
    }
  })

  // AC-520 (acceptance_criterion-727326da): A soft-mask image child may carry a
  // `feather` step (sm|md|lg) tuning the mask's opaque radial stop, emitted as a
  // `--fc-feather` custom property the soft-mask CSS reads. Absent → the prior
  // fixed default is preserved. `feather` is a no-op without a soft-mask edge.
  it('test_UAT_AC520_soft_mask_feather_control', async () => {
    const layer = {
      children: [
        // A crisp (`sm`) soft-mask edge.
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { edge: 'soft-mask', feather: 'sm' },
          position: { x: 0, y: 0, z: 1, width: 30 },
        },
        // feather is a no-op without a soft-mask edge.
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shape: 'circle', feather: 'lg' },
          position: { x: 40, y: 0, z: 2, width: 30 },
        },
      ],
    }
    const site = minimalSite()
    site.pages[0].modules[0].layer = layer
    expect(validateSite(site).ok).toBe(true)

    const stack = await renderLayer(layer as any)
    // The soft-mask child emits the crisp stop as a custom property...
    expect(stack).toContain('--fc-feather: 78%;')
    // ...which the static soft-mask rule consumes, with a default fallback.
    expect(LAYER_CSS).toContain(
      'radial-gradient(ellipse 92% 92% at center, #000 var(--fc-feather, 60%), transparent 100%)',
    )
    // The circle child (no soft-mask edge) does not emit a feather property —
    // feather is meaningful only with a soft-mask edge.
    expect(stack).not.toContain('--fc-feather: 60%;')

    // A soft-mask child with no feather emits no `--fc-feather` (default applies).
    const noFeather = await renderLayer({
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { edge: 'soft-mask' },
          position: { x: 0, y: 0, z: 1, width: 30 },
        },
      ],
    } as any)
    expect(noFeather).not.toContain('--fc-feather:')

    // A feather value outside the enum fails validation.
    const badFeather = minimalSite()
    badFeather.pages[0].modules[0].layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { edge: 'soft-mask', feather: 'ultra' },
          position: { x: 0, y: 0, z: 0 },
        },
      ],
    }
    expect(validateSite(badFeather).ok).toBe(false)
  })
})

describe('story-4f50c054 — faithful layer positioning geometry (REQ-32 cap 5)', () => {
  // AC-521 (acceptance_criterion-e03c6fe8): Positioning geometry is faithful so a
  // montage reproduces to the pixel — rotate in place about centre; the motion
  // wrapper is transparent to image sizing; a `shape: circle` child is a true
  // circle (`aspect-ratio: 1`); the soft mask is a box-sized ellipse; a layer
  // text link carries a tasteful underline offset.
  it('test_UAT_AC521_positioning_geometry_reproduces_montages_faithfully', async () => {
    // Rotate about the element centre — an art-directed child tilts in place
    // rather than swinging around a corner.
    expect(LAYER_CSS).toContain('transform-origin: center;')

    // The motion wrapper is transparent to image sizing (fills its box), so a
    // definite-height image child fills whether or not it carries motion.
    expect(LAYER_CSS).toContain(
      '.fc-layer__child--image .fc-motion { display: block; width: 100%; height: 100%; }',
    )

    // A `shape: circle` child is a true circle from its width alone.
    expect(LAYER_CSS).toContain('.fc-layer__child--shape-circle { aspect-ratio: 1; }')

    // The soft mask is a box-sized ellipse centred on the child.
    expect(LAYER_CSS).toContain('radial-gradient(ellipse 92% 92% at center,')

    // A layer text link carries a non-zero underline offset.
    expect(LAYER_CSS).toContain('text-underline-offset: 0.16em;')

    // Render a rotated circular image child: it is marked a circle and tilted in
    // place at its declared position (rotate emitted as an --fc-rotate degree),
    // with the shape class present so `aspect-ratio: 1` makes it a true circle.
    const stack = await renderLayer({
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shape: 'circle' },
          position: { x: 30, y: 40, z: 2, width: 25, rotate: 12 },
        },
      ],
    } as any)
    expect(stack).toContain('fc-layer__child--shape-circle')
    expect(stack).toContain('--fc-rotate: 12deg;')
    expect(stack).toContain('--fc-x: 30%;')
    expect(stack).toContain('--fc-y: 40%;')
  })
})
