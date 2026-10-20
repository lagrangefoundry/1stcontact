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
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
  type PlanRole,
} from '../tools/generate/src/cli/ai/plan-core'
import { shownStates } from '../apps/control-app/src/builder/plan-panel.js'

/**
 * [[BUG-221]] — the per-turn plan entry tells the consultant when a stage is
 * passed over, so the client's panel does not go on calling a stage that was
 * worked through "skipped".
 *
 * BUG-221's other half — starting a later stage ticked the one moved off, and
 * starting an earlier one reset the later — is superseded by [[BUG-235]]:
 * starting a stage changes that stage only (`test_UAT_FC_BUG-235_*`).
 *
 * WHAT IS REAL HERE: as REQ-390's suite — the Toolbox, the capability gate, the
 * plan declaration and operations, driven through `box.run` — plus the panel's
 * own `shownStates`, the rule the client's progress banner draws with. One
 * double, the host's storage port, in memory.
 */
const SLUG = 'plumbing'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug221-'))
  cmdNew(SLUG, { cwd })
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
    now: () => '2026-10-04T12:00:00.000Z',
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
}

async function toolbox(role: PlanRole, deps: PlanDeps): Promise<Box> {
  const lib = await aiCore()
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps), granted: planInstanceConfig(role) }] as never,
  }) as Promise<Box>
}

const unwrap = (answer: string): string =>
  answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')

/** The stages' states as the client's banner draws them. */
const banner = (plan: Plan | null): string[] => shownStates(plan!.fields.stages)

describe('BUG-221 — a stage passed over is named to the consultant', () => {
  it('test_UAT_FC_BUG-221_the_plan_entry_names_a_stage_passed_over', async () => {
    const deps = memoryPlan()
    const alice = await toolbox('consultant', deps)
    // JUMPING PAST stages never started: the client's banner shows them skipped…
    await alice.run('set_stage', { stage: 'getting_to_know_you', state: 'done' })
    await alice.run('set_stage', { stage: 'first_draft', state: 'in_progress' })
    expect(banner(deps.stored())[1]).toBe('skipped')
    // …and the consultant is told, in the per-turn plan entry.
    expect(planReminder(deps.stored())).toContain(
      'Passed over: "Looking at other sites" (other_sites) — the client sees it as skipped. If it was covered, tick it done with set_stage.',
    )
    // TICKED, the line goes.
    await alice.run('set_stage', { stage: 'other_sites', state: 'done' })
    expect(planReminder(deps.stored())).not.toContain('Passed over')
  })
})
