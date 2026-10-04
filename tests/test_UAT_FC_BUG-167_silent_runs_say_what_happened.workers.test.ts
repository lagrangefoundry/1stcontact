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
 * [[BUG-167]] — **a silent run says what happened, from the host's side.**
 *
 * `outcome: silent` meant "the worker said nothing", which spans a worker that did
 * nothing, one that did everything, and one that stopped part-way. The result now
 * carries `wrote` — whether the host's record shows anything written — and, on any
 * run that did not end in a report, `activity`: how many calls the worker made, the
 * last one, and the last thing it said, all read from the worker's own session log.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager, the real delegation surface, the real tool loop on both
 * sides, a real D1 and R2. The one double is the Anthropic client, which is the
 * network. So `wrote` is derived from what the store actually held, and `activity`
 * from what the manager actually recorded the worker's backend running.
 */

const TENANT = 'bug167'
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

const REWRITE = {
  page: 'home',
  path: '0.0',
  node: { kind: 'text', text: 'Built for the trades', axes: { fontSizePx: 56 } },
}

const CALLER: ModelStep[] = [
  calls(DELEGATE_TOOL, { note: 'Working on it now — a few minutes.', role: BUILDER_ROLE, goal: 'Rewrite the hero headline.' }),
  says('Checked.'),
]

interface Activity {
  operations: number
  last_operation?: { name: string; input?: string; result?: string }
  last_words?: string
}

/** Run one delegation against a fresh site, with `builder` as the worker's script. */
async function delegateWith(slug: string, builder: ModelStep[]): Promise<Record<string, unknown>> {
  configureDelegation(ENABLED)
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(slug) })
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = twoSided(CALLER, builder)
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Rewrite the headline.' }))
  const answered = client.seen.filter((req) => req.model !== WORKER_MODEL)
  return delegationResult(answered[answered.length - 1])
}


describe('BUG-167 a silent run says what happened', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-167_a_silent_worker_that_only_read_says_it_wrote_nothing_and_what_it_last_did', async () => {
    // The reported run: tokens spent, nothing written, nothing said about why. The
    // result now says it wrote nothing, that it made a call, which call, and what it
    // was thinking when it stopped.
    const result = await delegateWith('inert', [
      calls('describe_page', { page: 'home' }),
      says('The headline sits inside a band I cannot address yet.'),
      says(''),
    ])

    expect(result.outcome).toBe('silent')
    expect(result.summary).toBe('')
    expect(result.wrote).toBe(false)
    expect((result.account as { changed: { differences: unknown[] } }).changed.differences).toEqual([])

    const activity = result.activity as Activity
    expect(activity.operations).toBe(1)
    expect(activity.last_operation?.name).toBe('describe_page')
    expect(activity.last_operation?.input).toContain('"home"')
    expect(typeof activity.last_operation?.result).toBe('string')
    expect(activity.last_words).toBe('The headline sits inside a band I cannot address yet.')
  })

  it('test_UAT_FC_BUG-167_a_silent_worker_that_wrote_says_so_beside_the_same_outcome', async () => {
    // The opposite run behind the same `silent`: the work landed and nothing was
    // said about it. `wrote` is what separates the two without reading `account`.
    const result = await delegateWith('productive', [
      calls('set_l1', REWRITE),
      says('and then I stopped without reporting'),
      says('still nothing'),
    ])

    expect(result.outcome).toBe('silent')
    expect(result.wrote).toBe(true)
    const activity = result.activity as Activity
    expect(activity.operations).toBe(1)
    expect(activity.last_operation?.name).toBe('set_l1')
    expect(activity.last_words).toBe('still nothing')
  })

  it('test_UAT_FC_BUG-167_a_silent_worker_that_made_no_call_says_it_made_none', async () => {
    // Reasoned itself into inaction: no call at all. `operations: 0` is that
    // finding, and there is no last operation to name.
    const result = await delegateWith('idle', [says('I am not sure where to begin.'), says('')])

    expect(result.outcome).toBe('silent')
    expect(result.wrote).toBe(false)
    const activity = result.activity as Activity
    expect(activity.operations).toBe(0)
    expect(activity.last_operation).toBeUndefined()
    expect(activity.last_words).toBe('I am not sure where to begin.')
  })

  it('test_UAT_FC_BUG-167_a_reported_run_carries_wrote_and_no_activity', async () => {
    // A finished report is the worker's own account, so the host adds no activity
    // log beside it — but `wrote` is still there, because it is the host's fact.
    const result = await delegateWith('reported', [
      calls('set_l1', REWRITE),
      calls(REPORT_TOOL, { summary: 'Rewrote the headline.', changed: ['home'] }),
      says('Reported.'),
    ])

    expect(result.outcome).toBe('reported')
    expect(result.wrote).toBe(true)
    expect(result).not.toHaveProperty('activity')
  })

  it('test_UAT_FC_BUG-167_the_caller_is_told_what_wrote_and_activity_mean', async () => {
    // A field the caller's manual never mentions is one it has to guess at. Both are
    // declared in the delegation result's shape, so when the caller looks `Delegate`
    // up it reads them beside `outcome` and `account` rather than meeting them cold.
    configureDelegation(ENABLED)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('described') })
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }
    const client = scriptedClient([calls('DescribeTools', { tools: ['Delegate'] }), says('Read it.')])
    setModelClient(client)
    await drain(await post('/api/ai/prompt', { sessionId, text: 'How does delegating work?' }))

    const manual = JSON.stringify(client.seen[client.seen.length - 1].messages)
    expect(manual).toContain('wrote anything to the site')
    expect(manual).toContain("'last_operation' is the last call it made")
  })
})
