import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { textBlockMeta } from '../packages/framework/src/modules/text-block/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'

// Read a module's .astro source for CSS-rule assertions (Astro's container
// rewrites scoped selectors with data-astro-cid hashes, so we assert the
// authored rule against source — the pattern the card-treatment UATs use).
function source(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}
const textBlockCss = source('../packages/framework/src/modules/text-block/index.astro')
const gridCss = source('../packages/framework/src/modules/services-grid/index.astro')

/**
 * UATs for REQ-36 — the `headingTreatment` colour dial generalized from the hero
 * onto the flat-content modules (text-block + services-grid). `accent` fills the
 * heading solid gold (`--color-accent`), `gold` the metallic gradient; `plain`
 * (default) inherits the band colour so a section that omits the dial is
 * unchanged. On services-grid the treatment colours the grid heading *and* the
 * card titles, so one grid can read gold (Offerings) while another stays white.
 */
type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Comp: unknown, props: Record<string, unknown>) {
  container ??= await AstroContainer.create()
  return container.renderToString(Comp as Parameters<Container['renderToString']>[0], { props })
}

describe('REQ-36 heading treatment — text-block', () => {
  const content = { heading: 'THE HOLISTIC APPROACH', body: 'Prose.' }

  it('test_UAT_FC_REQ-36_textblock_accent_colours_the_heading', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: { headingTreatment: 'accent' }, content })
    expect(html).toContain('text-block__heading treatment-accent')
    // The scoped CSS fills the heading with the accent token (the effect).
    expect(textBlockCss).toMatch(/\.text-block__heading\.treatment-accent\s*\{[^}]*color:\s*var\(--color-accent\)/)
  })

  it('test_UAT_FC_REQ-36_textblock_default_is_plain_unchanged', async () => {
    const html = await render(TextBlock, { variant: 'prose', content })
    expect(html).toContain('treatment-plain')
    expect(html).not.toContain('treatment-accent')
  })

  it('test_UAT_FC_REQ-36_textblock_gradient_value_is_not_a_dial_option', () => {
    // `gradient` needs a headingGradient content field — excluded from the flat
    // module's dial so it can never be a silently-inert value.
    expect(textBlockMeta.dials.headingTreatment).toEqual(['plain', 'accent', 'gold'])
  })
})

describe('REQ-36 heading treatment — services-grid', () => {
  const items = [
    { title: 'Personal Chef Services', body: 'Weekly.' },
    { title: 'Cooking Classes', body: 'Small groups.' },
  ]

  it('test_UAT_FC_REQ-36_grid_accent_colours_heading_and_card_titles', async () => {
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      dials: { headingTreatment: 'accent' },
      content: { heading: 'Our Offerings', items },
    })
    expect(html).toContain('treatment-accent')
    // Effect: the rule targets BOTH the grid heading and the card titles.
    expect(gridCss).toMatch(/\.services-grid\.treatment-accent\s+\.services-grid__heading/)
    expect(gridCss).toMatch(/\.services-grid\.treatment-accent\s+\.services-grid__card-title\s*\{[^}]*color:\s*var\(--color-accent\)/)
  })

  it('test_UAT_FC_REQ-36_grid_default_plain_keeps_titles_on_band_colour', async () => {
    const html = await render(ServicesGrid, { variant: 'three-col', content: { items } })
    expect(html).toContain('treatment-plain')
    expect(html).not.toContain('treatment-accent')
  })

  it('test_UAT_FC_REQ-36_grid_treatment_composes_with_bare_and_variant', async () => {
    for (const variant of servicesGridMeta.variants) {
      const html = await render(ServicesGrid, {
        variant,
        dials: { headingTreatment: 'accent', cardSurface: 'bare' },
        content: { items },
      })
      expect(html).toContain(`variant-${variant}`)
      expect(html).toContain('treatment-accent')
      expect(html).toContain('card-surface-bare')
    }
  })
})
