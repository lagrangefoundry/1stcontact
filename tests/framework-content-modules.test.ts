import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import { getModule } from '../packages/framework/src/modules/registry'

/**
 * UATs for REQ-5 — the three content modules (text-block, services-grid,
 * contact-form). Each module is rendered through Astro's container API (the
 * same SSR path tools/generate uses) and asserted on the produced markup.
 * Container rendering excludes the island `<script>`, so this output is also
 * the no-JS baseline the contact form degrades to.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: Parameters<Container['renderToString']>[0], props: unknown) {
  container ??= await AstroContainer.create()
  return container.renderToString(Component, { props: props as Record<string, unknown> })
}

function moduleSource(rel: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../packages/framework/src/modules/${rel}`, import.meta.url)),
    'utf8',
  )
}

describe('text-block module', () => {
  const body = '# Heading\n\n- one\n- two\n\n![pic](/p.jpg)\n\n[link](https://e.test)'

  it('test_UAT_FC_REQ-5_text_block_prose_variant_uses_narrow_container', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: {}, content: { body: 'hi' } })
    // The narrow container is selected by the `variant-prose` hook, not a dial.
    expect(html).toContain('variant-prose')
    expect(html).not.toContain('variant-landing')
    // The variant → container-width mapping lives in the module's scoped CSS.
    const css = moduleSource('text-block/index.astro')
    expect(css).toMatch(/\.variant-prose[^{]*\{[^}]*--container-narrow/)
  })

  it('test_UAT_FC_REQ-5_text_block_landing_variant_uses_default_container', async () => {
    const html = await render(TextBlock, { variant: 'landing', dials: {}, content: { body: 'hi' } })
    expect(html).toContain('variant-landing')
    expect(html).not.toContain('variant-prose')
    const css = moduleSource('text-block/index.astro')
    expect(css).toMatch(/\.variant-landing[^{]*\{[^}]*--container-default/)
  })

  it('test_UAT_FC_REQ-5_text_block_renders_markdown_with_image_and_list', async () => {
    const html = await render(TextBlock, { variant: 'prose', dials: {}, content: { body } })
    expect(html).toContain('<ul>')
    expect(html).toMatch(/<li>\s*one\s*<\/li>/)
    // Images render lazily (DOC-7 mobile-first default).
    expect(html).toMatch(/<img[^>]*loading="lazy"[^>]*src="\/p\.jpg"/)
    expect(html).toMatch(/<a[^>]+href="https:\/\/e\.test"/)
  })

  it('test_UAT_FC_REQ-5_text_block_omits_heading_when_not_provided', async () => {
    const withHeading = await render(TextBlock, {
      variant: 'prose',
      dials: {},
      content: { heading: 'A Title', body: 'x' },
    })
    expect(withHeading).toContain('text-block__heading')
    expect(withHeading).toContain('A Title')

    const without = await render(TextBlock, { variant: 'prose', dials: {}, content: { body: 'x' } })
    expect(without).not.toContain('text-block__heading')
  })
})

describe('services-grid module', () => {
  const items = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ title: `Service ${i + 1}`, body: `Body ${i + 1}` }))

  it('test_UAT_FC_REQ-5_services_grid_three_col_renders_three_cards', async () => {
    const html = await render(ServicesGrid, {
      variant: 'three-col',
      dials: {},
      content: { heading: 'What we do', items: items(3) },
    })
    expect(html).toContain('variant-three-col')
    expect(html.match(/class="services-grid__card"/g)?.length).toBe(3)
    expect(html).toContain('Service 1')
    expect(html).toContain('Service 3')
  })

  it('test_UAT_FC_REQ-5_services_grid_two_col_renders_two_cards', async () => {
    const html = await render(ServicesGrid, {
      variant: 'two-col',
      dials: {},
      content: { items: items(2) },
    })
    expect(html).toContain('variant-two-col')
    expect(html.match(/class="services-grid__card"/g)?.length).toBe(2)
  })

  it('test_UAT_FC_REQ-5_services_grid_collapses_to_single_column_below_md', async () => {
    const css = moduleSource('services-grid/index.astro')
    // Mobile-first: the cards grid is single-column by default…
    expect(css).toMatch(/\.services-grid__cards\s*\{[^}]*grid-template-columns:\s*1fr/)
    // …and only becomes multi-column from the md breakpoint up.
    expect(css).toMatch(/@media \(min-width: 768px\)/)
    expect(css).toMatch(/variant-three-col[^{]*\{[^}]*repeat\(3/)
  })

  it('test_UAT_FC_REQ-5_services_grid_rejects_item_count_outside_2_to_6', () => {
    // Validation lives at the content-schema level (DOC-7 §6.5).
    const tooFew = validateModuleContent(servicesGridMeta, { items: [{ title: 't', body: 'b' }] })
    expect(tooFew.some((e) => e.field === 'items' && /at least 2/.test(e.message))).toBe(true)

    const tooMany = validateModuleContent(servicesGridMeta, {
      items: Array.from({ length: 7 }, () => ({ title: 't', body: 'b' })),
    })
    expect(tooMany.some((e) => e.field === 'items' && /at most 6/.test(e.message))).toBe(true)

    const justRight = validateModuleContent(servicesGridMeta, {
      items: Array.from({ length: 3 }, () => ({ title: 't', body: 'b' })),
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

describe('module registry — full Phase 0 catalog', () => {
  it('test_UAT_FC_REQ-5_registry_includes_all_six_phase0_modules', () => {
    for (const id of ['header', 'hero', 'footer', 'text-block', 'services-grid', 'contact-form']) {
      const def = getModule(id, 1)
      expect(def.meta.id).toBe(id)
      expect(def.Component).toBeTypeOf('function')
    }
  })
})
