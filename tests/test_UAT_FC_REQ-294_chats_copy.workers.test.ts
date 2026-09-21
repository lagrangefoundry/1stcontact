import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { NOT_PORTABLE_FIELDS, type ChatsPayload } from '../apps/control-app/src/chat-copy'
import { CURSOR_FIELD } from '../apps/control-app/src/session-delta'
import { PENDING_FIELD } from '../apps/control-app/src/session-pending'
import { FRAME_FIELD } from '../apps/control-app/src/ledger'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { applySchema, ensureTenant } from './support/d1-site-factory'

/**
 * REQ-294 — `GET /api/chats/export` and `POST /api/chats/import`, the second
 * pair.
 *
 * WHY THE ROUTES EXIST AT ALL. `bin/copy-to-cloud` carried the Lagrange Foundry
 * site to production and none of the consultant conversations that produced it.
 * The reasoning behind a long-lived site's decisions lives in those
 * conversations, and a consultant that cannot read them re-litigates settled
 * choices. Under `wrangler dev` a conversation is rows in a miniflare SQLite
 * file whose layout is an implementation detail — so the Worker reads, through
 * the very store it serves from, exactly as the site pair does.
 *
 * SO THESE RUN IN WORKERD, OVER A REAL D1, THROUGH `route()`. The chat tickets
 * below are real tickets in a real tenant-scoped ticket store, written and read
 * back by the product's own `ticketStoreFor`. Nothing is stubbed: the claim
 * being made is that a conversation history really crosses between two stores.
 *
 * THE ROUND TRIP IS THE LOAD-BEARING ASSERTION, and the SECOND round trip is
 * the one the ticket actually asks for. A pair that has come apart still answers
 * 200 on both sides; the only way to notice is to send a history through both
 * halves into a second business and compare. And the failure this class exists
 * to not have — a second copy silently duplicating every turn — is only visible
 * by running the copy twice.
 */

const ORIGIN = 'https://app.test'

/** The library's own comment kind for a session file. Spelled as it is stored. */
const TRANSCRIPT = 'chat_transcript'
/** The kind a session that called a tool also carries. */
const TOOL_TRANSCRIPT = 'tool_transcript'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

/** A registered business to read conversations from or write them into. */
async function business(id: string): Promise<Scope> {
  await ensureTenant(id)
  return { businessId: id }
}

const storeFor = (scope: Scope): Promise<TicketStore> => ticketStoreFor(routerEnv(), scope)

/** One export, exactly as `1c copy-to-cloud --chats` reads one. */
async function exportChats(
  scope: Scope,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await route(
    new Request(`${ORIGIN}/api/chats/export`, { method: 'GET' }),
    routerEnv(),
    scope,
    {},
  )
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

/** One import, exactly as `1c copy-to-cloud --chats` posts one. */
async function importChats(
  scope: Scope,
  body: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await route(
    new Request(`${ORIGIN}/api/chats/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    {},
  )
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

/**
 * One conversation, as the product really writes one.
 *
 * THE SHAPE IS [[DOC-10]] §8's AND NOT THIS SUITE'S: a `chat` ticket found by
 * `fields.session_id`, the session file in a `chat_transcript` comment, the body
 * reserved for the engagement ledger ([[REQ-171]]), and the standing note in
 * `fields.frame` ([[REQ-283]]). The two runtime pointers are planted too,
 * because the claim that they do not travel is only worth making against a
 * conversation that has them.
 */
async function seedChat(
  scope: Scope,
  sessionId: string,
  over: { transcript?: string; ledger?: string; tool?: string } = {},
): Promise<Ticket> {
  const store = await storeFor(scope)
  const { ticket } = await store.create({
    type: 'chat',
    title: sessionId,
    fields: {
      session_id: sessionId,
      backend: 'claude-api',
      [FRAME_FIELD]: `building a site for ${sessionId}; the palette is settled`,
      [CURSOR_FIELD]: JSON.stringify({ at: '2026-01-01T00:00:00Z', seen: ['material-local'] }),
      [PENDING_FIELD]: JSON.stringify({ text: 'half-asked question', at: '', status: 'open' }),
    },
    body: over.ledger ?? `### Decision 1\n\nWe chose the serif wordmark for ${sessionId}.\n`,
  })
  await store.comment({
    uid: ticket.uid,
    kind: TRANSCRIPT,
    body: over.transcript ?? `# session ${sessionId}\n\n- user: make the hero warmer\n`,
  })
  if (over.tool !== undefined) {
    await store.comment({ uid: ticket.uid, kind: TOOL_TRANSCRIPT, body: over.tool })
  }
  return ticket
}

/** Every `chat` ticket a business holds, with its comments, newest scan order. */
async function chatsHeldBy(
  scope: Scope,
): Promise<{ ticket: Ticket; comments: Ticket[] }[]> {
  const store = await storeFor(scope)
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const out: { ticket: Ticket; comments: Ticket[] }[] = []
  for (const ticket of tickets) {
    out.push({ ticket, comments: (await store.comments({ uid: ticket.uid })).comments })
  }
  return out.sort((a, b) =>
    String(a.ticket.fields.session_id).localeCompare(String(b.ticket.fields.session_id)),
  )
}

const commentsOfKind = (comments: Ticket[], kind: string): Ticket[] =>
  comments.filter((c) => (c.fields ?? {}).kind === kind)

describe('REQ-294 — the Worker reads a conversation history out of the store it serves from', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-294_export_answers_the_payload_import_accepts', async () => {
    // THE PAIR, ASSERTED AS A PAIR. `/api/chats/export` must answer in the shape
    // `/api/chats/import` takes — a business name that addresses nothing, and a
    // `chats` list of records each carrying its session id, title, ledger body,
    // fields and comments — because the copy command feeds one straight into the
    // other with nothing in between to translate.
    const scope = await business('req294-shape')
    await seedChat(scope, 'sess-shape')

    const got = await exportChats(scope)
    expect(got.status).toBe(200)
    expect(Object.keys(got.body).sort()).toEqual(['business', 'chats'])
    // IT NAMES THE SOURCE AND ADDRESSES NOTHING, the statement `SitePayload.slug`
    // makes on the other pair.
    expect(got.body.business).toBe('req294-shape')

    const chats = got.body.chats as ChatsPayload['chats']
    expect(chats).toHaveLength(1)
    expect(Object.keys(chats[0]).sort()).toEqual([
      'body',
      'comments',
      'fields',
      'sessionId',
      'status',
      'title',
    ])
    expect(chats[0].sessionId).toBe('sess-shape')
    expect(chats[0].body).toContain('Decision 1')
    expect(chats[0].comments).toEqual([
      { kind: TRANSCRIPT, body: '# session sess-shape\n\n- user: make the hero warmer\n' },
    ])
  })

  it('test_UAT_FC_REQ-294_the_runtime_pointers_do_not_travel', async () => {
    // THE SILENT FAILURE THE TICKET NAMES. `kb_cursor` answers "what has this
    // session already been told about" against ONE store's `ticket_changes`
    // sequence; carried, it names positions that mean something else in the
    // destination or nothing at all, and the destination's indexer then skips
    // turns it never saw — with the import reporting success throughout.
    //
    // `pending_turn` is the same rule one layer up ([[BUG-121]]): it is a claim
    // that a turn is in flight on a host that was running, and the destination
    // was running nothing.
    //
    // AND WHAT IS A PROPERTY OF THE CONVERSATION DOES TRAVEL, which is the other
    // half of the decision and is asserted in the same breath so the two cannot
    // be confused for one rule.
    const scope = await business('req294-pointers')
    await seedChat(scope, 'sess-pointers')

    const got = await exportChats(scope)
    const chats = got.body.chats as ChatsPayload['chats']
    const fields = chats[0].fields
    expect(NOT_PORTABLE_FIELDS).toEqual([CURSOR_FIELD, PENDING_FIELD])
    for (const name of NOT_PORTABLE_FIELDS) expect(fields).not.toHaveProperty(name)
    // The standing note, the session id and the backend are the conversation.
    expect(fields[FRAME_FIELD]).toContain('the palette is settled')
    expect(fields.session_id).toBe('sess-pointers')
    expect(fields.backend).toBe('claude-api')
  })

  it('test_UAT_FC_REQ-294_export_then_import_reproduces_the_history_in_another_business', async () => {
    // THE ROUND TRIP — the whole claim of the ticket in one assertion. Two
    // businesses rather than one, because a copy's two ends are two stores and
    // re-importing over the source would pass even if the export were being
    // ignored entirely.
    const source = await business('req294-source')
    const target = await business('req294-target')
    await seedChat(source, 'sess-a', { tool: '## read_ticket\n\nmaterial-3\n' })
    await seedChat(source, 'sess-b', { ledger: '### Decision 1\n\nDrop the carousel.\n' })

    const exported = await exportChats(source)
    expect(exported.status).toBe(200)
    expect((exported.body.chats as unknown[]).length).toBe(2)

    const landed = await importChats(target, exported.body)
    expect(landed.status).toBe(200)
    expect(landed.body).toEqual({ created: 2, replaced: 0, kept: 0, comments: 3 })

    // READ BACK THROUGH THE STORE, not through the route that wrote them: the
    // claim is that the destination really holds these conversations, which a
    // route echoing its own input could satisfy without writing anything.
    const held = await chatsHeldBy(target)
    expect(held.map((h) => h.ticket.fields.session_id)).toEqual(['sess-a', 'sess-b'])
    expect(held[1].ticket.body).toContain('Drop the carousel.')
    expect(held[0].ticket.fields[FRAME_FIELD]).toContain('the palette is settled')
    // The transcript arrived, and so did the tool record stream beside it —
    // which is what carrying comments wholesale rather than by a list of kinds
    // buys.
    expect(commentsOfKind(held[0].comments, TRANSCRIPT)[0].body).toContain('make the hero warmer')
    expect(commentsOfKind(held[0].comments, TOOL_TRANSCRIPT)[0].body).toContain('material-3')

    // TENANCY AND UIDS ARE THE DESTINATION'S. The copy carries a session id,
    // which means the same thing on both sides; a ticket uid does not, and
    // carrying one would be carrying the source's address.
    const sourceHeld = await chatsHeldBy(source)
    expect(held[0].ticket.uid).not.toBe(sourceHeld[0].ticket.uid)

    // AND THE DESTINATION'S OWN CURSOR IS NOT PLANTED BY THE COPY — the other
    // end of the rule the previous test asserts on the read.
    expect(held[0].ticket.fields).not.toHaveProperty(CURSOR_FIELD)
  })

  it('test_UAT_FC_REQ-294_the_import_strips_a_runtime_pointer_a_payload_carries_anyway', async () => {
    // THE RULE IS THE STORE'S, NOT ONE PRODUCER'S. `readChats` never puts a
    // cursor in a payload — but a payload is a FILE on this path, because
    // `--backup` writes one and an operator can post one back, so a rule
    // enforced only on the export is a rule enforced only when the export is
    // what produced the bytes. And the failure it prevents is silent: the import
    // succeeds and the destination's indexer skips turns it never saw.
    const target = await business('req294-strip')
    const planted: ChatsPayload = {
      business: 'somewhere-else',
      chats: [
        {
          sessionId: 'sess-planted',
          title: 'sess-planted',
          status: 'open',
          body: '### Decision 1\n\nCarried by hand.\n',
          fields: {
            session_id: 'sess-planted',
            [CURSOR_FIELD]: JSON.stringify({ at: '2020-01-01T00:00:00Z', seen: [] }),
            [PENDING_FIELD]: JSON.stringify({ text: 'stale', at: '', status: 'open' }),
          },
          comments: [{ kind: TRANSCRIPT, body: '- user: hand-written\n' }],
        },
      ],
    }
    expect((await importChats(target, planted)).body).toMatchObject({ created: 1 })

    const held = await chatsHeldBy(target)
    for (const name of NOT_PORTABLE_FIELDS) expect(held[0].ticket.fields).not.toHaveProperty(name)
    // And the conversation itself still landed whole — stripping is not dropping.
    expect(held[0].ticket.body).toContain('Carried by hand.')
    expect(commentsOfKind(held[0].comments, TRANSCRIPT)[0].body).toContain('hand-written')
  })

  it('test_UAT_FC_REQ-294_a_second_copy_duplicates_no_turn_and_keeps_what_is_there', async () => {
    // THE FAILURE TO AVOID, stated as a test. Conversations are matched by
    // `session_id` and each is written whole or not at all, so running the copy
    // twice must add no ticket, no comment and no turn.
    //
    // AND THE DESTINATION'S OWN TURNS SURVIVE. The deployed builder is where the
    // client actually talks, so its copy of a session may have continued past
    // the local one — which is why a conversation already there is KEPT and
    // counted rather than replaced, and deliberately not refused the way
    // `/api/import` refuses a site: a history is many objects, and refusing the
    // set because one member is present would stop every later conversation from
    // ever landing.
    const source = await business('req294-twice-source')
    const target = await business('req294-twice-target')
    await seedChat(source, 'sess-twice')

    const exported = await exportChats(source)
    expect((await importChats(target, exported.body)).body).toMatchObject({ created: 1, kept: 0 })

    // The destination's copy then grows a turn of its own, as a live one would.
    const targetStore = await storeFor(target)
    const first = (await chatsHeldBy(target))[0]
    const transcript = commentsOfKind(first.comments, TRANSCRIPT)[0]
    await targetStore.update({
      uid: transcript.uid,
      patch: { body: `${transcript.body}- user: and darker\n` },
    })

    const again = await importChats(target, exported.body)
    expect(again.status).toBe(200)
    expect(again.body).toEqual({ created: 0, replaced: 0, kept: 1, comments: 0 })

    const held = await chatsHeldBy(target)
    // ONE conversation, ONE transcript — not two of either.
    expect(held).toHaveLength(1)
    expect(commentsOfKind(held[0].comments, TRANSCRIPT)).toHaveLength(1)
    // And the turn the destination added is still there: nothing was replaced.
    expect(commentsOfKind(held[0].comments, TRANSCRIPT)[0].body).toContain('and darker')
  })

  it('test_UAT_FC_REQ-294_force_replaces_a_conversation_whole_and_leaves_one_transcript', async () => {
    // `--force` IS THE OPERATOR SAYING THEY MEAN IT, reused from BUG-51 rather
    // than joined by a second flag for the same sentence. What it must NOT do is
    // append: a replaced conversation has to end up holding one transcript, not
    // two, because the library finds a session's transcript by kind and a second
    // comment of that kind would make which one loads depend on scan order.
    const source = await business('req294-force-source')
    const target = await business('req294-force-target')
    await seedChat(source, 'sess-force', {
      transcript: '# session sess-force\n\n- user: the local version\n',
      ledger: '### Decision 1\n\nThe local ledger.\n',
    })
    const exported = await exportChats(source)
    await importChats(target, exported.body)

    const targetStore = await storeFor(target)
    const before = (await chatsHeldBy(target))[0]
    await targetStore.update({
      uid: commentsOfKind(before.comments, TRANSCRIPT)[0].uid,
      patch: { body: '# session sess-force\n\n- user: the far side version\n' },
    })

    const forced = await importChats(target, { ...exported.body, force: true })
    expect(forced.body).toEqual({ created: 0, replaced: 1, kept: 0, comments: 1 })

    const held = await chatsHeldBy(target)
    expect(held).toHaveLength(1)
    expect(commentsOfKind(held[0].comments, TRANSCRIPT)).toHaveLength(1)
    expect(commentsOfKind(held[0].comments, TRANSCRIPT)[0].body).toContain('the local version')
    expect(held[0].ticket.body).toContain('The local ledger.')
    // The ticket was rewritten in place, so it is the same record rather than a
    // second one beside the first.
    expect(held[0].ticket.uid).toBe(before.ticket.uid)
  })

  it('test_UAT_FC_REQ-294_a_business_with_no_conversations_exports_an_empty_history', async () => {
    // 200 AND AN EMPTY LIST, which is the OPPOSITE of the site export's 404 and
    // is deliberate. "This business holds no site" makes an export meaningless,
    // because an empty site payload is a legible thing to import over the top of
    // something real. "This client has had no conversations yet" is an ordinary
    // true fact about a new business, and the import it produces writes nothing —
    // so there is nothing to refuse.
    const scope = await business('req294-empty')
    const got = await exportChats(scope)
    expect(got.status).toBe(200)
    expect(got.body.chats).toEqual([])

    const target = await business('req294-empty-target')
    await seedChat(target, 'sess-untouched')
    expect((await importChats(target, got.body)).body).toEqual({
      created: 0,
      replaced: 0,
      kept: 0,
      comments: 0,
    })
    expect(await chatsHeldBy(target)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-294_a_body_with_no_chats_array_is_refused_rather_than_read_as_empty', async () => {
    // NAMED RATHER THAN COERCED. A caller sending the wrong shape answered 200
    // "nothing landed" would be told its copy succeeded, which is the one report
    // this route must never make about a request it did not understand.
    const scope = await business('req294-malformed')
    const refused = await importChats(scope, { business: 'somewhere' })
    expect(refused.status).toBe(400)
    expect(String(refused.body.error)).toMatch(/`chats` array/)
    expect(String(refused.body.error)).toMatch(/Nothing was written/)
  })
})
