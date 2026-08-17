import { afterEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import * as framework from '../packages/framework/src/index'
import {
  registry,
  getModule,
  getModuleClientJs,
  carouselMeta,
  contactFormMeta,
  validateBehaviorConfig,
  validateBehaviorSlots,
  validateBehaviorControls,
  validateBehaviorInstance,
} from '../packages/framework/src/index'
import type {
  AssertBehaviorMeta,
  BehaviorConfigSpec,
  BehaviorConfigType,
  BehaviorConformance,
  BehaviorDefinition,
  BehaviorInstance,
  BehaviorMeta,
  BehaviorSlotSpec,
  BehaviorSlotValue,
  BehaviorValidationError,
  ConformanceObligation,
} from '../packages/framework/src/index'
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
 * Reconciliation UATs for story-179b8c06 — **behavior modules**: a vetted
 * behavioural core + typed `config` + named L1 presentation `slots` + the
 * five-dimension conformance envelope, published under the `Behavior*` names
 * (REQ-87) and delivered against the two survivors (`carousel` v2,
 * `contact-form` v3). One UAT per acceptance criterion (AC-697 … AC-704, AC-722),
 * exercised at the real boundary: the behavior validators reached from the
 * framework package root, the SSR container render (the path `tools/generate`
 * uses), the shipped `client.js` behaviour, the render pipeline, and the
 * conformance harness.
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
// AC-697 — Behavioural config is validated against the behavior's typed contract
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — behavioural config validation', () => {
  it('test_UAT_AC697_config_validated_against_typed_contract', () => {
    // A fully valid config for each survivor produces zero violations.
    expect(validateBehaviorConfig(carouselMeta, {})).toEqual([])
    expect(
      validateBehaviorConfig(carouselMeta, {
        view: 'multi',
        controls: 'dots',
        autoplay: true,
        loop: false,
      }),
    ).toEqual([])
    expect(
      validateBehaviorConfig(contactFormMeta, {
        action: 'https://example.com/lead',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      }),
    ).toEqual([])

    // The survivor behaviors carry no integer config field, so the typed
    // contract's integer-range rule is exercised via a representative behavior
    // meta — the same `validateBehaviorConfig` code path. It declares the
    // renamed discriminant.
    const intMeta = {
      id: 'rep-int',
      version: 1,
      kind: 'behavior',
      config: { count: { type: 'integer', required: false, min: 1, max: 6 } },
      slots: {},
      conformance: { obligations: ['isolation'] },
    } as const satisfies BehaviorMeta
    const enumMeta = {
      id: 'fc-enum',
      version: 1,
      kind: 'behavior',
      config: { mode: { type: 'enum', required: false, values: ['single', 'multi'] } },
      slots: {},
      conformance: { obligations: ['isolation'] },
    } as const satisfies BehaviorMeta

    // Each case seeds exactly ONE defect and expects exactly the matching
    // field-scoped violation (nothing more, nothing less).
    const cases: Array<{ meta: BehaviorMeta; config: Record<string, unknown>; expected: string[] }> = [
      // Missing required field (contact-form.action).
      {
        meta: contactFormMeta,
        config: { fields: [{ name: 'email', label: 'Email', type: 'email' }] },
        expected: ['config.action'],
      },
      // Wrong type (carousel.autoplay must be boolean).
      { meta: carouselMeta, config: { autoplay: 'yes' }, expected: ['config.autoplay'] },
      // Integer outside its inclusive min/max.
      { meta: intMeta, config: { count: 99 }, expected: ['config.count'] },
      // Value outside a closed enum (REQ-96 removed carousel.view — the enum
      // rule is unchanged, so a local meta carries the case now).
      { meta: enumMeta, config: { mode: 'carousel' }, expected: ['config.mode'] },
      // List outside its inclusive item-count bounds (contact-form.fields, minItems 1).
      {
        meta: contactFormMeta,
        config: { action: 'https://example.com/lead', fields: [] },
        expected: ['config.fields'],
      },
      // Malformed list item — recurse into itemSchema (contact-form.fields[0].type off-enum).
      {
        meta: contactFormMeta,
        config: { action: 'https://example.com/lead', fields: [{ name: 'x', label: 'y', type: 'BOGUS' }] },
        expected: ['config.fields[0].type'],
      },
    ]

    for (const { meta, config, expected } of cases) {
      const fields = validateBehaviorConfig(meta, config).map((e) => e.field).sort()
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
    expect(validateBehaviorSlots(carouselMeta, { slide: [textNode, textNode] })).toEqual([])
    // REQ-96 — contact-form's slot surface is one REQUIRED `form` subtree: the
    // form's whole presentation, control leaves included.
    expect(validateBehaviorSlots(contactFormMeta, { form: textNode })).toEqual([])
    expect(validateBehaviorSlots(contactFormMeta, {})).toEqual([
      { field: 'slots.form', message: expect.stringContaining('required slot') },
    ])

    // (b) The security line: non-L1 content (a raw-markup string / an arbitrary
    // object) in a slot is a slot-scoped "not a valid L1 subtree" violation.
    const rawInRepeated = validateBehaviorSlots(carouselMeta, {
      slide: [textNode, '<script>alert(1)</script>' as unknown as typeof textNode],
    })
    expect(
      rawInRepeated.some((e) => e.field === 'slots.slide[1]' && /not a valid L1 subtree/.test(e.message)),
    ).toBe(true)

    const rawInSingle = validateBehaviorSlots(contactFormMeta, {
      form: { foo: 'bar' } as unknown as typeof textNode,
    })
    expect(
      rawInSingle.some((e) => e.field === 'slots.form' && /not a valid L1 subtree/.test(e.message)),
    ).toBe(true)

    // (c) Missing REQUIRED slot is a violation; missing OPTIONAL slot is not.
    expect(validateBehaviorSlots(carouselMeta, {})).toEqual([
      { field: 'slots.slide', message: expect.stringContaining('required slot') },
    ])

    // A repeated slot must be an array within inclusive minItems/maxItems.
    expect(validateBehaviorSlots(carouselMeta, { slide: [] }).map((e) => e.field)).toEqual([
      'slots.slide',
    ])
    const over = validateBehaviorSlots(carouselMeta, { slide: Array(21).fill(textNode) })
    expect(over.some((e) => e.field === 'slots.slide' && /at most 20/.test(e.message))).toBe(true)

    // Array-vs-single mismatch, both directions.
    const singleGivenArray = validateBehaviorSlots(contactFormMeta, { form: [textNode] })
    expect(
      singleGivenArray.some((e) => e.field === 'slots.form' && /single L1 subtree/.test(e.message)),
    ).toBe(true)
    const repeatedGivenSingle = validateBehaviorSlots(carouselMeta, { slide: textNode })
    expect(
      repeatedGivenSingle.some((e) => e.field === 'slots.slide' && /must be a list/.test(e.message)),
    ).toBe(true)

    // Validating a whole instance reports the UNION of config + slot violations.
    const union = validateBehaviorInstance(contactFormMeta, {
      config: {},
      slots: { form: [textNode] },
    })
    expect(union.some((e) => e.field.startsWith('config.'))).toBe(true)
    expect(union.some((e) => e.field.startsWith('slots.'))).toBe(true)

    // No slot content bypasses L1 validation on its way to the page: the
    // carousel mounts only what the L1 renderer accepts — a raw-markup slide is
    // dropped, never emitted as markup.
    expect(validateBehaviorSlots(carouselMeta, { slide: ['<img src=x onerror=alert(1)>'] as never }).length)
      .toBeGreaterThan(0)
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
    const html = await renderCarousel({ config: {}, slots: { slide: slides } })
    // A pure-CSS scroll-snap track (the swipeable, no-JS affordance)...
    expect(html).toMatch(/carousel__track/)
    // ...with one slide element per supplied L1 subtree, each a named slot mount...
    expect(html.match(/data-l1-slot="slide"/g)?.length).toBe(2)
    // ...carrying the subtree's rendered content verbatim (the module paints nothing).
    expect(html).toContain('Chef Sarah transformed our weekly meals.')
    expect(html).toContain('The postpartum service was a lifesaver.')

    // REQ-96 — the module emits NO slide sizing: a slide's width is its own L1
    // subtree's, so there is no `view` class and no `flex-basis` to inspect.
    expect(html).not.toMatch(/view-single|view-peek|view-multi/)

    // Pagination dots are L1 control leaves in the `dots` slot; the module
    // supplies only the behavioural markers its client.js reads.
    const dots = await renderCarousel({
      config: {},
      slots: {
        slide: slides,
        dots: {
          kind: 'container',
          layout: 'row',
          children: [
            { kind: 'control', control: 'dot-0' },
            { kind: 'control', control: 'dot-1' },
          ],
        },
      },
    })
    expect(dots.match(/data-carousel-dot="\d"/g)?.length).toBe(2)
    expect(dots).toMatch(/data-carousel-current/)
    // No `dots` slot → no indicator; the scrollable track is the affordance.
    expect(html).not.toMatch(/data-carousel-dot/)

    // The contract exposes ONLY behavioural config + presentation slots — no
    // aesthetic dial produces the slide look.
    const meta = carouselMeta as Record<string, unknown>
    expect(meta.dials).toBeUndefined()
    expect(meta.variants).toBeUndefined()
    expect(meta.contentSchema).toBeUndefined()
    expect(Object.keys(carouselMeta.config).sort()).toEqual(['autoplay', 'loop'])
    expect(Object.keys(carouselMeta.slots)).toEqual(['slide', 'dots'])
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
    const looped = await renderCarousel({
      config: { autoplay: true, loop: true },
      slots: { slide: slides },
    })
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

    // Isolation: an absent timer API (no injected schedule, no global
    // setInterval) is inert — the static baseline survives.
    vi.stubGlobal('setInterval', undefined)
    const twoSlideSection = {
      hasAttribute: (a: string) => a === 'data-carousel-autoplay',
      querySelector: (sel: string) => (sel === '.carousel__track' ? multiTrack : null),
    } as unknown as HTMLElement
    expect(() =>
      enhanceCarousel(twoSlideSection, undefined as unknown as typeof setInterval),
    ).not.toThrow()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-701 — Contact-form renders a functional form whose controls are L1 leaves
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — contact-form functional render + L1 controls', () => {
  const config = {
    action: 'https://example.com/submit',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: false },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  }

  /** The form's presentation: one L1 `control` leaf per element the module declares. */
  const formSlot = {
    kind: 'container',
    layout: 'stack',
    gapPx: 16,
    children: [
      { kind: 'control', control: 'name' },
      { kind: 'control', control: 'email' },
      { kind: 'control', control: 'message' },
      { kind: 'control', control: 'submit', axes: { surfaceFill: '#0f172b', color: '#ffffff' } },
    ],
  }

  it('test_UAT_AC701_contact_form_renders_functional_form_with_l1_controls', async () => {
    const html = await renderContactForm({ config, slots: { form: formSlot } })

    // A real no-JS post form pointing at the configured (safe) endpoint.
    expect(html).toMatch(/<form[^>]*data-contact-form[^>]*method="post"/)
    expect(html).toContain('action="https://example.com/submit"')

    // One control per configured field, carrying the module's attribute bundle:
    // the right input type and required flag, and a `textarea` for the multi-line
    // field. The class on each is L1's, never the module's.
    expect(html).toMatch(/<input[^>]*id="cf-name"[^>]*type="text"[^>]*required/)
    expect(html).toMatch(/<input[^>]*id="cf-email"[^>]*type="email"(?![^>]*required)[^>]*>/)
    expect(html).toMatch(/<textarea[^>]*id="cf-message"[^>]*required/)
    // …and the paint comes from the L1 node, not from a module stylesheet.
    expect(html).toMatch(/background-color: #0f172b/)

    // The programmatic label stays in the core — an a11y obligation, not styling —
    // and is marked invariant so a reproduction gate never pairs against it.
    expect(html).toMatch(/<label[^>]*data-fc-invariant[^>]*for="cf-name"[^>]*>Your name<\/label>/)
    expect(html).toMatch(/for="cf-email"[^>]*>Email<\/label>/)
    expect(html).toMatch(/for="cf-message"[^>]*>Message<\/label>/)

    // The anti-spam surface: a visually-hidden, off-tab-order honeypot + a
    // Turnstile mount point, both invariant.
    expect(html).toMatch(/contact-form__honeypot[^>]*data-fc-invariant/)
    expect(html).toMatch(/name="hp_company_url"[^>]*tabindex="-1"/)
    expect(html).toMatch(/data-turnstile-target/)

    // REQ-96 — the module paints NO control of its own: no default button, no
    // field chrome class. An unauthored form is an empty form, loudly.
    expect(html).not.toMatch(/contact-form__submit/)
    expect(html).not.toMatch(/contact-form__field/)
    const unauthored = await renderContactForm({ config, slots: {} })
    expect(unauthored).not.toMatch(/<input[^>]*id="cf-name"/)
    expect(unauthored).not.toMatch(/<button/)
  })

  it('test_UAT_FC_REQ-96_a_control_node_binds_only_to_a_declared_element', () => {
    // The check the slot-only contract could not express: a control naming an
    // element no behavior declares renders nothing, so it must fail validation
    // rather than silently drop a field the author believed they had placed.
    const bogus = validateBehaviorControls(contactFormMeta, {
      config,
      slots: {
        form: { kind: 'container', layout: 'stack', children: [{ kind: 'control', control: 'phone' }] },
      },
    })
    expect(bogus.some((e) => /control 'phone' is not declared/.test(e.message))).toBe(true)

    // Every configured field resolves; so does `submit`.
    const ok = validateBehaviorControls(contactFormMeta, { config, slots: { form: formSlot } })
    expect(ok).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-702 — Behavior client behaviour ships as one page-referenced asset
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — behavior client behaviour ships once per page', () => {
  afterEach(() => {
    vi.doUnmock('../packages/framework/src/index')
    vi.resetModules()
  })

  it('test_UAT_AC702_client_behaviour_ships_as_one_page_referenced_asset', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac702-'))
    try {
      cmdNew('acme', { cwd })
      // Seed the home page with instances of BOTH survivor behaviors.
      const homePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
      const home = JSON.parse(readFileSync(homePath, 'utf8'))
      home.modules = [
        {
          id: 'gallery',
          type: 'carousel',
          version: 3,
          config: { autoplay: true },
          slots: { slide: [{ kind: 'text', text: 'A great experience.' }] },
        },
        {
          id: 'get-in-touch',
          type: 'contact-form',
          version: 4,
          config: {
            action: 'https://example.com/submit',
            fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
          },
          slots: {
            form: {
              kind: 'container',
              layout: 'stack',
              children: [
                { kind: 'control', control: 'email' },
                { kind: 'control', control: 'submit' },
              ],
            },
          },
        },
      ]
      // REQ-102 — `1c new` now seeds an L1 document, so a behavior module must name
      // the seam it mounts into (REQ-93). Declare one slot per instance and bind it.
      home.l1.root.children.push(...home.modules.map((m) => ({ kind: 'slot', name: m.id })))
      for (const m of home.modules) m.slot = m.id
      writeFileSync(homePath, JSON.stringify(home, null, 2))

      const { outDir } = await cmdRender('acme', { cwd })

      // Exactly ONE client-behaviour asset, folding BOTH behaviors' vetted code.
      // The filename is deliberately `capabilities.js` — a plural bundle-output
      // name, not the renamed type (REQ-87 left it alone on purpose).
      const capsPath = path.join(outDir, 'capabilities.js')
      expect(existsSync(capsPath)).toBe(true)
      const capsJs = readFileSync(capsPath, 'utf8')
      expect(capsJs).toContain('/* behavior: carousel */')
      expect(capsJs).toContain('/* behavior: contact-form */')
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
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }

    // The asset + reference are emitted precisely BECAUSE the catalog ships
    // client behaviour. With a catalog that ships none, neither is produced —
    // the framework catalog is the one seam substituted here (the render
    // pipeline itself is real).
    const emptyCwd = mkdtempSync(path.join(tmpdir(), 'ac702-empty-'))
    try {
      vi.resetModules()
      // The seam is `@1stcontact/framework/worker`, which is what `render.ts`
      // imports since REQ-145 — the barrel re-exports the `.astro`-bound
      // registry, so the render could not reach it and run in workerd. Mocking
      // the barrel here would substitute a module the render no longer loads and
      // the arm would silently stop testing anything.
      vi.doMock('../packages/framework/src/worker', async (importOriginal) => {
        const actual = await importOriginal<typeof import('../packages/framework/src/worker')>()
        return { ...actual, getModuleClientJs: () => '' }
      })
      const commands = await import('../tools/generate/src/cli/commands')
      commands.cmdNew('nojs', { cwd: emptyCwd })
      const { outDir } = await commands.cmdRender('nojs', { cwd: emptyCwd })

      expect(existsSync(path.join(outDir, 'capabilities.js'))).toBe(false)
      const pageHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8')
      expect(pageHtml).not.toMatch(/capabilities\.js/)
      expect(pageHtml).not.toMatch(/<script type="module"/)
    } finally {
      rmSync(emptyCwd, { recursive: true, force: true })
    }

    // And the real catalog does ship client behaviour — the positive arm above
    // is exercising the non-empty branch, not a vacuous one.
    expect(getModuleClientJs().length).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-703 — Isolation conformance: degenerate input degrades inertly; throw flagged
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — isolation conformance dimension', () => {
  const carouselDegenerate: ConformanceFixture = {
    label: 'carousel-degenerate',
    props: { version: 3, config: { autoplay: 12345, loop: 'bogus' }, slots: {} },
  }
  const contactDegenerate: ConformanceFixture = {
    label: 'contact-degenerate',
    props: {
      version: 4,
      config: { action: 'https://example.com/lead', fields: 'not-a-list' },
      slots: {},
    },
  }

  // A test-only catalog entry whose core throws during SSR (non-isolated). It
  // declares the renamed discriminant `kind: 'behavior'`.
  const resolveThrows: ModuleResolver = (type) => {
    if (type === 'fc-throws') {
      return {
        meta: {
          id: 'fc-throws',
          version: 1,
          kind: 'behavior',
          config: {},
          slots: {},
          conformance: { obligations: ['isolation'] },
        } satisfies BehaviorMeta,
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

    // A behavior whose core throws during render is a page-robustness break —
    // reported as an isolation violation, so the dimension is a real
    // discriminator rather than a no-op.
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
  }, 60000)
})

// ════════════════════════════════════════════════════════════════════════════
// AC-704 — Survivor behaviors declare the full five-dimension obligation set
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — full five-dimension conformance obligation set', () => {
  it('test_UAT_AC704_survivors_declare_the_full_obligation_set', () => {
    const full: ConformanceObligation[] = [
      'isolation',
      'responsive',
      'safety',
      'security',
      'x-browser',
    ]
    for (const def of [getModule('carousel', 3), getModule('contact-form', 4)]) {
      const conformance: BehaviorConformance = def.meta.conformance
      // The published contract enumerates exactly the five conformance
      // dimensions — the harness holds every behavior to the complete envelope.
      expect([...conformance.obligations].sort()).toEqual(full)
      // No dimension is legitimately opted out of.
      expect(conformance.except).toBeUndefined()
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-722 — The contract is published under the Behavior* names, kind: 'behavior'
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — Behavior* contract naming is atomic', () => {
  it('test_UAT_AC722_behavior_contract_published_atomically_under_behavior_names', async () => {
    // ── The contract TYPES resolve from the framework package root ────────────
    // Each name is bound to a real declaration here; the file would not compile
    // if any had failed to resolve after the rename.
    const meta: BehaviorMeta = getModule('carousel', 3).meta
    const def: BehaviorDefinition = getModule('contact-form', 4)
    const fieldSpec: BehaviorConfigSpec = meta.config.autoplay
    const fieldType: BehaviorConfigType = fieldSpec.type
    const slotSpec: BehaviorSlotSpec = meta.slots.slide
    const slotValue: BehaviorSlotValue = [textNode]
    const instance: BehaviorInstance = { config: { autoplay: true }, slots: { slide: slotValue } }
    const conformance: BehaviorConformance = meta.conformance
    const obligation: ConformanceObligation = conformance.obligations[0]
    const errors: BehaviorValidationError[] = validateBehaviorInstance(meta, instance)
    type AssertedMeta = AssertBehaviorMeta<typeof carouselMeta>
    const asserted: AssertedMeta = carouselMeta

    expect(fieldType).toBe('boolean')
    expect(slotSpec.repeated).toBe(true)
    expect(obligation).toBeTypeOf('string')
    expect(def.Component).toBeTypeOf('function')
    expect(asserted.id).toBe('carousel')
    expect(errors).toEqual([])

    // ── The three VALIDATORS resolve from the root and drive the contract ─────
    // Same accept/reject outcomes the typed-contract and slot-security ACs
    // require, reached under the renamed names.
    expect(framework.validateBehaviorConfig).toBeTypeOf('function')
    expect(framework.validateBehaviorSlots).toBeTypeOf('function')
    expect(framework.validateBehaviorInstance).toBeTypeOf('function')
    expect(validateBehaviorConfig(meta, { loop: false, autoplay: true })).toEqual([])
    expect(validateBehaviorConfig(meta, { autoplay: 'not-a-boolean' }).map((e) => e.field)).toEqual([
      'config.autoplay',
    ])
    expect(validateBehaviorSlots(meta, { slide: [textNode] })).toEqual([])
    expect(validateBehaviorSlots(meta, { slide: ['<b>raw</b>' as never] }).map((e) => e.field)).toEqual([
      'slots.slide[0]',
    ])
    expect(
      validateBehaviorInstance(meta, { config: { autoplay: 'nope' }, slots: {} }).map((e) => e.field),
    ).toEqual(['config.autoplay', 'slots.slide'])

    // ── Every catalog entry carries the renamed discriminant ─────────────────
    expect(registry.size).toBeGreaterThan(0)
    for (const entry of registry.values()) {
      expect(entry.meta.kind).toBe('behavior')
      expect(entry.meta.kind).not.toBe('capability')
    }

    // ── The rename is ATOMIC: no Capability* alias, no 'capability' residue ───
    // Nothing named Capability* is published from the package root.
    const rootExports = Object.keys(framework)
    expect(rootExports).toContain('validateBehaviorConfig')
    expect(rootExports.filter((k) => /capability/i.test(k))).toEqual([])

    // The package root's own source publishes the Behavior* family and carries
    // no Capability* identifier (types erase at runtime, so the export list is
    // the observable form of "published under the Behavior* names").
    const rootSrc = readFileSync(new URL('../packages/framework/src/index.ts', import.meta.url), 'utf8')
    for (const name of [
      'BehaviorMeta',
      'BehaviorConfigSpec',
      'BehaviorConfigType',
      'BehaviorSlotSpec',
      'BehaviorSlotValue',
      'BehaviorInstance',
      'BehaviorDefinition',
      'BehaviorConformance',
      'ConformanceObligation',
      'BehaviorValidationError',
      'AssertBehaviorMeta',
      'validateBehaviorConfig',
      'validateBehaviorSlots',
      'validateBehaviorInstance',
    ]) {
      expect(rootSrc).toContain(name)
    }
    expect(rootSrc).not.toMatch(/Capability/)

    // The contract module itself declares no 'capability' discriminant.
    const contractSrc = readFileSync(
      new URL('../packages/framework/src/modules/behavior.ts', import.meta.url),
      'utf8',
    )
    expect(contractSrc).toMatch(/kind: 'behavior'/)
    expect(contractSrc).not.toMatch(/'capability'/)
    expect(contractSrc).not.toMatch(/Capability/)

    // A generator still importing the pre-rename module path fails to resolve
    // rather than silently diverging (CLAUDE.md: no legacy modes).
    const legacyPath = `../packages/framework/src/modules/${'capability'}`
    await expect(import(/* @vite-ignore */ legacyPath)).rejects.toThrow()
  })
})
