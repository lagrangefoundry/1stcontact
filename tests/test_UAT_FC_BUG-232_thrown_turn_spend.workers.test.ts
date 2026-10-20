import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { calls, metered, says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-232]] — **a turn that ends by throwing still records what it spent**.
 *
 * WHAT WAS WRONG. The host read a turn's spend off the manager's terminal `done`
 * event and nowhere else. On a throw the manager rethrows without emitting one,
 * so the meter wrote a row of zeros (or nothing) for a turn that had run for
 * minutes and sent real, billed requests. The spend was not lost upstream: the
 * tool loop reports it before rethrowing (framework BUG-73) and the manager folds
 * it onto the junction's `turn_end` record. This host now reads it from there.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real manager and tool loop, the real `ClaudeAPIBackend`, a real D1. The one
 * double is the Anthropic client, which reports usage the way the wire does, and
 * whose third request throws the way a failing provider call does.
 */

const TENANT = 'bug232'
const FAILURE = 'Unexpected token \'g\', "guWid6rN1D"... is not valid JSON'

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

/** BUG-46's collecting context: the test standing in for the runtime's `waitUntil`. */
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

interface SpendRow {
  outcome: string
  requests: number
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
  cost_micros: number | null
}

/** The meter, read straight out of D1 — not through the writer's own module. */
async function meter(sessionId: string): Promise<SpendRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM turn_spend WHERE session_id = ? ORDER BY started_at, rowid',
  )
    .bind(sessionId)
    .all<SpendRow>()
  return results ?? []
}

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

async function openFor(prefix: string): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
}

/** One turn, driven to the end and with its `finally` settled. */
async function turn(sessionId: string, text: string): Promise<void> {
  const { ctx, settled } = collectingCtx()
  await drain(await post('/api/ai/prompt', { sessionId, text }, ctx))
  await settled()
}

const fails = () => {
  throw new Error(FAILURE)
}

describe('BUG-232 — a turn that throws is metered from its turn_end', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-232_a_turn_that_throws_after_billed_requests_records_them', async () => {
    // Required behaviour 1: two requests were sent and paid for, then the tool
    // loop threw on the third. The row carries both requests' counters, a
    // settled cost, and says the turn ended in error.
    const sessionId = await openFor('thrown')
    const client = scriptedClient([
      metered(
        { input_tokens: 900, output_tokens: 40, cache_creation_input_tokens: 300 },
        calls('list_pages', {}),
      ),
      metered({ input_tokens: 1100, output_tokens: 60, cache_read_input_tokens: 300 }, calls('list_pages', {})),
      fails,
    ])
    setModelClient(client)

    await turn(sessionId, 'What pages exist?')
    // The loop really reached the request that failed.
    expect(client.seen).toHaveLength(3)

    // THE ISOLATE THAT TOOK THE TURN IS GONE: the row is all that is left.
    resetAiHost()
    resetChatHost()

    const rows = await meter(sessionId)
    expect(rows).toHaveLength(1)
    const [row] = rows
    expect(row.outcome).toBe('error')
    expect(row.requests).toBe(2)
    expect(row.input_tokens).toBe(2000)
    expect(row.output_tokens).toBe(100)
    expect(row.cache_creation_input_tokens).toBe(300)
    expect(row.cache_read_input_tokens).toBe(300)
    // PRICED, not zero and not unknown: these requests were measured.
    expect(row.cost_micros).not.toBeNull()
    expect(row.cost_micros!).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-232_a_completed_turn_still_reads_its_terminal_event', async () => {
    // Required behaviour 2: the terminal event stays the first source, and a
    // completed turn's row is exactly what it was before this fix.
    const sessionId = await openFor('completed')
    setModelClient(
      scriptedClient([
        metered({ input_tokens: 900, output_tokens: 40 }, calls('list_pages', {})),
        metered({ input_tokens: 1100, output_tokens: 80 }, says('You have one page: home.')),
      ]),
    )

    await turn(sessionId, 'What pages exist?')

    const rows = await meter(sessionId)
    expect(rows).toHaveLength(1)
    expect(rows[0].outcome).toBe('complete')
    expect(rows[0].requests).toBe(2)
    expect(rows[0].input_tokens).toBe(2000)
    expect(rows[0].output_tokens).toBe(120)
    expect(rows[0].cost_micros).not.toBeNull()
  })

  it('test_UAT_FC_BUG-232_a_throw_before_any_request_claims_nothing', async () => {
    // Required behaviour 3: a turn whose `turn_end` measured nothing still writes
    // no counters and no cost. Unknown is not zero.
    //
    // AFTER A METERED TURN, deliberately: the junction then already holds a
    // `turn_end` carrying real spend. The failing turn must read only its own
    // record, never fall back to the previous turn's and bill it twice.
    const sessionId = await openFor('nothing')
    setModelClient(
      scriptedClient([metered({ input_tokens: 700, output_tokens: 25 }, says('All done.')), fails]),
    )

    await turn(sessionId, 'First, a turn that completes.')
    await turn(sessionId, 'Then one whose first request fails.')

    const rows = await meter(sessionId)
    // ONE ROW, the completed turn's. The failed turn sent nothing billable, so
    // it has no row: a row of zeros would claim it was free.
    expect(rows).toHaveLength(1)
    expect(rows[0].outcome).toBe('complete')
    expect(rows[0].input_tokens).toBe(700)
  })
})
