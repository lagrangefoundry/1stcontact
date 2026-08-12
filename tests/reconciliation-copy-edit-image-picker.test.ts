// @vitest-environment jsdom
/**
 * story-3bf94bd4 — **choosing an image by looking at it** (REQ-132).
 *
 * The gesture already opened a form over whatever a region exposed, and an image
 * region's "which image goes here" was a closed list. What this covers is the
 * *control* that list is put behind: a grid of thumbnails labelled by file name,
 * in place of a native `<select>` of `/assets/…` handles — choosing a picture by
 * reading a path, which is choosing it by the wrong property and one that stops
 * meaning anything at all once assets live in a store rather than a filesystem.
 *
 * SHAPED TO FAIL IF THIS BECOMES A SECOND MECHANISM. The value vocabulary is
 * untouched, and these assert it: the options are still the derivation's `enum`,
 * read over the same `/api/copy`, and what a tile commits is still the full
 * handle the write side validates membership against. Only the label is the file
 * name. A suite that let the label become the value would be documenting a change
 * to the write path, which is precisely what this is not.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT. The document is the bytes
 * `1c render --edit` wrote, the bridge is the one the browser runs, the origin is
 * a real builder over HTTP, and the dialog is the real `defaultModal` composing
 * the real `mountFields`. An injected modal double would be a test of the double,
 * and every criterion here is about what the real dialog builds.
 *
 * WHAT A HEADLESS RUN CANNOT SEE, named rather than quietly skipped: jsdom
 * fetches no images and lays nothing out. So "the thumbnail is the right bytes"
 * is asserted by fetching the URL the tile carries from the real origin — which
 * is the claim that could actually be wrong, the *shape* of that URL — and the
 * unloadable-thumbnail path is driven by dispatching the `error` event the
 * browser itself would dispatch.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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

/** Handles, in the form an L1 node holds them. */
const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const LOGO = '/assets/logo.svg'
/**
 * A second `hero.png`, in a sub-directory. The listing walks recursively, so this
 * is a genuine file-name collision — two options a picker must keep tellable
 * apart without putting a path on every tile.
 */
const GALLERY_HERO = '/assets/gallery/hero.png'
/** A handle the capture fold could not mirror: a real value, on no disk here. */
const REMOTE = 'https://cdn.example.com/offsite.jpg'
/** A cache-busted handle — the suffix is not part of what the image is called. */
const QUERY = '/assets/hero.png?v=2'
/** A handle that ends in a separator and so names no file at all. */
const SEPARATOR = '/assets/'

/** Every image the site offers, in `enum` order (sorted, deduplicated). */
const SITE_IMAGES = [BETA, GALLERY_HERO, HERO, LOGO]
/** The same list as the grid labels it — file names alone, in the same order. */
const SITE_IMAGE_NAMES = ['beta.png', 'hero.png', 'hero.png', 'logo.svg']

const ALT = 'The hero'
const OFFSITE_ALT = 'An offsite photograph the capture could not mirror.'

// Addresses, as the edit render stamps them (`data-l1-path`).
/** The image region under test. */
const AN_IMAGE = '0.0'
/** A painted container — REQ-128's picker, which gets the same control. */
const A_BACKDROP = '0.1'
/** An image whose handle names bytes this origin cannot serve. */
const AN_OFFSITE_IMAGE = '0.2'
/** An image whose handle carries a query string. */
const A_CACHE_BUSTED_IMAGE = '0.3'
/** An image whose handle ends in a separator. */
const A_SEPARATOR_IMAGE = '0.4'

/**
 * What `draft/assets/` holds: images beside the fonts and stylesheets a capture
 * mirrors, and one image inside a sub-directory. The non-images are the fixture's
 * point — they are real assets with real names, and nothing an image field can
 * point at, so a grid offering one would be offering a broken image.
 */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'gallery/hero.png': 'bytes:gallery-hero',
  'body.woff2': 'bytes:font',
  'site.css': 'body{}',
}

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 picker suite: ${WEBUI_SKIP_REASON}`)

const REPO = path.resolve(__dirname, '..')
const BUILDER_CSS = path.join(REPO, 'apps/control-app/src/builder/builder.css')

/**
 * Every declaration block whose selector satisfies `keep`.
 *
 * Comments are stripped FIRST. A selector is everything since the last `}`, so a
 * rule preceded by a comment — which is most of the modal's — would otherwise
 * arrive with that comment glued to its front and match nothing, silently
 * narrowing the assertion to the rules that happen to have no comment above them.
 */
function rulesOf(css: string, keep: (selector: string) => boolean): string[] {
  const blocks: string[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
  while ((m = re.exec(bare))) if (keep(m[1].trim())) blocks.push(m[2])
  return blocks
}

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

/**
 * One page carrying every case the grid has to answer for: an image with alt
 * text beside it, a painted band exposing only a background, and three handles
 * that stress the label — off-site, cache-busted, and ending in a separator.
 *
 * The first image keeps an axis (`objectFit`) so "picking a different picture
 * disturbed nothing else" is measurable: a node with one field could not tell
 * "preserved" from "there was nothing to lose".
 */
function seedSite(cwd: string, slug: string): void {
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    const file = draftPath(cwd, slug, 'assets', name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, bytes)
  }

  // One registered entry naming a file the directory also holds — two sources
  // for one handle, so a duplicated option would surface as a duplicated tile.
  const siteJson = draftPath(cwd, slug, 'site.json')
  const base = JSON.parse(fs.readFileSync(siteJson, 'utf8'))
  base.assets = [{ id: 'beta', src: 'beta.png', alt: 'The beta image' }]
  fs.writeFileSync(siteJson, JSON.stringify(base, null, 2))

  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'image', id: 'hero-img', src: HERO, alt: ALT, axes: { objectFit: 'cover' } },
      {
        kind: 'container',
        id: 'backdrop',
        layout: 'stack',
        axes: { backgroundImageUrl: BETA, surfaceFill: '#101822' },
        children: [{ kind: 'text', text: 'Over the backdrop.' }],
      },
      { kind: 'image', id: 'offsite-img', src: REMOTE, alt: OFFSITE_ALT },
      { kind: 'image', id: 'busted-img', src: QUERY, alt: 'Cache busted' },
      { kind: 'image', id: 'separator-img', src: SEPARATOR, alt: 'Names no file' },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
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

describe('story-3bf94bd4 choosing an image by looking at it', () => {
  let cwd: string
  let html: string
  let pageId: string
  let builder: BuilderHandle
  /** Loaded dynamically: `editor.js` imports the form component by bare specifier. */
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-picker-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
    builder = await startBuilder({ cwd })
    if (WEBUI_INSTALLED) {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }
  }, 240000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /** Put the edit rendering on screen, stylesheet included. */
  function display(): void {
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
  }

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

  beforeEach(() => {
    document.body.replaceChildren()
    net = browserFetch(builder.url)
  })

  afterEach(() => {
    editor?.destroy()
    editor = undefined
    for (const m of modals()) m.remove()
    net.restore()
  })

  /**
   * Open the dialog the way the operator does: by clicking the thing.
   *
   * Several of these criteria are about more than one region, so this replaces
   * any editor already mounted rather than leaking it — an undetached editor
   * keeps its document listeners and would open a second dialog on the next
   * click, which reads as "the gesture opened two forms" rather than as the
   * harness fault it is.
   */
  async function openAt(address: string): Promise<Element> {
    editor?.destroy()
    editor = undefined
    display()
    editor = mountEditor(document, {
      slug: 'acme',
      bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
    })
    const el = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)
    if (!el) throw new Error(`nothing rendered at ${address}`)
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle(1)
    expect(modals()).toHaveLength(1)
    return modals()[0]
  }

  const tiles = (root: Element) => [...root.querySelectorAll('.builder-modal__tile')]
  const tileNames = (root: Element) =>
    tiles(root).map((t) => t.querySelector('.builder-modal__tile-name')!.textContent)
  const tileTitles = (root: Element) => tiles(root).map((t) => (t as HTMLElement).title)
  const options = (root: Element) => [
    ...root.querySelectorAll<HTMLInputElement>('.builder-modal__tile-input'),
  ]
  const checkedTile = (root: Element) =>
    root.querySelector<HTMLInputElement>('.builder-modal__tile-input:checked')
  const tileFor = (root: Element, handle: string) =>
    tiles(root).find((t) => (t as HTMLElement).title === handle)!

  /** Stage a pick the way a click on a tile does. */
  function pick(modal: Element, handle: string): void {
    const input = options(modal).find((o) => o.value === handle)!
    input.checked = true
    input.dispatchEvent(new window.Event('change', { bubbles: true }))
  }

  async function save(modal: Element): Promise<void> {
    modal
      .querySelector('.builder-modal__btn--primary')!
      .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle(0)
  }

  /** The node as the draft now holds it, read back through the real command. */
  async function nodeAt(address: string): Promise<Record<string, string>> {
    const got = await cli(cwd, 'copy', 'get', 'acme', pageId, address)
    const fields = got.data!.fields as Array<{ name: string }>
    expect(fields.length).toBeGreaterThan(0)
    return got.data!.values as Record<string, string>
  }

  /** The options the derivation itself declares — the authority a grid must match. */
  async function declaredOptions(address: string, field: string): Promise<string[]> {
    const got = await cli(cwd, 'copy', 'get', 'acme', pageId, address)
    const descriptor = (got.data!.fields as Array<{ name: string; enum?: string[] }>).find(
      (f) => f.name === field,
    )!
    return descriptor.enum!
  }

  /** Put a handle back, so the ordering of this suite's cases cannot matter. */
  const restore = (address: string, values: Record<string, string>) =>
    cli(cwd, 'copy', 'set', 'acme', pageId, address, '--values', JSON.stringify(values))

  const draftNode = (index: number): Record<string, unknown> =>
    JSON.parse(fs.readFileSync(draftPath(cwd, 'acme', 'pages', `${pageId}.json`), 'utf8')).l1.root
      .children[index]

  // ── AC-1112 — the grid, and the dropdown it replaced ──────────────────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1112_the_closed_list_is_a_grid_of_thumbnails_and_the_dropdown_is_gone',
    async () => {
      const modal = await openAt(AN_IMAGE)
      const picker = modal.querySelector('.builder-modal__picker')!

      // EXACT IN BOTH DIRECTIONS, against the derivation's own answer rather
      // than a list this test happens to believe: every option declared has a
      // tile, and nothing that is not an option appears in the grid.
      const declared = await declaredOptions(AN_IMAGE, 'src')
      expect(declared).toEqual(SITE_IMAGES)
      expect(tileTitles(picker)).toEqual(declared)
      expect(tiles(picker)).toHaveLength(declared.length)

      // Each tile is a picture with a name, and nothing else is in the grid.
      for (const tile of tiles(picker)) {
        expect(tile.querySelector('img')).not.toBeNull()
        expect(tile.querySelector('.builder-modal__tile-name')!.textContent).not.toBe('')
      }
      expect(tileNames(picker)).toEqual(SITE_IMAGE_NAMES)

      // The font and the stylesheet in the same directory are real assets with
      // real names, and nothing an image handle can point at. Absent from the
      // grid as well as from the list behind it.
      expect(picker.textContent).not.toContain('body.woff2')
      expect(picker.textContent).not.toContain('site.css')
      expect(modal.textContent).not.toContain('body.woff2')
      expect(modal.textContent).not.toContain('site.css')

      // ONE WAY TO CHOOSE. Two controls answering the same question is the
      // failure this replaces, not a fallback worth keeping.
      expect(modal.querySelector('select')).toBeNull()
      // And the rest of the dialog is untouched: the alt text is still drawn by
      // the shared form component beside the grid.
      expect(modal.querySelector('.builder-modal__form')).not.toBeNull()
      expect(modal.querySelectorAll('.builder-modal__picker')).toHaveLength(1)
    },
  )

  // ── AC-1113 — the label is the file name; the value is the handle ──────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1113_a_tile_is_labelled_with_the_file_name_and_commits_the_full_handle',
    async () => {
      const modal = await openAt(AN_IMAGE)
      const picker = modal.querySelector('.builder-modal__picker')!

      // The visible label is the file name, and the whole of it. No directory
      // appears anywhere in the grid — including for the image that lives in a
      // sub-directory, which is where a path would otherwise leak back in.
      expect(tileNames(picker)).toEqual(SITE_IMAGE_NAMES)
      expect(picker.textContent).not.toContain('/assets/')
      expect(picker.textContent).not.toContain('gallery')
      expect(picker.textContent).not.toContain('/')

      // TWO IMAGES SHARE A NAME, deliberately tolerated rather than
      // disambiguated: the tooltip settles which is which, so a collision is
      // resolvable without putting a path on every tile that never needed one.
      expect(tileNames(picker).filter((n) => n === 'hero.png')).toHaveLength(2)
      expect(tileTitles(picker)).toEqual(SITE_IMAGES)

      // THE VALUE IS UNCHANGED BY ANY OF THIS. What a tile commits is the full
      // handle — the same vocabulary the write path validates membership
      // against. Stripping the path is a display projection and nothing more.
      expect(options(picker).map((o) => o.value)).toEqual(SITE_IMAGES)

      // A query string is not part of what an image is called...
      const busted = await openAt(A_CACHE_BUSTED_IMAGE)
      expect(tileFor(busted, QUERY).querySelector('.builder-modal__tile-name')!.textContent).toBe(
        'hero.png',
      )
      expect(options(busted).find((o) => o.value === QUERY)).toBeTruthy()

      // ...and a handle that ends in a separator names no file, so the handle
      // itself is the only honest label left: showing it beats showing nothing.
      const bare = await openAt(A_SEPARATOR_IMAGE)
      expect(tileFor(bare, SEPARATOR).querySelector('.builder-modal__tile-name')!.textContent).toBe(
        SEPARATOR,
      )

      // And choosing the tile whose name is shared writes the FULL handle of the
      // tile chosen — the sub-directory one, not the bare `hero.png` beside it.
      const modal2 = await openAt(AN_IMAGE)
      pick(modal2, GALLERY_HERO)
      await save(modal2)
      expect(await nodeAt(AN_IMAGE)).toMatchObject({ src: GALLERY_HERO, alt: ALT })

      await restore(AN_IMAGE, { src: HERO })
    },
  )

  // ── AC-1114 — the tile shows the bytes the origin serves ───────────────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1114_a_tile_shows_the_bytes_the_origin_serves_over_the_pages_own_channel',
    async () => {
      const modal = await openAt(AN_IMAGE)

      // RESOLVED AS THE PAGE RESOLVES ITS OWN IMAGES: against the channel root
      // already serving the document under edit, not a second convention that
      // could disagree with it. Same origin, so the grid is never cross-origin.
      for (const [handle, bytes] of [
        [HERO, ASSET_FILES['hero.png']],
        [GALLERY_HERO, ASSET_FILES['gallery/hero.png']],
      ] as const) {
        const src = tileFor(modal, handle).querySelector('img')!.getAttribute('src')!
        const url = new URL(src, builder.url)
        expect(url.origin, handle).toBe(new URL(builder.url).origin)
        expect(url.pathname, handle).toBe(`/preview/acme/draft${handle}`)

        // The bytes themselves — nothing resized, re-encoded or duplicated to
        // populate the grid, so what the operator sees is what the page shows.
        const res = await fetch(url)
        expect(res.status, handle).toBe(200)
        expect(await res.text(), handle).toBe(bytes)
      }

      // NO NEW ENDPOINT. The dialog's own traffic is the copy transport it
      // always used; the asset listing route is not consulted to draw a grid.
      const paths = net.calls.map((c) => new URL(c.url).pathname)
      expect(paths.some((p) => p.startsWith('/api/copy'))).toBe(true)
      expect(paths.filter((p) => p.startsWith('/api/assets'))).toEqual([])
      for (const p of paths) {
        expect(p.startsWith('/api/copy') || p.startsWith('/preview/'), p).toBe(true)
      }

      // A handle that already names its own origin is used EXACTLY as it stands.
      // Prefixing it would manufacture a site-local path resolving to nothing.
      const offsite = await openAt(AN_OFFSITE_IMAGE)
      expect(tileFor(offsite, REMOTE).querySelector('img')!.getAttribute('src')).toBe(REMOTE)
    },
  )

  // ── AC-1115 — a handle whose bytes will not arrive keeps its tile ──────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1115_a_handle_the_origin_cannot_serve_keeps_a_named_selectable_tile',
    async () => {
      const modal = await openAt(AN_OFFSITE_IMAGE)

      // The handle a region holds is ALWAYS among its options and may name bytes
      // this origin cannot produce. It is the selected tile, so the region can
      // keep the image it has.
      const offsite = tileFor(modal, REMOTE)
      expect(offsite.querySelector('.builder-modal__tile-name')!.textContent).toBe('offsite.jpg')
      expect(checkedTile(modal)!.value).toBe(REMOTE)

      // What the browser does when those bytes do not arrive. The tile must not
      // go with the picture: it is the only way to keep this image.
      const img = offsite.querySelector('img')!
      img.dispatchEvent(new window.Event('error'))

      const thumb = offsite.querySelector('.builder-modal__tile-thumb')!
      // Marked as a picture that did not load rather than left an empty frame...
      expect(thumb.classList).toContain('is-missing')
      // ...still where it was, still labelled, still the chosen option.
      expect(tiles(modal)).toContain(offsite)
      expect(offsite.querySelector('.builder-modal__tile-name')!.textContent).toBe('offsite.jpg')
      expect(offsite.querySelector<HTMLInputElement>('.builder-modal__tile-input')!.checked).toBe(
        true,
      )
      expect(checkedTile(modal)!.value).toBe(REMOTE)

      // AND THE REGION CAN STILL BE SAVED HOLDING IT. This is the failure the
      // criterion exists for: an operator who opened the dialog to fix the alt
      // text must not find the image gone when they save.
      const cell = modal.querySelector('.fields-value-editable') as HTMLElement
      cell.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      const control = modal.querySelector('.fields-control') as HTMLInputElement
      control.value = 'Still offsite'
      control.dispatchEvent(new window.Event('input', { bubbles: true }))
      control.dispatchEvent(new window.Event('change', { bubbles: true }))
      control.dispatchEvent(new window.FocusEvent('blur'))
      await save(modal)

      expect(await nodeAt(AN_OFFSITE_IMAGE)).toMatchObject({
        src: REMOTE,
        alt: 'Still offsite',
      })

      await restore(AN_OFFSITE_IMAGE, { alt: OFFSITE_ALT })
    },
  )

  // ── AC-1116 — usable without a mouse, honest about what it is ─────────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1116_the_grid_is_one_keyboard_reachable_single_selection_group',
    async () => {
      const modal = await openAt(AN_IMAGE)
      const picker = modal.querySelector('.builder-modal__picker')!

      // ONE SINGLE-SELECTION GROUP, named by the field it stands for.
      expect(picker.getAttribute('role')).toBe('radiogroup')
      expect(picker.getAttribute('aria-label')).toBe('Image')

      // Real single-selection controls, so arrow-key navigation, the
      // exactly-one invariant and the announcement of both come from the
      // platform rather than from a claim the grid makes and does not honour.
      expect(options(picker)).toHaveLength(SITE_IMAGES.length)
      for (const input of picker.querySelectorAll<HTMLInputElement>('input')) {
        expect(input.type).toBe('radio')
      }
      // All of one group: a second name would let two tiles be chosen at once.
      expect(new Set(options(picker).map((o) => o.name)).size).toBe(1)

      // Each option's accessible name is its file name, and the thumbnail beside
      // it is not described a second time — announcing both would announce every
      // tile twice, and an asset's alt text belongs to the region using it.
      for (const tile of tiles(picker)) {
        expect(tile.querySelector('img')!.getAttribute('alt')).toBe('')
      }

      // THE KEYBOARD IS ALREADY HERE, on the tile the region currently holds —
      // and it got here after the dialog was in the document, since focus
      // offered to a detached element is discarded silently.
      expect(document.activeElement).toBe(checkedTile(modal))
      expect((document.activeElement as HTMLInputElement).value).toBe(HERO)

      // Choosing a second option leaves exactly one chosen.
      pick(modal, LOGO)
      expect(options(picker).filter((o) => o.checked).map((o) => o.value)).toEqual([LOGO])
      expect(tiles(picker).filter((t) => t.classList.contains('is-selected'))).toHaveLength(1)
    },
  )

  // ── AC-1043 — the grid is bounded, so Save stays reachable ────────────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1043_the_thumbnail_grid_is_bounded_and_scrolls_within_its_own_bounds',
    async () => {
      // The panel's own rule keeps the dialog inside the viewport; this is the
      // grid obeying it from the other direction. A grid that grew with the
      // site's asset count would push the footer — and therefore Save — out of
      // the dialog on a site with enough images, which is the one failure the
      // criterion names.
      const css = fs.readFileSync(BUILDER_CSS, 'utf8')
      const grid = rulesOf(css, (sel) => sel === '.builder-modal__picker').join('\n')
      expect(grid).not.toBe('')
      // Bounded...
      expect(grid).toMatch(/max-height:\s*min\(52vh,\s*460px\)/)
      // ...and scrolling INSIDE that bound rather than overflowing the panel.
      expect(grid).toMatch(/overflow-y:\s*auto/)

      // And the dialog it sits in is the full copy-editing width, not the
      // narrow message width: an all-thumbnails dialog is a grid of pictures,
      // which is the thing that needs the width most. Keyed on the absence of
      // EITHER editing surface, so naming the picker is what buys this.
      const narrow = rulesOf(
        css,
        (sel) =>
          sel.includes(':has(.builder-modal__box') && sel.includes('.builder-modal__picker'),
      ).join('\n')
      expect(narrow).toContain('width: min(520px, calc(100vw - 48px))')

      // The real dialog over a background-only region is one the narrowing rule
      // does NOT match: it carries a picker, so it keeps the full width.
      const backdrop = await openAt(A_BACKDROP)
      const panel = backdrop.querySelector('.builder-modal__panel')!
      expect(panel.querySelector('.builder-modal__picker')).not.toBeNull()
      expect(panel.querySelector('.builder-modal__box')).toBeNull()
      // Save is in the dialog with the grid, so bounding the grid is what keeps
      // it reachable.
      expect(panel.querySelector('.builder-modal__btn--primary')).not.toBeNull()
    },
  )

  // ── AC-1028 — the region's own handle is the SELECTED tile ────────────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1028_the_handle_the_region_holds_is_the_tile_already_selected',
    async () => {
      // Not merely among the options — the one chosen when the dialog opens. A
      // picker that opened on the wrong tile would change the image behind the
      // operator's back the moment they saved an alt-text edit.
      const modal = await openAt(AN_IMAGE)
      expect(checkedTile(modal)!.value).toBe(HERO)
      expect(modal.querySelectorAll('.builder-modal__tile-input:checked')).toHaveLength(1)
      expect(
        tiles(modal)
          .filter((t) => t.classList.contains('is-selected'))
          .map((t) => (t as HTMLElement).title),
      ).toEqual([HERO])

      // Including when the handle names bytes no listing found — the case a
      // "first option wins" picker would silently rewrite.
      const offsite = await openAt(AN_OFFSITE_IMAGE)
      expect(checkedTile(offsite)!.value).toBe(REMOTE)
      expect(offsite.querySelectorAll('.builder-modal__tile-input:checked')).toHaveLength(1)

      // And a painted panel's background, over the same closed list.
      const backdrop = await openAt(A_BACKDROP)
      expect(checkedTile(backdrop)!.value).toBe(BETA)
      expect(tileTitles(backdrop)).toEqual(SITE_IMAGES)
    },
  )

  // ── AC-997 — one confirmed dialog is one change, across two controls ──────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC997_a_picked_image_and_new_alt_text_travel_in_one_change',
    async () => {
      const modal = await openAt(AN_IMAGE)

      // Picking STAGES, it does not commit: Save is still the single flush point
      // however many controls the dialog took to fill in.
      pick(modal, LOGO)
      expect(net.calls.filter((c) => c.method === 'POST')).toEqual([])

      const cell = modal.querySelector('.fields-value-editable') as HTMLElement
      cell.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      // The component's own control, reached by its own class — a bare `input`
      // selector would find the picker's first radio, since the grid sits above
      // the form.
      const control = modal.querySelector('.fields-control') as HTMLInputElement
      control.value = 'A logo instead'
      control.dispatchEvent(new window.Event('input', { bubbles: true }))
      control.dispatchEvent(new window.Event('change', { bubbles: true }))
      control.dispatchEvent(new window.FocusEvent('blur'))

      await save(modal)

      // EXACTLY ONE DIFF for the whole dialog — one write, one re-render.
      const posts = net.calls.filter((c) => c.method === 'POST')
      expect(posts).toHaveLength(1)
      expect(new URL(posts[0].url).pathname).toBe('/api/copy')

      // Both halves landed, in that one change...
      expect(await nodeAt(AN_IMAGE)).toMatchObject({ src: LOGO, alt: 'A logo instead' })
      // ...and nothing the operator did not touch travelled with them.
      const node = draftNode(0)
      expect(node.axes).toEqual({ objectFit: 'cover' })
      expect(node.id).toBe('hero-img')

      await restore(AN_IMAGE, { src: HERO, alt: ALT })
    },
  )

  // ── AC-1000 — nothing touched in EITHER control writes nothing ────────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1000_a_dialog_closed_with_neither_control_touched_writes_nothing',
    async () => {
      // A dialog opened and thought better of is not an edit. The picker joined
      // the dirty check rather than replacing it, so this holds now that a
      // dialog can be all grid and no form.
      const backdrop = await openAt(A_BACKDROP)
      expect(backdrop.querySelector('.builder-modal__picker')).not.toBeNull()
      expect(backdrop.querySelector('.builder-modal__form')).toBeNull()
      const beforeBackdrop = draftNode(1)
      await save(backdrop)
      expect(net.calls.filter((c) => c.method === 'POST')).toEqual([])
      expect(draftNode(1)).toEqual(beforeBackdrop)

      // And with both controls present, untouched: opening to look is not an
      // edit, and re-reporting the handle the dialog opened with would read as
      // an explicit "put the old image back".
      const image = await openAt(AN_IMAGE)
      expect(image.querySelector('.builder-modal__picker')).not.toBeNull()
      expect(image.querySelector('.builder-modal__form')).not.toBeNull()
      const beforeImage = draftNode(0)
      await save(image)
      expect(net.calls.filter((c) => c.method === 'POST')).toEqual([])
      expect(draftNode(0)).toEqual(beforeImage)
    },
  )
})
