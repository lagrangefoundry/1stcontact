import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import { getModule } from '../packages/framework/src/modules/registry'

/**
 * UATs for REQ-85 acceptance `carousel_slots` — the carousel reframed as a
 * capability. Rendered through Astro's container API (the SSR path
 * tools/generate uses). Evidence that: a carousel with L1-authored slides renders
 * (each slide's presentation is a mounted L1 subtree, not module-painted chrome);
 * behavioural `config` drives scroll (`view`) and controls (`dots`); no layout
 * dials remain on the contract; and a malformed slot degrades inertly (isolation)
 * without shipping any client JS (the track is pure CSS scroll-snap, SSR-only).
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Carousel, { props: props as Record<string, unknown> })
}

// Two L1-authored slides (a text node each — the slide's whole presentation).
const slides = [
  { kind: 'text', text: 'Chef Sarah transformed our weekly meals.' },
  { kind: 'text', text: 'The postpartum service was a lifesaver.' },
]

describe('REQ-85 carousel capability — L1 slot slides', () => {
  it('test_UAT_FC_REQ-85_carousel_is_a_capability_in_the_catalog', () => {
    const def = getModule('carousel', 2)
    expect(def.meta.id).toBe('carousel')
    expect(def.meta.kind).toBe('capability')
    expect(def.Component).toBeTypeOf('function')
  })

  it('test_UAT_FC_REQ-85_no_layout_dials_remain_on_the_contract', () => {
    // The capability contract exposes behavioural config + slots only — no
    // aesthetic dials, no variants, no styled contentSchema.
    const meta = carouselMeta as Record<string, unknown>
    expect(meta.dials).toBeUndefined()
    expect(meta.variants).toBeUndefined()
    expect(meta.contentSchema).toBeUndefined()
    expect(Object.keys(carouselMeta.config).sort()).toEqual(['controls', 'view'])
    expect(Object.keys(carouselMeta.slots)).toEqual(['slide'])
  })

  it('test_UAT_FC_REQ-85_carousel_slots_renders_scroll_snap_track_with_one_slide_per_subtree', async () => {
    const html = await render({ config: { view: 'single' }, slots: { slide: slides } })
    // The behavioural core: a scroll-snap track (the swipeable affordance, no JS).
    expect(html).toMatch(/carousel__track/)
    expect(html).toMatch(/class="carousel [^"]*\bview-single\b/)
    // One slide wrapper per L1 subtree, each a named slot mount point...
    expect(html.match(/data-l1-slot="slide"/g)?.length).toBe(2)
    // ...carrying the mounted L1 presentation (the authored slide text verbatim).
    expect(html).toContain('Chef Sarah transformed our weekly meals.')
    expect(html).toContain('The postpartum service was a lifesaver.')
    // The slide look is L1, not module chrome — a namespaced L1 class is emitted.
    expect(html).toMatch(/carousel-slide-l1-\d+/)
  })

  it('test_UAT_FC_REQ-85_view_and_dots_config_drive_scroll_and_controls', async () => {
    const multi = await render({ config: { view: 'multi', controls: 'dots' }, slots: { slide: slides } })
    expect(multi).toMatch(/class="carousel [^"]*\bview-multi\b/)
    // `controls: dots` adds a decorative aria-hidden indicator, one dot per slide.
    expect(multi).toMatch(/carousel__dots[^>]*aria-hidden="true"/)
    expect(multi.match(/class="carousel__dot[" ]/g)?.length).toBe(2)
    expect(multi).toMatch(/carousel__dot is-active/)
    // Default controls omit the dots row.
    const none = await render({ config: { view: 'single' }, slots: { slide: slides } })
    expect(none).not.toMatch(/carousel__dots/)
  })

  it('test_UAT_FC_REQ-85_is_ssr_only_ships_no_client_js', async () => {
    // The carousel is a pure CSS scroll-snap capability — no island <script>, so
    // the static build carries no client-JS resource that could fail to load.
    const html = await render({ config: { view: 'single' }, slots: { slide: slides } })
    expect(html).not.toMatch(/<script/)
  })

  it('test_UAT_FC_REQ-85_isolation_malformed_slot_content_degrades_without_throwing', async () => {
    // Isolation: a null / non-object slide is dropped, not rendered, and never
    // throws — a misbehaving slot cannot break page-level robustness.
    const html = await render({
      config: {},
      slots: { slide: [null as unknown, { kind: 'text', text: 'Survivor slide' }] },
    })
    expect(html).toContain('Survivor slide')
    // Exactly one valid slide mounted (the malformed one was dropped).
    expect(html.match(/data-l1-slot="slide"/g)?.length).toBe(1)
  })
})
