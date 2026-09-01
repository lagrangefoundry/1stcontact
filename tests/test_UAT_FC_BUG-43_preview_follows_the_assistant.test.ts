// @vitest-environment jsdom
/**
 * BUG-43 — **the browser half: the preview follows the assistant**.
 *
 * The origin half (`test_UAT_FC_BUG-43_site_changed_signal`) shows that a turn
 * announces each write as it lands. This shows what the builder does with that:
 * the pane watches the stream it is already consuming, and the app reloads the
 * preview frame — the same reload the palette popup and the segment editor
 * perform, for the same reason, now performed by the one writer that never did.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat` for the reason the REQ-122
 * and REQ-127 panel suites give: a mocked panel would assert nothing. The
 * transport is injected because it is HTTP.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ slug: 'alpha', latest: null }]

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let createChatPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-43 panel suite skipped: ${WEBUI_SKIP_REASON}`)

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * The turn the origin produces for "add two pages", frame for frame.
 *
 * Written as the SHAPE `host-core.ts` emits rather than as a convenient
 * simplification: the signal arrives among the tool activity, not after the
 * prose, and that is the property the pane has to survive.
 */
const TWO_WRITES = [
  { kind: 'tool_activity', content: 'tool_call add_page', meta: { name: 'add_page' } },
  { kind: 'site_changed', content: '', meta: { at: 1, changes: 1 } },
  { kind: 'tool_activity', content: 'tool_call add_page', meta: { name: 'add_page' } },
  { kind: 'site_changed', content: '', meta: { at: 2, changes: 1 } },
  { kind: 'text', content: 'I added both pages.' },
  { kind: 'done' },
]

const NO_WRITES = [
  { kind: 'tool_activity', content: 'tool_call list_pages', meta: { name: 'list_pages' } },
  { kind: 'text', content: 'You have one page: home.' },
  { kind: 'done' },
]

/** What was said, as role and text — the component stamps a time as well. */
const said = (chat: { getChat(): { getMessages(): { role: string; markdown: string }[] } }) =>
  chat.getChat().getMessages().map(({ role, markdown }) => ({ role, markdown }))

const streamOf = (events: unknown[]) =>
  async function* () {
    for (const event of events) yield event
  }

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
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

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

// ── the pane ─────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('BUG-43 — the pane reports each write as it arrives', () => {
  it('test_UAT_FC_BUG-43_each_signal_is_reported_once_as_it_arrives', async () => {
    const reported: unknown[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_WRITES) },
      onSiteChanged: (meta: unknown) => reported.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'site-alpha', turns: [], ready: true })

    await chat.getChat().send('Add a services page and a contact page.')

    // Once per write, carrying the counter the origin read — so a host can tell
    // "the site moved twice" from "the site moved once", and does not have to
    // infer either from the prose.
    expect(reported).toEqual([
      { at: 1, changes: 1 },
      { at: 2, changes: 1 },
    ])
  })

  it('test_UAT_FC_BUG-43_the_signal_leaves_no_trace_in_the_conversation', async () => {
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_WRITES) },
      onSiteChanged: () => {},
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'site-alpha', turns: [], ready: true })

    await chat.getChat().send('Add a services page and a contact page.')

    // The signal is machinery, not conversation. It is observed by the wrapper
    // and stops there: the transcript is the user's line and the assistant's
    // answer, with nothing between them.
    // Projected to role and text: a message also carries the timestamp the
    // component stamps it with, which is the component's business and not this
    // ticket's.
    expect(said(chat)).toEqual([
      { role: 'user', markdown: 'Add a services page and a contact page.' },
      { role: 'assistant', markdown: 'I added both pages.' },
    ])
  })

  it('test_UAT_FC_BUG-43_a_turn_that_changed_nothing_reports_nothing', async () => {
    const reported: unknown[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(NO_WRITES) },
      onSiteChanged: (meta: unknown) => reported.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'site-alpha', turns: [], ready: true })

    await chat.getChat().send('What pages do I have?')

    expect(reported).toEqual([])
  })

  it('test_UAT_FC_BUG-43_a_failing_host_does_not_take_the_turn_with_it', async () => {
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_WRITES) },
      onSiteChanged: () => {
        throw new Error('the frame went away')
      },
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'site-alpha', turns: [], ready: true })

    // Reloading a frame is the host's business and its failure is not the
    // conversation's — the answer still arrives in full.
    await chat.getChat().send('Add a services page and a contact page.')
    expect(said(chat).at(-1)).toEqual({
      role: 'assistant',
      markdown: 'I added both pages.',
    })
  })
})

// ── the app reloads the frame ────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('BUG-43 — 1c turns the signal into a re-render', () => {
  it('test_UAT_FC_BUG-43_a_write_reloads_the_preview_frame', async () => {
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async (slug: string) => ({
          sessionId: `site-${slug}`,
          turns: [],
          ready: true,
        }),
        streamPrompt: streamOf(TWO_WRITES),
      },
    })
    await settle()

    // The frame's own `contentWindow` is jsdom's and cannot navigate, so the
    // reload is counted rather than performed. What is under test is that the
    // app reaches for THE PREVIEW FRAME on the signal — the same object and the
    // same call the palette popup and the segment editor already reload.
    let reloads = 0
    Object.defineProperty(app.panel.frame, 'contentWindow', {
      configurable: true,
      value: { location: { reload: () => void (reloads += 1) } },
    })

    await app.chat.getChat().send('Add a services page and a contact page.')

    // Twice — the page unfolds as the assistant works rather than arriving whole
    // when it stops talking.
    expect(reloads).toBe(2)

    app.destroy()
  })

  it('test_UAT_FC_BUG-43_a_question_leaves_the_frame_alone', async () => {
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: {
        openSession: async (slug: string) => ({
          sessionId: `site-${slug}`,
          turns: [],
          ready: true,
        }),
        streamPrompt: streamOf(NO_WRITES),
      },
    })
    await settle()

    let reloads = 0
    Object.defineProperty(app.panel.frame, 'contentWindow', {
      configurable: true,
      value: { location: { reload: () => void (reloads += 1) } },
    })

    await app.chat.getChat().send('What pages do I have?')

    // Nothing moved, so nothing is thrown away — the operator keeps their
    // scroll position and the page they were looking at.
    expect(reloads).toBe(0)

    app.destroy()
  })
})
