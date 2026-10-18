import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import { planInstanceConfig, planSurfaceFor, seedPlan, type Plan, type PlanDeps } from '../tools/generate/src/cli/ai/plan-core'

/**
 * BUG-223 — **`update_brief` takes audiences as the objects its description
 * asks for.** Driven through the real Toolbox (`box.run`), with the host's plan
 * storage port kept in memory as REQ-356's suite does. A refusal comes back as
 * the tool's text, so each case checks what was STORED, not only the answer.
 */

const SLUG = 'studio'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug223-'))
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
    now: () => '2026-10-18T12:00:00.000Z',
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

describe('BUG-223 — update_brief accepts audiences as objects', () => {
  it('test_UAT_FC_BUG-223_audiences_as_objects_are_stored_with_the_rest_of_the_call', async () => {
    const deps = memoryPlan()
    const box = await consultant(deps)
    const audiences = [
      { who: 'local families', priority: 1 },
      { who: 'wedding parties', priority: 2 },
    ]

    const answer = await box.run('update_brief', {
      business: 'A neighbourhood hair salon',
      audiences,
      constraints: ['No online booking yet'],
      quote: 'Most of our regulars are families from round here.',
    })

    expect(answer).not.toMatch(/must be a string|PLAN_INVALID|SCHEMA_INVALID/)
    const plan = deps.stored() as Plan
    // The write landed: the audience objects as given, and the rest of the call with them.
    expect(plan.fields.brief).toMatchObject({
      business: 'A neighbourhood hair salon',
      audiences,
      constraints: ['No online booking yet'],
    })
    expect(plan.body).toContain('Most of our regulars are families from round here.')
  })

  it('test_UAT_FC_BUG-223_constraints_stay_a_list_of_strings', async () => {
    const deps = memoryPlan()
    const box = await consultant(deps)

    const answer = await box.run('update_brief', { constraints: [{ must: 'no booking' }] })

    expect(answer).toMatch(/constraints/)
    expect(deps.stored()?.fields.brief?.constraints).toBeUndefined()
  })
})
