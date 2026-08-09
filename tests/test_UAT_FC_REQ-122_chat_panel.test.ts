// @vitest-environment jsdom
/**
 * REQ-122 — **the assistant pane in the builder** (DOC-28 §7.1).
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, not a stand-in. The whole
 * point of this half of the ticket is that the placeholder is gone and a real
 * panel is in the split, so a mocked panel would assert precisely nothing.
 *
 * The transport IS injected, and that is the correct line: it is HTTP, jsdom
 * cannot serve it, and `test_UAT_FC_REQ-122_chat_host` already drives the real
 * routes over a real port. What is under test here is what the browser does with
 * the answers — which panel it mounts, which conversation it shows, what it says
 * when the answer is bad.
 *
 * SINCE REQ-127 the pane is handed a session rather than a slug, so the seam is
 * split: `openSession` is `app.js`'s call (it is the only layer that knows a
 * site) and `streamPrompt` is the pane's. The assertions below follow that —
 * "which site" is asked at the app boundary, "which conversation" at the pane's.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ slug: 'alpha', latest: null }, { slug: 'beta', latest: 1 }]

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let createChatPanel: (opts?: Record<string, unknown>) => never
let CHAT_ID_PREFIX: string

if (!WEBUI_INSTALLED) console.warn(`REQ-122 chat panel suites skipped: ${WEBUI_SKIP_REASON}`)

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

/**
 * A transport that answers from a per-site script and records what it was asked.
 *
 * `asked` is what makes the layering assertable from outside: `openSession`
 * should only ever see slugs, `streamPrompt` should only ever see session ids,
 * and a regression that reintroduced a site identity below the app would show up
 * here as a slug where an id belongs.
 */
function fakeTransport(
  sessions: Record<string, unknown> = {},
  reply: Record<string, string> = {},
) {
  const asked: { openSession: string[]; streamPrompt: [string, string][] } = {
    openSession: [],
    streamPrompt: [],
  }
  return {
    asked,
    openSession: async (slug: string) => {
      asked.openSession.push(slug)
      return sessions[slug] ?? { sessionId: `site-${slug}`, turns: [], ready: true }
    },
    streamPrompt: async function* (sessionId: string, text: string) {
      asked.streamPrompt.push([sessionId, text])
      yield { kind: 'text', content: reply[sessionId] ?? 'ok' }
      yield { kind: 'done' }
    },
  }
}

/** Let the app's site-change `openSession` settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ createChatPanel, CHAT_ID_PREFIX } = await import(
      '../apps/control-app/src/builder/chat.js'
    ))
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

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-122 the assistant is in the split', () => {
  it('test_UAT_FC_REQ-122_the_secondary_is_a_live_chat_panel_bound_to_the_shown_site', async () => {
    const transport = fakeTransport()
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: transport })
    await settle()

    // A REAL panel — the composer and the message list, not a line of text.
    const widget = app.split.element.querySelector('.chat-widget')
    expect(widget).toBeTruthy()
    expect(app.split.element.querySelector('.chat-widget-messages')).toBeTruthy()

    // Bound to the site the display panel is showing, with no selector of its
    // own to disagree with the toolbar's — and the binding is made ONCE, by the
    // app, as the session it opened.
    expect(app.panel.getSite()).toBe('alpha')
    expect(transport.asked.openSession).toEqual(['alpha'])
    expect(widget!.getAttribute('data-chat-id')).toBe(`${CHAT_ID_PREFIX}site-alpha`)
  })

  it('test_UAT_FC_REQ-122_switching_site_switches_conversation', async () => {
    const transport = fakeTransport({
      beta: {
        sessionId: 'site-beta',
        ready: true,
        turns: [
          { role: 'user', markdown: 'Rename the shop' },
          { role: 'assistant', markdown: 'Renamed it to Beta Bakery.' },
        ],
      },
    })
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: transport })
    await settle()

    app.panel.setSite('beta')
    await settle()

    // The panel is a NEW instance keyed on the conversation — which is also what
    // keys the composer's draft, so a half-typed message is per conversation
    // rather than shared.
    const widget = app.split.element.querySelector('.chat-widget')!
    expect(widget.getAttribute('data-chat-id')).toBe(`${CHAT_ID_PREFIX}site-beta`)
    expect(transport.asked.openSession).toEqual(['alpha', 'beta'])

    // …and it shows what beta's session remembers. Without this the assistant
    // would answer from context the operator cannot see.
    expect(app.chat.getChat().getMessages()).toEqual([
      { role: 'user', markdown: 'Rename the shop' },
      { role: 'assistant', markdown: 'Renamed it to Beta Bakery.' },
    ])

    // Alpha's empty conversation did not bleed into beta's, and vice versa.
    app.panel.setSite('alpha')
    await settle()
    expect(app.chat.getChat().getMessages()).toEqual([])
  })

  it('test_UAT_FC_REQ-122_a_turn_is_sent_for_the_site_on_screen_and_streams_back_into_the_panel', async () => {
    const transport = fakeTransport({}, { 'site-beta': 'Done — the heading is bigger.' })
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: transport })
    await settle()
    app.panel.setSite('beta')
    await settle()

    // The turn named beta's CONVERSATION. It reaches beta because that is the
    // site the session was opened for, not because the pane re-asserted a slug.
    await app.chat.getChat().send('Make the heading bigger')

    expect(transport.asked.streamPrompt).toEqual([['site-beta', 'Make the heading bigger']])
    expect(app.chat.getChat().getMessages()).toEqual([
      { role: 'user', markdown: 'Make the heading bigger' },
      { role: 'assistant', markdown: 'Done — the heading is bigger.' },
    ])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-122 the pane says what is wrong', () => {
  it('test_UAT_FC_REQ-122_an_unavailable_assistant_is_explained_in_the_panel', () => {
    const chat = createChatPanel({
      transport: {
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })
    document.body.append(chat.element)
    chat.setSession({
      sessionId: 'site-alpha',
      turns: [{ role: 'user', markdown: 'Earlier question' }],
      ready: false,
      error: 'The assistant is not switched on: no ANTHROPIC_API_KEY.',
    })

    const messages = chat.getChat().getMessages()
    // The history survives the outage — it is stored, and it is not the thing
    // that failed.
    expect(messages[0]).toEqual({ role: 'user', markdown: 'Earlier question' })
    // …and the reason is in the panel, where the operator is looking.
    expect(messages[1].markdown).toContain('ANTHROPIC_API_KEY')
  })

  it('test_UAT_FC_REQ-122_an_unreachable_origin_is_reported_rather_than_left_blank', async () => {
    // The open now happens in `app.js`, so this is asserted where the failure
    // occurs. The operator's experience is unchanged: a mounted pane that says
    // what went wrong, rather than an empty rail.
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async () => {
          throw new Error('Failed to fetch')
        },
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })
    await settle()

    expect(app.chat.element.querySelector('.chat-widget')).toBeTruthy()
    expect(app.chat.getChat().getMessages()[0].markdown).toContain('Failed to fetch')
  })
})
