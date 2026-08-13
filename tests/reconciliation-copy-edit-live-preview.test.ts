// @vitest-environment jsdom
/**
 * story-3bf94bd4 — **the box follows the sheet** (AC-1138, AC-1139, AC-1140).
 *
 * AC-1123 gave the dialog its two halves: a run's words in the dressed editing
 * box, its typography in a labelled sheet beneath. AC-1040/AC-1042 gave the box
 * its OPENING dressing, read off the page as rendered. Between them sat the gap
 * these three criteria close — the box was dressed once, at open, so changing a
 * parameter moved nothing until Save → POST → reload, and the operator chose
 * blind and then reloaded the page to find out what they had chosen.
 *
 * THE THREE CLAIMS ARE DELIBERATELY SEPARATE, because the two interesting ones
 * are about implementations that pass the obvious test and fail the real one:
 *
 * - AC-1138 is the plain claim: a parameter reaches the box as it is confirmed,
 *   by its own gesture, an "off" value CLEARS what it set, and none of it is a
 *   write. It is scoped to the three axes that reach the WORDS — size, weight,
 *   italic. CAPITALISATION IS A RECORDED DIVERGENCE from REQ-138's stated
 *   intent: the property is written on the box like the others, but the control
 *   that draws the words takes the box's typography through `font: inherit`,
 *   which does not carry `text-transform` (and the UA resets it on form
 *   controls), so the operator sees nothing. Asserted here in both halves —
 *   written, and not arriving — because the first version of this suite
 *   measured the container and passed while the behaviour was absent.
 * - AC-1139 is the clamped run. The box previews size in a 14–32px editing
 *   range, so a 72px headline opens sitting ON the ceiling; re-applying that
 *   range to each new size — the obvious reuse — answers every increase with the
 *   same 32px and shows the operator nothing at exactly the runs where size is
 *   worth changing. The box keeps the SCALE it opened at instead.
 * - AC-1140 is the untouched axis. Re-deriving the whole dressing from the
 *   sheet's values on every change reads plausibly and is wrong before the
 *   operator touches anything: the opening dressing is the CASCADED result read
 *   off the render, while a parameter's value is only what the run itself
 *   OVERRODE, so the two legitimately disagree.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern the neighbouring
 * suites established: the document is the bytes `1c render --edit` really wrote,
 * the bridge is the one the browser runs, both forms are the installed
 * `webui-fields` component driven with the gestures a user makes (click the row,
 * type, blur; pick from the select; tick the box), and every read goes over HTTP
 * to a real builder origin. `defaultModal` is reached through `mountEditor`
 * rather than doubled — an injected modal would be a test of the double.
 *
 * WHERE A BROWSER IS REQUIRED IT IS USED. jsdom resolves no CSS inheritance at
 * all, so "a run whose weight is inherited from around it" is unobservable
 * there — the divergence AC-1140's second half is about only exists in an engine
 * that cascades. That clause is therefore driven in a real browser against the
 * real workspace, and reported LOUDLY as unverified where this machine has none,
 * rather than quietly reduced to something jsdom can answer.
 *
 * The webui components arrive from an out-of-band install that nothing in this
 * repository's manifests records (story Technical Context), so a machine without
 * them reports the component-dependent evidence as unverified rather than
 * failing.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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

const REPO = path.resolve(__dirname, '..')

/** The family the page asks for, as a STACK — the shape every captured run has. */
const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const FAMILY = 'Satoshi'

/** The editing range the box's OPENING dressing is brought into (AC-1042). */
const PREVIEW_MIN_PX = 14
const PREVIEW_MAX_PX = 32
/** The size control's own bounds, so every value driven here is one it accepts. */
const SIZE_MIN_PX = 6
const SIZE_MAX_PX = 128

/** A run set far above the editing range — the case a re-clamp strands. */
const A_HEADLINE = '0.0'
const HEADLINE_PX = 72
/** A run set inside the range, where the box previews it 1:1. */
const A_BODY = '0.1'
const BODY_PX = 16
/** A run that declares NO weight of its own, so the sheet reports a default. */
const AN_INHERITOR = '0.2'

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 live-preview suite: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-3bf94bd4: ${what} NOT VERIFIED here`)
}

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * Three runs, either side of the editing range and either side of declaring a
 * weight.
 *
 * The ITALIC face is not decoration. `typographyFields` locks the Italic control
 * on positive evidence of absence — a family that declares faces and none of
 * them italic — so a fixture without one would render that control locked and
 * silently skip the assertion that ticking it restyles the box.
 *
 * `letterSpacingPx` on the headline is here for the opposite reason: it is an
 * axis the sheet does NOT expose, so an implementation that re-derived the whole
 * dressing would have to drop it, and its survival is visible rather than
 * indistinguishable from "there was nothing to lose".
 */
function seedSite(cwd: string, slug: string): void {
  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8')) as Record<string, unknown>
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
          fontSizePx: HEADLINE_PX,
          fontWeight: 700,
          letterSpacingPx: -1,
          color: '#f6f7f4',
        },
      },
      {
        kind: 'text',
        id: 'body',
        text: 'Body copy, previewed at the size it is actually set in.',
        axes: { fontFamily: STACK, fontSizePx: BODY_PX, fontWeight: 400, color: '#101822' },
      },
      {
        // NO `fontWeight`. The sheet therefore reports the lowest declared face
        // weight for the family (400) while the page renders whatever the run
        // inherits — the two sources AC-1140 says must not be conflated.
        kind: 'text',
        id: 'inheritor',
        text: 'A run that declares no weight of its own.',
        axes: { fontFamily: STACK, fontSizePx: 24, color: '#101822' },
      },
    ],
  }
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root,
    resources: {
      fonts: [
        { family: FAMILY, src: 'assets/satoshi-400.woff2', weight: 400, style: 'normal' },
        { family: FAMILY, src: 'assets/satoshi-700.woff2', weight: 700, style: 'normal' },
        // A declared italic face, so `italic` is offered UNLOCKED.
        { family: FAMILY, src: 'assets/satoshi-400i.woff2', weight: 400, style: 'italic' },
      ],
    },
  }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

/** The browser's own URL resolution, with every call recorded. */
function browserFetch(originUrl: string): {
  calls: Array<{ url: string; method: string; body: string | undefined }>
  restore: () => void
} {
  const real = globalThis.fetch
  const calls: Array<{ url: string; method: string; body: string | undefined }> = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? new URL(input, originUrl) : input
    calls.push({
      url: String(url),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : undefined,
    })
    return real(url as URL, init)
  }) as typeof fetch
  return {
    calls,
    restore: () => {
      globalThis.fetch = real
    },
  }
}

/** See the neighbouring suites — playwright is `tools/generate`'s dependency. */
async function loadChromium(): Promise<typeof import('playwright').chromium | undefined> {
  try {
    const require = createRequire(path.join(REPO, 'tools/generate/package.json'))
    const entry = pathToFileURL(require.resolve('playwright')).href
    const mod = (await import(/* @vite-ignore */ entry)) as Record<string, never>
    return (mod.chromium ?? (mod.default as Record<string, never>)?.chromium) as never
  } catch {
    return undefined
  }
}

async function launchAnyChromium(
  chromium: typeof import('playwright').chromium,
): Promise<import('playwright').Browser | undefined> {
  for (const opts of [{}, { channel: 'chrome' as const }]) {
    try {
      return await chromium.launch(opts)
    } catch {
      /* try the next */
    }
  }
  return undefined
}

describe('story-3bf94bd4 the box follows the sheet', () => {
  let cwd: string
  let html: string
  let pageId: string
  let builder: BuilderHandle
  let browser: import('playwright').Browser | undefined
  /** Loaded dynamically: `editor.js` imports the form component by bare specifier. */
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-live-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
    builder = await startBuilder({ cwd })
    if (WEBUI_INSTALLED) {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }
    browser = await (async () => {
      const chromium = await loadChromium()
      return chromium ? launchAnyChromium(chromium) : undefined
    })()
  }, 240000)

  afterAll(async () => {
    await browser?.close()
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  const modals = () => [...document.querySelectorAll('.builder-modal')]

  /**
   * Wait for the dialog rather than for a fixed tick: opening one is a real HTTP
   * round trip, so a macrotask bounds nothing but this machine's luck.
   */
  async function settle(want: number): Promise<void> {
    for (let i = 0; i < 400 && modals().length !== want; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  let net: ReturnType<typeof browserFetch>
  let editor: { destroy(): void } | undefined
  /** Every save the dialog reported — one entry is one re-rendering. */
  let saves: Array<{ changed?: string[] }>

  beforeEach(() => {
    editor?.destroy()
    editor = undefined
    for (const m of modals()) m.remove()
    document.body.replaceChildren()
    net?.restore()
    net = browserFetch(builder.url)
    saves = []
  })

  afterAll(() => net?.restore())

  /** Open the dialog the way the operator does: by clicking the region. */
  async function openAt(address: string): Promise<Element> {
    editor?.destroy()
    editor = undefined
    for (const m of modals()) m.remove()
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
    editor = mountEditor(document, {
      slug: 'acme',
      bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      onSaved: (result: { changed?: string[] }) => void saves.push(result),
    })
    const el = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)
    if (!el) throw new Error(`nothing rendered at ${address}`)
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle(1)
    expect(modals()).toHaveLength(1)
    return modals()[0]
  }

  // --- driving the sheet with the gestures a user makes -------------------------
  //
  // Re-queried on every call, never held: confirming a value rebuilds the row, so
  // a cached reference points at a detached cell from the second edit onward.

  const rowFor = (modal: Element, name: string): HTMLElement =>
    modal.querySelector(`.builder-modal__props [data-field="${name}"]`) as HTMLElement

  const enterEdit = (modal: Element, name: string): void => {
    const cell = rowFor(modal, name).querySelector('.fields-value-editable') as HTMLElement
    expect(cell, `${name} is an editable row`).toBeTruthy()
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
    expect(box, `${name} renders a live toggle`).toBeTruthy()
    box.checked = value
    box.dispatchEvent(new window.Event('change'))
  }

  const boxOf = (modal: Element): HTMLElement =>
    modal.querySelector('.builder-modal__box') as HTMLElement
  const varOf = (box: HTMLElement, name: string): string =>
    box.style.getPropertyValue(name).trim()
  /** The previewed size, in px, as a number. */
  const previewedPx = (box: HTMLElement): number =>
    Number.parseFloat(varOf(box, '--preview-font-size'))

  const cancelIn = (modal: Element): void => {
    const cancel = [...modal.querySelectorAll('.builder-modal__btn')].find(
      (b) => b.textContent === 'Cancel',
    )
    expect(cancel, 'the dialog offers Cancel').toBeTruthy()
    cancel!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  }

  /** The whole draft, byte for byte — the sharpest "nothing landed" witness. */
  const draftBytes = (): string =>
    fs.readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8')

  /** Open the workspace in a real browser, on the site's editable rendering. */
  async function openWorkspace(
    page: import('playwright').Page,
  ): Promise<import('playwright').Frame> {
    await page.goto(builder.url, { waitUntil: 'networkidle' })
    await page.selectOption('select', 'acme')
    await page.locator('button', { hasText: /^Edit$/ }).click()
    const framed = page.frameLocator('.builder-panel__frame')
    await framed.locator(`body[${L1_EDIT_MARKER_ATTR}]`).waitFor({ state: 'attached' })
    const frame = page.frames().find((f) => f !== page.mainFrame())
    expect(frame, 'the workspace displays the page in a frame').toBeTruthy()
    return frame!
  }

  it(
    'test_UAT_AC1138_size_weight_and_italic_restyle_the_words_as_confirmed_and_write_nothing',
    async () => {
      // NO STYLESHEET INSPECTION. A regex over `builder.css` proves a
      // declaration exists, not that anything happens — and it is exactly what
      // let this suite go green over a live defect: `text-transform` is
      // declared on the box, reads the property the sheet writes, and still
      // never reaches the words. The evidence is the rendering, below.
      if (!WEBUI_INSTALLED) {
        unverified(`AC-1138 the box follows the sheet (${WEBUI_SKIP_REASON})`)
        return
      }

      const before = draftBytes()
      const modal = await openAt(A_HEADLINE)
      const box = boxOf(modal)
      const wordsOnPage = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${A_HEADLINE}"]`)!
        .textContent
      // Everything from here is measured against a dialog that is already open,
      // so the open's own GET is not mistaken for a write.
      net.calls.length = 0

      // ── each parameter, by its own gesture ────────────────────────────────
      //
      // PROPERTY-LEVEL ONLY here — jsdom resolves no `var()` and computes no
      // inheritance, so "the property was written" is the whole of what this
      // half can honestly say. Whether the property reaches the words is
      // measured in a browser below, and for capitalisation the answer is no.
      setChoice(modal, 'fontWeight', '400')
      expect(varOf(box, '--preview-font-weight')).toBe('400')

      setToggle(modal, 'italic', true)
      expect(varOf(box, '--preview-font-style')).toBe('italic')

      setChoice(modal, 'textTransform', 'uppercase')
      expect(varOf(box, '--preview-text-transform')).toBe('uppercase')

      setNumber(modal, 'fontSizePx', 48)
      expect(previewedPx(box)).toBeGreaterThan(0)

      // ── turned back OFF, the presentation it set is CLEARED ───────────────
      //
      // Written on change, so an "off" value that wrote nothing would leave the
      // previous one standing and the control would read as having stopped
      // working halfway. Capitalisation's clearing is asserted at the property
      // only — it is written and cleared correctly; it just never reaches the
      // words (see the browser half).
      setToggle(modal, 'italic', false)
      setChoice(modal, 'textTransform', 'none')
      expect(varOf(box, '--preview-font-style')).toBe('normal')
      expect(varOf(box, '--preview-text-transform')).toBe('none')

      // ── NOTHING HERE IS A WRITE ───────────────────────────────────────────
      expect(net.calls, 'the origin was not reached at all').toEqual([])
      expect(saves, 'the page behind the dialog was not re-rendered').toEqual([])
      expect(
        document.querySelector(`[${L1_EDIT_PATH_ATTR}="${A_HEADLINE}"]`)!.textContent,
      ).toBe(wordsOnPage)

      // ...and cancelling leaves no trace of having looked.
      cancelIn(modal)
      await settle(0)
      expect(modals()).toHaveLength(0)
      expect(net.calls).toEqual([])
      expect(draftBytes()).toBe(before)

      // ── THE WORDS, not a variable: measured where a machine can measure ────
      //
      // jsdom resolves no `var()` and computes no inheritance, so "the copy in
      // the box is now set that way" is browser-only evidence — and it is
      // measured ON THE COPY. The box is a `div` wrapping the component's
      // control, and the control is what displays the words; measuring the
      // wrapper only re-proves the property was written, which is the mistake
      // that let capitalisation pass while it was inert.
      if (!browser) {
        unverified('AC-1138 the copy in the box restyled as each parameter is confirmed')
        return
      }
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        const frame = await openWorkspace(page)
        await frame.locator(`[${L1_EDIT_PATH_ATTR}="${A_HEADLINE}"]`).click()
        await page.locator('.builder-modal__box').waitFor()
        const set = (name: string) => `.builder-modal__props [data-field="${name}"]`

        /** The element the operator's words are actually drawn in. */
        const COPY = '.builder-modal__box .fields-control'
        await page.locator(COPY).waitFor()
        const shown = () =>
          page.$eval(COPY, (el) => {
            const cs = getComputedStyle(el as HTMLElement)
            return {
              weight: cs.fontWeight,
              style: cs.fontStyle,
              transform: cs.textTransform,
              size: Number.parseFloat(cs.fontSize),
            }
          })

        const opened = await shown()
        expect(opened.weight, 'the words open at the page’s own weight').toBe('700')

        await page.click(`${set('fontWeight')} .fields-value-editable`)
        await page.selectOption(`${set('fontWeight')} select`, '400')
        expect((await shown()).weight, 'the words are drawn lighter').toBe('400')

        await page.locator(`${set('italic')} input[type="checkbox"]`).check()
        expect((await shown()).style, 'the words are drawn italic').toBe('italic')

        await page.click(`${set('fontSizePx')} .fields-value-editable`)
        await page.fill(`${set('fontSizePx')} input`, '120')
        await page.keyboard.press('Tab')
        expect((await shown()).size, 'the words are drawn bigger').toBeGreaterThan(opened.size)

        // Off clears, in the rendering as well as in the property.
        await page.locator(`${set('italic')} input[type="checkbox"]`).uncheck()
        expect((await shown()).style, 'and upright again').toBe('normal')

        // ── CAPITALISATION: THE DIVERGENCE, ASSERTED AS IT STANDS ─────────────
        //
        // REQ-138 asks for four parameters and this one does not arrive. The
        // property is written exactly like the others, on the box — but the
        // control that draws the words takes the box's typography through
        // `font: inherit`, and that shorthand carries family, weight, style and
        // size and NOT `text-transform`, which the browser's own styling of form
        // controls resets. So the operator picks a capitalisation and the words
        // do not change, which is what they reported on the anchor.
        //
        // Asserted rather than omitted: this is the pair of measurements that
        // tells a working implementation from a broken one, and an omitted
        // assertion here is how the divergence survived a green suite. The day
        // the words are drawn in something that carries the property, this fails
        // and the criterion is rewritten to claim it.
        await page.click(`${set('textTransform')} .fields-value-editable`)
        await page.selectOption(`${set('textTransform')} select`, 'uppercase')
        const onBox = await page.$eval(
          '.builder-modal__box',
          (el) => getComputedStyle(el as HTMLElement).textTransform,
        )
        expect(onBox, 'the property IS written, on the box').toBe('uppercase')
        expect((await shown()).transform, 'and does NOT reach the words').toBe('none')
      } finally {
        await page.close()
      }
    },
    240000,
  )

  it(
    'test_UAT_AC1139_a_changed_size_previews_at_the_scale_the_box_opened_at',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`AC-1139 a changed size previews by scale (${WEBUI_SKIP_REASON})`)
        return
      }

      // ── the clamped run: the case a re-clamp strands ──────────────────────
      const modal = await openAt(A_HEADLINE)
      const box = boxOf(modal)
      const opened = previewedPx(box)

      // THE PRECONDITION, ASSERTED. Everything below is a test of the reduced
      // case only while the run actually opens reduced — and if the dressing
      // ever stopped reaching this box the scale would fall back to 1:1 and the
      // rest would still pass, having quietly become the easy case.
      expect(opened).toBeLessThan(HEADLINE_PX)
      expect(opened).toBe(PREVIEW_MAX_PX)
      const scale = opened / HEADLINE_PX

      // Raising grows it and lowering shrinks it — at ALL, which is the whole
      // claim: a run sitting on the range's ceiling answers a re-clamp with the
      // same 32px forever.
      setNumber(modal, 'fontSizePx', 120)
      const bigger = previewedPx(box)
      expect(bigger).toBeGreaterThan(opened)
      setNumber(modal, 'fontSizePx', 40)
      const smaller = previewedPx(box)
      expect(smaller).toBeLessThan(bigger)

      // ...and each previewed size is the CHANGED size at the opening scale,
      // computed here rather than borrowed from the implementation.
      for (const [asked, got] of [
        [120, bigger],
        [40, smaller],
      ] as const) {
        expect(Math.abs(got - asked * scale), `${asked}px previewed at the opening scale`)
          .toBeLessThanOrEqual(0.5)
        expect(got, 'not the range’s bound').not.toBe(PREVIEW_MAX_PX)
      }

      // The floor is kept: shrinking far below the run's own size saturates
      // rather than becoming text the operator cannot read while typing in it.
      setNumber(modal, 'fontSizePx', SIZE_MIN_PX)
      expect(SIZE_MIN_PX * scale).toBeLessThan(PREVIEW_MIN_PX) // the case is real
      expect(previewedPx(box)).toBe(PREVIEW_MIN_PX)

      // There is no ceiling, because the box scrolls.
      setNumber(modal, 'fontSizePx', SIZE_MAX_PX)
      const raised = previewedPx(box)
      expect(raised).toBeGreaterThan(PREVIEW_MAX_PX)
      expect(Math.abs(raised - SIZE_MAX_PX * scale)).toBeLessThanOrEqual(0.5)

      // ── the same rule over a run set INSIDE the range ─────────────────────
      //
      // Its opening scale is 1, so the same scaling reproduces changed sizes at
      // their own size — one rule, not a branch per case.
      const inRange = await openAt(A_BODY)
      const inRangeBox = boxOf(inRange)
      expect(previewedPx(inRangeBox)).toBe(BODY_PX)
      for (const asked of [28, SIZE_MAX_PX]) {
        setNumber(inRange, 'fontSizePx', asked)
        expect(previewedPx(inRangeBox), `${asked}px previewed at its own size`).toBe(asked)
      }
      expect(previewedPx(inRangeBox), 'and not capped').toBeGreaterThan(PREVIEW_MAX_PX)
    },
    240000,
  )

  it(
    'test_UAT_AC1140_only_a_parameter_the_operator_changed_overrides_the_box',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`AC-1140 untouched axes keep their opening dressing (${WEBUI_SKIP_REASON})`)
        return
      }

      // ── one parameter changes ONE thing about the box ─────────────────────
      const modal = await openAt(A_HEADLINE)
      const box = boxOf(modal)

      // Indexed rather than iterated: `CSSStyleDeclaration` is an indexed getter
      // in jsdom and carries no iterator, so `for…of` throws rather than reading
      // nothing — which at least fails loudly.
      const dressing = new Map<string, string>()
      for (let i = 0; i < box.style.length; i += 1) {
        const prop = box.style.item(i)
        dressing.set(prop, box.style.getPropertyValue(prop))
      }
      // The run's colour and its family arrive from the render and have no
      // control in the sheet at all, which makes them the sharpest witnesses
      // that nothing was re-derived.
      expect(dressing.get('--preview-color')).toBeTruthy()
      expect(dressing.get('--preview-font-family')).toContain(FAMILY)
      // ...and an axis the sheet does not expose at all.
      expect(dressing.get('--preview-letter-spacing')).toBeTruthy()
      // The paint behind the words is part of the dressing too.
      const paint = [...box.querySelectorAll('.builder-modal__box-bg')].map(
        (layer) => (layer as HTMLElement).style.cssText,
      )

      setChoice(modal, 'fontWeight', '400')

      for (const [prop, value] of dressing) {
        if (prop === '--preview-font-weight') continue
        expect(box.style.getPropertyValue(prop), `${prop} was rewritten`).toBe(value)
      }
      expect(varOf(box, '--preview-font-weight')).toBe('400')
      expect(
        [...box.querySelectorAll('.builder-modal__box-bg')].map(
          (layer) => (layer as HTMLElement).style.cssText,
        ),
      ).toEqual(paint)

      // ── a run whose weight it does not declare ────────────────────────────
      //
      // The sheet reports the family's lowest declared weight for a run that
      // overrode none; the box must not take that number from it. In jsdom the
      // discrimination available is that the box carries NO weight of its own —
      // a re-derived dressing would have written the sheet's 400 — and it must
      // still carry none after an unrelated change. The full claim, that the box
      // previews the weight the page RENDERS, needs an engine that cascades and
      // is driven in a browser below.
      const inheritor = await openAt(AN_INHERITOR)
      const inheritorBox = boxOf(inheritor)
      const reported = rowFor(inheritor, 'fontWeight').textContent ?? ''
      expect(reported, 'the sheet reports a weight the run never declared').toContain('400')
      const openedWeight = varOf(inheritorBox, '--preview-font-weight')

      setChoice(inheritor, 'textTransform', 'uppercase')
      expect(varOf(inheritorBox, '--preview-text-transform')).toBe('uppercase')
      expect(varOf(inheritorBox, '--preview-font-weight'), 'the weight did not move').toBe(
        openedWeight,
      )

      if (!browser) {
        unverified('AC-1140 an inherited weight survives an unrelated change')
        return
      }
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        const frame = await openWorkspace(page)
        // A weight inherited FROM AROUND THE RUN. The renderer emits weight per
        // run, so the inheritance is introduced into the displayed rendering
        // itself — which is exactly the shape the criterion describes: a page
        // that renders 700 for a run whose own axes declare nothing.
        await frame.addStyleTag({ content: '#root { font-weight: 700 }' })
        const rendered = await frame.$eval(
          `[${L1_EDIT_PATH_ATTR}="${AN_INHERITOR}"]`,
          (el) => getComputedStyle(el as HTMLElement).fontWeight,
        )
        expect(rendered, 'the page renders this run heavy').toBe('700')

        await frame.locator(`[${L1_EDIT_PATH_ATTR}="${AN_INHERITOR}"]`).click()
        await page.locator('.builder-modal__box').waitFor()
        const weight = () =>
          page.$eval(
            '.builder-modal__box',
            (el) => getComputedStyle(el as HTMLElement).fontWeight,
          )
        const sheetSays = await page.textContent(
          '.builder-modal__props [data-field="fontWeight"]',
        )
        expect(sheetSays, 'the sheet still reports the run’s own default').toContain('400')
        // The box previews the RENDERED weight, not the reported one — before
        // anything is touched...
        expect(await weight()).toBe('700')

        // ...and after an unrelated parameter is driven. Measured on the BOX,
        // which is where this particular property lands and stops — that is
        // AC-1138's recorded divergence, and it is the driven change landing at
        // all that matters here, not where it is visible.
        await page.click('.builder-modal__props [data-field="textTransform"] .fields-value-editable')
        await page.selectOption(
          '.builder-modal__props [data-field="textTransform"] select',
          'uppercase',
        )
        expect(
          await page.$eval(
            '.builder-modal__box',
            (el) => getComputedStyle(el as HTMLElement).textTransform,
          ),
        ).toBe('uppercase')
        expect(await weight(), 'the untouched weight still has not moved').toBe('700')
      } finally {
        await page.close()
      }
    },
    240000,
  )
})
