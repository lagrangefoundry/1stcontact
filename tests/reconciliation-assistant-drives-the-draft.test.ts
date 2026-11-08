/**
 * **The assistant can see** (story-58b2cec4) — the REQ-216 criteria: driving a
 * `draft` picture with `after` before the shutter opens, the refusals when a
 * step cannot be done or a picture cannot be driven, and the edit-channel
 * caption.
 *
 * WHAT IS REAL. The declaration, the real Toolbox (`createL1Toolbox` with the
 * looking surface composed through `fidelitySurfaceFor` — validation, error
 * rendering, the untrusted frame), the real operations, the real picture
 * resolution, the shipped L1 renderer and its vetted modal script for the
 * sign-in page, and the shipped interaction script run in page scope.
 *
 * ONE DOUBLE: the browser, the `BrowserDriver` seam. It is jsdom, which
 * implements focus, events, computed style and attribute state — everything
 * both page scripts touch — so "the trigger opened the panel" is observed. It
 * records what stood open at the moment the shutter was called, which is the
 * load-bearing observation: a picture of the closed page taken while a step
 * reported success is the failure these criteria exist to prevent.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { FIDELITY_DECLARATION, fidelitySurfaceFor } from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock, FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { EDIT_CHANNEL_NOTE } from '../tools/generate/src/cli/picture'
import { EXTRACT_SCRIPT } from '../tools/generate/src/cli/capture/extract'
import { VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import type { BrowserDriver, CapturedResponse, Viewport } from '../tools/generate/src/cli/capture/types'
import { encodePng } from '../tools/generate/src/cli/png'
import { memorySiteStore } from '../tools/generate/src/store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { ASSETS_PREFIX, bundleNameFor } from '../tools/generate/src/store/reference-store'
import {
  writeBundle,
  writeForms,
  writeHints,
  writeL1,
  writeMultiState,
} from '../tools/generate/src/cli/capture/bundle'
import { syntheticCapture, syntheticL1, syntheticMultiState } from './support/reference-fixtures'
import { signalsFor } from './support/fake-capture-driver'
import { siteSeed } from './support/site-seed'

const SLUG = 'driven'
const ORIGIN = 'https://app.test'
const WIDTHS = [320, 768, 1440]
const PNG_BASE64_HEAD = 'iVBORw0KGgo'
const OPEN = '<<<untrusted>>>\n'
const CLOSE = '\n<<</untrusted>>>'

// ── pages ────────────────────────────────────────────────────────────────────

/** The sign-in shape: a header "Sign in", a closed dialog holding its own Close. */
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

/** Two visible controls carrying the same name. */
const twoSignIns = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'a', text: 'Sign in', link: { href: '/a' } },
    { kind: 'text', id: 'b', text: 'Sign in', link: { href: '/b' } },
  ],
})

function pageHtml(root: L1Node): string {
  const { html, css, js } = renderL1Document({ widths: WIDTHS, root } as L1Document)
  return (
    `<!doctype html><html><head><style>${css}</style></head>` +
    `<body>${html}${js ? `<script>${js}</script>` : ''}</body></html>`
  )
}

const SIGN_IN = pageHtml(signInPage())

/** A form whose fields carry internal ids/names distinct from their labels. */
const FORM = `<!doctype html><html><body>
<form>
  <label for="email_input">Email</label><input id="email_input" name="email_input" type="email">
  <label for="nwt">Name with title</label><input id="nwt" name="nwt" type="text">
  <label for="country">Country</label>
  <select id="country"><option value="FR">France</option><option value="GB">United Kingdom</option></select>
  <label for="region">Region</label>
  <select id="region"><option value="United Kingdom">Elsewhere</option><option value="GB">United Kingdom</option></select>
  <label for="sub">Subscribe</label><input id="sub" type="checkbox">
  <button type="button">Send</button>
</form></body></html>`

/** Pages each built to make one step fail in one way. */
const STUBBORN = `<!doctype html><html><body>
<label for="s">Postcode</label><input id="s" type="text">
<script>Object.defineProperty(document.getElementById('s'),'value',{get:function(){return 'old'},set:function(){}})</script>
</body></html>`

const RESTLESS = `<!doctype html><html><body>
<button type="button" id="r">Animate</button>
<script>document.getElementById('r').addEventListener('click',function(){
  setInterval(function(){var p=document.createElement('p');p.textContent='tick';document.body.appendChild(p)},10)})</script>
</body></html>`

const LEAVING = `<!doctype html><html><body>
<button type="button" id="l">Elsewhere</button>
<script>document.getElementById('l').addEventListener('click',function(){window.__gone=true})</script>
</body></html>`

const CROWDED = `<!doctype html><html><body>${Array.from(
  { length: 12 },
  (_, i) => `<button type="button">Button ${String.fromCharCode(65 + i)}</button>`,
).join('')}</body></html>`

// ── the browser double ───────────────────────────────────────────────────────

interface Observed {
  leases: number
  navigated: { url: string; viewport?: Viewport }[]
  /** Which dialogs stood open at each shutter; one entry per screenshot. */
  shutters: string[][]
  /** Field values at each shutter, by element id. */
  fieldsAtShutter: Record<string, string>[]
  /** Which dialogs stood open when the value-extraction script was read. */
  extractions: string[][]
  /** The step names the interaction script was run with, in order. */
  steps: string[]
}

const openPanels = (dom: JSDOM): string[] =>
  [...dom.window.document.querySelectorAll('[data-l1-dialog][data-l1-open]')].map(
    (el) => el.getAttribute('data-l1-dialog')!,
  )

class JsdomDriver implements BrowserDriver {
  private dom: JSDOM | null = null
  constructor(
    private readonly html: string,
    private readonly seen: Observed,
  ) {}
  async navigate(url: string, viewport?: Viewport): Promise<void> {
    this.seen.navigated.push({ url, viewport })
    this.dom = new JSDOM(this.html, { runScripts: 'dangerously', url })
    await new Promise((resolve) => this.dom!.window.setTimeout(resolve, 0))
  }
  async query<T>(script: string): Promise<T> {
    const dom = this.dom!
    if (script === EXTRACT_SCRIPT) {
      this.seen.extractions.push(openPanels(dom))
      return signalsFor(VIEWPORTS.desktop.width) as T
    }
    const step = /var S=(\{.*?\});/.exec(script)
    if (step) this.seen.steps.push(JSON.parse(step[1]).name)
    const result = (await dom.window.eval(script)) as T
    // What a real browser does when a click navigates: the context the script
    // ran in is gone.
    if ((dom.window as unknown as { __gone?: boolean }).__gone) {
      throw new Error('Execution context was destroyed, most likely because of a navigation')
    }
    return result
  }
  async screenshot(): Promise<Uint8Array> {
    const dom = this.dom!
    this.seen.shutters.push(openPanels(dom))
    const fields: Record<string, string> = {}
    for (const el of dom.window.document.querySelectorAll('input,select,textarea')) {
      if (el.id) fields[el.id] = (el as HTMLInputElement).value
    }
    this.seen.fieldsAtShutter.push(fields)
    return encodePng({ data: new Uint8Array(8 * 8 * 3).fill(120), width: 8, height: 8, channels: 3 })
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

const BUNDLE = bundleNameFor({ host: 'example.test', path: '/pricing' })

async function seededReferences() {
  const references = memoryReferenceStore()
  const bundle = references.bundle(BUNDLE)
  await writeBundle(bundle, {
    capture: syntheticCapture(),
    screenshot: await encodePng({ data: new Uint8Array(8 * 8 * 3).fill(120), width: 8, height: 8, channels: 3 }),
    renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
    rawHtml: '<html><body>raw</body></html>',
    assetBytes: new Map([[`${ASSETS_PREFIX}hero.jpg`, new Uint8Array([9, 9, 9])]]),
  })
  await writeMultiState(bundle, syntheticMultiState())
  await writeL1(bundle, syntheticL1())
  await writeForms(bundle, [])
  await writeHints(bundle, { viewport: VIEWPORTS.mobile, mediaBreakpoints: [], nodes: [] })
  return references
}

/** The consultant's composed Toolbox for one site, its browser a jsdom page. */
async function consultant(html: string) {
  const seen: Observed = {
    leases: 0,
    navigated: [],
    shutters: [],
    fieldsAtShutter: [],
    extractions: [],
    steps: [],
  }
  const factory = async () => {
    seen.leases++
    return new JsdomDriver(html, seen)
  }
  const deps = {
    slug: SLUG,
    origin: ORIGIN,
    references: await seededReferences(),
    driverFactory: factory,
    guardedDriver: () => factory,
  } as unknown as FidelityDeps
  const store = memorySiteStore()
  const seed = siteSeed({ slug: SLUG })
  store.seed(SLUG, { siteJson: seed.siteJson, pages: seed.pages, assets: {} })
  const lib = await aiCore()
  const box = await createL1Toolbox(SLUG, {}, {
    lib,
    store,
    extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, deps) }],
  })
  const run = async (op: string, input: Record<string, unknown>) => String(await box.run(op, input))
  return { run, seen }
}

/** The content blocks of a successful picture, read out of the untrusted frame. */
function picture(rendered: string): ContentBlock[] {
  expect(rendered.startsWith(OPEN), rendered.slice(0, 400)).toBe(true)
  expect(rendered.endsWith(CLOSE)).toBe(true)
  const blocks = JSON.parse(rendered.slice(OPEN.length, rendered.length - CLOSE.length)) as ContentBlock[]
  expect(blocks.some((b) => b.type === 'image')).toBe(true)
  return blocks
}

const firstText = (blocks: ContentBlock[]): string =>
  (blocks.find((b) => b.type === 'text') as { text: string }).text

const resultOf = (rendered: string): Record<string, unknown> => {
  expect(rendered.startsWith(OPEN), rendered.slice(0, 400)).toBe(true)
  return JSON.parse(rendered.slice(OPEN.length, rendered.length - CLOSE.length))
}

const shoot = (of: Record<string, unknown>) => ({ of })

// ── AC-2477: the two forms ──────────────────────────────────────────────────

describe('a draft picture is driven by phrases in exactly two forms', () => {
  it('test_UAT_AC2477_two_forms_quotes_optional_anything_else_refused_before_a_browser_is_leased', async () => {
    // Both click forms, quoted and not, drive the sign-in page.
    for (const phrase of ['click Sign in', 'click "Sign in"']) {
      const { run, seen } = await consultant(SIGN_IN)
      picture(await run('screenshot', shoot({ kind: 'draft', after: [phrase] })))
      expect(seen.shutters, phrase).toEqual([['signin-panel']])
    }

    // Both fill forms; quoting the name is how a name containing `with` is written.
    {
      const { run, seen } = await consultant(FORM)
      picture(await run('screenshot', shoot({ kind: 'draft', after: ['fill Email with a@b.c'] })))
      picture(
        await run('screenshot', shoot({ kind: 'draft', after: ['fill "Name with title" with "Dr X"'] })),
      )
      expect(seen.fieldsAtShutter[0].email_input).toBe('a@b.c')
      expect(seen.fieldsAtShutter[1].nwt).toBe('Dr X')
    }

    // Everything that is not one of the two forms: refused, and no browser leased.
    {
      const { run, seen } = await consultant(SIGN_IN)
      const hover = await run('screenshot', shoot({ kind: 'draft', after: ['hover "Menu"'] }))
      expect(hover).toMatch(/^Error: screenshot failed\./)
      expect(hover).toContain('`click "Sign in"`')
      expect(hover).toContain('`fill "Email" with "someone@example.com"`')

      const fillNoWith = await run('screenshot', shoot({ kind: 'draft', after: ['fill "Email"'] }))
      expect(fillNoWith).toMatch(/^Error: screenshot failed\./)
      expect(fillNoWith).toContain('does not say what to fill it with')
      expect(fillNoWith).toContain('`fill "Email" with "someone@example.com"`')

      const empty = await run('screenshot', shoot({ kind: 'draft', after: ['click ""'] }))
      expect(empty).toMatch(/^Error: screenshot failed\./)
      expect(empty).toContain('names nothing to click')

      for (const refusal of [hover, fillNoWith, empty]) expect(refusal).not.toContain(PNG_BASE64_HEAD)
      expect(seen.leases).toBe(0)
    }

    // An empty or absent `after` takes the picture exactly as an undriven one.
    {
      const { run, seen } = await consultant(SIGN_IN)
      const none = firstText(picture(await run('screenshot', shoot({ kind: 'draft' }))))
      const emptyList = firstText(picture(await run('screenshot', shoot({ kind: 'draft', after: [] }))))
      expect(emptyList).toBe(none)
      expect(none).not.toContain('after')
      expect(seen.steps).toEqual([])
      expect(seen.navigated.map((n) => n.viewport)).toEqual([undefined, undefined])
      expect(seen.shutters).toEqual([[], []])
    }
  })
})

// ── AC-2478: order, first failure stops, shutter on the driven state ─────────

describe('steps run in order and the shutter opens on the state they produced', () => {
  it('test_UAT_AC2478_steps_in_order_first_failure_stops_shutter_on_driven_state_at_its_own_viewport', async () => {
    // The dialog is open at the shutter after `click "Sign in"`, closed without steps.
    {
      const { run, seen } = await consultant(SIGN_IN)
      const driven = firstText(
        picture(await run('screenshot', shoot({ kind: 'draft', after: ['click "Sign in"'] }))),
      )
      picture(await run('screenshot', shoot({ kind: 'draft' })))
      expect(seen.shutters).toEqual([['signin-panel'], []])
      expect(driven).toContain('after `click "Sign in"`')
    }

    // Two steps, in the order written: open, then the Close only reachable once open.
    {
      const { run, seen } = await consultant(SIGN_IN)
      const text = firstText(
        picture(
          await run('screenshot', shoot({ kind: 'draft', after: ['click "Sign in"', 'click "Close"'] })),
        ),
      )
      expect(seen.steps).toEqual(['Sign in', 'Close'])
      expect(seen.shutters).toEqual([[]])
      expect(text).toContain('after `click "Sign in"` then `click "Close"`')
    }

    // The first failure stops the run: one refusal, about the first step; the
    // second never ran and no shutter opened.
    {
      const { run, seen } = await consultant(SIGN_IN)
      const refusal = await run(
        'screenshot',
        shoot({ kind: 'draft', after: ['click "Missing"', 'click "Sign in"'] }),
      )
      expect(refusal).toMatch(/^Error: screenshot failed \(INTERACTION_FAILED\)/)
      expect(refusal).toContain(`'click "Missing"' could not be carried out`)
      expect(refusal).not.toContain(`'click "Sign in"'`)
      expect(seen.steps).toEqual(['Missing'])
      expect(seen.shutters).toEqual([])
    }

    // A driven picture is laid out at the viewport it was asked at; an undriven
    // one keeps load-then-resize.
    {
      const { run, seen } = await consultant(SIGN_IN)
      picture(
        await run('screenshot', shoot({ kind: 'draft', viewport: 'mobile', after: ['click "Sign in"'] })),
      )
      picture(await run('screenshot', shoot({ kind: 'draft', viewport: 'mobile' })))
      expect(seen.navigated[0].viewport).toEqual(VIEWPORTS.mobile)
      expect(seen.navigated[0].viewport!.width).toBe(375)
      expect(seen.navigated[1].viewport).toBeUndefined()
    }

    // check_fidelity's value gates read the page in the same driven state.
    {
      const { run, seen } = await consultant(SIGN_IN)
      const driven = await run('check_fidelity', {
        reference: BUNDLE,
        actual: { kind: 'draft', after: ['click "Sign in"'] },
      })
      expect(driven, driven.slice(0, 400)).not.toMatch(/^Error:/)
      expect(resultOf(driven).verdict).toEqual(expect.any(String))
      const undriven = await run('check_fidelity', { reference: BUNDLE, actual: { kind: 'draft' } })
      expect(undriven, undriven.slice(0, 400)).not.toMatch(/^Error:/)
      expect(seen.extractions).toEqual([['signin-panel'], []])
    }
  })
})

// ── AC-2479: accessible names only ───────────────────────────────────────────

describe('controls are matched by accessible name, never by selector', () => {
  it('test_UAT_AC2479_controls_matched_by_accessible_name_and_no_selector_id_or_attribute_names_one', async () => {
    // Case-insensitive; the closed dialog's own controls do not compete.
    {
      const { run, seen } = await consultant(SIGN_IN)
      const shot = await run('screenshot', shoot({ kind: 'draft', after: ['click "sign in"'] }))
      expect(shot).not.toContain('things match')
      picture(shot)
      expect(seen.shutters).toEqual([['signin-panel']])
    }

    // A unique partial name is accepted; extra whitespace is ignored.
    {
      const { run, seen } = await consultant(SIGN_IN)
      picture(await run('screenshot', shoot({ kind: 'draft', after: ['click "  SIGN   "'] })))
      expect(seen.shutters).toEqual([['signin-panel']])
    }

    // A field is reached by its label…
    {
      const { run, seen } = await consultant(FORM)
      picture(await run('screenshot', shoot({ kind: 'draft', after: ['fill "Email" with "a@b.c"'] })))
      expect(seen.fieldsAtShutter[0].email_input).toBe('a@b.c')
    }

    // …and a menu by the words on its option, before its value.
    {
      const { run, seen } = await consultant(FORM)
      picture(
        await run('screenshot', shoot({ kind: 'draft', after: ['fill "Country" with "United Kingdom"'] })),
      )
      expect(seen.fieldsAtShutter[0].country).toBe('GB')
    }
    {
      // Value only when no option's words match.
      const { run, seen } = await consultant(FORM)
      picture(await run('screenshot', shoot({ kind: 'draft', after: ['fill "Country" with "FR"'] })))
      expect(seen.fieldsAtShutter[0].country).toBe('FR')
    }
    {
      // Words win even when an EARLIER option's value carries the same text.
      const { run, seen } = await consultant(FORM)
      picture(
        await run('screenshot', shoot({ kind: 'draft', after: ['fill "Region" with "United Kingdom"'] })),
      )
      expect.soft(seen.fieldsAtShutter[0].region, 'option words before option value').toBe('GB')
    }

    // Checkboxes are not fillable.
    {
      const { run } = await consultant(FORM)
      const refusal = await run('screenshot', shoot({ kind: 'draft', after: ['fill "Subscribe" with "yes"'] }))
      expect(refusal).toMatch(/INTERACTION_FAILED/)
      expect(refusal).toContain("nothing on the page is called 'Subscribe'")
    }

    // The declaration says nothing here takes a selector.
    const absences = FIDELITY_DECLARATION.absences as { name: string; note: string }[]
    const selector = absences.find((a) => a.name === 'Naming part of the page by selector')
    expect(selector).toBeTruthy()
    expect(selector!.note).toMatch(/Nothing here takes a selector, an id or an attribute/)
    const after = (
      FIDELITY_DECLARATION.param_types as Record<string, { keys: Record<string, { description: string }> }>
    ).picture.keys.after.description
    expect(after).toMatch(/there is no way to name a selector/)

    // A field's id / name attribute is not a name it can be reached by.
    {
      const { run, seen } = await consultant(FORM)
      const refusal = await run(
        'screenshot',
        shoot({ kind: 'draft', after: ['fill "email_input" with "a@b.c"'] }),
      )
      expect.soft(refusal, 'a field must not be reachable by its id/name attribute').toMatch(
        /^Error: screenshot failed \(INTERACTION_FAILED\)/,
      )
      expect.soft(refusal).toContain("nothing on the page is called 'email_input'")
      expect.soft(seen.shutters, 'no picture is taken').toEqual([])
    }
  })
})

// ── AC-2480: each failure is a refusal and no picture ────────────────────────

describe('a step that cannot be done is INTERACTION_FAILED and returns no picture', () => {
  it('test_UAT_AC2480_each_step_failure_is_refused_naming_what_failed_and_no_picture_is_returned', async () => {
    const cases: { html: string; step: string; finding: RegExp }[] = [
      {
        html: SIGN_IN,
        step: 'click "Log in"',
        finding: /nothing on the page is called 'Log in'\. What is there: .*'sign in'/,
      },
      { html: pageHtml(twoSignIns()), step: 'click "Sign in"', finding: /2 things match 'Sign in': .*Say which one exactly/ },
      {
        html: SIGN_IN,
        step: 'click "Close"',
        finding: /something called 'Close' on the page, but it is not visible right now — whatever holds it has to be opened first/,
      },
      { html: FORM, step: 'click "Send"', finding: /clicking 'send' changed nothing on the page/ },
      { html: STUBBORN, step: 'fill "Postcode" with "BS1"', finding: /did not take that value — it still reads 'old'/ },
      { html: FORM, step: 'fill "Country" with "Atlantis"', finding: /has no choice called 'Atlantis'/ },
      {
        html: RESTLESS,
        step: 'click "Animate"',
        finding: /still changing 2000ms after clicking 'animate', so nothing it shows now can be trusted/,
      },
      {
        html: LEAVING,
        step: 'click "Elsewhere"',
        finding: /the page stopped answering .*These drive a page's own state; to look at a different page, name that page instead/,
      },
    ]

    for (const c of cases) {
      const { run, seen } = await consultant(c.html)
      const refusal = await run('screenshot', shoot({ kind: 'draft', after: [c.step] }))
      expect(refusal, c.step).toMatch(/^Error: screenshot failed \(INTERACTION_FAILED\)/)
      expect(refusal, c.step).toContain(`'${c.step}' could not be carried out`)
      expect(refusal, c.step).toMatch(c.finding)
      expect(refusal, c.step).not.toContain(PNG_BASE64_HEAD)
      expect(refusal, c.step).not.toContain('"type":"image"')
      expect(seen.shutters, c.step).toEqual([])
    }

    // "What is there" lists at most eight distinct names.
    {
      const { run } = await consultant(CROWDED)
      const refusal = await run('screenshot', shoot({ kind: 'draft', after: ['click "Zebra"'] }))
      const listed = /What is there: (.*)\./.exec(refusal)![1].match(/'[^']+'/g)!
      expect(listed.length).toBe(8)
      expect(new Set(listed).size).toBe(8)
    }

    // The declaration names the code, calls it a finding, and every
    // picture-taking operation lists it.
    const errors = FIDELITY_DECLARATION.errors as Record<string, { message?: string } | string>
    const declared = errors.INTERACTION_FAILED
    expect(JSON.stringify(declared)).toMatch(/finding about the page/)
    const ops = FIDELITY_DECLARATION.operations as { op: string; errors?: string[] }[]
    for (const name of ['screenshot', 'compare', 'check_fidelity']) {
      expect(ops.find((o) => o.op === name)!.errors, name).toContain('INTERACTION_FAILED')
    }
  }, 30_000)
})

// ── AC-2481: only a draft can be driven ──────────────────────────────────────

describe('only a draft picture can be driven', () => {
  it('test_UAT_AC2481_edit_reference_revision_and_url_pictures_with_after_are_refused_before_a_browser', async () => {
    const reasons: [Record<string, unknown>, string][] = [
      [{ kind: 'edit' }, 'The edit channel ships no behaviour, so there is nothing there to open or advance.'],
      [{ kind: 'reference', bundle: BUNDLE }, 'A reference is a recording of a page, not a page.'],
      [{ kind: 'revision', revision: 1 }, "Driving a published revision or somebody else's address would act on a live system."],
      [{ kind: 'url', url: 'https://example.test/' }, "Driving a published revision or somebody else's address would act on a live system."],
    ]
    const { run, seen } = await consultant(SIGN_IN)
    for (const [source, reason] of reasons) {
      const refusal = await run('screenshot', shoot({ ...source, after: ['click "Sign in"'] }))
      expect(refusal, String(source.kind)).toMatch(/^Error: screenshot failed\./)
      expect(refusal).toContain(`only a 'draft' picture can be driven, and this one is '${source.kind}'`)
      expect(refusal).toContain(reason)
      expect(refusal).toContain("Ask for the same thing as a 'draft' picture.")
      expect(refusal).not.toContain(PNG_BASE64_HEAD)
    }
    expect(seen.leases).toBe(0)

    // The same `after` on a draft launches the browser and drives it.
    picture(await run('screenshot', shoot({ kind: 'draft', after: ['click "Sign in"'] })))
    expect(seen.leases).toBe(1)
    expect(seen.shutters).toEqual([['signin-panel']])

    const absences = FIDELITY_DECLARATION.absences as { name: string; note: string }[]
    const draftOnly = absences.find((a) => a.name === 'Driving anything but your own draft')!
    expect(draftOnly.note).toMatch(/Only a `draft` picture takes `after`/)
    expect(draftOnly.note).toMatch(/edit channel ships no behaviour/)
    expect(draftOnly.note).toMatch(/recording of a page rather than a page/)
    expect(draftOnly.note).toMatch(/live system/)
    expect(draftOnly.note).toMatch(/There is no setting that lifts this/)
  })
})

// ── AC-2482: the edit caption ────────────────────────────────────────────────

describe('a picture says which channel it is of', () => {
  it('test_UAT_AC2482_an_edit_picture_carries_the_caption_compare_reports_it_and_a_draft_carries_none', async () => {
    const { run } = await consultant(SIGN_IN)

    const edit = firstText(picture(await run('screenshot', shoot({ kind: 'edit' }))))
    expect(edit).toMatch(/^driven edit\/ at desktop — 8×8\. /)
    expect(edit).toContain(EDIT_CHANNEL_NOTE)
    expect(edit).toContain('ships no behaviour')
    expect(edit).toContain('`draft` picture')
    expect(edit.split(EDIT_CHANNEL_NOTE).length).toBe(2)

    for (const after of [undefined, ['click "Sign in"']]) {
      const draft = firstText(picture(await run('screenshot', shoot({ kind: 'draft', ...(after ? { after } : {}) }))))
      expect(draft).not.toContain('ships no behaviour')
      expect(draft).not.toContain('`draft` picture')
    }

    const mixed = resultOf(await run('compare', { a: { kind: 'edit' }, b: { kind: 'draft' } }))
    expect(mixed.notes).toEqual([EDIT_CHANNEL_NOTE])
    const plain = resultOf(await run('compare', { a: { kind: 'draft' }, b: { kind: 'draft' } }))
    expect('notes' in plain).toBe(false)

    const screenshotOp = (FIDELITY_DECLARATION.operations as { op: string; description: string }[]).find(
      (o) => o.op === 'screenshot',
    )!
    expect(screenshotOp.description).toMatch(/An `edit` picture is of the page as your user is editing it/)
    expect(screenshotOp.description).toMatch(/The picture tells you so/)
    expect(screenshotOp.description).toMatch(/Do not reason about what a visitor would see/)
  })
})
