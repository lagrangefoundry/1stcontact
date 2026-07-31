import { describe, it, expect, expectTypeOf } from 'vitest'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens/index'
import { registry, getModule } from '../packages/framework/src/modules/registry'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import type { BehaviorMeta } from '../packages/framework/src/modules/behavior'

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
    // The full token surface is 74 custom properties. Prior additions: REQ-24
    // --font-family-display; REQ-32 (cap 5) --shadow-xl; REQ-45 the three
    // --tracking-* steps; REQ-49 --font-weight-light, --line-height-snug,
    // --space-32/48/64/80; REQ-36 --font-weight-extralight, --font-family-label.
    // REQ-55 replaced the six idiosyncratic --container-* keys
    // (xnarrow/narrow/readable/default/wide/bleed) with the eleven-step Tailwind
    // max-w scale (sm..7xl + bleed): a net +5. REQ-56 added the component
    // subscale surface: --subscale-badge-* and --subscale-checklist-*
    // (font-size/font-weight/line-height/letter-spacing each), a net +8.
    // REQ-114 retired the colour group outright — the closed 15-slot palette is
    // replaced by the arbitrary-size L1 palette (DOC-23 §5), which is site data
    // resolved to literals at load, not a token: a net -15.
    const declCount = (rootBlock(css).match(/--[a-z0-9-]+:/g) ?? []).length
    expect(declCount).toBe(74)
  })

  it('test_UAT_FC_REQ-4_generate_css_substitutes_defaults_for_missing_slots', () => {
    // Only one slot supplied; every other slot must be filled from defaults.
    const css = generateThemeCss({ spacing: { '4': '9rem' } })
    expect(css).toContain('--space-4: 9rem;') // the override
    expect(css).toContain('--space-8: 2rem;') // default-filled slot in the same group
    expect(css).toContain('--radius-md: 0.375rem;') // default-filled slot in another group
    expect((rootBlock(css).match(/--[a-z0-9-]+:/g) ?? []).length).toBe(74)
  })

  it('test_UAT_FC_REQ-114_theme_css_emits_no_colour_custom_property', () => {
    // REQ-114 AC-9 — the colour token group is retired, not merely unused: no
    // rendered stylesheet may emit a `--color-*` custom property, and nothing may
    // reference one. Colour reaches the page from the L1 document (its own
    // `background` / `textColor` and its nodes' typed colour axes), resolved
    // through the site palette — never through a token.
    const css = generateThemeCss(defaultTokens)
    expect(css).not.toMatch(/--color-/)

    // AC-10 — the dark-mode palette override went with the palette rather than
    // being ported forward. It had no callers; a later dark mode is designed
    // against the palette model, not resurrected from the closed token set.
    expect(css).not.toContain('@media')

    // AC-11 — the non-colour groups are untouched and still emit as before.
    for (const group of ['--font-family-', '--font-size-', '--space-', '--radius-', '--shadow-']) {
      expect(css, `missing ${group} group`).toContain(group)
    }
  })
})

describe('@1stcontact/framework module registry', () => {
  it('test_UAT_FC_REQ-4_registry_resolves_known_module', () => {
    const def = getModule('carousel', 3)
    expect(def.meta.id).toBe('carousel')
    expect(def.meta.version).toBe(3)
    expect(def.Component).toBeTypeOf('function')
  })

  it('test_UAT_FC_REQ-4_registry_throws_on_unknown_module', () => {
    expect(() => getModule('nope', 1)).toThrow(/not found in catalog/i)
    // A real module at the wrong version is also a catalog miss.
    expect(() => getModule('carousel', 99)).toThrow(/catalog/i)
  })

  it('test_UAT_FC_REQ-4_every_module_exports_capability_meta', () => {
    // Compile-time: each meta satisfies the BehaviorMeta contract (REQ-85).
    // Post-pivot the catalog holds only the two surviving capability modules.
    expectTypeOf(carouselMeta).toMatchTypeOf<BehaviorMeta>()
    expectTypeOf(contactFormMeta).toMatchTypeOf<BehaviorMeta>()

    // Runtime: every registered module exposes the full capability contract.
    expect(registry.size).toBe(2)
    for (const def of registry.values()) {
      const meta = def.meta
      expect(typeof meta.id).toBe('string')
      expect(typeof meta.version).toBe('number')
      expect(meta.kind).toBe('behavior')
      // Behavioural config + named L1 slots, no aesthetic dials.
      expect(typeof meta.config).toBe('object')
      expect(typeof meta.slots).toBe('object')
      expect(Object.keys(meta.slots).length).toBeGreaterThan(0)
      // Conformance obligations include the universal ACs + isolation.
      expect(meta.conformance.obligations).toContain('isolation')
    }
  })
})
