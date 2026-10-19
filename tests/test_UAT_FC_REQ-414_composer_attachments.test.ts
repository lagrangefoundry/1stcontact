// @vitest-environment jsdom
/**
 * [[REQ-414]] — **uploads are attachments in the composer, and go with the next
 * message**.
 *
 * WHAT WAS WRONG. A file dropped on the conversation was uploaded and then
 * announced by a line painted into the transcript as the client's own message —
 * which nothing sent. The consultant heard of the file only with the client's
 * next words, so it looked ignored, and the transcript held a "message" the
 * model never received.
 *
 * WHAT THIS FILE PROVES, through the real builder, the real chat pane and the
 * real composer: a drop becomes a chip and nothing else; the chip goes out with
 * the next message, named by label, role and filename, as ONE turn; a chip alone
 * is a message; a removed chip is not sent; "For reference" on the chip keeps the
 * Library item reference-only (no role change is made); a refused file says why on
 * its chip; a chip added while a turn runs goes with whatever is sent next; and a
 * reloaded transcript draws the attachment inside the client's bubble.
 *
 * ONLY THE HTTP CALLS ARE INJECTED — they are the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { importWebui, WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let setParser: (parser: unknown) => unknown
let setSanitizer: (fn: ((html: string) => string) | null) => unknown

if (!WEBUI_INSTALLED) console.warn(`REQ-414 attachments suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const settleMany = async (n = 6) => {
  for (let i = 0; i < n; i++) await settle()
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

function fileEvent(type: string, files: File[] = []): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'], files } })
  return event
}

const photo = (name = 'shopfront.jpg') => new File(['b'], name, { type: 'image/jpeg' })

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ setSanitizer } = (await importWebui('webui-chat')) as never)
    ;({ setParser } = (await importWebui('webui-markdown')) as never)
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
  if (WEBUI_INSTALLED) {
    // `marked` is the CDN import that cannot run here; paragraphs are all the
    // attachment lines need, and the subject is our drawing of them.
    setParser({
      parse: (md: string) =>
        md
          .trim()
          .split(/\n{2,}/)
          .map((block) => `<p>${block.replace(/`([^`]+)`/g, '<code>$1</code>')}</p>`)
          .join(''),
      parseInline: (md: string) => md,
    })
    setSanitizer((h) => h)
  }
})

type App = {
  chat: { element: HTMLElement; getChat: () => Chat }
  upload: { isOpen: () => boolean }
  attachments: { element: HTMLElement }
}
type Chat = {
  element: HTMLElement
  getMessages: () => Array<{ role: string; markdown: string }>
  setInputMarkdown: (md: string) => void
  send: (text: string) => Promise<void>
}

/**
 * The real builder, with the network recorded. `turnGate`, when given, holds every
 * turn open until it resolves — a consultant still working.
 */
function mount({
  upload = async (args: Record<string, unknown>, n: number) => ({
    uid: `material-${n}`,
    label: `IMAGE-${11 + n}`,
    kind: 'image',
    role: args.role,
    site_asset: null,
    indexed: true,
  }),
  turns = [] as Array<{ role: string; markdown: string }>,
  material = [] as Array<Record<string, unknown>>,
  turnGate = null as Promise<void> | null,
} = {}) {
  const prompts: string[] = []
  const uploads: Array<Record<string, unknown>> = []
  const roles: Array<[string, string]> = []
  const deletes: string[] = []
  const app = mountBuilder(host, {
    sites: [{ site: 'alpha', latest: 1 }],
    storage: memoryStorage(),
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `session-${slug}`, turns, ready: true }),
      streamPrompt: async function* (_id: string, text: string) {
        prompts.push(text)
        if (turnGate) await turnGate
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      remove: async (uid: string) => void deletes.push(uid),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async (args: Record<string, unknown>) => {
        uploads.push(args)
        return upload(args, uploads.length)
      },
      setRole: async (uid: string, role: string) => {
        roles.push([uid, role])
        return { uid, role, site_asset: 'shopfront.jpg' }
      },
    },
  }) as unknown as App
  return { app, prompts, uploads, roles, deletes }
}

const chipsOf = (app: App) => [...app.attachments.element.querySelectorAll<HTMLElement>('.builder-attach__chip')]

async function dropOnChat(app: App, files: File[]) {
  app.chat.element.dispatchEvent(fileEvent('dragover', files))
  app.chat.element.dispatchEvent(fileEvent('drop', files))
  await settleMany()
}

/** Enter in the composer, the way the client sends. */
async function pressEnter(app: App) {
  const box = app.chat.element.querySelector('.chat-widget-input-source') as HTMLTextAreaElement
  box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await settleMany()
}

const LINE = '📎 Attached: IMAGE-12 (for the site), `shopfront.jpg`'

describe.skipIf(!WEBUI_INSTALLED)('REQ-414 — attachments in the composer', () => {
  it('test_UAT_FC_REQ-414_dropping_a_file_adds_a_chip_and_adds_nothing_to_the_transcript', async () => {
    const { app, uploads } = mount()
    await settle()

    await dropOnChat(app, [photo()])

    // NOT THE OVERLAY: what the file is for is asked on the chip.
    expect(app.upload.isOpen()).toBe(false)
    const [chip, ...rest] = chipsOf(app)
    expect(rest).toHaveLength(0)
    // In the composer, above the text box — not in the conversation.
    expect(app.attachments.element.nextElementSibling?.classList.contains('chat-widget-input-bar')).toBe(true)
    // Uploaded at once, and named by its label once it has one.
    expect(uploads).toHaveLength(1)
    expect(chip.querySelector('.builder-attach__name')!.textContent).toBe('IMAGE-12')
    // A photograph is for the site until the client says otherwise.
    expect((chip.querySelector('.builder-attach__role') as HTMLSelectElement).value).toBe('site')
    // [[BUG-181]]'s wording, on the chip: ready to use, never "on your site".
    expect(chip.querySelector('.builder-attach__status')!.textContent).toContain('ready to use on your site')
    // And the transcript is untouched: nothing was said, so nothing is shown.
    expect(app.chat.getChat().getMessages()).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-414_sending_text_with_a_chip_gives_the_consultant_one_turn_naming_label_and_role', async () => {
    const { app, prompts, roles } = mount()
    await settle()
    await dropOnChat(app, [photo()])

    app.chat.getChat().setInputMarkdown('Here is the shop')
    await pressEnter(app)

    // ONE turn, carrying the words and the attachment together.
    expect(prompts).toEqual([`Here is the shop\n\n${LINE}`])
    // "For the site" is applied as the message goes — the Library's role change.
    expect(roles).toEqual([['material-1', 'site']])
    // The client's message holds the file; there is no second, separate message.
    const messages = app.chat.getChat().getMessages()
    expect(messages.filter((m) => m.role === 'user')).toEqual([
      expect.objectContaining({ markdown: `Here is the shop\n\n${LINE}` }),
    ])
    // Drawn as a chip inside the bubble, with its thumbnail.
    const bubble = app.chat.element.querySelector('.chat-message.user') as HTMLElement
    const drawn = bubble.querySelector('.builder-attached') as HTMLElement
    expect(drawn.dataset.label).toBe('IMAGE-12')
    expect(drawn.querySelector('img')!.getAttribute('src')).toBe('/api/material/file?uid=material-1')
    expect(bubble.textContent).not.toContain('📎 Attached')
    // And the tray is empty again.
    expect(chipsOf(app)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-414_sending_only_a_chip_starts_a_turn', async () => {
    const { app, prompts } = mount()
    await settle()
    await dropOnChat(app, [photo()])

    const send = app.chat.element.querySelector('.chat-widget-send-btn') as HTMLButtonElement
    // ▶ IS LIVE with an empty box, because the chip is a message on its own.
    expect(send.disabled).toBe(false)
    send.click()
    await settleMany()

    expect(prompts).toEqual([LINE])
    expect(app.chat.getChat().getMessages().filter((m) => m.role === 'user')).toHaveLength(1)
    expect(send.disabled, 'an empty composer with no chip cannot send').toBe(true)
  })

  it('test_UAT_FC_REQ-414_removing_a_chip_before_sending_leaves_the_turn_with_no_attachment', async () => {
    const { app, prompts, uploads, deletes } = mount()
    await settle()
    await dropOnChat(app, [photo()])

    ;(chipsOf(app)[0].querySelector('.builder-attach__remove') as HTMLButtonElement).click()
    expect(chipsOf(app)).toHaveLength(0)

    app.chat.getChat().setInputMarkdown('Never mind')
    await pressEnter(app)

    expect(prompts).toEqual(['Never mind'])
    // THE LIBRARY ITEM STAYS: it was uploaded, and removing the chip deletes nothing.
    expect(uploads).toHaveLength(1)
    expect(deletes).toEqual([])
  })

  it('test_UAT_FC_REQ-414_choosing_for_reference_on_the_chip_keeps_the_library_item_reference_only', async () => {
    const { app, prompts, uploads, roles } = mount()
    await settle()
    await dropOnChat(app, [photo()])

    const select = chipsOf(app)[0].querySelector('.builder-attach__role') as HTMLSelectElement
    select.value = 'reference'
    select.dispatchEvent(new Event('change'))
    expect(chipsOf(app)[0].querySelector('.builder-attach__status')!.textContent).toBe(
      "I'll read it — it won't appear on your site",
    )

    app.chat.getChat().setInputMarkdown('For background')
    await pressEnter(app)

    // Uploaded as reference, and never widened: the Library item is reference-only.
    expect(uploads[0].role).toBe('reference')
    expect(roles).toEqual([])
    expect(prompts).toEqual(['For background\n\n📎 Attached: IMAGE-12 (for reference), `shopfront.jpg`'])
  })

  it('test_UAT_FC_REQ-414_a_refused_file_says_why_on_its_chip_and_is_not_sent', async () => {
    const { app, prompts } = mount({
      upload: async () => {
        throw new Error('That file is 22MB, and the limit is 20MB. Try a smaller version of it.')
      },
    })
    await settle()
    await dropOnChat(app, [photo('huge.jpg')])

    const [chip] = chipsOf(app)
    expect(chip.dataset.state).toBe('refused')
    expect(chip.querySelector('.builder-attach__status')!.textContent).toContain('the limit is 20MB')
    expect(app.chat.getChat().getMessages()).toHaveLength(0)

    app.chat.getChat().setInputMarkdown('Hello')
    await pressEnter(app)
    expect(prompts).toEqual(['Hello'])
    // It stays, still saying why, until the client removes it.
    expect(chipsOf(app)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-414_a_file_added_while_the_consultant_works_goes_with_the_next_message', async () => {
    let release = () => {}
    const turnGate = new Promise<void>((resolve) => (release = resolve))
    const { app, prompts } = mount({ turnGate })
    await settle()

    void app.chat.getChat().send('Start the build')
    await settleMany()
    expect(prompts).toEqual(['Start the build'])

    // MID-TURN: the chip waits like any other, and goes with what is sent next.
    await dropOnChat(app, [photo()])
    expect(chipsOf(app)).toHaveLength(1)
    app.chat.getChat().setInputMarkdown('Use this one')
    await pressEnter(app)
    expect(chipsOf(app)).toHaveLength(0)

    release()
    await settleMany(12)
    expect(prompts).toEqual(['Start the build', `Use this one\n\n${LINE}`])
  })

  it('test_UAT_FC_REQ-414_after_a_reload_the_attachment_appears_inside_the_clients_message', async () => {
    const { app } = mount({
      turns: [
        { role: 'user', markdown: `Here is the shop\n\n${LINE}` },
        { role: 'assistant', markdown: 'Got it. Want it in the hero?' },
      ],
      material: [{ uid: 'material-12', label: 'IMAGE-12', kind: 'image', role: 'site' }],
    })
    await settleMany()

    const messages = app.chat.getChat().getMessages()
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    const bubble = app.chat.element.querySelector('.chat-message.user') as HTMLElement
    const drawn = bubble.querySelector('.builder-attached') as HTMLElement
    expect(drawn.dataset.label).toBe('IMAGE-12')
    expect(drawn.dataset.role).toBe('site')
    expect(drawn.textContent).toContain('shopfront.jpg')
    // The thumbnail is the Library's own file, resolved by the label.
    expect(drawn.querySelector('img')!.getAttribute('src')).toBe('/api/material/file?uid=material-12')
    expect(bubble.textContent).toContain('Here is the shop')
  })
})
