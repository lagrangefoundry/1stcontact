import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
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
 * [[BUG-225]] — **through the real route, a text check is settled by the host and
 * never reaches the builder, and a check worded like the host's but not in its
 * words is refused before any builder runs.**
 *
 * The real route inside workerd — `POST /api/ai/prompt`, the real session
 * manager, the framework's real delegation surface with this host's `account`
 * hook, a real D1 and R2. The one double is the Anthropic client, which is the
 * network, so "never reaches the builder" and "no builder ran" are read off what
 * the builder's model was actually sent.
 */
const TENANT = 'bug225'
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

/** A home page whose hero is one known text, so the page's words are exact. */
function homePage(): Record<string, unknown> {
  const page = starterHomePage('acme') as Record<string, unknown>
  ;(page.l1 as { root: { children: unknown[] } }).root.children = [
    { kind: 'text', text: 'Welcome', axes: { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 } },
  ]
  return page
}

const HEADLINE = 'Hair, heart, community'
const REWRITE = {
  page: 'home',
  path: '0.0',
  node: { kind: 'text', text: HEADLINE, axes: { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 } },
}
const TEXT_HELD = `page home contains the text '${HEADLINE}'`
const TEXT_BROKEN = "page home contains the text 'Book your cut today'"
const WORKER_CHECK = 'the headline sits above the fold'
const WORDED_WRONGLY = `the hero headline reads exactly "${HEADLINE}"`
const NEAR_CONTAINMENT = 'page home: only elements inside the header, and nothing else, were changed'

interface Run {
  /** What the caller was handed back for its Delegate call. */
  answered: ModelRequest
  /** Every request the builder's model was ever sent. */
  builder: ModelRequest[]
}

async function delegate(slug: string, accept: string[], report: Record<string, unknown>): Promise<Run> {
  configureDelegation(ENABLED)
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(slug), pages: { 'home.json': homePage() } })
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = twoSided(
    [calls(DELEGATE_TOOL, { scope: ['home.json'], note: 'Working on it now — a few minutes.', role: BUILDER_ROLE, goal: 'Rewrite the hero headline.', accept }), says('Checked.')],
    [calls('set_l1', REWRITE), calls(REPORT_TOOL, report), says('Reported.')],
  )
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Rewrite the headline.' }))
  const caller = client.seen.filter((req) => req.model !== WORKER_MODEL)
  return { answered: caller[caller.length - 1], builder: client.seen.filter((req) => req.model === WORKER_MODEL) }
}

/** The first tool result the caller was handed, as text. */
function toolResultText(req: ModelRequest): string {
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: unknown }[]) {
      if (block?.type === 'tool_result') return typeof block.content === 'string' ? block.content : JSON.stringify(block.content)
    }
  }
  throw new Error('the caller was handed no tool result')
}

function verdictOf(result: Record<string, unknown>, check: string): { verdict: string; reason?: string; by?: string } {
  const found = (result.checks as { check: string; verdict: string; reason?: string; by?: string }[]).find((v) => v.check === check)
  if (found === undefined) throw new Error(`no verdict for ${check}`)
  return found
}

describe('BUG-225 the delegation settles text checks and refuses the ones it cannot', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-225_a_text_check_is_the_hosts_verdict_and_never_reaches_the_builder', async () => {
    // The builder is asked only the check it can judge by looking; the record
    // answers both text checks, and says one of them did not hold.
    const { answered, builder } = await delegate('text', [TEXT_HELD, TEXT_BROKEN, WORKER_CHECK], {
      summary: 'Rewrote it.',
      changed: ['home'],
      passed: [WORKER_CHECK],
    })
    const result = delegationResult(answered)
    const workerSaw = JSON.stringify(builder.map((r) => r.messages))

    expect(verdictOf(result, TEXT_HELD)).toMatchObject({ verdict: 'passed', by: 'account' })
    const broken = verdictOf(result, TEXT_BROKEN)
    expect(broken).toMatchObject({ verdict: 'failed', by: 'account' })
    expect(broken.reason).toContain(`'${HEADLINE}'`)
    expect(verdictOf(result, WORKER_CHECK)).toMatchObject({ verdict: 'passed', by: 'worker' })
    expect(workerSaw).toContain(WORKER_CHECK)
    expect(workerSaw).not.toContain(TEXT_HELD)
    expect(workerSaw).not.toContain(TEXT_BROKEN)
  })

  it('test_UAT_FC_BUG-225_a_check_worded_like_the_hosts_but_not_in_its_words_is_refused_and_no_builder_runs', async () => {
    const { answered, builder } = await delegate('refused', [WORDED_WRONGLY, NEAR_CONTAINMENT, WORKER_CHECK], {
      summary: 'Rewrote it.',
      changed: ['home'],
    })

    expect(builder).toHaveLength(0)
    const refusal = toolResultText(answered)
    expect(refusal).toContain('Error: Delegate failed (unsettled_check)')
    expect(refusal).toContain(JSON.stringify(WORDED_WRONGLY).slice(1, -1))
    expect(refusal).toContain('page home contains the text')
    expect(refusal).not.toContain(WORKER_CHECK)
  })
})
