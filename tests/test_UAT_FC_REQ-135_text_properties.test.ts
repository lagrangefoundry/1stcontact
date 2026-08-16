// @vitest-environment jsdom
/**
 * REQ-135 phase A — **a text run's typography**, editable from the segment you
 * clicked.
 *
 * The editor could change a run's words; it could not change how they look. This
 * is the first thing this surface exposes that is an **axis** rather than
 * content, and that difference is the whole reason the suite is shaped the way
 * it is: content is a scalar you overwrite, while an axis can be *responsive* —
 * a rule sampled at six viewport widths (BUG-18) — so a control that writes the
 * axis and ignores the track is not merely incomplete, it silently breaks the
 * page at widths nobody looked at. AC-2 is that claim, and it is the criterion
 * this ticket lives or dies on.
 *
 * SHAPED TO FAIL IF THIS BECOMES A SECOND MECHANISM. No new command, no new
 * route, no new value vocabulary: the fields still come from `copyFieldsOf`, the
 * write still goes through `copy set` / `/api/copy`, and the whole-definition
 * validator still gates the file. What is new is entirely in the derivation and
 * in one branch of the write.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern REQ-121/132
 * established: the page is what `1c render --edit` wrote, the commands are the
 * real `1c`, and the dialog is the real `defaultModal` rather than an injected
 * double — a double would only test the double, and AC-7 is about what the real
 * dialog builds.
 *
 * THE FIXTURE IS THE MEASURED SHAPE OF A REAL SITE, not a convenient one.
 * `xgd/home` carries 62 text runs; 14 of them have a `fontSizePx` track, every
 * `fontFamily` is a full CSS stack while every declared face names a bare
 * family, and 10 runs are set in a weight the site declares no face for. Each of
 * those is a way this could quietly do nothing, so each is in the fixture.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/**
 * The family as a run asks for it — a STACK — against the bare family a face
 * declares. Every run on the measured fold looks like this, and comparing the
 * two whole finds nothing.
 */
const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const FAMILY = 'Satoshi'

/** A run with a responsive size track: the axis is the widest keyframe. */
const A_HEADLINE = '0.0'
/** A run with a flat size and a weight the site declares no face for. */
const A_LEDE = '0.1'
/** A run captured OUTSIDE the control's range — the status quo the bound must not touch. */
const A_GIANT = '0.2'
/** A run in a family with no declared faces at all — a system stack. */
const A_SYSTEM = '0.3'
/**
 * A run in a family that HAS declared faces but which declares no weight of its
 * own — so the select is offered, seeded with a value the node does not hold.
 */
const A_UNWEIGHTED = '0.4'

const draftPath = (cwd: string, slug: string, ...rest: string[]) =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * A page whose runs differ in exactly the ways that decide behaviour.
 *
 * `A_HEADLINE` carries other axes (`letterSpacingPx`, `color`) on purpose: AC-6
 * claims a type edit disturbs nothing else on the node, and a node with one axis
 * could not tell "preserved" from "there was nothing to lose".
 */
function seedSite(cwd: string, slug: string): void {
  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      {
        kind: 'text',
        id: 'headline',
        text: 'Designed for developers who ship',
        axes: {
          fontFamily: STACK,
          fontSizePx: 72,
          fontWeight: 700,
          letterSpacingPx: -1.5,
          color: '#f6f7f4',
        },
        // The ladder the fold measured: 72 at the top, 36 at 320.
        responsive: {
          fontSizePx: {
            keyframes: [
              { at: 320, value: 36 },
              { at: 768, value: 54 },
              { at: 1440, value: 72 },
            ],
          },
        },
      },
      {
        kind: 'text',
        id: 'lede',
        text: 'A lede in a weight this site declares no face for.',
        axes: { fontFamily: STACK, fontSizePx: 18, fontWeight: 600 },
      },
      {
        kind: 'text',
        id: 'giant',
        text: 'Bigger than the control can ask for.',
        axes: { fontFamily: STACK, fontSizePx: 160, fontWeight: 400 },
      },
      {
        kind: 'text',
        id: 'system',
        text: 'Set in whatever the reader has.',
        axes: { fontFamily: 'system-ui, sans-serif', fontSizePx: 16 },
      },
      {
        kind: 'text',
        id: 'unweighted',
        text: 'A run that declares no weight of its own.',
        axes: { fontFamily: STACK, fontSizePx: 20 },
      },
    ],
  }
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root,
    // Four weights, no italic — the measured shape of `xgd/home`'s table.
    resources: {
      fonts: [400, 500, 700, 900].map((weight) => ({
        family: FAMILY,
        src: `/assets/satoshi-${weight}.woff2`,
        weight,
        style: 'normal',
      })),
    },
  }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string }
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope and exit code out. */
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
  return { ...(JSON.parse(out[out.length - 1]) as CliResult), exitCode }
}

interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  min?: number
  max?: number
  locked?: boolean
}

describe('REQ-135 — text properties', () => {
  let cwd: string

  const get = (addr: string) => cli(cwd, 'copy', 'get', 'acme', 'home', addr)
  const set = (addr: string, values: Record<string, unknown>) =>
    cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

  const fieldsOf = async (addr: string): Promise<Field[]> =>
    (await get(addr)).data!.fields as Field[]
  const valuesOf = async (addr: string): Promise<Record<string, unknown>> =>
    (await get(addr)).data!.values as Record<string, unknown>
  const fieldNamed = async (addr: string, name: string): Promise<Field | undefined> =>
    (await fieldsOf(addr)).find((f) => f.name === name)

  /** The draft page file, byte for byte — what a refused edit must not touch. */
  const draftBytes = () => fs.readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8')

  /** The node at a dotted address, out of the draft on disk. */
  function draftNode(addr: string): Record<string, unknown> {
    let node = JSON.parse(draftBytes()).l1.root as Record<string, unknown>
    for (const i of addr.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req135-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  // AC-1 — clicking a run offers its TYPE beside its words, and every control is
  // closed: a bounded number, the faces the site declares, and the axis's own
  // keyword list. The words stay first, because that is what the modal opens
  // into.
  it('test_UAT_FC_REQ-135_a_text_run_offers_its_type_beside_its_words', async () => {
    const fields = await fieldsOf(A_HEADLINE)
    expect(fields[0]).toMatchObject({ name: 'text', type: 'string' })
    expect(fields.map((f) => f.name)).toEqual([
      'text',
      'fontSizePx',
      'fontWeight',
      'italic',
      'textTransform',
    ])

    const size = fields.find((f) => f.name === 'fontSizePx')!
    expect(size).toMatchObject({ type: 'integer', min: 6, max: 128 })

    // The values are the run's own — the representative (widest) size, not a
    // keyframe, and the weight it is actually set in.
    expect(await valuesOf(A_HEADLINE)).toMatchObject({
      fontSizePx: 72,
      fontWeight: '700',
      italic: false,
      textTransform: 'none',
    })

    // Nothing here can express markup or CSS: every control is one of the four
    // closed types (DOC-28 §3).
    for (const field of fields) {
      expect(['string', 'integer', 'boolean', 'enum']).toContain(field.type)
      if (field.type === 'enum') expect(field.enum!.length).toBeGreaterThan(0)
    }
  })

  // AC-2 — THE CRITERION THIS TICKET LIVES ON. Setting the size moves the whole
  // responsive ladder in proportion. Writing the axis alone would leave the
  // track to win at every width it covers (so the edit would appear to do
  // nothing); flattening the track would delete the mobile keyframe (so the page
  // would break at 320 with no warning). Neither is allowed.
  it('test_UAT_FC_REQ-135_resizing_a_run_scales_its_whole_responsive_ladder', async () => {
    const saved = await set(A_HEADLINE, { fontSizePx: 96 })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['fontSizePx'])

    const node = draftNode(A_HEADLINE)
    expect((node.axes as Record<string, unknown>).fontSizePx).toBe(96)

    // 72 → 96 is ×4/3, applied to every keyframe. The ladder keeps its shape.
    const track = (node.responsive as Record<string, { keyframes: { at: number; value: number }[] }>)
      .fontSizePx
    expect(track.keyframes).toEqual([
      { at: 320, value: 48 },
      { at: 768, value: 72 },
      { at: 1440, value: 96 },
    ])

    // And a run with NO track gets exactly the one write — the scaling branch
    // must not invent a ladder for a flat run.
    expect((await set(A_LEDE, { fontSizePx: 20 })).ok).toBe(true)
    expect(draftNode(A_LEDE).responsive).toBeUndefined()
    expect((draftNode(A_LEDE).axes as Record<string, unknown>).fontSizePx).toBe(20)
  })

  // AC-3 — the weight list is the faces the site declares PLUS the value the run
  // already holds, and nothing else. The union is not a nicety: a select whose
  // options omit its own value renders with the first one selected, so saving an
  // unrelated field would silently re-weight the heading.
  it('test_UAT_FC_REQ-135_weight_offers_the_declared_faces_and_the_runs_own_value', async () => {
    expect((await fieldNamed(A_HEADLINE, 'fontWeight'))!.enum).toEqual(['400', '500', '700', '900'])

    // 600 is not a declared face, and it is what this run is set in.
    const lede = (await fieldNamed(A_LEDE, 'fontWeight'))!
    expect(lede.enum).toEqual(['400', '500', '600', '700', '900'])
    expect((await valuesOf(A_LEDE)).fontWeight).toBe('600')

    // A weight the site has no face for is refused rather than synthesised.
    const refused = await set(A_HEADLINE, { fontWeight: '850' })
    expect(refused.ok).toBe(false)
    expect(refused.error!.message).toContain('850')

    const accepted = await set(A_HEADLINE, { fontWeight: '500' })
    expect(accepted.ok).toBe(true)
    expect((draftNode(A_HEADLINE).axes as Record<string, unknown>).fontWeight).toBe(500)
  })

  // AC-4 — italic is offered but LOCKED where the site's own font cannot supply
  // it, and freely editable where no webfont is claiming to. The lock needs
  // positive evidence: a family with declared faces, none of them italic. A
  // system stack declares nothing, and the reader's own font has real italics.
  it('test_UAT_FC_REQ-135_italic_is_locked_only_where_the_sites_font_has_no_italic_face', async () => {
    expect((await fieldNamed(A_HEADLINE, 'italic'))!.locked).toBe(true)
    expect((await fieldNamed(A_SYSTEM, 'italic'))!.locked).toBeUndefined()

    // A post for a locked field is refused — the widget renders it read-only, so
    // a value for it can only come from a client that ignored the descriptor.
    const before = draftBytes()
    const refused = await set(A_HEADLINE, { italic: true })
    expect(refused.ok).toBe(false)
    expect(draftBytes()).toBe(before)

    // Where it is not locked it simply works, and un-ticking removes the axis
    // rather than writing the CSS initial value in.
    expect((await set(A_SYSTEM, { italic: true })).ok).toBe(true)
    expect((draftNode(A_SYSTEM).axes as Record<string, unknown>).fontStyle).toBe('italic')
    expect((await set(A_SYSTEM, { italic: false })).ok).toBe(true)
    expect((draftNode(A_SYSTEM).axes as Record<string, unknown>).fontStyle).toBeUndefined()
  })

  // AC-5 — the range binds a CHANGE, never the status quo. The modal posts every
  // staged field, not only the touched ones, so a run the fold captured at 160px
  // must survive being opened and re-saved. Only asking for a new value outside
  // the range is refused — and refused, never clamped: quietly reshaping a page
  // nobody edited is the worse failure.
  it('test_UAT_FC_REQ-135_the_size_range_binds_a_change_and_not_the_status_quo', async () => {
    expect((await valuesOf(A_GIANT)).fontSizePx).toBe(160)

    const reSaved = await set(A_GIANT, { text: 'Reworded.', fontSizePx: 160 })
    expect(reSaved.ok).toBe(true)
    expect(reSaved.data!.changed).toEqual(['text'])
    expect((draftNode(A_GIANT).axes as Record<string, unknown>).fontSizePx).toBe(160)

    for (const asked of [200, 4]) {
      const refused = await set(A_GIANT, { fontSizePx: asked })
      expect(refused.ok).toBe(false)
      expect(refused.error!.message).toMatch(/at (most|least)/)
      expect((draftNode(A_GIANT).axes as Record<string, unknown>).fontSizePx).toBe(160)
    }
  })

  // AC-6 — a type edit changes the axis it names and NOTHING else, and a no-op
  // save writes nothing at all. Both are properties of the file rather than of
  // the response: the run's other axes are none of this control's business, and
  // a save that re-rendered the site for an unchanged value would put a history
  // in the draft the user never asked for.
  it('test_UAT_FC_REQ-135_a_type_edit_disturbs_no_other_axis_and_a_no_op_writes_nothing', async () => {
    await set(A_HEADLINE, { textTransform: 'uppercase' })
    expect((draftNode(A_HEADLINE).axes as Record<string, unknown>)).toMatchObject({
      fontFamily: STACK,
      fontSizePx: 72,
      fontWeight: 700,
      letterSpacingPx: -1.5,
      color: '#f6f7f4',
      textTransform: 'uppercase',
    })

    const settled = draftBytes()
    const noop = await set(A_HEADLINE, {
      text: 'Designed for developers who ship',
      fontSizePx: 72,
      fontWeight: '700',
      textTransform: 'uppercase',
    })
    expect(noop.ok).toBe(true)
    expect(noop.data!.changed).toEqual([])
    expect(draftBytes()).toBe(settled)
  })

  // AC-7 — in the dialog: the WORDS sit in the dressed box and the parameters sit
  // in a sheet beneath it, and clicking the words still puts the cursor in them.
  // The last clause is the regression this split could easily cause — the
  // affordance used to trigger on "the segment has exactly one field", which a
  // run with four parameters no longer is.
  describe.skipIf(!WEBUI_INSTALLED)(`the dialog (${WEBUI_SKIP_REASON})`, () => {
    let html: string
    let pageId: string
    let builder: BuilderHandle
    let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
    let editor: { destroy(): void } | undefined
    let restoreFetch: () => void

    beforeAll(async () => {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }, 240000)

    afterAll(async () => {
      await builder?.close()
    })

    beforeEach(async () => {
      seedSite(cwd, 'acme')
      const { outDir } = await cmdRender('acme', { cwd, edit: true })
      html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
      builder = await startBuilder({ cwd })
      const real = globalThis.fetch
      const origin = builder.url
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
        real(typeof input === 'string' ? new URL(input, origin) : input, init)) as typeof fetch
      restoreFetch = () => {
        globalThis.fetch = real
      }
      document.body.replaceChildren()
    }, 240000)

    afterEach(async () => {
      editor?.destroy()
      editor = undefined
      for (const m of document.querySelectorAll('.builder-modal')) m.remove()
      restoreFetch?.()
      await builder?.close()
    })

    const modals = () => [...document.querySelectorAll('.builder-modal')]

    async function settle(want: number): Promise<void> {
      for (let i = 0; i < 400 && modals().length !== want; i += 1) {
        await new Promise((r) => setTimeout(r, 5))
      }
    }

    async function openAt(address: string): Promise<Element> {
      document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
      document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
      document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      })
      const el = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)
      if (!el) throw new Error(`nothing rendered at ${address}`)
      el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle(1)
      return modals()[0]
    }

    const rowIn = (root: Element, name: string) => root.querySelector(`[data-field="${name}"]`)

    /**
     * Type into a row the way the operator does. The copy row is already open —
     * `openLoneControl` put the cursor in it — so the value cell it would
     * otherwise be clicked through is absent, which the guard covers.
     */
    function typeInto(row: Element, value: string): void {
      const cell = row.querySelector('.fields-value-editable') as HTMLElement | null
      cell?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      const control = row.querySelector('.fields-control') as HTMLInputElement
      expect(control, 'the row opened into a control').toBeTruthy()
      control.value = value
      control.dispatchEvent(new window.Event('input', { bubbles: true }))
      control.dispatchEvent(new window.Event('change', { bubbles: true }))
      control.dispatchEvent(new window.FocusEvent('blur'))
    }

    /**
     * Click Save and report the refusal the dialog displayed, or `''` when it
     * displayed none. Returned rather than asserted so a failure names the
     * message the origin sent instead of only the modal that failed to close.
     */
    async function saveAndReportRefusal(modal: Element): Promise<string> {
      modal
        .querySelector('.builder-modal__btn--primary')!
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle(0)
      const error = modal.querySelector('.builder-modal__error') as HTMLElement | null
      return error && !error.hidden ? (error.textContent ?? '') : ''
    }

    it('test_UAT_FC_REQ-135_words_sit_in_the_box_and_parameters_sit_beneath_it', async () => {
      const modal = await openAt(A_HEADLINE)

      const box = modal.querySelector('.builder-modal__box')!
      const sheet = modal.querySelector('.builder-modal__props')!
      expect(box).toBeTruthy()
      expect(sheet).toBeTruthy()

      // The copy is in the box; the parameters are not.
      expect(box.querySelector('[data-field="text"]')).toBeTruthy()
      expect(box.querySelector('[data-field="fontSizePx"]')).toBeFalsy()
      for (const name of ['fontSizePx', 'fontWeight', 'italic', 'textTransform']) {
        expect(sheet.querySelector(`[data-field="${name}"]`)).toBeTruthy()
      }
      expect(sheet.querySelector('[data-field="text"]')).toBeFalsy()

      // The sheet is BELOW the box, which is the claim the class names alone do
      // not make: a parameter row above the words would read as a header.
      expect(box.compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

      // And clicking the words still opened the words — the affordance REQ-121
      // added, which counting fields would have retired.
      expect(box.querySelector('textarea, input')).toBeTruthy()

      // The locked control is rendered, and rendered as locked.
      expect(sheet.querySelector('[data-field="italic"]')!.classList.contains('is-locked')).toBe(
        true,
      )
    })

    // AC-4, FROM THE DIALOG. A locked control must not take the rest of the
    // segment down with it. The modal posts every staged field, not only the
    // touched ones, so the locked `italic` value travels on every save of this
    // run — and a write side that refused it on PRESENCE refused the whole
    // change map, which made a run whose family declares no italic face
    // completely unsavable: not just un-italicisable, but unable to change its
    // own words, the plain copy editing REQ-117 shipped.
    //
    // Driven through the real dialog because that is where the defect lived:
    // the CLI test above posts a CHANGED locked value alone and is correctly
    // refused, and no suite drove a Save on a run whose lock was untouched.
    it('test_UAT_FC_REQ-135_a_locked_control_does_not_block_the_rest_of_the_segment', async () => {
      const modal = await openAt(A_HEADLINE)
      const sheet = modal.querySelector('.builder-modal__props')!
      // The precondition this is about: Satoshi declares four weights and no
      // italic face, so the row really is locked.
      expect(rowIn(sheet, 'italic')!.classList.contains('is-locked')).toBe(true)

      const reworded = 'Reworded, with the lock untouched.'
      typeInto(rowIn(modal.querySelector('.builder-modal__box')!, 'text')!, reworded)

      expect(await saveAndReportRefusal(modal)).toBe('')
      expect(modals(), 'the dialog closed, so the save was accepted').toHaveLength(0)

      // The words landed...
      expect(draftNode(A_HEADLINE).text).toBe(reworded)
      // ...and the locked axis is exactly as absent as it was. Echoing a locked
      // value through must not write it either.
      expect((draftNode(A_HEADLINE).axes as Record<string, unknown>).fontStyle).toBeUndefined()
    })

    // AC-6, FROM THE DIALOG. A run that declares no weight INHERITS one, but the
    // select must show something, so the derivation seeds the lowest declared
    // face. That seed is a fabrication about the node, and because the modal
    // posts every staged field it arrives on a save that only touched the words
    // — where writing it would silently re-weight a heading nobody restyled.
    it('test_UAT_FC_REQ-135_a_text_only_save_does_not_write_a_weight_the_run_never_had', async () => {
      // The fabrication is real: the control is offered, and seeded with a value
      // the node does not carry.
      expect((await fieldNamed(A_UNWEIGHTED, 'fontWeight'))!.enum).toEqual([
        '400',
        '500',
        '700',
        '900',
      ])
      expect((await valuesOf(A_UNWEIGHTED)).fontWeight).toBe('400')
      expect((draftNode(A_UNWEIGHTED).axes as Record<string, unknown>).fontWeight).toBeUndefined()

      const modal = await openAt(A_UNWEIGHTED)
      const reworded = 'Reworded, and still unweighted.'
      typeInto(rowIn(modal.querySelector('.builder-modal__box')!, 'text')!, reworded)

      expect(await saveAndReportRefusal(modal)).toBe('')
      expect(modals()).toHaveLength(0)

      expect(draftNode(A_UNWEIGHTED).text).toBe(reworded)
      // STILL ABSENT — the run goes on inheriting whatever it inherited.
      expect((draftNode(A_UNWEIGHTED).axes as Record<string, unknown>).fontWeight).toBeUndefined()
    })
  })
})
