import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ADMIN_TURNS_PATH, route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-320]] — **`GET /api/admin/turns` joins the meter to the ledger, so the
 * console can say what a turn cost**.
 *
 * WHY THIS IS A ROUTE TEST AND NOT A SURFACE ONE. The figure was not on this wire
 * at all. `turn_log` knows when a turn began and how it ended and nothing about
 * money; the cost lives in `turn_spend` under the same `turn_id`. So what has to
 * be proved here is the JOIN — against a real D1 with the deployed migrations and
 * the real `prices.json`, reached through `route()` with an `Admission` minted
 * from real rows.
 *
 * THE FIGURE IS THE TURN'S TOTAL. A turn that handed a sweep of site writes to a
 * worker cost what the worker cost, and a column carrying only the caller's half
 * would make exactly the expensive turns look cheap — which is the thing EPIC-20
 * is trying to read. `attributedSpend` prices each delegated entry at its OWN
 * backend's published rates, and this route sums the two halves.
 *
 * THE FALSIFIERS:
 *
 *   - *the caller's `cost_micros` alone*, which under-reports every delegation in
 *     the flattering direction;
 *   - *`0` for a turn with no meter row*, which claims a turn that died was free
 *     — in-flight, died and failed-early turns have no row at all and are the
 *     common case here;
 *   - *a figure for a turn whose pair `prices.json` does not name*, which would
 *     publish a guess as a measurement;
 *   - *a partial total for a delegation this reader cannot price*, which is the
 *     same understatement wearing a number;
 *   - *one business's meter read against another's*, which a `turn_id` lookup
 *     unscoped by tenant would permit.
 */

const PLATFORM = 'req320-platform'
const SPENDER = 'req320-spender'

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

const ask = async (path: string, admission: Admission | null): Promise<Response> =>
  route(new Request(`https://app.example${path}`), routerEnv(), { businessId: PLATFORM }, {
    admission,
  } as never)

async function operator(): Promise<Admission> {
  const email = 'req320-operator@example.test'
  await ensurePlatformOperator(identityEnv(), email)
  const admission = await admit(identityEnv(), email)
  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
  return admission
}

/** One ledger row — what `openTurn`/`closeTurn` leave behind. */
async function ledger(tenant: string, turn: string, startedAt: string): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO turn_log (turn_id, tenant_id, session_id, started_at, ended_at, outcome, detail)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(turn, tenant, `site-${tenant}`, startedAt, startedAt, 'complete', null)
    .run()
}

/** One meter row — what the turn's `finally` writes, if it survives to write it. */
async function meter(
  tenant: string,
  turn: string,
  startedAt: string,
  costMicros: number | null,
  attributed: unknown[] | null = null,
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO turn_spend (turn_id, tenant_id, session_id, started_at, ended_at, role,' +
      ' backend, model, outcome, requests, input_tokens, output_tokens,' +
      ' cache_read_input_tokens, cache_creation_input_tokens, attributed, cost_micros)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      turn,
      tenant,
      `site-${tenant}`,
      startedAt,
      startedAt,
      'consultant',
      'claude',
      'claude-opus-5',
      'complete',
      3,
      1_000,
      500,
      0,
      0,
      attributed === null ? null : JSON.stringify(attributed),
      costMicros,
    )
    .run()
}

/**
 * A delegated worker as the framework attributes it: its own backend and no
 * model, which is why the entry is priced against `backends.json`'s binding.
 *
 * `claude_builder` RUNS THE CHEAP MODEL, and that is the point of pricing an
 * entry at its own key rather than at the caller's: 10,000 input tokens and 2,000
 * output at `claude-haiku-4-5`'s published $1 / $5 per million is 20,000 micros,
 * where the same tokens at the caller's `claude-opus-5` would be 60,000.
 */
const WORKER = {
  session: 'site-req320-spender-worker',
  role: 'builder',
  backend: 'claude_builder',
  usage: {
    input_tokens: 10_000,
    output_tokens: 2_000,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  },
}
const WORKER_MICROS = 20_000

interface Answer {
  turns: { turn: string; state: string; costMicros: number | null }[]
}

const at = (minutesAgo: number): string => new Date(Date.now() - minutesAgo * 60_000).toISOString()

async function turnsOf(business: string): Promise<Answer['turns']> {
  const answer = (await (
    await ask(`${ADMIN_TURNS_PATH}?business=${business}`, await operator())
  ).json()) as Answer
  return answer.turns
}

const costOf = (turns: Answer['turns'], turn: string): number | null | undefined =>
  turns.find((row) => row.turn === turn)?.costMicros

beforeAll(async () => {
  await applySchema()
  await operator()
})

describe('REQ-320 — the turn table carries what each turn cost', () => {
  it('test_UAT_FC_REQ-320_a_turn_is_priced_at_its_own_spend_plus_what_it_handed_off', async () => {
    // THE CASE THE COLUMN EXISTS FOR. Two turns of one business, both metered:
    // one did its own work, the other delegated a sweep to a worker. The
    // delegating turn's own half is the SMALLER of the two figures, so a route
    // reporting `cost_micros` alone would rank the cheap turn as the dear one.
    const own = 'turn_req320_own'
    const delegating = 'turn_req320_delegating'
    await ledger(SPENDER, own, at(3))
    await meter(SPENDER, own, at(3), 900_000)
    await ledger(SPENDER, delegating, at(2))
    await meter(SPENDER, delegating, at(2), 1_500_000, [WORKER])

    const turns = await turnsOf(SPENDER)
    expect(costOf(turns, own)).toBe(900_000)
    expect(costOf(turns, delegating)).toBe(1_500_000 + WORKER_MICROS)
    // The delegated half is a real addition and not a rounding artefact: the
    // total is strictly more than the caller's own row.
    expect(costOf(turns, delegating)).toBeGreaterThan(1_500_000)
  })

  it('test_UAT_FC_REQ-320_a_turn_with_no_meter_row_is_absent_and_never_zero', async () => {
    // WHAT MAKES ABSENCE THE COMMON CASE. A turn in flight has not written a
    // meter row yet; a turn whose isolate died never will; a turn that failed
    // before its terminal meta arrived wrote none either. `null` is what the
    // surface renders as a dash, and `0` would claim the outage was free.
    const quiet = 'req320-unmetered'
    const flying = 'turn_req320_in_flight'
    await ledger(quiet, flying, at(1))

    const turns = await turnsOf(quiet)
    expect(turns).toHaveLength(1)
    expect(costOf(turns, flying)).toBeNull()
  })

  it('test_UAT_FC_REQ-320_an_unpriced_turn_is_absent_rather_than_understated', async () => {
    /**
     * TWO WAYS A TOTAL CAN BE UNKNOWN, AND NEITHER MAY BE PUBLISHED AS A FIGURE.
     *
     * A turn whose `(backend, model)` pair `prices.json` does not name is written
     * with its counters intact and `cost_micros` NULL — *measured but not priced*,
     * recoverable later. And a DELEGATED entry the reader cannot price is the same
     * problem one level down, except that it is the half likely to be the large
     * one: an entry with no usage at all is not a delegation that cost nothing, it
     * is one nobody measured.
     *
     * In both cases the answer is *not measured*, because a sum that quietly omits
     * a component understates in the flattering direction — which is the exact
     * failure this column was added to end.
     */
    const business = 'req320-unpriced'
    const unpriced = 'turn_req320_unpriced'
    const partly = 'turn_req320_partly'
    await ledger(business, unpriced, at(3))
    await meter(business, unpriced, at(3), null)
    await ledger(business, partly, at(2))
    await meter(business, partly, at(2), 800_000, [
      WORKER,
      { session: 'site-ghost', role: 'builder', backend: 'claude_builder' },
    ])

    const turns = await turnsOf(business)
    expect(costOf(turns, unpriced)).toBeNull()
    expect(costOf(turns, partly)).toBeNull()
    expect(costOf(turns, partly)).not.toBe(800_000 + WORKER_MICROS)
  })

  it('test_UAT_FC_REQ-320_the_meter_is_read_under_the_asking_businesss_scope', async () => {
    // THE JOIN IS SCOPED, though `turn_id` is the meter's primary key and would
    // find the row on its own. A ledger row that named another business's turn —
    // an upstream mistake, a restored backup, a bad migration — must not have that
    // business's money reported under this one.
    const asking = 'req320-asking'
    const other = 'req320-other'
    const borrowed = 'turn_req320_borrowed'
    await ledger(asking, borrowed, at(1))
    await meter(other, borrowed, at(1), 7_000_000)

    expect(costOf(await turnsOf(asking), borrowed)).toBeNull()
  })
})
