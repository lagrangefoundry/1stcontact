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
import { TURN_LOST_AFTER_MS } from '../apps/control-app/src/turn-log'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-306]] — **`GET /api/admin/turns`: an operator sees a site failing turns
 * without being told by the customer**.
 *
 * THE FAILURE THIS ROUTE EXISTS FOR, which is the ticket's fifth requirement. A
 * tenant failed EVERY turn for a period. Each failure reached one customer, who
 * saw a reply stop and was told the connection had been lost; nothing anywhere
 * added them up, so what was in fact one outage presented as a handful of
 * unrelated complaints, and the cause was established only after somebody went
 * and read a Cloudflare tail.
 *
 * WHAT MAKES THIS EVIDENCE. The rows are written into a real D1 inside workerd
 * with the deployed migration applied, and the route is reached through `route()`
 * itself with a real `Admission` minted from real rows — so the gate deciding who
 * may read a profile of somebody else's broken conversations is the deployed one.
 *
 * THE FALSIFIERS:
 *
 *   - *a total instead of a run*, which would let a bad hour last week look
 *     exactly like an outage happening now — the distinction the incident turned
 *     on;
 *   - *abandoned turns counted as deaths*, which would have the console crying
 *     wolf every time somebody closed a tab;
 *   - *a turn in flight counted as a death*, which would fire the alarm on every
 *     healthy conversation that happened to be mid-reply when the operator
 *     looked;
 *   - *an open row read as a death the instant it is written* — a turn is allowed
 *     to take a while, and a ceiling that was not a ceiling would make the whole
 *     surface noise;
 *   - *a business's broken conversations readable by anyone who asks*.
 */

const PLATFORM = 'req306-platform'
const SUFFERING = 'req306-suffering'

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
  const email = 'req306-operator@example.test'
  await ensurePlatformOperator(identityEnv(), email)
  const admission = await admit(identityEnv(), email)
  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
  return admission
}

/**
 * Write one row of the ledger directly.
 *
 * THE ROW AND NOT THE ROUTE THAT WRITES IT. The sibling `.workers` suite proves
 * the prompt route opens and closes these; what is at stake HERE is what an
 * operator is shown given a history — including histories that take hours to
 * accumulate, which no in-process turn can produce. The stamps are the whole
 * point of several cases, so they are chosen rather than taken from a clock.
 */
let seq = 0
async function row(
  tenant: string,
  session: string,
  startedAt: string,
  closed: { outcome: string; detail?: string | null } | null,
): Promise<void> {
  seq += 1
  await env.DB.prepare(
    'INSERT INTO turn_log (turn_id, tenant_id, session_id, started_at, ended_at, outcome, detail)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      `turn_${String(seq).padStart(32, '0')}`,
      tenant,
      session,
      startedAt,
      closed === null ? null : startedAt,
      closed?.outcome ?? null,
      closed?.detail ?? null,
    )
    .run()
}

/** Long enough ago that *still running* has stopped being a credible account. */
const longAgo = (offsetMs = 0): string =>
  new Date(Date.now() - TURN_LOST_AFTER_MS - 60_000 - offsetMs).toISOString()

interface Answer {
  business: string
  counts: Record<string, number>
  consecutiveLost: number
  turns: { turn: string; session: string; state: string; detail: string | null }[]
}

beforeAll(async () => {
  await applySchema()
  await operator()
})

describe('REQ-306 — the operator sees a business failing its turns', () => {
  it('test_UAT_FC_REQ-306_a_run_of_deaths_is_reported_as_a_run', async () => {
    // THE INCIDENT, REPRODUCED AS A HISTORY. Four turns of one conversation, the
    // oldest completed and the three most recent killed — which is exactly the
    // shape of a site that WAS working and has stopped, and is the shape no
    // total can distinguish from four scattered bad afternoons.
    const session = `site-${SUFFERING}`
    await row(SUFFERING, session, longAgo(4000), { outcome: 'complete' })
    await row(SUFFERING, session, longAgo(3000), null)
    await row(SUFFERING, session, longAgo(2000), null)
    await row(SUFFERING, session, longAgo(1000), null)

    const answer = (await (await ask(`${ADMIN_TURNS_PATH}?business=${SUFFERING}`, await operator()))
      .json()) as Answer

    expect(answer.consecutiveLost).toBe(3)
    expect(answer.counts.lost).toBe(3)
    expect(answer.counts.complete).toBe(1)
    // REQUIREMENT 4 — each row names the conversation and the turn, so the
    // operator carries an identifier to the incident rather than reconstructing
    // it. Newest first, because *is it happening now* is the question.
    expect(answer.turns).toHaveLength(4)
    expect(answer.turns[0].session).toBe(session)
    expect(answer.turns.map((t) => t.state)).toEqual(['lost', 'lost', 'lost', 'complete'])
  })

  it('test_UAT_FC_REQ-306_an_abandoned_or_in_flight_turn_is_not_a_death', async () => {
    /**
     * THE TWO FALSE ALARMS THAT WOULD MAKE THIS SURFACE WORTHLESS.
     *
     * A turn the CUSTOMER walked away from closes itself `aborted` — ordinary,
     * frequent, and nothing to do with the platform. A turn that opened a moment
     * ago is open because it is RUNNING, and the ceiling is what keeps those two
     * facts apart without a second mechanism sweeping rows on a timer.
     *
     * AND AN OPEN ROW AT THE HEAD NEITHER BREAKS THE RUN NOR EXTENDS IT: the
     * newest row is very often a turn in flight, and letting it break the count
     * would hide a site from the one operator looking at it while it fails.
     */
    const business = 'req306-mixed'
    const session = `site-${business}`
    await row(business, session, longAgo(3000), null)
    await row(business, session, longAgo(2000), { outcome: 'aborted' })
    await row(business, session, longAgo(1000), null)
    // Opened just now: still running, not a corpse.
    await row(business, session, new Date().toISOString(), null)

    const answer = (await (await ask(`${ADMIN_TURNS_PATH}?business=${business}`, await operator()))
      .json()) as Answer

    expect(answer.counts.open).toBe(1)
    expect(answer.counts.aborted).toBe(1)
    expect(answer.counts.lost).toBe(2)
    // One death at the head, then the abandonment breaks the run. Not three.
    expect(answer.consecutiveLost).toBe(1)
  })

  it('test_UAT_FC_REQ-306_a_failed_turn_carries_its_reason', async () => {
    // THE OTHER THING THAT SPARES A TAIL-READ. A turn that errored knew why, and
    // an operator who can read the reason beside the turn id has the whole of the
    // triage in one place.
    const business = 'req306-errored'
    await row(business, `site-${business}`, longAgo(1000), {
      outcome: 'error',
      detail: 'the model refused',
    })

    const answer = (await (await ask(`${ADMIN_TURNS_PATH}?business=${business}`, await operator()))
      .json()) as Answer

    expect(answer.counts.error).toBe(1)
    expect(answer.turns[0].detail).toBe('the model refused')
    // An error is a different fact from a death and is counted as one: it closed,
    // it explained itself, and the customer was told in the stream.
    expect(answer.consecutiveLost).toBe(0)
  })

  it('test_UAT_FC_REQ-306_a_quiet_business_reads_as_quiet', async () => {
    // THE FALSIFIER FOR EVERY CASE ABOVE. A business nobody has talked to must
    // read as nothing, not as an outage — *nothing, never zero* applied to an
    // alarm rather than to a figure.
    const answer = (await (
      await ask(`${ADMIN_TURNS_PATH}?business=req306-untouched`, await operator())
    ).json()) as Answer

    expect(answer.turns).toEqual([])
    expect(answer.consecutiveLost).toBe(0)
    expect(answer.counts.lost).toBe(0)
  })

  it('test_UAT_FC_REQ-306_only_a_platform_operator_may_read_it', async () => {
    // A profile of how often we broke somebody else's conversations is no more
    // shareable than what they spent. 404 and not 403, on the reasoning every
    // admin route here already uses: a caller asking whether an administrative
    // surface exists is owed nothing.
    const refused = await ask(`${ADMIN_TURNS_PATH}?business=${SUFFERING}`, null)
    expect(refused.status).toBe(404)

    // And a request that names nobody is refused rather than answered about
    // everybody at once.
    const unscoped = await ask(ADMIN_TURNS_PATH, await operator())
    expect(unscoped.status).toBe(400)
  })
})
