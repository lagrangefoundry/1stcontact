import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Header from '../packages/framework/src/modules/header/index.astro'
import { BREAKPOINT_PX } from '../packages/framework/src/modules/breakpoints'

/**
 * UATs for REQ-61 — configurable nav collapse. The header's hamburger threshold
 * was hardcoded at 768px; it is now a `navCollapse` dial (sm/md/lg/xl/none),
 * default md (which reproduces the old 768px behaviour). Media-query thresholds
 * can't read a custom property, so the breakpoint is a named overlay, not px.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Header as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

const base = { content: { wordmark: { text: 'Acme' }, entries: [] } }

describe('REQ-61 — configurable nav collapse', () => {
  it('test_UAT_FC_REQ-61_nav_collapse_defaults_to_md', async () => {
    // No dial → md, matching the former hardcoded 768px collapse.
    const html = await render({ ...base, dials: {} })
    expect(html).toContain('nav-collapse-md')
  })

  it('test_UAT_FC_REQ-61_nav_collapse_dial_selects_breakpoint', async () => {
    expect(await render({ ...base, dials: { navCollapse: 'lg' } })).toContain('nav-collapse-lg')
    // `none` still emits the class; no media rule matches it, so the nav never folds.
    expect(await render({ ...base, dials: { navCollapse: 'none' } })).toContain('nav-collapse-none')
  })

  it('test_UAT_FC_REQ-61_nav_collapse_css_gated_per_breakpoint', () => {
    // Each breakpoint has a max-width block gated on its class, at the BREAKPOINT_PX
    // threshold; `none` has none. The former unconditional @media(max-width:768px)
    // block is gone (replaced by the md-gated one).
    const src = readFileSync(
      fileURLToPath(new URL('../packages/framework/src/modules/header/index.astro', import.meta.url)),
      'utf8',
    )
    expect(src).toContain(`@media (max-width: ${BREAKPOINT_PX.md}px) { .header.nav-collapse-md .header__toggle { display: flex; }`)
    expect(src).toContain(`@media (max-width: ${BREAKPOINT_PX.lg}px) { .header.nav-collapse-lg`)
    // No ungated collapse rule remains (would collapse every header regardless of dial).
    expect(src).not.toMatch(/@media \(max-width: 768px\) \{\s*\.header__toggle/)
  })
})
