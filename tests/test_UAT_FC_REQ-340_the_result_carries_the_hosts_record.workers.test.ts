import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-340]] behaviour 4 — **the host's record is returned BESIDE the worker's
 * self-report, not instead of it** (DOC-60 §1).
 *
 * WHAT MAKES THIS EVIDENCE. It drives the real route inside workerd — `POST
 * /api/ai/prompt`, the real session manager, the real delegation surface out of
 * the shared store, the real tool loop on both sides of the hand-off, a real D1
 * and R2 — and the worker's write is a real `set_l1` through the builder's own
 * grant. The one double is the Anthropic client, which is the network. So the
 * record the caller reads is derived from what the store actually held before
 * and after a real delegation, and the two cases below are the two that matter:
 * a worker that reports, and a worker that does not.
 *
 * THE MOTIVATING FAILURE. Two of the seven delegations that had ever run came
 * back `outcome: silent` with real element writes committed on the site, and
 * the only recovery was to re-inspect the site at the consultant's rate — which
 * is the cost delegation exists to remove. The second case here is that one.
 */

const TENANT = 'req340'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

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

/** What the worker writes — one band, rewritten, at the address the starter page has. */
const REWRITE = {
  page: 'home',
  path: '0.0',
  node: { kind: 'text', text: 'Built for the trades', axes: { fontSizePx: 56 } },
}

/** The caller's half: hand over one piece of work, then answer the client. */
const CALLER: ModelStep[] = [
  calls(DELEGATE_TOOL, { role: BUILDER_ROLE, goal: 'Rewrite the hero headline.' }),
  says('Done — the headline now reads "Built for the trades".'),
]

describe('REQ-340 the result carries the host\'s record beside the worker\'s', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-340_the_record_and_the_self_report_are_both_present_and_separate', async () => {
    // Behaviour 4. Both are on the result and neither is folded into the other:
    // `summary` and `changed` are the worker's claims, `account.changed` is the
    // host's record, and a caller can tell which is which because they are
    // different fields. Merging them would put the worker's word inside the one
    // field that is not the worker's word for anything.
    configureDelegation(ENABLED)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('report') })
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }

    const client = twoSided(CALLER, [
      calls('set_l1', REWRITE),
      calls(REPORT_TOOL, { summary: 'Rewrote the headline.', changed: ['home'] }),
      says('Reported.'),
    ])
    setModelClient(client)
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Rewrite the headline.' }))

    const answered = client.seen.filter((req) => req.model !== WORKER_MODEL)
    const result = delegationResult(answered[answered.length - 1])

    expect(result.summary).toBe('Rewrote the headline.')
    expect(result.changed).toEqual(['home'])

    const account = result.account as {
      from: number
      to: number
      changed: { differences: Record<string, unknown>[] }
    }
    expect(account.to).toBeGreaterThan(account.from)
    expect(account.changed.differences).toContainEqual(
      expect.objectContaining({ page: 'home', address: '0.0', field: 'text' }),
    )
  })

  it('test_UAT_FC_REQ-340_a_worker_that_reports_nothing_still_returns_what_it_changed', async () => {
    // The failure the requirement was written for. This worker wrote a real
    // element and then said nothing on either turn — the exact shape that cost
    // the caller a full re-inspection — and the result still says what landed,
    // because the record is the host's own and comes from the store.
    configureDelegation(ENABLED)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('silent') })
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }

    const client = twoSided(CALLER, [
      calls('set_l1', REWRITE),
      says('and then I stopped without reporting'),
      says('still nothing'),
    ])
    setModelClient(client)
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Rewrite the headline.' }))

    const answered = client.seen.filter((req) => req.model !== WORKER_MODEL)
    const result = delegationResult(answered[answered.length - 1])

    const account = result.account as {
      from: number
      to: number
      changed: { differences: Record<string, unknown>[] }
    }
    expect(account.changed.differences).toContainEqual(
      expect.objectContaining({
        page: 'home',
        address: '0.0',
        field: 'text',
        after: 'Built for the trades',
      }),
    )
  })
})
