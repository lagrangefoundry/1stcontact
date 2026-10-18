// @vitest-environment jsdom
/**
 * REQ-404 — **Edit mode on the Site tab: a click on the selected picture opens
 * the photo editor for that use**: the surface half.
 *
 * THE CLAIMS, in the ticket's order:
 *
 *  1. THE FIRST CLICK SELECTS. Today's selection panel opens, unchanged — the
 *     image chooser and the alt text — and the picture is marked selected.
 *  2. A CLICK ON THE SELECTED PICTURE OPENS THE PHOTO EDITOR — `image-editor.js`,
 *     the Library's and the chat's — with a banner naming the item and saying
 *     the original is unchanged, and no Library name field.
 *  3. A CHANGE IS SAVED THE MOMENT IT IS APPLIED, to that use's own recipe and
 *     never the item's, and the page re-renders.
 *  4. THE SELECTION OUTLIVES THE RE-RENDER, so the click after a save is still a
 *     click on the selected picture.
 *  5. A PICTURE WITH NO LIBRARY ITEM SAYS SO on the second click, and the fault
 *     is logged naming the asset — rather than nothing happening.
 *
 * MOUNTED AGAINST THE REAL BRIDGE AND THE REAL COMPONENTS — `edit-client.ts`'s
 * `mountL1EditBridge`, `editor.js`'s dialog over the installed `mountFields`,
 * and the real photo editor. The only doubles are the HTTP calls, because they
 * are the network.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountL1EditBridge, resolveEditTarget } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
} from '../packages/site-schema/src/l1/edit'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

if (!WEBUI_INSTALLED) console.warn(`REQ-404 Site-tab picture suite skipped: ${WEBUI_SKIP_REASON}`)

type Mounted = { destroy: () => void }
let mountEditor: (doc: Document, options: Record<string, unknown>) => Mounted
let NOT_IN_LIBRARY: string

const BRIDGE = { mountL1EditBridge, resolveEditTarget, formatL1Path, L1_EDIT_PAGE_ATTR }
const SITE = 'site-req404'
const PICTURE = {
  uid: 'material-chair',
  label: 'IMAGE-1',
  title: 'A salon chair',
  filename: 'chair.png',
  asset: 'chair.png',
  edits: [],
  own: false,
  editable: true,
}

/** What the origin was asked, and what it answers. */
function origin(opts: { missing?: boolean } = {}) {
  const calls: Array<{ path: string; method: string; body: unknown }> = []
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'https://builder.test')
    const method = init?.method ?? 'GET'
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    calls.push({ path: url.pathname, method, body })
    const reply = (status: number, value: unknown) =>
      new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
    if (url.pathname === '/api/copy' && method === 'GET') {
      return reply(200, {
        kind: 'image',
        fields: [
          { name: 'src', type: 'string', format: 'image', enum: ['/assets/chair.png'], label: 'Image' },
          { name: 'alt', type: 'string', label: 'Alt text' },
        ],
        values: { src: '/assets/chair.png', alt: 'A salon chair' },
      })
    }
    if (url.pathname === '/api/site/picture' && method === 'GET') {
      if (opts.missing) {
        return reply(404, {
          error: `The picture 'chair.png' on site '${SITE}' has no Library item behind it.`,
          code: 'NOT_IN_LIBRARY',
          asset: 'chair.png',
        })
      }
      return reply(200, PICTURE)
    }
    if (url.pathname === '/api/site/picture/recipe' && method === 'POST') {
      return reply(200, { ...PICTURE, edits: (body as { recipe: unknown[] }).recipe, own: true, rendered: true })
    }
    return reply(404, { error: `unexpected ${method} ${url.pathname}` })
  }
  return { calls, fetchImpl }
}

/** An edit render: one picture and one run of copy, stamped as the renderer stamps. */
function editRender(): { doc: Document; picture: HTMLElement; copy: HTMLElement } {
  const doc = document.implementation.createHTMLDocument('page')
  doc.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
  doc.body.setAttribute(L1_EDIT_PAGE_ATTR, 'home')
  const picture = doc.createElement('img')
  picture.setAttribute(L1_EDIT_PATH_ATTR, '0.0')
  picture.setAttribute(L1_EDIT_SEGMENT_ATTR, 'image')
  const copy = doc.createElement('p')
  copy.textContent = 'Welcome in.'
  copy.setAttribute(L1_EDIT_PATH_ATTR, '0.1')
  copy.setAttribute(L1_EDIT_SEGMENT_ATTR, 'copy')
  doc.body.append(picture, copy)
  return { doc, picture, copy }
}

const click = (el: Element) => el.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }))

async function until<T>(read: () => T | null | undefined, what: string): Promise<T> {
  for (let i = 0; i < 100; i++) {
    const value = read()
    if (value) return value
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error(`timed out waiting for ${what}`)
}

const photoEditor = () => document.querySelector('.builder-modal__imaged')
const dialogs = () => [...document.querySelectorAll('.builder-modal')]
const closeAll = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountEditor, NOT_IN_LIBRARY } = await import('../apps/control-app/src/builder/editor.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

let restore: (() => void) | null = null
function serve(fetchImpl: typeof fetch) {
  const real = globalThis.fetch
  globalThis.fetch = fetchImpl as typeof fetch
  restore = () => {
    globalThis.fetch = real
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  closeAll()
  restore?.()
  restore = null
  vi.restoreAllMocks()
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-404 — the second click opens the photo editor', () => {
  it('test_UAT_FC_REQ-404_first_click_opens_the_panel_and_a_click_on_the_selected_picture_opens_the_editor', async () => {
    const server = origin()
    serve(server.fetchImpl as typeof fetch)
    const page = editRender()
    mountEditor(page.doc, { site: SITE, bridge: BRIDGE })

    click(page.picture)
    // The selection panel, unchanged: the image chooser is in it.
    await until(() => document.querySelector('.builder-modal input[type="radio"]'), 'the selection panel')
    expect(photoEditor()).toBeNull()
    expect(page.picture.hasAttribute('data-builder-selected')).toBe(true)
    closeAll()
    expect(dialogs()).toHaveLength(0)

    click(page.picture)
    const editor = await until(photoEditor, 'the photo editor')

    // The banner names the item and says the original is unchanged.
    expect(editor.textContent).toContain('Editing this use of IMAGE-1 — the Library original is unchanged.')
    // No Library name field: this is not where the item's name is changed.
    expect(editor.querySelector('.builder-imaged__name')).toBeNull()
    expect(server.calls.some((c) => c.path === '/api/site/picture')).toBe(true)
  })

  it('test_UAT_FC_REQ-404_an_applied_change_saves_that_use_at_once_and_re_renders_the_page', async () => {
    const server = origin()
    serve(server.fetchImpl as typeof fetch)
    const page = editRender()
    const saved: unknown[] = []
    mountEditor(page.doc, { site: SITE, bridge: BRIDGE, onSaved: (r: unknown) => saved.push(r) })
    click(page.picture)
    await until(() => dialogs().length > 0, 'the selection panel')
    closeAll()
    click(page.picture)
    const editor = await until(photoEditor, 'the photo editor')

    const turn = [...editor.querySelectorAll('button')].find((b) => b.textContent === 'Turn right')!
    turn.click()
    await until(() => saved.length > 0, 'the save')

    const writes = server.calls.filter((c) => c.method === 'POST')
    expect(writes).toEqual([
      {
        path: '/api/site/picture/recipe',
        method: 'POST',
        body: { site: SITE, name: 'chair.png', recipe: [{ op: 'rotate', degrees: 90 }] },
      },
    ])
    // Never the Library item's own recipe.
    expect(server.calls.some((c) => c.path === '/api/material/recipe')).toBe(false)
  })

  it('test_UAT_FC_REQ-404_the_selection_outlives_the_re_render', async () => {
    const server = origin()
    serve(server.fetchImpl as typeof fetch)
    const selection = { key: null }
    const first = editRender()
    const mounted = mountEditor(first.doc, { site: SITE, bridge: BRIDGE, selection })
    click(first.picture)
    await until(() => dialogs().length > 0, 'the selection panel')
    closeAll()
    mounted.destroy()

    // The frame reloads: a new document, a new mount, the same selection.
    const second = editRender()
    mountEditor(second.doc, { site: SITE, bridge: BRIDGE, selection })
    expect(second.picture.hasAttribute('data-builder-selected')).toBe(true)
    click(second.picture)

    await until(photoEditor, 'the photo editor')
  })

  it('test_UAT_FC_REQ-404_clicking_something_else_clears_the_selection', async () => {
    const server = origin()
    serve(server.fetchImpl as typeof fetch)
    const page = editRender()
    mountEditor(page.doc, { site: SITE, bridge: BRIDGE })
    click(page.picture)
    await until(() => dialogs().length > 0, 'the selection panel')
    closeAll()
    click(page.copy)
    await until(() => dialogs().length > 0, 'the copy panel')
    closeAll()
    expect(page.picture.hasAttribute('data-builder-selected')).toBe(false)

    click(page.picture)
    await until(() => document.querySelector('.builder-modal input[type="radio"]'), 'the selection panel')
    expect(photoEditor()).toBeNull()
  })

  it('test_UAT_FC_REQ-404_a_picture_with_no_library_item_says_so_on_the_second_click', async () => {
    const server = origin({ missing: true })
    serve(server.fetchImpl as typeof fetch)
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const page = editRender()
    mountEditor(page.doc, { site: SITE, bridge: BRIDGE })
    click(page.picture)
    await until(() => dialogs().length > 0, 'the selection panel')
    closeAll()

    click(page.picture)
    const said = await until(
      () => dialogs().find((d) => d.textContent?.includes(NOT_IN_LIBRARY)),
      'the not-in-Library message',
    )

    expect(NOT_IN_LIBRARY).toBe("This picture isn't in your Library — please tell us.")
    expect(said).toBeTruthy()
    expect(photoEditor()).toBeNull()
    expect(logged.mock.calls.some((args) => String(args[0]).includes("'chair.png'"))).toBe(true)
  })
})
