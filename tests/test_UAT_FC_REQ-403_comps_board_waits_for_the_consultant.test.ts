import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  clientAnswer,
  panelView,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  skipComps,
  type Plan,
  type PlanDeps,
  type PlanRole,
} from '../tools/generate/src/cli/ai/plan-core'

/**
 * [[REQ-403]] — **the comp board is an open question like any other**: it is not
 * on the client's panel until the consultant raises it, with `ask_comps`.
 *
 * WHAT IS REAL HERE: the seed, the Toolbox, the plan declaration and operations
 * driven through `box.run` (the call a model's tool use becomes), `checkPlan`,
 * `panelView` (what the panel draws) and `planReminder` (what the consultant is
 * told each turn). One double: the host's storage port, in memory, as in
 * REQ-399's suite.
 */

const SLUG = 'bakery'
const AT = '2026-10-17T12:00:00.000Z'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req403-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps & { stored: () => Plan; client: (input: Parameters<typeof clientAnswer>[1]) => void } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    stored: () => open(),
    client: (input) => {
      plan = clientAnswer(open(), input, AT)
    },
    now: () => '2026-10-17T11:00:00.000Z',
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

async function toolbox(role: PlanRole, deps: PlanDeps): Promise<{ run: (tool: string, input: Record<string, unknown>) => Promise<string> }> {
  const lib = await aiCore()
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps, role), granted: planInstanceConfig(role) }] as never,
  }) as never
}

describe('REQ-403 — the comp board waits for the consultant', () => {
  it('test_UAT_FC_REQ-403_a_new_plan_does_not_show_the_comp_board_and_tells_her_to_raise_it', () => {
    const plan = seedPlan(SLUG)
    const view = panelView(plan.fields)
    expect(view.asks).toEqual([])
    expect(view.comps_raised).toBe(false)
    expect(planReminder(plan)).toContain('Not yet raised: the comp board. Raise it with ask_comps')
  })

  it('test_UAT_FC_REQ-403_ask_comps_puts_the_board_on_the_panel_once', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    const out = await alice.run('ask_comps', {})
    expect(out).not.toMatch(/PLAN_INVALID|SCHEMA_INVALID|not enabled|Unknown/i)

    const raised = deps.stored()
    expect(raised.fields.comps_asked_at).toBe('2026-10-17T11:00:00.000Z')
    expect(panelView(raised.fields).comps_raised).toBe(true)
    expect(panelView(raised.fields).comps_status).toBe('open')
    expect(planReminder(raised)).not.toContain('Not yet raised: the comp board')

    // RAISING IT AGAIN CHANGES NOTHING.
    await alice.run('ask_comps', {})
    expect(deps.stored().fields.comps_asked_at).toBe('2026-10-17T11:00:00.000Z')
  })

  it('test_UAT_FC_REQ-403_a_settled_board_counts_as_raised', () => {
    const skipped = skipComps(seedPlan(SLUG), AT)
    expect(panelView(skipped.fields).comps_status).toBe('skipped')
    expect(panelView(skipped.fields).comps_raised).toBe(true)
  })
})
