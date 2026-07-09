import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { renderMarkdown } from '../packages/framework/src/modules/markdown'
import { generateThemeCss, defaultTokens } from '../packages/framework/src/tokens'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * UATs for REQ-32 — four generic, reusable framework fidelity primitives
 * surfaced *by* the gigabytealchemy import but scoped to no site:
 *
 *   1. Gradient text treatment (heading / wordmark) — arbitrary direction +
 *      multi-stop, palette-role-backed, framework-computed.
 *   2. `text-block`-style callout / left-bar — a GFM-alert blockquote rendered
 *      as a semantic accent left-bar (+ optional italic), available in any
 *      markdown body.
 *   3. Hero overlay-scrim + content vertical anchor.
 *   4. Cool-neutral palette role, selectable independent of the warm `muted`.
 *
 * Every assertion uses synthetic values (accent → secondary, etc.), never a
 * site's specific colours/sizes — those are config under REQ-20, flagged by
 * REQ-31's values-diff.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

describe('REQ-32 primitive 1 — gradient text treatment', () => {
  it('test_UAT_FC_REQ-32_meta_exposes_gradient_treatments', () => {
    expect(headerMeta.dials.logoTreatment).toContain('gradient')
    expect(heroMeta.dials.headingTreatment).toContain('gradient')
    expect(Object.keys(headerMeta.contentSchema)).toContain('logoGradient')
    expect(Object.keys(heroMeta.contentSchema)).toContain('headingGradient')
  })

  it('test_UAT_FC_REQ-32_header_wordmark_renders_directional_multi_stop_gradient', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: { logoTreatment: 'gradient' },
      content: {
        logo: 'ACME',
        entries: [],
        logoGradient: {
          direction: 'to-right',
          stops: [{ role: 'accent' }, { role: 'secondary' }],
        },
      },
    })
    // Framework-computed: a horizontal sweep between two palette-role tokens,
    // clipped to the glyphs. No raw colour, no vertical-only assumption.
    expect(html).toContain(
      'linear-gradient(to right, var(--color-accent) 0%, var(--color-secondary) 100%)',
    )
    expect(html).toContain('background-clip: text')
  })

  it('test_UAT_FC_REQ-32_hero_heading_renders_gradient_from_structured_field', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { headingTreatment: 'gradient' },
      content: {
        heading: 'Intentional',
        subhead: 'Body.',
        headingGradient: {
          direction: 'to-br',
          stops: [{ role: 'primary' }, { role: 'accent' }, { role: 'secondary' }],
        },
      },
    })
    // Three-stop, diagonal — even-spaced positions when none are supplied.
    expect(html).toContain(
      'linear-gradient(to bottom right, var(--color-primary) 0%, var(--color-accent) 50%, var(--color-secondary) 100%)',
    )
  })

  it('test_UAT_FC_REQ-32_gradient_absent_falls_back_to_inherited_colour', async () => {
    // Dial selects gradient but no structured field supplied → no inline style,
    // so the glyphs keep the inherited colour rather than turning transparent.
    const html = await render(Header, {
      variant: 'top-nav',
      dials: { logoTreatment: 'gradient' },
      content: { logo: 'ACME', entries: [] },
    })
    expect(html).not.toContain('background-clip: text')
  })
})

describe('REQ-32 primitive 2 — callout / left-bar treatment', () => {
  it('test_UAT_FC_REQ-32_markdown_alert_becomes_semantic_callout', async () => {
    const html = await renderMarkdown('> [!accent] These are foundations.')
    expect(html).toContain('<blockquote class="fc-callout fc-callout--accent">')
    // The marker itself is consumed — it never shows in the copy.
    expect(html).not.toContain('[!accent]')
    expect(html).toContain('These are foundations.')
  })

  it('test_UAT_FC_REQ-32_callout_supports_italic_and_any_role', async () => {
    const html = await renderMarkdown('> [!secondary italic] Not trying to change you.')
    expect(html).toContain('fc-callout--secondary')
    expect(html).toContain('fc-callout--italic')
  })

  it('test_UAT_FC_REQ-32_plain_blockquote_and_unknown_role_untouched', async () => {
    const plain = await renderMarkdown('> just a quote')
    expect(plain).not.toContain('fc-callout')
    const unknown = await renderMarkdown('> [!bogus] text')
    expect(unknown).not.toContain('fc-callout')
    expect(unknown).toContain('[!bogus]')
  })
})

describe('REQ-32 primitive 3 — hero scrim + content anchor', () => {
  it('test_UAT_FC_REQ-32_meta_exposes_scrim_and_anchor_dials', () => {
    // REQ-36 appended `heavy` (0.68) for a busy photo `strong` reads too light over.
    expect(heroMeta.dials.scrim).toEqual(['none', 'light', 'medium', 'strong', 'heavy'])
    expect(heroMeta.dials.contentAnchor).toEqual(['top', 'center', 'bottom'])
  })

  it('test_UAT_FC_REQ-32_hero_paints_scrim_over_image_and_anchors_content', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold', scrim: 'medium', contentAnchor: 'bottom' },
      content: {
        heading: 'Over image',
        subhead: 'Body.',
        image: { id: 'bg', src: 'assets/bg.png', alt: 'bg' },
      },
    })
    expect(html).toContain('hero__scrim')
    expect(html).toContain('scrim-medium')
    expect(html).toContain('anchor-bottom')
  })

  it('test_UAT_FC_REQ-32_scrim_none_paints_nothing', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { scrim: 'none' },
      content: {
        heading: 'Plain',
        subhead: 'Body.',
        image: { id: 'bg', src: 'assets/bg.png', alt: 'bg' },
      },
    })
    expect(html).not.toContain('hero__scrim')
  })
})

describe('REQ-32 primitive 4 — cool-neutral palette role', () => {
  it('test_UAT_FC_REQ-32_theme_emits_neutral_cool_custom_property', () => {
    // Default is filled even when a theme omits it (like `secondary`).
    expect(defaultTokens.palette.neutralCool).toBeDefined()
    expect(generateThemeCss()).toContain('--color-neutral-cool:')
    // And a site-supplied value flows through.
    const css = generateThemeCss({ palette: { neutralCool: '#334155' } })
    expect(css).toContain('--color-neutral-cool: #334155;')
  })

  it('test_UAT_FC_REQ-32_services_grid_can_select_cool_neutral_panel', async () => {
    expect(servicesGridMeta.contentSchema.items.itemSchema?.accent.values).toContain('neutral-cool')
    expect(servicesGridMeta.contentSchema.items.itemSchema?.surface.values).toContain('neutral-cool')
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: {},
      content: {
        items: [
          { title: 'A', body: 'x', accent: 'neutral-cool', surface: 'neutral-cool' },
          { title: 'B', body: 'y' },
        ],
      },
    })
    expect(html).toContain('accent-neutral-cool')
    expect(html).toContain('surface-neutral-cool')
  })
})

describe('REQ-32 primitives — render pipeline', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req32-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-32_pipeline_emits_all_four_primitives', async () => {
    cmdNew('acme', { cwd })
    const draft = path.join(cwd, 'storage', 'sites', 'acme', 'draft')

    const home = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))
    const header = home.modules.find((m: { type: string }) => m.type === 'header')
    header.dials = { ...header.dials, logoTreatment: 'gradient' }
    header.content = {
      ...header.content,
      logo: 'ACME',
      logoGradient: { direction: 'to-right', stops: [{ role: 'accent' }, { role: 'secondary' }] },
    }
    const hero = home.modules.find((m: { type: string }) => m.type === 'hero')
    hero.dials = { ...hero.dials, scrim: 'medium', contentAnchor: 'bottom' }
    home.modules.push({
      id: 'callout',
      type: 'text-block',
      version: 1,
      variant: 'landing',
      dials: {},
      content: { body: '> [!accent] A foundation, not a feature.' },
    })
    writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(home))

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')

    // 1. gradient wordmark, 2. callout, 3. scrim/anchor all reach the markup.
    expect(html).toContain('linear-gradient(to right, var(--color-accent) 0%')
    expect(html).toContain('fc-callout--accent')
    expect(html).toContain('scrim-medium')
    expect(html).toContain('anchor-bottom')

    // 2. callout CSS and 4. the cool-neutral token reach the stylesheet.
    expect(themeCss).toContain('blockquote.fc-callout--accent')
    expect(themeCss).toContain('--color-neutral-cool:')
  })
})
