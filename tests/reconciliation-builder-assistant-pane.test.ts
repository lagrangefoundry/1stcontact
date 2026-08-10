// @vitest-environment jsdom
/**
 * story-7f437d57 — **the conversation beside the site, about that site**
 * (CAP-90 bundle, plan item 5; AC-1062 … AC-1070).
 *
 * The workspace shows the operator's rendered site in one pane. This suite owns
 * what is in the other one: a working conversation, not a label saying one is
 * coming.
 *
 * WHY THE REAL COMPONENTS. Mounted against the ACTUALLY-INSTALLED `webui-chat`
 * rather than a stand-in, for the reason the REQ-122 panel suite gives: every
 * criterion here is about what the browser SHOWS — which panel is mounted, which
 * turns are in the list, what the composer is still holding — and a mocked panel
 * would assert precisely nothing. The suites skip when the shared store is
 * absent (see `support/webui-installed`), because a green run that proved
 * nothing would be worse than a reported gap.
 *
 * WHERE THE BOUNDARY IS. The workspace entry point is `mountBuilder`, and that is
 * where all but one of these tests drive from — the criteria are written about
 * the workspace ("switching sites", "the display panel reports"), and the
 * translation from a chosen site to a conversation happens in `app.js`. Only the
 * transport is injected: it is HTTP, jsdom cannot serve it, and the origin half
 * is proven against real routes elsewhere.
 *
 * SINCE REQ-127 the pane holds a conversation and no site (see `chat.js`), so the
 * seam is split — `openSession` takes a slug because only the app knows one,
 * `streamPrompt` takes a session id because only the pane knows when the operator
 * sent something. The assertions follow that split: "which site" is asked at the
 * app boundary, "which conversation" at the pane's. AC-1070's race criterion is
 * deliberately stated as an outcome rather than a mechanism, because the guard
 * moved from the pane to the app when the intent changed and the observable
 * result is identical either way.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ slug: 'alpha', latest: null }, { slug: 'beta', latest: 1 }]

/** The pane's empty-state invitation, as `chat.js` declares it. */
const EMPTY_TEXT = 'Ask for a change to your site.'

interface Turn {
  role: string
  markdown: string
}

interface ChatWidget {
  getMessages: () => Turn[]
  send: (text: string) => Promise<void>
  getInputMarkdown: () => string
  setInputMarkdown: (md: string) => void
  getToolEvents: () => { id: string; name: string; input: object; result: string | null }[]
  isToolPaneOpen: () => boolean
  toggleToolPane: () => void
}

interface BuilderApp {
  split: { element: HTMLElement }
  panel: { getSite: () => string | null; setSite: (slug: string | null) => void }
  toolbar: { element: HTMLElement }
  chat: { element: HTMLElement; getSessionId: () => string | null; getChat: () => ChatWidget }
  destroy: () => void
}

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => BuilderApp
let CHAT_ID_PREFIX: string

if (!WEBUI_INSTALLED) console.warn(`story-7f437d57 pane suites skipped: ${WEBUI_SKIP_REASON}`)

/**
 * A workspace-scoped store the test owns.
 *
 * Real `localStorage` would leak the panel's site and the composer's drafts
 * between tests, which is exactly what two of these criteria are about.
 */
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
 * should only ever see slugs and `streamPrompt` only ever session ids, so a
 * regression that reintroduced a site identity below the app would show up here
 * as a slug where an id belongs.
 */
function fakeTransport(sessions: Record<string, unknown> = {}, reply: Record<string, string> = {}) {
  const asked: { openSession: string[]; streamPrompt: unknown[][] } = {
    openSession: [],
    streamPrompt: [],
  }
  return {
    asked,
    openSession: async (slug: string) => {
      asked.openSession.push(slug)
      return sessions[slug] ?? { sessionId: `site-${slug}`, turns: [], ready: true }
    },
    streamPrompt: async function* (...args: unknown[]) {
      asked.streamPrompt.push(args)
      yield { kind: 'text', content: reply[args[0] as string] ?? 'ok' }
      yield { kind: 'done' }
    },
  }
}

/** Let the app's site-change `openSession` settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ CHAT_ID_PREFIX } = await import('../apps/control-app/src/builder/chat.js'))
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

// ── the pane is a live surface ───────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-7f437d57 — a live conversation, not a placeholder', () => {
  it('test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site', async () => {
    const transport = fakeTransport()
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: transport,
    })
    await settle()

    // A REAL panel in the split's secondary: a message list AND a composer, not
    // a line of text standing in for one.
    const widget = app.split.element.querySelector('.chat-widget')
    expect(widget).toBeTruthy()
    expect(app.split.element.querySelector('.chat-widget-messages')).toBeTruthy()
    const composer = app.split.element.querySelector('.chat-widget-input-bar')
    expect(composer).toBeTruthy()
    expect(composer!.querySelector('.chat-widget-input')).toBeTruthy()

    // …a composer that can be TYPED INTO and SENT FROM. The send control is
    // inert while there is nothing to send and live once there is, which is the
    // observable difference between a working composer and a decorative one.
    const sendBtn = composer!.querySelector('.chat-widget-send-btn')!
    expect(sendBtn.hasAttribute('disabled')).toBe(true)
    app.chat.getChat().setInputMarkdown('Make the heading bigger')
    expect(sendBtn.hasAttribute('disabled')).toBe(false)

    // The conversation it holds is the one for the site the display panel
    // reports — bound once, by the app, as the session it opened.
    expect(app.panel.getSite()).toBe('alpha')
    expect(transport.asked.openSession).toEqual(['alpha'])
    expect(widget!.getAttribute('data-chat-id')).toBe(`${CHAT_ID_PREFIX}site-alpha`)

    // And it was there before the operator did anything: the only calls made
    // above were the two assertions on the composer, and the conversation was
    // already open and mounted before them. No button to start one.
    expect(app.chat.getSessionId()).toBe('site-alpha')
  })

  it('test_UAT_AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload', async () => {
    const HISTORY: Turn[] = [
      { role: 'user', markdown: 'Rename the shop' },
      { role: 'assistant', markdown: 'Renamed it to Alpha Bakery.' },
      { role: 'user', markdown: 'And make the heading bigger' },
    ]
    const storage = memoryStorage()
    const transport = fakeTransport({
      alpha: { sessionId: 'site-alpha', ready: true, turns: HISTORY },
    })

    const first = mountBuilder(root, { sites: SITES, storage, chatTransport: transport })
    await settle()

    // The messages shown ARE the turns the conversation holds — in order, and
    // each attributed to whoever said it. Without this the assistant would
    // answer from context the operator cannot see.
    expect(first.chat.getChat().getMessages()).toEqual(HISTORY)
    first.destroy()

    // Reloading the workspace: a fresh mount against the same persisted state.
    // What the assistant remembers is still what the operator can see.
    root = document.createElement('div')
    document.body.append(root)
    const second = mountBuilder(root, { sites: SITES, storage, chatTransport: transport })
    await settle()
    expect(second.chat.getChat().getMessages()).toEqual(HISTORY)

    // A site with nothing said yet shows an EMPTY conversation with its
    // invitation to type — not the other site's messages, and not a blank pane.
    second.panel.setSite('beta')
    await settle()
    expect(second.chat.getChat().getMessages()).toEqual([])
    const empty = second.chat.element.querySelector('.chat-widget-empty-state')!
    expect(empty).toBeTruthy()
    expect(empty.hasAttribute('hidden')).toBe(false)
    expect(empty.textContent).toBe(EMPTY_TEXT)
  })
})

// ── the pane follows the displayed site ──────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-7f437d57 — one site, chosen in one place', () => {
  it('test_UAT_AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses', async () => {
    const transport = fakeTransport({
      alpha: {
        sessionId: 'site-alpha',
        ready: true,
        turns: [{ role: 'user', markdown: 'Alpha question' }],
      },
      beta: {
        sessionId: 'site-beta',
        ready: true,
        turns: [
          { role: 'user', markdown: 'Rename the shop' },
          { role: 'assistant', markdown: 'Renamed it to Beta Bakery.' },
        ],
      },
    })
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: transport,
    })
    await settle()
    expect(app.chat.getChat().getMessages()).toEqual([{ role: 'user', markdown: 'Alpha question' }])

    app.panel.setSite('beta')
    await settle()

    // The same action moved BOTH halves: the pane now shows beta's turns and
    // the display panel reports beta.
    expect(app.chat.getChat().getMessages()).toEqual([
      { role: 'user', markdown: 'Rename the shop' },
      { role: 'assistant', markdown: 'Renamed it to Beta Bakery.' },
    ])
    expect(app.panel.getSite()).toBe('beta')
    expect(app.chat.element.querySelector('.chat-widget')!.getAttribute('data-chat-id')).toBe(
      `${CHAT_ID_PREFIX}site-beta`,
    )
    expect(transport.asked.openSession).toEqual(['alpha', 'beta'])

    // Returning shows alpha's conversation again, still unmixed in both
    // directions — beta's turns never appeared under alpha, or the reverse.
    app.panel.setSite('alpha')
    await settle()
    expect(app.chat.getChat().getMessages()).toEqual([{ role: 'user', markdown: 'Alpha question' }])

    // EXACTLY ONE place a site is chosen, scoped to the WHOLE workspace rather
    // than to the split — the toolbar is the split's sibling, so a narrower
    // scope would pass while a second selector sat next to the one it found.
    // The pane offers no control of its own that could disagree with the
    // toolbar's: asserted as a surface (no `setSite`/`getSite` to call) and as
    // DOM (the workspace's only selection control is the toolbar's).
    const selectors = root.querySelectorAll('select')
    expect(selectors.length).toBe(1)
    expect(selectors[0].className).toBe('builder-toolbar__site')
    expect(app.toolbar.element.contains(selectors[0])).toBe(true)
    expect(app.chat.element.querySelectorAll('select').length).toBe(0)
    expect((app.chat as Record<string, unknown>).setSite).toBeUndefined()
    expect((app.chat as Record<string, unknown>).getSite).toBeUndefined()
  })

  it('test_UAT_AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in', async () => {
    const sent: unknown[][] = []
    const midTurn: Turn[][] = []
    const app: BuilderApp = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async (slug: string) => ({
          sessionId: `site-${slug}`,
          turns: [],
          ready: true,
        }),
        streamPrompt: async function* (...args: unknown[]) {
          sent.push(args)
          yield { kind: 'text', content: 'Done — ' }
          // The turn is STILL OPEN here. What the list holds at this moment is
          // what the operator can already see, so a snapshot taken now is the
          // difference between a reply that arrives progressively and one that
          // lands in a single lump at the end.
          midTurn.push(app.chat.getChat().getMessages())
          yield { kind: 'text', content: 'the heading is bigger.' }
          yield { kind: 'done' }
        },
      },
    })
    await settle()

    app.panel.setSite('beta')
    await settle()
    await app.chat.getChat().send('Make the heading bigger')

    // Addressed to the conversation on screen and ONLY that one — exactly two
    // arguments, the first being beta's session. A slug (or alpha's session)
    // appearing here would mean the previous site was carried into the turn.
    expect(sent).toEqual([['site-beta', 'Make the heading bigger']])

    // Mid-turn the reply was already partly rendered…
    expect(midTurn).toEqual([
      [
        { role: 'user', markdown: 'Make the heading bigger' },
        { role: 'assistant', markdown: 'Done — ' },
      ],
    ])

    // …and it ends as ONE completed assistant message, not one per delta.
    const messages = app.chat.getChat().getMessages()
    expect(messages).toEqual([
      { role: 'user', markdown: 'Make the heading bigger' },
      { role: 'assistant', markdown: 'Done — the heading is bigger.' },
    ])
    expect(messages.filter((m) => m.role === 'assistant').length).toBe(1)
  })

  it('test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area', async () => {
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async (slug: string) => ({
          sessionId: `site-${slug}`,
          turns: [],
          ready: true,
        }),
        streamPrompt: async function* (sessionId: string) {
          // beta's turn acts on the site; alpha's only speaks.
          if (sessionId === 'site-beta') {
            yield {
              kind: 'tool_activity',
              meta: {
                event: 'tool_call',
                id: 'call-1',
                name: 'set_l1',
                input: { page: 'home', path: '0.0.0' },
                output: 'Replaced the element at 0.0.0',
              },
            }
          }
          yield { kind: 'text', content: 'Done — the heading is bigger.' }
          yield { kind: 'done' }
        },
      },
    })
    await settle()

    // A turn that ACTS. Open the pane's activity area first so the activity is
    // observed where the operator would see it, not only in its model.
    app.panel.setSite('beta')
    await settle()
    const acting = app.chat.getChat()
    acting.toggleToolPane()
    expect(acting.isToolPaneOpen()).toBe(true)
    await acting.send('Make the heading bigger')

    // Shown in the pane's OWN area for it, alongside the reply.
    const body = app.chat.element.querySelector('.chat-tool-pane-body')!
    expect(body).toBeTruthy()
    const shown = [...body.querySelectorAll('.chat-tool-event-name')].map((n) => n.textContent)
    expect(shown).toEqual(['set_l1'])
    expect(acting.getToolEvents()).toEqual([
      {
        id: 'call-1',
        name: 'set_l1',
        input: { page: 'home', path: '0.0.0' },
        result: 'Replaced the element at 0.0.0',
      },
    ])

    // DISTINCT from what was said: the reply is still there, and the activity
    // did not leak into the message text.
    const messages = acting.getMessages()
    expect(messages[messages.length - 1]).toEqual({
      role: 'assistant',
      markdown: 'Done — the heading is bigger.',
    })
    expect(messages.every((m) => !m.markdown.includes('set_l1'))).toBe(true)

    // A turn that reports NO activity leaves that area with nothing in it —
    // not an empty frame's worth of noise.
    app.panel.setSite('alpha')
    await settle()
    const quiet = app.chat.getChat()
    quiet.toggleToolPane()
    await quiet.send('Just tell me what you would change')
    expect(quiet.getToolEvents()).toEqual([])
    expect(
      app.chat.element.querySelectorAll('.chat-tool-pane-body .chat-tool-event').length,
    ).toBe(0)
    expect(quiet.getMessages().some((m) => m.role === 'assistant')).toBe(true)
  })

  it('test_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip', async () => {
    const DRAFT = 'Could you make the hero photo a bit warmer'
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: fakeTransport(),
    })
    await settle()

    // Half-typed into alpha's composer, never sent.
    app.chat.getChat().setInputMarkdown(DRAFT)
    expect(app.chat.getChat().getInputMarkdown()).toBe(DRAFT)

    // Beta's composer is its own — alpha's unfinished thought is not in it.
    app.panel.setSite('beta')
    await settle()
    expect(app.chat.getSessionId()).toBe('site-beta')
    expect(app.chat.getChat().getInputMarkdown()).toBe('')

    // Back to alpha: exactly that text, still unsent and unchanged. Nothing was
    // sent on the way — the message list is still empty.
    app.panel.setSite('alpha')
    await settle()
    expect(app.chat.getSessionId()).toBe('site-alpha')
    expect(app.chat.getChat().getInputMarkdown()).toBe(DRAFT)
    expect(app.chat.getChat().getMessages()).toEqual([])
  })
})

// ── the pane says what is wrong ──────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-7f437d57 — failure is visible, history survives', () => {
  it('test_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact', async () => {
    const EARLIER: Turn[] = [
      { role: 'user', markdown: 'Rename the shop' },
      { role: 'assistant', markdown: 'Renamed it to Alpha Bakery.' },
    ]
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: fakeTransport({
        alpha: {
          sessionId: 'site-alpha',
          turns: EARLIER,
          ready: false,
          error: 'The assistant is not switched on: no ANTHROPIC_API_KEY.',
        },
      }),
    })
    await settle()

    // The pane still MOUNTED…
    expect(app.chat.element.querySelector('.chat-widget')).toBeTruthy()

    const messages = app.chat.getChat().getMessages()
    // …still shows every turn the conversation already holds, in order. The
    // history is not what failed, and it is not cleared, hidden, or replaced.
    expect(messages.slice(0, EARLIER.length)).toEqual(EARLIER)

    // …and the reason is stated IN THE CONVERSATION, naming the specific thing
    // that is missing rather than a generic failure.
    expect(messages.length).toBe(EARLIER.length + 1)
    const notice = messages[messages.length - 1]
    expect(notice.role).toBe('assistant')
    expect(notice.markdown).toContain('ANTHROPIC_API_KEY')
  })

  it('test_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank', async () => {
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

    // The pane still presents its conversation surface — not an empty pane and
    // not a bare rail.
    expect(app.chat.element.querySelector('.chat-widget')).toBeTruthy()
    expect(app.chat.element.querySelector('.chat-widget-messages')).toBeTruthy()
    expect(app.chat.element.querySelector('.chat-widget-input-bar')).toBeTruthy()

    // It states that the assistant could not be reached, INCLUDING the
    // underlying reason — reported in the same place and the same form as an
    // assistant that is merely unable to run (an assistant note in the list),
    // so the operator has one place to look and the pane one failure mode.
    const messages = app.chat.getChat().getMessages()
    expect(messages.length).toBe(1)
    expect(messages[0].role).toBe('assistant')
    expect(messages[0].markdown).toContain('could not be reached')
    expect(messages[0].markdown).toContain('Failed to fetch')

    // No indefinite wait: nothing is still streaming, and the empty-state has
    // been stood down because the pane has something to say.
    expect(app.chat.element.querySelector('.chat-widget.is-streaming')).toBeNull()
    expect(
      app.chat.element.querySelector('.chat-widget-empty-state')!.hasAttribute('hidden'),
    ).toBe(true)
  })

  it('test_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site', async () => {
    const sent: unknown[][] = []
    let releaseAlpha: () => void = () => {}

    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        // Alpha's open is HELD past beta's, so a workspace that adopted whichever
        // answer arrived last would finish showing alpha — the site the operator
        // left. Alpha carries turns precisely so their absence is observable.
        openSession: (slug: string) =>
          slug === 'alpha'
            ? new Promise((resolve) => {
                releaseAlpha = () =>
                  resolve({
                    sessionId: 'site-alpha',
                    ready: true,
                    turns: [
                      { role: 'user', markdown: 'Stale alpha question' },
                      { role: 'assistant', markdown: 'Stale alpha answer.' },
                    ],
                  })
              })
            : Promise.resolve({
                sessionId: `site-${slug}`,
                ready: true,
                turns: [{ role: 'user', markdown: 'Beta question' }],
              }),
        streamPrompt: async function* (...args: unknown[]) {
          sent.push(args)
          yield { kind: 'done' }
        },
      },
    })

    // Change site again before the first has been retrieved; beta answers at
    // once. Then let alpha finish, late.
    app.panel.setSite('beta')
    await settle()
    releaseAlpha()
    await settle()

    // The pane ends up on the site chosen LAST…
    expect(app.chat.getSessionId()).toBe('site-beta')
    expect(app.panel.getSite()).toBe('beta')

    // …and the late answer for the abandoned site was DISCARDED: none of its
    // turns are in the pane.
    const messages = app.chat.getChat().getMessages()
    expect(messages).toEqual([{ role: 'user', markdown: 'Beta question' }])
    expect(messages.every((m) => !m.markdown.includes('Stale alpha'))).toBe(true)

    // …and a message sent afterwards goes to the last-chosen site's
    // conversation, not the one that arrived late.
    await app.chat.getChat().send('Make the heading bigger')
    expect(sent).toEqual([['site-beta', 'Make the heading bigger']])
  })
})
