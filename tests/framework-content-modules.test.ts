import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import { getModule } from '../packages/framework/src/modules/registry'

/**
 * UATs for REQ-5 — content-schema validation and SSR of the surviving capability
 * modules (contact-form, carousel). Each module is rendered through Astro's
 * container API (the same SSR path tools/generate uses) and asserted on the
 * produced markup. Container rendering excludes the island `<script>`, so this
 * output is also the no-JS baseline the contact form degrades to.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: Parameters<Container['renderToString']>[0], props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Component, { props: props as Record<string, unknown> })
}

describe('carousel module — content-schema validation', () => {
  it('test_UAT_FC_REQ-5_carousel_rejects_item_count_outside_1_to_20', () => {
    // Validation lives at the content-schema level (DOC-7 §6.5).
    const tooFew = validateModuleContent(carouselMeta, { items: [] })
    expect(tooFew.some((e) => e.field === 'items' && /at least 1/.test(e.message))).toBe(true)

    const tooMany = validateModuleContent(carouselMeta, {
      items: Array.from({ length: 21 }, () => ({ title: { text: 't' } })),
    })
    expect(tooMany.some((e) => e.field === 'items' && /at most 20/.test(e.message))).toBe(true)

    const justRight = validateModuleContent(carouselMeta, {
      items: Array.from({ length: 3 }, () => ({ title: { text: 't' }, body: 'b' })),
    })
    expect(justRight).toHaveLength(0)
  })
})

describe('contact-form module', () => {
  const fields = [
    { name: 'name', label: 'Your name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: false },
  ]

  it('test_UAT_FC_REQ-5_contact_form_renders_configured_fields', async () => {
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/api/forms/contact', fields },
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
      dials: {},
      content: { action: '/leads/intake', fields },
    })
    expect(html).toMatch(/<form[^>]+data-contact-form[^>]+action="\/leads\/intake"[^>]+method="post"/)
  })

  it('test_UAT_FC_REQ-5_contact_form_includes_honeypot_hidden_field', async () => {
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/api/forms/contact', fields },
    })
    expect(html).toContain('contact-form__honeypot')
    expect(html).toMatch(/<input[^>]+name="hp_[a-z_]+"/)
  })

  it('test_UAT_FC_REQ-5_contact_form_renders_turnstile_mount_point', async () => {
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/api/forms/contact', fields },
    })
    expect(html).toContain('data-turnstile-target')
  })

  it('test_UAT_FC_REQ-5_contact_form_submits_without_js_via_html_post', async () => {
    // The no-JS baseline is the native <form method="post"> submitting to its
    // action on its own. Astro's island enhancement ships as a deferred
    // `type="module"` script, which is inert when JS is unavailable — so the
    // no-JS submission path never depends on it. (Astro <7 stripped the island
    // script from container output entirely; Astro 7 emits it as a deferred
    // module, hence we assert it is deferred rather than absent.)
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/api/forms/contact', fields },
    })
    expect(html).toMatch(/<form[^>]+action="\/api\/forms\/contact"[^>]+method="post"/)
    expect(html).toContain('type="submit"')
    // No classic/blocking inline script the form depends on; any script present
    // must be a deferred module (progressive enhancement only).
    expect(html).not.toMatch(/<script(?![^>]*\btype="module")/)
  })

  it('test_UAT_FC_REQ-5_contact_form_field_count_validated_1_to_8', () => {
    const none = validateModuleContent(contactFormMeta, { action: '/x', fields: [] })
    expect(none.some((e) => e.field === 'fields')).toBe(true)
    const nine = validateModuleContent(contactFormMeta, {
      action: '/x',
      fields: Array.from({ length: 9 }, (_, i) => ({ name: `f${i}` })),
    })
    expect(nine.some((e) => e.field === 'fields' && /at most 8/.test(e.message))).toBe(true)
  })
})

describe('module registry — surviving capability catalog', () => {
  it('test_UAT_FC_REQ-5_registry_includes_the_surviving_capability_modules', () => {
    // Post-pivot (REQ-84) layout is owned by the L1 substrate; the catalog holds
    // only the two vetted capability modules: contact-form v2 and carousel v1.
    const catalog: Array<[string, number]> = [
      ['contact-form', 2],
      ['carousel', 1],
    ]
    for (const [id, version] of catalog) {
      const def = getModule(id, version)
      expect(def.meta.id).toBe(id)
      expect(def.Component).toBeTypeOf('function')
    }
  })
})
