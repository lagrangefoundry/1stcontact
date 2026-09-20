// @vitest-environment jsdom
/**
 * [[REQ-287]] — **the drop is answered with a name the client can say back**.
 *
 * WHAT WAS WRONG. Uploading a picture off a phone said *"Added, and it's on your
 * site as `3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png`"* — the one name in this
 * system that is unusable in the client's next sentence, because nobody
 * transcribes 36 hex digits to ask for a change to it. [[REQ-280]] had already
 * invented the name that closes that gap, and [[REQ-218]] had already taught the
 * assistant to accept it back; the confirmation was simply a place it never
 * reached.
 *
 * WHAT THIS FILE PROVES, through the real builder and the real chat pane: that
 * the placement sentence names the label where there is one, that it keeps the
 * filename where there is not, that the filename is still on the note's first
 * line as the thing the client actually dropped, and that the other three lines
 * and the refusal path are untouched. Its workers sibling proves the origin half
 * — that the label is in the answer for this to spend.
 *
 * ONLY THE HTTP CALLS ARE INJECTED, for the reason every other builder suite
 * gives: they are the network. The note is composed by the module the browser
 * runs and read back off the messages the chat pane actually holds.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-287 note suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'alpha', latest: 1 }]
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

beforeAll(async () => {
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

/** The real builder, with the upload route answering whatever a case needs. */
function mount(answer: Record<string, unknown>) {
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
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => answer,
    },
  })
  return app
}

/** One file, dropped on the chat's "put it on the site" area. */
async function dropOnChat(app: { chat: { element: HTMLElement }; upload: { element: HTMLElement } }, file: File) {
  app.chat.element.dispatchEvent(fileDrag('dragenter'))
  ;(app.upload.element.querySelector('[data-role="site"]') as HTMLElement).dispatchEvent(
    fileDrag('drop', [file]),
  )
  await settle()
}

const noteIn = (app: { chat: { getChat: () => { getMessages: () => unknown } } }): string =>
  String((app.chat.getChat().getMessages() as Array<{ markdown: string }>)[0].markdown)

describe.skipIf(!WEBUI_INSTALLED)('REQ-287 — what the confirmation calls the material', () => {
  it('test_UAT_FC_REQ-287_a_placed_drop_is_named_by_its_catalogue_label_and_not_its_storage_key', async () => {
    // THE SENTENCE THE TICKET IS ABOUT. The client dropped a file whose name is a
    // uuid; what they are told to call it from here on is `IMAGE-25`, which is
    // the name the Library's row shows and the name the assistant answers to.
    const app = mount({
      uid: 'material-1',
      label: 'IMAGE-25',
      role: 'site',
      site_asset: '3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png',
      indexed: true,
    })
    await settle()

    await dropOnChat(
      app,
      new File(['b'], '3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png', { type: 'image/png' }),
    )

    const note = noteIn(app)
    expect(note).toContain("Added, and it's on your site as **IMAGE-25**.")
    // AND NOT ALSO BY THE STORAGE KEY, in the sentence whose whole job is to hand
    // over a name. The uuid appearing twice would leave the client guessing which
    // of the two to type back.
    expect(note).not.toContain('on your site as `3d727c09')

    // THE FILENAME IS STILL THE FIRST LINE, in bold, as the thing they dropped —
    // it is the only name they already know, and it is how they recognise which
    // of three drags this note is about. The two names answer different
    // questions and both belong in the note.
    expect(note.split('\n')[0]).toBe('📎 **3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png**')
  })

  it('test_UAT_FC_REQ-287_material_with_no_label_keeps_the_filename_it_has_always_used', async () => {
    // WHERE THERE IS NO OTHER NAME. `label` is `string | null`: material ingested
    // before [[REQ-280]] has none, and that is a gap in an old Library rather
    // than a defect. The filename is then the honest name for a thing that has no
    // other one — and it stays in backticks, because a storage key is what it is.
    const app = mount({
      uid: 'material-2',
      label: null,
      role: 'site',
      site_asset: 'logo.png',
      indexed: true,
    })
    await settle()

    await dropOnChat(app, new File(['b'], 'logo.png', { type: 'image/png' }))

    expect(noteIn(app)).toContain("Added, and it's on your site as `logo.png`.")
  })

  it('test_UAT_FC_REQ-287_a_label_is_not_a_placement_and_does_not_produce_the_placement_sentence', async () => {
    // THE GATE IS UNCHANGED, and this is the way this ticket could have broken
    // it. Every material gets a label at ingest, including one the client marked
    // "just for you to read" — so a note that reached for the label rather than
    // for the placement would announce a site for a file that never touched one.
    // The sentence is still conditional on `site_asset`; only the name inside it
    // moved.
    const unplaced = mount({
      uid: 'material-3',
      label: 'DOC-4',
      role: 'reference',
      site_asset: null,
      indexed: false,
    })
    await settle()

    await dropOnChat(unplaced, new File(['b'], 'brand-book.pdf', { type: 'application/pdf' }))

    const note = noteIn(unplaced)
    expect(note).toContain("Added. I'll read it — it won't appear on your site.")
    expect(note).not.toContain('on your site as')
    expect(note).not.toContain('DOC-4')
    // AND THE LINE THAT REPORTS WHAT WENT WRONG IS UNTOUCHED — it says what
    // happened rather than what to call it, and this ticket changed only naming.
    expect(note).toContain("I've stored it, but I can't search it yet.")
  })
})
