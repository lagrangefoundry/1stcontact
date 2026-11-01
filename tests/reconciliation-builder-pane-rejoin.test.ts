// @vitest-environment jsdom
/**
 * story-7f437d57 — **a workspace loaded mid-turn rejoins it** (BUNDLE-34, plan
 * item 6; AC-2092, AC-2093, AC-2094 — BUG-46's panel half).
 *
 * WHY A THIRD FILE BESIDE THE PANE'S OTHER SUITES. `reconciliation-builder-
 * assistant-pane` owns the pane's original criteria and `…-markdown-readiness`
 * owns what the workspace owes it before it paints. Both are unchanged by this
 * reconciliation. What BUG-46 added is what the pane does when the conversation
 * it is handed is still being written, and the three criteria for it are
 * asserted here.
 *
 * WHERE THE BOUNDARY IS. Every test drives from `mountBuilder`, the workspace
 * entry point, because the criteria are about a workspace "opened or reloaded".
 * Opening the conversation is injected (`openSession`), as the sibling suites
 * do. The rejoin itself is NOT injected: the pane runs on its real `api.js`
 * transport, and only `fetch` is stubbed, serving `/api/ai/reattach` as the
 * same `data: {json}` frames `router.ts` writes. That is the true external
 * boundary — HTTP that jsdom cannot serve — and it keeps the workspace's own
 * wiring of the rejoin (and of its writes to the preview) inside the test. The
 * origin half of the route is proven against real routes in the workers suite.
 *
 * WHY THE STREAMS ARE PACED BY HAND. The pane rejoins a turn that is STILL
 * RUNNING. A stream that finished before anything looked would never show the
 * state the criteria are about, so each body is a script the test can hold open
 * at a gate, or never end at all.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED `webui-chat`, on the pattern the
 * sibling suites state: a mocked panel would assert the mock. Absent components
 * skip rather than pass.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

interface Turn {
  role: string
  markdown: string
}

interface ChatWidget {
  getMessages: () => Turn[]
  setInputMarkdown: (md: string) => void
  getInputMarkdown: () => string
  getToolEvents: () => { id: string; name: string; input: object; result: string | null }[]
}

interface BuilderApp {
  split: { element: HTMLElement }
  panel: { frame: HTMLIFrameElement; setSite: (slug: string | null) => void }
  chat: { element: HTMLElement; getSessionId: () => string | null; getChat: () => ChatWidget | null }
  destroy: () => void
}

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => BuilderApp

if (!WEBUI_INSTALLED) console.warn(`story-7f437d57 rejoin suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ slug: 'alpha', latest: 1 }, { slug: 'beta', latest: 1 }]

/** Let the workspace's open-and-wait chain, and a fire-and-forget rejoin, move on. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** Several turns of the event loop — a rejoin pulls one frame per read. */
async function drain(times = 10) {
  for (let i = 0; i < times; i += 1) await settle()
}

/** A promise this suite decides the moment of. */
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

/** A promise nobody will ever resolve: a turn that is still running. */
const NEVER = new Promise<void>(() => {})

/** Make a read fail. */
const BREAK = Symbol('break')

type Step = object | Promise<void> | typeof BREAK

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

/**
 * A response body that plays `script` as server-sent frames.
 *
 * An object step is one `data:` frame; a promise step holds the stream until it
 * settles; `BREAK` makes the read throw, which is a connection dropped part-way.
 * `onRead` runs immediately before each frame leaves, which is what lets a test
 * sample what the workspace had done in response to the frame before it.
 */
function sseBody(script: Step[], onRead: () => void = () => {}) {
  const encoder = new TextEncoder()
  let i = 0
  return {
    getReader: () => ({
      read: async (): Promise<{ value?: Uint8Array; done: boolean }> => {
        while (i < script.length) {
          const step = script[i++]
          if (step === BREAK) throw new Error('the connection dropped')
          if (step instanceof Promise) {
            await step
            continue
          }
          onRead()
          return { value: encoder.encode(`data: ${JSON.stringify(step)}\n\n`), done: false }
        }
        return { done: true }
      },
    }),
  }
}

/**
 * The origin, as far as the pane's own transport can see it.
 *
 * Only `/api/ai/reattach` is served. Every request is recorded, so "no rejoin was
 * asked for" is an observation of the wire rather than of a flag. `reattach`
 * answers per session id: a script, or `'refuse'` for a fetch that rejects
 * before any response exists.
 */
function fakeOrigin(reattach: Record<string, Step[] | 'refuse'>, onRead?: () => void) {
  const reattached: { sessionId: string; cursor: number }[] = []
  const fetchImpl = vi.fn(async (url: string, init?: { body?: string }) => {
    if (url === '/api/ai/reattach') {
      const body = JSON.parse(init?.body ?? '{}')
      reattached.push(body)
      const script = reattach[body.sessionId]
      if (script === 'refuse') throw new TypeError('Failed to fetch')
      return { ok: true, status: 200, body: sseBody(script ?? [{ kind: 'done' }], onRead) }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })
  return { fetchImpl, reattached }
}

/** `openSession` alone — so the pane keeps its real, rejoin-capable transport. */
function sessions(bySlug: Record<string, unknown>) {
  return {
    openSession: async (slug: string) =>
      bySlug[slug] ?? { sessionId: `site-${slug}`, turns: [], ready: true },
  }
}

/** What was said, as role and text — the component may stamp more. */
const said = (app: BuilderApp) =>
  (app.chat.getChat()?.getMessages() ?? []).map(({ role, markdown }) => ({ role, markdown }))

const streaming = (app: BuilderApp) =>
  app.chat.element.querySelector('.chat-widget.is-streaming') !== null

/** Count re-fetches of the displayed page, at the same object AC-1819 counts. */
function countReloads(app: BuilderApp, onReload: () => void = () => {}) {
  let reloads = 0
  Object.defineProperty(app.panel.frame, 'contentWindow', {
    configurable: true,
    value: {
      location: {
        reload: () => {
          reloads += 1
          onReload()
        },
      },
    },
  })
  return () => reloads
}

/** `/api/ai/session` answered mid-turn: the fold, where it stopped, and that it is live. */
const midTurn = (sessionId = 'site-alpha') => ({
  sessionId,
  turns: [
    { role: 'user', markdown: 'What colour is the heading?' },
    { role: 'assistant', markdown: 'It is gold.' },
    { role: 'user', markdown: 'Change the heading.' },
    { role: 'assistant', markdown: 'I have started editing. ' },
  ],
  cursor: 412,
  live: true,
  ready: true,
})

const BETA = {
  sessionId: 'site-beta',
  turns: [
    { role: 'user', markdown: 'Hello beta.' },
    { role: 'assistant', markdown: 'Hello.' },
  ],
  ready: true,
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

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Mount the workspace on a stubbed origin, with the engines already settled. */
function mount(opts: Record<string, unknown>) {
  return mountBuilder(root, {
    sites: SITES,
    storage: memoryStorage(),
    markdownReady: Promise.resolve(),
    ...opts,
  })
}

/** A fresh host for a second mount within one test. */
function freshRoot() {
  root = document.createElement('div')
  document.body.append(root)
  return root
}

// ── one continuing message, not a frozen half-reply ──────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-7f437d57 — a pane loaded mid-turn rejoins it', () => {
  it('test_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added', async () => {
    // ── LOADED WHILE THE ASSISTANT IS PART-WAY THROUGH A REPLY ──────────────
    const gate = deferred()
    const origin = fakeOrigin({
      'site-alpha': [
        gate.promise,
        {
          kind: 'tool_activity',
          meta: {
            event: 'tool_call',
            id: 'call-1',
            name: 'set_l1',
            input: { page: 'home', path: '0.0.0' },
            output: 'Replaced the element at 0.0.0',
          },
        },
        { kind: 'text', content: 'And now I am ' },
        { kind: 'text', content: 'finished.' },
        { kind: 'done' },
      ],
    })
    vi.stubGlobal('fetch', origin.fetchImpl)
    const app = mount({ chatTransport: sessions({ alpha: midTurn() }) })
    await drain()

    // Mid-rejoin. The rest of the reply is asked for from exactly where the
    // transcript stopped. The earlier turns are finished messages as usual, and
    // the half-reply is NOT one of them: it is the start of the message the rest
    // is being written into. The composer is in its during-a-turn state.
    expect(origin.reattached).toEqual([{ sessionId: 'site-alpha', cursor: 412 }])
    expect(said(app)).toEqual(midTurn().turns)
    expect(streaming(app)).toBe(true)

    gate.resolve()
    await drain()

    // Finished. Still ONE user message for the turn, from the transcript, and
    // ONE assistant message for the reply: the half said before the load and
    // the rest, each piece once.
    expect(said(app)).toEqual([
      { role: 'user', markdown: 'What colour is the heading?' },
      { role: 'assistant', markdown: 'It is gold.' },
      { role: 'user', markdown: 'Change the heading.' },
      { role: 'assistant', markdown: 'I have started editing. And now I am finished.' },
    ])
    // What the assistant did in the rest of the turn is shown in the pane, as
    // it is for a turn sent from the pane, and the composer has its turn back.
    expect(app.chat.getChat()!.getToolEvents()).toEqual([
      {
        id: 'call-1',
        name: 'set_l1',
        input: { page: 'home', path: '0.0.0' },
        result: 'Replaced the element at 0.0.0',
      },
    ])
    expect(streaming(app)).toBe(false)
    app.destroy()

    // ── LOADED BEFORE ANY WORD OF THE REPLY ─────────────────────────────────
    // The turn is open with nothing said yet. It still rejoins: the message
    // starts empty and the whole reply arrives in it.
    freshRoot()
    const empty = fakeOrigin({
      'site-alpha': [{ kind: 'text', content: 'Thinking about it.' }, { kind: 'done' }],
    })
    vi.stubGlobal('fetch', empty.fetchImpl)
    const fresh = mount({
      chatTransport: sessions({
        alpha: {
          sessionId: 'site-alpha',
          turns: [{ role: 'user', markdown: 'Change the heading.' }],
          cursor: 200,
          live: true,
          ready: true,
        },
      }),
    })
    await drain()

    expect(empty.reattached).toEqual([{ sessionId: 'site-alpha', cursor: 200 }])
    expect(said(fresh)).toEqual([
      { role: 'user', markdown: 'Change the heading.' },
      { role: 'assistant', markdown: 'Thinking about it.' },
    ])
    fresh.destroy()

    // ── REJOINING NEVER HOLDS THE PANE ──────────────────────────────────────
    // A turn that never ends. Switching site lands at once, on the other site's
    // conversation, without waiting for the rejoined turn.
    freshRoot()
    const endless = fakeOrigin({
      'site-alpha': [{ kind: 'text', content: 'Still going' }, NEVER],
    })
    vi.stubGlobal('fetch', endless.fetchImpl)
    const held = mount({ chatTransport: sessions({ alpha: midTurn(), beta: BETA }) })
    await drain()
    expect(held.chat.getSessionId()).toBe('site-alpha')
    expect(streaming(held)).toBe(true)

    held.panel.setSite('beta')
    await drain()

    expect(held.chat.getSessionId()).toBe('site-beta')
    expect(said(held)).toEqual(BETA.turns)
    expect(streaming(held)).toBe(false)
    held.destroy()
  })

  // ── the preview follows a rejoined turn's writes ───────────────────────────

  it('test_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply', async () => {
    const WRITES = [
      { kind: 'text', content: 'Edited the heading. ' },
      { kind: 'site_changed', content: '', meta: { at: 7, changes: 1 } },
      { kind: 'text', content: 'Now the footer.' },
      { kind: 'done' },
    ]

    // Sampled immediately before each frame leaves the origin, so the reload is
    // seen to happen AS the write is reported, not once at the end.
    const samples: number[] = []
    let count: () => number = () => 0
    const origin = fakeOrigin({ 'site-alpha': WRITES }, () => samples.push(count()))
    vi.stubGlobal('fetch', origin.fetchImpl)
    const app = mount({ chatTransport: sessions({ alpha: midTurn() }) })
    count = countReloads(app)
    await drain()

    expect(origin.reattached).toEqual([{ sessionId: 'site-alpha', cursor: 412 }])
    expect(samples).toEqual([0, 0, 1, 1])
    expect(count()).toBe(1)

    // The report is not conversation: the text either side of it is one
    // assistant message, and nothing for it is in the list or the activity area.
    expect(said(app)).toEqual([
      ...midTurn().turns.slice(0, -1),
      {
        role: 'assistant',
        markdown: 'I have started editing. Edited the heading. Now the footer.',
      },
    ])
    expect(app.chat.getChat()!.getToolEvents()).toEqual([])
    expect(app.chat.element.querySelectorAll('.chat-tool-event')).toHaveLength(0)
    app.destroy()

    // ── A RE-FETCH THAT THROWS ──────────────────────────────────────────────
    // The frame is gone. The write is still acted on, and the rest of the
    // rejoined reply still arrives.
    freshRoot()
    const failing = fakeOrigin({ 'site-alpha': WRITES })
    vi.stubGlobal('fetch', failing.fetchImpl)
    const broken = mount({ chatTransport: sessions({ alpha: midTurn() }) })
    const brokenCount = countReloads(broken, () => {
      throw new Error('the frame went away')
    })
    await drain()

    expect(brokenCount()).toBe(1)
    expect(said(broken).at(-1)).toEqual({
      role: 'assistant',
      markdown: 'I have started editing. Edited the heading. Now the footer.',
    })
    expect(streaming(broken)).toBe(false)
    broken.destroy()
  })

  // ── a rejoin never costs the operator anything ─────────────────────────────

  it('test_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts', async () => {
    /** After a failure: the pane still switches, and the composer still types. */
    async function stillUsable(app: BuilderApp) {
      app.panel.setSite('beta')
      await drain()
      expect(app.chat.getSessionId()).toBe('site-beta')
      expect(said(app)).toEqual(BETA.turns)
      app.chat.getChat()!.setInputMarkdown('Make the footer smaller')
      expect(app.chat.getChat()!.getInputMarkdown()).toBe('Make the footer smaller')
      const send = app.chat.element.querySelector('.chat-widget-send-btn')!
      expect(send.hasAttribute('disabled')).toBe(false)
    }

    // ── NO TURN IN PROGRESS, NO REJOIN ──────────────────────────────────────
    const quietOrigin = fakeOrigin({})
    vi.stubGlobal('fetch', quietOrigin.fetchImpl)
    const settled = {
      sessionId: 'site-alpha',
      turns: [
        { role: 'user', markdown: 'Change the heading.' },
        { role: 'assistant', markdown: 'Done.' },
      ],
      cursor: 412,
      live: false,
      ready: true,
    }
    const quiet = mount({ chatTransport: sessions({ alpha: settled }) })
    await drain()
    expect(quietOrigin.reattached).toEqual([])
    expect(said(quiet)).toEqual(settled.turns)
    expect(streaming(quiet)).toBe(false)
    quiet.destroy()

    // ── A REJOIN THAT CANNOT START ──────────────────────────────────────────
    // Nothing escapes (an unhandled rejection would fail this run), no note is
    // shown, the painted transcript stays as it was, and the pane is usable.
    freshRoot()
    const refused = fakeOrigin({ 'site-alpha': 'refuse' })
    vi.stubGlobal('fetch', refused.fetchImpl)
    const cannot = mount({ chatTransport: sessions({ alpha: midTurn(), beta: BETA }) })
    await drain()
    expect(refused.reattached).toEqual([{ sessionId: 'site-alpha', cursor: 412 }])
    expect(said(cannot)).toEqual(midTurn().turns)
    expect(streaming(cannot)).toBe(false)
    await stillUsable(cannot)
    cannot.destroy()

    // ── A REJOIN THAT BREAKS PART-WAY ───────────────────────────────────────
    // What arrived before the break stays; nothing is added to say it broke.
    freshRoot()
    const dropped = fakeOrigin({
      'site-alpha': [{ kind: 'text', content: 'And then ' }, BREAK],
    })
    vi.stubGlobal('fetch', dropped.fetchImpl)
    const broke = mount({ chatTransport: sessions({ alpha: midTurn(), beta: BETA }) })
    await drain()
    expect(said(broke)).toEqual([
      ...midTurn().turns.slice(0, -1),
      { role: 'assistant', markdown: 'I have started editing. And then ' },
    ])
    expect(streaming(broke)).toBe(false)
    await stillUsable(broke)
    broke.destroy()

    // ── A TRANSPORT THAT CANNOT REJOIN ──────────────────────────────────────
    // A turn transport with sending and no rejoin. The workspace mounts, the
    // live conversation is shown as finished messages, and no rejoin is asked.
    freshRoot()
    const old = fakeOrigin({})
    vi.stubGlobal('fetch', old.fetchImpl)
    const legacy = mount({
      chatTransport: {
        ...sessions({ alpha: midTurn() }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })
    await drain()
    expect(legacy.split.element.querySelector('.chat-widget')).toBeTruthy()
    expect(said(legacy)).toEqual(midTurn().turns)
    expect(old.reattached).toEqual([])
    expect(old.fetchImpl).not.toHaveBeenCalledWith('/api/ai/reattach', expect.anything())
    expect(streaming(legacy)).toBe(false)
    legacy.destroy()

    // ── LIVE AND UNABLE TO RUN ──────────────────────────────────────────────
    // The reason the assistant cannot run is still shown beside the history.
    freshRoot()
    const frozenOrigin = fakeOrigin({ 'site-alpha': [{ kind: 'done' }] })
    vi.stubGlobal('fetch', frozenOrigin.fetchImpl)
    const frozen = mount({
      chatTransport: sessions({
        alpha: { ...midTurn(), ready: false, error: 'No API key is configured.' },
      }),
    })
    await drain()
    const text = frozen.chat.element.textContent ?? ''
    expect(text).toContain('No API key is configured.')
    expect(text).toContain('Change the heading.')
    expect(text).toContain('It is gold.')
    frozen.destroy()
  })
})
