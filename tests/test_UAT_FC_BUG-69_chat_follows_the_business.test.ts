// @vitest-environment jsdom
/**
 * BUG-69 — **the conversation on screen follows the business, even when the two
 * businesses name their site the same way**.
 *
 * WHAT WENT WRONG. A session id is derived from the slug — `site-<slug>` — and
 * that is unique wherever the origin resolves it, because every request is
 * business-scoped and the host reads the id against that business's own store.
 * It is not unique in the browser: slugs are per business by design, so two
 * businesses may each hold a site named the same way. The pane treated the id as
 * a global identity and skipped the swap when it matched what was on screen, so
 * a switch between two such businesses read the right transcript from the origin
 * and then threw it away — leaving one business's conversation beside the other
 * business's site. That is exactly what was reported: the XGD site on the left,
 * the Lagrange Foundry chat on the right, both sites slugged `unnamed`.
 *
 * WHAT MAKES THIS EVIDENCE. Every case mounts the REAL builder over the actually
 * installed shared `webui-*` components and drives the switch through
 * `app.scope.setBusiness` — the one function the switcher's `change` handler
 * calls. The injected seams are the network ones the builder already declares.
 * The fixture's `openSession` answers `site-<slug>` for both businesses, because
 * that is what the origin genuinely answers; a fixture that minted distinct ids
 * would prove nothing, which is how the existing REQ-179 shared-slug case missed
 * this — it asserted only that the transport had been ASKED.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
type Turn = { role: string; markdown: string }

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let CHAT_ID_PREFIX: string
/**
 * The business every URL the builder builds is currently about.
 *
 * Read here rather than closed over from the mounted handle because it is the
 * SAME fact the origin would resolve a request against — `app.js` sets it before
 * the site read, so a session opened under it is the session that business would
 * genuinely have answered with.
 */
let getBusinessScope: () => string | null

if (!WEBUI_INSTALLED) console.warn(`BUG-69 suite skipped: ${WEBUI_SKIP_REASON}`)

/** A `Storage`-shaped map, so drafts do not leak between cases. */
function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
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

const settle = () => new Promise((r) => setTimeout(r, 0))

/** Two businesses, each holding one site — and both sites named `unnamed`. */
const BUSINESSES = [
  { id: 'biz_foundry', name: 'Lagrange Foundry', selectable: true },
  { id: 'biz_xgd', name: 'XGD', selectable: true },
]

const FOUNDRY: Turn[] = [
  { role: 'user', markdown: 'Make the foundry heading bigger' },
  { role: 'assistant', markdown: 'Done — the Foundry heading is larger.' },
]
const XGD: Turn[] = [{ role: 'user', markdown: 'Give XGD a darker palette' }]

const TRANSCRIPTS: Record<string, Turn[]> = { biz_foundry: FOUNDRY, biz_xgd: XGD }

let root: HTMLElement

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ CHAT_ID_PREFIX } = await import('../apps/control-app/src/builder/chat.js'))
    ;({ getBusinessScope } = await import('../apps/control-app/src/builder/api.js'))
  }
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/**
 * The real builder, scoped to whichever business the test has selected.
 *
 * `openSession` answers the way the origin does: an id named after the SLUG, and
 * a transcript read out of the business currently in scope. The two facts
 * together are the whole bug — same id, different conversation.
 */
function mount(over: Record<string, unknown> = {}) {
  const asked = { sessions: [] as string[] }
  const app = mountBuilder(root, {
    businesses: BUSINESSES,
    person: { name: 'Sam', email: 'sam@example.test' },
    storage: memoryStorage(),
    loadSites: async () => [{ slug: 'unnamed', latest: null }],
    chatTransport: {
      openSession: async (slug: string) => {
        asked.sessions.push(slug)
        return {
          sessionId: `site-${slug}`,
          turns: TRANSCRIPTS[getBusinessScope() ?? ''] ?? [],
          ready: true,
        }
      },
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => ({ uid: 'material-1', role: 'site', indexed: true }),
    },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
    ...over,
  })
  return { app, asked }
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-69 — the chat pane follows the business', () => {
  it('test_UAT_FC_BUG-69_a_business_switch_swaps_the_conversation_when_the_slug_is_shared', async () => {
    const { app, asked } = mount()
    await settle()

    // Opened on the first business, showing its conversation.
    expect(app.scope.getBusiness()).toBe('biz_foundry')
    expect(app.scope.getSite()).toBe('unnamed')
    expect(app.chat.getChat().getMessages()).toEqual(FOUNDRY)

    // The operator's own gesture, through the control that is on screen.
    const select = root.querySelector('.builder-business__select') as HTMLSelectElement
    select.value = 'biz_xgd'
    select.dispatchEvent(new Event('change'))
    await settle()

    // THE CLAIM. The site pane moved — it always did — and so did the pane
    // beside it. Not one turn of the business being left behind survives.
    expect(app.panel.frame.getAttribute('src')).toBe('/b/biz_xgd/preview/unnamed/draft/')
    expect(app.chat.getChat().getMessages()).toEqual(XGD)
    expect(app.chat.getChat().getMessages()).not.toContainEqual(FOUNDRY[0])

    // The origin was asked under both scopes — the read was never the problem.
    expect(asked.sessions).toEqual(['unnamed', 'unnamed'])

    // Switching back is symmetrical: the id is the same string a third time and
    // the pane still moves.
    select.value = 'biz_foundry'
    select.dispatchEvent(new Event('change'))
    await settle()
    expect(app.chat.getChat().getMessages()).toEqual(FOUNDRY)
  })

  it('test_UAT_FC_BUG-69_the_pane_is_remounted_per_business_so_a_draft_does_not_travel', async () => {
    const { app } = mount()
    await settle()

    // The wire id is the origin's and is unchanged — it is what turns are
    // addressed to. The pane's own identity for the conversation is wider, and
    // the mounted widget is keyed on THAT, which is also the composer's draft
    // key.
    expect(app.chat.getSessionId()).toBe('site-unnamed')
    const chatId = () =>
      app.chat.element.querySelector('.chat-widget')!.getAttribute('data-chat-id')
    expect(chatId()).toBe(`${CHAT_ID_PREFIX}biz_foundry/site-unnamed`)

    const DRAFT = 'Half a sentence about the foundry'
    app.chat.getChat().setInputMarkdown(DRAFT)
    expect(app.chat.getChat().getInputMarkdown()).toBe(DRAFT)

    await app.scope.setBusiness('biz_xgd')
    await settle()

    // A different conversation, so a different composer: the half-typed message
    // stays with the business it was typed under.
    expect(chatId()).toBe(`${CHAT_ID_PREFIX}biz_xgd/site-unnamed`)
    expect(app.chat.getChat().getInputMarkdown()).toBe('')
    expect(app.chat.getSessionId()).toBe('site-unnamed')

    // …and it is still there on the way back.
    await app.scope.setBusiness('biz_foundry')
    await settle()
    expect(app.chat.getChat().getInputMarkdown()).toBe(DRAFT)
  })

  it('test_UAT_FC_BUG-69_a_site_change_within_one_business_still_swaps_the_conversation', async () => {
    // The narrow fix would have been to remount on every business switch and
    // leave identity alone; this case is what keeps the ORDINARY path — a site
    // change, no scope movement — honest, and it is the path the whole pane was
    // built around.
    const seen: string[] = []
    const { app } = mount({
      businesses: [BUSINESSES[0]],
      loadSites: async () => [
        { slug: 'unnamed', latest: null },
        { slug: 'second', latest: null },
      ],
      chatTransport: {
        openSession: async (slug: string) => {
          seen.push(slug)
          return {
            sessionId: `site-${slug}`,
            turns: [{ role: 'user', markdown: `about ${slug}` }],
            ready: true,
          }
        },
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })
    await settle()
    expect(app.chat.getChat().getMessages()).toEqual([{ role: 'user', markdown: 'about unnamed' }])

    app.panel.setSite('second')
    await settle()
    expect(seen).toEqual(['unnamed', 'second'])
    expect(app.chat.getChat().getMessages()).toEqual([{ role: 'user', markdown: 'about second' }])
    expect(
      app.chat.element.querySelector('.chat-widget')!.getAttribute('data-chat-id'),
    ).toBe(`${CHAT_ID_PREFIX}biz_foundry/site-second`)
  })
})
