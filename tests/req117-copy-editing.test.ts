import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { cmdNew, cmdPublish, cmdRender } from '../tools/generate/src/cli/commands'
import { run } from '../tools/generate/src/cli'
import { mountL1EditBridge, resolveEditTarget } from '../packages/framework/src/l1/edit-client'
import type { L1EditHit } from '../packages/framework/src/l1/edit-client'
import { L1_EDIT_HOT_CLASS } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * REQ-117 — **copy editing, end to end** (DOC-28 §4, §9.1, §11): click a segment,
 * edit its words, and see the page re-render with the change saved.
 *
 * Two real entry points, and nothing between them is stubbed:
 *
 * - the **client half** runs against the bytes `1c render --edit` actually wrote,
 *   parsed by a real DOM, driven by real click and pointer events;
 * - the **write half** runs through `1c` itself — argv in, `{ok,data}` envelope
 *   and exit code out — so what is under test is the command an editor host will
 *   call, not a function it happens to reach.
 *
 * The two meet where the loop does: an address the client read off a clicked
 * element is handed verbatim to the command as its target.
 */

const HEADLINE = 'A painted band.'
/** A run far wider than its box — DOC-28 §9.1's "copy that no longer fits". */
const LONG_COPY =
  'A headline long enough that the box it was authored for cannot hold it, which is accepted: the user gets the words they asked for and tidies the layout with the AI afterwards.'
const SLIDE_ONE = 'The first slide.'
const FORM_INTRO = 'Tell us what you are building.'

/**
 * One page carrying every case the loop has to survive: nested segments (copy
 * inside a painted container), a run wider than its box, a segment with no copy
 * at all, and copy inside both flavours of behavior-module slot — a repeated one
 * (carousel slides) and a single-subtree one (the contact form).
 */
function seedPage(cwd: string, slug: string): Record<string, unknown> {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      // [0.0] a PAINTED container — a segment in its own right, and the parent
      // whose child a click has to win against (AC9).
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: '#101822' },
        children: [
          { kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }, // [0.0.0]
          { kind: 'text', text: LONG_COPY, axes: { fontSizePx: 18 } }, // [0.0.1]
        ],
      },
      // [0.1] an image — a real segment that exposes no phase-1 copy (AC1).
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
      // [0.2] / [0.3] the seams the two behavior modules mount into.
      { kind: 'slot', name: 'gallery' },
      { kind: 'slot', name: 'get-in-touch' },
    ],
  }

  home.l1.root = root
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: { slide: [{ kind: 'text', text: SLIDE_ONE }] },
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
          children: [
            { kind: 'text', text: FORM_INTRO },
            { kind: 'control', control: 'email' },
            { kind: 'control', control: 'submit' },
          ],
        },
      },
    },
  ]
  writeFileSync(homePath, JSON.stringify(home, null, 2))
  return home
}

/** The edit render's bytes, as a real DOM the client can be pointed at. */
async function editDom(cwd: string, slug: string): Promise<JSDOM> {
  const { outDir } = await cmdRender(slug, { cwd, edit: true })
  return new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8'))
}

async function editHtml(cwd: string, slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, edit: true })
  return readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** The element whose rendered text is exactly `copy`, in an edit render. */
function elementShowing(dom: JSDOM, copy: string): Element {
  const el = [...dom.window.document.querySelectorAll('*')].find(
    (n) => n.children.length === 0 && n.textContent === copy,
  )
  if (!el) throw new Error(`no element renders the copy ${JSON.stringify(copy)}`)
  return el
}

/** Click `el` the way a user would, and report what the bridge resolved. */
function clickAndResolve(dom: JSDOM, el: Element): L1EditHit | null {
  let hit: L1EditHit | null = null
  const bridge = mountL1EditBridge(dom.window.document, (h) => {
    hit = h
  })
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
  bridge.destroy()
  return hit
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
}

/**
 * Drive the real `1c` entry point. `run` reads the working directory from the
 * process, so the test supplies one the same way a shell would — and restores it,
 * along with the exit code the command set, before returning.
 */
async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  const envelope = JSON.parse(out[out.length - 1]) as CliResult
  return { ...envelope, exitCode }
}

/** The draft page file, byte for byte — the thing a failed edit must not touch. */
function draftBytes(cwd: string, slug: string): string {
  return readFileSync(
    path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json'),
    'utf8',
  )
}

describe('REQ-117 — copy editing, end to end', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req117-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // AC1 — a copy segment offers its words; a segment with nothing to edit offers
  // nothing, which is what makes "clicking it opens no modal" true by derivation
  // rather than by a rule the client has to remember.
  it('test_UAT_FC_REQ-117_a_copy_segment_offers_its_words_and_a_bare_segment_offers_none', async () => {
    const dom = await editDom(cwd, 'acme')

    const copyHit = clickAndResolve(dom, elementShowing(dom, HEADLINE))
    expect(copyHit).not.toBeNull()
    expect(copyHit!.kind).toBe('copy')

    const copy = await cli(cwd, 'copy', 'get', 'acme', 'home', copyHit!.target.path.join('.'))
    expect(copy.ok).toBe(true)
    // The WORDS ARE THE FIRST FIELD, which is the property this AC is about and
    // the one the modal keys on to put the cursor in them. It is no longer the
    // only field: REQ-135 added the run's typography beside it, so asserting the
    // whole list here would make this AC fail every time a later phase exposes
    // one more parameter — which is a change to a different requirement, not a
    // regression in this one.
    expect(copy.data!.fields[0]).toEqual({ name: 'text', label: 'Text', type: 'string' })
    expect((copy.data!.values as Record<string, unknown>).text).toBe(HEADLINE)

    // The painted container is a real segment — it is outlined and it resolves —
    // and since REQ-140 it offers exactly its background colour.
    //
    // The image used to stand here, and REQ-118 (T4) took the role away by giving
    // it a picker and an alt field; the painted container stood here next, and
    // REQ-140 took it the same way. The property under test survives both,
    // because it was never about which node: a region offers what the DERIVATION
    // says it offers, so "nothing to open" stays true by derivation rather than
    // by a rule the client has to remember.
    const container = dom.window.document.querySelector('[data-l1-segment="container"]')!
    const containerHit = resolveEditTarget(container)
    expect(containerHit!.kind).toBe('container')
    const painted = await cli(cwd, 'copy', 'get', 'acme', 'home', containerHit!.target.path.join('.'))
    expect(painted.ok).toBe(true)
    expect((painted.data!.fields as Array<{ name: string }>).map((f) => f.name)).toEqual([
      'surfaceFill',
    ])

    // And the region that genuinely holds nothing still answers with nothing:
    // the root wrapper paints no surface, so it is neither outlined nor
    // editable, and asking it directly reports the same emptiness the renderer
    // acted on when it declined to stamp it.
    const bare = await cli(cwd, 'copy', 'get', 'acme', 'home', '0')
    expect(bare.ok).toBe(true)
    expect(bare.data!.fields).toEqual([])
  })

  // AC2 — the loop closes: save, and the channel the editor is displaying shows
  // the new words. The command re-renders, so the host has only to refresh.
  it('test_UAT_FC_REQ-117_saving_copy_updates_the_draft_and_re_renders_the_edit_channel', async () => {
    const dom = await editDom(cwd, 'acme')
    const hit = clickAndResolve(dom, elementShowing(dom, HEADLINE))!
    const addr = hit.target.path.join('.')

    const saved = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      addr,
      '--values',
      JSON.stringify({ text: 'A repainted band.' }),
    )
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['text'])

    // The draft definition — the working copy, not a builder-side draft of its own.
    const page = JSON.parse(draftBytes(cwd, 'acme'))
    expect(page.l1.root.children[0].children[0].text).toBe('A repainted band.')

    // And the rendered bytes the iframe reloads.
    const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
    expect(html).toContain('A repainted band.')
    expect(html).not.toContain(HEADLINE)
  })

  // AC3 — one Save is one diff. The command takes the whole change map, validates
  // it once and writes once; there is no per-field path through it. The property
  // that proves it is atomicity: a map whose second entry is bad writes neither.
  it('test_UAT_FC_REQ-117_one_save_is_one_atomic_diff_not_a_write_per_field', async () => {
    // A published base gives `status` something to diff against, so "how much did
    // this Save change?" has a countable answer.
    await cmdPublish('acme', { cwd, message: 'base' })
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual([])

    const before = draftBytes(cwd, 'acme')
    const beforeHtml = await editHtml(cwd, 'acme')

    const mixed = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      '0.0.0',
      // A field this segment really has, followed by one it does not.
      '--values',
      JSON.stringify({ text: 'Applied?', headline: 'Also applied?' }),
    )
    expect(mixed.ok).toBe(false)
    expect(mixed.error!.code).toBe('SCHEMA_INVALID')
    expect(mixed.error!.message).toContain('headline')

    // Neither half landed — the valid one is not a separate write.
    expect(draftBytes(cwd, 'acme')).toBe(before)
    expect(await editHtml(cwd, 'acme')).toBe(beforeHtml)
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual([])

    // One well-formed map, applied whole, reports one diff.
    const ok = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      '0.0.0',
      '--values',
      JSON.stringify({ text: 'Applied.' }),
    )
    expect(ok.ok).toBe(true)
    expect(ok.data!.changed).toEqual(['text'])
    // And the whole Save moved exactly one file in the draft.
    const status = await cli(cwd, 'status', 'acme')
    expect(status.data!.modified).toEqual(['pages/home.json'])
    expect(status.data!.added).toEqual([])
    expect(status.data!.removed).toEqual([])
  })

  // AC4 — an edit that fails validation is not applied: the error is structured,
  // the draft is byte-unchanged, and the render still shows the pre-edit state.
  it('test_UAT_FC_REQ-117_a_rejected_edit_leaves_the_draft_and_the_render_untouched', async () => {
    const before = draftBytes(cwd, 'acme')
    const beforeHtml = await editHtml(cwd, 'acme')

    const rejected = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      '0.0.0',
      // Copy is words. A number is not, and the surface says so rather than
      // coercing it — a coerced value is an edit the user did not make.
      '--values',
      JSON.stringify({ text: 42 }),
    )
    expect(rejected.ok).toBe(false)
    expect(rejected.error!.code).toBe('SCHEMA_INVALID')
    expect(rejected.exitCode).toBe(2)
    expect(rejected.error!.hint).toContain('copy get')

    expect(draftBytes(cwd, 'acme')).toBe(before)
    expect(await editHtml(cwd, 'acme')).toBe(beforeHtml)
    expect(beforeHtml).toContain(HEADLINE)

    // An address that resolves to nothing fails the same way, and equally inertly.
    const nowhere = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      '0.9.9',
      '--values',
      JSON.stringify({ text: 'x' }),
    )
    expect(nowhere.ok).toBe(false)
    expect(nowhere.error!.code).toBe('NOT_FOUND')
    expect(draftBytes(cwd, 'acme')).toBe(before)
  })

  // AC5 — the editor's write path runs the SAME validator the AI's structured
  // edits run, over the whole resulting definition rather than just its own
  // field. Demonstrated by consequence: break an unrelated part of the page's L1
  // past the envelope, and a copy edit refuses for exactly the reason `config
  // set` does — which it could not do if it validated only what it touched.
  it('test_UAT_FC_REQ-117_copy_edits_run_the_same_whole_definition_validator_as_the_ai_surface', async () => {
    const homePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(homePath, 'utf8'))
    // 9999px clears the schema's shape check and fails the L1 envelope's range —
    // so only a caller running `validateL1` over the document will see it.
    page.l1.root.children[0].children[1].axes.fontSizePx = 9999
    writeFileSync(homePath, JSON.stringify(page, null, 2))
    const before = draftBytes(cwd, 'acme')

    const copy = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      '0.0.0',
      '--values',
      JSON.stringify({ text: 'Untouched by this attempt.' }),
    )
    const config = await cli(cwd, 'config', 'set', 'acme', 'displayName', 'Acme')

    for (const result of [copy, config]) {
      expect(result.ok).toBe(false)
      expect(result.error!.code).toBe('SCHEMA_INVALID')
      expect(result.error!.message).toContain('fontSizePx')
      expect(result.error!.path).toContain('/pages/0/l1')
    }
    expect(draftBytes(cwd, 'acme')).toBe(before)
  })

  // AC6 — there is no raw-editing mode, and no path to one. The only control the
  // derivation can emit is a plain string, and a string is all the write path can
  // store; markup typed into it stays markup-shaped TEXT in the rendered page.
  it('test_UAT_FC_REQ-117_no_editor_path_can_produce_raw_html_or_css', async () => {
    const payload = '<script>alert(1)</script><style>*{display:none}</style>'
    const saved = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      '0.0.0',
      '--values',
      JSON.stringify({ text: payload }),
    )
    expect(saved.ok).toBe(true)

    const dom = await editDom(cwd, 'acme')
    const doc = dom.window.document
    // It is the run's words, verbatim — and it created no element.
    expect(elementShowing(dom, payload).getAttribute('data-l1-segment')).toBe('copy')
    expect(doc.querySelectorAll('script').length).toBe(0)
    expect([...doc.querySelectorAll('style')].some((s) => s.textContent?.includes('display:none'))).toBe(
      false,
    )

    // And no descriptor the derivation emits could have carried markup in the
    // first place: every exposed control is drawn from the closed set of types
    // that CANNOT express markup — plain text (which the renderer escapes), a
    // pick from a list this module wrote, a bounded whole number, or a bit.
    // REQ-135 widened the set; the invariant is that widening it never adds a
    // control a user can type CSS into, so the assertion is the membership rather
    // than a single type.
    const SAFE_TYPES = ['string', 'enum', 'integer', 'boolean', 'color']
    for (const addr of ['0.0.0', '0.0.1']) {
      const got = await cli(cwd, 'copy', 'get', 'acme', 'home', addr)
      for (const field of got.data!.fields as Array<{ type: string; enum?: string[] }>) {
        expect(SAFE_TYPES).toContain(field.type)
        // An enum's options are the derivation's own words, never the user's.
        if (field.type === 'enum') expect(Array.isArray(field.enum)).toBe(true)
      }
    }
  })

  // AC7 — copy inside a behavior module's slot edits through the same loop, for
  // both slot shapes: a repeated one (carousel slides) and a single subtree (the
  // contact form's presentation).
  it('test_UAT_FC_REQ-117_copy_inside_a_behavior_module_slot_edits_through_the_same_loop', async () => {
    const dom = await editDom(cwd, 'acme')

    const cases = [
      { copy: SLIDE_ONE, moduleId: 'gallery', slot: 'slide', replacement: 'The only slide.' },
      { copy: FORM_INTRO, moduleId: 'get-in-touch', slot: 'form', replacement: 'Say hello.' },
    ]

    for (const c of cases) {
      const hit = clickAndResolve(dom, elementShowing(dom, c.copy))!
      // The address is rooted at the INSTANCE, and the scope that says so came
      // off the markup — not from the client knowing what a carousel is.
      expect(hit.target.moduleId).toBe(c.moduleId)
      expect(hit.target.slot).toBe(c.slot)
      expect(hit.kind).toBe('copy')

      const got = await cli(
        cwd,
        'copy',
        'get',
        'acme',
        'home',
        hit.target.path.join('.'),
        '--module',
        c.moduleId,
        '--slot',
        c.slot,
      )
      // The words read back through the module-scoped address. Only the copy is
      // asserted: REQ-135 exposes a slotted run's typography too, and it does so
      // through this same derivation — which is the point of the AC (one loop,
      // whichever address space the run lives in), not a thing that varies with
      // it.
      expect((got.data!.values as Record<string, unknown>).text).toBe(c.copy)

      const saved = await cli(
        cwd,
        'copy',
        'set',
        'acme',
        'home',
        hit.target.path.join('.'),
        '--module',
        c.moduleId,
        '--slot',
        c.slot,
        '--values',
        JSON.stringify({ text: c.replacement }),
      )
      expect(saved.ok).toBe(true)
      const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
      expect(html).toContain(c.replacement)
      expect(html).not.toContain(c.copy)
    }
  })

  // AC8 — copy wider than its box is accepted (DOC-28 §9.1); the guard is that
  // the user can always SEE what they typed. Re-opening the segment hands back
  // the whole string, and asks for the control that can show it.
  it('test_UAT_FC_REQ-117_copy_wider_than_its_box_still_reads_back_in_full', async () => {
    const overflowing = `${LONG_COPY} And then it got longer still.`
    const saved = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      '0.0.1',
      '--values',
      JSON.stringify({ text: overflowing }),
    )
    expect(saved.ok).toBe(true)

    // Re-open it, exactly as the modal would.
    const reopened = await cli(cwd, 'copy', 'get', 'acme', 'home', '0.0.1')
    expect((reopened.data!.values as Record<string, string>).text).toBe(overflowing)
    // The COPY field is the one that grew a textarea. Asserted on the field
    // itself rather than on the whole list, which REQ-135 lengthened.
    expect(reopened.data!.fields[0]).toEqual({
      name: 'text',
      label: 'Text',
      type: 'string',
      widget: 'textarea',
    })
  })

  // AC9 — nested segments resolve innermost-first. The copy sits inside a painted
  // container that is itself a segment, and a click on the words must open the
  // words.
  it('test_UAT_FC_REQ-117_nested_segments_resolve_innermost_first', async () => {
    const dom = await editDom(cwd, 'acme')
    const copyEl = elementShowing(dom, HEADLINE)
    const containerEl = copyEl.closest('[data-l1-segment="container"]')!
    // The fixture really is nested — otherwise this test proves nothing.
    expect(containerEl.contains(copyEl)).toBe(true)
    expect(containerEl).not.toBe(copyEl)

    const hit = clickAndResolve(dom, copyEl)!
    expect(hit.kind).toBe('copy')
    expect(hit.element).toBe(copyEl)

    // The container is still addressable — clicking IT resolves to it — so
    // innermost-wins narrows the hit, it does not hide the parent.
    expect(resolveEditTarget(containerEl)!.kind).toBe('container')
    expect(hit.target.path).not.toEqual(resolveEditTarget(containerEl)!.target.path)
  })

  // AC10 — View mode is the published page. The bridge refuses to bind on it, so
  // a host that forgets to unmount on a mode switch still cannot intercept a
  // click, mark a segment hot, or open a modal.
  it('test_UAT_FC_REQ-117_view_mode_is_not_intercepted_marked_or_editable', async () => {
    const { outDir } = await cmdRender('acme', { cwd })
    const dom = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8'))
    const doc = dom.window.document

    let opened = 0
    const bridge = mountL1EditBridge(doc, () => {
      opened += 1
    })
    const el = elementShowing(dom, HEADLINE)
    const click = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
    el.dispatchEvent(click)
    el.dispatchEvent(new dom.window.Event('pointerover', { bubbles: true }))

    expect(opened).toBe(0)
    expect(click.defaultPrevented).toBe(false)
    expect(doc.querySelector(`.${L1_EDIT_HOT_CLASS}`)).toBeNull()
    bridge.destroy()

    // The hover treatment is the edit channel's, and only its: in edit mode the
    // same gesture marks the segment hot, and destroying the bridge clears it.
    const editDoc = (await editDom(cwd, 'acme')).window.document
    const hotBridge = mountL1EditBridge(editDoc, () => {})
    const editEl = [...editDoc.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === HEADLINE,
    )!
    editEl.dispatchEvent(new dom.window.Event('pointerover', { bubbles: true }))
    expect(editDoc.querySelector(`.${L1_EDIT_HOT_CLASS}`)).toBe(editEl)
    hotBridge.destroy()
    expect(editDoc.querySelector(`.${L1_EDIT_HOT_CLASS}`)).toBeNull()
  })
})
