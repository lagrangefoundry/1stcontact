/**
 * REQ-117 — the edit loop as the user drives it (DOC-28 §4, §11).
 *
 * WHY A REAL BROWSER. Every step here is something jsdom cannot answer. The
 * bridge binds inside an *iframe's* document, `closest` walks a rendered tree,
 * the hover treatment is a class the stylesheet reacts to, and Save depends on
 * a same-origin `fetch` and a frame reload. A jsdom version of this file would
 * assert the wiring and prove nothing about the loop.
 *
 * The server half is in `tests/req117-edit-loop.test.ts` and always runs; this
 * file reports loudly when it cannot measure, because a quiet skip on the only
 * test of the actual user gesture is indistinguishable from a pass.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, editCopyGet, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')

if (!WEBUI_INSTALLED) console.warn(`REQ-117 browser suite skipped: ${WEBUI_SKIP_REASON}`)

/** See the note in `req117-builder-viewport-fill.test.ts` — playwright is tools/generate's. */
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

describe.skipIf(!WEBUI_INSTALLED)('REQ-117 the loop in a real browser', () => {
  let cwd: string
  let builder: BuilderHandle | undefined
  let browser: import('playwright').Browser | undefined
  let addr: string
  let pageId: string

  beforeAll(async () => {
    const chromium = await loadChromium()
    if (!chromium) {
      console.warn('REQ-117 browser loop SKIPPED — playwright unresolvable. The loop is unverified here.')
      return
    }
    browser = await launchAnyChromium(chromium)
    if (!browser) {
      console.warn('REQ-117 browser loop SKIPPED — no launchable browser. The loop is unverified here.')
      return
    }
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req117-br-'))
    cmdNew('alpha', { cwd })
    const { outDir } = await cmdRender('alpha', { cwd, edit: true })
    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    addr = /data-l1-path="([^"]+)"[^>]*data-l1-segment="copy"/.exec(html)![1]
    pageId = /data-fc-page="([^"]+)"/.exec(html)![1]
    builder = await startBuilder({ cwd, clientDir: path.join(REPO, 'apps/control-app/src/builder') })
  }, 240000)

  afterAll(async () => {
    await browser?.close()
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /** A builder page already switched to the site and into Edit mode. */
  async function openEditor(): Promise<import('playwright').Page> {
    const page = await browser!.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(builder!.url, { waitUntil: 'networkidle' })
    await page.selectOption('select', 'alpha')
    await page.locator('button', { hasText: /^Edit$/ }).click()
    // The bridge binds on the frame's `load`, so wait for the document it binds
    // to rather than a timeout.
    await page.frameLocator('.builder-panel__frame').locator('body[data-fc-edit]').waitFor()
    return page
  }

  const seg = (page: import('playwright').Page) =>
    page.frameLocator('.builder-panel__frame').locator(`[data-l1-path="${addr}"]`)

  it(
    'test_UAT_FC_REQ-117_hovering_a_segment_marks_it_hot',
    async () => {
      if (!browser || !builder) return
      const page = await openEditor()
      try {
        // The client only says WHICH segment is hot; the edit channel's own
        // stylesheet says what hot looks like. Assert the class, since that is
        // the whole of the client's contribution.
        await expect.poll(() => seg(page).getAttribute('class')).not.toContain('l1-edit-hot')
        await seg(page).hover()
        await expect.poll(() => seg(page).getAttribute('class')).toContain('l1-edit-hot')
      } finally {
        await page.close()
      }
    },
    120000,
  )

  it(
    'test_UAT_FC_REQ-117_clicking_a_segment_opens_a_modal_over_its_fields',
    async () => {
      if (!browser || !builder) return
      const page = await openEditor()
      try {
        const before = await seg(page).textContent()
        await seg(page).click()
        await page.locator('.builder-modal').waitFor()

        // The form is `mountFields`, not hand-rolled — assert its markup, so a
        // future hand-rolled replacement fails here rather than passing quietly.
        expect(await page.locator('.builder-modal .fields').count()).toBe(1)
        // ...in buffered commit, which is what makes one Save one diff.
        expect(await page.locator('.builder-modal .fields').getAttribute('data-commit')).toBe(
          'buffered',
        )
        // The full string is legible in the form regardless of what the render
        // did to it on the page. It is read off the CONTROL, not the modal's
        // text: since REQ-121 a one-field form opens straight into its control
        // (`openLoneControl` in editor.js), so the value lives in the input.
        const input = page.locator('.builder-modal input[type=text], .builder-modal textarea').first()
        await input.waitFor()
        expect(await input.inputValue()).toContain(before!.trim())
      } finally {
        await page.close()
      }
    },
    120000,
  )

  it(
    'test_UAT_FC_REQ-117_save_writes_the_edit_and_the_page_shows_it',
    async () => {
      if (!browser || !builder) return
      const page = await openEditor()
      try {
        await seg(page).click()
        await page.locator('.builder-modal').waitFor()

        // Straight into its control since REQ-121 — no view cell to open first.
        const input = page.locator('.builder-modal input[type=text], .builder-modal textarea').first()
        await input.waitFor()
        await input.fill('Edited in the browser')
        await input.press('Enter')
        await page.locator('.builder-modal__btn--primary').click()

        // The modal closes only after the write AND the re-render have landed.
        await page.locator('.builder-modal').waitFor({ state: 'detached' })

        // THE POINT OF THE TICKET: the definition changed, and the page the user
        // is looking at shows it without them doing anything else.
        await expect.poll(() => seg(page).textContent(), { timeout: 20000 }).toContain(
          'Edited in the browser',
        )
        expect(editCopyGet('alpha', pageId, addr, { cwd }).data).toMatchObject({
          values: { text: 'Edited in the browser' },
        })
      } finally {
        await page.close()
      }
    },
    120000,
  )

  it(
    'test_UAT_FC_REQ-117_view_mode_is_untouched_by_the_bridge',
    async () => {
      if (!browser || !builder) return
      // View mode must behave exactly as published: no interception, no modal.
      // This is a property of the BRIDGE (it refuses to bind on a document with
      // no edit marker), not of the host remembering to unmount — so it holds
      // even though the host binds on every frame load in both modes.
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        await page.goto(builder.url, { waitUntil: 'networkidle' })
        await page.selectOption('select', 'alpha')
        await page.frameLocator('.builder-panel__frame').locator('body').waitFor()

        const viewSeg = page.frameLocator('.builder-panel__frame').locator(`[data-l1-path="${addr}"]`)
        // The draft render carries no stamp at all, so there is nothing to click
        // — which is itself the assertion that View is a different document.
        expect(await viewSeg.count()).toBe(0)
        expect(await page.locator('.builder-modal').count()).toBe(0)
      } finally {
        await page.close()
      }
    },
    120000,
  )
})
