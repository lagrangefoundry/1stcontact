// @vitest-environment jsdom
/**
 * [[BUG-244]] — **the bottom of the screen gets quieter**: attaching is a "+"
 * inside the text box, mirroring Send, and the status widget (what the consultant
 * is doing, how long, Stop building) is drawn under the plan panel's progress
 * banner instead of above the composer. Both through lagrange-framework REQ-214
 * (`composerAction`, `statusContainer`).
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components;
 * only the chat, plan and Library transports — the network — are injected.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let createChatPanel: (opts?: Record<string, unknown>) => Handle
let createPlanPanel: (opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-244 suite skipped: ${WEBUI_SKIP_REASON}`)

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

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
    ;({ createPlanPanel } = await import('../apps/control-app/src/builder/plan-panel.js'))
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

/** The real builder; `stream` is the consultant's turn. */
function mount(stream: () => AsyncGenerator<unknown>) {
  const uploads: Array<Record<string, unknown>> = []
  const app = mountBuilder(root, {
    sites: [{ site: 'alpha', latest: 1 }],
    storage: memoryStorage(),
    planTransport: {
      fetchPlan: async () => ({ stages: [{ id: 'first_draft', label: 'First draft', state: 'in_progress' }], asks: [] }),
      answerAsk: async () => ({}),
    },
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
      streamPrompt: stream,
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      remove: async () => {},
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async (args: Record<string, unknown>) => {
        uploads.push(args)
        return { uid: 'material-1', label: 'IMAGE-12', kind: 'image', role: args.role, indexed: true }
      },
      setRole: async (uid: string, role: string) => ({ uid, role }),
    },
  })
  return { app, uploads }
}

const shown = (scope: ParentNode, selector: string) => scope.querySelector<HTMLElement>(`${selector}:not([hidden])`)

describe.skipIf(!WEBUI_INSTALLED)('BUG-244 — attach is a "+" inside the text box', () => {
  it('test_UAT_FC_BUG-244_the_plus_in_the_composer_opens_the_picker_and_no_attach_files_row_exists', async () => {
    const { app, uploads } = mount(async function* () {
      yield { kind: 'done' }
    })
    await settle()
    const chatEl: HTMLElement = app.chat.element

    // INSIDE THE INPUT BAR, mirroring Send, named for what it does.
    const plus = chatEl.querySelector<HTMLButtonElement>('.chat-widget-input-bar .chat-widget-composer-action')
    expect(plus).not.toBeNull()
    expect(plus!.textContent).toBe('+')
    expect(plus!.getAttribute('aria-label') ?? plus!.title).toBe('Attach files')

    // NO SEPARATE ROW: no button of the tray's own, and no "Attach files" words drawn.
    expect(chatEl.querySelector('.builder-attach__pick')).toBeNull()
    expect(app.attachments.element.querySelector('button')).toBeNull()
    expect(app.attachments.element.textContent).not.toContain('Attach files')

    // THE SAME PICKER: pressing "+" opens it, and what is picked becomes a chip.
    const input = app.attachments.element.querySelector<HTMLInputElement>('input[type=file]')!
    let opened = 0
    input.click = () => {
      opened += 1
    }
    plus!.click()
    expect(opened).toBe(1)
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['b'], 'shopfront.jpg', { type: 'image/jpeg' })],
    })
    input.dispatchEvent(new Event('change'))
    await settle()
    expect(uploads).toHaveLength(1)
    const chips = app.attachments.element.querySelectorAll('.builder-attach__chip')
    expect(chips).toHaveLength(1)
    expect(chips[0].querySelector('.builder-attach__name')!.textContent).toBe('IMAGE-12')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-244 — the status widget sits under the progress banner', () => {
  it('test_UAT_FC_BUG-244_while_the_builder_works_the_widget_is_under_the_banner_and_not_in_the_chat', async () => {
    let release: () => void = () => {}
    const held = new Promise<void>((r) => {
      release = r
    })
    const { app } = mount(async function* () {
      yield {
        kind: 'progress',
        content: 'The consultant is building your home page',
        meta: { source: 'model', turn_id: 't1', started_at: new Date().toISOString(), eta_s: 300 },
      }
      await held
      yield { kind: 'done' }
    })
    await settle()
    const banner: HTMLElement = app.planPanel.element.querySelector('.plan-stages')
    const chatEl: HTMLElement = app.chat.element

    // NOT YET WORKING: nothing of it shows anywhere.
    expect(shown(document, '.chat-widget-status')).toBeNull()

    void app.chat.getChat().send('Build my home page.')
    await settle()

    // INSIDE THE BANNER, after the stages — and nothing of it in the chat.
    const widget = shown(banner, '.chat-widget-status')
    expect(widget).not.toBeNull()
    expect(widget!.parentElement!.classList.contains('plan-stages__status')).toBe(true)
    expect(banner.querySelector('.plan-stages__list')!.compareDocumentPosition(widget!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(widget!.querySelector('.chat-widget-status-text')!.textContent).toBe('The consultant is building your home page')
    expect(widget!.querySelector('.chat-widget-status-time')).not.toBeNull()
    expect(chatEl.querySelector('.chat-widget-status')).toBeNull()

    // [[BUG-239]] UNAFFECTED: the empty composer shows Send, not Stop.
    expect(shown(chatEl, '.chat-widget-send-btn')).not.toBeNull()
    expect(shown(chatEl, '.chat-widget-stop-btn')).toBeNull()

    release()
    await settle()
  })
})

/** A worker round that opens, sends no `progress` frame, and runs until released, recording every stop. */
function workingTransport() {
  const stops: (string | null)[] = []
  let release: () => void = () => {}
  const done = new Promise<void>((resolve) => {
    release = resolve
  })
  return {
    stops,
    release: () => release(),
    transport: {
      streamPrompt: async function* () {
        yield { kind: 'text', content: 'Building your home page now.' }
        await done
        yield { kind: 'done', meta: { status: 'complete' } }
      },
      interpose: async () => 'msg-1',
      stop: async (_id: string, turnId: string | null) => {
        stops.push(turnId)
        release()
        return { stopping: true }
      },
    },
  }
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-244 — Stop building, from under the banner', () => {
  it('test_UAT_FC_BUG-244_the_widget_opens_with_the_worker_round_under_the_banner_and_stop_building_stops_the_worker', async () => {
    const plan = createPlanPanel({ transport: { fetchPlan: async () => ({ stages: [], asks: [] }) } })
    const work = workingTransport()
    const panel = createChatPanel({ transport: work.transport, statusContainer: plan.statusSlot })
    document.body.append(plan.element, panel.element)
    panel.setSession({ sessionId: 'site-alpha', cursor: 0, live: false, ready: true, turns: [], talker: true })
    const chat = panel.getChat()
    await chat.inputReady
    chat.setInputMarkdown('Build my home page.')
    void chat.submitInput()
    await settle(6)

    // AS SOON AS THE ROUND OPENS (lagrange-framework BUG-89), and under the banner.
    const banner: HTMLElement = plan.element.querySelector('.plan-stages')
    const widget = shown(banner, '.chat-widget-status')
    expect(widget).not.toBeNull()
    expect(panel.element.querySelector('.chat-widget-status')).toBeNull()
    // [[BUG-239]] — the composer still shows Send while only the worker runs.
    expect(shown(panel.element, '.chat-widget-send-btn')).not.toBeNull()
    expect(shown(panel.element, '.chat-widget-stop-btn')).toBeNull()

    // STOP BUILDING STOPS THE WORKER: the origin is asked to stop the work.
    const stop = widget!.querySelector<HTMLButtonElement>('.chat-widget-status-stop')!
    expect(stop.textContent).toBe('Stop building')
    stop.click()
    await settle(6)
    expect(work.stops).toEqual([null])
    // AND WHEN THE ROUND ENDS, nothing of it remains under the banner.
    expect(shown(banner, '.chat-widget-status')).toBeNull()
  })
})
