// @vitest-environment jsdom
/**
 * story-3bf94bd4 — **the dialog's two forms** (AC-1123).
 *
 * The dialog stopped being one form the day a run exposed its typography as
 * well as its words. It is now the dressed editing box for the copy plus a
 * quiet, labelled sheet of parameters beneath it — and the split is decided by
 * **the kind of control a field declares**, never by the region's kind and never
 * by the field's name, exactly as the thumbnail grid is chosen by the descriptor
 * rather than by which region produced the field.
 *
 * WHY THAT DISTINCTION IS THE SUBJECT OF THIS FILE. A split keyed on the region
 * kind, or on the literal name `text`, would pass every assertion about today's
 * fixture and silently strand the next field the derivation grows. So the box
 * and the sheet are asserted against the **descriptors the origin actually
 * reports**, partitioned by `type`, rather than against a hardcoded list of
 * field names written here.
 *
 * The other half of the criterion is that two forms are still ONE edit: values
 * staged in either are read together when the change map is built, one
 * unsaved-changes state spans both, and a dialog nothing was touched in writes
 * and re-renders nothing. Each of those is observed at the wire — the POSTs the
 * dialog actually issues — and then read back through the real `1c` command, so
 * a dialog that reported success without writing could not pass.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern the neighbouring
 * suites established: the document is the bytes the edit channel really renders,
 * the bridge is the one the browser runs, both forms are the installed
 * `webui-fields` component, and every read and write goes over HTTP to a real
 * builder origin. `defaultModal` is driven through `mountEditor` rather than
 * doubled — an injected modal would be a test of the double, and this criterion
 * is entirely about what the real dialog builds.
 *
 * The bounded-sheet clause is MEASURED, in a real browser: jsdom lays nothing
 * out and resolves no `var()`, so "bounded and scrolling within its own bounds
 * while Save stays reachable" is unverifiable there. Where this machine cannot
 * produce that evidence the gap is reported LOUDLY rather than skipped quietly.
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

const REPO = path.resolve(__dirname, '..')
const BUILDER_CSS = path.join(REPO, 'apps/control-app/src/builder/builder.css')

/** The family the page asks for, as a STACK — the shape every captured run has. */
const STACK = 'Editorial, Helvetica Neue, Arial, sans-serif'
const FAMILY = 'Editorial'
/** Short enough that the copy control is a single-line input rather than a textarea. */
const HEADLINE = 'A run with words and type.'
const HEADLINE_SIZE_PX = 40
const BACKGROUND = '/assets/band.png'

/** What `draft/assets/` holds — images the background picker can offer. */
const ASSET_FILES: Record<string, string> = {
  'band.png': 'bytes:band',
  'hero.png': 'bytes:hero',
}

/** Addresses, as the edit render stamps them (`data-l1-path`). */
/** A run of copy exposing its words AND its typography. */
const A_RUN = '0.0'
/** A painted panel carrying a background image and NO text at all. */
const A_PAINTED_PANEL = '0.1'

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 parameter-sheet suite: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-3bf94bd4: ${what} NOT VERIFIED here`)
}

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * One page carrying both shapes the criterion contrasts.
 *
 * The run declares a size, a weight and a family the document declares faces
 * for — including an ITALIC face, so the italic control is genuinely editable
 * rather than locked, which is what lets "touch only a parameter" be driven
 * through the sheet's own toggle. The panel carries a background handle and no
 * children, so it exposes exactly one field and no words: the case the box must
 * not be drawn for.
 */
function seedSite(cwd: string, slug: string): void {
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    const file = draftPath(cwd, slug, 'assets', name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, bytes)
  }

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
        text: HEADLINE,
        // `letterSpacingPx` is here on purpose: it is an axis this surface does
        // NOT expose, so a sheet that grew a control for it — or a save that
        // disturbed it — is visible rather than indistinguishable from "there
        // was nothing to lose".
        axes: {
          fontFamily: STACK,
          fontSizePx: HEADLINE_SIZE_PX,
          fontWeight: 700,
          letterSpacingPx: -1,
        },
      },
      {
        kind: 'container',
        id: 'panel',
        layout: 'stack',
        axes: { backgroundImageUrl: BACKGROUND, surfaceFill: '#101822' },
        children: [],
      },
    ],
  }
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    root,
    resources: {
      fonts: [
        { family: FAMILY, src: 'assets/editorial-400.woff2', weight: 400, style: 'normal' },
        { family: FAMILY, src: 'assets/editorial-700.woff2', weight: 700, style: 'normal' },
        // A declared italic face, so `italic` is offered UNLOCKED.
        { family: FAMILY, src: 'assets/editorial-400i.woff2', weight: 400, style: 'italic' },
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

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope out. */
async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    process.chdir(prevCwd)
  }
  const envelope = JSON.parse(out.join('\n')) as { ok: boolean; data?: Record<string, unknown> }
  return { ...envelope, exitCode: Number(process.exitCode ?? 0) }
}

/**
 * Every declaration block whose selector satisfies `keep`.
 *
 * Comments are stripped FIRST — a selector is everything since the last `}`, so
 * a rule preceded by a comment (which is most of the modal's) would otherwise
 * arrive with that comment glued to its front and match nothing.
 */
function rulesOf(css: string, keep: (selector: string) => boolean): string[] {
  const blocks: string[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
  while ((m = re.exec(bare))) if (keep(m[1].trim())) blocks.push(m[2])
  return blocks
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

interface FieldDescriptor {
  name: string
  label: string
  type: string
  locked?: boolean
}

describe('story-3bf94bd4 the words in a box, the parameters under it', () => {
  let cwd: string
  let html: string
  let pageId: string
  let builder: BuilderHandle
  let browser: import('playwright').Browser | undefined
  /** Loaded dynamically: `editor.js` imports the form component by bare specifier. */
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-sheet-'))
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
    net = browserFetch(builder.url)
    saves = []
  })

  /**
   * Open the dialog the way the operator does: by clicking the region.
   *
   * Replaces any editor already mounted rather than leaking it — an undetached
   * editor keeps its document listeners and would open a second dialog on the
   * next click, which reads as "the gesture opened two forms" rather than as the
   * harness fault it is.
   */
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

  /** The descriptors the origin reports for a region — the split's authority. */
  async function descriptorsOf(address: string): Promise<FieldDescriptor[]> {
    const got = await cli(cwd, 'copy', 'get', 'acme', pageId, address)
    expect(got.ok).toBe(true)
    return got.data!.fields as FieldDescriptor[]
  }

  /** The values the draft now holds for a region, read back through the CLI. */
  async function valuesOf(address: string): Promise<Record<string, unknown>> {
    const got = await cli(cwd, 'copy', 'get', 'acme', pageId, address)
    expect(got.ok).toBe(true)
    return got.data!.values as Record<string, unknown>
  }

  /** The node at a dotted address, straight out of the draft on disk. */
  function draftNode(address: string): Record<string, unknown> {
    const home = JSON.parse(fs.readFileSync(draftPath(cwd, 'acme', 'pages', 'home.json'), 'utf8'))
    let node = home.l1.root as Record<string, unknown>
    for (const i of address.split('.').map(Number).slice(1)) {
      node = (node.children as Record<string, unknown>[])[i]
    }
    return node
  }

  const rowIn = (root: Element, name: string) => root.querySelector(`[data-field="${name}"]`)

  /**
   * Type into a row the way the operator does: click the value to open its
   * control, then edit and leave it. Blur is what the component confirms a text
   * or numeric control on; the auto-opened copy row has no value cell to click,
   * which the guard covers.
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

  /** Flip a boolean row — the toggle IS the commit gesture for a boolean. */
  function toggle(row: Element): void {
    const box = row.querySelector('.fields-toggle') as HTMLInputElement
    expect(box, 'the boolean row renders a live toggle').toBeTruthy()
    box.checked = !box.checked
    box.dispatchEvent(new window.Event('change', { bubbles: true }))
  }

  async function confirmDialog(modal: Element): Promise<void> {
    modal
      .querySelector('.builder-modal__btn--primary')!
      .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle(0)
  }

  const posts = () => net.calls.filter((c) => c.method === 'POST')

  it(
    'test_UAT_AC1123_words_open_in_the_box_and_parameters_in_a_bounded_sheet_staging_into_one_save',
    async () => {
      // The bounded sheet is a stylesheet fact this machine can always check,
      // and the one the browser clause below measures the effect of. It is the
      // same rule the thumbnail grid obeys, and for the same reason: the footer,
      // and therefore Save, has to stay reachable however many parameters a
      // later phase adds.
      const sheetRules = rulesOf(
        fs.readFileSync(BUILDER_CSS, 'utf8'),
        (sel) => sel === '.builder-modal__props',
      ).join('\n')
      expect(sheetRules, 'the parameter sheet is in this stylesheet').toBeTruthy()
      expect(sheetRules).toMatch(/max-height:/)
      expect(sheetRules).toMatch(/overflow:\s*auto/)

      if (!WEBUI_INSTALLED) {
        unverified(`AC-1123 the dialog's two forms (${WEBUI_SKIP_REASON})`)
        return
      }

      // ── the split, decided by the descriptor and nothing else ──────────────
      //
      // Partitioned from the descriptors the ORIGIN reports rather than from a
      // list of names written here: a split keyed on the region kind, or on the
      // literal name `text`, would satisfy a hardcoded list and strand the next
      // field the derivation grows.
      const declared = await descriptorsOf(A_RUN)
      const words = declared.filter((f) => f.type === 'string')
      const parameters = declared.filter((f) => f.type !== 'string')
      expect(words.map((f) => f.name)).toEqual(['text'])
      expect(parameters.length, 'the run exposes parameters beside its words').toBeGreaterThan(1)
      // The parameters are the shapes the criterion enumerates — a bounded
      // number, a choice from a list the surface supplied, a yes/no.
      expect(new Set(parameters.map((f) => f.type))).toEqual(
        new Set(['integer', 'enum', 'boolean']),
      )

      const modal = await openAt(A_RUN)
      const box = modal.querySelector('.builder-modal__box')!
      const sheet = modal.querySelector('.builder-modal__props')!
      expect(box, 'the words open in the dressed editing box').toBeTruthy()
      expect(sheet, 'the parameters open in a sheet of their own').toBeTruthy()

      for (const field of words) {
        expect(rowIn(box, field.name), `${field.name} is in the box`).toBeTruthy()
        expect(rowIn(sheet, field.name), `${field.name} is not in the sheet`).toBeFalsy()
      }
      for (const field of parameters) {
        expect(rowIn(sheet, field.name), `${field.name} is in the sheet`).toBeTruthy()
        expect(rowIn(box, field.name), `${field.name} is not in the box`).toBeFalsy()
      }

      // THE SHEET FOLLOWS THE BOX — a claim the class names alone do not make.
      // A row of parameters above the copy would read as a header on it.
      expect(box.compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

      // Dismissing by any route tears BOTH forms down, leaving nothing behind.
      document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await settle(0)
      expect(modals()).toHaveLength(0)

      // ── no words, no box ──────────────────────────────────────────────────
      //
      // A painted panel offering only a background image renders no editing box
      // — an empty one would frame a void beneath the thumbnails.
      const panelFields = await descriptorsOf(A_PAINTED_PANEL)
      expect(panelFields.some((f) => f.type === 'string')).toBe(false)
      const panel = await openAt(A_PAINTED_PANEL)
      expect(panel.querySelector('.builder-modal__picker'), 'the panel offers its picker').toBeTruthy()
      expect(panel.querySelector('.builder-modal__box')).toBeNull()
      expect(panel.querySelector('.builder-modal__props')).toBeNull()

      // ── two forms, ONE edit ───────────────────────────────────────────────
      const before = draftNode(A_RUN)
      const reworded = 'Reworded, and resized.'
      const resized = HEADLINE_SIZE_PX + 8

      const both = await openAt(A_RUN)
      const boxNow = both.querySelector('.builder-modal__box')!
      const sheetNow = both.querySelector('.builder-modal__props')!
      typeInto(rowIn(boxNow, 'text')!, reworded)
      typeInto(rowIn(sheetNow, 'fontSizePx')!, String(resized))
      // Editing within the open dialog writes NOTHING — the confirm is the
      // single moment anything is applied.
      expect(posts()).toEqual([])

      await confirmDialog(both)

      // ONE change and ONE re-rendering for the whole dialog, carrying both.
      expect(posts()).toHaveLength(1)
      expect(new URL(posts()[0].url).pathname).toBe('/api/copy')
      expect(JSON.parse(posts()[0].body!).values).toMatchObject({
        text: reworded,
        fontSizePx: resized,
      })
      expect(saves).toHaveLength(1)
      expect([...(saves[0].changed ?? [])].sort()).toEqual(['fontSizePx', 'text'])
      expect(await valuesOf(A_RUN)).toMatchObject({ text: reworded, fontSizePx: resized })
      // ...and nothing this dialog does not expose travelled with them.
      expect((draftNode(A_RUN).axes as Record<string, unknown>).letterSpacingPx).toBe(
        (before.axes as Record<string, unknown>).letterSpacingPx,
      )

      // ── a dialog in which ONLY a parameter was touched saves it ────────────
      //
      // The unsaved-changes state spans both forms: were it read off the box
      // alone, a sheet-only edit would close silently and lose the operator's
      // change with no signal at all.
      net.calls.length = 0
      saves.length = 0
      const wasItalic = (await valuesOf(A_RUN)).italic
      const sheetOnly = await openAt(A_RUN)
      expect(sheetOnly.querySelector('.builder-modal__box'), 'the box is still drawn').toBeTruthy()
      toggle(rowIn(sheetOnly.querySelector('.builder-modal__props')!, 'italic')!)
      await confirmDialog(sheetOnly)

      expect(posts()).toHaveLength(1)
      expect(saves).toHaveLength(1)
      expect(saves[0].changed).toEqual(['italic'])
      expect((await valuesOf(A_RUN)).italic).toBe(!wasItalic)

      // ── nothing touched in EITHER writes nothing and re-renders nothing ────
      net.calls.length = 0
      saves.length = 0
      const settled = draftNode(A_RUN)
      const untouched = await openAt(A_RUN)
      expect(untouched.querySelector('.builder-modal__box')).toBeTruthy()
      expect(untouched.querySelector('.builder-modal__props')).toBeTruthy()
      await confirmDialog(untouched)
      expect(posts()).toEqual([])
      expect(saves).toEqual([])
      expect(draftNode(A_RUN)).toEqual(settled)

      // ── the sheet is bounded, and Save stays reachable ─────────────────────
      //
      // MEASURED, where a machine can measure it: jsdom lays nothing out, so
      // "bounded and scrolling within its own bounds" is browser-only evidence.
      if (!browser) {
        unverified('AC-1123 the sheet bounded and Save reachable at a small window')
        return
      }
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        await page.goto(builder.url, { waitUntil: 'networkidle' })
        await page.selectOption('select', 'acme')
        await page.locator('button', { hasText: /^Edit$/ }).click()
        const frame = page.frameLocator('.builder-panel__frame')
        await frame.locator(`body[${L1_EDIT_MARKER_ATTR}]`).waitFor({ state: 'attached' })
        await frame.locator(`[${L1_EDIT_PATH_ATTR}="${A_RUN}"]`).click()
        await page.locator('.builder-modal__props').waitFor()

        // SHRINK UNTIL THE BOUND ACTUALLY BINDS, and derive the window from what
        // the sheet really measures rather than from a guess at row heights: a
        // fixed viewport that happened to fit would assert nothing about
        // scrolling, and the sheet's bound is a fraction of the window, so the
        // window that binds it depends on how tall its rows come out here.
        //
        // Narrow first. Four parameters are not many, and at a wide window the
        // sheet is far below its own ceiling however short the window gets — the
        // rows have to wrap before there is enough of them to clip.
        const WIDTH = 320
        await page.setViewportSize({ width: WIDTH, height: 900 })
        const natural = await page.$eval('.builder-modal__props', (el) => {
          const node = el as HTMLElement
          const pad = parseFloat(getComputedStyle(node).paddingTop) || 0
          return { content: node.scrollHeight - pad, pad }
        })
        // `max-height: min(38vh, 340px)` applies to the CONTENT box, so aim the
        // window at a bound comfortably under the content it has to clip.
        const height = Math.max(200, Math.round((natural.content - 12) / 0.38))
        await page.setViewportSize({ width: WIDTH, height })

        const measured = await page.$eval('.builder-modal__props', (el) => {
          const node = el as HTMLElement
          return {
            client: node.clientHeight,
            scroll: node.scrollHeight,
            overflow: getComputedStyle(node).overflowY,
            bottom: node.getBoundingClientRect().bottom,
          }
        })
        // Bounded — clipped to its ceiling rather than grown to its content...
        expect(measured.client).toBeLessThan(measured.scroll)
        expect(measured.client).toBeLessThanOrEqual(Math.ceil(height * 0.38) + natural.pad)
        // ...and scrolling WITHIN its own bounds rather than pushing the footer
        // out of the dialog.
        expect(['auto', 'scroll']).toContain(measured.overflow)
        expect(measured.bottom).toBeLessThanOrEqual(height)

        const save = page.locator('.builder-modal__btn--primary')
        const saveBox = (await save.boundingBox())!
        expect(saveBox.y).toBeGreaterThanOrEqual(0)
        expect(saveBox.y + saveBox.height).toBeLessThanOrEqual(height)
        expect(await save.isVisible()).toBe(true)
        // Reachable WITHOUT the operator having to shrink anything first —
        // proven by driving it: the click lands, and an untouched dialog closes.
        await save.click()
        await page.locator('.builder-modal').waitFor({ state: 'detached' })
      } finally {
        await page.close()
      }
    },
    240000,
  )
})
