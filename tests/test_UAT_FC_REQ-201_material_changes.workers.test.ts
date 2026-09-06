import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import {
  MATERIAL_CHANGE_FIELDS,
  MATERIAL_CHANGE_FILTERS,
  MATERIAL_CHANGE_POLL_MS,
  materialChangeOf,
} from '../apps/control-app/src/material'
import { ticketStoreFor, type TicketStore, type TicketStoreOptions } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-201 — **the Library's change feed, in workerd, against real D1**.
 *
 * WHAT THIS FILE PROVES, and what its jsdom sibling proves instead. The Library
 * is a browser surface over an origin contract and the two halves fail in
 * completely different ways. This one is the CONTRACT: that a write nobody on
 * this connection made produces an event, that the event carries the row rather
 * than a uid to go and fetch, that the cursor is honest enough to reconnect on,
 * and — the claim that matters most — that a feed raised under one business can
 * never observe another's. `…_library_live.test.ts` proves the tab.
 *
 * EVERY ASSERTION GOES THROUGH `route()` AGAINST REAL D1. The change log is
 * written by the ticketing component's own accessor, in the same batch as the
 * write it describes; nothing here inserts a log row to make an event appear.
 * That is the whole reason the mechanism was built in storage rather than in
 * process (DOC-24 §1): the writes this tab cares about — `describeCapture` and
 * the background re-describe pass — are made somewhere else entirely, and a
 * test that fabricated the log would be asserting nothing about them.
 *
 * ONE DOUBLE, AND IT IS THE CLOCK, NOT THE DATA. `deps.tickets` opens the real
 * store with a fast tailer cadence, because the shipped one is two seconds and a
 * suite that waited for it would take minutes. The cadence itself is asserted
 * separately, below, by capturing what the route asks for — so the number that
 * ships is checked where it is chosen rather than where it is inconvenient.
 */

const APPLIED = applySchema()

/** How long a claim waits for the tailer before calling it a failure. */
const SETTLE_MS = 2000
/** The doubled tailer cadence. Fast, and still a real interval. */
const TEST_POLL_MS = 10

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

/**
 * The router deps every case here uses.
 *
 * `seen` RECORDS WHAT THE ROUTE ASKED FOR, which is how the poll-cadence claim
 * is made without waiting two seconds for it.
 */
function deps(): RouterDeps & { seen: TicketStoreOptions[] } {
  const seen: TicketStoreOptions[] = []
  return {
    tickets: (e, scope, opts) => {
      seen.push(opts ?? {})
      return ticketStoreFor(e as RouterEnv, scope, {
        ...opts,
        ...(opts?.changePollMs == null ? {} : { changePollMs: TEST_POLL_MS }),
      })
    },
    seen,
  }
}

/** A request at one business's prefix — the scope, exactly as a browser sends it. */
function get(business: string, path: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://control.test/b/${business}${path}`, { headers })
}

async function call(
  business: string,
  path: string,
  d: RouterDeps,
  headers: Record<string, string> = {},
): Promise<Response> {
  const res = await route(get(business, path, headers), routerEnv(), scopeOf(business), d)
  if (!res) throw new Error(`no route answered ${path}`)
  return res
}

/**
 * Read SSE frames off a live response until `want` of them have arrived.
 *
 * PARSES THE WIRE FORMAT AND NOT A LIBRARY'S IDEA OF IT. The route writes
 * `id:` + `data:` + a blank line, which is what a browser's `EventSource`
 * consumes; reading it the same way here is what makes "the id is the cursor" a
 * claim about bytes rather than about an abstraction on both sides.
 *
 * It RESOLVES ON TIMEOUT rather than rejecting, because "nothing arrived" is the
 * assertion in several cases below — a scope leak is proven by an empty list.
 */
async function frames(
  res: Response,
  want: number,
  timeoutMs = SETTLE_MS,
): Promise<Array<{ id: string | null; data: Record<string, unknown> }>> {
  const reader = (res.body as ReadableStream<Uint8Array>).getReader()
  const decoder = new TextDecoder()
  const out: Array<{ id: string | null; data: Record<string, unknown> }> = []
  let buffer = ''
  const deadline = Date.now() + timeoutMs
  try {
    while (out.length < want && Date.now() < deadline) {
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
        const dataLine = block.split('\n').find((l) => l.startsWith('data:'))
        // A heartbeat is a comment frame and carries no data. Skipped rather
        // than counted: it is deliberately not an event.
        if (!dataLine) continue
        const idLine = block.split('\n').find((l) => l.startsWith('id:'))
        out.push({
          id: idLine ? idLine.slice(3).trim() : null,
          data: JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>,
        })
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return out
}

/** A material ticket, written straight through the component, as ingestion does. */
async function writeMaterial(
  store: TicketStore,
  title: string,
  fields: Record<string, unknown> = {},
): Promise<string> {
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

async function storeFor(business: string): Promise<TicketStore> {
  return ticketStoreFor(routerEnv(), scopeOf(business), { changePollMs: TEST_POLL_MS })
}

/**
 * The component's own archive/unarchive, reached past this repository's type.
 *
 * CAST DELIBERATELY, AND THE CAST IS PART OF THE CLAIM. `tickets.ts` names the
 * ops the PRODUCT reaches for, and nothing in the product archives material —
 * which is precisely why the acceptance calls this "behaviour the tab has no
 * current path to learn". The write comes from somewhere else (a CLI, a sweep,
 * an operator with a store handle), so the test reaches for it the way that
 * somewhere-else would, rather than by widening the product's surface to make a
 * test easier to write.
 */
function elsewhere(store: TicketStore): {
  archive(a: { uid: string }): Promise<unknown>
  unarchive(a: { uid: string }): Promise<unknown>
} {
  return store as unknown as {
    archive(a: { uid: string }): Promise<unknown>
    unarchive(a: { uid: string }): Promise<unknown>
  }
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-201 — the list read hands out the cursor it read at', () => {
  it('UAT_FC_REQ-201 /api/material answers a change cursor alongside the rows', async () => {
    const business = 'req201-cursor'
    const d = deps()
    const store = await storeFor(business)
    await writeMaterial(store, 'a-logo')

    const body = (await (await call(business, '/api/material', d)).json()) as {
      material: Array<{ uid: string }>
      seq: number
    }

    expect(body.material).toHaveLength(1)
    // THE CURSOR IS A REAL POSITION AND NOT A PLACEHOLDER. The write above
    // logged a record, so the head is past zero — a route that answered `0` for
    // everything would satisfy a shape check and lose every event before the
    // first one the subscriber happened to see.
    expect(body.seq).toBeGreaterThan(0)
  })

  it('UAT_FC_REQ-201 a write between the head read and the list is in BOTH, never neither', async () => {
    // THE ORDER IS THE CLAIM. The route reads the head before it lists, so the
    // window between them is one where a write is replayed onto a row already
    // drawn — idempotent. Reversing it would put that write in neither, which is
    // a material the tab never learns about. Asserted by construction: every row
    // the list returned is at or before the cursor it returned with it, so a
    // subscription opened at that cursor cannot skip one.
    const business = 'req201-order'
    const d = deps()
    const store = await storeFor(business)
    await writeMaterial(store, 'before-the-read')

    const first = (await (await call(business, '/api/material', d)).json()) as { seq: number }
    await writeMaterial(store, 'after-the-read')
    const second = (await (await call(business, '/api/material', d)).json()) as {
      material: unknown[]
      seq: number
    }

    expect(second.material).toHaveLength(2)
    // The second read's cursor is strictly ahead of the first's, so a client
    // holding the first one still has the second write ahead of it.
    expect(second.seq).toBeGreaterThan(first.seq)
  })
})

describe('REQ-201 — the feed carries events the tab could not otherwise learn', () => {
  it('UAT_FC_REQ-201 a description written AFTER the upload arrives as an update naming the body', async () => {
    // THE CASE THE TAB CANNOT HANDLE TODAY, and the reason this ticket exists.
    // The upload has already returned; `describeCapture` writes the body
    // seconds later, from somewhere that is not this connection.
    const business = 'req201-described'
    const d = deps()
    const store = await storeFor(business)
    const uid = await writeMaterial(store, 'a-brand-book')

    const listed = (await (await call(business, '/api/material', d)).json()) as { seq: number }
    const feed = await call(business, `/api/material/changes?since=${listed.seq}`, d)

    // The write the Library did not make.
    await store.update({
      uid,
      patch: { body: 'A brand book, in navy and gold.', fields: { description_status: 'ok' } },
    })

    const got = await frames(feed, 2)
    const ready = got[0]
    const change = got[1]

    expect(ready?.data.kind).toBe('ready')
    expect(change?.data.kind).toBe('update')
    expect(change?.data.uid).toBe(uid)
    // THE SIGNAL, NOT THE TEXT. The log carries a body change as presence
    // (DOC-24 §6.2), so this is what tells the pane to re-read the one item it
    // has open — and it is deliberately NOT the description itself.
    expect(change?.data.body_changed).toBe(true)
    // The fields the log DOES carry travel in full, so the row redraws from the
    // payload alone.
    expect((change?.data.row as Record<string, unknown>).description_status).toBe('ok')
  })

  it('UAT_FC_REQ-201 a material created outside this panel enters the list, with cause distinguishing it', async () => {
    const business = 'req201-entered'
    const d = deps()
    const store = await storeFor(business)
    const listed = (await (await call(business, '/api/material', d)).json()) as { seq: number }
    const feed = await call(business, `/api/material/changes?since=${listed.seq}`, d)

    const uid = await writeMaterial(store, 'arrived-elsewhere')

    const got = await frames(feed, 2)
    expect(got[1]?.data.kind).toBe('enter')
    expect(got[1]?.data.uid).toBe(uid)
    // `kind` AND `cause` SAY DIFFERENT THINGS. This one is new; the next case is
    // a material an edit brought into scope, and both are `enter`.
    expect(got[1]?.data.cause).toBe('create')
    // THE ROW ARRIVES DRAWN, not as a uid to go and fetch — which is what lets
    // the pane splice it in without a second request per event.
    expect((got[1]?.data.row as Record<string, unknown>).title).toBe('arrived-elsewhere')
  })

  it('UAT_FC_REQ-201 a material archived elsewhere leaves the list', async () => {
    // BEHAVIOUR THE TAB HAS NO CURRENT PATH TO LEARN. Nothing in the Library
    // archives material, so before this feed a row removed elsewhere stayed on
    // screen until an unrelated full re-read.
    const business = 'req201-exited'
    const d = deps()
    const store = await storeFor(business)
    const uid = await writeMaterial(store, 'about-to-go')

    const listed = (await (await call(business, '/api/material', d)).json()) as { seq: number }
    const feed = await call(business, `/api/material/changes?since=${listed.seq}`, d)

    await elsewhere(store).archive({ uid })

    const got = await frames(feed, 2)
    expect(got[1]?.data.kind).toBe('exit')
    expect(got[1]?.data.uid).toBe(uid)
    // NOTHING LEFT TO DRAW. The uid is the whole of what the pane needs.
    expect(got[1]?.data.row).toBeNull()
  })

  it('UAT_FC_REQ-201 a material that changes back INTO scope enters with a cause that is not create', async () => {
    const business = 'req201-returned'
    const d = deps()
    const store = await storeFor(business)
    const uid = await writeMaterial(store, 'came-back')
    await elsewhere(store).archive({ uid })

    const listed = (await (await call(business, '/api/material', d)).json()) as { seq: number }
    const feed = await call(business, `/api/material/changes?since=${listed.seq}`, d)

    await elsewhere(store).unarchive({ uid })

    const got = await frames(feed, 2)
    expect(got[1]?.data.kind).toBe('enter')
    // THE DISTINCTION THE ACCEPTANCE ASKS FOR: same `kind` as the created case
    // above, different `cause`, and neither is reconstructible from the other.
    expect(got[1]?.data.cause).toBe('unarchive')
    expect(got[1]?.data.cause).not.toBe('create')
  })
})

describe('REQ-201 — the subscription is scoped exactly as the read is', () => {
  it('UAT_FC_REQ-201 a feed raised under one business never observes another business tenant material', async () => {
    // THE CLAIM THIS SUITE EXISTS FOR. A subscription is a read (DOC-8 §6.6),
    // and a change feed that crossed businesses would be a scope leak through a
    // new door. Asserted DIRECTLY, with a second tenant present and writing.
    const mine = 'req201-tenant-a'
    const theirs = 'req201-tenant-b'
    const d = deps()
    const ours = await storeFor(mine)
    const others = await storeFor(theirs)

    const listed = (await (await call(mine, '/api/material', d)).json()) as { seq: number }
    const feed = await call(mine, `/api/material/changes?since=${listed.seq}`, d)

    // The other business writes FIRST and writes MORE, so a leak would be loud.
    const theirUid = await writeMaterial(others, 'their-secret-brand-book')
    await others.update({ uid: theirUid, patch: { body: 'Confidential.' } })
    const ourUid = await writeMaterial(ours, 'our-own-logo')

    const got = await frames(feed, 3)
    const events = got.filter((f) => f.data.kind !== 'ready')

    // Ours arrived — so the feed is genuinely live and the absence below is not
    // the absence of a working subscription.
    expect(events.map((e) => e.data.uid)).toContain(ourUid)
    // And theirs did not, by uid and by title. Two spellings of the same fact,
    // because a leak that stripped the uid would still be a leak.
    expect(events.map((e) => e.data.uid)).not.toContain(theirUid)
    expect(JSON.stringify(events)).not.toContain('their-secret-brand-book')
    expect(JSON.stringify(events)).not.toContain('Confidential.')
  })
})

describe('REQ-201 — the cursor belongs to the client, and reconnect resumes on it', () => {
  it('UAT_FC_REQ-201 every frame carries its seq as the SSE id, and the first states the opening cursor', async () => {
    const business = 'req201-ids'
    const d = deps()
    const store = await storeFor(business)
    const listed = (await (await call(business, '/api/material', d)).json()) as { seq: number }
    const feed = await call(business, `/api/material/changes?since=${listed.seq}`, d)
    await writeMaterial(store, 'gets-an-id')

    const got = await frames(feed, 2)

    // THE `ready` FRAME IS NOT A GREETING. Without it a connection that drops
    // before the first event leaves `Last-Event-ID` unset and the reconnect
    // silently restarts from "now" — skipping everything in between.
    expect(got[0]?.data.kind).toBe('ready')
    expect(got[0]?.id).toBe(String(listed.seq))
    // And every event's id is its own position, which is what the browser
    // re-presents on reconnect.
    expect(got[1]?.id).toBe(String(got[1]?.data.seq))
    expect(Number(got[1]?.id)).toBeGreaterThan(listed.seq)
  })

  it('UAT_FC_REQ-201 Last-Event-ID resumes the feed with no cursor in the query string', async () => {
    // WHAT A RECONNECT ACTUALLY SENDS. `EventSource` re-requests the same URL
    // and adds the header; the route must prefer it, and must work when the
    // query string carries nothing at all.
    const business = 'req201-resume'
    const d = deps()
    const store = await storeFor(business)
    const listed = (await (await call(business, '/api/material', d)).json()) as { seq: number }

    // Written while nobody is connected — the disconnect this claim is about.
    const uid = await writeMaterial(store, 'missed-while-away')

    const feed = await call(business, '/api/material/changes', d, {
      'last-event-id': String(listed.seq),
    })
    const got = await frames(feed, 2)

    // CONVERGED VIA A CATCH-UP READ, NOT A FULL RELOAD. The material written
    // during the gap arrives as an event, from the log, on the reconnected feed.
    expect(got[0]?.data.kind).toBe('ready')
    expect(got[1]?.data.kind).toBe('enter')
    expect(got[1]?.data.uid).toBe(uid)
  })

  it('UAT_FC_REQ-201 Last-Event-ID wins over a stale since in the query string', async () => {
    const business = 'req201-precedence'
    const d = deps()
    const store = await storeFor(business)
    const listed = (await (await call(business, '/api/material', d)).json()) as { seq: number }
    const uid = await writeMaterial(store, 'after-the-query-cursor')
    const head = (await (await call(business, '/api/material', d)).json()) as { seq: number }

    // The query string says "from now" (which would skip the write); the header
    // says "from before it". The header is the one the browser maintains, so it
    // is the one that must be believed.
    const feed = await call(business, `/api/material/changes?since=${head.seq}`, d, {
      'last-event-id': String(listed.seq),
    })
    const got = await frames(feed, 2)

    expect(got[0]?.id).toBe(String(listed.seq))
    expect(got[1]?.data.uid).toBe(uid)
  })

  it('UAT_FC_REQ-201 a cursor that is not an integer is refused rather than silently reset', async () => {
    const d = deps()
    const res = await call('req201-badcursor', '/api/material/changes?since=yesterday', d)
    expect(res.status).toBe(400)
    // A cursor nobody can parse must not become "from now": that is an event gap
    // presented as a working subscription.
    expect((await res.json() as { error: string }).error).toMatch(/integer/i)
  })
})

describe('REQ-201 — what the subscription costs, and what it is scoped to', () => {
  it('UAT_FC_REQ-201 the feed opens its store at the deliberate poll cadence, and no other route does', async () => {
    // THE NUMBER THAT SHIPS, ASSERTED WHERE IT IS CHOSEN. Two seconds rather
    // than the component's 50ms: an open tab at the default is twenty D1 reads a
    // second for as long as it lives, for a description that arrives seconds
    // after an upload anyway.
    const business = 'req201-cadence'
    const d = deps()
    await call(business, '/api/material', d)
    expect(d.seen).toEqual([{}])

    const feed = await call(business, '/api/material/changes', d)
    await frames(feed, 1)

    expect(d.seen).toEqual([{}, { changePollMs: MATERIAL_CHANGE_POLL_MS }])
    expect(MATERIAL_CHANGE_POLL_MS).toBe(2000)
  })

  it('UAT_FC_REQ-201 the watched set is built from the same constant the list is', () => {
    // ONE DEFINITION OF "THE CLIENT'S MATERIAL". The failure worth designing
    // against is the filter drifting from the list — which shows the client rows
    // that never update, or updates for rows they cannot see.
    expect(MATERIAL_CHANGE_FILTERS).toEqual(['type=material', 'type=reference'])
    // TWO FILTERS AND NOT ONE, because the predicate grammar is a conjunction
    // and has no OR — the same reason `listMaterial` issues two lists.
    expect(MATERIAL_CHANGE_FILTERS).toHaveLength(2)
  })

  it('UAT_FC_REQ-201 the field scope names what the panes draw and omits what they do not', () => {
    expect(MATERIAL_CHANGE_FIELDS).toContain('body')
    expect(MATERIAL_CHANGE_FIELDS).toContain('title')
    // A bare `fields` covers the whole §9 rights block, `placed_on`, `kind`,
    // `role` and `description_status` — every value either pane reads.
    expect(MATERIAL_CHANGE_FIELDS).toContain('fields')
    expect(MATERIAL_CHANGE_FIELDS).not.toContain('status')
    expect(MATERIAL_CHANGE_FIELDS).not.toContain('links')
  })

  it('UAT_FC_REQ-201 an exit is projected whatever field caused it, even one outside the field scope', () => {
    // DOC-24 §5 IS NORMATIVE AND NOT AN OPTIMISATION GAP. A material that leaves
    // the set without touching a watched field must still leave the screen, or
    // the row sits there for ever with no signal anything is wrong. Asserted on
    // the projection, because that is the half this repository owns.
    const change = materialChangeOf({
      seq: 9,
      kind: 'exit',
      cause: 'archive',
      uid: 'material-gone',
      id: null,
      type: 'material',
      version: 3,
      at: '2026-09-06T00:00:00.000Z',
      changed: { archived: { from: false } },
      ticket: null,
    })
    expect(change).not.toBeNull()
    expect(change?.kind).toBe('exit')
    expect(change?.row).toBeNull()
    expect(change?.body_changed).toBe(false)
  })
})
