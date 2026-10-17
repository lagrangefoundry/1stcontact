import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import { HOST_SUMMARY_LEAD } from '../tools/generate/src/cli/ai/turn-clock-core'
import { REPORT_RESERVE_FRACTION, TURN_BUDGET_FRACTION } from '../tools/generate/src/cli/ai/budget-core'
import { backendsDocument, projectBackendCeiling } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  metered,
  says,
  scriptedClient,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-212]] — **a builder's report survives the end of its budget.**
 *
 * A builder near its context ceiling called `ReportResult` with its failed
 * checks as plain strings. The call was refused whole — the schema it was sent
 * gave `failed`'s entries no keys — and the guard stopped the turn before a
 * retry, so the caller got `outcome: silent` and an empty summary.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager, the real delegation surface, the real guarded tool
 * loop, a real D1 and R2. The one double is the Anthropic client, which is the
 * network, and it is the model on both sides: what the builder was SENT is read
 * off its requests, and what the caller RECEIVED off the caller's.
 */

const TENANT = 'bug212'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'
const lib = aiLib as unknown as Parameters<typeof projectBackendCeiling>[0]

// Neither is a phrasing the host's record settles, so both reach the worker.
const LAYOUT = 'the About page has three sections'
const CROPS = 'every picture on the About page uses a cropped asset'

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

/** Every `tool_result` text a request carries, oldest first. */
function toolResults(req: ModelRequest): string[] {
  const out: string[] = []
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: unknown }[]) {
      if (block?.type !== 'tool_result') continue
      out.push(typeof block.content === 'string' ? block.content : JSON.stringify(block.content))
    }
  }
  return out
}

/** The delegation's result as the CALLER received it, parsed out of its envelope. */
function delegationResult(req: ModelRequest): Record<string, unknown> {
  const [first] = toolResults(req)
  if (first === undefined) throw new Error('the caller was handed no tool result')
  const body = first.replace(/^[\s\S]*?\n/, '').replace(/\n<<<\/untrusted>>>\s*$/, '')
  return JSON.parse(body) as Record<string, unknown>
}

interface Delegated {
  result: Record<string, unknown>
  /** Every request the builder sent, in order. */
  sent: ModelRequest[]
}

/** Run one delegation against a fresh site, with `builder` as the worker's script. */
async function delegateWith(slug: string, builder: ModelStep[]): Promise<Delegated> {
  configureDelegation(ENABLED)
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(slug) })
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const caller: ModelStep[] = [
    calls(DELEGATE_TOOL, {
      note: 'Working on it now — a few minutes.',
      role: BUILDER_ROLE,
      goal: 'Lay out the About page as three sections, with cropped pictures.',
      accept: [LAYOUT, CROPS],
    }),
    says('Noted.'),
  ]
  const client = twoSided(caller, builder)
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Have the About page built.' }))
  const answered = client.seen.filter((req) => req.model !== WORKER_MODEL)
  return {
    result: delegationResult(answered[answered.length - 1]),
    sent: client.seen.filter((req) => req.model === WORKER_MODEL),
  }
}

interface Verdict {
  check: string
  verdict: string
  reason?: string
  by?: string
}

describe('BUG-212 a builder report survives the end of its budget', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-212_the_builder_is_sent_the_keys_of_a_failed_entry', async () => {
    const { sent } = await delegateWith('schema', [
      calls(REPORT_TOOL, { summary: 'Laid out.', passed: [LAYOUT, CROPS] }),
      says('Done.'),
    ])

    const report = sent[0].tools.find((tool) => tool.name === REPORT_TOOL)
    expect(report).toBeDefined()
    const failed = (report!.input_schema.properties as Record<string, { items?: Record<string, unknown> }>).failed
    expect(failed.items).toMatchObject({
      type: 'object',
      properties: { check: { type: 'string' }, reason: { type: 'string' } },
      required: ['check', 'reason'],
    })
  })

  it('test_UAT_FC_BUG-212_a_failed_check_sent_as_a_plain_string_is_recorded_with_the_rest_of_the_report', async () => {
    // The incident's shape: the strings the refused call carried, one call, no retry.
    const { result } = await delegateWith('strings', [
      calls(REPORT_TOOL, {
        summary: 'Laid out the three sections; the crops were not made.',
        changed: ['home: three sections'],
        passed: [LAYOUT],
        failed: [CROPS],
      }),
      says('Done.'),
    ])

    expect(result.outcome).toBe('reported')
    expect(result.summary).toBe('Laid out the three sections; the crops were not made.')
    expect(result.changed).toEqual(['home: three sections'])
    const checks = result.checks as Verdict[]
    expect(checks.find((c) => c.check === LAYOUT)).toMatchObject({ verdict: 'passed', by: 'worker' })
    expect(checks.find((c) => c.check === CROPS)).toMatchObject({ verdict: 'failed', by: 'worker' })
  })

  it('test_UAT_FC_BUG-212_a_report_still_refused_tells_the_builder_the_shape_to_send', async () => {
    const { sent, result } = await delegateWith('refused', [
      calls(REPORT_TOOL, { summary: 'Laid out.', failed: [{ name: CROPS, why: 'no crops' }] }),
      says(''),
      says(''),
    ])

    // What the builder read back from the refused call, on its next request.
    const [refusal] = toolResults(sent[1])
    expect(refusal).toContain('"check": "<the check, as written>"')
    expect(refusal).toContain('"reason": "<why it did not hold>"')
    expect(refusal).toContain(`Call ${REPORT_TOOL} again now`)
    // Nothing of the refused call was recorded.
    expect(result.outcome).toBe('silent')
  })

  it('test_UAT_FC_BUG-212_a_builder_stopped_by_the_context_guard_comes_back_with_a_host_summary', async () => {
    // The incident's ending: a refused report, and the request that carried it
    // already over the ceiling, so the guard ends the turn before a retry.
    const over = 200_000
    const { result } = await delegateWith('stopped', [
      metered({ input_tokens: 10_000 }, calls('describe_page', { page: 'home' })),
      metered({ input_tokens: over }, calls(REPORT_TOOL, { summary: 'Laid out.', failed: [{ name: CROPS }] })),
      metered({ input_tokens: over + 5_000 }, says('Retrying.')),
    ])

    expect(result.outcome).toBe('silent')
    const ceiling = projectBackendCeiling(lib, 'claude_builder')
    const summary = String(result.summary)
    expect(summary.startsWith(HOST_SUMMARY_LEAD)).toBe(true)
    expect(summary).toContain(`reached ${over} tokens against a ceiling of ${ceiling}`)
    // The last call, and the refusal it got, which is why there was no report.
    expect(summary).toContain(`It made 2 tool calls; the last was ${REPORT_TOOL}, which was refused:`)
    expect(summary).toContain('It wrote nothing to the draft.')
  })

  it('test_UAT_FC_BUG-212_a_builder_that_finished_without_reporting_comes_back_with_a_host_summary', async () => {
    const { result } = await delegateWith('quiet', [
      calls('describe_page', { page: 'home' }),
      says(''),
      says(''),
    ])

    expect(result.outcome).toBe('silent')
    expect(result.summary).toBe(
      `${HOST_SUMMARY_LEAD} Its turn finished, inside every budget, without calling ${REPORT_TOOL}. ` +
        'It made 1 tool call; the last was describe_page. It wrote nothing to the draft.',
    )
  })

  it('test_UAT_FC_BUG-212_a_builder_that_reported_keeps_its_own_summary', async () => {
    const { result } = await delegateWith('own', [
      calls(REPORT_TOOL, { summary: 'Laid out.', passed: [LAYOUT, CROPS] }),
      says('Done.'),
    ])

    expect(result.summary).toBe('Laid out.')
  })

  it('test_UAT_FC_BUG-212_a_builder_inside_its_report_reserve_is_told_to_report_on_every_request', async () => {
    const ceiling = projectBackendCeiling(lib, 'claude_builder')
    // Read once the host has started, so measured against the worker's own window.
    // Inside the reserve and short of the stop: the run that still has room to report.
    const near = ceiling - 2_000
    expect(near).toBeGreaterThan(Math.ceil((ceiling * REPORT_RESERVE_FRACTION) / TURN_BUDGET_FRACTION))
    const { sent, result } = await delegateWith('reserve', [
      metered({ input_tokens: 10_000 }, calls('describe_page', { page: 'home' })),
      metered({ input_tokens: near }, calls('describe_page', { page: 'home' })),
      metered({ input_tokens: near + 1_000 }, calls(REPORT_TOOL, { summary: 'Laid out.', passed: [LAYOUT, CROPS] })),
      metered({ input_tokens: near + 1_500 }, says('Done.')),
    ])

    const notice = `Your context is at ${near} tokens, and the host stops this turn at ${ceiling}.`
    // Below the reserve the builder is not told anything.
    expect(turnTailText(sent[1])).not.toContain('Call ReportResult now')
    // Past it, the next request carries the notice, with both numbers.
    expect(turnTailText(sent[2])).toContain(notice)
    expect(turnTailText(sent[2])).toContain(`Call ${REPORT_TOOL} now`)
    // On every request that follows, and never stored: each carries it once.
    for (const req of sent.slice(2)) {
      expect(JSON.stringify(req.messages).split('Call ReportResult now').length - 1).toBe(1)
    }
    // And it reported, which is what the notice is for.
    expect(result.outcome).toBe('reported')
  })
})
