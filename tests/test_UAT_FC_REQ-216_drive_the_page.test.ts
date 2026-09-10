/**
 * REQ-216 UATs — "The AI must be able to drive the page before it photographs it".
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The page is the real one: the sign-in shape
 * the ticket describes, put through the shipped L1 renderer, with the vetted
 * modal script the renderer emits and nothing stubbed. The interaction script is
 * the shipped one, run in page scope. The picture resolution, the refusals and
 * the declaration are all production code.
 *
 * ONE THING IS A DOUBLE: the browser, which is the seam `BrowserDriver` exists
 * to have injected. It is jsdom rather than a stub — it implements focus,
 * events, `getComputedStyle` and attribute state, which is the whole of what
 * both scripts touch — so "the trigger opens the panel" is observed rather than
 * asserted about markup.
 *
 * THE LOAD-BEARING OBSERVATION is `htmlAtShutter`: the double records the
 * document as it stood at the moment `screenshot()` was called. A picture taken
 * of the closed page while reporting a step succeeded is the exact failure this
 * ticket exists to make impossible, and no assertion about the step's return
 * value would catch it.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import {
  PageInteractionError,
  PageStepSyntaxError,
  drivePage,
  pageStepScript,
  parsePageStep,
  parsePageSteps,
} from '../tools/generate/src/cli/capture/interact'
import type { StepOutcome } from '../tools/generate/src/cli/capture/interact'
import {
  EDIT_CHANNEL_NOTE,
  PictureSourceError,
  resolvePicture,
} from '../tools/generate/src/cli/picture'
import type { PictureDeps, PictureSource } from '../tools/generate/src/cli/picture'
import { FIDELITY_DECLARATION, fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock, FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { L1_DECLARATION, L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { encodePng } from '../tools/generate/src/cli/png'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'

const WIDTHS = [320, 768, 1440]
const ORIGIN = 'https://app.test'
const SLUG = 'driven'

/** The sign-in shape the ticket describes: a trigger, a panel, a way out. */
const signInPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'signin-link', text: 'Sign in', action: { opens: 'signin-panel' } },
    { kind: 'text', id: 'inert-word', text: 'About us' },
    {
      kind: 'container',
      id: 'signin-panel',
      layout: 'stack',
      dialog: { backdrop: { color: '#000000', opacity: 0.5 }, ariaLabel: 'Sign in' },
      axes: { surfaceFill: '#ffffff', borderRadiusPx: 12 },
      children: [
        { kind: 'text', text: 'Please enter your email address' },
        { kind: 'text', id: 'signin-close', text: 'Close', action: { closes: 'signin-panel' } },
      ],
    },
  ],
})

/** Two controls that carry the same name — the case that must not be guessed. */
const twoSignIns = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'a', text: 'Sign in', link: { href: '/a' } },
    { kind: 'text', id: 'b', text: 'Sign in', link: { href: '/b' } },
  ],
})

const documentOf = (root: L1Node): L1Document => ({ widths: WIDTHS, root })

/** The published page as a browser sees it, scripts and all. */
function pageHtml(root: L1Node): string {
  const { html, css, js } = renderL1Document(documentOf(root))
  return (
    `<!doctype html><html><head><style>${css}</style></head>` +
    `<body>${html}${js ? `<script>${js}</script>` : ''}</body></html>`
  )
}

/** A plain page, for the field matching a rendered L1 tree has no leaf for. */
const FORM_HTML = `<!doctype html><html><body>
<form>
  <label for="e">Email address</label><input id="e" name="email" type="email">
  <label for="n">Your name</label><input id="n" name="name" type="text">
  <label for="c">Country</label><select id="c"><option value="uk">United Kingdom</option></select>
  <button type="button">Send</button>
</form></body></html>`

/** Build a live page and let its inline scripts wire themselves. */
async function live(html: string): Promise<JSDOM> {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: `${ORIGIN}/preview/${SLUG}/draft/` })
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0))
  return dom
}

/** Run one phrase against a live page, exactly as a driver would. */
async function step(dom: JSDOM, phrase: string): Promise<StepOutcome> {
  return (await dom.window.eval(pageStepScript(parsePageStep(phrase)))) as StepOutcome
}

// ── the double ───────────────────────────────────────────────────────────────

/**
 * A driver backed by jsdom, which records the document as it stood when the
 * shutter opened.
 */
class JsdomDriver implements BrowserDriver {
  /** Which panels stood open when the shutter opened; `null` before any shot. */
  static shutterOpenPanels: string[] | null = null
  static navigated: { url: string; viewport?: Viewport }[] = []
  private dom: JSDOM | null = null
  constructor(private readonly html: string) {}
  async navigate(url: string, viewport?: Viewport): Promise<void> {
    JsdomDriver.navigated.push({ url, viewport })
    this.dom = await live(this.html)
  }
  async query<T>(script: string): Promise<T> {
    return (await this.dom!.window.eval(script)) as T
  }
  async screenshot(_viewport?: Viewport): Promise<Uint8Array> {
    // Read off the ELEMENTS rather than the markup: the modal script's own
    // source names the attribute, so a substring test on the HTML would pass
    // for a page whose panel is firmly shut.
    JsdomDriver.shutterOpenPanels = [
      ...this.dom!.window.document.querySelectorAll('[data-l1-dialog][data-l1-open]'),
    ].map((el) => el.getAttribute('data-l1-dialog')!)
    return encodePng({ data: new Uint8Array(8 * 8 * 3), width: 8, height: 8, channels: 3 })
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return this.dom!.window.document.documentElement.outerHTML
  }
  async close(): Promise<void> {
    this.dom?.window.close()
    this.dom = null
  }
}

/** Picture dependencies with only the browser doubled. */
function deps(html: string, onLease?: () => void): PictureDeps {
  return {
    slug: SLUG,
    origin: ORIGIN,
    references: memoryReferenceStore(),
    driverFactory: async () => {
      onLease?.()
      return new JsdomDriver(html)
    },
  }
}

const shoot = (source: PictureSource, html = pageHtml(signInPage())) =>
  resolvePicture(source, deps(html))

// ── the two forms ────────────────────────────────────────────────────────────

describe('REQ-216 — naming what to do, the way a person would', () => {
  it('test_UAT_FC_REQ-216_the_two_forms_are_read_as_written', () => {
    expect(parsePageStep('click "Sign in"')).toMatchObject({ verb: 'click', name: 'Sign in' })
    expect(parsePageStep('click Sign in')).toMatchObject({ verb: 'click', name: 'Sign in' })
    expect(parsePageStep('fill "Email" with "a@b.test"')).toMatchObject({
      verb: 'fill',
      name: 'Email',
      value: 'a@b.test',
    })
    expect(parsePageStep('fill Email with a@b.test')).toMatchObject({
      verb: 'fill',
      name: 'Email',
      value: 'a@b.test',
    })
  })

  it('test_UAT_FC_REQ-216_a_quoted_name_may_contain_the_word_with', () => {
    // The one ambiguity the grammar has, and the reason quoting is offered.
    expect(parsePageStep('fill "Get in touch with us" with "hello"')).toMatchObject({
      name: 'Get in touch with us',
      value: 'hello',
    })
  })

  it('test_UAT_FC_REQ-216_the_steps_keep_the_order_they_were_written_in', () => {
    const steps = parsePageSteps(['click "Sign in"', 'click "Close"'])
    expect(steps.map((s) => s.name)).toEqual(['Sign in', 'Close'])
  })

  it('test_UAT_FC_REQ-216_anything_that_is_not_one_of_the_two_forms_is_refused', () => {
    // And the refusal says what the two forms ARE — a refusal that only says
    // "no" costs the turn it took and buys nothing.
    expect(() => parsePageStep('scroll to the footer')).toThrow(PageStepSyntaxError)
    expect(() => parsePageStep('scroll to the footer')).toThrow(/click "Sign in"/)
    expect(() => parsePageStep('scroll to the footer')).toThrow(/fill "Email" with/)
    expect(() => parsePageStep('fill "Email"')).toThrow(/does not say what to fill it with/)
    expect(() => parsePageStep('click ""')).toThrow(/names nothing to click/)
  })
})

// ── driving the page the ticket describes ────────────────────────────────────

describe('REQ-216 — the state a visitor reaches by doing something', () => {
  const isOpen = (dom: JSDOM): boolean =>
    dom.window.document
      .querySelector('[data-l1-dialog="signin-panel"]')!
      .hasAttribute('data-l1-open')

  it('test_UAT_FC_REQ-216_activating_the_named_control_opens_the_panel', async () => {
    const dom = await live(pageHtml(signInPage()))
    expect(isOpen(dom)).toBe(false)

    const outcome = await step(dom, 'click "Sign in"')

    expect(outcome.ok).toBe(true)
    expect(outcome.matched).toBe('sign in')
    // The real thing, opened the real way: the vetted modal script did this,
    // not the interaction script.
    expect(isOpen(dom)).toBe(true)
  })

  it('test_UAT_FC_REQ-216_a_control_inside_a_closed_panel_is_not_reachable_yet', async () => {
    const dom = await live(pageHtml(signInPage()))

    const outcome = await step(dom, 'click "Close"')

    expect(outcome.ok).toBe(false)
    expect(outcome.reason).toBe('not-visible')
    expect(outcome.detail).toMatch(/not visible right now/)
    expect(isOpen(dom)).toBe(false)
  })

  it('test_UAT_FC_REQ-216_steps_are_carried_out_in_the_order_they_were_given', async () => {
    const dom = await live(pageHtml(signInPage()))

    expect((await step(dom, 'click "Sign in"')).ok).toBe(true)
    expect(isOpen(dom)).toBe(true)
    // Reachable only now — which is why order is part of the vocabulary.
    expect((await step(dom, 'click "Close"')).ok).toBe(true)
    expect(isOpen(dom)).toBe(false)
  })

  it('test_UAT_FC_REQ-216_a_name_nothing_carries_is_refused_and_the_page_says_what_is_there', async () => {
    const dom = await live(pageHtml(signInPage()))

    const outcome = await step(dom, 'click "Log in"')

    expect(outcome.ok).toBe(false)
    expect(outcome.reason).toBe('no-match')
    expect(outcome.detail).toMatch(/nothing on the page is called 'Log in'/)
    // Naming what IS there is what makes the next attempt cheaper than a guess.
    expect(outcome.detail).toMatch(/'sign in'/)
  })

  it('test_UAT_FC_REQ-216_a_name_several_things_carry_is_refused_rather_than_guessed', async () => {
    const dom = await live(pageHtml(twoSignIns()))

    const outcome = await step(dom, 'click "Sign in"')

    expect(outcome.ok).toBe(false)
    expect(outcome.reason).toBe('ambiguous')
    expect(outcome.detail).toMatch(/2 things match/)
  })

  it('test_UAT_FC_REQ-216_an_interaction_that_changed_nothing_is_refused', async () => {
    // The picture must remain evidence: a click that moved nothing would
    // otherwise photograph the untouched page as though it were the state
    // that was asked for.
    const dom = await live(FORM_HTML)

    const outcome = await step(dom, 'click "Send"')

    expect(outcome.ok).toBe(false)
    expect(outcome.reason).toBe('inert')
    expect(outcome.detail).toMatch(/changed nothing on the page/)
  })

  it('test_UAT_FC_REQ-216_a_field_is_named_by_its_label_and_takes_the_value', async () => {
    const dom = await live(FORM_HTML)

    const outcome = await step(dom, 'fill "Email address" with "someone@example.com"')

    expect(outcome.ok).toBe(true)
    const field = dom.window.document.getElementById('e') as HTMLInputElement
    expect(field.value).toBe('someone@example.com')
  })

  it('test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it', async () => {
    const dom = await live(FORM_HTML)

    const outcome = await step(dom, 'fill "Country" with "United Kingdom"')

    expect(outcome.ok).toBe(true)
    expect((dom.window.document.getElementById('c') as HTMLSelectElement).value).toBe('uk')
  })

  it('test_UAT_FC_REQ-216_a_value_a_field_cannot_hold_is_refused', async () => {
    const dom = await live(FORM_HTML)

    const outcome = await step(dom, 'fill "Country" with "Atlantis"')

    expect(outcome.ok).toBe(false)
    expect(outcome.detail).toMatch(/no choice called 'Atlantis'/)
    expect((dom.window.document.getElementById('c') as HTMLSelectElement).value).toBe('uk')
  })

  it('test_UAT_FC_REQ-216_a_field_nothing_is_called_is_refused_by_name', async () => {
    const dom = await live(FORM_HTML)

    const outcome = await step(dom, 'fill "Telephone" with "0117"')

    expect(outcome.ok).toBe(false)
    expect(outcome.reason).toBe('no-match')
    expect(outcome.detail).toMatch(/nothing on the page is called 'Telephone'/)
  })

  it('test_UAT_FC_REQ-216_the_first_failure_stops_the_run', async () => {
    // Carrying on past a failure would produce a second refusal about the state
    // the first failure prevented, which reads as two problems and is one.
    const dom = await live(pageHtml(signInPage()))
    const driver = {
      query: <T,>(script: string) => dom.window.eval(script) as Promise<T>,
    } as unknown as BrowserDriver

    await expect(
      drivePage(driver, parsePageSteps(['click "Close"', 'click "Sign in"'])),
    ).rejects.toThrow(PageInteractionError)
    expect(isOpen(dom)).toBe(false)
  })
})

// ── the picture is of the driven state ───────────────────────────────────────

describe('REQ-216 — the shutter opens on the state that was asked for', () => {
  it('test_UAT_FC_REQ-216_the_picture_is_taken_after_the_steps_have_happened', async () => {
    JsdomDriver.shutterOpenPanels = null
    JsdomDriver.navigated = []

    const picture = await shoot({ kind: 'draft', after: ['click "Sign in"'] })

    // The strong observation: the panel stood OPEN when the shutter opened.
    expect(JsdomDriver.shutterOpenPanels).toEqual(['signin-panel'])
    // And the picture says what was done to get there, so a transcript that
    // shows two pictures of one page says which is which.
    expect(picture.label).toContain('click "Sign in"')
    expect(picture.bytes.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-216_an_undriven_picture_is_of_the_page_as_it_arrives', async () => {
    JsdomDriver.shutterOpenPanels = null

    const picture = await shoot({ kind: 'draft' })

    expect(JsdomDriver.shutterOpenPanels).toEqual([])
    expect(picture.label).not.toContain('after')
  })

  it('test_UAT_FC_REQ-216_a_driven_page_is_laid_out_at_the_width_it_is_driven_at', async () => {
    // A control that only exists below 768px cannot be clicked on a page laid
    // out at 1280, so a driven shot loads at its own width.
    JsdomDriver.navigated = []
    await shoot({ kind: 'draft', viewport: 'mobile', after: ['click "Sign in"'] })
    expect(JsdomDriver.navigated[0].viewport).toEqual({ width: 375, height: 667 })

    JsdomDriver.navigated = []
    await shoot({ kind: 'draft', viewport: 'mobile' })
    expect(JsdomDriver.navigated[0].viewport).toBeUndefined()
  })

  it('test_UAT_FC_REQ-216_a_step_that_could_not_be_done_yields_no_picture_at_all', async () => {
    JsdomDriver.shutterOpenPanels = null

    const refusal = shoot({ kind: 'draft', after: ['click "Log in"'] })

    await expect(refusal).rejects.toThrow(PageInteractionError)
    await expect(refusal).rejects.toThrow(/nothing on the page is called 'Log in'/)
    // No shutter opened at all — a picture of the wrong state is what this
    // prevents, and a picture of the right state taken anyway would be luck.
    expect(JsdomDriver.shutterOpenPanels).toBeNull()
  })

  it('test_UAT_FC_REQ-216_a_refusal_carries_the_declared_code', async () => {
    // So the surface's own error taxonomy renders it, rather than the model
    // reading a raw exception.
    const error = await shoot({ kind: 'draft', after: ['click "Log in"'] }).catch((e) => e)
    expect((error as { code?: string }).code).toBe('INTERACTION_FAILED')
    expect((FIDELITY_DECLARATION.errors as Record<string, unknown>).INTERACTION_FAILED).toBeTruthy()
  })
})

// ── what cannot be driven, and why ───────────────────────────────────────────

describe('REQ-216 — only your own draft can be driven', () => {
  const kinds: PictureSource[] = [
    { kind: 'edit', after: ['click "Sign in"'] },
    { kind: 'reference', bundle: 'anything', after: ['click "Sign in"'] },
    { kind: 'revision', revision: 3, after: ['click "Sign in"'] },
    { kind: 'url', url: 'https://example.test/', after: ['click "Sign in"'] },
  ]

  for (const source of kinds) {
    it(`test_UAT_FC_REQ-216_a_${source.kind}_picture_refuses_to_be_driven`, async () => {
      let leased = false
      const refusal = resolvePicture(source, deps(pageHtml(signInPage()), () => (leased = true)))
      await expect(refusal).rejects.toThrow(PictureSourceError)
      await expect(refusal).rejects.toThrow(/only a 'draft' picture can be driven/)
      // Refused before a browser is leased: an obviously bad ask should not
      // cost a metered session.
      expect(leased).toBe(false)
    })
  }

  it('test_UAT_FC_REQ-216_the_edit_refusal_says_why_that_channel_cannot_be_driven', async () => {
    await expect(
      shoot({ kind: 'edit', after: ['click "Sign in"'] }),
    ).rejects.toThrow(/ships no behaviour/)
  })

  it('test_UAT_FC_REQ-216_a_phrase_that_cannot_be_read_is_refused_before_a_browser', async () => {
    let leased = false
    const refusal = resolvePicture(
      { kind: 'draft', after: ['scroll to the footer'] },
      deps(pageHtml(signInPage()), () => (leased = true)),
    )
    await expect(refusal).rejects.toThrow(PictureSourceError)
    expect(leased).toBe(false)
  })
})

// ── the caption ──────────────────────────────────────────────────────────────

describe('REQ-216 — a picture says what its channel does not do', () => {
  it('test_UAT_FC_REQ-216_an_edit_picture_says_its_behaviour_is_off', async () => {
    const picture = await shoot({ kind: 'edit' })
    expect(picture.note).toBe(EDIT_CHANNEL_NOTE)
    expect(picture.note).toMatch(/settled state/)
    expect(picture.note).toMatch(/draft/)
  })

  it('test_UAT_FC_REQ-216_a_draft_picture_carries_no_such_caption', async () => {
    const picture = await shoot({ kind: 'draft' })
    expect(picture.note).toBeUndefined()
  })

  it('test_UAT_FC_REQ-216_a_measurement_against_that_channel_carries_the_caveat', async () => {
    const ops = fidelityOperations({
      ...deps(pageHtml(signInPage())),
      guardedDriver: () => async () => new JsdomDriver(pageHtml(signInPage())),
    } as FidelityDeps)

    const measured = (await ops.compare({
      a: { kind: 'draft' },
      b: { kind: 'edit' },
    })) as { notes?: string[] }

    expect(measured.notes).toEqual([EDIT_CHANNEL_NOTE])

    const both = (await ops.compare({
      a: { kind: 'draft' },
      b: { kind: 'draft' },
    })) as { notes?: string[] }
    expect(both.notes).toBeUndefined()
  })

  it('test_UAT_FC_REQ-216_the_caption_travels_on_the_block_the_model_reads', async () => {
    const ops = fidelityOperations({
      ...deps(pageHtml(signInPage())),
      guardedDriver: () => async () => new JsdomDriver(pageHtml(signInPage())),
    } as FidelityDeps)

    const blocks = (await ops.screenshot({ of: { kind: 'edit' } })) as ContentBlock[]

    const text = blocks.find((b) => b.type === 'text') as { text: string }
    expect(text.text).toContain(EDIT_CHANNEL_NOTE)
    expect(blocks.some((b) => b.type === 'image')).toBe(true)
  })
})

// ── the declaration ──────────────────────────────────────────────────────────

describe('REQ-216 — what the surface tells the model it can do', () => {
  it('test_UAT_FC_REQ-216_the_declaration_offers_the_steps_and_still_validates', async () => {
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, FIDELITY_DECLARATION], L1_INSTANCES)
    expect(report.problems).toEqual([])
    expect(report.ok).toBe(true)

    const picture = (FIDELITY_DECLARATION.param_types as Record<string, { keys: Record<string, { type: string; description: string }> }>)
      .picture
    expect(picture.keys.after.type).toBe('array')
    expect(picture.keys.after.description).toMatch(/click "Sign in"/)
    expect(picture.keys.after.description).toMatch(/fill "Email" with/)
    // The two things a model has to know before it reaches for this.
    expect(picture.keys.after.description).toMatch(/Only a `draft` picture can be driven/)
    expect(picture.keys.after.description).toMatch(/refusal and no picture/)
  })

  it('test_UAT_FC_REQ-216_every_picture_taking_operation_can_report_the_refusal', () => {
    const ops = FIDELITY_DECLARATION.operations as { op: string; errors?: string[] }[]
    for (const name of ['screenshot', 'compare', 'check_fidelity']) {
      expect(ops.find((o) => o.op === name)!.errors).toContain('INTERACTION_FAILED')
    }
  })

  it('test_UAT_FC_REQ-216_the_absences_say_that_a_selector_is_not_a_name', () => {
    const absences = (FIDELITY_DECLARATION.absences as { name: string; note: string }[])
      .map((a) => `${a.name}: ${a.note}`)
      .join('\n')
    expect(absences).toMatch(/selector/i)
    expect(absences).toMatch(/Driving anything but your own draft/)
  })
})
