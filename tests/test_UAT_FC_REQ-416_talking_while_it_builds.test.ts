// @vitest-environment jsdom
/**
 * [[REQ-416]] — **the browser half: while the consultant works, the composer sends
 * to the talker, the status widget says what is under way, and Stop building stops
 * the work.**
 *
 * THE REAL PANEL (`createChatPanel`) against the installed `webui-chat`, with the
 * origin replaced at the transport it already takes. The work's stream carries the
 * talker's reply as `talker` frames — the origin puts it there, because the talker
 * lives where the work does — and the panel has to draw it under the client's
 * message, not in the work's own bubble.
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

if (!WEBUI_INSTALLED) console.warn(`REQ-416 panel suite skipped: ${WEBUI_SKIP_REASON}`)

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

const statusShown = (panel: Panel) => panel.element.querySelector<HTMLElement>('.chat-widget-status:not([hidden])')

describe.skipIf(!WEBUI_INSTALLED)('REQ-416 the composer talks while the consultant works', () => {
  it('test_UAT_FC_REQ-416_a_message_during_the_build_goes_to_the_talker_and_its_reply_is_drawn_under_it', async () => {
    const work = workingTransport()
    const panel = open(work.transport)
    expect(panel.getChat()!.getTurnModes()).toMatchObject({ talk: true })
    await type(panel, 'Build my home page.')

    // THE STATUS WIDGET, in the consultant's words, with Stop building beside it.
    const widget = statusShown(panel)
    expect(widget?.querySelector('.chat-widget-status-text')?.textContent).toBe(STATUS)
    expect(widget?.querySelector('.chat-widget-status-stop')?.textContent).toBe('Stop building')
    // The old working line is gone.
    expect(panel.element.querySelector('.builder-chat-working')).toBeNull()

    // A MESSAGE NOW IS FOR THE TALKER: kept by the origin, not run as a turn.
    const WROTE = 'It started in my mum’s kitchen.'
    await type(panel, WROTE)
    expect(work.interposed).toEqual([WROTE])
    expect(work.prompts).toHaveLength(1)

    // Its reply comes back on the work's stream and is drawn under the message.
    const REPLY = 'That’s going into the copy on the next pass.'
    work.emit({ kind: 'talker', content: '', meta: { event: 'start', turn_id: 'talker-1', message_id: 'msg-1', said: WROTE } })
    work.emit({ kind: 'talker', content: REPLY, meta: { event: 'text', turn_id: 'talker-1', message_id: 'msg-1' } })
    work.emit({ kind: 'talker', content: '', meta: { event: 'done', turn_id: 'talker-1', message_id: 'msg-1', status: 'complete' } })
    await settle(6)
    const messages = panel.getChat()!.getMessages()
    const at = messages.findIndex((m) => m.role === 'user' && m.markdown.includes(WROTE))
    expect(messages[at + 1]).toMatchObject({ role: 'assistant', markdown: REPLY })
    // The work is still running, and its own bubble never carried the reply.
    expect(statusShown(panel)).not.toBeNull()
    expect(messages.filter((m) => m.markdown.includes(REPLY))).toHaveLength(1)

    // STOP BUILDING stops the work — named by no turn, so the talker is not stopped.
    widget!.querySelector<HTMLButtonElement>('.chat-widget-status-stop')!.click()
    await settle()
    expect(work.stops).toEqual([null])

    work.release()
    await settle(6)
    expect(statusShown(panel)).toBeNull()
  })

  it('test_UAT_FC_REQ-416_a_message_the_build_ended_before_answering_runs_next_naming_its_id', async () => {
    const work = workingTransport()
    const panel = open(work.transport)
    await type(panel, 'Build my home page.')
    const WROTE = 'We also do beards.'
    await type(panel, WROTE)
    expect(work.interposed).toEqual([WROTE])

    // The work ends with no talker opened for it: nothing is lost.
    work.release()
    await settle(8)
    expect(work.prompts.map((p) => [p.text, p.fromMessages])).toEqual([
      ['Build my home page.', []],
      [WROTE, ['msg-1']],
    ])
  })

  it('test_UAT_FC_REQ-416_a_conversation_without_a_talker_keeps_interposing', async () => {
    const work = workingTransport()
    const panel = open(work.transport, { talker: undefined })
    expect(panel.getChat()!.getTurnModes()).not.toMatchObject({ talk: true })
    await type(panel, 'Rename the business.')
    await type(panel, 'Make it Bob’s.')
    expect(work.interposed).toEqual(['Make it Bob’s.'])
    work.release()
    await settle(6)
  })
})
