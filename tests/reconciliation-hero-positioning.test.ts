import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import { OVERLAY_BAND_CSS } from '../packages/framework/src/modules/overlay'

/**
 * Reconciliation UATs for story-d70a0264 — "Free-position named hero-segment
 * objects". One UAT per acceptance criterion (AC-594..AC-600).
 *
 * The capability generalizes the framework's shared free-positioning coordinate
 * model (the `--fc-*` band model used by layer children, via `positionVars`)
 * onto the *named* objects of the hero segment: the hero eyebrow/heading/
 * subhead/cta runs and the overlay-header wordmark. Any styled run may carry a
 * `position`; when present the framework — never the instance — lifts the object
 * out of normal flow into a full-band absolute canvas and places it by band
 * percentages (x/y/w %), a unitless z and a `deg` rotate. A run without a
 * `position` flows exactly as before (zero regression).
 *
 * Nothing is mocked: each module renders through the same Astro SSR container
 * path (`renderToString`) that `tools/generate` uses in production.
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

describe('story-d70a0264 — hero objects placed by the shared band-coordinate model', () => {
  it('test_UAT_AC594_positioned_hero_object_placed_by_band_coordinates', async () => {
    // AC-594: a hero object carrying a `position` is lifted out of normal flow
    // and absolutely placed within the full-band canvas, with offset/size/layer/
    // rotation from band-relative units (x/y/w %, z unitless, rotate deg).
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold' },
      content: {
        heading: {
          text: 'Placed heading',
          position: { x: 8, y: 55, z: 2, width: 45, rotate: 4 },
        },
        image: { src: 'assets/bg.png', alt: 'bg' },
      },
    })
    // Lifted onto the full-band absolute canvas (the stack), not the flow column.
    expect(html).toContain('hero__stack')
    expect(html).toMatch(/hero__heading[^"]*hero__slot--positioned/)
    // The only heading is the positioned one — nothing left in the flowed column.
    expect(html).not.toMatch(/hero__heading(?![^>]*hero__slot--positioned)/)
    // Placement values in band-relative units: x/y/w as percentages…
    expect(html).toContain('--fc-x: 8%;')
    expect(html).toContain('--fc-y: 55%;')
    expect(html).toContain('--fc-w: 45%;')
    // …z unitless, rotate in degrees.
    expect(html).toContain('--fc-z: 2;')
    expect(html).toContain('--fc-rotate: 4deg;')
  })

  it('test_UAT_AC595_unpositioned_hero_renders_normal_flow_unchanged', async () => {
    // AC-595: a hero whose objects carry no position renders exactly as before —
    // every object in normal flow, no full-band container, no band coordinates.
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: {
        heading: { text: 'Flowing heading' },
        subhead: { text: 'Flowing subhead' },
      },
    })
    // The flowed heading is present…
    expect(html).toContain('hero__heading')
    expect(html).toContain('Flowing heading')
    // …and no positioning apparatus is emitted at all.
    expect(html).not.toContain('hero__stack')
    expect(html).not.toContain('hero__slot--positioned')
    expect(html).not.toContain('--fc-')
  })

  it('test_UAT_AC596_mixed_positioned_and_flowed_hero_objects_split_per_object', async () => {
    // AC-596: positioning is decided per object — a positioned heading lifts onto
    // the canvas while an unpositioned eyebrow stays in the normal content flow.
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
    // Eyebrow (no position) stays in flow — no positioned marker on it.
    expect(html).toMatch(/hero__eyebrow(?![^>]*hero__slot--positioned)/)
    // Heading (position) is on the full-band absolute canvas.
    expect(html).toMatch(/hero__heading[^"]*hero__slot--positioned/)
  })
})

describe('story-d70a0264 — the overlay-header wordmark shares the hero coordinate space', () => {
  it('test_UAT_AC597_overlay_wordmark_shares_hero_coordinate_space', async () => {
    // AC-597: a positioned overlay-header wordmark is lifted out of the flow row
    // and placed by the same band-coordinate model, its text preserved, while the
    // navigation stays in its normal place.
    const html = await render(Header, {
      variant: 'overlay',
      dials: { surface: 'inverse' },
      content: {
        wordmark: { text: 'Gigabyte Alchemy', fontSizePx: 72, position: { x: 6, y: 62, z: 3 } },
        entries: [{ label: 'About', target: { kind: 'anchor', moduleId: 'about' } }],
      },
    })
    // Lifted out of the flow row into a positioned object…
    expect(html).toMatch(/header__logo[^"]*header__logo--positioned/)
    // …with band-coordinate placement values (x → 6%, y → 62%)…
    expect(html).toContain('--fc-x: 6%;')
    expect(html).toContain('--fc-y: 62%;')
    // …its text intact…
    expect(html).toContain('Gigabyte Alchemy')
    // …while the nav stays in its normal place.
    expect(html).toContain('header__nav')
    expect(html).toContain('About')
  })

  it('test_UAT_AC598_overlay_chrome_spans_full_band_and_pointer_transparent', () => {
    // AC-598: the overlay chrome spans the full band (inset 0) and is
    // pointer-transparent, while its interactive controls re-enable pointer
    // events so the nav stays clickable and clicks pass through to the hero.
    // Full-band: the chrome covers the whole band.
    expect(OVERLAY_BAND_CSS).toMatch(/\.fc-overlay-band__chrome\s*\{[^}]*inset:\s*0/)
    // Pointer-transparent chrome.
    expect(OVERLAY_BAND_CSS).toMatch(/\.fc-overlay-band__chrome\s*\{[^}]*pointer-events:\s*none/)
    // Its interactive descendants (nav links / buttons) re-enable pointer events.
    expect(OVERLAY_BAND_CSS).toMatch(/\.fc-overlay-band__chrome (a|button)/)
    expect(OVERLAY_BAND_CSS).toMatch(/pointer-events:\s*auto/)
  })

  it('test_UAT_AC599_unpositioned_wordmark_stays_in_flow_row_unchanged', () => {
    // AC-599: a wordmark with no position renders in the normal flow row exactly
    // as before — no positioned placement, no band-coordinate values present.
    return render(Header, {
      variant: 'overlay',
      dials: {},
      content: { wordmark: { text: 'Acme' }, entries: [] },
    }).then((html) => {
      // The wordmark renders inside the flow row (the inner row precedes it).
      expect(html).toMatch(/header__inner[\s\S]*header__wordmark/)
      expect(html).toContain('Acme')
      // No positioned placement and no band-coordinate values.
      expect(html).not.toContain('header__logo--positioned')
      expect(html).not.toContain('--fc-')
    })
  })
})

describe('story-d70a0264 — a run\'s typography style and position combine losslessly', () => {
  it('test_UAT_AC600_run_typography_style_and_position_combine_losslessly', async () => {
    // AC-600: when a positioned object also carries typography (here an explicit
    // line-height), the typography declaration and the first coordinate value
    // each render as their own valid, separate declaration — neither is fused
    // onto nor consumed by the other.
    const html = await render(Hero, {
      variant: 'bg-image',
      dials: { height: 'fold' },
      content: {
        heading: { text: 'Styled + placed', lineHeightPx: 90, position: { x: 8, y: 55, z: 1 } },
        image: { src: 'assets/bg.png', alt: 'bg' },
      },
    })
    // The line-height is terminated by `;` before the leading `--fc-x` coordinate:
    // both are separate, valid declarations.
    expect(html).toMatch(/line-height: 90px;\s*--fc-x: 8%;/)
    // The pre-fix fusion bug (`line-height: 90px --fc-x: …`) must NOT appear.
    expect(html).not.toMatch(/line-height: 90px --fc/)
    // Both take effect: the placement coordinates are present and valid.
    expect(html).toContain('--fc-y: 55%;')
  })
})
