// @vitest-environment jsdom
/**
 * [[BUG-249]] — **a customer is never handed machinery**.
 *
 * The panel used to tell every customer whose turn did not finish "It was our
 * failure, it has been recorded" and quote the turn's id. In production the origin
 * now sends neither the id nor the cause (`TURN_DIAGNOSTICS` is off), and the panel
 * says something gentle; on the dev server, with both sent, the detailed note stays.
 * Mounted against the installed `webui-chat`, like REQ-306's panel suite.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createChatPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-306 panel suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const transport = {
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

const painted = (panel: { getChat: () => { getMessages: () => unknown[] } | null }) =>
  (panel.getChat()?.getMessages() ?? []).map(
    (m) => (m as { role: string; markdown: string }).markdown,
  )

const TURN = 'turn_0123456789abcdef0123456789abcdef'

const base = {
  sessionId: 'site-alpha',
  turns: [
    { role: 'user', markdown: 'Make the header green.' },
    { role: 'assistant', markdown: 'Starting on that. ' },
  ],
  cursor: 90,
  live: false,
  ready: true,
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
  globalThis.localStorage?.clear()
})

function mount(session: Record<string, unknown>) {
  const panel = createChatPanel({ transport }) as never as {
    element: HTMLElement
    setSession: (s: unknown) => void
    getChat: () => { getMessages: () => unknown[] } | null
  }
  document.body.append(panel.element)
  panel.setSession({ ...base, ...session })
  return panel
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-249 the panel says it gently', () => {
  it('test_UAT_FC_BUG-249_without_diagnostics_the_panel_says_it_gently', async () => {
    for (const state of ['lost', 'error', 'stalled']) {
      document.body.replaceChildren()
      const panel = mount({ failed: { at: '2026-10-21T18:29:00.000Z', state } })
      await settle()
      const last = painted(panel).at(-1) as string
      expect(last).toContain('cut short')
      expect(last).not.toContain('our failure')
      expect(last).not.toContain('recorded')
      expect(last).not.toMatch(/turn_/)
    }
  })

  it('test_UAT_FC_BUG-249_with_diagnostics_a_stalled_turn_names_its_cause', async () => {
    const panel = mount({
      failed: { turn: TURN, at: '2026-10-21T18:29:00.000Z', state: 'stalled', detail: 'stalled 300s awaiting tool Delegate (last: tool_issue)' },
    })
    await settle()
    const last = painted(panel).at(-1) as string
    expect(last).toContain(TURN)
    expect(last).toContain('awaiting tool Delegate')
  })
})
