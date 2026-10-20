// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  OPENING_MESSAGE,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
} from '../tools/generate/src/cli/ai/plan-core'
import planSeed from '../tools/generate/src/cli/ai/plan-seed.json'
import { shownStates } from '../apps/control-app/src/builder/plan-panel.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/**
 * [[BUG-235]] — **under build-sooner, getting to know the client carries on while
 * the first draft is built**: starting a stage changes that stage only, so two
 * may be in progress, and the client's banner names the furthest and keeps the
 * other in its in-progress colour — neither done, neither skipped. The opening
 * message says the same.
 *
 * WHAT IS REAL HERE: the Toolbox, the capability gate, the plan declaration and
 * operations, driven through `box.run`; the panel's own `shownStates` and its
 * real banner, mounted in jsdom. One double, the plan's storage port, in memory.
 */
const SLUG = 'salon'
let cwd: string

if (!WEBUI_INSTALLED) console.warn(`BUG-235 banner suite skipped: ${WEBUI_SKIP_REASON}`)

let createPlanPanel: (opts?: Record<string, unknown>) => Record<string, any>

beforeAll(async () => {
  if (WEBUI_INSTALLED) ({ createPlanPanel } = await import('../apps/control-app/src/builder/plan-panel.js'))
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug235-'))
  cmdNew(SLUG, { cwd })
  document.body.replaceChildren()
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps & { stored: () => Plan | null } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => plan,
    now: () => '2026-10-20T12:00:00.000Z',
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

async function consultant(deps: PlanDeps): Promise<{ run: (tool: string, input: Record<string, unknown>) => Promise<string> }> {
  const lib = await aiCore()
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps), granted: planInstanceConfig('consultant') }] as never,
  }) as never
}

const states = (plan: Plan | null): Record<string, string> =>
  Object.fromEntries(plan!.fields.stages.map((s) => [s.id, s.state]))

describe('BUG-235 — two stages in progress under build-sooner', () => {
  it('test_UAT_FC_BUG-235_starting_the_first_draft_leaves_getting_to_know_you_in_progress', async () => {
    const deps = memoryPlan()
    const box = await consultant(deps)
    // A NEW PLAN starts at Getting to know you; the first draft starts early.
    const started = await box.run('set_stage', { stage: 'first_draft', state: 'in_progress' })
    expect(started).not.toContain('Error')
    expect(started).not.toContain('moved_from')
    expect(states(deps.stored())).toMatchObject({ getting_to_know_you: 'in_progress', first_draft: 'in_progress' })

    // THE BANNER shows neither of the two as done or skipped.
    const shown = shownStates(deps.stored()!.fields.stages)
    expect(shown[0]).toBe('in_progress')
    expect(shown[2]).toBe('in_progress')
    // The per-turn plan entry names both as in progress.
    expect(planReminder(deps.stored())).toContain(
      'Stages — in progress: Getting to know you (getting_to_know_you), First draft (first_draft); done: none.',
    )

    // ONLY AN EXPLICIT DONE TICKS ONE; starting another never does, either way.
    await box.run('set_stage', { stage: 'getting_to_know_you', state: 'done' })
    await box.run('set_stage', { stage: 'other_sites', state: 'in_progress' })
    expect(states(deps.stored())).toMatchObject({
      getting_to_know_you: 'done',
      other_sites: 'in_progress',
      first_draft: 'in_progress',
    })
  })

  it('test_UAT_FC_BUG-235_the_opening_message_says_a_first_draft_comes_early', () => {
    expect(OPENING_MESSAGE).not.toContain('the usual order')
    expect(OPENING_MESSAGE).toContain("I'll build a first draft early")
    expect(OPENING_MESSAGE).toContain("we'll carry on getting to know your business while it's built")
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-235 — the banner with two stages in progress', () => {
  it('test_UAT_FC_BUG-235_the_banner_names_the_furthest_stage_in_progress_and_colours_the_other', async () => {
    const seed = planSeed.stages as { id: string; label: string; about: string }[]
    const view = {
      stages: seed.map((s, i) => ({ ...s, state: i === 0 || i === 2 ? 'in_progress' : 'not_started' })),
      asks: [],
    }
    const panel = createPlanPanel({ transport: { fetchPlan: async () => view } })
    document.body.append(panel.element)
    await panel.setSite('alpha')
    for (let i = 0; i < 10; i += 1) await new Promise((r) => setTimeout(r, 0))

    const items = [...panel.element.querySelectorAll('.plan-stage')] as HTMLElement[]
    // Both keep the in-progress colour…
    expect(items[0].dataset.state).toBe('in_progress')
    expect(items[2].dataset.state).toBe('in_progress')
    // …only the furthest is named and is the current step.
    expect(items[2].querySelector('.plan-stage__label')?.textContent).toBe('First draft')
    expect(items[2].getAttribute('aria-current')).toBe('step')
    expect(items[0].querySelector('.plan-stage__label')).toBeNull()
    expect(items[0].hasAttribute('aria-current')).toBe(false)
    // Neither is drawn done or skipped.
    expect(items.filter((li) => li.querySelector('.plan-stage__mark')?.textContent === '✓')).toHaveLength(0)
    expect(items[1].dataset.state).toBe('skipped')
  })
})
