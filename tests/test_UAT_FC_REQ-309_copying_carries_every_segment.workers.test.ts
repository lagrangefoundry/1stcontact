import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import type { ChatsPayload } from '../apps/control-app/src/chat-copy'
import { sessionArchive } from '../apps/control-app/src/ai'
import { Session } from '../apps/control-app/src/generated/ai-workers'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { businessSessionIdFor } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'

/**
 * REQ-309 — **copying a conversation carries every segment of it**.
 *
 * WHY THIS IS THE SAME TICKET AND NOT A SEPARATE ONE. "Nothing is thrown away" is the
 * principle the storage half is held to; this is the same principle on the path that
 * MOVES a conversation between deployments. `writeComments` landed one comment per
 * kind, first one wins, and said why — a second comment of a kind would have made
 * which transcript a session loads depend on scan order. lagrange-framework REQ-176
 * replaced that premise: an archived artifact is now a sequence of comments of one
 * kind, because a single body cannot outgrow a store's value ceiling and a
 * conversation must be able to. Against segments, keying by kind alone stopped being
 * a safeguard and became a shredder — a segmented transcript arrived with every
 * segment but one discarded, silently, and the copy reported success.
 *
 * SO THE LOAD-BEARING ASSERTION IS NOT A COUNT OF COMMENTS. It is that the product's
 * own archive, reading the DESTINATION store, gets the whole conversation back. A
 * count could be satisfied by landing the right number of wrong bodies; the join is
 * what a reader actually gets.
 *
 * IN WORKERD OVER REAL D1, THROUGH `route()`, for [[REQ-294]]'s reason: under
 * `wrangler dev` a conversation is rows in a miniflare SQLite file whose layout is an
 * implementation detail, so the Worker reads and writes through the very store it
 * serves from. Nothing is stubbed.
 */

const ORIGIN = 'https://app.test'

const TRANSCRIPT = 'chat_transcript'
const TOOL_TRANSCRIPT = 'tool_transcript'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

async function business(id: string): Promise<Scope> {
  await ensureTenant(id)
  return { businessId: id }
}

const storeFor = (scope: Scope): Promise<TicketStore> => ticketStoreFor(routerEnv(), scope)

async function exportChats(scope: Scope): Promise<Record<string, unknown>> {
  const res = await route(
    new Request(`${ORIGIN}/api/chats/export`, { method: 'GET' }),
    routerEnv(),
    scope,
    {},
  )
  expect(res.status).toBe(200)
  return (await res.json()) as Record<string, unknown>
}

async function importChats(scope: Scope, body: unknown): Promise<Record<string, unknown>> {
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
  expect(res.status).toBe(200)
  return (await res.json()) as Record<string, unknown>
}

/**
 * One session file segment, WRITTEN BY THE COMPONENT and not by this file.
 *
 * `Session.toFile` is the single writer of the transcript layout, and REQ-176 added
 * the `segment` key to the header it emits — so asking it for a segment is asking the
 * shipped format for one. A hand-rolled body here would be a second copy of a format
 * this repository deliberately keeps none of, and it would pass against itself while
 * the archive read nothing (which is exactly what the first cut of this suite did).
 *
 * SELF-CONTAINED IS THE FORMAT'S OWN CHOICE: a segment is a complete session file a
 * reader can render on its own, precisely so that every body already in a store is a
 * conforming sequence of one. The key is omitted at index 0 for that reason.
 */
function transcriptSegment(sessionId: string, index: number, turn: string): string {
  return new Session({
    id: sessionId,
    roleName: 'consultant',
    backendName: 'claude-api',
    segment: index,
    turns: [
      {
        role: 'user',
        content: turn,
        ts: `2026-01-0${index + 1}T00:00:00Z`,
        turn_id: `t${index}`,
      },
    ],
  }).toFile()
}

/**
 * One append-only segment, whose marker is written past index 0 and not at it.
 *
 * THE ONE FORMAT LITERAL IN THIS FILE, and it is one line: the `tool_transcript` has
 * no header object to ask, so there is nothing to delegate to. It is the marker
 * REQ-176 documents, and an absent one reads as index 0 — which is what makes a body
 * stored before segments existed the first of its own sequence.
 */
function toolSegment(index: number, text: string): string {
  const marker = index > 0 ? `<!-- xgd-segment index="${index}" -->\n` : ''
  return `${marker}## Read\n\n${text}\n`
}

/** A conversation held as a SEQUENCE per artifact, the way a long one now is. */
async function seedSegmented(
  scope: Scope,
  sessionId: string,
  transcripts: number,
  tools: number,
): Promise<Ticket> {
  const store = await storeFor(scope)
  const { ticket } = await store.create({
    type: 'chat',
    title: sessionId,
    fields: { session_id: sessionId, backend: 'claude-api' },
    body: `### Decision 1\n\nWe chose the serif wordmark.\n`,
  })
  for (let i = 0; i < transcripts; i += 1) {
    await store.comment({
      uid: ticket.uid,
      kind: TRANSCRIPT,
      body: transcriptSegment(sessionId, i, `turn in segment ${i}`),
    })
  }
  for (let i = 0; i < tools; i += 1) {
    await store.comment({ uid: ticket.uid, kind: TOOL_TRANSCRIPT, body: toolSegment(i, `tool ${i}`) })
  }
  return ticket
}

/** The live comments of one kind on the chat ticket homing `sessionId`. */
async function heldComments(
  scope: Scope,
  sessionId: string,
  kind: string,
): Promise<string[]> {
  const store = await storeFor(scope)
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const chat = tickets.find((t) => String((t.fields ?? {}).session_id ?? '') === sessionId)
  if (!chat) throw new Error(`no chat ticket for ${sessionId}`)
  const { comments } = await store.comments({ uid: chat.uid })
  return comments
    .filter((c) => String((c.fields ?? {}).kind ?? '') === kind)
    .map((c) => String(c.body ?? ''))
}

const SOURCE = 'req309-copy-source'
const TARGET = 'req309-copy-target'

beforeAll(async () => {
  await applySchema()
})

describe('REQ-309 a segmented conversation crosses between two stores whole', () => {
  it('test_UAT_FC_REQ-309_every_segment_is_exported_and_landed_as_a_sequence', async () => {
    const source = await business(SOURCE)
    const target = await business(TARGET)
    const sessionId = businessSessionIdFor(SOURCE)
    await seedSegmented(source, sessionId, 3, 2)

    const exported = await exportChats(source)
    const chats = exported.chats as ChatsPayload['chats']
    expect(chats).toHaveLength(1)

    // THE EXPORT ALREADY CARRIED THEM ALL — it takes a ticket's comments wholesale
    // rather than by a list of kinds, which is what made the read half of this path
    // correct before segments existed and correct after them with no change.
    expect(chats[0].comments.filter((c) => c.kind === TRANSCRIPT)).toHaveLength(3)
    expect(chats[0].comments.filter((c) => c.kind === TOOL_TRANSCRIPT)).toHaveLength(2)

    await importChats(target, exported)

    // AND NOW THE IMPORT DOES TOO. This is the assertion that fails on the code that
    // shipped: `writeComments` kept one row per kind, so a three-segment transcript
    // landed as one comment holding whichever segment was written last, and two
    // thirds of the conversation was gone with the copy reporting success.
    const landedSessionId = businessSessionIdFor(TARGET)
    const transcripts = await heldComments(target, landedSessionId, TRANSCRIPT)
    const tools = await heldComments(target, landedSessionId, TOOL_TRANSCRIPT)
    expect(transcripts).toHaveLength(3)
    expect(tools).toHaveLength(2)

    // EVERY SEGMENT'S CONTENT ARRIVED, not merely the right number of rows.
    for (let i = 0; i < 3; i += 1) {
      expect(transcripts.some((body) => body.includes(`turn in segment ${i}`))).toBe(true)
    }
    for (let i = 0; i < 2; i += 1) {
      expect(tools.some((body) => body.includes(`tool ${i}`))).toBe(true)
    }

    // AND EVERY TRANSCRIPT SEGMENT WAS RE-ADDRESSED ([[BUG-137]]), not just the first
    // one the old code happened to touch. A segment is a complete session file
    // carrying its own copy of the header, so a segment left naming the SOURCE's
    // session is a segment the destination's archive will not read as part of this
    // conversation.
    for (const body of transcripts) {
      expect(body).toContain(`"id": "${landedSessionId}"`)
      expect(body).not.toContain(`"id": "${sessionId}"`)
    }

    // THE READER GETS ONE CONTINUOUS ARTIFACT, which is the claim a count cannot
    // make. Read through the product's own archive over the DESTINATION store — the
    // same join the panel and the assistant come through.
    const archive = sessionArchive(await storeFor(target))
    const joined: string = await archive.toolTranscript(landedSessionId)
    expect(joined).toContain('tool 0')
    expect(joined).toContain('tool 1')
    expect(joined.indexOf('tool 0')).toBeLessThan(joined.indexOf('tool 1'))

    const loaded = await archive.load(landedSessionId)
    const contents = loaded.turns.map((t: { content: string }) => t.content)
    expect(contents).toContain('turn in segment 0')
    expect(contents).toContain('turn in segment 2')
    expect(contents.indexOf('turn in segment 0')).toBeLessThan(
      contents.indexOf('turn in segment 2'),
    )
  })

  it('test_UAT_FC_REQ-309_a_re_copy_leaves_the_sources_conversation_and_not_a_splice', async () => {
    // THE OTHER HALF OF "REPLACED IN PLACE". A `--force` re-copy of a conversation the
    // destination already holds must leave it holding the SOURCE's conversation — not
    // the source's spliced onto the tail of a longer one it held before. A stale
    // segment 3 left behind is not an orphan row: the archive joins by what each body
    // declares, so it would replay turns from a conversation nobody copied, in the
    // middle of one somebody did.
    const source = await business('req309-recopy-source')
    const target = await business('req309-recopy-target')

    // The destination first holds a LONG conversation — four transcript segments and
    // three tool segments.
    await seedSegmented(source, businessSessionIdFor('req309-recopy-source'), 4, 3)
    await importChats(target, await exportChats(source))
    const landedSessionId = businessSessionIdFor('req309-recopy-target')
    expect(await heldComments(target, landedSessionId, TRANSCRIPT)).toHaveLength(4)

    // Then the source is replaced by a SHORTER one under the same address, and copied
    // again with `force`. (A shorter conversation under one address is what an
    // operator re-seeding a demo produces, and it is the only shape that can expose a
    // surplus: a longer one would overwrite every row it found.)
    const store = await storeFor(source)
    const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
    for (const t of tickets) await store.archive({ uid: t.uid })
    await seedSegmented(source, businessSessionIdFor('req309-recopy-source'), 2, 1)

    await importChats(target, { ...(await exportChats(source)), force: true })

    // THE SURPLUS IS GONE. Two segments and one, exactly as the source has them.
    expect(await heldComments(target, landedSessionId, TRANSCRIPT)).toHaveLength(2)
    expect(await heldComments(target, landedSessionId, TOOL_TRANSCRIPT)).toHaveLength(1)

    // AND THE JOIN IS THE SOURCE'S CONVERSATION, with nothing from the one it
    // replaced — which is the failure a row count alone would not catch, because the
    // count would be right and the third turn would still be in the transcript.
    const archive = sessionArchive(await storeFor(target))
    const loaded = await archive.load(landedSessionId)
    const contents = loaded.turns.map((t: { content: string }) => t.content)
    expect(contents).toContain('turn in segment 0')
    expect(contents).toContain('turn in segment 1')
    expect(contents).not.toContain('turn in segment 2')
    expect(contents).not.toContain('turn in segment 3')
  })

  it('test_UAT_FC_REQ-309_a_one_segment_conversation_still_lands_as_one', async () => {
    // THE NO-REGRESSION CLAUSE, and it is the common case: every conversation written
    // before the ceiling was declared is a sequence of ONE, so the overwhelming
    // majority of copies must behave exactly as they did. A sequence-aware landing
    // that left a second row behind on a single-segment copy would have replaced one
    // silent corruption with another.
    const source = await business('req309-single-source')
    const target = await business('req309-single-target')
    await seedSegmented(source, businessSessionIdFor('req309-single-source'), 1, 1)

    await importChats(target, await exportChats(source))
    const landedSessionId = businessSessionIdFor('req309-single-target')
    expect(await heldComments(target, landedSessionId, TRANSCRIPT)).toHaveLength(1)
    expect(await heldComments(target, landedSessionId, TOOL_TRANSCRIPT)).toHaveLength(1)

    // Re-copied over itself, it is still one. This is the assertion the old
    // first-one-wins code passed and the new code must not lose.
    await importChats(target, { ...(await exportChats(source)), force: true })
    expect(await heldComments(target, landedSessionId, TRANSCRIPT)).toHaveLength(1)
    expect(await heldComments(target, landedSessionId, TOOL_TRANSCRIPT)).toHaveLength(1)
  })
})
