// @vitest-environment jsdom
/**
 * story-1500b111 — **the Library's reader window** — the browser half.
 *
 * WHAT THIS FILE PROVES, and what its siblings prove instead.
 * `reconciliation-library-tab.test.ts` is the TAB — the two panes, the badge, the
 * four filters, the read-only rights record, the one editable field.
 * `reconciliation-library-surface.workers.test.ts` is the origin CONTRACT under
 * it. This file is the part of the detail pane that shows the file ITSELF: which
 * reader a piece of material gets (AC-1811), the expand control that opens the
 * same content at modal size (AC-1812), the one render-then-sanitize path every
 * rendered byte goes through (AC-1814), and the repaint that upgrades a surface
 * painted before the markdown engines settled (AC-1815).
 *
 * THE CONTENT TYPE IS THE SUBJECT, NOT `kind`. Every claim below turns on the
 * fact that DOC-38 §9 files a markdown note, a text export and a brand PDF as one
 * `document` — so a pane rendering from `kind` could only ever render all three
 * the same wrong way. The fixture therefore holds four `document`s that differ
 * only in `content_type`, beside the image and the font that must keep the pane
 * they already had.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the tab suite
 * established: the claims are about what the browser SHOWS, and a mocked
 * `list-detail` or a mocked `fields` would assert the mock. The suites therefore
 * SKIP with a reported reason on a machine that has not run the out-of-band
 * `webui` install rather than passing while proving nothing.
 *
 * TWO DOUBLES, BOTH OF THEM THE OUTSIDE WORLD. `transport` and `fetch` stand in
 * for the origin's four routes; the markdown engines are injected through the
 * seams `markdown.js` publishes, because their CDN import cannot run under jsdom
 * and because the cold-load race is not reproducible by waiting for it. Nothing
 * else here is stood in for: every window, every dialog and every repaint below
 * is produced by the real panel.
 */

import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let readerKind: (contentType: string) => string | null
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`story-1500b111 reader suites skipped: ${WEBUI_SKIP_REASON}`)

const REPO = path.resolve(__dirname, '..')
const BUILDER_CSS = path.join(REPO, 'apps/control-app/src/builder/builder.css')

/** One macrotask — the panel builds the detail frame now and fills it from `item()`. */
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

/**
 * The declaration block of one selector, comments stripped.
 *
 * A selector is everything since the last `}`, so a rule preceded by a comment —
 * which is most of this stylesheet's — would otherwise arrive with that comment
 * glued to its front and match nothing, silently turning an assertion about the
 * window's bound into an assertion about an empty string.
 */
function ruleFor(selector: string): string {
  const css = fs.readFileSync(BUILDER_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css))) if (m[1].trim() === selector) return m[2]
  throw new Error(`no rule for ${selector} in builder.css`)
}

/**
 * What the client's markdown says — its rendering unmistakable, and an injection
 * payload sitting in the middle of it.
 *
 * THE PAYLOAD IS IN THE FIXTURE ITSELF rather than in a second one beside it. A
 * `.md` can be FETCHED from an address as easily as dropped from a desk
 * (`/api/material/fetch`), so these bytes are not necessarily the client's own —
 * which is the whole reason AC-1814 is about a scrubber rather than about taste,
 * and the reason every rendering of this document below has to survive it.
 */
const MARKDOWN =
  'Gold on **cream**.\n\n<script>steal()</script>\n\n- narrow counter\n- and a long descender\n'

/** A description carrying the same payload — the second thing rendered as markdown. */
const DESCRIPTION_PAYLOAD = 'A brand book in **gold**.<script>steal()</script>'

/**
 * What the client's `.txt` says.
 *
 * DELIBERATELY MARKDOWN-SHAPED. The leading `# ` and the `*` are what a parser
 * would eat, so a `.txt` that survives them intact is the mechanical form of
 * "plain text is never put through the markdown renderer".
 */
const TEXT = '# Not a heading\n\nline one\nline two\n\n* not a bullet *\n'

/** An uploaded HTML document — markup that must be SHOWN rather than RUN. */
const HTML = '<h1>The brief</h1>\n<script>steal()</script>\n'

/** Markdown whose bytes are held until this suite releases them. */
const SLOW = 'Held **open**.'

/** The uid whose file route never answers until {@link release} says so. */
const HELD = 'material-slow'

/**
 * The tenant's material.
 *
 * FOUR `document`s THAT MUST RENDER FOUR WAYS, plus the image and the font that
 * must keep exactly the pane they had before a reader existed, plus the two
 * records whose bytes do not arrive.
 */
const MATERIAL = [
  row('material-md', 'Positioning notes', 'positioning.md', 'document', 'text/markdown'),
  row('material-txt', 'The export', 'export.txt', 'document', 'text/plain'),
  row('material-html', 'The brief', 'brief.html', 'document', 'text/html'),
  row('material-pdf', 'Brand guidelines', 'guidelines.pdf', 'document', 'application/pdf'),
  row('material-bin', 'The model', 'model.xyz', 'document', 'application/octet-stream'),
  row('material-font', 'The brand face', 'brand.woff2', 'font', 'font/woff2'),
  row('material-img', 'The wordmark', 'wordmark.svg', 'image', 'image/svg+xml'),
  row('material-gone', 'The lost note', 'lost.md', 'document', 'text/markdown'),
  row(HELD, 'The slow note', 'slow.md', 'document', 'text/markdown'),
]

function row(
  uid: string,
  title: string,
  filename: string,
  kind: string,
  content_type: string,
): Record<string, unknown> {
  return {
    uid,
    type: 'material',
    title,
    filename,
    kind,
    content_type,
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
  }
}

/** What the file route answers for each uid — the bytes, as themselves. */
const BYTES: Record<string, string> = {
  'material-md': MARKDOWN,
  'material-txt': TEXT,
  'material-html': HTML,
  'material-img': '<svg/>',
}

/**
 * The description the item route adds to a row.
 *
 * `material-txt` has NONE, which is the case AC-1815's placeholder clause is
 * about: an empty description must keep the component's own answer rather than
 * become a rendered blank.
 */
const BODIES: Record<string, string> = {
  'material-md': DESCRIPTION_PAYLOAD,
  'material-txt': '',
}

function transportOver() {
  return {
    list: async () => ({ material: MATERIAL.map((r) => ({ ...r })) }),
    item: async (uid: string) => ({
      ...MATERIAL.find((r) => r.uid === uid)!,
      body: BODIES[uid] ?? 'Something the platform read.',
    }),
    save: async (uid: string, body: string) => ({
      ...MATERIAL.find((r) => r.uid === uid)!,
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
 * font, which has no reader at all. {@link HELD} is answered by a promise this
 * suite resolves, which is how "still arriving" and "arrives while the dialog is
 * already open" become observable rather than raced for.
 */
let fetched: string[]
let pending: Map<string, (response: Response) => void>

function installFetch() {
  fetched = []
  pending = new Map()
  globalThis.fetch = vi.fn(async (input: unknown) => {
    const url = String(input)
    fetched.push(url)
    const uid = new URL(url, 'https://app.test').searchParams.get('uid') ?? ''
    if (uid === HELD) return new Promise<Response>((resolve) => pending.set(uid, resolve))
    if (!(uid in BYTES)) return new Response('gone', { status: 404 })
    return new Response(BYTES[uid], { status: 200 })
  }) as never
}

/** Let the held bytes arrive. */
function release(text: string) {
  pending.get(HELD)!(new Response(text, { status: 200 }))
  pending.delete(HELD)
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
  // it did not ask for — and the escaped-source assertions are the ones that would
  // then quietly stop meaning anything.
  if (WEBUI_INSTALLED) {
    setSanitizer(null)
    setParser(null)
  }
})

/**
 * Install the engines: a real-enough markdown parser and a scrubber that scrubs.
 *
 * THE SANITIZER IS NOT A PASS-THROUGH HERE, because AC-1814's claim is that the
 * Library renders THROUGH this seam — and a pass-through would pass whether the
 * seam was reached or not. A scrubber that actually removes the payload makes
 * the seam's involvement the only way the assertion can hold.
 */
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
  setSanitizer((html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, ''))
}

/** Only the parser, so "rendered" and "scrubbed" can be told apart. */
function installParserWithoutScrubber() {
  installEngines()
  setSanitizer(null)
}

/** A mounted Library over the fixture, already loaded, with one row selected. */
async function detailFor(uid: string, over: Record<string, unknown> = {}) {
  root.replaceChildren()
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
  return { panel, detail: panel.element.querySelector('.list-detail-detail-body')! as HTMLElement }
}

const readerBody = (scope: ParentNode) =>
  scope.querySelector('.builder-reader__body') as HTMLElement | null

const downloadIn = (scope: ParentNode) =>
  scope.querySelector('.builder-library__download') as HTMLAnchorElement

/** The description's read cell — the component's own element, repainted in place. */
const descriptionCell = (scope: ParentNode) =>
  scope.querySelector(
    '.builder-library__description .fields-row[data-field="body"] > .fields-value',
  ) as HTMLElement

describe.skipIf(!WEBUI_INSTALLED)(
  'AC-1811 — the content type chooses the reader, bounded above the record, download kept',
  () => {
    it('test_UAT_AC1811_each_content_type_gets_its_own_bounded_reader_above_the_record_with_the_download_intact', async () => {
      installEngines()

      // ── markdown: the markdown, rendered ──────────────────────────────────
      const md = await detailFor('material-md')
      const mdBody = readerBody(md.detail)!
      expect(mdBody.querySelector('strong')?.textContent).toBe('cream')
      expect([...mdBody.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
        'narrow counter',
        'and a long descender',
      ])
      // RENDERED, NOT LISTED: the markers are gone and real elements stand in
      // their place — the difference between showing a document and its source.
      expect(mdBody.textContent).not.toContain('**')

      // ABOVE THE RECORD, which is the placement the pane already teaches with an
      // image: the file, then the rights record, then what it says. A fifty-page
      // brand book must not push the rights record off the bottom of a pane whose
      // job is to show them together.
      const preview = md.detail.querySelector('.builder-library__preview')!
      const rights = md.detail.querySelector('.builder-library__rights')!
      expect(preview.contains(mdBody)).toBe(true)
      expect(
        preview.compareDocumentPosition(rights) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(downloadIn(md.detail).getAttribute('download')).toBe('positioning.md')

      // BOUNDED AND SCROLLING, AT THE HEIGHT A PICTURE ALREADY OCCUPIES — read
      // off the stylesheet, because the two numbers being the SAME number is the
      // claim, and a hardcoded `320px` here would pass a pane that had drifted.
      const window_ = ruleFor('.builder-reader__body')
      const picture = ruleFor('.builder-library__image')
      expect(window_).toMatch(/overflow:\s*auto/)
      const cap = window_.match(/max-height:\s*([^;]+);/)![1].trim()
      expect(picture).toContain(`max-height: ${cap}`)

      // ── any other text: itself, with its own line breaks kept ─────────────
      const txt = await detailFor('material-txt')
      const pre = readerBody(txt.detail)!.querySelector('.builder-reader__text')!
      expect(pre.tagName).toBe('PRE')
      // ITS OWN CHARACTERS, ALL OF THEM — nothing parsed out of it.
      expect(pre.textContent).toBe(TEXT)
      expect(pre.textContent).toContain('line one\nline two')
      expect(downloadIn(txt.detail).getAttribute('download')).toBe('export.txt')

      // ── a PDF: the browser's own viewer, at the same address ──────────────
      const before = fetched.length
      const pdf = await detailFor('material-pdf')
      const frame = readerBody(pdf.detail)!.querySelector(
        '.builder-reader__frame',
      ) as HTMLIFrameElement
      expect(frame.tagName).toBe('IFRAME')
      // THE SAME URL THE DOWNLOAD LINK POINTS AT, so the bytes are fetched once:
      // the route already serves `content-disposition: inline`, which is exactly
      // what the built-in viewer needs.
      expect(frame.getAttribute('src')).toBe('/api/material/file?uid=material-pdf')
      expect(frame.getAttribute('src')).toBe(downloadIn(pdf.detail).getAttribute('href'))
      expect(frame.title).toBe('guidelines.pdf')
      // AND NOT READ A SECOND TIME. A fetch here would double the transfer to
      // show the file once.
      expect(fetched.slice(before)).toEqual([])
      expect(downloadIn(pdf.detail).getAttribute('download')).toBe('guidelines.pdf')

      // ── a picture: rendered in place, as it always was ────────────────────
      const img = await detailFor('material-img')
      const picture_ = img.detail.querySelector('.builder-library__image') as HTMLImageElement
      expect(picture_.getAttribute('src')).toBe('/api/material/file?uid=material-img')
      expect(img.detail.querySelector('.builder-reader')).toBe(null)
      expect(downloadIn(img.detail).getAttribute('download')).toBe('wordmark.svg')

      // ── anything else: the download link alone, exactly the pane it had ───
      for (const [uid, filename] of [
        ['material-font', 'brand.woff2'],
        ['material-bin', 'model.xyz'],
      ] as const) {
        const opaque = await detailFor(uid)
        expect(opaque.detail.querySelector('.builder-reader')).toBe(null)
        expect(opaque.detail.querySelector('.builder-reader__expand')).toBe(null)
        expect(downloadIn(opaque.detail).getAttribute('download')).toBe(filename)
      }

      // ── and while the bytes are still arriving, it says it is reading ─────
      // A bounded window that is simply blank is indistinguishable from a
      // document with nothing in it, and the pane's whole claim is that a client
      // can tell what they are looking at.
      const slow = await detailFor(HELD)
      expect(readerBody(slow.detail)!.textContent).toMatch(/Reading…/)
      expect(downloadIn(slow.detail).getAttribute('download')).toBe('slow.md')
    })
  },
)

describe.skipIf(!WEBUI_INSTALLED)(
  'AC-1812 — the expand control opens the same document in the workspace’s own dialog',
  () => {
    it('test_UAT_AC1812_expanding_opens_the_same_material_at_modal_size_and_browsing_away_takes_it', async () => {
      installEngines()

      // OPENED WHILE THE BYTES ARE STILL HELD, so the claim that the expanded
      // window and the pane's window are the SAME MATERIAL has something to be
      // wrong about: content that arrives after the dialog is open must reach
      // both, not only whichever surface happened to be showing when it landed.
      const { panel, detail } = await detailFor(HELD)
      const paneBody = readerBody(detail)!
      const button = detail.querySelector('.builder-reader__expand') as HTMLButtonElement
      expect(button.type).toBe('button')
      expect(button.getAttribute('aria-label')).toBe('Open this in a larger window')

      expect(document.querySelector('.builder-modal')).toBe(null)
      button.click()

      // THE WORKSPACE'S OWN DIALOG SHELL, not a second one invented here — which
      // is why Escape, the backdrop and the close button below all work without
      // this pane defining any of them. And it is NAMED FOR THE FILE.
      const modal = () => document.querySelector('.builder-modal')
      expect(modal()!.getAttribute('role')).toBe('dialog')
      expect(modal()!.getAttribute('aria-modal')).toBe('true')
      expect(modal()!.getAttribute('aria-label')).toBe('slow.md')
      // The width rule keys on this box's presence — a reader dialog is a reading
      // width, not the width a one-sentence message gets.
      expect(modal()!.querySelector('.builder-modal__reader')).toBeTruthy()

      const modalBody = () =>
        document.querySelector('.builder-reader__body--modal') as HTMLElement
      expect(modalBody().textContent).toMatch(/Reading…/)

      release(SLOW)
      await settle()

      // THE SAME CONTENT, AT MODAL SIZE — and it reached the pane's own window
      // too, rather than the dialog having emptied it to fill itself.
      expect(modalBody().querySelector('strong')?.textContent).toBe('open')
      expect(paneBody.querySelector('strong')?.textContent).toBe('open')

      // THREE WAYS OUT, ALL OF THEM THE SHELL'S, and the control reopens it every
      // time — which is what would break if closing had not released the dialog
      // it was holding. The pane's own reader is left where it was.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(modal()).toBe(null)
      expect(paneBody.querySelector('strong')?.textContent).toBe('open')

      button.click()
      ;(document.querySelector('.builder-modal__backdrop') as HTMLElement).click()
      expect(modal()).toBe(null)

      button.click()
      ;(document.querySelector('.builder-modal__btn') as HTMLElement).click()
      expect(modal()).toBe(null)

      button.click()
      expect(modalBody().querySelector('strong')?.textContent).toBe('open')

      // AND IT BELONGS TO THE MATERIAL IT WAS OPENED FROM. `list-detail` swaps
      // details as the client browses, and an expanded document left hanging over
      // the row that replaced it is the failure that would be reported as a bug.
      panel.listDetail.select('material-txt')
      await settle()
      await settle()

      expect(modal()).toBe(null)
      expect(
        panel.element.querySelector('.builder-reader__text')?.textContent,
      ).toBe(TEXT)
    })
  },
)

describe.skipIf(!WEBUI_INSTALLED)(
  'AC-1814 — one render-then-sanitize path, markup shown as source, an SVG left a picture',
  () => {
    it('test_UAT_AC1814_rendered_markdown_is_scrubbed_by_the_shared_path_and_markup_is_never_run', async () => {
      // ── both rendered surfaces go through the one path ────────────────────
      installEngines()
      const scrubbed = await detailFor('material-md')

      // THE READER. The payload is gone and the document survived it, which is
      // only possible if the bytes went through the seam the scrubber is on.
      const body = readerBody(scrubbed.detail)!
      expect(body.querySelector('script')).toBe(null)
      expect(body.textContent).not.toContain('steal')
      expect(body.querySelector('strong')?.textContent).toBe('cream')

      // THE DESCRIPTION — the second thing the Library renders as markdown, and
      // rendered through the SAME path rather than a second scrubbing rule for
      // the same trust level.
      const cell = descriptionCell(scrubbed.detail)
      expect(cell.querySelector('script')).toBe(null)
      expect(cell.textContent).not.toContain('steal')
      expect(cell.querySelector('strong')?.textContent).toBe('gold')

      // ── and where that path has no scrubber, it degrades to escaped source ─
      // A plainer pane, never a live one: unscrubbed markup is not an acceptable
      // fallback for a scrubber that did not load.
      installParserWithoutScrubber()
      const plain = await detailFor('material-md')
      const plainBody = readerBody(plain.detail)!
      expect(plainBody.dataset.readerPaint).toBe('escaped')
      expect(plainBody.querySelector('script')).toBe(null)
      expect(plainBody.querySelector('strong')).toBe(null)
      expect(plainBody.textContent).toContain('<script>steal()</script>')
      const plainCell = descriptionCell(plain.detail)
      expect(plainCell.querySelector('script')).toBe(null)
      expect(plainCell.textContent).toContain('<script>steal()</script>')

      // ── a file that is itself markup is shown as its source, not run ──────
      installEngines()
      const html = await detailFor('material-html')
      const htmlBody = readerBody(html.detail)!
      const pre = htmlBody.querySelector('.builder-reader__text')!
      expect(pre.tagName).toBe('PRE')
      expect(pre.textContent).toBe(HTML)
      // The text a client wrote, not the markup it describes: this pane is not a
      // place where a supplied document executes.
      expect(htmlBody.querySelector('h1')).toBe(null)
      expect(htmlBody.querySelector('script')).toBe(null)
      expect(htmlBody.classList.contains('md-body')).toBe(false)

      // ── plain text is never put through the markdown renderer ─────────────
      // The engines ARE present, so nothing here is an accident of their absence:
      // this file is not parsed because it is not markdown.
      const txt = await detailFor('material-txt')
      const txtBody = readerBody(txt.detail)!
      expect(txtBody.querySelector('.builder-reader__text')!.textContent).toBe(TEXT)
      expect(txtBody.querySelector('h1')).toBe(null)
      expect(txtBody.querySelector('em')).toBe(null)
      expect(txtBody.classList.contains('md-body')).toBe(false)

      // ── an SVG stays a picture ────────────────────────────────────────────
      const svg = await detailFor('material-img')
      expect(svg.detail.querySelector('.builder-library__image')).toBeTruthy()
      expect(svg.detail.querySelector('.builder-reader')).toBe(null)
      // It decodes as text and is the one textual thing the reader refuses:
      // showing a client their own logo as angle brackets would be a regression
      // dressed as a feature.
      expect(readerKind('image/svg+xml')).toBe(null)
    })
  },
)

describe.skipIf(!WEBUI_INSTALLED)(
  'AC-1815 — a surface painted before the engines settle repaints once they do',
  () => {
    it('test_UAT_AC1815_a_cold_pane_upgrades_itself_including_an_open_expanded_window_and_keeps_its_editability', async () => {
      // THE COLD LOAD, HELD OPEN. Under vitest the real CDN import fails within a
      // macrotask, so the race the operator hit is not reproducible by waiting —
      // the signal is injected, and this suite decides the moment of it.
      const engines = deferred()
      const cold = await detailFor('material-md', { markdownReady: engines.promise })

      // Honest, and not what the client should be left with: with no engine there
      // is nothing to render with, so the source is escaped rather than injected
      // raw. Both surfaces are in that state.
      const paneBody = readerBody(cold.detail)!
      expect(paneBody.dataset.readerPaint).toBe('escaped')
      expect(paneBody.textContent).toContain('**cream**')
      const cell = descriptionCell(cold.detail)
      expect(cell.textContent).toContain('**gold**')

      // EXPANDED WHILE STILL HELD, so the repaint has an already-open dialog to
      // reach: a client reading a long document during a cold start should see it
      // upgrade in place rather than close and reopen it.
      ;(cold.detail.querySelector('.builder-reader__expand') as HTMLButtonElement).click()
      const modalBody = () =>
        document.querySelector('.builder-reader__body--modal') as HTMLElement
      expect(modalBody().textContent).toContain('**cream**')

      installEngines()
      engines.resolve()
      await settle()

      // AND NOW ALL THREE ARE THE DOCUMENT, with nothing reopened, reloaded or
      // touched.
      expect(paneBody.dataset.readerPaint).toBe('rendered')
      expect(paneBody.querySelector('strong')?.textContent).toBe('cream')
      expect(modalBody().querySelector('strong')?.textContent).toBe('cream')
      expect(cell.querySelector('strong')?.textContent).toBe('gold')

      // THE READ CELL KEPT ITS OWN IDENTITY ACROSS THE REPAINT — the component's
      // element, repainted in place rather than replaced. Replacing it would take
      // the click-to-edit affordance and both listeners with it, and the pane
      // would have traded its editability for its rendering.
      expect(descriptionCell(cold.detail)).toBe(cell)
      expect(cell.classList.contains('fields-value-editable')).toBe(true)
      cell.click()
      const control = cold.detail.querySelector(
        '.builder-library__description textarea',
      ) as HTMLTextAreaElement
      // Over the SOURCE, not the rendered result: what they correct is what is
      // stored.
      expect(control.value).toBe(DESCRIPTION_PAYLOAD)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      // ── engines that never arrive settle the wait too ─────────────────────
      // Offline stays a plainer panel; it does not become a panel that waits
      // forever or shows nothing.
      setSanitizer(null)
      setParser(null)
      const never = deferred()
      const offline = await detailFor('material-md', { markdownReady: never.promise })
      never.resolve()
      await settle()
      const offlineBody = readerBody(offline.detail)!
      expect(offlineBody.dataset.readerPaint).toBe('escaped')
      expect(offlineBody.textContent).toContain('**cream**')
      expect(descriptionCell(offline.detail).textContent).toContain('**gold**')

      // ── a description with nothing in it keeps its placeholder ────────────
      installEngines()
      const undescribed = await detailFor('material-txt')
      const emptyCell = descriptionCell(undescribed.detail)
      expect(emptyCell.classList.contains('fields-value-empty')).toBe(true)
      expect(emptyCell.classList.contains('md-body')).toBe(false)
      expect(
        undescribed.detail.querySelector('.builder-library__status')!.textContent,
      ).toMatch(/Nothing has read this yet/i)

      // ── and a record whose bytes never arrive says so ─────────────────────
      // The same sentence the missing-picture case uses, because it is the same
      // failure: a record naming absent bytes.
      const gone = await detailFor('material-gone')
      const goneBody = readerBody(gone.detail)!
      expect(goneBody.textContent).toContain('That file is no longer in storage.')
      expect(goneBody.querySelector('strong')).toBe(null)
    })
  },
)
