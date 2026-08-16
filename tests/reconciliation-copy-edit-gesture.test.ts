/**
 * story-3bf94bd4 — **the edit gesture**: everything between the operator's
 * pointer and the change landing on their page. Hover a piece of copy and it
 * lights up → click it and a form opens over exactly those words → change them
 * and Save → the page reloads showing the new words, still editable.
 *
 * This file owns the half of the gesture that is measurable without the shared
 * UI component set: the pointer, the address the click resolves to, the origin
 * call the form is built from, and the page the operator is left looking at.
 * The form dialog itself is in `reconciliation-copy-edit-gesture-modal.test.ts`.
 *
 * ENTRY POINTS ONLY. The bridge runs against the bytes `1c render --edit`
 * actually wrote, parsed by a real DOM and driven by real pointer and click
 * events; the reads and writes go over HTTP to the real builder origin, which
 * is what the browser talks to. Nothing internal is stubbed.
 *
 * KNOWN COVERAGE CAVEAT (story Technical Context). The shared `webui-*`
 * components arrive from an out-of-band install that nothing in this
 * repository's manifests records, so a machine that has not run it has none of
 * them. The builder chrome cannot mount there, so the criteria whose remaining
 * evidence is a real browser driving that chrome assert their
 * component-independent core unconditionally and report the rest as
 * UNVERIFIED — loudly, because a quiet skip on the only test of the actual
 * gesture is indistinguishable from a pass. The components are never mocked:
 * mocking them would prove nothing about the consumption route.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  cmdNew,
  cmdPublish,
  cmdRender,
  editCopyGet,
  editStatus,
  startBuilder,
} from '../tools/generate/src/cli'
import { mountL1EditBridge, resolveEditTarget } from '../packages/framework/src/l1/edit-client'
import type { L1EditHit } from '../packages/framework/src/l1/edit-client'
import {
  L1_EDIT_HOT_CLASS,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_MODULE_ATTR,
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
  L1_EDIT_SLOT_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { fsOpts } from './support/site-factory'

const REPO = path.resolve(__dirname, '..')
const CLIENT_DIR = path.join(REPO, 'apps/control-app/src/builder')

const HEADLINE = 'A painted band.'
const SECOND_RUN = 'And a second run beneath it.'
const SLIDE_ONE = 'The first slide.'
/** Wider than the box it was authored for — the story's "copy that no longer fits". */
const OVERFLOWING =
  'A headline long enough that the box it was authored for cannot hold it, which is accepted: ' +
  'the operator gets the words they asked for and tidies the layout with the AI afterwards. ' +
  'What is never accepted is being unable to read back what you typed.'

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-3bf94bd4: ${what} NOT VERIFIED here — ${WEBUI_SKIP_REASON}`)
}

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 gesture suite: ${WEBUI_SKIP_REASON}`)

/**
 * One page carrying every shape the gesture has to survive: copy nested inside
 * a painted container that is itself a region, a region with no editable copy
 * (an image), and copy inside a behavior module's presentation seam — reached
 * through the page's own seam, which is the ancestor marker the resolution must
 * *not* mistake for the module's.
 */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8')) as Record<string, unknown>

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      // [0.0] a PAINTED container — a region in its own right, and the parent a
      // click on its words has to win against.
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: '#101822' },
        children: [
          { kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }, // [0.0.0]
          { kind: 'text', text: SECOND_RUN, axes: { fontSizePx: 18 } }, // [0.0.1]
        ],
      },
      // [0.1] an image — a real region that exposes no copy.
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
      // [0.2] the page's own seam, and the marker that names it.
      { kind: 'slot', name: 'gallery' },
    ],
  }

  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: { slide: [{ kind: 'text', text: SLIDE_ONE }] },
    },
  ]
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

/** The edit render's bytes, as a real DOM the gesture can be pointed at. */
async function editDom(cwd: string, slug = 'acme'): Promise<JSDOM> {
  const { outDir } = await cmdRender(slug, { cwd, edit: true })
  return new JSDOM(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'))
}

async function editHtml(cwd: string, slug = 'acme'): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, edit: true })
  return fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** The element whose rendered text is exactly `copy`. */
function elementShowing(dom: JSDOM, copy: string): Element {
  const el = [...dom.window.document.querySelectorAll('*')].find(
    (n) => n.children.length === 0 && n.textContent === copy,
  )
  if (!el) throw new Error(`no element renders the copy ${JSON.stringify(copy)}`)
  return el
}

function hover(dom: JSDOM, el: Element): void {
  el.dispatchEvent(new dom.window.Event('pointerover', { bubbles: true }))
}

function hotElements(doc: Document): Element[] {
  return [...doc.querySelectorAll(`.${L1_EDIT_HOT_CLASS}`)]
}

/** Click `el` the way an operator would, and report what the gesture resolved. */
function clickAndResolve(
  dom: JSDOM,
  el: Element,
): { hit: L1EditHit | null; event: Event; hits: number } {
  let hit: L1EditHit | null = null
  let hits = 0
  const bridge = mountL1EditBridge(dom.window.document, (h) => {
    hit = h
    hits += 1
  })
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  bridge.destroy()
  return { hit, event, hits }
}

/** The draft page file, byte for byte — the thing a refused edit must not touch. */
function draftBytes(cwd: string, slug = 'acme'): string {
  return fs.readFileSync(
    path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json'),
    'utf8',
  )
}

/** See `req117-builder-viewport-fill.test.ts` — playwright is tools/generate's. */
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

describe('story-3bf94bd4 the edit gesture', () => {
  let cwd: string
  let browser: import('playwright').Browser | undefined

  beforeAll(async () => {
    const chromium = await loadChromium()
    browser = chromium ? await launchAnyChromium(chromium) : undefined
    if (!browser) {
      console.warn(
        'story-3bf94bd4: no launchable browser — the pointer-geometry and served-module ' +
          'evidence is unverified here.',
      )
    }
  }, 240000)

  afterAll(async () => {
    await browser?.close()
  })

  beforeEach(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })

  afterEach(async () => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /** The builder origin over the current workspace, closed by the caller. */
  const origin = () => startBuilder({ cwd, clientDir: CLIENT_DIR })

  // ── the pointer ────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC993_hovering_marks_only_the_hovered_region_and_never_moves_the_page',
    async () => {
      // AC-993 — at most one region is marked at a time, the mark follows the
      // pointer, and the page does not move under it.
      const dom = await editDom(cwd)
      const doc = dom.window.document
      const first = elementShowing(dom, HEADLINE)
      const second = elementShowing(dom, SECOND_RUN)

      const bridge = mountL1EditBridge(doc, () => {})
      try {
        // Before the pointer arrives, nothing is marked.
        expect(hotElements(doc)).toEqual([])

        hover(dom, first)
        expect(hotElements(doc)).toEqual([first])

        // A sibling takes the mark, and takes it from the first — EXACTLY one.
        hover(dom, second)
        expect(hotElements(doc)).toEqual([second])

        // Off the page's editable content clears it entirely, by either route:
        // onto something that is not a region...
        hover(dom, doc.body)
        expect(hotElements(doc)).toEqual([])
        // ...and out of the document altogether.
        hover(dom, second)
        expect(hotElements(doc)).toEqual([second])
        doc.dispatchEvent(new dom.window.Event('pointerleave'))
        expect(hotElements(doc)).toEqual([])
      } finally {
        bridge.destroy()
      }

      // WHY THE GEOMETRY IS SAFE, stated by the rendering rather than assumed:
      // the highlighted state changes `outline` only, which is painted outside
      // the layout box. A rule that touched a layout property would reflow the
      // page under the pointer and make the rendering being edited stop
      // representing the page it stands for.
      const html = await editHtml(cwd)
      const hotRule = new RegExp(
        `\\[${L1_EDIT_SEGMENT_ATTR}\\]\\.${L1_EDIT_HOT_CLASS}\\s*\\{([^}]*)\\}`,
      ).exec(html)
      expect(hotRule, 'the edit rendering defines a highlighted state').not.toBeNull()
      const declared = hotRule![1]
        .split(';')
        .map((d) => d.split(':')[0].trim())
        .filter(Boolean)
      expect(declared.length).toBeGreaterThan(0)
      for (const property of declared) expect(property).toMatch(/^outline/)

      // And measured, where a machine can measure it: every region's box is the
      // same highlighted as not.
      if (!browser) {
        unverified('AC-993 rendered-geometry measurement under a real pointer')
        return
      }
      const builder = await origin()
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        await page.goto(new URL('/preview/acme/edit/', builder.url).href, {
          waitUntil: 'networkidle',
        })
        // The bridge the browser really runs, from the origin that serves it.
        await page.addScriptTag({
          type: 'module',
          content:
            `import { mountL1EditBridge } from '/framework/edit-client.js'\n` +
            `mountL1EditBridge(document, () => {})\n` +
            `document.documentElement.dataset.gestureBound = 'yes'\n`,
        })
        await page.waitForFunction(() => document.documentElement.dataset.gestureBound === 'yes')

        const boxes = () =>
          page.$$eval(`[${L1_EDIT_PATH_ATTR}]`, (els) =>
            els.map((el) => {
              const r = el.getBoundingClientRect()
              return [el.getAttribute('data-l1-path'), r.x, r.y, r.width, r.height]
            }),
          )
        const target = page.locator(`[${L1_EDIT_PATH_ATTR}="0.0.0"]`)
        const before = await boxes()
        await target.hover()
        await page.waitForFunction(
          (hot) => !!document.querySelector(`[data-l1-path="0.0.0"].${hot}`),
          L1_EDIT_HOT_CLASS,
        )
        // The measurement is of a genuinely highlighted region...
        expect(await target.getAttribute('class')).toContain(L1_EDIT_HOT_CLASS)
        // ...and neither it nor any other region moved or resized.
        expect(await boxes()).toEqual(before)
      } finally {
        await page.close()
        await builder.close()
      }
    },
    180000,
  )

  // ── resolving a click to one region ────────────────────────────────────────

  it('test_UAT_AC995_a_click_resolves_to_the_innermost_region_containing_it', async () => {
    // AC-995 — clicking words edits the words, not the box drawn around them.
    const dom = await editDom(cwd)
    const words = elementShowing(dom, HEADLINE)
    const box = words.closest(`[${L1_EDIT_SEGMENT_ATTR}="container"]`)!

    // The fixture really nests, otherwise this test proves nothing.
    expect(box).not.toBe(words)
    expect(box.contains(words)).toBe(true)

    const { hit, hits } = clickAndResolve(dom, words)
    expect(hits).toBe(1)
    expect(hit!.kind).toBe('copy')
    expect(hit!.element).toBe(words)
    expect(hit!.target.path).toEqual([0, 0, 0])

    // Innermost-wins NARROWS the answer, it does not hide the parent: the
    // container is still a region, and clicking it resolves to it.
    const outer = resolveEditTarget(box)!
    expect(outer.kind).toBe('container')
    expect(outer.target.path).toEqual([0, 0])
    expect(hit!.target.path).not.toEqual(outer.target.path)
  })

  it('test_UAT_AC996_a_click_inside_a_module_seam_names_that_instance_and_seam', async () => {
    // AC-996 — a region inside a behavior module instance is named relative to
    // the instance and its seam, never as a region of the page's own layout.
    const dom = await editDom(cwd)
    const slideCopy = elementShowing(dom, SLIDE_ONE)
    const { hit } = clickAndResolve(dom, slideCopy)

    expect(hit!.kind).toBe('copy')
    expect(hit!.target.moduleId).toBe('gallery')
    expect(hit!.target.slot).toBe('slide')
    expect(hit!.target.path).toEqual([0])

    // The page's OWN seam is an ancestor and carries a marker of the same name
    // — it names a place in the page, not a place in the module, so it must not
    // qualify the region. If it did, the seam would come back as 'gallery'.
    const pageSeam = dom.window.document.querySelector(`[${L1_EDIT_PATH_ATTR}="0.2"]`)!
    expect(pageSeam.getAttribute(L1_EDIT_SLOT_ATTR)).toBe('gallery')
    expect(pageSeam.contains(slideCopy)).toBe(true)
    expect(pageSeam.contains(slideCopy.closest(`[${L1_EDIT_MODULE_ATTR}]`))).toBe(true)
    expect(hit!.target.slot).not.toBe('gallery')

    // WHY THE QUALIFICATION IS LOAD-BEARING: the same short address exists in
    // the page's own space and means something else entirely there.
    expect((await editCopyGet('acme', 'home', '0', fsOpts(cwd))).data).toMatchObject({
      kind: 'container',
      fields: [],
    })

    const builder = await origin()
    try {
      const saved = await fetch(new URL('/api/copy', builder.url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: 'acme',
          page: 'home',
          path: '0',
          module: hit!.target.moduleId,
          slot: hit!.target.slot,
          values: { text: 'The only slide.' },
        }),
      })
      expect(saved.status).toBe(200)
      expect(await saved.json()).toMatchObject({ changed: ['text'] })
    } finally {
      await builder.close()
    }

    // The words changed inside the instance's content, and the page's own
    // regions are untouched.
    const page = JSON.parse(draftBytes(cwd)) as {
      l1: { root: L1Node }
      modules: Array<{ slots: { slide: Array<{ text: string }> } }>
    }
    expect(page.modules[0].slots.slide[0].text).toBe('The only slide.')
    expect(JSON.stringify(page.l1.root)).toContain(HEADLINE)
    expect(JSON.stringify(page.l1.root)).not.toContain('The only slide.')
  })

  // ── the page updating ──────────────────────────────────────────────────────

  it(
    'test_UAT_AC998_after_a_save_the_page_shows_the_new_words_and_is_still_editable',
    async () => {
      // AC-998 — a confirmed change leaves the operator looking at their page
      // with the new words on it, with no further step, and the gesture live on
      // the page they are now looking at.
      const dom = await editDom(cwd)
      const { hit } = clickAndResolve(dom, elementShowing(dom, HEADLINE))
      const builder = await origin()
      try {
        const saved = await fetch(new URL('/api/copy', builder.url), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug: 'acme',
            page: 'home',
            path: hit!.target.path.join('.'),
            values: { text: 'A repainted band.' },
          }),
        })
        expect(saved.status).toBe(200)

        // NO FURTHER STEP: by the time the save answers, the bytes the operator
        // is looking at are already the new ones — nothing else was run.
        const refreshed = await fetch(new URL('/preview/acme/edit/', builder.url))
        const html = await refreshed.text()
        expect(html).toContain('A repainted band.')
        expect(html).not.toContain(HEADLINE)

        // The stored draft holds the new words too, read back independently of
        // the surface that wrote them.
        expect((await editCopyGet('acme', 'home', '0.0.0', fsOpts(cwd))).data).toMatchObject({
          values: { text: 'A repainted band.' },
        })

        // THE PAGE IS A REPLACEMENT, AND THE GESTURE IS LIVE ON IT: hovering
        // still marks, clicking still resolves — to the same region, now
        // carrying the new words.
        const next = new JSDOM(html)
        const nextDoc = next.window.document
        const nextWords = elementShowing(next, 'A repainted band.')
        const bridge = mountL1EditBridge(nextDoc, () => {})
        try {
          expect(nextDoc.body.hasAttribute(L1_EDIT_MARKER_ATTR)).toBe(true)
          hover(next, nextWords)
          expect(hotElements(nextDoc)).toEqual([nextWords])
        } finally {
          bridge.destroy()
        }
        const again = clickAndResolve(next, nextWords)
        expect(again.hits).toBe(1)
        expect(again.hit!.target.path).toEqual([0, 0, 0])
      } finally {
        await builder.close()
      }

      if (!WEBUI_INSTALLED || !browser) {
        unverified('AC-998 the save round trip driven through the builder chrome')
        return
      }
      const builder2 = await origin()
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        await page.goto(builder2.url, { waitUntil: 'networkidle' })
        await page.selectOption('select', 'acme')
        await page.locator('button', { hasText: /^Edit$/ }).click()
        await page
          .frameLocator('.builder-panel__frame')
          .locator(`body[${L1_EDIT_MARKER_ATTR}]`)
          .waitFor()
        const region = page
          .frameLocator('.builder-panel__frame')
          .locator(`[${L1_EDIT_PATH_ATTR}="0.0.0"]`)

        await region.click()
        await page.locator('.builder-modal').waitFor()
        // No click to open the control: since REQ-121 a one-field form opens
        // straight into it (`openLoneControl` in editor.js), so the
        // `.fields-value` VIEW the gesture used to click is already gone. Typing
        // into the control that is there is what the operator actually does.
        const input = page
          .locator('.builder-modal input[type=text], .builder-modal textarea')
          .first()
        await input.waitFor()
        await input.fill('Edited in the browser')
        await input.press('Enter')
        await page.locator('.builder-modal__btn--primary').click()
        await page.locator('.builder-modal').waitFor({ state: 'detached' })

        // No manual refresh, no re-render command, no mode switch.
        await expect
          .poll(() => region.textContent(), { timeout: 20000 })
          .toContain('Edited in the browser')

        // ...and the gesture is live on the page that replaced it.
        await region.hover()
        await expect.poll(() => region.getAttribute('class')).toContain(L1_EDIT_HOT_CLASS)
        await region.click()
        await page.locator('.builder-modal').waitFor()
      } finally {
        await page.close()
        await builder2.close()
      }
    },
    180000,
  )

  it(
    'test_UAT_AC997_one_confirmed_form_is_one_change_however_many_fields_it_held',
    async () => {
      // AC-997 — the confirm is the single moment anything is applied, and it
      // applies the whole change map at once.
      await cmdPublish('acme', { cwd, message: 'base' })
      expect((await editStatus('acme', fsOpts(cwd))).data).toMatchObject({ modified: [] })

      const builder = await origin()
      try {
        const saved = await fetch(new URL('/api/copy', builder.url), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug: 'acme',
            page: 'home',
            path: '0.0.0',
            values: { text: 'Applied whole.' },
          }),
        })
        expect(saved.status).toBe(200)
        // ONE confirm is ONE change: the whole map arrived together and moved
        // exactly one file in the draft.
        expect(await saved.json()).toMatchObject({ changed: ['text'], values: { text: 'Applied whole.' } })
        expect((await editStatus('acme', fsOpts(cwd))).data).toMatchObject({
          modified: ['pages/home.json'],
          added: [],
          removed: [],
        })
      } finally {
        await builder.close()
      }

      if (!WEBUI_INSTALLED || !browser) {
        unverified('AC-997 that editing inside the open form writes nothing until Save')
        return
      }
      const builder2 = await origin()
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      const writes: string[] = []
      page.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/api/copy')) writes.push(req.url())
      })
      try {
        await page.goto(builder2.url, { waitUntil: 'networkidle' })
        await page.selectOption('select', 'acme')
        await page.locator('button', { hasText: /^Edit$/ }).click()
        await page
          .frameLocator('.builder-panel__frame')
          .locator(`body[${L1_EDIT_MARKER_ATTR}]`)
          .waitFor()
        await page
          .frameLocator('.builder-panel__frame')
          .locator(`[${L1_EDIT_PATH_ATTR}="0.0.0"]`)
          .click()
        await page.locator('.builder-modal').waitFor()

        // Straight into its control (REQ-121) — no view cell to open first.
        const input = page
          .locator('.builder-modal input[type=text], .builder-modal textarea')
          .first()
        await input.waitFor()
        await input.fill('Staged, not written')
        await input.press('Enter')
        // Editing a field inside the open form writes NOTHING — the widget is
        // confirmed as a whole, so there is no per-field write to observe.
        expect(writes).toEqual([])

        await page.locator('.builder-modal__btn--primary').click()
        await page.locator('.builder-modal').waitFor({ state: 'detached' })
        expect(writes).toHaveLength(1)
      } finally {
        await page.close()
        await builder2.close()
      }
    },
    180000,
  )

  // ── being told no ──────────────────────────────────────────────────────────

  it(
    'test_UAT_AC999_a_refused_edit_shows_its_own_reason_and_leaves_page_and_draft_unchanged',
    async () => {
      // AC-999 — the one failure path that must never cost the operator their
      // words: nothing lands, and the refusal explains itself in its own terms.
      const homePath = path.join(cwd, 'storage/sites/acme/draft/pages/home.json')
      const sound = fs.readFileSync(homePath, 'utf8')

      // The page the operator is looking at, rendered while everything is well.
      const { outDir } = await cmdRender('acme', { cwd, edit: true })
      const renderedPath = path.join(outDir, 'index.html')
      const beforeHtml = fs.readFileSync(renderedPath, 'utf8')
      expect(beforeHtml).toContain(HEADLINE)

      // A refusal the shared validator really produces: a font size past the L1
      // envelope's range, elsewhere on the page. Any copy save is now refused
      // for a reason that is the validator's own, not a generic failure.
      const broken = JSON.parse(sound) as {
        l1: { root: { children: Array<{ children: Array<{ axes: { fontSizePx: number } }> }> } }
      }
      broken.l1.root.children[0].children[1].axes.fontSizePx = 9999
      fs.writeFileSync(homePath, JSON.stringify(broken, null, 2))

      const beforeDraft = draftBytes(cwd)

      const builder = await origin()
      try {
        const refused = await fetch(new URL('/api/copy', builder.url), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug: 'acme',
            page: 'home',
            path: '0.0.0',
            values: { text: 'What the operator typed.' },
          }),
        })
        expect(refused.status).toBe(400)
        const envelope = (await refused.json()) as {
          code: string
          message: string
          path?: string
          hint?: string
        }
        // The refusal's OWN explanation, not "request failed".
        expect(envelope.code).toBe('SCHEMA_INVALID')
        expect(envelope.message).toContain('fontSizePx')
        expect(envelope.path).toBeTruthy()

        // NOTHING LANDED: draft byte-identical, page on screen still pre-edit.
        expect(draftBytes(cwd)).toBe(beforeDraft)
        expect(fs.readFileSync(renderedPath, 'utf8')).toBe(beforeHtml)

        // The same target confirmed again, once the refusal's cause is gone,
        // succeeds — the operator corrects and re-confirms rather than starting
        // over.
        fs.writeFileSync(homePath, sound)
        const accepted = await fetch(new URL('/api/copy', builder.url), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug: 'acme',
            page: 'home',
            path: '0.0.0',
            values: { text: 'What the operator typed.' },
          }),
        })
        expect(accepted.status).toBe(200)
        expect((await editCopyGet('acme', 'home', '0.0.0', fsOpts(cwd))).data).toMatchObject({
          values: { text: 'What the operator typed.' },
        })
      } finally {
        await builder.close()
      }

      if (!WEBUI_INSTALLED || !browser) {
        unverified('AC-999 that the refused form stays open still holding the typed text')
        return
      }
      const builder2 = await origin()
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        await page.goto(builder2.url, { waitUntil: 'networkidle' })
        await page.selectOption('select', 'acme')
        await page.locator('button', { hasText: /^Edit$/ }).click()
        await page
          .frameLocator('.builder-panel__frame')
          .locator(`body[${L1_EDIT_MARKER_ATTR}]`)
          .waitFor()
        await page
          .frameLocator('.builder-panel__frame')
          .locator(`[${L1_EDIT_PATH_ATTR}="0.0.0"]`)
          .click()
        await page.locator('.builder-modal').waitFor()

        // Straight into its control (REQ-121) — no view cell to open first.
        const input = page
          .locator('.builder-modal input[type=text], .builder-modal textarea')
          .first()
        await input.waitFor()
        await input.fill('Typed and refused')
        await input.press('Enter')

        // Break the page out from under the open form, so the confirm is
        // refused by the real validator.
        fs.writeFileSync(homePath, JSON.stringify(broken, null, 2))
        await page.locator('.builder-modal__btn--primary').click()

        // The form is still open, still holding exactly what was typed, and
        // showing the refusal's own message.
        await expect.poll(() => page.locator('.builder-modal__error:visible').count()).toBe(1)
        expect(await page.locator('.builder-modal').count()).toBe(1)
        expect(await page.locator('.builder-modal__error').first().textContent()).toContain(
          'fontSizePx',
        )
        expect(await page.locator('.builder-modal').textContent()).toContain('Typed and refused')

        // Correct the cause and confirm again from the SAME open form.
        fs.writeFileSync(homePath, sound)
        await page.locator('.builder-modal__btn--primary').click()
        await page.locator('.builder-modal').waitFor({ state: 'detached' })
      } finally {
        await page.close()
        await builder2.close()
      }
    },
    180000,
  )

  // ── copy that no longer fits ───────────────────────────────────────────────

  it('test_UAT_AC1004_copy_longer_than_its_box_still_reads_back_in_full', async () => {
    // AC-1004 — ugly output on the page is accepted; an operator unable to read
    // back what they typed is not.
    const builder = await origin()
    try {
      const saved = await fetch(new URL('/api/copy', builder.url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: 'acme',
          page: 'home',
          path: '0.0.0',
          values: { text: OVERFLOWING },
        }),
      })
      expect(saved.status).toBe(200)

      // The page renders it into the box it was authored for, whatever that
      // does to the layout — that is the accepted half.
      const dom = new JSDOM(await (await fetch(new URL('/preview/acme/edit/', builder.url))).text())
      expect(elementShowing(dom, OVERFLOWING).getAttribute(L1_EDIT_SEGMENT_ATTR)).toBe('copy')

      // Reopening the form over that region — the exact call the form is built
      // from — hands back the WHOLE string, character for character, and asks
      // for the control that can show it.
      const reopened = await fetch(
        new URL(
          `/api/copy?${new URLSearchParams({ slug: 'acme', page: 'home', path: '0.0.0' })}`,
          builder.url,
        ),
      )
      const loaded = (await reopened.json()) as {
        fields: Array<Record<string, string>>
        values: Record<string, string>
      }
      expect(loaded.values.text).toBe(OVERFLOWING)
      expect(loaded.values.text.length).toBe(OVERFLOWING.length)
      expect(loaded.fields[0]).toEqual({
        name: 'text',
        label: 'Text',
        type: 'string',
        widget: 'textarea',
      })
    } finally {
      await builder.close()
    }
  })

  // ── viewing is not editing ─────────────────────────────────────────────────

  it('test_UAT_AC1005_a_page_being_viewed_is_not_marked_intercepted_or_editable', async () => {
    // AC-1005 — this is a property of the GESTURE, not of the workspace's
    // housekeeping: the gesture is attached to the viewed page exactly as the
    // workspace attaches it to whatever it is displaying, and the page is still
    // left entirely alone.
    const { outDir } = await cmdRender('acme', { cwd })
    const dom = new JSDOM(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'))
    const doc = dom.window.document

    // The page as a visitor sees it: no editable marker, and no addresses.
    expect(doc.body.hasAttribute(L1_EDIT_MARKER_ATTR)).toBe(false)
    expect(doc.querySelectorAll(`[${L1_EDIT_PATH_ATTR}]`)).toHaveLength(0)

    const words = elementShowing(dom, HEADLINE)
    let ownClicks = 0
    words.addEventListener('click', () => {
      ownClicks += 1
    })

    let opened = 0
    const bridge = mountL1EditBridge(doc, () => {
      opened += 1
    })
    try {
      hover(dom, words)
      expect(hotElements(doc)).toEqual([])

      const click = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
      words.dispatchEvent(click)

      // Nothing was intercepted — the page's own click behaviour ran and its
      // default was left alone — and nothing the gesture could open was reached.
      expect(ownClicks).toBe(1)
      expect(click.defaultPrevented).toBe(false)
      expect(opened).toBe(0)
    } finally {
      bridge.destroy()
    }

    // The same gesture on the SAME site's editable rendering does mark and does
    // intercept, so the assertions above measure the marker rather than a dead
    // bridge.
    const edit = await editDom(cwd)
    const editWords = elementShowing(edit, HEADLINE)
    const live = clickAndResolve(edit, editWords)
    expect(live.hits).toBe(1)
    expect(live.event.defaultPrevented).toBe(true)
  })

  // ── one implementation of the address reading ──────────────────────────────

  it(
    'test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source',
    async () => {
      // AC-1006 — the reader of the markup cannot drift from the writer of it.
      const source = fs.readFileSync(
        path.join(REPO, 'packages/framework/src/l1/edit-client.ts'),
        'utf8',
      )
      const operations = [...source.matchAll(/export function (\w+)/g)].map((m) => m[1])
      expect(operations).toContain('resolveEditTarget')
      expect(operations).toContain('mountL1EditBridge')

      const builder = await origin()
      try {
        // The module the workspace's browser code loads.
        const loaded = await fetch(new URL('/framework/edit-client.js', builder.url))
        expect(loaded.status).toBe(200)
        expect(loaded.headers.get('content-type')).toContain('javascript')
        const js = await loaded.text()

        // The SAME operations as the source the renderer is built against...
        for (const op of operations) expect(js).toContain(`export function ${op}`)
        // ...and no build-time-only syntax left in it for a browser to choke on.
        expect(js).not.toMatch(/\bimport\s+type\b/)
        expect(js).not.toMatch(/\binterface\s+\w+\s*\{/)

        // Its shared-contract import resolves to an address this origin serves.
        expect(js).not.toContain('@1stcontact/site-schema')
        expect(js).toContain('/framework/site-schema-edit.js')
        const contract = await fetch(new URL('/framework/site-schema-edit.js', builder.url))
        expect(contract.status).toBe(200)
        const contractJs = await contract.text()
        expect(contractJs).toContain('export function parseL1Path')
        expect(contractJs).toContain(`'${L1_EDIT_PATH_ATTR}'`)

        // And it is genuinely RUNNABLE where it has to run.
        if (browser) {
          const page = await browser.newPage()
          try {
            await page.goto(new URL('/preview/acme/edit/', builder.url).href, {
              waitUntil: 'networkidle',
            })
            // A real module script, not `page.evaluate`: the import has to be
            // the browser's own, resolved against this origin.
            await page.addScriptTag({
              type: 'module',
              content:
                `import * as mod from '/framework/edit-client.js'\n` +
                `window.__gestureExports = Object.entries(mod)\n` +
                `  .filter(([, v]) => typeof v === 'function').map(([k]) => k).sort()\n`,
            })
            await page.waitForFunction(() =>
              Array.isArray((window as unknown as { __gestureExports?: string[] }).__gestureExports),
            )
            const exported = await page.evaluate(
              () => (window as unknown as { __gestureExports: string[] }).__gestureExports,
            )
            for (const op of operations) expect(exported).toContain(op)
          } finally {
            await page.close()
          }
        } else {
          unverified('AC-1006 that the served module loads and runs in a real browser')
        }
      } finally {
        await builder.close()
      }

      // NO SECOND COPY in the workspace's own browser source: nothing there
      // declares the resolution, and nothing there reads the stamp it depends
      // on. `main.js` reaches it by URL, which is the single delivery point.
      const files: string[] = []
      const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const abs = path.join(dir, entry.name)
          if (entry.isDirectory()) walk(abs)
          else if (/\.(js|ts|mjs)$/.test(entry.name)) files.push(abs)
        }
      }
      walk(path.join(REPO, 'apps/control-app/src'))
      expect(files.length).toBeGreaterThan(0)

      const delivery: string[] = []
      for (const file of files) {
        const text = fs.readFileSync(file, 'utf8')
        const rel = path.relative(REPO, file)
        expect(text, `${rel} must not declare a second resolution`).not.toMatch(
          /function\s+(resolveEditTarget|mountL1EditBridge)\b/,
        )
        // The stamp is the markup contract; a file that reads it is a second
        // reader, free to drift from the emitter.
        for (const attr of [
          L1_EDIT_PATH_ATTR,
          L1_EDIT_SEGMENT_ATTR,
          L1_EDIT_MODULE_ATTR,
          L1_EDIT_SLOT_ATTR,
        ]) {
          expect(text, `${rel} must not read ${attr} itself`).not.toContain(attr)
        }
        if (/from\s+['"]\/framework\/edit-client\.js['"]/.test(text)) delivery.push(rel)
      }
      expect(delivery).toEqual(['apps/control-app/src/builder/main.js'])
    },
    180000,
  )
})
