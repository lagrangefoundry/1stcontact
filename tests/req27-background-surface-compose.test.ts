import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SECTION_CSS, wrapWithBackground } from '../packages/framework/src/index'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * UATs for REQ-27 — `background` and `surface` compose in one section.
 *
 * Before the fix, a module's `surface-*` class set an opaque `background` on the
 * module's own `<section>`, which painted over the REQ-14 background layer and
 * made the background inert. The fix adds a structural precedence rule to
 * `SECTION_CSS`: when a background wrapper is present the band's own background
 * fill is suppressed (so the background paints) while the surface's `color` (the
 * text-contrast contract) is preserved.
 *
 * Nothing is mocked; the end-to-end case renders through the same `1c` CLI +
 * Astro container path `tools/generate` uses.
 */

describe('REQ-27 — background × surface compose (SECTION_CSS)', () => {
  it('test_UAT_FC_REQ-27_section_css_suppresses_band_fill_keeps_color', () => {
    // The structural precedence rule targets the wrapped band and neutralizes
    // only its own background — never its text color.
    expect(SECTION_CSS).toContain('.fc-bg-section > .fc-bg-section__content > *')
    expect(SECTION_CSS).toContain('background-color: transparent')
    expect(SECTION_CSS).toContain('background-image: none')

    // Crucially, the precedence rule must NOT set `color` — the surface-derived
    // text-color contract has to survive over the background.
    const ruleBody = SECTION_CSS.slice(
      SECTION_CSS.indexOf('.fc-bg-section > .fc-bg-section__content > *'),
    )
    // A standalone `color:` property (not the `-color` tail of `background-color`).
    expect(ruleBody).not.toMatch(/[^-]color:/)
  })

  it('test_UAT_FC_REQ-27_wrapped_band_is_direct_child_of_content', () => {
    // The suppression selector relies on the module band being a *direct* child
    // of `.fc-bg-section__content`. Lock that structural contract in: the module
    // markup sits immediately inside the content layer, with nothing between.
    const band = wrapWithBackground('<section class="hero surface-inverse">Hi</section>', {
      type: 'image',
      asset: { id: 'bg', src: '/assets/lab.jpg', alt: 'Lab' },
      overlay: { color: '#000000', opacity: 0.4 },
    })
    expect(band).toContain(
      '<div class="fc-bg-section__content"><section class="hero surface-inverse">',
    )
    // The background layer that must show through is present and behind content.
    expect(band).toContain("url('/assets/lab.jpg')")
    const layerIdx = band.indexOf('fc-bg-section__layer')
    const contentIdx = band.indexOf('fc-bg-section__content')
    expect(layerIdx).toBeLessThan(contentIdx)
  })
})

describe('REQ-27 — hero carries image background AND inverse text contract (1c render)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req27-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-27_hero_composes_background_with_inverse_surface', async () => {
    cmdNew('acme', { cwd })

    // The gigabytealchemy case: a hero band that wants BOTH an image background
    // and an inverse text-color contract at the same time.
    const pagePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.dials = { ...(hero.dials ?? {}), surface: 'inverse' }
    hero.background = {
      type: 'image',
      asset: { id: 'lab', src: '/assets/lab.jpg', alt: 'Lab' },
      overlay: { color: '#000000', opacity: 0.35 },
    }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates and renders.
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(loaded.ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')

    // The hero band carries BOTH the surface-inverse class (text contract) and a
    // background image layer (the paint) — they coexist in one section.
    expect(html).toContain('surface-inverse')
    expect(html).toContain("url('/assets/lab.jpg')")

    // The precedence rule reached the per-site stylesheet AND is emitted after
    // the module's `.hero.surface-inverse` rule, so it wins the (0,2,0) tie and
    // the band's own fill is suppressed — the background is no longer inert.
    const precedence = '.fc-bg-section > .fc-bg-section__content > *'
    expect(themeCss).toContain(precedence)
    const surfaceRuleIdx = themeCss.indexOf('.hero.surface-inverse')
    const precedenceIdx = themeCss.indexOf(precedence)
    expect(surfaceRuleIdx).toBeGreaterThan(-1)
    expect(precedenceIdx).toBeGreaterThan(surfaceRuleIdx)

    // The surface-inverse `color` contract (light text) is still declared — the
    // fix suppresses the fill, never the text color.
    expect(themeCss).toMatch(/\.hero\.surface-inverse\s*\{[^}]*color:/)
  })
})
