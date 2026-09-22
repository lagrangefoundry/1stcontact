import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  ADMIN_SPEND_PATH,
  ADMIN_BUSINESS_SPEND_PATH,
  BUSINESSES_PATH,
  route,
} from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import {
  d1TurnSpend,
  tenantSpendReport,
  tenantDelegatedSpend,
  tenantSpendDays,
  tenantSpendLeague,
} from '../apps/control-app/src/spend'
import type { TurnSpendRecord } from '../tools/generate/src/cli/ai/spend-core'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-297]] — **what the operator console's tenant-cost control reads**.
 *
 * WHAT MAKES THIS EVIDENCE. Every row below is written by the SHIPPED writer —
 * `d1TurnSpend`, the same `RecordTurnSpend` the chat host is handed — into a
 * real D1 inside workerd with the deployed migrations applied, and read back by
 * the shipped reads. The route cases go through `route()` itself with a real
 * `Admission` minted from real rows, so the gate that decides who may read every
 * tenant's spending at once is the deployed one.
 *
 * WHY THE ROWS ARE PLANTED RATHER THAN EARNED, on [[REQ-293]]'s reasoning: the
 * turns that produce them are [[REQ-292]]'s subject and are proved there end to
 * end. What is at stake here is what SEVERAL tenants' periods add up to and how
 * they order, which needs three tenants, two days, two models and a delegation —
 * and a conversation cannot be made to take a week in a test suite.
 *
 * THE CLAIMS:
 *
 *   1. THE GATE IS `ownsPlatformBusiness` and the refusal is 404 — an answer
 *      that is a profile of every customer's spending at once is owed to nobody
 *      who merely asks whether it exists.
 *   2. THE LEAGUE IS ONE ROW PER TENANT WITH A MEASURED TURN, dearest first,
 *      with an unpriced tenant after every tenant that has a cost.
 *   3. A TENANT WITH NOTHING IN THE WINDOW IS ABSENT, not a zero row.
 *   4. EACH DAY'S FIGURES ARE [[REQ-293]]'S REPORT FOR THAT DAY'S OWN PERIOD —
 *      asserted by computing both and comparing, which is what makes "renders
 *      that report and does not compute a second opinion" a property.
 *   5. THE DELEGATED HALF IS PRICED AGAINST THE WORKER'S OWN BACKEND and names
 *      the model; a tenant that delegated nothing has `null`, never zero.
 *   6. THE PERIOD IS A PARAMETER, on both routes, and an unreadable end refuses.
 *   7. THE CHROME IS TOLD whether the console exists for this session.
 */

const PLATFORM = 'req297-platform'
const BUSY = 'req297-busy'
const QUIET = 'req297-quiet'
const DARK = 'req297-dark'
const ABSENT = 'req297-absent'

interface SpendDb {
  DB: D1Database
}
const DB = (): SpendDb => ({ DB: env.DB as D1Database })

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

/** Two measured days. Every stamp is an offset from the first one's midday. */
const DAY_ONE = Date.parse('2026-09-20T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const MINUTE = 60 * 1000
const at = (ms: number): string => new Date(DAY_ONE + ms).toISOString()

let minted = 0

async function record(tenant: string, over: Partial<TurnSpendRecord>): Promise<void> {
  minted += 1
  const full: TurnSpendRecord = {
    session: 'session-a',
    turn: `req297-turn-${minted}`,
    startedAt: at(0),
    endedAt: at(MINUTE),
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

async function operator(): Promise<Extract<Admission, { ok: true }>> {
  const email = 'req297-operator@example.test'
  await ensurePlatformOperator(identityEnv(), email)
  const admission = await admit(identityEnv(), email)
  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
  return admission
}

const ask = async (path: string, admission: Admission | null): Promise<Response> =>
  route(new Request(`https://app.example${path}`), routerEnv(), { businessId: PLATFORM }, {
    admission,
  })

beforeAll(async () => {
  await applySchema()

  // THE BUSY TENANT — two days, two models, and a delegation on the cheap one.
  //   day 1  12:00 → 12:01  opus,  $3.00, and a worker's requests attributed
  //   day 1  12:05 → 12:09  haiku, $0.50
  //   day 2  12:00 → 12:30  opus,  $6.00
  await record(BUSY, {
    session: 'session-a',
    startedAt: at(0),
    endedAt: at(MINUTE),
    costMicros: 3_000_000,
    // WHAT THE FRAMEWORK ACTUALLY STORES: an entry naming the worker's session,
    // its role and its BACKEND — and no model, which is the gap the read has to
    // close from `backends.json` rather than by guessing the caller's.
    attributed: [
      {
        turn_id: 'req297-turn-1',
        session: 'worker-session-1',
        role: 'builder',
        backend: 'claude_builder',
        usage: {
          input_tokens: 10_000,
          output_tokens: 2_000,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      },
    ],
  })
  await record(BUSY, {
    session: 'session-a',
    startedAt: at(5 * MINUTE),
    endedAt: at(9 * MINUTE),
    role: 'builder',
    model: 'claude-haiku-4-5',
    backend: 'claude_builder',
    costMicros: 500_000,
  })
  await record(BUSY, {
    session: 'session-b',
    startedAt: at(DAY),
    endedAt: at(DAY + 30 * MINUTE),
    costMicros: 6_000_000,
  })

  // THE QUIET ONE — one cheap turn, and nothing handed off.
  await record(QUIET, { session: 'session-c', startedAt: at(0), endedAt: at(MINUTE), costMicros: 250_000 })

  // THE DARK ONE — measured, and on a model the price table does not name. It
  // has hours and no cost, which is not a cost of zero.
  await record(DARK, {
    session: 'session-d',
    startedAt: at(0),
    endedAt: at(2 * MINUTE),
    model: 'model-with-no-rates',
    costMicros: null,
  })

  // THE ABSENT ONE — a turn OUTSIDE every window these cases ask about, so it
  // exists in the table and must never appear in a windowed answer.
  await record(ABSENT, {
    session: 'session-e',
    startedAt: at(-30 * DAY),
    endedAt: at(-30 * DAY + MINUTE),
    costMicros: 99_000_000,
  })
})

// ── the league ───────────────────────────────────────────────────────────────

describe('REQ-297 — every tenant, dearest first', () => {
  it('test_UAT_FC_REQ-297_the_league_is_one_row_per_tenant_ordered_by_cost', async () => {
    const window = { from: at(-MINUTE), to: at(2 * DAY) }
    const league = await tenantSpendLeague(DB(), window)

    // ONE ROW PER TENANT WITH A MEASURED TURN IN THE WINDOW. The tenant whose
    // only turn is a month earlier is ABSENT rather than zero — and it is the
    // most expensive row in the table, so a window that leaked would be obvious.
    expect(league.map((row) => row.business)).toEqual([BUSY, QUIET, DARK])

    // DEAREST FIRST: $9.50, then $0.25, then the unpriced one. `null` is not a
    // position on a scale of money, so it sorts after every tenant that has one
    // rather than at the bottom as though it were free.
    expect(league[0].report.costMicros).toBe(9_500_000)
    expect(league[1].report.costMicros).toBe(250_000)
    expect(league[2].report.costMicros).toBeNull()
    expect(league[2].report.unpricedTurns).toBe(1)
    // And it still has hours, which is what makes the blank legible as a gap in
    // the price table rather than as a month nobody worked.
    expect(league[2].report.engagedHours).toBe(0.03)

    // THE THREE NUMBERS ARE [[REQ-293]]'S, NOT A SECOND OPINION. A league row
    // IS that tenant's report for the same period — asserted by computing both.
    expect(league[0].report).toEqual(await tenantSpendReport(DB(), BUSY, window))
  })

  it('test_UAT_FC_REQ-297_the_window_is_a_parameter_and_a_tenant_can_leave_the_table', async () => {
    // A ONE-DAY WINDOW: the busy tenant's second day is out, so its cost falls
    // to the first day's alone — and the order of the table changes with it.
    const dayOne = await tenantSpendLeague(DB(), { from: at(-MINUTE), to: at(DAY) })
    expect(dayOne.map((row) => row.business)).toEqual([BUSY, QUIET, DARK])
    expect(dayOne[0].report.costMicros).toBe(3_500_000)

    // A WINDOW OVER THE SECOND DAY ALONE holds one tenant, because the others
    // did nothing in it. Absent, not zero.
    const dayTwo = await tenantSpendLeague(DB(), { from: at(DAY), to: at(2 * DAY) })
    expect(dayTwo.map((row) => row.business)).toEqual([BUSY])

    // UNBOUNDED IS STILL UNBOUNDED, which is [[REQ-293]]'s contract and is why
    // the console's thirty days is the console's and not the route's.
    const everything = await tenantSpendLeague(DB())
    expect(everything.map((row) => row.business)).toContain(ABSENT)
    expect(everything[0].business).toBe(ABSENT)
  })

  it('test_UAT_FC_REQ-297_a_tenants_label_comes_from_its_row_and_survives_its_absence', async () => {
    // A LEFT JOIN, NOT AN INNER ONE. These meters have no `tenants` row at all —
    // they are ids the meter recorded — and a league that dropped them would
    // stop reporting money for the one reason it must not.
    const league = await tenantSpendLeague(DB(), { from: at(-MINUTE), to: at(2 * DAY) })
    expect(league.map((row) => row.name)).toEqual([null, null, null])

    await env.DB.prepare(
      "INSERT INTO tenants (id, name, status, created_at) VALUES (?, ?, 'active', ?)",
    )
      .bind(BUSY, 'Busy Ltd', at(0))
      .run()
    const named = await tenantSpendLeague(DB(), { from: at(-MINUTE), to: at(2 * DAY) })
    expect(named[0]).toMatchObject({ business: BUSY, name: 'Busy Ltd' })
  })
})

// ── the expansion ────────────────────────────────────────────────────────────

describe('REQ-297 — one tenant, by day and by who spent it', () => {
  it('test_UAT_FC_REQ-297_each_days_figures_are_the_report_for_that_days_own_period', async () => {
    const window = { from: at(-MINUTE), to: at(2 * DAY) }
    const days = await tenantSpendDays(DB(), BUSY, window)

    // ONE ROW PER DAY THAT HAS A MEASURED TURN, oldest first. The day in
    // between — there is none here — would be absent rather than a zero row.
    expect(days.map((d) => d.day)).toEqual(['2026-09-20', '2026-09-21'])

    // CONDITION 7, IN THE FORM THAT CANNOT BE SATISFIED BY COINCIDENCE: each
    // day's report is compared against what the authoritative per-tenant read
    // gives for that day's own half-open period. Not "close to"; equal.
    for (const day of days) {
      const from = `${day.day}T00:00:00.000Z`
      const to = new Date(Date.parse(from) + DAY).toISOString()
      expect(day.report).toEqual(await tenantSpendReport(DB(), BUSY, { from, to }))
    }

    // And the figures are the ones a person reads: day one is a minute of opus
    // and four of haiku with the pause between them, day two is half an hour.
    expect(days[0].report.costMicros).toBe(3_500_000)
    expect(days[1].report.costMicros).toBe(6_000_000)
    expect(days[1].report.engagedHours).toBe(0.5)
  })

  it('test_UAT_FC_REQ-297_the_delegated_half_is_priced_on_the_workers_own_backend', async () => {
    const window = { from: at(-MINUTE), to: at(2 * DAY) }
    const delegated = await tenantDelegatedSpend(DB(), BUSY, window)

    expect(delegated).not.toBeNull()
    expect(delegated!.entries).toBe(1)
    expect(delegated!.unpricedEntries).toBe(0)

    // IT NAMES THE MODEL, which is the half that answers *did construction
    // actually move to the cheap model*. The stored entry carries only a
    // backend; the model comes from the document that binds the two.
    expect(Object.keys(delegated!.byModel)).toEqual(['claude-haiku-4-5'])
    expect(delegated!.byModel['claude-haiku-4-5'].backend).toBe('claude_builder')

    // AND IT IS PRICED AT THE WORKER'S RATES AND NOT THE CALLER'S. 10,000 input
    // at $1/M and 2,000 output at $5/M is $0.02 — where the caller's opus rates
    // ($5/M and $25/M) would have made the same tokens $0.10. Pricing a
    // delegation at the caller's key is exactly the error the two-level price
    // key exists to prevent, so the figure is what proves the key was used.
    expect(delegated!.costMicros).toBe(20_000)
    expect(delegated!.byModel['claude-haiku-4-5'].costMicros).toBe(20_000)

    // THE TWO FIGURES ARE NEVER ONE. The report is the tenant's OWN spend and
    // does not contain the delegation; the true total is the sum, and nothing
    // here performs it, because a surface that showed one number would make a
    // delegation that moved no work look like one that worked.
    const own = await tenantSpendReport(DB(), BUSY, window)
    expect(own.costMicros).toBe(9_500_000)
    expect(own.costMicros).not.toBe((own.costMicros ?? 0) + (delegated!.costMicros ?? 0))
  })

  it('test_UAT_FC_REQ-297_a_tenant_that_delegated_nothing_reads_null_and_never_zero', async () => {
    // NOTHING, NEVER ZERO, at the place a reader is most likely to mistake the
    // two: this deployment ships delegation off, so no delegated spend is the
    // ordinary state, and a zeroed shape would read as a measurement.
    expect(await tenantDelegatedSpend(DB(), QUIET, { from: at(-MINUTE), to: at(2 * DAY) })).toBeNull()
    // And a window that excludes the delegating turn is the same answer.
    expect(await tenantDelegatedSpend(DB(), BUSY, { from: at(DAY), to: at(2 * DAY) })).toBeNull()
  })
})

// ── the routes ───────────────────────────────────────────────────────────────

describe('REQ-297 — who may read the console, and what it answers', () => {
  it('test_UAT_FC_REQ-297_only_an_owner_of_the_platform_business_may_read_the_league', async () => {
    // 404 AND NOT 403, on every other `/api/admin/` route's reasoning: somebody
    // asking whether an administrative surface exists is owed nothing. What
    // this one would otherwise hand over is a profile of EVERY customer's
    // spending at once, which is strictly more than the per-tenant route
    // declines to give.
    const refused = await ask(ADMIN_BUSINESS_SPEND_PATH, null)
    expect(refused.status).toBe(404)
    expect(await refused.text()).toBe('Not found.')

    const admission = await operator()
    const response = await ask(
      `${ADMIN_BUSINESS_SPEND_PATH}?from=${at(-MINUTE)}&to=${at(2 * DAY)}`,
      admission,
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      period: { from: string | null; to: string | null }
      businesses: Array<{
        business: string
        name: string | null
        report: { costMicros: number | null }
      }>
    }
    expect(body.period).toEqual({ from: at(-MINUTE), to: at(2 * DAY) })
    expect(body.businesses.map((t) => t.business)).toEqual([BUSY, QUIET, DARK])
    expect(body.businesses[0].report.costMicros).toBe(9_500_000)

    // AN UNREADABLE END IS A REFUSAL AND NOT AN IGNORED BOUND — dropping it
    // would answer a wider question with no sign that it had.
    expect((await ask(`${ADMIN_BUSINESS_SPEND_PATH}?from=not-a-time`, admission)).status).toBe(400)
  })

  it('test_UAT_FC_REQ-297_the_expansion_rides_the_period_route_and_carries_both_halves', async () => {
    const admission = await operator()
    const response = await ask(
      `${ADMIN_SPEND_PATH}?business=${BUSY}&from=${at(-MINUTE)}&to=${at(2 * DAY)}`,
      admission,
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      business: string
      report: { costMicros: number | null; byModel: Record<string, { costMicros: number | null }> }
      days: Array<{ day: string; report: { costMicros: number | null } }>
      delegated: { costMicros: number | null; byModel: Record<string, unknown> } | null
    }

    // THE REPORT IS UNCHANGED — [[REQ-293]]'s contract is widened, not replaced,
    // so the endpoint that was authoritative about a tenant's period still is.
    expect(body.business).toBe(BUSY)
    expect(body.report.costMicros).toBe(9_500_000)
    expect(Object.keys(body.report.byModel).sort()).toEqual([
      'claude-haiku-4-5',
      'claude-opus-5',
    ])

    // THE DECOMPOSITION ARRIVES WITH IT, in one round trip, because the days and
    // the delegated half are meaningless apart from the period they decompose.
    expect(body.days.map((d) => d.day)).toEqual(['2026-09-20', '2026-09-21'])
    expect(body.delegated!.costMicros).toBe(20_000)
    expect(Object.keys(body.delegated!.byModel)).toEqual(['claude-haiku-4-5'])

    // AND `null` FOR A TENANT THAT HANDED NOTHING OFF, over the wire as in the
    // read — the absence survives serialisation rather than becoming a zero.
    const quiet = (await (
      await ask(`${ADMIN_SPEND_PATH}?business=${QUIET}`, admission)
    ).json()) as { delegated: unknown }
    expect(quiet.delegated).toBeNull()
  })

  it('test_UAT_FC_REQ-297_the_chrome_is_told_whether_the_console_exists_for_it', async () => {
    // THE CONVENIENCE, AND NOT THE GATE ([[REQ-170]]'s `canFulfil` exactly).
    // The routes above refuse for themselves; this is what stops the builder
    // drawing a control whose every read would then 404.
    const admission = await operator()
    const owned = (await (await ask(BUSINESSES_PATH, admission)).json()) as {
      ownsPlatformBusiness: boolean
    }
    expect(owned.ownsPlatformBusiness).toBe(true)

    // NO ADMISSION IS NO OWNERSHIP, which is the dev-open path's answer too: a
    // configured tenant id is a business, not a person, so there is nobody there
    // who could own anything.
    const anonymous = (await (await ask(BUSINESSES_PATH, null)).json()) as {
      ownsPlatformBusiness: boolean
    }
    expect(anonymous.ownsPlatformBusiness).toBe(false)
  })
})
