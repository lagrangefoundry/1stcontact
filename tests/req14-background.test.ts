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
 * UATs for REQ-14 — section-level background capability.
 *
 * Two entry points under test: the public `validateSite` from
 * `@1stcontact/site-schema` (the Background contract) and the framework's
 * background rendering (`wrapWithBackground` / `renderBackgroundLayers`), plus
 * an end-to-end render through the `1c` CLI to prove scoping. Nothing is
 * mocked; module HTML is produced through the same Astro container path
 * `tools/generate` uses.
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

const IMAGE_ASSET = { id: 'bg', src: '/assets/hero.jpg', alt: 'Kitchen' }

describe('REQ-14 — Background schema (validateSite)', () => {
  it('test_UAT_FC_REQ-14_schema_accepts_background', () => {
    // color / image / gradient — each with an overlay — all validate.
    const variants = [
      { type: 'color', value: '#123456', overlay: { color: '#000000', opacity: 0.4 } },
      { type: 'image', asset: IMAGE_ASSET, fit: 'cover', overlay: { color: '#000000', opacity: 0.5 } },
      {
        type: 'gradient',
        gradient: 'linear-gradient(180deg, #000, #fff)',
        overlay: { color: '#ffffff', opacity: 0.2 },
      },
    ]
    for (const background of variants) {
      const site = minimalSite()
      site.pages[0].modules[0].background = background
      const result = validateSite(site)
      expect(result.ok, `${background.type} background should validate`).toBe(true)
    }

    // Malformed: a non-hex overlay color is rejected with a path-pointed error.
    const badHex = minimalSite()
    badHex.pages[0].modules[0].background = {
      type: 'color',
      value: '#123456',
      overlay: { color: 'black', opacity: 0.4 },
    }
    const badHexResult = validateSite(badHex)
    expect(badHexResult.ok).toBe(false)
    if (!badHexResult.ok) {
      expect(
        badHexResult.errors.some(
          (e) => e.path === '/pages/0/modules/0/background/overlay/color',
        ),
      ).toBe(true)
    }

    // Malformed: opacity > 1 is rejected with a path-pointed error.
    const badOpacity = minimalSite()
    badOpacity.pages[0].modules[0].background = {
      type: 'color',
      value: '#123456',
      overlay: { color: '#000000', opacity: 1.5 },
    }
    const badOpacityResult = validateSite(badOpacity)
    expect(badOpacityResult.ok).toBe(false)
    if (!badOpacityResult.ok) {
      expect(
        badOpacityResult.errors.some(
          (e) => e.path === '/pages/0/modules/0/background/overlay/opacity',
        ),
      ).toBe(true)
    }
  })
})

describe('REQ-14 — Background rendering', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>

  beforeEach(async () => {
    container ??= await AstroContainer.create()
  })

  it('test_UAT_FC_REQ-14_renders_text_over_image', async () => {
    const heroHtml = await container.renderToString(Hero, {
      props: { variant: 'bg-color', dials: {}, content: { heading: 'Over the image' } },
    })
    const wrapped = wrapWithBackground(heroHtml, {
      type: 'image',
      asset: IMAGE_ASSET,
      overlay: { color: '#000000', opacity: 0.45 },
    })

    // The image layer references the asset via a background-image.
    expect(wrapped).toContain('fc-bg-section__layer')
    expect(wrapped).toContain("url('/assets/hero.jpg')")
    // The overlay carries the tint.
    expect(wrapped).toMatch(/fc-bg-section__overlay[^>]+opacity: 0\.45/)
    // The heading renders inside the content layer, above the background.
    expect(wrapped).toContain('fc-bg-section__content')
    expect(wrapped).toContain('Over the image')

    // Layer order in the DOM: background, then overlay, then content — the
    // overlay sits between the image and the text.
    const layerIdx = wrapped.indexOf('fc-bg-section__layer')
    const overlayIdx = wrapped.indexOf('fc-bg-section__overlay')
    const contentIdx = wrapped.indexOf('fc-bg-section__content')
    expect(layerIdx).toBeLessThan(overlayIdx)
    expect(overlayIdx).toBeLessThan(contentIdx)
  })

  it('test_UAT_FC_REQ-14_color_and_gradient_variants', () => {
    const color = renderBackgroundLayers({ type: 'color', value: '#0a0a0a' })
    expect(color).toContain('background-color: #0a0a0a')
    // No overlay requested → no overlay layer emitted.
    expect(color).not.toContain('fc-bg-section__overlay')

    const gradient = renderBackgroundLayers({
      type: 'gradient',
      gradient: 'radial-gradient(circle, #111, #222)',
    })
    expect(gradient).toContain('background-image: radial-gradient(circle, #111, #222)')
  })
})

describe('REQ-14 — Background is section-scoped (1c render)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req14-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-14_background_is_scoped', async () => {
    cmdNew('acme', { cwd })

    // Add a background to the hero only; the header/footer have none.
    const pagePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.background = { type: 'color', value: '#abcdef', overlay: { color: '#000000', opacity: 0.3 } }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates.
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(loaded.ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Exactly one section wrapper — the background is scoped to the hero, not
    // applied globally to every module.
    const wrapperCount = (html.match(/class="fc-bg-section"/g) ?? []).length
    expect(wrapperCount).toBe(1)
    expect(html).toContain('background-color: #abcdef')

    // The structural section CSS reached the per-site stylesheet.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('.fc-bg-section__content')
  })
})
