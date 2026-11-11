/**
 * story-b3de4571 (STORY-107) — **a picture in a chat message is bounded by the
 * pane** (AC-2572, REQ-217).
 *
 * WHAT MAKES THIS EVIDENCE. Nothing here reads a stylesheet as text. In a real
 * Chromium, the builder's own chrome document (`chromeHtml()`, the document the
 * Worker serves, so the same stylesheets in the same order, `builder.css`
 * last) is loaded against the assets `1c assets` emitted. The page's
 * module script is swapped for a small harness that mounts the real assistant
 * pane (`/builder/chat.js` → the real chat component) and replays an assistant
 * turn whose markdown is a picture far larger than the pane. Then it measures what
 * the browser actually laid out.
 *
 * So the test fails if the rule stops matching a message image (a class change in
 * the chat component), if a later or more specific rule overrides it, or if the
 * builder page stops loading the stylesheet. A source-text check catches none
 * of those.
 *
 * THE MARKDOWN ENGINES ARE INJECTED through the builder's own seams
 * (`/builder/markdown.js`), as every rendered-markdown suite does. The page
 * reaches no CDN, so without them a turn is escaped source and has no `<img>`.
 *
 * IT SKIPS VISIBLY RATHER THAN PASSING VACUOUSLY. Where no Chromium can be
 * launched, the case skips itself and prints why (the same gating as AC-2421's
 * browser case).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../tools/generate/src/cli'
import { chromeHtml } from '../apps/control-app/src/chrome'
import { withDistAssetsLock } from './support/fs-lock'

const REPO = path.resolve(__dirname, '..')
const DIST = path.join(REPO, 'apps', 'control-app', 'dist-assets')
const ORIGIN = 'http://builder.test'
const ENTRY_TAG = '<script type="module" src="/builder/main.js"></script>'

/** The pane's width in the builder's split; the test lays it out at this size. */
const PANE_WIDTH = 380

/** A picture with an intrinsic size, drawn rather than shipped. */
const picture = (w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  `<rect width="${w}" height="${h}" fill="#1a3a6b"/></svg>`

const PICTURES: Record<string, string> = {
  '/pictures/wide.svg': picture(3000, 2000),
  '/pictures/tall.svg': picture(1000, 4000),
}

/**
 * The harness that replaces `main.js`. It mounts the real pane in a host the
 * width of the builder's chat column and replays one assistant turn per picture.
 */
const HARNESS = `<div id="host" style="width:${PANE_WIDTH}px;height:900px;display:flex;flex-direction:column"></div>
<script type="module">
import { createChatPanel } from '/builder/chat.js'
import { markdownReady, setParser, setSanitizer } from '/builder/markdown.js'
await markdownReady
setParser({
  parse: (md) => md.replace(/!\\[(.*?)\\]\\((.*?)\\)/g, '<p><img alt="$1" src="$2"></p>'),
  parseInline: (md) => md,
})
setSanitizer((html) => html)
const pane = createChatPanel({ transport: { streamPrompt: async () => {} } })
document.getElementById('host').append(pane.element)
pane.setSession({
  sessionId: 'site-acme',
  ready: true,
  turns: [
    { role: 'user', markdown: 'Draw me a banner.' },
    { role: 'assistant', markdown: '![wide](/pictures/wide.svg)' },
    { role: 'assistant', markdown: '![tall](/pictures/tall.svg)' },
  ],
})
window.__mounted = true
</script>`

/** See `reconciliation-marked-points-served-modules.test.ts`: playwright is tools/generate's. */
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

const TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

interface Laid {
  alt: string
  loaded: boolean
  naturalWidth: number
  naturalHeight: number
  width: number
  height: number
  /** The content width of the message element the picture sits in. */
  containerWidth: number
  paneWidth: number
}

describe('story-b3de4571 — a picture in the turn is bounded by the pane', () => {
  let browser: import('playwright').Browser | undefined
  let why = ''

  beforeAll(async () => {
    const log = console.log
    console.log = () => {}
    try {
      await withDistAssetsLock(REPO, () => run(['assets']))
    } finally {
      console.log = log
    }
    const chromium = await loadChromium()
    if (!chromium) why = 'playwright is not installed in tools/generate'
    else {
      browser = await launchAnyChromium(chromium)
      if (!browser) why = 'no Chromium could be launched (run `npx playwright install chromium`)'
    }
    if (why) console.warn(`AC-2572 browser case SKIPPED: ${why}. The pane's image bound is unverified here.`)
  }, 240_000)

  afterAll(async () => {
    await browser?.close()
  })

  it('test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane', async (ctx) => {
    if (!browser) ctx.skip(`no browser: ${why}`)

    // THE BUILDER'S OWN DOCUMENT, with only its entry module swapped for the harness.
    const chrome = chromeHtml()
    expect(chrome, 'the chrome document no longer loads builder.css').toContain('/builder/builder.css')
    expect(chrome).toContain(ENTRY_TAG)
    const html = chrome.replace(ENTRY_TAG, HARNESS)

    const page = await browser!.newPage({ viewport: { width: 1200, height: 1000 } })
    page.setDefaultTimeout(15_000)
    const missing: string[] = []
    try {
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (url.origin !== ORIGIN) return route.abort()
        if (url.pathname === '/') {
          return route.fulfill({ status: 200, contentType: 'text/html', body: html })
        }
        const pictureBody = PICTURES[url.pathname]
        if (pictureBody) return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: pictureBody })
        const file = path.join(DIST, url.pathname.replace(/^\//, ''))
        if (!file.startsWith(DIST) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          missing.push(url.pathname)
          return route.fulfill({ status: 404, body: '' })
        }
        return route.fulfill({
          status: 200,
          contentType: TYPES[path.extname(file)] ?? 'application/octet-stream',
          body: fs.readFileSync(file),
        })
      })

      await page.goto(`${ORIGIN}/`)
      await page.waitForFunction(() => (window as unknown as { __mounted?: boolean }).__mounted === true, null, {
        timeout: 15_000,
      })
      expect(missing, 'the builder page requested assets that were not emitted').not.toContain('/builder/builder.css')

      // BOTH PICTURES ARE IN THE PANE AND HAVE LOADED, so the sizes read below are layout, not a broken icon.
      await page.waitForFunction(
        () => {
          const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.builder-chat img'))
          return imgs.length === 2 && imgs.every((i) => i.complete && i.naturalWidth > 0)
        },
        null,
        { timeout: 15_000 },
      )

      const laid = (await page.evaluate(() => {
        const pane = document.querySelector('.builder-chat') as HTMLElement
        return Array.from(pane.querySelectorAll<HTMLImageElement>('img')).map((img) => {
          const box = img.getBoundingClientRect()
          const parent = img.parentElement as HTMLElement
          const style = getComputedStyle(parent)
          const containerWidth =
            parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
          return {
            alt: img.alt,
            loaded: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            width: box.width,
            height: box.height,
            containerWidth,
            paneWidth: pane.getBoundingClientRect().width,
          }
        })
      })) as Laid[]

      const byAlt = Object.fromEntries(laid.map((l) => [l.alt, l]))
      expect(Object.keys(byAlt).sort()).toEqual(['tall', 'wide'])

      for (const img of laid) {
        expect(img.naturalWidth, `${img.alt} did not load`).toBeGreaterThan(900)
        // RENDERED, NOT COLLAPSED: a bound that hid the picture would also "fit".
        expect(img.width, `${img.alt} rendered with no width`).toBeGreaterThan(0)
        expect(img.height, `${img.alt} rendered with no height`).toBeGreaterThan(0)
        // NO WIDER THAN THE MESSAGE IT IS IN, AND SO NO WIDER THAN THE PANE.
        expect(img.width, `${img.alt} is wider than its message`).toBeLessThanOrEqual(img.containerWidth + 0.5)
        expect(img.width, `${img.alt} is wider than the pane`).toBeLessThanOrEqual(img.paneWidth + 0.5)
        expect(img.paneWidth).toBeLessThanOrEqual(PANE_WIDTH + 0.5)
        // NO TALLER THAN 260px.
        expect(img.height, `${img.alt} is taller than 260px`).toBeLessThanOrEqual(260.5)
        // AND NOT DISTORTED: both axes shrink together.
        expect(img.width / img.height).toBeCloseTo(img.naturalWidth / img.naturalHeight, 1)
      }

      // The tall picture is held by the height bound, the wide one by the width bound.
      expect(byAlt.tall.height).toBeGreaterThan(259.5)
      expect(byAlt.wide.width).toBeGreaterThan(byAlt.wide.containerWidth - 0.5)
    } finally {
      await page.close()
    }
  })
})
