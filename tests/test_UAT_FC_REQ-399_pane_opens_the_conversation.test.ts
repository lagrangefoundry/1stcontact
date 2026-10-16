// @vitest-environment jsdom
/**
 * [[REQ-399]] — **the pane starts the consultant's opening turn.** When the origin
 * says a conversation is empty (`opening`), the pane streams the opening into an
 * assistant bubble with no client bubble before it; otherwise it starts nothing.
 *
 * Mounted against the installed `webui-chat`, as [[BUG-46]]'s suite is; the
 * transport is injected, and the workers suite drives the real route.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createChatPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-399 pane suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 5) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

function openingTransport() {
  const opened: string[] = []
  return {
    opened,
    streamPrompt: async function* () {
      yield { kind: 'done' }
    },
    streamOpening: async function* (sessionId: string) {
      opened.push(sessionId)
      yield { kind: 'text', content: "Hi — I'm building your website. What does your business do?" }
      yield { kind: 'done' }
    },
  }
}

const messages = (panel: { getChat: () => { getMessages: () => unknown[] } | null }) =>
  (panel.getChat()?.getMessages() ?? []).map((m) => m as { role: string; markdown: string })

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

describe.skipIf(!WEBUI_INSTALLED)('REQ-399 the pane opens the conversation', () => {
  it('test_UAT_FC_REQ-399_an_empty_conversation_streams_the_opening_with_no_client_message', async () => {
    const transport = openingTransport()
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({ sessionId: 'site-alpha', turns: [], cursor: 0, live: false, ready: true, opening: true })
    await settle()
    expect(transport.opened).toEqual(['site-alpha'])
    expect(messages(panel).map((m) => m.role)).toEqual(['assistant'])
    expect(messages(panel)[0].markdown).toContain('What does your business do?')
  })

  it('test_UAT_FC_REQ-399_a_conversation_without_opening_starts_nothing', async () => {
    const transport = openingTransport()
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({ sessionId: 'site-beta', turns: [{ role: 'assistant', markdown: 'Hello again.' }], cursor: 9, live: false, ready: true })
    await settle()
    expect(transport.opened).toEqual([])
    expect(messages(panel).map((m) => m.role)).toEqual(['assistant'])
  })
})
