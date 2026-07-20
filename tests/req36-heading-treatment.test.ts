import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import { SPACING_STEPS } from '../packages/framework/src/modules/dials'
import { generateThemeCss } from '../packages/framework/src/tokens/index'

/**
 * UATs for REQ-36 — the framework primitives that survive the REQ-84
 * layout-module strip. The `headingTreatment` colour dial and the per-module
 * fidelity dials (hero/header/footer/text-block/services-grid) are gone with
 * those modules; what remains here is the module-independent capability:
 *
 *   - the shared heading letter-case treatment (`headingCase` → `case-upper`),
 *     exercised via the surviving `carousel`;
 *   - the shared spacing / gap step overlay (REQ-58 absolute-or-overlay), likewise
 *     via `carousel`;
 *   - the theme-token surface (`generateThemeCss`) — scrim, extralight weight,
 *     accent-mid, the Tailwind container scale, and the label font family.
 */
type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Comp: unknown, props: Record<string, unknown>) {
  container ??= await AstroContainer.create()
  return container.renderToString(Comp as Parameters<Container['renderToString']>[0], { props })
}

const item = { title: { text: 'A' } }

describe('REQ-36 heading letter-case (upper) — DOM stays literal', () => {
  it('test_UAT_FC_REQ-36_carousel_upper_transforms_render_but_keeps_literal_text', async () => {
    const html = await render(Carousel, {
      dials: { headingCase: 'upper' },
      content: { heading: { text: 'Dreaming of healthier meals' }, items: [item] },
    })
    // The uppercase is a render-time transform (class + CSS)…
    expect(html).toContain('case-upper')
    // …and the DOM text node is LEFT LITERAL (mixed case) — so a faithful-repro
    // values-diff still pairs on the source text, not a synthesised uppercase.
    expect(html).toContain('Dreaming of healthier meals')
    expect(html).not.toContain('DREAMING OF HEALTHIER MEALS')
  })

  it('test_UAT_FC_REQ-36_case_default_is_normal', async () => {
    const html = await render(Carousel, {
      content: { heading: { text: 'Our Offerings' }, items: [item] },
    })
    expect(html).toContain('case-normal')
    expect(html).not.toContain('case-upper')
  })
})

describe('REQ-36 scrim token', () => {
  it('test_UAT_FC_REQ-36_scrim_token_defaults_to_a_near_black', () => {
    // The generated theme always declares --color-scrim, defaulting dark so a
    // scrim darkens for contrast even when the site omits the role.
    const css = generateThemeCss({ palette: { primary: '#ff0000' } })
    const m = css.match(/--color-scrim:\s*(#[0-9a-fA-F]{6})/)
    expect(m).not.toBeNull()
    const hex = m![1]
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    // Luminance well below mid-grey — a genuine darkening tint, not a wash.
    expect((r + g + b) / 3).toBeLessThan(40)
  })
})

describe('REQ-36 extended spacing + gap scale — airy sections', () => {
  it('test_UAT_FC_REQ-36_spacing_2xl_3xl_step_past_xl', async () => {
    // REQ-58: spacing resolves (step OR absolute px) to an inline --fc-pt/--fc-pb
    // var, replacing the per-step classes. The two steps past `xl` still resolve.
    const html = await render(Carousel, {
      dials: { spacingTop: '3xl', spacingBottom: '2xl' },
      content: { items: [item] },
    })
    expect(html).toContain('--fc-pt: var(--space-48)') // 3xl
    expect(html).toContain('--fc-pb: var(--space-32)') // 2xl
  })

  it('test_UAT_FC_REQ-36_every_spacing_module_renders_the_new_steps', async () => {
    // The shared overlay carries 2xl/3xl, and no spacing-bearing module may drop
    // the inline var. An ABSOLUTE px must also bypass the overlay (REQ-58).
    expect(SPACING_STEPS['2xl']).toBe('var(--space-32)')
    expect(SPACING_STEPS['3xl']).toBe('var(--space-48)')
    const step = await render(Carousel, { dials: { spacingTop: '3xl' }, content: { items: [item] } })
    expect(step).toContain('--fc-pt: var(--space-48)') // step → overlay token
    const abs = await render(Carousel, { dials: { spacingTop: '80px' }, content: { items: [item] } })
    expect(abs).toContain('--fc-pt: 80px') // absolute value → verbatim
  })

  it('test_UAT_FC_REQ-36_gap_airy_widens_the_track_gap', async () => {
    // REQ-58: gap resolves (step OR absolute px) to an inline --fc-gap var.
    const airy = await render(Carousel, { dials: { gap: 'airy' }, content: { items: [item] } })
    expect(airy).toContain('--fc-gap: var(--space-16)') // airy step → token
    const abs = await render(Carousel, { dials: { gap: '40px' }, content: { items: [item] } })
    expect(abs).toContain('--fc-gap: 40px') // absolute value → verbatim
  })
})

describe('REQ-36 extralight weight token', () => {
  it('test_UAT_FC_REQ-36_extralight_weight_token_emitted_as_200', () => {
    const css = generateThemeCss({ palette: { primary: '#ff0000' } })
    expect(css).toMatch(/--font-weight-extralight:\s*200/)
  })
})

describe('REQ-36 theme token surface — container scale, accent-mid, label font', () => {
  it('test_UAT_FC_REQ-36_accent_mid_declared_out_of_the_box', () => {
    // The default palette declares `--color-accent-mid` in :root even when a site
    // omits accentMid, so a surface referencing it never renders undefined.
    const css = generateThemeCss({})
    expect(css).toMatch(/:root\s*\{[^}]*--color-accent-mid:/)
  })

  it('test_UAT_FC_REQ-36_theme_emits_tailwind_container_scale', () => {
    // REQ-55: the container scale is Tailwind's `max-w` steps; each is a
    // default-filled optional slot, so every theme emits the whole scale.
    const css = generateThemeCss({})
    expect(css).toMatch(/--container-lg:\s*32rem/)
    expect(css).toMatch(/--container-4xl:\s*56rem/)
  })

  it('test_UAT_FC_REQ-36_theme_emits_font_family_label_from_the_label_role', () => {
    const withLabel = generateThemeCss({ typography: { family: { heading: 'Oswald', body: 'Karla', label: 'Raleway' } } })
    expect(withLabel).toMatch(/--font-family-label:\s*Raleway/)
    // Omitting the role falls back to the body family, so an existing theme is unchanged.
    const without = generateThemeCss({ typography: { family: { heading: 'Oswald', body: 'Karla' } } })
    expect(without).toMatch(/--font-family-label:\s*Karla/)
  })
})
