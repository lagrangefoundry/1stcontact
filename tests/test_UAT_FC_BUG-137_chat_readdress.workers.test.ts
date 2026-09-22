import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import type { ChatsPayload } from '../apps/control-app/src/chat-copy'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import {
  businessBackendName,
  businessSessionIdFor,
  sessionIdFor,
  siteBackendName,
} from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant, seedTenantSite } from './support/d1-site-factory'

/**
 * BUG-137 — a copied conversation is RE-ADDRESSED onto the destination.
 *
 * THE BUG, STATED ONCE. `bin/copy-to-cloud --chats` moved Lagrange Foundry's
 * history to production and left it unreachable. The rows landed in the right
 * tenant with their transcripts intact, and the builder could not show them,
 * because a conversation is addressed by a session id DERIVED from the thing it
 * is about — `site-<site key>`, `business-<business id>` — and neither id
 * survives the crossing. A business's id is minted independently on each side
 * (which is why the command matches businesses by NAME); the destination's site
 * key is minted fresh by `/api/import`. [[REQ-294]] rewrote `tenant_id`, which
 * looks like an identifier, and carried through the same two ids hidden inside a
 * derived key. The operator was told the copy succeeded.
 *
 * SO THE ASSERTIONS ARE ABOUT WHAT THE DESTINATION CAN ASK FOR, not about what
 * arrived. "The rows are there" is exactly the state the bug describes; the
 * claim being tested is that the ids the destination's own builder will ask with
 * are the ids the conversations now carry.
 *
 * IN WORKERD, OVER A REAL D1, THROUGH `route()`, for [[REQ-294]]'s suite's own
 * reason: under `wrangler dev` a conversation is rows in a miniflare SQLite file
 * whose layout is an implementation detail, so nothing here is stubbed.
 *
 * AND THE IDS ARE MINTED BY THE PRODUCT'S OWN DERIVERS. `sessionIdFor`,
 * `businessSessionIdFor`, `siteBackendName` and `businessBackendName` are the
 * four functions the host mints these with; spelling `site-…` by hand in a test
 * would prove the import agrees with this file rather than with the product.
 */

const ORIGIN = 'https://app.test'

/** The library's own comment kind for a session file. */
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

const storeFor = (scope: Scope): Promise<TicketStore> => ticketStoreFor(routerEnv(), scope)

/** A registered business, with the one site it holds if it holds one. */
async function business(id: string, withSite = false): Promise<{ scope: Scope; site: string }> {
  await ensureTenant(id)
  const site = withSite ? (await seedTenantSite(id)).site : ''
  return { scope: { businessId: id }, site }
}

async function exportChats(scope: Scope): Promise<{ status: number; body: ChatsPayload }> {
  const res = await route(
    new Request(`${ORIGIN}/api/chats/export`, { method: 'GET' }),
    routerEnv(),
    scope,
    {},
  )
  return { status: res.status, body: (await res.json()) as ChatsPayload }
}

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

/** The turns half of a session file — what must cross byte for byte. */
const TURNS = '<!-- xgd-chat role="user" ts="2026-01-01T00:00:00Z" -->\n#### You\nmake the hero warmer\n'

/**
 * A session file as the library really writes one.
 *
 * THE HEADER IS THE POINT. `Session.toFile` emits exactly this — a JSON block
 * between `<!-- xgd-session` and `-->` — and it carries the session id a third
 * time, the backend name the manager resolves against its registry when it
 * attaches, and the uid of the chat ticket the session is homed on. A test
 * seeding a transcript with no header would assert nothing about the failure
 * this ticket is: the composer frozen on *"Unknown backend claude+site:…"* once
 * the conversation is finally reachable.
 */
function sessionFile(meta: Record<string, unknown>, turns = TURNS): string {
  return `<!-- xgd-session\n${JSON.stringify(meta, null, 2)}\n-->\n\n${turns}`
}

/** The header block of a session file, parsed back. */
function headerOf(body: string): Record<string, unknown> {
  const match = /^<!--\s*xgd-session\s*\n(.*?)\n-->\s*/s.exec(body)
  expect(match).not.toBeNull()
  return JSON.parse((match as RegExpExecArray)[1]) as Record<string, unknown>
}

/** The turns beneath the header, which this fix must not touch. */
function turnsOf(body: string): string {
  const match = /^<!--\s*xgd-session\s*\n(.*?)\n-->\s*/s.exec(body)
  return match === null ? body : body.slice(match[0].length)
}

/** One conversation, seeded as the product writes one. */
async function seedChat(
  scope: Scope,
  sessionId: string,
  over: {
    backend?: string
    ledger?: string
    transcript?: string | null
    tool?: string
    chatTicketUid?: string
    backendRef?: string
  } = {},
): Promise<Ticket> {
  const store = await storeFor(scope)
  const backend = over.backend ?? 'claude+unset'
  const { ticket } = await store.create({
    type: 'chat',
    title: sessionId,
    fields: { session_id: sessionId, backend },
    body: over.ledger ?? `### Decision 1\n\nThe serif wordmark, for ${sessionId}.\n`,
  })
  if (over.transcript !== null) {
    await store.comment({
      uid: ticket.uid,
      kind: TRANSCRIPT,
      body:
        over.transcript ??
        sessionFile({
          id: sessionId,
          role: 'consultant',
          backend,
          filter_tool_use: false,
          backend_ref: over.backendRef ?? 'conv-source-9f2',
          chat_ticket_uid: over.chatTicketUid ?? ticket.uid,
        }),
    })
  }
  if (over.tool !== undefined) {
    await store.comment({ uid: ticket.uid, kind: TOOL_TRANSCRIPT, body: over.tool })
  }
  return ticket
}

/**
 * The empty session the deployed builder auto-creates the first time it is
 * opened — a ticket with a session id and nothing in it.
 *
 * SEEDED THE WAY THE LIBRARY SEEDS IT: `_findOrCreateChat` creates the ticket
 * titled by its own session id, with no body and no comment, before any turn has
 * happened. This is the row [[REQ-294]]'s "KEPT and counted" preserved in place
 * of the history being imported.
 */
async function seedPlaceholder(scope: Scope, sessionId: string, backend: string): Promise<Ticket> {
  const store = await storeFor(scope)
  const { ticket } = await store.create({
    type: 'chat',
    title: sessionId,
    fields: { session_id: sessionId, backend },
  })
  return ticket
}

/** Every chat this business can still reach, with its comments, by session id. */
async function chatsHeldBy(scope: Scope): Promise<{ ticket: Ticket; comments: Ticket[] }[]> {
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

const commentOfKind = (comments: Ticket[], kind: string): Ticket | undefined =>
  comments.find((c) => (c.fields ?? {}).kind === kind)

describe('BUG-137 — a copied conversation is re-addressed onto the destination', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_BUG-137_a_copied_history_lands_under_the_destinations_own_ids', async () => {
    // THE WHOLE TICKET IN ONE CASE. Two businesses with two different ids and two
    // different site keys — which is not a contrivance but the only shape this
    // command is ever used in, since both ids are minted independently on each
    // side. Every address the destination's builder will ask with is asserted
    // against the DESTINATION's derived value, and every one of them was the
    // source's before this fix.
    const from = await business('bug137-from', true)
    const to = await business('bug137-to', true)
    expect(from.site).not.toBe(to.site)

    await seedChat(from.scope, sessionIdFor(from.site), {
      backend: siteBackendName(from.site),
      ledger: '### Decision 1\n\nThe palette is settled.\n',
      tool: '## read_ticket\n\nmaterial-3\n',
    })
    await seedChat(from.scope, businessSessionIdFor('bug137-from'), {
      backend: businessBackendName('bug137-from'),
      ledger: '### Decision 1\n\nThe business is renamed.\n',
    })

    const exported = await exportChats(from.scope)
    expect(exported.status).toBe(200)
    const landed = await importChats(to.scope, exported.body)
    expect(landed.status).toBe(200)
    expect(landed.body).toEqual({ created: 2, replaced: 0, kept: 0, comments: 3, strays: 0 })

    // READ BACK THROUGH THE STORE, not through the route that wrote them.
    const held = await chatsHeldBy(to.scope)
    // `fields.session_id` — what `TicketSessionArchive` finds a conversation by,
    // and the single value this bug is about.
    expect(held.map((h) => h.ticket.fields.session_id)).toEqual([
      businessSessionIdFor('bug137-to'),
      sessionIdFor(to.site),
    ])
    // NOT the source's, which is the statement the assertion above makes only in
    // the presence of this one: the ids differ, so agreeing with the destination
    // is a real claim.
    expect(held.map((h) => h.ticket.fields.session_id)).not.toContain(sessionIdFor(from.site))

    // `fields.backend` CARRIES THE SAME TWO IDS and is re-derived beside the
    // session id. Left alone, the conversation would be reachable and the
    // manager would throw resolving a backend nobody registered.
    expect(held[0].ticket.fields.backend).toBe(businessBackendName('bug137-to'))
    expect(held[1].ticket.fields.backend).toBe(siteBackendName(to.site))

    // THE SESSION FILE'S HEADER, which carries the ids a third time. `backend` is
    // what the manager resolves on attach; `chat_ticket_uid` names the ticket the
    // session is homed on, which is the destination's; `backend_ref` named a
    // conversation on a host that was running and the destination was running
    // nothing.
    const file = commentOfKind(held[1].comments, TRANSCRIPT) as Ticket
    const header = headerOf(file.body)
    expect(header.id).toBe(sessionIdFor(to.site))
    expect(header.backend).toBe(siteBackendName(to.site))
    expect(header.backend_ref).toBe('')
    expect(header.chat_ticket_uid).toBe(held[1].ticket.uid)
    // The role is not an address and is carried untouched.
    expect(header.role).toBe('consultant')

    // AND THE TURNS ARE THE RECORD — byte for byte. The header addresses; nothing
    // below it is this fix's business.
    expect(turnsOf(file.body)).toBe(TURNS)
    // The tool record stream is not an address either, and crosses whole.
    expect((commentOfKind(held[1].comments, TOOL_TRANSCRIPT) as Ticket).body).toContain('material-3')
    // The ledger arrived on the conversation it belongs to, in the right pane.
    expect(held[0].ticket.body).toContain('The business is renamed.')
    expect(held[1].ticket.body).toContain('The palette is settled.')
  })

  it('test_UAT_FC_BUG-137_the_auto_created_empty_session_is_written_over_without_force', async () => {
    // THE OTHER HALF OF THE BUG, AND THE REASON IT REPORTED SUCCESS. The deployed
    // builder auto-creates an empty `site-…` and `business-…` session the first
    // time it is opened, so the destination holds one before any copy runs.
    // [[REQ-294]]'s "one the far side already holds is KEPT and counted" would
    // preserve that emptiness in place of the history being imported — this bug
    // reproduced with a green tick. An empty session is a placeholder, not a
    // conversation, so it is written over and counted as created.
    const from = await business('bug137-empty-from')
    const to = await business('bug137-empty-to')
    await seedChat(from.scope, businessSessionIdFor('bug137-empty-from'), {
      backend: businessBackendName('bug137-empty-from'),
      ledger: '### Decision 1\n\nThe history that must arrive.\n',
    })
    const placeholder = await seedPlaceholder(
      to.scope,
      businessSessionIdFor('bug137-empty-to'),
      businessBackendName('bug137-empty-to'),
    )

    const exported = await exportChats(from.scope)
    const landed = await importChats(to.scope, exported.body)
    // COUNTED BY WHAT WAS THERE, not by which store verb ran: the row is reused
    // because the row is what the library will find, but the destination held no
    // CONVERSATION — reporting a replacement would say the history overwrote
    // something.
    expect(landed.body).toEqual({ created: 1, replaced: 0, kept: 0, comments: 1, strays: 0 })

    const held = await chatsHeldBy(to.scope)
    expect(held).toHaveLength(1)
    // The same row, now holding the history — so the builder finds one session
    // rather than choosing between two.
    expect(held[0].ticket.uid).toBe(placeholder.uid)
    expect(held[0].ticket.body).toContain('The history that must arrive.')
    expect(turnsOf((commentOfKind(held[0].comments, TRANSCRIPT) as Ticket).body)).toBe(TURNS)
  })

  it('test_UAT_FC_BUG-137_a_conversation_carrying_turns_is_still_kept', async () => {
    // THE RULE IT MUST NOT HAVE BROKEN. The deployed builder is where the client
    // actually talks, so a session there may have continued past the local one —
    // which is why [[REQ-294]] keeps rather than replaces. "Empty is absent"
    // narrows that to the placeholder case and must leave this one exactly as it
    // was; a single byte of ledger, transcript or tool record is a conversation.
    const from = await business('bug137-keep-from')
    const to = await business('bug137-keep-to')
    await seedChat(from.scope, businessSessionIdFor('bug137-keep-from'), {
      backend: businessBackendName('bug137-keep-from'),
      ledger: '### Decision 1\n\nThe local version.\n',
    })
    await seedChat(to.scope, businessSessionIdFor('bug137-keep-to'), {
      backend: businessBackendName('bug137-keep-to'),
      ledger: '### Decision 1\n\nWhat the client said here.\n',
      transcript: sessionFile(
        {
          id: businessSessionIdFor('bug137-keep-to'),
          role: 'settings',
          backend: businessBackendName('bug137-keep-to'),
          filter_tool_use: false,
          backend_ref: 'conv-live-1',
        },
        '<!-- xgd-chat role="user" -->\n#### You\nthe far side turn\n',
      ),
    })

    const exported = await exportChats(from.scope)
    const landed = await importChats(to.scope, exported.body)
    expect(landed.body).toEqual({ created: 0, replaced: 0, kept: 1, comments: 0, strays: 0 })

    const held = await chatsHeldBy(to.scope)
    expect(held).toHaveLength(1)
    expect(held[0].ticket.body).toContain('What the client said here.')
    expect((commentOfKind(held[0].comments, TRANSCRIPT) as Ticket).body).toContain(
      'the far side turn',
    )
  })

  it('test_UAT_FC_BUG-137_a_row_stranded_by_an_earlier_copy_is_archived', async () => {
    // THE DATA ALREADY COPIED. Every conversation moved before this fix is
    // sitting in the destination under a SOURCE-side session id: right tenant,
    // transcript intact, unreachable. A re-run has to bring it into reach — and
    // must not leave the stranded row behind as a second, invisible copy of the
    // same history.
    const from = await business('bug137-stray-from')
    const to = await business('bug137-stray-to')
    await seedChat(from.scope, businessSessionIdFor('bug137-stray-from'), {
      backend: businessBackendName('bug137-stray-from'),
      ledger: '### Decision 1\n\nThe history, re-copied.\n',
    })
    // Exactly what the pre-fix copy left: the source's session id, in the
    // destination's tenant.
    const stray = await seedChat(to.scope, businessSessionIdFor('bug137-stray-from'), {
      backend: businessBackendName('bug137-stray-from'),
      ledger: '### Decision 1\n\nThe history, stranded.\n',
    })
    // And the empty one the builder auto-created beside it, which is what the
    // operator was being shown instead.
    await seedPlaceholder(
      to.scope,
      businessSessionIdFor('bug137-stray-to'),
      businessBackendName('bug137-stray-to'),
    )
    expect(await chatsHeldBy(to.scope)).toHaveLength(2)

    const exported = await exportChats(from.scope)
    const landed = await importChats(to.scope, exported.body)
    expect(landed.body).toEqual({ created: 1, replaced: 0, kept: 0, comments: 1, strays: 1 })

    // ONE conversation, reachable, holding the history — and no orphan beside it.
    const held = await chatsHeldBy(to.scope)
    expect(held).toHaveLength(1)
    expect(held[0].ticket.fields.session_id).toBe(businessSessionIdFor('bug137-stray-to'))
    expect(held[0].ticket.body).toContain('The history, re-copied.')
    // ARCHIVED AND NOT DELETED — the store's own removal, which every read above
    // storage is built over. The row the copy stranded is gone from every list.
    expect(held.map((h) => h.ticket.uid)).not.toContain(stray.uid)

    // AND THE RE-RUN IS IDEMPOTENT: there is no stray left to archive a second
    // time, and the conversation it landed is now kept rather than re-created.
    const again = await importChats(to.scope, exported.body)
    expect(again.body).toEqual({ created: 0, replaced: 0, kept: 1, comments: 0, strays: 0 })
    expect(await chatsHeldBy(to.scope)).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-137_a_session_id_in_no_recognised_form_is_refused', async () => {
    // REFUSED, NOT PASSED THROUGH. A conversation that arrives addressed to
    // nothing reports success and reads as data loss months later — which is
    // this whole bug. A payload is a FILE on this path (`--backup` writes one and
    // an operator can post one back), so the rule belongs on the write.
    const to = await business('bug137-unreadable')
    await seedPlaceholder(
      to.scope,
      businessSessionIdFor('bug137-unreadable'),
      businessBackendName('bug137-unreadable'),
    )
    const refused = await importChats(to.scope, {
      business: 'somewhere-else',
      chats: [
        {
          sessionId: 'sess-hand-written',
          title: 'sess-hand-written',
          status: 'open',
          body: '### Decision 1\n\nBy hand.\n',
          fields: { session_id: 'sess-hand-written' },
          comments: [{ kind: TRANSCRIPT, body: '- user: by hand\n' }],
        },
      ],
    })
    expect(refused.status).toBe(409)
    expect(String(refused.body.error)).toMatch(/no form this product mints/)
    expect(String(refused.body.error)).toMatch(/Nothing was written/)
    // NAMED IN THE BODY as well as in the prose, so a caller that is not a person
    // can tell which conversation it was about without parsing a sentence.
    expect(refused.body.sessions).toEqual(['sess-hand-written'])
    // NOTHING WAS WRITTEN — the refusal comes before any store write, for the
    // reason `/api/import` refuses ahead of `createDraft` rather than rolling
    // back after it.
    const held = await chatsHeldBy(to.scope)
    expect(held).toHaveLength(1)
    expect(held[0].ticket.body).toBe('')
  })

  it('test_UAT_FC_BUG-137_a_destination_that_cannot_place_the_history_is_refused', async () => {
    // THREE AMBIGUITIES, REFUSED RATHER THAN GUESSED, in the words `/api/export`
    // already refuses its own. A first match would put one site's history in
    // another site's pane, which is the same failure in a costume: reported as
    // success, discovered much later.
    const from = await business('bug137-ambig-from', true)
    await seedChat(from.scope, sessionIdFor(from.site), { backend: siteBackendName(from.site) })
    const exported = await exportChats(from.scope)

    // ONE — the destination holds two sites, so there is no unambiguous site to
    // re-address a site conversation onto.
    const two = await business('bug137-ambig-two', true)
    await seedTenantSite('bug137-ambig-two')
    const refusedTwo = await importChats(two.scope, exported.body)
    expect(refusedTwo.status).toBe(409)
    expect(String(refusedTwo.body.error)).toMatch(/holds 2 sites/)
    expect(String(refusedTwo.body.error)).toMatch(/Nothing was written/)
    expect(await chatsHeldBy(two.scope)).toHaveLength(0)

    // TWO — the destination holds no site at all, so a conversation about one has
    // nowhere to land. This is refused only when such a conversation actually
    // arrives: a business with no site is an ordinary state.
    const none = await business('bug137-ambig-none')
    const refusedNone = await importChats(none.scope, exported.body)
    expect(refusedNone.status).toBe(409)
    expect(String(refusedNone.body.error)).toMatch(/holds no site/)
    expect(refusedNone.body.sessions).toEqual([sessionIdFor(from.site)])
    expect(await chatsHeldBy(none.scope)).toHaveLength(0)

    // THREE — the PAYLOAD names two different sites, so even a destination
    // holding exactly one has no unambiguous mapping to make. The refusal lives
    // with the mapping rather than only in the route, because a hand-posted
    // backup can carry this shape without either route's site count saying so.
    const ok = await business('bug137-ambig-ok', true)
    const elsewhere = sessionIdFor('site_somewhere_else')
    const refusedBoth = await importChats(ok.scope, {
      ...exported.body,
      chats: [
        ...exported.body.chats,
        {
          sessionId: elsewhere,
          title: elsewhere,
          status: 'open',
          body: '',
          fields: { session_id: elsewhere },
          comments: [],
        },
      ],
    })
    expect(refusedBoth.status).toBe(409)
    expect(String(refusedBoth.body.error)).toMatch(/2 different sites/)
    expect(await chatsHeldBy(ok.scope)).toHaveLength(0)
  })
})
