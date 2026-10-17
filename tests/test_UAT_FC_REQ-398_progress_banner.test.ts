// @vitest-environment jsdom
/**
 * [[REQ-398]] — **the progress banner: `Progress 1 2 3. Refining 4 …`**, one
 * line pinned to the top of the plan panel, each stage a number coloured by its
 * state, only the stage in progress named, skipped worked out when it is drawn,
 * and every stage explained on hover, focus or tap.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the plan transport replaced (as the REQ-364/REQ-390 suites do). The
 * builder's own stylesheet is loaded into the document, so what is asserted about
 * layout is what the shipped CSS says, read back through `getComputedStyle`.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import planSeed from '../tools/generate/src/cli/ai/plan-seed.json'
import { checkPlan, panelView, seedPlan } from '../tools/generate/src/cli/ai/plan-core'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-398 banner suites skipped: ${WEBUI_SKIP_REASON}`)

const CSS = readFileSync(path.resolve(__dirname, '../apps/control-app/src/builder/builder.css'), 'utf8')
const SITES = [{ site: 'alpha', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const SEED = planSeed.stages as { id: string; label: string; about: string }[]

/** The seven stages as the route projects them for the panel, states given and the rest not started. */
const stages = (states: Record<number, string>) =>
  SEED.map((s, i) => ({ id: s.id, label: s.label, about: s.about, state: states[i + 1] ?? 'not_started' }))

const planTransport = (view: Record<string, unknown>) => {
  let current = view
  const writes: unknown[] = []
  return {
    writes,
    set: (next: Record<string, unknown>) => {
      current = next
    },
    fetchPlan: async () => current,
    answerAsk: async (body: unknown) => {
      writes.push(body)
      return current
    },
    uploadMaterial: async () => ({ uid: 'material-1' }),
  }
}

const chatTransport = {
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
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
  document.head.replaceChildren()
  document.body.replaceChildren()
  globalThis.localStorage?.clear()
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.append(style)
  root = document.createElement('div')
  document.body.append(root)
})

async function mount(view: Record<string, unknown>) {
  const plan = planTransport(view)
  const app = mountBuilder(root, { sites: SITES, planTransport: plan, chatTransport })
  await settle()
  return { app, plan }
}

const banner = (app: Handle) => app.planPanel.element.querySelector('.plan-stages') as HTMLElement

/** Each stage as drawn: what it reads, its state, and its non-colour mark. */
const drawn = (app: Handle) =>
  [...banner(app).querySelectorAll('.plan-stage')].map((li) => ({
    text: li.textContent,
    state: (li as HTMLElement).dataset.state,
    mark: li.querySelector('.plan-stage__mark')?.textContent ?? null,
  }))

const statesOf = (app: Handle) => drawn(app).map((s) => s.state)

describe.skipIf(!WEBUI_INSTALLED)('REQ-398 — the progress banner', () => {
  it('test_UAT_FC_REQ-398_the_banner_is_one_pinned_line_at_the_top_with_no_collapse_control', async () => {
    const { app } = await mount({ stages: stages({ 1: 'done', 2: 'in_progress' }), asks: [] })
    const panel = app.planPanel.element as HTMLElement
    const bar = banner(app)

    // FIRST ON THE PANEL, which is what scrolls: the banner is inside the scroller.
    expect(panel.firstElementChild).toBe(bar)
    expect(getComputedStyle(panel).overflowY).toBe('auto')
    // PINNED: it sticks to the top of that scroller as the questions and comps move under it.
    expect(getComputedStyle(bar).position).toBe('sticky')
    // ONE LINE: nothing in it wraps, and the stages are laid out in a single row.
    expect(getComputedStyle(bar).whiteSpace).toBe('nowrap')
    const list = bar.querySelector('.plan-stages__list') as HTMLElement
    expect(getComputedStyle(list).display).toBe('flex')
    expect(getComputedStyle(list).flexWrap).not.toBe('wrap')

    // STILL THERE AFTER THE LIST SCROLLS.
    panel.scrollTop = 500
    panel.dispatchEvent(new Event('scroll'))
    expect(panel.firstElementChild).toBe(bar)
    expect(bar.hidden).toBe(false)

    // `Progress` leads ([[BUG-209]] dropped the colon), and no toggle — nor its stored setting — is left.
    expect(bar.querySelector('.plan-stages__title')?.textContent).toBe('Progress')
    expect(bar.querySelector('button')).toBeNull()
    expect(globalThis.localStorage.getItem('plan-stages-collapsed')).toBeNull()
  })

  it('test_UAT_FC_REQ-398_only_the_stage_in_progress_is_named_the_rest_are_numbers', async () => {
    const { app } = await mount({ stages: stages({ 1: 'done', 2: 'done', 3: 'in_progress' }), asks: [] })
    const text = drawn(app).map((s) => s.text)
    expect(text).toEqual(['1✓', '2✓', '3.First draft', '4', '5', '6', '7'])
    expect(banner(app).querySelectorAll('.plan-stage__label')).toHaveLength(1)
    expect(banner(app).querySelector('[aria-current="step"]')?.textContent).toBe('3.First draft')
  })

  it('test_UAT_FC_REQ-398_skipped_is_worked_out_from_the_furthest_stage_reached', async () => {
    // STAGE 4 IN PROGRESS, STAGE 2 DONE → 1 and 3 skipped, 2 done, 5–7 not started.
    const { app, plan } = await mount({ stages: stages({ 2: 'done', 4: 'in_progress' }), asks: [] })
    expect(statesOf(app)).toEqual(['skipped', 'done', 'skipped', 'in_progress', 'not_started', 'not_started', 'not_started'])

    // NOTHING IN PROGRESS, STAGE 5 DONE → 1–4 skipped except the done ones, and nothing expands.
    plan.set({ stages: stages({ 2: 'done', 5: 'done' }), asks: [] })
    await app.planPanel.refresh()
    expect(statesOf(app)).toEqual(['skipped', 'done', 'skipped', 'skipped', 'done', 'not_started', 'not_started'])
    expect(banner(app).querySelector('.plan-stage__label')).toBeNull()

    // NOTHING DONE OR IN PROGRESS → all not started.
    plan.set({ stages: stages({}), asks: [] })
    await app.planPanel.refresh()
    expect(statesOf(app)).toEqual(Array(7).fill('not_started'))

    // AN IN-PROGRESS STAGE BEFORE A DONE ONE stays in progress — it is not passed over.
    plan.set({ stages: stages({ 3: 'in_progress', 5: 'done' }), asks: [] })
    await app.planPanel.refresh()
    expect(statesOf(app)).toEqual(['skipped', 'skipped', 'in_progress', 'skipped', 'done', 'not_started', 'not_started'])
  })

  it('test_UAT_FC_REQ-398_each_state_has_its_colour_and_a_mark_beside_it', async () => {
    const { app } = await mount({ stages: stages({ 2: 'done', 4: 'in_progress' }), asks: [] })
    const items = [...banner(app).querySelectorAll('.plan-stage')] as HTMLElement[]
    const colour = (i: number) => getComputedStyle(items[i]).getPropertyValue('--stage-colour').trim()
    const [skipped, done, , inProgress, notStarted] = [0, 1, 2, 3, 4].map(colour)
    // ONE COLOUR PER STATE, four different ones.
    expect(new Set([skipped, done, inProgress, notStarted]).size).toBe(4)
    expect(done).toContain('15803d') // green
    expect(inProgress).toBe('#1d4ed8') // blue
    expect(skipped).toBe('#a16207') // yellow
    expect(notStarted).toContain('71717a') // grey
    // COLOUR IS NEVER THE ONLY SIGNAL: done is ticked, skipped dashed, and the one in progress named.
    expect(drawn(app).map((s) => s.mark)).toEqual(['–', '✓', '–', null, null, null, null])
    expect(items[3].querySelector('.plan-stage__label')?.textContent).toBe('Refining')
  })

  it('test_UAT_FC_REQ-398_hover_focus_and_tap_explain_a_stage_in_words_and_never_move_it', async () => {
    const { app, plan } = await mount({ stages: stages({ 2: 'done', 4: 'in_progress' }), asks: [] })
    const tip = banner(app).querySelector('[role="tooltip"]') as HTMLElement
    const item = (n: number) => banner(app).querySelectorAll('.plan-stage')[n - 1] as HTMLElement
    expect(tip.hidden).toBe(true)

    // HOVER: name, its sentence from plan-seed.json, and its state in words.
    item(1).dispatchEvent(new MouseEvent('mouseenter'))
    expect(tip.hidden).toBe(false)
    expect(tip.textContent).toBe(`${SEED[0].label}${SEED[0].about}Skipped`)
    item(1).dispatchEvent(new MouseEvent('mouseleave'))
    expect(tip.hidden).toBe(true)

    // KEYBOARD FOCUS: every stage is reachable and described by the tip.
    item(2).focus()
    expect(document.activeElement).toBe(item(2))
    expect(item(2).getAttribute('aria-describedby')).toBe(tip.id)
    expect(tip.textContent).toBe(`${SEED[1].label}${SEED[1].about}Done`)
    item(2).blur()
    expect(tip.hidden).toBe(true)

    // TAP: opens the explanation of the stage in progress, and taps again to close it.
    item(4).click()
    expect(tip.textContent).toBe(`${SEED[3].label}${SEED[3].about}In progress`)
    item(5).click()
    expect(tip.textContent).toBe(`${SEED[4].label}${SEED[4].about}Not started`)
    item(5).click()
    expect(tip.hidden).toBe(true)

    // READ-ONLY: nothing a click did reached the plan, and nothing was redrawn as moved.
    expect(plan.writes).toEqual([])
    expect(statesOf(app)).toEqual(['skipped', 'done', 'skipped', 'in_progress', 'not_started', 'not_started', 'not_started'])
  })

  it('test_UAT_FC_REQ-398_the_explanations_come_from_the_seed_and_the_stored_plan_never_holds_skipped', () => {
    // EVERY STAGE IN THE SEED CARRIES ONE SENTENCE beside its label.
    for (const stage of SEED) expect(stage.about).toMatch(/^[A-Z][^.]*\.$/)

    // THE PANEL'S VIEW CARRIES THEM, straight from the seed.
    const fields = seedPlan('alpha').fields
    fields.stages = fields.stages.map((s, i) => ({ ...s, state: i === 1 ? 'done' : i === 3 ? 'in_progress' : 'not_started' }))
    const view = panelView(fields)
    expect(view.stages.map((s) => s.about)).toEqual(SEED.map((s) => s.about))

    // AND THE STORED PLAN KEEPS ITS THREE STATES: skipped is the banner's, never the
    // plan's — the view passes the stored states through, and a plan holding
    // `skipped` is refused.
    expect(view.stages.map((s) => s.state)).toEqual(fields.stages.map((s) => s.state))
    expect(view.stages.map((s) => s.state)).not.toContain('skipped')
    expect(() => checkPlan(fields)).not.toThrow()
    fields.stages[0] = { ...fields.stages[0], state: 'skipped' as never }
    expect(() => checkPlan(fields)).toThrow(/unknown state "skipped"/)
  })
})
