// @vitest-environment jsdom
/**
 * [[BUG-246]] — **every client message carries which pane the client has open,
 * and which panes they have never opened** — as the builder sends it.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes — REQ-413's
 * harness. The evidence is the `view` the chat transport is handed with each
 * prompt, which is exactly what `/api/ai/prompt` receives; the host's half (the
 * digest states it) is the suite beside this one.
 *
 *   1  a message sent with Comparisons open carries pane `comparisons` and the
 *      number of sites on the comparison board, and lists the panes on offer the
 *      client has never opened
 *   2  opening Story clears it from the unopened list, and the record survives a
 *      reload of the builder
 *   3  the record is per business: opening Story for one site leaves it unopened
 *      for another
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-246 builder suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 12) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const ROWS = () => [{ id: 'home', slug: 'home', title: 'Home', kind: 'web', reachable: true, widths: [375, 768, 1280] }]
const comp = (n: number) => ({
  reference: `reference-${n}`,
  title: `Arc Welding ${n}`,
  url: `https://arc${n}.test/`,
  source: 'consultant',
  added_at: '2026-10-21T00:00:00.000Z',
  likes: [],
  dislikes: [],
  motion: null,
  desktop: 'screenshot-1280.png',
  phone: 'screenshot-375.png',
})
/** Drafted, so the pane opens on View; comps raised, so Comparisons is on offer. */
const PLAN = {
  drafted: true,
  stages: [],
  asks: [],
  comps: [comp(1), comp(2), comp(3), comp(4)],
  comps_raised: true,
  comps_status: 'open',
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
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

function chatTransport() {
  const sent: unknown[][] = []
  return {
    sent,
    openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
    streamPrompt: async function* (...args: unknown[]) {
      sent.push(args)
      yield { kind: 'done', content: '', meta: { status: 'complete' } }
    },
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) ({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
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
  setBusinessScope(null)
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  Element.prototype.scrollIntoView = function () {}
})

async function mounted(
  chat: ReturnType<typeof chatTransport>,
  storage = memoryStorage(),
  sites = [{ site: 'ariels', latest: null }],
): Promise<Handle> {
  const app = mountBuilder(root, {
    sites,
    storage,
    pageState,
    chatTransport: chat,
    planTransport: {
      fetchPlan: async () => PLAN,
      answerAsk: async () => PLAN,
      uploadMaterial: async () => ({ uid: 'material-1' }),
      compAction: async () => PLAN,
    },
    pagesTransport: { list: async () => ({ pages: ROWS() }), saveSubject: async () => ({}) },
  })
  await settle()
  // jsdom has no layout; a real pane has a width, which is what the report rides with.
  app.panel.viewport = () => ({ width: 1280, height: 800 })
  return app
}

/** Send a message and answer the `view` it went with. */
async function sentView(app: Handle, chat: ReturnType<typeof chatTransport>): Promise<Record<string, unknown>> {
  await app.chat.getChat().send('What next?')
  await settle()
  return chat.sent[chat.sent.length - 1][2] as Record<string, unknown>
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-246 — the builder reports the pane with every message', () => {
  it('test_UAT_FC_BUG-246_a_message_sent_with_comparisons_open_carries_the_pane', async () => {
    const chat = chatTransport()
    const app = await mounted(chat)
    app.panel.setMode('comparisons')
    await settle()

    const view = await sentView(app, chat)
    expect(view).toMatchObject({ width: 1280, pane: 'comparisons', comps: 4 })
    // Story and Edit are on offer and were never opened; View and Comparisons were.
    expect(view.unopened).toEqual(['edit', 'story'])
  })

  it('test_UAT_FC_BUG-246_opening_story_clears_it_from_unopened_and_survives_reload', async () => {
    const storage = memoryStorage()
    const chat = chatTransport()
    const app = await mounted(chat, storage)
    expect((await sentView(app, chat)).unopened).toContain('story')

    app.panel.setMode('story')
    await settle()
    app.panel.setMode('view')
    await settle()
    const after = await sentView(app, chat)
    expect(after.pane).toBe('view')
    expect(after.unopened).not.toContain('story')

    // A reload of the builder over the same storage remembers it.
    app.destroy?.()
    root.replaceChildren()
    const again = chatTransport()
    const reloaded = await mounted(again, storage)
    expect((await sentView(reloaded, again)).unopened).not.toContain('story')
  })

  it('test_UAT_FC_BUG-246_the_unopened_record_is_per_business', async () => {
    const storage = memoryStorage()
    const sites = [
      { site: 'ariels', latest: null },
      { site: 'other', latest: null },
    ]
    const chat = chatTransport()
    const app = await mounted(chat, storage, sites)
    app.panel.setMode('story')
    await settle()
    app.panel.setMode('view')
    await settle()
    expect((await sentView(app, chat)).unopened).not.toContain('story')

    app.panel.setSite('other')
    await settle()
    app.panel.viewport = () => ({ width: 1280, height: 800 })
    expect((await sentView(app, chat)).unopened).toContain('story')
  })
})
