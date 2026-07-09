import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { renderBackgroundLayers, wrapWithBackground } from '../packages/framework/src/index'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import { validateSite } from '../packages/site-schema/src/index'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * Reconciliation UATs for story-6af935e7 — section-level background (color /
 * image / gradient, with an optional legibility overlay). One UAT per
 * acceptance criterion (AC-475..AC-481), asserting the existing implementation
 * at its external boundaries:
 *
 *  - the `validateSite` contract from `@1stcontact/site-schema` (the Background
 *    schema: kinds, overlay, path-pointed errors) — AC-475/476/477;
 *  - the framework's public background rendering (`wrapWithBackground` /
 *    `renderBackgroundLayers`), over real module HTML produced through the same
 *    Astro container path `tools/generate` uses — AC-478/479;
 *  - a full site render through the `1c` CLI, reading the emitted HTML and the
 *    per-site `theme.css` — AC-480/481.
 *
 * Nothing internal is mocked; only the filesystem is isolated to a temp dir.
 */

/** A minimal, schema-valid site with one hero module (REQ-3 shape). */
function minimalSite(): Record<string, any> {
  return {
    id: 'site-bg',
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

/** Set the hero module's background and validate the resulting site. */
function validateWithBackground(background: unknown) {
  const site = minimalSite()
  site.pages[0].modules[0].background = background
  return validateSite(site)
}

const IMAGE_ASSET = { id: 'bg', src: '/assets/hero.jpg', alt: 'Kitchen' }
const BG_PATH = '/pages/0/modules/0/background'

// ── AC-475: a module accepts an optional color / image / gradient background ──

describe('reconciliation: section background schema (story-6af935e7)', () => {
  it('test_UAT_AC475_module_accepts_color_image_or_gradient_background', () => {
    // Each of the three kinds, carrying only its own fields, validates.
    const kinds = [
      { type: 'color', value: '#123456' },
      { type: 'image', asset: IMAGE_ASSET, fit: 'cover' },
      { type: 'gradient', gradient: 'linear-gradient(180deg, #000, #fff)' },
    ]
    for (const background of kinds) {
      const result = validateWithBackground(background)
      expect(result.ok, `${background.type} background should validate`).toBe(true)
    }

    // Declaring one `type` but supplying another kind's fields is rejected: a
    // `color` background carrying an image `asset` but no `value` fails.
    const wrongShape = validateWithBackground({ type: 'color', asset: IMAGE_ASSET })
    expect(wrongShape.ok).toBe(false)
  })

  // ── AC-476: an optional legibility overlay (hex color + 0..1 opacity) ──
  it('test_UAT_AC476_background_may_carry_optional_overlay', () => {
    // A well-formed overlay validates.
    const withOverlay = validateWithBackground({
      type: 'color',
      value: '#123456',
      overlay: { color: '#000000', opacity: 0.4 },
    })
    expect(withOverlay.ok, 'background with a valid overlay should validate').toBe(true)

    // The overlay is optional: the same background without one is equally valid.
    const withoutOverlay = validateWithBackground({ type: 'color', value: '#123456' })
    expect(withoutOverlay.ok, 'background without an overlay should validate').toBe(true)
  })

  // ── AC-477: malformed overlay values rejected with a field-pointed path ──
  it('test_UAT_AC477_malformed_background_rejected_with_field_path', () => {
    // A non-hex overlay color: the error path targets the overlay colour field.
    const badColor = validateWithBackground({
      type: 'color',
      value: '#123456',
      overlay: { color: 'black', opacity: 0.4 },
    })
    expect(badColor.ok).toBe(false)
    if (!badColor.ok) {
      expect(badColor.errors.some((e) => e.path === `${BG_PATH}/overlay/color`)).toBe(true)
    }

    // An opacity outside 0..1: the error path targets the overlay opacity field.
    const badOpacity = validateWithBackground({
      type: 'color',
      value: '#123456',
      overlay: { color: '#000000', opacity: 1.5 },
    })
    expect(badOpacity.ok).toBe(false)
    if (!badOpacity.ok) {
      expect(badOpacity.errors.some((e) => e.path === `${BG_PATH}/overlay/opacity`)).toBe(true)
    }
  })
})

// ── AC-478 / AC-479: background layer rendering (framework API) ──

describe('reconciliation: section background rendering (story-6af935e7)', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>

  beforeEach(async () => {
    container ??= await AstroContainer.create()
  })

  it('test_UAT_AC478_image_background_renders_three_stacked_layers', async () => {
    const heroHtml = await container.renderToString(Hero, {
      props: { variant: 'bg-color', dials: {}, content: { heading: 'Over the image' } },
    })
    const wrapped = wrapWithBackground(heroHtml, {
      type: 'image',
      asset: IMAGE_ASSET,
      overlay: { color: '#000000', opacity: 0.45 },
    })

    // (1) A background layer that references the declared image asset.
    expect(wrapped).toContain('fc-bg-section__layer')
    expect(wrapped).toContain("url('/assets/hero.jpg')")
    // (2) An overlay layer whose opacity matches the declared value.
    expect(wrapped).toMatch(/fc-bg-section__overlay[^>]+opacity: 0\.45/)
    // (3) A content layer containing the module's own text.
    expect(wrapped).toContain('fc-bg-section__content')
    expect(wrapped).toContain('Over the image')

    // Back-to-front DOM order: background, then overlay, then content — so the
    // text sits above both the image and the overlay tint.
    const layerIdx = wrapped.indexOf('fc-bg-section__layer')
    const overlayIdx = wrapped.indexOf('fc-bg-section__overlay')
    const contentIdx = wrapped.indexOf('fc-bg-section__content')
    expect(layerIdx).toBeLessThan(overlayIdx)
    expect(overlayIdx).toBeLessThan(contentIdx)
  })

  it('test_UAT_AC479_color_and_gradient_render_fill_no_overlay_when_none', () => {
    // A color background paints the declared colour as a solid fill.
    const color = renderBackgroundLayers({ type: 'color', value: '#0a0a0a' })
    expect(color).toContain('background-color: #0a0a0a')
    // No overlay declared → no overlay layer is present in the output.
    expect(color).not.toContain('fc-bg-section__overlay')

    // A gradient background paints the declared gradient.
    const gradient = renderBackgroundLayers({
      type: 'gradient',
      gradient: 'radial-gradient(circle, #111, #222)',
    })
    expect(gradient).toContain('background-image: radial-gradient(circle, #111, #222)')
    expect(gradient).not.toContain('fc-bg-section__overlay')
  })
})

// ── AC-480 / AC-481: section scoping + structural CSS via a full 1c render ──

describe('reconciliation: section background render pipeline (story-6af935e7)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac-bg-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  /** Scaffold a site, give only the hero a background, render it, return output. */
  async function renderWithHeroBackground(): Promise<{ html: string; themeCss: string }> {
    cmdNew('acme', { cwd })

    const pagePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    // The starter page carries several modules (header, hero, footer); only the
    // hero declares a background so scoping is observable.
    expect(page.modules.length).toBeGreaterThan(1)
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.background = { type: 'color', value: '#abcdef', overlay: { color: '#000000', opacity: 0.3 } }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates through the store's load boundary.
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(loaded.ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    return {
      html: readFileSync(path.join(outDir, 'index.html'), 'utf8'),
      themeCss: readFileSync(path.join(outDir, 'theme.css'), 'utf8'),
    }
  }

  it('test_UAT_AC480_background_is_section_scoped', async () => {
    const { html } = await renderWithHeroBackground()

    // Exactly one section wrapper: the background is scoped to the hero, not
    // applied to every module — the header/footer render unwrapped.
    const wrapperCount = (html.match(/class="fc-bg-section"/g) ?? []).length
    expect(wrapperCount).toBe(1)
    // The declared background value appears in the rendered output.
    expect(html).toContain('background-color: #abcdef')
  })

  it('test_UAT_AC481_structural_layer_css_in_stylesheet', async () => {
    const { themeCss } = await renderWithHeroBackground()

    // The static layering rules are folded into the per-site stylesheet rather
    // than repeated inline: the content-layer positioning rule is present.
    expect(themeCss).toContain('.fc-bg-section__content')
    expect(themeCss).toMatch(/\.fc-bg-section__content\s*\{[^}]*z-index:\s*2/)
  })
})
