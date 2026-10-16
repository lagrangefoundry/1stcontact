// @vitest-environment jsdom
/**
 * [[REQ-399]] — **the features question on the plan panel**: the real builder,
 * mounted in jsdom, with the origin replaced at the plan transport, as in
 * [[BUG-200]]'s suite.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-399 panel suites skipped: ${WEBUI_SKIP_REASON}`)

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

/** A plan transport that serves `view` and records every call. */
function planTransport(view: Record<string, unknown>) {
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

const boxes = (app: Handle, id: string) =>
  [...block(app, id)!.querySelectorAll('input[type=checkbox]')] as HTMLInputElement[]
const ticked = (app: Handle, id: string) => boxes(app, id).filter((b) => b.checked).map((b) => b.value)
const finish = (app: Handle, id: string) => block(app, id)!.querySelector('.plan-ask__done') as HTMLButtonElement | null
const tick = (app: Handle, id: string, value: string, on = true) => {
  const box = boxes(app, id).find((b) => b.value === value)!
  box.checked = on
  box.dispatchEvent(new Event('change'))
}


/**
 * [[REQ-399]] — the features question as `panelView` projects it: capability ids
 * for options, the consultant's wording in `labels`, the not-yet-built ones in
 * `unavailable`, and a free-text "Something else?".
 */
const FEATURES_ASK = ask('features', 'multi_choice', {
  prompt: 'What does your site need to do?',
  options: ['contact_message', 'booking', 'online_payment'],
  labels: {
    contact_message: 'Visitors can send you a message',
    booking: 'Patients can book an appointment',
    online_payment: 'Visitors can pay online',
  },
  unavailable: ['booking', 'online_payment'],
  other: true,
  draft: ['contact_message'],
})

const mount = async (plan: ReturnType<typeof planTransport>) => {
  const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: chatTransport(), planTransport: plan })
  await settle()
  return app
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-399 — the features question on the panel', () => {
  it('test_UAT_FC_REQ-399_unavailable_options_are_marked_not_yet_available', async () => {
    const app = await mount(planTransport({ asks: [FEATURES_ASK] }))
    const choices = [...block(app, 'features')!.querySelectorAll('.plan-ask__choice')] as HTMLElement[]
    // THE CLIENT SEES THE CONSULTANT'S WORDING; the box carries the capability id.
    expect(choices.map((c) => c.querySelector('.plan-ask__choice-label')!.textContent)).toEqual([
      'Visitors can send you a message',
      'Patients can book an appointment',
      'Visitors can pay online',
    ])
    expect(boxes(app, 'features').map((b) => b.value)).toEqual(['contact_message', 'booking', 'online_payment'])
    const marks = choices.map((c) => c.querySelector('.plan-ask__unavailable')?.textContent ?? null)
    expect(marks).toEqual([null, '[not yet available]', '[not yet available]'])
    // Pre-ticked by the consultant, and the client can untick.
    expect(ticked(app, 'features')).toEqual(['contact_message'])
  })

  it('test_UAT_FC_REQ-399_something_else_is_sent_with_the_answer', async () => {
    const plan = planTransport({ asks: [FEATURES_ASK] })
    const app = await mount(plan)
    const other = block(app, 'features')!.querySelector('.plan-ask__other') as HTMLInputElement
    // UNDER THE LIST.
    const list = block(app, 'features')!.querySelector('.plan-ask__choices')!
    expect(list.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(other.placeholder).toBe('Something else?')
    tick(app, 'features', 'booking')
    await settle()
    const typed = block(app, 'features')!.querySelector('.plan-ask__other') as HTMLInputElement
    typed.value = 'A members-only area'
    typed.dispatchEvent(new Event('input'))
    finish(app, 'features')!.click()
    await settle()
    expect(plan.calls.answers.at(-1)).toEqual({
      site: 'alpha',
      ask: 'features',
      action: 'answer',
      answer: ['contact_message', 'booking'],
      other: 'A members-only area',
    })
  })

  it('test_UAT_FC_REQ-399_options_are_laid_out_one_per_line_never_inline', async () => {
    const app = await mount(planTransport({ asks: [FEATURES_ASK] }))
    const list = block(app, 'features')!.querySelector('.plan-ask__choices') as HTMLElement
    // A GRID AS WIDE AS ITS LONGEST LABEL, so one per line, in columns where they fit.
    expect(list.classList.contains('plan-ask__choices--multi')).toBe(true)
    const longest = 'Patients can book an appointment'.length + '[not yet available]'.length * 0.8
    expect(list.style.getPropertyValue('--plan-choice-width')).toBe(`${Math.ceil(longest) + 3}ch`)
    const css = (await import('node:fs')).readFileSync('apps/control-app/src/builder/builder.css', 'utf8')
    const rule = css.slice(css.indexOf('.plan-ask__choices--multi {'), css.indexOf('}', css.indexOf('.plan-ask__choices--multi {')))
    expect(rule).toContain('display: grid')
    expect(rule).toContain('minmax(min(var(--plan-choice-width')
  })

  it('test_UAT_FC_REQ-399_the_answered_question_reads_in_the_clients_words', async () => {
    const answered = { ...FEATURES_ASK, status: 'answered', answered_by: 'client', answer: ['booking'], answer_other: 'A members-only area' }
    delete (answered as Record<string, unknown>).draft
    const app = await mount(planTransport({ asks: [answered] }))
    expect(block(app, 'features')!.querySelector('.plan-ask__value')!.textContent).toBe('Patients can book an appointment; A members-only area')
  })
})
