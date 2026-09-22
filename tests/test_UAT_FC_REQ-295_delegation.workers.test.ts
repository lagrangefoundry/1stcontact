import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE, CONSULTANT_ROLE, primingText } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  metered,
  says,
  scriptedClient,
  sentText,
  systemText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-295]] — **construction, handed to a cheaper session, behind a switch**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the REAL route inside workerd:
 * `POST /api/ai/prompt`, the real session manager, the real delegation surface
 * out of the shared store, the real tool loop on both sides of the hand-off, the
 * real `ClaudeAPIBackend` and its real per-request accumulator, a real D1 whose
 * `turn_spend` table comes from the migration, and a real R2 for the audit. The
 * one double is the Anthropic client — it is the network — and it is the SHARED
 * one, so the streaming shape is the one production reads.
 *
 * THE DOUBLE ANSWERS BOTH SIDES OF THE HAND-OFF, which is what makes the whole
 * thing observable: a worker runs on a different model, so `req.model` is what
 * tells the two apart — and it is also, not incidentally, the thing condition 3
 * is about. See {@link twoSided}.
 *
 * THE CONDITIONS THESE CASES SETTLE:
 *
 *   1. switch off — no `delegate` tool, and no method prose in the prompt;
 *   2. switch on — `delegate` IN ADDITION TO everything the off run offered;
 *   3. a delegation opens a worker on the configured backend and returns a
 *      result: summary, what changed, decisions, a verdict per requested check;
 *   4. the worker's conversation never enters the caller's context;
 *   5. the worker's capabilities are the builder role's grant and nothing else;
 *   6. a worker cannot delegate again;
 *   7. the worker's spend is attributed to the caller's turn;
 *   8. the worker's tool calls are audited under the worker's OWN session id.
 */

const TENANT = 'req295'

/** The switch as it ships, turned on — what an enabling deployment installs. */
const ENABLED = { ...delegationDocument, enabled: true }

/** What the worker runs on, and what the consultant runs on. Read, never restated. */
const WORKER_MODEL = backendsDocument.claude_builder.model
const CALLER_MODEL = backendsDocument.claude.model

/**
 * The two operations' MODEL-FACING names, which are not their operation ids.
 *
 * `delegate` and `report` are what the declaration calls the operations; what a
 * model is offered is each operation's `tool`, and this surface names them
 * differently. Getting that wrong does not fail loudly — the call comes back
 * `Tool delegate not enabled`, which reads like a missing grant rather than a
 * misspelled tool. The sibling config suite pins both against the installed
 * declaration, so a rename upstream fails there rather than turning these cases
 * into assertions about nothing.
 */
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

/** The checks the consultant asks for. The second is deliberately never answered. */
const CHECK_MET = 'every section has a heading'
const CHECK_UNANSWERED = 'the hero image is the one from the Library'

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

/** BUG-46's collecting context — the test standing in for the runtime's `waitUntil`. */
function collectingCtx(): { ctx: ExecutionContext; settled: () => Promise<unknown[]> } {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      held.push(promise)
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, settled: () => Promise.all(held) }
}

const post = (path: string, body: unknown, ctx?: ExecutionContext): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    ctx,
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

async function openSession(prefix: string): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
}

/**
 * One double, two conversations, told apart by the model they are addressed to.
 *
 * WHY THIS AND NOT TWO CLIENTS. The host injects ONE client, and it has to,
 * because the caller's backend and the worker's are both built from it — which
 * is itself part of what is under test: a worker that somehow reached the
 * caller's backend would be running the caller's model, and this would find out.
 * So the routing is by `req.model`, which is the fact the ticket's own condition
 * 3 turns on.
 *
 * IT REUSES {@link says} / {@link calls} / {@link metered} rather than emitting
 * events itself — that module's header explains at length why a fifth
 * transcription of Anthropic's wire protocol is the thing that rots.
 */
function twoSided(caller: ModelStep[], worker: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] =
      req.model === WORKER_MODEL ? [worker, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

/** The tools a request offered, by name. */
function toolNames(req: ModelRequest): string[] {
  return req.tools.map((tool) => tool.name).sort()
}

/** Every request addressed to the worker's model, in order. */
const workerRequests = (client: ScriptedClient): ModelRequest[] =>
  client.seen.filter((req) => req.model === WORKER_MODEL)

/** Every request addressed to the caller's model, in order. */
const callerRequests = (client: ScriptedClient): ModelRequest[] =>
  client.seen.filter((req) => req.model === CALLER_MODEL)

/**
 * The delegation's result, as the CALLER received it.
 *
 * Read out of the tool result the host actually rendered rather than searched
 * for as a substring: the payload arrives inside a third-party envelope, so a
 * string match would be asserting against the envelope's formatting as much as
 * against the result. Parsing is also what lets a check's verdict be compared as
 * a value.
 */
function delegationResult(req: ModelRequest): {
  summary: string
  changed: string[]
  decisions: string[]
  checks: { check: string; verdict: string }[]
  accepted: boolean
  outcome: string
  session: string
  role: string
  backend: string
} {
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: string }[]) {
      if (block?.type !== 'tool_result' || typeof block.content !== 'string') continue
      const body = block.content.replace(/^[\s\S]*?\n/, '').replace(/\n<<<\/untrusted>>>\s*$/, '')
      return JSON.parse(body)
    }
  }
  throw new Error('the caller was handed no tool result')
}

/** One stored meter row, as much of it as these cases read. */
interface SpendRow {
  session_id: string
  role: string
  backend: string
  model: string
  attributed: string | null
}

async function meter(sessionId: string): Promise<SpendRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM turn_spend WHERE session_id = ? ORDER BY started_at, rowid',
  )
    .bind(sessionId)
    .all<SpendRow>()
  return results ?? []
}

/**
 * The script both delegating cases run.
 *
 * The consultant hands over one piece of work with two checks; the worker builds,
 * reports ONE of them passed and never mentions the other, then finishes its
 * turn; the consultant answers its client.
 */
function delegationScript(): ScriptedClient {
  return twoSided(
    [
      metered(
        { input_tokens: 9000, output_tokens: 200, cache_creation_input_tokens: 1000 },
        calls(DELEGATE_TOOL, {
          role: BUILDER_ROLE,
          goal: 'Lay out the About page as three sections: intro, team, contact.',
          accept: [CHECK_MET, CHECK_UNANSWERED],
        }),
      ),
      says('I had the About page built. One thing still needs a look.'),
    ],
    [
      metered(
        { input_tokens: 800, output_tokens: 400, cache_creation_input_tokens: 150 },
        calls(REPORT_TOOL, {
          summary: 'Built the About page with three sections.',
          changed: ['about'],
          decisions: ['Used the plainest heading scale, since the brief did not say.'],
          passed: [CHECK_MET],
        }),
      ),
      says('Reported.'),
    ],
  )
}

describe('REQ-295 — delegating construction', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    // THE SWITCH GOES BACK, and the managers with it: a manager composes the
    // delegation surface when its Toolbox is built and holds it for its life, so
    // a cached one would carry the previous case's answer.
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  // ── condition 1 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-295_with_the_switch_off_the_consultant_has_no_delegate_tool_and_is_not_told_about_one', async () => {
    // THE DEFAULT PATH, and the whole of what "off" has to mean: the surface is
    // never composed, not composed-and-refusing — so the manual never mentions
    // it and the model cannot propose, apologise for, or probe for an operation
    // it has not got. Nothing here configures anything; this is the repository
    // as it ships.
    const sessionId = await openSession('off')
    const client = scriptedClient([says('Looks fine to me.')])
    setModelClient(client)

    await drain(await post('/api/ai/prompt', { sessionId, text: 'How does it look?' }))

    const request = client.seen[0]
    expect(toolNames(request)).not.toContain(DELEGATE_TOOL)
    // AND THE PROMPT IS UNCHANGED. The method prose is a provider that renders
    // `null` with the switch off, which drops the entry AND its separator.
    expect(sentText(request)).not.toContain('Handing construction over')
    expect(sentText(request)).not.toContain(DELEGATE_TOOL)
    // The consultant is on its own model, which is the thing that must not move.
    expect(request.model).toBe(CALLER_MODEL)
  })

  // ── condition 2 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-295_with_the_switch_on_the_consultant_gains_delegate_and_loses_nothing', async () => {
    // The grant is ADDITIVE. The consultant can still author a page itself, and
    // delegating is a decision it makes per piece of work rather than a
    // capability it lost — so what this asserts is a strict superset, not a
    // different set.
    const withoutSession = await openSession('additive-off')
    const off = scriptedClient([says('Fine.')])
    setModelClient(off)
    await drain(await post('/api/ai/prompt', { sessionId: withoutSession, text: 'Hello' }))
    const before = toolNames(off.seen[0])

    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const withSession = await openSession('additive-on')
    const on = scriptedClient([says('Fine.')])
    setModelClient(on)
    await drain(await post('/api/ai/prompt', { sessionId: withSession, text: 'Hello' }))
    const after = toolNames(on.seen[0])

    expect(after).toContain(DELEGATE_TOOL)
    for (const tool of before) expect(after).toContain(tool)
    // …and `report` is the WORKER'S half of the surface, never the caller's.
    expect(after).not.toContain(REPORT_TOOL)
    // AND THE METHOD PROSE ARRIVES WITH THE TOOL, in the same breath — a session
    // given a tool and no account of when to use it will use it badly.
    expect(systemText(on.seen[0])).toContain('Handing construction over')
  })

  // ── conditions 3, 4, 5, 6 ──────────────────────────────────────────────────

  it('test_UAT_FC_REQ-295_a_delegation_opens_a_worker_on_the_configured_backend_with_its_own_prose_and_grant', async () => {
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const sessionId = await openSession('worker')
    const client = delegationScript()
    setModelClient(client)

    await drain(await post('/api/ai/prompt', { sessionId, text: 'Build out the About page.' }))

    const workerTurns = workerRequests(client)
    expect(workerTurns.length).toBeGreaterThan(0)
    const first = workerTurns[0]

    // CONDITION 3, first half — the CONFIGURED backend decides the model and the
    // ceiling. The framework registers the adapter under a derived per-session
    // name; passing the configured one is what makes `backends.json`'s entry the
    // thing that is read.
    expect(first.model).toBe(WORKER_MODEL)
    expect(first.max_tokens).toBe(backendsDocument.claude_builder.max_tokens)
    // …and the caller did not move with it.
    for (const req of callerRequests(client)) expect(req.model).toBe(CALLER_MODEL)

    // THE WORKER READS THE BUILDER'S PROSE AND NEVER THE CONSULTANT'S, because
    // the framework opens it with `createSession(role, …)` and priming is
    // assembled by the ordinary path.
    const primed = systemText(first)
    expect(primed).toContain(primingText('builder-role').split('\n')[0])
    expect(primed).not.toContain('You are a design consultant')

    // CONDITION 5 — the worker's capabilities are the builder role's grant. A
    // brief asking for a page to be deleted would be refused, because the tool
    // is not there to call.
    const offered = toolNames(first)
    expect(offered).toContain('set_l1')
    expect(offered).toContain('get_l1')
    // Creating and deleting pages, publishing, and the site's configuration are
    // the consultant's judgement and not the builder's hands.
    expect(offered).not.toContain('add_page')
    expect(offered).not.toContain('delete_page')
    expect(offered).not.toContain('publish')
    // AND NOTHING THE CALLER DOES NOT ITSELF HAVE. The grant is a NARROWING of
    // the consultant's, so the worker's tools are a subset of the caller's plus
    // its own report — stated as a subset rather than as a list, because which
    // surfaces a deployment composes at all is its own business (this one has no
    // browser, so neither side has a camera).
    const callerTools = toolNames(callerRequests(client)[0])
    for (const tool of offered) {
      if (tool === REPORT_TOOL) continue
      expect(callerTools).toContain(tool)
    }
    // CONDITION 6 — and it cannot hand the work on again. `report` is the whole
    // of this surface a worker ever has.
    expect(offered).toContain(REPORT_TOOL)
    expect(offered).not.toContain(DELEGATE_TOOL)

    // THE BRIEF IS ONE TURN'S TEXT, not a system prompt, and it carries the
    // checks verbatim — a check the worker was never told about is one it
    // cannot answer.
    const brief = sentText(first)
    expect(brief).toContain('Lay out the About page')
    expect(brief).toContain(CHECK_MET)
    expect(brief).toContain(CHECK_UNANSWERED)
  })

  it('test_UAT_FC_REQ-295_the_caller_gets_a_result_and_never_the_workers_conversation', async () => {
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const sessionId = await openSession('result')
    const client = delegationScript()
    setModelClient(client)

    await drain(await post('/api/ai/prompt', { sessionId, text: 'Build out the About page.' }))

    // The caller's SECOND request is the one carrying the delegation's result.
    const back = callerRequests(client)[1]
    expect(back).toBeDefined()

    // CONDITION 3, second half — a RESULT, not a transcript. Parsed out of the
    // tool result the caller actually received rather than searched for as a
    // substring, so what is asserted is the shape the model is handed.
    const result = delegationResult(back)
    expect(result.summary).toBe('Built the About page with three sections.')
    expect(result.changed).toEqual(['about'])
    expect(result.decisions).toEqual([
      'Used the plainest heading scale, since the brief did not say.',
    ])
    expect(result.outcome).toBe('reported')
    // …and which side ran it, so a consultant reading its own transcript can
    // tell its own work from a worker's.
    expect(result.role).toBe(BUILDER_ROLE)
    expect(result.backend).toBe(delegationDocument.workers.builder.backend)
    expect(result.session).toMatch(/^worker-builder-/)

    // A VERDICT PER REQUESTED CHECK, reconciled against what the CALLER asked
    // for rather than against what the worker chose to mention.
    expect(result.checks).toEqual([
      { check: CHECK_MET, verdict: 'passed' },
      { check: CHECK_UNANSWERED, verdict: 'unreported' },
    ])
    // AND THE CHECK THE WORKER QUIETLY DROPPED IS NOT A PASS. Reporting it as
    // one is the single thing that must never happen: it would hand the caller a
    // false assurance and cost it exactly the inspection the check existed to
    // save. `accepted` is the one-glance answer and it is false.
    expect(result.accepted).toBe(false)

    // CONDITION 4 — the worker's turn-by-turn conversation is not the caller's.
    // The caller's own brief IS in its context, because it wrote it; what must
    // not be there is anything the worker said or was told. Returning those
    // tokens would put them straight back on the expensive side, which is the
    // whole thing the surface exists to avoid.
    const context = JSON.stringify(back.messages)
    expect(context).not.toContain('Reported.')
    expect(context).not.toContain(primingText('builder-role').split('\n')[0])
  })

  // ── conditions 7 and 8 ─────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-295_the_workers_spend_is_attributed_to_the_callers_turn', async () => {
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const sessionId = await openSession('spend')
    setModelClient(delegationScript())

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Build out the About page.' }, ctx))
    await settled()

    // THE ISOLATE THAT TOOK THE TURN IS GONE, which is the only sense in which a
    // meter reading is one.
    resetAiHost()
    resetChatHost()

    const rows = await meter(sessionId)
    expect(rows).toHaveLength(1)
    const row = rows[0]

    // The row is still the CALLER'S: its own counters, its own role, its own
    // model. A worker's tokens folded into those four would be priced at the
    // caller's rates, which is the error the two-level price key exists to stop.
    expect(row.role).toBe(CONSULTANT_ROLE)
    expect(row.model).toBe(CALLER_MODEL)

    // CONDITION 7 — and what it caused elsewhere, kept whole beside it. The
    // manager writes this onto the junction's `turn_end`, not onto the terminal
    // event, so a host reading only the event would record nothing at all here.
    expect(row.attributed).not.toBeNull()
    const attributed = JSON.parse(row.attributed!) as {
      session: string
      role: string
      backend: string
      usage: Record<string, number>
    }[]
    expect(attributed).toHaveLength(1)
    expect(attributed[0].role).toBe(BUILDER_ROLE)
    expect(attributed[0].backend).toBe(delegationDocument.workers.builder.backend)
    expect(attributed[0].session).toMatch(/^worker-builder-/)
    // The worker's own counters, as its adapter reported them — so the entry can
    // be priced at the worker's rates rather than the caller's.
    expect(attributed[0].usage.output_tokens).toBe(400)
  })

  it('test_UAT_FC_REQ-295_a_worker_that_never_reported_still_bills_the_caller_and_passes_nothing', async () => {
    // CONDITION 7's HARD HALF — "on every exit path". A delegation whose spend
    // vanished because the work went wrong would be the one accounting hole this
    // could introduce: the requests were SENT, whatever became of their answers.
    // A worker that simply never reports is the most ordinary form of that.
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const sessionId = await openSession('silent')
    const client = twoSided(
      [
        metered(
          { input_tokens: 9000, output_tokens: 200 },
          calls(DELEGATE_TOOL, {
            role: BUILDER_ROLE,
            goal: 'Lay out the About page.',
            accept: [CHECK_MET],
          }),
        ),
        says('That did not come back with anything; I will look myself.'),
      ],
      [metered({ input_tokens: 800, output_tokens: 250 }, says('I had a go.'))],
    )
    setModelClient(client)

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Build out the About page.' }, ctx))
    await settled()

    // The caller is told plainly that nothing came back, and NOT that the check
    // passed. `accepted` is the one-glance answer and it has to be false
    // wherever the caller still has work to do.
    const result = delegationResult(callerRequests(client)[1])
    expect(result.outcome).toBe('silent')
    expect(result.checks).toEqual([{ check: CHECK_MET, verdict: 'unreported' }])
    expect(result.accepted).toBe(false)

    resetAiHost()
    resetChatHost()

    // AND THE TOKENS ARE STILL ON THE BILL.
    const attributed = JSON.parse((await meter(sessionId))[0].attributed!) as {
      usage: Record<string, number>
    }[]
    expect(attributed).toHaveLength(1)
    expect(attributed[0].usage.output_tokens).toBe(250)
  })

  it('test_UAT_FC_REQ-295_the_workers_tool_calls_are_audited_under_its_own_session_id', async () => {
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const sessionId = await openSession('audit')
    setModelClient(delegationScript())

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Build out the About page.' }, ctx))
    await settled()

    resetAiHost()
    resetChatHost()

    // CONDITION 8. The records live under the caller's prefix, because that is
    // the turn that was flushed — and each one says which SIDE of the delegation
    // made it, which is the whole question an auditor is asking.
    const listed = await env.SITES.list({ prefix: `audit/${TENANT}/${sessionId}/` })
    expect(listed.objects.length).toBeGreaterThan(0)

    const records = await Promise.all(
      listed.objects.map(async (object) => {
        const stored = await env.SITES.get(object.key)
        return JSON.parse(await stored!.text()) as {
          operation: string
          session: string
          role: string
        }
      }),
    )

    const byWorker = records.filter((record) => record.session.startsWith('worker-builder-'))
    expect(byWorker.length).toBeGreaterThan(0)
    expect(byWorker.every((record) => record.role === BUILDER_ROLE)).toBe(true)
    expect(byWorker.map((record) => record.operation)).toContain('report')

    // …and the caller's own call is there too, under the caller's id. Both sides
    // are on the record; neither is recorded as the other.
    const byCaller = records.filter((record) => record.session === sessionId)
    expect(byCaller.map((record) => record.operation)).toContain('delegate')
  })
})
