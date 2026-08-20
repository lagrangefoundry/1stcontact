// @vitest-environment jsdom
/**
 * story-3bf94bd4 — **colour, reached from the region you clicked**
 * (AC-1279, AC-1280, AC-1281).
 *
 * The edit gesture grew a third field shape. A run of copy exposes its own
 * colour beside its words; a painted panel exposes the colour it is painted; and
 * both are drawn as the same **colour row** in the parameter sheet, split on the
 * DESCRIPTOR exactly as the thumbnail grid is — never on which region produced
 * the field.
 *
 * WHAT THESE THREE CRITERIA ARE ACTUALLY ABOUT, and why they are one file:
 *
 * - **AC-1279** — the row itself. It reports what the region paints, it opens the
 *   site's palette in pick mode asking with the entry the region holds, what
 *   comes back is a palette REFERENCE and never a hex, and the pick is *staged*:
 *   it travels in the same change map as the words beside it, so one dialog is
 *   still one diff and one re-rendering.
 * - **AC-1280** — the panel behind the words. Innermost-wins sends every click on
 *   the copy to the run, and a panel can be entirely covered by its own lone text
 *   run, so the panel is unreachable by pointing. The run's dialog therefore
 *   carries a read-only swatch of it and a route to its own dialog — and, because
 *   that route is also a commit, it says so before it is followed.
 * - **AC-1281** — the empty palette. A site folded from an existing design holds
 *   raw colours and no palette at all, so "the picker opens onto nothing" is the
 *   COMMON first state rather than an edge case. The row is still offered and the
 *   surface it opens is the surface the first entry gets added in.
 *
 * REAL EVERYTHING, on the pattern the neighbouring copy-edit suites established:
 * the document is the bytes `1c render --edit` really wrote, the bridge is the
 * one the browser runs, the dialog is the real `defaultModal` (never an injected
 * double — a double is exactly what would hide a wiring defect here), the write
 * path is the real `1c`, and AC-1281 drives REQ-133's real popup rather than a
 * stand-in for it.
 *
 * The one stand-in is AC-1279/AC-1280's picker, deliberately: the popup is
 * REQ-133's and is tested there and in AC-1281 below, while what is under test in
 * those two is the CALLER — that a row exists, that activating it asks for a
 * colour, that it asks with the right thing, and that whatever comes back is
 * staged rather than committed. Driving the real popup for all three would couple
 * every assertion to its markup.
 *
 * The webui components arrive from an out-of-band install that nothing in this
 * repository's manifests records (story Technical Context), so a machine without
 * them reports the evidence as unverified rather than failing.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, run } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
} from '../packages/site-schema/src/l1/edit'
import { shadeHex } from '../packages/site-schema/src/l1/shade'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { openOrigin, type InstalledFetch, type OriginHandle } from './support/builder-origin'

/** The site's palette — two entries, so "not in the palette" has something to contrast with. */
const PALETTE = { ink: { value: '#101820' }, brand: { value: '#2e86a3' } }

/** A run with NO painted ancestor — the case that must carry no escalation row. */
const A_HEADLINE = '0.0'
const HEADLINE_COLOR = '#f6f7f4'
/** The painted panel, and the run sitting on it. */
const A_PANEL = '0.1'
const PANEL_FILL = '#101820'
const A_PANEL_COPY = '0.1.0'

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 colour-row suite: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-3bf94bd4: ${what} NOT VERIFIED here`)
}

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * A page shaped around the distinctions these three criteria turn on.
 *
 * The ROOT paints nothing, so `A_HEADLINE` is a run that sits on nothing painted
 * — the case AC-1280 requires to carry no escalation row. `A_PANEL` paints and
 * holds a lone run, which is both the escalation's target and the occlusion the
 * row exists for. `A_HEADLINE` carries other axes on purpose: "a colour edit
 * disturbs nothing else" cannot be told from "there was nothing to lose" on a
 * node with one axis.
 */
function seedSite(cwd: string, slug: string, palette: unknown = PALETTE): void {
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
        axes: { fontSizePx: 48, fontWeight: 700, letterSpacingPx: -1.5, color: HEADLINE_COLOR },
      },
      {
        kind: 'container',
        id: 'panel',
        layout: 'stack',
        axes: { surfaceFill: PANEL_FILL },
        children: [
          { kind: 'text', id: 'panel-copy', text: 'Sitting on a panel.', axes: { fontSizePx: 18 } },
        ],
      },
    ],
  } as L1Node
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))

  const sitePath = draftPath(cwd, slug, 'site.json')
  const site = JSON.parse(fs.readFileSync(sitePath, 'utf8')) as Record<string, unknown>
  if (palette) site.palette = palette
  else delete site.palette
  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string }
}

/** Drive the real `1c` entry point — argv in, envelope out. */
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
  process.exitCode = 0
  return JSON.parse(out[out.length - 1]) as CliResult
}

describe('story-3bf94bd4 a region exposes its colour, and the panel behind it', () => {
  let cwd: string
  let html: string
  let pageId: string
  let origin: OriginHandle
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-colour-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
    origin = await openOrigin(cwd)
    if (WEBUI_INSTALLED) {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }
  }, 240000)

  afterAll(async () => {
    await origin?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /** Every dialog on screen; the palette popup wears the same shell and is named apart. */
  const dialogs = () => [...document.querySelectorAll('.builder-modal')]
  const editDialogs = () => dialogs().filter((d) => d.getAttribute('aria-label') !== 'Choose a color')
  const palettePopup = () => dialogs().find((d) => d.getAttribute('aria-label') === 'Choose a color')

  /** Wait for a dialog rather than for a fixed tick: opening one is a real round trip. */
  async function settle(want: number): Promise<void> {
    for (let i = 0; i < 600 && editDialogs().length !== want; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }
  async function settlePalette(open: boolean): Promise<void> {
    for (let i = 0; i < 600 && Boolean(palettePopup()) !== open; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  /**
   * Wait for the dialog on screen to be the one named.
   *
   * Counting dialogs is not enough for the escalation: the route closes one and
   * opens another, so the count is 1 before, 0 briefly, and 1 again — and a wait
   * on the count returns immediately, before anything has happened.
   */
  async function settleDialog(label: string): Promise<void> {
    for (let i = 0; i < 600; i += 1) {
      if (editDialogs().length === 1 && editDialogs()[0].getAttribute('aria-label') === label) return
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  /** Let every pending round trip drain, for the assertions that expect NO change. */
  async function quiesce(): Promise<void> {
    for (let i = 0; i < 200; i += 1) await new Promise((r) => setTimeout(r, 1))
  }

  let net: InstalledFetch
  let editor: { destroy(): void } | undefined
  let saves: Array<{ changed?: string[] }>
  /** Every value the dialog asked the palette with — the "asked with what?" evidence. */
  let asked: unknown[]
  /** What the stubbed picker answers next. `null` is a cancel. */
  let answer: unknown

  beforeEach(() => {
    editor?.destroy()
    editor = undefined
    for (const d of dialogs()) d.remove()
    document.body.replaceChildren()
    // EACH TEST SETS UP ITS OWN STATE. These write to the draft, and a colour
    // saved by one criterion is a different starting point for the next — the
    // tree shape is unchanged, so the render taken once above stays accurate.
    seedSite(cwd, 'acme')
    net = origin.install()
    saves = []
    asked = []
    answer = { ref: 'brand' }
  })

  const posts = () => net.calls.filter((c) => c.method === 'POST')

  /** The draft page file, byte for byte — what a refused edit must not touch. */
  const draftBytes = () => fs.readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8')

  function draftNode(address: string): Record<string, unknown> {
    let node = JSON.parse(draftBytes()).l1.root as Record<string, unknown>
    for (const i of address.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }
  const axesOf = (address: string) => draftNode(address).axes as Record<string, unknown>

  /**
   * Open the dialog the way the operator does: by clicking the region.
   *
   * `colors.open` is the stub described in the header for AC-1279/AC-1280, and
   * the real popup for AC-1281, which passes its own `open`.
   */
  async function openAt(
    address: string,
    open?: (value: unknown) => Promise<unknown>,
  ): Promise<Element> {
    editor?.destroy()
    editor = undefined
    for (const d of dialogs()) d.remove()
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
    editor = mountEditor(document, {
      slug: 'acme',
      bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      onSaved: (result: { changed?: string[] }) => void saves.push(result),
      colors: {
        shadeHex,
        open:
          open ??
          ((value: unknown) => {
            asked.push(value)
            return Promise.resolve(answer)
          }),
      },
    })
    const el = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)
    if (!el) throw new Error(`nothing rendered at ${address}`)
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle(1)
    expect(editDialogs()).toHaveLength(1)
    return editDialogs()[0]
  }

  /** Click a colour row's swatch and let the picker resolve. */
  async function activate(row: Element): Promise<void> {
    ;(row.querySelector('.builder-color__swatch') as HTMLElement).click()
    for (let i = 0; i < 200; i += 1) await new Promise((r) => setTimeout(r, 1))
  }

  const rowFor = (root: Element, name: string) =>
    root.querySelector(`.builder-color[data-field="${name}"]`)!
  const nameIn = (row: Element) => row.querySelector('.builder-color__name')!.textContent
  const chipIn = (row: Element) =>
    (row.querySelector('.builder-color__chip') as HTMLElement).style.getPropertyValue(
      '--builder-color-chip',
    )

  /** Type into the words the way the operator does. */
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

  async function confirm(modal: Element, expectClosed = true): Promise<void> {
    modal
      .querySelector('.builder-modal__btn--primary')!
      .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    if (expectClosed) await settle(0)
    else for (let i = 0; i < 200; i += 1) await new Promise((r) => setTimeout(r, 1))
  }

  it(
    'test_UAT_AC1279_a_colour_row_opens_the_palette_and_saves_in_the_same_change_as_the_words',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`AC-1279 the colour row (${WEBUI_SKIP_REASON})`)
        return
      }

      // ── the row, in the sheet and never in the box ───────────────────────────
      const modal = await openAt(A_HEADLINE)
      const sheet = modal.querySelector('.builder-modal__props')!
      const box = modal.querySelector('.builder-modal__box')!
      const colour = rowFor(sheet, 'color')
      expect(colour, 'the run exposes a colour row in the parameter sheet').toBeTruthy()
      expect(box.querySelector('.builder-color'), 'and not in the editing box').toBeFalsy()

      // It shows the colour the region ACTUALLY paints, labelled with what that
      // colour is called — a literal on a folded site is named by its hex, which
      // is the honest signal that this one is not on the palette yet.
      expect(chipIn(colour)).toBe(HEADLINE_COLOR)
      expect(nameIn(colour)).toBe(HEADLINE_COLOR)

      // ── activating asks the palette, with what the region holds ──────────────
      //
      // A literal names no entry to pre-select, so the popup is asked with
      // nothing rather than with a hex it would either ignore or try to resolve.
      await activate(colour)
      expect(asked).toEqual([null])
      expect(nameIn(colour), 'the row now shows what was chosen').toBe('brand')
      expect(chipIn(colour)).toBe(PALETTE.brand.value)

      // ── backing out leaves the row exactly as it was ─────────────────────────
      answer = null
      await activate(colour)
      expect(asked).toEqual([null, { ref: 'brand' }])
      expect(nameIn(colour), 'a cancel does not clear the staged pick').toBe('brand')

      // NOTHING POSTED at any point before Save.
      expect(posts()).toEqual([])
      modal
        .querySelector('.builder-modal__btn')!
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle(0)
      expect(posts()).toEqual([])

      // ── the words AND the colour, in one change and one re-rendering ─────────
      const before = axesOf(A_HEADLINE)
      const reworded = 'Reworded, and repainted.'
      answer = { ref: 'brand' }
      const both = await openAt(A_HEADLINE)
      await activate(rowFor(both.querySelector('.builder-modal__props')!, 'color'))
      typeInto(
        both.querySelector('.builder-modal__box')!.querySelector('[data-field="text"]')!,
        reworded,
      )
      expect(posts(), 'editing inside the open dialog writes nothing').toEqual([])

      await confirm(both)
      expect(posts(), 'one dialog, one change').toHaveLength(1)
      expect(new URL(posts()[0].url).pathname).toBe('/api/copy')
      expect(JSON.parse(posts()[0].body!).values).toMatchObject({
        text: reworded,
        color: { ref: 'brand' },
      })
      expect(saves, 'and one re-rendering').toHaveLength(1)
      expect([...(saves[0].changed ?? [])].sort()).toEqual(['color', 'text'])

      // A palette REFERENCE, never a raw colour — the rule the whole surface
      // lives on. And nothing else on the node moved.
      expect(axesOf(A_HEADLINE).color).toEqual({ ref: 'brand' })
      expect(axesOf(A_HEADLINE)).toMatchObject({
        fontSizePx: before.fontSizePx,
        fontWeight: before.fontWeight,
        letterSpacingPx: before.letterSpacingPx,
      })
      // The PAGE repaints with it, so the literal→reference conversion is
      // invisible downstream.
      const { outDir } = await cmdRender('acme', { cwd })
      expect(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')).toContain(
        PALETTE.brand.value,
      )

      // ── the same row, over a painted panel's background ──────────────────────
      answer = { ref: 'ink', shade: -0.25 }
      const panel = await openAt(A_PANEL)
      const fill = rowFor(panel.querySelector('.builder-modal__props')!, 'surfaceFill')
      expect(fill, 'a painted panel exposes the colour it is painted').toBeTruthy()
      expect(chipIn(fill)).toBe(PANEL_FILL)
      await activate(fill)
      // Asked with nothing, for the same reason: the panel holds a literal too.
      expect(asked[asked.length - 1]).toBe(null)
      await confirm(panel)
      expect(axesOf(A_PANEL).surfaceFill).toEqual({ ref: 'ink', shade: -0.25 })

      // ── a colour the surface refuses ─────────────────────────────────────────
      const untouched = draftBytes()
      answer = { ref: 'not-an-entry' }
      const refused = await openAt(A_HEADLINE)
      await activate(rowFor(refused.querySelector('.builder-modal__props')!, 'color'))
      await confirm(refused, false)

      expect(editDialogs(), 'the dialog stays open holding what was chosen').toHaveLength(1)
      const error = refused.querySelector('.builder-modal__error') as HTMLElement
      expect(error.hidden).toBe(false)
      expect(error.textContent).toContain('not-an-entry')
      expect(nameIn(rowFor(refused.querySelector('.builder-modal__props')!, 'color'))).toBe(
        'not-an-entry',
      )
      expect(draftBytes(), 'and the draft is byte-unchanged').toBe(untouched)
    },
    240000,
  )

  it(
    'test_UAT_AC1280_the_run_shows_the_panel_behind_it_read_only_and_saves_before_it_navigates',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`AC-1280 the panel behind the words (${WEBUI_SKIP_REASON})`)
        return
      }

      // ── a run that sits on nothing painted carries no such row ───────────────
      //
      // Asserted FIRST, so "the row is present" below cannot be satisfied by a
      // row this dialog draws unconditionally.
      const lone = await openAt(A_HEADLINE)
      expect(lone.querySelector('.builder-escalate')).toBeNull()

      // ── the row itself: reports, and offers no control ───────────────────────
      const modal = await openAt(A_PANEL_COPY)
      const row = modal.querySelector('.builder-escalate')!
      expect(row, 'a run on a painted panel gets the inherited-background row').toBeTruthy()
      expect(row.textContent).toContain('from the panel behind this text')
      // Named the way every colour on this surface is named, and showing the
      // colour that panel actually paints.
      expect(row.textContent).toContain(PANEL_FILL)
      expect(
        (row.querySelector('.builder-escalate__swatch') as HTMLElement).style.getPropertyValue(
          '--builder-color-chip',
        ),
      ).toBe(PANEL_FILL)
      // READ-ONLY. Duplicating the panel's own control here would break
      // one-dialog-one-change, which is why the row reports rather than edits.
      expect(row.querySelector('.builder-color__swatch')).toBeFalsy()

      const link = row.querySelector('.builder-escalate__link') as HTMLElement
      row.dispatchEvent(new window.Event('pointerenter'))
      expect(link.textContent, 'nothing staged, so the route is not also a commit').toBe(
        'edit the panel ↗',
      )

      // ── following it opens the PANEL's own dialog ────────────────────────────
      link.click()
      await settleDialog('Edit container')
      const panel = editDialogs()[0]
      expect(panel.getAttribute('aria-label')).toBe('Edit container')
      expect(rowFor(panel.querySelector('.builder-modal__props')!, 'surfaceFill')).toBeTruthy()
      expect(panel.textContent).toContain('Background colour')

      // ── from a dirty dialog it says so, and saves FIRST ──────────────────────
      const reworded = 'Sitting on a panel, restated.'
      const dirty = await openAt(A_PANEL_COPY)
      typeInto(
        dirty.querySelector('.builder-modal__box')!.querySelector('[data-field="text"]')!,
        reworded,
      )
      const dirtyRow = dirty.querySelector('.builder-escalate')!
      dirtyRow.dispatchEvent(new window.Event('pointerenter'))
      const dirtyLink = dirtyRow.querySelector('.builder-escalate__link') as HTMLElement
      expect(dirtyLink.textContent, 'the label says the navigation is also a commit').toBe(
        'save and edit the panel ↗',
      )

      dirtyLink.click()
      await settleDialog('Edit container')
      expect(draftNode(A_PANEL_COPY).text, 'the change landed before the navigation').toBe(reworded)
      expect(editDialogs()[0].getAttribute('aria-label')).toBe('Edit container')

      // ── the route's own destination, taken: the panel is repainted, and the
      //    run's row still reports it ──────────────────────────────────────────
      //
      // THE SECOND LAP IS THE CRITERION, not an extra. The route exists so the
      // panel's background can be changed from the run that occludes it, and
      // what it changes it to is a PALETTE REFERENCE — the only thing this
      // surface can write. So the state the row has to survive is precisely the
      // state the row's own gesture produces: a panel painted from the palette,
      // named by its entry the way every other colour on this surface is named.
      answer = { ref: 'ink' }
      const target = editDialogs()[0]
      await activate(rowFor(target.querySelector('.builder-modal__props')!, 'surfaceFill'))
      await confirm(target)
      expect(axesOf(A_PANEL).surfaceFill).toEqual({ ref: 'ink' })

      const again = await openAt(A_PANEL_COPY)
      const stillThere = again.querySelector('.builder-escalate')!
      expect(
        stillThere,
        'a panel painted from the palette is still a painted panel, and the run still shows it',
      ).toBeTruthy()
      expect(stillThere.textContent).toContain('from the panel behind this text')
      // A reference is named by its ENTRY — that is what the operator chose and
      // what an edit to the palette would move.
      expect(stillThere.textContent).toContain('ink')
      expect(
        (
          stillThere.querySelector('.builder-escalate__swatch') as HTMLElement
        ).style.getPropertyValue('--builder-color-chip'),
        'and the swatch shows the colour that entry resolves to',
      ).toBe(PALETTE.ink.value)

      // ── a refused save keeps the work and does not navigate ──────────────────
      const untouched = draftBytes()
      answer = { ref: 'not-an-entry' }
      const refusing = await openAt(A_PANEL_COPY)
      await activate(rowFor(refusing.querySelector('.builder-modal__props')!, 'color'))
      const refusingRow = refusing.querySelector('.builder-escalate')!
      refusingRow.dispatchEvent(new window.Event('pointerenter'))
      ;(refusingRow.querySelector('.builder-escalate__link') as HTMLElement).click()
      await quiesce()

      expect(editDialogs(), 'the run’s dialog is still the one on screen').toHaveLength(1)
      expect(editDialogs()[0].getAttribute('aria-label')).toBe('Edit copy')
      expect((editDialogs()[0].querySelector('.builder-modal__error') as HTMLElement).hidden).toBe(
        false,
      )
      expect(draftBytes()).toBe(untouched)
    },
    240000,
  )

  it(
    'test_UAT_AC1281_an_empty_palette_still_offers_the_row_and_opens_its_add_the_first_one_state',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`AC-1281 the empty palette (${WEBUI_SKIP_REASON})`)
        return
      }

      // A site folded from an existing design: raw colours, no palette at all.
      seedSite(cwd, 'acme', null)
      expect((await cli(cwd, 'palette', 'get', 'acme')).data!.entries).toEqual([])

      // The REAL popup, over the real transport — this criterion is precisely
      // about what that surface does with nothing in it, so a stub would prove
      // nothing.
      const { openPalettePopup } = await import('../apps/control-app/src/builder/palette-popup.js')
      const { fetchPalette, writePalette } = await import('../apps/control-app/src/builder/api.js')
      const openPicker = (value: unknown) =>
        openPalettePopup({
          slug: 'acme',
          mode: 'pick',
          value,
          transport: { get: fetchPalette, write: writePalette },
          shadeHex,
        }) as Promise<unknown>

      const modal = await openAt(A_HEADLINE, openPicker)
      const colour = rowFor(modal.querySelector('.builder-modal__props')!, 'color')
      expect(colour, 'the row is still offered on a site with no palette').toBeTruthy()

      // ── it opens onto "no colours yet, add one" ──────────────────────────────
      ;(colour.querySelector('.builder-color__swatch') as HTMLElement).click()
      await settlePalette(true)
      const popup = palettePopup()!
      expect(popup, 'the picker opens rather than doing nothing').toBeTruthy()
      // The shell mounts before the census arrives, so wait for the list to be
      // painted rather than for the dialog to exist.
      for (let i = 0; i < 600 && !popup.querySelector('.builder-palette__list > *'); i += 1) {
        await new Promise((r) => setTimeout(r, 5))
      }
      const empty = popup.querySelector('.builder-palette__empty')!
      expect(empty, 'it says there are no colours yet rather than showing an empty list').toBeTruthy()
      expect(empty.textContent).toContain('acme')
      expect(empty.textContent).toMatch(/no colors yet/i)
      // The way to add the first entry is present — the recovery is one gesture
      // inside the surface the operator already opened.
      const add = popup.querySelector('.builder-palette__add')!
      expect(add, 'the add-an-entry form is present').toBeTruthy()
      // Until an entry exists there is nothing to choose.
      expect(popup.querySelectorAll('.builder-palette__swatch')).toHaveLength(0)

      // ── add one, choose it, and the region is painted with it ────────────────
      const newName = add.querySelector('.builder-palette__new-name') as HTMLInputElement
      const newHex = add.querySelector('.builder-palette__hex') as HTMLInputElement
      newName.value = 'brand'
      newHex.value = '#2e86a3'
      ;[...add.querySelectorAll('button')]
        .find((b) => b.textContent === 'Add color')!
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      for (let i = 0; i < 600 && !popup.querySelector('.builder-palette__swatch'); i += 1) {
        await new Promise((r) => setTimeout(r, 5))
      }
      const swatch = popup.querySelector(
        '.builder-palette__swatch[data-name="brand"] .builder-palette__swatch-input',
      ) as HTMLInputElement
      expect(swatch, 'the entry the operator just added is there to choose').toBeTruthy()
      swatch.checked = true
      swatch.dispatchEvent(new window.Event('change', { bubbles: true }))
      ;(popup.querySelector('.builder-modal__btn--primary') as HTMLElement).click()
      await settlePalette(false)

      expect(nameIn(colour), 'the row now shows the entry that was just created').toBe('brand')
      await confirm(modal)
      expect(axesOf(A_HEADLINE).color).toEqual({ ref: 'brand' })
      const { outDir } = await cmdRender('acme', { cwd })
      expect(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')).toContain('#2e86a3')
    },
    240000,
  )
})
