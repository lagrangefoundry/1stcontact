import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ADMIN_SPEND_PATH, route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { d1TurnSpend, tenantSpendReport, tenantSpendTurns } from '../apps/control-app/src/spend'
import type { TurnSpendRecord } from '../tools/generate/src/cli/ai/spend-core'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-293]] — **a tenant's period, read back out of the meter.**
 *
 * WHAT MAKES THIS EVIDENCE. Every row below is written by the SHIPPED writer
 * — `d1TurnSpend`, the same `RecordTurnSpend` the chat host is handed — into a
 * real D1 inside workerd with the deployed migrations applied, and read back by
 * the shipped reader. Nothing is seeded by hand, so a divergence between the
 * columns the product writes and the columns the report selects fails here
 * rather than passing. The route case goes through `route()` itself with a real
 * `Admission` minted from real rows, so the gate that decides who may read
 * somebody else's spending is the deployed one.
 *
 * WHY THE ROWS ARE PLANTED RATHER THAN EARNED. The turns that produce them are
 * REQ-292's subject and are proved there end-to-end, through the real tool loop
 * and the real accumulator. What is at stake HERE is what a period of them adds
 * up to — which needs turns hours apart, on two models, in two sessions, some
 * priced and some not, and a conversation cannot be made to take an hour in a
 * test suite.
 */

const PLATFORM = 'req293-platform'
const TENANT = 'req293-tenant'
const OTHER = 'req293-other'

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

const DB = (): SpendDb => ({ DB: env.DB as D1Database })
interface SpendDb {
  DB: D1Database
}

/** Midnight of the measured day; every stamp is an offset from it. */
const BASE = Date.parse('2026-09-20T12:00:00.000Z')
const at = (seconds: number): string => new Date(BASE + seconds * 1000).toISOString()
const MINUTE = 60 * 1000

let minted = 0

/**
 * One measured turn, written the way the host writes one.
 *
 * The four counters are present and non-zero because that is what MEASURED
 * means (REQ-292) — a turn that reported nothing writes no row at all, and a
 * report is only ever assembled from rows that exist.
 */
async function record(tenant: string, over: Partial<TurnSpendRecord>): Promise<void> {
  minted += 1
  const full: TurnSpendRecord = {
    session: 'session-a',
    turn: `req293-turn-${minted}`,
    startedAt: at(0),
    endedAt: at(60),
    role: 'consultant',
    backend: 'claude',
    model: 'claude-opus-5',
    outcome: 'complete',
    requests: 3,
    usage: {
      input_tokens: 1_000,
      output_tokens: 500,
      cache_read_input_tokens: 20_000,
      cache_creation_input_tokens: 4_000,
    },
    attributed: null,
    costMicros: 100_000,
    ...over,
  }
  await d1TurnSpend(DB(), tenant)(full)
}

/** Every column of a tenant's rows, for the "it writes nothing" case. */
async function snapshot(tenant: string): Promise<unknown[]> {
  const result = await env.DB.prepare('SELECT * FROM turn_spend WHERE tenant_id = ? ORDER BY turn_id')
    .bind(tenant)
    .all()
  return result.results ?? []
}

async function operator(): Promise<Extract<Admission, { ok: true }>> {
  const email = 'req293-operator@example.test'
  await ensurePlatformOperator(identityEnv(), email)
  const admission = await admit(identityEnv(), email)
  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
  return admission
}

const ask = async (query: string, admission: Admission | null): Promise<Response> =>
  route(
    new Request(`https://app.example${ADMIN_SPEND_PATH}${query}`),
    routerEnv(),
    { businessId: PLATFORM },
    { admission },
  )

beforeAll(async () => {
  await applySchema()
  // ONE EVENING, AS THE MEASURED DAY ACTUALLY RAN: a conversation with a pause
  // in it, a second conversation an hour later, and one turn on a model the
  // price table does not name.
  //
  //   session-a  12:00:00 → 12:01:00  opus,  consultant, $0.90   then 2 min idle
  //   session-a  12:03:00 → 12:07:00  haiku, builder,    $0.10   then nothing
  //   session-b  13:00:00 → 13:01:00  opus,  consultant, unpriced
  await record(TENANT, { session: 'session-a', startedAt: at(0), endedAt: at(60), costMicros: 900_000 })
  await record(TENANT, {
    session: 'session-a',
    startedAt: at(180),
    endedAt: at(420),
    role: 'builder',
    model: 'claude-haiku-4-5',
    costMicros: 100_000,
  })
  await record(TENANT, {
    session: 'session-b',
    startedAt: at(3600),
    endedAt: at(3660),
    costMicros: null,
    model: 'model-with-no-rates',
  })
  // ANOTHER TENANT, IN THE SAME PERIOD, ON THE SAME MODELS. A report that
  // leaked would be indistinguishable from one that did not without this.
  await record(OTHER, { session: 'session-c', startedAt: at(0), endedAt: at(1800) })
})

describe('REQ-293 — the meter, read as hours and as dollars', () => {
  /**
   * CONDITION 1, end to end: engaged hours, settled cost and cost per engaged
   * hour, each also split by role and by model — from rows the shipped writer
   * put in a real database.
   *
   * THE NUMBERS ARE CHECKABLE BY HAND against the three turns in `beforeAll`.
   * Session A is one minute of work, two of pause, then four more minutes —
   * seven minutes, of which the first three are Opus's (the pause belongs to the
   * turn the client was reading) and four are Haiku's. Session B is one minute
   * alone with nothing after it. Eight minutes engaged, $1.00 settled across the
   * two priced turns, and $7.50 per engaged hour.
   */
  it('test_UAT_FC_REQ-293_a_tenants_period_reads_back_in_hours_and_in_dollars', async () => {
    const report = await tenantSpendReport(DB(), TENANT)

    expect(report.turns).toBe(3)
    expect(report.engagedMs).toBe(8 * MINUTE)
    expect(report.engagedHours).toBe(0.13)
    expect(report.costMicros).toBe(1_000_000)
    expect(report.costPerEngagedHourMicros).toBe(7_500_000)

    // THE SPLIT, WHICH IS THE LOAD-BEARING PART. It is what makes a delegation
    // experiment readable: the expensive model took three of the eight minutes
    // and ninety per cent of the money.
    expect(report.byModel['claude-opus-5'].engagedMs).toBe(3 * MINUTE)
    expect(report.byModel['claude-opus-5'].costMicros).toBe(900_000)
    expect(report.byModel['claude-haiku-4-5'].engagedMs).toBe(4 * MINUTE)
    expect(report.byModel['claude-haiku-4-5'].costPerEngagedHourMicros).toBe(1_500_000)
    expect(report.byRole['consultant'].turns).toBe(2)
    expect(report.byRole['builder'].engagedMs).toBe(4 * MINUTE)

    // The unpriced turn is counted and never read as free — its minute is in
    // the hours, and the count says the money beside it is a floor.
    expect(report.unpricedTurns).toBe(1)
    expect(report.byModel['model-with-no-rates'].costMicros).toBeNull()
  })

  /**
   * CONDITION 2 — engaged time is DERIVED, and the report writes nothing.
   *
   * WHY THIS IS ASSERTED AND NOT ASSUMED. The alternative design — a stored
   * `engaged_ms` column — needs a retroactive UPDATE on every turn, because the
   * next turn does not exist when the current one ends. That write can fail, and
   * it would fail against a meter that will be billed from. So the claim is that
   * a report is a pure read: every column of every row is compared before and
   * after, not merely the count.
   */
  it('test_UAT_FC_REQ-293_the_report_writes_nothing_and_revises_nothing', async () => {
    const before = await snapshot(TENANT)
    const report = await tenantSpendReport(DB(), TENANT)
    const after = await snapshot(TENANT)

    expect(report.engagedMs).toBe(8 * MINUTE)
    expect(after).toEqual(before)
    // And there is no such column to have been written: engaged time exists
    // only in the answer.
    expect(Object.keys(before[0] as Record<string, unknown>)).not.toContain('engaged_ms')
    // The two stamps it IS derived from are both there, which is what makes a
    // long turn visible as one rather than as an instant.
    expect(Object.keys(before[0] as Record<string, unknown>)).toEqual(
      expect.arrayContaining(['started_at', 'ended_at']),
    )
  })

  /**
   * THE PERIOD IS HALF-OPEN, AND IT IS ONE TENANT'S.
   *
   * HALF-OPEN SO ADJACENT PERIODS TILE: the turn that starts exactly on the
   * boundary belongs to the later period and to that one only, or a year does
   * not add up to the sum of its months. A turn is in the period it BEGAN in —
   * session B's turn is included by a `from` at its own start and excluded by a
   * `to` there.
   *
   * AND THE OTHER TENANT IS NEVER IN IT. Their half hour is in the same period
   * on the same models; if scoping were wrong, every figure above would be too
   * and nothing else here would notice.
   */
  it('test_UAT_FC_REQ-293_the_period_is_half_open_and_scoped_to_one_tenant', async () => {
    const fromB = await tenantSpendReport(DB(), TENANT, { from: at(3600) })
    expect(fromB.turns).toBe(1)
    expect(fromB.engagedMs).toBe(MINUTE)

    const beforeB = await tenantSpendReport(DB(), TENANT, { to: at(3600) })
    expect(beforeB.turns).toBe(2)
    expect(beforeB.engagedMs).toBe(7 * MINUTE)

    // The two halves tile: no turn is in both, and none is in neither.
    expect(fromB.turns + beforeB.turns).toBe(3)

    const theirs = await tenantSpendTurns(DB(), OTHER)
    expect(theirs).toHaveLength(1)
    expect(theirs.every((t) => t.session === 'session-c')).toBe(true)
    // CONDITION 4 at the tenant boundary: a tenant with nothing in the period
    // reports nothing, and never a zero that would read as free consulting.
    const empty = await tenantSpendReport(DB(), 'req293-nobody')
    expect(empty.turns).toBe(0)
    expect(empty.engagedHours).toBeNull()
    expect(empty.costMicros).toBeNull()
    expect(empty.costPerEngagedHourMicros).toBeNull()
  })

  /**
   * THE OPERATOR'S ROUTE — who may ask, and what they must say.
   *
   * 404 AND NOT 403 for a caller who is not an owner of the business whose
   * product is businesses, on the reasoning every other `/api/admin/` route
   * here follows: somebody asking whether an administrative surface exists is
   * owed nothing. What the route would otherwise hand over is a profile of
   * somebody else's spending — how long they worked, on what, and at what rate.
   *
   * AN UNREADABLE TIMESTAMP IS A REFUSAL AND NOT AN IGNORED BOUND. Dropping a
   * `from` nobody could parse would answer a wider question with no sign that it
   * had, and the reader would take the total for the month they asked about.
   */
  it('test_UAT_FC_REQ-293_only_the_operator_may_read_a_tenants_meter', async () => {
    expect((await ask(`?business=${TENANT}`, null)).status).toBe(404)

    const admission = await operator()
    expect((await ask('', admission)).status).toBe(400)
    expect((await ask(`?business=${TENANT}&from=not-a-timestamp`, admission)).status).toBe(400)

    const response = await ask(`?business=${TENANT}&from=${at(-60)}&to=${at(3600)}`, admission)
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      business: string
      period: { from: string | null; to: string | null }
      report: { turns: number; engagedHours: number; costMicros: number; byRole: unknown }
    }
    expect(body.business).toBe(TENANT)
    expect(body.period).toEqual({ from: at(-60), to: at(3600) })
    // Session A alone — the period stops before session B begins.
    expect(body.report.turns).toBe(2)
    expect(body.report.engagedHours).toBe(0.12)
    expect(body.report.costMicros).toBe(1_000_000)
    expect(body.report.byRole).toMatchObject({ consultant: { turns: 1 }, builder: { turns: 1 } })
  })
})
