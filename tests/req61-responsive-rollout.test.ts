import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import Footer from '../packages/framework/src/modules/footer/index.astro'
import { overrideChain } from '../packages/framework/src/modules/breakpoints'

/**
 * UATs for REQ-61 — the per-breakpoint rollout across every length dial (the
 * REQ-58 audit's length values: spacing, gap, logoSize, contentOffsetTop,
 * contentInset, panelPad). Each owning module (a) resolves the dial through
 * responsiveStepVars and (b) carries the scoped override-and-up media chain.
 *
 * The chains are asserted against the tested `overrideChain` generator (not
 * hardcoded), so a module that drifts from the shared primitive fails here.
 */

const MOD = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(`../packages/framework/src/modules/${rel}`, import.meta.url)), 'utf8')

/** Every module × the length keys it owns, and the CSS property each re-points. */
const ROLLOUT: { file: string; keys: { dialKey: string; cssProp: string }[] }[] = [
  { file: 'text-block/index.astro', keys: [
    { dialKey: 'pt', cssProp: 'padding-top' },
    { dialKey: 'pb', cssProp: 'padding-bottom' },
    { dialKey: 'panel-pad', cssProp: 'padding' },
  ] },
  { file: 'services-grid/index.astro', keys: [
    { dialKey: 'pt', cssProp: 'padding-top' },
    { dialKey: 'gap', cssProp: 'gap' },
  ] },
  { file: 'header/index.astro', keys: [
    { dialKey: 'pt', cssProp: 'padding-top' },
    { dialKey: 'logo', cssProp: 'height' },
  ] },
  { file: 'hero/index.astro', keys: [
    { dialKey: 'pt', cssProp: 'padding-top' },
    { dialKey: 'offset-top', cssProp: 'margin-top' },
    { dialKey: 'inset', cssProp: 'padding-inline' },
  ] },
  { file: 'footer/index.astro', keys: [{ dialKey: 'pt', cssProp: 'padding-top' }] },
  { file: 'contact-form/index.astro', keys: [{ dialKey: 'pt', cssProp: 'padding-top' }] },
]

describe('REQ-61 — every length dial carries the per-breakpoint override chain', () => {
  for (const { file, keys } of ROLLOUT) {
    it(`test_UAT_FC_REQ-61_rollout_${file.split('/')[0].replace(/-/g, '_')}`, () => {
      const src = MOD(file)
      for (const { dialKey, cssProp } of keys) {
        // The dial resolves through the responsive seam (emits base + -<bp> vars).
        expect(src).toContain(`responsiveStepVars('${dialKey}'`)
        // The deepest (xl) override chain is present, re-pointing the CSS property —
        // asserted against the shared generator so a hand-written drift is caught.
        expect(src).toContain(`${cssProp}: ${overrideChain(dialKey, 3)}`)
        // The four breakpoint widths are all present for this property.
        expect(src).toContain(`${cssProp}: ${overrideChain(dialKey, 0)}`)
      }
    })
  }
})

// ── two more end-to-end render checks (beyond text-block in the foundation) ──

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

describe('REQ-61 — rollout emits per-breakpoint vars at render time', () => {
  it('test_UAT_FC_REQ-61_services_grid_gap_per_breakpoint', async () => {
    const html = await render(ServicesGrid, {
      variant: 'cards',
      dials: { gap: { base: 16, lg: 40 } },
      content: { cards: [{ title: 'A', body: 'x' }] },
    })
    expect(html).toContain('--fc-gap: 16px')
    expect(html).toContain('--fc-gap-lg: 40px')
  })

  it('test_UAT_FC_REQ-61_footer_spacing_per_breakpoint', async () => {
    const html = await render(Footer, {
      variant: 'columns',
      dials: { spacingTop: { base: 24, md: 64 } },
      content: { copyright: '© 2026' },
    })
    expect(html).toContain('--fc-pt: 24px')
    expect(html).toContain('--fc-pt-md: 64px')
    // Scalar spacingBottom (absent) still emits just the base var.
    expect(html).not.toContain('--fc-pb-md')
  })
})
