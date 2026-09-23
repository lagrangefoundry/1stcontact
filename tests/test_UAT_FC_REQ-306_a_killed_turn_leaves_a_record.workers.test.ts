import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { pacedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-306]] — **a turn that dies uncatchably still reports legibly**.
 *
 * WHAT WAS WRONG, and why nobody could see it. `streamTurn` returns its
 * `Response` before `start()` runs, so the headers are gone before the work
 * begins. When the isolate was killed mid-stream the customer received a 200
 * with an empty body and no terminal frame; the `catch` that renders a readable
 * error never ran and the `finally` that flushes the audit died with it. EVERY
 * record this system kept of a turn — the audit, the meter's row, the pending
 * record's close — is written by code that runs after the model call, so an
 * uncatchable end left nothing at all behind. A whole tenant failed every turn
 * for a period before anyone established why, and the only trace was a
 * Cloudflare tail entry somebody eventually went looking for.
 *
 * WHY THESE TESTS PACE THE MODEL, which is the same reason [[BUG-46]]'s suite
 * does: the claim is about what is true DURING a turn. A double that answers in
 * one go never produces that state, so a suite built on the instant client could
 * assert all of this and pass just as well against the unfixed code.
 *
 * HOW AN ISOLATE DEATH IS STOOD IN FOR, and why the substitution is faithful.
 * Nothing tears an isolate down under vitest. But what a death actually destroys
 * is observable and nameable: the RAM junction that holds the in-flight turn
 * (`ai.ts`), which is what `live` is computed from. `resetAiHost()` +
 * `resetChatHost()` destroy exactly that and nothing else — the D1 rows survive,
 * as they would — so afterwards the system is in precisely the state a killed
 * isolate leaves: a ledger row nobody closed, and no junction that can account
 * for it. The fixed code is the code that can tell those two facts apart.
 *
 * THE FALSIFIERS:
 *
 *   - *a record written in the `finally`*, which is the bug: it would be absent
 *     for the whole duration of the turn, and absent forever if the turn died.
 *     Every case here reads the row BEFORE the turn is allowed to finish;
 *   - *a turn refused because its ledger could not be written*, which would
 *     trade the customer's answer for the operator's record;
 *   - *an abandoned turn recorded as a death*, which would make the ledger cry
 *     wolf on every reload;
 *   - *a failure with no reason*, leaving an operator the same tail-reading they
 *     had before;
 *   - *the customer told the connection dropped* when the ledger knows it did
 *     not.
 */

const TENANT = 'req306'

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
  }
}

/**
 * An `ExecutionContext` that KEEPS what it is handed, so a test can await it.
 *
 * [[BUG-46]]'s apparatus, needed here for its reason. The prompt route registers
 * the stream's completion with `waitUntil`, and the ledger's CLOSE runs inside
 * that completion — after the terminal frame has reached the client. A test that
 * stopped reading at `done` and looked at the row immediately would see it still
 * open and would be right to: in production the runtime is what holds the
 * isolate open past the response, and here the collected promises ARE that
 * extension. Awaiting exactly them is the test standing in for the runtime.
 */
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
    ctx ?? ({ waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext),
  )

interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/**
 * Read `data:` frames ONE AT A TIME, rather than draining the body.
 *
 * `await response.text()` cannot be used by any case here: it does not return
 * until the turn is over, and every claim below is about what is durable while
 * the turn is still running. This is [[BUG-46]]'s reader, for its reason.
 */
function frameReader(response: Response): {
  next: () => Promise<Frame | null>
  drain: () => Promise<Frame[]>
} {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const queued: Frame[] = []
  const next = async (): Promise<Frame | null> => {
    for (;;) {
      if (queued.length > 0) return queued.shift()!
      const { value, done } = await reader.read()
      if (done) return null
      buffer += decoder.decode(value, { stream: true })
      let split
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, split).trim()
        buffer = buffer.slice(split + 2)
        if (frame.startsWith('data:')) queued.push(JSON.parse(frame.slice(5).trim()) as Frame)
      }
    }
  }
  return {
    next,
    drain: async () => {
      const all: Frame[] = []
      for (;;) {
        const frame = await next()
        if (frame === null) return all
        all.push(frame)
        if (frame.kind === 'done') return all
      }
    },
  }
}

interface LedgerRow {
  turn_id: string
  tenant_id: string
  session_id: string
  started_at: string
  ended_at: string | null
  outcome: string | null
  detail: string | null
}

/** The ledger's rows for one conversation, read straight out of D1. */
async function ledger(sessionId: string): Promise<LedgerRow[]> {
  const rows = await env.DB.prepare(
    'SELECT * FROM turn_log WHERE session_id = ? ORDER BY started_at ASC',
  )
    .bind(sessionId)
    .all<LedgerRow>()
  return rows.results ?? []
}

async function openFor(prefix: string): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  return { site, sessionId }
}

describe('REQ-306 — a turn that dies uncatchably still leaves a record', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-306_the_turn_is_recorded_before_its_first_byte', async () => {
    // THE WHOLE MECHANISM, PUT AS ONE OBSERVATION. The route awaits the ledger's
    // insert before it hands back a `Response`, so by the time the caller HOLDS
    // that response — before a single frame has been read, before the model has
    // been asked anything — the record already exists. That ordering is the only
    // reason a killed isolate leaves anything at all: everything else this
    // system writes about a turn is written by code that runs afterwards.
    const { sessionId } = await openFor('before')
    const model = pacedClient('Starting. ', 'Finished.')
    setModelClient(model)

    const response = await post('/api/ai/prompt', { sessionId, text: 'Change the heading.' })
    expect(response.status).toBe(200)

    const opened = await ledger(sessionId)
    expect(opened).toHaveLength(1)
    // OPEN, WHICH IS THE POINT. `ended_at` is written by the `finally` — the
    // block a killed isolate never reaches — so its absence here is the same
    // absence a death leaves behind, observed at a moment we can stand at.
    expect(opened[0].ended_at).toBeNull()
    expect(opened[0].outcome).toBeNull()
    // REQUIREMENT 4 — the row names the business, the conversation and the turn,
    // which is everything needed to find the incident without a platform tail.
    expect(opened[0].tenant_id).toBe(TENANT)
    expect(opened[0].session_id).toBe(sessionId)
    expect(opened[0].turn_id).toMatch(/^turn_[0-9a-f]{32}$/)

    // AND IT IS STILL OPEN WHILE THE TURN RUNS, not merely at the instant the
    // response was constructed — so nothing between here and the terminal frame
    // is quietly closing it early.
    const turn = frameReader(response)
    expect((await turn.next())?.content).toBe('Starting. ')
    expect((await ledger(sessionId))[0].ended_at).toBeNull()

    model.release()
    await turn.drain()
  })

  it('test_UAT_FC_REQ-306_a_completed_turn_closes_its_own_row', async () => {
    // THE OTHER HALF OF THE SIGNAL. An open row only means a death because a
    // turn that lives closes its own. Without this the ledger would report every
    // turn as lost, which is a surface nobody would read twice.
    const { sessionId } = await openFor('closes')
    const model = pacedClient('Half. ', 'And the rest.')
    setModelClient(model)

    // THROUGH THE COLLECTING CONTEXT, because the close is part of the drain the
    // route registers with `waitUntil` — which is also the claim: the record is
    // finished by the same mechanism that makes a completed turn durable at all,
    // rather than by anything the client is still waiting for.
    const { ctx, settled } = collectingCtx()
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Say two halves.' }, ctx),
    )
    await turn.next()
    model.release()
    await turn.drain()
    await settled()

    const [row] = await ledger(sessionId)
    expect(row.outcome).toBe('complete')
    expect(row.ended_at).not.toBeNull()
    // NOTHING TO EXPLAIN, AND SO NOTHING SAID. An empty string here would claim
    // the turn had reported something.
    expect(row.detail).toBeNull()
  })

  it('test_UAT_FC_REQ-306_a_failed_turn_records_why', async () => {
    // REQUIREMENT 3, IN ITS CATCHABLE FORM. A turn that throws still reaches the
    // `finally`, so the row closes — and closes with the REASON, which is what
    // spares an operator the tail-reading the ticket is about. The detail goes
    // through the same scrub as the frame the customer sees, because this row is
    // read back by a console and by the panel's own recovery.
    const { sessionId } = await openFor('failed')
    setModelClient({
      messages: {
        create: async () => {
          throw new Error('the model refused: test-key-not-a-real-one is not a key')
        },
      },
    } as never)

    const { ctx, settled } = collectingCtx()
    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Break.' }, ctx))
    await turn.drain()
    await settled()

    const [row] = await ledger(sessionId)
    expect(row.outcome).toBe('error')
    expect(row.ended_at).not.toBeNull()
    expect(row.detail).toContain('the model refused')
    expect(row.detail).not.toContain('test-key-not-a-real-one')
  })

  it('test_UAT_FC_REQ-306_a_dead_isolate_is_reported_to_the_customer_as_a_failure', async () => {
    /**
     * REQUIREMENTS 1 AND 2, WHICH ARE THE CUSTOMER'S HALF.
     *
     * The turn is started for real and never finishes. Then the RAM junction —
     * the only thing an isolate death actually destroys that anything can
     * observe — is thrown away, leaving exactly what a kill leaves: a ledger row
     * nobody closed, and no live turn to account for it.
     *
     * RE-OPENING THE CONVERSATION IS WHAT THE PANEL DOES NEXT, so this is the
     * shipped path and not a bespoke read. What comes back must DISTINGUISH this
     * from a dropped socket, which is requirement 1, and must be true, which is
     * requirement 2: the connection was fine.
     */
    const { site, sessionId } = await openFor('killed')
    const model = pacedClient('It began. ', 'It never got here.')
    setModelClient(model)

    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Change the logo.' }))
    expect((await turn.next())?.content).toBe('It began. ')

    // THE KILL. Everything in RAM goes; everything durable stays.
    resetAiHost()
    resetChatHost()

    const reopened = await post('/api/ai/session', { site })
    expect(reopened.status).toBe(200)
    const painted = (await reopened.json()) as {
      live?: boolean
      failed: { turn: string; at: string; state: string; detail: string | null } | null
    }

    expect(painted.live).not.toBe(true)
    // NOT AMBIGUOUS AND NOT A GUESS ABOUT A SOCKET — the origin says the turn
    // died, and names the row an operator can look it up by.
    expect(painted.failed?.state).toBe('lost')
    expect(painted.failed?.turn).toBe((await ledger(sessionId))[0].turn_id)
  })

  it('test_UAT_FC_REQ-306_a_conversation_whose_last_turn_finished_reports_no_failure', async () => {
    // THE FALSIFIER FOR THE CASE ABOVE. A notice that appeared after every
    // ordinary turn would be worth exactly nothing, and would teach the customer
    // to ignore the one that mattered.
    const { site, sessionId } = await openFor('quiet')
    const model = pacedClient('All ', 'done.')
    setModelClient(model)

    const { ctx, settled } = collectingCtx()
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Say all done.' }, ctx),
    )
    await turn.next()
    model.release()
    await turn.drain()
    await settled()

    resetAiHost()
    resetChatHost()

    const reopened = (await (await post('/api/ai/session', { site })).json()) as {
      failed: unknown | null
    }
    expect(reopened.failed).toBeNull()
    expect((await ledger(sessionId))[0].outcome).toBe('complete')
  })
})
