// @vitest-environment jsdom
/**
 * [[BUG-239]] — **while only the consultant's worker runs, the composer shows Send,
 * never Stop.** The composer's Stop is the talker's: it shows only while a talker
 * reply is generating and stops that reply alone. Stop building, in the status
 * widget, is the worker's — and the widget is drawn as soon as the round opens,
 * not at its first `progress` frame, so the worker can always be stopped.
 *
 * The fix is upstream (lagrange-framework BUG-89, `webui-chat`'s `stopOffered` and
 * `openStatus`); this is 1stcontact's evidence that the real builder panel, with a
 * talker session, gets it. THE REAL PANEL (`createChatPanel`) against the
 * installed `webui-chat`, with the origin replaced at the transport it takes, as
 * REQ-416's panel suite does.
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

if (!WEBUI_INSTALLED) console.warn(`BUG-239 panel suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 3) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

/** A transport whose work has opened but sent no `progress` frame, and runs until
 *  released, recording every stop. */
function workingTransport() {
  const stops: (string | null)[] = []
  const pushes: ((ev: Record<string, unknown>) => void)[] = []
  let release: () => void = () => {}
  return {
    stops,
    emit: (ev: Record<string, unknown>) => pushes.at(-1)?.(ev),
    release: () => release(),
    transport: {
      streamPrompt: async function* () {
        const queue: Record<string, unknown>[] = []
        let wake: () => void = () => {}
        pushes.push((ev) => {
          queue.push(ev)
          wake()
        })
        const done = new Promise<void>((resolve) => {
          release = resolve
        })
        // NO `progress` FRAME: the window BUG-239 was reported in.
        yield { kind: 'text', content: 'Building your home page now.' }
        for (;;) {
          while (queue.length > 0) yield queue.shift()!
          const next = new Promise<void>((resolve) => {
            wake = resolve
          })
          if ((await Promise.race([next.then(() => 'event'), done.then(() => 'done')])) === 'done') break
        }
        while (queue.length > 0) yield queue.shift()!
        yield { kind: 'done', meta: { status: 'complete' } }
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

async function startWork(panel: Panel) {
  const chat = panel.getChat()!
  await chat.inputReady
  chat.setInputMarkdown('Build my home page.')
  // NOT AWAITED: a submit that starts a turn resolves when the turn ends.
  void chat.submitInput()
  await settle(6)
}

const visible = (panel: Panel, selector: string) =>
  panel.element.querySelector<HTMLElement>(`${selector}:not([hidden])`)

const talker = (event: string, content = '') => ({
  kind: 'talker',
  content,
  meta: { event, turn_id: 'talker-1', message_id: 'msg-1', ...(event === 'start' ? { said: 'Hi' } : {}) },
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-239 the composer shows Send while only the worker runs', () => {
  it('test_UAT_FC_BUG-239_an_empty_composer_shows_send_and_the_widget_offers_stop_building_before_any_progress', async () => {
    const work = workingTransport()
    const panel = open(work.transport)
    expect(panel.getChat()!.getTurnModes()).toMatchObject({ talk: true })
    await startWork(panel)

    // The composer is empty and only the worker runs: Send, never Stop.
    expect(visible(panel, '.chat-widget-send-btn')).not.toBeNull()
    expect(visible(panel, '.chat-widget-stop-btn')).toBeNull()
    // The worker can still be stopped: the widget is up with Stop building.
    const stopBuilding = visible(panel, '.chat-widget-status')?.querySelector<HTMLButtonElement>('.chat-widget-status-stop')
    expect(stopBuilding?.textContent).toBe('Stop building')
    stopBuilding!.click()
    await settle()
    expect(work.stops).toEqual([null])

    work.release()
    await settle(6)
  })

  it('test_UAT_FC_BUG-239_stop_shows_only_while_a_talker_reply_generates_and_stops_that_reply', async () => {
    const work = workingTransport()
    const panel = open(work.transport)
    await startWork(panel)
    // The client writes while it builds; the talker answers that message.
    const chat = panel.getChat()!
    chat.setInputMarkdown('Hi')
    void chat.submitInput()
    await settle(6)
    // From here a talker reply is being generated: Stop is the reply's.
    expect(visible(panel, '.chat-widget-stop-btn')).not.toBeNull()

    work.emit(talker('start'))
    work.emit(talker('text', 'Lovely —'))
    await settle(6)
    const stop = visible(panel, '.chat-widget-stop-btn')
    expect(stop).not.toBeNull()
    stop!.click()
    await settle()
    // The talker's reply, by its id — not the work.
    expect(work.stops).toEqual(['talker-1'])

    work.emit(talker('done'))
    await settle(6)
    // The reply is over and the worker still runs: back to Send.
    expect(visible(panel, '.chat-widget-stop-btn')).toBeNull()
    expect(visible(panel, '.chat-widget-send-btn')).not.toBeNull()

    work.release()
    await settle(6)
  })

  it('test_UAT_FC_BUG-239_a_session_without_a_talker_keeps_its_stop', async () => {
    const work = workingTransport()
    const panel = open(work.transport, { talker: undefined })
    expect(panel.getChat()!.getTurnModes()).not.toMatchObject({ talk: true })
    await startWork(panel)
    expect(visible(panel, '.chat-widget-stop-btn')).not.toBeNull()
    work.release()
    await settle(6)
  })
})
