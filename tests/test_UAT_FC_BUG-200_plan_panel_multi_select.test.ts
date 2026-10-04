// @vitest-environment jsdom
/**
 * [[BUG-200]] — **a multi-select on the plan panel stays open while the client ticks,
 * and is finished with Done.** Ticking used to answer on the first box, collapsing
 * the question into the answered list with one feature in it.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components, with
 * the origin replaced at the plan transport it already takes ([[REQ-364]]'s suite
 * does the same). The transport here behaves as the route does — a `draft` keeps the
 * ticks and leaves the ask open, an `answer` answers it — so what is read for
 * evidence is what the client would see next and what reached the transport.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let PLAN_STILL_TO_ANSWER: (n: number) => string

if (!WEBUI_INSTALLED) console.warn(`BUG-200 panel suites skipped: ${WEBUI_SKIP_REASON}`)

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
    ;({ PLAN_STILL_TO_ANSWER } = await import('../apps/control-app/src/builder/config.js'))
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
const inOpenList = (app: Handle, id: string) => Boolean(block(app, id)?.closest('.plan-panel__list--open'))
const progressText = (app: Handle) => app.planPanel.element.querySelector('.plan-panel__progress')?.textContent ?? ''

const FEATURES = ['Online booking', 'Contact form', 'Price list']

/**
 * A transport that keeps the plan the way the route does: `draft` sets the ticks and
 * leaves the status alone; `answer` answers and drops the draft.
 */
function routeLike(extra: Record<string, unknown>[] = []) {
  const asks: Record<string, unknown>[] = [
    ask('features', 'multi_choice', { options: FEATURES }),
    ask('kind', 'single_choice', { options: ['Independent', 'Franchise'] }),
    ...extra,
  ]
  const transport = planTransport({ phase: 'intake', asks })
  const answer = transport.answerAsk
  transport.answerAsk = async (body: Record<string, unknown>) => {
    await answer(body)
    const a = asks.find((x) => x.id === body.ask)!
    if (body.action === 'draft') a.draft = body.answer
    else {
      delete a.draft
      a.status = 'answered'
      a.answer = body.answer
      a.answered_by = 'client'
    }
    // A NEW VIEW EACH TIME, as a response would be.
    const next = { phase: 'intake', asks: asks.map((x) => ({ ...x })) }
    transport.set(next)
    return next
  }
  return transport
}

const mount = async (plan: ReturnType<typeof planTransport>) => {
  const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport: chatTransport(), planTransport: plan })
  await settle()
  return app
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-200 — a multi-select is finished with Done', () => {
  it('test_UAT_FC_BUG-200_ticking_several_boxes_leaves_the_question_open_with_every_tick', async () => {
    const plan = routeLike()
    const app = await mount(plan)
    expect(finish(app, 'features')?.textContent).toBe('None of these')

    tick(app, 'features', 'Online booking')
    await settle()
    tick(app, 'features', 'Price list')
    await settle()

    expect(inOpenList(app, 'features')).toBe(true)
    expect(ticked(app, 'features')).toEqual(['Online booking', 'Price list'])
    expect(finish(app, 'features')?.textContent).toBe('Done')
    // DRAFTS, NOT ANSWERS: nothing has answered the question yet.
    expect(plan.calls.answers.map((b) => b.action)).toEqual(['draft', 'draft'])
    expect(plan.calls.answers.at(-1)).toEqual({ site: 'alpha', ask: 'features', action: 'draft', answer: ['Online booking', 'Price list'] })
    expect(progressText(app)).toBe(PLAN_STILL_TO_ANSWER(2))
  })

  it('test_UAT_FC_BUG-200_done_answers_with_the_whole_selection_and_moves_it_to_the_answered_list', async () => {
    const plan = routeLike()
    const app = await mount(plan)
    tick(app, 'features', 'Contact form')
    tick(app, 'features', 'Price list')
    await settle()
    finish(app, 'features')!.click()
    await settle()

    expect(plan.calls.answers.at(-1)).toEqual({ site: 'alpha', ask: 'features', action: 'answer', answer: ['Contact form', 'Price list'] })
    expect(block(app, 'features')!.closest('.plan-panel__list--done')).toBeTruthy()
    expect(block(app, 'features')!.textContent).toContain('Contact form, Price list')
    expect(progressText(app)).toBe(PLAN_STILL_TO_ANSWER(1))
  })

  it('test_UAT_FC_BUG-200_none_of_these_answers_with_an_empty_selection', async () => {
    const plan = routeLike()
    const app = await mount(plan)
    finish(app, 'features')!.click()
    await settle()
    expect(plan.calls.answers).toEqual([{ site: 'alpha', ask: 'features', action: 'answer', answer: [] }])
    expect(block(app, 'features')!.closest('.plan-panel__list--done')).toBeTruthy()
    expect(block(app, 'features')!.textContent).toContain('None of these')
  })

  it('test_UAT_FC_BUG-200_picks_before_done_survive_a_rerender_and_a_reload', async () => {
    const plan = routeLike()
    const app = await mount(plan)
    tick(app, 'features', 'Online booking')
    await settle()
    // A re-read redraws from the stored draft.
    await app.planPanel.refresh()
    await settle()
    expect(ticked(app, 'features')).toEqual(['Online booking'])
    // A reload: a new builder, reading the same plan.
    app.destroy?.()
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    const again = await mount(plan)
    expect(inOpenList(again, 'features')).toBe(true)
    expect(ticked(again, 'features')).toEqual(['Online booking'])
    expect(finish(again, 'features')?.textContent).toBe('Done')
  })

  it('test_UAT_FC_BUG-200_reopening_an_answered_multi_select_shows_its_ticks_and_waits_for_done', async () => {
    const plan = routeLike()
    const app = await mount(plan)
    tick(app, 'features', 'Contact form')
    await settle()
    finish(app, 'features')!.click()
    await settle()
    ;(block(app, 'features')!.querySelector('.plan-ask__change') as HTMLButtonElement).click()
    expect(ticked(app, 'features')).toEqual(['Contact form'])
    tick(app, 'features', 'Price list')
    await settle()
    // Still open to change, still answered as before, until Done.
    expect(ticked(app, 'features')).toEqual(['Contact form', 'Price list'])
    expect(plan.calls.answers.at(-1)?.action).toBe('draft')
    finish(app, 'features')!.click()
    await settle()
    expect(plan.calls.answers.at(-1)).toEqual({ site: 'alpha', ask: 'features', action: 'answer', answer: ['Contact form', 'Price list'] })
    expect(block(app, 'features')!.querySelector('input[type=checkbox]')).toBeNull()
  })

  it('test_UAT_FC_BUG-200_a_single_choice_still_saves_on_pick', async () => {
    const plan = routeLike()
    const app = await mount(plan)
    const franchise = block(app, 'kind')!.querySelectorAll('input[type=radio]')[1] as HTMLInputElement
    franchise.checked = true
    franchise.dispatchEvent(new Event('change'))
    await settle()
    expect(plan.calls.answers).toEqual([{ site: 'alpha', ask: 'kind', action: 'answer', answer: 'Franchise' }])
    expect(block(app, 'kind')!.closest('.plan-panel__list--done')).toBeTruthy()
    expect(block(app, 'kind')!.querySelector('.plan-ask__done')).toBeNull()
  })
})
