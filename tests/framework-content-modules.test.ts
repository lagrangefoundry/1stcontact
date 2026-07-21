import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import {
  validateCapabilityConfig,
  validateCapabilitySlots,
} from '../packages/framework/src/modules/capability'
import { getModule } from '../packages/framework/src/modules/registry'

/**
 * UATs for REQ-5 (reframed REQ-85) — behavioural validation and SSR of the two
 * capability modules. Each is rendered through Astro's container API (the same
 * SSR path tools/generate uses); container rendering excludes the island
 * `<script>`, so this output is also the no-JS baseline the contact form degrades
 * to. Presentation now comes from L1 slots; these tests assert the *behavioural*
 * core (field schema, functional form, honeypot, Turnstile, no-JS post) and the
 * capability contract's config/slot bounds.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: Parameters<Container['renderToString']>[0], props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Component, { props: props as Record<string, unknown> })
}

const textNode = { kind: 'text', text: 'slide' }

describe('carousel capability — slot bounds', () => {
  it('test_UAT_FC_REQ-5_carousel_rejects_slide_count_outside_1_to_20', () => {
    // The repeated `slide` slot is bounded 1..20 by the capability contract.
    const tooFew = validateCapabilitySlots(carouselMeta, { slide: [] })
    expect(tooFew.some((e) => e.field === 'slots.slide' && /at least 1/.test(e.message))).toBe(true)

    const tooMany = validateCapabilitySlots(carouselMeta, {
      slide: Array.from({ length: 21 }, () => textNode),
    })
    expect(tooMany.some((e) => e.field === 'slots.slide' && /at most 20/.test(e.message))).toBe(true)

    const justRight = validateCapabilitySlots(carouselMeta, {
      slide: Array.from({ length: 3 }, () => textNode),
    })
    expect(justRight).toHaveLength(0)
  })
})

describe('contact-form capability', () => {
  const fields = [
    { name: 'name', label: 'Your name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: false },
  ]

  it('test_UAT_FC_REQ-5_contact_form_renders_configured_fields', async () => {
    const html = await render(ContactForm, {
      config: { action: '/api/forms/contact', fields },
    })
    expect(html).toMatch(/<input[^>]+name="name"[^>]+type="text"/)
    expect(html).toMatch(/<input[^>]+name="email"[^>]+type="email"/)
    expect(html).toMatch(/<textarea[^>]+name="message"/)
    expect(html).toContain('Your name')
    expect(html).toContain('Email')
    expect(html).toContain('Message')
  })

  it('test_UAT_FC_REQ-5_contact_form_action_attribute_uses_configured_url', async () => {
    const html = await render(ContactForm, {
      config: { action: '/leads/intake', fields },
    })
    expect(html).toMatch(/<form[^>]+data-contact-form[^>]+action="\/leads\/intake"[^>]+method="post"/)
  })

  it('test_UAT_FC_REQ-5_contact_form_includes_honeypot_hidden_field', async () => {
    const html = await render(ContactForm, {
      config: { action: '/api/forms/contact', fields },
    })
    expect(html).toContain('contact-form__honeypot')
    expect(html).toMatch(/<input[^>]+name="hp_[a-z_]+"/)
  })

  it('test_UAT_FC_REQ-5_contact_form_renders_turnstile_mount_point', async () => {
    const html = await render(ContactForm, {
      config: { action: '/api/forms/contact', fields },
    })
    expect(html).toContain('data-turnstile-target')
  })

  it('test_UAT_FC_REQ-5_contact_form_submits_without_js_via_html_post', async () => {
    // The no-JS baseline is the native <form method="post"> submitting to its
    // action on its own. Astro's island enhancement ships as a deferred
    // `type="module"` script, inert when JS is unavailable — so the no-JS
    // submission path never depends on it.
    const html = await render(ContactForm, {
      config: { action: '/api/forms/contact', fields },
    })
    expect(html).toMatch(/<form[^>]+action="\/api\/forms\/contact"[^>]+method="post"/)
    expect(html).toContain('type="submit"')
    // Any script present must be a deferred module (progressive enhancement only).
    expect(html).not.toMatch(/<script(?![^>]*\btype="module")/)
  })

  it('test_UAT_FC_REQ-5_contact_form_field_count_validated_1_to_8', () => {
    const none = validateCapabilityConfig(contactFormMeta, { action: '/x', fields: [] })
    expect(none.some((e) => e.field === 'config.fields')).toBe(true)
    const nine = validateCapabilityConfig(contactFormMeta, {
      action: '/x',
      fields: Array.from({ length: 9 }, (_, i) => ({
        name: `f${i}`,
        label: `F${i}`,
        type: 'text',
      })),
    })
    expect(nine.some((e) => e.field === 'config.fields' && /at most 8/.test(e.message))).toBe(true)
  })
})

describe('module registry — surviving capability catalog', () => {
  it('test_UAT_FC_REQ-5_registry_includes_the_surviving_capability_modules', () => {
    // Post-pivot the catalog holds only the two vetted capability modules;
    // reframing to the capability contract bumped their versions (REQ-85):
    // contact-form v3 and carousel v2.
    const catalog: Array<[string, number]> = [
      ['contact-form', 3],
      ['carousel', 2],
    ]
    for (const [id, version] of catalog) {
      const def = getModule(id, version)
      expect(def.meta.id).toBe(id)
      expect(def.meta.kind).toBe('capability')
      expect(def.Component).toBeTypeOf('function')
    }
  })
})
