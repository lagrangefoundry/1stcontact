import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { ratesFor } from '../tools/generate/src/cli/ai/spend-core'
import { d1TurnSpend } from '../apps/control-app/src/spend'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import {
  calls,
  metered,
  pacedClient,
  says,
  scriptedClient,
  type ModelRequest,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-292]] — **every turn that reports spend leaves one durable record**.
 *
 * WHAT WAS WRONG. Nothing upstream, which is what makes this worth a ticket.
 * The adapter counts all four token counters on every request it sends
 * (REQ-143), the manager folds the turn's and puts them on its terminal event,
 * and this host read that event for the turn's `status` and threw the rest away.
 * The junction it would otherwise have survived on is `memoryJunctions()` and
 * dies with the isolate. So the measurement existed, in RAM, for the life of one
 * request — and three passes of cost analysis over one session produced $252,
 * $55 and $107, an error band wider than the margin of the business it was
 * meant to inform.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the REAL route inside workerd:
 * `POST /api/ai/prompt`, the real session manager, the real tool loop, the real
 * `ClaudeAPIBackend` and its real accumulator, and a real D1 whose `turn_spend`
 * table comes from `db/migrations/0019_turn_spend.sql`. The one double is the
 * Anthropic client, which is the network — and it reports usage the way the wire
 * does, on `message_start` and `message_delta`, so the counters asserted below
 * have been through the accumulator, the adapter's per-request ledger,
 * `turnUsage`, the manager's terminal event and `turnSpend` before anything here
 * looks at them.
 *
 * WHAT THESE CASES CANNOT PROVE, stated because one of the ticket's conditions
 * turns on it. Whether ANTHROPIC actually served a cached prefix is a fact about
 * a provider and is only observable against the real API. What is provable here
 * is everything between that number arriving and it being readable a week later:
 * that the counter is carried per turn rather than summed, that it is not
 * confused with the full-price input side, that it is priced at its own rate,
 * and that the request this host sends carries the cache breakpoint without
 * which the provider could never report one.
 */

const TENANT = 'req292'
/**
 * Two tenants of their own for the scoping case.
 *
 * NOT {@link TENANT} AND ONE OTHER, because the cases above have already written
 * to it and "one row, and it is mine" is the claim — a shared tenant would make
 * that assertion about how many turns the file had happened to run.
 */
const MINE = 'req292-mine'
const THEIRS = 'req292-theirs'

function workerEnv(tenantId = TENANT): Env {
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
    workerEnv(opts.tenantId),
    opts.ctx,
  )

/** One stored row, as the meter wrote it. */
interface SpendRow {
  turn_id: string
  tenant_id: string
  session_id: string
  started_at: string
  ended_at: string
  role: string
  backend: string
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

/**
 * The meter, read straight out of D1.
 *
 * NOT THROUGH THE WRITER'S OWN MODULE, deliberately. What the ticket asks for is
 * a row that outlives the isolate that produced it, and a reader that shared the
 * writer's SQL could pass against a table that was never created. `SELECT *`
 * also means a column dropped from the migration shows up as `undefined` here
 * rather than as a green test.
 */
async function meter(sessionId: string): Promise<SpendRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM turn_spend WHERE session_id = ? ORDER BY started_at, rowid',
  )
    .bind(sessionId)
    .all<SpendRow>()
  return results ?? []
}

/**
 * The same meter read the way it will actually be read: everything one TENANT
 * spent, in period order, through the index the migration creates for it.
 */
async function tenantMeter(tenantId: string): Promise<SpendRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM turn_spend WHERE tenant_id = ? ORDER BY started_at, rowid',
  )
    .bind(tenantId)
    .all<SpendRow>()
  return results ?? []
}

/**
 * Read frames until one of `kind` arrives, then stop reading — WITHOUT waiting
 * for the stream to close.
 *
 * That distinction is the whole of the abandonment case: the `done` frame goes
 * out before the host's `finally` has written anything, so a reader that waited
 * for the close would be waiting for the very work it is meant to prove
 * survives being walked away from.
 */
async function readTo(response: Response, kind: string): Promise<void> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    if (buffer.includes(`"kind":"${kind}"`)) {
      await reader.cancel()
      return
    }
  }
}

/** Drain an SSE response to completion — the turn, from the client's side. */
async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

async function openFor(prefix: string, tenantId = TENANT): Promise<string> {
  const { site } = await seedTenantSite(tenantId, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site }, { tenantId })
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
}

/** The model this project is configured to run — the second half of the price key. */
const MODEL = backendsDocument.claude.model

/** The blocks a request carried, normalised to the array form (REQ-182's reader). */
function blocks(req: ModelRequest): { text: string; cache_control?: unknown }[] {
  return typeof req.system === 'string' ? [{ text: req.system }] : req.system
}

describe('REQ-292 — the turn meter', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-292_an_ordinary_turn_leaves_one_priced_row', async () => {
    // AC1 and AC2, and the one case that asserts the whole shape of a row.
    const sessionId = await openFor('ordinary')
    setModelClient(
      scriptedClient([
        metered(
          {
            input_tokens: 1200,
            output_tokens: 300,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 4800,
          },
          says('Your home page looks fine.'),
        ),
      ]),
    )

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'How does it look?' }, { ctx }))
    // AWAITING WHAT THE ROUTE REGISTERED, not a timer. The `done` frame is sent
    // from inside the stream and the turn's own `finally` runs after it, so a
    // test that read the meter on the frame alone would be racing the write it
    // is asserting — and would pass against a host that never wrote at all.
    await settled()

    // THE ISOLATE THAT TOOK THE TURN IS GONE. Dropping the host and the chat
    // cache is that isolate going away, and it is the whole point of the
    // ticket: before this, everything below was in RAM and is now unreadable.
    resetAiHost()
    resetChatHost()

    const rows = await meter(sessionId)
    expect(rows).toHaveLength(1)
    const row = rows[0]

    // THE FOUR COUNTERS, AS THE ADAPTER REPORTED THEM. Not a total, not three of
    // them: a cached prefix is billed at a different rate from a fresh one, so a
    // row that could not tell them apart could not be re-priced afterwards.
    expect(row.input_tokens).toBe(1200)
    expect(row.output_tokens).toBe(300)
    expect(row.cache_read_input_tokens).toBe(0)
    expect(row.cache_creation_input_tokens).toBe(4800)

    // ONE MODEL ROUND TRIP, because the turn called no tools.
    expect(row.requests).toBe(1)

    // WHO SPENT IT, AND ON WHAT. `backend` and `model` together are the price
    // key — a row carrying only the model could not be re-priced, because
    // nobody would know whose rates to use.
    expect(row.session_id).toBe(sessionId)
    expect(row.tenant_id).toBe(TENANT)
    expect(row.backend).toBe('claude')
    expect(row.model).toBe(MODEL)
    expect(row.role).toBe('consultant')
    expect(row.outcome).toBe('complete')

    // A TURN IS AN INTERVAL, not an instant. Both ends are kept so a long turn
    // is visible as one rather than as the moment it happened to close.
    expect(row.started_at).not.toBe('')
    expect(Date.parse(row.ended_at)).toBeGreaterThanOrEqual(Date.parse(row.started_at))

    // NOTHING WAS DELEGATED, and the column says so with NULL rather than with
    // an empty list — this deployment composes no delegation surface at all, so
    // "none" and "asked and found none" are different claims.
    expect(row.attributed).toBeNull()

    // AND THE SETTLED COST (AC6). Both this and the raw counters, never either:
    // raw so a past period can be re-priced, settled so a bill does not move
    // when a rate is corrected.
    const rates = ratesFor('claude', MODEL)
    expect(rates).not.toBeNull()
    expect(row.cost_micros).toBe(
      Math.round(
        1200 * rates!.input +
          300 * rates!.output +
          0 * rates!.cache_read +
          4800 * rates!.cache_write,
      ),
    )
    // AND IT IS NOT WHAT ONE INPUT RATE WOULD GIVE. This is the assertion that
    // makes four rates load-bearing rather than decorative: price the whole
    // request at the full input rate and the answer is a different number.
    expect(row.cost_micros).not.toBe(Math.round((1200 + 300 + 4800) * rates!.input))
  })

  it('test_UAT_FC_REQ-292_a_tool_using_turn_records_the_round_trips_it_made', async () => {
    // AC2's second half. A turn with N tool calls is N+1 requests, and that
    // growth is the thing this ticket exists to make visible — the conversation
    // is replayed in full on every one of them, so a tool-using turn costs
    // several times what its prose suggests. An aggregate would hide exactly
    // that.
    const sessionId = await openFor('tools')
    const client = scriptedClient([
      metered({ input_tokens: 900, output_tokens: 40 }, calls('list_pages', {})),
      metered({ input_tokens: 1100, output_tokens: 80 }, says('You have one page: home.')),
    ])
    setModelClient(client)

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'What pages exist?' }, { ctx }))
    await settled()

    // The loop really ran twice — the double records what it was asked.
    expect(client.seen).toHaveLength(2)

    const [row] = await meter(sessionId)
    expect(row.requests).toBe(2)
    // AND THE COUNTERS ARE THE SUM ACROSS THOSE ROUND TRIPS, not the last one's.
    // Each request was billed; taking the latest would report one request's cost
    // as the whole turn's.
    expect(row.input_tokens).toBe(2000)
    expect(row.output_tokens).toBe(120)
  })

  it('test_UAT_FC_REQ-292_the_cache_read_counter_is_per_turn_and_grows', async () => {
    // AC3, and the condition the ticket says outranks the rest of the epic:
    // every cost figure in EPIC-20 assumes the caching REQ-143/144 landed is
    // working, and nobody has ever looked.
    //
    // WHAT IS PROVED HERE AND WHAT IS NOT. Whether the PROVIDER served a cached
    // prefix is only observable against the real API. What is observable offline
    // — and what was broken before this ticket, because the number reached
    // nothing durable — is that the counter survives per turn, that the second
    // turn's is not the first turn's, and that this host sends a request the
    // provider could answer with a cache read at all.
    const sessionId = await openFor('cache')
    const client = scriptedClient([
      metered(
        {
          input_tokens: 1200,
          output_tokens: 30,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 5000,
        },
        says('First.'),
      ),
      metered(
        {
          input_tokens: 60,
          output_tokens: 30,
          cache_read_input_tokens: 5000,
          cache_creation_input_tokens: 900,
        },
        says('Second.'),
      ),
    ])
    setModelClient(client)

    const first = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'One.' }, { ctx: first.ctx }))
    await first.settled()
    const second = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Two.' }, { ctx: second.ctx }))
    await second.settled()

    const rows = await meter(sessionId)
    expect(rows).toHaveLength(2)
    // TWO TURNS, TWO ROWS, EACH WITH ITS OWN READING. The first turn read
    // nothing from cache because there was nothing there yet; the second read
    // back what the first wrote. A meter that summed the session would show one
    // number and could never say that.
    expect(rows[0].cache_read_input_tokens).toBe(0)
    expect(rows[1].cache_read_input_tokens).toBe(5000)
    expect(rows[1].cache_read_input_tokens).toBeGreaterThan(rows[0].cache_read_input_tokens)
    // …AND IT IS NOT THE FULL-PRICE INPUT SIDE. On Anthropic's wire
    // `input_tokens` excludes both cache figures, so the second turn's tiny
    // uncached input beside its large cache read is precisely the shape a
    // working cache produces — and precisely what a single counter would lose.
    expect(rows[1].input_tokens).toBeLessThan(rows[0].input_tokens)
    // …AND IT IS PRICED AT ITS OWN RATE. The second turn moved five thousand
    // tokens from the full-price side to the cached side; if the cache read were
    // priced as input it would have cost more than the first turn, not less.
    expect(rows[1].cost_micros!).toBeLessThan(rows[0].cost_micros!)

    // THE MECHANICAL PRECONDITION, asserted on the request this host actually
    // sent. A provider cannot report a cache read for a request that carried no
    // breakpoint, so a zero in the column above would be unattributable without
    // this: it would mean either "caching is off" or "nothing is marked", and
    // only one of those is ours to fix.
    const marked = blocks(client.seen[1]).filter((b) => b.cache_control)
    expect(marked.length).toBeGreaterThan(0)
    expect(marked.map((b) => b.text).join('')).not.toBe('')
  })

  it('test_UAT_FC_REQ-292_a_turn_the_client_walked_away_from_is_recorded', async () => {
    // AC4, and the case the meter exists for as much as any. The record is
    // written in the host's `finally`, which runs AFTER the `done` frame has
    // gone out — so the client already has its answer and is entitled to stop
    // listening before the write has happened. That is the exact race BUG-46
    // found and `ctx.waitUntil` is what survives it: without it the isolate is
    // free to go the moment the response completes, and the turn the operator
    // was billed for would be the one turn with no record of it.
    const sessionId = await openFor('walked')
    setModelClient(
      scriptedClient([metered({ input_tokens: 700, output_tokens: 25 }, says('All done.'))]),
    )

    const { ctx, settled } = collectingCtx()
    const response = await post('/api/ai/prompt', { sessionId, text: 'Do the thing.' }, { ctx })
    // Read to the answer and then walk away, without waiting for the stream to
    // close — which is what a reload does, and is the earliest moment the client
    // can leave having got what it came for.
    await readTo(response, 'done')

    // NOTHING ELSE HOLDS THE ISOLATE. What the route registered is the only
    // reason the write below happened at all.
    await settled()

    const [row] = await meter(sessionId)
    expect(row).toBeDefined()
    expect(row.input_tokens).toBe(700)
    expect(row.output_tokens).toBe(25)
    // …AND IT IS RECORDED AS WHAT IT WAS. A turn that stopped is a row like any
    // other; the column is what later answers what abandonment costs.
    expect(row.outcome).not.toBe('')
  })

  it('test_UAT_FC_REQ-292_a_turn_cut_off_before_its_terminal_event_claims_nothing', async () => {
    // THE BOUNDARY, PINNED — because the alternative to pinning it is a meter
    // that is quietly wrong in the flattering direction.
    //
    // A turn cut off MID-GENERATION never produces a terminal event: the client
    // walking away closes the host's loop, which closes the manager's, which
    // closes the adapter's, and the adapter reports what it was billed for on
    // the `done` it never reaches. The counters for the requests it had already
    // sent survive only in that adapter's own per-segment ledger, which is not
    // reachable from this host — the manager's `turn_end` carries `{}` for the
    // same reason. So the spend for those requests is genuinely unavailable
    // here, and closing that would be an upstream change (the adapter's
    // ledger, or a stop on disconnect) rather than one this host can make.
    //
    // WHAT IS ASSERTED IS THEREFORE THE HONEST ANSWER AND NOT THE CONVENIENT
    // ONE: no row. A row of zeros would claim the turn was free, and a row of
    // the counters we happen to have would claim a total that is short. Silence
    // is the only one of the three that is true — the same "nothing, never
    // zero" rule the case below applies to a backend that never measured.
    const sessionId = await openFor('cutoff')
    const paced = pacedClient('Working on it… ', 'never arrives', {
      input_tokens: 900,
      output_tokens: 40,
    })
    setModelClient(paced)

    const { ctx, settled } = collectingCtx()
    const response = await post('/api/ai/prompt', { sessionId, text: 'A long job.' }, { ctx })
    const reader = response.body!.getReader()
    await reader.read()
    await paced.reached
    // The reader is gone mid-generation. This is the reload the operator
    // performs while the reply is still being written.
    await reader.cancel()
    paced.release()
    await settled()

    expect(await meter(sessionId)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-292_a_turn_that_measured_nothing_writes_no_row', async () => {
    // AC5. All-zero is what an empty or unreadable `usage` block folds to, and a
    // meter that recorded it would claim a turn that cost nothing — which is the
    // one thing a meter must never say. `says` reports no usage at all, which is
    // every turn this suite's siblings have ever run.
    const sessionId = await openFor('silent')
    setModelClient(scriptedClient([says('No numbers here.')]))

    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Say something.' }, { ctx }))
    await settled()

    expect(await meter(sessionId)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-292_a_delegated_workers_spend_is_kept_whole', async () => {
    // WHAT THE COLUMN IS FOR, and why it is JSON rather than four more counters.
    // An attributed entry names its OWN backend and role (REQ-148 §8), so
    // folding it into this row's counters would price a worker's tokens at this
    // row's `(backend, model)` — exactly the error the two-part price key exists
    // to prevent. So the row keeps it whole, and a later reader prices each
    // entry against its own rates.
    //
    // DRIVEN THROUGH THE PORT AND NOT THROUGH A TURN, because no turn can
    // produce one here: this product composes no delegation surface, and the
    // manager puts `attributed` on the junction's `turn_end` rather than on the
    // terminal event the host reads. What is provable — and what would
    // otherwise be a column nobody had ever written to — is that the record
    // survives the round trip to D1 and back with its structure intact.
    const worker = [
      { session: 'worker-1', role: 'researcher', backend: 'claude', usage: { input_tokens: 40 } },
    ]
    const session = `req292-attributed-${Date.now()}`
    await d1TurnSpend({ DB: env.DB }, TENANT)({
      session,
      turn: 'turn_req292attributed',
      startedAt: '2026-09-21T00:00:00.000Z',
      endedAt: '2026-09-21T00:00:01.000Z',
      role: 'consultant',
      backend: 'claude',
      model: 'a-model-nobody-has-priced',
      outcome: 'complete',
      requests: 1,
      usage: {
        input_tokens: 10,
        output_tokens: 2,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
      attributed: worker,
      costMicros: null,
    })

    const [row] = await meter(session)
    expect(JSON.parse(row.attributed!)).toEqual(worker)
    // AND AN UNPRICED PAIR IS NULL IN THE COLUMN, not zero. Measured but not
    // priced is recoverable from the counters beside it; "free" is not a thing
    // this table is allowed to say by accident.
    expect(row.cost_micros).toBeNull()
    expect(row.input_tokens).toBe(10)
  })

  it('test_UAT_FC_REQ-292_a_meter_belongs_to_one_tenant', async () => {
    // The scoping, and it is a property of how the meter is BUILT rather than of
    // a predicate anybody wrote: `router.ts` binds the recorder to the scope it
    // has already resolved, so nothing below it is ever handed another
    // business's meter and no query here could find one crossed.
    const mine = await openFor('mine', MINE)
    setModelClient(
      scriptedClient([metered({ input_tokens: 111, output_tokens: 11 }, says('Mine.'))]),
    )
    const a = collectingCtx()
    await drain(
      await post(
        '/api/ai/prompt',
        { sessionId: mine, text: 'Mine.' },
        { ctx: a.ctx, tenantId: MINE },
      ),
    )
    await a.settled()

    resetAiHost()
    resetChatHost()

    const theirs = await openFor('theirs', THEIRS)
    setModelClient(
      scriptedClient([metered({ input_tokens: 222, output_tokens: 22 }, says('Theirs.'))]),
    )
    const b = collectingCtx()
    await drain(
      await post(
        '/api/ai/prompt',
        { sessionId: theirs, text: 'Theirs.' },
        { ctx: b.ctx, tenantId: THEIRS },
      ),
    )
    await b.settled()

    expect((await tenantMeter(MINE)).map((r) => r.input_tokens)).toEqual([111])
    expect((await tenantMeter(THEIRS)).map((r) => r.input_tokens)).toEqual([222])
  })
})
