import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONTAINER_STEPS,
  CONTENT_WIDTH_DIAL,
  resolveContainerWidth,
  classifyLength,
  isLength,
} from '../packages/framework/src/modules/dials'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import type { ModuleMeta } from '../packages/framework/src/modules/types'
import { generateThemeCss } from '../packages/framework/src/tokens'

/**
 * UATs for REQ-55 — the `contentWidth`/`rowWidth` scale realigned to Tailwind's
 * `max-w` steps (so a real site lands on a named step) plus a literal escape hatch
 * for widths off the scale. The named layer resolves to the themeable
 * `--container-<step>` token; a literal (a `px` number, matching captured render
 * values, or a CSS length string) resolves straight through. The resolved length
 * is applied via an inline `--fc-content-width` custom property, replacing the
 * former per-name CSS classes.
 */

// ── REQ-58 length value model (absolute / token / relative / content) ────────
describe('REQ-58 length value model', () => {
  it('test_UAT_FC_REQ-58_classify_length_kinds', () => {
    // Absolute: bare number, px, and physical units (CSS defines them as fixed px
    // multiples, so on screen they are absolute — no separate inches/cm needed).
    expect(classifyLength(896)).toBe('absolute')
    expect(classifyLength('896px')).toBe('absolute')
    expect(classifyLength('1in')).toBe('absolute')
    // Token: the design overlay of constants.
    expect(classifyLength('4xl')).toBe('token')
    // Relative: container / viewport / font references — the responsive kinds.
    expect(classifyLength('50%')).toBe('relative')
    expect(classifyLength('50vw')).toBe('relative')
    expect(classifyLength('60ch')).toBe('relative')
    expect(classifyLength('20rem')).toBe('relative')
    // Content: sized to content (the shrink-to-content grid titles).
    expect(classifyLength('fit-content')).toBe('content')
    expect(classifyLength('max-content')).toBe('content')
    expect(classifyLength('bleed')).toBe('bleed')
    // Malformed → null (a typo fails loudly, not silent broken CSS).
    expect(classifyLength('fit-contnet')).toBeNull()
    expect(classifyLength('50xz')).toBeNull()
    expect(isLength('50%')).toBe(true)
    expect(isLength('nonsense')).toBe(false)
  })

  it('test_UAT_FC_REQ-58_length_field_validates_full_vocabulary', () => {
    // A `type: 'length'` content field accepts every kind and rejects a malformed
    // one — the size analogue of `type: 'color'`.
    const meta = {
      id: 'x',
      version: 1,
      variants: ['default'],
      dials: {},
      contentSchema: { width: { type: 'length', required: false } },
    } as unknown as ModuleMeta
    for (const ok of [896, '896px', '4xl', '50%', '50vw', 'fit-content', 'bleed']) {
      expect(validateModuleContent(meta, { width: ok })).toHaveLength(0)
    }
    const bad = validateModuleContent(meta, { width: 'fit-contnet' })
    expect(bad).toHaveLength(1)
    expect(bad[0].message).toMatch(/must be a length/)
  })
})

describe('REQ-55 named layer — Tailwind `max-w` scale', () => {
  it('test_UAT_FC_REQ-55_contentWidth_4xl_resolves_to_token', () => {
    // `4xl` is the 896px (56rem) Tailwind step that the old scale skipped
    // (768 → 1152). It resolves to the themeable token, and the token is 56rem.
    expect(resolveContainerWidth('4xl')).toBe('var(--container-4xl)')
    // 56rem @ root-16 = 896px.
    expect(CONTAINER_STEPS['4xl']).toBe('56rem')
    expect(generateThemeCss()).toContain('--container-4xl: 56rem;')
  })

  it('test_UAT_FC_REQ-55_scale_matches_tailwind_max_w_px', () => {
    // The whole scale is Tailwind's `max-w`: rem @ root-16 → px.
    const px = (rem: string) => parseFloat(rem) * 16
    expect(px(CONTAINER_STEPS.sm)).toBe(384)
    expect(px(CONTAINER_STEPS.md)).toBe(448)
    expect(px(CONTAINER_STEPS.lg)).toBe(512)
    expect(px(CONTAINER_STEPS.xl)).toBe(576)
    expect(px(CONTAINER_STEPS['2xl'])).toBe(672)
    expect(px(CONTAINER_STEPS['3xl'])).toBe(768)
    expect(px(CONTAINER_STEPS['4xl'])).toBe(896)
    expect(px(CONTAINER_STEPS['5xl'])).toBe(1024)
    expect(px(CONTAINER_STEPS['6xl'])).toBe(1152)
    expect(px(CONTAINER_STEPS['7xl'])).toBe(1280)
    expect(CONTAINER_STEPS.bleed).toBe('100%')
  })

  it('test_UAT_FC_REQ-55_bleed_and_absent_are_no_cap', () => {
    // `bleed` (and an absent dial) mean "no cap".
    expect(resolveContainerWidth('bleed')).toBeNull()
    expect(resolveContainerWidth(undefined)).toBeNull()
  })
})

describe('REQ-55 literal escape hatch', () => {
  it('test_UAT_FC_REQ-55_contentWidth_literal_px', () => {
    // A bare number is a `px` literal (matching captured render values) — `896`
    // resolves to an 896px column without a named step.
    expect(resolveContainerWidth(896)).toBe('896px')
    // A rem string is passed straight through — `"56rem"` is the same 896px.
    expect(resolveContainerWidth('56rem')).toBe('56rem')
    expect(resolveContainerWidth('4xl')).toBe('var(--container-4xl)')
    // The same resolver backs every width dial: named step → token; literal → px.
    expect(resolveContainerWidth('3xl')).toBe('var(--container-3xl)')
  })
})

describe('REQ-55 gigabytealchemy "Most apps" block', () => {
  it('test_UAT_FC_REQ-55_gigabytealchemy_most_apps_width', () => {
    // The REQ-52 "Most apps" block (`different-approach`) is 896px in the
    // reference; under exact-match diffing the old 768/1152 steps could not hit it.
    // Set to `4xl`, it resolves to the 896px token exactly.
    const home = JSON.parse(
      readFileSync(
        path.join(process.cwd(), 'storage/sites/gigabytealchemy/draft/pages/home.json'),
        'utf8',
      ),
    )
    const block = home.modules.find((m: { id: string }) => m.id === 'different-approach')
    expect(block.content.body).toContain('Most apps')
    expect(block.dials.contentWidth).toBe('4xl')

    // The block's `4xl` contentWidth dial resolves to the 896px token.
    expect(resolveContainerWidth(block.dials.contentWidth)).toBe('var(--container-4xl)')
    // The token backing `4xl` is 56rem = 896px — the reference width, exactly.
    expect(parseFloat(CONTAINER_STEPS['4xl']) * 16).toBe(896)
  })
})

describe('REQ-55 migration — retired width names are gone', () => {
  const RETIRED = ['xnarrow', 'readable'] as const // renamed dial values; also the
  // token keys narrow/default/wide were retired (bleed is the one shared name).

  function siteDocs(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...siteDocs(full))
      else if (entry.endsWith('.json')) out.push(full)
    }
    return out
  }

  it('test_UAT_FC_REQ-55_old_width_names_migrated', () => {
    const docs = siteDocs(path.join(process.cwd(), 'storage/sites'))
    expect(docs.length).toBeGreaterThan(0)
    for (const file of docs) {
      const doc = JSON.parse(readFileSync(file, 'utf8'))
      // No module dial (contentWidth/rowWidth) uses a retired named value.
      const modules = collectModules(doc)
      for (const m of modules) {
        const dials = m.dials ?? {}
        for (const key of ['contentWidth', 'rowWidth']) {
          const v = dials[key]
          if (typeof v === 'string') {
            expect(RETIRED, `${file} ${key}=${v}`).not.toContain(v)
            expect(['narrow', 'default', 'wide'], `${file} ${key}=${v}`).not.toContain(v)
          }
        }
      }
      // No theme container override uses a retired token key.
      const container = doc?.theme?.container ?? {}
      for (const key of ['xnarrow', 'narrow', 'readable', 'default', 'wide']) {
        expect(container, `${file} container.${key}`).not.toHaveProperty(key)
      }
    }
  })

  function collectModules(doc: unknown): Array<{ dials?: Record<string, unknown> }> {
    // A site doc (site.json) or a page doc (pages/*.json). Pages carry `modules`.
    if (doc && typeof doc === 'object' && Array.isArray((doc as { modules?: unknown }).modules)) {
      return (doc as { modules: Array<{ dials?: Record<string, unknown> }> }).modules
    }
    return []
  }

  it('test_UAT_FC_REQ-55_dial_enum_is_the_tailwind_scale', () => {
    expect(CONTENT_WIDTH_DIAL).toEqual([
      'bleed',
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      '4xl',
      '5xl',
      '6xl',
      '7xl',
    ])
    for (const v of ['xnarrow', 'narrow', 'readable', 'default', 'wide']) {
      expect(CONTENT_WIDTH_DIAL as readonly string[]).not.toContain(v)
    }
  })
})
