import { describe, expect, it } from 'vitest'
import { getModule, latestModuleVersion } from '../packages/framework/src/worker'

/**
 * story-179b8c06 — AC-1414: a behavior module is the sanitization boundary for
 * its own config.
 *
 * WHY THIS IS ITS OWN CRITERION. A behavior module used to be a compiled
 * template, and the compiler escaped every interpolation on the module's behalf.
 * REQ-148 replaced the templates with plain props-to-markup functions so they run
 * in workerd — and a function returning a template literal escapes nothing unless
 * it is written to. The obligation moved from the compiler to the module, and it
 * is the single thing the conversion could have silently lost while every other
 * criterion still passed.
 *
 * The two failure modes are deliberately distinct, and this test holds both apart:
 *   • a value the module MAY emit is escaped — present as copy, inert as markup;
 *   • an endpoint the module may NOT emit is REFUSED, not escaped into
 *     harmlessness, because an escaped `javascript:` action would turn a loud
 *     refusal into a quietly broken link (DOC-2; DOC-25 §10.4).
 */

const contactForm = () => getModule('contact-form', latestModuleVersion('contact-form')!).Component

describe('story-179b8c06 — the module escapes its own config, and refuses an unsafe endpoint', () => {
  it('test_UAT_AC1414_module_escapes_both_sinks_and_refuses_an_unsafe_endpoint', () => {
    const Component = contactForm()

    // Every payload below arrives as ORDINARY CONFIG — author- or AI-supplied,
    // which is exactly the untrusted surface the criterion is about.
    const html = Component({
      config: {
        // The attribute-value sink: a quote-then-tag break-out on a scheme the
        // module legitimately accepts, so it reaches `attr()` rather than the
        // refusal path.
        action: 'https://forms.example/x?next="><img src=y>',
        submitLabel: 'Send',
        // The element-text sink: an element-shaped success message.
        successMessage: '<script>window.__pwned=1</script>',
        fields: [
          // The element-text sink again, via the invariant `<label>` the module
          // authors for every control.
          { name: 'name', label: '"><img src=x onerror=alert(1)>', type: 'text', required: true },
        ],
      },
      slots: {},
      instanceId: 'esc',
    })

    // 1. Nothing executable and no attribute break-out survives. The assertions
    //    are on the TAGS, never on the word `onerror` — the escaped text still
    //    spells it, which is the whole point of "inert copy, not stripped".
    expect(html).not.toMatch(/<script/)
    expect(html).not.toMatch(/<img/)
    expect(html).not.toMatch(/<[^>]*\son[a-z]+\s*=/i)

    // 2. …because both were ESCAPED rather than dropped. The payload's text is
    //    still in the page: the criterion says present-and-inert, not removed.
    //    Element-text sink — the success copy and the programmatic label:
    expect(html).toContain('&lt;script&gt;window.__pwned=1&lt;/script&gt;')
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;')

    // 3. Attribute-value sink — the endpoint the module writes into `action`,
    //    escaped by the same five entities as the L1 emitter, so a value cannot
    //    close the attribute and start a tag of its own.
    expect(html).toContain('action="https://forms.example/x?next=&quot;&gt;&lt;img src=y&gt;"')

    // 4. The other half of the boundary, kept distinct: an unsafe scheme is
    //    REFUSED outright. Not emitted, not escaped, not blanked — the render
    //    fails and names the offending value.
    expect(() =>
      Component({ config: { action: 'javascript:alert(1)', fields: [] }, slots: {} }),
    ).toThrow(/unsafe URL scheme/)

    // 5. And the refusal is not a soft one: no rendered form carrying the value
    //    in any form escapes the module. (A throw is the only outcome; asserting
    //    it this way documents that there is no "escaped fallback" branch.)
    let emitted: string | null = null
    try {
      emitted = Component({ config: { action: 'javascript:alert(1)', fields: [] }, slots: {} })
    } catch {
      emitted = null
    }
    expect(emitted).toBeNull()
  })
})
