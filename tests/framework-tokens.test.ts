import { describe, it, expect, expectTypeOf } from 'vitest'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens/index'
import { registry, getModule } from '../packages/framework/src/modules/registry'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import type { CapabilityMeta } from '../packages/framework/src/modules/capability'

/**
 * UATs for REQ-4 — @1stcontact/framework theme tokens + module registry.
 *
 * The theme-CSS generator and registry are pure functions of their inputs;
 * these tests exercise them directly. Module rendering UATs (Astro container)
 * live in framework-modules.test.ts.
 */

/** Extract the declarations inside the `:root { ... }` block. */
function rootBlock(css: string): string {
  const m = css.match(/:root\s*\{([\s\S]*?)\}/)
  return m ? m[1] : ''
}

describe('@1stcontact/framework theme tokens', () => {
  it('test_UAT_FC_REQ-4_generate_css_produces_root_custom_properties', () => {
    const css = generateThemeCss(defaultTokens)
    expect(css).toContain(':root {')
    // One representative variable per token group, with the deterministic names.
    for (const name of [
      '--color-bg',
      '--color-surface-subtle',
      '--color-surface-inverse',
      '--color-text',
      '--font-family-heading',
      '--font-family-display',
      '--font-size-5xl',
      '--font-weight-bold',
      '--line-height-normal',
      '--space-4',
      '--space-24',
      '--radius-md',
      '--shadow-lg',
      '--container-6xl',
      '--breakpoint-md',
    ]) {
      expect(css, `missing ${name}`).toContain(`${name}:`)
    }
    // The full token surface is 80 custom properties. Prior additions: REQ-24
    // --font-family-display; REQ-20 --color-secondary; REQ-32 --color-neutral-cool
    // + (cap 5) --shadow-xl; REQ-33 --color-accent-light + --color-accent-deep;
    // REQ-45 the three --tracking-* steps; REQ-49 --font-weight-light,
    // --line-height-snug, --space-32/48/64/80; REQ-36 --color-scrim,
    // --font-weight-extralight, --font-family-label. REQ-55 replaced the six
    // idiosyncratic --container-* keys (xnarrow/narrow/readable/default/wide/bleed)
    // with the eleven-step Tailwind max-w scale (sm..7xl + bleed): a net +5.
    // REQ-56 added the component subscale surface: --subscale-badge-* and
    // --subscale-checklist-* (font-size/font-weight/line-height/letter-spacing
    // each), a net +8. REQ-20/REQ-36 --color-accent-mid backs the footer
    // `accent-muted` surface + a warm-gradient mid stop: a net +1.
    const declCount = (rootBlock(css).match(/--[a-z0-9-]+:/g) ?? []).length
    expect(declCount).toBe(89)
  })

  it('test_UAT_FC_REQ-4_generate_css_substitutes_defaults_for_missing_slots', () => {
    // Only one slot supplied; every other slot must be filled from defaults.
    const css = generateThemeCss({ palette: { primary: '#ff0000' } })
    expect(css).toContain('--color-primary: #ff0000;') // the override
    expect(css).toContain('--color-bg: #ffffff;') // default-filled palette slot
    expect(css).toContain('--space-4: 1rem;') // default-filled non-palette slot
    expect((rootBlock(css).match(/--[a-z0-9-]+:/g) ?? []).length).toBe(89)
  })

  it('test_UAT_FC_REQ-4_generate_css_emits_dark_mode_block_when_dark_palette_provided', () => {
    const css = generateThemeCss(defaultTokens, {
      dark: { bg: '#000000', text: '#ffffff' },
    })
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    const darkBlock = css.slice(css.indexOf('@media'))
    expect(darkBlock).toContain('--color-bg: #000000;')
    expect(darkBlock).toContain('--color-text: #ffffff;')
    // No dark block when no dark palette is supplied.
    expect(generateThemeCss(defaultTokens)).not.toContain('@media')
  })
})

describe('@1stcontact/framework module registry', () => {
  it('test_UAT_FC_REQ-4_registry_resolves_known_module', () => {
    const def = getModule('carousel', 2)
    expect(def.meta.id).toBe('carousel')
    expect(def.meta.version).toBe(2)
    expect(def.Component).toBeTypeOf('function')
  })

  it('test_UAT_FC_REQ-4_registry_throws_on_unknown_module', () => {
    expect(() => getModule('nope', 1)).toThrow(/not found in catalog/i)
    // A real module at the wrong version is also a catalog miss.
    expect(() => getModule('carousel', 99)).toThrow(/catalog/i)
  })

  it('test_UAT_FC_REQ-4_every_module_exports_capability_meta', () => {
    // Compile-time: each meta satisfies the CapabilityMeta contract (REQ-85).
    // Post-pivot the catalog holds only the two surviving capability modules.
    expectTypeOf(carouselMeta).toMatchTypeOf<CapabilityMeta>()
    expectTypeOf(contactFormMeta).toMatchTypeOf<CapabilityMeta>()

    // Runtime: every registered module exposes the full capability contract.
    expect(registry.size).toBe(2)
    for (const def of registry.values()) {
      const meta = def.meta
      expect(typeof meta.id).toBe('string')
      expect(typeof meta.version).toBe('number')
      expect(meta.kind).toBe('capability')
      // Behavioural config + named L1 slots, no aesthetic dials.
      expect(typeof meta.config).toBe('object')
      expect(typeof meta.slots).toBe('object')
      expect(Object.keys(meta.slots).length).toBeGreaterThan(0)
      // Conformance obligations include the universal ACs + isolation.
      expect(meta.conformance.obligations).toContain('isolation')
    }
  })
})
