// @vitest-environment jsdom
/**
 * [[REQ-379]] — **the progress line under the plan panel's stage tracker**: how many
 * questions are still for the client to answer, or that they are all done.
 *
 * The harness is REQ-364's panel suite's:
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes — the chat's and
 * the plan panel's. What is read for evidence is what the client would see (the
 * stage tracker, each ask's control) and what reached the transport (each answer,
 * each re-read), never a variable on the way past. The plan views fed in are the
 * shape `/api/plan` answers; the server half is the workers suite's.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-379 panel suites skipped: ${WEBUI_SKIP_REASON}`)

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

/** [[REQ-390]] — the tracker a view carries: the stages replace the old phase. */
const STAGES = [
  { id: 'getting_to_know_you', label: 'Getting to know you', state: 'done' },
  { id: 'first_draft', label: 'First draft', state: 'in_progress' },
]

const VIEW = {
  stages: STAGES,
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


const progress = (app: Handle): string =>
  (app.planPanel.element.querySelector('.plan-panel__progress') as HTMLElement | null)?.textContent ?? ''

describe.skipIf(!WEBUI_INSTALLED)('REQ-379 — the panel counts what is left for the client', () => {
  it('test_UAT_FC_REQ-379_the_panel_shows_how_many_questions_are_still_to_answer_and_all_done_at_zero', async () => {
    const plan = planTransport({
      stages: STAGES,
      asks: [
        ask('phone', 'phone'),
        ask('hours', 'text'),
        ask('towns', 'multi_choice', { options: ['Bristol', 'Bath'] }),
        // Answered and skipped asks are not counted; withdrawn ones never arrive.
        ask('licence', 'text', { status: 'answered', answer: 'GS-1', answered_by: 'client' }),
        ask('vans', 'number', { status: 'skipped', answered_by: 'client' }),
      ],
    })
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: chatTransport(), planTransport: plan })
    await settle()

    // DIRECTLY UNDER THE STAGE TRACKER ([[REQ-390]] replaced the phase heading).
    const tracker = app.planPanel.element.querySelector('.plan-stages') as HTMLElement
    expect(tracker).toBe(app.planPanel.element.firstElementChild)
    expect((tracker.nextElementSibling as HTMLElement).classList.contains('plan-panel__progress')).toBe(true)
    expect(progress(app)).toBe('3 questions still to answer')

    // ANSWERING ONE UPDATES IT AS SOON AS THE ANSWER IS SAVED, with no turn run.
    plan.set({
      stages: STAGES,
      asks: [
        ask('phone', 'phone', { status: 'answered', answer: '0117 000', answered_by: 'client' }),
        ask('hours', 'text'),
        ask('towns', 'multi_choice', { options: ['Bristol', 'Bath'] }),
      ],
    })
    const phoneInput = block(app, 'phone')!.querySelector('input') as HTMLInputElement
    phoneInput.value = '0117 000'
    phoneInput.dispatchEvent(new Event('change'))
    await settle()
    expect(plan.calls.answers).toEqual([{ site: 'alpha', ask: 'phone', action: 'answer', answer: '0117 000' }])
    expect(progress(app)).toBe('2 questions still to answer')

    // ONE LEFT IS SINGULAR.
    plan.set({ stages: STAGES, asks: [ask('hours', 'text')] })
    await app.planPanel.refresh()
    expect(progress(app)).toBe('1 question still to answer')

    // NONE OPEN IS THE ALL-DONE MESSAGE.
    plan.set({ stages: STAGES, asks: [ask('hours', 'text', { status: 'skipped', answered_by: 'client' })] })
    await app.planPanel.refresh()
    expect(progress(app)).toBe("All done — thanks, that's everything I need for now.")
  })

  it('test_UAT_FC_REQ-379_the_count_rises_when_the_consultant_adds_an_ask_mid_turn', async () => {
    const plan = planTransport({ stages: STAGES, asks: [ask('phone', 'phone')] })
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      planTransport: plan,
      chatTransport: {
        openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
        streamPrompt: async function* () {
          plan.set({ stages: STAGES, asks: [ask('phone', 'phone'), ask('fee', 'currency')] })
          yield { kind: 'plan_changed', content: '', meta: { at: 1, changes: 1 } }
          yield { kind: 'done' }
        },
      },
    })
    await settle()
    expect(progress(app)).toBe('1 question still to answer')
    void app.chat.getChat().send('Add my prices.')
    await settle()
    expect(progress(app)).toBe('2 questions still to answer')
  })
})
