/**
 * REQ-93 — an L1 page must be able to **host behavior modules in its slots**.
 *
 * A captured marketing page is routinely 100% L1 layout plus one behaviour, and
 * REQ-88's page-level XOR ("either a module stack or a raw L1 document, not
 * both") made that combination unrepresentable — so the behavioural half of
 * every reproduction was permanently stranded as a `field` residual. The XOR's
 * real intent was *no two competing page bodies*, which survives as the narrower
 * rule these UATs pin:
 *
 *   > modules may accompany `l1` when each is bound by name to a `slot` present
 *   > in the L1 tree
 *
 * The five clauses proven here follow the ticket's scope:
 *   1. **schema**  — slot-bound mounting validates; unbound / dangling / doubly-
 *      bound / orphan-slot bindings each fail with a machine-readable path.
 *   2. **fold**    — captured controls become `slot` seams grouped into the forms
 *      they visibly belong to, not `field` residuals.
 *   3. **repro**   — the `contact-form` config is derived from the capture only;
 *      an endpoint the capture never saw is a reported residual, not an invention.
 *   4. **render**  — the module's rendered fragment replaces the inert
 *      `data-l1-slot` placeholder, with real a11y-labelled controls.
 *   5. **conformance** — the mounted result carries the behaviour's obligations.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { BehaviorDefinition } from '@1stcontact/framework'
import { defaultTokens, latestModuleVersion, renderL1Document } from '../packages/framework/src/index'
import { validateSite, type L1Document } from '../packages/site-schema/src/index'
import { clusterControls, foldToL1, foldedFormFor } from '../tools/generate/src/l1'
import type { ControlRow, FoldedForm, FoldResidual } from '../tools/generate/src/l1'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { cmdRender } from '../tools/generate/src/cli/commands'
import { writeForms, writeL1 } from '../tools/generate/src/cli/capture/bundle'
import {
  assertModuleConforms,
  ConformanceError,
  CONFORMANCE_DIMENSIONS,
  oneModulePage,
  RESPONSIVE_PROBE,
  RESPONSIVE_WIDTHS,
  SAFETY_PROBE,
  SECURITY_PROBE,
  serveOneModulePage,
  X_BROWSER_BOX_PROBE,
  type ConformanceDimension,
  type ConformanceEngine,
  type ConformanceFixture,
  type ConformanceOptions,
  type XBrowserBox,
} from '../tools/generate/src/conformance'
import {
  chromiumAvailable,
  createPlaywrightDriver,
  type BrowserDriver,
  type CapturedResponse,
  type ModuleResolver,
} from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import { mobileOverflow as MobileOverflow } from './fixtures/conformance/mobile-overflow'
import { throwsOnRender as ThrowsOnRender } from './fixtures/conformance/throws-on-render'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const GIGABYTE = path.join(process.cwd(), 'storage', 'references', 'gigabytealchemy.ai', 'index', 'multistate.json')

// ── fixtures ─────────────────────────────────────────────────────────────────

function textEl(width: number, text: string, y: number): ValueElement {
  return {
    text,
    role: 'heading',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 32,
    fontWeight: 700,
    box: { x: 20, y, width: width - 40, height: 40 },
  }
}

/** A captured text-free control, named by the a11y tree. */
function control(over: Partial<ValueElement> & { accessibleName: string; box: ValueElement['box'] }): ValueElement {
  return {
    text: '',
    role: 'field',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    nameSource: 'placeholder',
    ...over,
  }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: { source: `req93@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 900 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** Two visibly separate forms: a one-field signup, and a three-field contact. */
function twoFormCapture(): MultiStateCapture {
  return multiFrom((w) => [
    textEl(w, 'Get in touch', 100),
    control({ accessibleName: 'Your email address', box: { x: 20, y: 300, width: 240, height: 50 } }),
    // …a long way below (and, at every width, far past the cluster threshold).
    control({ accessibleName: 'Your name', box: { x: 20, y: 900, width: 400, height: 50 } }),
    control({ accessibleName: 'Your email', box: { x: 20, y: 966, width: 400, height: 50 } }),
    control({ accessibleName: 'Your message', box: { x: 20, y: 1032, width: 400, height: 150 } }),
  ])
}

function slotsOf(doc: L1Document): Array<{ name: string; behavior?: string; geometry?: unknown }> {
  const children = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
  return children.filter((n) => n.kind === 'slot') as never
}

const baseSite = {
  id: 'gigabyte',
  config: { businessName: 'Gigabyte', tagline: '' },
  theme: defaultTokens,
  nav: { pattern: 'top-tabs' as const, entries: [] },
  assets: [],
}

/** A minimal L1 document with one named slot. */
function docWithSlot(name = 'form-0'): L1Document {
  return {
    widths: [375, 1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'slot',
          name,
          behavior: 'contact-form',
          geometry: { keyframes: [375, 1280].map((at) => ({ at, x: 0, y: 0, width: at, height: 300 })) },
        },
      ],
    },
  } as L1Document
}

/** The `form-0` seam's opening tag, verbatim — class + every data attribute. */
function seamTagOf(html: string): string {
  const m = /<div class="[^"]*"[^>]*data-l1-slot="form-0"[^>]*>/.exec(html)
  return m ? m[0] : ''
}

/** Every emitted CSS rule naming the `form-0` seam's own class, in order. */
function seamRuleOf(res: { html: string; css: string }): string {
  const cls = /<div class="([^"]+)"[^>]*data-l1-slot="form-0"/.exec(res.html)?.[1]
  if (!cls) return ''
  const own = new RegExp(`\\.${cls.split(/\s+/).filter(Boolean).join('\\.')}\\b`)
  // Rule-ish granularity: splitting on `}` also splits `@media` wrappers, but it
  // does so identically for both renders, so the comparison stays sound.
  return res.css
    .split('}')
    .filter((chunk) => own.test(chunk))
    .map((chunk) => `${chunk.trim()}}`)
    .join('\n')
}

const contactInstance = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'form-0',
  type: 'contact-form',
  version: latestModuleVersion('contact-form'),
  slot: 'form-0',
  config: { action: '', fields: [{ name: 'email', label: 'Your email', type: 'email', required: false }] },
  ...over,
})

// ── conformance-harness scaffolding (§5) ─────────────────────────────────────

const HAVE_CHROMIUM = await chromiumAvailable()

/** The survivor behavior module run through the harness in both positions. */
const mountedContactFixture: ConformanceFixture = {
  label: 'mounted-contact-form',
  props: {
    version: latestModuleVersion('contact-form'),
    config: { action: '/leads', fields: [{ name: 'email', label: 'Your email', type: 'email' }] },
  },
}

const fixtureMeta = (id: string): BehaviorDefinition['meta'] => ({
  id,
  version: 1,
  kind: 'behavior',
  config: {},
  slots: {},
  conformance: { obligations: ['isolation', 'responsive', 'safety', 'security', 'x-browser'] },
})
/** A test-only catalog whose core throws during SSR — the `isolation` defect. */
const resolveThrows: ModuleResolver = (type) => {
  if (type === 'fc-throws') return { meta: fixtureMeta('fc-throws'), Component: ThrowsOnRender }
  throw new Error(`Unknown isolation fixture: ${type}`)
}
/** A test-only catalog that overflows only below 480px — the REQ-41 fixture. */
const resolveMobileOverflow: ModuleResolver = (type) => {
  if (type === 'fc-mobile-overflow') {
    return { meta: fixtureMeta('fc-mobile-overflow'), Component: MobileOverflow }
  }
  throw new Error(`Unknown responsive fixture: ${type}`)
}

/** Chromium's boxes, and another engine's with a 40px shift — well past `posPx`. */
const REF_BOXES: XBrowserBox[] = [
  { i: 0, tag: 'section', label: 'section', dx: 0, dy: 0, w: 1280, h: 400 },
]
const SHIFTED_BOXES: XBrowserBox[] = [{ ...REF_BOXES[0], dy: 40 }]

/**
 * A fake driver reporting one deliberate defect per probe. The arm it serves
 * compares the *mounted* verdict against the standalone one, and a clean run
 * could not tell "same verdict" from "no check ran at all" — so every browser
 * dimension is given something it must flag.
 */
class DefectiveDriver implements BrowserDriver {
  constructor(private readonly boxes: XBrowserBox[]) {}
  async navigate(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array()
  }
  async query<T>(script: string): Promise<T> {
    if (script === SAFETY_PROBE) {
      return { overflow: { scrollWidth: 4000, innerWidth: 1280 }, collapsed: [], clipped: [] } as T
    }
    if (script === SECURITY_PROBE) {
      return {
        unsafeUrls: ['href=javascript:steal() on a'],
        eventHandlers: [],
        styleBreakouts: [],
        xssFired: false,
      } as T
    }
    if (script === RESPONSIVE_PROBE) {
      return { smallTapTargets: ['input [email] (20x20px)'], smallFonts: [] } as T
    }
    if (script === X_BROWSER_BOX_PROBE) return { boxes: this.boxes } as T
    return {} as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<!doctype html><html><body></body></html>'
  }
  async close(): Promise<void> {}
}

/**
 * How to make each universal dimension actually produce a violation using only
 * injected drivers/catalogs — no browser binaries, no engine provisioning, so
 * the comparison runs everywhere.
 */
function runFor(dimension: ConformanceDimension): {
  slug: string
  fixture: ConformanceFixture
  opts: ConformanceOptions
} {
  if (dimension === 'isolation') {
    return {
      slug: 'fc-throws',
      fixture: { label: 'throws', props: { config: {}, slots: {} } },
      opts: { resolveModule: resolveThrows },
    }
  }
  if (dimension === 'x-browser') {
    return {
      slug: 'contact-form',
      fixture: mountedContactFixture,
      opts: {
        engines: ['chromium', 'webkit'],
        xBrowserBackstop: false,
        driverFactoryFor: (engine: ConformanceEngine) => async () =>
          new DefectiveDriver(engine === 'chromium' ? REF_BOXES : SHIFTED_BOXES),
      },
    }
  }
  return {
    slug: 'contact-form',
    fixture: mountedContactFixture,
    opts: { driverFactory: async () => new DefectiveDriver(REF_BOXES) },
  }
}

/** The distinct AC ids one harness run reported, sorted; empty if it passed. */
async function reportedAcs(dimension: ConformanceDimension, mountInL1: boolean): Promise<string[]> {
  const { slug, fixture, opts } = runFor(dimension)
  const err = await assertModuleConforms(slug, [fixture], {
    ...opts,
    dimension,
    mountInL1,
    keepSandboxOnFailure: false,
  }).then(
    () => null,
    (e: unknown) => e as ConformanceError,
  )
  return err ? [...new Set(err.violations.map((v) => v.ac))].sort() : []
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req93-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

// ── 1. schema ────────────────────────────────────────────────────────────────

describe('REQ-93 — an L1 page hosts behavior modules in its slots', () => {
  it('test_UAT_AC1623_slot_bound_module_accompanies_an_l1_page', () => {
    // The headline change: `l1` + a module is now legal, *because* the module
    // names a slot that exists in the tree. The L1 document is still the single
    // page body; the behaviour mounts into it.
    const page = { id: 'home', slug: 'home', title: 'Home', l1: docWithSlot(), modules: [contactInstance()] }
    const result = validateSite({ ...baseSite, pages: [page] })
    expect(result.ok).toBe(true)

    // The rule is ONE-DIRECTIONAL — every module must name a live, unique seam,
    // but a seam need not attract a module. Both legal states must validate.
    //
    // (i) Both empty: the starter page, no modules and no L1 document.
    const starter = { id: 'home', slug: 'home', title: 'Home' }
    expect(validateSite({ ...baseSite, pages: [starter] }).ok).toBe(true)

    // (ii) An ORPHAN seam: a `slot` in the tree that no module binds. It is not an
    // error — it renders as the inert placeholder STORY-83 emits. This case is
    // what makes the rule one-directional rather than a mutual requirement:
    // without it a future change could start rejecting orphan seams with every
    // rejection case below still green.
    const orphan = { id: 'home', slug: 'home', title: 'Home', l1: docWithSlot('unbound'), modules: [] }
    expect(validateSite({ ...baseSite, pages: [orphan] }).ok).toBe(true)
  })

  it('test_UAT_AC1623_unresolvable_bindings_fail_with_a_machine_readable_path', () => {
    // Every way a binding can fail to resolve is an error with a path an AI caller
    // can self-correct from — never a silent no-op (REQ-88's `anchor`-without-
    // `column` principle).
    const cases: Array<{ label: string; page: Record<string, unknown>; match: RegExp; path: RegExp }> = [
      {
        label: 'unbound module beside an L1 body',
        page: { id: 'home', slug: 'home', title: 'H', l1: docWithSlot(), modules: [contactInstance({ slot: undefined })] },
        match: /must name the L1 slot it mounts into/,
        path: /pages\/0\/modules\/0\/slot/,
      },
      {
        label: 'slot name absent from the tree',
        page: { id: 'home', slug: 'home', title: 'H', l1: docWithSlot('mount'), modules: [contactInstance()] },
        match: /no slot named 'form-0'/,
        path: /pages\/0\/modules\/0\/slot/,
      },
      {
        label: 'two modules bound to one slot',
        page: {
          id: 'home',
          slug: 'home',
          title: 'H',
          l1: docWithSlot(),
          modules: [contactInstance(), contactInstance({ id: 'form-0b' })],
        },
        match: /bound by more than one module/,
        path: /pages\/0\/modules\/1\/slot/,
      },
      {
        label: 'ambiguous (duplicated) slot name in the tree',
        page: {
          id: 'home',
          slug: 'home',
          title: 'H',
          l1: {
            ...docWithSlot(),
            root: {
              kind: 'box',
              children: [
                { kind: 'slot', name: 'form-0' },
                { kind: 'slot', name: 'form-0' },
              ],
            },
          },
          modules: [contactInstance()],
        },
        match: /duplicate L1 slot name 'form-0'/,
        path: /pages\/0\/l1/,
      },
      {
        label: 'slot named on a page with no L1 body',
        page: { id: 'home', slug: 'home', title: 'H', modules: [contactInstance()] },
        match: /no L1 document to mount into/,
        path: /pages\/0\/modules\/0\/slot/,
      },
    ]
    for (const c of cases) {
      const result = validateSite({ ...baseSite, pages: [c.page] })
      expect(result.ok, c.label).toBe(false)
      if (result.ok) continue
      expect(result.errors.some((e) => c.match.test(e.message)), c.label).toBe(true)
      expect(result.errors.some((e) => c.match.test(e.message) && c.path.test(e.path)), c.label).toBe(true)
    }
  })

  // ── 2. fold ────────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-93_fold_groups_controls_into_forms_at_slot_seams', () => {
    // Controls are still never faked into L1 leaves — but they are no longer
    // stranded either. They cluster into the forms they visibly belong to, each
    // becoming ONE slot pinned at that group's union rect across the ladder.
    const residuals: FoldResidual[] = []
    const forms: FoldedForm[] = []
    const doc = foldToL1(twoFormCapture(), { residuals, forms })

    expect(residuals.filter((r) => r.kind === 'field')).toEqual([])
    const slots = slotsOf(doc)
    expect(slots.map((s) => s.name)).toEqual(['form-0', 'form-1'])
    for (const s of slots) expect(s.behavior).toBe('contact-form')

    // The seams carry the group's union geometry at every sampled width, so the
    // mounted behaviour occupies exactly the space the reference gave the form.
    const contact = slots[1] as unknown as { geometry: { keyframes: Array<{ at: number; y: number; height: number }> } }
    expect(contact.geometry.keyframes.map((k) => k.at)).toEqual(LADDER)
    // y 900 → 1032+150 = 1182 across the three contact controls.
    expect(contact.geometry.keyframes[0].y).toBe(900)
    expect(contact.geometry.keyframes[0].height).toBe(282)

    // …and one binding per seam, in document order.
    expect(forms.map((f) => f.slot)).toEqual(['form-0', 'form-1'])
    expect(forms[0].fields.map((f) => f.label)).toEqual(['Your email address'])
    expect(forms[1].fields.map((f) => f.label)).toEqual(['Your name', 'Your email', 'Your message'])
  })

  it('test_UAT_FC_REQ-93_real_capture_strands_no_form_control', () => {
    // The motivating page: gigabytealchemy is 100% L1 layout plus two forms whose
    // four controls were, before this change, a `field` residual per cell of the
    // ladder — the worst delta on the page. They must now all be mounted.
    if (!existsSync(GIGABYTE)) return // capture bundle is gitignored — skip cleanly
    const ms = JSON.parse(readFileSync(GIGABYTE, 'utf8')) as MultiStateCapture
    const residuals: FoldResidual[] = []
    const forms: FoldedForm[] = []
    const doc = foldToL1(ms, { residuals, forms })

    expect(residuals.filter((r) => r.kind === 'field')).toEqual([])
    expect(slotsOf(doc)).toHaveLength(2)
    // Two distinct forms: the mailing-list signup and the three-field contact form.
    expect(forms.map((f) => f.fields.length).sort()).toEqual([1, 3])
    const labels = forms.flatMap((f) => f.fields.map((x) => x.label)).sort()
    expect(labels).toEqual(['Your email', 'Your email address', 'Your message', 'Your name'])
    // The message box is the only multi-line control, inferred from its height.
    const message = forms.flatMap((f) => f.fields).find((f) => f.label === 'Your message')
    expect(message?.type).toBe('textarea')
  })

  // ── 3. repro (config derived from the capture, never invented) ─────────────

  it('test_UAT_FC_REQ-93_config_is_derived_never_invented', () => {
    // `type` comes from the captured input type when the bundle records one…
    const typed = foldedFormFor('form-0', [
      { samples: [{ at: 1280, element: control({ accessibleName: 'Phone', box: { x: 0, y: 0, width: 200, height: 50 }, controlType: 'tel' }), box: { x: 0, y: 0, width: 200, height: 50 } }] },
    ] as ControlRow[])
    // …and `labelMode` from the a11y tree's `nameSource` — this fixture's control
    // is placeholder-named, like the reference's own (REQ-88).
    expect(typed.fields[0]).toEqual({
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      labelMode: 'placeholder',
    })

    // …and the endpoint from the captured form action.
    const withAction = foldedFormFor('form-0', [
      {
        samples: [
          {
            at: 1280,
            element: control({
              accessibleName: 'Email',
              box: { x: 0, y: 0, width: 200, height: 50 },
              controlType: 'email',
              formAction: 'https://example.test/subscribe',
            }),
            box: { x: 0, y: 0, width: 200, height: 50 },
          },
        ],
      },
    ] as ControlRow[])
    expect(withAction.action).toBe('https://example.test/subscribe')
    expect(withAction.residuals).toEqual([])

    // Absent an action, NOTHING is fabricated: the form posts to its own URL and
    // the gap is recorded, so an honest default is never mistaken for a fact.
    const noAction = foldedFormFor('form-0', [
      { samples: [{ at: 1280, element: control({ accessibleName: 'Email', box: { x: 0, y: 0, width: 200, height: 50 }, controlType: 'email' }), box: { x: 0, y: 0, width: 200, height: 50 } }] },
    ] as ControlRow[])
    expect(noAction.action).toBeUndefined()
    expect(noAction.residuals.some((r) => /no form action captured/.test(r))).toBe(true)

    // An unsafe captured action is dropped, not emitted into a form `action` sink.
    const unsafe = foldedFormFor('form-0', [
      {
        samples: [
          {
            at: 1280,
            element: control({
              accessibleName: 'Email',
              box: { x: 0, y: 0, width: 200, height: 50 },
              formAction: 'javascript:steal()',
            }),
            box: { x: 0, y: 0, width: 200, height: 50 },
          },
        ],
      },
    ] as ControlRow[])
    expect(unsafe.action).toBeUndefined()
    expect(unsafe.residuals.some((r) => /not a safe URL/.test(r))).toBe(true)
  })

  it('test_UAT_FC_REQ-93_clustering_separates_side_by_side_forms', () => {
    // Two forms in adjacent columns are as close vertically as one form's own
    // fields are, so the grouping cannot key on vertical gap alone — it clusters
    // on rect distance at the widest sample, where columns are most separated.
    const near = (x: number, y: number): ControlRow => ({
      samples: [{ at: 1280, element: control({ accessibleName: `f${x}${y}`, box: { x, y, width: 300, height: 50 } }), box: { x, y, width: 300, height: 50 } }],
    })
    const groups = clusterControls([near(88, 3900), near(664, 3784), near(664, 3850), near(664, 3916)])
    // Two groups, ordered by their topmost member: the 3-field column starts at
    // y=3784, above the single signup field at y=3900.
    expect(groups.map((g) => g.length)).toEqual([3, 1])
  })

  // ── 4. render ──────────────────────────────────────────────────────────────

  it('test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder', () => {
    // With no mount the slot stays the labelled Phase-D placeholder…
    const bare = renderL1Document(docWithSlot())
    expect(bare.html).toContain('data-l1-slot="form-0"')
    expect(bare.html).toMatch(/data-l1-behavior="contact-form"><\/div>/)

    // …and with one it hosts the module's markup, inside the same positioned box.
    const mounted = renderL1Document(docWithSlot(), { mounts: { 'form-0': '<form data-contact-form></form>' } })
    expect(mounted.html).toContain('data-l1-slot="form-0"')
    expect(mounted.html).toContain('<form data-contact-form></form>')
    expect(mounted.html).not.toMatch(/data-l1-behavior="contact-form"><\/div>/)
    // An unbound slot name mounts nothing (no cross-talk between seams).
    const other = renderL1Document(docWithSlot(), { mounts: { elsewhere: '<b>x</b>' } })
    expect(other.html).not.toContain('<b>x</b>')

    // The fragment lands INSIDE the seam's own element rather than replacing it,
    // so the seam's geometry and sizing still apply to whatever mounted.
    expect(mounted.html).toMatch(
      /<div class="[^"]*"[^>]*data-l1-slot="form-0"[^>]*>\s*<form data-contact-form><\/form>\s*<\/div>/,
    )

    // The seam is emitted identically in both states: same opening tag (class,
    // `data-l1-slot`, `data-l1-behavior`) and the same emitted rule. Mounting is
    // therefore invisible to the seam's measure — the guarantee AC-804 rests on.
    expect(seamTagOf(mounted.html)).toBe(seamTagOf(bare.html))
    const seamRule = seamRuleOf(bare)
    expect(seamRule, 'the seam emits no rule — the comparison below would be vacuous').not.toBe('')
    expect(seamRuleOf(mounted)).toBe(seamRule)
    // …and mounting contributes no stylesheet of its own anywhere in the document.
    expect(mounted.css).toBe(bare.css)
  })

  it('test_UAT_FC_REQ-93_reproduction_renders_real_a11y_labelled_controls', async () => {
    // End to end through the operator pipeline: a bundle whose fold carries a form
    // → `1c repro` → `1c render`. The rendered page must carry a functional,
    // a11y-labelled control per captured field, mounted inside its L1 seam.
    const forms: FoldedForm[] = []
    const doc = foldToL1(twoFormCapture(), { forms })
    const ref = path.join(cwd, 'bundle')
    writeL1(ref, doc)
    writeForms(ref, forms)

    const result = cmdRepro('gigabyte', { cwd, ref })
    expect(result.forms.map((f) => f.slot)).toEqual(['form-0', 'form-1'])

    const { outDir } = await cmdRender('gigabyte', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Each captured field is a real control with a programmatic label.
    for (const label of ['Your email address', 'Your name', 'Your email', 'Your message']) {
      expect(html).toContain(`>${label}</label>`)
    }
    expect(html).toContain('id="cf-your-message"')
    // The multi-line control is a textarea; the single-line ones are inputs.
    expect(html).toMatch(/<textarea[^>]*id="cf-your-message"/)
    expect(html).toMatch(/<input[^>]*id="cf-your-name"/)
    // Mounted INSIDE the seam, not appended beside the page body.
    expect(html).toMatch(/data-l1-slot="form-1"[^>]*>\s*<section[^>]*class="contact-form"/)
    // Both instances are on the page, each stamped with its own instance id.
    expect(html).toContain('data-fc-module="form-0"')
    expect(html).toContain('data-fc-module="form-1"')
  })

  it('test_UAT_FC_REQ-93_part_stale_bundle_fails_rather_than_stranding_the_behaviour', () => {
    // `l1.json` and `forms.json` are written by ONE fold, so disagreeing seams
    // mean the bundle is part-stale. Importing it anyway would render the
    // behaviours as inert placeholders — the exact stranding this change ends —
    // so it fails loudly, naming the mismatch and the fix.
    const doc = foldToL1(twoFormCapture(), { forms: [] })
    const ref = path.join(cwd, 'bundle')
    writeL1(ref, doc) // seams present…
    // …no forms.json at all (a bundle folded before this change).
    expect(() => cmdRepro('gigabyte', { cwd, ref })).toThrow(/slot 'form-0' has no binding/)
    expect(() => cmdRepro('gigabyte', { cwd, ref })).toThrow(/Re-capture with/)

    // …and the mirror image: a binding for a seam the document does not carry.
    writeForms(ref, [{ slot: 'ghost', behavior: 'contact-form', fields: [], residuals: [] }])
    expect(() => cmdRepro('gigabyte', { cwd, ref })).toThrow(/binds slot 'ghost', absent from l1\.json/)
  })

  // ── 5. conformance ─────────────────────────────────────────────────────────

  it('test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations', async () => {
    // A mounted behaviour is a shipping shape, so the universal ACs must be
    // checkable against it exactly as against a standalone one. Prove the harness
    // actually mounts (rather than silently ignoring the flag) by inspecting what
    // it served: the page it renders is the slot-bound composition, and the
    // behaviour's markup is inside the seam.
    const served = await serveOneModulePage('contact-form', mountedContactFixture, {
      mountInL1: true,
    })
    try {
      const page = JSON.parse(
        readFileSync(path.join(served.root, 'storage', 'sites', 'contact-form', 'draft', 'pages', 'home.json'), 'utf8'),
      ) as { l1?: unknown; modules: Array<{ slot?: string }> }
      // The served page really is the slot-bound composition (schema-validated on
      // the way in — `serveOneModulePage` throws on an invalid page).
      expect(page.l1).toBeDefined()
      expect(page.modules[0].slot).toBe('mount')

      const html = readFileSync(path.join(served.handle.rootDir, 'index.html'), 'utf8')
      expect(html).toMatch(/data-l1-slot="mount"[^>]*>\s*<section[^>]*class="contact-form"/)
      expect(html).toContain('>Your email</label>')
    } finally {
      await served.dispose()
    }
  })

  it('test_UAT_AC1624_mounted_host_pins_the_seam_at_every_probed_width', () => {
    // The host is deliberately non-interfering, and this is what that means
    // concretely — pure page data, so it is checkable with no server and no
    // browser. Anything else would leave "a failure the mode reports is always
    // the module's" resting on a comment.
    const version = latestModuleVersion('contact-form')
    const mounted = oneModulePage('contact-form', mountedContactFixture, version, {
      mountInL1: true,
    }) as {
      l1: { widths: number[]; root: { children: Array<Record<string, never>> } }
      modules: Array<Record<string, unknown>>
    }
    const seam = mounted.l1.root.children[0] as unknown as {
      kind: string
      name: string
      geometry: { keyframes: Array<{ at: number; x: number; width: number }> }
    }
    expect(seam.kind).toBe('slot')
    // A keyframe at EVERY width the responsive dimension probes…
    expect(mounted.l1.widths).toEqual([...RESPONSIVE_WIDTHS])
    expect(seam.geometry.keyframes.map((k) => k.at)).toEqual([...RESPONSIVE_WIDTHS])
    // …each pinning the seam to exactly the viewport, so the wrapper can never
    // itself be the thing that overflows.
    for (const k of seam.geometry.keyframes) {
      expect(k.x).toBe(0)
      expect(k.width).toBe(k.at)
    }
    expect(mounted.modules[0].slot).toBe(seam.name)

    // And mounting only ADDS a position: the instance the dimensions inspect is
    // otherwise the same object the standalone run builds.
    const standalone = oneModulePage('contact-form', mountedContactFixture, version, {}) as {
      l1?: unknown
      modules: Array<Record<string, unknown>>
    }
    expect(standalone.l1).toBeUndefined()
    expect(standalone.modules[0].slot).toBeUndefined()
    expect({ ...mounted.modules[0], slot: undefined }).toEqual({
      ...standalone.modules[0],
      slot: undefined,
    })
  })

  it('test_UAT_AC1624_mounting_weakens_no_dimension', async () => {
    // The headline claim: the mounted position runs *the same* five dimensions,
    // not a reduced set. Iterate the harness's own enumeration rather than
    // restating it, so a sixth dimension cannot be added past this UAT.
    expect([...CONFORMANCE_DIMENSIONS].sort()).toEqual([
      'isolation',
      'responsive',
      'safety',
      'security',
      'x-browser',
    ])
    // Each run is deliberately defective, and the checks each dimension owes are
    // named — a dimension that silently did nothing in the mounted position, or
    // that ran a *reduced* set of its own checks there, both fail here. A
    // clean-fixture comparison could tell neither from "same verdict".
    const OWED: Record<ConformanceDimension, string[]> = {
      safety: ['safety.overflow'],
      security: ['security.url-scheme'],
      responsive: ['responsive.tap-target', 'safety.overflow'],
      'x-browser': ['x-browser.layout-shift'],
      isolation: ['isolation.render-throws'],
    }
    for (const dimension of CONFORMANCE_DIMENSIONS) {
      const standalone = await reportedAcs(dimension, false)
      const mounted = await reportedAcs(dimension, true)
      expect(standalone, `${dimension} standalone`).toEqual(OWED[dimension])
      expect(mounted, `${dimension} reports a different verdict once mounted`).toEqual(standalone)
    }
  }, 180000)

  it.runIf(HAVE_CHROMIUM)(
    'test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension',
    async () => {
      // The reason the mode exists. A fixture that is clean under a desktop sweep
      // but overflows its container in the mobile band is still a violation once
      // pinned inside the seam — flagged there exactly as it would be standalone.
      const opts = {
        dimension: 'responsive' as const,
        driverFactory: createPlaywrightDriver,
        resolveModule: resolveMobileOverflow,
        mountInL1: true,
        keepSandboxOnFailure: false,
      }
      const err = await assertModuleConforms(
        'fc-mobile-overflow',
        [{ label: 'mounted-mobile-overflow', props: {} }],
        opts,
      ).then(
        () => null,
        (e: unknown) => e as ConformanceError,
      )
      expect(err).toBeInstanceOf(ConformanceError)
      expect(
        err?.violations.some(
          (v) => v.ac === 'safety.overflow' && (v.viewport === '320' || v.viewport === '375'),
        ),
      ).toBe(true)

      // …and the same mounted fixture swept only at desktop widths is clean, so
      // the flag above is the module's own defect and never the seam's.
      await expect(
        assertModuleConforms('fc-mobile-overflow', [{ label: 'mounted-desktop', props: {} }], {
          ...opts,
          viewports: [768, 1024, 1280, 1440],
        }),
      ).resolves.toBeUndefined()
    },
    180000,
  )
})
