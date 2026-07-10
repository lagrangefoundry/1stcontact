import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { defaultTokens, generateThemeCss } from '../packages/framework/src/tokens/index'
import { getModuleCss } from '../packages/framework/src/modules/styles'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import { validateSite } from '../packages/site-schema/src/index'
import Header from '../packages/framework/src/modules/header/index.astro'
import Hero from '../packages/framework/src/modules/hero/index.astro'

/**
 * Reconciliation UATs for story-a224111f — the BUNDLE-4 additions (REQ-45
 * last-mile typography-fidelity dials) to the token-driven theme CSS + chrome
 * catalog. One UAT per acceptance criterion, asserting against the existing
 * implementation at its external boundaries: the `generateThemeCss` generator,
 * the `validateSite` schema entry point, the SSR-rendered chrome markup (via
 * Astro's container API — the same render path tools/generate uses), the module
 * contract metadata (`heroMeta` / `headerMeta`), and the folded module
 * component CSS (`getModuleCss`) that backs the emitted class hooks.
 *
 * The 12 REQ-4 baseline ACs (AC-433..444) are covered by
 * `reconciliation-framework-theme-modules.test.ts`, the 4 BUNDLE-2 ACs
 * (AC-498..501) by `reconciliation-framework-theme-modules-bundle2.test.ts`,
 * and the 6 BUNDLE-3 ACs (AC-502..507) by
 * `reconciliation-framework-theme-modules-bundle3.test.ts`; this file adds the
 * three ACs the BUNDLE-4 (REQ-45) upgrade introduced:
 *   AC-561 — hero heading + header wordmark token-backed `tracking` dial
 *   AC-562 — theme CSS `--tracking-*` letter-spacing tokens, backfilled
 *   AC-563 — hero `subheadLeading` dial (independent subhead line-height)
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(
  Component: Parameters<Container['renderToString']>[0],
  props: unknown,
): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component, { props: props as Record<string, unknown> })
}

/** Minimal valid site whose theme omits the REQ-45 `tracking` group (AC-562). */
function siteWithoutTracking() {
  return {
    id: 'site-min',
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
        // NOTE: no `tracking` group — proves the schema `.default()` backfills it.
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
            variant: 'centered',
            dials: {},
            content: { heading: 'Welcome' },
          },
        ],
      },
    ],
  }
}

describe('story-a224111f (BUNDLE-4) — hero heading + header wordmark tracking dial (REQ-45)', () => {
  it('test_UAT_AC561_hero_and_header_expose_token_backed_tracking_dial', async () => {
    const css = getModuleCss()

    // --- Hero heading ---------------------------------------------------------
    // `tight` / `tighter` carry a hook that resolves to a token-backed override.
    const heroTight = await render(Hero, {
      variant: 'bg-color',
      dials: { tracking: 'tight' },
      content: { heading: 'Intentional Software', subhead: 'Lead.' },
    })
    expect(heroTight).toMatch(/class="[^"]*hero__heading[^"]*tracking-tight/)
    expect(css).toMatch(
      /\.hero__heading\.tracking-tight\s*\{[^}]*letter-spacing:\s*var\(--tracking-tight\)/,
    )

    const heroTighter = await render(Hero, {
      variant: 'bg-color',
      dials: { tracking: 'tighter' },
      content: { heading: 'Intentional Software', subhead: 'Lead.' },
    })
    expect(heroTighter).toMatch(/class="[^"]*hero__heading[^"]*tracking-tighter/)
    expect(css).toMatch(
      /\.hero__heading\.tracking-tighter\s*\{[^}]*letter-spacing:\s*var\(--tracking-tighter\)/,
    )

    // `normal` (and the omitted-dial default) emits no letter-spacing override —
    // the hook class is present but no `.tracking-normal` rule exists, so the
    // heading is left untracked.
    const heroNormal = await render(Hero, {
      variant: 'bg-color',
      dials: { tracking: 'normal' },
      content: { heading: 'Acme', subhead: 'Lead.' },
    })
    expect(heroNormal).toContain('tracking-normal')
    const heroDefault = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Acme', subhead: 'Lead.' },
    })
    expect(heroDefault).toContain('tracking-normal')
    expect(heroDefault).not.toContain('tracking-tight')
    expect(css).not.toMatch(/\.hero__heading\.tracking-normal\s*\{/)

    // --- Header wordmark ------------------------------------------------------
    const wordmarkTight = await render(Header, {
      variant: 'top-nav',
      dials: { tracking: 'tight' },
      content: { logo: 'GigabyteAlchemy', entries: [] },
    })
    expect(wordmarkTight).toContain('header__wordmark--tracking-tight')
    expect(css).toMatch(
      /\.header__wordmark--tracking-tight\s*\{[^}]*letter-spacing:\s*var\(--tracking-tight\)/,
    )

    const wordmarkTighter = await render(Header, {
      variant: 'top-nav',
      dials: { tracking: 'tighter' },
      content: { logo: 'GigabyteAlchemy', entries: [] },
    })
    expect(wordmarkTighter).toContain('header__wordmark--tracking-tighter')
    expect(css).toMatch(
      /\.header__wordmark--tracking-tighter\s*\{[^}]*letter-spacing:\s*var\(--tracking-tighter\)/,
    )

    // `normal` / omitted leaves the wordmark untracked (no override rule), so a
    // display face keeps the tracking of its own font rules.
    const wordmarkDefault = await render(Header, {
      variant: 'top-nav',
      content: { logo: 'GigabyteAlchemy', entries: [] },
    })
    expect(wordmarkDefault).toContain('header__wordmark--tracking-normal')
    expect(css).not.toMatch(/\.header__wordmark--tracking-normal\s*\{/)

    // The tighter override wins over the display face's built-in tracking: the
    // `--tracking-*` rules are declared after the `--font-display` rules in the
    // folded CSS (source order → later rule wins the specificity tie).
    const displayIdx = css.indexOf('.header__wordmark--font-display')
    const trackingIdx = css.indexOf('.header__wordmark--tracking-tight')
    expect(displayIdx).toBeGreaterThanOrEqual(0)
    expect(trackingIdx).toBeGreaterThan(displayIdx)

    // The dial is inert on an image logo — an image logo renders no wordmark
    // span at all, so no tracking hook is emitted.
    const imageLogo = await render(Header, {
      variant: 'top-nav',
      dials: { tracking: 'tighter' },
      content: { logo: { id: 'l', src: 'assets/logo.png', alt: 'Acme' }, entries: [] },
    })
    expect(imageLogo).toContain('<img')
    expect(imageLogo).not.toContain('header__wordmark')

    // The module contracts advertise `tracking` with its finite value set.
    expect(heroMeta.dials.tracking).toEqual(['normal', 'tight', 'tighter'])
    expect(headerMeta.dials.tracking).toEqual(['normal', 'tight', 'tighter'])
  })
})

describe('story-a224111f (BUNDLE-4) — theme CSS --tracking-* tokens (REQ-45)', () => {
  it('test_UAT_AC562_theme_css_emits_tracking_tokens_backfilled_for_old_themes', () => {
    // A full token set declares the three `--tracking-*` custom properties on
    // `:root` with the default em values.
    const full = generateThemeCss(defaultTokens)
    const root = full.slice(full.indexOf(':root'))
    expect(root).toContain('--tracking-normal: 0em;')
    expect(root).toContain('--tracking-tight: -0.025em;')
    expect(root).toContain('--tracking-tighter: -0.05em;')

    // Because the group post-dates earlier themes, a partial token set that omits
    // the `tracking` group still emits all three properties (framework default
    // fill) — the token surface always covers `--tracking-*`.
    const partial = generateThemeCss({ palette: { primary: '#123456' } })
    expect(partial).toContain('--tracking-normal: 0em;')
    expect(partial).toContain('--tracking-tight: -0.025em;')
    expect(partial).toContain('--tracking-tighter: -0.05em;')

    // A site theme that omits the `tracking` typography group still VALIDATES
    // through the site-schema contract (a `.default()`, not `.optional()`), and
    // the resolved theme carries the backfilled group — so the token stays
    // required and the emitter never sees an undefined group.
    const result = validateSite(siteWithoutTracking())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.theme.typography.tracking).toEqual({
        normal: '0em',
        tight: '-0.025em',
        tighter: '-0.05em',
      })
    }

    // Repeated generation with the same input is byte-identical (deterministic).
    expect(generateThemeCss({ palette: { primary: '#123456' } })).toEqual(partial)
    expect(generateThemeCss(defaultTokens)).toEqual(full)
  })
})

describe('story-a224111f (BUNDLE-4) — hero subheadLeading dial (REQ-45)', () => {
  it('test_UAT_AC563_hero_subhead_leading_sets_line_height_independently', async () => {
    const css = getModuleCss()

    // Each `subheadLeading` value maps the subhead to the matching line-height
    // token — the value is always a token, never a raw value.
    const tight = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadLeading: 'tight' },
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(tight).toContain('subhead-leading-tight')
    expect(css).toMatch(
      /\.hero\.subhead-leading-tight\s+\.hero__subhead\s*\{[^}]*line-height:\s*var\(--line-height-tight\)/,
    )

    const normal = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadLeading: 'normal' },
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(normal).toContain('subhead-leading-normal')
    expect(css).toMatch(
      /\.hero\.subhead-leading-normal\s+\.hero__subhead\s*\{[^}]*line-height:\s*var\(--line-height-normal\)/,
    )

    const relaxed = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadLeading: 'relaxed' },
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(relaxed).toContain('subhead-leading-relaxed')
    expect(css).toMatch(
      /\.hero\.subhead-leading-relaxed\s+\.hero__subhead\s*\{[^}]*line-height:\s*var\(--line-height-relaxed\)/,
    )

    // The omitted-dial default is `relaxed`, reproducing the prior fixed subhead
    // leading — a hero that omits the dial is unchanged.
    const omitted = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'H', subhead: 'Lead.' },
    })
    expect(omitted).toContain('subhead-leading-relaxed')
    expect(omitted).not.toContain('subhead-leading-normal')
    expect(omitted).not.toContain('subhead-leading-tight')

    // The module contract advertises `subheadLeading` with its finite value set.
    expect(heroMeta.dials.subheadLeading).toEqual(['tight', 'normal', 'relaxed'])
  })
})
