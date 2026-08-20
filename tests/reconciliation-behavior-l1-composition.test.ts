import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  carouselMeta,
  contactFormMeta,
  contactFormPreset,
  getModuleCss,
  L1_EDIT_MARKER_ATTR,
  resolveControlNames,
  validateBehaviorControls,
  validateBehaviorInstance,
} from '../packages/framework/src/index'
import type { BehaviorSlotValue } from '../packages/framework/src/index'
import { l1NodeSchema, validateL1 } from '../packages/site-schema/src/index'
import { carousel as Carousel } from '../packages/framework/src/modules/carousel/component'
import { contactForm as ContactForm } from '../packages/framework/src/modules/contact-form/component'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * Reconciliation UATs for story-179b8c06 — the **second composition direction**
 * (L1 wraps the module) and the zero-CSS obligation it made enforceable.
 *
 * A `slot` expresses only "the module wraps L1", which is structurally
 * unreachable for a leaf (`<input>` is void; `<textarea>`'s content is its
 * value) — so before REQ-96 a form module *had* to paint its own fields and no
 * validator could catch it. A `control` node closes that: the behavior declares
 * which leaf elements exist, an L1 node names one, and the emitted element
 * carries L1's class, geometry and paint while the module contributes only the
 * attribute bundle that makes it work.
 *
 * One UAT per acceptance criterion (AC-808 … AC-811), exercised at the real
 * boundary: the behavior validators reached from the framework package root, the
 * SSR container render (the path `tools/generate` uses), and the render pipeline
 * itself for the generated stylesheet.
 */

// ── SSR render helper — the tools/generate render path (REQ-148: a behavior is
// a plain function of its props, so this IS the render, not a stand-in for it) ──
function render(Component: unknown, props: unknown): string {
  return (Component as (p: unknown) => string)(props)
}

/**
 * The CSS one module actually contributes to the generated stylesheet, comments
 * stripped — a rule is what ships, and a comment saying the module no longer
 * sets `flex-basis` must not read as the module setting it.
 */
/**
 * Where the section beginning at `start` ends: the next `/* module: … *​/` header,
 * or the responsive-typography tail `getModuleCss()` appends after the last one.
 */
function nextSection(css: string, start: number): number {
  const m = /\n\n\/\* (?:module: |responsive )/.exec(css.slice(start + 1))
  return m ? start + 1 + m.index : -1
}

function moduleCss(slug: string): string {
  const all = getModuleCss()
  const start = all.indexOf(`/* module: ${slug} */`)
  expect(start, `module ${slug} present in the generated stylesheet`).toBeGreaterThanOrEqual(0)
  // REQ-148 — end at the next SECTION header, not at any top-level comment. The
  // chrome used to live indented inside an `.astro` `<style>` block, so a comment
  // of its own never began at column 0 and `\n\n/* ` could only be the next
  // section. It lives in a real `styles.css` now, dedented, so the loose pattern
  // truncated a module's block at its first internal comment.
  const next = nextSection(all, start)
  return all.slice(start, next < 0 ? all.length : next).replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Every `selector { … }` rule in a stylesheet, split to one entry per selector. */
/**
 * The closed set of properties a **settled-state** rule may set (REQ-116).
 *
 * These are the flow- and scroll-release properties: they undo the module's own
 * behavioural mechanics so content the behaviour was holding out of view becomes
 * visible in the edit render. None of them paints, and none of them is an axis an
 * L1 subtree owns — which is what keeps this a second bounded carve-out on the
 * zero-CSS obligation rather than a hole in it.
 */
const SETTLED_STATE_PROPERTIES = [
  'display',
  'flex-wrap',
  'overflow',
  'overflow-x',
  'overflow-y',
  'position',
  'scroll-snap-type',
  'visibility',
]

/** Is `selector` scoped to the edit channel by the document-level marker? */
function isEditScoped(selector: string): boolean {
  return selector.includes(`[${L1_EDIT_MARKER_ATTR}]`)
}

/** The property names a rule body sets. */
function propertiesOf(body: string): string[] {
  return body
    .split(';')
    .map((d) => d.split(':')[0].trim().toLowerCase())
    .filter(Boolean)
}

function rulesOf(css: string): Array<{ selector: string; body: string }> {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((m) =>
    m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((selector) => ({ selector, body: m[2] })),
  )
}

/** Every node of an L1 subtree, depth-first. */
function walk(node: unknown): Array<Record<string, unknown>> {
  const n = node as Record<string, unknown> | null
  if (!n || typeof n !== 'object') return []
  return [n, ...((n.children as unknown[]) ?? []).flatMap(walk)]
}

// ════════════════════════════════════════════════════════════════════════════
// AC-808 — Control bindings are validated in both directions
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — control bindings are validated in both directions', () => {
  it('test_UAT_AC808_control_bindings_validated_in_both_directions', () => {
    const formConfig = {
      action: 'https://example.com/submit',
      fields: [
        { name: 'your-name', label: 'Your name', type: 'text', required: true },
        { name: 'your-email', label: 'Email', type: 'email', required: false },
      ],
    }
    const formSlot = (children: unknown[]): BehaviorSlotValue =>
      ({ kind: 'container', layout: 'stack', children }) as BehaviorSlotValue
    const slide = { kind: 'text', text: 'A great experience.' }

    // ── The roster is resolved per instance, from the declaration ─────────────
    // A per-item element yields one name per configured item — the field's own
    // submission name — plus the plain `submit` declaration.
    const formNames = [...resolveControlNames(contactFormMeta, { config: formConfig }).keys()]
    expect(formNames.sort()).toEqual(['submit', 'your-email', 'your-name'])
    // …and INVARIANT elements are absent: their presentation is fixed by an
    // obligation, so there is nothing for an L1 node to paint.
    for (const invariant of ['label', 'honeypot', 'turnstile']) {
      expect(formNames, `invariant '${invariant}' is not bindable`).not.toContain(invariant)
    }
    // A per-subtree element yields one name per MOUNTED subtree — the dot roster
    // follows the slide count, not a fixed list.
    const dotsFor = (count: number) => [
      ...resolveControlNames(carouselMeta, {
        slots: { slide: Array.from({ length: count }, () => slide) },
      }).keys(),
    ]
    expect(dotsFor(3)).toEqual(['dot-0', 'dot-1', 'dot-2'])
    expect(dotsFor(1)).toEqual(['dot-0'])

    // ── (a) A control node per declared element — zero control violations ─────
    expect(
      validateBehaviorControls(contactFormMeta, {
        config: formConfig,
        slots: {
          form: formSlot([
            { kind: 'control', control: 'your-name' },
            { kind: 'control', control: 'your-email' },
            { kind: 'control', control: 'submit' },
          ]),
        },
      }),
    ).toEqual([])
    expect(
      validateBehaviorControls(carouselMeta, {
        config: { autoplay: false },
        slots: {
          slide: [slide, slide],
          dots: formSlot([
            { kind: 'control', control: 'dot-0' },
            { kind: 'control', control: 'dot-1' },
          ]),
        },
      }),
    ).toEqual([])

    // ── (b) A name the behavior never declared — undeclared-binding violation ─
    // Without this check the node renders nothing and the author silently loses
    // a field they believed they had placed.
    const undeclared = validateBehaviorControls(contactFormMeta, {
      config: formConfig,
      slots: { form: formSlot([{ kind: 'control', control: 'phone' }]) },
    })
    const bogus = undeclared.find((e) => /control 'phone' is not declared/.test(e.message))
    expect(bogus).toBeDefined()
    // Reported against the slot it was found in, and naming what it could have used.
    expect(bogus!.field).toBe('slots.form')
    expect(bogus!.message).toContain('your-name')
    expect(bogus!.message).toContain('submit')
    // The same in the other survivor: a dot beyond the mounted slide count.
    const extraDot = validateBehaviorControls(carouselMeta, {
      slots: { slide: [slide], dots: formSlot([{ kind: 'control', control: 'dot-4' }]) },
    })
    expect(extraDot.some((e) => /control 'dot-4' is not declared/.test(e.message))).toBe(true)
    expect(extraDot.find((e) => /dot-4/.test(e.message))!.field).toBe('slots.dots')

    // ── (c) A REQUIRED declared element with nothing bound to it ──────────────
    // `field` is required, so a configured field the author never dressed fails
    // validation rather than vanishing from the rendered page.
    const unbound = validateBehaviorControls(contactFormMeta, {
      config: formConfig,
      slots: {
        form: formSlot([
          { kind: 'control', control: 'your-name' },
          { kind: 'control', control: 'submit' },
        ]),
      },
    })
    expect(unbound).toHaveLength(1)
    expect(unbound[0].field).toBe('controls.field')
    expect(unbound[0].message).toContain("required control 'your-email'")
    // …while an OPTIONAL declared element left unbound is not a violation: a
    // single-field form still submits on Enter, and a carousel needs no dots.
    expect(
      validateBehaviorControls(contactFormMeta, {
        config: formConfig,
        slots: {
          form: formSlot([
            { kind: 'control', control: 'your-name' },
            { kind: 'control', control: 'your-email' },
          ]),
        },
      }),
    ).toEqual([])
    expect(validateBehaviorControls(carouselMeta, { slots: { slide: [slide, slide] } })).toEqual([])

    // ── (d) Naming an INVARIANT element is an undeclared binding ──────────────
    // A designer must not be able to reveal the honeypot, unhide the programmatic
    // label, or move the Turnstile mount — so none is bindable.
    for (const invariant of ['label', 'honeypot', 'turnstile']) {
      const errors = validateBehaviorControls(contactFormMeta, {
        config: formConfig,
        slots: {
          form: formSlot([
            { kind: 'control', control: 'your-name' },
            { kind: 'control', control: 'your-email' },
            { kind: 'control', control: invariant },
          ]),
        },
      })
      expect(
        errors.some((e) => new RegExp(`control '${invariant}' is not declared`).test(e.message)),
        `binding invariant '${invariant}' is refused`,
      ).toBe(true)
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-809 — A behavior module ships no CSS beyond its declared invariant elements
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — behavior modules paint only their invariant elements', () => {
  it('test_UAT_AC809_modules_ship_no_css_beyond_declared_invariant_elements', async () => {
    // ── contact-form: every selector is invariant or wrapper chrome ───────────
    const formCss = moduleCss('contact-form')
    const formAllowed = new Set([
      // Wrapper chrome, zeroed so the module adds no layout of its own to the L1
      // it wraps — a mechanic, not a look.
      '.contact-form',
      '.contact-form__inner',
      '.contact-form__form',
      // Declared invariant elements: obligation, not taste.
      '.contact-form__label',
      '.contact-form__honeypot',
      '.contact-form__turnstile',
      '.contact-form__error',
    ])
    const formRules = rulesOf(formCss)
    expect(formRules.length).toBeGreaterThan(0)
    for (const { selector } of formRules) {
      expect(formAllowed, `contact-form selector ${selector}`).toContain(selector)
    }

    // Nothing here decides how a FIELD looks. These are the exact properties the
    // deleted stylesheet used to pin — the ones that rendered the reference's
    // 50px transparent fields as 44px white ones.
    expect(formCss).not.toMatch(/border-radius/)
    expect(formCss).not.toMatch(/background/)
    expect(formCss).not.toMatch(/flex-direction/)
    expect(formCss).not.toMatch(/gap:/)
    expect(formCss).not.toMatch(/align-self/)
    expect(formCss).not.toMatch(/var\(--color-/)
    // No field or submit chrome class survives at all.
    expect(formCss).not.toMatch(/contact-form__field/)
    expect(formCss).not.toMatch(/contact-form__submit/)
    // `padding` and `border` remain only as the zeroing that stops the wrapper
    // and the hidden label displacing the L1 layout — never as a field surface.
    for (const decl of formCss.match(/(?:padding|border)\s*:[^;}]*/g) ?? []) {
      expect(decl.replace(/\s/g, ''), `contact-form declaration '${decl.trim()}'`).toMatch(
        /^(padding|border):0$/,
      )
    }

    // ── carousel: scroll mechanics plus one invariant state signal ────────────
    const carouselCss = moduleCss('carousel')
    for (const { selector } of rulesOf(carouselCss)) {
      expect(
        ['.carousel__track', '.carousel__track::-webkit-scrollbar', '.carousel__slide'].includes(
          selector,
        ) ||
          /^\[data-carousel-dot\]/.test(selector) ||
          isEditScoped(selector),
        `carousel selector ${selector} is mechanics, the current-slide signal, or a settled state`,
      ).toBe(true)
    }
    // A slide's width and the rhythm between slides are the slide subtrees' own.
    expect(carouselCss).not.toMatch(/flex-basis/)
    expect(carouselCss).not.toMatch(/view-single|view-peek|view-multi/)
    expect(carouselCss).not.toMatch(/gap:/)
    // …and a dot's size and colour are the L1 node's: the current-slide signal is
    // expressed the minimal, size- and colour-agnostic way.
    const dotRules = rulesOf(carouselCss).filter((r) => /^\[data-carousel-dot\]/.test(r.selector))
    expect(dotRules.length).toBeGreaterThan(0)
    for (const { selector, body } of dotRules) {
      expect(body, `dot rule ${selector}`).toMatch(/opacity/)
      expect(body, `dot rule ${selector}`).not.toMatch(/width|height|background|color|border/)
    }
    // The mechanics without which the behaviour does not work are still there.
    expect(carouselCss).toMatch(/scroll-snap-type/)
    expect(carouselCss).toMatch(/scroll-snap-align/)

    // ── the settled-state carve-out (REQ-116) ─────────────────────────────────
    // A module whose behaviour keeps content out of view declares its own
    // behaviour-off state, because only the module knows what its behaviour was
    // holding back. That is a second declared carve-out on the zero-CSS rule, and
    // it is bounded exactly like the first: the rule is scoped to the edit
    // channel, and it RELEASES rather than PAINTS.
    const settled = [...rulesOf(carouselCss), ...rulesOf(moduleCss('contact-form'))].filter((r) =>
      isEditScoped(r.selector),
    )
    expect(settled.length, 'a settled-state rule exists to be bounded').toBeGreaterThan(0)
    for (const { selector, body } of settled) {
      // Scoped by the DOCUMENT-level marker, which only the edit render sets, so
      // the rule cannot reach a published or draft-preview page at all. This is
      // what keeps AC-809's zero-CSS guarantee intact where it is load-bearing.
      expect(selector, `settled rule ${selector}`).toMatch(
        new RegExp(`^\\[${L1_EDIT_MARKER_ATTR}\\]\\s`),
      )
      // It touches only the closed set of flow-release properties — the ones that
      // undo the module's own mechanics. Nothing here decides how anything looks.
      for (const prop of propertiesOf(body)) {
        expect(SETTLED_STATE_PROPERTIES, `settled rule ${selector} sets '${prop}'`).toContain(prop)
      }
      // Stated as a negative too, against the same screen the paint rules face.
      expect(body, `settled rule ${selector}`).not.toMatch(
        /background|color|border|font|gap|flex-basis|width|height|padding|margin|box-shadow/,
      )
    }

    // ── Rendered: every invariant element carries the marker attribute ────────
    const formHtml = await render(ContactForm, {
      config: {
        action: 'https://example.com/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
      slots: {
        form: {
          kind: 'container',
          layout: 'stack',
          children: [{ kind: 'control', control: 'email' }],
        },
      },
    })
    for (const cls of [
      'contact-form__label',
      'contact-form__honeypot',
      'contact-form__turnstile',
      'contact-form__error',
    ]) {
      expect(formHtml, `${cls} is marked repro-only chrome`).toMatch(
        new RegExp(`class="${cls}"[^>]*data-fc-invariant`),
      )
    }
    // …and naming one from an L1 control node is refused (see AC-808's direction
    // check) — the marker and the un-bindability are the same declaration.
    expect(
      validateBehaviorControls(contactFormMeta, {
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
              { kind: 'control', control: 'honeypot' },
            ],
          },
        } as Record<string, BehaviorSlotValue>,
      }).some((e) => /control 'honeypot' is not declared/.test(e.message)),
    ).toBe(true)

    // ── Rendered: the carousel's current-slide signal, carrying no look ───────
    const carouselHtml = await render(Carousel, {
      config: {},
      slots: {
        slide: [
          { kind: 'text', text: 'One' },
          { kind: 'text', text: 'Two' },
        ],
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
    expect(carouselHtml).toMatch(/data-carousel-dot="0"[^>]*data-carousel-current/)
    expect(carouselHtml).toMatch(/data-carousel-dot="1"/)
    // The signal is a marker only — the module hands the dot no size or colour.
    const dotTags = carouselHtml.match(/<span[^>]*data-carousel-dot[^>]*>/g) ?? []
    expect(dotTags).toHaveLength(2)
    for (const tag of dotTags) {
      expect(tag).not.toMatch(/style=/)
      expect(tag).not.toMatch(/width|height|background/)
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-810 — The generated site stylesheet carries module chrome and no source
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — the generated stylesheet carries chrome, not source', () => {
  it('test_UAT_AC810_generated_stylesheet_carries_module_chrome_and_no_component_source', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac810-'))
    let css: string
    try {
      cmdNew('acme', { cwd })
      // Put BOTH survivor behaviors in the rendered site, so both contribute.
      const homePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
      const home = JSON.parse(readFileSync(homePath, 'utf8'))
      home.modules = [
        {
          id: 'gallery',
          type: 'carousel',
          version: 3,
          slot: 'gallery',
          config: {},
          slots: { slide: [{ kind: 'text', text: 'A great experience.' }] },
        },
        {
          id: 'get-in-touch',
          type: 'contact-form',
          version: 4,
          slot: 'get-in-touch',
          config: {
            action: 'https://example.com/submit',
            fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
          },
          slots: {
            form: {
              kind: 'container',
              layout: 'stack',
              children: [{ kind: 'control', control: 'email' }],
            },
          },
        },
      ]
      home.l1.root.children.push(...home.modules.map((m: { id: string }) => ({ kind: 'slot', name: m.id })))
      writeFileSync(homePath, JSON.stringify(home, null, 2))

      const { outDir } = await cmdRender('acme', { cwd })
      css = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }

    // Each module's chrome is present…
    expect(css).toMatch(/\.carousel__track\s*\{/)
    expect(css).toMatch(/\.carousel__slide\s*\{/)
    expect(css).toMatch(/\.contact-form__honeypot\s*\{/)
    expect(css).toMatch(/\.contact-form__label\s*\{/)

    // …and nothing else from the component's source. A doc comment that merely
    // MENTIONS `<style>` sits in the frontmatter, which is code and never markup;
    // the self-closing per-instance `<style set:html={…} />` has no closing
    // partner. Reading either as an opening tag runs the match on to the next real
    // `</style>` and folds the component's imports, props interface, script body
    // and markup into the stylesheet as if it were CSS.
    expect(css).not.toMatch(/^import /m)
    expect(css).not.toMatch(/\bimport type\b/)
    expect(css).not.toMatch(/\binterface Props\b/)
    expect(css).not.toMatch(/Astro\.props/)
    expect(css).not.toMatch(/set:html/)
    expect(css).not.toMatch(/<section|<ul\b|<li\b|<form\b/)

    // `carousel`'s full chrome block must survive intact: the rules before its
    // internal comments and the ones after them. (Before REQ-148 this guarded a
    // regex scanner over an `.astro` template, which could swallow the block at a
    // doc comment mentioning `<style>` or at a self-closing `<style set:html>`;
    // the chrome is a plain `styles.css` now and the scanner is deleted, but the
    // assertion still holds — the generated stylesheet must carry chrome, never
    // component source.)
    const start = css.indexOf('/* module: carousel */')
    expect(start).toBeGreaterThanOrEqual(0)
    const next = nextSection(css, start)  // a section header, not any comment (REQ-148)
    const carouselBlock = css.slice(start, next < 0 ? css.length : next)
    expect(carouselBlock).toMatch(/scroll-snap-type/)
    expect(carouselBlock).toMatch(/\[data-carousel-dot\]\[data-carousel-current\]/)
    expect(carouselBlock).not.toMatch(/renderL1Fragment|slideNodes|dotControls/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-811 — An L2 preset supplies a vetted default look for an uncaptured form
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — the relocated default look is an L2 preset', () => {
  it('test_UAT_AC811_l2_preset_supplies_a_vetted_default_look', async () => {
    const fields = [
      { name: 'your-name', label: 'Your name', labelMode: 'visible' as const, type: 'text' as const },
      { name: 'email', label: 'Your email', labelMode: 'placeholder' as const, type: 'email' as const },
      { name: 'message', label: 'Message', labelMode: 'visible' as const, type: 'textarea' as const },
    ]
    const preset = contactFormPreset(fields)

    // ── It is ordinary L1, inside the envelope ───────────────────────────────
    expect(l1NodeSchema.safeParse(preset).success).toBe(true)
    expect(validateL1({ widths: [1280], root: preset }).ok).toBe(true)

    // ── It binds one control per field name, plus the submit ─────────────────
    const bound = walk(preset)
      .filter((n) => n.kind === 'control')
      .map((n) => n.control as string)
    expect(bound.sort()).toEqual(['email', 'message', 'submit', 'your-name'])
    // …so an instance that mounts it reports no control-binding violation.
    const config = {
      action: 'https://example.com/submit',
      fields: fields.map((f) => ({ ...f, required: false })),
    }
    const violations = validateBehaviorInstance(contactFormMeta, {
      config,
      slots: { form: preset as BehaviorSlotValue },
    })
    expect(violations).toEqual([])

    // ── Labelling follows the reference's own witness ────────────────────────
    // A visibly-labelled field gains a text run above it; a placeholder-labelled
    // one does not (the module puts those words inside the box).
    const runs = walk(preset)
      .filter((n) => n.kind === 'text')
      .map((n) => n.text as string)
    expect(runs).toContain('Your name')
    expect(runs).toContain('Message')
    expect(runs).not.toContain('Your email')

    // ── A textarea gets a taller measure than a single-line field ────────────
    const heightOf = (name: string) => {
      const node = walk(preset).find((n) => n.kind === 'control' && n.control === name)!
      return (node.sizing as { height: { px: number } }).height.px
    }
    expect(heightOf('message')).toBeGreaterThan(heightOf('your-name'))
    // …and it lays itself out from sizing and gaps, not per-width keyframes — a
    // preset has no capture behind it, so it has no measured geometry to pin.
    expect(walk(preset).some((n) => n.geometry !== undefined)).toBe(false)
    expect((preset as unknown as { gapPx: number }).gapPx).toBe(16)

    // ── Every design constant is the caller's to override ────────────────────
    const custom = contactFormPreset(fields, {
      color: '#112233',
      fieldFill: '#fafafa',
      borderColor: '#445566',
      radiusPx: 3,
      submitFill: '#778899',
      submitColor: '#aabbcc',
      fieldHeightPx: 60,
      gapPx: 40,
    })
    expect(validateL1({ widths: [1280], root: custom }).ok).toBe(true)
    const customNodes = walk(custom)
    const nameControl = customNodes.find((n) => n.control === 'your-name')!
    expect(nameControl.axes).toMatchObject({
      color: '#112233',
      surfaceFill: '#fafafa',
      borderRadiusPx: 3,
      border: { widthPx: 1, color: '#445566' },
    })
    expect((nameControl.sizing as { height: { px: number } }).height.px).toBe(60)
    const messageControl = customNodes.find((n) => n.control === 'message')!
    expect((messageControl.sizing as { height: { px: number } }).height.px).toBe(180)
    const submitControl = customNodes.find((n) => n.control === 'submit')!
    expect(submitControl.axes).toMatchObject({
      surfaceFill: '#778899',
      color: '#aabbcc',
      borderRadiusPx: 3,
    })
    expect(customNodes.some((n) => n.kind === 'text' && (n.axes as { color: string })?.color === '#112233')).toBe(
      true,
    )
    expect((custom as unknown as { gapPx: number }).gapPx).toBe(40)

    // ── Rendered: a complete, laid-out form with no module stylesheet ─────────
    const html = await render(ContactForm, { config, slots: { form: preset } })
    expect(html).toMatch(/<input[^>]*name="your-name"[^>]*type="text"/)
    expect(html).toMatch(/<input[^>]*name="email"[^>]*type="email"/)
    expect(html).toMatch(/<input[^>]*placeholder="Your email"/)
    expect(html).toMatch(/<textarea[^>]*name="message"[^>]*><\/textarea>/)
    expect(html).toMatch(/<button[^>]*type="submit"/)
    // Every one of them painted by the preset's L1 axes…
    expect(html).toContain('background-color: #ffffff')
    expect(html).toContain('border: 1px solid #e5e7eb')
    expect(html).toContain('border-radius: 8px')
    expect(html).toContain('height: 44px')
    // …plus the vetted hover and focus treatment a UA would otherwise decide.
    expect(html).toMatch(/:hover/)
    expect(html).toMatch(/:focus-visible|:focus/)
    // …and none of it from a module stylesheet: no field or submit chrome class.
    expect(html).not.toMatch(/contact-form__field/)
    expect(html).not.toMatch(/contact-form__submit/)
  })
})
