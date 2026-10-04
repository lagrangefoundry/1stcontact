import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import { backendsDocument, projectBackendCeiling } from '../tools/generate/src/cli/ai/backends'
import { BUDGET_STOP_REASON } from '../tools/generate/src/cli/ai/budget-core'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  metered,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-191]] — **a worker whose turn did not finish says why.**
 *
 * A worker stopped by this host's own context-budget guard ([[REQ-296]]) came
 * back to the caller as `outcome: silent` with every check `unreported` and a
 * `nudge_skipped` pointing at a session record the caller cannot read. The guard's
 * reason never crossed the manager. The result now carries `ended` — the turn's
 * status and, for a budget stop, `reason: context_budget` with the occupancy and
 * the ceiling it was measured against — read from the worker's own `turn_end`.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager, the real delegation surface, the real guarded tool
 * loop, a real D1 and R2. The one double is the Anthropic client, which is the
 * network; it reports usage exactly as the wire does, so the guard fires on a
 * measured figure and `ended` is derived from what the manager recorded.
 */

const TENANT = 'bug191'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const DELEGATE_TOOL = 'Delegate'
const lib = aiLib as unknown as Parameters<typeof projectBackendCeiling>[0]

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as Env
}

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** One double, two conversations, told apart by the model they are addressed to. */
function twoSided(caller: ModelStep[], builder: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] =
      req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

/** The delegation's result as the CALLER received it, parsed out of its envelope. */
function delegationResult(req: ModelRequest): Record<string, unknown> {
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: string }[]) {
      if (block?.type !== 'tool_result' || typeof block.content !== 'string') continue
      const body = block.content.replace(/^[\s\S]*?\n/, '').replace(/\n<<<\/untrusted>>>\s*$/, '')
      return JSON.parse(body) as Record<string, unknown>
    }
  }
  throw new Error('the caller was handed no tool result')
}

const CALLER: ModelStep[] = [
  calls(DELEGATE_TOOL, {
    note: 'Working on it now — a few minutes.',
    role: BUILDER_ROLE,
    goal: 'Lay out the About page as three sections.',
    accept: ['page home has no changes'],
  }),
  says('Noted.'),
]

/** Run one delegation against a fresh site, with `builder` as the worker's script. */
async function delegateWith(slug: string, builder: ModelStep[]): Promise<Record<string, unknown>> {
  configureDelegation(ENABLED)
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(slug) })
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = twoSided(CALLER, builder)
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Have the About page built.' }))
  const answered = client.seen.filter((req) => req.model !== WORKER_MODEL)
  return delegationResult(answered[answered.length - 1])
}

interface Ended {
  status: string
  reason?: string
  occupancy_tokens?: number
  ceiling?: number
  error?: string
}

describe('BUG-191 a worker whose turn did not finish says why', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-191_a_worker_stopped_by_the_budget_guard_names_context_budget_and_its_numbers', async () => {
    // The reported run: forty operations, the last a successful read, and then
    // nothing — because the read put the worker over its own ceiling and the guard
    // ended the turn before the next request. One read over the line is the same run.
    // Over the WORKER'S window and under the consultant's million, so only a guard
    // held to the worker's own ceiling can fire here.
    const over = 200_000
    const result = await delegateWith('budget', [
      metered({ input_tokens: over }, calls('describe_page', { page: 'home' })),
      metered({ input_tokens: over + 5_000 }, calls('describe_page', { page: 'home' })),
      metered({ input_tokens: over + 10_000 }, says('Built it.')),
    ])

    expect(result.outcome).toBe('silent')
    // Read once the host has started, because that is when the project's backend
    // settings are configured — the same name the worker's guard was built under.
    const ceiling = projectBackendCeiling(lib, 'claude_builder')
    expect(ceiling).toBeGreaterThan(0)
    expect(ceiling).toBeLessThan(over)
    const ended = result.ended as Ended
    expect(ended).toEqual({
      status: 'aborted',
      reason: BUDGET_STOP_REASON,
      occupancy_tokens: over,
      ceiling,
    })
    // Beside what the run DID, which BUG-167 already reports: the read it made
    // last is the read that put it over.
    expect((result.activity as { last_operation?: { name: string } }).last_operation?.name).toBe(
      'describe_page',
    )
  })

  it('test_UAT_FC_BUG-191_a_worker_whose_turn_finished_silently_carries_no_ended', async () => {
    // A turn that ran to completion and simply reported nothing has no ending to
    // explain: the field is absent, and a silent run reads exactly as before.
    const result = await delegateWith('quiet', [
      calls('describe_page', { page: 'home' }),
      says(''),
      says(''),
    ])

    expect(result.outcome).toBe('silent')
    expect(result).not.toHaveProperty('ended')
    expect((result.activity as { operations: number }).operations).toBe(1)
  })
})
