/**
 * BUG-35 — **the box's tracking reaches the words**.
 *
 * The copy dialog dresses its editing box in the PAGE's typography, and the
 * words are drawn by a form control inside that box. `fields.css` carries the
 * dressing inward with `.fields-control { font: inherit }` — and the `font`
 * shorthand expands to family, size, weight and style, which is exactly the set
 * that has always previewed correctly. It does not expand to `text-transform`
 * or `letter-spacing`, and the UA stylesheet resets BOTH on form controls, so
 * those two landed on the wrapper and never reached a glyph.
 *
 * `builder.css` re-declares the inheritance the UA reset broke, for both.
 *
 * WHY THIS SUITE EXISTS ALONGSIDE AC-1138. The two properties are one defect
 * with one fix, but only one of them is an editable parameter, so only one of
 * them is measured by the criterion that covers the parameter sheet. AC-1138
 * drives the Capitalisation control and asserts on the words, which pins
 * `text-transform`; nothing anywhere asserts that `letter-spacing` arrives.
 * Tracking is not a control the operator can move — it is part of the opening
 * dressing — so its failure never read as a dead control, only as the box
 * quietly mis-mirroring any headline set tight, which is why it went unreported
 * for as long as it did. Deleting `letter-spacing: inherit` today leaves every
 * other suite green.
 *
 * NOT A REGEX OVER THE STYLESHEET, and not jsdom. A declaration in `builder.css`
 * proves a declaration exists, which is the thing that was true throughout the
 * defect. jsdom is no better here for a more interesting reason: it ships no UA
 * stylesheet and resolves no inherited properties through the cascade, so it
 * cannot represent either half of the mechanism — the reset that broke the
 * inheritance or the re-declaration that restores it — and an assertion there
 * would read identically before and after the fix. The engine that has both is
 * the evidence. Where this machine can launch none, the criterion is reported
 * LOUDLY as unverified rather than quietly reduced to something weaker.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { L1_EDIT_MARKER_ATTR, L1_EDIT_PATH_ATTR } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'

/**
 * A headline set TIGHT, and body copy that sets no tracking at all.
 *
 * The pair is the whole design of the fixture. `letter-spacing`'s "off" value is
 * a word rather than a number, so an implementation that forced tracking onto
 * every control would be indistinguishable from a correct one measured on the
 * headline alone — both report `-1px` there. The body run is what separates
 * them: it must come back `normal`, the property's own initial value, because
 * nothing on the page asked for anything else.
 *
 * The value is NOT scaled on its way into the box (only size is, into the
 * editing range), so the number asserted below is the number the page renders.
 */
const A_HEADLINE = '0.0'
const HEADLINE_TRACKING_PX = -1
const A_BODY = '0.1'

if (!WEBUI_INSTALLED) console.warn(`BUG-35 tracking suite: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`BUG-35: ${what} NOT VERIFIED here`)
}

function seedSite(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
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
          fontSizePx: 72,
          fontWeight: 700,
          letterSpacingPx: HEADLINE_TRACKING_PX,
          color: '#101822',
        },
      },
      {
        kind: 'text',
        id: 'body',
        text: 'Body copy, which asks for no tracking of its own.',
        axes: { fontFamily: STACK, fontSizePx: 16, fontWeight: 400, color: '#101822' },
      },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
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

describe('BUG-35 the editing box mirrors the page down to the glyphs', () => {
  let cwd: string
  let builder: BuilderHandle
  let browser: import('playwright').Browser | undefined

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'bug-35-tracking-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    await cmdRender('acme', { cwd, edit: true })
    builder = await startBuilder({ cwd })
    const chromium = await loadChromium()
    browser = chromium ? await launchAnyChromium(chromium) : undefined
  }, 240000)

  afterAll(async () => {
    await browser?.close()
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /** Open the workspace the way the operator does, and click a run. */
  async function openCopyDialog(page: import('playwright').Page, address: string): Promise<void> {
    await page.goto(builder.url, { waitUntil: 'networkidle' })
    await page.selectOption('select', 'acme')
    await page.locator('button', { hasText: /^Edit$/ }).click()
    const framed = page.frameLocator('.builder-panel__frame')
    await framed.locator(`body[${L1_EDIT_MARKER_ATTR}]`).waitFor({ state: 'attached' })
    const frame = page.frames().find((f) => f !== page.mainFrame())
    expect(frame, 'the workspace displays the page in a frame').toBeTruthy()
    await frame!.locator(`[${L1_EDIT_PATH_ATTR}="${address}"]`).click()
    await page.locator('.builder-modal__box .fields-control').waitFor()
  }

  it(
    'test_UAT_FC_BUG-35_a_tracked_run_previews_its_tracking_on_the_words_not_the_wrapper',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`a tracked run previews its tracking (${WEBUI_SKIP_REASON})`)
        return
      }
      if (!browser) {
        unverified('a tracked run previews its tracking (no chromium could be launched)')
        return
      }

      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        await openCopyDialog(page, A_HEADLINE)

        // BOTH HALVES, because for the whole life of the defect the first was
        // true and the second was not. Keeping them apart is what makes a
        // regression attributable: the wrapper losing the value would be the
        // dressing that reads the page, the words losing it would be the rule
        // that re-declares the inheritance.
        const onBox = await page.$eval(
          '.builder-modal__box',
          (el) => getComputedStyle(el as HTMLElement).letterSpacing,
        )
        expect(Number.parseFloat(onBox), 'the tracking IS mirrored, on the box').toBeCloseTo(
          HEADLINE_TRACKING_PX,
          1,
        )

        const onWords = await page.$eval(
          '.builder-modal__box .fields-control',
          (el) => getComputedStyle(el as HTMLElement).letterSpacing,
        )
        expect(onWords, 'and is not left at the UA reset').not.toBe('normal')
        expect(
          Number.parseFloat(onWords),
          'and reaches the words the operator is editing',
        ).toBeCloseTo(HEADLINE_TRACKING_PX, 1)
      } finally {
        await page.close()
      }
    },
    240000,
  )

  it(
    'test_UAT_FC_BUG-35_an_untracked_run_is_not_given_tracking_and_the_sheet_keeps_the_chrome',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`an untracked run is not given tracking (${WEBUI_SKIP_REASON})`)
        return
      }
      if (!browser) {
        unverified('an untracked run is not given tracking (no chromium could be launched)')
        return
      }

      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        await openCopyDialog(page, A_BODY)

        // THE OTHER DIRECTION. Restoring an inheritance is only correct while
        // there is something to inherit; a run that asks for no tracking must
        // open at the property's own initial value, not at whatever the last
        // segment was set in.
        const onWords = await page.$eval(
          '.builder-modal__box .fields-control',
          (el) => getComputedStyle(el as HTMLElement).letterSpacing,
        )
        expect(onWords, 'a run that asks for no tracking is given none').toBe('normal')

        // AND THE FIX STAYS WHERE IT WAS PUT. The rule is deliberately scoped to
        // the preview box, because that box is the only host in the chrome that
        // dresses a control in the PAGE's typography rather than its own. The
        // parameter sheet's controls sit outside it and must keep reading as
        // chrome — so a later widening of the selector to `.fields-control`
        // fails here rather than in the operator's eyes.
        const inSheet = await page.$$eval('.builder-modal__props .fields-control', (els) =>
          els.map((el) => getComputedStyle(el as HTMLElement).letterSpacing),
        )
        expect(inSheet.length, 'the sheet renders controls of its own').toBeGreaterThan(0)
        for (const spacing of inSheet) {
          expect(spacing, 'the sheet is chrome, and is dressed as chrome').toBe('normal')
        }
      } finally {
        await page.close()
      }
    },
    240000,
  )
})
