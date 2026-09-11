// @vitest-environment jsdom
/**
 * REQ-221 — **the upload surface advertises what it accepts, and a refusal
 * reaches the client wherever they dropped the file**.
 *
 * WHY THESE TWO ARE IN THE HEIC TICKET. A client dropping a photograph and
 * getting silence is the same experience as an unreadable photograph, arrived at
 * differently — and this ticket's whole answer to an unreadable photograph is a
 * sentence the client can act on, so the sentence has to actually reach them.
 * Both halves were real: the picker carried no `accept` at all, and a
 * Library-route failure was reported nowhere.
 *
 * THE REAL OVERLAY AND THE REAL BUILDER, like its REQ-161 sibling. Only the HTTP
 * call is injected, because it is the network. What a headless run cannot see is
 * named rather than skipped: jsdom has no file picker, so what an `accept` list
 * does to a native dialog is not provable here — what IS provable is that the
 * element carries the advertisement, which is the part this repository owns.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { UPLOAD_ACCEPT } from '../apps/control-app/src/builder/config.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createUploadOverlay: (spec: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-221 surface suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ slug: 'alpha', latest: 1 }]
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** The refusal the origin writes for a deployment that cannot read HEIC. */
const HEIC_REFUSAL =
  'That photograph is in HEIC, the format iPhones use by default, and this ' +
  'deployment has no image converter configured to read it. On the phone, ' +
  'Settings → Camera → Formats → Most Compatible makes it take ordinary JPEGs instead.'

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

const aPhotograph = () => new File(['bytes'], 'shopfront.HEIC', { type: '' })

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
beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

describe('REQ-221 — the upload path advertises what it accepts', () => {
  it('UAT_FC_REQ-221 the picker names the formats instead of offering the whole disk', () => {
    const overlay = createUploadOverlay({ host, onUpload: () => {} })
    const input = overlay.element.querySelector('.builder-upload__input') as HTMLInputElement

    // IT CARRIED NONE AT ALL. The module's own comment described "the accept
    // list" while the element had no `accept` attribute, so the picker offered
    // every file on the disk and the first thing a client learned about what we
    // take was a refusal after the upload.
    expect(input.getAttribute('accept')).toBe(UPLOAD_ACCEPT)
    expect(input.multiple).toBe(true)
  })

  it('UAT_FC_REQ-221 HEIC is on the list, because an iPhone photograph is now a file we take', () => {
    // THE ENTRY THAT MAKES THE LIST WORTH WRITING. We convert HEIC at the door,
    // so a picker that greyed it out would refuse a file the product handles.
    // Both extensions and both media types, because a browser's idea of what
    // `.heic` is varies by platform.
    for (const token of ['.heic', '.heif', 'image/heic', 'image/heif']) {
      expect(UPLOAD_ACCEPT.split(',')).toContain(token)
    }
  })

  it('UAT_FC_REQ-221 it does not say image/*, whose meaning depends on the client’s OS', () => {
    // `image/*` resolves to whatever the platform thinks an image is — on some
    // browsers that excludes HEIC, on others it admits formats nothing here can
    // read. An advertisement whose content depends on the operating system is not
    // an advertisement.
    expect(UPLOAD_ACCEPT).not.toContain('*')
    // And every entry is a format some step of the pipeline can do something
    // with, which is the rule `TYPE_BY_EXTENSION` already follows: the documents
    // the describer reads, the fonts whose name tables it parses.
    for (const token of ['.pdf', '.md', '.woff2']) {
      expect(UPLOAD_ACCEPT.split(',')).toContain(token)
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-221 — a refused upload says why, wherever it was dropped', () => {
  /** The real builder, with every upload refused the way the origin refuses one. */
  function mountRefusing(message = HEIC_REFUSAL) {
    const app = mountBuilder(host, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      libraryTransport: {
        list: async () => ({ material: [] }),
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/x?uid=${uid}`,
        // WHAT THE ORIGIN ACTUALLY DOES with a HEIC it cannot convert: a
        // `MaterialRejectedError` becomes a 400, and `api.js` turns the envelope's
        // `error` field into the message on a thrown `CopyError`.
        upload: async () => {
          throw new Error(message)
        },
      },
    })
    return app
  }

  /** Drop one file onto the given entry point's `site` area. */
  async function drop(app: Record<string, never>, from: 'chat' | 'library') {
    const entry = from === 'chat' ? app.chat : app.library
    entry.element.dispatchEvent(fileDrag('dragenter'))
    ;(app.upload.element.querySelector('[data-role="site"]') as HTMLElement).dispatchEvent(
      fileDrag('drop', [aPhotograph()]),
    )
    await settle()
  }

  it('UAT_FC_REQ-221 a Library drop that was refused says so, instead of nothing at all', async () => {
    const app = mountRefusing()
    await settle()
    await drop(app, 'library')

    // THE BUG. The row simply never appeared, and the client was left to conclude
    // the product had ignored them — the same experience as dropping a photograph
    // into silence, arrived at differently.
    const notice = app.library.element.querySelector('.builder-library__refusal') as HTMLElement
    expect(notice.textContent).toContain('Most Compatible')
    expect(notice.textContent).toContain('HEIC')
    // NAMING THE FILE, because more than one can be dropped at a time and the
    // origin's own sentence deliberately leaves the naming to the surface.
    expect(notice.textContent).toContain('shopfront.HEIC')
    // POLITE RATHER THAN INTERRUPTING: the file was not stored and will still
    // not be stored in ten seconds, so there is nothing urgent to announce.
    expect(notice.getAttribute('role')).toBe('status')
  })

  it('UAT_FC_REQ-221 a chat drop still reports it in the conversation, and only there', async () => {
    const app = mountRefusing()
    await settle()
    await drop(app, 'chat')

    const messages = app.chat.getChat().getMessages() as Array<{ markdown: string }>
    const note = messages.at(-1)!.markdown
    expect(note).toContain("that didn't upload")
    expect(note).toContain('Most Compatible')
    // AND NOT TWICE. A chat drop has already said it; repeating it in a second
    // surface would read as two separate failures rather than one.
    const notice = app.library.element.querySelector('.builder-library__refusal') as HTMLElement
    expect(notice.textContent).toBe('')
  })

  it('UAT_FC_REQ-221 the reason is the origin’s own sentence, not a substitute for it', async () => {
    // `material.ts` composes the refusal knowing the ceiling, the format and the
    // remedy. Anything the browser invented would be a worse sentence about a
    // fact it knows less about — so the size refusal arrives verbatim too.
    const app = mountRefusing('That file is 22MB, and the limit is 20MB. Try a smaller version of it.')
    await settle()
    await drop(app, 'library')

    const notice = app.library.element.querySelector('.builder-library__refusal') as HTMLElement
    expect(notice.textContent).toContain('the limit is 20MB')
  })

  it('UAT_FC_REQ-221 a later successful drop clears the refusal', async () => {
    let refuse = true
    const app = mountBuilder(host, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      libraryTransport: {
        list: async () => ({ material: [] }),
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/x?uid=${uid}`,
        upload: async () => {
          if (refuse) throw new Error(HEIC_REFUSAL)
          return { uid: 'material-1', role: 'site', site_asset: 'shopfront.jpg', indexed: true }
        },
      },
    })
    await settle()

    await drop(app as never, 'library')
    const notice = app.library.element.querySelector('.builder-library__refusal') as HTMLElement
    expect(notice.textContent).toContain('HEIC')

    refuse = false
    await drop(app as never, 'library')
    // A REFUSAL LEFT STANDING above a list that has since accepted the file would
    // be a worse lie than the silence it replaced.
    expect(notice.textContent).toBe('')
  })
})
