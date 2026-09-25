import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE, CONSULTANT_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  tenantDelegatedSpend,
  tenantSpendReport,
  type SpendEnv,
} from '../apps/control-app/src/spend'
import {
  calls,
  metered,
  says,
  scriptedClient,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-145]] — **the turn died; the worker's bill did not.**
 *
 * THE END-TO-END HALF. The sibling node suite pins the rule where it is decided,
 * in one function, over no database at all. This drives the REAL route inside
 * workerd — `POST /api/ai/prompt`, the real session manager, the real delegation
 * surface, the real tool loop on both sides of the hand-off, a real D1 whose
 * `turn_spend` table comes from the migration — and makes the caller's turn fail
 * the way the reported instance failed: after the worker had already run to
 * completion, and before the caller's own terminal meta ever arrived.
 *
 * WHY THAT SHAPE IS THE EVIDENCE. The observed loss was not a rare race. The
 * manager writes `attributed` onto the junction's `turn_end` from its own
 * `finally`, so a delegation is accounted for on every exit path (REQ-295); the
 * caller's `{usage, requests}` rides the terminal `done` event, which exists on
 * exactly one. Every exit in between — the `D1_ERROR` that prompted this ticket,
 * an abandoned stream — used to discard a completed worker along with the
 * caller's absent measurement. Half of every worker that had ever run was
 * invisible to the meter for that reason.
 *
 * WHAT IS PINNED:
 *
 *   1. the failed turn leaves a `turn_spend` row at all;
 *   2. that row's `attributed` names the worker, with the worker's own counters;
 *   3. its `cost_micros` is NULL — the caller's own spend was not observed, and
 *      a `0` would claim the turn was free;
 *   4. REQ-293's delegated split counts it, priced on the WORKER's backend,
 *      which is the number EPIC-20 steers by and the one that was short by half.
 */

const TENANT = 'bug145'

/** The switch as an enabling deployment installs it. */
const ENABLED = { ...delegationDocument, enabled: true }

const WORKER_MODEL = backendsDocument.claude_builder.model
const CALLER_MODEL = backendsDocument.claude.model

/** The operations' MODEL-FACING names, which are not their operation ids. */
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

/** What the caller's second request fails with — a database, as it happens. */
const TURN_FAILURE = 'D1_ERROR: string or blob too big: SQLITE_TOOBIG'

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
  return { ctx, settled: () => Promise.allSettled(held) }
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

/** Read the stream to its end, however it ends. The turn under test fails. */
async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  try {
    for (;;) {
      const { done } = await reader.read()
      if (done) return
    }
  } catch {
    // A turn that failed mid-stream is the subject, not a broken fixture.
  }
}

async function openSession(prefix: string): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
}

/**
 * One double, two conversations, told apart by the model they are addressed to —
 * REQ-295's own arrangement, for its reason: the host injects ONE client and the
 * caller's backend and the worker's are both built from it, so `req.model` is
 * the only thing that tells the two apart.
 */
function twoSided(caller: ModelStep[], workerScript: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] =
      req.model === WORKER_MODEL ? [workerScript, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

/** One stored meter row, as much of it as this case reads. */
interface SpendRow {
  session_id: string
  role: string
  model: string
  outcome: string
  requests: number
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
  attributed: string | null
  cost_micros: number | null
}

/** The database, in the shape the two readers take it. */
const DB = (): SpendEnv => ({ DB: env.DB as D1Database })

async function meter(sessionId: string): Promise<SpendRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM turn_spend WHERE session_id = ? ORDER BY started_at, rowid',
  )
    .bind(sessionId)
    .all<SpendRow>()
  return results ?? []
}

describe('BUG-145 — a delegation outlives the turn that caused it', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-145_a_turn_that_fails_after_delegating_still_bills_the_worker', async () => {
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const sessionId = await openSession('lost')
    const client = twoSided(
      [
        // THE CALLER HANDS OVER THE WORK, and its own first request is NOT
        // metered — which is what makes this the reported shape rather than a
        // convenient one. The turn's `{usage, requests}` arrives on the terminal
        // `done` event and nowhere else, so a turn that never reaches one has
        // measured nothing whatever its requests actually cost.
        calls(DELEGATE_TOOL, {
          role: BUILDER_ROLE,
          goal: 'Lay out the About page as three sections: intro, team, contact.',
          accept: ['every section has a heading'],
        }),
        // …AND THEN DIES, with the worker's result already in hand. This is the
        // 11:49 turn: a database refused a write after seventy tool calls had
        // been made and paid for on the other side of the hand-off.
        () => {
          throw new Error(TURN_FAILURE)
        },
      ],
      [
        metered(
          { input_tokens: 800, output_tokens: 400, cache_creation_input_tokens: 150 },
          calls(REPORT_TOOL, {
            summary: 'Built the About page with three sections.',
            changed: ['about'],
            decisions: ['Used the plainest heading scale, since the brief did not say.'],
            passed: ['every section has a heading'],
          }),
        ),
        says('Reported.'),
      ],
    )
    setModelClient(client)

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Build out the About page.' }, ctx))
    await settled()

    // THE ISOLATE THAT TOOK THE TURN IS GONE, which is the only sense in which a
    // meter reading is one.
    resetAiHost()
    resetChatHost()

    // CONDITION 1 — THE ROW EXISTS. Before this fix there was none, and the
    // worker below was simply not in the record.
    const rows = await meter(sessionId)
    expect(rows).toHaveLength(1)
    const row = rows[0]

    // CONDITION 2 — and it names the worker, whole, with the worker's OWN
    // counters, so the entry can be priced against the worker's key rather than
    // folded into a caller's row that measured nothing.
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
    expect(attributed[0].usage.output_tokens).toBe(400)

    // CONDITION 3 — AND THE ROW DISCLAIMS THE CALLER'S OWN SPEND RATHER THAN
    // CLAIMING IT WAS NIL. The four counters are zero because the columns are
    // `NOT NULL` and the row is unambiguous without a migration; `cost_micros`
    // is the column that says so, and it is NULL even though the caller's
    // `(backend, model)` is priced.
    expect(row.cost_micros).toBeNull()
    expect(row.input_tokens).toBe(0)
    expect(row.output_tokens).toBe(0)
    expect(row.cache_read_input_tokens).toBe(0)
    expect(row.cache_creation_input_tokens).toBe(0)
    expect(row.requests).toBe(0)

    // …and the turn's real end is recorded, which is what makes a row with no
    // counters legible to whoever finds it rather than mysterious.
    expect(row.outcome).toBe('error')
    expect(row.role).toBe(CONSULTANT_ROLE)
    expect(row.model).toBe(CALLER_MODEL)

    // CONDITION 4 — AND REQ-293'S SPLIT COUNTS IT, on the delegated side and at
    // the WORKER's rates. This is the number EPIC-20 steers by, and the one that
    // was short by half for as long as a failed caller could take its worker
    // down with it.
    const delegated = await tenantDelegatedSpend(DB(), TENANT)
    expect(delegated).not.toBeNull()
    expect(delegated!.entries).toBeGreaterThanOrEqual(1)
    expect(delegated!.byModel[WORKER_MODEL]).toBeDefined()
    expect(delegated!.byModel[WORKER_MODEL].backend).toBe(
      delegationDocument.workers.builder.backend,
    )
    expect(delegated!.byModel[WORKER_MODEL].costMicros).toBeGreaterThan(0)

    // THE TWO FIGURES STAY TWO. The tenant's OWN report does not gain the
    // worker's money — a reader that summed the four counters is unaffected by
    // this row, which is the whole of what makes the widening safe.
    const own = await tenantSpendReport(DB(), TENANT)
    expect(own.turns).toBe(1)
    expect(own.costMicros).toBeNull()
    // …and the row is counted among the unpriced, which is the one figure this
    // widening genuinely moves: an alarm named for a `prices.json` that had
    // fallen behind now also counts a turn whose own spend was never observed.
    // Stated rather than hidden, and not worth a column of its own at this
    // volume.
    expect(own.unpricedTurns).toBe(1)
  })
})
