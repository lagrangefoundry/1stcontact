// @vitest-environment jsdom
/**
 * [[REQ-360]] — **the browser half: a running build is one status line.**
 *
 * The origin half (`test_UAT_FC_REQ-360_build_heartbeat`) shows the heartbeat
 * arriving on the turn's stream as `progress` frames. This shows what the builder
 * chat does with them: one status line between the conversation and the
 * composer, each figure replacing the last, gone when the assistant speaks again
 * or the stream ends, and never in the conversation itself.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, for the reason the BUG-43
 * panel suite gives: a mocked panel would assert nothing. The transport is
 * injected because it is HTTP.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createChatPanel: (opts?: Record<string, unknown>) => never
let PROGRESS_LINE_CLASS: string

if (!WEBUI_INSTALLED) console.warn(`REQ-360 panel suite skipped: ${WEBUI_SKIP_REASON}`)

type Panel = {
  element: HTMLElement
  setSession(session: Record<string, unknown>): void
  getChat(): { send(text: string): Promise<void>; getMessages(): { role: string; markdown: string }[] }
}

/** What the status line looks like right now: its text, or null when there is none. */
interface LineState {
  count: number
  text: string | null
  role: string | null
  afterMessages: boolean
}

function lineState(): LineState {
  const lines = document.querySelectorAll(`.${PROGRESS_LINE_CLASS}`)
  const line = lines[0] as HTMLElement | undefined
  return {
    count: lines.length,
    text: line?.textContent ?? null,
    role: line?.getAttribute('role') ?? null,
    afterMessages: line?.previousElementSibling?.classList.contains('chat-widget-messages') ?? false,
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createChatPanel, PROGRESS_LINE_CLASS } = await import('../apps/control-app/src/builder/chat.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

beforeEach(() => {
  document.body.replaceChildren()
  globalThis.localStorage?.clear()
})

function mount(streamPrompt: () => AsyncGenerator<unknown>): Panel {
  const panel = createChatPanel({ transport: { streamPrompt } }) as unknown as Panel
  document.body.append(panel.element)
  panel.setSession({ sessionId: 'site-alpha', turns: [], ready: true })
  return panel
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-360 — a running build is one status line', () => {
  it('test_UAT_FC_REQ-360_each_heartbeat_replaces_the_last_and_speech_clears_it', async () => {
    const seen: LineState[] = []
    const panel = mount(async function* () {
      yield { kind: 'text', content: 'Building your home page now.' }
      yield { kind: 'progress', content: 'still working, elapsed 1 min', meta: { elapsed_s: 60 } }
      // Each pull happens after the panel has dealt with the frame before it, so
      // this is the line as the client sees it between heartbeats.
      seen.push(lineState())
      yield { kind: 'progress', content: 'still working, elapsed 2 min', meta: { elapsed_s: 120 } }
      seen.push(lineState())
      yield { kind: 'text', content: ' The home page is built.' }
      seen.push(lineState())
      yield { kind: 'done' }
    })

    await panel.getChat().send('Build my site.')

    // ONE LINE, A LIVE REGION, BETWEEN THE CONVERSATION AND THE COMPOSER.
    expect(seen[0]).toEqual({ count: 1, text: 'still working, elapsed 1 min', role: 'status', afterMessages: true })
    // REPLACED, NOT ADDED TO.
    expect(seen[1]).toEqual({ count: 1, text: 'still working, elapsed 2 min', role: 'status', afterMessages: true })
    // GONE THE MOMENT THE ASSISTANT SPEAKS AGAIN.
    expect(seen[2].count).toBe(0)
    expect(lineState().count).toBe(0)

    // AND NEVER PART OF WHAT WAS SAID.
    const reply = panel.getChat().getMessages().filter((m) => m.role === 'assistant').map((m) => m.markdown).join('')
    expect(reply).toBe('Building your home page now. The home page is built.')
    expect(reply).not.toContain('still working')
  })

  it('test_UAT_FC_REQ-360_a_stream_that_stops_mid_build_leaves_no_line_behind', async () => {
    let during: LineState | null = null
    const panel = mount(async function* () {
      yield { kind: 'progress', content: 'still working, elapsed 3 min', meta: { elapsed_s: 180 } }
      during = lineState()
      // The connection drops: no `done`, no more frames.
    })

    await panel.getChat().send('Build my site.')

    expect(during).toMatchObject({ count: 1, text: 'still working, elapsed 3 min' })
    // A line claiming work is under way, over a turn the pane can no longer see,
    // would be a worse lie than the silence it replaced.
    expect(lineState().count).toBe(0)
  })
})
