import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
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
 * [[BUG-243]] — **a recorded report ends the builder's turn.**
 *
 * A builder that had reported went on calling `ReportResult` until its window
 * ran out — 7 to 27 times in a row in Bob's Salon 3 — because the reserve's
 * notice kept telling it to report and the receipt never told it to stop.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager, the real delegation surface, the real guarded tool
 * loop, a real D1 and R2. The one double is the Anthropic client, which is the
 * network, and it is the model on both sides: what the builder was SENT is read
 * off its requests, and what the caller RECEIVED off the caller's.
 */

const TENANT = 'bug243'
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
    calls(DELEGATE_TOOL, { scope: ['site.json', 'home.json'],
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

const RESERVE = 'Call ReportResult now'

/** The number of requests that carry the reserve's notice. */
const warned = (sent: ModelRequest[]): number => sent.filter((req) => turnTailText(req).includes(RESERVE)).length

/**
 * A step metered past the reserve and short of the stop, by `extra` tokens.
 *
 * READ AT THE REQUEST, NOT BEFORE THE RUN: the worker's ceiling is measured
 * against its own window, which is only known once the host has started.
 */
const nearCeiling =
  (extra: number, step: ModelStep): ModelStep =>
  (req) => {
    const ceiling = projectBackendCeiling(lib, 'claude_builder')
    const near = ceiling - 2_000
    expect(near).toBeGreaterThan(Math.ceil((ceiling * REPORT_RESERVE_FRACTION) / TURN_BUDGET_FRACTION))
    return metered({ input_tokens: near + extra }, step)(req)
  }

const REPORT = {
  summary: 'Laid out the three sections; the crops were not made.',
  changed: ['home: three sections'],
  passed: [LAYOUT],
  failed: [{ check: CROPS, reason: 'no crops' }],
}

describe('BUG-243 a recorded report ends the builder turn', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-243_a_builder_past_its_reserve_sends_no_request_after_its_report', async () => {
    const { sent, result } = await delegateWith('reserve', [
      metered({ input_tokens: 10_000 }, calls('describe_page', { page: 'home' })),
      nearCeiling(0, calls('describe_page', { page: 'home' })),
      nearCeiling(1_000, calls(REPORT_TOOL, REPORT)),
      // The incident: the same report, again and again, for as long as it was asked.
      nearCeiling(1_500, calls(REPORT_TOOL, REPORT)),
    ])

    // The request that carried the report is the last one sent.
    expect(sent).toHaveLength(3)
    // Told to report on the one request past the reserve, and never after the report.
    expect(turnTailText(sent[2])).toContain(RESERVE)
    expect(warned(sent)).toBe(1)
    expect(result.outcome).toBe('reported')
  })

  it('test_UAT_FC_BUG-243_a_builder_below_its_reserve_sends_no_request_after_its_report', async () => {
    const { sent, result } = await delegateWith('below', [
      metered({ input_tokens: 10_000 }, calls('describe_page', { page: 'home' })),
      metered({ input_tokens: 11_000 }, calls(REPORT_TOOL, REPORT)),
      metered({ input_tokens: 12_000 }, calls(REPORT_TOOL, REPORT)),
    ])

    expect(sent).toHaveLength(2)
    expect(warned(sent)).toBe(0)
    expect(result.outcome).toBe('reported')
  })

  it('test_UAT_FC_BUG-243_a_refused_report_does_not_end_the_turn', async () => {
    const { sent, result } = await delegateWith('refused', [
      metered({ input_tokens: 10_000 }, calls('describe_page', { page: 'home' })),
      nearCeiling(0, calls(REPORT_TOOL, { summary: 'Laid out.', failed: [{ name: CROPS }] })),
      nearCeiling(1_000, calls(REPORT_TOOL, REPORT)),
      nearCeiling(1_500, calls(REPORT_TOOL, REPORT)),
    ])

    // The refusal is answered by a retry, still told to report; the recorded retry ends it.
    expect(sent).toHaveLength(3)
    expect(turnTailText(sent[2])).toContain(RESERVE)
    expect(result.outcome).toBe('reported')
  })

  it('test_UAT_FC_BUG-243_the_consultant_receives_the_report_unchanged', async () => {
    const { result } = await delegateWith('unchanged', [calls(REPORT_TOOL, REPORT), calls(REPORT_TOOL, REPORT)])

    expect(result.outcome).toBe('reported')
    expect(result.summary).toBe(REPORT.summary)
    expect(result.changed).toEqual(REPORT.changed)
    const checks = result.checks as { check: string; verdict: string; by?: string }[]
    expect(checks.find((c) => c.check === LAYOUT)).toMatchObject({ verdict: 'passed', by: 'worker' })
    expect(checks.find((c) => c.check === CROPS)).toMatchObject({ verdict: 'failed', by: 'worker' })
  })
})
