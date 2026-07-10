import { describe, it, expect, expectTypeOf } from 'vitest'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens/index'
import { registry, getModule } from '../packages/framework/src/modules/registry'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { footerMeta } from '../packages/framework/src/modules/footer/meta'
import { textBlockMeta } from '../packages/framework/src/modules/text-block/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { layerMeta } from '../packages/framework/src/modules/layer/meta'
import type { ModuleMeta } from '../packages/framework/src/modules/types'

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
      '--container-default',
      '--breakpoint-md',
    ]) {
      expect(css, `missing ${name}`).toContain(`${name}:`)
    }
    // The full token surface is 73 custom properties (REQ-24 added
    // --font-family-display; REQ-20 added --color-secondary; REQ-32 added
    // --color-neutral-cool and, in cap 5, --shadow-xl; REQ-33 added
    // --color-accent-light + --color-accent-deep; REQ-45 added the three
    // --tracking-* steps; REQ-49 added --font-weight-light, --line-height-snug,
    // the four large spacing steps --space-32/48/64/80, and --container-readable;
    // REQ-36 added --color-scrim (hero scrim tint) and --font-weight-extralight (200, section-heading weight),
    // and --font-family-label (the button/label face, e.g. Raleway).
    const declCount = (rootBlock(css).match(/--[a-z0-9-]+:/g) ?? []).length
    expect(declCount).toBe(74)
  })

  it('test_UAT_FC_REQ-4_generate_css_substitutes_defaults_for_missing_slots', () => {
    // Only one slot supplied; every other slot must be filled from defaults.
    const css = generateThemeCss({ palette: { primary: '#ff0000' } })
    expect(css).toContain('--color-primary: #ff0000;') // the override
    expect(css).toContain('--color-bg: #ffffff;') // default-filled palette slot
    expect(css).toContain('--space-4: 1rem;') // default-filled non-palette slot
    expect((rootBlock(css).match(/--[a-z0-9-]+:/g) ?? []).length).toBe(74)
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
    const def = getModule('hero', 1)
    expect(def.meta.id).toBe('hero')
    expect(def.meta.version).toBe(1)
    expect(def.Component).toBeTypeOf('function')
  })

  it('test_UAT_FC_REQ-4_registry_throws_on_unknown_module', () => {
    expect(() => getModule('nope', 1)).toThrow(/not found in catalog/i)
    // A real module at the wrong version is also a catalog miss.
    expect(() => getModule('hero', 99)).toThrow(/catalog/i)
  })

  it('test_UAT_FC_REQ-4_every_module_exports_module_meta', () => {
    // Compile-time: each meta satisfies the ModuleMeta contract (DOC-7 §3.1).
    // Re-exercised against REQ-5's three content modules — they all conform.
    expectTypeOf(headerMeta).toMatchTypeOf<ModuleMeta>()
    expectTypeOf(heroMeta).toMatchTypeOf<ModuleMeta>()
    expectTypeOf(footerMeta).toMatchTypeOf<ModuleMeta>()
    expectTypeOf(textBlockMeta).toMatchTypeOf<ModuleMeta>()
    expectTypeOf(servicesGridMeta).toMatchTypeOf<ModuleMeta>()
    expectTypeOf(contactFormMeta).toMatchTypeOf<ModuleMeta>()
    expectTypeOf(layerMeta).toMatchTypeOf<ModuleMeta>()

    // Runtime: every registered module exposes the full contract shape.
    // 7 modules: the REQ-4/5 six plus REQ-15's `layer` host.
    expect(registry.size).toBe(7)
    for (const def of registry.values()) {
      const meta = def.meta
      expect(typeof meta.id).toBe('string')
      expect(typeof meta.version).toBe('number')
      expect(Array.isArray(meta.variants)).toBe(true)
      expect(meta.variants.length).toBeGreaterThan(0)
      expect(typeof meta.dials).toBe('object')
      expect(typeof meta.contentSchema).toBe('object')
      // Every content field declares a type and a required flag.
      for (const spec of Object.values(meta.contentSchema)) {
        expect(typeof spec.type).toBe('string')
        expect(typeof spec.required).toBe('boolean')
      }
    }
  })
})
