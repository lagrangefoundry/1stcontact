/**
 * REQ-88 — the reproduced contact form must be **formatted and located** the way
 * the reference is.
 *
 * Mounting behaviour into an L1 page (REQ-93) put real controls on the page, but
 * two things about the reference were still being overridden by the module's own
 * defaults, and both were visible:
 *
 *  1. **Labelling.** The reference names its controls with a *placeholder*; the
 *     module rendered a visible `<label>` row above every field regardless. That
 *     is not only the wrong look — each label row pushes the field below it down,
 *     so the whole form drifts progressively (measured +25 / +44 / +63px down the
 *     reference's three fields). The a11y tree's `nameSource` is the only witness
 *     to the difference, since in both cases the pixels are just text near a box.
 *
 *  2. **The submit button.** A captured button carries text, so the fold's
 *     text-leaf branch claims it before the control branch sees it — leaving the
 *     reference's chip as a page-level run *beside* a form that renders its own
 *     default button. Two buttons; one of them inert.
 *
 * These UATs pin the fold-side derivation and the module-side rendering for both.
 */
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { latestModuleVersion } from '../packages/framework/src/index'
import { foldToL1, foldedFormFor } from '../tools/generate/src/l1'
import type { ControlRow, FoldedForm } from '../tools/generate/src/l1'
import { serveOneModulePage } from '../tools/generate/src/conformance'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** A captured text-free control, named by the a11y tree. */
function control(over: Partial<ValueElement> & { box: ValueElement['box'] }): ValueElement {
  return {
    text: '',
    role: 'field',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    ...over,
  }
}

/** A captured submit affordance: a painted run the a11y tree calls a button. */
function buttonEl(text: string, box: NonNullable<ValueElement['box']>): ValueElement {
  return {
    text,
    role: 'button',
    color: '#ffffff',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 500,
    a11yRole: 'button',
    surfaceFill: '#0f172b',
    borderRadiusPx: 8,
    // An authored vertical inset is what marks a run as painting its own surface
    // (BUG-21) — a real button's border box already spans its pill, so the chip
    // axes ride on the text leaf rather than on an inferred card behind it.
    paddingTopPx: 12,
    paddingBottomPx: 12,
    paddingLeftPx: 24,
    paddingRightPx: 24,
    box,
  }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `req88form@${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height: 900 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/**
 * A form with a submit button just below it, plus an unrelated page button far
 * away — the discriminating pair. The gaps mirror the reference's own scale: the
 * form's button sits 18px under its fields against a 75px threshold, while the
 * unrelated one is an order of magnitude further off.
 */
function formWithSubmitCapture(): MultiStateCapture {
  return multiFrom(() => [
    control({ accessibleName: 'Your name', nameSource: 'placeholder', box: { x: 20, y: 900, width: 400, height: 50 } }),
    control({ accessibleName: 'Your email', nameSource: 'placeholder', box: { x: 20, y: 966, width: 400, height: 50 } }),
    control({ accessibleName: 'Your message', nameSource: 'placeholder', box: { x: 20, y: 1032, width: 400, height: 150 } }),
    buttonEl('Send message', { x: 20, y: 1200, width: 170, height: 48 }),
    // An unrelated call-to-action elsewhere on the page — never a form control.
    buttonEl('Read the docs', { x: 20, y: 2000, width: 150, height: 48 }),
  ])
}

function foldFixture(capture: MultiStateCapture): { doc: ReturnType<typeof foldToL1>; forms: FoldedForm[] } {
  const forms: FoldedForm[] = []
  const doc = foldToL1(capture, { forms })
  return { doc, forms }
}

function textsOf(doc: ReturnType<typeof foldToL1>): string[] {
  const out: string[] = []
  const walk = (n: { kind: string; text?: string; children?: unknown[] }): void => {
    if (n.kind === 'text' && n.text) out.push(n.text)
    for (const c of (n.children ?? []) as typeof n[]) walk(c)
  }
  walk(doc.root as never)
  return out
}

describe('REQ-88 — reproduced form labelling and submit binding', () => {
  // ── 1. Labelling follows the reference, not the module's default ───────────

  it('test_UAT_FC_REQ-88_a_placeholder_named_control_folds_to_placeholder_labelling', () => {
    const placeholder = foldedFormFor('form-0', [
      {
        samples: [
          {
            at: 1280,
            element: control({
              accessibleName: 'Your email',
              nameSource: 'placeholder',
              controlType: 'email',
              box: { x: 0, y: 0, width: 200, height: 50 },
            }),
            box: { x: 0, y: 0, width: 200, height: 50 },
          },
        ],
      },
    ] as ControlRow[])
    expect(placeholder.fields[0].labelMode).toBe('placeholder')

    // A control the reference labelled with a real <label> keeps the visible row —
    // the axis reports what was captured, it does not prefer one answer.
    const labelled = foldedFormFor('form-0', [
      {
        samples: [
          {
            at: 1280,
            element: control({
              accessibleName: 'Your email',
              nameSource: 'label',
              controlType: 'email',
              box: { x: 0, y: 0, width: 200, height: 50 },
            }),
            box: { x: 0, y: 0, width: 200, height: 50 },
          },
        ],
      },
    ] as ControlRow[])
    expect(labelled.fields[0].labelMode).toBe('visible')
  })

  it('test_UAT_FC_REQ-88_placeholder_labelling_renders_inside_the_box_and_stays_accessible', async () => {
    const served = await serveOneModulePage(
      'contact-form',
      {
        label: 'placeholder-labelled',
        props: {
          version: latestModuleVersion('contact-form'),
          config: {
            action: '/leads',
            fields: [{ name: 'email', label: 'Your email', type: 'email', labelMode: 'placeholder' }],
          },
        },
      },
      { mountInL1: true },
    )
    try {
      const html = readFileSync(path.join(served.handle.rootDir, 'index.html'), 'utf8')
      // The words appear INSIDE the control…
      expect(html).toMatch(/<input[^>]*placeholder="Your email"/)
      // …and the <label> survives, programmatically associated but out of flow.
      // The a11y obligation is not traded away for the reference's look.
      expect(html).toMatch(/<label[^>]*for="cf-email"[^>]*class="[^"]*visually-hidden/)
      expect(html).toContain('>Your email</label>')
    } finally {
      await served.dispose()
    }
  })

  // ── 2. The reference's own button becomes the form's button ────────────────

  it('test_UAT_FC_REQ-88_a_button_beside_a_form_becomes_that_forms_submit_slot', () => {
    const { forms } = foldFixture(formWithSubmitCapture())
    expect(forms).toHaveLength(1)
    const submit = forms[0].submit as { kind: string; text?: string; axes?: Record<string, unknown> } | undefined
    expect(submit?.text).toBe('Send message')
    // Its LOOK travels with it — the chip's fill and rounding are what make the
    // mounted button the reference's button rather than the module's default.
    expect(submit?.axes?.surfaceFill).toBe('#0f172b')
    expect(submit?.axes?.borderRadiusPx).toBe(8)
  })

  it('test_UAT_FC_REQ-88_a_claimed_submit_leaves_the_page_body_exactly_once', () => {
    const { doc, forms } = foldFixture(formWithSubmitCapture())
    const texts = textsOf(doc)
    // Claimed: it is the form's control now, so it must not ALSO paint as a
    // page-level run — that is the duplicate button the reference never had.
    expect(texts).not.toContain('Send message')
    expect(forms[0].submit).toBeDefined()
  })

  it('test_UAT_FC_REQ-88_an_unrelated_page_button_is_never_claimed_by_a_form', () => {
    const { doc, forms } = foldFixture(formWithSubmitCapture())
    // The far-off call-to-action is not a form control and stays in the body.
    expect(textsOf(doc)).toContain('Read the docs')
    expect(JSON.stringify(forms)).not.toContain('Read the docs')
  })

  it('test_UAT_FC_REQ-88_the_form_seam_grows_to_hold_its_claimed_button', () => {
    const { doc } = foldFixture(formWithSubmitCapture())
    const children = (doc.root as { children?: Array<{ kind: string; geometry?: { keyframes: Array<{ y: number; height?: number }> } }> }).children ?? []
    const slot = children.find((n) => n.kind === 'slot')
    const kf = slot?.geometry?.keyframes.find(() => true)
    // Fields span y 900..1182 and the button ends at 1248: a seam stopping at the
    // last field would render the mounted button outside its own slot.
    expect(kf).toBeDefined()
    expect((kf!.y ?? 0) + (kf!.height ?? 0)).toBeGreaterThanOrEqual(1248)
  })

  it('test_UAT_FC_REQ-88_the_real_capture_derives_placeholder_labels_and_both_submit_buttons', () => {
    const bundle = path.join('storage', 'references', 'gigabytealchemy.ai', 'index', 'multistate.json')
    if (!existsSync(bundle)) return // the retained capture is gitignored third-party material
    const multi = JSON.parse(readFileSync(bundle, 'utf8')) as MultiStateCapture
    const forms: FoldedForm[] = []
    const doc = foldToL1(multi, { forms })

    // The reference names every one of its controls with a placeholder — which is
    // exactly why a visible label row above each field was both the wrong look and
    // the source of the progressive downward drift.
    const fields = forms.flatMap((f) => f.fields)
    expect(fields.length).toBeGreaterThan(0)
    expect(fields.every((f) => f.labelMode === 'placeholder')).toBe(true)

    // Both of the page's forms get their own button, matched to the right form —
    // the two sit 128px and 263px from the *other* form's fields, so this also
    // proves the proximity rule separates them rather than grabbing the nearest.
    const submits = forms.map((f) => f.submit as { text?: string } | undefined)
    expect(submits.map((s) => s?.text).sort()).toEqual(['Send message', 'Subscribe'])

    // Neither remains in the page body: one reference button, one rendered button.
    const texts = textsOf(doc)
    expect(texts).not.toContain('Send message')
    expect(texts).not.toContain('Subscribe')
  })

  it('test_UAT_FC_REQ-88_a_bound_submit_slot_replaces_the_modules_default_button', async () => {
    const served = await serveOneModulePage(
      'contact-form',
      {
        label: 'submit-slot-bound',
        props: {
          version: latestModuleVersion('contact-form'),
          config: { action: '/leads', fields: [{ name: 'email', label: 'Your email', type: 'email' }] },
          slots: {
            submit: {
              kind: 'text',
              text: 'Send message',
              axes: { color: '#ffffff', surfaceFill: '#0f172b', borderRadiusPx: 8 },
            },
          },
        },
      },
      { mountInL1: true },
    )
    try {
      const html = readFileSync(path.join(served.handle.rootDir, 'index.html'), 'utf8')
      expect(html).toContain('Send message')
      // The module's placeholder label is gone — one button, not two.
      expect(html).not.toMatch(/<button[^>]*>\s*Send\s*<\/button>/)
      // …and the module surrenders its own paint so the authored chip is not
      // nested inside a second, differently-coloured button.
      expect(html).toContain('contact-form__submit--l1')
    } finally {
      await served.dispose()
    }
  })
})
