// @vitest-environment jsdom
/**
 * [[BUG-181]] — **an upload is ready to use, not on the site**.
 *
 * WHAT WAS WRONG. A site-role upload was answered *"Added, and it's on your site
 * as **IMAGE-3**."* All `site_asset` records is that the bytes were copied into
 * the site's asset store: no page uses the image, the draft is unchanged, and
 * nothing is published. A client read the sentence as "it's live" and went
 * looking for it. The failure line had the same fault — "I couldn't put it on
 * the site yet" described a copy failure as a publish failure.
 *
 * WHAT THIS FILE PROVES, through the real builder and the real chat pane: a
 * successful copy says the item "is ready to use on your site" (by label, or by
 * filename where there is none), a failed copy says it is in the Library but
 * not ready yet, and no upload note claims anything is on the site.
 *
 * ONLY THE HTTP CALLS ARE INJECTED — they are the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-181 note suite skipped: ${WEBUI_SKIP_REASON}`)

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

/** Mount the real builder, drop one file on the site area, return the note. */
async function noteFor(answer: Record<string, unknown>, file: File): Promise<string> {
  const app = mountBuilder(host, {
    sites: [{ site: 'alpha', latest: 1 }],
    storage: memoryStorage(),
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `session-${slug}`, turns: [], ready: true }),
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
  }) as unknown as {
    chat: { element: HTMLElement; getChat: () => { getMessages: () => Array<{ markdown: string }> } }
    upload: { element: HTMLElement }
  }
  await settle()
  app.chat.element.dispatchEvent(fileDrag('dragenter'))
  ;(app.upload.element.querySelector('[data-role="site"]') as HTMLElement).dispatchEvent(
    fileDrag('drop', [file]),
  )
  await settle()
  return String(app.chat.getChat().getMessages()[0].markdown)
}

/** Nothing in an upload note may claim the item is on (or put on) the site. */
function expectNoPlacementClaim(note: string) {
  expect(note).not.toContain('on your site as')
  expect(note).not.toContain("it's on your site")
  expect(note).not.toContain('put it on the site')
}

const png = (name: string) => new File(['b'], name, { type: 'image/png' })

describe.skipIf(!WEBUI_INSTALLED)('BUG-181 — the upload note says ready to use, never on the site', () => {
  it('test_UAT_FC_BUG-181_a_labelled_site_upload_is_ready_to_use_on_your_site', async () => {
    const note = await noteFor(
      { uid: 'material-1', label: 'IMAGE-3', role: 'site', site_asset: 'a1b2.png', indexed: true },
      png('a1b2.png'),
    )
    expect(note).toContain('Added — **IMAGE-3** is ready to use on your site.')
    expectNoPlacementClaim(note)
  })

  it('test_UAT_FC_BUG-181_an_unlabelled_site_upload_names_its_filename_and_is_ready_to_use', async () => {
    const note = await noteFor(
      { uid: 'material-2', label: null, role: 'site', site_asset: 'logo.png', indexed: true },
      png('logo.png'),
    )
    expect(note).toContain('Added — `logo.png` is ready to use on your site.')
    expectNoPlacementClaim(note)
  })

  it('test_UAT_FC_BUG-181_a_failed_site_copy_says_it_is_in_the_library_but_not_ready', async () => {
    const note = await noteFor(
      {
        uid: 'material-3',
        label: 'IMAGE-4',
        role: 'site',
        site_asset: null,
        site_asset_error: 'the image could not be copied',
        indexed: true,
      },
      png('hero.png'),
    )
    expect(note).toContain(
      "It's in your Library, but isn't ready to use on the site yet: the image could not be copied",
    )
    // NOT ALSO "READY". A failed copy is the one case the success sentence would lie.
    expect(note).not.toContain('is ready to use')
    expectNoPlacementClaim(note)
  })

  it('test_UAT_FC_BUG-181_the_reference_line_and_the_first_line_are_unchanged', async () => {
    const note = await noteFor(
      { uid: 'material-4', label: 'DOC-5', role: 'reference', site_asset: null, indexed: true },
      new File(['b'], 'brand-book.pdf', { type: 'application/pdf' }),
    )
    expect(note.split('\n')[0]).toBe('📎 **brand-book.pdf**')
    expect(note).toContain("Added. I'll read it — it won't appear on your site.")
    expectNoPlacementClaim(note)
  })
})
