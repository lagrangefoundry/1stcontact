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
 * UATs for REQ-15 — the `layer` module + z-compositing (free-positioned
 * structured layout).
 *
 * Entry points under test: the public `validateSite` (the Position / Layer /
 * treatment contract and the raw-CSS rejection), the framework's layer
 * rendering (`renderLayer` / `wrapWithLayer` + `LAYER_CSS`), and an end-to-end
 * render through the `1c` CLI. Nothing internal is mocked; module HTML is
 * produced through the same Astro container path `tools/generate` uses.
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

describe('REQ-15 — Layer schema (validateSite)', () => {
  it('test_UAT_FC_REQ-15_layer_positions_children', async () => {
    // A layer with two positioned children validates as structured data...
    const site = minimalSite()
    const layer = {
      children: [
        { kind: 'image', asset: PHOTO, position: { x: 10, y: 20, z: 1, width: 40 } },
        {
          kind: 'text',
          text: '**Hello**',
          position: { x: 55, y: 35, z: 3, breakpoints: { md: { x: 60, z: 4 } } },
        },
      ],
    }
    site.pages[0].modules[0].layer = layer
    const result = validateSite(site)
    expect(result.ok, 'a structured layer should validate').toBe(true)

    // ...and the framework emits each child's x/y/z as computed custom props.
    const stack = await renderLayer(layer as any)
    expect(stack).toContain('--fc-x: 10%;')
    expect(stack).toContain('--fc-y: 20%;')
    expect(stack).toContain('--fc-z: 1;')
    expect(stack).toContain('--fc-x: 55%;')
    expect(stack).toContain('--fc-z: 3;')
    // width → the short --fc-w the LAYER_CSS reads.
    expect(stack).toContain('--fc-w: 40%;')
    // per-breakpoint override for the text child.
    expect(stack).toContain('--fc-x-md: 60%;')

    // A non-numeric coordinate is rejected with a path-pointed error.
    const bad = minimalSite()
    bad.pages[0].modules[0].layer = {
      children: [{ kind: 'image', asset: PHOTO, position: { x: 'left', y: 0, z: 0 } }],
    }
    const badResult = validateSite(bad)
    expect(badResult.ok).toBe(false)
    if (!badResult.ok) {
      expect(
        badResult.errors.some(
          (e) => e.path === '/pages/0/modules/0/layer/children/0/position/x',
        ),
      ).toBe(true)
    }
  })
})

describe('REQ-15 — Layer rendering', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>
  beforeEach(async () => {
    container ??= await AstroContainer.create()
  })

  it('test_UAT_FC_REQ-15_text_over_image', async () => {
    // A layer with an image child (z 1) and a text child (z 2) over an overlay.
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

    // The image references the asset; the text renders in a text child.
    expect(wrapped).toContain("src=\"/assets/photo.jpg\"")
    expect(wrapped).toContain('fc-layer__child--text')
    expect(wrapped).toContain('Over the image')
    // The overlay carries the tint, between host content and the child stack.
    expect(wrapped).toMatch(/fc-layer__overlay[^>]+opacity: 0\.45/)

    // DOM order: host content, then overlay, then the positioned stack.
    const contentIdx = wrapped.indexOf('fc-layer__content')
    const overlayIdx = wrapped.indexOf('fc-layer__overlay')
    const stackIdx = wrapped.indexOf('fc-layer__stack')
    expect(contentIdx).toBeLessThan(overlayIdx)
    expect(overlayIdx).toBeLessThan(stackIdx)
    // The text child sits above the image child (higher z).
    expect(wrapped).toContain('--fc-z: 2;')
  })

  it('test_UAT_FC_REQ-15_treatments', async () => {
    const layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { shape: 'circle' },
          position: { x: 0, y: 0, z: 1 },
        },
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { edge: 'soft-mask' },
          position: { x: 30, y: 0, z: 2 },
        },
        {
          kind: 'image',
          asset: PHOTO,
          treatment: { edge: 'torn-asset' },
          position: { x: 60, y: 0, z: 3 },
        },
      ],
    }
    const stack = await renderLayer(layer as any)
    // Each treatment surfaces as a scoped class on the child.
    expect(stack).toContain('fc-layer__child--shape-circle')
    expect(stack).toContain('fc-layer__child--edge-soft')
    expect(stack).toContain('fc-layer__child--edge-torn')

    // And the static rules that realise them live in LAYER_CSS.
    expect(LAYER_CSS).toContain('.fc-layer__child--shape-circle img { border-radius: 50%; }')
    expect(LAYER_CSS).toContain('.fc-layer__child--edge-soft img')
    expect(LAYER_CSS).toContain('mask-image: radial-gradient')
    expect(LAYER_CSS).toContain('.fc-layer__child--edge-torn img')
  })

  it('test_UAT_FC_REQ-15_per_breakpoint_reflow', async () => {
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

    // The reflow rule collapses absolute positioning to normal flow below the
    // breakpoint — a max-width media query returning children to static flow.
    expect(LAYER_CSS).toContain('@media (max-width: 639.98px)')
    expect(LAYER_CSS).toMatch(
      /reflow-below-sm\.fc-layer--reflow-stack \.fc-layer__child \{[\s\S]*?position: static/,
    )
    // And a per-breakpoint media block re-points positioned children upward.
    expect(LAYER_CSS).toContain('@media (min-width: 768px)')
  })
})

describe('REQ-15 — z-compositing over another module (1c render)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req15-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-15_zcompositing', async () => {
    // Unit: a layer wraps a host module, compositing its stack over the host.
    const wrapped = await wrapWithLayer('<section class="hero">HOST</section>', {
      children: [{ kind: 'text', text: 'badge', position: { x: 5, y: 5, z: 1 } }],
    } as any)
    const contentIdx = wrapped.indexOf('fc-layer__content')
    const stackIdx = wrapped.indexOf('fc-layer__stack')
    // The host content is inside the layer, with the stack composited after it.
    expect(wrapped).toContain('<div class="fc-layer__content"><section class="hero">HOST</section></div>')
    expect(contentIdx).toBeLessThan(stackIdx)

    // End-to-end: a layer on the hero renders one layer wrapper, and the layer
    // structural CSS reaches the per-site stylesheet.
    cmdNew('acme', { cwd })
    const pagePath = path.join(cwd, 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.layer = {
      children: [{ kind: 'text', text: 'On top', position: { x: 10, y: 10, z: 1 } }],
    }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates through the real loader.
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(loaded.ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    const wrapperCount = (html.match(/class="fc-layer[ "]/g) ?? []).length
    expect(wrapperCount).toBe(1)
    expect(html).toContain('fc-layer__stack')
    expect(html).toContain('On top')

    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('.fc-layer__stack')
  })
})

describe('REQ-15 — raw CSS is rejected (validateSite)', () => {
  it('test_UAT_FC_REQ-15_no_raw_css', () => {
    // A raw `style` prop smuggled onto a module instance is rejected — the
    // strict instance schema permits only structured layout, never raw CSS.
    const onInstance = minimalSite()
    onInstance.pages[0].modules[0].style = 'color: red; position: absolute;'
    const instanceResult = validateSite(onInstance)
    expect(instanceResult.ok).toBe(false)

    // A raw `css` prop smuggled onto a layer child is likewise rejected.
    const onChild = minimalSite()
    onChild.pages[0].modules[0].layer = {
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          position: { x: 0, y: 0, z: 0 },
          css: 'transform: scale(2);',
        },
      ],
    }
    const childResult = validateSite(onChild)
    expect(childResult.ok).toBe(false)
  })
})
