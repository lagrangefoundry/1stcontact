/**
 * BUG-58 — the invite composer stays inside the dialog it is drawn in.
 *
 * THE BUG. Ticking a contact and pressing Invite drew Subject, To-List and Body
 * wider than the panel behind them: the boxes ran past the dialog's right edge
 * and sat on the backdrop. Two rules disagreed. `.builder-modal__panel` is only
 * given the 880px copy width when it holds one of the surfaces named in its
 * `:has()` list, and the composer was not on it — so the dialog fell to the
 * message width of `min(520px, 100vw - 48px)`. `.builder-people__compose` then
 * asked for `min-width: min(70ch, 70vw)`, which at the shell's inherited size is
 * roughly 590px, and a flex item does not shrink below its own `min-width`.
 * The composer could not widen a panel whose width was already decided; it could
 * only refuse to fit inside it.
 *
 * WHY THIS IS MEASURED IN A REAL BROWSER. The defect is pure layout: every value
 * involved is correct in isolation and the DOM is identical before and after.
 * jsdom lays nothing out — every `getBoundingClientRect()` there is zero — so a
 * jsdom version of this file would assert that the fields exist, which they
 * always did. A missing browser therefore reports loudly rather than passing.
 *
 * THE STRUCTURAL TEST BELOW ALWAYS RUNS, and is not a substitute for the
 * measurement: it pins the one decision the fix rests on — that the composer is
 * copy, and keeps the copy width — so re-narrowing the panel fails here rather
 * than in front of an operator.
 *
 * REAL EVERYTHING EXCEPT THE NETWORK, on `test_UAT_FC_REQ-199_contacts_tab`'s
 * pattern: the real Contacts panel, the real dialog, the real stylesheet, and a
 * stubbed transport because the HTTP call is the one thing that is not layout.
 * THE STYLESHEET IS THE SOURCE FILE, swapped in for the built copy the origin
 * serves, so this measures what is in the repository rather than whatever
 * `1c assets` last happened to write.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const CSS_PATH = path.join(REPO, 'apps/control-app/src/builder/builder.css')
const CSS = fs.readFileSync(CSS_PATH, 'utf8')

/**
 * The same stylesheet, addressed from the page root instead of from its own
 * directory.
 *
 * ITS `url()`s ARE RELATIVE TO THE FILE, and injecting the text inline moves the
 * base URL to the document — so `./fonts/…` would ask the origin for `/fonts/…`
 * and get a 404. The faces would silently fall back, and the label column is
 * `9ch`, so every measurement below would be taken in a typeface the product
 * does not ship. Rebasing is the whole of the transform; no rule is touched.
 */
const SOURCE_CSS = CSS.replaceAll("url('./", "url('/builder/")

if (!WEBUI_INSTALLED) console.warn(`BUG-58 invite-modal suite: ${WEBUI_SKIP_REASON}`)

/** Playwright belongs to `tools/generate`; see `req117-builder-viewport-fill`. */
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

/**
 * Where Playwright keeps the browsers it downloads.
 *
 * READ FROM THE ENVIRONMENT FIRST, because a machine that has relocated the
 * cache has done so deliberately. The per-platform defaults are the fallback,
 * and an unknown platform simply contributes nothing rather than guessing.
 */
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

/** The Chromium binaries inside one downloaded build, whatever it is called. */
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

/**
 * Every Chromium this machine actually has, newest build first.
 *
 * PLAYWRIGHT WILL ONLY LAUNCH THE BUILD PINNED TO ITS OWN VERSION, and a machine
 * that has been updated on either side of that pin has a perfectly good browser
 * in a neighbouring directory. Naming it through `executablePath` is what turns
 * "no browser installed" — which is what an unqualified launch reports, and what
 * makes this suite skip itself while reporting green — back into a measurement.
 * The headless shell sorts ahead of the full browser: it is the smaller thing to
 * start and it does the same layout.
 */
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

/**
 * A browser we can actually drive.
 *
 * THREE THINGS GO WRONG ON A REAL MACHINE and each has a candidate here. The
 * pinned build may not be downloaded, which the first two lines cover by falling
 * back to the installed Chrome and then to whatever build IS downloaded. And a
 * sandboxed host refuses the mach bootstrap check-in that Chromium's
 * multi-process startup performs, so the browser dies before its first page and
 * the run reports "no browser" — indistinguishable from a machine with none, and
 * wrong. `--single-process` starts a browser that does not perform that handoff.
 *
 * THE DEGRADED MODE IS LAST, and every ordinary launch is tried before any of
 * it, so a machine that can start a browser properly never reaches it.
 */
async function launchAnyChromium(
  chromium: typeof import('playwright').chromium,
): Promise<import('playwright').Browser | undefined> {
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
function skip(why: string): void {
  console.warn(`BUG-58 invite-modal measurement SKIPPED — ${why}. The fix is unverified here.`)
}

/**
 * The stylesheet's own account of the fix.
 *
 * TWO HALVES, AND BOTH ARE LOAD-BEARING. The panel has to keep the copy width
 * when it holds a composer, and the composer has to stop asserting a width of
 * its own — either one alone leaves the fields overflowing or leaves them in a
 * dialog too narrow to compose in.
 */
describe('BUG-58 — the composer is copy, and the panel is sized for it', () => {
  it('test_UAT_FC_BUG-58_the_composer_keeps_the_copy_width', () => {
    // The narrow branch names the surfaces that must NOT be narrowed. The
    // composer belongs among them: a subject line and a twelve-row body is copy.
    const narrow = /\.builder-modal__panel:not\(\s*:has\(([^)]*)\)\s*\)\s*\{([^}]*)\}/.exec(CSS)
    expect(narrow, 'the message-width rule is no longer recognisable').toBeTruthy()
    const [, surfaces, block] = narrow!
    expect(block).toContain('min(520px')
    for (const surface of [
      '.builder-modal__box',
      '.builder-modal__picker',
      '.builder-modal__reader',
      '.builder-people__compose',
    ]) {
      expect(surfaces, `${surface} is narrowed to the message width`).toContain(surface)
    }
  })

  it('test_UAT_FC_BUG-58_the_composer_asserts_no_width_of_its_own', () => {
    // THE OTHER HALF. A `min-width` here is a child telling a fixed-width panel
    // it will not fit, which is the defect however wide the panel is.
    const rule = /\.builder-people__compose\s*\{([^}]*)\}/.exec(CSS)
    expect(rule, 'the composer rule is no longer recognisable').toBeTruthy()
    expect(rule![1], 'the composer sets a width the panel cannot honour').not.toMatch(
      /\b(min-width|width)\s*:/,
    )
  })
})

/**
 * The measurement. Everything above proves the decision was made; only this
 * proves the boxes are inside the dialog.
 */
describe.skipIf(!WEBUI_INSTALLED)('BUG-58 — measured against a real browser', () => {
  let cwd: string
  let builder: { url: string; close: () => Promise<void> } | undefined
  let chromium: typeof import('playwright').chromium | undefined

  beforeAll(async () => {
    chromium = await loadChromium()
    if (!chromium) {
      skip('playwright is not resolvable from tools/generate')
      return
    }
    const { cmdNew, cmdRender, startBuilder } = await import('../tools/generate/src/cli')
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'bug58-'))
    cmdNew('alpha', { cwd })
    await cmdRender('alpha', { cwd, source: 'draft' })
    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
  }, 120000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it(
    'test_UAT_FC_BUG-58_invite_fields_stay_inside_the_panel_at_every_width',
    async () => {
      if (!chromium || !builder) return // already reported by beforeAll

      const browser = await launchAnyChromium(chromium)
      if (!browser) {
        skip('no chromium build or system Chrome could be launched')
        return
      }

      try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        // `load`, AND THEN THE SHELL, rather than `networkidle`. The chrome pulls
        // its markdown renderer from a CDN, so on a host with no route out — a
        // sandbox, an aeroplane — the network never goes idle and the wait
        // expires on a page that has been ready for twenty-nine seconds. The
        // shell being mounted is the condition this test actually needs, and it
        // is true or false rather than quiet.
        await page.goto(builder.url, { waitUntil: 'load' })
        await page.waitForSelector('.shell', { timeout: 20000 })

        // THE STYLESHEET UNDER TEST IS THE SOURCE FILE. The origin serves the
        // copy `1c assets` wrote, which is as old as the last build — so the
        // built one is dropped rather than layered over. Layering would not do:
        // the stale narrow rule matches the invite dialog and carries the same
        // specificity as its replacement, so it would simply win on order.
        await page.evaluate(() => {
          for (const sheet of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
            if ((sheet.getAttribute('href') ?? '').includes('builder.css')) sheet.remove()
          }
        })
        await page.addStyleTag({ content: SOURCE_CSS })

        const open = async () =>
          page.evaluate(async (modUrl: string) => {
            // THE IMPORT IS BUILT AT RUNTIME, and that is not obfuscation for
            // its own sake. This function's source is compiled by vite on the
            // way in — it is a Node module — and a literal `import()` anywhere
            // in it is rewritten to vite's own SSR loader, which does not exist
            // in a browser. `new Function` is the one form the transform cannot
            // see, so the browser gets a plain dynamic import of its own origin.
            const load = new Function('u', 'return import(u)') as (
              u: string,
            ) => Promise<{
              createPeoplePanel: (opts: Record<string, unknown>) => {
                element: HTMLElement
                refresh: () => Promise<void>
              }
            }>
            const mod = await load(modUrl)
            document.querySelector('#bug58')?.remove()
            const box = document.createElement('div')
            box.id = 'bug58'
            ;(document.querySelector('.shell') ?? document.body).append(box)

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
            box.append(panel.element)
            await panel.refresh()

            const check = box.querySelector('.builder-people__check') as HTMLInputElement
            check.checked = true
            check.dispatchEvent(new Event('change', { bubbles: true }))
            ;(box.querySelector('.builder-people__invite') as HTMLButtonElement).click()
          }, new URL('/builder/people.js', builder!.url).href)

        /** Where the fields ended up, against the panel that is meant to hold them. */
        const measure = () =>
          page.evaluate(() => {
            const box = document.querySelector('#bug58') as HTMLElement
            const panel = box.querySelector('.builder-modal__panel') as HTMLElement
            const rect = panel.getBoundingClientRect()
            const style = getComputedStyle(panel)
            const named = [
              ['Subject', '.builder-people__subject'],
              ['To-List', '.builder-people__tolist'],
              ['Body', '.builder-people__body'],
            ] as const
            return {
              viewport: window.innerWidth,
              panel: { left: rect.left, right: rect.right },
              padding: {
                left: parseFloat(style.paddingLeft),
                right: parseFloat(style.paddingRight),
              },
              fields: named.map(([name, selector]) => {
                const field = box.querySelector(selector) as HTMLElement
                const box2 = field.getBoundingClientRect()
                return { name, left: box2.left, right: box2.right, width: box2.width }
              }),
            }
          })

        /**
         * The claim, at one width.
         *
         * BOTH EDGES AND A FLOOR. Asserting the right edge alone would be
         * satisfied by a composer collapsed to nothing, which is the other way
         * to make a box fit and is not a fix — so the fields must also still be
         * wide enough to compose a message in.
         */
        const expectInside = (
          m: Awaited<ReturnType<typeof measure>>,
          floor: number,
          where: string,
        ) => {
          expect(m.panel.right, `the dialog itself is off-screen ${where}`).toBeLessThanOrEqual(
            m.viewport + 0.5,
          )
          for (const field of m.fields) {
            expect(
              field.right,
              `${field.name} runs past the panel's right edge ${where}`,
            ).toBeLessThanOrEqual(m.panel.right - m.padding.right + 0.5)
            expect(
              field.left,
              `${field.name} starts left of the panel's padding ${where}`,
            ).toBeGreaterThanOrEqual(m.panel.left + m.padding.left - 0.5)
            expect(field.width, `${field.name} is too narrow to use ${where}`).toBeGreaterThan(floor)
          }
        }

        await open()
        expectInside(await measure(), 300, 'in a 1280px window')

        // AND WHERE THE PANEL IS THE WINDOW'S SIZE RATHER THAN ITS OWN. The old
        // rule failed here too, in the other direction: below about 306px of
        // viewport, `70vw` still exceeded the `100vw - 92px` the panel had to
        // give, so the boxes overflowed a dialog that was already as wide as it
        // could be.
        await page.setViewportSize({ width: 420, height: 900 })
        await open()
        expectInside(await measure(), 120, 'in a 420px window')
      } finally {
        await browser.close()
      }
    },
    180000,
  )
})
