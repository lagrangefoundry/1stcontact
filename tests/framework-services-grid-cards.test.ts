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
  return { title: 'Sanctum Voice', body: 'A voice-first app.', ...extra }
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
        card({ title: 'XGD', body: 'A methodology.', accent: 'primary' }),
      ],
    })
    expect(errors).toEqual([])
  })

  it('test_UAT_FC_REQ-26_rejects_accent_outside_closed_set', () => {
    const errors = validateModuleContent(servicesGridMeta, {
      items: [card({ accent: 'lime' }), card()],
    })
    // Raw / out-of-set colours are refused — accent is a closed palette-role set.
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('items[0].accent')
    expect(errors[0].message).toContain('primary, accent, muted')
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
  it('test_UAT_FC_REQ-26_emits_accent_border_class_and_semantic_token', async () => {
    const html = await render({
      variant: 'two-col',
      dials: {},
      content: {
        items: [card({ accent: 'accent' }), card({ title: 'XGD', body: 'x', accent: 'primary' })],
      },
    })
    expect(html).toContain('has-accent accent-accent')
    expect(html).toContain('has-accent accent-primary')
    // The accent colour comes from a semantic token, never a raw colour.
    const css = moduleSource()
    expect(css).toMatch(/\.accent-accent[^{]*\{[^}]*border-left-color:\s*var\(--color-accent\)/)
    expect(css).toMatch(/\.accent-primary[^{]*\{[^}]*border-left-color:\s*var\(--color-primary\)/)
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
    // The ✓ mark keys off the theme primary — the "green check" of the reference.
    const css = moduleSource()
    expect(css).toMatch(/\.services-grid__check::before\s*\{[^}]*var\(--color-primary\)/)
    expect(css).toMatch(/\.services-grid__check::before\s*\{[^}]*content:\s*'✓'/)
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
        heading: "What We're Building",
        items: [
          {
            title: 'Sanctum Voice',
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
            title: 'XGD (Extreme Generative Development)',
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
    // Two cards, each with a per-card accent border.
    expect(html).toContain('has-accent accent-accent')
    expect(html).toContain('has-accent accent-primary')
    // Two status badges.
    expect(html.match(/class="services-grid__badge/g)?.length).toBe(2)
    expect(html).toContain('In development')
    expect(html).toContain('Coming soon')
    // Six checklist items across the two cards.
    expect(html.match(/class="services-grid__check"/g)?.length).toBe(6)
  })
})
