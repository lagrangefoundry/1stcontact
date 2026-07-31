import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as siteSchema from '../packages/site-schema/src/index'
import { resolveL1Color, resolveL1Palette } from '../packages/site-schema/src/l1/palette'
import { validateL1 } from '../packages/site-schema/src/l1/validate'
import type { L1Document, L1Palette } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { defaultTokens, generateThemeCss } from '../packages/framework/src/tokens/index'
import {
  collectColorLiterals,
  derivePalette,
  groupIntoFamilies,
  splitColor,
  toHcl,
} from '../tools/generate/src/cli/colors'
import type { ColorCensus } from '../tools/generate/src/cli/colors'

/**
 * UATs for REQ-114 — the L1 palette colour model (DOC-23 §5) and the retirement
 * of the legacy 15-slot theme palette.
 *
 * The load-bearing property throughout is that the palette is an **overlay**: a
 * hex literal is always valid, a reference resolves to one, and converting
 * between them can never move a pixel. Most of what follows is that one claim,
 * asserted from a different side each time.
 */

const REPO = path.resolve(__dirname, '..')
const SITES = path.join(REPO, 'storage', 'sites')

/** A minimal well-formed document, parameterised by the colour under test. */
function docWith(color: unknown, extra: Record<string, unknown> = {}): unknown {
  return {
    widths: [1440],
    ...extra,
    root: {
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'text', text: 'hello', axes: { color, fontSizePx: 16 } }],
    },
  }
}

const PALETTE: L1Palette = {
  primary: { value: '#2e86a3', steps: { '300': '#4aafc9', '700': '#236d87' } },
  'brand-neutral-cool': { value: '#1f2937' },
}

describe('REQ-114 AC1 — a palette of arbitrary size, and colour axes that take either form', () => {
  it('test_UAT_FC_REQ-114_colour_axis_accepts_a_literal_or_a_reference', () => {
    const literal = validateL1(docWith('#2e86a3'))
    const reference = validateL1(docWith({ ref: 'primary' }), { palette: PALETTE })
    expect(literal.ok).toBe(true)
    expect(reference.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-114_palette_is_arbitrary_size_with_free_form_kebab_names', () => {
    // Nothing about the shape is a closed vocabulary: 40 entries with names
    // nowhere in DOC-23 §5.4's starting set all validate.
    const palette: L1Palette = {}
    for (let i = 0; i < 40; i++) palette[`house-hue-${i}`] = { value: '#123456' }
    const doc = { ...(docWith({ ref: 'house-hue-39' }) as object) }
    expect(validateL1(doc, { palette }).ok).toBe(true)

    // A name that is not kebab-case is rejected by the schema, so entry names
    // stay a legible, machine-checkable vocabulary rather than free text.
    const bad = siteSchema.l1PaletteSchema.safeParse({ 'Not Kebab': { value: '#123456' } })
    expect(bad.success).toBe(false)
  })

  it('test_UAT_FC_REQ-114_a_palette_entry_is_opaque', () => {
    // DOC-23 §5.4 — translucency is a reference axis. An entry that could carry
    // alpha would make one conceptual colour occupy N entries.
    expect(siteSchema.l1PaletteEntrySchema.safeParse({ value: '#2e86a3' }).success).toBe(true)
    expect(siteSchema.l1PaletteEntrySchema.safeParse({ value: '#2e86a3a6' }).success).toBe(false)
  })
})

describe('REQ-114 AC2 — a dangling reference fails validation, never falls back', () => {
  it('test_UAT_FC_REQ-114_unknown_entry_is_a_validation_failure', () => {
    const result = validateL1(docWith({ ref: 'nope' }), { palette: PALETTE })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.message.includes("'nope'"))).toBe(true)
  })

  it('test_UAT_FC_REQ-114_unknown_step_is_a_validation_failure', () => {
    const result = validateL1(docWith({ ref: 'primary', step: '999' }), { palette: PALETTE })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some((e) => e.message.includes("step '999'"))).toBe(true)
  })

  it('test_UAT_FC_REQ-114_a_reference_with_no_palette_in_scope_is_rejected', () => {
    // Omitting the palette must not relax the rule — the alternative is exactly
    // the render-time fallback DOC-23 §6 does not have.
    expect(validateL1(docWith({ ref: 'primary' })).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-114_resolution_throws_rather_than_substituting_a_default', () => {
    expect(() => resolveL1Color({ ref: 'nope' }, PALETTE)).toThrow(/does not resolve/)
    expect(() => resolveL1Color({ ref: 'primary', step: '999' }, PALETTE)).toThrow(/no step/)
  })
})

describe('REQ-114 AC3/AC4 — the palette is an overlay: literals still work, and conversion moves no pixel', () => {
  it('test_UAT_FC_REQ-114_literal_only_documents_need_no_palette', () => {
    const doc = docWith('#2e86a3', { background: '#ffffff' })
    const validated = validateL1(doc)
    expect(validated.ok).toBe(true)
    if (!validated.ok) return
    expect(renderL1Document(validated.value).css).toContain('#2e86a3')
  })

  it('test_UAT_FC_REQ-114_a_reference_renders_byte_identically_to_the_literal_it_replaces', () => {
    // The whole retrofit rests on this: the two forms are the same document to
    // the emitter, so converting a site is pixel-identical by construction.
    const literal = validateL1(docWith('#4aafc9', { background: '#236d87' }))
    const reference = validateL1(
      docWith({ ref: 'primary', step: '300' }, { background: { ref: 'primary', step: '700' } }),
      { palette: PALETTE },
    )
    expect(literal.ok && reference.ok).toBe(true)
    if (!literal.ok || !reference.ok) return
    const a = renderL1Document(literal.value)
    const b = renderL1Document(reference.value, { palette: PALETTE })
    expect(b.css).toBe(a.css)
    expect(b.html).toBe(a.html)
  })

  it('test_UAT_FC_REQ-114_resolution_leaves_a_literal_only_document_untouched', () => {
    const doc = docWith('#2e86a3') as L1Document
    expect(resolveL1Palette(doc, PALETTE)).toEqual(doc)
  })
})

describe('REQ-114 AC5 — alpha rides on the reference, so one colour is one entry', () => {
  it('test_UAT_FC_REQ-114_xgd_three_alpha_variants_resolve_to_one_entry', () => {
    // The measured case from DOC-23 §5.3: #2e86a3 at α 1.00 / 0.65 / 0.33 is one
    // colour, and collapsing it is a statement about the bytes, not inference.
    const palette: L1Palette = { primary: { value: '#2e86a3' } }
    expect(resolveL1Color({ ref: 'primary' }, palette)).toBe('#2e86a3')
    expect(resolveL1Color({ ref: 'primary', alpha: 0xa6 / 255 }, palette)).toBe('#2e86a3a6')
    expect(resolveL1Color({ ref: 'primary', alpha: 0x55 / 255 }, palette)).toBe('#2e86a355')
  })

  it('test_UAT_FC_REQ-114_every_alpha_byte_round_trips_exactly', () => {
    const palette: L1Palette = { c: { value: '#010203' } }
    for (let byte = 0; byte < 255; byte++) {
      const hex = resolveL1Color({ ref: 'c', alpha: byte / 255 }, palette)
      expect(parseInt(hex.slice(7), 16)).toBe(byte)
    }
    // A fully-opaque reference emits the bare `#rrggbb`, so a literal that was
    // never written with an alpha byte does not grow one on conversion.
    expect(resolveL1Color({ ref: 'c', alpha: 1 }, palette)).toBe('#010203')
  })
})

describe('REQ-114 AC6/AC7 — the census reproduces DOC-23 §5.3, and derivation is a palette not a colour list', () => {
  /** Census the real site definitions on disk, the way `1c colors` does. */
  function censusOf(slug: string): ColorCensus {
    const pagesDir = path.join(SITES, slug, 'draft', 'pages')
    const literals = readdirSync(pagesDir)
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => {
        const page = JSON.parse(readFileSync(path.join(pagesDir, f), 'utf-8'))
        const palette = JSON.parse(
          readFileSync(path.join(SITES, slug, 'draft', 'site.json'), 'utf-8'),
        ).palette as L1Palette | undefined
        return collectColorLiterals(resolveL1Palette(page, palette))
      })
    const byLiteral = new Map<string, { literal: string; rgb: string; alpha: number; count: number }>()
    for (const literal of literals) {
      const split = splitColor(literal)
      if (!split) continue
      const seen = byLiteral.get(literal)
      if (seen) seen.count += 1
      else byLiteral.set(literal, { literal, rgb: split.rgb, alpha: split.alpha, count: 1 })
    }
    const colors = [...byLiteral.values()]
    const rgbs = new Set(colors.map((c) => c.rgb))
    return { slug, colors, distinctRgb: rgbs.size, alphaFamilies: [] }
  }

  it('test_UAT_FC_REQ-114_census_reproduces_the_measured_colour_counts', () => {
    // DOC-23 §5.3 measured `xgd` at 17 distinct colours / 15 distinct RGB. The
    // page now also declares a document `textColor`, which is a real 18th colour
    // — the invariant under test is that the census measures the *definition*,
    // and that ignoring alpha collapses strictly more than it distinguishes.
    const xgd = censusOf('xgd')
    expect(xgd.colors.length).toBeGreaterThanOrEqual(17)
    expect(xgd.distinctRgb).toBeLessThan(xgd.colors.length)

    const giga = censusOf('gigabytealchemy')
    expect(giga.colors.length).toBeGreaterThanOrEqual(29)
  })

  it('test_UAT_FC_REQ-114_derivation_yields_a_palette_not_a_colour_list', () => {
    // AC6 — well under `xgd`'s 15 distinct RGB. A slightly large palette is a
    // fine outcome; a colour list is not a palette at all.
    const derived = derivePalette(censusOf('xgd'))
    expect(Object.keys(derived.palette).length).toBeLessThanOrEqual(8)
    expect(Object.keys(derivePalette(censusOf('gigabytealchemy')).palette).length).toBeLessThanOrEqual(12)
  })

  it('test_UAT_FC_REQ-114_derived_references_reproduce_every_literal_exactly', () => {
    for (const slug of ['xgd', 'gigabytealchemy']) {
      const census = censusOf(slug)
      const { palette, refs } = derivePalette(census)
      expect(refs.size).toBe(census.colors.length)
      for (const [literal, ref] of refs) {
        expect(resolveL1Color(ref, palette)).toBe(literal)
      }
    }
  })

  it('test_UAT_FC_REQ-114_families_split_a_brand_hue_from_the_greys_that_share_it', () => {
    // Hue alone chains a vivid brand colour into the neutrals tinted with it —
    // one big entry that is not a role anyone can edit. Chroma class keeps them
    // apart while a genuine lightness ramp still groups.
    const families = groupIntoFamilies(['#1447e6', '#2b7fff', '#e2e8f0', '#f1f5f9', '#ffffff'])
    const of = (rgb: string) => families.find((f) => f.members.some((m) => m.rgb === rgb))?.name
    expect(of('#1447e6')).toBe(of('#2b7fff'))
    expect(of('#e2e8f0')).toBe(of('#f1f5f9'))
    expect(of('#1447e6')).not.toBe(of('#e2e8f0'))
    expect(of('#ffffff')).toBe('neutral')
  })

  it('test_UAT_FC_REQ-114_neutrality_is_chroma_not_hsl_saturation', () => {
    // `#fffef8` is a cream 7/255 off white. HSL reports it 100% saturated
    // because the denominator collapses near the ends of the lightness range;
    // reading neutrality off that number would split a measured warm ramp.
    expect(toHcl('#fffef8').c).toBe(7)
    const warm = groupIntoFamilies(['#e5e2d5', '#f5f4ec', '#fffef8'])
    expect(warm).toHaveLength(1)
    expect(warm[0].members).toHaveLength(3)
  })
})

describe('REQ-114 AC8/AC9/AC10 — the legacy token palette is gone, not deprecated', () => {
  it('test_UAT_FC_REQ-114_legacy_palette_symbols_no_longer_exist', () => {
    const surface = siteSchema as Record<string, unknown>
    expect(surface.paletteTokensSchema).toBeUndefined()
    expect(surface.layerColorRoleSchema).toBeUndefined()
    expect('palette' in siteSchema.themeTokensSchema.shape).toBe(false)
  })

  it('test_UAT_FC_REQ-114_no_site_definition_carries_a_theme_palette', () => {
    const slugs = readdirSync(SITES, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
    expect(slugs.length).toBeGreaterThan(0)
    for (const slug of slugs) {
      const file = path.join(SITES, slug, 'draft', 'site.json')
      const site = JSON.parse(readFileSync(file, 'utf-8'))
      expect(site.theme?.palette, `${slug} still declares theme.palette`).toBeUndefined()
    }
  })

  it('test_UAT_FC_REQ-114_theme_css_emits_no_colour_custom_property', () => {
    const css = generateThemeCss(defaultTokens)
    expect(css).not.toContain('--color-')
  })

  it('test_UAT_FC_REQ-114_the_dark_mode_palette_override_is_gone', () => {
    // AC10 — it existed only to re-declare palette roles and had no callers, so
    // it went with them rather than being ported to a model it predates.
    expect(generateThemeCss.length).toBe(1)
    expect(generateThemeCss(defaultTokens)).not.toContain('prefers-color-scheme')
  })

  it('test_UAT_FC_REQ-114_a_rendered_page_takes_its_page_colours_from_the_l1_document', () => {
    // AC9 — the page background and text colour used to come from `--color-bg` /
    // `--color-text`. Their home is the document itself now.
    const doc = validateL1(docWith('#2e86a3', { background: '#fffef8', textColor: '#1f2937' }))
    expect(doc.ok).toBe(true)
    if (!doc.ok) return
    const { css } = renderL1Document(doc.value)
    expect(css).toContain('body { background-color: #fffef8 }')
    expect(css).toContain('body { color: #1f2937 }')
    expect(css).not.toContain('--color-')
  })
})

describe('REQ-114 AC11 — the non-colour token groups are untouched', () => {
  it('test_UAT_FC_REQ-114_typography_spacing_radius_shadow_breakpoints_still_emit', () => {
    const css = generateThemeCss(defaultTokens)
    for (const name of [
      '--font-family-heading',
      '--font-size-5xl',
      '--font-weight-bold',
      '--line-height-normal',
      '--space-4',
      '--radius-md',
      '--shadow-lg',
      '--container-6xl',
      '--breakpoint-lg',
    ]) {
      expect(css, `missing ${name}`).toContain(name)
    }
  })
})
