// @vitest-environment jsdom
/**
 * [[BUG-240]] — **the browser half: a talker reply the host cued is drawn as the
 * consultant's next message, and one that passed is not drawn at all.**
 *
 * THE REAL PANEL (`createChatPanel`) against the installed `webui-chat`, with the
 * origin replaced at the transport it already takes, as REQ-416's panel suite
 * does. A cued round answers the client's message the work started from — which
 * already has its bubble — so its frames name no waiting message, and are marked
 * `cued` instead.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Chat = {
  getMessages: () => { role: string; markdown: string }[]
  setInputMarkdown: (md: string) => void
  submitInput: () => Promise<void>
  getTurnModes: () => Record<string, unknown>
  inputReady: Promise<boolean>
}
type Panel = {
  element: HTMLElement
  setSession: (session: unknown, key?: string) => void
  getChat: () => Chat | null
}

let createChatPanel: (opts?: Record<string, unknown>) => Panel

if (!WEBUI_INSTALLED) console.warn(`BUG-240 panel suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 3) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

const STATUS = 'The consultant is building your home page'

/** A transport whose work runs until released, recording every call. */
function workingTransport() {
  const prompts: { text: string; fromMessages: string[] }[] = []
  const interposed: string[] = []
  const stops: (string | null)[] = []
  const pushes: ((ev: Record<string, unknown>) => void)[] = []
  let release: () => void = () => {}
  return {
    prompts,
    interposed,
    stops,
    /** Put an event on the running work's stream. */
    emit: (ev: Record<string, unknown>) => pushes.at(-1)?.(ev),
    release: () => release(),
    transport: {
      streamPrompt: async function* (_id: string, text: string, _view: unknown, fromMessages: string[] = []) {
        prompts.push({ text, fromMessages })
        const queue: Record<string, unknown>[] = []
        let wake: () => void = () => {}
        pushes.push((ev) => {
          queue.push(ev)
          wake()
        })
        const done = new Promise<void>((resolve) => {
          release = resolve
        })
        yield { kind: 'text', content: 'Building your home page now — about five minutes. While I build, how did the salon start?' }
        yield {
          kind: 'progress',
          content: STATUS,
          meta: { source: 'model', turn_id: 'worker-1', started_at: new Date().toISOString(), eta_s: 300 },
        }
        for (;;) {
          while (queue.length > 0) yield queue.shift()!
          const next = new Promise<void>((resolve) => {
            wake = resolve
          })
          if ((await Promise.race([next.then(() => 'event'), done.then(() => 'done')])) === 'done') break
        }
        while (queue.length > 0) yield queue.shift()!
        yield { kind: 'text', content: ' The home page is built.' }
        yield { kind: 'done', meta: { status: 'complete' } }
      },
      interpose: async (_id: string, text: string) => {
        interposed.push(text)
        return `msg-${interposed.length}`
      },
      stop: async (_id: string, turnId: string | null) => {
        stops.push(turnId)
        return { stopping: true }
      },
    },
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
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

beforeEach(() => {
  document.body.replaceChildren()
})

function open(transport: unknown, session: Record<string, unknown> = {}): Panel {
  const map = new Map<string, string>()
  const storage = {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  }
  const panel = createChatPanel({ storage, transport })
  document.body.append(panel.element)
  panel.setSession({ sessionId: 'site-alpha', cursor: 0, live: false, ready: true, turns: [], talker: true, ...session })
  return panel
}

async function type(panel: Panel, text: string) {
  const chat = panel.getChat()!
  await chat.inputReady
  chat.setInputMarkdown(text)
  // NOT AWAITED: a submit that starts a turn resolves when the turn ends.
  void chat.submitInput()
  await settle()
}


const cued = (turn: string, event: string, content = '', more: Record<string, unknown> = {}) => ({
  kind: 'talker',
  content,
  meta: { event, turn_id: turn, ...(event === 'start' ? { cued: true, said: '' } : {}), ...more },
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-240 a cued talker reply in the panel', () => {
  it('test_UAT_FC_BUG-240_a_cued_reply_is_drawn_once_as_the_consultants_next_message', async () => {
    const work = workingTransport()
    const panel = open(work.transport)
    const ASKED = 'A little more movement — what’s next?'
    await type(panel, ASKED)
    const ANSWER = 'Next is colours and fonts. What do clients love about the salon?'
    work.emit(cued('talker-1', 'start'))
    work.emit(cued('talker-1', 'text', ANSWER))
    work.emit(cued('talker-1', 'done', '', { status: 'complete' }))
    await settle(6)
    const messages = panel.getChat()!.getMessages()
    // ONE COPY, as an assistant message of its own, after the client's message —
    // never inside the work's own bubble, and no empty user bubble for the cue.
    expect(messages.filter((m) => m.markdown.includes(ANSWER)).map(({ role, markdown }) => ({ role, markdown }))).toEqual([
      { role: 'assistant', markdown: ANSWER },
    ])
    const asked = messages.findIndex((m) => m.role === 'user' && m.markdown.includes(ASKED))
    expect(messages.findIndex((m) => m.markdown === ANSWER)).toBeGreaterThan(asked)
    expect(messages.filter((m) => m.role === 'user')).toHaveLength(1)
    // Nothing was sent: the cue is the origin's, not a message of the client's.
    expect(work.interposed).toEqual([])
    work.release()
    await settle(6)
    expect(panel.getChat()!.getMessages().filter((m) => m.markdown.includes(ANSWER))).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-240_a_cued_round_that_passed_draws_nothing', async () => {
    const work = workingTransport()
    const panel = open(work.transport)
    await type(panel, 'Add a little more movement.')
    const before = panel.getChat()!.getMessages().length
    work.emit(cued('talker-2', 'start'))
    work.emit(cued('talker-2', 'done', '', { status: 'complete', passed: true }))
    await settle(6)
    expect(panel.getChat()!.getMessages()).toHaveLength(before)
    work.release()
    await settle(6)
  })
})
