// @vitest-environment jsdom
/**
 * story-1500b111 — **a captured reference in the Library's detail pane, and links
 * in any description.**
 *
 * WHAT THIS FILE PROVES. BUNDLE-34 (REQ-166) brought captures into a pane built
 * on "one material is one file". Three criteria close that:
 *
 *  - AC-2085 the preview is the capture's screenshot, addressed as one named
 *            member; no reader window; "no longer in storage" when it cannot load.
 *  - AC-2086 the *File* field gives way to a file count that says nothing until
 *            it is known, and the download is the screenshot.
 *  - AC-2087 every link in every rendered description opens away from the
 *            builder with no opener and no referrer, through every repaint.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS (`library.js` over the real
 * `webui-fields` / `webui-list-detail`), on the pattern of the sibling Library
 * suites. The doubles are the HTTP transport (the network) and the markdown
 * engines, whose CDN import cannot run under jsdom and whose `setParser` /
 * `setSanitizer` seam is the documented way in. The `fileUrl` helper is the
 * shipped one's shape, so the member parameter asserted is the one the origin
 * route reads.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`story-1500b111 capture-detail suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

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

const SCREENSHOT = 'screenshot.full.png'

const MEMBERS = ['assets/hero.jpg', 'capture.json', 'raw.html', 'rendered.html', SCREENSHOT]

const CAPTURE_BODY =
  '[Northwind Joinery](https://northwind.example/)\n\n' + 'Warm timber site with a **serif** headline.'

const NOTE_BODY = 'Our supplier list lives at [the shared sheet](https://sheets.example/suppliers).'

/** A capture row as the list route reports one: no real filename, a JSON type. */
function captureRow(uid: string, title: string) {
  return {
    uid,
    type: 'reference',
    title,
    filename: title,
    kind: 'capture',
    // A MACHINE-READABLE MEMBER'S TYPE, which the reader WOULD draw as text —
    // the case AC-2085 says must still show only the picture.
    content_type: 'application/json',
    role: null,
    rights: 'third_party',
    republishable: false,
    exportable: true,
    origin: 'captured',
    placed_on: [],
    source_url: 'https://northwind.example/',
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-10-30T12:00:00.000Z',
  }
}

const MATERIAL = [
  captureRow('reference-many', 'Northwind Joinery'),
  captureRow('reference-one', 'A one-file capture'),
  captureRow('reference-none', 'A capture with no members known'),
  {
    uid: 'material-note',
    type: 'material',
    title: 'Suppliers',
    filename: 'suppliers.txt',
    kind: 'document',
    content_type: 'text/plain',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    placed_on: ['alpha'],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-10-29T08:00:00.000Z',
  },
]

const MEMBERS_OF: Record<string, string[]> = {
  'reference-many': MEMBERS,
  'reference-one': [SCREENSHOT],
  'reference-none': [],
  'material-note': [],
}

const BODY_OF: Record<string, string> = {
  'reference-many': CAPTURE_BODY,
  'reference-one': CAPTURE_BODY,
  'reference-none': CAPTURE_BODY,
  'material-note': NOTE_BODY,
}

function transportOver(over: Record<string, unknown> = {}) {
  const saved: Array<{ uid: string; body: string }> = []
  return {
    saved,
    list: async () => ({ material: MATERIAL.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({
      ...MATERIAL.find((row) => row.uid === uid)!,
      body: BODY_OF[uid],
      members: MEMBERS_OF[uid],
    }),
    save: async (uid: string, body: string) => {
      saved.push({ uid, body })
      return { ...MATERIAL.find((row) => row.uid === uid)!, body }
    },
    fileUrl: (uid: string, member?: string) => {
      const base = `/api/material/file?uid=${encodeURIComponent(uid)}`
      return member ? `${base}&member=${encodeURIComponent(member)}` : base
    },
    ...over,
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
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
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  globalThis.fetch = vi.fn(async () => new Response('', { status: 200 })) as never
})

afterEach(() => {
  if (WEBUI_INSTALLED) {
    setSanitizer(null)
    setParser(null)
  }
})

/** Engines enough for a link and a bold run — the ENGINE, not our policy. */
function installEngines() {
  const inline = (md: string) =>
    md
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  setParser({
    parse: (md: string) =>
      md
        .trim()
        .split(/\n{2,}/)
        .map((block) => `<p>${inline(block)}</p>`)
        .join(''),
    parseInline: inline,
  })
  setSanitizer((html: string) => html)
}

async function mount(transport = transportOver()) {
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
    getSite: () => 'alpha',
    markdownReady: Promise.resolve(),
  }) as unknown as {
    element: HTMLElement
    refresh: () => Promise<unknown>
    getRows: () => Array<{ uid: string; kind: string }>
    listDetail: { select: (uid: string) => void }
  }
  root.append(panel.element)
  await panel.refresh()
  return panel
}

async function open(panel: Awaited<ReturnType<typeof mount>>, uid: string) {
  panel.listDetail.select(uid)
  await settle()
  await settle()
  await settle()
  return panel.element.querySelector('.list-detail-detail-body') as HTMLElement
}

function recordLabels(detail: HTMLElement): string[] {
  return [...detail.querySelectorAll('.builder-library__rights .fields-row')].map(
    (row) => row.querySelector('.fields-label')?.textContent ?? '',
  )
}

function descriptionLinks(detail: HTMLElement): HTMLAnchorElement[] {
  return [...detail.querySelectorAll('.builder-library__description a[href]')] as HTMLAnchorElement[]
}

function expectOpensAway(links: HTMLAnchorElement[]) {
  expect(links.length).toBeGreaterThan(0)
  for (const a of links) {
    expect(a.target).toBe('_blank')
    const rel = a.rel.split(/\s+/)
    expect(rel).toContain('noopener')
    expect(rel).toContain('noreferrer')
  }
}

describe.skipIf(!WEBUI_INSTALLED)('AC-2085 — a capture’s preview is its screenshot, as one named member', () => {
  it('test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so', async () => {
    const panel = await mount()

    // LISTED AS A *capture*-KIND ROW.
    const row = panel.getRows().find((r) => r.uid === 'reference-many')!
    expect(row.kind).toBe('capture')

    const detail = await open(panel, 'reference-many')

    // A PICTURE WHOSE ADDRESS NAMES THE CAPTURE AND THE SCREENSHOT MEMBER.
    const img = detail.querySelector('img.builder-library__image') as HTMLImageElement
    expect(img).toBeTruthy()
    const src = new URL(img.getAttribute('src')!, 'https://app.test')
    expect(src.pathname).toBe('/api/material/file')
    expect(src.searchParams.get('uid')).toBe('reference-many')
    expect(src.searchParams.get('member')).toBe(SCREENSHOT)
    // The capture's title is its text alternative.
    expect(img.alt).toBe('Northwind Joinery')

    // NO READER WINDOW, though the row's type is JSON — which the reader draws for
    // an ordinary material of the same type.
    expect(detail.querySelector('.builder-reader')).toBeNull()
    expect(detail.querySelector('.builder-reader__text')).toBeNull()

    // THE SCREENSHOT CANNOT BE FETCHED: the picture gives way to the same plain
    // statement any unreadable material shows, not a broken image.
    img.dispatchEvent(new Event('error'))
    expect(detail.querySelector('img.builder-library__image')).toBeNull()
    const missing = detail.querySelector('.builder-library__preview .builder-library__missing')
    expect(missing?.textContent).toMatch(/no longer in storage/i)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2086 — a capture states its file count in place of *File*, and downloads the screenshot', () => {
  it('test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot', async () => {
    // BEFORE THE DETAIL LOADS the count line is empty, not a number.
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const base = transportOver()
    const held = transportOver({
      item: async (uid: string) => {
        await gate
        return base.item(uid)
      },
    })
    const heldPanel = await mount(held)
    const pending = await open(heldPanel, 'reference-many')
    const pendingCount = pending.querySelector('.builder-library__members')
    expect(pendingCount).toBeTruthy()
    expect(pendingCount!.textContent).toBe('')
    release()
    await settle()
    await settle()
    expect(pending.querySelector('.builder-library__members')!.textContent).toBe('5 files captured')

    const panel = await mount()

    // MANY MEMBERS: no *File* row, every other row of the record kept.
    const many = await open(panel, 'reference-many')
    const labels = recordLabels(many)
    expect(labels).not.toContain('File')
    for (const kept of [
      'Kind',
      'What it is for',
      'Where it came from',
      'Rights',
      'Can appear on the site',
      'Used on',
      'Address',
    ]) {
      expect(labels).toContain(kept)
    }
    expect(many.querySelector('.builder-library__members')!.textContent).toBe(
      `${MEMBERS.length} files captured`,
    )

    // THE DOWNLOAD IS THE SCREENSHOT: addressed by member, labelled and saved
    // under the screenshot's name — not the capture's title.
    const link = many.querySelector('a.builder-library__download') as HTMLAnchorElement
    const href = new URL(link.getAttribute('href')!, 'https://app.test')
    expect(href.searchParams.get('uid')).toBe('reference-many')
    expect(href.searchParams.get('member')).toBe(SCREENSHOT)
    expect(link.textContent).toBe(SCREENSHOT)
    expect(link.getAttribute('download')).toBe(SCREENSHOT)

    // ONE MEMBER: the singular.
    const one = await open(panel, 'reference-one')
    expect(one.querySelector('.builder-library__members')!.textContent).toBe('1 file captured')

    // NO MEMBER NAMES KNOWN: empty, never "0 files captured".
    const none = await open(panel, 'reference-none')
    expect(none.querySelector('.builder-library__members')!.textContent).toBe('')

    // ORDINARY SINGLE-FILE MATERIAL IS UNAFFECTED: *File* present, no count line,
    // a download naming no member that saves under the original filename.
    const note = await open(panel, 'material-note')
    expect(recordLabels(note)).toContain('File')
    expect(note.querySelector('.builder-library__members')).toBeNull()
    const noteLink = note.querySelector('a.builder-library__download') as HTMLAnchorElement
    const noteHref = new URL(noteLink.getAttribute('href')!, 'https://app.test')
    expect(noteHref.searchParams.get('uid')).toBe('material-note')
    expect(noteHref.searchParams.get('member')).toBeNull()
    expect(noteLink.getAttribute('download')).toBe('suppliers.txt')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2087 — a link in any description opens away from the builder, through every repaint', () => {
  it('test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint', async () => {
    installEngines()
    let failNext = false
    const base = transportOver()
    const transport = transportOver({
      save: async (uid: string, body: string) => {
        if (failNext) {
          failNext = false
          throw new Error('the write did not land')
        }
        return base.save(uid, body)
      },
    })
    const panel = await mount(transport)

    // A CAPTURE'S DESCRIPTION OPENS WITH THE LINK TO THE CAPTURED SITE.
    const capture = await open(panel, 'reference-many')
    const captureLinks = descriptionLinks(capture)
    expect(captureLinks[0].getAttribute('href')).toBe('https://northwind.example/')
    expectOpensAway(captureLinks)

    // AN ORDINARY MATERIAL'S DESCRIPTION, TOO.
    const note = await open(panel, 'material-note')
    const noteLinks = descriptionLinks(note)
    expect(noteLinks.map((a) => a.getAttribute('href'))).toEqual(['https://sheets.example/suppliers'])
    expectOpensAway(noteLinks)

    const editCell = () =>
      note.querySelector('.builder-library__description .fields-value-editable') as HTMLElement
    const textarea = () =>
      note.querySelector('.builder-library__description textarea') as HTMLTextAreaElement

    // A COMMITTED CORRECTION CONTAINING A LINK, repainted rendered.
    editCell().click()
    textarea().value = 'Now kept at [the new sheet](https://sheets.example/v2).'
    textarea().dispatchEvent(new Event('change', { bubbles: true }))
    textarea().dispatchEvent(new Event('blur'))
    await settle()
    await settle()
    expect(base.saved.at(-1)).toEqual({
      uid: 'material-note',
      body: 'Now kept at [the new sheet](https://sheets.example/v2).',
    })
    const committed = descriptionLinks(note)
    expect(committed.map((a) => a.getAttribute('href'))).toEqual(['https://sheets.example/v2'])
    expectOpensAway(committed)

    // A FAILED WRITE, ROLLED BACK: the restored description's links still open away.
    failNext = true
    editCell().click()
    textarea().value = 'A version that will not be stored, see [here](https://nowhere.example/).'
    textarea().dispatchEvent(new Event('change', { bubbles: true }))
    textarea().dispatchEvent(new Event('blur'))
    await settle()
    await settle()
    await settle()
    const rolledBack = descriptionLinks(note)
    expect(rolledBack.map((a) => a.getAttribute('href'))).not.toContain('https://nowhere.example/')
    expectOpensAway(rolledBack)

    // A CANCELLED EDIT: opened, then abandoned with Escape.
    editCell().click()
    expect(textarea()).toBeTruthy()
    textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    await settle()
    expect(textarea()).toBeNull()
    expectOpensAway(descriptionLinks(note))
  })
})
