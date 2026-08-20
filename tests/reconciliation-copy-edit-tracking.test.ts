/**
 * story-3bf94bd4 — **the box's tracking reaches the words** (AC-1284).
 *
 * The editing box is dressed in the PAGE's typography, and the words inside it
 * are drawn by a form control, not by the box. The component carries the dressing
 * inward with `font: inherit` — and the `font` shorthand expands to family, size,
 * weight and style, which is exactly the set that previewed correctly from the
 * first day. It expands to neither `letter-spacing` nor `text-transform`, and the
 * browser's own styling of form controls resets both, so both landed on the
 * wrapper and reached no glyph. The workspace stylesheet re-declares the
 * inheritance that reset broke, scoped to the editing box.
 *
 * WHY THIS IS ITS OWN CRITERION rather than a clause of the live-preview one.
 * Tracking is not a control the operator can move — it is part of the opening
 * dressing — so its failure never read as a dead control, only as the box quietly
 * mis-mirroring any headline set tight. That is why it went unreported for as long
 * as it did and why nothing asserted it at all.
 *
 * BOTH HALVES ARE ASSERTED, and separately, so a regression is attributable: the
 * box holding the value proves the dressing read the page, the words holding it
 * proves the dressing reached them. For the whole life of the defect the first was
 * true and the second was not.
 *
 * NOT A REGEX OVER THE STYLESHEET, AND NOT jsdom. A declaration existing is
 * precisely the thing that stayed true throughout the defect. jsdom is no better
 * for a more interesting reason: it ships no user-agent stylesheet and resolves no
 * inherited properties through the cascade, so it can represent neither the reset
 * that broke the inheritance nor the rule that restores it, and an assertion there
 * reads identically before and after the fix. The engine that has both is the
 * evidence. Where this machine can produce none, the criterion is reported LOUDLY
 * as unverified rather than quietly reduced to something weaker.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender } from '../tools/generate/src/cli'
import { L1_EDIT_MARKER_ATTR, L1_EDIT_PATH_ATTR } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { openOrigin, type OriginHandle } from './support/builder-origin'

const REPO = path.resolve(__dirname, '..')
const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'

/**
 * A headline set TIGHT, and body copy that sets no tracking at all.
 *
 * The pair is the whole design of the fixture. `letter-spacing`'s "off" value is a
 * word rather than a number, so an implementation that forced tracking onto every
 * control would be indistinguishable from a correct one measured on the headline
 * alone — both report `-1px` there. The body run is what separates them: it must
 * come back `normal`, the property's own initial value, because nothing on the
 * page asked for anything else.
 *
 * Tracking is NOT scaled on its way into the box (only size is, into the editing
 * range), so the number asserted below is the number the page renders.
 */
const A_HEADLINE = '0.0'
const HEADLINE_TRACKING_PX = -1
const A_BODY = '0.1'

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 tracking suite: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-3bf94bd4: AC-1284 ${what} NOT VERIFIED here`)
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

describe('story-3bf94bd4 the editing box mirrors the page down to the glyphs', () => {
  let cwd: string
  let origin: OriginHandle
  let originUrl: string | undefined
  let browser: import('playwright').Browser | undefined

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-tracking-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    await cmdRender('acme', { cwd, edit: true })
    origin = await openOrigin(cwd)
    // A BROWSER NEEDS A SOCKET. The in-process fallback the other suites in this
    // story fall back to serves a jsdom `fetch`; it cannot serve a real engine,
    // so this criterion reports unverified there rather than pretending.
    originUrl = origin.url
    const chromium = await loadChromium()
    browser = chromium ? await launchAnyChromium(chromium) : undefined
  }, 240000)

  afterAll(async () => {
    await browser?.close()
    await origin?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /** Open the workspace the way the operator does, and click a run. */
  async function openCopyDialog(page: import('playwright').Page, address: string): Promise<void> {
    await page.goto(originUrl!, { waitUntil: 'networkidle' })
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
    'test_UAT_AC1284_a_tracked_run_previews_its_tracking_on_the_words_and_the_sheet_stays_chrome',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified(`the box's tracking (${WEBUI_SKIP_REASON})`)
        return
      }
      if (!originUrl) {
        unverified('the box’s tracking (this machine refuses to listen on a socket, so no engine can reach the workspace)')
        return
      }
      if (!browser) {
        unverified('the box’s tracking (no chromium could be launched)')
        return
      }

      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
      try {
        // ── a run the page sets TIGHT ─────────────────────────────────────────
        await openCopyDialog(page, A_HEADLINE)

        // BOTH HALVES, kept apart so a regression is attributable: the wrapper
        // losing the value is the dressing that reads the page, the words losing
        // it is the rule that re-declares the inheritance the reset broke.
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
          'and reaches the words the operator is editing, at the page’s own value',
        ).toBeCloseTo(HEADLINE_TRACKING_PX, 1)

        // ── a run that asks for none is given none ────────────────────────────
        //
        // Restoring an inheritance is only correct while there is something to
        // inherit: this run must open at the property's own initial value, not at
        // whatever the last region was set in.
        await openCopyDialog(page, A_BODY)
        const untracked = await page.$eval(
          '.builder-modal__box .fields-control',
          (el) => getComputedStyle(el as HTMLElement).letterSpacing,
        )
        expect(untracked, 'a run that asks for no tracking is given none').toBe('normal')

        // ── and the fix stays where it was put ────────────────────────────────
        //
        // The rule is scoped to the editing box, which is the only host in the
        // workspace that dresses a control in the PAGE's typography rather than
        // its own. The parameter sheet's controls sit outside it and keep reading
        // as chrome — so a later widening of the selector fails here rather than
        // in the operator's eyes.
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
