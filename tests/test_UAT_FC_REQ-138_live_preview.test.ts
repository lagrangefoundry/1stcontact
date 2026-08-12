// @vitest-environment jsdom
/**
 * REQ-138 — **the box follows the sheet**.
 *
 * REQ-135 gave a text run's typography a control; REQ-121 gave its words a box
 * dressed in the page's own presentation. Between them sat the gap this closes:
 * the box was dressed ONCE, at open, so changing Size or Weight moved nothing
 * until Save → POST → reload. The operator was choosing blind and then reloading
 * the page to discover what they had chosen.
 *
 * THE INTERESTING CASE IS THE CLAMPED ONE, and it is why this suite exists
 * rather than a one-line assertion. `clampPreviewSize` holds the preview to
 * 14–32px because a 72px display headline reproduced faithfully is unusable in a
 * dialog — so a headline opens sitting exactly ON the ceiling. Put the authored
 * value back through that clamp (the obvious reuse) and 72 → 120 moves nothing
 * at all: the feature silently fails for precisely the runs where size is worth
 * changing. `test_UAT_FC_REQ-138_a_clamped_headline_still_responds` is that
 * claim, and it is the one this ticket lives or dies on.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern REQ-121/132/135
 * established: the page is what `1c render --edit` wrote, the dialog is the real
 * `defaultModal`, and the controls are driven with the gestures a user makes
 * (click the row, type, blur; pick from the select; tick the box) rather than by
 * calling into the component. A double would only test the double.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const FAMILY = 'Satoshi'

/** A run set far above the preview ceiling — the case a re-clamp would strand. */
const A_HEADLINE = '0.0'
/** A run set inside the preview range, where the box previews it 1:1. */
const A_BODY = '0.1'

const draftPath = (cwd: string, slug: string, ...rest: string[]) =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * Two runs either side of the preview ceiling, in a family that declares an
 * ITALIC face.
 *
 * The italic face is not decoration. `typographyFields` locks the Italic control
 * on positive evidence of absence — a family that declares faces and none of
 * them italic — so a fixture without one would render the control as locked and
 * silently skip the assertion that it restyles the box.
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
        axes: { fontFamily: STACK, fontSizePx: 72, fontWeight: 700, color: '#f6f7f4' },
      },
      {
        kind: 'text',
        id: 'body',
        text: 'Body copy, previewed at the size it is actually set in.',
        axes: { fontFamily: STACK, fontSizePx: 16, fontWeight: 400 },
      },
    ],
  }
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root,
    resources: {
      fonts: [
        { family: FAMILY, src: '/assets/satoshi-400.woff2', weight: 400, style: 'normal' },
        { family: FAMILY, src: '/assets/satoshi-700.woff2', weight: 700, style: 'normal' },
        { family: FAMILY, src: '/assets/satoshi-700i.woff2', weight: 700, style: 'italic' },
      ],
    },
  }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

describe.skipIf(!WEBUI_INSTALLED)(`REQ-138 — live preview (${WEBUI_SKIP_REASON})`, () => {
  let cwd: string
  let html: string
  let pageId: string
  let builder: BuilderHandle
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
  let editor: { destroy(): void } | undefined
  let restoreFetch: () => void
  let previewScale: (vars: Record<string, string> | undefined, authored: unknown) => number
  let previewSizePx: (authored: unknown, scale: number) => number | null

  beforeAll(async () => {
    ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    ;({ previewScale, previewSizePx } = await import(
      '../apps/control-app/src/builder/page-style.js'
    ))
  }, 240000)

  afterAll(async () => {
    await builder?.close()
  })

  beforeEach(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req138-'))
    cmdNew('acme', { cwd })
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
    fs.rmSync(cwd, { recursive: true, force: true })
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

  // --- driving the sheet with the gestures a user makes -------------------------
  //
  // Re-queried on every call, never held: confirming a value rebuilds the row, so
  // a cached reference points at a detached cell from the second edit onward.

  const rowFor = (modal: Element, name: string): HTMLElement =>
    modal.querySelector(`.builder-modal__props .fields-row[data-field="${name}"]`) as HTMLElement

  const enterEdit = (modal: Element, name: string): void => {
    const cell = rowFor(modal, name).querySelector('.fields-value-editable') as HTMLElement
    if (!cell) throw new Error(`${name} is not editable`)
    cell.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  }

  /** Type a number and leave the field — the component confirms on blur. */
  function setNumber(modal: Element, name: string, value: number): void {
    enterEdit(modal, name)
    const input = rowFor(modal, name).querySelector('input') as HTMLInputElement
    input.value = String(value)
    input.dispatchEvent(new window.Event('blur'))
  }

  /** Pick from the select — picking IS the confirm gesture. */
  function setChoice(modal: Element, name: string, value: string): void {
    enterEdit(modal, name)
    const select = rowFor(modal, name).querySelector('select') as HTMLSelectElement
    select.value = value
    select.dispatchEvent(new window.Event('change'))
  }

  /** Tick the toggle — the toggle IS the commit gesture, with no edit mode. */
  function setToggle(modal: Element, name: string, value: boolean): void {
    const box = rowFor(modal, name).querySelector('input[type="checkbox"]') as HTMLInputElement
    if (!box) throw new Error(`${name} has no toggle (locked?)`)
    box.checked = value
    box.dispatchEvent(new window.Event('change'))
  }

  const boxOf = (modal: Element) => modal.querySelector('.builder-modal__box') as HTMLElement
  const varOf = (box: HTMLElement, name: string) => box.style.getPropertyValue(name).trim()
  /** The previewed size as a number, including the case where none is set. */
  const sizeOf = (box: HTMLElement, authored: number): number =>
    Number.parseFloat(varOf(box, '--preview-font-size')) ||
    (previewSizePx(authored, 1) as number)

  // AC-1 — the headline case. A run set above the preview ceiling opens sitting
  // ON that ceiling, so this is the assertion a re-clamp fails: it would answer
  // every increase with the same 32px and the operator would see nothing move.
  it('test_UAT_FC_REQ-138_a_clamped_headline_still_responds', async () => {
    const modal = await openAt(A_HEADLINE)
    const box = boxOf(modal)
    const opened = sizeOf(box, 72)

    // THE PRECONDITION, ASSERTED. Everything below is only a test of the clamped
    // case while the run actually opens clamped — and if the render ever stopped
    // reaching this box the size would fall back to 1:1 and the rest of this
    // test would still pass, having quietly become the easy case.
    expect(opened).toBeLessThan(72)

    setNumber(modal, 'fontSizePx', 120)
    const bigger = sizeOf(box, 120)
    expect(bigger).toBeGreaterThan(opened)

    setNumber(modal, 'fontSizePx', 24)
    expect(sizeOf(box, 24)).toBeLessThan(bigger)
  })

  // AC-2 — the scale the dialog dressed the run at is the scale it keeps. Both
  // reductions folded into it are exercised by the fixture: the headline is
  // clamped (72 → 32) and the body copy is not (16 → 16), so the same rule has
  // to produce a proportional preview for one and an exact one for the other.
  it('test_UAT_FC_REQ-138_the_box_keeps_the_scale_it_opened_at', async () => {
    for (const [address, authored, next] of [
      [A_HEADLINE, 72, 96],
      [A_BODY, 16, 28],
    ] as const) {
      const modal = await openAt(address)
      const box = boxOf(modal)
      const scale = previewScale({ '--preview-font-size': varOf(box, '--preview-font-size') }, authored)

      setNumber(modal, 'fontSizePx', next)
      expect(varOf(box, '--preview-font-size')).toBe(`${previewSizePx(next, scale)}px`)

      editor?.destroy()
      for (const m of modals()) m.remove()
    }
  })

  // AC-3 — every other parameter reaches the box too. Each is a different
  // gesture in the component (blur, select, toggle), so "the sheet is wired" is
  // three separate claims rather than one.
  it('test_UAT_FC_REQ-138_weight_italic_and_capitalisation_restyle_the_box', async () => {
    const modal = await openAt(A_HEADLINE)
    const box = boxOf(modal)

    setChoice(modal, 'fontWeight', '400')
    expect(varOf(box, '--preview-font-weight')).toBe('400')

    setToggle(modal, 'italic', true)
    expect(varOf(box, '--preview-font-style')).toBe('italic')

    setChoice(modal, 'textTransform', 'uppercase')
    expect(varOf(box, '--preview-text-transform')).toBe('uppercase')
  })

  // AC-4 — turning a parameter back OFF clears it. The properties are written on
  // change, so an "off" value that wrote nothing would leave the previous one
  // standing and the control would read as having stopped working halfway.
  it('test_UAT_FC_REQ-138_turning_a_parameter_off_clears_it', async () => {
    const modal = await openAt(A_HEADLINE)
    const box = boxOf(modal)

    setToggle(modal, 'italic', true)
    setChoice(modal, 'textTransform', 'uppercase')
    expect(varOf(box, '--preview-font-style')).toBe('italic')

    setToggle(modal, 'italic', false)
    setChoice(modal, 'textTransform', 'none')
    expect(varOf(box, '--preview-font-style')).toBe('normal')
    expect(varOf(box, '--preview-text-transform')).toBe('none')
  })

  // AC-5 — ONE property per change, and the opening dressing is otherwise left
  // exactly as REQ-121 wrote it. The alternative implementation — re-derive the
  // whole dressing from `getValues()` on every change — would restyle axes the
  // operator never touched, because the opening vars are the CASCADED result
  // read off the render while the descriptor values are only what the node
  // itself overrode.
  it('test_UAT_FC_REQ-138_an_untouched_parameter_keeps_its_opening_value', async () => {
    const modal = await openAt(A_HEADLINE)
    const box = boxOf(modal)

    // Indexed rather than iterated: `CSSStyleDeclaration` is an indexed getter
    // in jsdom and carries no iterator, so `for…of` throws rather than reading
    // nothing — which at least fails loudly.
    const before = new Map<string, string>()
    for (let i = 0; i < box.style.length; i += 1) {
      const prop = box.style.item(i)
      before.set(prop, box.style.getPropertyValue(prop))
    }
    // The run's own colour and family arrive from the render, and neither is a
    // control — so they are the sharpest witnesses that nothing was rewritten.
    expect(before.has('--preview-color')).toBe(true)

    setNumber(modal, 'fontSizePx', 40)

    for (const [prop, value] of before) {
      if (prop === '--preview-font-size') continue
      expect(box.style.getPropertyValue(prop), `${prop} was rewritten`).toBe(value)
    }
  })

  // AC-6 — REGRESSION. None of this touches what the modal looks like when it
  // opens: an untouched dialog is still REQ-121's, dressed from the render.
  it('test_UAT_FC_REQ-138_opening_the_modal_is_unchanged', async () => {
    const modal = await openAt(A_HEADLINE)
    const box = boxOf(modal)
    expect(varOf(box, '--preview-font-family')).toContain(FAMILY)
    expect(varOf(box, '--preview-color')).toBeTruthy()
    // Nothing has been changed, so nothing the sheet owns has been written past
    // what the render put there: the weight is the RENDERED one.
    expect(varOf(box, '--preview-font-weight')).toBe('700')
  })
})
