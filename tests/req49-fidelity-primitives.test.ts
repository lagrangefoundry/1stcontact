import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { generateThemeCss } from '../packages/framework/src/tokens'
import {
  CONTENT_INSET_DIAL,
  CONTENT_OFFSET_TOP_DIAL,
  CONTENT_WIDTH_DIAL,
} from '../packages/framework/src/modules/dials'

/**
 * UATs for REQ-49 — the hero front-door fidelity primitives the gigabytealchemy
 * perceptual diff surfaced after config was exhausted. Post-REQ-50 the intrinsic
 * subhead typography (weight, leading) is no longer a dial: it lives on the
 * subhead run (`fontWeight`/`lineHeightPx`), resolved to an inline `style`. The
 * structural placement primitives stay dials:
 *
 *   1. hero subhead/body content-column width (`contentWidth`, reusing the
 *      shared container scale) — a structural cap kept as a dial. NB: `default`
 *      fills the frame (no cap).
 *   2. fixed-top content offset for a `fold` hero (`contentOffsetTop`) — pins the
 *      content a token-backed distance from the band top (the reference `pt-80` =
 *      320px), reachable via the extended `--space-*` scale.
 *   3. hero subhead font-weight — now the subhead run's `fontWeight` (`light`).
 *   4. finer subhead leading (`snug` ~1.33) — now the subhead run's `lineHeightPx`.
 *      The hero subhead is a single run (no lead/body split, REQ-50).
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(
    Component as Parameters<Container['renderToString']>[0],
    { props: props as Record<string, unknown> },
  )
}

describe('REQ-49 fidelity primitives — meta surfaces the dials', () => {
  it('test_UAT_FC_REQ-49_hero_meta_exposes_content_width_and_offset_dials', () => {
    expect(heroMeta.dials.contentWidth).toEqual(CONTENT_WIDTH_DIAL)
    expect(heroMeta.dials.contentOffsetTop).toEqual(CONTENT_OFFSET_TOP_DIAL)
  })

  it('test_UAT_FC_REQ-49_subhead_is_a_single_styled_run', () => {
    // REQ-50: the `subheadWeight`/`subheadLeading` dials are gone — the subhead is
    // ONE styled run whose `fontWeight`/`lineHeightPx` (incl. the `snug` alias)
    // carry those axes; multi-paragraph copy is authored as a text-block instead.
    expect(heroMeta.contentSchema.subhead).toEqual({ type: 'styled-text', required: false })
  })

  it('test_UAT_FC_REQ-49_hero_meta_exposes_content_inset_dial', () => {
    // Capability 5 — the hero content horizontal inset / gutter dial.
    expect(heroMeta.dials.contentInset).toEqual(CONTENT_INSET_DIAL)
  })

  it('test_UAT_FC_REQ-49_content_width_dial_carries_768px_step', () => {
    // Residual 1 — the 768px reading measure, now `3xl` on the Tailwind scale (REQ-55).
    expect(heroMeta.dials.contentWidth).toEqual(CONTENT_WIDTH_DIAL)
    expect(CONTENT_WIDTH_DIAL).toContain('3xl')
  })
})

describe('REQ-49 capability 1 — hero subhead/body content-column width', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_carries_content_width', async () => {
    // REQ-55: the cap is `--fc-content-width` (a named-step token), set inline; the
    // section carries `has-content-width` rather than a per-name class.
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { contentWidth: '7xl' },
      content: { heading: { text: 'Intentional Software' }, subhead: { text: 'Body copy.' } },
    })
    expect(html).toContain('has-content-width')
    expect(html).toContain('style="--fc-content-width: var(--container-7xl)"')
  })

  it('test_UAT_FC_REQ-49_hero_content_width_defaults_to_full_frame', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.' } },
    })
    // Default fills the frame (no cap) — no content-width marker or inline measure.
    expect(html).not.toContain('has-content-width')
    expect(html).not.toContain('--fc-content-width')
  })
})

describe('REQ-49 capability 2 — fixed-top content offset for a `fold` hero', () => {
  it('test_UAT_FC_REQ-49_hero_content_pins_to_fixed_top_offset', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold', contentAnchor: 'top', contentOffsetTop: 'xl' },
      content: {
        heading: { text: 'Intentional Software' },
        subhead: { text: 'Body copy.' },
        image: { src: '/hero.jpg', alt: 'hero' },
      },
    })
    expect(html).toContain('content-offset-top-xl')
  })

  it('test_UAT_FC_REQ-49_hero_content_offset_defaults_to_none', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { height: 'fold' },
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.' } },
    })
    expect(html).toContain('content-offset-top-none')
    expect(html).not.toContain('content-offset-top-xl')
  })
})

describe('REQ-49 capability 3 — hero subhead font-weight', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_carries_weight_style', async () => {
    // REQ-50: the delicate lead weight is the subhead run's `fontWeight` (a
    // `light` alias → the weight token), emitted as inline `style` on the subhead.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.', fontWeight: 'light' } },
    })
    expect(html).toMatch(
      /hero__subhead[^>]*style="[^"]*font-weight: var\(--font-weight-light\)/,
    )
  })

  it('test_UAT_FC_REQ-49_hero_subhead_weight_defaults_to_inherited', async () => {
    // A subhead run that omits `fontWeight` inherits the body weight — no inline
    // font-weight override is emitted.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.' } },
    })
    expect(html).not.toContain('font-weight')
  })
})

describe('REQ-49 capability 4 — finer subhead leading (`snug`)', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_carries_snug_leading_style', async () => {
    // REQ-50: the `snug` leading is the subhead run's `lineHeightPx` alias →
    // the intermediate line-height token, emitted as inline `style`.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.', lineHeightPx: 'snug' } },
    })
    expect(html).toMatch(
      /hero__subhead[^>]*style="[^"]*line-height: var\(--line-height-snug\)/,
    )
  })

  it('test_UAT_FC_REQ-49_hero_subhead_leading_defaults_to_no_override', async () => {
    // A subhead run that omits `lineHeightPx` inherits the base leading — no
    // inline line-height is emitted.
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.' } },
    })
    expect(html).not.toContain('line-height')
  })
})

describe('REQ-49 capability 5 — hero content horizontal inset', () => {
  it('test_UAT_FC_REQ-49_hero_carries_content_inset_class', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { contentInset: 'md' },
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.' } },
    })
    expect(html).toContain('content-inset-md')
  })

  it('test_UAT_FC_REQ-49_hero_content_inset_defaults_to_sm', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: { text: 'Acme' }, subhead: { text: 'Body copy.' } },
    })
    // Default `sm` = the prior 16px padding-inline; never a widened gutter.
    expect(html).toContain('content-inset-sm')
    expect(html).not.toContain('content-inset-md')
  })
})

describe('REQ-49 residual 1 — 768px content-width (Tailwind `3xl`, REQ-55)', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_carries_768px_content_width', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { contentWidth: '3xl' },
      content: { heading: { text: 'Intentional Software' }, subhead: { text: 'Body copy.' } },
    })
    expect(html).toContain('has-content-width')
    expect(html).toContain('style="--fc-content-width: var(--container-3xl)"')
  })
})

describe('REQ-49 residual 3 — subhead weight + leading on a single run', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_is_one_run_carrying_both_axes', async () => {
    // REQ-50: the hero subhead no longer splits into a lead + body pair — it is
    // ONE styled run. The former lead-only weight + leading dials collapse onto
    // that single run's `fontWeight` + `lineHeightPx`, both emitted together as
    // inline `style`. (Multi-paragraph copy is now authored as a text-block.)
    const html = await render(Hero, {
      variant: 'bg-color',
      content: {
        heading: { text: 'Acme' },
        subhead: { text: 'A delicate lead line.', fontWeight: 'light', lineHeightPx: 'snug' },
      },
    })
    expect(html).toContain('A delicate lead line.')
    expect(html).toMatch(
      /hero__subhead[^>]*style="[^"]*font-weight: var\(--font-weight-light\)[^"]*line-height: var\(--line-height-snug\)/,
    )
    // The subhead renders as a single paragraph, not a lead/body split.
    expect((html.match(/class="hero__subhead"/g) ?? []).length).toBe(1)
  })
})

describe('REQ-49 token surface — extended scale backs the dials', () => {
  it('test_UAT_FC_REQ-49_theme_emits_snug_line_height_and_light_weight', () => {
    const css = generateThemeCss()
    expect(css).toContain('--line-height-snug: 1.33;')
    expect(css).toContain('--font-weight-light: 300;')
  })

  it('test_UAT_FC_REQ-49_theme_emits_768px_container_measure', () => {
    // Residual 1 — the 768px reading measure, now `--container-3xl` (REQ-55).
    expect(generateThemeCss()).toContain('--container-3xl: 48rem;')
  })

  it('test_UAT_FC_REQ-49_theme_emits_large_spacing_steps_for_content_offset', () => {
    const css = generateThemeCss()
    // The `xl` offset resolves to `--space-80` = 20rem (320px, the reference inset).
    expect(css).toContain('--space-32: 8rem;')
    expect(css).toContain('--space-48: 12rem;')
    expect(css).toContain('--space-80: 20rem;')
  })

  it('test_UAT_FC_REQ-49_large_spacing_steps_survive_a_site_supplied_spacing_block', () => {
    // A site that supplies its own (base-10) spacing block must still get the new
    // large steps via the deep-merge over defaults — else `--space-80` vanishes
    // and the `contentOffsetTop: xl` inset silently collapses.
    const css = generateThemeCss({
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
    })
    expect(css).toContain('--space-80: 20rem;')
  })
})
