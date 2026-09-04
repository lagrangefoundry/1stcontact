// @vitest-environment jsdom
/**
 * story-1144410d — **the way in, from the browser**: the one question, and what
 * each of the two entry points does with the answer.
 *
 * WHAT THIS FILE PROVES AND WHAT ITS SIBLING DOES. The story has two halves that
 * fail in completely different ways. This one is the SURFACE: that the question
 * is raised by a file drag and by nothing else, that it offers exactly two
 * answers and never chooses one on the client's behalf, that it can be declined,
 * that every answer is reachable without dragging, and that a conversation-route
 * drop becomes the client's own turn while a Library-route drop does not.
 * `reconciliation-material-upload-origin.workers.test.ts` is the CONTRACT — what
 * the answer does to the rights record and what "put it on the site" actually
 * puts there — against real D1 and real R2.
 *
 * THE REAL OVERLAY AND THE REAL BUILDER. `createUploadOverlay` is the module the
 * browser runs; `mountBuilder` is the real composition, mounted against the
 * actually-installed components. The ONE double is the HTTP transport, for the
 * reason every other builder suite gives: it is the network. Where a claim is
 * about what the browser does with what the origin RECORDED (AC-1587), the
 * stand-in keeps records and answers `list` from them, so the row under
 * assertion is one the browser read back rather than one it made up.
 *
 * WHAT A HEADLESS RUN CANNOT SEE, named rather than skipped. jsdom has no drag
 * source, so the `DataTransfer` a real drag carries is constructed here — the
 * two properties the code reads (`types` and `files`) and nothing else. What
 * that leaves unproven is the browser's own drag plumbing; what it proves is
 * every decision this module makes about it. Likewise a real file chooser never
 * opens: the observable stand-in is the click the overlay puts on its own
 * `<input type="file">`, which is the only thing a page can do to open one.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { UPLOAD_AREAS, UPLOAD_PROMPT } from '../apps/control-app/src/builder/config.js'

let createUploadOverlay: (spec: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`story-1144410d surface suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ slug: 'alpha', latest: 1 }]
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

/** A drag carrying files, as far as anything in `upload.js` can tell. */
function fileDrag(type: string, files: File[] = []): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'], files } })
  return event
}

/** A drag carrying something that is not a file — text, a link, a page element. */
function otherDrag(type: string, kind = 'text/plain'): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { types: [kind], files: [] } })
  return event
}

const aFile = (name = 'logo.png', type = 'image/png') => new File(['bytes'], name, { type })

const escape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

beforeAll(async () => {
  ;({ createUploadOverlay } = await import('../apps/control-app/src/builder/upload.js'))
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
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

let host: HTMLElement
const teardown: Array<() => void> = []

beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  // The overlay listens on `document` for Escape, so a suite that left instances
  // behind would have a keypress answered by four detached overlays at once.
  while (teardown.length) teardown.pop()!()
})

/** The overlay alone, plus a log of everything it committed. */
function overlayWithLog() {
  const uploads: Array<{ names: string[]; role: string; source: string | null }> = []
  const overlay = createUploadOverlay({
    host,
    onUpload: (files: File[], role: string, source: string | null) =>
      void uploads.push({ names: files.map((f) => f.name), role, source }),
  }) as unknown as {
    element: HTMLElement
    open: (from?: string | null) => void
    close: () => void
    watch: (target: Element, from?: string | null) => () => void
    isOpen: () => boolean
    destroy: () => void
  }
  teardown.push(() => overlay.destroy())
  return { overlay, uploads }
}

const areasOf = (element: HTMLElement) =>
  [...element.querySelectorAll('.builder-upload__area')] as HTMLElement[]

const areaFor = (element: HTMLElement, role: string) =>
  element.querySelector(`[data-role="${role}"]`) as HTMLElement

/**
 * A stand-in origin that KEEPS WHAT IT WAS SENT and answers `list` from it.
 *
 * A transport that returned a fixed list could not tell "the browser re-read the
 * store" from "the browser drew what it had just sent" — which is precisely the
 * distinction AC-1587 is about. So the envelope this returns deliberately
 * carries LESS than the row: no `site_slug`, no `description_status`, no
 * `filename`. Anything the Library shows from those fields, it read back.
 */
function fakeOrigin() {
  const rows: Array<Record<string, unknown>> = []
  const sent: Array<{ name: string; role: string; slug: string | undefined }> = []
  let listed = 0
  let n = 0
  const transport = {
    list: async () => {
      listed++
      return { material: rows.map((row) => ({ ...row })) }
    },
    item: async () => ({ body: 'what we said it is' }),
    save: async () => ({}),
    fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
    upload: async ({ file, role, slug }: { file: File; role: string; slug?: string }) => {
      n++
      const uid = `material-${n}`
      sent.push({ name: file.name, role, slug })
      const siteAsset = role === 'site' && slug ? file.name : null
      rows.unshift({
        uid,
        type: 'material',
        title: file.name,
        filename: file.name,
        kind: 'image',
        role,
        rights: 'owned',
        republishable: role !== 'reference',
        exportable: false,
        origin: 'uploaded',
        site_slug: siteAsset ? slug : null,
        source_url: null,
        description_status: 'ok',
        description_model: 'stub/vision-1',
        updated_at: `2026-09-03T00:00:${String(n).padStart(2, '0')}.000Z`,
      })
      return { uid, role, site_asset: siteAsset, indexed: true }
    },
  }
  return { transport, sent, rows, listCount: () => listed }
}

/** The real builder, with only the network injected. */
function mount(over: Record<string, unknown> = {}) {
  const app = mountBuilder(host, {
    sites: SITES,
    storage: memoryStorage(),
    chatTransport: {
      openSession: async (slug: string) => ({
        sessionId: `session-${slug}`,
        turns: [],
        ready: true,
      }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    ...over,
  }) as unknown as {
    chat: { element: HTMLElement; getChat: () => { getMessages: () => Array<{ role: string; markdown: string }> } | null }
    library: { element: HTMLElement; getRows: () => Array<Record<string, unknown>> }
    upload: { element: HTMLElement; isOpen: () => boolean; close: () => void }
    destroy: () => void
  }
  teardown.push(() => app.destroy())
  return app
}

/** Mount the builder over a stand-in origin that keeps records. */
function mountOverOrigin(over: Record<string, unknown> = {}) {
  const origin = fakeOrigin()
  const app = mount({ libraryTransport: origin.transport, ...over })
  return { app, ...origin }
}

/** Drop `files` onto `role`'s answer, having raised the question from `entry`. */
function dropOnto(
  app: { chat: { element: HTMLElement }; library: { element: HTMLElement }; upload: { element: HTMLElement } },
  entry: 'chat' | 'library',
  role: string,
  files: File[],
) {
  app[entry].element.dispatchEvent(fileDrag('dragenter'))
  areaFor(app.upload.element, role).dispatchEvent(fileDrag('drop', files))
}

// ── AC-1571: one question surface, however many places watch for a file ───────

describe.skipIf(!WEBUI_INSTALLED)('story-1144410d — two entry points, one question', () => {
  it('test_UAT_AC1571_dragging_onto_either_entry_point_raises_the_same_one_question', async () => {
    // The conversational moment (the assistant asks "do you have a logo?") and
    // the deliberate one (material that is not part of this conversation) are
    // different moments and the SAME decision — so they must not be two
    // different questions, and must not be the same question asked twice.
    const app = mount()
    await settle()

    const overlays = host.querySelectorAll('.builder-upload')
    expect(overlays, 'one question surface, not one per entry point').toHaveLength(1)
    expect(app.upload.isOpen()).toBe(false)

    app.chat.element.dispatchEvent(fileDrag('dragenter'))
    expect(app.upload.isOpen()).toBe(true)
    expect(app.upload.element.textContent).toContain(UPLOAD_PROMPT)
    app.upload.close()

    app.library.element.dispatchEvent(fileDrag('dragenter'))
    expect(app.upload.isOpen()).toBe(true)
    // THE SAME INSTANCE, not a second one that happens to look alike — which is
    // the only way "never asked two different questions" can be true rather than
    // merely true today.
    expect(app.upload.element).toBe(overlays[0])
    expect(host.querySelectorAll('.builder-upload')).toHaveLength(1)
  })
})

// ── AC-1572: exactly two answers, each saying what it means ───────────────────

describe('story-1144410d — the question and its two answers', () => {
  it('test_UAT_AC1572_the_question_offers_exactly_two_answers_each_saying_what_it_means', () => {
    const { overlay } = overlayWithLog()

    // ONE TOP-LEVEL QUESTION, ABOUT PURPOSE. Not "what kind of file is this" —
    // the content type already answers that — but the one thing that cannot be
    // read off the bytes.
    const headings = overlay.element.querySelectorAll('.builder-upload__prompt')
    expect(headings).toHaveLength(1)
    expect(headings[0].textContent).toBe(UPLOAD_PROMPT)

    // EXACTLY TWO ANSWERS AND NO OTHERS.
    const areas = areasOf(overlay.element)
    expect(areas).toHaveLength(2)
    expect(areas.map((a) => a.dataset.role)).toEqual(['site', 'reference'])

    // EACH SAYS WHAT IT MEANS, in a label and an explanatory line — and the copy
    // is declared once, where every other label in this builder is.
    for (const [i, area] of UPLOAD_AREAS.entries()) {
      const label = areas[i].querySelector('.builder-upload__label')
      const hint = areas[i].querySelector('.builder-upload__hint')
      expect(label?.textContent).toBe(area.label)
      expect(hint?.textContent).toBe(area.hint)
      expect(String(hint?.textContent ?? '')).not.toBe('')
    }

    // THE FIRST ANSWER PROMISES VISITORS WILL SEE IT.
    expect(areaFor(overlay.element, 'site').textContent).toMatch(/visitors will see/i)

    // THE SECOND SUB-LINE IS THE LOAD-BEARING ONE, not decoration: a client
    // uploading a private document needs the assurance at the moment they are
    // deciding where to put it, not in a settings pane afterwards.
    const read = areaFor(overlay.element, 'reference')
    expect(read.textContent).toMatch(/I'll use these to understand your business/)
    expect(read.textContent).toContain("won't appear on your site")
  })
})

// ── AC-1573 lives in the workerd sibling: it is a claim about the rights record.

// ── AC-1574: every answer reachable without dragging ──────────────────────────

describe('story-1144410d — reachable without dragging', () => {
  it('test_UAT_AC1574_activating_an_answer_opens_the_file_chooser_and_creates_under_it', () => {
    // Drag is a gesture some people cannot perform and some devices do not
    // offer, so each answer has to be an ordinary control that reaches the same
    // outcome.
    const { overlay, uploads } = overlayWithLog()
    const input = overlay.element.querySelector('.builder-upload__input') as HTMLInputElement

    // OPENING THE CHOOSER, as observably as a page can: clicking the file input
    // is the only thing that opens the system chooser, so a click landing there
    // IS the chooser opening.
    const opened: number[] = []
    input.addEventListener('click', () => opened.push(opened.length))

    for (const [i, area] of UPLOAD_AREAS.entries()) {
      overlay.open('library')
      const control = areaFor(overlay.element, area.id)
      // AN ORDINARY CONTROL, which is what makes keyboard activation the
      // platform's job rather than a second code path: a `<button>` is activated
      // by Enter and Space without this module doing anything about it.
      expect(control.tagName).toBe('BUTTON')
      expect((control as HTMLButtonElement).type).toBe('button')

      control.click()
      expect(opened).toHaveLength(i + 1)

      Object.defineProperty(input, 'files', {
        value: [aFile(`chosen-${area.id}.png`)],
        configurable: true,
      })
      input.dispatchEvent(new Event('change'))
    }

    // THE SAME OUTCOME AS A DRAG ONTO IT: created under exactly the answer that
    // was activated, and carrying the entry point it was activated from.
    expect(uploads).toEqual([
      { names: ['chosen-site.png'], role: 'site', source: 'library' },
      { names: ['chosen-reference.png'], role: 'reference', source: 'library' },
    ])

    // AND THE SAME FILE A SECOND TIME. A file input does not fire `change` when
    // re-given a value it already holds, so a client who picked the wrong file,
    // dismissed, and picked the same one again would be met with silence.
    overlay.open('library')
    areaFor(overlay.element, 'site').click()
    Object.defineProperty(input, 'files', {
      value: [aFile('chosen-site.png')],
      configurable: true,
    })
    input.dispatchEvent(new Event('change'))
    expect(uploads).toHaveLength(3)
    expect(uploads[2]).toEqual({ names: ['chosen-site.png'], role: 'site', source: 'library' })
  })
})

// ── AC-1575: released on neither answer ───────────────────────────────────────

describe('story-1144410d — nothing is created without an answer', () => {
  it('test_UAT_AC1575_a_file_released_on_neither_answer_creates_nothing_and_says_what_is_missing', () => {
    // BOTH POSSIBLE DEFAULTS ARE SILENTLY WRONG — one publishes what the client
    // marked private, the other withholds the photograph they meant to publish —
    // so the only correct answer to an ambiguous release is to keep asking.
    const { overlay, uploads } = overlayWithLog()
    overlay.open('chat')

    overlay.element.dispatchEvent(fileDrag('drop', [aFile('hero.jpg', 'image/jpeg')]))

    expect(uploads).toEqual([])
    // THE SURFACE STAYS OPEN: the client is mid-gesture and has simply missed, so
    // closing would discard the drag they were part-way through making.
    expect(overlay.isOpen()).toBe(true)
    // BOTH ANSWERS ARE MARKED, never one — marking either would be the
    // recommendation this surface exists not to make.
    expect(overlay.element.querySelectorAll('.builder-upload__area.is-asking')).toHaveLength(2)
    // AND IT SAYS WHAT IS MISSING.
    const note = overlay.element.querySelector('.builder-upload__note') as HTMLElement
    expect(note.textContent).toMatch(/one of these two/)

    // THE FILE IS NOT DISCARDED: releasing it onto an answer creates it normally.
    areaFor(overlay.element, 'site').dispatchEvent(
      fileDrag('drop', [aFile('hero.jpg', 'image/jpeg')]),
    )
    expect(uploads).toEqual([{ names: ['hero.jpg'], role: 'site', source: 'chat' }])
  })
})

// ── AC-1576: a drag that is not carrying files ────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-1144410d — only a file raises the question', () => {
  it('test_UAT_AC1576_a_drag_not_carrying_files_never_raises_the_question_at_either_entry_point', async () => {
    // Dragging a selection or a link across the builder must not put a
    // full-screen question about a file over it — the client is not offering us
    // one, so there is nothing to ask about.
    const app = mount()
    await settle()

    for (const entry of ['chat', 'library'] as const) {
      for (const kind of ['text/plain', 'text/uri-list', 'text/html']) {
        app[entry].element.dispatchEvent(otherDrag('dragenter', kind))
        expect(app.upload.isOpen(), `${entry} / ${kind}`).toBe(false)
      }
    }

    // …and a file over each does raise it, so the negative above is a decision
    // about the drag's contents rather than a surface that never opens.
    for (const entry of ['chat', 'library'] as const) {
      app[entry].element.dispatchEvent(fileDrag('dragenter'))
      expect(app.upload.isOpen(), entry).toBe(true)
      app.upload.close()
    }
  })
})

// ── AC-1577: the question can be declined ─────────────────────────────────────

describe('story-1144410d — declining the question', () => {
  it('test_UAT_AC1577_dismissing_the_question_creates_nothing_and_the_next_drag_raises_it_clean', () => {
    // A surface that keeps asking must have an answer that is "neither" —
    // otherwise "keep asking" is a trap rather than a prompt.
    const { overlay, uploads } = overlayWithLog()
    overlay.watch(host, 'library')

    // ── by the dismissal control ──────────────────────────────────────────
    host.dispatchEvent(fileDrag('dragenter'))
    expect(overlay.isOpen()).toBe(true)
    ;(overlay.element.querySelector('.builder-upload__cancel') as HTMLElement).click()
    expect(overlay.isOpen()).toBe(false)
    expect(uploads).toEqual([])

    // ── raise it again and leave it in its "you missed" state ─────────────
    host.dispatchEvent(fileDrag('dragenter'))
    overlay.element.dispatchEvent(fileDrag('drop', [aFile('notes.pdf', 'application/pdf')]))
    expect(overlay.element.querySelectorAll('.builder-upload__area.is-asking')).toHaveLength(2)
    expect(overlay.element.querySelector('.builder-upload__note')!.textContent).not.toBe('')

    // ── by the conventional keyboard escape ───────────────────────────────
    escape()
    expect(overlay.isOpen()).toBe(false)
    expect(uploads).toEqual([])

    // ── and the next drag raises it CLEAN ─────────────────────────────────
    // A leftover "you have to pick one" telling a client off for a decision they
    // already backed out of would be the surface remembering an argument.
    host.dispatchEvent(fileDrag('dragenter'))
    expect(overlay.isOpen()).toBe(true)
    expect(overlay.element.querySelectorAll('.builder-upload__area.is-asking')).toHaveLength(0)
    expect(overlay.element.querySelector('.builder-upload__note')!.textContent).toBe('')
  })
})

// ── AC-1578: several files in one gesture ─────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-1144410d — a folder’s worth at once', () => {
  it('test_UAT_AC1578_several_files_given_to_one_answer_each_become_their_own_record_in_order', async () => {
    // The client's expectation on dropping three photographs is exactly this:
    // three of them, not one, not a bundle, and none of them quietly given a
    // different role from the answer they were handed to.
    const { app, sent, listCount } = mountOverOrigin()
    await settle()
    const before = listCount()

    const files = [
      new File(['a'], 'front.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'courtyard.jpg', { type: 'image/jpeg' }),
      new File(['c'], 'kitchen.jpg', { type: 'image/jpeg' }),
    ]
    dropOnto(app, 'chat', 'reference', files)
    await settle()

    // THREE RECORDS, IN ORDER, ALL UNDER THE ANSWER THEY WERE GIVEN TO.
    expect(sent).toEqual([
      { name: 'front.jpg', role: 'reference', slug: 'alpha' },
      { name: 'courtyard.jpg', role: 'reference', slug: 'alpha' },
      { name: 'kitchen.jpg', role: 'reference', slug: 'alpha' },
    ])

    // Each is its own row in the client's library — none dropped, none merged.
    const rows = app.library.getRows()
    expect(rows.map((r) => r.filename).sort()).toEqual([
      'courtyard.jpg',
      'front.jpg',
      'kitchen.jpg',
    ])
    expect(new Set(rows.map((r) => r.uid)).size).toBe(3)
    for (const row of rows) expect(row.role).toBe('reference')
    expect(listCount()).toBeGreaterThan(before)

    // AND THREE SEPARATE REPORTS, IN THE ORDER THE CLIENT GAVE THEM — which is
    // why the uploads run sequentially rather than racing each other.
    const messages = app.chat.getChat()!.getMessages()
    expect(messages).toHaveLength(3)
    expect(messages.map((m) => m.markdown.match(/\*\*(.+?)\*\*/)?.[1])).toEqual([
      'front.jpg',
      'courtyard.jpg',
      'kitchen.jpg',
    ])
  })
})

// ── AC-1584: the conversation route is the client's own turn ──────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-1144410d — the conversation route', () => {
  it('test_UAT_AC1584_a_conversation_route_drop_is_the_clients_own_turn_naming_the_file', async () => {
    const { app } = mountOverOrigin()
    await settle()

    // ── "put it on the site" ──────────────────────────────────────────────
    dropOnto(app, 'chat', 'site', [new File(['b'], 'logo.png', { type: 'image/png' })])
    await settle()

    let messages = app.chat.getChat()!.getMessages()
    expect(messages).toHaveLength(1)
    // ATTRIBUTED TO THE CLIENT, because handing over a file is something they
    // did — the transcript should read as though they did it.
    expect(messages[0].role).toBe('user')
    expect(messages[0].markdown).toContain('logo.png')
    // …and it says what BECAME of it, naming the asset it was stored under
    // rather than merely reporting that something happened.
    expect(messages[0].markdown).toMatch(/on your site as `logo\.png`/)

    // ── "just for you to read" ────────────────────────────────────────────
    dropOnto(app, 'chat', 'reference', [
      new File(['b'], 'positioning.pdf', { type: 'application/pdf' }),
    ])
    await settle()

    messages = app.chat.getChat()!.getMessages()
    expect(messages).toHaveLength(2)
    expect(messages[1].role).toBe('user')
    expect(messages[1].markdown).toContain('positioning.pdf')
    // The promise the answer made, repeated back at the moment it was kept.
    expect(messages[1].markdown).toMatch(/I'll read it/)
    expect(messages[1].markdown).toContain("won't appear on your site")
  })
})

// ── AC-1585: that turn reports what went wrong ────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-1144410d — the turn is honest about failure', () => {
  it('test_UAT_AC1585_the_turn_reports_a_failed_upload_an_unplaced_file_and_an_unsearchable_one', async () => {
    // A file that was stored but is unfindable is otherwise indistinguishable
    // from a working one to the only person who could tell us — DOC-39 §4 calls
    // that INVISIBILITY rather than staleness — so the turn has to say so.
    const answers: Array<() => Promise<Record<string, unknown>>> = [
      () => Promise.reject(new Error('That file is 25MB, and the limit is 25MB.')),
      async () => ({
        uid: 'material-2',
        role: 'site',
        site_asset: null,
        site_asset_error: "No site 'alpha' in this store.",
        indexed: true,
      }),
      async () => ({ uid: 'material-3', role: 'reference', site_asset: null, indexed: false }),
    ]
    let call = 0
    const app = mount({
      libraryTransport: {
        list: async () => ({ material: [] }),
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
        upload: async () => answers[call++](),
      },
    })
    await settle()

    for (const [i, name] of ['huge.psd', 'unplaceable.png', 'unsearchable.pdf'].entries()) {
      dropOnto(app, 'chat', i === 2 ? 'reference' : 'site', [new File(['b'], name)])
      await settle()
    }

    const said = app.chat.getChat()!.getMessages().map((m) => m.markdown)
    expect(said).toHaveLength(3)

    // ── an upload that did not complete: NOT UPLOADED, with the reason ────
    expect(said[0]).toContain('huge.psd')
    expect(said[0]).toContain("didn't upload")
    expect(said[0]).toContain('the limit is 25MB')
    expect(said[0]).not.toMatch(/\bAdded\b/)

    // ── kept, but not on the site: BOTH halves, never just the good one ───
    expect(said[1]).toContain('unplaceable.png')
    expect(said[1]).toMatch(/\bAdded\b/)
    expect(said[1]).toContain("I couldn't put it on the site yet")
    expect(said[1]).toContain("No site 'alpha' in this store.")

    // ── stored, but nothing can search it yet ─────────────────────────────
    expect(said[2]).toContain('unsearchable.pdf')
    expect(said[2]).toMatch(/\bAdded\b/)
    expect(said[2]).toContain("I've stored it, but I can't search it yet.")
  })
})

// ── AC-1586: the Library route puts no line in the conversation ───────────────

describe.skipIf(!WEBUI_INSTALLED)('story-1144410d — the deliberate route stays out of the transcript', () => {
  it('test_UAT_AC1586_a_library_route_upload_puts_no_line_in_the_conversation', async () => {
    // ── with a conversation open ──────────────────────────────────────────
    const { app, sent } = mountOverOrigin()
    await settle()

    // A transcript with something already in it, so "unchanged" is a real
    // measure rather than "still empty".
    const chat = app.chat.getChat()!
    ;(chat as unknown as { appendMessage: (r: string, m: string) => void }).appendMessage(
      'assistant',
      'Do you have a logo?',
    )
    const before = chat.getMessages().map((m) => `${m.role}:${m.markdown}`)
    expect(before).toHaveLength(1)

    for (const role of ['site', 'reference']) {
      dropOnto(app, 'library', role, [new File(['b'], `${role}.png`, { type: 'image/png' })])
      await settle()
    }

    // EXACTLY AS LONG AND EXACTLY AS IT WAS.
    expect(app.chat.getChat()!.getMessages().map((m) => `${m.role}:${m.markdown}`)).toEqual(before)
    // …while the material was nevertheless created, under both answers.
    expect(sent.map((s) => s.role)).toEqual(['site', 'reference'])
    expect(app.library.getRows()).toHaveLength(2)

    // ── and with no conversation open at all ──────────────────────────────
    // The deliberate path must not depend on there being a transcript to skip.
    document.body.replaceChildren()
    host = document.createElement('div')
    document.body.append(host)
    const solo = mountOverOrigin({ sites: [] })
    await settle()
    expect(solo.app.chat.getChat()).toBeNull()

    dropOnto(solo.app, 'library', 'reference', [new File(['b'], 'brief.pdf')])
    await settle()

    expect(solo.sent).toEqual([{ name: 'brief.pdf', role: 'reference', slug: undefined }])
    expect(solo.app.chat.getChat()).toBeNull()
  })
})

// ── AC-1587: the Library shows what was recorded, without a reload ────────────

describe.skipIf(!WEBUI_INSTALLED)('story-1144410d — the Library catches up by itself', () => {
  it('test_UAT_AC1587_after_either_route_the_library_shows_what_was_recorded_without_a_reload', async () => {
    // Otherwise the deliberate path has no visible consequence at all: the file
    // would be stored and the screen unchanged.
    const { app, listCount } = mountOverOrigin()
    await settle()
    expect(app.library.getRows()).toHaveLength(0)

    for (const [entry, role, name] of [
      ['chat', 'site', 'wordmark.svg'],
      ['library', 'reference', 'guidelines.pdf'],
    ] as const) {
      const listedBefore = listCount()
      dropOnto(app, entry, role, [new File(['b'], name, { type: 'image/svg+xml' })])
      await settle()

      // RE-READ FROM THE ORIGIN, not patched from what the upload answered —
      // which is what makes the row the client sees the row that was recorded.
      expect(listCount(), `${entry} re-reads the list`).toBeGreaterThan(listedBefore)

      const row = app.library.getRows().find((r) => r.filename === name)
      expect(row, `${entry} upload appears without a reload`).toBeTruthy()
      // …carrying the recorded role,
      expect(row!.role).toBe(role)
      // …whether it is on the site currently open,
      expect(row!.site_slug).toBe(role === 'site' ? 'alpha' : null)
      // …and whether anything can yet find it by its contents. NONE of these
      // three is in the upload's own answer: they are decided after the bytes
      // leave the browser, so a row carrying them was read back from the store.
      expect(row!.description_status).toBe('ok')
      expect(row!.description_model).toBe('stub/vision-1')

      // And it is on screen, not merely in the model behind it.
      expect(app.library.element.textContent).toContain(name)
    }

    expect(app.library.getRows()).toHaveLength(2)
  })
})
