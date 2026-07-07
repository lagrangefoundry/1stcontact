import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { generateThemeCss } from '../packages/framework/src/tokens'
import {
  CONTENT_OFFSET_TOP_DIAL,
  CONTENT_WIDTH_DIAL,
  LINE_HEIGHT_DIAL,
  SUBHEAD_WEIGHT_DIAL,
} from '../packages/framework/src/modules/dials'

/**
 * UATs for REQ-49 — the hero front-door fidelity primitives the gigabytealchemy
 * perceptual diff surfaced after config was exhausted. Each generalizes the hero
 * module (no new module), is token-backed, and — except the deliberate
 * content-width change below — preserves prior behaviour when the dial is
 * omitted:
 *
 *   1. hero subhead/body content-column width (`contentWidth`, reusing the
 *      shared container scale) — replaces the hardcoded `max-width: 60ch` so the
 *      lead/body can match a reference's measure (768px). NB: the `default`
 *      value now fills the frame (no cap); the raw 60ch is removed.
 *   2. fixed-top content offset for a `fold` hero (`contentOffsetTop`) — pins the
 *      content a token-backed distance from the band top (the reference `pt-80` =
 *      320px), reachable via the extended `--space-*` scale.
 *   3. hero subhead font-weight (`subheadWeight`) — a delicate lead weight
 *      (`light` = 300) independent of the heading.
 *   4. finer subhead leading (`snug` ~1.33) — an intermediate `subheadLeading`
 *      step between `tight` and `normal`.
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
  it('test_UAT_FC_REQ-49_hero_meta_exposes_content_width_offset_and_weight_dials', () => {
    expect(heroMeta.dials.contentWidth).toEqual(CONTENT_WIDTH_DIAL)
    expect(heroMeta.dials.contentOffsetTop).toEqual(CONTENT_OFFSET_TOP_DIAL)
    expect(heroMeta.dials.subheadWeight).toEqual(SUBHEAD_WEIGHT_DIAL)
  })

  it('test_UAT_FC_REQ-49_subhead_leading_dial_carries_intermediate_snug_step', () => {
    // The `subheadLeading` dial gains a `snug` step between `tight` and `normal`.
    expect(heroMeta.dials.subheadLeading).toEqual(LINE_HEIGHT_DIAL)
    expect(LINE_HEIGHT_DIAL).toContain('snug')
  })
})

describe('REQ-49 capability 1 — hero subhead/body content-column width', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_carries_content_width_class', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { contentWidth: 'wide' },
      content: { heading: 'Intentional Software', subhead: 'Body copy.' },
    })
    expect(html).toContain('content-width-wide')
  })

  it('test_UAT_FC_REQ-49_hero_content_width_defaults_to_full_frame', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Acme', subhead: 'Body copy.' },
    })
    // Default fills the frame (no cap) — never the narrow/wide caps.
    expect(html).toContain('content-width-default')
    expect(html).not.toContain('content-width-narrow')
    expect(html).not.toContain('content-width-wide')
  })
})

describe('REQ-49 capability 2 — fixed-top content offset for a `fold` hero', () => {
  it('test_UAT_FC_REQ-49_hero_content_pins_to_fixed_top_offset', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold', contentAnchor: 'top', contentOffsetTop: 'xl' },
      content: {
        heading: 'Intentional Software',
        subhead: 'Body copy.',
        image: { src: '/hero.jpg', alt: 'hero' },
      },
    })
    expect(html).toContain('content-offset-top-xl')
  })

  it('test_UAT_FC_REQ-49_hero_content_offset_defaults_to_none', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { height: 'fold' },
      content: { heading: 'Acme', subhead: 'Body copy.' },
    })
    expect(html).toContain('content-offset-top-none')
    expect(html).not.toContain('content-offset-top-xl')
  })
})

describe('REQ-49 capability 3 — hero subhead font-weight', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_carries_weight_class', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadWeight: 'light' },
      content: { heading: 'Acme', subhead: 'Body copy.' },
    })
    expect(html).toContain('subhead-weight-light')
  })

  it('test_UAT_FC_REQ-49_hero_subhead_weight_defaults_to_regular', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Acme', subhead: 'Body copy.' },
    })
    // Default keeps the inherited body weight (no light/medium/semibold override).
    expect(html).toContain('subhead-weight-regular')
    expect(html).not.toContain('subhead-weight-light')
  })
})

describe('REQ-49 capability 4 — finer subhead leading (`snug`)', () => {
  it('test_UAT_FC_REQ-49_hero_subhead_carries_snug_leading_class', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { subheadLeading: 'snug' },
      content: { heading: 'Acme', subhead: 'Body copy.' },
    })
    expect(html).toContain('subhead-leading-snug')
  })

  it('test_UAT_FC_REQ-49_hero_subhead_leading_still_defaults_to_relaxed', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      content: { heading: 'Acme', subhead: 'Body copy.' },
    })
    // Adding `snug` does not disturb the prior default.
    expect(html).toContain('subhead-leading-relaxed')
    expect(html).not.toContain('subhead-leading-snug')
  })
})

describe('REQ-49 token surface — extended scale backs the dials', () => {
  it('test_UAT_FC_REQ-49_theme_emits_snug_line_height_and_light_weight', () => {
    const css = generateThemeCss()
    expect(css).toContain('--line-height-snug: 1.33;')
    expect(css).toContain('--font-weight-light: 300;')
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
