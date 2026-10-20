// @vitest-environment jsdom
/**
 * [[REQ-401]] — **the plan panel's questions are foldable items**: each folds to
 * one line (a disclosure triangle, a status box, the start of the question), in
 * two sections — OPEN QUESTIONS and WHAT YOU'VE TOLD US — set in the chat's own
 * type, with the comp board as one more item rather than a section of its own.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the shell's, the chat's and the builder's own stylesheets loaded in the
 * order the page loads them, and the origin replaced at the transports it already
 * takes. The evidence is what the client would see and what reached the
 * transport. jsdom resolves neither `var()` nor inheritance, so the type is read
 * by walking the cascade the way a browser would ({@link fontOf}).
 *
 * The comp board's status is worked out by the plan itself; that half is asserted
 * through the plan core's own functions, and the consultant's two rules through
 * the priming the host renders.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'
import {
  addComp,
  panelView,
  planReminder,
  seedPlan,
  skipComps,
  type Plan,
} from '../tools/generate/src/cli/ai/plan-core'
import { primingConfig } from '../tools/generate/src/cli/ai/roles'
import planSurface from '../tools/generate/src/cli/ai/plan-surface.json'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-401 panel suites skipped: ${WEBUI_SKIP_REASON}`)

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

const STAGES = [{ id: 'getting_to_know_you', label: 'Getting to know you', about: '', state: 'in_progress' }]

const ask = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  prompt: `${id} for the site — a question long enough that a narrow panel has to cut it off`,
  why: `Why ${id} matters.`,
  input: 'text',
  needed_by: 'first_pass',
  blocking: false,
  status: 'open',
  ...extra,
})
const answered = (id: string, answer = 'yes') => ask(id, { status: 'answered', answer, answered_by: 'client' })
const skipped = (id: string) => ask(id, { status: 'skipped', answered_by: 'client' })

/** A plan transport that serves `view`, answers asks as the server would, and records every call. */
function planTransport(view: Record<string, any>) {
  const calls = { answers: [] as Record<string, unknown>[], comps: [] as Record<string, unknown>[] }
  let current = view
  return {
    calls,
    set: (next: Record<string, any>) => {
      current = next
    },
    fetchPlan: async () => current,
    answerAsk: async (body: Record<string, any>) => {
      calls.answers.push(body)
      if (body.action !== 'draft') {
        current = {
          ...current,
          asks: current.asks.map((a: Record<string, unknown>) =>
            a.id === body.ask
              ? { ...a, status: body.action === 'skip' ? 'skipped' : 'answered', answer: body.answer, answered_by: 'client' }
              : a,
          ),
        }
      }
      return current
    },
    compAction: async (body: Record<string, any>) => {
      calls.comps.push(body)
      if (body.action === 'skip') current = { ...current, comps_status: 'skipped' }
      return current
    },
    uploadMaterial: async () => ({ uid: 'material-1' }),
  }
}

const chatTransport = {
  openSession: async (slug: string) => ({
    sessionId: `site-${slug}`,
    turns: [{ role: 'assistant', markdown: 'Hello — tell me about your business.' }],
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
  document.head.replaceChildren()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
  for (const css of CSS) {
    const style = document.createElement('style')
    style.textContent = css
    document.head.append(style)
  }
  root = document.createElement('div')
  document.body.append(root)
})

async function mount(plan: ReturnType<typeof planTransport>, storage = memoryStorage()): Promise<Handle> {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  const app = mountBuilder(root, { sites: SITES, storage, chatTransport, planTransport: plan })
  await settle()
  return app
}

const panel = (app: Handle): HTMLElement => app.planPanel.element
const item = (app: Handle, id: string): HTMLElement => panel(app).querySelector(`[data-ask="${id}"]`) as HTMLElement
const comps = (app: Handle): HTMLElement => panel(app).querySelector('[data-comps]') as HTMLElement
const line = (node: HTMLElement): HTMLElement => node.querySelector(':scope > .plan-item__line') as HTMLElement
const body = (node: HTMLElement): HTMLElement => node.querySelector(':scope > .plan-item__body') as HTMLElement
const expanded = (node: HTMLElement): boolean => line(node).getAttribute('aria-expanded') === 'true' && !body(node).hidden
const section = (node: HTMLElement): string =>
  node.parentElement!.classList.contains('plan-panel__list--open') ? 'open' : node.parentElement!.classList.contains('plan-panel__list--done') ? 'done' : '?'
const heading = (list: string): HTMLElement =>
  [...document.querySelectorAll('.plan-panel__heading')].find(
    (h) => h.nextElementSibling?.classList.contains(`plan-panel__list--${list}`),
  ) as HTMLElement

/**
 * A font property as the browser would resolve it: the nearest declaration up the
 * tree (`inherit` and nothing defer to the parent), with any `var()` replaced by
 * the custom property as the root declares it. Answers the value and the element
 * whose rule declared it.
 */
function fontOf(el: Element, prop: 'fontSize' | 'fontFamily'): { value: string; declared: string; from: Element } {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const declared = (getComputedStyle(node) as unknown as Record<string, string>)[prop]
    if (!declared || declared === 'inherit') continue
    const v = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/.exec(declared)
    const value = v
      ? getComputedStyle(document.documentElement).getPropertyValue(v[1]).trim() || (v[2] ?? '').trim()
      : declared
    return { value, declared, from: node }
  }
  return { value: '', declared: '', from: document.documentElement }
}

describe.skipIf(!WEBUI_INSTALLED)("REQ-401 — the panel is set in the chat's type", () => {
  it('test_UAT_FC_REQ-401_question_text_and_inputs_take_the_chats_font_family_and_size', async () => {
    const plan = planTransport({ stages: STAGES, asks: [ask('phone'), answered('licence', 'GS-1')], comps: [], comps_raised: true, comps_status: 'open' })
    const app = await mount(plan)
    // Unfold the answered one, so its answer is on screen.
    line(item(app, 'licence')).click()

    const message = app.chat.element.querySelector('.chat-message.assistant') as HTMLElement
    expect(message).toBeTruthy()
    const chatSize = fontOf(message, 'fontSize')
    const chatFamily = fontOf(message, 'fontFamily')
    expect(chatSize.value).toBe('13px')

    const shown = [
      item(app, 'phone').querySelector('.plan-item__title'),
      item(app, 'phone').querySelector('.plan-ask__why'),
      item(app, 'phone').querySelector('input.plan-ask__input'),
      item(app, 'licence').querySelector('.plan-ask__value'),
      comps(app).querySelector('input.plan-comps__url'),
    ] as HTMLElement[]
    for (const el of shown) {
      expect(el).toBeTruthy()
      // THE SAME SIZE, READ FROM THE SAME DECLARATION as the chat's — not a copy of it.
      expect(fontOf(el, 'fontSize')).toMatchObject({ value: chatSize.value, declared: chatSize.declared })
      // THE SAME FAMILY: nothing between the question and the shell sets its own.
      expect(fontOf(el, 'fontFamily').from).toBe(chatFamily.from)
    }

    // AND THE TWO CANNOT DRIFT: move the chat's size and the questions move with it.
    document.documentElement.style.setProperty('--builder-chat-font-size', '17px')
    expect(fontOf(message, 'fontSize').value).toBe('17px')
    for (const el of shown) expect(fontOf(el, 'fontSize').value).toBe('17px')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-401 — each item folds to one line', () => {
  it('test_UAT_FC_REQ-401_a_folded_item_is_one_line_of_triangle_status_box_and_the_question_cut_off', async () => {
    const plan = planTransport({
      stages: STAGES,
      asks: [ask('phone'), answered('licence'), skipped('hours')],
      comps: [],
      comps_raised: true, comps_status: 'open',
    })
    const app = await mount(plan)
    const phone = item(app, 'phone')
    line(phone).click()
    for (const [node, state, mark, words] of [
      [phone, 'open', '', 'Open'],
      [item(app, 'hours'), 'skipped', '–', 'Skipped'],
      [item(app, 'licence'), 'done', '✓', 'Done'],
    ] as [HTMLElement, string, string, string][]) {
      expect(expanded(node)).toBe(false)
      // IN THIS ORDER: the triangle, the status box, the start of the question.
      const parts = [...line(node).children] as HTMLElement[]
      expect(parts.map((p) => p.className)).toEqual(['plan-item__twisty', 'plan-item__box', 'plan-ask__prompt plan-item__title'])
      expect(parts[0].textContent).toBe('▸')
      expect(parts[2].textContent).toContain(' for the site — ')
      // The box: empty, a dash, or a tick — and the status in words for a screen reader.
      expect(parts[1].querySelector('.plan-item__mark')!.textContent).toBe(mark)
      expect(parts[1].querySelector('.plan-item__status')!.textContent).toBe(words)
      expect(node.dataset.state).toBe(state)
      // ONE LINE, the question cut off with "…" at its end.
      expect(getComputedStyle(line(node)).display).toBe('flex')
      const title = getComputedStyle(parts[2])
      expect([title.whiteSpace, title.overflow, title.textOverflow]).toEqual(['nowrap', 'hidden', 'ellipsis'])
    }
    // The boxes look different, never only by colour: open is a white box, skipped a grey one.
    const box = (node: HTMLElement) => getComputedStyle(node.querySelector('.plan-item__box')!).backgroundColor
    expect(box(phone)).toMatch(/^(#fff|rgb\(255, 255, 255\))$/)
    expect(box(item(app, 'hours'))).not.toBe(box(phone))
    // The words are visually hidden, not hidden from a screen reader.
    const words = getComputedStyle(phone.querySelector('.plan-item__status')!)
    expect([words.position, words.width, words.overflow]).toEqual(['absolute', '1px', 'hidden'])
  })

  it('test_UAT_FC_REQ-401_a_click_anywhere_on_the_line_or_enter_or_space_toggles_the_item', async () => {
    const plan = planTransport({ stages: STAGES, asks: [ask('phone')], comps: [], comps_raised: true, comps_status: 'open' })
    const app = await mount(plan)
    const phone = item(app, 'phone')
    expect(expanded(phone)).toBe(true)
    expect(line(phone).getAttribute('role')).toBe('button')
    expect(line(phone).tabIndex).toBe(0)
    ;(phone.querySelector('.plan-item__title') as HTMLElement).click()
    expect(expanded(phone)).toBe(false)
    expect(line(phone).querySelector('.plan-item__twisty')!.textContent).toBe('▸')
    ;(phone.querySelector('.plan-item__box') as HTMLElement).click()
    expect(expanded(phone)).toBe(true)
    expect(line(phone).querySelector('.plan-item__twisty')!.textContent).toBe('▾')
    line(phone).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(expanded(phone)).toBe(false)
    line(phone).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(expanded(phone)).toBe(true)
    // Typing in the answer never folds it.
    const input = phone.querySelector('input.plan-ask__input') as HTMLInputElement
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    input.click()
    expect(expanded(phone)).toBe(true)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-401 — two sections', () => {
  it('test_UAT_FC_REQ-401_open_items_sit_unfolded_under_open_questions_and_done_and_skipped_ones_folded_under_what_youve_told_us', async () => {
    const plan = planTransport({
      stages: STAGES,
      asks: [ask('phone'), ask('towns'), answered('licence'), skipped('hours'), ask('gone', { status: 'withdrawn' })],
      comps: [],
      comps_raised: true, comps_status: 'open',
    })
    const app = await mount(plan)
    expect(heading('open').textContent).toBe('Open questions')
    expect(heading('done').textContent).toBe("What you've told us")
    // Set in capitals by the stylesheet.
    expect(getComputedStyle(heading('open')).textTransform).toBe('uppercase')
    for (const id of ['phone', 'towns']) {
      expect(section(item(app, id))).toBe('open')
      expect(expanded(item(app, id))).toBe(true)
    }
    for (const id of ['licence', 'hours']) {
      expect(section(item(app, id))).toBe('done')
      expect(expanded(item(app, id))).toBe(false)
    }
    expect(item(app, 'gone')).toBeNull()
    expect(heading('open').hidden).toBe(false)
    expect(heading('done').hidden).toBe(false)

    // A SECTION WITH NOTHING IN IT IS HIDDEN.
    plan.set({ stages: STAGES, asks: [answered('licence')], comps: [], comps_raised: true, comps_status: 'done' })
    await app.planPanel.refresh()
    expect(heading('open').hidden).toBe(true)
    expect((panel(app).querySelector('.plan-panel__list--open') as HTMLElement).hidden).toBe(true)
    plan.set({ stages: STAGES, asks: [ask('phone')], comps: [], comps_raised: true, comps_status: 'open' })
    await app.planPanel.refresh()
    expect(heading('done').hidden).toBe(true)
    expect((panel(app).querySelector('.plan-panel__list--done') as HTMLElement).hidden).toBe(true)
  })

  it('test_UAT_FC_REQ-401_answering_an_open_item_moves_it_to_what_youve_told_us_and_folds_it', async () => {
    const plan = planTransport({ stages: STAGES, asks: [ask('phone'), ask('hours')], comps: [], comps_raised: true, comps_status: 'open' })
    const app = await mount(plan)
    const input = item(app, 'phone').querySelector('input.plan-ask__input') as HTMLInputElement
    input.value = '0117 496 0000'
    input.dispatchEvent(new Event('change'))
    await settle()
    expect(plan.calls.answers.at(-1)).toEqual({ site: 'alpha', ask: 'phone', action: 'answer', answer: '0117 496 0000' })
    expect(section(item(app, 'phone'))).toBe('done')
    expect(expanded(item(app, 'phone'))).toBe(false)
    expect(item(app, 'phone').dataset.state).toBe('done')
    // Skipping does the same.
    ;(item(app, 'hours').querySelector('.plan-ask__skip') as HTMLButtonElement).click()
    await settle()
    expect(section(item(app, 'hours'))).toBe('done')
    expect(expanded(item(app, 'hours'))).toBe(false)
    expect(item(app, 'hours').querySelector('.plan-item__mark')!.textContent).toBe('–')
  })
})

describe.skipIf(!WEBUI_INSTALLED)("REQ-401 — the client's folds stick", () => {
  it('test_UAT_FC_REQ-401_a_fold_the_client_chose_survives_a_redraw_and_a_reload', async () => {
    const storage = memoryStorage()
    const plan = planTransport({ stages: STAGES, asks: [ask('phone'), ask('towns')], comps: [], comps_raised: true, comps_status: 'open' })
    const first = await mount(plan, storage)
    // Answered: it folds once, on its own…
    const input = item(first, 'phone').querySelector('input.plan-ask__input') as HTMLInputElement
    input.value = '0117 496 0000'
    input.dispatchEvent(new Event('change'))
    await settle()
    expect(expanded(item(first, 'phone'))).toBe(false)
    // …and when the client unfolds it again, it stays unfolded through a redraw…
    line(item(first, 'phone')).click()
    await first.planPanel.refresh()
    expect(expanded(item(first, 'phone'))).toBe(true)
    // …and an open item they fold stays folded.
    line(item(first, 'towns')).click()
    await first.planPanel.refresh()
    expect(expanded(item(first, 'towns'))).toBe(false)
    first.destroy()

    // A RELOAD: the same browser storage, a new builder.
    const second = await mount(plan, storage)
    expect(expanded(item(second, 'phone'))).toBe(true)
    expect(expanded(item(second, 'towns'))).toBe(false)
    // Through the builder's own namespaced storage, keyed per site and item.
    expect([...storage.map.keys()].some((k) => /plan-fold/.test(k) && /alpha:ask:phone/.test(k))).toBe(true)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-401 — the comp board is an item', () => {
  const COMP = { reference: 'reference-1', title: 'Plumber 1', url: 'https://p1.test/', source: 'consultant', added_at: 't', likes: [], dislikes: [] }

  it('test_UAT_FC_REQ-401_sites_were_comparing_is_one_item_whose_status_follows_the_plan', async () => {
    const plan = planTransport({ stages: STAGES, asks: [ask('phone')], comps: [COMP], comps_raised: true, comps_status: 'open' })
    const app = await mount(plan)
    const board = comps(app)
    // AN ITEM, NOT A SECTION: no heading names it; its line does.
    expect([...panel(app).querySelectorAll('.plan-panel__heading')].map((h) => h.textContent)).not.toContain("Sites we're comparing")
    expect(board.classList.contains('plan-item')).toBe(true)
    expect(board.querySelector('.plan-item__title')!.textContent).toBe("Sites we're comparing")
    expect(section(board)).toBe('open')
    expect(board.querySelector('.plan-item__status')!.textContent).toBe('Open')
    // Unfolded, the comps as before.
    expect(expanded(board)).toBe(true)
    expect(board.querySelector('.plan-comp[data-reference="reference-1"]')).toBeTruthy()
    expect(board.querySelector('form.plan-comps__add')).toBeTruthy()

    // The client skips it: written to the plan, and it moves and folds.
    ;(board.querySelector('.plan-comps__skip') as HTMLButtonElement).click()
    await settle()
    expect(plan.calls.comps.at(-1)).toEqual({ site: 'alpha', action: 'skip' })
    expect(section(comps(app))).toBe('done')
    expect(comps(app).querySelector('.plan-item__status')!.textContent).toBe('Skipped')
    expect(expanded(comps(app))).toBe(false)

    // The consultant records the visual concept from it: done, ✓.
    plan.set({ stages: STAGES, asks: [ask('phone')], comps: [COMP], comps_raised: true, comps_status: 'done' })
    await app.planPanel.refresh()
    expect(section(comps(app))).toBe('done')
    expect(comps(app).querySelector('.plan-item__mark')!.textContent).toBe('✓')
    expect(comps(app).querySelector('.plan-item__status')!.textContent).toBe('Done')
  })
})

describe("REQ-401 — the comp board's status is the plan's", () => {
  const seeded = (): Plan => seedPlan('alpha')
  const withConcept = (plan: Plan, comps: string[]): Plan => ({
    ...plan,
    fields: {
      ...plan.fields,
      decisions: plan.fields.decisions.map((d) => (d.id === 'visual_concept' ? { ...d, state: 'defaulted', value: 'dense grid', comps } : d)),
    },
  })
  const comp = { reference: 'reference-1', title: 'Plumber 1', url: 'https://p1.test/' }

  it('test_UAT_FC_REQ-401_open_while_comparing_done_once_the_visual_concept_is_recorded_from_it_skipped_when_the_client_skips', () => {
    let plan = addComp(seeded(), comp, 'consultant', 't0').plan
    expect(panelView(plan.fields).comps_status).toBe('open')
    // A concept defaulted with no comps behind it was not taken from the board.
    expect(panelView(withConcept(plan, []).fields).comps_status).toBe('open')
    expect(panelView(withConcept(plan, ['reference-1']).fields).comps_status).toBe('done')

    plan = skipComps(plan, 't1')
    expect(panelView(plan.fields).comps_status).toBe('skipped')
    // The consultant is told on her next turn.
    expect(planReminder(plan)).toContain('The client skipped comparing other sites.')
    // Recording the concept from it still makes it done…
    expect(panelView(withConcept(plan, ['reference-1']).fields).comps_status).toBe('done')
    // …and a new site on the board reopens it.
    plan = addComp(plan, { ...comp, reference: 'reference-2' }, 'client', 't2').plan
    expect(panelView(plan.fields).comps_status).toBe('open')
    expect(planReminder(plan)).not.toContain('skipped comparing')
  })
})

describe("REQ-401 — the consultant's two rules", () => {
  const said = (text: string): string => text.replace(/\s+/g, ' ')
  const textOf = (entries: unknown): string =>
    said((entries as { text?: string }[]).map((e) => (typeof e.text === 'string' ? e.text : '')).join('\n'))
  const setAsk = (planSurface.operations as { op: string; description: string; params: Record<string, { description: string }> }[]).find(
    (o) => o.op === 'set_ask',
  )!

  for (const withCorpus of [true, false]) {
    it(`test_UAT_FC_REQ-401_questions_lead_with_their_subject_and_every_added_question_is_announced (${withCorpus ? 'with' : 'without'} corpus)`, () => {
      const priming = textOf(primingConfig(withCorpus).priming)
      expect(priming).toMatch(/Open every question with what it is about/)
      expect(priming).toContain('"Phone number for the site — …"')
      expect(priming).toMatch(/never "Could you tell me …"/)
      // [[BUG-236]] — ANNOUNCED IN ONE LINE IN TOTAL, never one per question and
      // never restated: that replaced "announce every question you add".
      expect(priming).toMatch(/Announce the questions you add in one line in total/)
      expect(priming).toMatch(/I've put a few quick questions on the panel above — whenever suits you/)
      expect(priming).not.toMatch(/Announce every question you add/)
      expect(priming).toMatch(/never add a question silently/)
    })
  }

  it('test_UAT_FC_REQ-401_the_ask_operation_says_the_same', () => {
    const description = said(setAsk.description)
    expect(description).toMatch(/opens with its subject/)
    expect(description).toMatch(/never add one silently/)
    expect(setAsk.params.prompt.description).toMatch(/opening with its subject/)
  })
})
