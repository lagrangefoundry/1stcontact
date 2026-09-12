import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PEOPLE_PATH, PERSON_CHANGES_PATH, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import {
  addContact,
  CONTACT_CHANGE_POLL_MS,
  contactChangeHead,
  contactsChangedSince,
  markInvited,
  setPersonRecord,
  windBack,
} from '../apps/control-app/src/people'
import { applySchema, ensureTenant } from './support/d1-site-factory'

/**
 * REQ-233 — **the Contacts change feed, in workerd, against real D1.**
 *
 * WHAT THIS FILE PROVES, and what its jsdom sibling proves instead. The pane is a
 * browser surface over an origin contract and the two halves fail in completely
 * different ways. This one is the CONTRACT: that a write nobody on this
 * connection made produces a frame, that the frame carries the ROW rather than a
 * uid to go and fetch, that the cursor is honest enough to reconnect on, and —
 * the claim that matters most — that a feed raised under one business can never
 * observe another's. `…_contacts_live.test.ts` proves the pane.
 *
 * EVERY WRITE GOES THROUGH THE FUNCTION THE PRODUCT WRITES THROUGH. `addContact`
 * is what `captureLead` calls when a `contact-form` submission arrives on the
 * published site; `markInvited` is the invite's own half; `setPersonRecord` is
 * the record pane's. Nothing here stamps `updated_at` by hand, because the claim
 * is that the ordinary write paths are visible to the feed — and a test that
 * stamped the column itself would prove only that a query can read it.
 *
 * ONE DOUBLE, AND IT IS THE CLOCK, NOT THE DATA. `deps.contactChangePollMs` runs
 * the tail fast, because the shipped cadence is two seconds and a suite that
 * waited for it would take minutes. The cadence itself is asserted separately,
 * below, against the exported constant — so the number that ships is checked
 * where it is chosen rather than where it is inconvenient.
 */

const APPLIED = applySchema()

/** How long a claim waits for the tail before calling it a failure. */
const SETTLE_MS = 3000
/** The doubled cadence. Fast, and still a real interval. */
const TEST_POLL_MS = 10

const PLATFORM = 'req233-platform'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

const identityEnv = (): IdentityEnv => routerEnv() as unknown as IdentityEnv
const scopeOf = (businessId: string): Scope => ({ businessId })
const deps = (): RouterDeps => ({ contactChangePollMs: TEST_POLL_MS })

/** A request at one business's prefix — the scope, exactly as a browser sends it. */
async function call(
  business: string,
  path: string,
  headers: Record<string, string> = {},
  d: RouterDeps = deps(),
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

/**
 * Read SSE frames off a live response until `want` of them have arrived.
 *
 * PARSES THE WIRE FORMAT AND NOT A LIBRARY'S IDEA OF IT. The route writes `id:` +
 * `data:` + a blank line, which is what a browser's `EventSource` consumes;
 * reading it the same way here is what makes "the id is the cursor" a claim about
 * bytes rather than about an abstraction on both sides.
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
          setTimeout(() => resolve({ value: undefined, done: false }), 25),
        ),
      ])
      if (chunk.done) break
      if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true })
      let split: number
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, split)
        buffer = buffer.slice(split + 2)
        const dataLine = block.split('\n').find((l) => l.startsWith('data:'))
        // A heartbeat is a comment frame and carries no data. Skipped rather than
        // counted: it is deliberately not an event.
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

/** The rows a set of frames carried, as the pane would read them. */
const people = (got: Array<{ data: Record<string, unknown> }>) =>
  got
    .map((f) => f.data.person as { email?: string | null; pipelineStage?: string; name?: unknown } | undefined)
    .filter(Boolean)

let n = 0

/**
 * A fresh business, REGISTERED, because every case here is about one business's
 * feed and a shared one would make "nothing else arrived" an accident of ordering.
 */
async function business(): Promise<string> {
  const id = `req233-biz-${++n}`
  await ensureTenant(id)
  return id
}

beforeAll(async () => {
  await APPLIED
  await ensureTenant(PLATFORM)
})

describe('REQ-233 — the list read hands out a cursor', () => {
  it('test_UAT_FC_REQ-233_the_people_read_carries_the_cursor_the_feed_opens_at', async () => {
    // WITHOUT IT THE PANE HAS NOWHERE TO START. A subscription opened at "now"
    // loses every write between the load and the connection — which, for a pane
    // whose whole job is showing arrivals, is exactly the class of bug this
    // feature removes.
    const biz = await business()
    await addContact(identityEnv(), scopeOf(biz), { email: 'first@example.test' })
    const answer = (await (await call(biz, PEOPLE_PATH)).json()) as {
      seq: string
      people: unknown[]
    }
    expect(typeof answer.seq).toBe('string')
    expect(answer.seq).not.toBe('')
    expect(answer.people).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-233_a_business_with_no_contacts_reads_as_before_every_row', async () => {
    // NOT "NOW". A new business's first captured lead has to arrive on a feed
    // opened before that lead existed, which is the ordinary case for a business
    // that has just published its first form.
    const biz = await business()
    const head = await contactChangeHead(identityEnv(), scopeOf(biz))
    expect(head).toBe('')
    await addContact(identityEnv(), scopeOf(biz), { email: 'earliest@example.test' })
    const changed = await contactsChangedSince(identityEnv(), scopeOf(biz), head)
    expect(changed.map((c) => c.person.email)).toEqual(['earliest@example.test'])
  })

  it('test_UAT_FC_REQ-233_the_cursor_breaks_a_tie_so_a_batch_is_not_half_delivered', async () => {
    // A MILLISECOND HOLDS SEVERAL WRITES, and a batch invite stamps every contact
    // it touches at one instant — so a bare timestamp cursor advanced past that
    // instant drops all but the first. The id is what makes the position exact.
    const biz = await business()
    const at = '2026-09-12T20:47:00.057Z'
    for (const email of ['one@example.test', 'two@example.test', 'three@example.test']) {
      await addContact(identityEnv(), scopeOf(biz), { email })
    }
    await env.DB.prepare('UPDATE users SET updated_at = ? WHERE tenant_id = ?')
      .bind(at, biz)
      .run()

    const all = await contactsChangedSince(identityEnv(), scopeOf(biz), '')
    expect(all).toHaveLength(3)
    // Resume from the first of the three: the other two must still be ahead of
    // the cursor even though all three carry the identical instant.
    const after = await contactsChangedSince(identityEnv(), scopeOf(biz), all[0].seq)
    expect(after.map((c) => c.seq)).toEqual([all[1].seq, all[2].seq])
  })
})

describe('REQ-233 — a write nobody on this connection made', () => {
  it('test_UAT_FC_REQ-233_a_contact_captured_after_the_feed_opened_arrives_on_it', async () => {
    // THE CASE THE PANE COULD NOT HANDLE. `captureLead` calls `addContact` from
    // the public site's own request; there is no operator, no tab and no press
    // involved, and before this the row was invisible until a reload.
    const biz = await business()
    const res = await call(biz, `${PERSON_CHANGES_PATH}`)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const reading = frames(res, 2)
    await addContact(identityEnv(), scopeOf(biz), { email: 'captured@example.test' })
    const got = await reading

    expect(got[0].data.kind).toBe('ready')
    expect(people(got).map((p) => p!.email)).toContain('captured@example.test')
  })

  it('test_UAT_FC_REQ-233_the_frame_carries_the_row_and_not_a_uid_to_go_and_fetch', async () => {
    // THE PANE SPLICES IN SOMETHING INDISTINGUISHABLE FROM A RE-READ. A frame
    // carrying only an id would be a round trip per arrival and a second row
    // shape for the pane to assemble.
    const biz = await business()
    const res = await call(biz, PERSON_CHANGES_PATH)
    const reading = frames(res, 2)
    await addContact(identityEnv(), scopeOf(biz), {
      email: 'shaped@example.test',
      displayName: 'Shaped Person',
    })
    const got = await reading
    const row = got.find((f) => f.data.kind === 'contact')?.data.person as Record<string, unknown>
    expect(row).toBeTruthy()
    expect(row.email).toBe('shaped@example.test')
    expect(row.pipelineStage).toBe('lead')
    expect(row.status).toBe('active')
    expect(row.createdAt).toEqual(expect.any(String))
    expect(row.name).toMatchObject({ displayName: 'Shaped Person' })
  })

  it('test_UAT_FC_REQ-233_the_ready_frame_states_the_cursor_this_connection_opened_at', async () => {
    // WITHOUT IT, A CONNECTION THAT DROPS BEFORE THE FIRST EVENT leaves
    // `Last-Event-ID` unset and the reconnect silently starts from "now".
    // Seeding the id is what makes that gap unconstructible.
    const biz = await business()
    await addContact(identityEnv(), scopeOf(biz), { email: 'seed@example.test' })
    const head = await contactChangeHead(identityEnv(), scopeOf(biz))
    const got = await frames(await call(biz, PERSON_CHANGES_PATH), 1)
    expect(got[0].data).toMatchObject({ kind: 'ready', seq: head })
    expect(got[0].id).toBe(head)
  })

  it('test_UAT_FC_REQ-233_last_event_id_wins_over_since_so_a_reconnect_is_lossless', async () => {
    // THE CURSOR IS THE CLIENT'S. `?since` seeds the first connection only; every
    // reconnect after that carries the header, and the header has to win or a
    // resumed feed would replay from wherever the original URL happened to say.
    const biz = await business()
    await addContact(identityEnv(), scopeOf(biz), { email: 'before@example.test' })
    const got = await frames(
      await call(biz, `${PERSON_CHANGES_PATH}?since=${encodeURIComponent('2099-01-01T00:00:00.000Z|usr_x')}`, {
        'last-event-id': '',
      }),
      2,
    )
    // The header said "from the beginning", so the contact written before the
    // connection is replayed — which the far-future `?since` would have skipped.
    expect(people(got).map((p) => p!.email)).toContain('before@example.test')
  })
})

describe('REQ-233 — every ordinary write path is visible', () => {
  /**
   * Push one contact's stamp far into the past.
   *
   * IT IS WHAT MAKES THESE CLAIMS ABOUT THE WRITE AND NOT ABOUT THE LOOKBACK. A
   * contact created seconds ago is inside the feed's clock-skew window and is
   * re-read on every tick regardless of whether anything stamped it — so a case
   * that seeded and then mutated in one breath would pass with the stamp removed.
   * Backdated, the row is reachable ONLY if the write under test moved its cursor.
   */
  const backdate = async (contactId: string): Promise<void> => {
    await env.DB.prepare("UPDATE users SET updated_at = '2020-01-01T00:00:00.000Z' WHERE id = ?")
      .bind(contactId)
      .run()
  }

  it('test_UAT_FC_REQ-233_an_invite_sent_elsewhere_moves_the_contacts_cursor', async () => {
    // A SECOND OPERATOR, OR THE SAME ONE IN ANOTHER TAB. The pane must not hold a
    // stale `pipelineStage` for a row somebody else moved.
    const biz = await business()
    const { person: contact } = await addContact(identityEnv(), scopeOf(biz), {
      email: 'invitee@example.test',
    })
    await backdate(contact.id)
    const head = await contactChangeHead(identityEnv(), scopeOf(biz))

    await markInvited(identityEnv(), scopeOf(biz), contact.id)
    const changed = await contactsChangedSince(identityEnv(), scopeOf(biz), head)
    expect(changed.map((c) => c.person.pipelineStage)).toEqual(['invited'])
  })

  it('test_UAT_FC_REQ-233_a_rename_moves_the_contacts_cursor_because_the_write_stamps_the_person', async () => {
    // THE ONE GAP THIS TICKET HAD TO CLOSE IN THE WRITE PATH. A name lives in
    // `user_names`, so before [[REQ-233]] renaming somebody changed no column the
    // feed can see and the pane held the old name until a reload. `writeName`
    // stamps `users.updated_at` now, which is the whole of what makes this
    // reachable — and the backdating above is what makes that the claim.
    const biz = await business()
    const { person: contact } = await addContact(identityEnv(), scopeOf(biz), {
      email: 'renamed@example.test',
    })
    await backdate(contact.id)
    const head = await contactChangeHead(identityEnv(), scopeOf(biz))

    await setPersonRecord(identityEnv(), scopeOf(biz), contact.id, {
      name: { displayName: 'Sarah Patel' },
    })
    const changed = await contactsChangedSince(identityEnv(), scopeOf(biz), head)
    expect(changed).toHaveLength(1)
    expect(changed[0].person.name).toMatchObject({ displayName: 'Sarah Patel' })
  })

  it('test_UAT_FC_REQ-233_a_rename_reaches_a_connection_that_is_already_open', async () => {
    // AND END TO END, THROUGH THE ROUTE. The two halves fail differently: the
    // claim above is that the write moves the cursor, this one is that an open
    // connection is still reading when it does.
    const biz = await business()
    const { person: contact } = await addContact(identityEnv(), scopeOf(biz), {
      email: 'live-rename@example.test',
    })
    await backdate(contact.id)
    // AN ANCHOR, so the feed opens at a RECENT cursor rather than at the
    // backdated one — otherwise the lookback would replay the very row this case
    // is about and prove nothing.
    await addContact(identityEnv(), scopeOf(biz), { email: 'anchor@example.test' })

    const res = await call(biz, PERSON_CHANGES_PATH)
    const reading = frames(res, 3)
    await setPersonRecord(identityEnv(), scopeOf(biz), contact.id, {
      name: { displayName: 'Sarah Patel' },
    })
    const got = await reading
    const named = people(got).find((p) => p!.email === 'live-rename@example.test')
    expect(named?.name).toMatchObject({ displayName: 'Sarah Patel' })
  })

  it('test_UAT_FC_REQ-233_a_name_committed_to_the_value_it_already_held_wakes_nobody', async () => {
    // A NO-OP COMMIT WRITES NO HISTORY AND MUST WRITE NO STAMP EITHER. The record
    // pane commits on blur constantly; a stamp per focus-and-blur would wake
    // every open Contacts pane in the business for a change that did not happen.
    const biz = await business()
    const { person: contact } = await addContact(identityEnv(), scopeOf(biz), {
      email: 'unchanged@example.test',
      displayName: 'Same Name',
    })
    const head = await contactChangeHead(identityEnv(), scopeOf(biz))
    await setPersonRecord(identityEnv(), scopeOf(biz), contact.id, {
      name: { displayName: 'Same Name' },
    })
    expect(await contactsChangedSince(identityEnv(), scopeOf(biz), head)).toEqual([])
  })
})

describe('REQ-233 — the barrier', () => {
  it('test_UAT_FC_REQ-233_a_feed_raised_in_one_business_never_sees_another', async () => {
    // A SUBSCRIPTION IS A READ, and a change feed that crossed businesses would
    // be the same tenant leak through a new door. The read underneath carries
    // `WHERE tenant_id = ?` exactly as the list read does.
    const mine = await business()
    const theirs = await business()
    const res = await call(mine, PERSON_CHANGES_PATH)
    const reading = frames(res, 2, 800)
    await addContact(identityEnv(), scopeOf(theirs), { email: 'not-yours@example.test' })
    const got = await reading
    expect(got.map((f) => f.data.kind)).toEqual(['ready'])
    expect(people(got)).toEqual([])
  })
})

describe('REQ-233 — the cadence and the clock', () => {
  it('test_UAT_FC_REQ-233_the_shipped_poll_cadence_is_the_librarys', async () => {
    // CHECKED WHERE IT IS CHOSEN. Every case above runs the tail fast, so without
    // this the number that actually ships would be asserted nowhere — and a
    // cadence nobody checks is a cadence that drifts to whatever made one test
    // convenient.
    expect(CONTACT_CHANGE_POLL_MS).toBe(2000)
  })

  it('test_UAT_FC_REQ-233_each_poll_reads_from_behind_its_cursor', async () => {
    // THE CURSOR IS A CLOCK AND NOT A COUNTER. Two isolates do not agree to the
    // millisecond, so a row stamped just BEHIND an already-advanced cursor would
    // be a contact that never appears — which is this ticket's own bug, in a form
    // nobody would find. Winding back is the whole of the defence.
    const wound = windBack('2026-09-12T20:47:00.057Z|usr_a', 5000)
    expect(wound).toBe('2026-09-12T20:46:55.057Z')
    // A cursor we cannot interpret reads everything rather than nothing, because
    // re-reading is cheap and a silent gap is not.
    expect(windBack('', 5000)).toBe('')
    expect(windBack('not-a-cursor|usr_a', 5000)).toBe('')
  })

  it('test_UAT_FC_REQ-233_a_row_already_delivered_is_not_sent_again_every_tick', async () => {
    // THE LOOKBACK IS ONLY AFFORDABLE BECAUSE THE FEED DE-DUPLICATES. Re-READING
    // the window costs an indexed scan; re-SENDING it would rebuild every row on
    // screen every couple of seconds for as long as the pane is open.
    const biz = await business()
    const res = await call(biz, PERSON_CHANGES_PATH)
    const reading = frames(res, 3, 1200)
    await addContact(identityEnv(), scopeOf(biz), { email: 'once@example.test' })
    const got = await reading
    expect(people(got).filter((p) => p!.email === 'once@example.test')).toHaveLength(1)
  })
})
