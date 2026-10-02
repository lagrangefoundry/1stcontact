// @vitest-environment jsdom
/**
 * [[REQ-364]] — **the plan panel above the chat**: what it draws, how the client
 * answers in it, when it re-reads, and the divider it sits behind.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes — the chat's and
 * the plan panel's. What is read for evidence is what the client would see (the
 * phase line, each ask's control) and what reached the transport (each answer,
 * each re-read), never a variable on the way past. The plan views fed in are the
 * shape `/api/plan` answers; the server half is the workers suite's.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let PLAN_PHASE_LABELS: Record<string, string>

if (!WEBUI_INSTALLED) console.warn(`REQ-364 panel suites skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'alpha', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

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

const ask = (id: string, input: string, extra: Record<string, unknown> = {}) => ({
  id,
  prompt: `${id}?`,
  why: `Why ${id} matters.`,
  input,
  needed_by: 'first_pass',
  blocking: false,
  status: 'open',
  ...extra,
})

const VIEW = {
  phase: 'first_pass',
  asks: [
    ask('name', 'text', { accepts_upload: true }),
    ask('vans', 'number'),
    ask('fee', 'currency'),
    ask('phone', 'phone'),
    ask('email', 'email'),
    ask('site', 'url'),
    ask('since', 'date'),
    ask('kind', 'single_choice', { options: ['Independent', 'Franchise'] }),
    ask('towns', 'multi_choice', { options: ['Bristol', 'Bath'] }),
    ask('brochure', 'upload'),
    ask('licence', 'text', { status: 'answered', answer: 'GS-1', answered_by: 'client' }),
    ask('hours', 'text', { status: 'skipped', answered_by: 'client' }),
    // The server never sends one, and the panel would not draw it if it did.
    ask('gone', 'text', { status: 'withdrawn' }),
  ],
}

/** A plan transport that serves `view` and records every call. */
function planTransport(view: Record<string, unknown> = VIEW) {
  const calls = { fetches: 0, answers: [] as Record<string, unknown>[], uploads: 0 }
  let current = view
  return {
    calls,
    set: (next: Record<string, unknown>) => {
      current = next
    },
    fetchPlan: async () => {
      calls.fetches += 1
      return current
    },
    answerAsk: async (body: Record<string, unknown>) => {
      calls.answers.push(body)
      return current
    },
    uploadMaterial: async () => {
      calls.uploads += 1
      return { uid: 'material-1' }
    },
  }
}

function chatTransport(events: Record<string, unknown>[] = []) {
  return {
    openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
    streamPrompt: async function* () {
      for (const event of events) yield event
      yield { kind: 'done' }
    },
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ PLAN_PHASE_LABELS } = await import('../apps/control-app/src/builder/config.js'))
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

const block = (app: Handle, id: string): HTMLElement | null =>
  app.planPanel.element.querySelector(`[data-ask="${id}"]`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-364 — the panel draws the plan', () => {
  it('test_UAT_FC_REQ-364_the_panel_shows_the_phase_and_each_open_ask_with_the_input_its_type_takes', async () => {
    const plan = planTransport()
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: chatTransport(), planTransport: plan })
    await settle()

    // ABOVE THE CHAT, in the chat half.
    expect(app.planSplit.element.contains(app.planPanel.element)).toBe(true)
    expect(app.planSplit.element.contains(app.chat.element)).toBe(true)
    expect(app.split.element.contains(app.planSplit.element)).toBe(true)

    const text = app.planPanel.element.textContent ?? ''
    expect(text).toContain(PLAN_PHASE_LABELS.first_pass)
    expect(text).toContain('Rough first version')
    expect(text).toContain('Why fee matters.')

    const input = (id: string) => block(app, id)?.querySelector('input.plan-ask__input') as HTMLInputElement | null
    expect(input('name')?.type).toBe('text')
    expect(input('vans')?.getAttribute('inputmode')).toBe('decimal')
    expect(input('fee')?.getAttribute('inputmode')).toBe('decimal')
    expect(input('phone')?.type).toBe('tel')
    expect(input('email')?.type).toBe('email')
    expect(input('site')?.type).toBe('url')
    expect(input('since')?.type).toBe('date')
    expect([...block(app, 'kind')!.querySelectorAll('input[type=radio]')].map((i) => (i as HTMLInputElement).value)).toEqual([
      'Independent',
      'Franchise',
    ])
    expect(block(app, 'towns')!.querySelectorAll('input[type=checkbox]').length).toBe(2)
    // Upload-only asks take a document and nothing typed; others may offer one.
    expect(input('brochure')).toBeNull()
    expect(block(app, 'brochure')!.querySelector('input[type=file]')).toBeTruthy()
    expect(block(app, 'name')!.querySelector('input[type=file]')).toBeTruthy()
    expect(block(app, 'phone')!.querySelector('input[type=file]')).toBeNull()

    // Withdrawn asks are not drawn; answered and skipped ones are, compact.
    expect(block(app, 'gone')).toBeNull()
    expect(block(app, 'licence')!.closest('.plan-panel__list--done')).toBeTruthy()
    expect(block(app, 'licence')!.textContent).toContain('GS-1')
    expect(block(app, 'hours')!.textContent).toContain('Skipped')
  })

  it('test_UAT_FC_REQ-364_answers_save_as_the_client_goes_and_answered_asks_can_be_changed', async () => {
    const plan = planTransport()
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: chatTransport(), planTransport: plan })
    await settle()

    const fee = block(app, 'fee')!.querySelector('input') as HTMLInputElement
    fee.value = '£60'
    fee.dispatchEvent(new Event('change'))
    const franchise = block(app, 'kind')!.querySelectorAll('input')[1] as HTMLInputElement
    franchise.checked = true
    franchise.dispatchEvent(new Event('change'))
    ;(block(app, 'vans')!.querySelector('.plan-ask__skip') as HTMLButtonElement).click()
    await settle()
    expect(plan.calls.answers).toEqual([
      { site: 'alpha', ask: 'fee', action: 'answer', answer: '£60' },
      { site: 'alpha', ask: 'kind', action: 'answer', answer: 'Franchise' },
      { site: 'alpha', ask: 'vans', action: 'skip' },
    ])

    // An answered ask reopens to change, and saves the same way.
    ;(block(app, 'licence')!.querySelector('.plan-ask__change') as HTMLButtonElement).click()
    const licence = block(app, 'licence')!.querySelector('input.plan-ask__input') as HTMLInputElement
    expect(licence.value).toBe('GS-1')
    licence.value = 'GS-2'
    licence.dispatchEvent(new Event('change'))
    await settle()
    expect(plan.calls.answers.at(-1)).toEqual({ site: 'alpha', ask: 'licence', action: 'answer', answer: 'GS-2' })
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-364 — the panel re-reads when the plan may have moved', () => {
  it('test_UAT_FC_REQ-364_the_panel_rereads_when_a_turn_writes_the_plan_and_when_it_ends', async () => {
    const plan = planTransport({ phase: 'intake', asks: [] })
    let release = (): void => {}
    const held = new Promise<void>((r) => {
      release = r
    })
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      planTransport: plan,
      chatTransport: {
        openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
        streamPrompt: async function* () {
          // The agent adds an ask mid-turn…
          plan.set({ phase: 'intake', asks: [ask('fee', 'currency')] })
          yield { kind: 'plan_changed', content: '', meta: { at: 1, changes: 1 } }
          yield { kind: 'text', content: 'Working on it.' }
          await held
          yield { kind: 'done' }
        },
      },
    })
    await settle()
    const opened = plan.calls.fetches
    expect(opened).toBeGreaterThan(0)
    expect(block(app, 'fee')).toBeNull()

    void app.chat.getChat().send('Add my prices.')
    await settle()
    // …and it is on the panel while the turn is still running, with no reload.
    expect(block(app, 'fee')).toBeTruthy()
    const midTurn = plan.calls.fetches
    expect(midTurn).toBeGreaterThan(opened)

    release()
    await settle()
    expect(plan.calls.fetches).toBeGreaterThan(midTurn)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-364 — the divider', () => {
  it('test_UAT_FC_REQ-364_the_panels_divider_position_and_collapsed_state_survive_a_reload', async () => {
    const storage = memoryStorage()
    const first = mountBuilder(root, { sites: SITES, storage, chatTransport: chatTransport(), planTransport: planTransport() })
    await settle()
    expect(first.planSplit.element.classList.toString()).toMatch(/vertical/)
    first.planSplit.setSplit(22)
    first.destroy()

    document.body.replaceChildren()
    const root2 = document.createElement('div')
    document.body.append(root2)
    const second = mountBuilder(root2, { sites: SITES, storage, chatTransport: chatTransport(), planTransport: planTransport() })
    await settle()
    expect(second.planSplit.getSplit()).toBeCloseTo(22, 5)
    second.planSplit.collapse('primary')
    expect(second.planSplit.isCollapsed()).toBe(true)
    second.destroy()

    document.body.replaceChildren()
    const root3 = document.createElement('div')
    document.body.append(root3)
    const third = mountBuilder(root3, { sites: SITES, storage, chatTransport: chatTransport(), planTransport: planTransport() })
    await settle()
    expect(third.planSplit.isCollapsed()).toBe(true)
    // Collapsed, not lost: reopening restores the size it had.
    third.planSplit.expand()
    expect(third.planSplit.getSplit()).toBeCloseTo(22, 5)
  })
})
