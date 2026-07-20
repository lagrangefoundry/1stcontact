import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { textBlockMeta } from '../packages/framework/src/modules/text-block/meta'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import { getModule } from '../packages/framework/src/modules/registry'

/**
 * UATs for REQ-79 — the generalizable `carousel` module. Rendered through Astro's
 * container API (the same SSR path tools/generate uses) and asserted on the
 * produced markup. The module is a pure CSS scroll-snap row (no client JS), so the
 * container output IS the shipped output. Content shapes covered: a testimonial
 * rotator (quote + author + role + avatar) and a bare logo/gallery strip.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Carousel, { props: props as Record<string, unknown> })
}

const testimonials = {
  heading: { text: 'What people are saying' },
  items: [
    {
      body: 'Chef Sarah transformed our weekly meals.',
      title: { text: 'Jane D.' },
      subtitle: { text: 'Portland, OR' },
      image: { src: '/avatar-1.jpg', alt: 'Jane' },
    },
    {
      body: 'The postpartum service was a lifesaver.',
      title: { text: 'Mark T.' },
      subtitle: { text: 'Seattle, WA' },
      image: { src: '/avatar-2.jpg', alt: 'Mark' },
    },
  ],
}

describe('REQ-79 carousel module', () => {
  it('test_UAT_FC_REQ-79_carousel_registered_in_catalog', () => {
    const def = getModule('carousel', 1)
    expect(def.meta.id).toBe('carousel')
    expect(def.Component).toBeTypeOf('function')
  })

  it('test_UAT_FC_REQ-79_testimonial_content_validates_against_meta', () => {
    // The testimonial shape (quote=body, author=title, role=subtitle, avatar=image)
    // maps onto the generalized slide schema with zero errors.
    const errors = validateModuleContent(carouselMeta, testimonials)
    expect(errors).toEqual([])
  })

  it('test_UAT_FC_REQ-79_renders_scroll_snap_track_with_one_slide_per_item', async () => {
    const html = await render({ dials: { view: 'single' }, content: testimonials })
    // A real scroll-snap track (the swipeable affordance, no JS).
    expect(html).toMatch(/carousel__track/)
    expect(html).toMatch(/class="carousel [^"]*\bview-single\b/)
    // One slide per content item, each carrying its quote + author + role + avatar.
    expect(html.match(/class="carousel__slide[" ]/g)?.length).toBe(2)
    expect(html).toContain('Chef Sarah transformed our weekly meals.')
    expect(html).toContain('Jane D.')
    expect(html).toContain('Portland, OR')
    expect(html).toMatch(/carousel__media/)
  })

  it('test_UAT_FC_REQ-79_section_surfaceFill_paints_the_band_over_the_surface_enum', async () => {
    // The testimonial band is a mid-grey the closed `surface` enum can't express: an
    // absolute-or-role fill paints it inline while `surface: inverse` keeps light text.
    const html = await render({ dials: { surface: 'inverse' }, content: { ...testimonials, surfaceFill: 'muted' } })
    expect(html).toMatch(/background-color:\s*var\(--color-muted\)/)
    expect(html).toMatch(/surface-inverse/)
    expect(validateModuleContent(carouselMeta, { ...testimonials, surfaceFill: 'muted' })).toEqual([])
  })

  it('test_UAT_FC_REQ-79_dots_controls_add_one_indicator_per_slide', async () => {
    const withDots = await render({ dials: { controls: 'dots' }, content: testimonials })
    // A decorative, aria-hidden indicator with one dot per slide, first active.
    expect(withDots).toMatch(/carousel__dots[^>]*aria-hidden="true"/)
    expect(withDots.match(/class="carousel__dot[" ]/g)?.length).toBe(2)
    expect(withDots).toMatch(/carousel__dot is-active/)
    // `none` (default) renders no indicator.
    const noDots = await render({ dials: {}, content: testimonials })
    expect(noDots).not.toMatch(/carousel__dots/)
  })

  it('test_UAT_FC_REQ-79_multi_view_and_bare_slides_generalize_to_a_logo_strip', async () => {
    // The same module, image-only slides, multi-per-view, bare (no card chrome) —
    // a gallery / logo strip, proving the module is not testimonial-specific.
    const logos = {
      items: [
        { image: { src: '/logo-a.svg', alt: 'A' } },
        { image: { src: '/logo-b.svg', alt: 'B' } },
        { image: { src: '/logo-c.svg', alt: 'C' } },
      ],
    }
    expect(validateModuleContent(carouselMeta, logos)).toEqual([])
    const html = await render({ dials: { view: 'multi', cardSurface: 'bare' }, content: logos })
    expect(html).toMatch(/class="carousel [^"]*\bview-multi\b/)
    expect(html).toMatch(/card-surface-bare/)
    expect(html.match(/class="carousel__slide[" ]/g)?.length).toBe(3)
  })
})

async function renderGrid(props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(ServicesGrid, { props: props as Record<string, unknown> })
}

describe('REQ-79 services-grid section surfaceFill', () => {
  const items = [
    { title: { text: 'A' }, body: 'a' },
    { title: { text: 'B' }, body: 'b' },
  ]

  it('test_UAT_FC_REQ-79_section_surfaceFill_hex_overrides_band_background', async () => {
    // A captured mid-grey band the closed `surface` enum can't express: an absolute
    // #hex paints the band background inline (winning over the `.surface-*` class),
    // while `surface: inverse` still supplies the light text colour.
    const html = await renderGrid({ dials: { surface: 'inverse' }, content: { surfaceFill: '#7a7a7a', items } })
    expect(html).toMatch(/background-color:\s*#7a7a7a/)
    expect(html).toMatch(/surface-inverse/) // text-colour class preserved
  })

  it('test_UAT_FC_REQ-79_section_surfaceFill_accepts_palette_role', async () => {
    // The overlay side of absolute-or-overlay: a palette role resolves to its token.
    const html = await renderGrid({ dials: {}, content: { surfaceFill: 'muted', items } })
    expect(html).toMatch(/background-color:\s*var\(--color-muted\)/)
  })

  it('test_UAT_FC_REQ-79_section_surfaceFill_absent_paints_no_inline_background', async () => {
    const html = await renderGrid({ dials: { surface: 'subtle' }, content: { items } })
    expect(html).not.toMatch(/background-color:/)
    expect(validateModuleContent(servicesGridMeta, { items })).toEqual([])
  })
})

async function renderTextBlock(props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(TextBlock, { props: props as Record<string, unknown> })
}

describe('REQ-79 text-block section surfaceFill', () => {
  it('test_UAT_FC_REQ-79_text_block_surfaceFill_paints_grey_band_with_gold_checks', async () => {
    // The "WHO USES OUR SERVICES" band: a mid-grey the `surface` enum can't express,
    // with a gold accent ✓ checklist (listMarker: check) — the exact reproduction shape.
    const html = await renderTextBlock({
      dials: { surface: 'inverse', listMarker: 'check' },
      content: { heading: { text: 'WHO USES OUR SERVICES' }, body: '- Busy families\n- Postpartum families', surfaceFill: 'muted' },
    })
    expect(html).toMatch(/background-color:\s*var\(--color-muted\)/)
    expect(html).toMatch(/surface-inverse/) // white text preserved
    expect(html).toMatch(/list-marker-check/) // accent ✓ marker
    expect(validateModuleContent(textBlockMeta, { body: 'x', surfaceFill: 'muted' })).toEqual([])
  })
})
