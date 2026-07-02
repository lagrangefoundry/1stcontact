import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import {
  composeOverlayHeader,
  getModuleCss,
  headerMeta,
  OVERLAY_BAND_CSS,
} from '../packages/framework/src/index'
import Header from '../packages/framework/src/modules/header/index.astro'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * UATs for REQ-25 — header composited over the following section's image band.
 *
 * The capability is a render-pipeline compositing path expressed as a `header`
 * `overlay` variant: an overlay header is not its own band; the pipeline floats
 * it over the immediately-following module's band so the two share one image
 * band. Nothing is mocked — module HTML is produced through the same Astro
 * container path `tools/generate` uses, and the end-to-end assertions render a
 * real site through the `1c` CLI.
 */

describe('REQ-25 — overlay header variant (structured, no raw CSS)', () => {
  it('test_UAT_FC_REQ-25_overlay_is_a_registered_header_variant', () => {
    // The variant is expressed through the module model, so validation accepts
    // it — not a per-site hack. `top-nav` remains valid.
    expect(headerMeta.variants).toContain('overlay')
    expect(headerMeta.variants).toContain('top-nav')
  })

  it('test_UAT_FC_REQ-25_overlay_variant_renders_transparent_chrome', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(Header, {
      props: {
        variant: 'overlay',
        // A `surface` dial still selects the text colour over the shared image.
        dials: { surface: 'inverse' },
        content: { logo: 'Acme', entries: [] },
      },
    })
    // The variant reaches the markup as a class the framework CSS keys off.
    expect(html).toContain('variant-overlay')

    // The transparent fill lives in framework component CSS (folded into the
    // per-site stylesheet), not in instance-supplied inline styles.
    const css = getModuleCss()
    expect(css).toMatch(/\.header\.variant-overlay\s*\{[^}]*background:\s*transparent/)
    expect(css).toMatch(/\.header\.variant-overlay\s*\{[^}]*border-bottom:\s*none/)
  })

  it('test_UAT_FC_REQ-25_composite_wrapper_is_class_based_not_raw_css', () => {
    // The compositing wrapper carries only framework class names — no
    // instance-supplied CSS reaches the page (DOC-7 §6.2 security line).
    const composed = composeOverlayHeader('<header>chrome</header>', '<section>band</section>')
    expect(composed).toContain('fc-overlay-band')
    expect(composed).toContain('fc-overlay-band__chrome')
    expect(composed).not.toContain('<style')
    expect(composed).not.toContain('style=')

    // The chrome sits inside the same positioning context as the band.
    const bandIdx = composed.indexOf('fc-overlay-band"')
    const chromeIdx = composed.indexOf('fc-overlay-band__chrome')
    const sectionIdx = composed.indexOf('<section>band</section>')
    expect(bandIdx).toBeGreaterThanOrEqual(0)
    expect(bandIdx).toBeLessThan(chromeIdx)
    expect(chromeIdx).toBeLessThan(sectionIdx)

    // The structural CSS is static (identical for every site).
    expect(OVERLAY_BAND_CSS).toContain('.fc-overlay-band__chrome')
    expect(OVERLAY_BAND_CSS).toContain('position: absolute')
  })
})

describe('REQ-25 — pipeline composites overlay header over the next band (1c render)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req25-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-25_header_and_hero_share_one_image_band', async () => {
    cmdNew('acme', { cwd })

    // Turn the header into overlay chrome and give the following hero a shared
    // background image — the REQ-20/gigabytealchemy shape in miniature.
    const pagePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const header = page.modules.find((m: { type: string }) => m.type === 'header')
    header.variant = 'overlay'
    header.dials = { surface: 'inverse' }
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.variant = 'bg-image'
    hero.dials = { size: 'lg', align: 'left', surface: 'inverse', spacingTop: 'xl' }
    hero.content.image = { id: 'band', src: 'assets/band.jpg', alt: 'Shared band' }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates through the public contract.
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(loaded.ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Exactly one shared band, wrapping the header chrome and the hero image.
    const bandCount = (html.match(/class="fc-overlay-band"/g) ?? []).length
    expect(bandCount).toBe(1)

    // The header renders as chrome *inside* the band, not as its own stacked
    // band above it, and the hero's background image is in that same band.
    const bandIdx = html.indexOf('class="fc-overlay-band"')
    const chromeIdx = html.indexOf('fc-overlay-band__chrome')
    expect(chromeIdx).toBeGreaterThan(bandIdx)
    expect(html).toContain('assets/band.jpg')
    // The shared image sits within the band wrapper, after the chrome.
    expect(html.slice(chromeIdx)).toContain('assets/band.jpg')

    // The structural band CSS reached the per-site stylesheet.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('.fc-overlay-band__chrome')
  })

  it('test_UAT_FC_REQ-25_non_overlay_header_stays_its_own_band', async () => {
    // The default `top-nav` header is unchanged — no compositing, no band
    // wrapper — so the capability is opt-in via the variant only.
    cmdNew('acme', { cwd })
    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).not.toContain('fc-overlay-band')
    expect(html).toContain('<header')
  })
})
