import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens/index'
import { typographyTokensSchema } from '../packages/site-schema/src/schema'
import { buildTheme } from '../tools/generate/src/cli/capture/theme'
import type { RawRun, RawSignals } from '../tools/generate/src/cli/capture/extract'
import { diffManifests } from '../tools/generate/src/cli/capture/values-diff'
import type { ValueElement, ValueManifest } from '../tools/generate/src/cli/capture/values-diff'
import type { ThemeSubScales } from '../tools/generate/src/cli/capture/types'

/**
 * Reconciliation UATs for story-bb049a62 — component-owned typography driven by
 * theme subscales (REQ-56). One UAT per acceptance criterion (AC-610 … AC-617),
 * each proving the described behaviour against the existing implementation:
 *  - the theme → CSS-var emission + module repoint (AC-610, AC-611),
 *  - the render px vocabulary (AC-612),
 *  - the per-instance escape hatch (AC-613),
 *  - capture reading subscales from page semantics (AC-614),
 *  - values-diff systemic-gap attribution, rollup, opt-out and closure
 *    (AC-615, AC-616, AC-617).
 */

// ── shared fixtures ──────────────────────────────────────────────────────────

/** A RawRun with sensible geometry defaults; override only what the case needs. */
function run(over: Partial<RawRun>): RawRun {
  return {
    role: 'body',
    text: 'x',
    color: '#000000',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    letterSpacingPx: 0,
    gradientCss: null,
    borderLeftWidthPx: 0,
    borderLeftColor: null,
    paddingLeftPx: 0,
    box: { x: 0, y: 0, width: 100, height: 24 },
    borderRadiusPx: 0,
    boxShadow: null,
    a11yRole: '',
    arrangement: null,
    zIndex: 0,
    filter: null,
    textShadow: null,
    maskEdge: null,
    transformRotateDeg: 0,
    transformScale: 1,
    motion: null,
    ...over,
  }
}

/** A one-band RawSignals carrying the given content runs. */
function signalsWith(content: RawRun[]): RawSignals {
  return {
    viewport: { width: 1200, height: 800 },
    bands: [
      {
        box: { x: 0, y: 0, width: 1200, height: 800 },
        backgroundColor: null,
        backgroundImage: 'none',
        colorScheme: 'light',
        fontFamily: 'Inter',
        textAlign: 'left',
        paddingTopPx: 0,
        paddingBottomPx: 0,
        overlay: null,
        contentAnchorRatio: null,
        content,
        items: [],
        fields: [],
      },
    ],
    colorUsage: [],
    fontFaces: [],
    typeScale: [14, 16],
    spacingScalePx: [],
    containerMaxWidthPx: null,
    images: [],
  }
}

/** A pill (badge-shaped) run: strongly rounded, short text, small. */
const pill = (over: Partial<RawRun>) =>
  run({ borderRadiusPx: 10, box: { x: 0, y: 0, width: 40, height: 20 }, ...over })

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

/** The full valid typography token block, with the given subScales spliced in. */
function typographyWith(subScales: Record<string, unknown>): Record<string, unknown> {
  return {
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
    subScales,
  }
}

// ── AC-610 / AC-611 : theme subscale drives every instance (emit + consume) ──

describe('REQ-56 reconciliation — theme subscales drive rendered type', () => {
  it('test_UAT_AC610_theme_badge_subscale_drives_every_badge_label', () => {
    // Default: the badge subscale surface is always emitted at the preserved
    // hard-coded services-grid baseline (12/13px, semibold) — existing sites
    // unchanged.
    const base = generateThemeCss(defaultTokens)
    expect(base).toContain('--subscale-badge-font-size: 12px;')
    expect(base).toContain('--subscale-badge-line-height: 13px;')
    expect(base).toContain('--subscale-badge-font-weight: 600;')

    // Changing the theme badge subscale changes the emitted value for every badge,
    // with no per-instance authoring; only the axes it sets take effect, unset
    // axes fall through to the baseline (semibold survives).
    const css = generateThemeCss({
      typography: { subScales: { badge: { fontSizePx: 14, lineHeightPx: 20 } } },
    })
    expect(css).toContain('--subscale-badge-font-size: 14px;')
    expect(css).toContain('--subscale-badge-line-height: 20px;')
    expect(css).toContain('--subscale-badge-font-weight: 600;')

    // The module consumes the subscale var (so a theme change reaches every badge),
    // not the old hard-coded general scale tokens.
    const src = servicesGridSource()
    // Anchor on the real badge rule (2-space indent, own selector) — not the
    // earlier `card-surface-bare … .services-grid__badge { display:none }` rule.
    const badge = src.slice(src.indexOf('\n  .services-grid__badge {'))
    const badgeRule = badge.slice(0, badge.indexOf('}'))
    expect(badgeRule).toContain('font-size: var(--subscale-badge-font-size)')
    expect(badgeRule).toContain('font-weight: var(--subscale-badge-font-weight)')
    expect(badgeRule).toContain('line-height: var(--subscale-badge-line-height)')
    expect(badgeRule).not.toContain('var(--font-size-xs)')
  })

  it('test_UAT_AC611_theme_checklist_subscale_drives_every_checklist_item', () => {
    // Changing the checklist subscale leading changes every checklist item's
    // leading; the default reproduces the framework baseline (relaxed 28px).
    const css = generateThemeCss({
      typography: { subScales: { checklist: { lineHeightPx: 24 } } },
    })
    expect(css).toContain('--subscale-checklist-line-height: 24px;')
    expect(generateThemeCss(defaultTokens)).toContain('--subscale-checklist-line-height: 28px;')

    // The checklist item rule draws its leading/size from the subscale var, not
    // the old relaxed line-height token.
    const src = servicesGridSource()
    const check = src.slice(src.indexOf('\n  .services-grid__check {'))
    const checkRule = check.slice(0, check.indexOf('}'))
    expect(checkRule).toContain('line-height: var(--subscale-checklist-line-height)')
    expect(checkRule).toContain('font-size: var(--subscale-checklist-font-size)')
    expect(checkRule).not.toContain('var(--line-height-relaxed)')
  })
})

// ── AC-612 : subscales use the render's px vocabulary end-to-end ──────────────

describe('REQ-56 reconciliation — subscale px vocabulary (zero translation)', () => {
  it('test_UAT_AC612_subscale_uses_render_px_vocabulary_end_to_end', () => {
    // A subscale accepts the six render style axes as literal px numbers or
    // theme-alias strings, every axis optional (a subset validates).
    const parsed = typographyTokensSchema.parse(
      typographyWith({
        badge: { fontSizePx: 14, fontWeight: 600, lineHeightPx: 'var(--line-height-tight)' },
      }),
    )
    expect(parsed.subScales?.badge).toEqual({
      fontSizePx: 14,
      fontWeight: 600,
      lineHeightPx: 'var(--line-height-tight)',
    })

    // Zero translation: a value exactly as the capture reports it (px number)
    // authors straight into a subscale without conversion.
    const captured = buildTheme(
      signalsWith([
        pill({ role: 'body', text: 'New', fontSizePx: 14, lineHeightPx: 20 }),
        pill({ role: 'body', text: 'Beta', fontSizePx: 14, lineHeightPx: 20 }),
      ]),
      new Map(),
    )
    const { count: _c, ...badgeAxes } = captured.subScales.badge!
    expect(() =>
      typographyTokensSchema.parse(typographyWith({ badge: badgeAxes })),
    ).not.toThrow()

    // Content/position fields are not style axes — rejected by the contract.
    expect(() =>
      typographyTokensSchema.parse(typographyWith({ badge: { text: 'nope' } })),
    ).toThrow()
  })
})

// ── AC-613 : per-instance style overrides the theme subscale for one card ─────

describe('REQ-56 reconciliation — per-instance escape hatch', () => {
  it('test_UAT_AC613_per_instance_style_overrides_theme_subscale_single_card', async () => {
    // One card sets a badge label style (and checklist item style); a sibling
    // card sets neither. The styled card renders the override inline; the
    // unstyled card carries no inline type and so follows the theme subscale.
    const html = await renderGrid({
      content: {
        items: [
          {
            title: { text: 'Styled' },
            body: 'Has an override.',
            badge: { label: 'Alpha', labelStyle: { fontSizePx: 18, fontWeight: 800 } },
            checklist: ['One', 'Two'],
            checklistStyle: { lineHeightPx: 22 },
          },
          {
            title: { text: 'Plain' },
            body: 'Follows the theme.',
            badge: { label: 'Beta' },
            checklist: ['Three'],
          },
        ],
      },
    })

    const badgeParts = html.split('services-grid__badge')
    const styledBadge = badgeParts[1].slice(0, badgeParts[1].indexOf('</span>'))
    const plainBadge = badgeParts[2].slice(0, badgeParts[2].indexOf('</span>'))
    // Styled card: the override wins inline for this instance only.
    expect(styledBadge).toContain('Alpha')
    expect(styledBadge).toContain('font-size: 18px')
    expect(styledBadge).toContain('font-weight: 800')
    // Sibling card: no inline type → renders from the theme subscale.
    expect(plainBadge).toContain('Beta')
    expect(plainBadge).not.toContain('style=')

    // The checklist item style override also lands inline on the styled card
    // (only checklistStyle sets this leading, so its presence is unambiguous).
    expect(html).toContain('line-height: 22px')

    // A per-instance style is accepted as valid module content.
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

// ── AC-614 : capture reads subscales from a reference page's own semantics ────

describe('REQ-56 reconciliation — capture reads subscales from page semantics', () => {
  it('test_UAT_AC614_capture_reads_component_subscales_from_semantics', () => {
    // Badges (pill runs) and checklist (listitem runs) each form a ≥2-member
    // cohort; body prose and interactive pills (CTAs) are excluded. Each axis is
    // the modal value across the cohort (a stray outlier does not skew it).
    const theme = buildTheme(
      signalsWith([
        pill({ role: 'body', text: 'New', fontSizePx: 14, lineHeightPx: 20 }),
        pill({ role: 'body', text: 'Beta', fontSizePx: 14, lineHeightPx: 20 }),
        pill({ role: 'body', text: 'Live', fontSizePx: 15, lineHeightPx: 20 }), // outlier size
        // A CTA pill is interactive, not a status badge — excluded from the cohort.
        pill({ role: 'cta', text: 'Buy', fontSizePx: 99, lineHeightPx: 99 }),
        run({ role: 'listitem', text: 'One thing', fontSizePx: 16, lineHeightPx: 24 }),
        run({ role: 'listitem', text: 'Two thing', fontSizePx: 16, lineHeightPx: 24 }),
        run({ role: 'listitem', text: 'Three now', fontSizePx: 16, lineHeightPx: 26 }), // outlier leading
        // Ordinary body prose — neither a pill nor a listitem — must be ignored.
        run({ role: 'body', text: 'This is ordinary body prose to ignore', fontSizePx: 16 }),
      ]),
      new Map(),
    )
    // Badge cohort = the 3 status pills (CTA excluded); modal size 14, leading 20.
    expect(theme.subScales.badge).toEqual({
      fontSizePx: 14,
      fontWeight: 400,
      lineHeightPx: 20,
      letterSpacingPx: 0,
      count: 3,
    })
    // Checklist cohort = the 3 listitems; modal leading 24 (the outlier 26 loses).
    expect(theme.subScales.checklist).toEqual({
      fontSizePx: 16,
      fontWeight: 400,
      lineHeightPx: 24,
      letterSpacingPx: 0,
      count: 3,
    })

    // A lone pill (< 2 members) is a one-off — it yields no badge subscale.
    const lone = buildTheme(
      signalsWith([pill({ role: 'body', text: 'Solo', fontSizePx: 14, lineHeightPx: 20 })]),
      new Map(),
    )
    expect(lone.subScales.badge).toBeUndefined()
  })
})

// ── AC-615 / AC-616 / AC-617 : values-diff subscale attribution ──────────────

describe('REQ-56 reconciliation — values-diff subscale attribution', () => {
  /** A ValueElement with defaults; override only what the case needs. */
  function el(over: Partial<ValueElement>): ValueElement {
    return {
      text: 'x',
      role: 'body',
      color: '#000000',
      fontFamily: 'Inter',
      fontSizePx: 16,
      fontWeight: 400,
      lineHeightPx: 24,
      letterSpacingPx: 0,
      ...over,
    }
  }
  /** A badge (pill) element carrying its type. */
  const badgeEl = (text: string, fontSizePx: number, lineHeightPx: number): ValueElement =>
    el({
      text,
      role: 'body',
      fontSizePx,
      lineHeightPx,
      borderRadiusPx: 10,
      box: { x: 0, y: 0, width: 40, height: 20 },
    })
  const checkEl = (text: string, lineHeightPx: number): ValueElement =>
    el({ text, role: 'listitem', fontSizePx: 16, lineHeightPx })

  function manifest(elements: ValueElement[], subScales: ThemeSubScales): ValueManifest {
    return { source: 's', elements, sections: [], viewport: { width: 1200, height: 800 }, subScales }
  }

  const refSubs: ThemeSubScales = {
    badge: { fontSizePx: 14, fontWeight: 600, lineHeightPx: 20, letterSpacingPx: 0, count: 2 },
    checklist: { fontSizePx: 16, fontWeight: 400, lineHeightPx: 24, letterSpacingPx: 0, count: 2 },
  }
  // Our render: badge 12/13 and checklist leading 28 — the systemic gaps.
  const ourSubs: ThemeSubScales = {
    badge: { fontSizePx: 12, fontWeight: 600, lineHeightPx: 13, letterSpacingPx: 0, count: 2 },
    checklist: { fontSizePx: 16, fontWeight: 400, lineHeightPx: 28, letterSpacingPx: 0, count: 2 },
  }
  const expected = () =>
    manifest(
      [
        badgeEl('New', 14, 20),
        badgeEl('Beta', 14, 20),
        checkEl('One thing', 24),
        checkEl('Two thing', 24),
        // An unrelated element with its own (colour) delta — must survive rollup.
        el({ text: 'Unrelated prose', role: 'body', color: '#111111' }),
      ],
      refSubs,
    )
  const ours = () =>
    manifest(
      [
        badgeEl('New', 12, 13),
        badgeEl('Beta', 12, 13),
        checkEl('One thing', 28),
        checkEl('Two thing', 28),
        el({ text: 'Unrelated prose', role: 'body', color: '#334155' }),
      ],
      ourSubs,
    )

  it('test_UAT_AC615_systemic_subscale_gap_is_one_theme_finding_rolling_up_rows', () => {
    const report = diffManifests(expected(), ours())
    const subscaleRows = report.deltas.filter((d) => d.role === 'subscale')
    // Exactly one theme-level finding per differing subscale (badge + checklist).
    expect(subscaleRows.map((d) => d.text).sort()).toEqual([
      '⟨badge subscale ×2⟩',
      '⟨checklist subscale ×2⟩',
    ])
    // The finding names the differing axes with reference-vs-repro values.
    const badgeRow = subscaleRows.find((d) => d.text.includes('badge'))!
    expect(badgeRow.expected).toContain('size 14')
    expect(badgeRow.expected).toContain('leading 20')
    expect(badgeRow.actual).toContain('size 12')
    // The per-element badge/checklist type rows it explains are rolled up …
    const explained = report.deltas.filter(
      (d) => !d.systemic && (d.property === 'fontSizePx' || d.property === 'lineHeightPx'),
    )
    expect(explained).toEqual([])
    // … the rolled-up count is recorded …
    expect(report.suppressed).toBeGreaterThanOrEqual(4)
    // … and an unrelated delta not explained by the gap still appears.
    const unrelated = report.deltas.filter(
      (d) => d.property === 'color' && d.text === 'Unrelated prose',
    )
    expect(unrelated.length).toBe(1)
  })

  it('test_UAT_AC616_keep_subscale_detail_opt_out_restores_rolled_up_rows', () => {
    const report = diffManifests(expected(), ours(), { keepSubscaleDeltas: true })
    // The theme-level finding is still emitted …
    expect(report.deltas.some((d) => d.role === 'subscale')).toBe(true)
    // … and the per-element rows it would otherwise roll up survive for debugging.
    const perElement = report.deltas.filter(
      (d) => !d.systemic && (d.property === 'fontSizePx' || d.property === 'lineHeightPx'),
    )
    expect(perElement.length).toBeGreaterThan(0)
  })

  it('test_UAT_AC617_setting_theme_subscale_to_reference_closes_the_gap', () => {
    // Set our subscale to the reference's captured values → badges/checklist
    // match; the systemic gap closes with no subscale finding and no residual
    // per-element badge/checklist type deltas.
    const closed = manifest(
      [
        badgeEl('New', 14, 20),
        badgeEl('Beta', 14, 20),
        checkEl('One thing', 24),
        checkEl('Two thing', 24),
        el({ text: 'Unrelated prose', role: 'body', color: '#111111' }),
      ],
      refSubs,
    )
    const report = diffManifests(expected(), closed)
    expect(report.deltas.filter((d) => d.role === 'subscale')).toEqual([])
    expect(
      report.deltas.filter((d) => d.property === 'fontSizePx' || d.property === 'lineHeightPx'),
    ).toEqual([])
  })
})
