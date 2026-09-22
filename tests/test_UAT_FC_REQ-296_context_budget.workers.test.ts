import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import {
  backendsDocument,
  checkProjectWindows,
  configureProjectBackends,
  projectBackendCeiling,
  projectBackendWindow,
} from '../tools/generate/src/cli/ai/backends'
import { BUDGET_STOP_REASON, TURN_BUDGET_FRACTION } from '../tools/generate/src/cli/ai/budget-core'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  metered,
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
  type SystemBlock,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-296]] — **a turn does not overflow its context**.
 *
 * WHAT WAS WRONG. A single turn could grow without limit and nothing could see it
 * coming. `recentExchanges` bounds growth ACROSS turns and declines to bound one;
 * the only bound INSIDE a turn was `MAX_TOOL_ITERATIONS = 50`, a count that
 * cannot tell a 200-byte tool result from a 200-kilobyte one; nothing compacts on
 * the API path. So overflow arrived as a provider error mid-turn, after the
 * tokens were spent, with the turn's work unlanded.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the real route inside workerd —
 * `POST /api/ai/prompt`, the real session manager, the real priming assembly out
 * of the shared store, the real tool loop, the real `ClaudeAPIBackend` and its
 * real per-request usage accumulator, a real D1 holding the `chat` ticket and the
 * `turn_spend` table. The one double is the Anthropic client, which is the
 * network, and it is the shared one, so the streaming shape is production's.
 *
 * THE DOUBLE IS ALSO THE INSTRUMENT. `metered` is what makes a context budget
 * testable at all: the figure the guard and the gauge both read comes off the
 * provider's own `usage` counters, so a scripted reply that reports 900,000 input
 * tokens is a conversation that genuinely measures 900,000 as far as every line
 * of code under test can tell. Nothing here asserts on a character count, because
 * nothing in the implementation reads one.
 *
 * WHAT THESE CASES SETTLE — the ticket's seven conditions, plus the start-up
 * check that makes the first of them hold on the day a model is renamed:
 *
 *   a. every backend entry resolves a context window, and a model the framework's
 *      table does not name is refused at host build rather than degrading to a
 *      session with no gauge and no guard;
 *   b. the model is shown occupancy, window, percent and remaining, every turn;
 *   c. that figure rides the per-turn tail: two turns whose gauge differs still
 *      send an identical cached prefix;
 *   d. a turn whose next request would exceed the ceiling ends on a terminal
 *      event naming the reason, and the request is never built;
 *   e. the spend of a turn stopped that way is still metered;
 *   f. a conversation that ended its last turn over the ceiling is refused before
 *      the provider, and its prompt survives;
 *   g. a session may address its own tool transcript by turn id;
 *   h. a worker is guarded against its OWN window, not the caller's.
 */

const TENANT = 'req296'

/** What the consultant runs on, and what a worker runs on. Read, never restated. */
const CALLER_MODEL = backendsDocument.claude.model
const WORKER_MODEL = backendsDocument.claude_builder.model

/** The switch as it ships, turned on — what an enabling deployment installs. */
const ENABLED = { ...delegationDocument, enabled: true }

const DELEGATE_TOOL = 'Delegate'
const WORK_LOG_TOOL = 'read_work_log'

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
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
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

/** One SSE frame as the router writes it. */
interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/** Every frame of a turn, read to the close of the stream. */
async function frames(response: Response): Promise<Frame[]> {
  expect(response.status).toBe(200)
  const text = await response.text()
  return text
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.startsWith('data:'))
    .map((chunk) => JSON.parse(chunk.slice(5).trim()) as Frame)
}

async function openSession(prefix: string): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string; ready: boolean }
  expect(session.ready).toBe(true)
  return session.sessionId
}

/** One turn, driven through the real route, with the model scripted. */
async function turn(
  sessionId: string,
  text: string,
  steps: ModelStep[],
): Promise<{ client: ScriptedClient; events: Frame[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const events = await frames(await post('/api/ai/prompt', { sessionId, text }))
  return { client, events }
}

/** The session's `chat` ticket, read straight out of D1. */
async function chatTicket(sessionId: string): Promise<{ uid?: string; fields: Record<string, unknown> }> {
  const { results } = await env.DB.prepare(
    "SELECT uid, fields FROM tickets WHERE type = 'chat'",
  ).all<{ uid: string; fields: string }>()
  for (const row of results ?? []) {
    const fields = JSON.parse(row.fields) as Record<string, unknown>
    if (fields.session_id === sessionId) return { uid: row.uid, fields }
  }
  return { fields: {} }
}

/** Its fields alone, which is what most of these cases ask about. */
async function chatFields(sessionId: string): Promise<Record<string, unknown>> {
  return (await chatTicket(sessionId)).fields
}

/**
 * The durable work log for a session, read straight out of D1.
 *
 * NOT THROUGH THE SESSION'S OWN TOOL, deliberately — see case (d), where the
 * conversation it belongs to is over the ceiling and cannot take another turn.
 * That is the whole point of the artifact: what the stopped turn got through
 * outlives the conversation that could no longer continue, so the record has to
 * be readable without one.
 */
async function workLog(sessionId: string): Promise<string> {
  const chatUid = String((await chatTicket(sessionId)).uid ?? '')
  const { results } = await env.DB.prepare(
    "SELECT fields, body FROM tickets WHERE type = 'comment'",
  ).all<{ fields: string; body: string }>()
  for (const row of results ?? []) {
    const fields = JSON.parse(row.fields) as Record<string, unknown>
    if (fields.subject_uid !== chatUid) continue
    if (!row.body.includes('<!-- xgd-tool ')) continue
    return row.body
  }
  return ''
}

/** One stored meter row, as much of it as these cases read. */
interface SpendRow {
  session_id: string
  outcome: string
  requests: number
  input_tokens: number
}

async function meter(sessionId: string): Promise<SpendRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM turn_spend WHERE session_id = ? ORDER BY started_at, rowid',
  )
    .bind(sessionId)
    .all<SpendRow>()
  return results ?? []
}

/** The tools a request offered, by name. */
function toolNames(req: ModelRequest): string[] {
  return req.tools.map((tool) => tool.name).sort()
}

/**
 * Every tool result a request carries back to the model, as text.
 *
 * Read out of the request rather than out of the host's own objects, for the
 * reason this file's header gives: what a session can act on is what arrived on
 * the wire, and a tool that answered into a structure the request never carried
 * would pass a test written the other way round.
 */
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

/** The cached prefix of a request's priming: the blocks upstream marked. */
function cachedPrefix(req: ModelRequest): string[] {
  if (typeof req.system === 'string') return []
  return (req.system as SystemBlock[]).filter((block) => block.cache_control).map((b) => b.text)
}

/**
 * One double answering two conversations, told apart by the model addressed.
 *
 * REQ-295's own harness, for its reason: the host injects one client because the
 * caller's backend and the worker's are both built from it, and a worker that
 * somehow reached the caller's backend would be running the caller's model —
 * which is exactly what case (h) is about.
 */
function twoSided(caller: ModelStep[], workerSteps: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] =
      req.model === WORKER_MODEL ? [workerSteps, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

const workerRequests = (client: ScriptedClient): ModelRequest[] =>
  client.seen.filter((req) => req.model === WORKER_MODEL)

const callerRequests = (client: ScriptedClient): ModelRequest[] =>
  client.seen.filter((req) => req.model === CALLER_MODEL)

/** The library, as the Worker loads it — the object the host is handed. */
const lib = aiLib as unknown as Parameters<typeof projectBackendWindow>[0]

describe('REQ-296 — a turn does not overflow its context', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    // The project's own document goes back, so a case that installed a
    // deliberately broken one cannot leave it installed for the next.
    configureProjectBackends(lib)
    resetAiHost()
    resetChatHost()
  })

  // ── condition 1, and the check that keeps it true ──────────────────────────

  it('test_UAT_FC_REQ-296_every_backend_entry_resolves_a_context_window_and_one_that_does_not_is_refused_at_build', async () => {
    // RESOLVED, NOT DECLARED. `context_window` is a key `backends.json` MAY set,
    // and the framework refuses it in its own shipped file for a reason this
    // project inherits: the window is a fact about the configured MODEL, so a
    // number written beside `model` outlives the next change of `model` and hands
    // a session the denominator of a model it is not running. So the entry names
    // a model and the window comes from the framework's table — and what this
    // ticket adds is the alarm for when it cannot.
    configureProjectBackends(lib)

    for (const name of Object.keys(backendsDocument)) {
      if (name === 'about') continue
      expect(projectBackendWindow(lib, name)).toBeGreaterThan(0)
    }

    // The consultant's million and the worker's two hundred thousand, read from
    // the framework rather than restated here: what is asserted is that each
    // entry's window is the one its own model has, not that the pair happen to
    // be two numbers this file also knows.
    expect(projectBackendWindow(lib, 'claude')).toBe(
      (lib as unknown as { modelContextWindow: (m: string) => number }).modelContextWindow(
        backendsDocument.claude.model,
      ),
    )
    expect(projectBackendWindow(lib, 'claude_builder')).toBe(
      (lib as unknown as { modelContextWindow: (m: string) => number }).modelContextWindow(
        backendsDocument.claude_builder.model,
      ),
    )

    // AND THE ALARM. A model the table does not name — the shape a rename
    // produces, which is the fastest-moving fact in the system — resolves no
    // window, and a session on it would have had no gauge and no guard, silently.
    ;(lib as unknown as { configureBackends: (d: unknown) => void }).configureBackends({
      claude: { model: 'claude-not-a-real-model' },
      claude_builder: backendsDocument.claude_builder,
    })

    expect(() => checkProjectWindows(lib)).toThrow(/context window/)
    expect(() => checkProjectWindows(lib)).toThrow(/claude-not-a-real-model/)
  })

  // ── condition 2 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-296_the_model_is_shown_occupancy_window_percent_and_remaining_every_turn', async () => {
    const sessionId = await openSession('gauge')

    // The first turn has nothing to report — no request has been measured yet —
    // and that is the honest reading rather than a gauge at zero, which would be
    // a gauge saying there is room.
    const first = await turn(sessionId, 'Hello.', [
      metered({ input_tokens: 120_000, output_tokens: 300 }, says('Hi.')),
    ])
    expect(turnTailText(first.client.seen[0])).not.toContain('context budget')

    const second = await turn(sessionId, 'Again.', [
      metered({ input_tokens: 130_000, output_tokens: 20 }, says('Ok.')),
    ])
    const shown = turnTailText(second.client.seen[0])

    // All four figures, and each one derived rather than coincidental: 120,000
    // was what the last request carried, 1,000,000 is the configured model's
    // window, 12% is their ratio and 880,000 is the difference.
    expect(shown).toContain('120,000 tokens')
    expect(shown).toContain('1,000,000-token context window')
    expect(shown).toContain('12%')
    expect(shown).toContain('880,000')

    // AND IT MOVES WITH THE CONVERSATION. The third turn is shown the second
    // turn's figure, which is the property that makes it a gauge rather than a
    // sentence — and it is only possible because the host wrote the figure down:
    // this Worker rebuilds the manager per request, so the framework's in-memory
    // copy is gone by the time the next turn assembles its seed.
    const third = await turn(sessionId, 'And again.', [
      metered({ input_tokens: 140_000 }, says('Still here.')),
    ])
    expect(turnTailText(third.client.seen[0])).toContain('130,000 tokens')
    expect(await chatFields(sessionId)).toMatchObject({ occupancy_tokens: 140_000 })
  })

  // ── condition 3 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-296_the_gauge_rides_the_per_turn_tail_and_leaves_the_cached_prefix_intact', async () => {
    const sessionId = await openSession('cache')

    await turn(sessionId, 'One.', [metered({ input_tokens: 111_000 }, says('Yes.'))])
    const second = await turn(sessionId, 'Two.', [
      metered({ input_tokens: 222_000 }, says('Yes.')),
    ])
    const third = await turn(sessionId, 'Three.', [
      metered({ input_tokens: 333_000 }, says('Yes.')),
    ])

    const a = second.client.seen[0]
    const b = third.client.seen[0]

    // THE TWO GAUGES DIFFER, which is what makes the rest of this case mean
    // something: without that these would be two identical requests.
    expect(turnTailText(a)).toContain('111,000 tokens')
    expect(turnTailText(b)).toContain('222,000 tokens')

    // AND THE FIGURE IS NOT IN THE PRIMING. A number that changes every turn,
    // written into `system`, would invalidate the whole cached prefix on every
    // turn — the exact defect [[REQ-144]] exists to have fixed, and worth more
    // than the overflow this ticket is about.
    expect(systemText(a)).not.toContain('context budget')
    expect(systemText(b)).not.toContain('context budget')

    // SO THE PREFIX IS BYTE-IDENTICAL ACROSS THE TWO TURNS, and it is a real
    // prefix: upstream marks it with `cache_control`, and it covers the second
    // turn's history — the session's own instructions and the surface manuals
    // that make up the bulk of what is re-sent.
    expect(cachedPrefix(a).length).toBeGreaterThan(0)
    expect(cachedPrefix(b)).toEqual(cachedPrefix(a))
    expect(cachedPrefix(a).join('').length).toBeGreaterThan(1000)
  })

  // ── conditions 4 and 5 ─────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-296_a_turn_over_the_ceiling_ends_on_a_terminal_event_naming_the_reason_and_never_builds_the_next_request', async () => {
    const sessionId = await openSession('inturn')

    // The ceiling is the window less the reply's ceiling — the provider refuses a
    // request whose input plus `max_tokens` exceeds the window — times the
    // fraction of that room this host will fill. Derived here for the same reason
    // the window was above: a literal would assert that two numbers agree today.
    const ceiling = projectBackendCeiling(lib)
    expect(ceiling).toBe(
      Math.floor(
        (projectBackendWindow(lib) - backendsDocument.claude.max_tokens) * TURN_BUDGET_FRACTION,
      ),
    )

    const { client, events } = await turn(sessionId, 'Read the page then rewrite it.', [
      // One request, measured over the ceiling, ending in a tool call — which is
      // the one moment the host can be certain a request has completed AND
      // another is about to be sent.
      metered({ input_tokens: ceiling + 1_000 }, calls('describe_page', { page: 'home' })),
      // The second request is what this case is about NOT happening. Scripted so
      // that reaching it would be a pass on the old behaviour rather than a
      // crash on the new.
      metered({ input_tokens: ceiling + 5_000 }, says('Rewritten.')),
    ])

    // THE REQUEST THAT WOULD HAVE OVERFLOWED IS NEVER BUILT. Not cancelled
    // mid-flight and not refused by the provider: the tool loop is stopped
    // between two requests, so there is exactly one.
    expect(client.seen.length).toBe(1)

    // THE TURN ENDS, rather than breaking. The client is told why in the
    // session's place, and the terminal event names the reason.
    const said = events
      .filter((f) => f.kind === 'text')
      .map((f) => f.content ?? '')
      .join('')
    expect(said).toContain('stopped here')
    expect(said).toContain('1,000,000-token context window')

    const done = events.at(-1)
    expect(done?.kind).toBe('done')
    expect(done?.meta?.stop_reason).toBe(BUDGET_STOP_REASON)
    expect(done?.meta?.status).toBe('aborted')

    // CONDITION 5 — AND THE SPEND IS STILL RECORDED. A turn that was cut off is
    // exactly the turn whose cost someone will ask about, and the request that
    // was sent was paid for whatever became of the turn.
    const rows = await meter(sessionId)
    expect(rows.length).toBe(1)
    expect(rows[0].requests).toBe(1)
    expect(rows[0].input_tokens).toBe(ceiling + 1_000)
    expect(rows[0].outcome).toBe('aborted')

    // …AND THE WORK THE TURN DID DO IS ON THE RECORD. The call it made before it
    // was stopped is in the durable work log, which is what a fresh conversation
    // reads back — and reading it here, out of the store rather than through the
    // session's own tool, is not a shortcut: this conversation is now over the
    // ceiling, so it cannot take the turn that would have asked.
    expect(await workLog(sessionId)).toContain('describe_page')

    // WHICH IS ITSELF THE NEXT CASE'S PREMISE, asserted here because the two
    // halves of the guard have to agree: the turn that was stopped inside leaves
    // the conversation in the state the pre-turn half refuses.
    const next = await turn(sessionId, 'Carry on then.', [says('Sure.')])
    expect(next.client.seen.length).toBe(0)
  })

  // ── condition 4, the other moment ──────────────────────────────────────────

  it('test_UAT_FC_REQ-296_a_conversation_already_over_the_ceiling_is_refused_before_the_provider_and_keeps_its_prompt', async () => {
    const sessionId = await openSession('preturn')
    const ceiling = projectBackendCeiling(lib)

    // A turn that ends nearly full is the shape the in-turn guard cannot see: the
    // next turn overflows on its FIRST request, before any tool has run.
    await turn(sessionId, 'A long one.', [
      metered({ input_tokens: ceiling + 10_000 }, says('Noted.')),
    ])
    expect(await chatFields(sessionId)).toMatchObject({ occupancy_tokens: ceiling + 10_000 })

    const { client, events } = await turn(sessionId, 'One more thing.', [says('Sure.')])

    // NOTHING WAS SENT. The provider never sees the request, so the overflow
    // never becomes an error, and the tokens are not spent finding out.
    expect(client.seen.length).toBe(0)

    const said = events
      .filter((f) => f.kind === 'text')
      .map((f) => f.content ?? '')
      .join('')
    expect(said).toContain('stopped here')
    expect(events.at(-1)?.kind).toBe('done')
    expect(events.at(-1)?.meta?.status).toBe('aborted')

    // THE CLIENT'S WORDS SURVIVE, so they can be carried into a fresh
    // conversation — the prompt is made durable before the budget is read.
    const fields = await chatFields(sessionId)
    expect(String(fields.pending_turn)).toContain('One more thing.')

    // AND NOTHING IS METERED FOR A TURN THAT NEVER RAN. A row of zeros would
    // claim a turn that cost nothing rather than a turn that was refused.
    expect((await meter(sessionId)).length).toBe(1)
  })

  // ── condition 6 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-296_a_session_addresses_its_own_tool_transcript_by_turn_id', async () => {
    const sessionId = await openSession('worklog')

    const first = await turn(sessionId, 'Have a look at the home page.', [
      calls('describe_page', { page: 'home' }),
      calls('list_pages', {}),
      says('Had a look.'),
    ])

    // THE SESSION IS TOLD THE LOG EXISTS, and only once there is something to
    // point at: an entry that named an artifact the session could not open would
    // be a hand-written claim about a tool it has not got.
    expect(toolNames(first.client.seen[0])).toContain(WORK_LOG_TOOL)

    const second = await turn(sessionId, 'What did you call?', [
      // The index first — what a session can afford to ask for blind.
      calls(WORK_LOG_TOOL, {}),
      // …then one turn in full, addressed by the id the index just gave it. The
      // step reads the previous answer off the request, which is the only place
      // a session could have read it either.
      (req) => {
        const index = toolResults(req).join('\n')
        const turnId = /turn ([A-Za-z0-9_-]+) —/.exec(index)?.[1] ?? ''
        expect(turnId).not.toBe('')
        return calls(WORK_LOG_TOOL, { turn: turnId })(req)
      },
      says('Here is what I did.'),
    ])

    const index = toolResults(second.client.seen[1]).join('\n')
    expect(index).toContain('describe_page')
    expect(index).toContain('list_pages')
    expect(index).toMatch(/turn [A-Za-z0-9_-]+ —/)

    // THE TURN IN FULL — the input each call was given, which the index does not
    // carry. That is the whole point of the second depth: an index tells a
    // session what it did, and this tells it what came back.
    const full = toolResults(second.client.seen[2]).join('\n')
    expect(full).toContain('describe_page')
    expect(full).toContain('Input')

    // AND A TURN THE LOG DOES NOT HOLD IS A DECLARED REFUSAL, not an empty
    // answer that reads like a session with no history.
    const third = await turn(sessionId, 'And turn zero?', [
      calls(WORK_LOG_TOOL, { turn: 'no-such-turn' }),
      says('There is nothing under that.'),
    ])
    expect(toolResults(third.client.seen[1]).join('\n')).toContain('UNKNOWN_TURN')
  })

  // ── condition 7 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-296_a_worker_is_guarded_against_its_own_smaller_window_and_not_the_callers', async () => {
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const workerCeiling = projectBackendCeiling(lib, 'claude_builder')
    const callerCeiling = projectBackendCeiling(lib)

    // THE TWO CEILINGS ARE DIFFERENT, and the worker's is the smaller — which is
    // the whole hazard [[REQ-295]] introduced: a consultant on a million-token
    // window opening workers on a two-hundred-thousand-token one.
    expect(workerCeiling).toBeGreaterThan(0)
    expect(workerCeiling).toBeLessThan(callerCeiling)

    // A figure over the WORKER'S ceiling and comfortably under the CALLER'S. If
    // the worker were guarded against the consultant's window — the defect this
    // case exists to rule out — this measurement would pass straight through.
    const overWorker = workerCeiling + 5_000
    expect(overWorker).toBeLessThan(callerCeiling)

    const sessionId = await openSession('worker')
    const client = twoSided(
      [
        metered(
          { input_tokens: 9_000, output_tokens: 200 },
          calls(DELEGATE_TOOL, {
            role: BUILDER_ROLE,
            goal: 'Lay out the About page as three sections.',
            accept: ['every section has a heading'],
          }),
        ),
        says('The builder ran out of room; I will finish this myself.'),
      ],
      [
        metered({ input_tokens: overWorker }, calls('describe_page', { page: 'home' })),
        // Never reached, for the same reason as the in-turn case above.
        metered({ input_tokens: overWorker + 5_000 }, says('Built it.')),
      ],
    )
    setModelClient(client)

    const events = await frames(
      await post('/api/ai/prompt', { sessionId, text: 'Have the About page built.' }),
    )

    // THE WORKER WAS STOPPED AFTER ONE REQUEST, against its own window.
    expect(workerRequests(client).length).toBe(1)
    expect(workerRequests(client)[0].model).toBe(WORKER_MODEL)

    // AND THE CALLER WAS NOT. It carried on, was handed the delegation's result,
    // and answered its client — a worker running out of room is an outcome the
    // consultant reasons about rather than a turn that breaks.
    expect(callerRequests(client).length).toBeGreaterThan(1)
    const answered = events
      .filter((f) => f.kind === 'text')
      .map((f) => f.content ?? '')
      .join('')
    expect(answered).toContain('finish this myself')
    expect(events.at(-1)?.meta?.status).toBe('complete')
  })
})
