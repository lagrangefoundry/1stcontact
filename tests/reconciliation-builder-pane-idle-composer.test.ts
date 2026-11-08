// @vitest-environment jsdom
/**
 * story-7f437d57 — **a settled conversation opens idle and is answered**
 * (BUNDLE-39, plan item 7; AC-2368 — BUG-64's panel half).
 *
 * WHAT THE CRITERION IS ABOUT. BUG-64 had the origin report every conversation
 * with history as live, so the pane rejoined a turn that was not running, wore
 * its Stop button, and queued (and, with no queue handler in the builder,
 * dropped) what the operator typed. The origin half is pinned on AC-2094 in the
 * workers suite. This is what the pane does with a correct answer: a
 * conversation whose turns have all closed opens with Send showing, and a typed
 * message is sent and answered. The gate on a genuinely live turn is pinned
 * too, because the defect was the flag and not the gate.
 *
 * WHERE THE BOUNDARY IS. Driven from `mountBuilder`, the workspace entry point,
 * with only `openSession` injected — the call that hands the pane an
 * already-open conversation. The pane keeps its real `api.js` transport, so
 * sending and rejoining are observed as HTTP requests on a stubbed `fetch`
 * (`/api/ai/prompt`, `/api/ai/reattach`), served as the same `data: {json}`
 * frames `router.ts` writes. That is the true external boundary in jsdom.
 *
 * Mounted against the actually-installed `webui-chat`: the queue-versus-send
 * decision is the component's, so a mocked panel would assert nothing about it.
 * Absent components skip rather than pass.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

interface ChatWidget {
  getMessages: () => { role: string; markdown: string }[]
  setInputMarkdown: (md: string) => void
  submitInput: () => void
  isStreaming: () => boolean
}

interface BuilderApp {
  chat: { element: HTMLElement; getSessionId: () => string | null; getChat: () => ChatWidget | null }
  destroy: () => void
}

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => BuilderApp

if (!WEBUI_INSTALLED) console.warn(`story-7f437d57 idle-composer suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ slug: 'alpha', latest: 1 }]

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
async function drain(times = 10) {
  for (let i = 0; i < times; i += 1) await settle()
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

type Step = object | Promise<void>

/** A response body that plays `script` as server-sent frames; a promise holds it open. */
function sseBody(script: Step[]) {
  const encoder = new TextEncoder()
  let i = 0
  return {
    getReader: () => ({
      read: async (): Promise<{ value?: Uint8Array; done: boolean }> => {
        while (i < script.length) {
          const step = script[i++]
          if (step instanceof Promise) {
            await step
            continue
          }
          return { value: encoder.encode(`data: ${JSON.stringify(step)}\n\n`), done: false }
        }
        return { done: true }
      },
    }),
  }
}

/**
 * The origin as the pane's own transport sees it. Every prompt and rejoin is
 * recorded, so "sent" and "not sent" are observations of the wire.
 */
function fakeOrigin(opts: { reply: string; reattach?: Step[] }) {
  const prompted: { sessionId: string; text: string }[] = []
  const reattached: { sessionId: string; cursor: number }[] = []
  const fetchImpl = vi.fn(async (url: string, init?: { body?: string }) => {
    const body = JSON.parse(init?.body ?? '{}')
    if (url === '/api/ai/prompt') {
      prompted.push(body)
      return {
        ok: true,
        status: 200,
        body: sseBody([{ kind: 'text', content: opts.reply }, { kind: 'done' }]),
      }
    }
    if (url === '/api/ai/reattach') {
      reattached.push(body)
      return { ok: true, status: 200, body: sseBody(opts.reattach ?? [{ kind: 'done' }]) }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })
  return { fetchImpl, prompted, reattached }
}

const said = (app: BuilderApp) =>
  (app.chat.getChat()?.getMessages() ?? []).map(({ role, markdown }) => ({ role, markdown }))

/** The Stop button, as the operator sees it: the class that swaps Send for live controls. */
const wearingStop = (app: BuilderApp) =>
  app.chat.element.querySelector('.chat-widget.is-streaming') !== null

function type(app: BuilderApp, text: string) {
  const chat = app.chat.getChat()!
  chat.setInputMarkdown(text)
  chat.submitInput()
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

function mount(session: unknown) {
  return mountBuilder(root, {
    sites: SITES,
    storage: memoryStorage(),
    markdownReady: Promise.resolve(),
    chatTransport: { openSession: async () => session },
  })
}

describe.skipIf(!WEBUI_INSTALLED)('story-7f437d57 — a settled conversation opens idle', () => {
  it('test_UAT_AC2368_a_settled_conversation_opens_idle_and_a_typed_message_is_sent_and_answered', async () => {
    // ── EARLIER TURNS, ALL CLOSED ───────────────────────────────────────────
    const quiet = fakeOrigin({ reply: 'The heading is bigger now.' })
    vi.stubGlobal('fetch', quiet.fetchImpl)
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
    const app = mount(settled)
    await drain()

    // Idle, not streaming: Send shows, not Stop, and nothing was rejoined.
    expect(app.chat.getSessionId()).toBe('site-alpha')
    expect(app.chat.getChat()!.isStreaming()).toBe(false)
    expect(wearingStop(app)).toBe(false)
    expect(quiet.reattached).toEqual([])

    // Sent, not queued: the origin is asked to run a turn with that text on
    // this conversation, and its reply is painted.
    type(app, 'Make the heading bigger.')
    await drain()

    expect(quiet.prompted).toEqual([{ sessionId: 'site-alpha', text: 'Make the heading bigger.' }])
    expect(said(app)).toEqual([
      { role: 'user', markdown: 'Change the heading.' },
      { role: 'assistant', markdown: 'Done.' },
      { role: 'user', markdown: 'Make the heading bigger.' },
      { role: 'assistant', markdown: 'The heading is bigger now.' },
    ])
    expect(wearingStop(app)).toBe(false)
    app.destroy()

    // ── THE GATE STILL HOLDS FOR A REAL TURN ────────────────────────────────
    // A conversation genuinely mid-turn, its rejoin held open. The live
    // controls show, and a message typed now never reaches the origin as a
    // second concurrent turn.
    root = document.createElement('div')
    document.body.append(root)
    let release = (): void => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const live = fakeOrigin({ reply: 'unused', reattach: [held, { kind: 'done' }] })
    vi.stubGlobal('fetch', live.fetchImpl)
    const busy = mount({
      sessionId: 'site-alpha',
      turns: [
        { role: 'user', markdown: 'Change the heading.' },
        { role: 'assistant', markdown: 'I have started editing. ' },
      ],
      cursor: 412,
      live: true,
      ready: true,
    })
    await drain()

    expect(live.reattached).toEqual([{ sessionId: 'site-alpha', cursor: 412 }])
    expect(busy.chat.getChat()!.isStreaming()).toBe(true)
    expect(wearingStop(busy)).toBe(true)

    type(busy, 'And the subheading too.')
    await drain()

    expect(live.prompted).toEqual([])
    expect(live.fetchImpl).not.toHaveBeenCalledWith('/api/ai/prompt', expect.anything())

    release()
    await drain()
    busy.destroy()
  })
})
