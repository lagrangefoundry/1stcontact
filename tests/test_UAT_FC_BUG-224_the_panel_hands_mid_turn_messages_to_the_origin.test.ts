// @vitest-environment jsdom
/**
 * BUG-224 — **the builder pane hands a message sent mid-turn to the origin, and
 * never drops one**.
 *
 * The origin half (`/api/ai/interpose`, the inbox, delivery at the next tool
 * call) is proved in the `.workers` suite beside this one. This is the page half,
 * mounted against the ACTUALLY-INSTALLED `webui-chat`, with the transport — the
 * network — as the one double:
 *
 *   - a message sent while a turn runs goes to `interpose`, shows as pending, and
 *     turns solid when the turn's stream says it was delivered;
 *   - one the origin refused is not lost: it runs as the next turn;
 *   - messages the origin is still holding when the page loads, with no turn
 *     running, are run at once as one turn naming their ids — and are not offered
 *     back as unsent.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Chat = {
  getMessages: () => { role: string; markdown: string }[]
  getInputMarkdown: () => string
  setInputMarkdown: (md: string) => void
  submitInput: () => Promise<void>
  isStreaming: () => boolean
  inputReady: Promise<boolean>
}
type Panel = {
  element: HTMLElement
  setSession: (session: unknown, key?: string) => void
  getChat: () => Chat | null
  destroy: () => void
}

let createChatPanel: (opts?: Record<string, unknown>) => Panel

if (!WEBUI_INSTALLED) console.warn(`BUG-224 panel suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** A transport whose turns run until released, recording every call. */
function gatedTransport({ refuse = false } = {}) {
  const prompts: { text: string; fromMessages: string[] }[] = []
  const interposed: string[] = []
  const pushes: ((ev: Record<string, unknown>) => void)[] = []
  let release: () => void = () => {}
  return {
    prompts,
    interposed,
    /** Put an event on the running turn's stream. */
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
        yield { kind: 'text', content: 'Working on it. ' }
        for (;;) {
          while (queue.length > 0) yield queue.shift()!
          const next = new Promise<void>((resolve) => {
            wake = resolve
          })
          if ((await Promise.race([next.then(() => 'event'), done.then(() => 'done')])) === 'done') break
        }
        while (queue.length > 0) yield queue.shift()!
        yield { kind: 'text', content: 'Finished.' }
        yield { kind: 'done', meta: { status: 'complete' } }
      },
      interpose: async (_id: string, text: string) => {
        interposed.push(text)
        if (refuse) throw new Error('POST /api/ai/interpose → 503')
        return `msg-${interposed.length}`
      },
    },
  }
}

let storage: Storage

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
  const map = new Map<string, string>()
  storage = {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  } as unknown as Storage
})

function open(transport: unknown, session: Record<string, unknown> = {}): Panel {
  const panel = createChatPanel({ storage, transport })
  document.body.append(panel.element)
  panel.setSession({ sessionId: 'site-alpha', cursor: 0, live: false, ready: true, turns: [], ...session })
  return panel
}

async function type(panel: Panel, text: string) {
  const chat = panel.getChat()!
  await chat.inputReady
  chat.setInputMarkdown(text)
  // NOT AWAITED: a submit that starts a turn resolves when the turn ends.
  void chat.submitInput()
  await settle()
  await settle()
}

/** The user's bubble holding `text`, as drawn. */
const bubble = (panel: Panel, text: string) =>
  [...panel.element.querySelectorAll<HTMLElement>('.chat-message.user')].find((el) =>
    (el.textContent ?? '').includes(text),
  )

describe.skipIf(!WEBUI_INSTALLED)('BUG-224 the pane hands mid-turn messages to the origin', () => {
  it('test_UAT_FC_BUG-224_a_message_sent_while_a_turn_runs_is_interposed_and_shown_waiting', async () => {
    const gate = gatedTransport()
    const panel = open(gate.transport)
    await type(panel, 'Rebuild the header.')
    expect(panel.getChat()!.isStreaming()).toBe(true)

    const WROTE = 'Make it teal like the comparison site.'
    await type(panel, WROTE)

    // TO THE ORIGIN, not run as a turn of its own and not held in the page.
    expect(gate.interposed).toEqual([WROTE])
    expect(gate.prompts).toHaveLength(1)
    // ON SCREEN, MARKED AS WAITING — the caption the builder's sheet hangs on it.
    expect(bubble(panel, WROTE)!.classList.contains('is-pending')).toBe(true)

    // The turn's stream says it was delivered at the next call: it turns solid.
    gate.emit({ kind: 'interposition', content: WROTE, meta: { message_id: 'junction-1', content: WROTE } })
    await settle()
    expect(bubble(panel, WROTE)!.classList.contains('is-pending')).toBe(false)

    gate.release()
    await settle()
    await settle()
    // Delivered inside the turn, so nothing runs after it.
    expect(gate.prompts).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-224_a_message_the_origin_refused_runs_as_the_next_turn', async () => {
    const gate = gatedTransport({ refuse: true })
    const panel = open(gate.transport)
    await type(panel, 'Rebuild the header.')
    const WROTE = 'And the footer too, please.'
    await type(panel, WROTE)
    expect(gate.interposed).toEqual([WROTE])

    gate.release()
    await settle()
    await settle()

    // NEVER DROPPED: the turn ended without it, so it is the next prompt.
    expect(gate.prompts.map((p) => p.text)).toEqual(['Rebuild the header.', WROTE])
    expect(gate.prompts[1].fromMessages).toEqual([])
  })

  it('test_UAT_FC_BUG-224_messages_the_origin_holds_run_at_once_when_no_turn_is_running', async () => {
    const gate = gatedTransport()
    const waiting = [
      { id: 'msg-a', text: 'The opening hours changed.', at: '2026-10-18T10:00:00.000Z' },
      { id: 'msg-b', text: 'Closed on Mondays now.', at: '2026-10-18T10:00:05.000Z' },
    ]
    const panel = open(gate.transport, {
      turns: [
        { role: 'user', markdown: 'Rebuild the header.' },
        { role: 'assistant', markdown: 'Done.' },
      ],
      waiting,
    })
    await settle()

    // ONE TURN, BOTH MESSAGES, NAMING BOTH — so the origin retires them rather
    // than delivering them into that turn a second time.
    expect(gate.prompts).toEqual([
      { text: 'The opening hours changed.\n\nClosed on Mondays now.', fromMessages: ['msg-a', 'msg-b'] },
    ])
    // And not offered back as unsent: the origin had them all along.
    const said = panel.getChat()!.getMessages().map((m) => m.markdown).join('\n')
    expect(said).not.toContain('no transcript')
    gate.release()
  })
})
