import { describe, expect, it } from 'vitest'
import { LAYER_CSS, renderLayer } from '../packages/framework/src/index'
import { generateThemeCss } from '../packages/framework/src/tokens/css'
import { validateSite } from '../packages/site-schema/src/index'

/**
 * UATs for REQ-32 capability 5 — layer art-direction treatments (surfaced by the
 * faelan.com import, REQ-21). Three generalizations of the REQ-15 `layer` child:
 * image `shadow` + `border`, text `typography`, and the `xl` shadow token.
 *
 * Entry points under test: the public `validateSite` (the extended treatment /
 * typography contract + `.strict()` raw-CSS rejection), the framework's
 * `renderLayer` (the computed token-backed styles), and `generateThemeCss` (the
 * `xl` shadow token). Nothing internal is mocked.
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

describe('REQ-32 cap 5 — layer image shadow + border', () => {
  it('test_UAT_FC_REQ-32_image_shadow_and_border_render_token_backed', async () => {
    const layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shape: 'circle', shadow: 'xl', border: { width: 'thick', color: 'bg' } },
          position: { x: 5, y: 5, z: 1, width: 20 },
        },
      ],
    }
    // Validates as structured data (extended treatment contract).
    const site = minimalSite()
    site.pages[0].modules[0].layer = layer
    expect(validateSite(site).ok, 'shadow + border treatment should validate').toBe(true)

    // The framework emits token-backed styles on the <img> — never raw CSS.
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('box-shadow: var(--shadow-xl);')
    expect(stack).toContain('border: 4px solid var(--color-bg);')
    // The border/shadow ride on the image element, alongside the shape class.
    expect(stack).toMatch(/<img[^>]+style="[^"]*box-shadow: var\(--shadow-xl\);/)
    expect(stack).toContain('fc-layer__child--shape-circle')
  })

  it('test_UAT_FC_REQ-32_motion_transparent_to_image_sizing', () => {
    // The motion wrapper must not break an image child's height:100% — otherwise
    // object-fit collapses to the natural aspect (a circle renders as an ellipse).
    expect(LAYER_CSS).toContain(
      '.fc-layer__child--image .fc-motion { display: block; width: 100%; height: 100%; }',
    )
    // A circle is square from its width alone (no fragile percentage height).
    expect(LAYER_CSS).toContain('.fc-layer__child--shape-circle { aspect-ratio: 1; }')
  })

  it('test_UAT_FC_REQ-32_soft_mask_feather_stop', async () => {
    const layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { edge: 'soft-mask', feather: 'md' },
          position: { x: 0, y: 0, z: 1, width: 30 },
        },
        // feather is a no-op without a soft-mask edge.
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shape: 'circle', feather: 'sm' },
          position: { x: 40, y: 0, z: 2, width: 30 },
        },
      ],
    }
    const site = minimalSite()
    site.pages[0].modules[0].layer = layer
    expect(validateSite(site).ok).toBe(true)

    const stack = await renderLayer(layer as any)
    // The soft-mask child emits the feather stop as a custom property...
    expect(stack).toContain('--fc-feather: 72%;')
    // ...which the static mask rule reads (a box-sized ellipse, default fallback).
    expect(LAYER_CSS).toContain('radial-gradient(ellipse 92% 92% at center, #000 var(--fc-feather, 60%), transparent 100%)')
    // The circle child (no soft-mask) does not emit a feather property.
    expect(stack).not.toContain('--fc-feather: 78%;')
  })

  it('test_UAT_FC_REQ-32_border_none_emits_no_border', async () => {
    const layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shadow: 'md', border: { width: 'none', color: 'accent' } },
          position: { x: 0, y: 0, z: 1, width: 30 },
        },
      ],
    }
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('box-shadow: var(--shadow-md);')
    // `width: none` means no border declaration is emitted at all.
    expect(stack).not.toContain('border:')
  })

  it('test_UAT_FC_REQ-32_treatment_rejects_bad_enum_and_raw_css', () => {
    // An out-of-set shadow step is rejected (closed enum).
    const badShadow = minimalSite()
    badShadow.pages[0].modules[0].layer = {
      children: [{ kind: 'image', asset: PHOTO, treatment: { shadow: 'huge' }, position: { x: 0, y: 0, z: 0 } }],
    }
    expect(validateSite(badShadow).ok).toBe(false)

    // A raw-CSS field smuggled onto the border is rejected by `.strict()`.
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
    expect(validateSite(rawCss).ok).toBe(false)
  })
})

describe('REQ-32 cap 5 — layer text typography', () => {
  it('test_UAT_FC_REQ-32_text_typography_renders_token_props', async () => {
    const layer = {
      children: [
        {
          kind: 'text',
          text: 'FAELAN',
          typography: {
            size: '5xl',
            weight: 'black',
            color: 'bg',
            font: 'display',
            tracking: 'wide',
            align: 'left',
            shadow: 'glow',
          },
          position: { x: 8, y: 8, z: 20 },
        },
      ],
    }
    const site = minimalSite()
    site.pages[0].modules[0].layer = layer
    expect(validateSite(site).ok, 'text typography should validate').toBe(true)

    const stack = await renderLayer(layer as any)
    expect(stack).toContain('font-size: var(--font-size-5xl);')
    expect(stack).toContain('font-weight: var(--font-weight-black);')
    expect(stack).toContain('color: var(--color-bg);')
    expect(stack).toContain('font-family: var(--font-family-display);')
    expect(stack).toContain('letter-spacing: 0.03em;')
    expect(stack).toContain('text-align: left;')
    expect(stack).toContain('text-shadow:')
    // Emitted on the text run wrapper (children inherit it).
    expect(stack).toMatch(/fc-layer__text" style="[^"]*font-size: var\(--font-size-5xl\)/)
  })

  it('test_UAT_FC_REQ-32_titled_block_lines_flow_as_one_positioned_block', async () => {
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
    // One positioned child, one flowing block, two typography-styled runs.
    expect((stack.match(/fc-layer__child--text/g) ?? []).length).toBe(1)
    expect(stack).toContain('<div class="fc-layer__block">')
    expect((stack.match(/fc-layer__text/g) ?? []).length).toBe(2)
    expect(stack).toContain('font-size: var(--font-size-5xl);')
    expect(stack).toContain('font-size: var(--font-size-2xl);')
    expect(stack).toContain('FAELAN')
    expect(stack).toContain('>Musician</a>')
    // The fixed inter-line gap lives in LAYER_CSS (viewport-height-independent).
    expect(LAYER_CSS).toContain('.fc-layer__block > * + * { margin-top: 0.5rem; }')
  })

  it('test_UAT_FC_REQ-32_text_child_requires_exactly_one_of_text_or_lines', () => {
    // Both `text` and `lines` → rejected.
    const both = minimalSite()
    both.pages[0].modules[0].layer = {
      children: [{ kind: 'text', text: 'x', lines: [{ text: 'y' }], position: { x: 0, y: 0, z: 0 } }],
    }
    expect(validateSite(both).ok).toBe(false)

    // Neither → rejected.
    const neither = minimalSite()
    neither.pages[0].modules[0].layer = {
      children: [{ kind: 'text', position: { x: 0, y: 0, z: 0 } }],
    }
    expect(validateSite(neither).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-32_text_child_without_typography_unchanged', async () => {
    // Regression: a text child with no typography renders exactly as before —
    // no empty style attribute, no leaked declarations.
    const layer = {
      children: [{ kind: 'text', text: '**Hi**', position: { x: 10, y: 10, z: 1 } }],
    }
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('fc-layer__child--text')
    expect(stack).toContain('<div class="fc-layer__text">')
    expect(stack).not.toContain('fc-layer__text" style=')
    // The base run CSS (margin reset + link colour inherit) is present.
    expect(LAYER_CSS).toContain('.fc-layer__text > * { margin: 0; }')
    expect(LAYER_CSS).toContain('.fc-layer__text a { color: inherit; text-underline-offset: 0.16em; }')
  })

  it('test_UAT_FC_REQ-32_typography_rejects_raw_css', () => {
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
    expect(validateSite(bad).ok).toBe(false)
  })
})

describe('REQ-32 cap 5 — xl shadow token', () => {
  it('test_UAT_FC_REQ-32_xl_shadow_token_emitted_and_overridable', () => {
    // The default theme now emits `--shadow-xl` (safe to reference from a treatment).
    const css = generateThemeCss()
    expect(css).toContain('--shadow-xl:')

    // A site can tune the exact value in its theme (site-specific config).
    const tuned = generateThemeCss({
      shadow: { xl: '0 20px 60px rgba(0,0,0,0.6)' } as any,
    })
    expect(tuned).toContain('--shadow-xl: 0 20px 60px rgba(0,0,0,0.6);')

    // A theme that omits `xl` still validates (optional token).
    const site = minimalSite()
    expect(validateSite(site).ok).toBe(true)
  })
})
