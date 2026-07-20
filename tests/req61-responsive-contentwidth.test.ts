import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import { responsiveContainerWidthVars } from '../packages/framework/src/modules/dials'
import { overrideChain } from '../packages/framework/src/modules/breakpoints'

/**
 * UATs for REQ-61 — per-breakpoint `contentWidth` (the max-width cap). Unlike the
 * plain length dials, a cap can mean "no cap" (bleed/absent → null), so the
 * resolver returns both the vars and whether a base cap exists (gates the
 * `has-content-width` class).
 */

describe('REQ-61 — responsiveContainerWidthVars handles caps + no-cap', () => {
  it('test_UAT_FC_REQ-61_content_width_scalar_and_bleed', () => {
    expect(responsiveContainerWidthVars(896)).toEqual({ decls: '--fc-content-width: 896px', hasCap: true })
    expect(responsiveContainerWidthVars('4xl')).toEqual({ decls: '--fc-content-width: var(--container-4xl)', hasCap: true })
    // bleed / absent → no cap: no decls, class stays off.
    expect(responsiveContainerWidthVars('bleed')).toEqual({ decls: '', hasCap: false })
    expect(responsiveContainerWidthVars(undefined)).toEqual({ decls: '', hasCap: false })
  })

  it('test_UAT_FC_REQ-61_content_width_per_breakpoint', () => {
    const { decls, hasCap } = responsiveContainerWidthVars({ base: '4xl', lg: 896 })
    expect(hasCap).toBe(true)
    expect(decls).toBe('--fc-content-width: var(--container-4xl); --fc-content-width-lg: 896px')
    // A per-breakpoint cap needs a base cap (the class hangs off it); a bleed base
    // means no cap at all, so overrides are dropped with it.
    expect(responsiveContainerWidthVars({ base: 'bleed', md: 896 }).hasCap).toBe(false)
  })
})

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Carousel as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

describe('REQ-61 — carousel honours a per-breakpoint contentWidth', () => {
  it('test_UAT_FC_REQ-61_carousel_content_width_per_breakpoint', async () => {
    const html = await render({
      dials: { contentWidth: { base: '4xl', lg: 896 } },
      content: { items: [{ body: 'A quote.' }] },
    })
    expect(html).toContain('has-content-width')
    expect(html).toContain('--fc-content-width: var(--container-4xl)')
    expect(html).toContain('--fc-content-width-lg: 896px')
  })

  it('test_UAT_FC_REQ-61_content_width_module_carries_override_chain', () => {
    // The carousel contentWidth consumer carries the xl override chain (asserted
    // against the shared generator).
    const xl = overrideChain('content-width', 3)
    const src = readFileSync(
      fileURLToPath(new URL('../packages/framework/src/modules/carousel/index.astro', import.meta.url)),
      'utf8',
    )
    expect(src).toContain(`max-width: ${xl}`)
  })
})
