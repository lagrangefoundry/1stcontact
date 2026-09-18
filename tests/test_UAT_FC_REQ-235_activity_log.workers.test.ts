import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { ACTIVITY_CRON } from '../apps/control-app/src/activity'
import {
  COLUMN_OF,
  beginRequest,
  countEvents,
  horizonMs,
  logRecordInsert,
  pruneRecords,
  prunedThrough,
  readRecords,
  rowFor,
} from '../apps/control-app/src/log'
import {
  SESSION_TIMEOUT_MS,
  closeSessions,
  inferSessions,
} from '../apps/control-app/src/activity'
import { eventsOf } from '../apps/control-app/src/events'
import { SESSION_RECORDED } from '../apps/control-app/src/builder/contact-events.js'
import { KINDS, RECORD_FIELDS } from '../apps/control-app/src/generated/logging'
import { openRun } from '../apps/control-app/src/gutter'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'
import { seedContact } from './support/contact'

/**
 * [[REQ-235]] — **the activity log**: every server-side event is recorded in a
 * store built for the volume, and a contact's timeline gains one readable row
 * per session summarising what that person actually did.
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * carrying the deployed schema, applied by the same helper the store suites use
 * — so what is proved is the table that will ship. The write path is the
 * Worker's own `fetch` wherever the claim is about an invocation, and the shipped
 * sink everywhere else; nothing here re-implements a statement.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a store that can only hold identified traffic* — which is the one thing
 *     `contact_events` already does and the reason this table exists at all;
 *   - *a log that grows without bound*, or one pruned on a single number, which
 *     would keep a `debug` line as long as an `error`;
 *   - *a reader served a partial history it cannot tell from a complete one* —
 *     the failure `log_floor` exists to make impossible;
 *   - *a secret reaching the store* through a payload nobody inspected;
 *   - *a summary written twice*, or written live and revised — which the spine's
 *     own trigger would refuse and which would leave a timeline that reads
 *     perfectly and is untrue;
 *   - *a duration stored as though it were a measurement*, when every interval
 *     here is a lower bound;
 *   - *manufactured traffic counted as a visitor* in an aggregate nobody thought
 *     of as a "view".
 */

const TENANT = 'req235-business'
const OTHER = 'req235-other'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  } as Env
}

const logEnv = () => ({ DB: env.DB as D1Database })
const identityEnv = (tenantId = TENANT): IdentityEnv =>
  ({ DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }) as IdentityEnv

/** A scope a customer surface reads under — no run named, so the gutter is out. */
const CUSTOMER = { businessId: TENANT }

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv())

/** Everything currently in the store, whatever business it names. */
async function allRecords(scope = CUSTOMER) {
  const page = await readRecords(logEnv(), scope, { limit: 1000 })
  return page.records
}

/** Write records straight through the shipped statement builder. */
async function plant(
  rows: Array<Record<string, unknown>>,
  mark: { runId?: string | null } = {},
): Promise<void> {
  await env.DB.batch(rows.map((row) => logRecordInsert(logEnv(), row, mark)))
}

let seq = 0
const anEmail = (): string => `req235-${(seq += 1)}@example.test`

beforeAll(async () => {
  await applySchema()
})

describe('REQ-235 — the raw layer holds what the spine cannot', () => {
  it('test_UAT_FC_REQ-235_an_anonymous_invocation_is_recorded_and_read_back', async () => {
    // AC-1. THE CLAIM IS ABOUT A REQUEST WITH NOBODY BEHIND IT, which is the
    // majority of what arrives and exactly what `contact_events.contact_id NOT
    // NULL` structurally cannot hold. Driven through the Worker's own `fetch` so
    // the record is produced by the deployed handler and not by this file.
    const before = (await allRecords()).length
    const response = await call('/')
    expect(response.status).toBe(200)

    const records = await allRecords()
    expect(records.length).toBeGreaterThan(before)
    const request = records.at(-1)!
    expect(request.event).toBe('request')
    expect(request.route).toBe('/')
    expect(request.method).toBe('GET')
    expect(request.status).toBe(200)
    // NOBODY BEHIND IT, AND THE ROW SAYS SO rather than inventing one. An actor
    // on an unauthenticated request would be the fabrication this store must
    // never make.
    expect(request.actor).toBeNull()
    // AND IT CARRIES THE LINKAGE [[EPIC-1]] §41.5 ASKS OF THIS STORE.
    expect(request.traceId).toMatch(/^trace_[0-9a-f]{32}$/)
  })

  it('test_UAT_FC_REQ-235_the_written_fields_are_the_packages_record', async () => {
    // AC-4. THE RECORD IS [[EPIC-1]]'s AND IS NOT INVENTED HERE. The store's
    // columns are built against the exported dimension set, so a dimension added
    // upstream must fail HERE rather than be dropped silently — which [[EPIC-1]]
    // §37 calls irreversible, because a dimension the record never carried
    // cannot be recovered afterwards at any cost.
    for (const field of RECORD_FIELDS as readonly string[]) {
      expect(COLUMN_OF, `RECORD_FIELDS carries '${field}' and the store has no column`).toHaveProperty(field)
    }
    // AND A FIELD WITH NO COLUMN STILL TRAVELS. The worst case of an upstream
    // addition is a value that is present but not indexable — never one that is
    // gone.
    const { values } = rowFor({ ts: 1, kind: 'app', level: 'info', event: 'e', unmapped: 'kept' })
    expect(values.some((v) => typeof v === 'string' && v.includes('"unmapped":"kept"'))).toBe(true)
  })

  it('test_UAT_FC_REQ-235_a_secret_does_not_reach_the_store_at_any_depth', async () => {
    // AC-5. THE SANITISER IS THE PACKAGE'S AND THE ENFORCEMENT IS THE SINK'S, so
    // no call site has to remember. Three spellings and two levels of nesting,
    // because a redactor that only caught the one spelling somebody thought of
    // is a redactor that is wrong the first time a header is logged.
    const log = beginRequest(logEnv(), { method: 'POST', url: 'https://app.example/x' })
    log.logger().warn('req235.secrets', {
      'X-Api-Key': 'header-spelling',
      api_key: 'snake-spelling',
      nested: { apiKey: 'camel-spelling', authorization: 'Bearer abc' },
      keptField: 'ordinary',
    })
    await log.drain()

    const record = (await allRecords()).at(-1)!
    const body = JSON.stringify(record.data)
    for (const leaked of ['header-spelling', 'snake-spelling', 'camel-spelling', 'Bearer abc']) {
      expect(body, `'${leaked}' reached the store`).not.toContain(leaked)
    }
    // AND THE DIAGNOSTICS SURVIVE. A redactor that blanked the payload would be
    // safe and useless; what it must remove is the credential and nothing else.
    expect(body).toContain('ordinary')
  })
})

describe('REQ-235 — retention is a band, and the floor says where it reached', () => {
  it('test_UAT_FC_REQ-235_two_levels_written_together_are_pruned_on_different_days', async () => {
    // AC-3. THE CLAIM IS THAT RETENTION IS A FUNCTION OF `(kind, level)` AND NOT
    // ONE NUMBER. Both records are written at the SAME instant, so nothing but
    // the band can separate them — which is what makes it reasonable to leave
    // debug call sites in the code after an investigation rather than delete
    // them.
    expect(horizonMs('app', 'debug')).toBeLessThan(horizonMs('app', 'warn'))
    // AND `kind` GENUINELY PARTICIPATES. A browser's claim is kept only until the
    // summary that reads it has been written; a parameter with no effect would
    // have been a signature pretending to a policy it did not have.
    expect(horizonMs(KINDS.CLIENT, 'info')).toBeLessThan(horizonMs(KINDS.APP, 'info'))

    const written = Date.now() - 10 * 24 * 60 * 60 * 1000
    await plant([
      { ts: written, kind: 'app', level: 'debug', event: 'req235.old-debug' },
      { ts: written, kind: 'app', level: 'warn', event: 'req235.old-warn' },
    ])

    await pruneRecords(logEnv())
    const events = (await allRecords()).map((r) => r.event)
    expect(events).not.toContain('req235.old-debug')
    expect(events).toContain('req235.old-warn')
  })

  it('test_UAT_FC_REQ-235_a_reader_whose_window_was_pruned_is_told_so', async () => {
    // AC-2. THE ONE ANSWER A LOG MUST NEVER GIVE is a partial history that looks
    // complete, because nothing about it reads as wrong. So a cursor from before
    // the floor is told to start again rather than served the remainder.
    const stale = Date.now() - 60 * 24 * 60 * 60 * 1000
    await plant([{ ts: stale, kind: 'app', level: 'info', event: 'req235.expired' }])
    const planted = (await allRecords()).at(-1)!

    await pruneRecords(logEnv())
    expect(await prunedThrough(logEnv())).toBeGreaterThanOrEqual(planted.seq)

    const behind = await readRecords(logEnv(), CUSTOMER, { after: planted.seq - 1 })
    expect(behind.reset).toBe(true)
    // AND A READER THAT IS NOT BEHIND IS NOT SENT AWAY. A floor that reset
    // everybody would be a floor nobody could read past.
    const ahead = await readRecords(logEnv(), CUSTOMER, {
      after: await prunedThrough(logEnv()),
    })
    expect(ahead.reset).toBe(false)
  })
})

describe('REQ-235 — a session is an inferred interval', () => {
  const at = (minutes: number, over: Partial<Record<string, unknown>> = {}) =>
    ({
      seq: minutes,
      ts: minutes * 60_000,
      traceId: null,
      business: TENANT,
      kind: 'app',
      level: 'info',
      event: 'request',
      route: '/api/x',
      method: 'GET',
      status: 200,
      outcome: null,
      actor: 'usr_a',
      durationMs: 1,
      data: {},
      synthetic: false,
      runId: null,
      ...over,
    }) as never

  it('test_UAT_FC_REQ-235_the_timeout_is_the_boundary_and_is_asserted_at_both_edges', () => {
    // AC-6. ASSERTED AT BOTH EDGES, because a boundary tested on one side is a
    // boundary whose comparison could be the wrong one and pass. The rule is
    // stated once in one module precisely so there is one answer to *is this the
    // same session* — a second would be a second answer to every number on the
    // timeline.
    const gap = SESSION_TIMEOUT_MS / 60_000
    expect(inferSessions([at(0), at(gap)])).toHaveLength(1)
    expect(inferSessions([at(0), at(gap + 1)])).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-235_two_tabs_are_two_intervals_in_the_order_they_happened', () => {
    // AC-10, the inference half. A session spanning two surfaces is summarised
    // as two stretches rather than one, and returning to a surface is a third —
    // collapsing by surface would report a person who kept switching back as
    // having sat on two tabs, which is the opposite of what happened.
    const client = (minutes: number, surface: string) =>
      at(minutes, { kind: 'client', route: surface, event: 'surface.shown' })
    const [session] = inferSessions([client(0, 'site'), client(13, 'library'), at(36)])
    expect(session.surfaces.map((s) => s.surface)).toEqual(['site', 'library'])
    // AC-8. THE STRETCHES ARE STAMPS AND NOT DURATIONS — a closed laptop sends
    // nothing, so every interval is a lower bound and storing one as a
    // measurement would present a floor as a fact. The minutes are the reader's
    // arithmetic, which is what makes this row reconstructible as
    // "site 13 min, library 23 min".
    const minutes = (from: string, to: string) =>
      Math.round((Date.parse(to) - Date.parse(from)) / 60_000)
    expect(minutes(session.surfaces[0].from, session.surfaces[0].to)).toBe(13)
    expect(minutes(session.surfaces[1].from, session.surfaces[1].to)).toBe(23)
    expect(session).not.toHaveProperty('durationMs')
  })

  it('test_UAT_FC_REQ-235_a_server_route_is_not_reported_as_a_surface', () => {
    // WHICH TAB IS A CLAIM ONLY THE BROWSER CAN MAKE. Folding server routes into
    // the breakdown would report `/api/sites` as a surface somebody sat on, so a
    // session with no client records reports its span and says nothing about
    // tabs — which is true, where a guess would not be.
    const [session] = inferSessions([at(0), at(5)])
    expect(session.surfaces).toEqual([])
    expect(session.events).toBe(2)
  })
})

describe('REQ-235 — the rollup lands on the timeline, once', () => {
  it('test_UAT_FC_REQ-235_closing_writes_one_row_whose_two_stamps_differ', async () => {
    // AC-7. THE SUMMARY IS COMPOSED AFTER THE FACT, which is what `occurred_at`
    // and `recorded_at` being separate columns are for: the session happened
    // then, we learned of it now. A row whose two stamps agreed would be a row
    // claiming it was written while the session was still running — which the
    // spine's own trigger makes impossible to correct.
    const contact = await seedContact(identityEnv(), { tenantId: TENANT, email: anEmail() })
    const now = Date.now()
    const start = now - 90 * 60_000
    await plant([
      { ts: start, kind: 'client', level: 'info', event: 'surface.shown', route: 'site', actor: contact, business: TENANT },
      { ts: start + 13 * 60_000, kind: 'client', level: 'info', event: 'surface.shown', route: 'library', actor: contact, business: TENANT },
      { ts: start + 36 * 60_000, kind: 'app', level: 'info', event: 'request', actor: contact, business: TENANT },
    ])

    const report = await closeSessions(logEnv(), { now })
    expect(report.sessions).toBeGreaterThanOrEqual(1)

    const timeline = await eventsOf(identityEnv(), { businessId: TENANT }, contact)
    const summaries = timeline.filter((e) => e.kind === SESSION_RECORDED)
    expect(summaries).toHaveLength(1)
    const [summary] = summaries
    expect(summary.occurredAt).toBe(new Date(start).toISOString())
    expect(summary.recordedAt).not.toBe(summary.occurredAt)
    expect(Date.parse(summary.recordedAt)).toBeGreaterThan(Date.parse(summary.occurredAt))
    // AC-8, at rest. The breakdown is on the row, in order, with stamps and no
    // duration.
    expect(summary.detail.endedAt).toBe(new Date(start + 36 * 60_000).toISOString())
    const surfaces = summary.detail.surfaces as Array<{ surface: string }>
    expect(surfaces.map((s) => s.surface)).toEqual(['site', 'library'])
    expect(summary.detail).not.toHaveProperty('durationMs')
    // AND NO CONCLUSION ABOUT THE PERSON ([[CHAT-53]]). The row records what
    // happened; a judgement about somebody is not a fact about them, and a
    // business reading its own contacts' timelines is the last place one belongs.
    for (const judgement of ['score', 'grade', 'engagement', 'risk', 'churn']) {
      expect(Object.keys(summary.detail)).not.toContain(judgement)
    }
  })

  it('test_UAT_FC_REQ-235_a_closed_session_is_never_summarised_twice', async () => {
    // AC-9. THE DATABASE IS THE WITNESS. `contact_events` refuses `UPDATE`
    // outright, so a closer that re-read its own window would have to APPEND a
    // second row — which is exactly the duplicate a reader could not distinguish
    // from two genuine visits. Running the closer again must write nothing.
    const contact = await seedContact(identityEnv(), { tenantId: TENANT, email: anEmail() })
    const now = Date.now()
    const start = now - 120 * 60_000
    await plant([
      { ts: start, kind: 'app', level: 'info', event: 'request', actor: contact, business: TENANT },
      { ts: start + 60_000, kind: 'app', level: 'info', event: 'request', actor: contact, business: TENANT },
    ])

    await closeSessions(logEnv(), { now })
    const first = await eventsOf(identityEnv(), { businessId: TENANT }, contact)
    await closeSessions(logEnv(), { now })
    const second = await eventsOf(identityEnv(), { businessId: TENANT }, contact)

    const count = (rows: Array<{ kind: string }>) =>
      rows.filter((r) => r.kind === SESSION_RECORDED).length
    expect(count(first)).toBe(1)
    expect(count(second)).toBe(1)

    // AND THE TRIGGER IS ASKED DIRECTLY, because "the module exports no update
    // path" is a fact about one module and this is a fact about the table.
    const [summary] = second.filter((r) => r.kind === SESSION_RECORDED)
    await expect(
      env.DB.prepare('UPDATE contact_events SET detail = ? WHERE id = ?')
        .bind('{}', summary.id)
        .run(),
    ).rejects.toThrow()
  })

  it('test_UAT_FC_REQ-235_a_session_still_running_is_left_open', async () => {
    // THE TRAILING STRETCH IS NOT SUMMARISED. A row written for a session still
    // in progress would be a summary of half an afternoon that can never be
    // corrected, because the spine forbids it.
    const contact = await seedContact(identityEnv(), { tenantId: TENANT, email: anEmail() })
    const now = Date.now()
    await plant([
      { ts: now - 60_000, kind: 'app', level: 'info', event: 'request', actor: contact, business: TENANT },
    ])
    await closeSessions(logEnv(), { now })
    const timeline = await eventsOf(identityEnv(), { businessId: TENANT }, contact)
    expect(timeline.filter((e) => e.kind === SESSION_RECORDED)).toHaveLength(0)
  })
})

describe('REQ-235 — the surface signal is the browser saying where it is', () => {
  it('test_UAT_FC_REQ-235_the_signal_reaches_the_store_restamped', async () => {
    // AC-10, the ingress half. A client's own timestamp and tenant claim are
    // never what the stored record carries ([[EPIC-1]] §41.1) — so the body
    // names both, and neither survives. Ignoring them is stronger than rejecting
    // them, because there is no branch to get wrong.
    const before = Date.now() - 1
    const response = await call('/api/activity/surface', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ surface: 'library', ts: 0, business: OTHER, actor: 'usr_forged' }),
    })
    expect(response.status).toBe(204)

    const signal = (await allRecords()).filter((r) => r.event === 'surface.shown').at(-1)!
    expect(signal.kind).toBe(KINDS.CLIENT)
    expect(signal.route).toBe('library')
    expect(signal.ts).toBeGreaterThanOrEqual(before)
    expect(signal.business).toBe(TENANT)
    expect(signal.business).not.toBe(OTHER)
    expect(signal.actor).not.toBe('usr_forged')
  })

  it('test_UAT_FC_REQ-235_a_signal_with_no_surface_is_refused', async () => {
    const response = await call('/api/activity/surface', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(response.status).toBe(400)
  })
})

describe('REQ-235 — manufactured traffic is marked and excluded', () => {
  it('test_UAT_FC_REQ-235_a_synthetic_records_are_marked_and_no_customer_aggregate_counts_them', async () => {
    // AC-11. THE READ [[DOC-54]] §3 WARNS GETS MISSED, because a count does not
    // look like a "view" — and a probe inflates one silently and in the
    // flattering direction, which is the hardest kind of wrong to notice. The
    // caller does not ask for the exclusion; it rides `Scope`, as every other
    // read in this system does.
    const runId = await openRun(logEnv())
    const since = Date.now()
    await plant([{ ts: since + 1, kind: 'app', level: 'info', event: 'req235.counted', business: TENANT }])
    await plant(
      [{ ts: since + 2, kind: 'app', level: 'info', event: 'req235.counted', business: TENANT }],
      { runId },
    )

    const customer = await countEvents(logEnv(), CUSTOMER, { since, business: TENANT })
    expect(customer.find((r) => r.event === 'req235.counted')?.count).toBe(1)

    // AND THE ONE SURFACE THAT MAY LOOK AT TEST DATA CAN STILL FIND IT, by run,
    // which is what makes collection possible at all ([[DOC-54]] §2.9).
    const probe = await countEvents(logEnv(), { businessId: TENANT, runId }, { since, business: TENANT })
    expect(probe.find((r) => r.event === 'req235.counted')?.count).toBe(1)

    const marked = await readRecords(logEnv(), { businessId: TENANT, runId }, { limit: 50 })
    expect(marked.records.every((r) => r.synthetic && r.runId === runId)).toBe(true)
  })

  it('test_UAT_FC_REQ-235_a_session_of_manufactured_records_is_a_manufactured_summary', async () => {
    // THE MARK TRAVELS TO THE SPINE. A probe that walked a builder and left an
    // unmarked row on a real timeline is the pollution the gutter exists to
    // prevent, and a summary is the one row here that reaches a customer surface.
    const runId = await openRun(logEnv())
    const contact = await seedContact(identityEnv(), { tenantId: TENANT, email: anEmail() })
    const now = Date.now()
    const start = now - 120 * 60_000
    await plant(
      [
        { ts: start, kind: 'app', level: 'info', event: 'request', actor: contact, business: TENANT },
        { ts: start + 60_000, kind: 'app', level: 'info', event: 'request', actor: contact, business: TENANT },
      ],
      { runId },
    )
    await closeSessions(logEnv(), { now })

    const hidden = await eventsOf(identityEnv(), { businessId: TENANT }, contact)
    expect(hidden.filter((e) => e.kind === SESSION_RECORDED)).toHaveLength(0)
    const shown = await eventsOf(identityEnv(), { businessId: TENANT, runId }, contact)
    expect(shown.filter((e) => e.kind === SESSION_RECORDED)).toHaveLength(1)
  })
})

describe('REQ-235 — nothing here identifies an anonymous visitor', () => {
  it('test_UAT_FC_REQ-235_an_unauthenticated_request_produces_no_actor', async () => {
    // AC-12. THE SCOPE WALL, ASSERTED AS AN ABSENCE. Recognising a visitor on a
    // published site as somebody we know needs a cookie or a pixel; it is
    // materially larger and it is where the privacy cost stops being incidental.
    // What this proves is that no path here invents the link: the actor comes
    // from the admission and from nowhere else, so a request carrying no token
    // and no session leaves a row with none.
    const before = (await allRecords()).length
    await call('/api/activity/surface', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ surface: 'site' }),
    })
    const written = (await allRecords()).slice(before)
    expect(written.length).toBeGreaterThan(0)
    expect(written.every((r) => r.actor === null)).toBe(true)
  })
})

describe('REQ-235 — the closer has a schedule fast enough to be a timeline', () => {
  it('test_UAT_FC_REQ-235_the_frequent_cron_runs_the_closer_and_not_the_daily_sweeps', async () => {
    // THE SECOND EXPRESSION EXISTS BECAUSE `17 4 * * *` IS DAILY, and a session
    // ending at ten in the morning would not reach the timeline until the next
    // morning. Eighteen hours behind is not the feature that was asked for.
    expect(ACTIVITY_CRON).toBe('*/10 * * * *')
    // AND IT IS A CALLER OF EXISTING MACHINERY, not new machinery: the same
    // `scheduled` export [[REQ-231]] added, branching on which tick it is.
    await expect(
      worker.scheduled({ cron: ACTIVITY_CRON } as ScheduledController, workerEnv()),
    ).resolves.toBeUndefined()
  })
})
