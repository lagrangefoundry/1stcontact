import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { ADMIN_TURNS_PATH, resetChatHost, route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { metered, says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-166]] — **the ledger and the meter are two records of ONE turn, under one
 * id**, which is what makes the console's cost column possible at all.
 *
 * THE DEFECT, AND WHY NOTHING CAUGHT IT. [[REQ-320]] built a join: the console's
 * turn table takes its rows from `turn_log` and looks each turn's spend up in
 * `turn_spend` by `turn_id`. Both sides were right in isolation and both were
 * tested in isolation — the route's own suite plants a ledger row and a meter row
 * under an id it chose itself, and passes. What nobody asserted is that the
 * RUNNING SYSTEM ever writes those two rows under the same id, and it did not:
 * `openTurn` minted one in the route before the response existed, `streamPrompt`
 * minted another inside the turn, and the two could never be equal. Every cost on
 * the operator's console was a dash, on every row, from the day the column
 * shipped.
 *
 * WHAT MAKES THIS EVIDENCE. One real turn, through the real `POST /api/ai/prompt`
 * inside workerd — the real route, the real ledger open-and-close, the real
 * session manager and tool loop, the real meter write, against a real D1 carrying
 * the deployed migrations. The one double is the Anthropic client, which is the
 * network. Then the operator's own read, `GET /api/admin/turns`, through
 * `route()` with an `Admission` minted from real rows: what the console would
 * actually paint.
 *
 * THE FALSIFIERS:
 *
 *   - *two rows under two ids*, which is the bug — provable only by taking a turn
 *     and comparing the two tables, never by planting either;
 *   - *a dash on the operator's surface for a turn that was measured*, which is
 *     the symptom the operator reported;
 *   - *a meter row with no ledger row to join to*, which would mean the id had
 *     been threaded the wrong way and the death-detection record lost.
 */

const PLATFORM = 'bug166-platform'
const SPENDER = 'bug166-spender'

function workerEnv(tenantId: string): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as unknown as Env
}

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
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

const post = (
  path: string,
  body: unknown,
  opts: { ctx?: ExecutionContext; tenantId?: string } = {},
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(opts.tenantId ?? SPENDER),
    opts.ctx,
  )

/** Drain an SSE response to completion — the turn, from the client's side. */
async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

async function operator(): Promise<Admission> {
  const email = 'bug166-operator@example.test'
  await ensurePlatformOperator(identityEnv(), email)
  const admission = await admit(identityEnv(), email)
  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
  return admission
}

interface TurnRow {
  turn: string
  state: string
  principalMicros: number | null
  delegatedMicros: number | null
}

async function consoleTurns(business: string): Promise<TurnRow[]> {
  const answer = await route(
    new Request(`https://app.example${ADMIN_TURNS_PATH}?business=${business}`),
    routerEnv(),
    { businessId: PLATFORM },
    { admission: await operator() } as never,
  )
  expect(answer.status).toBe(200)
  return ((await answer.json()) as { turns: TurnRow[] }).turns
}

describe('BUG-166 — one turn, one id', () => {
  beforeAll(async () => {
    await applySchema()
    await operator()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-166_a_real_turn_writes_its_ledger_and_its_meter_under_one_id', async () => {
    const { site } = await seedTenantSite(SPENDER, { slug: nextSlug('joined') })
    const opened = await post('/api/ai/session', { site })
    expect(opened.status).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    setModelClient(
      scriptedClient([
        metered(
          {
            input_tokens: 2_000,
            output_tokens: 400,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          },
          says('Your home page looks fine.'),
        ),
      ]),
    )

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'How does it look?' }, { ctx }))
    // AWAITING WHAT THE ROUTE REGISTERED, not a timer: the meter is written in
    // the turn's own `finally`, after the `done` frame has already gone out.
    await settled()

    // THE ISOLATE THAT TOOK THE TURN IS GONE, which is the state the console
    // reads in: both records are now only what survived to D1.
    resetAiHost()
    resetChatHost()

    const ledger = await env.DB.prepare(
      'SELECT turn_id FROM turn_log WHERE session_id = ?',
    )
      .bind(sessionId)
      .all<{ turn_id: string }>()
    const meter = await env.DB.prepare(
      'SELECT turn_id, cost_micros FROM turn_spend WHERE session_id = ?',
    )
      .bind(sessionId)
      .all<{ turn_id: string; cost_micros: number | null }>()

    // ONE TURN LEFT ONE OF EACH, which is the precondition the claim needs: two
    // ledger rows or two meter rows would make "the ids are equal" an accident.
    expect(ledger.results).toHaveLength(1)
    expect(meter.results).toHaveLength(1)

    // AND THEY ARE THE SAME TURN. This is the whole bug: before the fix these two
    // strings were independently minted and could never agree, so the join the
    // console performs matched nothing.
    expect(meter.results![0].turn_id).toBe(ledger.results![0].turn_id)
    // The meter genuinely measured this turn — an equality between two nulls, or
    // between two empty strings, would satisfy the line above and prove nothing.
    expect(ledger.results![0].turn_id).toMatch(/^turn_[0-9a-f]+$/)
    expect(meter.results![0].cost_micros).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-166_the_operators_turn_table_shows_a_cost_rather_than_a_dash', async () => {
    // THE SYMPTOM AS REPORTED, at the surface that reported it: *"in the turns I
    // see a cost column, but no costs, they are all —"*. The route is the console's
    // own read, and a principal figure arriving here is the join landing end to end.
    const { site } = await seedTenantSite(SPENDER, { slug: nextSlug('shown') })
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }

    setModelClient(
      scriptedClient([
        metered(
          {
            input_tokens: 5_000,
            output_tokens: 1_000,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          },
          says('Done.'),
        ),
      ]),
    )

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Rename the page.' }, { ctx }))
    await settled()
    resetAiHost()
    resetChatHost()

    const rows = await consoleTurns(SPENDER)
    const taken = rows.find((row) => row.state === 'complete')
    expect(taken).toBeTruthy()
    // A FIGURE, NOT A DASH. `null` is what the surface renders as `—`, and it was
    // what every row of this table carried.
    expect(taken!.principalMicros).not.toBeNull()
    expect(taken!.principalMicros).toBeGreaterThan(0)
    // NOTHING WAS DELEGATED, so that half is absent — never a zero, which would
    // claim a delegation that came free.
    expect(taken!.delegatedMicros).toBeNull()
  })
})
