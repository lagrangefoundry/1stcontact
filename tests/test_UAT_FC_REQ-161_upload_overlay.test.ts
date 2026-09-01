// @vitest-environment jsdom
/**
 * REQ-161 — **the upload overlay: the only question this product asks a file**.
 *
 * WHAT THIS FILE PROVES. Its sibling
 * (`…_material_surface.workers.test.ts`) shows what a role DOES once the origin
 * has it — the rights it writes, the site placement it licenses, the promotion it
 * forbids. This shows the half that decides which role is sent, and the claim is
 * almost entirely a NEGATIVE one: nothing is ever created without a person having
 * chosen. There is no safe default here, because both candidates are silently
 * wrong — "put it on the site" publishes what the client marked private, and
 * "just for you to read" withholds the photograph they meant to publish.
 *
 * THE REAL OVERLAY, AND THE REAL BUILDER AROUND IT. `createUploadOverlay` is the
 * module the browser runs and `mountBuilder` is the real composition, mounted
 * against the actually-installed components. Only the HTTP calls are injected,
 * for the reason every other builder suite gives: they are the network.
 *
 * WHAT A HEADLESS RUN CANNOT SEE, named rather than skipped. jsdom has no drag
 * source, so the `DataTransfer` a real drag carries is constructed here — the
 * two properties the code reads (`types` and `files`) and nothing else. What that
 * leaves unproven is the browser's own drag plumbing; what it does prove is every
 * decision this module makes about it.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { UPLOAD_AREAS, UPLOAD_PROMPT } from '../apps/control-app/src/builder/config.js'

let createUploadOverlay: (spec: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-161 overlay suite skipped: ${WEBUI_SKIP_REASON}`)

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

/** A drag carrying something that is not a file — text dragged out of the page. */
function textDrag(type: string): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { types: ['text/plain'], files: [] } })
  return event
}

const aFile = (name = 'logo.png', type = 'image/png') =>
  new File(['bytes'], name, { type })

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

describe('REQ-161 — the areas are roles, not file types', () => {
  it('test_UAT_FC_REQ-161_the_overlay_asks_what_the_file_is_for_and_promises_privacy', () => {
    const { overlay } = overlayWithLog()

    // THE PROMPT IS ABOUT PURPOSE. Not "what kind of file is this" — the content
    // type already answers that — but the one thing that cannot be inferred.
    expect(overlay.element.textContent).toContain(UPLOAD_PROMPT)

    const areas = [...overlay.element.querySelectorAll('.builder-upload__area')]
    expect(areas).toHaveLength(2)
    expect(areas.map((a) => (a as HTMLElement).dataset.role)).toEqual(['site', 'reference'])

    // EVERY AREA IS A REAL BUTTON. Dragging is a gesture some people cannot
    // perform and some devices do not offer, so each area has to be reachable by
    // keyboard and announced as something to activate.
    for (const area of areas) expect(area.tagName).toBe('BUTTON')

    // THE SECOND SUB-LINE IS LOAD-BEARING, not decoration: a client uploading
    // their positioning document wants to know it stays private, and the moment
    // they are deciding where to drop it is the moment to say so.
    const readArea = areas[1] as HTMLElement
    expect(readArea.textContent).toContain("won't appear on your site")
    // …and the copy is declared once, where every label in this builder is.
    for (const area of UPLOAD_AREAS) {
      expect(overlay.element.textContent).toContain(area.label)
      expect(overlay.element.textContent).toContain(area.hint)
    }
  })

  it('test_UAT_FC_REQ-161_dropping_into_an_area_commits_that_role_and_nothing_else_does', () => {
    const { overlay, uploads } = overlayWithLog()
    overlay.open('library')

    const areas = [...overlay.element.querySelectorAll('.builder-upload__area')]
    areas[1].dispatchEvent(fileDrag('drop', [aFile('brand-book.pdf', 'application/pdf')]))

    expect(uploads).toEqual([
      { names: ['brand-book.pdf'], role: 'reference', source: 'library' },
    ])
    // Committing gets out of the way — the client is done deciding.
    expect(overlay.isOpen()).toBe(false)
  })

  it('test_UAT_FC_REQ-161_a_file_dropped_outside_an_area_creates_nothing_and_says_what_is_missing', () => {
    // THE OPEN QUESTION THE TICKET LEFT, ANSWERED HERE. Prompting is the only
    // correct answer: a default would be silent, and BOTH candidate defaults are
    // wrong in a way nobody would notice — publishing what was meant to stay
    // private, or withholding what was meant to be published.
    const { overlay, uploads } = overlayWithLog()
    overlay.open('chat')

    overlay.element.dispatchEvent(fileDrag('drop', [aFile()]))

    expect(uploads).toEqual([])
    // The overlay STAYS UP: the client is mid-gesture and has simply missed, so
    // closing would discard the drag they were part-way through making.
    expect(overlay.isOpen()).toBe(true)
    expect(overlay.element.querySelector('.builder-upload__note')!.textContent).toMatch(
      /one of these two/,
    )
    // BOTH answers are marked, never one — highlighting either would be the
    // recommendation this surface exists not to make.
    const asking = overlay.element.querySelectorAll('.builder-upload__area.is-asking')
    expect(asking).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-161_clicking_an_area_is_the_same_commitment_as_dropping_on_it', () => {
    // Accessibility, and anyone on a device where dragging is awkward: the same
    // overlay and the same role, reached by a different trigger.
    const { overlay, uploads } = overlayWithLog()
    overlay.open('library')

    const input = overlay.element.querySelector('.builder-upload__input') as HTMLInputElement
    ;(overlay.element.querySelector('[data-role="site"]') as HTMLElement).click()
    Object.defineProperty(input, 'files', { value: [aFile('hero.jpg', 'image/jpeg')], configurable: true })
    input.dispatchEvent(new Event('change'))

    expect(uploads).toEqual([{ names: ['hero.jpg'], role: 'site', source: 'library' }])
  })

  it('test_UAT_FC_REQ-161_a_drag_that_is_not_carrying_files_never_raises_the_overlay', () => {
    // Dragging a selection inside the page must not put a full-screen upload
    // dialog over the builder.
    const { overlay } = overlayWithLog()
    const target = document.createElement('div')
    host.append(target)
    overlay.watch(target, 'library')

    target.dispatchEvent(textDrag('dragenter'))
    expect(overlay.isOpen()).toBe(false)

    target.dispatchEvent(fileDrag('dragenter'))
    expect(overlay.isOpen()).toBe(true)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-161 — two entry points, one interaction', () => {
  /** The real builder, with the network injected and every upload recorded. */
  function mount() {
    const sent: Array<Record<string, unknown>> = []
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
        upload: async (args: Record<string, unknown>) => {
          sent.push(args)
          return {
            uid: `material-${sent.length}`,
            role: args.role,
            site_asset: args.role === 'site' ? 'logo.png' : null,
            indexed: true,
          }
        },
      },
    })
    return { app, sent }
  }

  it('test_UAT_FC_REQ-161_dragging_onto_either_the_chat_or_the_library_raises_the_same_overlay', async () => {
    // DOC-8 open item #4 asked "drag-into-chat, dedicated asset panel, or an
    // AI-prompted upload step?" and left it open. The answer is BOTH, because
    // they serve different moments — the assistant asking for a logo, and the
    // client filing something that is not part of the conversation — and the SAME
    // overlay, because the decision they lead to is identical.
    const { app } = mount()
    await settle()

    const overlays = host.querySelectorAll('.builder-upload')
    expect(overlays, 'one overlay, not one per entry point').toHaveLength(1)
    expect(app.upload.isOpen()).toBe(false)

    app.chat.element.dispatchEvent(fileDrag('dragenter'))
    expect(app.upload.isOpen()).toBe(true)
    app.upload.close()

    app.library.element.dispatchEvent(fileDrag('dragenter'))
    expect(app.upload.isOpen()).toBe(true)
    expect(app.upload.element).toBe(overlays[0])
  })

  it('test_UAT_FC_REQ-161_a_chat_route_drop_appears_in_the_conversation_and_a_library_one_does_not', async () => {
    const { app, sent } = mount()
    await settle()

    app.chat.element.dispatchEvent(fileDrag('dragenter'))
    ;(app.upload.element.querySelector('[data-role="site"]') as HTMLElement).dispatchEvent(
      fileDrag('drop', [new File(['b'], 'logo.png', { type: 'image/png' })]),
    )
    await settle()

    // The site currently shown travels with it, which is what lets the origin put
    // a "for the site" upload straight into that site's asset library.
    expect(sent).toEqual([{ file: expect.anything(), role: 'site', slug: 'alpha' }])

    // THE CLIENT CAN SEE WHAT THEY SENT, as their own turn — because it is.
    const messages = app.chat.getChat().getMessages() as Array<{ role: string; markdown: string }>
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    expect(messages[0].markdown).toContain('logo.png')
    // And it reports what actually happened, not merely that something did.
    expect(messages[0].markdown).toContain('on your site')

    // A LIBRARY-ROUTE DROP REACHES THE ASSISTANT BY THE SAME PATH — the origin's
    // index refresh and the next turn's delta — but does NOT put a line in a
    // conversation it was not part of.
    app.library.element.dispatchEvent(fileDrag('dragenter'))
    ;(app.upload.element.querySelector('[data-role="reference"]') as HTMLElement).dispatchEvent(
      fileDrag('drop', [new File(['b'], 'notes.pdf', { type: 'application/pdf' })]),
    )
    await settle()

    expect(sent).toHaveLength(2)
    expect(sent[1].role).toBe('reference')
    expect(app.chat.getChat().getMessages()).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-161_an_upload_that_failed_says_so_rather_than_reading_as_added', async () => {
    // A confirmation that said "added" whatever happened would make a failure
    // indistinguishable from success to the only person who could tell us.
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
          throw new Error('That file is 25MB, and the limit is 25MB.')
        },
      },
    })
    await settle()

    app.chat.element.dispatchEvent(fileDrag('dragenter'))
    ;(app.upload.element.querySelector('[data-role="site"]') as HTMLElement).dispatchEvent(
      fileDrag('drop', [new File(['b'], 'huge.psd', { type: 'image/vnd.adobe.photoshop' })]),
    )
    await settle()

    const messages = app.chat.getChat().getMessages() as Array<{ markdown: string }>
    expect(messages[0].markdown).toContain("didn't upload")
    expect(messages[0].markdown).toContain('the limit is 25MB')
  })
})
