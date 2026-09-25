import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { sessionArchive } from '../apps/control-app/src/ai'
import {
  D1_MAX_ROW_BYTES,
  VALUE_CEILING_BYTES,
  ticketStoreFor,
  type Ticket,
  type TicketStore,
} from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema, ensureTenant } from './support/d1-site-factory'

/**
 * REQ-309 — a session's transcript outgrows D1's value ceiling without discarding
 * a byte.
 *
 * THE FAILURE THIS IS FOR, in the numbers it actually happened in. The consultant
 * session for Lagrange Foundry reached 2,162,212 bytes of `tool_transcript` over 85
 * turns. D1's documented maximum for a string, BLOB or row is 2,000,000 bytes, so
 * from that moment every archive write returned `SQLITE_TOOBIG`: no prose folded, no
 * turn recorded, the session permanently dead. At roughly 25 KB of tool records per
 * turn, any session reaches that wall at about 80 turns, and beta sites are expected
 * to be multiples of the one that broke.
 *
 * WHAT IS BEING CLAIMED HERE, AND WHAT IS NOT. The segmenting itself is
 * lagrange-framework REQ-176's and is UAT'd there, against a substituted store whose
 * declared ceiling is 900 bytes so a handful of turns crosses it. That suite cannot
 * make this product's claim, because the whole of this host's side of the fix is a
 * FIGURE: the archive reads `max_value_bytes` off the client it was handed, and a
 * store that declares nothing keeps one body forever. So what these tests drive is
 * the real D1-backed `TicketStore` the product opens, at the real figure the product
 * declares, with real bodies either side of it — because a suite that declared its
 * own smaller ceiling would prove the component works and leave the one line that
 * was missing here untested.
 *
 * WHICH IS WHY THESE ARE SLOW AND WHY THAT IS THE POINT. A roll at 1.9 MB is
 * megabytes of real D1 traffic. Reaching it with a test-sized ceiling would be a
 * suite that passes with `maxValueBytes` deleted from `ticketStoreBase`.
 *
 * NOTHING IS STUBBED. `ticketStoreFor` opens the product's store over workerd's D1;
 * `sessionArchive` is the product's archive over it; the comments read back are rows.
 */

/** The library's own comment kinds. Spelled as they are stored. */
const TRANSCRIPT = 'chat_transcript'
const TOOL_TRANSCRIPT = 'tool_transcript'

/**
 * The position marker a second segment opens with, as REQ-176 writes it for an
 * artifact that has no header of its own.
 *
 * SPELLED, NOT IMPORTED, and only ever asserted — never constructed. These tests
 * make claims about what a reader gets back, which the component's own join answers;
 * this appears in exactly one assertion, where the claim is that the SEQUENCE really
 * is a sequence and not one body that grew. Building a body from it here would be
 * this suite writing the format it is supposed to be checking.
 */
const SEGMENT_MARKER = /^<!--\s*xgd-segment\s+index="(\d+)"\s*-->/

const BUSINESS = 'tenant-req309-ceiling'

let scope: Scope

beforeAll(async () => {
  await applySchema()
  await ensureTenant(BUSINESS)
  scope = { businessId: BUSINESS }
})

afterEach(() => {
  vi.restoreAllMocks()
})

function storeFor(): Promise<TicketStore> {
  return ticketStoreFor(
    {
      DB: env.DB as D1Database,
      BLOBS: env.BLOBS as R2Bucket,
    },
    scope,
  )
}

/** Every comment of one kind on a chat ticket, as rows. */
async function commentsOfKind(
  store: TicketStore,
  chatUid: string,
  kind: string,
): Promise<Ticket[]> {
  const { comments } = await store.comments({ uid: chatUid })
  return comments.filter((c) => String((c.fields ?? {}).kind ?? '') === kind)
}

/** The chat ticket homing a session, by the field the archive finds it on. */
async function chatFor(store: TicketStore, sessionId: string): Promise<Ticket> {
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const found = tickets.find((t) => String((t.fields ?? {}).session_id ?? '') === sessionId)
  if (!found) throw new Error(`no chat ticket for ${sessionId}`)
  return found
}

/**
 * The `session_start` a session's FIRST fold opens with — and only its first.
 *
 * NOT ONCE PER APPLY, and the difference is not cosmetic. `applyRecords` reads a
 * `session_start` as *this is a new session* and builds a fresh one, discarding what
 * was folded before it; every later increment folds onto the session read back out of
 * the stored segments. So a suite that stamped one on every apply would archive one
 * turn over and over and never grow a transcript at all — which is how the prose half
 * of this ticket could have been written with a green tick and no segments.
 */
function sessionStart(sessionId: string) {
  return { kind: 'session_start', id: sessionId, role: 'consultant', backend: 'claude-api' }
}

/**
 * One increment into the archive — `session_start` on the first, never after.
 *
 * Named because both halves below need it and both got it wrong in the same way
 * once. The counter is per session id, so each test's session opens exactly once.
 */
const opened = new Set<string>()
async function fold(archive: Untyped, sessionId: string, records: unknown[]): Promise<void> {
  const first = !opened.has(sessionId)
  opened.add(sessionId)
  await archive.apply(sessionId, first ? [sessionStart(sessionId), ...records] : records)
}

/** The archive is the untyped component; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * `count` tool records, each carrying `filler` bytes of output.
 *
 * ONE RECORD CANNOT DO IT, and the reason is worth naming: `renderToolRecords`
 * truncates each call's output at 5,800 bytes, so a single enormous tool result
 * renders small. Crossing a 1.9 MB ceiling therefore takes hundreds of records —
 * which is exactly the shape the live session reached it in, at about 25 KB of tool
 * records per turn over 85 turns.
 */
function toolRecords(count: number, from: number, filler: number) {
  return Array.from({ length: count }, (_unused, i) => ({
    kind: 'tool',
    turn_id: `turn-${from + i}`,
    ts: `2026-01-01T00:00:${String((from + i) % 60).padStart(2, '0')}Z`,
    meta: {
      event: 'tool_call',
      name: 'Read',
      id: `call-${from + i}`,
      input: { file_path: `notes-${from + i}.md` },
      // Marked with its own index so a join can be checked for order and for
      // completeness rather than only for length.
      output: `record ${from + i} ` + 'x'.repeat(filler),
    },
  }))
}

describe('the store declares the ceiling of the substrate it is made of', () => {
  it('declares a figure below D1s documented row limit, with the headroom a row needs', async () => {
    const store = await storeFor()

    // THE DECLARATION IS THE WHOLE OF THIS HOST'S SIDE OF THE FIX. `TicketSessionArchive`
    // reads exactly this property off the client it was handed; a store that answers
    // 0 keeps one body forever, which is correct for a filesystem and was fatal here.
    expect(store.max_value_bytes).toBe(VALUE_CEILING_BYTES)

    // AND IT IS BELOW THE DOCUMENTED LIMIT, NOT EQUAL TO IT. That figure bounds a
    // string, a BLOB *or a row*, and a comment body travels beside a uid, a subject
    // uid, a `kind`, a status, a version and two timestamps. A body packed to exactly
    // 2,000,000 is a ROW over it, and the refusal would land on the fold that crossed
    // the boundary — the one moment the segmenting exists to prevent.
    expect(D1_MAX_ROW_BYTES).toBe(2_000_000)
    expect(VALUE_CEILING_BYTES).toBeLessThan(D1_MAX_ROW_BYTES)
    expect(D1_MAX_ROW_BYTES - VALUE_CEILING_BYTES).toBeGreaterThanOrEqual(100_000)
  })

  it('declares it on every business, because the ceiling is D1s and not a tenants', async () => {
    // Declared on the base handle and forwarded verbatim by `forTenant`, so one
    // business cannot be segmenting while another silently is not.
    await ensureTenant('tenant-req309-second')
    const other = await ticketStoreFor(
      { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
      { businessId: 'tenant-req309-second' },
    )
    expect(other.max_value_bytes).toBe(VALUE_CEILING_BYTES)
  })
})

describe('a tool transcript grows past the ceiling and keeps every byte', () => {
  it('rolls into a second comment and reads back whole, in order', async () => {
    const store = await storeFor()
    const archive = sessionArchive(store)
    const sessionId = 'site-req309-tools'

    // ENOUGH TO CROSS 1.9 MB AND NOT MUCH MORE. Each record renders at about 5.8 KB
    // after truncation, so ~340 of them is the first byte over — the roll happens
    // once, which is all that has to happen for the claim to be made.
    const perApply = 120
    let written = 0
    for (let pass = 0; pass < 3; pass += 1) {
      await fold(archive, sessionId, toolRecords(perApply, written, 6_000))
      written += perApply
    }

    const chat = await chatFor(store, sessionId)
    const segments = await commentsOfKind(store, chat.uid, TOOL_TRANSCRIPT)

    // IT REALLY IS A SEQUENCE. One comment here would mean the ceiling was never
    // read, and the next append would be the one D1 refused.
    expect(segments.length).toBeGreaterThan(1)

    // EVERY STORED SEGMENT IS UNDER THE DECLARED CEILING, which is the property that
    // makes the write possible at all. Measured in UTF-8 bytes, the unit the ceiling
    // is in — the bodies here are ASCII, so `length` would agree, but the assertion
    // should not depend on that.
    const encoder = new TextEncoder()
    for (const segment of segments) {
      expect(encoder.encode(String(segment.body ?? '')).length).toBeLessThanOrEqual(
        VALUE_CEILING_BYTES,
      )
    }

    // AND EXACTLY ONE OF THEM IS THE FIRST. REQ-176 writes no marker at index 0,
    // which is what makes a body stored before the ceiling was declared a conforming
    // sequence of one — so the unmarked segment is the original and every other
    // declares its position in its own bytes.
    const unmarked = segments.filter((s) => !SEGMENT_MARKER.test(String(s.body ?? '')))
    expect(unmarked).toHaveLength(1)

    // NOTHING WAS THROWN AWAY, which is the clause the whole ticket is held to. Read
    // through the archive's own join, because that is what a reader gets: the panel
    // replaying a conversation and the assistant addressing a turn by id both come
    // through here and must see one continuous artifact.
    const joined: string = await archive.toolTranscript(sessionId)
    for (let i = 0; i < written; i += 1) {
      expect(joined).toContain(`record ${i} `)
    }

    // IN ORDER, AND THAT IS NOT IMPLIED BY THE ABOVE. A ticket store lists comments
    // by a random uid, so the reading order is recovered from what each segment
    // declares about itself. Getting that wrong would replay the conversation out of
    // sequence while every byte was still present.
    expect(joined.indexOf('record 0 ')).toBeLessThan(joined.indexOf(`record ${written - 1} `))
    expect(joined.indexOf(`record ${perApply - 1} `)).toBeLessThan(
      joined.indexOf(`record ${perApply} `),
    )
  })
})

describe('the prose transcript grows past the ceiling and keeps every turn', () => {
  it('rolls into a second session file and loads from the first turn', async () => {
    const store = await storeFor()
    const archive = sessionArchive(store)
    const sessionId = 'site-req309-prose'

    // THE ASSISTANT'S REPLIES, NOT THE CLIENT'S MESSAGES. A turn this size cannot
    // arrive through the composer — `MAX_PROMPT_CHARS` refuses it at the front door —
    // but there is no bound on what the assistant writes back, and the transcript has
    // to be able to hold a thousand turns of it.
    const big = (n: number) => `reply ${n} ` + 'y'.repeat(700_000)
    for (let turn = 0; turn < 3; turn += 1) {
      await fold(archive, sessionId, [
        { kind: 'turn_start', role: 'user', turn_id: `t${turn}`, content: `ask ${turn}` },
        { kind: 'delta', turn_id: `t${turn}`, content: big(turn) },
        { kind: 'turn_end', turn_id: `t${turn}`, status: 'complete' },
      ])
    }

    const chat = await chatFor(store, sessionId)
    const segments = await commentsOfKind(store, chat.uid, TRANSCRIPT)
    expect(segments.length).toBeGreaterThan(1)

    const encoder = new TextEncoder()
    for (const segment of segments) {
      expect(encoder.encode(String(segment.body ?? '')).length).toBeLessThanOrEqual(
        VALUE_CEILING_BYTES,
      )
    }

    // A SESSION THAT HAS RUN FOR A THOUSAND TURNS CAN STILL BE READ FROM ITS FIRST.
    // `load` is the archive's join, and the first turn is the one a size-driven
    // elision would have taken — the earliest turns are often the most load-bearing,
    // which is why eliding them is not an acceptable answer to a row limit.
    const loaded = await archive.load(sessionId)
    const contents = loaded.turns.map((t: { content: string }) => t.content)
    expect(contents).toContain('ask 0')
    expect(contents).toContain('ask 2')
    expect(contents.filter((c: string) => c.startsWith('reply 0 '))).toHaveLength(1)
    expect(contents.filter((c: string) => c.startsWith('reply 2 '))).toHaveLength(1)

    // AND THE TURNS ARE IN THE ORDER THEY HAPPENED, across the seam.
    expect(contents.indexOf('ask 0')).toBeLessThan(contents.indexOf('ask 2'))
  })
})

describe('the session that has already exceeded the ceiling is repaired', () => {
  it('carries its existing content into a sequence and takes turns again', async () => {
    const store = await storeFor()
    const sessionId = 'site-req309-dead'

    // THE DEAD SESSION'S STATE, REPRODUCED. A single `tool_transcript` comment
    // already OVER the figure this deployment now declares — which is what every
    // session archived before the declaration existed looks like, and what the
    // Lagrange Foundry session is: written when nothing bounded it, now too big for
    // the open segment to be grown by one more byte.
    const { ticket } = await store.create({
      type: 'chat',
      title: sessionId,
      fields: { session_id: sessionId, backend: 'claude-api' },
    })
    const stranded = 'stranded record ' + 'z'.repeat(VALUE_CEILING_BYTES + 5_000)
    await store.comment({ uid: ticket.uid, kind: TOOL_TRANSCRIPT, body: stranded })

    // ONE MORE TURN. On the code that shipped, this is the write that returned
    // `SQLITE_TOOBIG` and the moment the session died.
    const archive = sessionArchive(store)
    await fold(archive, sessionId, toolRecords(1, 9_000, 400))

    const segments = await commentsOfKind(store, ticket.uid, TOOL_TRANSCRIPT)

    // IT TOOK THE TURN. A fresh segment opened rather than the stranded one being
    // grown — REQ-176's packing rolls an open segment that is ALREADY at or over the
    // ceiling, which is precisely what makes a body stored before the declaration
    // repairable rather than a dead end.
    expect(segments.length).toBe(2)

    // ITS EXISTING CONTENT WAS CARRIED, NOT REWRITTEN AND NOT TRIMMED TO FIT. Byte
    // for byte: nothing is thrown away to make room, and no migration ran.
    const original = segments.find((s) => String(s.body ?? '').startsWith('stranded record '))
    expect(original).toBeDefined()
    expect(String(original?.body ?? '')).toBe(stranded)

    // AND THE READER SEES ONE CONTINUOUS ARTIFACT: everything the dead session had
    // said, then the turn it has just taken.
    const joined: string = await archive.toolTranscript(sessionId)
    expect(joined).toContain('stranded record ')
    expect(joined).toContain('record 9000 ')
    expect(joined.indexOf('stranded record ')).toBeLessThan(joined.indexOf('record 9000 '))
  })
})

describe('a store that cannot accept a write says so where an operator will see it', () => {
  it('names the artifact, the segment and the ceiling this deployment declared', async () => {
    const store = await storeFor()
    const archive = sessionArchive(store)
    const sessionId = 'site-req309-refused'
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {})

    // THE ONE THING A CEILING CANNOT ABSORB: a single turn larger than the whole of
    // it. No packing can place it, and shrinking it would mean discarding content —
    // so the honest outcome is a named refusal. This is also why the product bounds a
    // MESSAGE at the front door: a client must not be able to reach this state, and on
    // this path only the assistant can.
    const enormous = 'w'.repeat(D1_MAX_ROW_BYTES + 200_000)
    await expect(
      fold(archive, sessionId, [
        { kind: 'turn_start', role: 'user', turn_id: 'huge', content: 'ask' },
        { kind: 'delta', turn_id: 'huge', content: enormous },
        { kind: 'turn_end', turn_id: 'huge', status: 'complete' },
      ]),
    ).rejects.toThrow()

    // IT WAS REPORTED, AND AT `error`. Workers Logs reads severity off the console
    // channel, and an artifact that is no longer being kept is the product's memory
    // of a client's conversation going unwritten — the component is right to warn,
    // because it cannot know what the artifact is worth to its host; here it is worth
    // an error.
    expect(reported).toHaveBeenCalled()
    const said = reported.mock.calls.map((c) => String(c[0])).join('\n')

    // WITH THE THREE FACTS THE COMPONENT DOES NOT HAVE. Which substrate it was, which
    // artifact and segment, and what ceiling THIS deployment declared — which is what
    // lets an operator tell a value ceiling from a quota from a transient error
    // without coming to read the source. It names no cause, because this host knows
    // the substrate and not which of those happened.
    expect(said).toContain('the D1 ticket store could not write')
    expect(said).toContain('transcript')
    expect(said).toContain(String(VALUE_CEILING_BYTES))
    expect(said).toContain(sessionId)

    // AND THE REPORT IS LEFT ON THE ARCHIVE TOO, so a host that wired nothing can
    // still ask. Wiring the channel must not take that away.
    expect(archive.lastArtifactError).not.toBeNull()
  })
})
