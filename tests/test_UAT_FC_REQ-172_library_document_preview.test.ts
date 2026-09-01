// @vitest-environment jsdom
/**
 * REQ-172 — **a document is shown, not named**.
 *
 * WHAT THIS FILE PROVES. REQ-161 gave the Library detail pane an `<img>` for a
 * photograph and a download link for everything else, which left a client who had
 * just uploaded their brand guidelines holding a filename — the same *"recognise
 * it by its path"* problem REQ-132 removed from the image picker, surviving one
 * file type later. This is the reader window that closes it: markdown rendered,
 * plain text as itself, a PDF in the browser's own viewer, and an expand button
 * that opens any of the three at modal size.
 *
 * THE CONTENT TYPE IS THE SUBJECT, NOT `kind`. Every claim below turns on the
 * fact that DOC-38 §9 files a markdown note, a text export and a brand PDF as one
 * `document`, so a pane that rendered from `kind` could only ever render all
 * three the same wrong way. The fixture therefore holds all three under that one
 * `kind` and differs only in `content_type`.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern REQ-161 and
 * BUG-42 established: the claim is about what the browser SHOWS. The only doubles
 * are the HTTP calls, because they are the network — and the markdown engines,
 * whose CDN import cannot run under jsdom and whose seam BUG-42 already made the
 * documented way in.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let readerKind: (contentType: string) => string | null
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`REQ-172 reader suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** A promise this suite decides the moment of — the cold load, held open. */
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
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

/** What the client's markdown says, chosen so its rendering is unmistakable. */
const MARKDOWN = 'Gold on **cream**, with a\n\n- narrow counter\n- and a long descender\n'

/**
 * What the client's `.txt` says.
 *
 * DELIBERATELY MARKDOWN-SHAPED. The leading `# ` and the `*` are what a parser
 * would eat, so a `.txt` that survives them intact is the mechanical form of
 * "plain text is not put through the markdown renderer".
 */
const TEXT = '# Not a heading\n\nline one\nline two\n\n* not a bullet *\n'

/**
 * The tenant's material — three `document`s that must render three ways, plus
 * the image REQ-161 already rendered and a font nothing can.
 */
const MATERIAL = [
  {
    uid: 'material-md',
    type: 'material',
    title: 'Positioning notes',
    filename: 'positioning.md',
    kind: 'document',
    content_type: 'text/markdown',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    site_slug: null,
    source_url: null,
    description_status: 'ok',
    description_model: 'text-decode',
    updated_at: '2026-08-31T12:00:00.000Z',
  },
  {
    uid: 'material-txt',
    type: 'material',
    title: 'The export',
    filename: 'export.txt',
    kind: 'document',
    content_type: 'text/plain',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    site_slug: null,
    source_url: null,
    description_status: 'ok',
    description_model: 'text-decode',
    updated_at: '2026-08-31T11:00:00.000Z',
  },
  {
    uid: 'material-pdf',
    type: 'material',
    title: 'Brand guidelines',
    filename: 'guidelines.pdf',
    kind: 'document',
    content_type: 'application/pdf',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    site_slug: null,
    source_url: null,
    description_status: 'ok',
    description_model: 'unpdf',
    updated_at: '2026-08-31T10:00:00.000Z',
  },
  {
    uid: 'material-font',
    type: 'material',
    title: 'The brand face',
    filename: 'brand.woff2',
    kind: 'font',
    content_type: 'font/woff2',
    role: 'site',
    rights: 'licensed',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    site_slug: 'alpha',
    source_url: null,
    description_status: 'unsupported',
    description_model: null,
    updated_at: '2026-08-31T09:00:00.000Z',
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
    site_slug: 'alpha',
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-08-31T08:00:00.000Z',
  },
]

/** What the file route answers for each uid — the bytes, as themselves. */
const BYTES: Record<string, string> = {
  'material-md': MARKDOWN,
  'material-txt': TEXT,
  'material-img': '<svg/>',
}

function transportOver() {
  return {
    list: async () => ({ material: MATERIAL.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...MATERIAL.find((row) => row.uid === uid)!, body: '' }),
    save: async (uid: string, body: string) => ({
      ...MATERIAL.find((row) => row.uid === uid)!,
      body,
    }),
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
}

/**
 * The file route, as the network.
 *
 * A SPY RATHER THAN A HANDLER, because two claims below are about what is NOT
 * fetched: a PDF, which the browser's own viewer reads from the same URL, and a
 * font, which has no reader at all.
 */
let fetched: string[]
function installFetch(fail = false) {
  fetched = []
  globalThis.fetch = vi.fn(async (input: unknown) => {
    const url = String(input)
    fetched.push(url)
    const uid = new URL(url, 'https://app.test').searchParams.get('uid') ?? ''
    if (fail || !(uid in BYTES)) return new Response('gone', { status: 404 })
    return new Response(BYTES[uid], { status: 200 })
  }) as never
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
    ;({ readerKind } = await import('../apps/control-app/src/builder/reader.js'))
    // THROUGH THE BUILDER'S OWN SEAM MODULE, not the components' package names:
    // `bug32-webui-scope-rebrand` permits the component scope in its declaration
    // and in `src/builder` alone, so `markdown.js` is where a suite comes to find
    // the engines — which is also the one place their policy is stated.
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
  installFetch()
})

afterEach(() => {
  // Both seams are module-global. Left set, the next test would inherit an engine
  // it did not ask for — and the escaped-source assertion is the one that would
  // then quietly stop meaning anything.
  if (WEBUI_INSTALLED) {
    setSanitizer(null)
    setParser(null)
  }
})

/** Install the engines: a real-enough markdown parser and a pass-through scrubber. */
function installEngines() {
  // `marked` itself is the CDN import that cannot run here, so the parser seam
  // takes a minimal stand-in covering exactly what the fixture markdown uses.
  // This is the ENGINE, not the policy — the policy under test is ours.
  const inline = (md: string) => md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  setParser({
    parse: (md: string) =>
      md
        .trim()
        .split(/\n{2,}/)
        .map((block) =>
          block.startsWith('- ')
            ? `<ul>${block
                .split('\n')
                .filter((line) => line.trim() !== '')
                .map((line) => `<li>${inline(line.replace(/^- /, ''))}</li>`)
                .join('')}</ul>`
            : `<p>${inline(block)}</p>`,
        )
        .join(''),
    parseInline: inline,
  })
  setSanitizer((html: string) => html)
}

/** A mounted Library over the fixture, already loaded, with one row selected. */
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

// ── what decides the rendering ───────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-172 — the content type decides the reader', () => {
  it('test_UAT_FC_REQ-172_the_reader_is_chosen_by_content_type_and_document_is_not_one_answer', () => {
    const kindOfReader = readerKind

    // THE WHOLE POINT OF THE FIELD. All three of these are `kind: 'document'` —
    // DOC-38 §9 has no finer vocabulary — and they are three different renderings.
    expect(kindOfReader('text/markdown')).toBe('markdown')
    expect(kindOfReader('text/plain')).toBe('text')
    expect(kindOfReader('application/pdf')).toBe('pdf')

    // The parameters and the casing a real header arrives with.
    expect(kindOfReader('text/plain; charset=utf-8')).toBe('text')
    expect(kindOfReader('TEXT/MARKDOWN')).toBe('markdown')

    // The textual set `describe.ts` already extracts — what the origin was
    // willing to READ is what the pane is willing to SHOW.
    expect(kindOfReader('text/csv')).toBe('text')
    expect(kindOfReader('application/json')).toBe('text')

    // HTML IS SHOWN AS SOURCE, NOT RUN. It decodes as text and it is text that
    // this pane shows; rendering an uploaded document as live markup would be a
    // script-execution surface offered as a convenience.
    expect(kindOfReader('text/html')).toBe('text')

    // AN SVG IS A PICTURE even though it decodes as text — `kindOf` files it as
    // an image and the pane already has an `<img>` for it. Showing a client
    // their logo as angle brackets would be a regression dressed as a feature.
    expect(kindOfReader('image/svg+xml')).toBe(null)

    // And what nothing can render stays what it was: a download and no more.
    expect(kindOfReader('font/woff2')).toBe(null)
    expect(kindOfReader('application/octet-stream')).toBe(null)
    expect(kindOfReader('')).toBe(null)
  })
})

// ── the three renderings ─────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-172 — a document is shown in the pane', () => {
  it('test_UAT_FC_REQ-172_markdown_is_rendered_into_a_scrolling_window_above_the_metadata', async () => {
    installEngines()
    const { detail } = await detailFor('material-md')

    const body = detail.querySelector('.builder-reader__body')!
    expect(body).toBeTruthy()

    // RENDERED, NOT LISTED. The markers are gone and real elements stand in
    // their place — the difference between showing a document and showing its
    // source.
    expect(body.querySelector('strong')?.textContent).toBe('cream')
    expect([...body.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'narrow counter',
      'and a long descender',
    ])
    expect(body.textContent).not.toContain('**')
    // Tagged for the shared markdown stylesheet, like every other rendered
    // surface in the builder.
    expect(body.classList.contains('md-body')).toBe(true)

    // ABOVE THE METADATA, which is the placement the pane already teaches with an
    // image: the preview, then the rights record, then what it says.
    const preview = detail.querySelector('.builder-library__preview')!
    const rights = detail.querySelector('.builder-library__rights')!
    expect(preview.contains(body)).toBe(true)
    expect(preview.compareDocumentPosition(rights) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // AND THE DOWNLOAD LINK SURVIVES. Being able to read a file on screen is not
    // the same as having it.
    const link = preview.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/api/material/file?uid=material-md')
    expect(link.getAttribute('download')).toBe('positioning.md')
  })

  it('test_UAT_FC_REQ-172_a_txt_is_shown_as_itself_and_is_never_put_through_the_markdown_parser', async () => {
    // The engines ARE present, so nothing here is an accident of their absence:
    // this file is not parsed because it is not markdown.
    installEngines()
    const { detail } = await detailFor('material-txt')

    const body = detail.querySelector('.builder-reader__body')!
    const pre = body.querySelector('.builder-reader__text')!
    expect(pre.tagName).toBe('PRE')

    // ITS OWN CHARACTERS, ALL OF THEM. A parser would have eaten the `# ` into a
    // heading and the `*` into emphasis; both are still here as the author typed
    // them, and no element was invented around them.
    expect(pre.textContent).toBe(TEXT)
    expect(body.querySelector('h1')).toBe(null)
    expect(body.querySelector('em')).toBe(null)
    expect(body.classList.contains('md-body')).toBe(false)

    // ITS OWN LINE BREAKS, KEPT — the reason it is a `<pre>` at all.
    expect(pre.textContent).toContain('line one\nline two')

    const link = detail.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(link.getAttribute('download')).toBe('export.txt')
  })

  it('test_UAT_FC_REQ-172_a_pdf_is_given_the_browsers_own_viewer_at_the_file_route', async () => {
    const { detail } = await detailFor('material-pdf')

    const frame = detail.querySelector('.builder-reader__frame') as HTMLIFrameElement
    expect(frame.tagName).toBe('IFRAME')
    // THE SAME URL THE DOWNLOAD LINK USES. The route already serves the stored
    // content type with `content-disposition: inline`, which is exactly what the
    // built-in viewer needs — so this is the whole implementation.
    expect(frame.getAttribute('src')).toBe('/api/material/file?uid=material-pdf')
    // The only accessible name an embedded document gets.
    expect(frame.title).toBe('guidelines.pdf')

    // AND THE BYTES ARE NOT READ TWICE. The frame asks for them itself; a fetch
    // here would double the transfer to show the file once.
    expect(fetched).toEqual([])

    const link = detail.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(link.getAttribute('download')).toBe('guidelines.pdf')
  })

  it('test_UAT_FC_REQ-172_what_nothing_can_render_is_offered_exactly_as_it_was_before', async () => {
    const { detail } = await detailFor('material-font')

    // No window, no expand button, no fetch — REQ-161's pane, untouched.
    expect(detail.querySelector('.builder-reader')).toBe(null)
    expect(detail.querySelector('.builder-reader__expand')).toBe(null)
    expect(fetched).toEqual([])

    const link = detail.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/api/material/file?uid=material-font')
    expect(link.textContent).toBe('brand.woff2')
  })

  it('test_UAT_FC_REQ-172_an_image_keeps_the_img_it_already_had_and_gains_no_reader', async () => {
    const { detail } = await detailFor('material-img')

    // An SVG decodes as text, and this is the pane that must not therefore show
    // it as text. REQ-161's `<img>` is still what a picture gets.
    const img = detail.querySelector('.builder-library__image') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/api/material/file?uid=material-img')
    expect(detail.querySelector('.builder-reader')).toBe(null)
  })

  it('test_UAT_FC_REQ-172_a_record_whose_bytes_are_gone_says_so_rather_than_showing_an_empty_window', async () => {
    installFetch(true)
    installEngines()
    const { detail } = await detailFor('material-md')

    const body = detail.querySelector('.builder-reader__body')!
    // The same sentence the missing-image path uses, because it is the same
    // failure: a record naming absent bytes.
    expect(body.textContent).toContain('That file is no longer in storage.')
    expect(body.querySelector('strong')).toBe(null)
  })

  it('test_UAT_FC_REQ-172_a_cold_load_repaints_the_window_once_the_markdown_engines_land', async () => {
    // BUG-42's failure, on the surface BUG-42 did not yet cover: `renderSafe`
    // degrades to escaped source while the CDN import is still in flight, which
    // is right when the engines are absent and wrong when they are merely late.
    const engines = deferred()
    const { detail } = await detailFor('material-md', { markdownReady: engines.promise })

    const body = detail.querySelector('.builder-reader__body') as HTMLElement
    // The cold load: honest, and not what the client should be left with.
    expect(body.dataset.readerPaint).toBe('escaped')
    expect(body.textContent).toContain('**cream**')
    expect(body.querySelector('strong')).toBe(null)

    installEngines()
    engines.resolve()
    await settle()

    // And now it is the document, without the client having reloaded anything.
    expect(body.dataset.readerPaint).toBe('rendered')
    expect(body.querySelector('strong')?.textContent).toBe('cream')
  })
})

// ── the expanded window ──────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-172 — the expand button opens the same document larger', () => {
  it('test_UAT_FC_REQ-172_the_button_in_the_top_right_opens_the_document_in_a_modal', async () => {
    installEngines()
    const { detail } = await detailFor('material-md')

    const reader = detail.querySelector('.builder-reader')!
    const button = reader.querySelector('.builder-reader__expand') as HTMLButtonElement

    // IN THE TOP RIGHT, and above the window rather than floating over it: the
    // window scrolls, and a control overlaying scrolling prose covers a different
    // word every time the client moves.
    const bar = reader.querySelector('.builder-reader__bar')!
    const window_ = reader.querySelector('.builder-reader__body')!
    expect(bar.contains(button)).toBe(true)
    const barIsAbove = bar.compareDocumentPosition(window_) & Node.DOCUMENT_POSITION_FOLLOWING
    expect(barIsAbove).toBeTruthy()
    // Two arrows pointing away from each other, with the words for anything that
    // cannot see them.
    expect(button.textContent).toContain('⤢')
    expect(button.getAttribute('aria-label')).toBe('Open this in a larger window')
    expect(button.type).toBe('button')

    expect(document.querySelector('.builder-modal')).toBe(null)
    button.click()

    // THE BUILDER'S OWN DIALOG SHELL, not a second one invented here — so Escape,
    // the backdrop and the button all close it because they already do.
    const modal = document.querySelector('.builder-modal')!
    expect(modal.getAttribute('role')).toBe('dialog')
    expect(modal.getAttribute('aria-modal')).toBe('true')
    expect(modal.getAttribute('aria-label')).toBe('positioning.md')

    // THE SAME DOCUMENT, RENDERED, at modal size — and the pane's own window is
    // still behind it rather than having been emptied to fill the dialog.
    const modalBody = modal.querySelector('.builder-reader__body--modal')!
    expect(modalBody.querySelector('strong')?.textContent).toBe('cream')
    expect([...modalBody.querySelectorAll('li')]).toHaveLength(2)
    expect(detail.querySelector('.builder-reader__body')!.querySelector('strong')).toBeTruthy()

    // The width rule keys on this box's presence — a reader dialog is a reading
    // width, not the 520px a one-sentence message gets.
    expect(modal.querySelector('.builder-modal__reader')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-172_a_pdf_expands_to_the_same_viewer_and_escape_closes_it', async () => {
    const { detail } = await detailFor('material-pdf')
    ;(detail.querySelector('.builder-reader__expand') as HTMLButtonElement).click()

    const modal = document.querySelector('.builder-modal')!
    const frame = modal.querySelector('.builder-reader__frame') as HTMLIFrameElement
    expect(frame.getAttribute('src')).toBe('/api/material/file?uid=material-pdf')

    // Escape, which is `modal.js`'s and not this module's — the point of reusing
    // the shell rather than rebuilding it.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(document.querySelector('.builder-modal')).toBe(null)

    // And it opens again, which is what would break if closing had not released
    // the dialog it was holding.
    ;(detail.querySelector('.builder-reader__expand') as HTMLButtonElement).click()
    expect(document.querySelector('.builder-modal')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-172_browsing_to_another_document_takes_its_expanded_window_with_it', async () => {
    installEngines()
    const { panel } = await detailFor('material-md')
    ;(
      panel.element.querySelector('.builder-reader__expand') as HTMLButtonElement
    ).click()
    expect(document.querySelector('.builder-modal')).toBeTruthy()

    // `list-detail` swaps details as the client browses. A dialog left open over
    // the pane that replaced the one that opened it is a window showing a file
    // the client is no longer looking at.
    panel.listDetail.select('material-txt')
    await settle()
    await settle()

    expect(document.querySelector('.builder-modal')).toBe(null)
    expect(panel.element.querySelector('.builder-reader__text')?.textContent).toBe(TEXT)
  })
})
