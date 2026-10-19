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
 * [[BUG-181]] REWORDED THE SENTENCE, not the naming: it now reads *"Added —
 * **IMAGE-25** is ready to use on your site."*, because the copy into the
 * site's asset store places nothing on a page. The label/filename choice this
 * file pins is unchanged.
 *
 * [[REQ-414]] MOVED IT AGAIN: there is no note now. A chat drop is a chip in the
 * composer, named by its label, and goes with the next message as an attachment
 * line that names it the same way — so the label/filename choice is pinned there.
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
  const prompts: string[] = []
  const app = mountBuilder(host, {
    sites: SITES,
    storage: memoryStorage(),
    chatTransport: {
      openSession: async (slug: string) => ({
        sessionId: `session-${slug}`,
        turns: [],
        ready: true,
      }),
      streamPrompt: async function* (_id: string, text: string) {
        prompts.push(text)
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => answer,
      setRole: async (uid: string, role: string) => ({ uid, role, site_asset: 'placed.png' }),
    },
  }) as unknown as Attaching
  return { app, prompts }
}

type Attaching = { chat: { element: HTMLElement }; attachments: { element: HTMLElement } }

/** One file, dropped on the conversation — a chip in the composer. */
async function dropOnChat(app: Attaching, file: File) {
  app.chat.element.dispatchEvent(fileDrag('drop', [file]))
  await settle()
  await settle()
}

const chipText = (app: Attaching, part: 'name' | 'status') =>
  String(app.attachments.element.querySelector(`.builder-attach__${part}`)?.textContent)

/** Send what is in the composer, and answer what the consultant was given. */
async function send(app: Attaching, prompts: string[]) {
  ;(app.chat.element.querySelector('.chat-widget-send-btn') as HTMLButtonElement).click()
  for (let i = 0; i < 6; i++) await settle()
  return prompts.at(-1) ?? ''
}

const UUID = '3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png'

describe.skipIf(!WEBUI_INSTALLED)('REQ-287 — what an attachment is called', () => {
  it('test_UAT_FC_REQ-287_a_placed_drop_is_named_by_its_catalogue_label_and_not_its_storage_key', async () => {
    // The client dropped a file whose name is a uuid; what they are shown, and
    // what the consultant is told, is `IMAGE-25` — the name the Library's row
    // shows and the name the assistant answers to.
    const { app, prompts } = mount({ uid: 'material-1', label: 'IMAGE-25', kind: 'image', indexed: true })
    await settle()

    await dropOnChat(app, new File(['b'], UUID, { type: 'image/png' }))
    expect(chipText(app, 'name')).toBe('IMAGE-25')

    // THE LABEL IS THE NAME; the filename follows as the thing they dropped, in
    // backticks — a storage key, not a name anyone is asked to type back.
    expect(await send(app, prompts)).toBe(`📎 Attached: IMAGE-25 (for the site), \`${UUID}\``)
  })

  it('test_UAT_FC_REQ-287_material_with_no_label_keeps_the_filename_it_has_always_used', async () => {
    // `label` is `string | null`: material ingested before [[REQ-280]] has none.
    // The filename is then the honest name for a thing that has no other one.
    const { app, prompts } = mount({ uid: 'material-2', label: null, indexed: true })
    await settle()

    await dropOnChat(app, new File(['b'], 'logo.png', { type: 'image/png' }))
    expect(chipText(app, 'name')).toBe('logo.png')
    expect(await send(app, prompts)).toBe('📎 Attached: logo.png (for the site), `logo.png`')
  })

  it('test_UAT_FC_REQ-287_a_label_is_not_a_placement_and_does_not_produce_the_placement_sentence', async () => {
    // Every material gets a label at ingest, including one that is "just for you
    // to read" — so naming it by its label must not announce a site for a file
    // that will never touch one.
    const { app } = mount({ uid: 'material-3', label: 'DOC-4', indexed: true })
    await settle()

    await dropOnChat(app, new File(['b'], 'brand-book.pdf', { type: 'application/pdf' }))
    expect(chipText(app, 'status')).toBe("I'll read it — it won't appear on your site")
    expect(chipText(app, 'status')).not.toContain('ready to use')
  })
})
