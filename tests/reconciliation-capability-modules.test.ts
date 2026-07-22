import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  validateCapabilityConfig,
  validateCapabilitySlots,
  validateCapabilityInstance,
  type CapabilityMeta,
} from '../packages/framework/src/modules/capability'
import { carouselMeta } from '../packages/framework/src/modules/carousel/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { getModuleClientJs } from '../packages/framework/src/modules/styles'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { advanceTrack, enhanceCarousel } from '../packages/framework/src/modules/carousel/client.js'
import {
  assertModuleConforms,
  ConformanceError,
  type ConformanceFixture,
  type ModuleResolver,
} from '../tools/generate/src'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import ThrowsOnRender from './fixtures/conformance/throws-on-render.astro'

/**
 * Reconciliation UATs for story-179b8c06 — **behavioural capability modules**:
 * a vetted behavioural core + typed `config` + named L1 presentation `slots` +
 * the five-dimension conformance envelope, delivered against the two survivor
 * capabilities (`carousel` v2, `contact-form` v3). One UAT per acceptance
 * criterion (AC-697 … AC-704), exercised at the real boundary: the capability
 * validator, the SSR container render (the path `tools/generate` uses), the
 * shipped `client.js` behaviour, the `1c` render pipeline, and the conformance
 * harness.
 */

/** A minimal valid L1 subtree (a single text node — the L1 security envelope's atom). */
const textNode = { kind: 'text', text: 'Hi' }

// ── SSR render helpers (Astro container API — the tools/generate render path) ──
type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function renderCarousel(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Carousel, { props: props as Record<string, unknown> })
}
async function renderContactForm(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(ContactForm, { props: props as Record<string, unknown> })
}

// ════════════════════════════════════════════════════════════════════════════
// AC-697 — Behavioural config is validated against the capability's typed contract
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — capability behavioural config validation', () => {
  it('test_UAT_AC697_config_validated_against_typed_contract', () => {
    // A fully valid config for each survivor produces zero violations.
    expect(validateCapabilityConfig(carouselMeta, {})).toEqual([])
    expect(
      validateCapabilityConfig(carouselMeta, {
        view: 'multi',
        controls: 'dots',
        autoplay: true,
        loop: false,
      }),
    ).toEqual([])
    expect(
      validateCapabilityConfig(contactFormMeta, {
        action: 'https://example.com/lead',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      }),
    ).toEqual([])

    // The survivor capabilities carry no integer config field, so the
    // typed-contract's integer-range rule is exercised via a representative
    // capability meta — the same `validateCapabilityConfig` code path.
    const intMeta = {
      id: 'rep-int',
      version: 1,
      kind: 'capability',
      config: { count: { type: 'integer', required: false, min: 1, max: 6 } },
      slots: {},
      conformance: { obligations: ['isolation'] },
    } as const satisfies CapabilityMeta

    // Each case seeds exactly ONE defect and expects exactly the matching
    // field-scoped violation (nothing more, nothing less).
    const cases: Array<{ meta: CapabilityMeta; config: Record<string, unknown>; expected: string[] }> = [
      // Missing required field (contact-form.action).
      { meta: contactFormMeta, config: { fields: [{ name: 'email', label: 'Email', type: 'email' }] }, expected: ['config.action'] },
      // Wrong type (carousel.autoplay must be boolean).
      { meta: carouselMeta, config: { autoplay: 'yes' }, expected: ['config.autoplay'] },
      // Integer outside inclusive min/max.
      { meta: intMeta, config: { count: 99 }, expected: ['config.count'] },
      // Value outside a closed enum (carousel.view).
      { meta: carouselMeta, config: { view: 'carousel' }, expected: ['config.view'] },
      // List outside its inclusive item-count bounds (contact-form.fields, minItems 1).
      { meta: contactFormMeta, config: { action: 'https://example.com/lead', fields: [] }, expected: ['config.fields'] },
      // Malformed list item — recurse into itemSchema (contact-form.fields[0].type off-enum).
      {
        meta: contactFormMeta,
        config: { action: 'https://example.com/lead', fields: [{ name: 'x', label: 'y', type: 'BOGUS' }] },
        expected: ['config.fields[0].type'],
      },
    ]

    for (const { meta, config, expected } of cases) {
      const fields = validateCapabilityConfig(meta, config).map((e) => e.field).sort()
      expect(fields).toEqual(expected)
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-698 — Slot presentation is validated as L1 subtrees (structured-only line)
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — slot presentation validated as L1 subtrees', () => {
  it('test_UAT_AC698_slots_validated_as_l1_subtrees', () => {
    // (a) Valid L1 subtrees → zero violations, single and repeated slots.
    expect(validateCapabilitySlots(carouselMeta, { slide: [textNode, textNode] })).toEqual([])
    expect(validateCapabilitySlots(contactFormMeta, {})).toEqual([]) // both slots optional
    expect(validateCapabilitySlots(contactFormMeta, { intro: textNode, submit: textNode })).toEqual([])

    // (b) The security line: non-L1 content (a raw-markup string / arbitrary
    // object) in a slot is a slot-scoped "not a valid L1 subtree" violation.
    const rawInRepeated = validateCapabilitySlots(carouselMeta, {
      slide: [textNode, '<script>alert(1)</script>' as unknown as typeof textNode],
    })
    expect(rawInRepeated.some((e) => e.field === 'slots.slide[1]' && /not a valid L1 subtree/.test(e.message))).toBe(true)

    const rawInSingle = validateCapabilitySlots(contactFormMeta, {
      intro: { foo: 'bar' } as unknown as typeof textNode,
    })
    expect(rawInSingle.some((e) => e.field === 'slots.intro' && /not a valid L1 subtree/.test(e.message))).toBe(true)

    // (c) Missing REQUIRED slot is a violation; missing OPTIONAL slot is not.
    expect(validateCapabilitySlots(carouselMeta, {})).toEqual([
      { field: 'slots.slide', message: expect.stringContaining('required slot') },
    ])

    // A repeated slot must be an array within inclusive minItems/maxItems.
    expect(validateCapabilitySlots(carouselMeta, { slide: [] }).map((e) => e.field)).toEqual(['slots.slide'])
    const over = validateCapabilitySlots(carouselMeta, { slide: Array(21).fill(textNode) })
    expect(over.some((e) => e.field === 'slots.slide' && /at most 20/.test(e.message))).toBe(true)

    // Array-vs-single mismatch, both directions.
    const singleGivenArray = validateCapabilitySlots(contactFormMeta, { intro: [textNode] })
    expect(singleGivenArray.some((e) => e.field === 'slots.intro' && /single L1 subtree/.test(e.message))).toBe(true)
    const repeatedGivenSingle = validateCapabilitySlots(carouselMeta, { slide: textNode })
    expect(repeatedGivenSingle.some((e) => e.field === 'slots.slide' && /must be a list/.test(e.message))).toBe(true)

    // Validating a whole instance reports the UNION of config + slot violations.
    const union = validateCapabilityInstance(contactFormMeta, { config: {}, slots: { intro: [textNode] } })
    expect(union.some((e) => e.field.startsWith('config.'))).toBe(true)
    expect(union.some((e) => e.field.startsWith('slots.'))).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-699 — Carousel renders an L1-authored swipeable track driven by config
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — carousel L1 slide track', () => {
  const slides = [
    { kind: 'text', text: 'Chef Sarah transformed our weekly meals.' },
    { kind: 'text', text: 'The postpartum service was a lifesaver.' },
  ]

  it('test_UAT_AC699_carousel_renders_l1_slide_track_from_config', async () => {
    const html = await renderCarousel({ config: { view: 'single' }, slots: { slide: slides } })
    // A pure-CSS scroll-snap track (the swipeable, no-JS affordance)...
    expect(html).toMatch(/carousel__track/)
    // ...with one slide element per supplied L1 subtree, each a named slot mount...
    expect(html.match(/data-l1-slot="slide"/g)?.length).toBe(2)
    // ...carrying the subtree's rendered content verbatim (the module paints nothing).
    expect(html).toContain('Chef Sarah transformed our weekly meals.')
    expect(html).toContain('The postpartum service was a lifesaver.')

    // `view` drives per-view slide sizing via the section class.
    expect(html).toMatch(/class="carousel [^"]*\bview-single\b/)
    const multi = await renderCarousel({ config: { view: 'multi' }, slots: { slide: slides } })
    expect(multi).toMatch(/class="carousel [^"]*\bview-multi\b/)
    const peek = await renderCarousel({ config: { view: 'peek' }, slots: { slide: slides } })
    expect(peek).toMatch(/class="carousel [^"]*\bview-peek\b/)

    // `controls: dots` emits one decorative marker per slide; `none` emits none.
    const dots = await renderCarousel({ config: { controls: 'dots' }, slots: { slide: slides } })
    expect(dots).toMatch(/carousel__dots[^>]*aria-hidden="true"/)
    expect(dots.match(/class="carousel__dot[" ]/g)?.length).toBe(2)
    const none = await renderCarousel({ config: { controls: 'none' }, slots: { slide: slides } })
    expect(none).not.toMatch(/carousel__dots/)

    // The contract exposes ONLY behavioural config + the `slide` slot — no
    // aesthetic dial produces the slide look.
    const meta = carouselMeta as Record<string, unknown>
    expect(meta.dials).toBeUndefined()
    expect(meta.variants).toBeUndefined()
    expect(meta.contentSchema).toBeUndefined()
    expect(Object.keys(carouselMeta.config).sort()).toEqual(['autoplay', 'controls', 'loop', 'view'])
    expect(Object.keys(carouselMeta.slots)).toEqual(['slide'])
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-700 — Carousel autoplay/loop ship as vetted client behaviour over SSR baseline
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — carousel autoplay/loop client behaviour', () => {
  const slides = [
    { kind: 'text', text: 'One' },
    { kind: 'text', text: 'Two' },
  ]

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('test_UAT_AC700_autoplay_loop_ship_as_vetted_client_behaviour', async () => {
    // Opt-in markers appear ONLY when configured (the SSR baseline is static).
    const off = await renderCarousel({ config: {}, slots: { slide: slides } })
    expect(off).not.toMatch(/data-carousel-autoplay/)
    const on = await renderCarousel({ config: { autoplay: true }, slots: { slide: slides } })
    expect(on).toMatch(/data-carousel-autoplay/)
    expect(on).not.toMatch(/data-carousel-loop/)
    const looped = await renderCarousel({ config: { autoplay: true, loop: true }, slots: { slide: slides } })
    expect(looped).toMatch(/data-carousel-autoplay/)
    expect(looped).toMatch(/data-carousel-loop/)

    // The vetted client algorithm advances one slide per tick and wraps to the
    // first slide only under `loop`. At the end of the track: no-op unless loop.
    const scrolls: number[] = []
    const endTrack = {
      clientWidth: 100,
      scrollWidth: 200,
      scrollLeft: 100,
      querySelector: () => ({ getBoundingClientRect: () => ({ width: 100 }) }),
      scrollBy: (o: { left: number }) => scrolls.push(o.left),
      scrollTo: (o: { left: number }) => scrolls.push(o.left),
    } as unknown as HTMLElement
    advanceTrack(endTrack, false)
    expect(scrolls).toEqual([]) // end + no loop → nothing moves
    advanceTrack(endTrack, true)
    expect(scrolls).toEqual([0]) // loop → wrap to the first slide

    // Mid-track: advance by exactly one slide width.
    const midScrolls: number[] = []
    const midTrack = {
      clientWidth: 100,
      scrollWidth: 300,
      scrollLeft: 0,
      querySelector: () => ({ getBoundingClientRect: () => ({ width: 100 }) }),
      scrollBy: (o: { left: number }) => midScrolls.push(o.left),
      scrollTo: (o: { left: number }) => midScrolls.push(o.left),
    } as unknown as HTMLElement
    advanceTrack(midTrack, false)
    expect(midScrolls).toEqual([100])

    // enhanceCarousel with an injectable timer registers autoplay for a
    // multi-slide track, and the scheduled callback drives the advance.
    let captured: (() => void) | undefined
    const schedule = (cb: () => void) => {
      captured = cb
      return 1
    }
    const multiScrolls: number[] = []
    const multiTrack = {
      clientWidth: 100,
      scrollWidth: 300,
      scrollLeft: 0,
      querySelector: () => ({ getBoundingClientRect: () => ({ width: 100 }) }),
      querySelectorAll: () => ({ length: 2 }),
      scrollBy: (o: { left: number }) => multiScrolls.push(o.left),
      scrollTo: (o: { left: number }) => multiScrolls.push(o.left),
    }
    const multiSection = {
      hasAttribute: (a: string) => a === 'data-carousel-autoplay',
      querySelector: (sel: string) => (sel === '.carousel__track' ? multiTrack : null),
    } as unknown as HTMLElement
    enhanceCarousel(multiSection, schedule as unknown as typeof setInterval)
    expect(captured).toBeTypeOf('function')
    captured?.()
    expect(multiScrolls).toEqual([100]) // one slide advanced per tick

    // Isolation: a one-slide track never schedules autoplay and never throws.
    let scheduled = false
    const noopSchedule = (() => {
      scheduled = true
      return 1
    }) as unknown as typeof setInterval
    const oneSlideSection = {
      hasAttribute: (a: string) => a === 'data-carousel-autoplay',
      querySelector: () => ({ querySelectorAll: () => ({ length: 1 }) }),
    } as unknown as HTMLElement
    expect(() => enhanceCarousel(oneSlideSection, noopSchedule)).not.toThrow()
    expect(scheduled).toBe(false)

    // Isolation: a missing track element degrades to the baseline without error.
    const missingTrackSection = {
      hasAttribute: (a: string) => a === 'data-carousel-autoplay',
      querySelector: () => null,
    } as unknown as HTMLElement
    expect(() => enhanceCarousel(missingTrackSection, noopSchedule)).not.toThrow()
    expect(scheduled).toBe(false)

    // Isolation: an absent timer API (no schedule, no global setInterval) is inert.
    vi.stubGlobal('setInterval', undefined)
    const twoSlideSection = {
      hasAttribute: (a: string) => a === 'data-carousel-autoplay',
      querySelector: (sel: string) => (sel === '.carousel__track' ? multiTrack : null),
    } as unknown as HTMLElement
    expect(() => enhanceCarousel(twoSlideSection, undefined as unknown as typeof setInterval)).not.toThrow()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-701 — Contact-form renders a functional form with L1-authored intro/submit
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — contact-form functional render + L1 slots', () => {
  const config = {
    action: 'https://example.com/submit',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: false },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  }

  it('test_UAT_AC701_contact_form_renders_functional_form_with_l1_slots', async () => {
    const html = await renderContactForm({ config, slots: {} })

    // A real no-JS post form pointing at the configured (safe) endpoint.
    expect(html).toMatch(/<form[^>]*data-contact-form[^>]*method="post"/)
    expect(html).toContain('action="https://example.com/submit"')

    // One labelled control per configured field, with the right input type and
    // required flag; a `textarea` for the textarea field.
    expect(html).toMatch(/<label[^>]*for="cf-name"[^>]*>Your name<\/label>/)
    expect(html).toMatch(/<input[^>]*id="cf-name"[^>]*type="text"[^>]*required/)
    expect(html).toMatch(/<label[^>]*for="cf-email"[^>]*>Email<\/label>/)
    // email field is not required — no `required` attr on its input.
    expect(html).toMatch(/<input[^>]*id="cf-email"[^>]*type="email"(?![^>]*required)[^>]*>/)
    expect(html).toMatch(/<textarea[^>]*id="cf-message"[^>]*required/)

    // The anti-spam surface: a visually-hidden, off-tab-order honeypot + a
    // Turnstile mount point.
    expect(html).toMatch(/contact-form__honeypot/)
    expect(html).toMatch(/name="hp_company_url"[^>]*tabindex="-1"/)
    expect(html).toMatch(/data-turnstile-target/)

    // Absent slots → a plain functional intro/button baseline.
    expect(html).not.toMatch(/contact-form__intro/)
    expect(html).toMatch(/<button[^>]*class="contact-form__submit"[^>]*>\s*Send\s*<\/button>/)

    // Supplied L1 slots appear: intro renders above the fields; submit dresses
    // the button. Field labels remain in the core (not a slot).
    const withSlots = await renderContactForm({
      config,
      slots: {
        intro: { kind: 'text', text: 'Get in touch with our team' },
        submit: { kind: 'text', text: 'Send message' },
      },
    })
    expect(withSlots).toMatch(/contact-form__intro/)
    expect(withSlots).toContain('Get in touch with our team')
    expect(withSlots).toContain('Send message')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-702 — Capability client behaviour ships as one page-referenced asset
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — capability client behaviour ships once per page', () => {
  it('test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac702-'))
    try {
      cmdNew('acme', { cwd })
      // Seed the home page with instances of BOTH survivor capabilities.
      const homePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
      const home = JSON.parse(readFileSync(homePath, 'utf8'))
      home.modules = [
        {
          id: 'gallery',
          type: 'carousel',
          version: 2,
          config: { view: 'single', controls: 'dots', autoplay: true },
          slots: { slide: [{ kind: 'text', text: 'A great experience.' }] },
        },
        {
          id: 'get-in-touch',
          type: 'contact-form',
          version: 3,
          config: {
            action: 'https://example.com/submit',
            fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
          },
        },
      ]
      writeFileSync(homePath, JSON.stringify(home, null, 2))

      const { outDir } = await cmdRender('acme', { cwd })

      // Exactly ONE client-behaviour asset, folding BOTH capabilities' vetted code.
      const capsPath = path.join(outDir, 'capabilities.js')
      expect(existsSync(capsPath)).toBe(true)
      const capsJs = readFileSync(capsPath, 'utf8')
      expect(capsJs).toContain('/* capability: carousel */')
      expect(capsJs).toContain('/* capability: contact-form */')
      // The behaviours actually ship (not lost to a 404 island script): the
      // carousel autoplay enhancer and the contact-form JSON-fetch enhancer.
      expect(capsJs).toContain('enhanceAllCarousels')
      expect(capsJs).toContain('enhanceCarousel')
      expect(capsJs).toContain('enhanceAllContactForms')

      // Each generated page references the asset EXACTLY ONCE as a module script,
      // and never as a dev-path island script.
      const scriptRef = /<script type="module" src="\.\/capabilities\.js"><\/script>/g
      for (const page of ['index.html', 'home.html']) {
        const pageHtml = readFileSync(path.join(outDir, page), 'utf8')
        expect(pageHtml.match(scriptRef)?.length).toBe(1)
        expect(pageHtml).not.toMatch(/index\.astro\?astro&type=script/)
      }

      // The asset + reference are emitted precisely because the catalog ships
      // client behaviour; the emission is gated on getModuleClientJs() being
      // non-empty (its empty arm suppresses both asset and reference).
      expect(getModuleClientJs().length).toBeGreaterThan(0)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-703 — Isolation conformance: degenerate input degrades inertly; throw flagged
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — isolation conformance dimension', () => {
  const carouselDegenerate: ConformanceFixture = {
    label: 'carousel-degenerate',
    props: { version: 2, config: { view: 12345, controls: 'bogus' }, slots: {} },
  }
  const contactDegenerate: ConformanceFixture = {
    label: 'contact-degenerate',
    props: { version: 3, config: { action: 'https://example.com/lead', fields: 'not-a-list' }, slots: {} },
  }

  // A test-only catalog entry whose core throws during SSR (non-isolated).
  const resolveThrows: ModuleResolver = (type) => {
    if (type === 'fc-throws') {
      return {
        meta: {
          id: 'fc-throws',
          version: 1,
          kind: 'capability',
          config: {},
          slots: {},
          conformance: { obligations: ['isolation'] },
        } as CapabilityMeta,
        Component: ThrowsOnRender,
      }
    }
    throw new Error(`Unknown isolation fixture: ${type}`)
  }

  it('test_UAT_AC703_isolation_degrades_inertly_and_flags_a_throwing_core', async () => {
    // Degenerate-but-schema-valid input degrades inertly on BOTH survivors:
    // renders without throwing, page band intact → isolation passes.
    await expect(
      assertModuleConforms('carousel', [carouselDegenerate], { dimension: 'isolation' }),
    ).resolves.toBeUndefined()
    await expect(
      assertModuleConforms('contact-form', [contactDegenerate], { dimension: 'isolation' }),
    ).resolves.toBeUndefined()

    // A capability whose core throws during render is a page-robustness break —
    // reported as an isolation violation, so the dimension is a real discriminator.
    const err = await assertModuleConforms(
      'fc-throws',
      [{ label: 'throws', props: { config: {}, slots: {} } }],
      { dimension: 'isolation', resolveModule: resolveThrows },
    ).then(
      () => null,
      (e: unknown) => e as ConformanceError,
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'isolation.render-throws')).toBe(true)
  }, 30000)
})

// ════════════════════════════════════════════════════════════════════════════
// AC-704 — Survivor capabilities declare the full five-dimension obligation set
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — full five-dimension conformance obligation set', () => {
  it('test_UAT_AC704_survivors_declare_the_full_obligation_set', () => {
    const full = ['isolation', 'responsive', 'safety', 'security', 'x-browser']
    for (const meta of [carouselMeta, contactFormMeta]) {
      // The published contract enumerates exactly the five conformance
      // dimensions — the harness holds every capability to the complete envelope.
      expect([...meta.conformance.obligations].sort()).toEqual(full)
      // No dimension is legitimately opted out of.
      expect(meta.conformance.except).toBeUndefined()
    }
  })
})
