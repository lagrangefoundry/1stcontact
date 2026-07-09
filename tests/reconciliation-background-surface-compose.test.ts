import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * Reconciliation UATs for story-6af935e7 — the background × surface composition
 * precedence rule ("background paints, surface contracts"). These are the two
 * ACs this bundle's upgrade adds to the section-background story; AC-475..481
 * (the Background schema + three-layer rendering + section scoping) are covered
 * by `reconciliation-req14-background.test.ts`.
 *
 *  - AC-515: a section that declares BOTH a `background` and a `surface` dial —
 *    the background layer supplies the paint, the surface supplies only the
 *    text-colour contract (never a competing fill); no raw CSS required.
 *  - AC-516: a surface-only band (no `background`) is a strict no-change — its
 *    surface-derived fill paints normally; the precedence rule only ever fires
 *    when a background wrapper is present.
 *
 * Both assert at the `1c` render boundary: the CLI builds the site through the
 * same Astro container path `tools/generate` uses, and we read the emitted
 * `index.html` and per-site `theme.css`. Nothing internal is mocked; only the
 * filesystem is isolated to a temp dir.
 */

describe('reconciliation: background × surface composition (story-6af935e7)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac-bg-surface-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  /** Path to the scaffolded draft's home page JSON. */
  function homePagePath(): string {
    return path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
  }

  /** Mutate the scaffolded hero via `mutate`, re-validate, render, return output. */
  async function renderWithHero(
    mutate: (hero: Record<string, any>) => void,
  ): Promise<{ html: string; themeCss: string }> {
    cmdNew('acme', { cwd })

    const pagePath = homePagePath()
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    mutate(hero)
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates through the store's load boundary — the
    // composition is expressed with structured values alone, no raw CSS.
    const loaded = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(loaded.ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    return {
      html: readFileSync(path.join(outDir, 'index.html'), 'utf8'),
      themeCss: readFileSync(path.join(outDir, 'theme.css'), 'utf8'),
    }
  }

  // ── AC-515: background + surface compose — background paints, surface contracts ──
  it('test_UAT_AC515_background_paints_surface_contracts', async () => {
    // A hero that declares BOTH an image background and an inverse surface dial.
    const { html, themeCss } = await renderWithHero((hero) => {
      hero.dials = { ...(hero.dials ?? {}), surface: 'inverse' }
      hero.background = {
        type: 'image',
        asset: { id: 'lab', src: '/assets/lab.jpg', alt: 'Lab' },
        overlay: { color: '#000000', opacity: 0.35 },
      }
    })

    // Both live in one section: the surface-inverse text contract on the band
    // AND the background image layer that must show through beneath it.
    expect(html).toContain('surface-inverse')
    expect(html).toContain("url('/assets/lab.jpg')")

    // The precedence rule reached the stylesheet AND is emitted AFTER the
    // module's `.hero.surface-inverse` rule, so it wins the (0,2,0) tie and
    // suppresses only the band's OWN fill — the background is no longer inert.
    const precedence = '.fc-bg-section > .fc-bg-section__content > *'
    expect(themeCss).toContain(precedence)
    const surfaceRuleIdx = themeCss.indexOf('.hero.surface-inverse')
    const precedenceIdx = themeCss.indexOf(precedence)
    expect(surfaceRuleIdx).toBeGreaterThan(-1)
    expect(precedenceIdx).toBeGreaterThan(surfaceRuleIdx)

    // The precedence rule neutralises only the fill, never the text colour.
    const ruleBody = themeCss.slice(precedenceIdx, themeCss.indexOf('}', precedenceIdx))
    expect(ruleBody).toContain('background-color: transparent')
    expect(ruleBody).not.toMatch(/[^-]color:/)

    // The surface-inverse `color` contract (light text over the imagery) survives.
    expect(themeCss).toMatch(/\.hero\.surface-inverse\s*\{[^}]*color:/)
  })

  // ── AC-516: surface-only bands (no background) are unaffected ──
  it('test_UAT_AC516_surface_only_band_fill_unaffected', async () => {
    // A hero with an inverse surface dial and NO background at all.
    const { html, themeCss } = await renderWithHero((hero) => {
      hero.dials = { ...(hero.dials ?? {}), surface: 'inverse' }
      delete hero.background
    })

    // No background is declared, so the band is never wrapped — the precedence
    // rule (which only ever matches inside a `.fc-bg-section` wrapper) cannot
    // fire, and the module renders exactly as it would with no background feature.
    expect(html).toContain('surface-inverse')
    expect(html).not.toContain('fc-bg-section')

    // The surface-derived fill paints normally — its `background` is NOT
    // suppressed — and the text-colour contract is applied, strict no-change
    // from prior behaviour.
    expect(themeCss).toMatch(
      /\.hero\.surface-inverse\s*\{[^}]*background:\s*var\(--color-surface-inverse\)/,
    )
    expect(themeCss).toMatch(/\.hero\.surface-inverse\s*\{[^}]*color:\s*var\(--color-bg\)/)
  })
})
