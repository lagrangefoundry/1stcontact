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
 * Reconciliation UATs for story-903e3e3a (REQ-5) — the three content modules
 * (text-block, services-grid, contact-form) completing the 6-module Phase 0
 * catalog. One UAT per acceptance criterion, asserting against the existing
 * implementation at its external boundaries: the `getModule` catalog resolver,
 * the `validateModuleContent` content-schema validator, and the SSR-rendered
 * markup of each module (via Astro's container API — the same render path
 * tools/generate uses). Container rendering excludes the island `<script>`, so
 * this markup is also the no-JS baseline the contact form degrades to. The
 * three client-enhancement ACs (AC-454/455/456) require a DOM and live in
 * `reconciliation-contact-form-client.test.ts`.
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

describe('reconciliation: content module catalog (story-903e3e3a)', () => {
  // AC-458 — the three content modules are resolvable from the catalog and each
  // exposes a conforming contract; all six Phase 0 modules resolve.
  it('test_UAT_AC458_content_modules_resolvable_with_conforming_contract', () => {
    const expected = {
      'text-block': {
        variants: ['prose', 'landing'],
        dials: ['size', 'align', 'spacingTop', 'spacingBottom', 'surface', 'textAlign'],
        content: ['heading', 'body'],
      },
      'services-grid': {
        variants: ['three-col', 'two-col', 'stacked'],
        dials: ['spacingTop', 'spacingBottom', 'surface', 'gap', 'size'],
        content: ['heading', 'subhead', 'items'],
      },
      'contact-form': {
        variants: ['inline'],
        dials: ['spacingTop', 'spacingBottom', 'surface', 'align', 'width', 'submitTreatment'],
        content: ['heading', 'subhead', 'action', 'fields', 'submitLabel', 'successMessage'],
      },
    } as const

    for (const [id, shape] of Object.entries(expected)) {
      const def = getModule(id, 1)
      // A contract plus a renderable component come back.
      expect(def.meta.id).toBe(id)
      expect(def.meta.version).toBe(1)
      expect(def.Component).toBeTypeOf('function')
      // The contract declares the expected finite variants…
      expect([...def.meta.variants]).toEqual(shape.variants)
      // …a finite value enumeration per dial…
      expect(Object.keys(def.meta.dials)).toEqual(shape.dials)
      for (const values of Object.values(def.meta.dials)) {
        expect(Array.isArray(values)).toBe(true)
        expect(values.length).toBeGreaterThan(0)
      }
      // …and a per-field content schema.
      expect(Object.keys(def.meta.contentSchema)).toEqual(shape.content)
    }

    // All six Phase 0 modules resolve.
    for (const id of ['header', 'hero', 'footer', 'text-block', 'services-grid', 'contact-form']) {
      const def = getModule(id, 1)
      expect(def.meta.id).toBe(id)
      expect(def.Component).toBeTypeOf('function')
    }
  })

  // AC-457 — content is rejected when required fields are missing or a bounded
  // list falls outside its declared size range; in-bounds content validates
  // cleanly. services-grid items 2..6, contact-form fields 1..8.
  it('test_UAT_AC457_content_rejected_for_missing_field_or_list_bound_violation', () => {
    const item = { title: 't', body: 'b' }

    // services-grid: 1 item is below the min of 2 → field-located error on `items`.
    const tooFew = validateModuleContent(servicesGridMeta, { items: [item] })
    expect(tooFew.some((e) => e.field === 'items')).toBe(true)

    // services-grid: 7 items is above the max of 6 → field-located error on `items`.
    const tooMany = validateModuleContent(servicesGridMeta, {
      items: Array.from({ length: 7 }, () => item),
    })
    expect(tooMany.some((e) => e.field === 'items')).toBe(true)

    // services-grid: 3 items is within 2..6 → clean.
    const justRight = validateModuleContent(servicesGridMeta, {
      items: Array.from({ length: 3 }, () => item),
    })
    expect(justRight).toHaveLength(0)

    // contact-form: missing the required `action` → field-located error on `action`.
    const missingAction = validateModuleContent(contactFormMeta, {
      fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
    })
    expect(missingAction.some((e) => e.field === 'action')).toBe(true)
  })

  // AC-445 — text-block renders its markdown body to HTML (headings, lists,
  // links, images) with lazy-loaded images.
  it('test_UAT_AC445_text_block_renders_markdown_body_with_lazy_images', async () => {
    const body = '# Heading\n\n- one\n- two\n\n![pic](/p.jpg)\n\n[link](https://e.test)'
    const html = await render(TextBlock, { variant: 'prose', dials: {}, content: { body } })

    expect(html).toContain('<ul>')
    expect(html).toMatch(/<li>\s*one\s*<\/li>/)
    expect(html).toMatch(/<a[^>]+href="https:\/\/e\.test"/)
    // Images gain lazy loading + async decoding for free responsive behaviour.
    expect(html).toMatch(/<img[^>]*loading="lazy"[^>]*src="\/p\.jpg"/)
    expect(html).toMatch(/<img[^>]*decoding="async"/)
  })

  // AC-446 — text-block content width is fixed by its variant, not a dial.
  it('test_UAT_AC446_text_block_width_fixed_by_variant', async () => {
    const prose = await render(TextBlock, { variant: 'prose', dials: {}, content: { body: 'hi' } })
    expect(prose).toContain('variant-prose')
    expect(prose).not.toContain('variant-landing')

    const landing = await render(TextBlock, {
      variant: 'landing',
      dials: {},
      content: { body: 'hi' },
    })
    expect(landing).toContain('variant-landing')
    expect(landing).not.toContain('variant-prose')

    // The variant → container-width mapping lives in the module's scoped CSS:
    // prose is bound to the narrow container, landing to the default container.
    const css = moduleSource('text-block/index.astro')
    expect(css).toMatch(/\.variant-prose[^{]*\{[^}]*--container-narrow/)
    expect(css).toMatch(/\.variant-landing[^{]*\{[^}]*--container-default/)
  })

  // AC-447 — text-block heading renders only when one is provided.
  it('test_UAT_AC447_text_block_heading_only_when_provided', async () => {
    const withHeading = await render(TextBlock, {
      variant: 'prose',
      dials: {},
      content: { heading: 'A Title', body: 'x' },
    })
    expect(withHeading).toMatch(/<h2[^>]*class="text-block__heading"[^>]*>A Title<\/h2>/)

    const without = await render(TextBlock, {
      variant: 'prose',
      dials: {},
      content: { body: 'x' },
    })
    expect(without).not.toContain('text-block__heading')
  })

  // AC-448 — services-grid renders exactly one card per item, for both variants.
  it('test_UAT_AC448_services_grid_renders_one_card_per_item', async () => {
    const items = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ title: `Service ${i + 1}`, body: `Body ${i + 1}` }))

    const three = await render(ServicesGrid, {
      variant: 'three-col',
      dials: {},
      content: { heading: 'What we do', items: items(3) },
    })
    expect(three).toContain('variant-three-col')
    // Each card <li> opens with the block class followed by its per-card size
    // class (`card-size-md` by default), so match the card-wrapper class prefix.
    expect(three.match(/class="services-grid__card card-size-/g)?.length).toBe(3)
    for (const i of [1, 2, 3]) {
      expect(three).toContain(`Service ${i}`)
      expect(three).toContain(`Body ${i}`)
    }

    const two = await render(ServicesGrid, {
      variant: 'two-col',
      dials: {},
      content: { items: items(2) },
    })
    expect(two).toContain('variant-two-col')
    expect(two.match(/class="services-grid__card card-size-/g)?.length).toBe(2)
  })

  // AC-449 — services-grid is single-column below md and multi-column from md up.
  it('test_UAT_AC449_services_grid_single_column_below_md_multi_from_md', () => {
    const css = moduleSource('services-grid/index.astro')
    // Mobile-first: single column by default…
    expect(css).toMatch(/\.services-grid__cards\s*\{[^}]*grid-template-columns:\s*1fr/)
    // …expanding to the grid only from the md breakpoint up.
    expect(css).toMatch(/@media \(min-width: 768px\)/)
    expect(css).toMatch(/variant-three-col[^{]*\{[^}]*repeat\(3/)
    expect(css).toMatch(/variant-two-col[^{]*\{[^}]*repeat\(2/)
  })

  // AC-450 — contact-form renders one labelled control per configured field,
  // in order, with the right element type and required state.
  it('test_UAT_AC450_contact_form_renders_one_labelled_control_per_field', async () => {
    const fields = [
      { name: 'name', label: 'Your name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: false },
    ]
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/api/forms/contact', fields },
    })

    // A non-textarea field renders an input whose type matches the field type.
    expect(html).toMatch(/<input[^>]+name="name"[^>]+type="text"/)
    expect(html).toMatch(/<input[^>]+name="email"[^>]+type="email"/)
    // A textarea field renders a textarea (not an input).
    expect(html).toMatch(/<textarea[^>]+name="message"/)
    // Each control is associated with its label text.
    expect(html).toMatch(/<label[^>]+for="cf-name"[^>]*>Your name<\/label>/)
    expect(html).toMatch(/<label[^>]+for="cf-email"[^>]*>Email<\/label>/)
    expect(html).toMatch(/<label[^>]+for="cf-message"[^>]*>Message<\/label>/)
    // Required state reflects the field's `required` flag.
    expect(html).toMatch(/<input[^>]+name="email"[^>]*\brequired\b/)
  })

  // AC-451 — contact-form is a real POST form targeting the configured action,
  // with no dependency on client script to submit.
  it('test_UAT_AC451_contact_form_posts_to_action_without_js', async () => {
    const fields = [{ name: 'name', label: 'Name', type: 'text', required: true }]
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/leads/intake', fields },
    })
    // The form uses method POST and targets the exact configured action URL.
    expect(html).toMatch(/<form[^>]+data-contact-form[^>]+action="\/leads\/intake"[^>]+method="post"/)
    expect(html).toContain('type="submit"')
    // The no-JS path never depends on a blocking script; any script present must
    // be a deferred module (progressive enhancement only).
    expect(html).not.toMatch(/<script(?![^>]*\btype="module")/)
  })

  // AC-452 — contact-form includes a hidden honeypot field, out of tab order.
  it('test_UAT_AC452_contact_form_includes_hidden_honeypot_field', async () => {
    const fields = [{ name: 'name', label: 'Name', type: 'text', required: true }]
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/api/forms/contact', fields },
    })
    // A named honeypot input is present…
    expect(html).toMatch(/<input[^>]+name="hp_[a-z_]+"/)
    // …removed from the tab order and excluded from autocomplete…
    expect(html).toMatch(/<input[^>]+name="hp_[a-z_]+"[^>]*tabindex="-1"/)
    expect(html).toMatch(/<input[^>]+name="hp_[a-z_]+"[^>]*autocomplete="off"/)
    // …inside an aria-hidden wrapper that is visually hidden via scoped CSS.
    expect(html).toMatch(/class="contact-form__honeypot"[^>]*aria-hidden="true"/)
    const css = moduleSource('contact-form/index.astro')
    expect(css).toMatch(/\.contact-form__honeypot\s*\{[^}]*position:\s*absolute/)
    expect(css).toMatch(/\.contact-form__honeypot\s*\{[^}]*clip:\s*rect/)
  })

  // AC-453 — contact-form renders a Turnstile mount point; the form still
  // renders its fields and submit control.
  it('test_UAT_AC453_contact_form_renders_turnstile_mount_point', async () => {
    const fields = [{ name: 'name', label: 'Name', type: 'text', required: true }]
    const html = await render(ContactForm, {
      dials: {},
      content: { action: '/api/forms/contact', fields },
    })
    // A dedicated Turnstile-target mount element is present.
    expect(html).toContain('data-turnstile-target')
    // …while the form still renders its field and submit control.
    expect(html).toMatch(/<input[^>]+name="name"/)
    expect(html).toContain('type="submit"')
  })
})
