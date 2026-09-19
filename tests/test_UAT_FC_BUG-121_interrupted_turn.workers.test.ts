import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import {
  pacedClient,
  says,
  scriptedClient,
  sentText,
  type ModelRequest,
  type WireEvent,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * BUG-121 — **an interrupted turn no longer costs the client their own words**.
 *
 * WHAT WAS WRONG. The operator typed a long message, watched a reply begin, went
 * to look at something else, and came back to a conversation byte-identical to
 * the one they left. Not a truncated reply: no reply, and no prompt. There was
 * nothing to read back and nothing to re-send, and nothing on screen said a turn
 * had happened at all — so the honest reading of that screen was that the
 * assistant had ignored them.
 *
 * WHY, AND WHY IT IS NOT THE ASYMMETRY THE TICKET FIRST DESCRIBED. An in-flight
 * turn is durable NOWHERE. Its records — the prompt, the deltas AND the tool
 * calls alike — sit on a junction that is RAM in this Worker, and the archive
 * deliberately lags by a whole open turn (`closedPrefix`, lagrange-framework
 * BUG-19 D1, because folding half a turn splits one reply in two). So the whole
 * turn is drained by one `apply` when it closes, and an isolate that goes away
 * before that loses both halves together. There is no version of this in which
 * the work survives and the conversation is discarded.
 *
 * WHAT THIS FIXES, THEREFORE, IS THE ORDERING AND NOT THE MECHANISM. The one
 * record that need not wait for the drain is the one the client cannot
 * reconstruct: their own message. It is written to the session's `chat` ticket
 * BEFORE the model is called — so it is durable ahead of the first token and
 * ahead of anything a tool does to the site — kept with the turn's outcome when
 * the turn does not complete, and reported to the next page load beside the
 * transcript it is reconciled against.
 *
 * WHAT IT DOES NOT FIX, asserted nowhere because it is not true here: the
 * assistant's partial prose is still lost with the isolate. Only a durable
 * junction beside a durable driver closes that ([[EPIC-19]] Finding 4).
 *
 * WHY THESE TESTS PACE THE MODEL, inherited from BUG-46's suite along with its
 * apparatus: every claim here is about a state that exists only between
 * `turn_start` and `turn_end`. A double that answers in one go never produces it.
 *
 * The one double is the Anthropic client. The session manager, the junction, the
 * archive, the D1 ticket store, the reminder assembly and the SSE framing are all
 * the real thing.
 */

const TENANT = 'bug121'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
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

const post = (path: string, body: unknown, ctx?: ExecutionContext): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    ctx,
  )

interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/** BUG-46's reader: frames one at a time, so a test can act mid-turn. */
function frameReader(response: Response): {
  next: () => Promise<Frame | null>
  drain: () => Promise<Frame[]>
  cancel: () => Promise<void>
} {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const queued: Frame[] = []
  const next = async (): Promise<Frame | null> => {
    for (;;) {
      if (queued.length > 0) return queued.shift()!
      const { value, done } = await reader.read()
      if (done) return null
      buffer += decoder.decode(value, { stream: true })
      let split
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, split).trim()
        buffer = buffer.slice(split + 2)
        if (frame.startsWith('data:')) queued.push(JSON.parse(frame.slice(5).trim()) as Frame)
      }
    }
  }
  return {
    next,
    drain: async () => {
      const all: Frame[] = []
      for (;;) {
        const frame = await next()
        if (frame === null) return all
        all.push(frame)
        if (frame.kind === 'done') return all
      }
    },
    cancel: () => reader.cancel(),
  }
}

async function store(): Promise<TicketStore> {
  return ticketStoreFor(workerEnv(), { businessId: TENANT })
}

/** The session's `chat` ticket, found the way everything else finds it. */
async function chatTicket(sessionId: string): Promise<Ticket | null> {
  const { tickets } = await (await store()).query({ predicate: 'type=chat', limit: 'all' })
  return tickets.find((t) => (t.fields ?? {}).session_id === sessionId) ?? null
}

/** What the store remembers about an unaccounted-for turn, read raw. */
async function storedPrompt(
  sessionId: string,
): Promise<{ text: string; at: string; status: string } | null> {
  const raw = ((await chatTicket(sessionId))?.fields ?? {}).pending_turn
  if (typeof raw !== 'string' || raw === '') return null
  return JSON.parse(raw) as { text: string; at: string; status: string }
}

/** The archived session file — the durable transcript, or null. */
async function archivedTranscript(sessionId: string): Promise<string | null> {
  const chat = await chatTicket(sessionId)
  if (!chat) return null
  const { comments } = await (await store()).comments({ uid: chat.uid })
  return comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')?.body ?? null
}

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  cursor: number
  live: boolean
  interrupted?: { text: string; at: string; recorded: boolean }
}

async function openFor(prefix: string): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  return { site, sessionId }
}

const reopen = async (site: string): Promise<OpenedSession> =>
  (await (await post('/api/ai/session', { site })).json()) as OpenedSession

describe('BUG-121 — an interrupted turn keeps the client’s words and says so', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-121_the_prompt_is_durable_before_the_model_is_called', async () => {
    // THE ORDERING IS THE GUARANTEE, so the ordering is what is asserted — not a
    // consequence of it. The double reads the store at the instant the host asks
    // it for a completion, which is the first moment anything about this turn
    // could have cost money or touched the site.
    const { sessionId } = await openFor('early')
    const paced = pacedClient('Starting. ', 'Finished.')
    let atCall: Awaited<ReturnType<typeof storedPrompt>> = null
    setModelClient({
      seen: paced.seen,
      messages: {
        create: async (req: ModelRequest): Promise<AsyncGenerator<WireEvent>> => {
          atCall = await storedPrompt(sessionId)
          return paced.messages.create(req)
        },
      },
    })

    const { ctx, settled } = collectingCtx()
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Rebuild the recursion diagram.' }, ctx),
    )
    await turn.next()

    expect(atCall).not.toBeNull()
    expect(atCall!.text).toBe('Rebuild the recursion diagram.')
    // `open` — nothing has closed the turn, which is the state that survives an
    // isolate going away.
    expect(atCall!.status).toBe('open')
    // AND THE ARCHIVE HAD NOTHING, at that same instant. This is the half that
    // makes the record worth writing: the transcript is a whole open turn behind
    // by design, so it is not a place the prompt can be early.
    expect(await archivedTranscript(sessionId)).not.toContain('Rebuild the recursion diagram.')

    paced.release()
    await turn.drain()
    // AWAITING WHAT THE ROUTE REGISTERED, not a timer. The `done` frame is sent
    // from inside the stream and the turn's own `finally` runs after it, so a
    // test that read the store on the frame alone would be racing the thing it is
    // asserting — and would have passed against code that never closed a record
    // at all.
    await settled()
    // A turn that completes forgets it. Left behind, it would offer the operator
    // a re-send of a message that was answered.
    expect(await storedPrompt(sessionId)).toBeNull()
  })

  it('test_UAT_FC_BUG-121_a_turn_whose_isolate_never_returns_hands_back_the_words', async () => {
    // THE REPORTED INCIDENT. The turn is open, the junction holding it is RAM,
    // and the isolate driving it goes — so nothing runs a `finally`, nothing
    // drains, and the transcript is left exactly as it was before the prompt.
    // Dropping this host's state is that isolate going away.
    const { site, sessionId } = await openFor('lost')
    const model = pacedClient('Let me look at that. ', 'never arrives')
    setModelClient(model)

    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'A long message, typed once.' }),
    )
    expect((await turn.next())?.content).toBe('Let me look at that. ')
    resetAiHost()
    resetChatHost()

    const painted = await reopen(site)
    // THE FAILURE, unchanged and still true: the conversation has no memory of
    // the turn. That is the archive behaving correctly, and it is why the answer
    // cannot come from there.
    expect(painted.turns.map((t) => t.markdown)).not.toContain('A long message, typed once.')
    // AND THE FIX. The words come back, and they are reported as having reached
    // no transcript — which is what tells the pane to hand them to the operator
    // rather than merely commenting on them.
    expect(painted.interrupted?.text).toBe('A long message, typed once.')
    expect(painted.interrupted?.recorded).toBe(false)
    expect(painted.interrupted?.at).not.toBe('')

    // STILL THERE ON THE NEXT READ, because this record is the only copy of those
    // words in existence. Clearing it as "delivered" would lose them a second
    // time to a reload that happened before the operator acted.
    expect((await reopen(site)).interrupted?.text).toBe('A long message, typed once.')
  })

  it('test_UAT_FC_BUG-121_an_abandoned_turn_is_reported_as_interrupted_not_as_short', async () => {
    // THE OTHER HALF OF THE LOSS, and the one BUG-46 made survivable: the client
    // walks away, the drain is held open by `ctx.waitUntil`, and the turn IS
    // archived — as a fragment. So the words are safe and what the operator is
    // owed is being told that the reply they are reading stopped rather than
    // ended.
    const { site, sessionId } = await openFor('abandon')
    const model = pacedClient('This much was said. ', 'This much was not.')
    setModelClient(model)

    const { ctx, settled } = collectingCtx()
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Start on the margins.' }, ctx),
    )
    await turn.next()
    await turn.cancel()
    // One more event, so the next enqueue meets the cancelled stream and throws —
    // which is what runs the turn's `finally` (BUG-46).
    model.release()
    await settled()

    const archived = await archivedTranscript(sessionId)
    expect(archived).toContain('Start on the margins.')
    expect(archived).toContain('This much was said.')
    // The turn ended, and it did not complete — so the record is kept with its
    // outcome rather than forgotten.
    expect((await storedPrompt(sessionId))?.status).toBe('aborted')

    const painted = await reopen(site)
    expect(painted.interrupted?.recorded).toBe(true)
    expect(painted.interrupted?.text).toBe('Start on the margins.')
  })

  it('test_UAT_FC_BUG-121_a_turn_in_flight_is_not_reported_as_interrupted', async () => {
    // THE FALSE POSITIVE THIS MUST NOT HAVE. A reload mid-turn is the ordinary
    // case BUG-46 exists for: the pane paints the fold and reattaches to the
    // rest. Reporting it would tell the operator that the reply arriving in front
    // of them had been lost.
    const { site, sessionId } = await openFor('inflight')
    const model = pacedClient('Still writing. ', 'Done now.')
    setModelClient(model)

    const { ctx, settled } = collectingCtx()
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Say two halves.' }, ctx),
    )
    await turn.next()

    const painted = await reopen(site)
    expect(painted.live).toBe(true)
    expect(painted.interrupted).toBeUndefined()

    model.release()
    await turn.drain()
    await settled()
    // And once it has finished, still nothing — the turn accounted for itself.
    expect((await reopen(site)).interrupted).toBeUndefined()
  })

  it('test_UAT_FC_BUG-121_the_next_turn_is_told_its_predecessor_was_cut', async () => {
    // THE ASSISTANT'S OWN MEMORY IS THE OTHER THING AN INTERRUPTION BREAKS. It
    // may have written pages or recorded a decision, and none of that is in the
    // transcript it reads back — so without being told it re-does the work, or
    // re-asks a question that was settled, in front of the client.
    const { sessionId } = await openFor('reminder')
    const model = pacedClient('Working on it. ', 'unreachable')
    setModelClient(model)
    const lost = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Do the diagram.' }))
    await lost.next()
    resetAiHost()
    resetChatHost()

    const next = scriptedClient([says('Let me look at the site before I answer.')])
    setModelClient(next)
    const second = collectingCtx()
    await frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'What happened?' }, second.ctx),
    ).drain()
    await second.settled()

    // THROUGH THE REMINDER CHANNEL REQ-131 AND REQ-160 ALREADY USE, so there is
    // one delivery mechanism to keep in step rather than three.
    expect(sentText(next.seen[0])).toContain('previous turn in this conversation did not finish')

    // AND IT IS GONE ON THE TURN AFTER THAT, because the turn just taken
    // completed and forgot the record. A line that appeared every turn would
    // teach the model to ignore the region it lives in.
    const after = scriptedClient([says('Carrying on.')])
    setModelClient(after)
    const third = collectingCtx()
    await frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Carry on then.' }, third.ctx),
    ).drain()
    await third.settled()
    expect(sentText(after.seen[0])).not.toContain('previous turn in this conversation did not finish')
  })
})
