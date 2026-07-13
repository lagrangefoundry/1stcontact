import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'

/**
 * UATs for story-8a42499e — a prose text block fills the standard content
 * container by default (the same full-width, gutter-aligned geometry as a
 * services-grid), with a narrower reading measure available as an opt-in via the
 * `contentWidth` dial. The narrow measure is never the base, and it takes effect
 * on a plain (non-panelled) block, not only on a panelled one.
 *
 * The observable markers are the ones the module emits: the `has-content-width`
 * class (the width-constraint marker) and the inline `--fc-content-width` custom
 * property (the content-width cap). Their absence is the full-container default.
 * Blocks are rendered through Astro's container API — the same SSR path
 * tools/generate uses. The scoped CSS geometry is read from the module source.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

function moduleSource(rel: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../packages/framework/src/modules/${rel}`, import.meta.url)),
    'utf8',
  )
}

describe('story-8a42499e — prose fills the content container by default, narrow measure is opt-in', () => {
  it('test_UAT_AC601_default_prose_block_is_full_container_width_centred', async () => {
    // AC-601: a prose block with no `contentWidth` dial lays its content column
    // out at the standard full content-container width, horizontally centred —
    // the same geometry a services-grid produces, NOT a narrow off-centre column.
    const html = await render(TextBlock, { variant: 'prose', dials: {}, content: { body: 'hi' } })
    expect(html).toContain('variant-prose')
    // No narrow cap is applied — the default fills the frame.
    expect(html).not.toContain('has-content-width')
    expect(html).not.toContain('--fc-content-width')

    const textBlockCss = moduleSource('text-block/index.astro')
    // The prose base column is the standard container step (6xl = 1152px, REQ-55),
    // the default step — not a narrow one.
    expect(textBlockCss).toMatch(/\.text-block\.variant-prose \.text-block__inner\s*\{[^}]*max-width:\s*var\(--container-6xl\)/)
    expect(textBlockCss).not.toMatch(/\.text-block\.variant-prose \.text-block__inner\s*\{[^}]*max-width:\s*var\(--container-(sm|md|lg|xl|2xl|3xl)\)/)
    // Horizontally centred (margin-inline:auto → pinned at the gutter on desktop).
    expect(textBlockCss).toMatch(/\.text-block__inner\s*\{[^}]*margin-inline:\s*auto/)

    // The same column geometry a services-grid produces: full 6xl container,
    // margin-inline:auto. Reading the services-grid source shows the identical pair.
    const servicesGridCss = moduleSource('services-grid/index.astro')
    expect(servicesGridCss).toMatch(/\.services-grid__inner\s*\{[^}]*max-width:\s*var\(--container-6xl\)/)
    expect(servicesGridCss).toMatch(/\.services-grid__inner\s*\{[^}]*margin-inline:\s*auto/)
  })

  it('test_UAT_AC602_contentWidth_narrows_a_plain_non_panelled_block', async () => {
    // AC-602: setting `contentWidth` on a prose block — including an ordinary
    // block with no contained panel — marks it width-constrained and caps its
    // content to the requested measure. The constraint is NOT inert on a plain
    // (panel-none) block.
    const html = await render(TextBlock, {
      variant: 'prose',
      dials: { panel: 'none', contentWidth: '3xl' },
      content: { body: 'A narrower reading measure.' },
    })
    // The block is a plain, non-panelled block...
    expect(html).toContain('panel-none')
    // ...and it is marked width-constrained and capped to the requested measure.
    expect(html).toContain('has-content-width')
    expect(html).toContain('style="--fc-content-width: var(--container-3xl)"')

    // The content-child cap that narrows a plain block is ungated by panel — it
    // applies to any `.has-content-width` block, so it is not inert on panel-none.
    const textBlockCss = moduleSource('text-block/index.astro')
    expect(textBlockCss).toMatch(
      /\.text-block\.has-content-width \.text-block__inner > \*\s*\{[^}]*max-width:\s*var\(--fc-content-width\)/,
    )
  })

  it('test_UAT_AC603_prose_block_not_narrowed_unless_contentWidth_set', async () => {
    // AC-603: the narrow measure is opt-in and never the base. Absence of the
    // `contentWidth` dial yields no width-constraint marker and no cap; setting it
    // is what produces the marker — demonstrating the narrow measure appears only
    // when explicitly requested.
    const withoutDial = await render(TextBlock, {
      variant: 'prose',
      dials: {},
      content: { body: 'x' },
    })
    expect(withoutDial).not.toContain('has-content-width')
    expect(withoutDial).not.toContain('--fc-content-width')

    const withDial = await render(TextBlock, {
      variant: 'prose',
      dials: { contentWidth: '2xl' },
      content: { body: 'x' },
    })
    expect(withDial).toContain('has-content-width')
    expect(withDial).toContain('style="--fc-content-width: var(--container-2xl)"')
  })
})
