// @vitest-environment jsdom
/**
 * [[BUG-247]] — **a message the work ended before taking runs as a turn of its own,
 * with the status widget and Send, not as a talker reply.**
 *
 * In talk mode a message written while a turn is on the panel goes to the talker
 * ([[REQ-416]]). When the turn ends before any talker takes it, the message runs as
 * the next prompt — and that prompt may answer first and then go to work. Drawn
 * into the talker's bubble, its `progress` frames were dropped (no status widget,
 * no Stop building) and the panel counted a talker reply as generating for the
 * whole build, so the composer offered Stop throughout. Now the talker bubble
 * closes and the message's turn is the panel's own.
 *
 * THE REAL PANEL (`createChatPanel`) against the installed `webui-chat`, with the
 * origin replaced at the transport it takes, as the BUG-239 suite does.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Chat = {
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

if (!WEBUI_INSTALLED) console.warn(`BUG-247 panel suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 3) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

/** A stream of frames fed by the test, ending when released. */
function feed() {
  const queue: Record<string, unknown>[] = []
  let wake: () => void = () => {}
  let ended = false
  return {
    push(ev: Record<string, unknown>) {
      queue.push(ev)
      wake()
    },
    end() {
      ended = true
      wake()
    },
    async *events() {
      for (;;) {
        while (queue.length > 0) yield queue.shift()!
        if (ended) return
        await new Promise<void>((resolve) => {
          wake = resolve
        })
      }
    },
  }
}

/** The origin: each prompt is a stream the test feeds; prompts are recorded. */
function origin() {
  const prompts: { text: string; fromMessages: string[] }[] = []
  const streams: ReturnType<typeof feed>[] = []
  const stops: (string | null)[] = []
  return {
    prompts,
    streams,
    stops,
    transport: {
      streamPrompt: (_id: string, text: string, _view: unknown, fromMessages: string[] = []) => {
        prompts.push({ text, fromMessages })
        const stream = feed()
        streams.push(stream)
        return stream.events()
      },
      interpose: async () => 'msg-1',
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

function open(transport: unknown) {
  const map = new Map<string, string>()
  const storage = {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  }
  // [[BUG-244]] — the host's status slot, under the plan panel's progress banner.
  const statusContainer = document.createElement('div')
  statusContainer.className = 'plan-stages__status'
  document.body.append(statusContainer)
  const panel = createChatPanel({ storage, transport, statusContainer })
  document.body.append(panel.element)
  panel.setSession({ sessionId: 'site-alpha', cursor: 0, live: false, ready: true, turns: [], talker: true })
  return { panel, statusContainer }
}

async function write(panel: Panel, text: string) {
  const chat = panel.getChat()!
  await chat.inputReady
  chat.setInputMarkdown(text)
  // NOT AWAITED: a submit that starts a turn resolves when the turn ends.
  void chat.submitInput()
  await settle(6)
}

const visible = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(`${selector}:not([hidden])`)

/** Wait out the panel-free poll (BUG-245's cue cadence) and the turn's start. */
const panelFree = () => new Promise((resolve) => setTimeout(resolve, 600))

describe.skipIf(!WEBUI_INSTALLED)('BUG-247 a message the work ended before taking runs as a turn', () => {
  it('test_UAT_FC_BUG-247_the_answer_first_turn_shows_the_widget_and_send', async () => {
    const o = origin()
    const { panel, statusContainer } = open(o.transport)
    await write(panel, 'Make the hero bolder.')
    // The client writes while that turn is still on the panel: the talker's.
    await write(panel, 'Here are some testimonials')
    expect(o.prompts).toHaveLength(1)

    // The turn ends before any talker took the message.
    o.streams[0].push({ kind: 'text', content: 'Done — the hero is bolder.' })
    o.streams[0].push({ kind: 'done', meta: { status: 'complete' } })
    o.streams[0].end()
    await settle(6)
    await panelFree()

    // The message ran as the next prompt, naming the waiting message.
    expect(o.prompts).toHaveLength(2)
    expect(o.prompts[1]).toEqual({ text: 'Here are some testimonials', fromMessages: ['msg-1'] })

    // It answers first, then goes to work.
    const turn = o.streams[1]
    turn.push({ kind: 'text', content: 'Thank you — these are lovely.' })
    await settle(6)
    turn.push({
      kind: 'progress',
      content: 'The consultant is adding your testimonials',
      meta: { source: 'model', turn_id: 'turn-2', elapsed_s: 4 },
    })
    await settle(6)

    // The status widget is up under the banner, with the note and Stop building.
    const widget = visible(statusContainer, '.chat-widget-status')
    expect(widget).not.toBeNull()
    expect(widget!.textContent).toContain('The consultant is adding your testimonials')
    expect(widget!.querySelector('.chat-widget-status-stop')?.textContent).toBe('Stop building')
    // The composer shows Send — no talker reply is generating.
    expect(visible(panel.element, '.chat-widget-stop-btn')).toBeNull()
    expect(visible(panel.element, '.chat-widget-send-btn')).not.toBeNull()
    // The answer is the consultant's ordinary reply, after the client's message;
    // no progress note became chat text. (Painted on an animation frame.)
    await new Promise((resolve) => setTimeout(resolve, 50))
    const bubbles = [...panel.element.querySelectorAll<HTMLElement>('.chat-message')].map((el) => [
      el.classList.contains('user') ? 'user' : 'assistant',
      el.textContent ?? '',
    ])
    const last = bubbles.at(-1)!
    expect(last[0]).toBe('assistant')
    expect(last[1]).toContain('Thank you — these are lovely.')
    expect(panel.element.textContent).not.toContain('The consultant is adding your testimonials')

    // Stop building stops the work, by no talker id.
    widget!.querySelector<HTMLButtonElement>('.chat-widget-status-stop')!.click()
    await settle()
    expect(o.stops).toEqual([null])

    turn.push({ kind: 'done', meta: { status: 'complete' } })
    turn.end()
    await settle(6)
    // The turn is over: the widget goes and the composer is idle.
    expect(visible(statusContainer, '.chat-widget-status')).toBeNull()
    expect(visible(panel.element, '.chat-widget-stop-btn')).toBeNull()
  })
})
