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
 * site upload says it is "ready to use on your site" (by label, or by filename
 * where there is none), a failed copy says it is in the Library but not ready
 * yet, and nothing claims a file is on the site.
 *
 * [[REQ-414]] MOVED THE WORDING, not the claim. A chat drop is now a chip in the
 * composer, and the picture is placed when the message carrying it is sent — so
 * "ready to use" is on the chip, and a failed copy is said in the attachment line
 * that message carries (and in the chip drawn from it in the client's bubble).
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

type Mounted = {
  chat: { element: HTMLElement; getChat: () => { getMessages: () => Array<{ markdown: string }> } }
  attachments: { element: HTMLElement }
}

/** Mount the real builder, drop one file on the conversation; answers the chip and what was sent. */
async function attach(answer: Record<string, unknown>, file: File, placed: Record<string, unknown> = {}) {
  const prompts: string[] = []
  const app = mountBuilder(host, {
    sites: [{ site: 'alpha', latest: 1 }],
    storage: memoryStorage(),
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `session-${slug}`, turns: [], ready: true }),
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
      setRole: async (uid: string, role: string) => ({ uid, role, ...placed }),
    },
  }) as unknown as Mounted
  await settle()
  app.chat.element.dispatchEvent(fileDrag('drop', [file]))
  await settle()
  await settle()
  const chip = app.attachments.element.querySelector('.builder-attach__chip') as HTMLElement
  const status = () => String(chip.querySelector('.builder-attach__status')?.textContent)
  const name = () => String(chip.querySelector('.builder-attach__name')?.textContent)
  async function send(): Promise<string> {
    ;(app.chat.element.querySelector('.chat-widget-send-btn') as HTMLButtonElement).click()
    for (let i = 0; i < 6; i++) await settle()
    return prompts.at(-1) ?? ''
  }
  return { app, status, name, send }
}

/** Nothing about an upload may claim the item is on (or put on) the site. */
function expectNoPlacementClaim(text: string) {
  expect(text).not.toContain('on your site as')
  expect(text).not.toContain("it's on your site")
  expect(text).not.toContain('put it on the site')
}

const png = (name: string) => new File(['b'], name, { type: 'image/png' })

describe.skipIf(!WEBUI_INSTALLED)('BUG-181 — an upload says ready to use, never on the site', () => {
  it('test_UAT_FC_BUG-181_a_labelled_site_upload_is_ready_to_use_on_your_site', async () => {
    const { name, status } = await attach(
      { uid: 'material-1', label: 'IMAGE-3', kind: 'image', role: 'reference', indexed: true },
      png('a1b2.png'),
    )
    expect(name()).toBe('IMAGE-3')
    expect(status()).toContain('ready to use on your site')
    expectNoPlacementClaim(status())
  })

  it('test_UAT_FC_BUG-181_an_unlabelled_site_upload_names_its_filename_and_is_ready_to_use', async () => {
    const { name, status } = await attach(
      { uid: 'material-2', label: null, role: 'reference', indexed: true },
      png('logo.png'),
    )
    expect(name()).toBe('logo.png')
    expect(status()).toContain('ready to use on your site')
    expectNoPlacementClaim(status())
  })

  it('test_UAT_FC_BUG-181_a_failed_site_copy_says_it_is_in_the_library_but_not_ready', async () => {
    const { send } = await attach(
      { uid: 'material-3', label: 'IMAGE-4', kind: 'image', role: 'reference', indexed: true },
      png('hero.png'),
      { site_asset: null, site_asset_error: 'the image could not be copied' },
    )
    const sent = await send()
    expect(sent).toContain(
      "It's in your Library, but isn't ready to use on the site yet: the image could not be copied",
    )
    // NOT ALSO "READY". A failed copy is the one case the success sentence would lie.
    expect(sent).not.toContain('is ready to use')
    expectNoPlacementClaim(sent)
  })

  it('test_UAT_FC_BUG-181_the_reference_wording_is_unchanged', async () => {
    const { status } = await attach(
      { uid: 'material-4', label: 'DOC-5', role: 'reference', indexed: true },
      new File(['b'], 'brand-book.pdf', { type: 'application/pdf' }),
    )
    expect(status()).toContain("I'll read it — it won't appear on your site")
    expectNoPlacementClaim(status())
  })
})
