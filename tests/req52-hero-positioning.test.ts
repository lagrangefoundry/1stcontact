import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import { OVERLAY_BAND_CSS } from '../packages/framework/src/modules/overlay'
import { positionVars } from '../packages/framework/src/modules/layer'

/**
 * UATs for REQ-52 — full positional control of the hero-segment objects.
 *
 * The capability generalizes the `layer` primitive's free-positioning coordinate
 * model onto the *named* objects of the hero segment: any styled run (the hero's
 * eyebrow/heading/subhead/cta, and the overlay-header wordmark) may carry a
 * `position`, and the framework — never the instance — turns it into `--fc-*`
 * custom properties + absolute placement within the shared band. A run without a
 * `position` stays in normal flow (no regression). Nothing is mocked: modules
 * render through the same Astro container path `tools/generate` uses.
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

describe('REQ-52 — positionVars is the shared framework coordinate model', () => {
  it('test_UAT_FC_REQ-52_position_compiles_to_framework_custom_properties', () => {
    // x/y/w are band percentages, z unitless, rotate degrees — the same units
    // layer children use, so a positioned hero slot and a layer child share one
    // coordinate system. No raw CSS is produced — only `--fc-*` declarations.
    const css = positionVars({ x: 12, y: 34, z: 2, width: 40, rotate: 5 })
    expect(css).toContain('--fc-x: 12%;')
    expect(css).toContain('--fc-y: 34%;')
    expect(css).toContain('--fc-z: 2;')
    expect(css).toContain('--fc-w: 40%;')
    expect(css).toContain('--fc-rotate: 5deg;')
    // Structured in, custom-properties out — never a raw positioning declaration.
    expect(css).not.toMatch(/position\s*:/)
    expect(css).not.toMatch(/left\s*:/)
  })
})

describe('REQ-52 — hero objects are freely positionable', () => {
  it('test_UAT_FC_REQ-52_positioned_hero_slot_lands_in_absolute_stack', async () => {
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold' },
      content: {
        // A styled run (lineHeightPx present) exercises the style⇄position join:
        // the resolved style has no trailing `;`, so the coordinate vars must be
        // separated or the first fuses onto `line-height` and is dropped.
        heading: { text: 'Placed heading', lineHeightPx: 90, position: { x: 8, y: 55, z: 1 } },
        subhead: { text: 'Placed subhead', position: { x: 8, y: 70, z: 1, width: 45 } },
        image: { src: 'assets/bg.png', alt: 'bg' },
      },
    })
    // A positioned slot is lifted into the full-band stack and marked positioned…
    expect(html).toContain('hero__stack')
    expect(html).toMatch(/hero__heading[^"]*hero__slot--positioned/)
    // …and carries the framework `--fc-*` coordinates on its inline style, each a
    // valid declaration (preceded by a `;` separator, not fused onto the style).
    expect(html).toMatch(/;\s*--fc-x: 8%;/)
    expect(html).toContain('--fc-y: 55%;')
    expect(html).toContain('--fc-w: 45%;')
    // The line-height stays a clean declaration (the fusion bug appended vars to
    // it, producing `line-height: 90px --fc-x: …`).
    expect(html).not.toMatch(/line-height: 90px --fc/)
  })

  it('test_UAT_FC_REQ-52_unpositioned_hero_is_unchanged_flow', async () => {
    // Regression guard: with no `position` on any slot, no stack is emitted and
    // the heading flows in `.hero__inner` exactly as before.
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: {
        heading: { text: 'Flowing heading' },
        subhead: { text: 'Flowing subhead' },
      },
    })
    expect(html).not.toContain('hero__stack')
    expect(html).not.toContain('hero__slot--positioned')
    expect(html).not.toContain('--fc-')
    expect(html).toContain('hero__heading')
  })

  it('test_UAT_FC_REQ-52_mixed_slots_split_between_flow_and_stack', async () => {
    // A slot may be positioned while its siblings flow — the positioned one goes
    // to the stack, the rest stay in the inner flow. Full per-object control.
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold' },
      content: {
        eyebrow: { text: 'Flowing eyebrow' },
        heading: { text: 'Placed heading', position: { x: 8, y: 55, z: 1 } },
        image: { src: 'assets/bg.png', alt: 'bg' },
      },
    })
    expect(html).toContain('hero__stack')
    // The eyebrow (no position) stays in flow, without the positioned marker.
    expect(html).toMatch(/hero__eyebrow(?![^>]*hero__slot--positioned)/)
    expect(html).toMatch(/hero__heading[^"]*hero__slot--positioned/)
  })
})

describe('REQ-52 — the overlay wordmark shares the hero coordinate space', () => {
  it('test_UAT_FC_REQ-52_positioned_wordmark_is_placed_in_full_band_chrome', async () => {
    const html = await render(Header, {
      variant: 'overlay',
      dials: { surface: 'inverse' },
      content: {
        // Styled wordmark (fontSizePx present) exercises the style⇄position join.
        wordmark: { text: 'Gigabyte Alchemy', fontSizePx: 72, position: { x: 6, y: 62, z: 3 } },
        entries: [],
      },
    })
    // The wordmark is lifted out of the flow row and marked positioned, carrying
    // the framework `--fc-*` coordinates — the same model as the hero slots — as
    // valid, separated declarations (not fused onto the resolved style).
    expect(html).toMatch(/header__logo[^"]*header__logo--positioned/)
    expect(html).toMatch(/;\s*--fc-x: 6%;/)
    expect(html).toContain('--fc-y: 62%;')
    expect(html).toContain('Gigabyte Alchemy')
  })

  it('test_UAT_FC_REQ-52_overlay_chrome_spans_full_band_and_is_pointer_transparent', () => {
    // The chrome must span the full band (so a wordmark % maps to the band) and
    // be pointer-transparent (it now covers the whole band); interactive
    // descendants re-enable pointer events so nav/hero stay clickable.
    expect(OVERLAY_BAND_CSS).toMatch(/\.fc-overlay-band__chrome\s*\{[^}]*inset:\s*0/)
    expect(OVERLAY_BAND_CSS).toMatch(/\.fc-overlay-band__chrome\s*\{[^}]*pointer-events:\s*none/)
    expect(OVERLAY_BAND_CSS).toMatch(/pointer-events:\s*auto/)
  })

  it('test_UAT_FC_REQ-52_unpositioned_wordmark_stays_in_flow_row', async () => {
    // Regression guard: a wordmark with no position renders in the flow row, no
    // positioned marker, no `--fc-*`.
    const html = await render(Header, {
      variant: 'overlay',
      dials: {},
      content: { wordmark: { text: 'Acme' }, entries: [] },
    })
    expect(html).not.toContain('header__logo--positioned')
    expect(html).not.toContain('--fc-')
    expect(html).toContain('Acme')
  })
})
