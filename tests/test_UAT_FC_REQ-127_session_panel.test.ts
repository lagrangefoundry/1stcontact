// @vitest-environment jsdom
/**
 * REQ-127 — **the browser half: the pane holds no site**.
 *
 * The origin half (`test_UAT_FC_REQ-127_session_binding`) shows that a turn
 * identifies a conversation and that the conversation carries the site. This
 * shows the consequence up here: the chat pane has no site concept AT ALL, and
 * the translation from a chosen site to a conversation happens once, in `app.js`,
 * because that is the layer that owns the site selector.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat` for the reason the REQ-122
 * panel suite gives: a mocked panel would assert nothing. The transport is
 * injected because it is HTTP.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ slug: 'alpha', latest: null }, { slug: 'beta', latest: 1 }]

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let createChatPanel: (opts?: Record<string, unknown>) => never
let CHAT_ID_PREFIX: string

if (!WEBUI_INSTALLED) console.warn(`REQ-127 panel suites skipped: ${WEBUI_SKIP_REASON}`)

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

// ── the pane ─────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-127 — the chat pane has no site concept', () => {
  it('test_UAT_FC_REQ-127_the_pane_exposes_no_way_to_name_a_site', () => {
    const chat = createChatPanel({
      transport: {
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })

    // The API is the evidence. There is no `setSite` for a host to call and no
    // `getSite` for one to read, so a caller cannot put this pane on a site —
    // only on a conversation. That is the whole ticket, stated as a surface.
    expect(chat.setSite).toBeUndefined()
    expect(chat.getSite).toBeUndefined()
    expect(typeof chat.setSession).toBe('function')
    expect(chat.getSessionId()).toBeNull()
  })

  it('test_UAT_FC_REQ-127_a_turn_carries_the_session_it_was_given_and_nothing_else', async () => {
    const sent: unknown[][] = []
    const chat = createChatPanel({
      transport: {
        streamPrompt: async function* (...args: unknown[]) {
          sent.push(args)
          yield { kind: 'text', content: 'ok' }
          yield { kind: 'done' }
        },
      },
    })
    document.body.append(chat.element)

    chat.setSession({ sessionId: 'site-alpha', turns: [], ready: true })
    await chat.getChat().send('Make the heading bigger')

    // Exactly two arguments, and the first is the conversation. A slug appearing
    // anywhere in this call would mean the pane had reacquired a site identity.
    expect(sent).toEqual([['site-alpha', 'Make the heading bigger']])
  })

  it('test_UAT_FC_REQ-127_being_handed_a_new_session_swaps_the_conversation', async () => {
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
      ready: true,
      turns: [{ role: 'user', markdown: 'Alpha question' }],
    })
    expect(chat.getChat().getMessages()).toEqual([{ role: 'user', markdown: 'Alpha question' }])
    expect(chat.element.querySelector('.chat-widget')!.getAttribute('data-chat-id')).toBe(
      `${CHAT_ID_PREFIX}site-alpha`,
    )

    chat.setSession({
      sessionId: 'site-beta',
      ready: true,
      turns: [{ role: 'user', markdown: 'Beta question' }],
    })

    // A new instance keyed on the conversation — which is also what keys the
    // composer's draft, so a half-typed message belongs to one conversation
    // rather than to all of them.
    expect(chat.getChat().getMessages()).toEqual([{ role: 'user', markdown: 'Beta question' }])
    expect(chat.element.querySelector('.chat-widget')!.getAttribute('data-chat-id')).toBe(
      `${CHAT_ID_PREFIX}site-beta`,
    )
    expect(chat.getSessionId()).toBe('site-beta')
  })
})

// ── 1c does the switching ────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-127 — 1c turns a chosen site into a session', () => {
  it('test_UAT_FC_REQ-127_choosing_a_site_opens_its_session_and_swaps_it_in', async () => {
    const opened: string[] = []
    const turns: string[] = []
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async (slug: string) => {
          opened.push(slug)
          return { sessionId: `site-${slug}`, turns: [], ready: true }
        },
        streamPrompt: async function* (sessionId: string) {
          turns.push(sessionId)
          yield { kind: 'done' }
        },
      },
    })
    await settle()

    app.panel.setSite('beta')
    await settle()

    // The slug stops here: `app.js` asked for beta's session, and everything
    // below now speaks in session ids.
    expect(opened).toEqual(['alpha', 'beta'])
    expect(app.chat.getSessionId()).toBe('site-beta')

    await app.chat.getChat().send('Change the heading')
    expect(turns).toEqual(['site-beta'])
  })

  it('test_UAT_FC_REQ-127_a_slow_open_for_an_abandoned_site_does_not_land', async () => {
    // The race the pane's `generation` token used to guard, asserted where the
    // guard now lives. Alpha's open is held open past beta's, so a host without
    // the guard would finish by showing alpha — the site the operator left.
    let releaseAlpha: () => void = () => {}
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: (slug: string) =>
          slug === 'alpha'
            ? new Promise((resolve) => {
                releaseAlpha = () =>
                  resolve({
                    sessionId: 'site-alpha',
                    ready: true,
                    turns: [{ role: 'user', markdown: 'Stale alpha history' }],
                  })
              })
            : Promise.resolve({ sessionId: `site-${slug}`, ready: true, turns: [] }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })

    // Switch away while alpha is still opening, then let alpha finish late.
    app.panel.setSite('beta')
    await settle()
    releaseAlpha()
    await settle()

    expect(app.chat.getSessionId()).toBe('site-beta')
    expect(app.chat.getChat().getMessages()).toEqual([])
  })
})
