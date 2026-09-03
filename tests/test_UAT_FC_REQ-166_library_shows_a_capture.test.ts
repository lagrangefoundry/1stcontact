// @vitest-environment jsdom
/**
 * REQ-166 — **a capture, as the client sees it.**
 *
 * WHAT THIS FILE PROVES. REQ-161 built the shelf a capture lands on —
 * `listMaterial` spans `material` AND `reference`, and the kind filter already
 * offers `capture` — so a captured site appears in the Library with no work at
 * all. What did NOT follow for free is the detail pane, because every part of it
 * assumed ONE TICKET IS ONE FILE and a bundle is 11–99: nothing rendered as a
 * preview, the *File* field fell back to the ticket title, and the download link
 * served whichever member sorted first. These are the three claims that close
 * that, plus the link the body now opens with.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern REQ-161,
 * BUG-42 and REQ-172 established. The only doubles are the HTTP calls, because
 * they are the network — and the markdown engines, whose CDN import cannot run
 * under jsdom and whose seam BUG-42 already made the documented way in.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`REQ-166 library suite skipped: ${WEBUI_SKIP_REASON}`)

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

/** The bundle's members, as `readMaterial` reports them — five of them. */
const MEMBERS = [
  'assets/hero.jpg',
  'capture.json',
  'raw.html',
  'rendered.html',
  'screenshot.full.png',
]

/**
 * The body a capture is written up with — [[REQ-166]].
 *
 * ITS FIRST LINE IS THE LINK, which is the shape the ticket asks for and the
 * thing two assertions below turn on.
 */
const CAPTURE_BODY =
  '[Gigabyte Alchemy — AI consulting](https://gigabytealchemy.ai/)\n\n' +
  'Dark consultancy site with **gold** accents.\n\n' +
  'Palette: #101014, #d4af37. Type: Cinzel.'

/**
 * One capture and one ordinary file.
 *
 * THE CAPTURE CARRIES NO `filename`, which is exactly the production shape: the
 * field is absent on a `reference` and `rowOf` falls back to the ticket TITLE —
 * which is what made the *File* field state a filename that is not one.
 */
const MATERIAL = [
  {
    uid: 'reference-capture',
    type: 'reference',
    title: 'Gigabyte Alchemy — AI consulting',
    filename: 'Gigabyte Alchemy — AI consulting',
    kind: 'capture',
    content_type: 'application/json',
    role: null,
    rights: 'third_party',
    republishable: false,
    exportable: true,
    origin: 'captured',
    placed_on: [],
    source_url: 'https://gigabytealchemy.ai/',
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-09-01T12:00:00.000Z',
  },
  {
    uid: 'material-img',
    type: 'material',
    title: 'The wordmark',
    filename: 'wordmark.svg',
    kind: 'image',
    content_type: 'image/svg+xml',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: ['alpha'],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-08-31T08:00:00.000Z',
  },
]

function transportOver() {
  return {
    list: async () => ({ material: MATERIAL.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({
      ...MATERIAL.find((row) => row.uid === uid)!,
      body: uid === 'reference-capture' ? CAPTURE_BODY : '',
      // The member list travels on the ITEM, never on the row — listing it per
      // row would cost an `attachments` call to draw a column of filenames.
      members: uid === 'reference-capture' ? MEMBERS : [],
    }),
    save: async (uid: string, body: string) => ({
      ...MATERIAL.find((row) => row.uid === uid)!,
      body,
    }),
    // THE REAL HELPER, so the member parameter under test is the shipped one.
    fileUrl: (uid: string, member?: string) => {
      const base = `/api/material/file?uid=${encodeURIComponent(uid)}`
      return member ? `${base}&member=${encodeURIComponent(member)}` : base
    },
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

async function detailFor(uid: string, over: Record<string, unknown> = {}) {
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport: transportOver(),
    getSite: () => 'alpha',
    ...over,
  })
  root.append(panel.element)
  await panel.refresh()
  panel.listDetail.select(uid)
  await settle()
  await settle()
  return { panel, detail: panel.element.querySelector('.list-detail-detail-body')! }
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-166 — a capture in the Library', () => {
  it('test_UAT_FC_REQ-166_the_preview_is_the_screenshot_addressed_as_one_member', async () => {
    const { detail } = await detailFor('reference-capture')

    // THE PICTURE IS THE SITE. Before this, `kind` was not `image` and the
    // resolved content type had no reader, so a capture's pane showed NOTHING.
    const img = detail.querySelector('img.builder-library__image') as HTMLImageElement
    expect(img).toBeTruthy()

    // AND IT NAMES THE MEMBER. The bare file URL serves whichever of the five
    // records comes back first; only the member parameter can mean "the
    // screenshot".
    const src = new URL(img.getAttribute('src')!, 'https://app.test')
    expect(src.searchParams.get('uid')).toBe('reference-capture')
    expect(src.searchParams.get('member')).toBe('screenshot.full.png')
  })

  it('test_UAT_FC_REQ-166_the_detail_counts_the_files_and_states_no_single_filename', async () => {
    const { detail } = await detailFor('reference-capture')

    // THE COUNT REPLACES THE *File* FIELD — the true answer to "how much of this
    // do we hold", where a 99-row member list would be honest and useless.
    const count = detail.querySelector('.builder-library__members')
    expect(count?.textContent).toBe('5 files captured')

    // AND THE *File* FIELD IS GONE. A capture has no filename, so the row falls
    // back to the ticket title — leaving the field in place printed the site's
    // NAME in a row labelled as its filename.
    const labels = [...detail.querySelectorAll('.fields-row')].map(
      (row) => row.querySelector('.fields-label')?.textContent,
    )
    expect(labels).not.toContain('File')
    // The rest of the §9 rights record is untouched, including the two bits that
    // matter most about somebody else's site.
    expect(labels).toContain('Kind')
    expect(labels).toContain('Can appear on the site')
    expect(labels).toContain('Address')
  })

  it('test_UAT_FC_REQ-166_the_download_is_the_screenshot_not_an_arbitrary_member', async () => {
    const { detail } = await detailFor('reference-capture')
    const link = detail.querySelector('a.builder-library__download') as HTMLAnchorElement

    const href = new URL(link.getAttribute('href')!, 'https://app.test')
    expect(href.searchParams.get('member')).toBe('screenshot.full.png')
    // Saved under the member's own name. `row.filename` on a capture IS the
    // ticket title, so the unfixed link would have saved a PNG called
    // "Gigabyte Alchemy — AI consulting".
    expect(link.getAttribute('download')).toBe('screenshot.full.png')
    expect(link.textContent).toBe('screenshot.full.png')
  })

  it('test_UAT_FC_REQ-166_the_body_opens_with_a_link_that_does_not_navigate_the_builder_away', async () => {
    installEngines()
    const { detail } = await detailFor('reference-capture')
    await settle()

    const anchor = detail.querySelector('.fields-value a[href]') as HTMLAnchorElement
    expect(anchor).toBeTruthy()
    expect(anchor.getAttribute('href')).toBe('https://gigabytealchemy.ai/')
    expect(anchor.textContent).toBe('Gigabyte Alchemy — AI consulting')

    // THE PART THAT PROTECTS THE CLIENT'S WORK. The Library is a tab inside a
    // single-page builder, so a bare anchor navigates the WHOLE APP away and
    // takes unsaved editing state with it. `noopener` additionally stops a page
    // we captured off the public web reaching back through `window.opener`.
    expect(anchor.target).toBe('_blank')
    expect(anchor.rel).toContain('noopener')
  })

  it('test_UAT_FC_REQ-166_an_ordinary_material_is_untouched_by_any_of_this', async () => {
    const { detail } = await detailFor('material-img')

    // The single-file pane still names its file, still downloads by that name,
    // and its URL carries NO member — every existing caller is unaffected.
    const link = detail.querySelector('a.builder-library__download') as HTMLAnchorElement
    expect(link.textContent).toBe('wordmark.svg')
    expect(new URL(link.getAttribute('href')!, 'https://app.test').searchParams.get('member')).toBeNull()

    const labels = [...detail.querySelectorAll('.fields-row')].map(
      (row) => row.querySelector('.fields-label')?.textContent,
    )
    expect(labels).toContain('File')
    // And no capture-only furniture leaks onto it.
    expect(detail.querySelector('.builder-library__members')).toBeNull()
  })

  it('test_UAT_FC_REQ-166_the_capture_is_listed_and_filterable_as_one', async () => {
    const panel = createLibraryPanel({
      storage: memoryStorage(),
      transport: transportOver(),
      getSite: () => 'alpha',
    })
    root.append(panel.element)
    await panel.refresh()

    // REQ-161's own list, spanning both material types with nothing added.
    expect(panel.getRows().map((r: { uid: string }) => r.uid)).toContain('reference-capture')

    // The kind filter already offered `capture` before there was anything to
    // put under it; this is the first time it can select one.
    const kind = panel.element.querySelector('.builder-library__kind') as HTMLSelectElement
    kind.value = 'capture'
    kind.dispatchEvent(new Event('change'))
    expect(panel.getRows().map((r: { uid: string }) => r.uid)).toEqual(['reference-capture'])
  })
})
