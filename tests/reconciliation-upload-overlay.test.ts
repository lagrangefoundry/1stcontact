// @vitest-environment jsdom
/**
 * story-325da65f — **handing a file to the platform: one overlay, two entry
 * points, and the only question it asks**.
 *
 * WHAT THIS FILE PROVES. Its siblings show what a role DOES once the origin has
 * it — `reconciliation-material-ingestion.workers.test.ts` for the rights the
 * pipeline infers, `reconciliation-site-asset-promotion.workers.test.ts` for the
 * placement a role licenses and the one it forbids. This is the half that decides
 * WHICH role is sent, and the claim is very largely a negative one: nothing is
 * ever created without a person having chosen. There is no safe default, because
 * both candidates are silently wrong — *put it on the site* publishes what the
 * client meant to keep private, and *just for you to read* withholds the
 * photograph they meant to publish.
 *
 * TWO LAYERS, AND THEY FAIL DIFFERENTLY. The first describe is the overlay
 * itself: the question, the two areas, what commits a role and what refuses to.
 * It needs nothing but the module and a DOM. The second is the overlay WIRED
 * INTO the real builder — which entry point a handover came from, what the
 * conversation is told, which site travelled with it — and that only exists once
 * `mountBuilder` composes the chat, the Library and the overlay together. The
 * second therefore mounts the actually-installed components, on the pattern the
 * workspace-chrome suites established, and SKIPS with a reported reason on a
 * machine that has not run the out-of-band `webui` install rather than passing
 * while proving nothing.
 *
 * THE ONLY DOUBLES ARE THE NETWORK AND THE DRAG. `libraryTransport.upload` and
 * `chatTransport` stand in for HTTP, for the reason every other builder suite
 * gives: they are the network. And jsdom has no drag source, so the
 * `DataTransfer` a real drag carries is constructed here — the two properties
 * the code reads (`types` and `files`) and nothing else. What that leaves
 * unproven is the browser's own drag plumbing; what it proves is every decision
 * this module makes about it.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/**
 * `upload.js` and `app.js` are loaded DYNAMICALLY, and `config.js` with them: the
 * mounted half imports the webui components by bare specifier, so a static import
 * would fail the whole file at transform time rather than reporting a skip.
 */
let createUploadOverlay: (spec: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let UPLOAD_AREAS: Array<{ id: string; label: string; hint: string }>
let UPLOAD_PROMPT: string

if (!WEBUI_INSTALLED) console.warn(`story-325da65f mounted suites skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ slug: 'alpha', latest: 1 }]

/** One macrotask — the handover awaits the origin per file, then re-reads the list. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function memoryStorage(): Storage {
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
  } as Storage
}

/** A drag carrying files, as far as anything in `upload.js` can tell. */
function fileDrag(type: string, files: File[] = []): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'], files } })
  return event
}

/** A drag carrying something that is not a file — text dragged inside the page. */
function textDrag(type: string): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { types: ['text/plain'], files: [] } })
  return event
}

const aFile = (name = 'logo.png', type = 'image/png') => new File(['bytes'], name, { type })

beforeAll(async () => {
  ;({ createUploadOverlay } = await import('../apps/control-app/src/builder/upload.js'))
  ;({ UPLOAD_AREAS, UPLOAD_PROMPT } = await import('../apps/control-app/src/builder/config.js'))
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
beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

/** The overlay, plus a log of everything it committed. */
function overlayWithLog() {
  const uploads: Array<{ names: string[]; role: string; source: string | null }> = []
  const overlay = createUploadOverlay({
    host,
    onUpload: (files: File[], role: string, source: string | null) =>
      void uploads.push({ names: files.map((f) => f.name), role, source }),
  })
  return { overlay, uploads }
}

const areasOf = (overlay: { element: HTMLElement }) =>
  [...overlay.element.querySelectorAll('.builder-upload__area')] as HTMLElement[]

describe('story-325da65f — the overlay: the one question only the client can answer', () => {
  it('test_UAT_AC1725_the_overlay_asks_what_the_file_is_for_and_states_the_privacy_promise', () => {
    const { overlay } = overlayWithLog()

    // THE PROMPT IS ABOUT PURPOSE. Not "what kind of file is this" — the content
    // type already answers that — but the one thing that cannot be inferred.
    const heading = overlay.element.querySelector('.builder-upload__prompt')
    expect(heading, 'a single top-level prompt').not.toBeNull()
    expect(heading!.textContent).toBe(UPLOAD_PROMPT)

    // EXACTLY TWO ANSWERS, in the order the client reads them, each carrying the
    // stable role identifier the handover will send.
    const areas = areasOf(overlay)
    expect(areas).toHaveLength(2)
    expect(areas.map((a) => a.dataset.role)).toEqual(['site', 'reference'])

    // Each area shows its declared label AND its sub-line of consequences — the
    // copy is declared once, where every label in this builder is.
    for (const area of UPLOAD_AREAS) {
      expect(overlay.element.textContent).toContain(area.label)
      expect(overlay.element.textContent).toContain(area.hint)
    }

    // THE SECOND SUB-LINE IS LOAD-BEARING, not decoration: a client handing over
    // their positioning document wants to know it stays private, and the moment
    // they are deciding where to put it is the moment to say so.
    expect(areas[1].textContent).toContain("won't appear on your site")

    // AND NOTHING ASKS THEM TO CLASSIFY THE FILE. Sorting by type would ask for
    // what the content type already answers; asking who owns it reintroduces the
    // legal question the pipeline deliberately refuses to put to the client.
    const read = overlay.element.textContent!.toLowerCase()
    expect(read).not.toMatch(/\bimage\b|\bdocument\b|\bfont\b/)
    expect(read).not.toMatch(/\bown\b|\bowner\b|\bcopyright\b|\blicen[cs]e\b/)
  })

  it('test_UAT_AC1726_dropping_files_into_an_area_commits_that_role_and_withdraws_the_overlay', () => {
    // Both areas, in turn: the role that is committed is the role of the area
    // dropped into, and the overlay gets out of the way once it has been answered.
    for (const [index, expected] of [
      [0, 'site'],
      [1, 'reference'],
    ] as Array<[number, string]>) {
      const { overlay, uploads } = overlayWithLog()
      overlay.open('library')

      const dropped = aFile(`file-${expected}.bin`, 'application/octet-stream')
      areasOf(overlay)[index].dispatchEvent(fileDrag('drop', [dropped]))

      expect(uploads).toEqual([
        { names: [`file-${expected}.bin`], role: expected, source: 'library' },
      ])
      // Committing gets out of the way — the client is not left deciding
      // something they have already decided.
      expect(overlay.isOpen()).toBe(false)
      overlay.destroy()
    }
  })

  it('test_UAT_AC1727_every_area_is_activatable_without_dragging_and_commits_the_same_role', () => {
    const { overlay, uploads } = overlayWithLog()
    overlay.open('library')

    // EVERY AREA IS A REAL CONTROL, not decorative text: dragging is a gesture
    // some people cannot perform and some devices do not offer.
    const areas = areasOf(overlay)
    for (const area of areas) {
      expect(area.tagName).toBe('BUTTON')
      area.focus()
      expect(document.activeElement, 'reachable by keyboard').toBe(area)
    }

    // Activating one opens the platform's file chooser…
    const input = overlay.element.querySelector('.builder-upload__input') as HTMLInputElement
    const opened: string[] = []
    input.addEventListener('click', () => opened.push('picker'))

    areas[0].click()
    expect(opened, 'activating the area opened the file chooser').toEqual(['picker'])

    // …and the files chosen there are handed over with exactly that area's role,
    // identically to a drop into it.
    Object.defineProperty(input, 'files', {
      value: [aFile('hero.jpg', 'image/jpeg')],
      configurable: true,
    })
    input.dispatchEvent(new Event('change'))

    expect(uploads).toEqual([{ names: ['hero.jpg'], role: 'site', source: 'library' }])
  })

  it('test_UAT_AC1728_a_file_dropped_outside_both_areas_creates_nothing_and_says_what_is_missing', () => {
    // PROMPTING IS THE ONLY CORRECT ANSWER: a default would be silent, and BOTH
    // candidate defaults are wrong in a way nobody would notice — publishing what
    // was meant to stay private, or withholding what was meant to be published.
    const { overlay, uploads } = overlayWithLog()
    overlay.open('chat')

    overlay.element.dispatchEvent(fileDrag('drop', [aFile()]))

    expect(uploads, 'nothing is created and no role is assigned').toEqual([])
    // The overlay STAYS UP: the client is mid-gesture and has simply missed, so
    // closing would discard the drag they were part-way through making.
    expect(overlay.isOpen()).toBe(true)
    expect(overlay.element.querySelector('.builder-upload__note')!.textContent).toMatch(
      /one of these two/,
    )
    // BOTH answers are marked, never one — marking either would be the
    // recommendation this surface exists not to make.
    const asking = overlay.element.querySelectorAll('.builder-upload__area.is-asking')
    expect(asking).toHaveLength(2)
    expect(asking).toHaveLength(areasOf(overlay).length)
  })

  it('test_UAT_AC1729_only_a_file_drag_raises_the_overlay_and_it_stays_up_across_the_workspace', () => {
    const { overlay } = overlayWithLog()
    const target = document.createElement('div')
    const nested = document.createElement('button')
    target.append(nested)
    host.append(target)
    overlay.watch(target, 'library')

    // Dragging a selection inside the page must not put a full-screen upload
    // surface over the builder.
    target.dispatchEvent(textDrag('dragenter'))
    expect(overlay.isOpen()).toBe(false)

    target.dispatchEvent(fileDrag('dragenter'))
    expect(overlay.isOpen()).toBe(true)

    // A COUNTER RATHER THAN A BOOLEAN: `dragenter`/`dragleave` fire for every
    // descendant a drag crosses, and a plain toggle would flicker the overlay
    // away the moment the pointer passed from a panel onto a control inside it.
    nested.dispatchEvent(fileDrag('dragenter'))
    expect(overlay.isOpen()).toBe(true)
    target.dispatchEvent(new Event('dragleave', { bubbles: true }))
    expect(overlay.isOpen(), 'still showing as the drag crosses regions').toBe(true)
    nested.dispatchEvent(fileDrag('dragover'))
    expect(overlay.isOpen()).toBe(true)
  })

  it('test_UAT_AC1734_dismissing_the_overlay_creates_nothing_and_the_next_raise_starts_clean', () => {
    // A surface whose whole claim is "nothing is created without a choice" must
    // also honour the choice to make none — and must not greet the next drag with
    // an accusation about a mistake the client has not yet made.
    for (const dismiss of ['cancel', 'escape']) {
      const { overlay, uploads } = overlayWithLog()
      overlay.open('chat')

      // Miss both areas first, so there is a "you must drop it on one of these
      // two" state to carry over — or not.
      overlay.element.dispatchEvent(fileDrag('drop', [aFile()]))
      expect(overlay.element.querySelector('.builder-upload__note')!.textContent).not.toBe('')

      if (dismiss === 'cancel') {
        ;(overlay.element.querySelector('.builder-upload__cancel') as HTMLElement).click()
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      }

      expect(overlay.isOpen(), `dismissed by ${dismiss}`).toBe(false)
      expect(uploads, 'nothing handed over, no role assigned').toEqual([])

      // The next raise starts clean.
      overlay.open('library')
      expect(overlay.isOpen()).toBe(true)
      expect(overlay.element.querySelector('.builder-upload__note')!.textContent).toBe('')
      expect(overlay.element.querySelectorAll('.builder-upload__area.is-asking')).toHaveLength(0)
      overlay.destroy()
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-325da65f — two entry points, one interaction', () => {
  /**
   * The real builder, with the network injected, every handover recorded and
   * every re-read of the Library's list counted.
   *
   * `listCalls` is not bookkeeping: the claim is that the list is re-read FROM
   * THE PLATFORM after a handover rather than assembled from what the handover
   * returned, and a count of the calls the list route received is the only
   * mechanical form of it.
   */
  function mount(uploadImpl?: (args: Record<string, unknown>) => Promise<unknown>) {
    const sent: Array<Record<string, unknown>> = []
    const listCalls: number[] = []
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
      libraryTransport: {
        list: async () => {
          listCalls.push(1)
          return { material: [] }
        },
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
        upload: async (args: Record<string, unknown>) => {
          sent.push(args)
          if (uploadImpl) return uploadImpl(args)
          return {
            uid: `material-${sent.length}`,
            role: args.role,
            site_asset: args.role === 'site' ? 'logo.png' : null,
            indexed: true,
          }
        },
      },
    })
    return { app, sent, listCalls }
  }

  /** Raise the overlay from an entry point and drop files into one of its areas. */
  function handOver(
    app: { chat: { element: Element }; library: { element: Element }; upload: { element: Element } },
    from: 'chat' | 'library',
    role: 'site' | 'reference',
    files: File[],
  ) {
    const entry = from === 'chat' ? app.chat.element : app.library.element
    entry.dispatchEvent(fileDrag('dragenter'))
    ;(app.upload.element.querySelector(`[data-role="${role}"]`) as HTMLElement).dispatchEvent(
      fileDrag('drop', files),
    )
  }

  const messagesOf = (app: { chat: { getChat: () => never } }) =>
    (app.chat.getChat() as unknown as { getMessages: () => Array<{ role: string; markdown: string }> }).getMessages()

  it('test_UAT_AC1730_the_conversation_and_the_library_raise_the_one_same_overlay', async () => {
    // Two moments — the assistant asking for a logo, and the client filing
    // something that is not part of the conversation — and the SAME overlay,
    // because the decision they lead to is identical.
    const { app } = mount()
    await settle()

    const overlays = host.querySelectorAll('.builder-upload')
    expect(overlays, 'one overlay, not one per entry point').toHaveLength(1)
    expect(app.upload.isOpen()).toBe(false)

    app.chat.element.dispatchEvent(fileDrag('dragenter'))
    expect(app.upload.isOpen()).toBe(true)
    app.upload.close()
    expect(app.upload.isOpen()).toBe(false)

    app.library.element.dispatchEvent(fileDrag('dragenter'))
    expect(app.upload.isOpen()).toBe(true)
    // The identical one counted at the start, not a second of the same shape.
    expect(app.upload.element).toBe(overlays[0])
    expect(host.querySelectorAll('.builder-upload')).toHaveLength(1)
  })

  it('test_UAT_AC1731_a_conversational_handover_is_the_clients_own_turn_and_a_library_one_adds_none', async () => {
    const { app, sent } = mount()
    await settle()

    handOver(app, 'chat', 'site', [aFile('logo.png')])
    await settle()

    // THE CLIENT CAN SEE WHAT THEY SENT, as their own turn — because it is.
    const messages = messagesOf(app)
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    expect(messages[0].markdown).toContain('logo.png')
    // …and it reports what became of it, including the name it is on the site under.
    expect(messages[0].markdown).toContain('on your site')

    // A LIBRARY-ROUTE HANDOVER REACHES THE ASSISTANT BY THE SAME PATH — the
    // origin's index refresh and the next turn's delta — but does NOT put a line
    // into a conversation it was not part of.
    handOver(app, 'library', 'reference', [aFile('notes.pdf', 'application/pdf')])
    await settle()

    expect(sent).toHaveLength(2)
    expect(sent[1].role).toBe('reference')
    expect(messagesOf(app), 'the conversation still holds exactly the one turn').toHaveLength(1)
  })

  it('test_UAT_AC1732_a_handover_that_did_not_fully_succeed_reports_what_went_wrong', async () => {
    // A confirmation that said "added" whatever happened would make a failure
    // indistinguishable from a success to the only person who could tell us.
    const cases = [
      {
        name: 'huge.psd',
        upload: async () => {
          throw new Error('That file is 25MB, and the limit is 25MB.')
        },
        expected: [/didn't upload/, /the limit is 25MB/],
        // Not stored at all, so it must not read as added in any form.
        forbidden: /Added/,
      },
      {
        name: 'hero.jpg',
        upload: async () => ({
          uid: 'material-1',
          role: 'site',
          site_asset: null,
          site_asset_error: 'a file of that name is already on the site',
          indexed: true,
        }),
        // The bytes ARRIVED; it is the placement that did not land, and the
        // reason is named rather than generic.
        expected: [/Added/, /couldn't put it on the site/, /already on the site/],
        forbidden: null,
      },
      {
        name: 'guidelines.pdf',
        upload: async () => ({
          uid: 'material-1',
          role: 'reference',
          site_asset: null,
          indexed: false,
        }),
        // INVISIBILITY rather than staleness: search will never return it, and
        // only the client can tell us that matters.
        expected: [/Added/, /can't search it yet/],
        forbidden: null,
      },
    ]

    for (const scenario of cases) {
      document.body.replaceChildren()
      host = document.createElement('div')
      document.body.append(host)

      const { app } = mount(scenario.upload as never)
      await settle()

      handOver(app, 'chat', 'site', [aFile(scenario.name, 'application/octet-stream')])
      await settle()

      const [message] = messagesOf(app)
      expect(message, `${scenario.name} produced a turn`).toBeTruthy()
      expect(message.markdown).toContain(scenario.name)
      for (const pattern of scenario.expected) {
        expect(message.markdown, `${scenario.name}: ${pattern}`).toMatch(pattern)
      }
      if (scenario.forbidden) {
        expect(message.markdown, `${scenario.name} never reads as added`).not.toMatch(
          scenario.forbidden,
        )
      }
    }
  })

  it('test_UAT_AC1733_the_open_site_travels_with_the_handover_and_a_reference_file_is_never_placed', async () => {
    const { app, sent } = mount()
    await settle()

    // THE SITE CURRENTLY OPEN TRAVELS WITH IT, which is what lets the origin put
    // a for-the-site file straight into that site's asset library rather than at
    // some later step nobody has specified.
    handOver(app, 'chat', 'site', [aFile('logo.png')])
    await settle()

    expect(sent).toEqual([{ file: expect.anything(), role: 'site', slug: 'alpha' }])
    // …and the client is told the name it is on the site under.
    expect(messagesOf(app)[0].markdown).toMatch(/on your site as `logo\.png`/)

    // A REFERENCE FILE IS SENT WITH THE SAME SITE AND PLACED ON NEITHER. The slug
    // is an instruction, not a label: only the promotion the origin performs
    // writes a placement, and only for material that may have one.
    handOver(app, 'chat', 'reference', [aFile('guidelines.pdf', 'application/pdf')])
    await settle()

    expect(sent[1]).toEqual({ file: expect.anything(), role: 'reference', slug: 'alpha' })
    const reference = messagesOf(app)[1]
    expect(reference.markdown).toContain('guidelines.pdf')
    expect(reference.markdown).toMatch(/I'll read it/)
    expect(reference.markdown).toMatch(/won't appear on your site/)
    // The client is never told a reference file was placed on their site.
    expect(reference.markdown).not.toMatch(/on your site as/)
  })

  it('test_UAT_AC1735_several_files_are_reported_one_by_one_and_the_library_is_re_read', async () => {
    const { app, sent, listCalls } = mount()
    await settle()

    const before = listCalls.length
    const dropped = [aFile('one.png'), aFile('two.png'), aFile('three.png')]
    handOver(app, 'chat', 'site', dropped)
    await settle()

    // EACH FILE IS HANDED OVER IN ITS OWN RIGHT, carrying the same role — a
    // client dropping three photographs needs to know which of the three arrived.
    expect(sent).toHaveLength(3)
    expect(sent.map((args) => args.role)).toEqual(['site', 'site', 'site'])
    expect(sent.map((args) => (args.file as File).name)).toEqual([
      'one.png',
      'two.png',
      'three.png',
    ])

    // …and each is reported on its own, rather than behind a single aggregate
    // confirmation that would make one failure among three invisible.
    const messages = messagesOf(app)
    expect(messages).toHaveLength(3)
    for (const [index, file] of dropped.entries()) {
      expect(messages[index].role).toBe('user')
      expect(messages[index].markdown).toContain(file.name)
    }

    // THE LIST IS RE-READ FROM THE PLATFORM, not assembled from what the handover
    // returned: whether the file could be described and whether it reached the
    // site are both settled after the bytes leave the browser.
    expect(listCalls.length, 'the list was re-read after a conversational handover').toBeGreaterThan(
      before,
    )

    // And equally for a handover begun in the Library.
    const afterChat = listCalls.length
    handOver(app, 'library', 'reference', [aFile('notes.pdf', 'application/pdf')])
    await settle()

    expect(sent).toHaveLength(4)
    expect(listCalls.length, 'the list was re-read after a Library handover').toBeGreaterThan(
      afterChat,
    )
  })
})
