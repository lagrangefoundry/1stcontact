// @vitest-environment jsdom
/**
 * [[REQ-390]] — **the browser half: the stage tracker at the top of the plan panel,
 * the working line beside the composer, and the multi-line answer.**
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the plan and chat transports it already takes (the
 * REQ-364 and BUG-200 suites do the same). The clock is `Date.now`, held still and
 * moved by hand, so "how long so far" is a figure the test chose.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let WORKING_LINE_CLASS: string

if (!WEBUI_INSTALLED) console.warn(`REQ-390 panel suites skipped: ${WEBUI_SKIP_REASON}`)

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

const LABELS: Record<string, string> = {
  getting_to_know_you: 'Getting to know you',
  other_sites: 'Looking at other sites',
  first_draft: 'First draft',
  refining: 'Refining',
  colours_and_fonts: 'Colours & fonts',
  finishing_touches: 'Finishing touches',
  ready_to_publish: 'Ready to publish',
}

/** The seven stages as the route projects them, with the states given and the rest not started. */
const stages = (states: Record<string, string>) =>
  Object.entries(LABELS).map(([id, label]) => ({ id, label, state: states[id] ?? 'not_started' }))

function planTransport(view: Record<string, unknown>) {
  const calls = { answers: [] as Record<string, unknown>[] }
  let current = view
  return {
    calls,
    set: (next: Record<string, unknown>) => {
      current = next
    },
    fetchPlan: async () => current,
    answerAsk: async (body: Record<string, unknown>) => {
      calls.answers.push(body)
      return current
    },
    uploadMaterial: async () => ({ uid: 'material-1' }),
  }
}

let clock = 1_000_000

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ WORKING_LINE_CLASS } = await import('../apps/control-app/src/builder/chat.js'))
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
  globalThis.localStorage?.clear()
  root = document.createElement('div')
  document.body.append(root)
  clock = 1_000_000
  vi.spyOn(Date, 'now').mockImplementation(() => clock)
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Each stage as drawn: its words, its state, its mark, and whether it is the current one. */
const drawn = (app: Handle) =>
  [...app.planPanel.element.querySelectorAll('.plan-stage')].map((li: Element) => ({
    label: li.querySelector('.plan-stage__label')?.textContent,
    state: (li as HTMLElement).dataset.state,
    mark: li.querySelector('.plan-stage__mark')?.textContent,
    current: li.getAttribute('aria-current') === 'step',
    spinning: Boolean(li.querySelector('.plan-stage__spinner')),
  }))

const workingLine = (): HTMLElement | null => document.querySelector(`.${WORKING_LINE_CLASS}`)

const chatTransport = (stream: () => AsyncGenerator<unknown>) => ({
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
  streamPrompt: stream,
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-390 — the stage tracker', () => {
  it('test_UAT_FC_REQ-390_the_panel_draws_the_stages_first_ticked_reopened_and_in_any_order', async () => {
    // OUT OF ORDER: "Colours & fonts" ticked before "Looking at other sites".
    const plan = planTransport({
      stages: stages({ getting_to_know_you: 'done', colours_and_fonts: 'done', first_draft: 'in_progress' }),
      asks: [],
    })
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      planTransport: plan,
      chatTransport: chatTransport(async function* () {
        yield { kind: 'done' }
      }),
    })
    await settle()

    // FIRST ON THE PANEL, above the progress count and the questions.
    const tracker = app.planPanel.element.firstElementChild as HTMLElement
    expect(tracker.classList.contains('plan-stages')).toBe(true)
    expect(tracker.nextElementSibling?.classList.contains('plan-panel__progress')).toBe(true)

    // ALL SEVEN, IN ORDER: done ones ticked wherever they are, the current one marked.
    expect(drawn(app)).toEqual([
      { label: 'Getting to know you', state: 'done', mark: '✓', current: false, spinning: false },
      { label: 'Looking at other sites', state: 'not_started', mark: '○', current: false, spinning: false },
      { label: 'First draft', state: 'in_progress', mark: '●', current: true, spinning: false },
      { label: 'Refining', state: 'not_started', mark: '○', current: false, spinning: false },
      { label: 'Colours & fonts', state: 'done', mark: '✓', current: false, spinning: false },
      { label: 'Finishing touches', state: 'not_started', mark: '○', current: false, spinning: false },
      { label: 'Ready to publish', state: 'not_started', mark: '○', current: false, spinning: false },
    ])

    // REOPENED: a done stage back in progress is un-ticked, and the marker moves.
    plan.set({ stages: stages({ getting_to_know_you: 'in_progress', colours_and_fonts: 'done' }), asks: [] })
    await app.planPanel.refresh()
    const after = drawn(app)
    expect(after[0]).toMatchObject({ state: 'in_progress', mark: '●', current: true })
    expect(after[2]).toMatchObject({ state: 'not_started', current: false })
    expect(after.filter((s) => s.current)).toHaveLength(1)

    // COLLAPSIBLE TO THE CURRENT STAGE, and remembered.
    const toggle = tracker.querySelector('.plan-stages__toggle') as HTMLButtonElement
    toggle.click()
    expect(tracker.classList.contains('plan-stages--collapsed')).toBe(true)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(globalThis.localStorage.getItem('plan-stages-collapsed')).toBe('1')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-390 — while the consultant works', () => {
  it('test_UAT_FC_REQ-390_a_running_turn_spins_the_current_stage_and_the_working_line_counts_up_with_the_note', async () => {
    const seen: { line: string | null; beforeComposer: boolean; spinning: boolean }[] = []
    let app: Handle
    const look = () => {
      const line = workingLine()
      seen.push({
        line: line?.textContent ?? null,
        beforeComposer: line?.nextElementSibling?.classList.contains('chat-widget-input-bar') ?? false,
        spinning: drawn(app).some((s) => s.spinning),
      })
    }
    const plan = planTransport({ stages: stages({ getting_to_know_you: 'done', first_draft: 'in_progress' }), asks: [] })
    app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      planTransport: plan,
      chatTransport: chatTransport(async function* () {
        // NO NOTE YET: the line says only that work is going on, and for how long.
        clock += 42_000
        await new Promise((r) => setTimeout(r, 1_100))
        look()
        yield { kind: 'text', content: 'Building your home page now; it takes about five minutes.' }
        yield { kind: 'working', content: 'Alice is building your home page', meta: { estimate: 'about 5 min' } }
        clock += 92_000
        // THE TIMER ADVANCES ON ITS OWN, with no frame arriving.
        await new Promise((r) => setTimeout(r, 1_100))
        look()
        yield { kind: 'text', content: ' Done.' }
        yield { kind: 'done' }
      }),
    })
    await settle()
    expect(workingLine()).toBeNull()

    await app.chat.getChat().send('Build my home page.')
    await settle()

    // WHILE IT RUNS: the line just above the composer, and the current stage spinning.
    expect(seen[0]).toEqual({ line: 'Working · 0:42 so far', beforeComposer: true, spinning: true })
    expect(seen[1]).toEqual({
      line: 'Alice is building your home page · about 5 min · 2:14 so far',
      beforeComposer: true,
      spinning: true,
    })
    // THE STOP BUTTON IS STILL THE WAY TO STOP — it is not replaced.
    expect(document.querySelector('.chat-widget-stop-btn')).not.toBeNull()

    // AND WHEN IT ENDS: no line, no spinner — and the frame never reached the conversation.
    expect(workingLine()).toBeNull()
    expect(drawn(app).some((s) => s.spinning)).toBe(false)
    const said = app.chat.getChat().getMessages().map((m: { markdown: string }) => m.markdown).join('')
    expect(said).not.toContain('Alice is building')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-390 — a multi-line answer', () => {
  it('test_UAT_FC_REQ-390_a_long_text_ask_is_a_growing_text_area_that_saves_when_left', async () => {
    const plan = planTransport({
      stages: stages({ getting_to_know_you: 'in_progress' }),
      asks: [
        {
          id: 'story',
          prompt: 'How did the business start?',
          why: 'It becomes your About page.',
          input: 'long_text',
          needed_by: 'first_pass',
          blocking: false,
          status: 'open',
        },
      ],
    })
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      planTransport: plan,
      chatTransport: chatTransport(async function* () {
        yield { kind: 'done' }
      }),
    })
    await settle()

    const area = app.planPanel.element.querySelector('[data-ask="story"] textarea') as HTMLTextAreaElement
    expect(area).not.toBeNull()
    expect(area.getAttribute('aria-label')).toBe('How did the business start?')

    const answer = 'My dad started it in 1987.\nI took over in 2010.'
    area.value = answer
    area.dispatchEvent(new Event('input'))
    // LEAVING IT IS THE SAVE, as with every typed answer.
    area.dispatchEvent(new Event('change'))
    await settle()
    expect(plan.calls.answers).toEqual([{ site: 'alpha', ask: 'story', action: 'answer', answer }])
  })
})
