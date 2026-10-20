// @vitest-environment jsdom
/**
 * [[REQ-403]] — **the first entry explains itself**, in the two panes the browser
 * draws: the question panel says nothing false and shows no empty section, and a
 * brand-new conversation is one *Click here to start* button that releases the
 * consultant's introduction, typed out, before the text box appears.
 *
 * THE REAL BUILDER AND THE REAL CHAT PANE, mounted in jsdom against the installed
 * `webui-*` components with the builder's stylesheets loaded, as REQ-401's suite
 * does. The origin is replaced at the transports they already take; the workers
 * suite drives the real routes.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'
import { OPENING_MESSAGE } from '../tools/generate/src/cli/ai/plan-core'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let createChatPanel: (opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-403 pane suites skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'alpha', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
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

const STAGES = [{ id: 'getting_to_know_you', label: 'Getting to know you', about: '', state: 'in_progress' }]
const ask = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  prompt: `${id} for the site`,
  why: `Why ${id} matters.`,
  input: 'text',
  needed_by: 'first_pass',
  blocking: false,
  status: 'open',
  ...extra,
})
/** A new plan exactly as `panelView` draws it: no asks, and the board not raised. */
const NEW_PLAN = { stages: STAGES, asks: [], comps: [], comps_status: 'open', comps_raised: false }

function planTransport(view: Record<string, any>) {
  let current = view
  return {
    set: (next: Record<string, any>) => {
      current = next
    },
    fetchPlan: async () => current,
    answerAsk: async () => current,
    compAction: async () => current,
    uploadMaterial: async () => ({ uid: 'material-1' }),
  }
}

const chatTransport = {
  openSession: async (slug: string) => ({
    sessionId: `site-${slug}`,
    turns: [{ role: 'assistant', markdown: 'Hello again.' }],
    ready: true,
  }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

const sheet = (file: string) => readFileSync(file, 'utf8')
const CSS = WEBUI_INSTALLED
  ? [
      sheet(path.join(webuiPackageDir('webui-shell'), 'src/shell.css')),
      sheet(path.join(webuiPackageDir('webui-chat'), 'src/chat.css')),
      sheet(path.resolve(__dirname, '../apps/control-app/src/builder/builder.css')),
    ]
  : []

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

beforeEach(() => {
  document.head.replaceChildren()
  document.body.replaceChildren()
  for (const css of CSS) {
    const style = document.createElement('style')
    style.textContent = css
    document.head.append(style)
  }
})

async function mount(plan: ReturnType<typeof planTransport>): Promise<Handle> {
  const root = document.createElement('div')
  document.body.append(root)
  const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport, planTransport: plan })
  await settle()
  return app
}

const panel = (app: Handle): HTMLElement => app.planPanel.element
const shownHeadings = (app: Handle): string[] =>
  [...panel(app).querySelectorAll<HTMLElement>('.plan-panel__heading')].filter((h) => !h.hidden).map((h) => h.textContent ?? '')
const visible = (el: Element | null): boolean => !!el && getComputedStyle(el).display !== 'none' && !(el as HTMLElement).hidden

describe.skipIf(!WEBUI_INSTALLED)('REQ-403 — the question panel of a new plan', () => {
  it('test_UAT_FC_REQ-403_a_new_plan_shows_no_all_done_no_section_heading_and_no_comp_board', async () => {
    const plan = planTransport(NEW_PLAN)
    const app = await mount(plan)
    expect(panel(app).textContent).not.toContain('All done')
    expect(shownHeadings(app)).toEqual([])
    expect(panel(app).querySelector('[data-comps]')).toBeNull()
    // The progress banner is still there.
    expect(panel(app).querySelector('.plan-stages')).toBeTruthy()

    // ONE OPEN QUESTION: only its section shows.
    plan.set({ ...NEW_PLAN, asks: [ask('phone')] })
    await app.planPanel.refresh()
    expect(shownHeadings(app)).toEqual(['Open questions'])

    // EVERY QUESTION ANSWERED: still no "All done".
    plan.set({ ...NEW_PLAN, asks: [ask('phone', { status: 'answered', answer: '0117', answered_by: 'client' })] })
    await app.planPanel.refresh()
    expect(shownHeadings(app)).toEqual(["What you've told us"])
    expect(panel(app).textContent).not.toContain('All done')
  })

  it('test_UAT_FC_REQ-403_the_comp_board_appears_once_the_consultant_raises_it', async () => {
    const plan = planTransport(NEW_PLAN)
    const app = await mount(plan)
    expect(panel(app).querySelector('[data-comps]')).toBeNull()

    const offered = () =>
      [...app.toolbar.element.querySelectorAll('.builder-toolbar__modes button')].map((b) => (b as HTMLElement).textContent)
    expect(offered()).not.toContain('Comparisons')

    // [[REQ-419]] — raised, the comps are Comparisons in the preview, not an item on the panel.
    plan.set({ ...NEW_PLAN, comps_raised: true })
    await app.planPanel.refresh()
    expect(offered()).toContain('Comparisons')
    expect(panel(app).querySelector('[data-comps]')).toBeNull()
  })
})

/** A transport whose opening is held until the test lets it go. */
function startTransport() {
  const opened: string[] = []
  return {
    opened,
    streamPrompt: async function* () {
      yield { kind: 'done' }
    },
    openConversation: async (sessionId: string) => {
      opened.push(sessionId)
      return { role: 'assistant', markdown: OPENING_MESSAGE, ts: '2026-10-17T12:00:00.000Z' }
    },
  }
}

/** A typing clock the test steps by hand, so the half-typed moment can be seen. */
function steppedClock() {
  const waiting: (() => void)[] = []
  return {
    wait: () => new Promise<void>((resolve) => waiting.push(resolve)),
    step: () => waiting.shift()?.(),
    drain: async () => {
      for (let i = 0; i < 500 && (waiting.length || i < 5); i += 1) {
        waiting.shift()?.()
        await new Promise((r) => setTimeout(r, 0))
      }
    },
  }
}

const messages = (pane: Handle) => (pane.getChat()?.getMessages() ?? []) as { role: string; markdown: string }[]
const composer = (pane: Handle): Element | null => pane.element.querySelector('.chat-widget-input-bar')

describe.skipIf(!WEBUI_INSTALLED)('REQ-403 — a brand-new conversation starts with a button', () => {
  it('test_UAT_FC_REQ-403_a_new_conversation_is_only_the_start_button', async () => {
    const transport = startTransport()
    const pane = createChatPanel({ transport })
    document.body.append(pane.element)
    pane.setSession({ sessionId: 'site-alpha', turns: [], cursor: 0, live: false, ready: true, opening: true })
    await settle()

    const buttons = [...pane.element.querySelectorAll('button')]
    expect(buttons.map((b) => b.textContent)).toEqual(['Click here to start'])
    expect(composer(pane)).toBeNull()
    expect(pane.element.querySelector('textarea, [contenteditable]')).toBeNull()
    expect(pane.getChat()).toBeNull()
    expect(transport.opened).toEqual([])
  })

  it('test_UAT_FC_REQ-403_pressing_start_types_the_opening_then_shows_the_composer', async () => {
    const transport = startTransport()
    const clock = steppedClock()
    const pane = createChatPanel({ transport, wait: clock.wait })
    document.body.append(pane.element)
    pane.setSession({ sessionId: 'site-alpha', turns: [], cursor: 0, live: false, ready: true, opening: true })
    await settle()

    ;(pane.element.querySelector('button') as HTMLButtonElement).click()
    await settle()
    expect(transport.opened).toEqual(['site-alpha'])

    // MID-TYPING: one assistant bubble, part-written, and no text box yet.
    clock.step()
    await settle()
    expect(messages(pane).map((m) => m.role)).toEqual(['assistant'])
    expect(messages(pane)[0].markdown.length).toBeLessThan(OPENING_MESSAGE.length)
    expect(composer(pane)).toBeTruthy()
    expect(visible(composer(pane))).toBe(false)
    expect(pane.element.textContent).not.toContain('Click here to start')

    // TYPED OUT: the whole introduction, exactly one turn, and the text box.
    await clock.drain()
    await settle()
    expect(messages(pane).map((m) => m.role)).toEqual(['assistant'])
    expect(messages(pane)[0].markdown).toBe(OPENING_MESSAGE)
    expect(visible(composer(pane))).toBe(true)
    expect(transport.opened).toEqual(['site-alpha'])
  })

  it('test_UAT_FC_REQ-403_a_conversation_with_turns_shows_its_transcript_and_no_button', async () => {
    const transport = startTransport()
    const pane = createChatPanel({ transport })
    document.body.append(pane.element)
    // The reload after starting: the opening is in the transcript and the origin
    // no longer says `opening`.
    pane.setSession({ sessionId: 'site-beta', turns: [{ role: 'assistant', markdown: OPENING_MESSAGE }], cursor: 2, live: false, ready: true })
    await settle()
    expect(pane.element.textContent).not.toContain('Click here to start')
    expect(messages(pane).map((m) => m.role)).toEqual(['assistant'])
    expect(composer(pane)).toBeTruthy()
    expect(transport.opened).toEqual([])
  })
})
