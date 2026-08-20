import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { renderL1Fragment, type L1ControlElement } from '../packages/framework/src/l1/render'
import { contactFormControls } from '../packages/framework/src/modules/contact-form/controls'
import { contactFormPreset } from '../packages/framework/src/l2/contact-form'
import { getModuleCss } from '../packages/framework/src/modules/styles'
import { l1NodeSchema, validateL1 } from '../packages/site-schema/src/index'
import { foldToL1 } from '../tools/generate/src/l1'
import type { FoldedForm } from '../tools/generate/src/l1'
import { EXTRACT_SCRIPT, type RawSignals } from '../tools/generate/src/cli'
import type { MultiStateCapture } from '../tools/generate/src/cli/capture'

/**
 * REQ-96 — **the second composition direction**: L1 wraps the module.
 *
 * DOC-25 §1.3 says appearance is 100% L1 and *"the module wraps L1; it never
 * paints it."* A `slot` can only express that one direction, and it works when
 * the behavioural element is a **container** — a carousel's `<li>` really can
 * hold a slide's whole L1 look. It is structurally impossible for a **leaf**:
 * `<input>` is void and `<textarea>`'s content is its value, so there is nowhere
 * to put an L1 subtree. The module therefore *had* to paint its own controls,
 * and no validator could catch it, because the contract had no vocabulary for
 * "this element's look belongs to L1" (DOC-25 §10).
 *
 * A `control` node closes that: it names an element the module declared, and the
 * emitter renders that element carrying **L1's class, geometry and paint axes**
 * while the module supplies only the attribute bundle that makes it *work*.
 *
 * These UATs pin the acceptance criteria that the per-module suites do not:
 * that both behaviors now ship no CSS beyond their invariant elements, that the
 * safety envelope stayed construction-time through the inversion, that the value
 * gate no longer pairs against module-invariant elements, and that the three
 * gigabytealchemy form deltas the ticket names actually close.
 */

const GA_BUNDLE = path.join('storage', 'references', 'gigabytealchemy.ai', 'index')

/**
 * The retained capture oracle is a gitignored working artifact (`.gitignore` —
 * `/storage/references/`), so it is present only in a worktree that has captured
 * it. These two measurements are read off the REAL reference rather than a
 * fixture, so they gate on its presence: the durable, reproducible form of the
 * same claim is AC-813's synthetic-fixture UAT, which runs everywhere.
 */
const HAVE_GA_ORACLE = existsSync(path.join(GA_BUNDLE, 'multistate.json'))

/**
 * The CSS a module actually contributes to the generated `theme.css`, with
 * comments stripped — a rule is what ships; a comment saying a module no longer
 * sets `flex-basis` must not read as the module setting it.
 */
function moduleCss(slug: string): string {
  const all = getModuleCss()
  const start = all.indexOf(`/* module: ${slug} */`)
  expect(start, `module ${slug} present in theme.css`).toBeGreaterThanOrEqual(0)
  // REQ-148 — end at the next SECTION header (the next module, or the
  // responsive-typography tail), not at any top-level comment. The chrome used to
  // sit indented inside an `.astro` `<style>` block, so a comment of its own never
  // began at column 0; it is a dedented `styles.css` now, and the loose pattern
  // truncated a module's block at its first internal comment.
  const m = /\n\n\/\* (?:module: |responsive )/.exec(all.slice(start + 1))
  const next = m ? start + 1 + m.index : -1
  return all.slice(start, next < 0 ? all.length : next).replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Every selector in a stylesheet, declaration bodies stripped. */
function selectorsOf(css: string): string[] {
  return [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)]
    .flatMap((m) => m[1].split(','))
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Fold the retained gigabytealchemy oracle — offline, no network, no browser. */
function foldGigabyte(): FoldedForm[] {
  const multi = JSON.parse(readFileSync(path.join(GA_BUNDLE, 'multistate.json'), 'utf8')) as MultiStateCapture
  const forms: FoldedForm[] = []
  foldToL1(multi, { forms })
  return forms
}

/** A folded form's control leaves, keyed by the element name each binds to. */
function controlsOf(form: FoldedForm): Map<string, { geometry?: { keyframes: Array<Record<string, number>> } }> {
  const out = new Map<string, { geometry?: { keyframes: Array<Record<string, number>> } }>()
  const walk = (n: { kind: string; control?: string; children?: unknown[] }): void => {
    if (n.kind === 'control' && n.control) out.set(n.control, n as never)
    for (const c of (n.children ?? []) as typeof n[]) walk(c)
  }
  walk(form.form as never)
  return out
}

/**
 * The reference's own measurement at one width, straight from the retained
 * oracle — a textless control by its accessible name, or a painted run (the
 * submit chip, which carries text) by that text.
 */
function oracleBox(width: number, name: string): { x: number; y: number; width: number; height: number } {
  const multi = JSON.parse(readFileSync(path.join(GA_BUNDLE, 'multistate.json'), 'utf8')) as MultiStateCapture
  const projection = multi.projections.find((p) => p.viewport.width === width)!
  const hit = projection.manifest.elements.find(
    (e) => (e.textless ? (e.accessibleName ?? '') : e.text) === name,
  )
  if (!hit?.box) throw new Error(`no captured element '${name}' at ${width}px`)
  return hit.box
}

/** Mount HTML in jsdom and run the real EXTRACT_SCRIPT, returning every field. */
function extractFields(bodyHtml: string): RawSignals['bands'][number]['fields'] {
  const dom = new JSDOM(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  })
  const R = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
  // jsdom does no layout (every box 0 → filtered as invisible), so give each
  // element a real painted box and a document large enough to contain it.
  dom.window.Element.prototype.getBoundingClientRect = function () {
    return R(64, 48, 600, 40) as unknown as DOMRect
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  const signals = (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
  return signals.bands.flatMap((b) => b.fields)
}

describe('REQ-96 — L1 wraps the module (control leaves)', () => {
  // ── 1. The modules ship no CSS beyond their invariant elements ─────────────

  it('test_UAT_FC_REQ-96_contact_form_paints_only_its_invariant_elements', () => {
    const css = moduleCss('contact-form')

    // Every remaining selector belongs to an element whose presentation is fixed
    // by an OBLIGATION rather than by taste (DOC-25 §10.3): the module's own
    // wrapper chrome (which must contribute no layout to the L1 it wraps), the
    // programmatic label, the honeypot, the Turnstile mount, the error surface.
    const allowed = new Set([
      '.contact-form',
      '.contact-form__inner',
      '.contact-form__form',
      '.contact-form__label',
      '.contact-form__honeypot',
      '.contact-form__turnstile',
      '.contact-form__error',
    ])
    for (const sel of selectorsOf(css)) expect(allowed, `selector ${sel}`).toContain(sel)

    // And nothing in it decides how a FIELD looks. These are the exact properties
    // the deleted stylesheet used to pin — the ones that made the reference's
    // 50px transparent fields render as 44px white ones.
    expect(css).not.toMatch(/border-radius/)
    expect(css).not.toMatch(/flex-direction/)
    expect(css).not.toMatch(/gap:/)
    expect(css).not.toMatch(/align-self/)
    expect(css).not.toMatch(/var\(--color-/)
    // REQ-88 needed `.contact-form__submit--l1` to stop the module painting over
    // the L1 chip bound into its button. With no module paint there is nothing
    // to undo, so the modifier — the design gap made visible — is gone.
    expect(css).not.toMatch(/contact-form__submit/)
  })

  it('test_UAT_FC_REQ-96_theme_css_carries_module_chrome_and_nothing_else', () => {
    // "The module ships no CSS beyond its invariant elements" is only checkable
    // if what it ships is actually CSS. Two `<style>`-shaped things in a module
    // source are NOT style elements — a doc comment that mentions `<style>`, and
    // the self-closing `<style set:html={…} />` that carries per-instance CSS —
    // and a scan that treats either as an opening tag runs on to the next real
    // `</style>`, folding the component's imports, props interface, script body
    // and markup into the generated stylesheet. `carousel` did exactly that.
    const css = getModuleCss()
    expect(css).not.toMatch(/^import /m)
    expect(css).not.toMatch(/interface Props/)
    expect(css).not.toMatch(/Astro\.props/)
    expect(css).not.toMatch(/<\/section>|<li |<form /)
    expect(css).not.toMatch(/set:html/)

    // …while the real chrome still arrives: the scan must not have over-corrected
    // into dropping the block the self-closing tag precedes.
    expect(css).toMatch(/\.carousel__track\s*\{/)
    expect(css).toMatch(/\.contact-form__honeypot\s*\{/)
  })

  it('test_UAT_FC_REQ-96_carousel_paints_no_slide_geometry_or_dot_look', () => {
    const css = moduleCss('carousel')

    // `config.view` resolved to a flex-basis (85% / 60%) — an aesthetic dial
    // wearing behavioural clothes, in the worked example DOC-25 used to explain
    // that config is "never aesthetics". A slide's width is now its own subtree's.
    expect(css).not.toMatch(/flex-basis/)
    expect(css).not.toMatch(/view-peek|view-multi|view-single/)
    // No inter-slide rhythm and no dot size or colour: both are L1's.
    expect(css).not.toMatch(/gap:/)
    expect(css).not.toMatch(/background/)
    expect(css).not.toMatch(/width:\s*var\(--space/)

    // What remains is scroll mechanics plus one invariant STATE signal — which
    // slide is current, something no static L1 subtree has an axis to express.
    expect(css).toMatch(/scroll-snap-type/)
    expect(css).toMatch(/\[data-carousel-dot\]\[data-carousel-current\]\s*\{\s*opacity/)
  })

  // ── 2. A control node renders the module's element, painted by L1 ──────────

  it('test_UAT_FC_REQ-96_a_control_node_emits_the_declared_element_with_l1_paint', () => {
    const controls = contactFormControls(
      [{ name: 'email', label: 'Your email', labelMode: 'placeholder', type: 'email', required: true }],
      'Send',
    )
    const { htmls, css } = renderL1Fragment(
      [
        {
          kind: 'control',
          control: 'email',
          axes: { color: '#0f172b', surfaceFill: '#00000000', border: { widthPx: 1, color: '#334155' } },
          sizing: { height: { mode: 'fixed', px: 50 } },
        },
      ],
      'cf',
      controls,
    )

    // The MODULE's half: the element, its type, its submission name, its
    // required-ness, and the id the programmatic label points at.
    expect(htmls[0]).toMatch(/^<input /)
    expect(htmls[0]).toContain('name="email"')
    expect(htmls[0]).toContain('type="email"')
    expect(htmls[0]).toContain('id="cf-email"')
    expect(htmls[0]).toContain('required')
    // …and the placeholder, because the reference named the control with one.
    expect(htmls[0]).toContain('placeholder="Your email"')

    // L1's half: the class, and every paint and geometry axis behind it.
    expect(htmls[0]).toMatch(/class="cf-l1-\d+"/)
    expect(css).toContain('color: #0f172b')
    expect(css).toContain('border: 1px solid #334155')
    expect(css).toContain('height: 50px')
    // A control arrives with UA chrome that would paint THROUGH an L1 subtree
    // which simply declined to set those axes, so the sole emitter neutralises it.
    expect(css).toMatch(/appearance: none/)
    // A placeholder is painted by a pseudo-element that does not inherit `color`,
    // so it is re-pointed at the element's own — otherwise the reference's
    // placeholder-labelled field keeps the browser's grey inside the box.
    expect(css).toMatch(/::placeholder/)
  })

  it('test_UAT_FC_REQ-96_an_unbound_control_degrades_inertly', () => {
    // Isolation (DOC-25 §6): a control naming an element no mounted module
    // declares renders NOTHING. A bare `<input>` would paint UA chrome into the
    // page and collect a field that nothing submits.
    const { htmls } = renderL1Fragment([{ kind: 'control', control: 'nope' }], 'cf', {})
    expect(htmls[0]).toBe('')
  })

  // ── 3. The safety envelope stayed construction-time ────────────────────────

  it('test_UAT_FC_REQ-96_a_control_can_never_carry_class_style_or_a_handler', () => {
    // The inversion must not degrade the envelope from "true by construction" to
    // "hopefully validated" (DOC-25 §10.4). `class` and `style` are L1's — a
    // module setting either would hand presentation back to the module, which is
    // the whole point of this change — and an `on*` attribute is a script sink.
    const hostile: Record<string, L1ControlElement> = {
      x: {
        tag: 'input',
        attrs: {
          class: 'module-owned',
          style: 'background:red',
          onfocus: 'alert(1)',
          'x on': 'weird',
          name: 'ok',
        },
      },
    }
    const { htmls } = renderL1Fragment([{ kind: 'control', control: 'x' }], 'cf', hostile)
    expect(htmls[0]).not.toContain('module-owned')
    expect(htmls[0]).not.toContain('background:red')
    expect(htmls[0]).not.toContain('alert(1)')
    expect(htmls[0]).not.toContain('weird')
    // The legitimate behavioural attribute still lands, and L1's class is the
    // only class on the element.
    expect(htmls[0]).toContain('name="ok"')
    expect(htmls[0]!.match(/class="/g)?.length).toBe(1)
  })

  it('test_UAT_FC_REQ-96_a_control_escapes_its_attribute_and_text_values', () => {
    const { htmls } = renderL1Fragment([{ kind: 'control', control: 'b' }], 'cf', {
      b: { tag: 'button', attrs: { type: 'submit', name: '"><script>alert(1)</script>' }, text: '<img onerror=x>' },
    })
    expect(htmls[0]).not.toContain('<script>')
    expect(htmls[0]).not.toContain('<img')
    expect(htmls[0]).toContain('&lt;')
  })

  it('test_UAT_FC_REQ-96_the_module_still_authors_the_label_association', () => {
    // A control's *visible* words are the reference's business (a run beside it,
    // or a placeholder inside it). The programmatic label is not: it is the
    // accessible name, an obligation, and it is authored by the module — the
    // control's `id` and the `<label for>` are generated from one function.
    const controls = contactFormControls(
      [{ name: 'msg', label: 'Your message', labelMode: 'placeholder', type: 'textarea', required: false }],
      'Send',
    )
    expect(controls.msg.tag).toBe('textarea')
    expect(controls.msg.attrs?.id).toBe('cf-msg')
    const { htmls } = renderL1Fragment([{ kind: 'control', control: 'msg' }], 'cf', controls)
    // A textarea is not void — it must close, or the rest of the form is swallowed.
    expect(htmls[0]).toMatch(/<textarea [^>]*><\/textarea>/)
  })

  it('test_UAT_FC_REQ-96_control_nodes_stay_inside_the_l1_envelope', () => {
    // A control is a styled leaf, so it takes the same bounds a text run does —
    // it is not a hole in the envelope's numeric ranges.
    const doc = {
      widths: [1280],
      root: {
        kind: 'container' as const,
        layout: 'stack' as const,
        children: [{ kind: 'control' as const, control: 'x', axes: { fontSizePx: 9000 } }],
      },
    }
    expect(validateL1(doc).ok).toBe(false)
    // …and a well-formed one parses as an ordinary L1 node.
    expect(l1NodeSchema.safeParse({ kind: 'control', control: 'x', axes: { fontSizePx: 16 } }).success).toBe(true)
    // Freeform keys are still refused — no route back to raw CSS through a control.
    expect(l1NodeSchema.safeParse({ kind: 'control', control: 'x', css: 'color:red' }).success).toBe(false)
  })

  // ── 4. The value gate no longer pairs against invariant elements ───────────

  it('test_UAT_AC818_capture_skips_module_invariant_elements', () => {
    // The honeypot, the visually-hidden label and the Turnstile mount exist only
    // on OUR side of a reproduction. Pairing against them slides the whole control
    // queue, so every field mispairs against its neighbour — 15 repro-only objects
    // turned all 26 reported gigabytealchemy deltas unreadable.
    const fields = extractFields(`
      <section style="background:#ffffff">
        <form>
          <label class="contact-form__label" data-fc-invariant for="cf-email">Your email</label>
          <input id="cf-email" name="email" type="email" placeholder="Your email" />
          <div class="contact-form__honeypot" data-fc-invariant aria-hidden="true">
            <label for="cf-hp">Leave this field empty</label>
            <input id="cf-hp" name="hp_company_url" type="text" />
          </div>
        </form>
      </section>`)

    // Exactly one control survives: the real one.
    expect(fields.length).toBe(1)
    expect(fields[0].controlType).toBe('email')

    // And the invariant label did not source its NAME either. Reading the a11y
    // association off it would report 'label' for a control the reference labels
    // with a placeholder INSIDE the box — a permanent delta manufactured by the
    // module honouring an obligation it cannot decline.
    expect(fields[0].nameSource).toBe('placeholder')
    expect(fields[0].accessibleName).toBe('Your email')
  })

  // ── 5. The gigabytealchemy deltas the ticket names actually close ──────────

  it.skipIf(!HAVE_GA_ORACLE)('test_UAT_FC_REQ-96_gigabyte_fields_reproduce_the_measured_height_not_a_stylesheet_default', () => {
    // The ticket's first two deltas. The module's stylesheet decided a field was
    // `padding: var(--space-3)` tall — 44px, and 116px for the textarea — against
    // a reference the capture had already measured at 50px and 146px. The numbers
    // are no longer the module's to choose: each control carries the measured box.
    const forms = foldGigabyte()
    const message = forms.flatMap((f) => [...controlsOf(f)]).find(([name]) => name === 'your-message')![1]
    const name = forms.flatMap((f) => [...controlsOf(f)]).find(([n]) => n === 'your-name')![1]

    const at = (c: typeof name, width: number) => c.geometry!.keyframes.find((k) => k.at === width)!
    expect(at(name, 1280).height).toBe(oracleBox(1280, 'Your name').height)
    expect(at(message, 1280).height).toBe(oracleBox(1280, 'Your message').height)
    // Pinned, not coincidental: the reference's single-line field is 50px and its
    // textarea is 146px — neither is any multiple of the deleted 44px default.
    expect(at(name, 1280).height).toBe(50)
    expect(at(message, 1280).height).toBe(146)
  })

  it.skipIf(!HAVE_GA_ORACLE)('test_UAT_FC_REQ-96_gigabyte_submit_recovers_its_per_width_position', () => {
    // The ticket's third delta, and the regression REQ-88 knowingly accepted.
    // Under the slot-only model the captured chip's page-absolute geometry had to
    // be DROPPED (it would have resolved against the slot's origin), so the module
    // placed the button itself and "inline vs stacked" became a concept the
    // framework had no way to express. Rebased to the form's seam, it is just a
    // number the capture already had.
    const subscribe = foldGigabyte().find((f) => f.submitLabel === 'Subscribe')!
    const controls = controlsOf(subscribe)
    const field = controls.get('your-email-address')!
    const submit = controls.get('submit')!
    const at = (c: typeof field, width: number) => c.geometry!.keyframes.find((k) => k.at === width)!

    for (const width of [768, 1024, 1280, 1440]) {
      const f = at(field, width)
      const s = at(submit, width)
      // Inline, right of its field — not stacked below it. Both halves matter:
      // the same row, and starting after the field ends.
      expect(s.y, `submit y at ${width}`).toBe(f.y)
      expect(s.x, `submit x at ${width}`).toBeGreaterThanOrEqual(f.x + f.width)
    }
    // …and genuinely per-width, not one arrangement applied everywhere: the
    // reference stacks the button below the field on a phone, and so do we.
    for (const width of [320, 375]) {
      const f = at(field, width)
      const s = at(submit, width)
      expect(s.y, `submit y at ${width}`).toBeGreaterThanOrEqual(f.y + f.height)
      expect(s.x, `submit x at ${width}`).toBe(f.x)
    }

    // And the position is the ORACLE's, to the pixel — the seam-relative
    // keyframes resolve back to exactly where the reference painted the button.
    for (const width of [768, 1024, 1280, 1440]) {
      const ref = oracleBox(width, 'Subscribe')
      const refField = oracleBox(width, 'Your email address')
      expect(at(submit, width).x - at(field, width).x, `submit offset at ${width}`).toBe(
        Math.round(ref.x - refField.x),
      )
      expect(at(submit, width).width, `submit width at ${width}`).toBe(Math.round(ref.width))
    }
  })

  // ── 6. The relocated default look ─────────────────────────────────────────

  it('test_UAT_FC_REQ-96_the_l2_preset_gives_an_uncaptured_form_a_look', () => {
    // Deleting the stylesheet has a real cost: a form authored with no capture to
    // transcribe would have no look at all. It is RELOCATED, not deleted — to an
    // L2 preset, so the default becomes a starting point instead of a ceiling.
    const preset = contactFormPreset([
      { name: 'email', label: 'Your email', labelMode: 'placeholder', type: 'email' },
      { name: 'message', label: 'Message', type: 'textarea' },
    ])

    // It is ordinary L1 — an author edits, replaces or ignores it like any subtree.
    expect(l1NodeSchema.safeParse(preset).success).toBe(true)
    expect(validateL1({ widths: [1280], root: preset }).ok).toBe(true)

    const controls = contactFormControls(
      [
        { name: 'email', label: 'Your email', labelMode: 'placeholder', type: 'email', required: false },
        { name: 'message', label: 'Message', labelMode: 'visible', type: 'textarea', required: false },
      ],
      'Send',
    )
    const { htmls, css } = renderL1Fragment([preset], 'cf', controls)
    // Every declared control is bound, and the button's fill comes from the
    // preset's L1 axes — not from a module rule.
    expect(htmls[0]).toContain('name="email"')
    expect(htmls[0]).toContain('name="message"')
    expect(htmls[0]).toContain('type="submit"')
    expect(css).toContain('background-color: #0f172b')
    // A visibly-labelled field still gets its words as an L1 run beside the box;
    // a placeholder-labelled one does not (the module puts them inside it).
    expect(htmls[0]).toContain('Message')
    expect(htmls[0]).not.toMatch(/<p[^>]*>Your email<\/p>/)
  })
})
