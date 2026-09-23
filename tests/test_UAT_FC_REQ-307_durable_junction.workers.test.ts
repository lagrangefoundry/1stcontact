import { beforeAll, afterEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { JunctionNamespace } from '../apps/control-app/src/junctions'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { pacedClient, says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * REQ-307 — **a turn survives the isolate that was writing it**.
 *
 * WHAT WAS WRONG. The junction is the only place a turn's records live while the
 * turn is open. The archive deliberately lags by a whole open turn —
 * `closedPrefix` cuts at the last boundary where no turn is open, because folding
 * half a turn splits one reply in two — so between `turn_start` and `turn_end`
 * there was no durable copy of the prose OR the tool records. In this Worker that
 * junction was RAM, scoped to one isolate. An eviction under memory pressure, or
 * a `wrangler dev` reload, therefore destroyed the turn outright: no `turn_end`,
 * no fold, no spend row, and [[BUG-121]]'s pending record left at `open`.
 * [[EPIC-19]] Finding 10 records three such losses in one afternoon.
 *
 * WHAT THIS FIXES. The junction is a Durable Object per session — a single
 * writer with a synchronous SQLite API, which is what upstream's
 * `junction_memory.js` names as the route back and says "needs no change here,
 * which is the point of making storage a port". A restart now costs the client
 * the rest of the answer and nothing else: not their words, not the work the turn
 * already did, not the coherence of the transcript.
 *
 * WHAT IT DELIBERATELY DOES NOT DO, and the last case here asserts the honest
 * shape of it: the turn does not RESUME. The model loop was running in an isolate
 * that no longer exists and nothing can continue it. What this buys is that the
 * turn's words and work survive, so the client re-asks rather than reconstructs.
 *
 * WHY THIS SUITE RUNS IN WORKERD. What is under test is that records survive the
 * isolate that wrote them; a hand-written double for the thing that is supposed
 * to be durable would prove the double. The Durable Object is the real one, with
 * its own SQLite. The single double is the Anthropic client, as everywhere else
 * here — and it is PACED, because every claim below is about a state that exists
 * only between `turn_start` and `turn_end`, which a model that answers in one go
 * never produces.
 */

const TENANT = 'req307'

/** The library is untyped at this boundary, and the boundary is named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The namespace this deployment binds — the one under test. */
const junctions = (): JunctionNamespace =>
  (env as Untyped).SESSION_JUNCTION as JunctionNamespace

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
    // THE BINDING IS THE SUBJECT, so it is handed in explicitly rather than
    // spread from the test environment: the last case below omits it, and the
    // difference between the two is the whole of what this ticket changed.
    SESSION_JUNCTION: junctions(),
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  } as Env
}

const post = (path: string, body: unknown, over: Partial<Env> = {}): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(over),
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
  const drain = async (): Promise<Frame[]> => {
    const all: Frame[] = []
    for (;;) {
      const frame = await next()
      if (frame === null) return all
      all.push(frame)
      if (frame.kind === 'done') return all
    }
  }
  return { next, drain, cancel: () => reader.cancel() }
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

const reopen = async (site: string, over: Partial<Env> = {}): Promise<OpenedSession> =>
  (await (await post('/api/ai/session', { site }, over)).json()) as OpenedSession

/** The isolate going away: this host's per-isolate state is exactly what a cold start lacks. */
function isolateReplaced(): void {
  resetAiHost()
  resetChatHost()
}

/** The junction's bytes, read from the object rather than from the isolate that wrote them. */
async function durableBytes(sessionId: string): Promise<string> {
  const ns = junctions()
  const slice = await ns.get(ns.idFromName(sessionId)).since(0, 0)
  return new TextDecoder().decode(new Uint8Array(slice.bytes))
}

/**
 * Half an hour of wall clock, applied to the records a killed isolate left.
 *
 * WHY AGE THEM RATHER THAN WAIT. A producer's lease survives 30 seconds without
 * a heartbeat — generous on purpose, because expiring a LIVE producer is the one
 * failure that produces two concurrent turns — and that is the right number for
 * the runtime and the wrong one for a suite. So the records the killed isolate
 * really wrote are rewritten with older timestamps: the state a restart leaves
 * half a minute later, reached without half a minute of waiting. The records are
 * the real ones; only the clock moves.
 *
 * EXACTLY 24 CHARACTERS FOR 24, AND THE LENGTH IS LOAD-BEARING. The archive
 * syncer's watermark is a BYTE offset into this same stream, stored in the
 * junction's own metadata, which a rewrite does not touch — so a replacement
 * that changed any record's length would leave the watermark pointing into the
 * middle of one, and the next drain would read a torn line. An ISO timestamp is
 * always 24 characters, which is what makes the substitution safe.
 */
async function ageTheLease(sessionId: string): Promise<void> {
  const ns = junctions()
  const stub = ns.get(ns.idFromName(sessionId))
  const long = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  expect(long.length).toBe(24)
  await stub.replace((await durableBytes(sessionId)).replace(/("ts":")[^"]{24}(")/g, `$1${long}$2`))
}

/**
 * The junction's bytes once `needle` is among them — the write-behind window,
 * waited out rather than assumed away.
 *
 * WHY A WAIT AND NOT AN ASSERTION ON THE NEXT LINE. The junction's storage port
 * is SYNCHRONOUS: `log.append(...)` returns the record, so a durable write
 * cannot be awaited inside it and an adapter over a network hop has to queue.
 * What the ticket buys is therefore "durable within a round trip of being
 * appended" rather than "durable before append returns" — a window of
 * milliseconds against a turn that runs two to nine minutes, instead of a window
 * of the whole turn. This helper is that distinction, made explicit: a suite
 * that read once and passed would be asserting a stronger claim than the design
 * makes, and would be flaky for exactly the right reason.
 */
async function durableOnce(sessionId: string, needle: string): Promise<string> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const text = await durableBytes(sessionId)
    if (text.includes(needle)) return text
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error(`${needle} never reached the junction for ${sessionId}`)
}

/** The long-term transcript — a `chat_transcript` comment on the session's `chat` ticket. */
async function archived(sessionId: string): Promise<string> {
  const store: TicketStore = await ticketStoreFor(workerEnv(), { businessId: TENANT })
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const chat = tickets.find((t) => (t.fields ?? {}).session_id === sessionId)
  if (!chat) return ''
  const { comments } = await store.comments({ uid: chat.uid })
  return comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')?.body ?? ''
}

describe('REQ-307 — the junction outlives the isolate', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    isolateReplaced()
  })

  it('test_UAT_FC_REQ-307_a_turn_survives_the_isolate_that_was_writing_it', async () => {
    // THE REPORTED INCIDENT, and the assertion is the exact inverse of the one
    // BUG-121's suite still makes without this binding: there, reopening after a
    // mid-turn kill finds a conversation with no memory of the turn at all.
    const { site, sessionId } = await openFor('survives')
    const model = pacedClient('Let me look at that. ', 'never arrives')
    setModelClient(model)

    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'A long message, typed once.' }),
    )
    expect((await turn.next())?.content).toBe('Let me look at that. ')
    // The reply so far is on the junction — see {@link durableOnce} for why this
    // is a wait. A turn runs for minutes; this window is milliseconds.
    await durableOnce(sessionId, 'Let me look at that.')

    // The isolate is replaced. Nothing runs a `finally`; there is no `turn_end`,
    // no fold and no spend row — and this is the moment the whole turn used to
    // cease to exist.
    isolateReplaced()

    const painted = await reopen(site)
    const markdown = painted.turns.map((t) => t.markdown)
    // THE CLIENT'S OWN WORDS, back in the conversation they belong to rather than
    // only in [[BUG-121]]'s rescue record beside it.
    expect(markdown).toContain('A long message, typed once.')
    // AND THE WORK THE TURN ACTUALLY DID — the prose it had managed to say. The
    // rest of the answer is gone, which is the cost this ticket accepts.
    expect(markdown.join('\n')).toContain('Let me look at that.')
    expect(markdown.join('\n')).not.toContain('never arrives')
  })

  it('test_UAT_FC_REQ-307_records_are_durable_as_they_are_appended', async () => {
    // THE PROPERTY THE WHOLE TICKET TURNS ON, asserted at the one instant that
    // can distinguish it from what came before: mid-turn. The archive is a whole
    // open turn behind BY DESIGN, so a durable copy at this moment can only be
    // the junction's.
    const { sessionId } = await openFor('asappended')
    const model = pacedClient('The first half. ', 'The second half.')
    setModelClient(model)

    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Say it in two halves.' }),
    )
    await turn.next()

    const durable = await durableOnce(sessionId, 'The first half.')
    // The client's words and the model's first delta, in the Durable Object,
    // while the turn is still open and no `turn_end` has been written.
    expect(durable).toContain('Say it in two halves.')
    expect(durable).toContain('The first half.')
    expect(durable).not.toContain('turn_end')
  })

  it('test_UAT_FC_REQ-307_a_dangling_turn_is_closed_aborted_and_the_client_is_told', async () => {
    // THE RECOVERY PASS, which existed upstream all along and until now had
    // nothing to recover from. `SessionManager._reconcile` reads a lapsed lease
    // as "the producer is gone", closes the dangling turn `aborted` and drains
    // it into the archive.
    //
    // THE LEASE IS AGED RATHER THAN WAITED OUT. It survives 30 seconds without a
    // heartbeat, which is the right number for a live producer and the wrong one
    // for a suite; so the records the killed isolate really wrote are rewritten
    // with older timestamps, which is the state a restart leaves half a minute
    // later. The records are the real ones — only the clock is moved.
    const { site, sessionId } = await openFor('dangling')
    const model = pacedClient('This much was said. ', 'never arrives')
    setModelClient(model)

    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Start on the margins.' }),
    )
    await turn.next()
    await durableOnce(sessionId, 'This much was said.')
    isolateReplaced()

    await ageTheLease(sessionId)

    // THE ATTACH IS THE RECOVERY. Reopening the session is what runs
    // `_reconcile`: the lapsed lease says the producer is gone, so the dangling
    // turn is closed `aborted` and everything it managed to record is drained
    // into long-term storage.
    const painted = await reopen(site)
    // The conversation is coherent: the prompt and the fragment of the reply are
    // in it, in order, as one turn that stopped rather than two halves of none.
    expect(painted.turns.map((t) => t.markdown)).toContain('Start on the margins.')
    expect(painted.turns.map((t) => t.markdown).join('\n')).toContain('This much was said.')

    // THE TURN IS CLOSED, and closed `aborted` rather than left open forever.
    // Nothing else would ever have written this record: a killed isolate runs no
    // `finally`.
    const closed = await durableOnce(sessionId, '"kind":"turn_end"')
    expect(closed).toContain('"status":"aborted"')

    // AND IT IS FOLDED. The archive stops at the last CLOSED boundary by design,
    // so this fragment could only reach it once something closed the turn —
    // which is the whole of why the dangling turn is closed rather than dropped.
    const transcript = await archived(sessionId)
    expect(transcript).toContain('Start on the margins.')
    expect(transcript).toContain('This much was said.')

    // AND THE CLIENT IS TOLD THE REPLY IS A FRAGMENT. `recorded: true` is
    // [[BUG-121]]'s branch for "your words did reach the transcript" — the notice
    // this product already paints, reachable now instead of theoretical, because
    // until this ticket the words never did reach it.
    //
    // ON THE READ AFTER THE ONE THAT RECONCILED, and that ordering is upstream's
    // rather than this ticket's: `openSession` folds the transcript BEFORE it
    // attaches, so the response that performs the recovery is computed from the
    // state before it. What the client sees in between is a turn still marked
    // live, whose tail ends the moment they join it.
    const settled = await reopen(site)
    expect(settled.live).toBe(false)
    expect(settled.interrupted?.text).toBe('Start on the margins.')
    expect(settled.interrupted?.recorded).toBe(true)
  })

  it('test_UAT_FC_REQ-307_the_conversation_carries_on_after_the_interruption', async () => {
    // WHAT SURVIVING IS FOR. The point of keeping the fragment is not the
    // fragment: it is that the next turn is a continuation rather than a
    // reconstruction, so the client re-asks instead of re-explaining.
    const { site, sessionId } = await openFor('carryon')
    setModelClient(pacedClient('Half an answer. ', 'never arrives'))
    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'First question.' }))
    await turn.next()
    await durableOnce(sessionId, 'Half an answer.')
    isolateReplaced()
    // THE DEAD PRODUCER STILL HOLDS THE SESSION FOR THIRTY SECONDS, and that is
    // a consequence of this ticket rather than an accident of the test: before
    // it, the junction died with the isolate and there was no lease left to
    // hold anything. A prompt sent inside that window is ENQUEUED against a
    // producer that will never read it, so the client's own next turn has to
    // wait out the lease — which is what {@link ageTheLease} stands in for.
    await ageTheLease(sessionId)

    setModelClient(scriptedClient([says('A whole answer.')]))
    const again = await post('/api/ai/prompt', { sessionId, text: 'Second question.' })
    expect(again.status).toBe(200)
    const frames = await frameReader(again).drain()
    // IT RAN, rather than being queued behind the producer that died. A turn
    // enqueued against a dead claim is answered by nobody, so this is the
    // assertion that the reconciliation actually freed the session.
    expect(frames.some((f) => f.meta?.queued === true)).toBe(false)
    await durableOnce(sessionId, 'A whole answer.')

    isolateReplaced()
    setModelClient(null)
    const painted = await reopen(site)
    const markdown = painted.turns.map((t) => t.markdown).join('\n')
    // BOTH TURNS, in order. The interrupted one is still there — a turn that
    // stopped is part of the conversation, not a gap in it.
    expect(markdown).toContain('First question.')
    expect(markdown).toContain('Half an answer.')
    expect(markdown).toContain('Second question.')
  })

  it('test_UAT_FC_REQ-307_appends_carry_only_their_own_bytes', async () => {
    // THE PERFORMANCE OBLIGATION, and it is a correctness one at this scale:
    // this is the hottest loop in the system — one append per token delta — and
    // an adapter that rewrote the stream on every write would make it quadratic,
    // which is exactly the cost DOC-21 §2 exists to remove. Asserted against the
    // object's own read, because that is where a rewrite would show.
    const ns = junctions()
    const stub = ns.get(ns.idFromName('req307-delta'))
    await stub.append('one\n')
    await stub.append('two\n')
    await stub.append('three\n')

    const whole = await stub.since(0, 0)
    expect(new TextDecoder().decode(new Uint8Array(whole.bytes))).toBe('one\ntwo\nthree\n')
    expect(whole.size).toBe(14)
    expect(whole.at).toBe(0)

    // A reader that is one record behind receives ONE record — not the stream
    // with the record on the end of it.
    const tail = await stub.since(8, 0)
    expect(new TextDecoder().decode(new Uint8Array(tail.bytes))).toBe('three\n')
    expect(tail.at).toBe(8)
    // And a reader that is level receives nothing at all.
    expect((await stub.since(14, 0)).bytes.byteLength).toBe(0)
    // A CURSOR THAT IS NOT A BOUNDARY IS ANSWERED WITH THE WHOLE STREAM, never
    // with a slice that starts mid-record: `at` says which, and the record layer
    // would refuse a torn line rather than skip it.
    const torn = await stub.since(9, 0)
    expect(torn.at).toBe(0)
    expect(new TextDecoder().decode(new Uint8Array(torn.bytes))).toBe('one\ntwo\nthree\n')
  })

  it('test_UAT_FC_REQ-307_the_port_round_trips_over_the_object', async () => {
    // THE REST OF `JunctionStorage`, which `SessionLog` calls synchronously and
    // an adapter must answer for in full: `replace` (which is `seed`), `remove`
    // (which is `closeSession`) and the watermark pair the archive syncer keeps
    // its cursor in. Each is proved through the object rather than the mirror,
    // because the mirror is upstream's own and it is the DURABLE half that is new.
    const ns = junctions()
    const stub = ns.get(ns.idFromName('req307-port'))

    expect((await stub.since(0, 0)).present).toBe(false)
    await stub.append('first\n')
    await stub.writeMeta('{"watermark":1}')
    expect((await stub.since(0, 0)).meta).toBe('{"watermark":1}')

    // `replace` is atomic and total — and it moves the epoch, which is how a
    // reader holding the old bytes learns that a length comparison cannot tell
    // it what changed. A reader still quoting the OLD epoch is answered with the
    // whole stream for that reason alone, whatever its cursor says.
    const before = (await stub.since(0, 0)).epoch
    await stub.replace('seeded again\n')
    const seeded = await stub.since(0, 0)
    expect(new TextDecoder().decode(new Uint8Array(seeded.bytes))).toBe('seeded again\n')
    expect(seeded.epoch).toBeGreaterThan(before)
    expect((await stub.since(6, before)).at).toBe(0)

    await stub.remove()
    const gone = await stub.since(0, 0)
    expect(gone.present).toBe(false)
    expect(gone.size).toBe(0)
    expect(gone.meta).toBeNull()
  })

  it('test_UAT_FC_REQ-307_a_deployment_with_no_object_behaves_exactly_as_it_did', async () => {
    // THE FALLBACK, and it is what keeps every other suite and the `1c` CLI
    // unaffected by a binding neither has: no Durable Object means
    // `memoryJunctions()`, which is this Worker before the ticket. So the
    // conversation opens, replays and takes turns — and loses a turn in flight to
    // an isolate that goes away, which is the exposure and not a regression.
    const none = { SESSION_JUNCTION: undefined } as Partial<Env>
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('nobinding') })
    const opened = await post('/api/ai/session', { site }, none)
    expect(opened.status).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    setModelClient(pacedClient('Lost with the isolate. ', 'never arrives'))
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Ask into the void.' }, none),
    )
    await turn.next()
    isolateReplaced()

    const painted = await reopen(site, none)
    expect(painted.turns.map((t) => t.markdown)).not.toContain('Ask into the void.')
    // AND NOTHING WAS WRITTEN TO AN OBJECT IT WAS NOT GIVEN. A deployment with no
    // binding must not reach one by any other route.
    expect(await durableBytes(sessionId)).toBe('')
  })
})
