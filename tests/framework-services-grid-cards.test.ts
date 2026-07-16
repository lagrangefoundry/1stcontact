import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { validateModuleContent } from '../packages/framework/src/modules/validate'

/**
 * UATs for REQ-26 — first-class `services-grid` card treatments: an accent left
 * border, a status badge, and a green ✓ checklist, all as structured,
 * token-backed content values (never raw CSS/HTML). Modules are rendered through
 * Astro's container API — the same SSR path tools/generate uses.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(ServicesGrid, { props: props as Record<string, unknown> })
}

function moduleSource(): string {
  return readFileSync(
    fileURLToPath(
      new URL('../packages/framework/src/modules/services-grid/index.astro', import.meta.url),
    ),
    'utf8',
  )
}

/** A minimal valid card (title + body only) plus any structured treatments. */
function card(extra: Record<string, unknown> = {}) {
  return { title: { text: 'Sanctum Voice' }, body: 'A voice-first app.', ...extra }
}

describe('REQ-26 services-grid card treatments — schema (AC1)', () => {
  it('test_UAT_FC_REQ-26_accepts_structured_accent_badge_and_checklist', () => {
    const errors = validateModuleContent(servicesGridMeta, {
      items: [
        card({
          accent: 'accent',
          badge: { label: 'In development', variant: 'primary' },
          checklist: ['On-device', 'Private'],
        }),
        card({ title: { text: 'XGD' }, body: 'A methodology.', accent: 'primary' }),
      ],
    })
    expect(errors).toEqual([])
  })

  it('test_UAT_FC_REQ-26_rejects_accent_that_is_neither_hex_nor_role', () => {
    // REQ-58: accent is a colour VALUE — a #hex absolute OR a palette-role alias.
    // A CSS keyword like `lime` is neither, so it is refused (it would resolve to
    // an undefined `var(--color-lime)`); a #hex or a role is accepted below.
    const errors = validateModuleContent(servicesGridMeta, {
      items: [card({ accent: 'lime' }), card()],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('items[0].accent')
    expect(errors[0].message).toMatch(/#hex colour or a palette-role alias/)
    // A literal absolute value and a role both validate clean.
    expect(
      validateModuleContent(servicesGridMeta, { items: [card({ accent: '#90a1b9' }), card({ accent: 'secondary' })] }),
    ).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-26_rejects_badge_variant_outside_closed_set', () => {
    const errors = validateModuleContent(servicesGridMeta, {
      items: [card({ badge: { label: 'Soon', variant: 'danger' } }), card()],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('items[0].badge.variant')
  })

  it('test_UAT_FC_REQ-26_requires_badge_label_when_badge_present', () => {
    const errors = validateModuleContent(servicesGridMeta, {
      items: [card({ badge: { variant: 'neutral' } }), card()],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('items[0].badge.label')
  })

  it('test_UAT_FC_REQ-26_untreated_card_still_validates', () => {
    // Backward compatibility: a card with no treatments is unchanged.
    const errors = validateModuleContent(servicesGridMeta, { items: [card(), card()] })
    expect(errors).toEqual([])
  })
})

describe('REQ-26 services-grid card treatments — rendering (AC2)', () => {
  it('test_UAT_FC_REQ-26_emits_accent_border_from_resolved_colour', async () => {
    // REQ-58: the accent bar is `has-accent` + a per-card `--fc-accent` var that
    // resolves a role → var(--color-role) OR a #hex literal as-is. A role and a
    // literal on two cards both flow to the inline var; the CSS binds the border.
    const html = await render({
      variant: 'two-col',
      dials: {},
      content: {
        items: [card({ accent: 'accent' }), card({ title: { text: 'XGD' }, body: 'x', accent: '#90a1b9' })],
      },
    })
    expect(html).toContain('has-accent')
    expect(html).toContain('--fc-accent: var(--color-accent)') // role → overlay
    expect(html).toContain('--fc-accent: #90a1b9') // absolute value, as-is
    const css = moduleSource()
    expect(css).toMatch(/\.has-accent[^{]*\{[^}]*border-left-color:\s*var\(--fc-accent\)/)
  })

  it('test_UAT_FC_REQ-26_emits_status_badge_pill_with_label_and_variant', async () => {
    const html = await render({
      variant: 'two-col',
      dials: {},
      content: {
        items: [card({ badge: { label: 'In development', variant: 'primary' } }), card()],
      },
    })
    expect(html).toMatch(/services-grid__badge[^"]*badge-primary/)
    expect(html).toContain('In development')
  })

  it('test_UAT_FC_REQ-26_badge_variant_defaults_to_neutral', async () => {
    const html = await render({
      variant: 'two-col',
      dials: {},
      content: { items: [card({ badge: { label: 'Coming soon' } }), card()] },
    })
    expect(html).toMatch(/services-grid__badge[^"]*badge-neutral/)
  })

  it('test_UAT_FC_REQ-26_emits_checklist_items_keyed_to_primary_token', async () => {
    const html = await render({
      variant: 'two-col',
      dials: {},
      content: {
        items: [card({ checklist: ['On-device', 'Private', 'Reflective'] }), card()],
      },
    })
    expect(html.match(/class="services-grid__check"/g)?.length).toBe(3)
    expect(html).toContain('On-device')
    // The ✓ is a real leading text run (present in the DOM), not a ::before
    // pseudo — so a faithful-repro capture can read it. Three items → three marks.
    expect(html.match(/services-grid__check-mark[^>]*>✓<\/span>/g)?.length).toBe(3)
    // The mark keys off the theme primary — the "green check" of the reference.
    const css = moduleSource()
    expect(css).toMatch(/\.services-grid__check-mark\s*\{[^}]*var\(--color-primary\)/)
  })

  it('test_UAT_FC_REQ-26_untreated_card_emits_no_treatment_markup', async () => {
    const html = await render({
      variant: 'two-col',
      dials: {},
      content: { items: [card(), card()] },
    })
    expect(html).not.toContain('has-accent')
    expect(html).not.toContain('services-grid__badge')
    expect(html).not.toContain('services-grid__checklist')
  })
})

describe('REQ-26 services-grid card treatments — gigabytealchemy fidelity (AC3)', () => {
  it('test_UAT_FC_REQ-26_what_were_building_cards_match_reference', async () => {
    // The reference "What We're Building" cards (Sanctum Voice, XGD) each carry
    // all three treatments: accent border, top-right status badge, ✓ checklist.
    const html = await render({
      variant: 'two-col',
      dials: { gap: 'normal' },
      content: {
        heading: { text: "What We're Building" },
        items: [
          {
            title: { text: 'Sanctum Voice' },
            body: '**Your private space to think out loud**',
            accent: 'accent',
            badge: { label: 'In development', variant: 'primary' },
            checklist: [
              'Completely on-device—your thoughts never leave your phone',
              'Creates space for deeper reflection and insight',
              'Optional modules for journaling, dreams, gratitude, and growth',
            ],
          },
          {
            title: { text: 'XGD (Extreme Generative Development)' },
            body: '**AI-powered development methodology and tools**',
            accent: 'primary',
            badge: { label: 'Coming soon', variant: 'neutral' },
            checklist: [
              'Designed for developers building AI-enhanced workflows',
              'Open source and community-driven',
              'Practical tools for modern software development',
            ],
          },
        ],
      },
    })
    // Two cards, each with a per-card accent border resolved to `--fc-accent`.
    expect(html).toContain('has-accent')
    expect(html).toContain('--fc-accent: var(--color-accent)')
    expect(html).toContain('--fc-accent: var(--color-primary)')
    // Two status badges.
    expect(html.match(/class="services-grid__badge/g)?.length).toBe(2)
    expect(html).toContain('In development')
    expect(html).toContain('Coming soon')
    // Six checklist items across the two cards.
    expect(html.match(/class="services-grid__check"/g)?.length).toBe(6)
  })
})

/**
 * UATs for REQ-36 / CAP-1 — the grid-wide `cardSurface: bare` dial. A bare grid
 * strips the card fill/border/radius/padding so cards read as plain text columns
 * on the band (the joyfulculinary dark "Our Offerings" / process grids, where a
 * white card breaks the composition). Effect + default-unchanged + composability.
 */
describe('REQ-36 services-grid bare cards — CAP-1', () => {
  // REQ-50: card titles are now styled runs.
  const twoCards = [
    { title: { text: 'Personal Chef Services' }, body: 'Weekly, bi-weekly or monthly.' },
    { title: { text: 'Cooking Classes' }, body: 'For small groups.' },
  ]

  it('test_UAT_FC_REQ-36_bare_applies_grid_class_and_strips_chrome_css', async () => {
    const html = await render({ variant: 'three-col', dials: { cardSurface: 'bare' }, content: { items: twoCards } })
    // The dial wires through to a grid-level class.
    expect(html).toContain('card-surface-bare')
    // The scoped CSS strips the card chrome under that class (the effect).
    const css = moduleSource()
    expect(css).toMatch(/\.services-grid\.card-surface-bare\s+\.services-grid__card\s*\{[^}]*background:\s*transparent/)
    expect(css).toMatch(/\.services-grid\.card-surface-bare\s+\.services-grid__card\s*\{[^}]*border:\s*none/)
    // Chrome (the badge) is suppressed under bare.
    expect(css).toMatch(/\.services-grid\.card-surface-bare\s+\.services-grid__badge\s*\{\s*display:\s*none/)
  })

  it('test_UAT_FC_REQ-36_default_leaves_cards_unchanged', async () => {
    const html = await render({ variant: 'three-col', content: { items: twoCards } })
    // Omitting the dial yields the standard card treatment, never the bare class.
    expect(html).toContain('card-surface-default')
    expect(html).not.toContain('card-surface-bare')
  })

  it('test_UAT_FC_REQ-36_bare_composes_with_every_variant', async () => {
    for (const variant of servicesGridMeta.variants) {
      const html = await render({ variant, dials: { cardSurface: 'bare' }, content: { items: twoCards } })
      // Bare is orthogonal to layout: the variant class and the bare class
      // co-exist, and the card content still renders.
      expect(html).toContain(`variant-${variant}`)
      expect(html).toContain('card-surface-bare')
      expect(html).toContain('Personal Chef Services')
    }
  })

  // Grid tracks default to min-width:auto, so a card holding a long unbreakable
  // word forces its `1fr` track wider and starves its neighbours — uneven columns
  // and word-by-word title wrapping in the icon-left "How It Works" layout. The
  // fix pins every card track to a true equal fraction.
  it('test_UAT_FC_REQ-36_card_track_pins_min_width_zero_for_even_columns', () => {
    const css = moduleSource()
    expect(css).toMatch(/\.services-grid__card\s*\{\s*min-width:\s*0/)
    // The icon-left title also releases its min-width so it wraps within its track.
    expect(css).toMatch(/icon-layout-left\s+\.services-grid__card-title\s*\{[^}]*min-width:\s*0/)
  })
})
