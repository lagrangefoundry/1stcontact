// @vitest-environment jsdom
/**
 * REQ-132 — the image picker shows the images.
 *
 * REQ-118 and REQ-128 established *which* images a segment may hold; this is
 * about how that closed list is put in front of a person. A `<select>` of
 * `/assets/…` handles asks the operator to choose a picture by reading a path —
 * a property of where the file is filed, not of the picture, and one that stops
 * existing at all once assets live in a store rather than a filesystem.
 *
 * SHAPED TO FAIL IF THIS BECOMES A SECOND MECHANISM. There is no new command, no
 * new route and no new value vocabulary here, and the tests say so: the options
 * are still the derivation's `enum`, the write still goes through `/api/copy`,
 * and what a tile commits is still the handle the write side validates against.
 * What changed is entirely the control.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern the REQ-121 and
 * gesture-modal suites established: the document is the bytes `1c render --edit`
 * wrote, the bridge is the one the browser runs, the origin is a real builder
 * and the dialog is the real `defaultModal`. An injected modal double would be a
 * test of the double, and every criterion here is about what the real dialog
 * builds.
 *
 * WHAT A HEADLESS RUN CANNOT SEE, called out rather than quietly skipped: jsdom
 * fetches no images and lays nothing out. So "the thumbnail is the right bytes"
 * is asserted by fetching the URL the tile carries from the real origin (which
 * is the claim that could actually be wrong — the shape of the URL), and the
 * unloadable-image path is exercised by dispatching the `error` event the
 * browser would dispatch.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { run } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  copyFieldsOf,
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const LOGO = '/assets/logo.svg'
/** A handle the fold could not mirror — on no disk, but still a node's value. */
const REMOTE = 'https://cdn.example.com/offsite.jpg'

/** Every image the site can offer, in the handle form an L1 node holds. */
const SITE_IMAGES = [BETA, HERO, LOGO]
/** The same list as a picker labels it — file names, sorted as the handles are. */
const SITE_IMAGE_NAMES = ['beta.png', 'hero.png', 'logo.svg']

/** The image segment under test. */
const AN_IMAGE = '0.0'
/** A painted container — REQ-128's picker, which must get the same treatment. */
const A_BACKDROP = '0.1'
/** An image whose handle names bytes this origin cannot serve. */
const AN_OFFSITE_IMAGE = '0.2'

const ALT = 'The hero'

/**
 * What `draft/assets/` holds: images beside the fonts and stylesheets a capture
 * mirrors. The non-images are the fixture's point — they are files with names,
 * and a picker that offered them would be offering something no image field can
 * use.
 */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'body.woff2': 'bytes:font',
  'site.css': 'body{}',
}

if (!WEBUI_INSTALLED) console.warn(`REQ-132 picker suite: ${WEBUI_SKIP_REASON}`)

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
}

/**
 * One page carrying every case the picker has to answer for: an image with alt
 * text, a painted band, and an image pointing off-disk.
 *
 * The first image keeps an axis (`objectFit`) so "picking a different picture
 * disturbed nothing else" is measurable — a node with one field could not tell
 * "preserved" from "there was nothing to lose".
 */
function seedSite(cwd: string, slug: string): void {
  fs.mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    fs.writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }

  // One registered entry, the rest undeclared on disk — the state every real
  // site in `storage/` is in, and the one a registry-only listing shows nothing
  // for.
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
      { kind: 'image', id: 'offsite-img', src: REMOTE, alt: 'Offsite' },
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

describe('REQ-132 the image picker', () => {
  let cwd: string
  let html: string
  let pageId: string
  let builder: BuilderHandle
  /** Loaded dynamically: `editor.js` imports the form component by bare specifier. */
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req132-'))
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

  /** Open the dialog the way the operator does: by clicking the thing. */
  async function openAt(address: string): Promise<Element> {
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

  const tiles = (modal: Element) => [...modal.querySelectorAll('.builder-modal__tile')]
  const tileNames = (modal: Element) =>
    tiles(modal).map((t) => t.querySelector('.builder-modal__tile-name')!.textContent)
  const checkedTile = (modal: Element) =>
    modal.querySelector<HTMLInputElement>('.builder-modal__tile-input:checked')

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
    const values = got.data!.values as Record<string, string>
    expect(fields.length).toBeGreaterThan(0)
    return values
  }

  // ── the derivation says what the options ARE ───────────────────────────────

  it('test_UAT_FC_REQ-132_an_image_field_declares_that_its_options_are_images', () => {
    // The hint travels ON THE DESCRIPTOR, so every surface reading the same
    // derivation learns the same thing. It is a hint and never a constraint: the
    // closed list is still `enum`, and the write side still validates membership
    // against exactly that.
    const image = copyFieldsOf(
      { kind: 'image', src: HERO, alt: ALT } as L1Node,
      { assets: SITE_IMAGES },
    )!
    const src = image.fields.find((f) => f.name === 'src')!
    expect(src.type).toBe('enum')
    expect(src.format).toBe('image')
    expect(src.enum).toEqual(SITE_IMAGES)

    // The alt text beside it is words, not a picture — it must NOT be claimed by
    // the picker, or an image segment would lose its only text field.
    expect(image.fields.find((f) => f.name === 'alt')!.format).toBeUndefined()

    // A painted surface asks the same question of the same list, so front and
    // back can never disagree about what the site has.
    const band = copyFieldsOf(
      { kind: 'container', layout: 'stack', children: [], axes: { backgroundImageUrl: BETA } } as L1Node,
      // `paints` is the renderer's verdict that this box IS a segment (REQ-140).
      // A box that paints nothing is not clickable and exposes nothing, so the
      // derivation is told rather than guessing; this one paints its backdrop.
      { assets: SITE_IMAGES, paints: true },
    )!
    expect(band.fields[0]).toMatchObject({ name: 'backgroundImageUrl', format: 'image' })

    // And a text run is untouched: nothing about copy became a picture.
    const copy = copyFieldsOf({ kind: 'text', text: 'words' } as L1Node, { assets: SITE_IMAGES })!
    expect(copy.fields[0].format).toBeUndefined()
  })

  // ── the control the operator actually meets ────────────────────────────────

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_an_image_segment_offers_one_thumbnail_tile_per_image',
    async () => {
      const modal = await openAt(AN_IMAGE)

      // One tile per option the derivation offered, each carrying a picture.
      expect(tiles(modal)).toHaveLength(SITE_IMAGES.length)
      for (const tile of tiles(modal)) {
        expect(tile.querySelector('img')).not.toBeNull()
        expect(tile.querySelector('.builder-modal__tile-name')!.textContent).not.toBe('')
      }

      // The fonts and stylesheets in the same directory are files with names,
      // and they are not here: the picker offers what an image field can hold.
      expect(tileNames(modal)).toEqual(SITE_IMAGE_NAMES)
      expect(modal.textContent).not.toContain('body.woff2')
      expect(modal.textContent).not.toContain('site.css')
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_a_tile_is_labelled_with_the_file_name_and_never_its_path',
    async () => {
      const modal = await openAt(AN_IMAGE)
      const picker = modal.querySelector('.builder-modal__picker')!

      // The visible label is the file name. Nothing in the picker shows the
      // directory it sits in — which is the whole point: a handle is an address,
      // and it will not survive assets moving out of a filesystem.
      expect(tileNames(picker)).toEqual(SITE_IMAGE_NAMES)
      expect(picker.textContent).not.toContain('/assets/')
      expect(picker.textContent).not.toContain('/')

      // The handle is still reachable, as the tooltip and nowhere else: the
      // asset listing walks sub-directories, so two files can share a name and
      // hovering has to settle which is which.
      expect(tiles(modal).map((t) => (t as HTMLElement).title)).toEqual(SITE_IMAGES)

      // And it is still what a pick COMMITS. The label is a projection; the
      // value is the vocabulary the write side validates.
      expect(
        [...picker.querySelectorAll<HTMLInputElement>('.builder-modal__tile-input')].map(
          (i) => i.value,
        ),
      ).toEqual(SITE_IMAGES)
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_the_dropdown_of_paths_is_gone_rather_than_offered_alongside',
    async () => {
      // Two ways to answer the same question is the failure mode this replaces —
      // not a fallback worth keeping. The alt field's control is still the
      // component's, so this is measuring the picker's replacement of the
      // `<select>`, not the form's removal.
      const modal = await openAt(AN_IMAGE)
      expect(modal.querySelector('select')).toBeNull()
      expect(modal.querySelector('.builder-modal__picker')).not.toBeNull()
      expect(modal.querySelector('.builder-modal__form')).not.toBeNull()
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_the_thumbnail_loads_the_bytes_the_origin_actually_serves',
    async () => {
      const modal = await openAt(AN_IMAGE)
      const img = tiles(modal)
        .find((t) => (t as HTMLElement).title === HERO)!
        .querySelector('img')!

      // jsdom fetches nothing, so what is verifiable here is the claim that
      // could actually be wrong: that the URL a tile carries names bytes this
      // origin serves. Resolved and fetched exactly as the browser would.
      const res = await fetch(new URL(img.getAttribute('src')!, builder.url))
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(ASSET_FILES['hero.png'])
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_the_image_the_segment_holds_is_the_selected_tile',
    async () => {
      const modal = await openAt(AN_IMAGE)

      // Exactly one tile checked, and it is the node's own handle. A picker that
      // opened on the wrong tile would change the image behind the user's back
      // the moment they saved an alt-text edit.
      expect(checkedTile(modal)!.value).toBe(HERO)
      expect(modal.querySelectorAll('.builder-modal__tile-input:checked')).toHaveLength(1)
      const marked = tiles(modal).filter((t) => t.classList.contains('is-selected'))
      expect(marked.map((t) => (t as HTMLElement).title)).toEqual([HERO])
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_picking_a_tile_and_saving_writes_that_handle_and_nothing_else',
    async () => {
      const modal = await openAt(AN_IMAGE)
      const beta = [...modal.querySelectorAll<HTMLInputElement>('.builder-modal__tile-input')].find(
        (i) => i.value === BETA,
      )!
      beta.checked = true
      beta.dispatchEvent(new window.Event('change', { bubbles: true }))

      // Picking STAGES, it does not commit: Save is still the single flush point.
      expect(net.calls.filter((c) => c.method === 'POST')).toEqual([])
      await save(modal)

      // Exactly one diff for the whole dialog.
      const posts = net.calls.filter((c) => c.method === 'POST')
      expect(posts).toHaveLength(1)
      expect(new URL(posts[0].url).pathname).toBe('/api/copy')

      const values = await nodeAt(AN_IMAGE)
      expect(values.src).toBe(BETA)
      // The alt text was not touched, and neither was the axis beside it.
      expect(values.alt).toBe(ALT)
      const node = JSON.parse(
        fs.readFileSync(draftPath(cwd, 'acme', 'pages', `${pageId}.json`), 'utf8'),
      ).l1.root.children[0]
      expect(node.axes).toEqual({ objectFit: 'cover' })
      expect(node.id).toBe('hero-img')

      // Put it back, so the ordering of the suite's cases cannot matter.
      await cli(cwd, 'copy', 'set', 'acme', pageId, AN_IMAGE, '--values', JSON.stringify({ src: HERO }))
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_a_new_image_and_new_alt_text_travel_in_one_save',
    async () => {
      // The picker is a second control in the same dialog, and the rule the
      // dialog was built around is one modal, one diff (DOC-28 §11). Two
      // controls must not become two writes and two re-renders.
      const modal = await openAt(AN_IMAGE)
      const logo = [...modal.querySelectorAll<HTMLInputElement>('.builder-modal__tile-input')].find(
        (i) => i.value === LOGO,
      )!
      logo.checked = true
      logo.dispatchEvent(new window.Event('change', { bubbles: true }))

      const cell = modal.querySelector('.fields-value-editable') as HTMLElement
      cell.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      // The component's own control, reached by its own class — a bare
      // `input` selector would find the picker's first radio, since the grid
      // sits above the form.
      const control = modal.querySelector('.fields-control') as HTMLInputElement
      control.value = 'A logo instead'
      control.dispatchEvent(new window.Event('input', { bubbles: true }))
      control.dispatchEvent(new window.Event('change', { bubbles: true }))
      control.dispatchEvent(new window.FocusEvent('blur'))

      await save(modal)

      expect(net.calls.filter((c) => c.method === 'POST')).toHaveLength(1)
      const values = await nodeAt(AN_IMAGE)
      expect(values.src).toBe(LOGO)
      expect(values.alt).toBe('A logo instead')

      await cli(
        cwd,
        'copy',
        'set',
        'acme',
        pageId,
        AN_IMAGE,
        '--values',
        JSON.stringify({ src: HERO, alt: ALT }),
      )
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_opening_the_picker_and_saving_untouched_sends_nothing',
    async () => {
      // A dialog opened and thought better of is not an edit. The picker joined
      // the dirty check rather than replacing it, so this still holds now that a
      // modal can be all picker and no form.
      const modal = await openAt(A_BACKDROP)
      await save(modal)
      expect(net.calls.filter((c) => c.method === 'POST')).toEqual([])
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_a_painted_container_picks_its_background_from_the_same_thumbnails',
    async () => {
      const modal = await openAt(A_BACKDROP)

      // The same tiles, from the same listing — what a panel can sit in front of
      // and what it can sit behind are one question asked twice.
      expect(tileNames(modal)).toEqual(SITE_IMAGE_NAMES)
      expect(checkedTile(modal)!.value).toBe(BETA)
      // Nothing on this segment is text, so there is no editing box to draw.
      expect(modal.querySelector('.builder-modal__box')).toBeNull()

      const hero = [...modal.querySelectorAll<HTMLInputElement>('.builder-modal__tile-input')].find(
        (i) => i.value === HERO,
      )!
      hero.checked = true
      hero.dispatchEvent(new window.Event('change', { bubbles: true }))
      await save(modal)

      const values = await nodeAt(A_BACKDROP)
      expect(values.backgroundImageUrl).toBe(HERO)
      // The rest of the paint is untouched — a background swap is a background swap.
      const node = JSON.parse(
        fs.readFileSync(draftPath(cwd, 'acme', 'pages', `${pageId}.json`), 'utf8'),
      ).l1.root.children[1]
      expect(node.axes.surfaceFill).toBe('#101822')

      await cli(
        cwd,
        'copy',
        'set',
        'acme',
        pageId,
        A_BACKDROP,
        '--values',
        JSON.stringify({ backgroundImageUrl: BETA }),
      )
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_a_handle_the_origin_cannot_serve_still_offers_a_named_selectable_tile',
    async () => {
      const modal = await openAt(AN_OFFSITE_IMAGE)

      // The node's own handle is always offered, and this one names bytes that
      // are on no disk here. It is the selected tile, so the segment can keep
      // the image it has.
      const offsite = tiles(modal).find((t) => (t as HTMLElement).title === REMOTE)!
      expect(offsite.querySelector('.builder-modal__tile-name')!.textContent).toBe('offsite.jpg')
      expect(checkedTile(modal)!.value).toBe(REMOTE)
      // Pointed at itself, not rewritten into a local path that resolves to
      // nothing.
      expect(offsite.querySelector('img')!.getAttribute('src')).toBe(REMOTE)

      // What the browser does when those bytes do not arrive. The tile must not
      // go with the picture: it is the only way to keep this image.
      const img = offsite.querySelector('img')!
      img.dispatchEvent(new window.Event('error'))
      expect(offsite.querySelector('.builder-modal__tile-thumb')!.classList).toContain('is-missing')
      expect(offsite.querySelector('.builder-modal__tile-name')!.textContent).toBe('offsite.jpg')
      expect(offsite.querySelector<HTMLInputElement>('.builder-modal__tile-input')!.checked).toBe(
        true,
      )
    },
  )

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_FC_REQ-132_the_grid_is_reachable_and_announced_without_a_mouse',
    async () => {
      const modal = await openAt(AN_IMAGE)
      const picker = modal.querySelector('.builder-modal__picker')!

      // Radios, so the browser supplies arrow-key navigation and the
      // single-selection invariant rather than this reimplementing them.
      expect(picker.getAttribute('role')).toBe('radiogroup')
      expect(picker.getAttribute('aria-label')).toBe('Image')
      for (const input of picker.querySelectorAll<HTMLInputElement>('input')) {
        expect(input.type).toBe('radio')
      }
      // One group, not one per tile: two names would let two tiles be checked.
      const names = new Set(
        [...picker.querySelectorAll<HTMLInputElement>('input')].map((i) => i.name),
      )
      expect(names.size).toBe(1)

      // The dialog opened because the operator clicked a picture, so the grid —
      // not the alt field — is where the keyboard lands.
      expect(document.activeElement).toBe(checkedTile(modal))
    },
  )
})
