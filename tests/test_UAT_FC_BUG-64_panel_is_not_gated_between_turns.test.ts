// @vitest-environment jsdom
/**
 * BUG-64 — **the panel does not gate its composer between turns**.
 *
 * THE HALF THE OPERATOR MEETS. The workers suite proves the origin now answers
 * `live` honestly. This is what that flag COSTS when it lies, and it is the
 * whole reported symptom: a panel opened onto a settled conversation showed its
 * STOP button, and a message typed into it produced a bubble and no reply.
 *
 * WHY THAT FOLLOWS FROM ONE BOOLEAN. `resume` is documented as gating the
 * composer on purpose — "an operator whose reload landed inside a turn is as
 * blocked from typing as one who never reloaded" — and `mountChat` submits with
 * `streaming ? queue(md) : send(md)`. Both are correct for a turn that is
 * running. Told a turn was running when none was, they compose into a chat that
 * accepts input and does nothing with it: the bubble is the QUEUE rendering, and
 * this panel wires no `onQueue`, so the text is accepted and then dropped. The
 * composer itself stays gated until the tail over the quiet junction gives up —
 * `watch`'s ten-minute timeout — but no amount of waiting would have delivered
 * the message, which is why the symptom reads as silence and not as slowness.
 *
 * SO THIS SUITE ASSERTS THE COMPOSER, not the reattach call. BUG-46's panel
 * suite already pins that a settled session does not ask to reattach; what was
 * never asserted anywhere is that it can still be TYPED INTO — which is the
 * thing that was actually broken, and the thing an operator would notice first.
 * The gating itself is pinned too, on a genuinely live turn, because the bug was
 * the flag and not the gate: a "fix" that stopped gating would take BUG-46's
 * property with it.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, like BUG-46's: the
 * queue-versus-send decision is the component's, so a mocked panel would assert
 * nothing about it. The transport is injected — it is HTTP, and jsdom cannot
 * serve it.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createChatPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-64 panel suite skipped: ${WEBUI_SKIP_REASON}`)

/** Let a fire-and-forget `resume` or `send` run to completion. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

interface Panel {
  element: HTMLElement
  setSession: (session: unknown) => void
  getChat: () => {
    getMessages: () => { role: string; markdown: string }[]
    setInputMarkdown: (md: string) => void
    submitInput: () => void
    isStreaming: () => boolean
  } | null
}

/**
 * A transport that records both calls and holds its reattach open.
 *
 * Holding it is what makes the live case testable at all: a tail that finished
 * before `setSession` returned would leave nothing gated to look at.
 */
function recordingTransport(reply = 'Changed it.') {
  const prompted: string[] = []
  const reattached: [string, number][] = []
  let release = (): void => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  return {
    prompted,
    reattached,
    release: () => release(),
    streamPrompt: async function* (_sessionId: string, text: string) {
      prompted.push(text)
      yield { kind: 'text', content: reply }
      yield { kind: 'done' }
    },
    streamReattach: async function* (sessionId: string, cursor: number) {
      reattached.push([sessionId, cursor])
      await gate
      yield { kind: 'done' }
    },
  }
}

/** A conversation with history and NO turn open — the state the bug misread. */
const settled = () => ({
  sessionId: 'site-alpha',
  turns: [
    { role: 'user', markdown: 'Change the heading.' },
    { role: 'assistant', markdown: 'Done.' },
  ],
  cursor: 412,
  live: false,
  ready: true,
})

const painted = (panel: Panel) => (panel.getChat()?.getMessages() ?? []).map((m) => m.markdown)

/** Type into the composer and press send, exactly as the operator does. */
function type(panel: Panel, text: string): void {
  const chat = panel.getChat()!
  chat.setInputMarkdown(text)
  chat.submitInput()
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

describe.skipIf(!WEBUI_INSTALLED)('BUG-64 a settled conversation can be typed into', () => {
  it('test_UAT_FC_BUG-64_a_settled_panel_shows_no_turn_in_flight', async () => {
    // THE STOP BUTTON, as the operator reported it. `is-streaming` is the class
    // that hides Send and reveals the live controls, so it is the button — and a
    // panel handed a conversation with no turn open must not be wearing it.
    const transport = recordingTransport()
    const panel = createChatPanel({ transport }) as unknown as Panel
    document.body.append(panel.element)
    panel.setSession(settled())
    await settle()

    expect(panel.getChat()!.isStreaming()).toBe(false)
    expect(panel.element.querySelector('.chat-widget')!.classList.contains('is-streaming')).toBe(
      false,
    )
  })

  it('test_UAT_FC_BUG-64_a_message_typed_into_a_settled_panel_is_sent_not_queued', async () => {
    // THE REPORTED FAILURE ITSELF: text goes in, a bubble appears, nothing
    // answers. The bubble was never evidence of a request — `queue` renders one
    // too — so the assertion that distinguishes them is whether the TRANSPORT
    // was asked, and whether a reply came back.
    const transport = recordingTransport('The heading is bigger now.')
    const panel = createChatPanel({ transport }) as unknown as Panel
    document.body.append(panel.element)
    panel.setSession(settled())
    await settle()

    type(panel, 'Make the heading bigger.')
    await settle()

    expect(transport.prompted).toEqual(['Make the heading bigger.'])
    expect(painted(panel)).toEqual([
      'Change the heading.',
      'Done.',
      'Make the heading bigger.',
      'The heading is bigger now.',
    ])
    // And nothing was rejoined on the way in — the settled session asked for no
    // tail, so there was never a turn for the message to be queued behind.
    expect(transport.reattached).toEqual([])
  })

  it('test_UAT_FC_BUG-64_a_genuinely_live_turn_still_gates_the_composer', async () => {
    // THE PROPERTY THAT MUST SURVIVE THE FIX. Gating during a turn is BUG-46's,
    // and it is right: an operator whose reload landed mid-turn is as blocked as
    // one who never reloaded, and what they type is kept rather than dropped.
    // The defect was a flag that claimed this state falsely, so the repair is at
    // the flag — this asserts the gate is still where it was.
    const transport = recordingTransport()
    const panel = createChatPanel({ transport }) as unknown as Panel
    document.body.append(panel.element)
    panel.setSession({
      sessionId: 'site-alpha',
      turns: [
        { role: 'user', markdown: 'Change the heading.' },
        { role: 'assistant', markdown: 'I have started editing. ' },
      ],
      cursor: 412,
      live: true,
      ready: true,
    })

    expect(transport.reattached).toEqual([['site-alpha', 412]])
    expect(panel.getChat()!.isStreaming()).toBe(true)

    type(panel, 'And the subheading too.')
    await settle()

    // QUEUED, NOT SENT. `queue` renders the text as a PENDING user turn and
    // hands it to the host's `onQueue`; it never touches `sendPrompt`. That
    // bubble — accepted, marked waiting, unanswered — is precisely what the
    // operator described, and here it is correct, because a turn really is
    // running.
    expect(transport.prompted).toEqual([])
    expect(painted(panel).at(-1)).toBe('And the subheading too.')

    // AND IT STAYS THAT WAY EVEN ONCE THE TURN ENDS, which is why the bug read
    // as silence rather than as slowness. This panel supplies no `onQueue` — it
    // has no session-level queue to issue one to — so `mountChat`'s no-op
    // default takes it, and the text is accepted and then goes nowhere. Waiting
    // out the phantom tail would not have recovered the message either.
    transport.release()
    await settle()
    await settle()

    expect(transport.prompted).toEqual([])
  })
})
