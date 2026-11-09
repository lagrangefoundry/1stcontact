// @vitest-environment jsdom
/**
 * Library (story-1500b111) — the image modal, the Library name and the picture
 * editing tools, the SURFACE half, as reconciled in BUNDLE-43 (REQ-220).
 *
 * WHAT THIS FILE PROVES, one UAT per acceptance criterion:
 *
 *  - AC-1718  the name, the description and (uploads only) the role are the
 *             editable fields; undescribed material says so; a committed
 *             correction is stored and shown rendered.
 *  - AC-2553  an editable picture in the detail pane is a labelled button that
 *             opens the image modal, holding the recorded edits, one at a time,
 *             closed when the row changes.
 *  - AC-2554  clicking the same picture in the chat opens the same modal —
 *             including for the business-scoped address the builder forms.
 *  - AC-2555  only raster image material is offered the editor.
 *  - AC-2556  the Library name is one field in the pane and the modal.
 *  - AC-2557  crop, rotate, resize and adjust each commit one operation and the
 *             modal re-fetches the picture; no request carries bytes.
 *  - AC-2558  undo and redo span the sitting and save every step.
 *  - AC-2559  a refused commit removes only that step and shows the origin's
 *             sentence; an unrendered save says what is on screen.
 *
 * The route half (what the origin stores and refuses) is
 * `reconciliation-library-image-modal.workers.test.ts`.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED webui COMPONENTS, on the pattern every
 * Library suite follows, and SKIPPED with a reason where they are not installed.
 * The only doubles are the network: the panel's `transport`, and for the
 * requests that go through `api.js` a `fetch` double that records what was sent.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { NAME_REQUIRED } from '../apps/control-app/src/builder/material-name.js'
import {
  materialFileUrl,
  saveMaterialRecipe,
  setBusinessScope,
} from '../apps/control-app/src/builder/api.js'

type Row = Record<string, unknown>
type Panel = {
  element: HTMLElement
  listDetail: { select: (uid: string) => void }
  refresh: () => Promise<unknown>
  getRows: () => Row[]
}

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let createChatPanel: (opts?: Record<string, unknown>) => { element: HTMLElement; setSession: (s: unknown) => void }
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>
let mountImageEditor: (spec: Record<string, unknown>) => { element: HTMLElement; close: () => void }
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`Library image-modal suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const settleAll = async () => {
  for (let i = 0; i < 6; i++) await settle()
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

function material(over: Row): Row {
  return {
    type: 'material',
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    content_type: 'image/png',
    edits: [],
    updated_at: '2026-11-09T12:00:00.000Z',
    ...over,
  }
}

const PRIOR_CROP = { op: 'crop', left: 0.1, top: 0, right: 0.1, bottom: 0 }

/** Every kind the predicate has to answer for, plus the cases the name and description need. */
function fixtures(): Row[] {
  return [
    material({
      uid: 'made-one',
      title: 'a warm photograph of a corner bakery at golden hour with bread in the window',
      filename: 'generated-3f2a.png',
      origin: 'generated',
    }),
    material({
      uid: 'cropped',
      title: 'The shopfront',
      filename: 'shopfront.jpg',
      content_type: 'IMAGE/JPEG; quality=high',
      edits: [PRIOR_CROP],
    }),
    material({
      uid: 'a-drawing',
      title: 'A mark the assistant drew',
      filename: 'mark.svg',
      content_type: 'Image/SVG+XML; charset=utf-8',
    }),
    material({
      uid: 'their-old-site',
      type: 'reference',
      title: 'Their old site',
      kind: 'capture',
      origin: 'captured',
      role: 'reference',
      republishable: false,
      content_type: 'application/json',
      source_url: 'https://theirs.example/',
    }),
    material({
      uid: 'brand-pdf',
      title: 'Brand book',
      filename: 'brand.pdf',
      kind: 'document',
      role: 'reference',
      republishable: false,
      content_type: 'application/pdf',
    }),
    material({ uid: 'a-font', title: 'Plex Sans', filename: 'plex.woff2', kind: 'font', content_type: 'font/woff2' }),
    material({
      uid: 'fetched',
      title: 'An industry report',
      filename: 'report.txt',
      kind: 'document',
      content_type: 'text/plain',
      role: 'reference',
      rights: 'third_party',
      republishable: false,
      origin: 'fetched',
      source_url: 'https://example.com/report.txt',
    }),
    material({ uid: 'undescribed', title: 'The awning', filename: 'awning.jpg', description_status: 'no_describer' }),
  ]
}

const MARKDOWN = '## The wordmark\n\nGold on **cream**, set _tight_.'

type Change = Record<string, unknown>

/** The panel's network, recorded. Writes answer the stored row, as the origin does. */
function transportOver(rows: Row[] = fixtures()) {
  const find = (uid: string) => rows.find((r) => r.uid === uid)!
  const bodies: Record<string, string> = { undescribed: '' }
  const feeds: Array<(c: Change) => void> = []
  const t = {
    rows,
    names: [] as Array<{ uid: string; title: string }>,
    recipes: [] as Array<{ uid: string; recipe: unknown[] }>,
    saved: [] as Array<{ uid: string; body: string }>,
    reads: [] as string[],
    feeds,
    failSave: false,
    rendered: true,
    list: async () => ({ material: rows.map((row) => ({ ...row })), seq: 10 }),
    item: async (uid: string) => {
      t.reads.push(uid)
      return { ...find(uid), body: uid in bodies ? bodies[uid] : MARKDOWN, members: [] }
    },
    save: async (uid: string, body: string) => {
      t.saved.push({ uid, body })
      if (t.failSave) throw new Error('the store refused the write')
      bodies[uid] = body
      return { ...find(uid), description_status: 'ok', body }
    },
    setRole: async (uid: string, role: string) => ({ ...find(uid), role }),
    setName: async (uid: string, title: string) => {
      t.names.push({ uid, title })
      Object.assign(find(uid), { title })
      return { ...find(uid) }
    },
    setRecipe: async (uid: string, recipe: unknown[]): Promise<unknown> => {
      t.recipes.push({ uid, recipe })
      Object.assign(find(uid), { edits: recipe })
      return { ...find(uid), rendered: t.rendered }
    },
    fileUrl: (uid: string, member?: string) =>
      `/api/material/file?uid=${encodeURIComponent(uid)}${member ? `&member=${encodeURIComponent(member)}` : ''}`,
    subscribe: (_since: number, onChange: (c: Change) => void) => {
      feeds.push(onChange)
      return { close: () => {} }
    },
  }
  return t
}

type Transport = ReturnType<typeof transportOver>

/** A minimal markdown engine (marked is a CDN import that cannot run here) and a pass-through scrubber. */
function installEngines() {
  const inline = (md: string) =>
    md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>')
  setParser({
    parse: (md: string) =>
      md
        .trim()
        .split(/\n{2,}/)
        .map((block) => {
          if (block.startsWith('## ')) return `<h2>${inline(block.slice(3))}</h2>`
          return `<p>${inline(block).replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')}</p>`
        })
        .join(''),
    parseInline: inline,
  })
  setSanitizer((html: string) => html)
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ mountImageEditor } = await import('../apps/control-app/src/builder/image-editor.js'))
    ;({ setSanitizer, setParser } = await import('../apps/control-app/src/builder/markdown.js'))
  }
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
})

let root: HTMLElement
const realFetch = globalThis.fetch
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})
afterEach(() => {
  globalThis.fetch = realFetch
  setBusinessScope(null)
  if (WEBUI_INSTALLED) {
    setSanitizer(null)
    setParser(null)
  }
})

async function library(transport: Transport = transportOver()) {
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
    markdownReady: Promise.resolve(),
    getModalHost: () => root,
  }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  await settle()
  return { panel, transport }
}

async function open(panel: Panel, uid: string) {
  panel.listDetail.select(uid)
  await settleAll()
  return panel.element.querySelector('.list-detail-detail-body')!
}

const dialogs = () => document.querySelectorAll('.builder-modal')
const opener = (scope: Element) => scope.querySelector('.builder-library__open-image') as HTMLButtonElement | null
const listTitle = (panel: Panel, uid: string) =>
  panel.element.querySelector(`.list-detail-row[data-key="${uid}"] .builder-library__row-title`)!.textContent
const editableFields = (scope: Element) =>
  [...scope.querySelectorAll('.fields-row.is-editable')].map((r) => r.getAttribute('data-field'))

/** The modal's own control, found by the words on it. */
function tool(box: Element, label: string): HTMLButtonElement {
  const found = [...box.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === label)
  expect(found, `no "${label}" control`).toBeTruthy()
  return found as HTMLButtonElement
}

/** Open a `mountFields` cell the way a client does: click it. */
function openNameEditor(host: Element): HTMLInputElement {
  ;(host.querySelector('.fields-value-editable') as HTMLElement).click()
  return host.querySelector('input') as HTMLInputElement
}

async function commitName(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.blur()
  await settleAll()
}

/** The editor on its own, with the stage's size TOLD rather than measured (jsdom does no layout). */
function editorOver(transport: { saveName: unknown; saveRecipe: unknown }, over: Row = {}) {
  mountImageEditor({
    uid: 'made-one',
    href: '/api/material/file?uid=made-one',
    name: 'The bakery',
    natural: { width: 1000, height: 500 },
    host: root,
    measure: () => ({ width: 1000, height: 500 }),
    transport,
    ...over,
  })
  return document.querySelector('.builder-modal__imaged')!
}

/** A `fetch` double that records every request and answers by path. */
function recordingFetch(answer: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: Array<{ url: string; method: string; body: unknown }> = []
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body })
    return answer(url, init)
  }) as typeof fetch
  return { calls, fetchImpl }
}

const ok = (payload: unknown) =>
  new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } })

// ── AC-1718 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-1718 — the name, the description and an upload\'s role are the editable fields', () => {
  it('test_UAT_AC1718_name_description_and_upload_role_are_the_editable_fields_and_a_correction_is_stored', async () => {
    installEngines()
    const { panel, transport } = await library()

    // UNDESCRIBED material says so, rather than an empty box with no explanation.
    const blank = await open(panel, 'undescribed')
    expect(blank.querySelector('.builder-library__status')!.textContent).toMatch(/Nothing has read this yet/i)

    // EXACTLY THREE editable fields on an upload: the name, the description, the role…
    expect(editableFields(blank).sort()).toEqual(['body', 'role', 'title'])
    // …and nothing in the rights record other than the role.
    expect(editableFields(blank.querySelector('.builder-library__rights')!)).toEqual(['role'])

    // EXACTLY TWO on fetched or captured material: the name and the description.
    for (const uid of ['fetched', 'their-old-site']) {
      const detail = await open(panel, uid)
      expect(editableFields(detail).sort(), uid).toEqual(['body', 'title'])
      expect(editableFields(detail.querySelector('.builder-library__rights')!), uid).toEqual([])
    }

    // SHOWN RENDERED, not as the markers that produce it.
    const detail = await open(panel, 'made-one')
    const cell = () =>
      detail.querySelector('.builder-library__description .fields-row[data-field="body"] > .fields-value')!
    expect(cell().querySelector('h2')?.textContent).toBe('The wordmark')
    expect(cell().querySelector('strong')?.textContent).toBe('cream')
    expect(cell().textContent).not.toContain('**')

    // EDITED AS SOURCE.
    ;(cell() as HTMLElement).click()
    const control = detail.querySelector('.builder-library__description textarea') as HTMLTextAreaElement
    expect(control.value).toBe(MARKDOWN)

    // COMMITTED BY LEAVING THE FIELD: stored, shown rendered again, reflected in the row.
    control.value = 'The bakery, **corrected**.'
    control.dispatchEvent(new Event('blur'))
    await settleAll()
    expect(transport.saved).toEqual([{ uid: 'made-one', body: 'The bakery, **corrected**.' }])
    expect(cell().querySelector('strong')?.textContent).toBe('corrected')
    expect(panel.getRows().find((r) => r.uid === 'made-one')!.body).toBe('The bakery, **corrected**.')

    // A FAILED WRITE reverts the control to the stored text.
    transport.failSave = true
    ;(cell() as HTMLElement).click()
    const again = detail.querySelector('.builder-library__description textarea') as HTMLTextAreaElement
    again.value = 'This will not land.'
    again.dispatchEvent(new Event('blur'))
    await settleAll()
    expect(cell().textContent).not.toContain('This will not land.')
    expect(cell().querySelector('strong')?.textContent).toBe('corrected')
  })
})

// ── AC-2553 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2553 — the picture in the pane opens the image modal', () => {
  it('test_UAT_AC2553_editable_picture_is_a_labelled_button_opening_one_modal_on_the_picture_as_it_stands', async () => {
    const { panel, transport } = await library()
    const detail = await open(panel, 'cropped')

    // A REAL, LABELLED BUTTON around the picture, so the editor is keyboard-reachable.
    const button = opener(detail)!
    expect(button).toBeTruthy()
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('aria-label')).toMatch(/open this picture/i)
    expect(button.tabIndex).toBeGreaterThanOrEqual(0)
    expect(button.querySelector('img.builder-library__image')).toBeTruthy()

    expect(dialogs()).toHaveLength(0)
    button.click()
    await settleAll()

    // THE WORKSPACE'S DIALOG SHELL.
    expect(dialogs()).toHaveLength(1)
    const dialog = dialogs()[0]
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const box = dialog.querySelector('.builder-modal__imaged')!

    // IN ORDER: the name, the picture, the tools, Undo/Redo — then Close.
    const name = box.querySelector('.builder-imaged__name')!
    const stage = box.querySelector('.builder-imaged__stage')!
    const tools = box.querySelector('.builder-imaged__tools')!
    const history = box.querySelector('.builder-imaged__history')!
    const follows = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    expect(follows(name, stage)).toBe(true)
    expect(follows(stage, tools)).toBe(true)
    expect(follows(tools, history)).toBe(true)
    expect(name.querySelector('.fields-row[data-field="title"].is-editable')).toBeTruthy()
    expect(name.textContent).toContain('The shopfront')
    for (const label of ['Crop', 'Turn left', 'Turn right', 'Resize']) tool(tools, label)
    for (const axis of ['brightness', 'contrast', 'saturation']) {
      expect(tools.querySelector(`input[type="range"][data-adjust="${axis}"]`), axis).toBeTruthy()
    }
    tool(history, 'Undo')
    tool(history, 'Redo')
    const close = tool(dialog, 'Close')
    expect(follows(history, close)).toBe(true)

    // THE PICTURE AS IT CURRENTLY STANDS: the material's own file address, which
    // the origin serves with the recorded edits applied.
    const shown = stage.querySelector('img.builder-imaged__image') as HTMLImageElement
    expect(shown.getAttribute('src')).toBe(transport.fileUrl('cropped'))

    // OPENED HOLDING THE RECORDED EDITS: the first commit adds to them.
    tool(tools, 'Turn right').click()
    await settleAll()
    expect(transport.recipes).toEqual([{ uid: 'cropped', recipe: [PRIOR_CROP, { op: 'rotate', degrees: 90 }] }])

    // A SECOND ACTIVATION while open does not open a second dialog.
    button.click()
    await settleAll()
    expect(dialogs()).toHaveLength(1)

    // ESCAPE closes it, as the shell does.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await settleAll()
    expect(dialogs()).toHaveLength(0)

    // SELECTING ANOTHER ROW closes an open modal.
    const again = await open(panel, 'made-one')
    opener(again)!.click()
    await settleAll()
    expect(dialogs()).toHaveLength(1)
    await open(panel, 'brand-pdf')
    expect(dialogs()).toHaveLength(0)
  })
})

// ── AC-2554 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2554 — the picture in the chat opens the same modal', () => {
  it('test_UAT_AC2554_chat_picture_opens_the_same_modal_for_scoped_and_unscoped_material_addresses', async () => {
    installEngines()

    // THE ORIGIN, behind `fetch` — the only double. It answers the item read and
    // the two writes the modal makes, and records what it was asked.
    const ITEMS: Record<string, Row> = {
      'made-one': material({
        uid: 'made-one',
        title: 'The bakery',
        filename: 'bakery.png',
        edits: [{ op: 'rotate', degrees: 180 }],
      }),
      'a-drawing': material({ uid: 'a-drawing', title: 'A mark', filename: 'mark.svg', content_type: 'image/svg+xml' }),
    }
    const { calls, fetchImpl } = recordingFetch(async (url, init) => {
      const path = new URL(url, 'http://local.invalid/').pathname
      const uid = new URL(url, 'http://local.invalid/').searchParams.get('uid') ?? ''
      if (path.endsWith('/api/material/item')) {
        return ITEMS[uid] ? ok({ ...ITEMS[uid], body: 'About it.', members: [] }) : new Response('{}', { status: 500 })
      }
      if (path.endsWith('/api/material/recipe')) {
        const sent = JSON.parse(String(init?.body))
        return ok({ ...ITEMS[sent.uid], edits: sent.recipe, rendered: true })
      }
      return new Response('{}', { status: 404 })
    })
    globalThis.fetch = fetchImpl

    const BUSINESS = 'biz_foundry'
    // The address the builder forms for this material while BUSINESS is selected.
    const scopedAddress = `/b/${BUSINESS}/api/material/file?uid=made-one`
    const unscopedAddress = `/api/material/file?uid=made-one`
    const PICTURES = {
      external: 'https://example.com/photo.jpg',
      member: `/api/material/file?uid=their-old-site&member=screenshot.full.png`,
      drawing: `/api/material/file?uid=a-drawing`,
      unreadable: `/api/material/file?uid=gone`,
      unscoped: unscopedAddress,
      scoped: scopedAddress,
    }
    const turns = [
      {
        role: 'assistant',
        markdown: Object.entries(PICTURES)
          .map(([alt, src]) => `![${alt}](${src})`)
          .join(' '),
      },
    ]
    const app = mountBuilder(root, {
      businesses: [{ id: BUSINESS, name: 'Lagrange Foundry', selectable: true }],
      person: { name: 'Sam', email: 'sam@example.test' },
      storage: memoryStorage(),
      loadSites: async () => [{ slug: 'bakery', latest: null }],
      markdownReady: Promise.resolve(),
      chatTransport: {
        openSession: async () => ({ sessionId: 'site-bakery', turns, ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      libraryTransport: {
        list: async () => ({ material: [], seq: 0 }),
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      },
      paletteTransport: {
        get: async () => ({ palette: {}, usage: {} }),
        write: async () => ({ palette: {}, usage: {} }),
      },
    })

    // THE BUILDER'S OWN ADDRESS, with a business selected — every real session.
    await settleAll()
    expect(app.scope.getBusiness()).toBe(BUSINESS)
    // It is the builder's own address: what `materialFileUrl` forms in this session.
    expect(materialFileUrl('made-one')).toBe(scopedAddress)

    const picture = (alt: string) =>
      app.chat.element.querySelector(`img[alt="${alt}"]`) as HTMLImageElement
    for (const alt of Object.keys(PICTURES)) expect(picture(alt), alt).toBeTruthy()

    async function click(alt: string) {
      picture(alt).click()
      await settleAll()
    }

    // NOTHING OPENS for a picture from elsewhere, a capture's member, a drawing, or
    // a material that cannot be read — and the picture stays where it is.
    for (const alt of ['external', 'member', 'drawing', 'unreadable']) {
      await click(alt)
      expect(dialogs(), alt).toHaveLength(0)
      expect(picture(alt), alt).toBeTruthy()
    }

    // THE UNSCOPED MATERIAL ADDRESS opens the modal — after the item was read.
    const readsBefore = calls.filter((c) => c.url.includes('/api/material/item?uid=made-one')).length
    await click('unscoped')
    expect(calls.filter((c) => c.url.includes('/api/material/item?uid=made-one')).length).toBe(readsBefore + 1)
    expect(dialogs()).toHaveLength(1)
    const box = document.querySelector('.builder-modal__imaged')!
    expect(box.querySelector('.builder-imaged__name')!.textContent).toContain('The bakery')

    // ONE AT A TIME: a second click while open opens nothing more.
    await click('unscoped')
    expect(dialogs()).toHaveLength(1)

    // OPENED ON THE RECORDED EDITS, writing through the same recipe call.
    tool(box, 'Turn right').click()
    await settleAll()
    const recipeCall = calls.filter((c) => c.url.endsWith('/api/material/recipe')).at(-1)!
    expect(recipeCall.method).toBe('POST')
    expect(recipeCall.url).toBe(`/b/${BUSINESS}/api/material/recipe`)
    expect(JSON.parse(String(recipeCall.body))).toEqual({
      uid: 'made-one',
      recipe: [
        { op: 'rotate', degrees: 180 },
        { op: 'rotate', degrees: 90 },
      ],
    })
    tool(document.querySelector('.builder-modal')!, 'Close').click()
    await settleAll()
    expect(dialogs()).toHaveLength(0)

    // THE BUILDER'S OWN SCOPED ADDRESS opens the modal too. (`at a time` means a
    // closed modal does not prevent the next one.)
    await click('scoped')
    expect.soft(dialogs(), 'the builder-formed /b/<business>/ address must open the modal').toHaveLength(1)

    // A CHAT PANE MOUNTED WITHOUT ASKING FOR THIS has no click behaviour at all.
    document.querySelectorAll('.builder-modal').forEach((d) => d.remove())
    const bare = createChatPanel({ transport: { streamPrompt: async () => {} } })
    root.append(bare.element)
    bare.setSession({
      sessionId: 'site-bakery',
      turns: [{ role: 'assistant', markdown: `![bare](${unscopedAddress})` }],
      ready: true,
    })
    await settleAll()
    const fetchesBefore = calls.length
    ;(bare.element.querySelector('img') as HTMLImageElement).click()
    await settleAll()
    expect(calls.length).toBe(fetchesBefore)
    expect(dialogs()).toHaveLength(0)
  })
})

// ── AC-2555 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2555 — only raster image material is offered the editor', () => {
  it('test_UAT_AC2555_only_raster_images_are_offered_the_editor_and_captures_and_drawings_open_nothing', async () => {
    const { panel } = await library()

    // A RASTER IMAGE — whatever the letter case or parameters of its type.
    for (const uid of ['made-one', 'cropped']) {
      const detail = await open(panel, uid)
      expect(opener(detail), uid).toBeTruthy()
    }

    // A CAPTURE AND A DRAWING are drawn as pictures and offered no opening button,
    // and clicking the picture opens nothing.
    for (const uid of ['their-old-site', 'a-drawing']) {
      const detail = await open(panel, uid)
      const img = detail.querySelector('img.builder-library__image') as HTMLImageElement
      expect(img, uid).toBeTruthy()
      expect(opener(detail), uid).toBeNull()
      expect(img.closest('button'), uid).toBeNull()
      img.click()
      await settleAll()
      expect(dialogs(), uid).toHaveLength(0)
    }

    // DOCUMENTS, FONTS, everything else: no opener anywhere in the pane.
    for (const uid of ['brand-pdf', 'a-font', 'fetched']) {
      const detail = await open(panel, uid)
      expect(opener(detail), uid).toBeNull()
      expect(detail.querySelector('.builder-library__image'), uid).toBeNull()
    }
  })
})

// ── AC-2556 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2556 — the Library name is one field in two places', () => {
  it('test_UAT_AC2556_library_name_is_one_field_in_pane_and_modal_committed_as_the_title_and_kept', async () => {
    const { panel, transport } = await library()
    const detail = await open(panel, 'made-one')

    // IN THE PANE: its own block, below the preview, above the description, not in the rights record.
    const paneName = detail.querySelector('.builder-library__name')!
    expect(paneName.querySelector('.fields-row[data-field="title"].is-editable')).toBeTruthy()
    // Labelled for what it is for (in the markup, whether drawn or as its accessible name).
    expect(paneName.innerHTML).toContain('Name in your Library')
    const preview = detail.querySelector('.builder-library__preview')!
    const description = detail.querySelector('.builder-library__description')!
    expect(preview.compareDocumentPosition(paneName) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(paneName.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(detail.querySelector('.builder-library__rights .fields-row[data-field="title"]')).toBeNull()

    // RENAMED IN THE PANE: one call, the title — the filename is not touched.
    await commitName(openNameEditor(paneName), 'The bakery, golden hour')
    expect(transport.names).toEqual([{ uid: 'made-one', title: 'The bakery, golden hour' }])
    expect(listTitle(panel, 'made-one')).toBe('The bakery, golden hour')
    const download = detail.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(download.getAttribute('download')).toBe('generated-3f2a.png')
    expect(detail.querySelector('.builder-library__rights .fields-row[data-field="filename"]')!.textContent).toContain(
      'generated-3f2a.png',
    )
    expect((detail.querySelector('img.builder-library__image') as HTMLImageElement).alt).toBe('The bakery, golden hour')

    // THE MODAL SHOWS THE SAME NAME; renamed there, the pane, the row, the dialog's
    // accessible name and both pictures' alt text follow from the one answer.
    opener(detail)!.click()
    await settleAll()
    const modalName = document.querySelector('.builder-imaged__name')!
    expect(modalName.textContent).toContain('The bakery, golden hour')
    await commitName(openNameEditor(modalName), 'Golden hour')
    expect(transport.names.at(-1)).toEqual({ uid: 'made-one', title: 'Golden hour' })
    expect(paneName.textContent).toContain('Golden hour')
    expect(listTitle(panel, 'made-one')).toBe('Golden hour')
    expect(document.querySelector('.builder-modal')!.getAttribute('aria-label')).toBe('Golden hour')
    expect((document.querySelector('img.builder-imaged__image') as HTMLImageElement).alt).toBe('Golden hour')
    expect((detail.querySelector('img.builder-library__image') as HTMLImageElement).alt).toBe('Golden hour')

    // AND THE OTHER WAY: renamed in the pane while the modal is open.
    await commitName(openNameEditor(paneName), 'The corner bakery')
    expect(modalName.textContent).toContain('The corner bakery')
    expect(document.querySelector('.builder-modal')!.getAttribute('aria-label')).toBe('The corner bakery')

    // KEPT: reselecting the row shows the stored name.
    await open(panel, 'brand-pdf')
    const back = await open(panel, 'made-one')
    expect(back.querySelector('.builder-library__name')!.textContent).toContain('The corner bakery')

    // CHANGED ELSEWHERE: a rename arriving on the change feed reaches the open field.
    const renamed = { ...transport.rows.find((r) => r.uid === 'made-one')!, title: 'Renamed in another tab' }
    Object.assign(transport.rows.find((r) => r.uid === 'made-one')!, { title: 'Renamed in another tab' })
    transport.feeds.at(-1)!({ seq: 11, kind: 'update', cause: 'update', uid: 'made-one', row: renamed, body_changed: false })
    await settleAll()
    expect(listTitle(panel, 'made-one')).toBe('Renamed in another tab')
    expect
      .soft(
        back.querySelector('.builder-library__name')!.textContent,
        'a title change on the feed must reach the open detail\'s name field',
      )
      .toContain('Renamed in another tab')

    // …EXCEPT WHILE THE CLIENT IS TYPING ONE: what they type wins, and nothing is read.
    const typing = openNameEditor(back.querySelector('.builder-library__name')!)
    typing.value = 'Half a new na'
    typing.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    const readsBefore = transport.reads.length
    const again = { ...renamed, title: 'Renamed a second time' }
    transport.feeds.at(-1)!({ seq: 12, kind: 'update', cause: 'update', uid: 'made-one', row: again, body_changed: true })
    await settleAll()
    expect(transport.reads.length).toBe(readsBefore)
    expect(typing.value).toBe('Half a new na')

    // AN EMPTY NAME is refused: nothing is sent, the previous name comes back, and
    // the field says why in the Library's own words.
    await open(panel, 'brand-pdf')
    const fresh = await open(panel, 'made-one')
    const freshName = fresh.querySelector('.builder-library__name')!
    const was = String(listTitle(panel, 'made-one'))
    const sentBefore = transport.names.length
    await commitName(openNameEditor(freshName), '   ')
    expect(transport.names.length).toBe(sentBefore)
    expect(listTitle(panel, 'made-one')).toBe(was)
    expect.soft(freshName.textContent, 'the refusal sentence is shown against the field').toContain(NAME_REQUIRED)
    expect.soft(freshName.textContent, 'the previous name is put back').toContain(was)
  })
})

// ── AC-2557 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2557 — each tool commits one operation and the picture is re-fetched', () => {
  it('test_UAT_AC2557_each_tool_commits_one_operation_of_a_recipe_and_the_modal_refetches_without_sending_bytes', async () => {
    // THROUGH THE REAL `saveMaterialRecipe`, so what is asserted is the request on the wire.
    let stored: unknown[] = []
    const { calls, fetchImpl } = recordingFetch(async (_url, init) => {
      stored = JSON.parse(String(init?.body)).recipe
      return ok({ uid: 'made-one', edits: stored, rendered: true })
    })
    const box = editorOver({
      saveName: async () => ({}),
      saveRecipe: (uid: string, recipe: unknown[]) => saveMaterialRecipe(uid, recipe, fetchImpl),
    })
    const img = box.querySelector('img.builder-imaged__image') as HTMLImageElement
    const windowBox = box.querySelector('.builder-imaged__window') as HTMLElement
    const srcBefore = img.getAttribute('src')

    // TURN RIGHT: one POST, the uid and a one-entry recipe; then a new address for the picture.
    tool(box, 'Turn right').click()
    await settleAll()
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('/api/material/recipe')
    expect(calls[0].method).toBe('POST')
    expect(JSON.parse(String(calls[0].body))).toEqual({ uid: 'made-one', recipe: [{ op: 'rotate', degrees: 90 }] })
    expect(img.getAttribute('src')).not.toBe(srcBefore)
    expect(img.getAttribute('src')).toContain('uid=made-one')
    // Nothing is drawn locally once committed: the renderer's output is what shows.
    expect(windowBox.style.transform).toBe('none')

    // TURN LEFT is 270°.
    tool(box, 'Turn left').click()
    await settleAll()
    expect(stored.at(-1)).toEqual({ op: 'rotate', degrees: 270 })

    // CROP: the box starts inset a tenth; a corner dragged past the edge is clamped.
    tool(box, 'Crop').click()
    await settleAll()
    const crop = box.querySelector('.builder-imaged__crop') as HTMLElement
    expect(crop.hidden).toBe(false)
    expect(crop.dataset.insets).toBe('0.1,0.1,0.1,0.1')
    // CANCEL drops it and commits nothing.
    const posted = calls.length
    tool(box, 'Cancel').click()
    await settleAll()
    expect(crop.hidden).toBe(true)
    expect(calls.length).toBe(posted)

    tool(box, 'Crop').click()
    await settleAll()
    const corner = crop.querySelector('[data-handle="se"]') as HTMLElement
    corner.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5000, clientY: 5000 }))
    document.dispatchEvent(new MouseEvent('mouseup', {}))
    await settle()
    expect(calls.length).toBe(posted) // dragging writes nothing
    // …and dragged back through the opposite side, it stops at a twentieth.
    corner.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5000, clientY: 5000 }))
    document.dispatchEvent(new MouseEvent('mouseup', {}))
    const [l, t, r, b] = crop.dataset.insets!.split(',').map(Number)
    expect(r).toBe(0)
    expect(b).toBe(0)
    expect(l).toBeCloseTo(0.1, 6)
    expect(t).toBeCloseTo(0.1, 6)
    corner.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: -50000, clientY: -50000 }))
    document.dispatchEvent(new MouseEvent('mouseup', {}))
    const squashed = crop.dataset.insets!.split(',').map(Number)
    expect(1 - squashed[0] - squashed[2]).toBeGreaterThanOrEqual(0.05 - 1e-9)
    expect(1 - squashed[1] - squashed[3]).toBeGreaterThanOrEqual(0.05 - 1e-9)
    // Back out to the clamped edge and commit.
    corner.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50000, clientY: 50000 }))
    document.dispatchEvent(new MouseEvent('mouseup', {}))
    tool(box, 'Use this crop').click()
    await settleAll()
    expect(calls.length).toBe(posted + 1)
    expect(stored.at(-1)).toEqual({ op: 'crop', left: 0.1, top: 0.1, right: 0, bottom: 0 })

    // RESIZE opens at the picture's own width once it loads; a width below 1 commits nothing.
    Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 1000 })
    img.dispatchEvent(new Event('load'))
    const width = box.querySelector('.builder-imaged__resize-input') as HTMLInputElement
    expect(width.value).toBe('1000')
    width.value = '0'
    const beforeZero = calls.length
    tool(box, 'Resize').click()
    await settleAll()
    expect(calls.length).toBe(beforeZero)
    width.value = '640'
    tool(box, 'Resize').click()
    await settleAll()
    expect(stored.at(-1)).toEqual({ op: 'resize', width: 640 })

    // ADJUST: dragging previews, releasing commits only the slider that moved, then re-centres.
    const brightness = box.querySelector('input[data-adjust="brightness"]') as HTMLInputElement
    const beforeDrag = calls.length
    brightness.value = '1.3'
    brightness.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    expect(windowBox.style.filter).toContain('brightness(1.3)')
    expect(calls.length).toBe(beforeDrag)
    brightness.dispatchEvent(new Event('change', { bubbles: true }))
    await settleAll()
    expect(calls.length).toBe(beforeDrag + 1)
    expect(stored.at(-1)).toEqual({ op: 'adjust', brightness: 1.3 })
    for (const axis of ['brightness', 'contrast', 'saturation']) {
      expect((box.querySelector(`input[data-adjust="${axis}"]`) as HTMLInputElement).value, axis).toBe('1')
    }

    // EVERY REQUEST carried a uid and a list of operations and nothing else — never bytes.
    for (const call of calls) {
      expect(typeof call.body).toBe('string')
      const sent = JSON.parse(String(call.body))
      expect(Object.keys(sent).sort()).toEqual(['recipe', 'uid'])
      expect(Array.isArray(sent.recipe)).toBe(true)
    }
    expect(stored).toHaveLength(5)

    // AND NO FOCAL-POINT CONTROL.
    expect(document.querySelector('.builder-modal')!.textContent).not.toMatch(/focal/i)
  })
})

// ── AC-2558 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2558 — undo and redo span the sitting and save each step', () => {
  it('test_UAT_AC2558_undo_and_redo_step_through_the_sitting_saving_the_recipe_at_each_step', async () => {
    const { panel, transport } = await library()
    const detail = await open(panel, 'made-one')
    opener(detail)!.click()
    await settleAll()
    let box = document.querySelector('.builder-modal')!

    // NOTHING DONE YET: both unavailable.
    expect(tool(box, 'Undo').disabled).toBe(true)
    expect(tool(box, 'Redo').disabled).toBe(true)

    // TURN RIGHT, THEN RESIZE: two saves.
    tool(box, 'Turn right').click()
    await settleAll()
    ;(box.querySelector('.builder-imaged__resize-input') as HTMLInputElement).value = '400'
    tool(box, 'Resize').click()
    await settleAll()
    const ROT = { op: 'rotate', degrees: 90 }
    const RESIZE = { op: 'resize', width: 400 }
    expect(transport.recipes.map((c) => c.recipe)).toEqual([[ROT], [ROT, RESIZE]])
    expect(tool(box, 'Redo').disabled).toBe(true)

    // UNDO: one step, saved at once, and Redo becomes available.
    const srcBefore = (box.querySelector('img.builder-imaged__image') as HTMLImageElement).getAttribute('src')
    tool(box, 'Undo').click()
    await settleAll()
    expect(transport.recipes.at(-1)!.recipe).toEqual([ROT])
    expect((box.querySelector('img.builder-imaged__image') as HTMLImageElement).getAttribute('src')).not.toBe(srcBefore)
    expect(tool(box, 'Redo').disabled).toBe(false)

    // REDO: the two-entry recipe is saved again.
    tool(box, 'Redo').click()
    await settleAll()
    expect(transport.recipes.at(-1)!.recipe).toEqual([ROT, RESIZE])

    // UNDO, THEN A NEW CHANGE: the stepped-out step is discarded.
    tool(box, 'Undo').click()
    await settleAll()
    tool(box, 'Turn left').click()
    await settleAll()
    expect(transport.recipes.at(-1)!.recipe).toEqual([ROT, { op: 'rotate', degrees: 270 }])
    expect(tool(box, 'Redo').disabled).toBe(true)
    const lastSaved = transport.recipes.at(-1)!.recipe

    // CLOSE AND REOPEN: the recipe persists, the history does not.
    tool(box, 'Close').click()
    await settleAll()
    expect(dialogs()).toHaveLength(0)
    opener(detail)!.click()
    await settleAll()
    expect(dialogs(), 'the picture can be reopened after its modal is closed').toHaveLength(1)
    box = document.querySelector('.builder-modal')!
    expect(tool(box, 'Undo').disabled).toBe(true)
    expect(tool(box, 'Redo').disabled).toBe(true)
    // The recorded operations are intact: the next commit adds to them.
    tool(box, 'Turn right').click()
    await settleAll()
    expect(transport.recipes.at(-1)!.recipe).toEqual([...lastSaved, ROT])
    // …and the sitting's Undo goes back only as far as the sitting began.
    tool(box, 'Undo').click()
    await settleAll()
    expect(transport.recipes.at(-1)!.recipe).toEqual(lastSaved)
    expect(tool(box, 'Undo').disabled).toBe(true)
  })
})

// ── AC-2559 ──────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2559 — a refused edit, and an unrendered one, in the modal', () => {
  it('test_UAT_AC2559_modal_drops_only_the_refused_step_shows_the_origins_sentence_and_says_when_unrendered', async () => {
    const REFUSAL = 'operation 2 would leave 0×300 of a 400×300 picture, which is nothing. Trim less.'
    let refuse: 'sentence' | 'silent' | null = null
    let rendered = true
    const { calls, fetchImpl } = recordingFetch(async (_url, init) => {
      const sent = JSON.parse(String(init?.body))
      if (refuse === 'sentence') {
        return new Response(JSON.stringify({ error: REFUSAL }), { status: 409 })
      }
      return ok({ uid: sent.uid, edits: sent.recipe, rendered })
    })
    const box = editorOver({
      saveName: async () => ({}),
      saveRecipe: async (uid: string, recipe: unknown[]) => {
        if (refuse === 'silent') throw new Error('')
        return saveMaterialRecipe(uid, recipe, fetchImpl)
      },
    })
    const note = () => box.querySelector('.builder-imaged__note')!.textContent
    const img = box.querySelector('img.builder-imaged__image') as HTMLImageElement

    // ONE GOOD CHANGE, then one the origin refuses.
    tool(box, 'Turn right').click()
    await settleAll()
    const srcAfterGood = img.getAttribute('src')
    refuse = 'sentence'
    tool(box, 'Turn right').click()
    await settleAll()

    // THE ORIGIN'S OWN SENTENCE, and the picture as it was.
    expect(note()).toBe(REFUSAL)
    expect(img.getAttribute('src')).toBe(srcAfterGood)

    // ONLY THE REFUSED STEP LEFT THE HISTORY: Undo steps back to before the good change.
    refuse = null
    expect(tool(box, 'Undo').disabled).toBe(false)
    tool(box, 'Undo').click()
    await settleAll()
    expect(JSON.parse(String(calls.at(-1)!.body)).recipe).toEqual([])
    expect(tool(box, 'Undo').disabled).toBe(true)

    // A REFUSAL WITH NO SENTENCE gets the fallback.
    refuse = 'silent'
    tool(box, 'Turn left').click()
    await settleAll()
    expect(note()).toBe('That change could not be saved, so the picture is unchanged.')
    expect(tool(box, 'Undo').disabled).toBe(true)

    // NO RENDERER: stored, and the modal says what the client is looking at.
    refuse = null
    rendered = false
    tool(box, 'Turn right').click()
    await settleAll()
    expect(JSON.parse(String(calls.at(-1)!.body)).recipe).toEqual([{ op: 'rotate', degrees: 90 }])
    expect(note()).toBe('Saved. You are looking at this picture before the change until it is published.')
  })
})
