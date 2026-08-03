/**
 * story-02f21b8a — **a reproduced page is its L1 layout plus the behaviours
 * mounted into it, each bound to a named seam.**
 *
 * A real captured marketing page is layout *plus* behaviour. Until this
 * capability existed a page had to be either a stack of behavior modules or a
 * single L1 document — never both — so the behavioural half of every
 * reproduction was permanently unrepresentable. The rule the old exclusivity was
 * protecting ("no two competing page bodies") survives in a narrower form: the
 * L1 document remains the single page body, and a behavior module may accompany
 * it only when it is **bound by name to a seam that exists in that body**.
 *
 * These UATs prove that composition end to end:
 *   AC-782  the composed page shape validates, as do both single halves
 *   AC-783  every unresolvable binding is an error with a machine-readable path
 *   AC-784  captured controls fold to one seam per form at the form's union rect
 *   AC-785  clustering separates side-by-side forms on a size-derived scale
 *   AC-786  a captured button beside a form becomes that form's submit control
 *   AC-787  a bound seam hosts the fragment; an unbound seam stays inert
 *   AC-788  several instances of one behaviour mount independently
 *   AC-789  the mounted composition is checkable by the conformance harness
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultTokens, latestModuleVersion, renderL1Document } from '../packages/framework/src/index'
import { validateSite, type L1Document } from '../packages/site-schema/src/index'
import { clusterControls, foldToL1 } from '../tools/generate/src/l1'
import type { ControlRow, FoldedForm, FoldResidual } from '../tools/generate/src/l1'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { cmdRender } from '../tools/generate/src/cli/commands'
import { writeForms, writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { serveOneModulePage } from '../tools/generate/src/conformance'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

/** The sampled width ladder every fixture capture is taken at. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** The retained third-party capture that motivated the story (gitignored). */
const GIGABYTE = path.join(process.cwd(), 'storage', 'references', 'gigabytealchemy.ai', 'index', 'multistate.json')

// ── fixtures ─────────────────────────────────────────────────────────────────

interface Box {
  x: number
  y: number
  width: number
  height: number
}

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
function control(over: Partial<ValueElement> & { accessibleName: string }): ValueElement {
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

/** A captured submit affordance: a painted run the a11y tree calls a button. */
function buttonEl(text: string, box: Box): ValueElement {
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
    // (BUG-21), so the chip axes ride on the text leaf rather than an inferred card.
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
    manifest: { source: `seam@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 900 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** Two visibly separate forms: a one-field signup, and a three-field contact. */
const SIGNUP_BOX: Box = { x: 20, y: 300, width: 240, height: 50 }
const CONTACT_BOXES: Box[] = [
  { x: 20, y: 900, width: 400, height: 50 },
  { x: 20, y: 966, width: 400, height: 50 },
  { x: 20, y: 1032, width: 400, height: 150 },
]

function twoFormCapture(): MultiStateCapture {
  return multiFrom((w) => [
    textEl(w, 'Get in touch', 100),
    control({ accessibleName: 'Your email address', box: SIGNUP_BOX }),
    control({ accessibleName: 'Your name', box: CONTACT_BOXES[0] }),
    control({ accessibleName: 'Your email', box: CONTACT_BOXES[1] }),
    control({ accessibleName: 'Your message', box: CONTACT_BOXES[2] }),
  ])
}

/**
 * The same two forms, each with its own button just below it, plus an unrelated
 * page-level call-to-action far away. The gaps mirror the reference's own scale:
 * each form's button sits 18px under its fields against a 75px threshold, while
 * the page-level one is an order of magnitude further off.
 */
const SUBSCRIBE_BOX: Box = { x: 20, y: 368, width: 140, height: 48 }
const SEND_BOX: Box = { x: 20, y: 1200, width: 170, height: 48 }
const DOCS_BOX: Box = { x: 20, y: 2000, width: 150, height: 48 }

function twoFormsWithButtonsCapture(): MultiStateCapture {
  return multiFrom((w) => [
    textEl(w, 'Get in touch', 100),
    control({ accessibleName: 'Your email address', box: SIGNUP_BOX }),
    buttonEl('Subscribe', SUBSCRIBE_BOX),
    control({ accessibleName: 'Your name', box: CONTACT_BOXES[0] }),
    control({ accessibleName: 'Your email', box: CONTACT_BOXES[1] }),
    control({ accessibleName: 'Your message', box: CONTACT_BOXES[2] }),
    buttonEl('Send message', SEND_BOX),
    // An unrelated call-to-action elsewhere on the page — never a form control.
    buttonEl('Read the docs', DOCS_BOX),
  ])
}

// ── helpers ──────────────────────────────────────────────────────────────────

interface SlotNode {
  kind: string
  name: string
  behavior?: string
  geometry?: { keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> }
}

function slotsOf(doc: L1Document): SlotNode[] {
  const children = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
  return children.filter((n) => n.kind === 'slot') as unknown as SlotNode[]
}

/** Every text run still painted as a page-level leaf of the document body. */
function textsOf(doc: L1Document): string[] {
  const out: string[] = []
  const walk = (n: { kind: string; text?: string; children?: unknown[] }): void => {
    if (n.kind === 'text' && n.text) out.push(n.text)
    for (const c of (n.children ?? []) as Array<typeof n>) walk(c)
  }
  walk(doc.root as never)
  return out
}

/** The union of `boxes` — what a form's seam must be pinned at. */
function unionOf(boxes: Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  const right = Math.max(...boxes.map((b) => b.x + b.width))
  const bottom = Math.max(...boxes.map((b) => b.y + b.height))
  return { x, y, width: right - x, height: bottom - y }
}

function containsBox(outer: Box, inner: Box): boolean {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height
  )
}

/**
 * The inner HTML of the seam named `name` — the content of its own positioned
 * box, extracted by matching the seam `<div>`'s close tag rather than by
 * slicing, so nested module markup cannot leak between two seams.
 */
function seamContent(html: string, name: string): string {
  const at = html.indexOf(`data-l1-slot="${name}"`)
  expect(at, `seam ${name} is present in the rendered page`).toBeGreaterThanOrEqual(0)
  const start = html.indexOf('>', at) + 1
  let i = start
  let depth = 1
  for (;;) {
    const nextOpen = html.indexOf('<div', i)
    const nextClose = html.indexOf('</div>', i)
    expect(nextClose, `seam ${name} closes`).toBeGreaterThanOrEqual(0)
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1
      i = nextOpen + 4
      continue
    }
    depth -= 1
    if (depth === 0) return html.slice(start, nextClose)
    i = nextClose + 6
  }
}

const baseSite = {
  id: 'gigabyte',
  config: { businessName: 'Gigabyte', tagline: '' },
  theme: defaultTokens,
  nav: { pattern: 'top-tabs' as const, entries: [] },
  assets: [],
}

/** A minimal L1 document whose body carries one named seam. */
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

const contactInstance = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'form-0',
  type: 'contact-form',
  version: latestModuleVersion('contact-form'),
  slot: 'form-0',
  config: { action: '', fields: [{ name: 'email', label: 'Your email', type: 'email', required: false }] },
  ...over,
})

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-seam-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

// ── AC-782 — the composed page shape ─────────────────────────────────────────

describe('story-02f21b8a — an L1 body and its mounted behaviours are one page', () => {
  it('test_UAT_AC782_l1_body_with_seam_bound_instances_validates_as_one_page', () => {
    // The headline change: `l1` + a behaviour instance is legal *because* the
    // instance names a seam that exists in the tree. The L1 document is still the
    // single page body; the behaviour mounts into it.
    const composed = validateSite({
      ...baseSite,
      pages: [{ id: 'home', slug: 'home', title: 'Home', l1: docWithSlot(), modules: [contactInstance()] }],
    })
    expect(composed.ok).toBe(true)
    if (!composed.ok) expect(composed.errors).toEqual([])

    // Two seams, two instances, no seam named twice — still one page.
    const twoSeams = {
      widths: [375, 1280],
      root: {
        kind: 'box',
        children: [
          { kind: 'slot', name: 'form-0', behavior: 'contact-form' },
          { kind: 'slot', name: 'form-1', behavior: 'contact-form' },
        ],
      },
    } as unknown as L1Document
    const pair = validateSite({
      ...baseSite,
      pages: [
        {
          id: 'home',
          slug: 'home',
          title: 'Home',
          l1: twoSeams,
          modules: [contactInstance(), contactInstance({ id: 'form-1', slot: 'form-1' })],
        },
      ],
    })
    expect(pair.ok).toBe(true)

    // …and both single-half shapes remain valid page shapes.
    const l1Only = validateSite({
      ...baseSite,
      pages: [{ id: 'home', slug: 'home', title: 'Home', l1: docWithSlot() }],
    })
    expect(l1Only.ok).toBe(true)

    const modulesOnly = validateSite({
      ...baseSite,
      pages: [{ id: 'home', slug: 'home', title: 'Home', modules: [contactInstance({ slot: undefined })] }],
    })
    expect(modulesOnly.ok).toBe(true)
  })

  // ── AC-783 — every unresolvable binding is a located error ─────────────────

  it('test_UAT_AC783_unresolvable_bindings_fail_with_a_machine_readable_path', () => {
    // Binding is resolved, never best-effort. Each way it can fail is an error
    // carrying a path an automated caller can self-correct from — never a silent
    // no-op and never a dropped instance.
    const cases: Array<{ label: string; page: Record<string, unknown>; match: RegExp; where: RegExp }> = [
      {
        label: '1. an instance accompanies an L1 body without naming any seam',
        page: {
          id: 'home',
          slug: 'home',
          title: 'H',
          l1: docWithSlot(),
          modules: [contactInstance({ slot: undefined })],
        },
        // …and the message names the seams that were available.
        match: /must name the L1 slot it mounts into \(available: form-0\)/,
        where: /^\/pages\/0\/modules\/0\/slot$/,
      },
      {
        label: '2. an instance names a seam not present in the L1 document',
        page: { id: 'home', slug: 'home', title: 'H', l1: docWithSlot('mount'), modules: [contactInstance()] },
        match: /no slot named 'form-0' in the page's L1 tree \(available: mount\)/,
        where: /^\/pages\/0\/modules\/0\/slot$/,
      },
      {
        label: '3. two instances name the same seam',
        page: {
          id: 'home',
          slug: 'home',
          title: 'H',
          l1: docWithSlot(),
          modules: [contactInstance(), contactInstance({ id: 'form-0b' })],
        },
        match: /slot 'form-0' is bound by more than one module/,
        where: /^\/pages\/0\/modules\/1\/slot$/,
      },
      {
        label: '4. an instance names a seam on a page carrying no L1 body',
        page: { id: 'home', slug: 'home', title: 'H', modules: [contactInstance()] },
        match: /no L1 document to mount into/,
        where: /^\/pages\/0\/modules\/0\/slot$/,
      },
      {
        label: '5. the L1 document carries two seams sharing one name',
        page: {
          id: 'home',
          slug: 'home',
          title: 'H',
          l1: {
            widths: [375, 1280],
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
        match: /duplicate L1 slot name 'form-0' — a mount point must be unambiguous/,
        // …reported against the document, not against an instance.
        where: /^\/pages\/0\/l1$/,
      },
    ]

    for (const c of cases) {
      const result = validateSite({ ...baseSite, pages: [c.page] })
      expect(result.ok, c.label).toBe(false)
      if (result.ok) continue
      const located = result.errors.filter((e) => c.match.test(e.message) && c.where.test(e.path))
      expect(located.length, `${c.label} — located error`).toBeGreaterThan(0)
    }
  })

  // ── AC-784 — one seam per form, at the form's own union rect ───────────────

  it('test_UAT_AC784_controls_fold_to_one_seam_per_form_at_the_forms_union_rect', () => {
    const residuals: FoldResidual[] = []
    const forms: FoldedForm[] = []
    const doc = foldToL1(twoFormCapture(), { residuals, forms })

    // No captured control is stranded: every one that had geometry mounted.
    expect(residuals.filter((r) => r.kind === 'field')).toEqual([])

    // One seam per form, each naming the behaviour it hosts.
    const seams = slotsOf(doc)
    expect(seams.map((s) => s.name)).toEqual(['form-0', 'form-1'])
    expect(seams.map((s) => s.behavior)).toEqual(['contact-form', 'contact-form'])

    // Each seam carries a keyframe at every sampled width, and at each width its
    // rect is the union of its OWN controls' captured rects at that width.
    const expected: Record<string, Box> = {
      'form-0': unionOf([SIGNUP_BOX]),
      'form-1': unionOf(CONTACT_BOXES),
    }
    for (const seam of seams) {
      const keyframes = seam.geometry?.keyframes ?? []
      expect(keyframes.map((k) => k.at), seam.name).toEqual(LADDER)
      const want = expected[seam.name]
      for (const kf of keyframes) {
        expect({ x: kf.x, y: kf.y, width: kf.width, height: kf.height }, `${seam.name}@${kf.at}`).toEqual(want)
      }
    }

    // …accompanied by exactly one binding naming each seam, in document order.
    expect(forms.map((f) => f.slot)).toEqual(['form-0', 'form-1'])
    expect(forms.map((f) => f.behavior)).toEqual(['contact-form', 'contact-form'])
    expect(forms[0].fields.map((f) => f.label)).toEqual(['Your email address'])
    expect(forms[1].fields.map((f) => f.label)).toEqual(['Your name', 'Your email', 'Your message'])

    // A control the capture placed nowhere has nothing to mount at, so it is
    // still reported as a named gap identifying the control and the reason.
    const ghostResiduals: FoldResidual[] = []
    const ghostForms: FoldedForm[] = []
    const ghostDoc = foldToL1(
      multiFrom(() => [control({ accessibleName: 'Ghost field', box: undefined })]),
      { residuals: ghostResiduals, forms: ghostForms },
    )
    expect(slotsOf(ghostDoc)).toEqual([])
    expect(ghostForms).toEqual([])
    const gap = ghostResiduals.find((r) => r.kind === 'field')
    expect(gap, 'a geometry-less control is reported as a gap').toBeDefined()
    expect(gap!.reason).toMatch(/form control has no geometry at any sampled width/)
  })

  // ── AC-785 — clustering separates side-by-side forms ───────────────────────

  it('test_UAT_AC785_clustering_separates_side_by_side_forms_at_the_widest_width', () => {
    // Two forms in adjacent columns are as close *vertically* as one form's own
    // fields are, so grouping cannot key on vertical gap alone. It clusters on
    // rect distance at the widest sample, where the columns are most separated.
    const rowsAt = (scale: number): ControlRow[] => {
      const at = (x: number, y: number, name: string): ControlRow => {
        const box = { x: x * scale, y: y * scale, width: 300 * scale, height: 50 * scale }
        return { samples: [{ at: 1280, element: control({ accessibleName: name, box }), box }] }
      }
      return [
        at(88, 3900, 'signup-email'),
        at(664, 3784, 'contact-name'),
        at(664, 3850, 'contact-email'),
        at(664, 3916, 'contact-message'),
      ]
    }
    const nameOf = (row: ControlRow): string => row.samples[0].element.accessibleName ?? ''

    const groups = clusterControls(rowsAt(1))
    // Two groups, ordered topmost-first: the 3-field column starts at y=3784,
    // above the single signup field at y=3900. Each group's members are ordered
    // the same way (top to bottom, then left to right).
    expect(groups.map((g) => g.length)).toEqual([3, 1])
    expect(groups.map((g) => g.map(nameOf))).toEqual([
      ['contact-name', 'contact-email', 'contact-message'],
      ['signup-email'],
    ])
    // The signup field is zero apart in VERTICAL distance from the contact
    // column's middle field — nearer than that column's own fields are to each
    // other (16px) — so only horizontal separation can split the two forms.
    const vGap = (a: { y: number; height: number }, b: { y: number; height: number }): number =>
      Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height))
    expect(vGap({ y: 3900, height: 50 }, { y: 3850, height: 50 })).toBe(0)
    expect(vGap({ y: 3784, height: 50 }, { y: 3850, height: 50 })).toBe(16)

    // The proximity scale is derived from the controls' own size, not a fixed
    // pixel constant: at 8x, the within-form gap alone (128px) would exceed any
    // plausible constant, yet the same two groups come back.
    const scaled = clusterControls(rowsAt(8))
    expect(scaled.map((g) => g.length)).toEqual([3, 1])
    expect(scaled.map((g) => g.map(nameOf))).toEqual([
      ['contact-name', 'contact-email', 'contact-message'],
      ['signup-email'],
    ])

    // The real multi-form capture splits the same way, with the right labels.
    if (!existsSync(GIGABYTE)) return // the retained capture is gitignored third-party material
    const forms: FoldedForm[] = []
    foldToL1(JSON.parse(readFileSync(GIGABYTE, 'utf8')) as MultiStateCapture, { forms })
    expect(forms.map((f) => f.fields.length).sort()).toEqual([1, 3])
    const perForm = forms.map((f) => f.fields.map((x) => x.label).sort()).sort()
    expect(perForm).toEqual([['Your email address'], ['Your email', 'Your message', 'Your name']])
  })

  // ── AC-786 — the reference's own button becomes the form's submit control ──

  it('test_UAT_AC786_a_button_beside_a_form_becomes_that_forms_submit_control', () => {
    const forms: FoldedForm[] = []
    const doc = foldToL1(twoFormsWithButtonsCapture(), { forms })
    expect(forms.map((f) => f.slot)).toEqual(['form-0', 'form-1'])

    // Each form's binding carries a submit appearance…
    const submits = forms.map((f) => f.submit as unknown as Record<string, unknown> | undefined)
    expect(submits.every(Boolean), 'both forms claimed a submit control').toBe(true)
    for (const submit of submits) {
      const axes = submit!.axes as Record<string, unknown>
      // …its type axes, fill, rounding, padding and line treatment travel with it…
      expect(axes.surfaceFill).toBe('#0f172b')
      expect(axes.borderRadiusPx).toBe(8)
      expect(axes.color).toBe('#ffffff')
      expect(axes.fontSizePx).toBe(16)
      expect(submit!.padding).toEqual({ topPx: 12, rightPx: 24, bottomPx: 12, leftPx: 24 })
      // …but its page-absolute placement does NOT: the hosting behaviour owns it.
      expect(submit!.geometry).toBeUndefined()
      expect(submit!.visibility).toBeUndefined()
    }

    // A button claimed by one form is never also claimed by another.
    expect(submits.map((s) => s!.text).sort()).toEqual(['Send message', 'Subscribe'])

    // Each seam's rect contains its own button's rect at every sampled width, so
    // the mounted control renders inside its own seam.
    const seams = slotsOf(doc)
    const button: Record<string, Box> = { 'form-0': SUBSCRIBE_BOX, 'form-1': SEND_BOX }
    for (const seam of seams) {
      const keyframes = seam.geometry?.keyframes ?? []
      expect(keyframes.map((k) => k.at), seam.name).toEqual(LADDER)
      for (const kf of keyframes) {
        const rect = { x: kf.x, y: kf.y, width: kf.width, height: kf.height ?? 0 }
        expect(containsBox(rect, button[seam.name]), `${seam.name}@${kf.at} contains its button`).toBe(true)
      }
    }

    // Neither button remains a standalone element of the page body — the
    // reference's single button is painted once, not duplicated by an inert one.
    const texts = textsOf(doc)
    expect(texts).not.toContain('Subscribe')
    expect(texts).not.toContain('Send message')

    // A captured button outside that proximity scale from every form stays an
    // ordinary element of the page body and is claimed by no form.
    expect(texts).toContain('Read the docs')
    expect(JSON.stringify(forms)).not.toContain('Read the docs')
  })

  // ── AC-787 — a bound seam hosts the fragment; an unbound seam stays inert ──

  it('test_UAT_AC787_a_bound_seam_hosts_the_fragment_and_an_unbound_seam_stays_inert', async () => {
    // Bound: the fragment is the content of the seam's OWN positioned box, which
    // keeps its seam name — the markup is nested inside it, not appended beside
    // the page body.
    const bound = renderL1Document(docWithSlot(), { mounts: { 'form-0': '<form data-contact-form></form>' } })
    expect(bound.html).toContain('data-l1-slot="form-0"')
    expect(seamContent(bound.html, 'form-0')).toBe('<form data-contact-form></form>')

    // Unbound: the box is an inert placeholder labelled with the seam name and
    // the behaviour it expects, containing no behaviour markup.
    const bare = renderL1Document(docWithSlot())
    expect(bare.html).toContain('data-l1-slot="form-0"')
    expect(bare.html).toContain('data-l1-behavior="contact-form"')
    expect(seamContent(bare.html, 'form-0')).toBe('')

    // Markup offered for a name that is not a seam in the document appears nowhere.
    const stray = renderL1Document(docWithSlot(), { mounts: { elsewhere: '<b data-stray></b>' } })
    expect(stray.html).not.toContain('data-stray')
    expect(seamContent(stray.html, 'form-0')).toBe('')

    // End to end through the operator pipeline: fold → `1c repro` → `1c render`.
    const forms: FoldedForm[] = []
    const doc = foldToL1(twoFormCapture(), { forms })
    const ref = path.join(cwd, 'bundle')
    writeL1(ref, doc)
    writeForms(ref, forms)
    cmdRepro('gigabyte', { cwd, ref })
    const { outDir } = await cmdRender('gigabyte', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The behaviour's markup is nested WITHIN the seam's box in the published page.
    expect(seamContent(html, 'form-1')).toMatch(/<section[^>]*class="contact-form"/)
    expect(seamContent(html, 'form-1')).toContain('>Your message</label>')
  })

  // ── AC-788 — several instances of one behaviour mount independently ────────

  it('test_UAT_AC788_two_instances_of_one_behaviour_mount_independently_per_seam', async () => {
    // A page binding two instances of the same behaviour to two different seams
    // renders both — each inside its own seam's box, each with its own identity
    // and its own scoped styling, each carrying only its own form's content.
    const forms: FoldedForm[] = []
    const doc = foldToL1(twoFormsWithButtonsCapture(), { forms })
    const ref = path.join(cwd, 'bundle')
    writeL1(ref, doc)
    writeForms(ref, forms)
    const imported = cmdRepro('gigabyte', { cwd, ref })
    expect(imported.forms.map((f) => f.slot)).toEqual(['form-0', 'form-1'])

    const { outDir } = await cmdRender('gigabyte', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Markup for both instances is present, each stamped with its own identity.
    expect(html).toContain('data-fc-module="form-0"')
    expect(html).toContain('data-fc-module="form-1"')

    const seam0 = seamContent(html, 'form-0')
    const seam1 = seamContent(html, 'form-1')
    // Each seam's box contains exactly its own instance's markup…
    expect(seam0).toContain('data-fc-module="form-0"')
    expect(seam0).not.toContain('data-fc-module="form-1"')
    expect(seam1).toContain('data-fc-module="form-1"')
    expect(seam1).not.toContain('data-fc-module="form-0"')

    // …and each instance's controls match the fields of the form it was bound to:
    // one instance's fields never appear inside the other's seam.
    expect(seam0).toContain('>Your email address</label>')
    for (const label of ['Your name', 'Your email', 'Your message']) {
      expect(seam1, `form-1 renders ${label}`).toContain(`>${label}</label>`)
      expect(seam0, `form-0 does not render ${label}`).not.toContain(`>${label}</label>`)
    }
    expect(seam1).not.toContain('>Your email address</label>')

    // Styling is scoped per instance, so the two cannot collide: each instance's
    // L1 submit subtree renders under its own class namespace.
    expect(seam0).toMatch(/class="form-0-submit-l1-\d+"/)
    expect(seam1).toMatch(/class="form-1-submit-l1-\d+"/)
    expect(seam0).not.toMatch(/class="form-1-submit-l1-\d+"/)
    expect(seam1).not.toMatch(/class="form-0-submit-l1-\d+"/)
    // Each carries the reference's own button text, not the other's.
    expect(seam0).toContain('Subscribe')
    expect(seam0).not.toContain('Send message')
    expect(seam1).toContain('Send message')
    expect(seam1).not.toContain('Subscribe')
  })

  // ── AC-789 — obligations are checkable in the shipping position ────────────

  it('test_UAT_AC789_universal_obligations_are_checkable_in_the_mounted_position', async () => {
    // A mounted behaviour is a shipping shape, so the universal obligations must
    // be checkable against the composition, not only a standalone instance.
    // Prove the harness really mounts (rather than ignoring the flag) by
    // inspecting what it served.
    const served = await serveOneModulePage(
      'contact-form',
      {
        label: 'mounted-contact-form',
        props: {
          version: latestModuleVersion('contact-form'),
          config: { action: '/leads', fields: [{ name: 'email', label: 'Your email', type: 'email' }] },
        },
      },
      { mountInL1: true },
    )
    try {
      const draft = path.join(served.root, 'storage', 'sites', 'contact-form', 'draft')
      const page = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8')) as {
        l1?: { root: { children: Array<{ kind: string; name: string; geometry?: { keyframes: Array<{ at: number }> } }> } }
        modules: Array<{ slot?: string }>
      }
      const site = JSON.parse(readFileSync(path.join(draft, 'site.json'), 'utf8')) as Record<string, unknown>

      // The page it serves in this mode is a valid composed page: it carries an
      // L1 body, and the instance is bound to a seam present in that body.
      expect(page.l1).toBeDefined()
      const seam = page.l1!.root.children.find((n) => n.kind === 'slot')
      expect(seam).toBeDefined()
      expect(page.modules[0].slot).toBe(seam!.name)

      // It passed validation on the way in — an invalid composition is refused
      // rather than served (`serveOneModulePage` throws on an invalid page).
      expect(validateSite({ ...site, pages: [page] }).ok).toBe(true)
      const broken = { ...page, modules: [{ ...page.modules[0], slot: 'not-a-seam' }] }
      expect(validateSite({ ...site, pages: [broken] }).ok).toBe(false)

      // The seam spans every probed viewport width, so the mounted behaviour is
      // measurable at each cell of the ladder the obligations run over.
      expect(seam!.geometry?.keyframes.map((k) => k.at)).toEqual([320, 375, 768, 1024, 1280, 1440])

      // …and the served markup nests the behaviour's own markup inside that seam.
      const html = readFileSync(path.join(served.handle.rootDir, 'index.html'), 'utf8')
      const content = seamContent(html, seam!.name)
      expect(content).toMatch(/<section[^>]*class="contact-form"/)
      expect(content).toContain('>Your email</label>')
    } finally {
      await served.dispose()
    }
  })
})
