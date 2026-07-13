import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens/index'
import { typographyTokensSchema } from '../packages/site-schema/src/schema'

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function renderGrid(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(ServicesGrid, { props: props as Record<string, unknown> })
}

/** Raw services-grid module source — its `<style>` block owns badge/checklist type. */
function servicesGridSource(): string {
  return readFileSync(
    fileURLToPath(
      new URL('../packages/framework/src/modules/services-grid/index.astro', import.meta.url),
    ),
    'utf8',
  )
}

/**
 * REQ-56 — component-owned typography as theme subscales.
 *
 * Phase 1 (schema + tokens): badge / checklist typography derives from a
 * theme-level `typography.subScales` block in the render's px vocabulary, so a
 * systemic gap is fixed once in the theme rather than per instance. These UATs
 * cover the token → CSS-var emission half; the module-consumes-the-var half and
 * the per-instance escape hatch land in later phases of the same ticket.
 */
describe('REQ-56 component-owned typography — theme subscales', () => {
  it('test_UAT_FC_REQ-56_badge_type_from_theme', () => {
    // The default theme always emits the badge subscale var surface (so a module
    // can safely reference it), at the preserved hard-coded values (12/13px).
    const base = generateThemeCss(defaultTokens)
    expect(base).toContain('--subscale-badge-font-size: 12px;')
    expect(base).toContain('--subscale-badge-line-height: 13px;')
    expect(base).toContain('--subscale-badge-font-weight: 600;')

    // Changing the theme subscale changes the emitted value for every badge —
    // no per-instance authoring. Render values (14/20) drop straight in as px.
    const css = generateThemeCss({
      typography: { subScales: { badge: { fontSizePx: 14, lineHeightPx: 20 } } },
    })
    expect(css).toContain('--subscale-badge-font-size: 14px;')
    expect(css).toContain('--subscale-badge-line-height: 20px;')
    // Unset axes fall back to the default (semibold), so the merge is per-axis.
    expect(css).toContain('--subscale-badge-font-weight: 600;')
  })

  it('test_UAT_FC_REQ-56_checklist_leading_from_theme', () => {
    // Checklist item leading follows the theme subscale — the REQ-52 target of 24.
    const css = generateThemeCss({
      typography: { subScales: { checklist: { lineHeightPx: 24 } } },
    })
    expect(css).toContain('--subscale-checklist-line-height: 24px;')
    // Default checklist leading is the preserved relaxed value (28px).
    expect(generateThemeCss(defaultTokens)).toContain('--subscale-checklist-line-height: 28px;')
  })

  it('test_UAT_FC_REQ-56_subscale_vocabulary_matches_textrun_axes', () => {
    // A subscale accepts exactly the render/TextRun style axes — a string axis
    // (a `var(--…)` alias or a keyword) passes through verbatim, a number → px.
    const parsed = typographyTokensSchema.parse({
      family: { heading: 'X', body: 'Y' },
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
      subScales: { badge: { fontSizePx: 14, fontWeight: 600, lineHeightPx: 'var(--line-height-tight)' } },
    })
    expect(parsed.subScales?.badge).toEqual({
      fontSizePx: 14,
      fontWeight: 600,
      lineHeightPx: 'var(--line-height-tight)',
    })

    // Content/position fields belong to the run, not the subscale — rejected.
    expect(() =>
      typographyTokensSchema.parse({
        family: { heading: 'X', body: 'Y' },
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
        subScales: { badge: { text: 'nope' } },
      }),
    ).toThrow()
  })
})

/**
 * Phase 2 (module repoint) — the services-grid badge label and checklist item
 * draw their type from the theme subscale vars, not hard-coded scale tokens, so
 * the theme drives every instance.
 */
describe('REQ-56 component-owned typography — services-grid consumes subscales', () => {
  it('test_UAT_FC_REQ-56_badge_consumes_theme_subscale', () => {
    const src = servicesGridSource()
    const badge = src.slice(src.indexOf('.services-grid__badge {'))
    // Badge type now references the theme subscale …
    expect(badge).toContain('font-size: var(--subscale-badge-font-size)')
    expect(badge).toContain('font-weight: var(--subscale-badge-font-weight)')
    expect(badge).toContain('line-height: var(--subscale-badge-line-height)')
    // … and no longer the hard-coded general scale tokens it used before.
    const badgeRule = badge.slice(0, badge.indexOf('}'))
    expect(badgeRule).not.toContain('var(--font-size-xs)')
    expect(badgeRule).not.toContain('var(--font-weight-semibold)')
    expect(badgeRule).not.toContain('var(--line-height-tight)')
  })

  it('test_UAT_FC_REQ-56_checklist_consumes_theme_subscale', () => {
    const src = servicesGridSource()
    const check = src.slice(src.indexOf('.services-grid__check {'))
    const checkRule = check.slice(0, check.indexOf('}'))
    expect(checkRule).toContain('line-height: var(--subscale-checklist-line-height)')
    expect(checkRule).toContain('font-size: var(--subscale-checklist-font-size)')
    // The previous relaxed leading is gone from the item rule.
    expect(checkRule).not.toContain('var(--line-height-relaxed)')
  })
})

/**
 * Phase 3 (per-instance escape hatch) — `badge.labelStyle` / `checklistStyle`
 * are style-only runs that override the theme subscale for a single card,
 * emitted as an inline `style` (which beats the subscale class rule).
 */
describe('REQ-56 component-owned typography — per-instance escape hatch', () => {
  const cardWith = (extra: Record<string, unknown>) => ({
    content: { items: [{ title: { text: 'Sanctum' }, body: 'A voice app.', ...extra }] },
  })

  it('test_UAT_FC_REQ-56_per_instance_style_override', async () => {
    const html = await renderGrid(
      cardWith({ badge: { label: 'New', labelStyle: { fontSizePx: 18, fontWeight: 800 } } }),
    )
    // The badge span carries the override inline — beating the subscale rule for
    // this instance only, without touching the theme.
    const badge = html.slice(html.indexOf('services-grid__badge'))
    const span = badge.slice(0, badge.indexOf('</span>'))
    expect(span).toContain('font-size: 18px')
    expect(span).toContain('font-weight: 800')
    // The label text is unaffected — a style-only run.
    expect(span).toContain('New')
  })

  it('test_UAT_FC_REQ-56_checklist_item_style_override', async () => {
    const html = await renderGrid(
      cardWith({ checklist: ['One', 'Two'], checklistStyle: { lineHeightPx: 22 } }),
    )
    const check = html.slice(html.indexOf('services-grid__check'))
    expect(check).toContain('line-height: 22px')
  })

  it('test_UAT_FC_REQ-56_labelStyle_is_valid_content', () => {
    const errors = validateModuleContent(servicesGridMeta, {
      items: [
        {
          title: { text: 'T' },
          body: 'B',
          badge: { label: 'New', labelStyle: { fontSizePx: 18 } },
          checklist: ['a'],
          checklistStyle: { lineHeightPx: 22 },
        },
        { title: { text: 'U' }, body: 'B2' },
      ],
    })
    expect(errors).toEqual([])
  })
})
