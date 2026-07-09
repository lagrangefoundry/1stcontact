import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { LAYER_CSS, renderLayer, wrapWithLayer } from '../packages/framework/src/index'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import { validateSite } from '../packages/site-schema/src/index'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * Reconciliation UATs for story-4f50c054 — freely-positioned layers with
 * z-compositing over a section or module (REQ-15). One UAT per acceptance
 * criterion (AC-482..AC-487), asserting the existing implementation at its
 * external boundaries:
 *
 *  - the `validateSite` contract from `@1stcontact/site-schema` (the Layer /
 *    Position / treatment schema and the raw-CSS/HTML rejection) — AC-482/AC-487;
 *  - the framework's public layer rendering (`renderLayer` / `wrapWithLayer`
 *    + `LAYER_CSS`), over real module HTML produced through the same Astro
 *    container path `tools/generate` uses — AC-483/AC-484/AC-485;
 *  - a full site render through the `1c` CLI, reading the emitted HTML and the
 *    per-site `theme.css` — AC-486.
 *
 * Nothing internal is mocked; only the filesystem is isolated to a temp dir.
 */

/** A minimal, schema-valid site with one hero module (REQ-3 shape). */
function minimalSite(): Record<string, any> {
  return {
    id: 'site-layer',
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
            type: 'hero',
            version: 1,
            variant: 'bg-color',
            dials: {},
            content: { heading: 'Welcome' },
          },
        ],
      },
    ],
  }
}

const PHOTO = { id: 'photo', src: '/assets/photo.jpg', alt: 'Montage' }

/** All `style="…"` attribute bodies emitted in a fragment of layer HTML. */
function styleAttrs(html: string): string[] {
  return [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1])
}

describe('story-4f50c054 — freely-positioned layers (REQ-15)', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>
  beforeEach(async () => {
    container ??= await AstroContainer.create()
  })

  // AC-482 (acceptance_criterion-3f701591): Layer children render at their
  // structured positions. The author supplies only unitless numbers; the
  // framework produces every positioning style, and the site validates.
  it('test_UAT_AC482_layer_children_render_at_structured_positions', async () => {
    const site = minimalSite()
    const layer = {
      children: [
        { kind: 'image', asset: PHOTO, position: { x: 10, y: 20, z: 1, width: 40 } },
        { kind: 'text', text: '**Badge**', position: { x: 55, y: 35, z: 3 } },
      ],
    }
    site.pages[0].modules[0].layer = layer

    // A site whose module carries only structured positions validates.
    const result = validateSite(site)
    expect(result.ok, 'a structured layer should validate').toBe(true)

    // Each child is placed at its declared x/y/z/width as framework-computed
    // `--fc-*` custom properties.
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('--fc-x: 10%;')
    expect(stack).toContain('--fc-y: 20%;')
    expect(stack).toContain('--fc-z: 1;')
    expect(stack).toContain('--fc-w: 40%;')
    expect(stack).toContain('--fc-x: 55%;')
    expect(stack).toContain('--fc-z: 3;')

    // No author-supplied CSS string appears in the child styling: every style
    // attribute is composed solely of framework `--fc-*` custom properties.
    const attrs = styleAttrs(stack)
    expect(attrs.length).toBeGreaterThan(0)
    for (const attr of attrs) {
      for (const decl of attr.split(';').map((d) => d.trim()).filter(Boolean)) {
        expect(decl.startsWith('--fc-'), `unexpected raw CSS declaration: ${decl}`).toBe(true)
      }
    }
  })

  // AC-483 (acceptance_criterion-bfd94d76): Text renders legibly over a layered
  // image with an overlay tint. Fixed, observable stacking order:
  // host content < overlay < positioned stack.
  it('test_UAT_AC483_text_over_image_with_overlay_tint', async () => {
    const layer = {
      children: [
        { kind: 'image', asset: PHOTO, position: { x: 0, y: 0, z: 1, width: 100 } },
        { kind: 'text', text: 'Over the image', position: { x: 20, y: 40, z: 2 } },
      ],
      overlay: { color: '#000000', opacity: 0.45 },
    }
    const heroHtml = await container.renderToString(Hero, {
      props: { variant: 'bg-color', dials: {}, content: { heading: 'Host' } },
    })
    const wrapped = await wrapWithLayer(heroHtml, layer as any)

    // The image source and the text run's content both appear.
    expect(wrapped).toContain('src="/assets/photo.jpg"')
    expect(wrapped).toContain('Over the image')
    // The overlay carries the author's hex colour and 0..1 opacity.
    expect(wrapped).toMatch(/fc-layer__overlay[^>]+background-color: #000000/)
    expect(wrapped).toMatch(/fc-layer__overlay[^>]+opacity: 0\.45/)

    // Document order confirms content precedes the overlay, which precedes the
    // positioned stack — so the text child renders above both image and tint.
    const contentIdx = wrapped.indexOf('fc-layer__content')
    const overlayIdx = wrapped.indexOf('fc-layer__overlay')
    const stackIdx = wrapped.indexOf('fc-layer__stack')
    expect(contentIdx).toBeGreaterThanOrEqual(0)
    expect(contentIdx).toBeLessThan(overlayIdx)
    expect(overlayIdx).toBeLessThan(stackIdx)
    // The text child sits above the image child (higher z).
    expect(wrapped).toContain('--fc-z: 2;')
  })

  // AC-484 (acceptance_criterion-1eccf6a6): Image children apply enumerated
  // shape and edge treatments, chosen from a finite enumeration, with matching
  // effects defined in the per-site stylesheet.
  it('test_UAT_AC484_image_shape_and_edge_treatments', async () => {
    const layer = {
      children: [
        { kind: 'image', asset: PHOTO, treatment: { shape: 'circle' }, position: { x: 0, y: 0, z: 1 } },
        { kind: 'image', asset: PHOTO, treatment: { edge: 'soft-mask' }, position: { x: 30, y: 0, z: 2 } },
        { kind: 'image', asset: PHOTO, treatment: { edge: 'torn-asset' }, position: { x: 60, y: 0, z: 3 } },
      ],
    }
    const stack = await renderLayer(layer as any)
    // Each selected treatment marks the image with its scoped class.
    expect(stack).toContain('fc-layer__child--shape-circle')
    expect(stack).toContain('fc-layer__child--edge-soft')
    expect(stack).toContain('fc-layer__child--edge-torn')

    // The static rules realising each treatment live in LAYER_CSS: a circle
    // clip, a radial mask for soft edges, and a mask-image for torn edges.
    expect(LAYER_CSS).toContain('.fc-layer__child--shape-circle img { border-radius: 50%; }')
    expect(LAYER_CSS).toContain('.fc-layer__child--edge-soft img')
    expect(LAYER_CSS).toContain('mask-image: radial-gradient')
    expect(LAYER_CSS).toContain('.fc-layer__child--edge-torn img')
    expect(LAYER_CSS).toContain('mask-image: var(--fc-torn-mask, none)')
  })

  // AC-485 (acceptance_criterion-de3f0a8d): Per-breakpoint position overrides
  // apply ("override and up"), and reflow policy controls narrow-viewport
  // behaviour — `stack` (default) collapses to normal flow, `none` does not.
  it('test_UAT_AC485_per_breakpoint_overrides_and_reflow', async () => {
    // A child declaring an `md` override emits the per-breakpoint custom prop.
    const layer = {
      children: [
        { kind: 'text', text: 'x', position: { x: 55, y: 35, z: 3, breakpoints: { md: { x: 60, z: 4 } } } },
      ],
    }
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('--fc-x-md: 60%;')
    expect(stack).toContain('--fc-z-md: 4;')

    // Default reflow = stack, below the sm breakpoint.
    const defaulted = await wrapWithLayer('<section>host</section>', {
      children: [{ kind: 'text', text: 'x', position: { x: 0, y: 0, z: 0 } }],
    } as any)
    expect(defaulted).toContain('fc-layer--reflow-stack')
    expect(defaulted).toContain('fc-layer--reflow-below-sm')

    // reflow = none opts out of the stack fallback entirely.
    const none = await wrapWithLayer('<section>host</section>', {
      reflow: 'none',
      children: [{ kind: 'text', text: 'x', position: { x: 0, y: 0, z: 0 } }],
    } as any)
    expect(none).not.toContain('fc-layer--reflow-stack')

    // The stylesheet carries the max-width media block returning children to
    // normal flow, and the min-width blocks that re-point positions per bp.
    expect(LAYER_CSS).toContain('@media (max-width: 639.98px)')
    expect(LAYER_CSS).toMatch(
      /reflow-below-sm\.fc-layer--reflow-stack \.fc-layer__child \{[\s\S]*?position: static/,
    )
    expect(LAYER_CSS).toContain('@media (min-width: 768px)')
  })

  // AC-487 (acceptance_criterion-ecb1101a): Raw CSS or HTML props anywhere in a
  // layer are rejected with a path-pointed error; the declared structured
  // fields validate.
  it('test_UAT_AC487_raw_css_or_html_rejected_with_path', () => {
    // A raw `style` prop smuggled onto a module instance is rejected, with the
    // path identifying the offending module and the message naming the key.
    const onInstance = minimalSite()
    onInstance.pages[0].modules[0].style = 'color: red; position: absolute;'
    const instanceResult = validateSite(onInstance)
    expect(instanceResult.ok).toBe(false)
    if (!instanceResult.ok) {
      expect(
        instanceResult.errors.some(
          (e) => e.path === '/pages/0/modules/0' && e.message.includes('style'),
        ),
      ).toBe(true)
    }

    // A raw `css` prop smuggled onto a layer child is likewise rejected, with
    // the path pointing at the child.
    const onChild = minimalSite()
    onChild.pages[0].modules[0].layer = {
      children: [
        { kind: 'image', asset: PHOTO, position: { x: 0, y: 0, z: 0 }, css: 'transform: scale(2);' },
      ],
    }
    const childResult = validateSite(onChild)
    expect(childResult.ok).toBe(false)
    if (!childResult.ok) {
      expect(
        childResult.errors.some(
          (e) => e.path === '/pages/0/modules/0/layer/children/0' && e.message.includes('css'),
        ),
      ).toBe(true)
    }

    // A raw `html` prop smuggled onto the layer itself is rejected at the layer.
    const onLayer = minimalSite()
    onLayer.pages[0].modules[0].layer = {
      children: [{ kind: 'text', text: 'hi', position: { x: 0, y: 0, z: 0 } }],
      html: '<script>alert(1)</script>',
    }
    const layerResult = validateSite(onLayer)
    expect(layerResult.ok).toBe(false)
    if (!layerResult.ok) {
      expect(
        layerResult.errors.some(
          (e) => e.path === '/pages/0/modules/0/layer' && e.message.includes('html'),
        ),
      ).toBe(true)
    }

    // A site using only the declared structured fields validates successfully.
    const clean = minimalSite()
    clean.pages[0].modules[0].layer = {
      children: [{ kind: 'text', text: 'ok', position: { x: 10, y: 10, z: 1 } }],
    }
    expect(validateSite(clean).ok).toBe(true)
  })
})

describe('story-4f50c054 — z-compositing + standalone layer (1c render)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac486-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // AC-486 (acceptance_criterion-507fa6b8): A layer composites over another
  // module (host content beneath the child stack); a standalone `layer` module
  // provides a bare positioned section; a module with no layer is unchanged.
  it('test_UAT_AC486_composite_over_module_and_standalone_section', async () => {
    // 1. A layer wraps a host module, compositing its stack over the host: the
    //    host markup is nested as the layer content, beneath the stack.
    const wrapped = await wrapWithLayer('<section class="hero">HOST</section>', {
      children: [{ kind: 'text', text: 'badge', position: { x: 5, y: 5, z: 1 } }],
    } as any)
    expect(wrapped).toContain(
      '<div class="fc-layer__content"><section class="hero">HOST</section></div>',
    )
    expect(wrapped.indexOf('fc-layer__content')).toBeLessThan(wrapped.indexOf('fc-layer__stack'))

    // 2. A module instance with NO layer field renders exactly as before —
    //    unwrapped and unchanged.
    const bare = await wrapWithLayer('<section class="hero">HOST</section>', undefined)
    expect(bare).toBe('<section class="hero">HOST</section>')

    // 3. A page using the standalone `layer` module produces a single
    //    positioned stack section, and the positioning rules reach theme.css.
    cmdNew('acme', { cwd })
    const pagePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    // Replace the page's modules with a single bare art-directed `layer` band.
    page.modules = [
      {
        id: 'art',
        type: 'layer',
        version: 1,
        variant: 'default',
        dials: {},
        content: {},
        layer: {
          children: [
            { kind: 'image', asset: PHOTO, position: { x: 10, y: 20, z: 1, width: 40 } },
            { kind: 'text', text: 'On top', position: { x: 55, y: 35, z: 2 } },
          ],
        },
      },
    ]
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates through the real loader.
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(loaded.ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    // Exactly one layer wrapper (the standalone layer module) and a stack.
    const wrapperCount = (html.match(/class="fc-layer[ "]/g) ?? []).length
    expect(wrapperCount).toBe(1)
    expect(html).toContain('fc-layer__stack')
    expect(html).toContain('On top')
    expect(html).toContain('src="/assets/photo.jpg"')

    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('.fc-layer__stack')
    expect(themeCss).toContain('.fc-layer__child')
  })
})
