import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ADMIN_BUSINESS_SPEND_PATH, ADMIN_SPEND_PATH, route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'

/**
 * [[BUG-166]] — **the figure under *Business cost* is the whole bill**: what the
 * business spent itself PLUS what its turns caused on the workers they handed off
 * to.
 *
 * THE DEFECT. [[REQ-297]] decided, correctly, that the two halves must never be
 * collapsed into one number — a surface showing only a sum cannot say whether
 * moving construction to a cheap model moved the money or merely moved it. The
 * pane therefore labelled both and added neither, INCLUDING the headline cell at
 * the top of a section headed *Business cost*, which carried the principal half
 * alone. A reader takes a headline for the total; this one was the flattering
 * part of it, with the rest sitting unadded a few inches below.
 *
 * WHAT CHANGED, AND WHAT DID NOT. The decomposition is untouched — the labelled
 * pair is still two figures and is still never summed on screen. What is new is a
 * fourth answer on the same round trip, `total`, computed where the other three
 * are: a route that is the single authority on a number an operator prices from,
 * rather than a browser free to disagree with it.
 *
 * WHAT MAKES THIS EVIDENCE. `GET /api/admin/spend` through `route()` against a
 * real D1 carrying the deployed migrations and the real `prices.json`, with an
 * `Admission` minted from real rows — the read the console actually performs.
 *
 * THE FALSIFIERS:
 *
 *   - *`total` equal to the principal half where work was delegated*, which is the
 *     defect;
 *   - *the two halves folded together and the decomposition lost*, which is the
 *     over-correction REQ-297 exists to prevent;
 *   - *`$0.00` where neither half was measured*, which claims a month of free
 *     consulting;
 *   - *a rate derived from the principal half beside a total that is not*, which
 *     puts two figures on one row that an operator can divide and find disagree.
 */

const PLATFORM = 'bug166-spend-platform'

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

async function operator(): Promise<Admission> {
  const email = 'bug166-spend-operator@example.test'
  await ensurePlatformOperator(identityEnv(), email)
  const admission = await admit(identityEnv(), email)
  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
  return admission
}

/** One meter row — what the turn's `finally` writes, if it survives to write it. */
async function meter(
  tenant: string,
  turn: string,
  startedAt: string,
  endedAt: string,
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
      endedAt,
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
 * A delegated worker as the framework attributes it — its own backend and no
 * model, so the entry is priced against `backends.json`'s binding rather than
 * against the caller's. `claude_builder` runs the cheap model: 10,000 input and
 * 2,000 output at $1 / $5 per million is 20,000 micros.
 */
const WORKER = {
  session: 'site-bug166-worker',
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
  report: { costMicros: number | null; engagedHours: number | null; costPerEngagedHourMicros: number | null }
  delegated: { costMicros: number | null } | null
  total: { costMicros: number | null; costPerEngagedHourMicros: number | null }
}

async function spendOf(business: string): Promise<Answer> {
  const answer = await route(
    new Request(`https://app.example${ADMIN_SPEND_PATH}?business=${business}`),
    routerEnv(),
    { businessId: PLATFORM },
    { admission: await operator() } as never,
  )
  expect(answer.status).toBe(200)
  return (await answer.json()) as Answer
}

interface League {
  businesses: {
    business: string
    report: { costMicros: number | null }
    total: { costMicros: number | null }
  }[]
}

async function leagueOf(from: string): Promise<League['businesses']> {
  const answer = await route(
    new Request(`https://app.example${ADMIN_BUSINESS_SPEND_PATH}?from=${from}`),
    routerEnv(),
    { businessId: PLATFORM },
    { admission: await operator() } as never,
  )
  expect(answer.status).toBe(200)
  return ((await answer.json()) as League).businesses
}

const at = (minutesAgo: number): string => new Date(Date.now() - minutesAgo * 60_000).toISOString()

describe('BUG-166 — the business cost is the whole bill', () => {
  beforeAll(async () => {
    await applySchema()
    await operator()
  })

  it('test_UAT_FC_BUG-166_the_total_is_the_principal_half_plus_the_delegated_one', async () => {
    // THE CASE THE TOTAL EXISTS FOR. Two turns: one did its own work, one handed
    // a sweep to a worker. The headline must account for both — and the two
    // halves must still arrive separately, because that is what says WHERE the
    // money went.
    const business = 'bug166-delegating'
    await meter(business, 'turn_bug166_own', at(40), at(38), 900_000)
    await meter(business, 'turn_bug166_handed', at(20), at(18), 1_500_000, [WORKER])

    const { report, delegated, total } = await spendOf(business)

    expect(report.costMicros).toBe(2_400_000)
    expect(delegated!.costMicros).toBe(WORKER_MICROS)
    expect(total.costMicros).toBe(2_400_000 + WORKER_MICROS)
    // AND IT IS NOT THE PRINCIPAL HALF, which is the defect stated as a number:
    // a headline equal to `report.costMicros` under-reports every delegation.
    expect(total.costMicros).toBeGreaterThan(report.costMicros!)
    // THE DECOMPOSITION SURVIVES. REQ-297's rule is about the pair, and the pair
    // is still two figures on the wire for the pane to label.
    expect(delegated!.costMicros).not.toBe(total.costMicros)
  })

  it('test_UAT_FC_BUG-166_the_rate_is_the_totals_and_not_the_principal_halfs', async () => {
    // TWO FIGURES ON ONE ROW MUST AGREE. *Cost* and *Cost / hour* sit side by
    // side in the headline, so an operator can divide one by the other. A rate
    // derived from the principal half beside a total that is not would fail that
    // arithmetic — silently, and in the direction that flatters.
    const business = 'bug166-rate'
    await meter(business, 'turn_bug166_rate', at(60), at(30), 3_000_000, [WORKER])

    const { report, total } = await spendOf(business)

    expect(total.costPerEngagedHourMicros).not.toBeNull()
    expect(total.costPerEngagedHourMicros).toBeGreaterThan(report.costPerEngagedHourMicros!)
    // THE SAME DENOMINATOR, WHICH IS THE CLAIM: delegation buys no engaged time
    // of its own — a worker spends its money inside the caller's turn — so the
    // two rates differ by exactly the ratio of the two costs and nothing else.
    expect(total.costPerEngagedHourMicros! / total.costMicros!).toBeCloseTo(
      report.costPerEngagedHourMicros! / report.costMicros!,
      9,
    )
  })

  it('test_UAT_FC_BUG-166_a_business_that_delegated_nothing_reads_exactly_as_before', async () => {
    // THE ORDINARY STATE, AND THE REGRESSION THIS GUARDS. This deployment ships
    // delegation off, so almost every business has no delegated half at all — and
    // for them the headline must be the principal figure unchanged, to the micro.
    const business = 'bug166-quiet'
    await meter(business, 'turn_bug166_quiet', at(30), at(28), 750_000)

    const { report, delegated, total } = await spendOf(business)

    expect(delegated).toBeNull()
    expect(total.costMicros).toBe(report.costMicros)
    expect(total.costPerEngagedHourMicros).toBe(report.costPerEngagedHourMicros)
  })

  it('test_UAT_FC_BUG-166_the_league_prints_and_ranks_by_what_each_business_really_cost', async () => {
    /**
     * THE LIST AND THE PANE ARE ONE QUESTION ASKED TWICE. The console ranks every
     * business by cost in its list and opens one business's period in the pane
     * beside it; a list carrying the principal half next to a headline carrying
     * the total would show two different figures for the same business over the
     * same period, on one screen.
     *
     * AND THE RANKING IS THE POINT OF THE LIST. *Which tenant is costing us
     * money* is what the console exists to answer — a business whose spend went
     * to its workers is costing us exactly that money, and ordering by the
     * principal half puts it below one that cost less.
     */
    const window = at(5)
    const delegator = 'bug166-league-delegator'
    const direct = 'bug166-league-direct'
    // The delegator spends LESS on its own turns and MORE altogether, which is
    // the only arrangement in which the two orderings disagree.
    await meter(delegator, 'turn_bug166_league_a', at(4), at(3), 1_000_000, [
      WORKER,
      WORKER,
      WORKER,
    ])
    await meter(direct, 'turn_bug166_league_b', at(4), at(3), 1_050_000)

    const league = (await leagueOf(window)).filter((row) =>
      [delegator, direct].includes(row.business),
    )

    expect(league.map((row) => row.business)).toEqual([delegator, direct])
    expect(league[0].total.costMicros).toBe(1_000_000 + 3 * WORKER_MICROS)
    // The principal half is still on the wire — it is what the pane's own
    // decomposition is a decomposition OF — and it is not what ordered the list.
    expect(league[0].report.costMicros).toBe(1_000_000)
    expect(league[0].report.costMicros).toBeLessThan(league[1].report.costMicros!)
  })

  it('test_UAT_FC_BUG-166_nothing_measured_is_nothing_and_never_zero', async () => {
    // NOTHING, NEVER ZERO, AT THE FIGURE MOST LIKELY TO BE READ AS A BILL. A
    // business the meter has never priced has no cost — `$0.00` in this cell
    // would claim a period of free consulting, and the pane renders `null` as a
    // dash for exactly that reason.
    const never = 'bug166-unmeasured'
    const { total } = await spendOf(never)
    expect(total.costMicros).toBeNull()
    expect(total.costMicros).not.toBe(0)
    expect(total.costPerEngagedHourMicros).toBeNull()

    // AND AN UNPRICED TURN IS THE SAME ANSWER. A `(backend, model)` pair
    // `prices.json` does not name leaves a measured row with a NULL cost; with no
    // delegated half either, there is nothing to total.
    const unpriced = 'bug166-unpriced'
    await meter(unpriced, 'turn_bug166_unpriced', at(10), at(9), null)
    const answer = await spendOf(unpriced)
    expect(answer.report.costMicros).toBeNull()
    expect(answer.total.costMicros).toBeNull()
  })
})
