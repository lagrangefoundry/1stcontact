import { expect } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../../apps/control-app/src/router'
import type { Scope } from '../../apps/control-app/src/scope'
import type { ChatsPayload } from '../../apps/control-app/src/chat-copy'
import { ticketStoreFor, type Ticket, type TicketStore } from '../../apps/control-app/src/tickets'
import { ensureTenant, seedTenantSite } from './d1-site-factory'

/**
 * Seeding and reading a business's CONVERSATION HISTORY, in workerd over real D1.
 *
 * LIFTED OUT OF [[BUG-137]]'s SUITE BY [[BUG-159]], because there are now two
 * suites making claims about the same pair of routes and the setup is the larger
 * half of both. Everything here is fixture rather than assertion: what a session
 * file really looks like, how the library seeds a chat ticket and the empty one the
 * deployed builder auto-creates, and the two calls that export and import a history.
 * The claims stay in the suites.
 *
 * IN WORKERD, THROUGH `route()`, for [[REQ-294]]'s suite's own reason: under
 * `wrangler dev` a conversation is rows in a miniflare SQLite file whose layout is
 * an implementation detail, so nothing here is stubbed.
 */

export const ORIGIN = 'https://app.test'

/** The library's own comment kind for a session file. */
export const TRANSCRIPT = 'chat_transcript'
/** The kind a session that called a tool also carries. */
export const TOOL_TRANSCRIPT = 'tool_transcript'

export function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

export const storeFor = (scope: Scope): Promise<TicketStore> => ticketStoreFor(routerEnv(), scope)

/** A registered business, with the one site it holds if it holds one. */
export async function business(id: string, withSite = false): Promise<{ scope: Scope; site: string }> {
  await ensureTenant(id)
  const site = withSite ? (await seedTenantSite(id)).site : ''
  return { scope: { businessId: id }, site }
}

export async function exportChats(scope: Scope): Promise<{ status: number; body: ChatsPayload }> {
  const res = await route(
    new Request(`${ORIGIN}/api/chats/export`, { method: 'GET' }),
    routerEnv(),
    scope,
    {},
  )
  return { status: res.status, body: (await res.json()) as ChatsPayload }
}

export async function importChats(
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
export const TURNS =
  '<!-- xgd-chat role="user" ts="2026-01-01T00:00:00Z" -->\n#### You\nmake the hero warmer\n'

/**
 * A session file as the library really writes one.
 *
 * THE HEADER IS THE POINT. `Session.toFile` emits exactly this — a JSON block
 * between `<!-- xgd-session` and `-->` — and it carries the session id a third
 * time, the backend name the manager resolves against its registry when it
 * attaches, and the uid of the chat ticket the session is homed on. A test
 * seeding a transcript with no header would assert nothing about the failure
 * [[BUG-137]] is: the composer frozen on *"Unknown backend claude+site:…"* once
 * the conversation is finally reachable.
 */
export function sessionFile(meta: Record<string, unknown>, turns = TURNS): string {
  return `<!-- xgd-session\n${JSON.stringify(meta, null, 2)}\n-->\n\n${turns}`
}

/** The header block of a session file, parsed back. */
export function headerOf(body: string): Record<string, unknown> {
  const match = /^<!--\s*xgd-session\s*\n(.*?)\n-->\s*/s.exec(body)
  expect(match).not.toBeNull()
  return JSON.parse((match as RegExpExecArray)[1]) as Record<string, unknown>
}

/** The turns beneath the header, which re-addressing must not touch. */
export function turnsOf(body: string): string {
  const match = /^<!--\s*xgd-session\s*\n(.*?)\n-->\s*/s.exec(body)
  return match === null ? body : body.slice(match[0].length)
}

/** One conversation, seeded as the product writes one. */
export async function seedChat(
  scope: Scope,
  sessionId: string,
  over: {
    backend?: string
    ledger?: string
    transcript?: string | null
    tool?: string
    chatTicketUid?: string
    backendRef?: string
    role?: string
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
          role: over.role ?? 'consultant',
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
export async function seedPlaceholder(
  scope: Scope,
  sessionId: string,
  backend: string,
): Promise<Ticket> {
  const store = await storeFor(scope)
  const { ticket } = await store.create({
    type: 'chat',
    title: sessionId,
    fields: { session_id: sessionId, backend },
  })
  return ticket
}

/** Every chat this business can still reach, with its comments, by session id. */
export async function chatsHeldBy(
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

export const commentOfKind = (comments: Ticket[], kind: string): Ticket | undefined =>
  comments.find((c) => (c.fields ?? {}).kind === kind)
