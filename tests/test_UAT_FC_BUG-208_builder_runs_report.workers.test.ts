import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { HOST_SUMMARY_LEAD } from '../tools/generate/src/cli/ai/turn-clock-core'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE, BUILDER_TURN_MAX_BYTES } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  says,
  scriptedClient,
  sentText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-208]] — **a builder gets its whole brief, is never told a stale site, and
 * every run that ends without a report says why.**
 *
 * Charlie's plumbing - 3 lost three builder runs three ways. The brief was always
 * delivered whole, and a UAT now pins that. The builder's per-turn tail carried a
 * page digest taken when its one round opened, which told it after every write
 * that nothing had changed; it is no longer sent. And a worker that ran out of a
 * budget, or finished without calling its report, came back with nothing saying
 * which, so `ended` now names it.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager, the real delegation surface and its nudge, the real
 * tool loop and its REQ-181 budget meter on both sides, a real D1 and R2. The one
 * double is the Anthropic client, which is the network. What each side was sent is
 * read AS IT WAS SENT, inside the scripted step, so a later request cannot stand in
 * for an earlier one.
 */

const TENANT = 'bug208'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const WORKER_CALLS = backendsDocument.claude_builder.max_iterations
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

/** REQ-181's instruction on the meter's countdown rungs. */
const REPORT_NOW = 'post your report now'
/** The framework's one retry for a worker that ended without a report. */
const NUDGE = 'Your turn ended without a report'
/** The heading the page digest is delivered under. */
const DIGEST_HEADING = 'The site as it stands'

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

/** The whole streamed response, as text. */
async function drain(response: Response): Promise<string> {
  return await response.text()
}

/** What one side was sent, captured at the moment it was sent. */
interface Captured {
  req: ModelRequest
  text: string
}

/** A side of the conversation: steps chosen by what that side has been told so far. */
type Side = (req: ModelRequest, seen: Captured[]) => ReturnType<ModelStep>

interface Run {
  client: ScriptedClient
  caller: Captured[]
  builder: Captured[]
  /** Everything the consultant's turn streamed to the client. */
  streamed: string
}

/** One double, two conversations, told apart by the model they are addressed to. */
function twoSided(caller: Side, builder: Side): { client: ScriptedClient; seen: { caller: Captured[]; builder: Captured[] } } {
  const seen = { caller: [] as Captured[], builder: [] as Captured[] }
  const step: ModelStep = (req) => {
    const toWorker = req.model === WORKER_MODEL
    const log = toWorker ? seen.builder : seen.caller
    log.push({ req, text: sentText(req) })
    return toWorker ? builder(req, log) : caller(req, log)
  }
  return { client: scriptedClient([step]), seen }
}

/** A check the host settles from its own record, so it never reaches the worker. */
const HOST_CHECK = 'page home has no changes'
/** A check only the worker can answer, so it travels in the brief. */
const WORKER_CHECK = 'The count of elements on page home whose text contains ITEM-18-OF-18 equals 1'

/** A caller that delegates `goal` once and then says it is done. */
function delegatesOnce(goal: string, accept: string[] = [HOST_CHECK]): Side {
  return (_req, seen) =>
    seen.length === 1
      ? calls(DELEGATE_TOOL, { scope: ['site.json', 'home.json'],
          note: 'Working on it now — a few minutes.',
          role: BUILDER_ROLE,
          goal,
          accept,
        })(_req)
      : says('Noted.')(_req)
}

async function run(slug: string, caller: Side, builder: Side): Promise<Run> {
  configureDelegation(ENABLED)
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(slug) })
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const { client, seen } = twoSided(caller, builder)
  setModelClient(client)
  const streamed = await drain(await post('/api/ai/prompt', { sessionId, text: 'Have the home page built.' }))
  return { client, caller: seen.caller, builder: seen.builder, streamed }
}

/** The delegation's result as the CALLER received it, parsed out of its envelope. */
function delegationResult(req: ModelRequest): Record<string, unknown> {
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: string }[]) {
      if (block?.type !== 'tool_result' || typeof block.content !== 'string') continue
      if (!block.content.includes('"outcome"')) continue
      const body = block.content.replace(/^[\s\S]*?\n/, '').replace(/\n<<<\/untrusted>>>\s*$/, '')
      return JSON.parse(body) as Record<string, unknown>
    }
  }
  throw new Error('the caller was handed no delegation result')
}

/** The text of the first tool result a request carries. */
function toolResultText(req: ModelRequest): string {
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: unknown }[]) {
      if (block?.type !== 'tool_result') continue
      return typeof block.content === 'string' ? block.content : JSON.stringify(block.content)
    }
  }
  return ''
}

/** The text of the first user message a request carries. */
function firstUserText(req: ModelRequest): string {
  const first = req.messages.find((m) => m.role === 'user')
  const content = first?.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return (content as { text?: string }[]).map((b) => b.text ?? '').join('\n')
}

/** Eighteen numbered items, long enough that a cut would land well inside it. */
const LONG_BRIEF = [
  'Revise the home page of the plumbing site. Work through every item below.',
  '',
  ...Array.from({ length: 18 }, (_v, i) =>
    [
      `**${i + 1}. Section ${i + 1}.** Rewrite this band so it reads as one calm, plain`,
      `paragraph about item ${i + 1}, keeps every fact already there, stacks on a phone,`,
      `and carries the marker ITEM-${i + 1}-OF-18 somewhere in its text so it can be found.`,
      '',
    ].join('\n'),
  ),
  'Do not add pages. Do not publish.',
].join('\n')

interface Ended {
  status: string
  reason?: string
  limit?: number
}

describe('BUG-208 builder runs: the whole brief, no stale site, and a stated ending', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-208_a_long_numbered_brief_reaches_the_workers_first_turn_unchanged', async () => {
    // Charlie 3's worker 2 was handed a 7,075-character brief and received its first
    // 4,000 bytes: the framework's default bound on a user turn, which a worker has
    // no way to read past. Its items 6 to 8 and every check were in the cut half.
    expect(new TextEncoder().encode(LONG_BRIEF).length).toBeGreaterThan(4_000)
    const reported: Side = (req, seen) =>
      seen.length === 1
        ? calls(REPORT_TOOL, { summary: 'Read the brief.', changed: [] })(req)
        : says('')(req)
    const { builder } = await run('brief', delegatesOnce(LONG_BRIEF, [HOST_CHECK, WORKER_CHECK]), reported)

    const first = firstUserText(builder[0].req)
    expect(first).toContain(LONG_BRIEF)
    expect(first).toContain(`- ${WORKER_CHECK}`)
    expect(first).not.toContain('xgd-turn-elided')
  })

  it('test_UAT_FC_BUG-208_a_brief_too_long_to_arrive_whole_is_refused_and_no_worker_runs', async () => {
    const tooLong = `${LONG_BRIEF}\n\n${'More detail. '.repeat(Math.ceil(BUILDER_TURN_MAX_BYTES / 13))}`
    const neverRuns: Side = (req) => says('')(req)
    const { caller, builder } = await run('too-long', delegatesOnce(tooLong), neverRuns)

    expect(builder).toHaveLength(0)
    const refusal = toolResultText(caller[caller.length - 1].req)
    expect(refusal).toContain('Error: Delegate failed (brief_too_long)')
    expect(refusal).toContain(`a builder takes at most ${BUILDER_TURN_MAX_BYTES}`)
  })

  it('test_UAT_FC_BUG-208_no_worker_request_carries_the_turn_start_site_digest', async () => {
    // The builder's whole job is one round, and a reminder is assembled once per
    // round and re-sent after every tool result — so a digest there is stale from
    // the first write on. The consultant's turns are short and keep theirs.
    const working: Side = (req, seen) => {
      if (seen.length <= 2) return calls('list_pages', {})(req)
      if (seen.length === 3) return calls(REPORT_TOOL, { summary: 'Listed the pages.', changed: [] })(req)
      return says('')(req)
    }
    const { caller, builder } = await run('digest', delegatesOnce('List the pages.'), working)

    expect(builder.length).toBeGreaterThanOrEqual(3)
    for (const sent of builder) expect(sent.text).not.toContain(DIGEST_HEADING)
    expect(caller[0].text).toContain(DIGEST_HEADING)
  })

  it(
    'test_UAT_FC_BUG-208_a_worker_near_its_step_budget_is_told_to_report_and_its_report_reaches_the_consultant',
    async () => {
      // It keeps working until REQ-181's countdown tells it to report, and then
      // does — which is the whole of what the meter is for.
      const SUMMARY = 'Did items 1 to 4; item 5 is not done.'
      let toldAt = -1
      const obedient: Side = (req, seen) => {
        if (toldAt < 0 && seen[seen.length - 1].text.includes(REPORT_NOW)) {
          toldAt = seen.length
          return calls(REPORT_TOOL, { summary: SUMMARY, changed: ['items 1 to 4'] })(req)
        }
        return toldAt < 0 ? calls('list_pages', {})(req) : says('')(req)
      }
      const { caller, builder } = await run('meter', delegatesOnce('Do items 1 to 5.'), obedient)

      expect(toldAt).toBeGreaterThan(0)
      expect(toldAt).toBeLessThanOrEqual(WORKER_CALLS)
      expect(builder.slice(0, toldAt - 1).some((s) => s.text.includes(REPORT_NOW))).toBe(false)
      const result = delegationResult(caller[caller.length - 1].req)
      expect(result.outcome).toBe('reported')
      expect(result.summary).toBe(SUMMARY)
      expect(result).not.toHaveProperty('ended')
    },
    120_000,
  )

  it(
    'test_UAT_FC_BUG-208_a_worker_that_runs_out_of_tool_calls_comes_back_exhausted_naming_calls_and_the_limit',
    async () => {
      const heedless: Side = (req, seen) =>
        seen[seen.length - 1].text.includes(NUDGE) ? says('')(req) : calls('list_pages', {})(req)
      const { caller } = await run('calls', delegatesOnce('Do items 1 to 5.'), heedless)

      const result = delegationResult(caller[caller.length - 1].req)
      expect(result.outcome).toBe('exhausted')
      expect(result.ended as Ended).toEqual({ status: 'complete', reason: 'calls', limit: WORKER_CALLS })
    },
    120_000,
  )

  it('test_UAT_FC_BUG-208_a_worker_that_never_calls_its_report_comes_back_silent_naming_no_report', async () => {
    // Charlie 3's worker 13: it wrote its report as text, twice. Text is never
    // delivered, so the result must say that no report came — not read as an
    // empty success — and the words it did write are what activity carries.
    const PROSE = '<ReportResult><summary>Styled the page; the contact form is half done.</summary></ReportResult>'
    const prose: Side = (req, seen) => (seen.length === 1 ? calls('list_pages', {})(req) : says(PROSE)(req))
    const { caller } = await run('prose', delegatesOnce('Style the page.'), prose)

    const result = delegationResult(caller[caller.length - 1].req)
    expect(result.outcome).toBe('silent')
    expect(result.accepted).toBe(false)
    // [[BUG-212]] supersedes an empty summary here: the host writes one, and says so.
    expect(String(result.summary).startsWith(HOST_SUMMARY_LEAD)).toBe(true)
    expect(result.ended as Ended).toEqual({ status: 'complete', reason: 'no_report' })
    expect((result.activity as { last_words?: string }).last_words).toContain('the contact form is half done')
  })

  it(
    'test_UAT_FC_BUG-208_a_consultant_turn_that_runs_out_says_its_hand_off_ended_without_reporting',
    async () => {
      // The consultant's own out-of-budget paragraph lists what its turn did. A
      // hand-off that ended without a report used to read "handed off work".
      const silentWorker: Side = (req, seen) => (seen.length === 1 ? calls('list_pages', {})(req) : says('')(req))
      const busyCaller: Side = (req, seen) =>
        seen.length === 1
          ? calls(DELEGATE_TOOL, { scope: ['site.json', 'home.json'],
              note: 'Working on it now.',
              role: BUILDER_ROLE,
              goal: 'Style the page.',
              accept: [HOST_CHECK],
            })(req)
          : calls('list_pages', {})(req)
      const { streamed } = await run('notice', busyCaller, silentWorker)

      expect(streamed).toContain('before I could finish it')
      expect(streamed).toContain('the worker ended without reporting: it finished without reporting')
    },
    120_000,
  )
})
