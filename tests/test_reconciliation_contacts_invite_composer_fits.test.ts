/**
 * STORY-146 (story-7b1025b8) — the invite composer lies inside its dialog.
 *
 * AC-2367: opening the invite dialog from the Contacts tab shows Subject,
 * To-List and Body wholly inside the dialog panel, at a desktop viewport and at
 * a narrow one, each keeping a real width. The dialog takes the copy width its
 * other copy-sized surfaces get; the composer asks for no width of its own.
 *
 * TWO HALVES IN ONE CRITERION, and both run in this one UAT:
 *
 * - ALWAYS, WITHOUT A BROWSER: the stylesheet's narrow message-dialog rule names
 *   the composer among the surfaces that keep the copy width, and the composer's
 *   own rule declares no `width` / `min-width`. Re-narrowing the panel or
 *   re-adding a composer minimum fails here on every host.
 * - IN A REAL BROWSER: jsdom lays nothing out (every rect is zero), so the
 *   measurement mounts the real Contacts panel and the real dialog in Chromium,
 *   against the SOURCE stylesheet with the product's fonts, and measures. A host
 *   with no usable browser skips the measurement LOUDLY — never silently passes.
 *
 * Real everything except the network: the transport is stubbed because the HTTP
 * call is the one thing that is not layout.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const CSS_PATH = path.join(REPO, 'apps/control-app/src/builder/builder.css')
const CSS = fs.readFileSync(CSS_PATH, 'utf8')

/**
 * The same stylesheet addressed from the page root. Its `url()`s are relative to
 * the file; injected inline they would resolve against the document and the
 * product's faces would 404 and silently fall back.
 */
const SOURCE_CSS = CSS.replaceAll("url('./", "url('/builder/")

type Chromium = typeof import('playwright').chromium
type Browser = import('playwright').Browser

/** Playwright belongs to `tools/generate`. */
async function loadChromium(): Promise<Chromium | undefined> {
  try {
    const require = createRequire(path.join(REPO, 'tools/generate/package.json'))
    const entry = pathToFileURL(require.resolve('playwright')).href
    const mod = (await import(/* @vite-ignore */ entry)) as Record<string, never>
    return (mod.chromium ?? (mod.default as Record<string, never>)?.chromium) as never
  } catch {
    return undefined
  }
}

function browserCacheDirs(): string[] {
  const override = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (override && override !== '0') return [override]
  const home = os.homedir()
  const byPlatform: Record<string, string | undefined> = {
    darwin: path.join(home, 'Library', 'Caches', 'ms-playwright'),
    linux: path.join(home, '.cache', 'ms-playwright'),
    win32: process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright'),
  }
  const dir = byPlatform[process.platform]
  return dir ? [dir] : []
}

const CHROMIUM_BINARIES = new Set([
  'chrome-headless-shell',
  'headless_shell',
  'Google Chrome for Testing',
  'Chromium',
  'chrome',
])

function findBinaries(dir: string, depth: number, into: string[]): void {
  if (depth < 0 || !fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) findBinaries(full, depth - 1, into)
    else if (CHROMIUM_BINARIES.has(entry.name)) into.push(full)
  }
}

/** Every downloaded Chromium, headless shell first, newest build first. */
function cachedChromiums(): string[] {
  const found: string[] = []
  for (const cache of browserCacheDirs()) {
    if (!fs.existsSync(cache)) continue
    for (const build of fs.readdirSync(cache).filter((n) => n.startsWith('chromium'))) {
      findBinaries(path.join(cache, build), 4, found)
    }
  }
  const revision = (p: string): number => Number(/-(\d+)[\\/]/.exec(p)?.[1] ?? 0)
  return found.sort(
    (a, b) =>
      Number(b.includes('headless')) - Number(a.includes('headless')) || revision(b) - revision(a),
  )
}

/** Ordinary launches first; `--single-process` only as the degraded fallback. */
async function launchAnyChromium(chromium: Chromium): Promise<Browser | undefined> {
  const ordinary: Parameters<typeof chromium.launch>[0][] = [
    {},
    { channel: 'chrome' as const },
    ...cachedChromiums().map((executablePath) => ({ executablePath })),
  ]
  const candidates = [
    ...ordinary,
    ...ordinary.map((opts) => ({ ...opts, args: ['--single-process'] })),
  ]
  for (const opts of candidates) {
    try {
      return await chromium.launch(opts)
    } catch {
      /* try the next one */
    }
  }
  return undefined
}

/** Loud skip. A silently-skipped measurement is indistinguishable from a pass. */
function skipMeasurement(why: string): void {
  console.warn(`AC-2367 invite-composer measurement SKIPPED — ${why}. The layout is unverified here.`)
}

/** Opens the real Contacts panel's invite dialog and measures the composer. */
async function measureInBrowser(browser: Browser, builderUrl: string) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  // `load` and then the shell, not `networkidle`: the chrome pulls a CDN asset,
  // so a host with no route out would never go idle.
  await page.goto(builderUrl, { waitUntil: 'load' })
  await page.waitForSelector('.shell', { timeout: 20000 })

  // The stylesheet under test is the source file; the built copy is dropped,
  // not layered over (a stale rule of equal specificity would win on order).
  await page.evaluate(() => {
    for (const sheet of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
      if ((sheet.getAttribute('href') ?? '').includes('builder.css')) sheet.remove()
    }
  })
  await page.addStyleTag({ content: SOURCE_CSS })
  await page.evaluate(() => document.fonts.ready.then(() => undefined))

  const open = () =>
    page.evaluate(async (modUrl: string) => {
      // Built at runtime so vite's SSR transform does not rewrite the import.
      const load = new Function('u', 'return import(u)') as (u: string) => Promise<{
        createPeoplePanel: (opts: Record<string, unknown>) => {
          element: HTMLElement
          refresh: () => Promise<void>
        }
      }>
      const mod = await load(modUrl)
      document.querySelector('#ac2367')?.remove()
      const host = document.createElement('div')
      host.id = 'ac2367'
      ;(document.querySelector('.shell') ?? document.body).append(host)

      const person = (id: string, email: string) => ({
        id,
        email,
        name: null,
        formerNames: [],
        status: 'active',
        invitedAt: null,
        firstSeenAt: null,
        lastSeenAt: null,
        termsAcceptedAt: null,
        pipelineStage: 'lead',
        createdAt: '2026-09-01T09:00:00.000Z',
      })
      const people = [person('usr_a', 'a@example.test'), person('usr_b', 'b@example.test')]

      const panel = mod.createPeoplePanel({
        storage: window.sessionStorage,
        transport: {
          list: async () => ({ people, canInvite: true, canFulfil: false, bounced: [] }),
          item: async (id: string) => ({
            person: people.find((p) => p.id === id),
            emails: [],
            operates: [],
            grants: [],
            events: [],
            provenance: null,
          }),
          messages: async () => ({ messages: [] }),
          inviteDraft: async () => ({
            from: 'no-reply@1stcontact.io',
            subject: 'Your invitation to Alice’s Plumbing',
            body: '<p>Hello,</p><p><a href="{{cta_url}}">Accept your invitation</a></p>',
            declared: ['cta_url'],
            templateKey: 'invite',
            templateUid: 'tkt_invite',
          }),
          invite: async () => ({ results: [] }),
        },
      })
      host.append(panel.element)
      await panel.refresh()

      // Tick one contact, press Invite.
      const check = host.querySelector('.builder-people__check') as HTMLInputElement
      check.checked = true
      check.dispatchEvent(new Event('change', { bubbles: true }))
      ;(host.querySelector('.builder-people__invite') as HTMLButtonElement).click()
    }, new URL('/builder/people.js', builderUrl).href)

  const measure = () =>
    page.evaluate(() => {
      const host = document.querySelector('#ac2367') as HTMLElement
      const panel = host.querySelector('.builder-modal__panel') as HTMLElement
      const rect = panel.getBoundingClientRect()
      const style = getComputedStyle(panel)
      const named = [
        ['Subject', '.builder-people__subject'],
        ['To-List', '.builder-people__tolist'],
        ['Body', '.builder-people__body'],
      ] as const
      return {
        viewport: window.innerWidth,
        panel: { left: rect.left, right: rect.right, width: rect.width },
        padding: { left: parseFloat(style.paddingLeft), right: parseFloat(style.paddingRight) },
        fields: named.map(([name, selector]) => {
          const field = host.querySelector(selector) as HTMLElement | null
          const r = field?.getBoundingClientRect()
          return { name, present: !!field, left: r?.left ?? 0, right: r?.right ?? 0, width: r?.width ?? 0 }
        }),
      }
    })

  await open()
  const desktop = await measure()
  // Narrow: the panel is bound by the window, not by its own maximum width.
  await page.setViewportSize({ width: 420, height: 900 })
  await open()
  const narrow = await measure()
  await page.close()
  return { desktop, narrow }
}

type Measurement = Awaited<ReturnType<typeof measureInBrowser>>['desktop']

/** Both edges inside the panel's content box, and a floor so collapse is not a fit. */
function expectInside(m: Measurement, floor: number, where: string): void {
  expect(m.panel.right, `the dialog itself is off-screen ${where}`).toBeLessThanOrEqual(
    m.viewport + 0.5,
  )
  for (const field of m.fields) {
    expect(field.present, `${field.name} is missing from the composer ${where}`).toBe(true)
    expect(field.right, `${field.name} runs past the panel's right edge ${where}`).toBeLessThanOrEqual(
      m.panel.right - m.padding.right + 0.5,
    )
    expect(field.left, `${field.name} starts left of the panel's padding ${where}`).toBeGreaterThanOrEqual(
      m.panel.left + m.padding.left - 0.5,
    )
    expect(field.width, `${field.name} is too narrow to use ${where}`).toBeGreaterThan(floor)
  }
}

describe('story-7b1025b8 — the invite composer fits its dialog', () => {
  it(
    'test_UAT_AC2367_invite_subject_tolist_and_body_lie_within_the_dialog_panel_at_desktop_and_narrow_widths',
    async () => {
      // ── Always: the stylesheet's decision. ──────────────────────────────────
      // The narrow message-width rule names the surfaces that keep the copy
      // width; the composer must be among them, alongside the copy editor,
      // picker and reader.
      const narrowRule = /\.builder-modal__panel:not\(\s*:has\(([^)]*)\)\s*\)\s*\{([^}]*)\}/.exec(CSS)
      expect(narrowRule, 'the message-width dialog rule is no longer recognisable').toBeTruthy()
      const [, surfaces, block] = narrowRule!
      expect(block, 'the message-width rule no longer narrows to the message width').toContain(
        'min(520px',
      )
      for (const surface of [
        '.builder-modal__box',
        '.builder-modal__picker',
        '.builder-modal__reader',
        '.builder-people__compose',
      ]) {
        expect(surfaces, `${surface} is narrowed to the message width`).toContain(surface)
      }
      // The composer asks for no width of its own beyond what the panel gives.
      const composeRule = /\.builder-people__compose\s*\{([^}]*)\}/.exec(CSS)
      expect(composeRule, 'the composer rule is no longer recognisable').toBeTruthy()
      expect(composeRule![1], 'the composer sets a width the panel cannot honour').not.toMatch(
        /(^|[;\s{])(min-width|width)\s*:/,
      )

      // ── In a real browser: the measurement. ─────────────────────────────────
      if (!WEBUI_INSTALLED) return skipMeasurement(WEBUI_SKIP_REASON)
      const chromium = await loadChromium()
      if (!chromium) return skipMeasurement('playwright is not resolvable from tools/generate')

      const { cmdNew, cmdRender, startBuilder } = await import('../tools/generate/src/cli')
      const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ac2367-'))
      let builder: { url: string; close: () => Promise<void> } | undefined
      let browser: Browser | undefined
      try {
        cmdNew('alpha', { cwd })
        await cmdRender('alpha', { cwd, source: 'draft' })
        builder = await startBuilder({
          cwd,
          clientDir: path.join(REPO, 'apps/control-app/src/builder'),
        })
        browser = await launchAnyChromium(chromium)
        if (!browser) return skipMeasurement('no chromium build or system Chrome could be launched')

        const { desktop, narrow } = await measureInBrowser(browser, builder.url)
        expectInside(desktop, 300, 'in a 1280px window')
        // At 1280px the dialog takes the copy width, not the ≤520px message width.
        expect(desktop.panel.width, 'the invite dialog fell to the message width').toBeGreaterThan(520)
        expectInside(narrow, 120, 'in a 420px window')
      } finally {
        await browser?.close()
        await builder?.close()
        fs.rmSync(cwd, { recursive: true, force: true })
      }
    },
    240000,
  )
})
