// @vitest-environment jsdom
/**
 * story-3bf94bd4 — **how the form the gesture opens presents itself**: where it
 * is appended, what typeface and palette it takes, what chrome it drops, how it
 * dresses the editing box in the page's own presentation, and how it is sized.
 *
 * The gesture's other halves are elsewhere: the pointer and the address it
 * resolves to in `reconciliation-copy-edit-gesture.test.ts`, the dialog's
 * dead ends and its dismissals in `reconciliation-copy-edit-gesture-modal.test.ts`,
 * the picker in `reconciliation-copy-edit-image-selection.test.ts`. This file is
 * the presentation contract — AC-1037 … AC-1044.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT. The document is the bytes the edit
 * channel really renders, the bridge is the one the browser runs, the form is
 * the installed `webui-fields` component, the shell is the installed
 * `webui-shell`, and every read and write goes over HTTP to a real builder
 * origin. `defaultModal` is driven directly — an injected double would be a test
 * of the double, and every criterion here is about what the real dialog builds.
 *
 * WHERE THE EVIDENCE COMES FROM, and why it is split. jsdom resolves the
 * cascade (families, weights, colours and sizes all come from the render's own
 * stylesheet) but lays nothing out and resolves no `var()`, so anything about
 * measured geometry or a resolved theme colour is unverifiable there. Those
 * clauses are driven through a REAL BROWSER against the real workspace, which
 * is also the only place the paint-order backdrop is visible at all — jsdom has
 * no `elementsFromPoint`, so the fallback ancestor walk is the only path that
 * ever runs there, and the ancestor walk is precisely the wrong answer this
 * story records. Where neither machine can answer, the gap is reported LOUDLY
 * rather than skipped quietly: a silent pass on the only evidence for a
 * criterion is indistinguishable from having tested nothing.
 *
 * The webui components arrive from an out-of-band install that nothing in this
 * repository's manifests records (story Technical Context), so a machine
 * without them reports the component-dependent half as unverified rather than
 * failing.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const BUILDER_CSS = path.join(REPO, 'apps/control-app/src/builder/builder.css')

// ── the specimen page ────────────────────────────────────────────────────────

const HEADLINE = 'A painted band.'
/** Set far ABOVE the editing range — the clamp's upper bound. */
const HEADLINE_SIZE_PX = 56
/** Set far BELOW it — the clamp's lower bound. */
const TINY = 'The legal line.'
const TINY_SIZE_PX = 9
/** Inside the range, so it must pass through exactly. */
const ORDINARY = 'Ordinary body copy.'
const ORDINARY_SIZE_PX = 17
/** Past the derivation's multiline threshold, so the control is a textarea. */
const LONG_COPY =
  'A paragraph long enough that the form has to be sized for reading it at something like the ' +
  'width it will be read at, rather than at the width of a property sheet, and long enough that ' +
  'the editing area has to be tall as well as wide.'
/** Gold copy over a dark photograph — the observed misreport, reproduced. */
const OVER_LAYERS = 'Gold over the photograph.'

const PAGE_FAMILY = 'Editorial'
const PAGE_COLOR = '#f8f5ef'
const PAGE_WEIGHT = 700
const PAGE_LETTER_SPACING_PX = 3
/** The band the headline sits in: a containing region that paints. */
const BAND_FILL = '#101822'
/**
 * The pale wrapper an ancestor walk lands on, and the whole reason this page is
 * shaped the way it is. Gold copy over a dark photograph previewing as gold on
 * cream is the one outcome a preview of contrast must never produce.
 */
const PAGE_FILL = '#f6f1e7'
/** The photograph: an OPAQUE sibling layer, not an ancestor. */
const PHOTO_FILL = '#0b1f3a'
/** The scrim over it: translucent, so it must stay composited rather than flattened. */
const SCRIM_FILL = '#3b0d0d80'
const GOLD = '#f5d67b'
/** The face the document binds `Editorial` to — the `@font-face` that must cross. */
const FONT_SRC = 'assets/editorial.woff2'
const FONT_BYTES = Buffer.from('wOF2 not a real face, but a real asset')

/** The second site's family, for the "replaced wholesale" half of AC-1041. */
const OTHER_FAMILY = 'Gazette'
const OTHER_FONT_SRC = 'assets/gazette.woff2'

/** Region addresses on the specimen page, as the edit render stamps them. */
const PATH = {
  page: '0',
  band: '0.0',
  headline: '0.0.0',
  image: '0.1',
  photo: '0.2',
  scrim: '0.3',
  gold: '0.4',
  tiny: '0.5',
  ordinary: '0.6',
  long: '0.7',
} as const

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 form-presentation suite: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-3bf94bd4: ${what} NOT VERIFIED here`)
}

/**
 * Absolute placement at both declared widths.
 *
 * Two keyframes rather than one so the 1280-wide browser viewport lands on a
 * keyframe exactly, and the boxes below overlap by the numbers written here
 * instead of by whatever the fold interpolated to.
 */
function at(x: number, y: number, width: number, height?: number) {
  const scale = (n: number) => Math.round(n / 4)
  return {
    keyframes: [
      {
        at: 320,
        x: scale(x),
        y: scale(y),
        width: scale(width),
        ...(height === undefined ? {} : { height: scale(height) }),
      },
      { at: 1280, x, y, width, ...(height === undefined ? {} : { height }) },
    ],
  }
}

/**
 * One page carrying every shape this file's criteria need.
 *
 * The layers are the load-bearing part. `photo` and `scrim` are SIBLINGS of the
 * gold copy, absolutely positioned so they sit under it, while the only thing
 * *containing* it is the pale page. An ancestor walk therefore answers "cream"
 * and a paint-order read answers "the photograph, dimmed" — which is the
 * difference AC-1040 exists to pin.
 */
function seedPage(cwd: string, slug: string, family: string, fontSrc: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8')) as Record<string, unknown>
  const copyAxes = {
    fontFamily: family,
    fontWeight: PAGE_WEIGHT,
    fontStyle: 'italic' as const,
    letterSpacingPx: PAGE_LETTER_SPACING_PX,
    color: PAGE_COLOR,
  }
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: PAGE_FILL },
    geometry: at(0, 0, 1280, 1400),
    children: [
      // [0.0] the painted band — a CONTAINING region that paints, and (carrying
      // no background handle) the region that exposes nothing.
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: BAND_FILL },
        geometry: at(0, 0, 1280, 220),
        children: [
          {
            kind: 'text',
            text: HEADLINE, // [0.0.0]
            axes: { ...copyAxes, fontSizePx: HEADLINE_SIZE_PX },
            geometry: at(40, 40, 1200),
          },
        ],
      },
      // [0.1] an image — two fields, and the contrast for "not dressed as copy".
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image', geometry: at(40, 260, 400, 200) },
      // [0.2] the photograph, opaque, and [0.3] the scrim over it — both siblings
      // of the copy at [0.4], all three overlapping.
      { kind: 'container', layout: 'stack', axes: { surfaceFill: PHOTO_FILL }, geometry: at(0, 500, 1280, 300), children: [] },
      { kind: 'container', layout: 'stack', axes: { surfaceFill: SCRIM_FILL }, geometry: at(0, 500, 1280, 300), children: [] },
      {
        kind: 'text',
        text: OVER_LAYERS, // [0.4]
        axes: { fontFamily: family, color: GOLD, fontSizePx: 24 },
        geometry: at(120, 600, 700),
      },
      { kind: 'text', text: TINY, axes: { ...copyAxes, fontSizePx: TINY_SIZE_PX }, geometry: at(40, 860, 600) }, // [0.5]
      {
        kind: 'text',
        text: ORDINARY, // [0.6]
        axes: { ...copyAxes, fontSizePx: ORDINARY_SIZE_PX },
        geometry: at(40, 920, 600),
      },
      { kind: 'text', text: LONG_COPY, axes: { fontSizePx: 20 }, geometry: at(40, 1000, 1000) }, // [0.7]
    ],
  }
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    widths: [320, 1280],
    resources: { fonts: [{ family, src: fontSrc, weight: PAGE_WEIGHT, style: 'italic' }] },
    root,
  }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
  const assets = path.join(cwd, 'storage', 'sites', slug, 'draft', 'assets')
  fs.mkdirSync(assets, { recursive: true })
  fs.writeFileSync(path.join(assets, path.basename(fontSrc)), FONT_BYTES)
}

/** A site whose page declares no faces at all — AC-1041's "leaves none behind". */
function seedFaceless(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8')) as Record<string, unknown>
  const l1 = { ...(home.l1 as Record<string, unknown>) }
  delete l1.resources
  l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: PAGE_FILL },
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 20 } }],
  } satisfies L1Node
  home.l1 = l1
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

// ── the browser, where a browser is available ────────────────────────────────

/** See `reconciliation-copy-edit-gesture.test.ts` — playwright is tools/generate's. */
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

/** The browser's own URL resolution, and nothing more. */
function browserFetch(originUrl: string): { restore: () => void } {
  const real = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) =>
    real(typeof input === 'string' ? new URL(input, originUrl) : input, init)) as typeof fetch
  return {
    restore: () => {
      globalThis.fetch = real
    },
  }
}

/**
 * Every declaration block whose selector satisfies `keep`.
 *
 * Comments are stripped FIRST. A selector is everything since the last `}`, so
 * a rule preceded by a comment (which is most of the modal's, since each
 * explains why it is the way it is) would otherwise arrive with that comment
 * glued to its front and match nothing — silently narrowing every assertion
 * below to the rules that happen to have no comment above them.
 */
function rulesOf(css: string, keep: (selector: string) => boolean): string[] {
  const blocks: string[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
  while ((m = re.exec(bare))) if (keep(m[1].trim())) blocks.push(m[2])
  return blocks
}

/** Every `var(--shell-x, <literal>)` in `css` — a theme value with a stand-in behind it. */
function shellFallbacks(css: string): string[] {
  const out: string[] = []
  const re = /var\(\s*(--shell-[\w-]+)\s*,\s*(?!var\()[^)]+\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css))) out.push(m[1])
  return out
}

describe('story-3bf94bd4 how the edit form presents itself', () => {
  let cwd: string
  let html: string
  let pageId: string
  let renderedPath: string
  let builder: BuilderHandle
  let browser: import('playwright').Browser | undefined
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
  let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
  let APP_FONT: string
  let clampPreviewSize: (px: number) => number
  let PREVIEW_MIN_PX: number
  let PREVIEW_MAX_PX: number
  /** The shell's own token vocabulary — what "the theme has a value for" means. */
  let TOKEN_NAMES: readonly string[]

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-form-presentation-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme', PAGE_FAMILY, FONT_SRC)
    cmdNew('beta', { cwd })
    seedPage(cwd, 'beta', OTHER_FAMILY, OTHER_FONT_SRC)
    cmdNew('plain', { cwd })
    seedFaceless(cwd, 'plain')

    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    renderedPath = path.join(outDir, 'index.html')
    html = fs.readFileSync(renderedPath, 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]

    builder = await startBuilder({ cwd })
    browser = await (async () => {
      const chromium = await loadChromium()
      return chromium ? launchAnyChromium(chromium) : undefined
    })()
    if (!browser) {
      console.warn(
        'story-3bf94bd4: no launchable browser — the measured geometry, the resolved theme ' +
          'colours and the paint-order backdrop are unverified here.',
      )
    }

    if (WEBUI_INSTALLED) {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
      ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
      const { webuiExports, webuiPackageDir } = await import('../tools/generate/src/cli/webui')
      const entry = webuiExports('webui-shell')['.'].replace(/^\.\//, '')
      const href = pathToFileURL(path.join(webuiPackageDir('webui-shell'), entry)).href
      // The shell's token list, read from the installed component rather than
      // restated here: AC-1037's exception is only principled if `--shell-danger`
      // is genuinely absent from the vocabulary, and that is upstream's fact.
      const tokensHref = pathToFileURL(
        path.join(webuiPackageDir('webui-shell'), 'src/tokens.js'),
      ).href
      await import(/* @vite-ignore */ href)
      ;({ TOKEN_NAMES } = (await import(/* @vite-ignore */ tokensHref)) as {
        TOKEN_NAMES: readonly string[]
      })
    }
    ;({ APP_FONT } = await import('../apps/control-app/src/builder/config.js'))
    ;({ clampPreviewSize, PREVIEW_MIN_PX, PREVIEW_MAX_PX } = await import(
      '../apps/control-app/src/builder/page-style.js'
    ))

    // jsdom ships neither; the split primitive observes its container.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
    globalThis.matchMedia ??= ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    })) as never
  }, 240000)

  afterAll(async () => {
    await browser?.close()
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /**
   * Put an edit rendering on screen, INCLUDING its `<style>` — the cascade is
   * what carries the page's presentation, so a suite about reproducing it that
   * dropped the stylesheet would be measuring nothing.
   */
  function display(source = html, page = pageId): void {
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(source)![1]
    // Assigning `documentElement.innerHTML` reuses the existing `<body>`, so its
    // attributes are whatever the last call left there — set them, never assume.
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    document.body.setAttribute(L1_EDIT_PAGE_ATTR, page)
  }

  const modals = () => [...document.querySelectorAll('.builder-modal')]

  /**
   * Wait for the dialog rather than for a fixed tick: opening one is a real HTTP
   * round trip, so a single macrotask bounds how fast the machine was, not the
   * thing being waited on.
   */
  async function settle(): Promise<void> {
    for (let i = 0; i < 400 && modals().length === 0; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  /** Open the dialog the way the operator does: by clicking the region. */
  async function openOn(
    target: string | Element,
    options: Record<string, unknown> = {},
  ): Promise<{ modal: Element; editor: { destroy(): void } }> {
    const editor = mountEditor(document, {
      slug: 'acme',
      bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      ...options,
    })
    const el = typeof target === 'string' ? document.querySelector(target)! : target
    expect(el, `the region ${String(target)} is on the page`).toBeTruthy()
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle()
    expect(modals()).toHaveLength(1)
    return { modal: modals()[0], editor }
  }

  const region = (dotted: string) => `[${L1_EDIT_PATH_ATTR}="${dotted}"]`

  /** Drive the real workspace in a real browser, up to an open form. */
  async function inWorkspace(
    fn: (page: import('playwright').Page) => Promise<void>,
    { slug = 'acme', viewport = { width: 1280, height: 900 } } = {},
  ): Promise<void> {
    const page = await browser!.newPage({ viewport })
    try {
      await page.goto(builder.url, { waitUntil: 'networkidle' })
      await page.selectOption('select', slug)
      await page.locator('button', { hasText: /^Edit$/ }).click()
      // ATTACHED, not visible. The specimen page is absolutely positioned
      // throughout (which is the whole point of it — see AC-1040), so its
      // `<body>` has no box of its own and would never satisfy a visibility
      // wait. The marker being present is the condition that actually matters:
      // it is what the bridge binds on.
      await page
        .frameLocator('.builder-panel__frame')
        .locator(`body[${L1_EDIT_MARKER_ATTR}]`)
        .waitFor({ state: 'attached' })
      await fn(page)
    } finally {
      await page.close()
    }
  }

  let net: { restore: () => void }
  beforeEach(() => {
    document.body.replaceChildren()
    document.head.querySelector('style[data-1c-preview-fonts]')?.remove()
    net = browserFetch(builder.url)
  })

  afterEach(() => {
    for (const m of modals()) m.remove()
    net.restore()
  })

  // ── AC-1037 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1037_the_form_opens_inside_the_themed_root_and_follows_its_palette',
    async () => {
      // AC-1037 — THE ROOT CAUSE this closed. Appended to `document.body` the
      // dialog is a SIBLING of the themed subtree: every `--shell-*` token and
      // the app font are declared on the shell root, so a sibling resolves none
      // of them. It rendered in the browser's default face against the
      // stylesheet's hardcoded fallback hexes — close enough to the current
      // theme to look intentional, and unable to follow a theme change at all.

      // No hardcoded colour stands in for a theme value in the form's chrome.
      // Scoped to the chrome the criterion enumerates — the panel, its border,
      // its radius, its surface and its text, plus the box and the buttons that
      // carry them. The backdrop is excluded deliberately: it is the dimming
      // overlay behind the panel rather than the form's own chrome, and it names
      // `--shell-overlay`, which (unlike the refusal colour) IS a shell token.
      const css = fs.readFileSync(BUILDER_CSS, 'utf8')
      const chrome = rulesOf(
        css,
        (sel) => sel.startsWith('.builder-modal') && !sel.includes('__backdrop'),
      ).join('\n')
      expect(chrome, 'the modal chrome is in this stylesheet').toContain('--shell-')
      // The ONE stand-in left, and the one the criterion states.
      expect([...new Set(shellFallbacks(chrome))]).toEqual(['--shell-danger'])
      if (WEBUI_INSTALLED) {
        // ...and it is a principled exception rather than a lazy one: the shell
        // genuinely has no token for it, while every colour that does have one
        // is referenced bare.
        expect(TOKEN_NAMES).not.toContain('danger')
        expect(TOKEN_NAMES).toEqual(expect.arrayContaining(['bg', 'fg', 'border', 'accent']))
      }

      if (!WEBUI_INSTALLED) {
        unverified('AC-1037 that the dialog is appended inside the shell root')
      } else {
        // Appended INSIDE the themed subtree, against the real shell.
        display()
        const shell = document.createElement('div')
        shell.className = 'shell'
        shell.style.setProperty('--shell-bg', '#ffffff')
        document.body.append(shell)
        const { modal, editor } = await openOn(region(PATH.headline), { host: shell })
        try {
          expect(modal.parentElement).toBe(shell)
          expect(shell.contains(modal)).toBe(true)
          expect(modal.parentElement).not.toBe(document.body)

          // A theme change on that root reaches the dialog because the dialog is
          // BENEATH it: custom properties inherit, and the form declares none of
          // its own that would shadow them.
          shell.style.setProperty('--shell-bg', '#123456')
          expect(getComputedStyle(shell).getPropertyValue('--shell-bg').trim()).toBe('#123456')
          expect(shell.contains(modal), 'still inside the root that changed').toBe(true)
          const panel = modal.querySelector('.builder-modal__panel') as HTMLElement
          expect(panel.style.getPropertyValue('--shell-bg')).toBe('')
        } finally {
          editor.destroy()
        }
      }

      // MEASURED, where a machine can measure it: jsdom resolves no `var()`, so
      // the rendered colour actually following a palette change is browser-only.
      if (!browser || !WEBUI_INSTALLED) {
        unverified('AC-1037 the rendered chrome colours following a palette change')
        return
      }
      await inWorkspace(async (page) => {
        await page.frameLocator('.builder-panel__frame').locator(region(PATH.headline)).click()
        await page.locator('.builder-modal').waitFor()

        // Contained by the themed root the workspace actually mounts.
        expect(
          await page.$eval('.builder-modal', (m) => m.parentElement?.classList.contains('shell')),
        ).toBe(true)

        const panelBg = () =>
          page.$eval(
            '.builder-modal__panel',
            (el) => getComputedStyle(el as HTMLElement).backgroundColor,
          )
        const before = await panelBg()
        await page.$eval('.shell', (el) =>
          (el as HTMLElement).style.setProperty('--shell-bg', 'rgb(18, 52, 86)'),
        )
        expect(await panelBg()).toBe('rgb(18, 52, 86)')
        expect(await panelBg()).not.toBe(before)
      })
    },
    240000,
  )

  // ── AC-1038 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1038_one_application_typeface_set_through_the_shell_token_and_served_by_the_origin',
    async () => {
      // AC-1038 — the family is app-level and theme-independent, applied at the
      // ONE place every descendant inherits from.

      // Served from the workspace's own origin, with the right content type —
      // the origin's map had no web-font entry before this, so a face would have
      // been answered as `application/octet-stream` and refused by the browser.
      for (const weight of ['400', '600']) {
        const rel = `apps/control-app/src/builder/fonts/ibm-plex-sans-${weight}-latin.woff2`
        expect(fs.existsSync(path.join(REPO, rel)), rel).toBe(true)
        const res = await fetch(
          new URL(`/builder/fonts/ibm-plex-sans-${weight}-latin.woff2`, builder.url),
        )
        expect(res.status, rel).toBe(200)
        expect(res.headers.get('content-type')).toBe('font/woff2')
      }
      // Declared where the faces are, and nowhere else — no CDN in the loop, so
      // nothing outside is told which sites the operator is editing.
      const css = fs.readFileSync(BUILDER_CSS, 'utf8')
      expect(css).toContain("font-family: 'IBM Plex Sans'")
      expect(css).not.toMatch(/@import|https?:\/\/fonts\./)
      expect(APP_FONT).toContain('IBM Plex Sans')
      // The chrome never restates the family: it is `font: inherit` all the way
      // down from the root the token is set on. The one `font-family` the modal
      // declares is the PAGE's, in the preview box, which is a different axis.
      for (const block of rulesOf(css, (sel) => sel.startsWith('.builder-modal'))) {
        const declared = /font-family:\s*([^;]+)/.exec(block)?.[1]
        if (declared) expect(declared).toContain('--preview-font-family')
      }

      if (!WEBUI_INSTALLED) {
        unverified('AC-1038 the token applied at the shell root and surviving a theme change')
        return
      }
      const root = document.createElement('div')
      document.body.append(root)
      const app = mountBuilder(root, { sites: [{ slug: 'acme', latest: null }] }) as unknown as {
        shell: {
          element: HTMLElement
          getTokens(): Record<string, string>
          getThemes(): string[]
          setTheme(t: string): string
        }
        destroy(): void
      }
      try {
        // Set ONCE, through the shell's own token path — not by out-specifying
        // `.shell` from the builder's stylesheet, which the component cannot see
        // and is free to break silently when it refactors its selector.
        expect(app.shell.getTokens().font).toBe(APP_FONT)
        expect(app.shell.element.style.getPropertyValue('--shell-font')).toBe(APP_FONT)

        // NOT PART OF A THEME. A theme swaps a palette; the typeface is the half
        // that does not vary, so every theme leaves it exactly where it was.
        for (const theme of app.shell.getThemes()) {
          app.shell.setTheme(theme)
          expect(app.shell.element.style.getPropertyValue('--shell-font'), theme).toBe(APP_FONT)
        }
      } finally {
        app.destroy()
      }

      if (!browser) {
        unverified('AC-1038 the family the form and its controls actually resolve to')
        return
      }
      // The family the form and its controls RESOLVE to, which is the claim —
      // inheritance from the themed root, measured rather than argued.
      await inWorkspace(async (page) => {
        await page.frameLocator('.builder-panel__frame').locator(region(PATH.long)).click()
        await page.locator('.builder-modal').waitFor()
        for (const selector of ['.builder-modal__panel', '.builder-modal__btn--primary']) {
          expect(
            await page.$eval(selector, (el) => getComputedStyle(el as HTMLElement).fontFamily),
            selector,
          ).toContain('IBM Plex Sans')
        }
      })
    },
    240000,
  )

  // ── AC-1039 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1039_the_fields_form_drops_heading_and_labels_while_dead_ends_keep_theirs',
    async () => {
      // AC-1039 — both were redundant chrome around a box you can obviously type
      // in: the heading named the control directly below it, and the label
      // column spent a large fraction of the dialog's width restating what the
      // words in the box already said.

      // The descriptor is UNCHANGED — only its rendering as a visible column is
      // dropped. The command line and the AI surface read this same list.
      const loaded = (await (
        await fetch(
          new URL(
            `/api/copy?${new URLSearchParams({ slug: 'acme', page: pageId, path: PATH.headline })}`,
            builder.url,
          ),
        )
      ).json()) as { fields: Array<{ name: string; label: string }> }
      expect(loaded.fields).toEqual([
        expect.objectContaining({ name: 'text', label: 'Text' }),
      ])

      if (!WEBUI_INSTALLED) {
        unverified('AC-1039 the rendered dialog dropping its heading and label column')
        return
      }
      display()
      const opened = await openOn(region(PATH.headline))
      try {
        expect(opened.modal.querySelector('.builder-modal__title')).toBeNull()
        expect(opened.modal.querySelectorAll('.fields-label')).toHaveLength(0)
        // Dropped through the component's own stacked layout option, not by
        // hiding a rule the component owns.
        expect(opened.modal.querySelector('.fields')!.getAttribute('data-layout')).toBe('stacked')

        // NEITHER DROP COSTS ANYTHING A SCREEN READER NEEDS. The heading's real
        // job was the dialog's accessible name; the label's was naming the
        // control, and the component moves it onto the control itself.
        expect(opened.modal.getAttribute('aria-label')).toBe('Edit copy')
        expect(
          opened.modal.querySelector('[aria-label="Text"]'),
          'the control keeps the field label as its accessible name',
        ).toBeTruthy()
      } finally {
        opened.editor.destroy()
      }
      for (const m of modals()) m.remove()

      // WHERE THE HEADING IS THE CONTENT IT STAYS. Removing it would leave a
      // bare sentence floating over a Close button.
      display()
      document.body.removeAttribute(L1_EDIT_PAGE_ATTR)
      const refusal = await openOn(region(PATH.headline))
      try {
        expect(refusal.modal.querySelector('.builder-modal__title')?.textContent).toBe(
          'Could not edit',
        )
      } finally {
        refusal.editor.destroy()
      }
      for (const m of modals()) m.remove()

      display()
      const deadEnd = await openOn(region(PATH.band))
      try {
        expect(deadEnd.modal.querySelector('.builder-modal__title')?.textContent).toBe(
          'Edit container',
        )
        expect(deadEnd.modal.textContent).toContain('Nothing to edit on this container segment yet.')
      } finally {
        deadEnd.editor.destroy()
      }
    },
    180000,
  )

  // ── AC-1040 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1040_the_box_mirrors_the_pages_typography_and_the_paint_actually_under_it',
    async () => {
      // AC-1040 — every value read OFF THE RENDERING rather than derived from
      // the stored definition. A run inherits most of its presentation from
      // around it, so the definition describes only what it overrode.
      if (!WEBUI_INSTALLED) {
        unverified('AC-1040 the box dressed in the page’s own presentation')
      } else {
        display()
        const opened = await openOn(region(PATH.headline))
        try {
          const box = opened.modal.querySelector('.builder-modal__box') as HTMLElement
          expect(box, 'the editing box is the visible box, not the control').toBeTruthy()
          expect(box.style.getPropertyValue('--preview-font-family')).toContain(PAGE_FAMILY)
          expect(box.style.getPropertyValue('--preview-font-weight')).toBe(String(PAGE_WEIGHT))
          expect(box.style.getPropertyValue('--preview-font-style')).toBe('italic')
          expect(box.style.getPropertyValue('--preview-letter-spacing')).toBe(
            `${PAGE_LETTER_SPACING_PX}px`,
          )
          expect(box.style.getPropertyValue('--preview-color')).toBe('rgb(248, 245, 239)')

          // NOTHING IS SUBSTITUTED OR CORRECTED. The restyling goes through the
          // component's own token vocabulary, so a component update cannot
          // strand a rule that was silently doing the work.
          const css = fs.readFileSync(BUILDER_CSS, 'utf8')
          expect(css).not.toMatch(/^\s*\.fields[-.\s]/m)
        } finally {
          opened.editor.destroy()
        }
        for (const m of modals()) m.remove()

        // A field that is metadata ABOUT the page is not dressed as page copy:
        // rendering an alt string in the band's display face would assert
        // something false about where that text ends up.
        display()
        const image = await openOn(region(PATH.image))
        try {
          const box = image.modal.querySelector('.builder-modal__box') as HTMLElement
          expect(box, 'an image still gets a proper box').toBeTruthy()
          expect(box.style.getPropertyValue('--preview-font-family')).toBe('')
          expect(box.style.getPropertyValue('--preview-color')).toBe('')
          expect(image.modal.querySelector('.builder-modal__box-bg')).toBeNull()
        } finally {
          image.editor.destroy()
        }
      }

      // WHAT IS BEHIND THE WORDS IS A PAINT-ORDER QUESTION. jsdom has no
      // `elementsFromPoint` and lays nothing out, so only the fallback ancestor
      // walk ever runs there — and the ancestor walk is exactly the wrong answer
      // this criterion exists to rule out. It is browser-only evidence.
      if (!browser || !WEBUI_INSTALLED) {
        unverified('AC-1040 the backdrop taken in paint order from a sibling layer')
        return
      }
      await inWorkspace(async (page) => {
        const frame = page.frameLocator('.builder-panel__frame')
        // The scenario is real: the photograph and its scrim are SIBLINGS of the
        // gold copy, overlapping it; the only thing containing it is the pale
        // page. Assert that before reading the answer, so a fold that stopped
        // overlapping fails here rather than passing vacuously.
        const geometry = await frame.locator('body').evaluate(
          (body, paths) => {
            const box = (p: string) => {
              const el = body.querySelector(`[data-l1-path="${p}"]`) as HTMLElement
              const r = el.getBoundingClientRect()
              return { x: r.left, y: r.top, w: r.width, h: r.height }
            }
            const copy = body.querySelector(`[data-l1-path="${paths.gold}"]`) as HTMLElement
            const photo = body.querySelector(`[data-l1-path="${paths.photo}"]`) as HTMLElement
            return {
              copy: box(paths.gold),
              photo: box(paths.photo),
              scrim: box(paths.scrim),
              photoContainsCopy: photo.contains(copy),
              page: box(paths.page),
            }
          },
          PATH,
        )
        expect(geometry.photoContainsCopy, 'the photograph is a SIBLING, not an ancestor').toBe(
          false,
        )
        expect(geometry.copy.y).toBeGreaterThanOrEqual(geometry.photo.y)
        expect(geometry.copy.y).toBeLessThan(geometry.photo.y + geometry.photo.h)

        await frame.locator(region(PATH.gold)).click()
        await page.locator('.builder-modal').waitFor()

        const painted = await page.$eval('.builder-modal__box', (box) => {
          const el = box as HTMLElement
          return {
            background: el.style.getPropertyValue('--preview-background'),
            layers: [...el.querySelectorAll('.builder-modal__box-bg')].map((n) => {
              const s = (n as HTMLElement).style
              return {
                color: s.backgroundColor,
                width: s.width,
                height: s.height,
                left: s.left,
                top: s.top,
              }
            }),
          }
        })

        // The photograph, not the pale page. An outward walk answers cream here,
        // which is both wrong and unreadable under gold copy.
        expect(painted.background).toBe('rgb(11, 31, 58)')
        expect(painted.background).not.toBe('rgb(246, 241, 231)')

        // Both layers, BOTTOM-MOST FIRST: the scrim has to composite over the
        // photograph it dims rather than be flattened onto it...
        expect(painted.layers).toHaveLength(2)
        expect(painted.layers[0].color).toBe('rgb(11, 31, 58)')
        // The scrim's own colour, still TRANSLUCENT — flattening it onto the
        // photograph would report a contrast the operator is not looking at.
        // Matched on the channels and the alpha band rather than on an exact
        // alpha string, which is a browser's rounding of `0x80/255`.
        const scrim = /^rgba\(59,\s*13,\s*13,\s*([\d.]+)\)$/.exec(painted.layers[1].color)
        expect(scrim, painted.layers[1].color).not.toBeNull()
        expect(Number(scrim![1])).toBeGreaterThan(0)
        expect(Number(scrim![1])).toBeLessThan(1)

        // ...and nothing below the first opaque fill is included, so the pale
        // page never reaches the dialog at all.
        for (const layer of painted.layers) expect(layer.color).not.toBe('rgb(246, 241, 231)')

        // Each layer at its OWN source region's dimensions, offset by the edited
        // region's position within it — so a covering photograph's crop and a
        // gradient's stops resolve against the dimensions they resolved against
        // on the page, with no intrinsic-size arithmetic.
        const expected = [geometry.photo, geometry.scrim]
        painted.layers.forEach((layer, i) => {
          expect(Math.round(Number.parseFloat(layer.width))).toBe(Math.round(expected[i].w))
          expect(Math.round(Number.parseFloat(layer.height))).toBe(Math.round(expected[i].h))
          expect(Math.round(Number.parseFloat(layer.left))).toBe(
            Math.round(-(geometry.copy.x - expected[i].x)),
          )
          expect(Math.round(Number.parseFloat(layer.top))).toBe(
            Math.round(-(geometry.copy.y - expected[i].y)),
          )
        })
      })
    },
    240000,
  )

  // ── AC-1041 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1041_only_the_sites_font_faces_cross_into_the_workspace_and_are_replaced_each_time',
    async () => {
      // AC-1041 — the site declares its faces in the DISPLAYED PAGE's own
      // stylesheet, which the workspace document cannot otherwise see. Naming
      // that family without them would be worse than not naming it: the box
      // would preview a system face while claiming to preview the page's.
      if (!WEBUI_INSTALLED) {
        unverified('AC-1041 the faces crossing into the workspace document')
      } else {
        display()
        const opened = await openOn(region(PATH.headline))
        try {
          const copied = document.head.querySelector('style[data-1c-preview-fonts]')
          expect(copied, 'the faces crossed into the workspace document').toBeTruthy()
          expect(copied!.textContent).toContain('@font-face')
          expect(copied!.textContent).toContain(PAGE_FAMILY)
          // Asset references absolutised against the PAGE's own base — the render
          // is served under `/preview/<slug>/<channel>/`, so a relative handle
          // that resolves there resolves to nothing in the workspace.
          expect(copied!.textContent).toMatch(/url\(["']?https?:\/\//)
          expect(copied!.textContent).not.toMatch(/url\(["']?assets\//)

          // ONLY THE FACE DECLARATIONS CROSS. Copying the sheet would drag the
          // site's resets and layout into the chrome, where they would fight the
          // workspace for control of a document the site knows nothing about.
          const rules = copied!.textContent!.match(/@?[\w.#[][^{]*\{/g) ?? []
          expect(rules.length).toBeGreaterThan(0)
          for (const rule of rules) expect(rule.trim()).toMatch(/^@font-face/)
          expect(copied!.textContent).not.toContain('box-sizing')
          expect(copied!.textContent).not.toMatch(/\.l1-\d/)
        } finally {
          opened.editor.destroy()
        }
        for (const m of modals()) m.remove()

        // REPLACED WHOLESALE, not added to: switching site must not leave the
        // previous site's families still resolvable.
        const beta = await cmdRender('beta', { cwd, edit: true })
        const betaHtml = fs.readFileSync(path.join(beta.outDir, 'index.html'), 'utf8')
        const betaPage = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(betaHtml)![1]
        display(betaHtml, betaPage)
        const second = await openOn(region(PATH.headline), { slug: 'beta' })
        try {
          const copied = document.head.querySelector('style[data-1c-preview-fonts]')!
          expect(document.head.querySelectorAll('style[data-1c-preview-fonts]')).toHaveLength(1)
          expect(copied.textContent).toContain(OTHER_FAMILY)
          expect(copied.textContent).not.toContain(PAGE_FAMILY)
        } finally {
          second.editor.destroy()
        }
        for (const m of modals()) m.remove()

        // ...and a page that declares no faces leaves none behind.
        const plain = await cmdRender('plain', { cwd, edit: true })
        const plainHtml = fs.readFileSync(path.join(plain.outDir, 'index.html'), 'utf8')
        const plainPage = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(plainHtml)![1]
        display(plainHtml, plainPage)
        const bare = await openOn(`[${L1_EDIT_SEGMENT_ATTR}="copy"]`, { slug: 'plain' })
        try {
          expect(document.head.querySelector('style[data-1c-preview-fonts]')).toBeNull()
        } finally {
          bare.editor.destroy()
        }
      }

      // THE ADDRESS ACTUALLY LOADS from the workspace origin. jsdom's base URL is
      // not the preview's, so only a real browser can prove the rewritten handle
      // resolves to something the origin serves.
      if (!browser || !WEBUI_INSTALLED) {
        unverified('AC-1041 that the rewritten face address loads from the workspace origin')
        return
      }
      await inWorkspace(async (page) => {
        await page.frameLocator('.builder-panel__frame').locator(region(PATH.headline)).click()
        await page.locator('.builder-modal').waitFor()
        const href = await page.$eval('style[data-1c-preview-fonts]', (el) => {
          const src = /url\(["']?([^"')]+)["']?\)/.exec(el.textContent ?? '')
          return src?.[1] ?? ''
        })
        expect(href).toContain('/preview/acme/edit/assets/editorial.woff2')
        const served = await page.evaluate(async (url) => {
          const res = await fetch(url)
          return { status: res.status, type: res.headers.get('content-type') }
        }, href)
        expect(served.status).toBe(200)
        expect(served.type).toBe('font/woff2')
      })
    },
    240000,
  )

  // ── AC-1042 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1042_the_previewed_size_is_clamped_while_every_other_axis_is_exact',
    async () => {
      // AC-1042 — the box previews STYLE, not layout. A display headline at its
      // page size is unusable in a dialog and a fine-print line is unreadable,
      // and the page itself is directly behind the dialog for anything about
      // layout. The clamp is a RANGE, not a ceiling.
      expect(PREVIEW_MIN_PX).toBeLessThan(PREVIEW_MAX_PX)
      expect(HEADLINE_SIZE_PX).toBeGreaterThan(PREVIEW_MAX_PX)
      expect(TINY_SIZE_PX).toBeLessThan(PREVIEW_MIN_PX)
      expect(ORDINARY_SIZE_PX).toBeGreaterThan(PREVIEW_MIN_PX)
      expect(ORDINARY_SIZE_PX).toBeLessThan(PREVIEW_MAX_PX)
      // A region whose size cannot be read at all previews at the lower bound
      // rather than at nothing. Every rendering computes *a* size, so this is
      // the range's own answer to an unreadable one.
      expect(clampPreviewSize(Number.NaN)).toBe(PREVIEW_MIN_PX)
      expect(clampPreviewSize(0)).toBe(PREVIEW_MIN_PX)

      if (!WEBUI_INSTALLED) {
        unverified('AC-1042 the clamp applied to the size the page actually renders')
        return
      }
      const cases = [
        { at: PATH.headline, page: HEADLINE_SIZE_PX, expected: PREVIEW_MAX_PX },
        { at: PATH.tiny, page: TINY_SIZE_PX, expected: PREVIEW_MIN_PX },
        { at: PATH.ordinary, page: ORDINARY_SIZE_PX, expected: ORDINARY_SIZE_PX },
      ]
      for (const spec of cases) {
        display()
        const opened = await openOn(region(spec.at))
        try {
          const box = opened.modal.querySelector('.builder-modal__box') as HTMLElement
          expect(box.style.getPropertyValue('--preview-font-size'), spec.at).toBe(
            `${spec.expected}px`,
          )
          // Still DERIVED from the page — only the extremes are brought in, so a
          // headline still previews larger than body copy.
          expect(clampPreviewSize(spec.page)).toBe(spec.expected)
          // Every OTHER axis is exact in each case.
          expect(box.style.getPropertyValue('--preview-font-family'), spec.at).toContain(
            PAGE_FAMILY,
          )
          expect(box.style.getPropertyValue('--preview-font-weight'), spec.at).toBe(
            String(PAGE_WEIGHT),
          )
          expect(box.style.getPropertyValue('--preview-font-style'), spec.at).toBe('italic')
          expect(box.style.getPropertyValue('--preview-color'), spec.at).toBe('rgb(248, 245, 239)')
        } finally {
          opened.editor.destroy()
        }
        for (const m of modals()) m.remove()
      }
      // The headline is genuinely brought DOWN and the legal line genuinely UP —
      // a clamp that only capped would leave the fine print unreadable.
      expect(clampPreviewSize(HEADLINE_SIZE_PX)).toBeLessThan(HEADLINE_SIZE_PX)
      expect(clampPreviewSize(TINY_SIZE_PX)).toBeGreaterThan(TINY_SIZE_PX)
    },
    240000,
  )

  // ── AC-1043 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1043_the_form_is_sized_for_copy_and_save_stays_reachable_at_every_window_size',
    async () => {
      // AC-1043 — sized for COPY, not for a property sheet, and never outgrowing
      // the window.
      const css = fs.readFileSync(BUILDER_CSS, 'utf8')
      const panel = rulesOf(css, (sel) => sel === '.builder-modal__panel').join('\n')
      expect(panel).toContain('width: min(880px, calc(100vw - 48px))')
      // The bound that keeps Save reachable: the panel is capped to the viewport
      // and the footer is a non-shrinking flex item, so a long field scrolls
      // rather than pushing the footer off the bottom.
      expect(panel).toContain('max-height: calc(100vh - 64px)')
      expect(rulesOf(css, (sel) => sel === '.builder-modal__footer').join('\n')).toContain(
        'flex: 0 0 auto',
      )
      // The NARROWING is keyed on the absence of the editing box, deliberately
      // not on the presence of a message: matching the error paragraph would
      // snap the panel narrower around copy the operator is still holding.
      const narrow = rulesOf(css, (sel) => sel.includes(':has(.builder-modal__box)')).join('\n')
      expect(narrow).toContain('width: min(520px, calc(100vw - 48px))')
      expect(css).not.toMatch(/\.builder-modal__panel:has\(\.builder-modal__(message|error)\)/)

      if (!WEBUI_INSTALLED) {
        unverified('AC-1043 the panel sized against real dialogs')
      } else {
        // A tall, resizable editing area: long copy derives the component's
        // multi-line control, which the component ships as user-resizable.
        display()
        const opened = await openOn(region(PATH.long))
        try {
          expect(
            opened.modal.querySelector('.fields-control-textarea'),
            'long copy opens the multi-line control',
          ).toBeTruthy()
          const box = opened.modal.querySelector('.builder-modal__box') as HTMLElement
          expect(box.style.getPropertyValue('--fields-textarea-min-height')).toBe('')
          // The height comes from the stylesheet, as a fraction of the viewport.
          expect(rulesOf(css, (sel) => sel === '.builder-modal__box').join('\n')).toContain(
            '--fields-textarea-min-height: clamp(140px, 34vh, 460px)',
          )
          // The wide panel is keyed on this box being present...
          expect(opened.modal.querySelector('.builder-modal__panel')!.matches(
            ':has(.builder-modal__box)',
          )).toBe(true)
        } finally {
          opened.editor.destroy()
        }
        for (const m of modals()) m.remove()

        // ...and a one-sentence dialog, having none, takes the narrow width.
        display()
        const deadEnd = await openOn(region(PATH.band))
        try {
          expect(deadEnd.modal.querySelector('.builder-modal__box')).toBeNull()
          expect(deadEnd.modal.querySelector('.builder-modal__panel')!.matches(
            ':has(.builder-modal__box)',
          )).toBe(false)
        } finally {
          deadEnd.editor.destroy()
        }
      }

      // MEASURED. jsdom lays nothing out and resolves no `min()`, so every claim
      // about width, height and reachability is browser-only.
      if (!browser || !WEBUI_INSTALLED) {
        unverified('AC-1043 the measured panel width, height and Save reachability')
        return
      }
      const homePath = path.join(cwd, 'storage/sites/acme/draft/pages/home.json')
      const sound = fs.readFileSync(homePath, 'utf8')
      try {
        await inWorkspace(async (page) => {
          const frame = page.frameLocator('.builder-panel__frame')
          await frame.locator(region(PATH.long)).click()
          await page.locator('.builder-modal').waitFor()

          // Wide enough to read a paragraph at the width it will be read at.
          // The CONTENT width is what the criterion is about — the border box
          // additionally carries the panel's padding, which is chrome around the
          // reading measure rather than part of it.
          const panelWidth = () =>
            page.$eval('.builder-modal__panel', (el) => ({
              content: getComputedStyle(el as HTMLElement).width,
              border: (el as HTMLElement).getBoundingClientRect().width,
            }))
          const wide = await panelWidth()
          expect(wide.content).toBe('880px')
          expect(wide.border).toBeLessThanOrEqual(1280)

          // The editing area is a substantial fraction of the viewport, and the
          // operator can drag it taller.
          const area = await page.$eval('.builder-modal .fields-control-textarea', (el) => {
            const node = el as HTMLElement
            return {
              height: node.getBoundingClientRect().height,
              resize: getComputedStyle(node).resize,
            }
          })
          expect(area.height).toBeGreaterThan(900 * 0.25)
          expect(area.resize).not.toBe('none')

          // IT NEVER OUTGROWS THE WINDOW. However small the window, the panel
          // stays inside it and Save stays reachable without the operator having
          // to shrink anything first.
          await page.setViewportSize({ width: 900, height: 320 })
          const fits = await page.$eval('.builder-modal__panel', (el) => {
            const r = (el as HTMLElement).getBoundingClientRect()
            return { top: r.top, bottom: r.bottom, height: r.height }
          })
          expect(fits.top).toBeGreaterThanOrEqual(0)
          expect(fits.bottom).toBeLessThanOrEqual(320)
          const save = page.locator('.builder-modal__btn--primary')
          const saveBox = (await save.boundingBox())!
          expect(saveBox.y).toBeGreaterThanOrEqual(0)
          expect(saveBox.y + saveBox.height).toBeLessThanOrEqual(320)
          expect(await save.isVisible()).toBe(true)
          // Reachable WITHOUT the operator having to shrink anything first —
          // proven by driving it: the click lands, and an untouched form closes.
          await save.click()
          await page.locator('.builder-modal').waitFor({ state: 'detached' })

          await page.setViewportSize({ width: 1280, height: 900 })

          // A dialog that is one sentence and a Close button is NOT stretched to
          // a copy editor's width — it stays narrow.
          //
          // Clicked BELOW the headline rather than at the band's centre: the
          // headline is inside the band, a click resolves to the innermost
          // region containing it (AC-995), and the band's centre is the
          // headline's box — which would open a copy form and prove nothing
          // about the narrow one.
          const bandBox = (await frame.locator(region(PATH.band)).boundingBox())!
          const headBox = (await frame.locator(region(PATH.headline)).boundingBox())!
          const below = headBox.y + headBox.height - bandBox.y
          expect(
            bandBox.height - below,
            'the band has room below its headline to click',
          ).toBeGreaterThan(8)
          await frame
            .locator(region(PATH.band))
            .click({ position: { x: 6, y: (below + bandBox.height) / 2 } })
          await page.locator('.builder-modal').waitFor()
          expect(await page.locator('.builder-modal__box').count()).toBe(0)
          expect((await panelWidth()).content).toBe('520px')
          // Dismissed by its own button rather than by Escape: the click that
          // opened it left focus inside the preview frame, so a key press would
          // go to the page's document rather than the workspace's. Escape is
          // AC-1002's subject; this criterion only needs the dialog gone.
          await page.locator('.builder-modal__btn', { hasText: /^Close$/ }).click()
          await page.locator('.builder-modal').waitFor({ state: 'detached' })

          // A REFUSAL INSIDE AN OPEN FORM MUST NOT RESIZE THE DIALOG around copy
          // the operator is still holding — which is why the narrowing is keyed
          // on the editing box rather than on a message being present. Break the
          // definition elsewhere on the page so the write path refuses in its own
          // terms, then confirm.
          await frame.locator(region(PATH.long)).click()
          await page.locator('.builder-modal').waitFor()
          const broken = JSON.parse(sound) as {
            l1: { root: { children: Array<{ axes?: Record<string, unknown> }> } }
          }
          broken.l1.root.children[6].axes = {
            ...broken.l1.root.children[6].axes,
            fontSizePx: 9999,
          }
          fs.writeFileSync(homePath, JSON.stringify(broken, null, 2))

          const control = page.locator('.builder-modal .fields-control-textarea')
          await control.fill('What the operator typed, still theirs after the refusal.')
          await control.blur()
          await page.locator('.builder-modal__btn--primary').click()
          await page.locator('.builder-modal__error:not([hidden])').waitFor()

          // The form is still open, still holding the operator's words, and the
          // panel did not snap narrower around them.
          expect(await page.locator('.builder-modal').count()).toBe(1)
          expect((await panelWidth()).content).toBe(wide.content)
        })
      } finally {
        fs.writeFileSync(homePath, sound)
      }
    },
    240000,
  )

  // ── AC-1044 ────────────────────────────────────────────────────────────────

  it(
    'test_UAT_AC1044_a_lone_field_opens_in_its_control_and_two_fields_open_none',
    async () => {
      // AC-1044 — the dialog opened BECAUSE the operator clicked those words, so
      // the value is not being read and a second click buys nothing. It is also
      // what makes the box a box you can obviously type in, which is the premise
      // the dropped heading rests on.
      if (!WEBUI_INSTALLED) {
        unverified('AC-1044 the lone field opened into its control')
        return
      }
      const draftBytes = () =>
        fs.readFileSync(path.join(cwd, 'storage/sites/acme/draft/pages/home.json'), 'utf8')
      const renderedBytes = () => fs.readFileSync(renderedPath, 'utf8')
      const beforeDraft = draftBytes()
      const beforeRender = renderedBytes()

      display()
      let reRenders = 0
      const opened = await openOn(region(PATH.headline), {
        onSaved: () => {
          reRenders += 1
        },
      })
      try {
        // Present, holding the region's current words, with NO further click.
        const control = opened.modal.querySelector('.fields-control') as HTMLInputElement
        expect(control, 'the one field opens in its control').toBeTruthy()
        expect(control.value).toBe(HEADLINE)
        // ...and nothing is written by opening it.
        expect(draftBytes()).toBe(beforeDraft)
        expect(renderedBytes()).toBe(beforeRender)

        // Closing it without a change is the same answer as cancelling: nothing
        // written, nothing re-rendered.
        ;(opened.modal.querySelector('.builder-modal__btn--primary') as HTMLElement).dispatchEvent(
          new window.MouseEvent('click', { bubbles: true }),
        )
        await new Promise((r) => setTimeout(r, 50))
        expect(modals()).toHaveLength(0)
        expect(reRenders).toBe(0)
        expect(draftBytes()).toBe(beforeDraft)
        expect(renderedBytes()).toBe(beforeRender)
      } finally {
        opened.editor.destroy()
      }
      for (const m of modals()) m.remove()

      // WITH TWO OR MORE THERE IS NO "THE" FIELD, and opening the first would
      // silently privilege it. An image exposes its handle and its alt text.
      display()
      const image = await openOn(region(PATH.image))
      try {
        expect(image.modal.querySelectorAll('.fields-row')).toHaveLength(2)
        expect(image.modal.querySelectorAll('.fields-control')).toHaveLength(0)
        // Both are still reachable — they are values awaiting the click that a
        // lone field no longer needs.
        expect(image.modal.querySelectorAll('.fields-value-editable')).toHaveLength(2)
      } finally {
        image.editor.destroy()
      }
    },
    240000,
  )
})
