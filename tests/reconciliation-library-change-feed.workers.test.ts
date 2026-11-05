import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { SCHEMA_STATEMENTS } from '../apps/control-app/src/generated/ticketing'
import BASELINE from '../db/migrations/0001_baseline.sql?raw'
import { applySchema } from './support/d1-site-factory'

/**
 * Library (story-1500b111) — **the origin half of the change feed**, reconciled
 * in BUNDLE-38 (REQ-201), in workerd against real D1.
 *
 *   - AC-2325: `/api/material` answers `{material, seq}` with the head read
 *     before the list; `/api/material/changes` is `text/event-stream`, opens with
 *     a `ready` frame whose `id:` is the cursor, keys every frame by seq, keeps an
 *     idle connection alive with comment heartbeats, prefers `Last-Event-ID` over
 *     `?since`, starts from the head with neither, and refuses a non-integer.
 *   - AC-2326 (origin half): an event's row equals the same material's row in a
 *     fresh list read, built with no read of the ticket rows per event, and
 *     carries kind, cause and whether the body moved; an `exit` carries the uid.
 *   - AC-2327: a feed under one business never carries another business's
 *     material, whatever the URL says, nor tickets that are not material.
 *   - AC-2328: the baseline migration carries `ticket_changes` and
 *     `ticket_change_floor` exactly as the ticket component declares them, and a
 *     database built from it delivers a material write.
 *
 * EVERY CLAIM GOES THROUGH `route()`. The change log is written by the
 * component's own accessor in the same batch as the write; nothing here inserts
 * a log row. The one double is the tailer cadence (10ms instead of 2s).
 */

const APPLIED = applySchema()
const SETTLE_MS = 2000
const TEST_POLL_MS = 10

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  vi.useRealTimers()
})

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/** Router deps opening the real store, with a fast tailer when one is asked for. */
function deps(dbOver?: D1Database): RouterDeps {
  return {
    tickets: (e, scope, opts) =>
      ticketStoreFor(dbOver ? { ...(e as RouterEnv), DB: dbOver } : (e as RouterEnv), scope, {
        ...opts,
        ...(opts?.changePollMs == null ? {} : { changePollMs: TEST_POLL_MS }),
      }),
  }
}

async function call(
  business: string,
  path: string,
  d: RouterDeps,
  headers: Record<string, string> = {},
): Promise<Response> {
  const res = await route(
    new Request(`https://control.test/b/${business}${path}`, { headers }),
    routerEnv(),
    scopeOf(business),
    d,
  )
  if (!res) throw new Error(`no route answered ${path}`)
  return res
}

type Frame = { id: string | null; data: Record<string, unknown> | null; comment: string | null }

/** Read raw SSE blocks off a stream until `want` data frames arrive or time runs out. */
async function frames(
  res: Response,
  want: number,
  timeoutMs = SETTLE_MS,
  opts: { keepOpen?: boolean; reader?: ReadableStreamDefaultReader<Uint8Array> } = {},
): Promise<Frame[]> {
  const reader = opts.reader ?? (res.body as ReadableStream<Uint8Array>).getReader()
  const decoder = new TextDecoder()
  const out: Frame[] = []
  let buffer = ''
  const deadline = Date.now() + timeoutMs
  try {
    while (out.filter((f) => f.data).length < want && Date.now() < deadline) {
      const chunk = await Promise.race([
        reader.read(),
        new Promise<{ value: undefined; done: false }>((resolve) =>
          setTimeout(() => resolve({ value: undefined, done: false }), 50),
        ),
      ])
      if (chunk.done) break
      if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true })
      let split: number
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, split)
        buffer = buffer.slice(split + 2)
        const lines = block.split('\n')
        const dataLine = lines.find((l) => l.startsWith('data:'))
        const idLine = lines.find((l) => l.startsWith('id:'))
        const commentLine = lines.find((l) => l.startsWith(':'))
        out.push({
          id: idLine ? idLine.slice(3).trim() : null,
          data: dataLine ? (JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>) : null,
          comment: commentLine ?? null,
        })
      }
    }
  } finally {
    if (!opts.keepOpen) await reader.cancel().catch(() => {})
  }
  return out
}

const events = (fs: Frame[]) => fs.filter((f) => f.data && f.data.kind !== 'ready')

async function storeFor(business: string): Promise<TicketStore> {
  return ticketStoreFor(routerEnv(), scopeOf(business), { changePollMs: TEST_POLL_MS })
}

async function writeMaterial(store: TicketStore, title: string, fields: Record<string, unknown> = {}): Promise<string> {
  const { ticket } = await store.create({
    type: 'material',
    title,
    body: '',
    fields: {
      filename: `${title}.png`,
      kind: 'image',
      role: 'site',
      rights: 'owned',
      republishable: true,
      exportable: true,
      origin: 'uploaded',
      description_status: 'no_describer',
      ...fields,
    },
  })
  return ticket.uid
}

const list = async (business: string, d: RouterDeps) =>
  (await (await call(business, '/api/material', d)).json()) as {
    material: Array<Record<string, unknown> & { uid: string }>
    seq: number
  }

const archiver = (store: TicketStore) => store as unknown as { archive(a: { uid: string }): Promise<unknown> }

// ── AC-2325 ──────────────────────────────────────────────────────────────────

describe('AC-2325 — the list hands out its cursor, and the feed is SSE keyed by seq', () => {
  it('test_UAT_AC2325_list_cursor_ready_frame_seq_ids_last_event_id_precedence_head_default_and_400', async () => {
    const business = 'ac2325-feed'
    const d = deps()
    const store = await storeFor(business)
    await writeMaterial(store, 'already-here')

    // `/api/material` answers {material, seq}; seq is a real position.
    const first = await list(business, d)
    expect(Object.keys(first).sort()).toEqual(['material', 'seq'])
    expect(first.material).toHaveLength(1)
    expect(Number.isSafeInteger(first.seq)).toBe(true)
    expect(first.seq).toBeGreaterThan(0)

    // A feed opened `?since=` that seq receives a later write.
    const feed = await call(business, `/api/material/changes?since=${first.seq}`, d)
    expect(feed.status).toBe(200)
    expect(feed.headers.get('content-type')).toMatch(/^text\/event-stream/)
    const uid = await writeMaterial(store, 'written-after-the-read')
    const got = await frames(feed, 2)
    // The FIRST frame is `ready`, and its id is the opening cursor.
    expect(got[0].data?.kind).toBe('ready')
    expect(got[0].id).toBe(String(first.seq))
    const change = events(got)[0]
    expect(change.data?.uid).toBe(uid)
    expect(change.id).toBe(String(change.data?.seq))
    expect(Number(change.id)).toBeGreaterThan(first.seq)

    // The head was read BEFORE the list: a later read's cursor covers the new
    // write, and every row in the earlier read is at or before its cursor.
    const second = await list(business, d)
    expect(second.material.map((r) => r.uid)).toContain(uid)
    expect(second.seq).toBeGreaterThanOrEqual(Number(change.id))

    // Last-Event-ID WINS over a `since` naming the head (which would skip the write).
    const resumed = await call(business, `/api/material/changes?since=${second.seq}`, d, {
      'last-event-id': String(first.seq),
    })
    const again = await frames(resumed, 2)
    expect(again[0].id).toBe(String(first.seq))
    expect(events(again)[0]?.data?.uid).toBe(uid)

    // Last-Event-ID alone, no query cursor: resumes after that record, losing nothing.
    const missed = await writeMaterial(store, 'written-while-disconnected')
    const reconnect = await call(business, '/api/material/changes', d, { 'last-event-id': String(change.id) })
    const caught = await frames(reconnect, 2)
    expect(caught[0].id).toBe(String(change.id))
    expect(events(caught).map((f) => f.data?.uid)).toEqual([missed])

    // NEITHER cursor: the feed starts from the current head.
    const head = await list(business, d)
    const fromNow = await call(business, '/api/material/changes', d)
    const nowFrames = await frames(fromNow, 2, 400)
    expect(nowFrames[0].data?.kind).toBe('ready')
    expect(nowFrames[0].id).toBe(String(head.seq))
    expect(events(nowFrames)).toEqual([])

    // A cursor that is not an integer is a 400, in the query and in the header.
    const bad = await call(business, '/api/material/changes?since=abc', d)
    expect(bad.status).toBe(400)
    expect(((await bad.json()) as { error: string }).error).toMatch(/integer/i)
    const badHeader = await call(business, '/api/material/changes', d, { 'last-event-id': 'abc' })
    expect(badHeader.status).toBe(400)
  })

  it('test_UAT_AC2325_an_idle_feed_is_kept_alive_with_sse_comment_heartbeats', async () => {
    // The heartbeat interval is twenty seconds, so the interval clock is faked;
    // everything else — the route, the store, D1 — is real.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const business = 'ac2325-heartbeat'
    const d = deps()
    const res = await call(business, '/api/material/changes', d)
    const reader = (res.body as ReadableStream<Uint8Array>).getReader()
    const opening = await frames(res, 1, SETTLE_MS, { keepOpen: true, reader })
    expect(opening[0].data?.kind).toBe('ready')

    vi.advanceTimersByTime(20_000)
    const idle = await frames(res, 1, 300, { reader })
    const heartbeat = idle.find((f) => f.comment)
    expect(heartbeat, 'an SSE comment frame arrives on an idle connection').toBeTruthy()
    expect(heartbeat!.data).toBeNull()
  })
})

// ── AC-2326 (origin half) ────────────────────────────────────────────────────

describe("AC-2326 — an event's row is the list's own row, built from the change", () => {
  it('test_UAT_AC2326_event_row_equals_the_re_read_list_row_and_is_built_without_reading_ticket_rows', async () => {
    const business = 'ac2326-row'
    // Count reads of the TICKET ROWS (not the change log) made while the feed runs.
    let ticketReads = 0
    let logReads = 0
    let counting = false
    const real = env.DB as D1Database
    const counted = new Proxy(real, {
      get(target, prop) {
        const v = Reflect.get(target, prop, target)
        if (prop === 'prepare') {
          return (sql: string) => {
            if (counting && /\bFROM\s+tickets\b/i.test(sql)) ticketReads += 1
            if (counting && /\bFROM\s+ticket_changes\b/i.test(sql)) logReads += 1
            return (v as D1Database['prepare']).call(target, sql)
          }
        }
        return typeof v === 'function' ? v.bind(target) : v
      },
    }) as D1Database
    const d = deps(counted)
    const store = await storeFor(business)
    const uid = await writeMaterial(store, 'a-shopfront', { placed_on: ['salon'] })

    const listed = await list(business, d)
    const feed = await call(business, `/api/material/changes?since=${listed.seq}`, d)
    counting = true

    // A row-visible field and the body move, written elsewhere.
    await store.update({
      uid,
      patch: { body: 'A shopfront in morning light.', fields: { description_status: 'ok', placed_on: [] } },
    })
    // A second material arrives, and the first leaves.
    const entered = await writeMaterial(store, 'arrived-elsewhere')
    await archiver(store).archive({ uid })

    const got = events(await frames(feed, 4))
    counting = false
    const [upd, enter, exit] = got

    expect(upd.data?.kind).toBe('update')
    expect(upd.data?.cause).toBe('update')
    expect(upd.data?.body_changed).toBe(true)
    expect(enter.data?.kind).toBe('enter')
    expect(enter.data?.cause).toBe('create')
    expect(enter.data?.body_changed).toBe(false)
    expect(exit.data?.kind).toBe('exit')
    expect(exit.data?.uid).toBe(uid)
    expect(exit.data?.row).toBeNull()

    // No read of the ticket rows was spent building any of those events — and the
    // counter is genuinely on the feed's path, because it saw the log tail reads.
    expect(logReads).toBeGreaterThan(0)
    expect(ticketReads).toBe(0)

    // THE EVENT ROW EQUALS THE LIST ROW: same shape, same values, no body.
    const after = await list(business, deps())
    const enteredRow = after.material.find((r) => r.uid === entered)!
    expect(enter.data?.row).toEqual(enteredRow)
    expect(enter.data?.row).not.toHaveProperty('body')

    // And the update's row equals what a re-read returned at that moment.
    const updRow = upd.data?.row as Record<string, unknown>
    expect(updRow.description_status).toBe('ok')
    expect(updRow.placed_on).toEqual([])
    expect(Object.keys(updRow).sort()).toEqual(Object.keys(enteredRow).sort())
  })
})

// ── AC-2327 ──────────────────────────────────────────────────────────────────

describe("AC-2327 — the feed carries only the scoped business's material", () => {
  it('test_UAT_AC2327_a_second_business_writes_and_non_material_tickets_never_reach_the_subscription', async () => {
    const mine = 'ac2327-mine'
    const theirs = 'ac2327-theirs'
    const d = deps()
    const ours = await storeFor(mine)
    const others = await storeFor(theirs)

    const listed = await list(mine, d)
    // Two URL forms that try to widen the scope; neither may.
    const plain = await call(mine, `/api/material/changes?since=${listed.seq}`, d)
    const widened = await call(
      mine,
      `/api/material/changes?since=0&business=${theirs}&tenant=${theirs}&tenant_id=${theirs}`,
      d,
    )

    // The other business creates, updates and archives material — first, and more.
    const theirUid = await writeMaterial(others, 'their-secret-brand-book')
    await others.update({ uid: theirUid, patch: { body: 'Confidential.', fields: { description_status: 'ok' } } })
    await archiver(others).archive({ uid: theirUid })
    // A ticket that is not material, in OUR business.
    const { ticket: brief } = await ours.create({
      type: 'brief',
      title: 'Our brief',
      body: 'Decisions so far.',
      fields: { site_slug: 'somewhere' },
    })
    // And our own material write, which must arrive.
    const ourUid = await writeMaterial(ours, 'our-own-logo')

    for (const res of [plain, widened]) {
      const got = events(await frames(res, 4))
      const uids = got.map((f) => f.data?.uid)
      expect(uids).toContain(ourUid)
      expect(uids).not.toContain(theirUid)
      expect(uids).not.toContain(brief.uid)
      const text = JSON.stringify(got)
      expect(text).not.toContain('their-secret-brand-book')
      expect(text).not.toContain('Confidential.')
      expect(text).not.toContain('Our brief')
    }

    // The other business's list, read under OUR scope, is not reachable either.
    const ourList = await list(mine, d)
    expect(ourList.material.map((r) => r.uid)).toEqual([ourUid])
  })
})

// ── AC-2328 ──────────────────────────────────────────────────────────────────

const flat = (s: string) => s.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim()
const withoutComments = (sql: string) =>
  sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')

describe('AC-2328 — the baseline carries the change-log tables as the component declares them', () => {
  it('test_UAT_AC2328_baseline_change_log_tables_match_the_component_and_deliver_a_material_write', async () => {
    // (a) THE COMPONENT'S OWN STATEMENTS for the change log, each present in the
    // baseline verbatim (whitespace aside).
    const declared = (SCHEMA_STATEMENTS as string[]).filter((s) => /ticket_change/.test(s))
    const names = declared.map((s) => /(?:TABLE|INDEX)\s+IF NOT EXISTS\s+(\w+)/i.exec(s)?.[1])
    expect(names.sort()).toEqual(
      ['idx_ticket_changes_tenant_seq', 'idx_ticket_changes_write', 'ticket_change_floor', 'ticket_changes'].sort(),
    )
    const baseline = flat(withoutComments(BASELINE))
    for (const stmt of declared) {
      expect(baseline, `baseline is missing: ${flat(stmt)}`).toContain(flat(stmt))
    }

    // (b) A DATABASE BUILT FROM THE BASELINE carries those objects, with the same
    // definitions SQLite recorded from the component's own text.
    const db = env.DB as D1Database
    const { results } = await db
      .prepare(
        "SELECT name, sql FROM sqlite_master WHERE name IN ('ticket_changes','ticket_change_floor','idx_ticket_changes_tenant_seq','idx_ticket_changes_write')",
      )
      .all<{ name: string; sql: string }>()
    const applied = new Map(results.map((r) => [r.name, flat(r.sql.replace(/IF NOT EXISTS\s+/i, ''))]))
    for (const stmt of declared) {
      const name = /(?:TABLE|INDEX)\s+IF NOT EXISTS\s+(\w+)/i.exec(stmt)![1]
      expect(applied.get(name), name).toBe(flat(stmt.replace(/IF NOT EXISTS\s+/i, '')))
    }

    // `ticket_change_floor` is keyed by tenant alone — one row per business.
    const floor = await db.prepare('PRAGMA table_info(ticket_change_floor)').all<{ name: string; pk: number }>()
    expect(floor.results.filter((c) => c.pk > 0).map((c) => c.name)).toEqual(['tenant_id'])

    // (c) A SUBSCRIPTION AGAINST THAT DATABASE delivers a material write.
    const business = 'ac2328-baseline'
    const d = deps()
    const listed = await list(business, d)
    const feed = await call(business, `/api/material/changes?since=${listed.seq}`, d)
    const uid = await writeMaterial(await storeFor(business), 'on-the-baseline')
    const got = events(await frames(feed, 2))
    expect(got.map((f) => f.data?.uid)).toEqual([uid])
  })
})
