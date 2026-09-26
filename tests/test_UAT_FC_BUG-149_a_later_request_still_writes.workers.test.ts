import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import type { JunctionNamespace } from '../apps/control-app/src/junctions'
import type { SessionJunction } from '../apps/control-app/src/junction-do'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { pacedClient, says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-149]] — **the durable junction writes on the SECOND request too**.
 *
 * WHAT WAS WRONG. [[REQ-307]] made the junction a Durable Object per session so
 * that an isolate dying mid-turn costs the client the rest of the answer and
 * nothing else. It did not do that. `DurableJunctionStorage` captured a
 * `DurableObjectStub` in its constructor and the storage is held for the
 * isolate's LIFE — deliberately, because the mirror beside it is what makes the
 * port's synchronous reads possible. A stub is an I/O object: workerd binds it
 * to the request context that created it and refuses it from every later one.
 * So the object was written on exactly the first request a fresh isolate served
 * and on none after it: `prepare` caught the throw, set `adopted = false`, and
 * `queue` dropped every write on the floor. Reads still came off the mirror, so
 * the turn streamed, the fold happened, and nothing said the durability tier was
 * off. On the session this was measured on, thirteen of seventeen turns never
 * reached the object.
 *
 * WHAT THIS FIXES. The NAMESPACE is held — a binding, not an I/O object — and a
 * stub is taken from it per use, inside the request using it. And a storage
 * whose prepare failed repairs itself on the next one: the repair compares what
 * the object holds against what the mirror holds and pushes the unlanded tail
 * FORWARD, so records written while the object was unreachable are not deleted
 * when it comes back.
 *
 * WHY THE NAMESPACE IS WRAPPED HERE, AND WHY THAT IS NOT A DOUBLE OF THE THING
 * UNDER TEST. The Durable Object is the real one, with its own SQLite, exactly
 * as in REQ-307's suite. What is wrapped is the BINDING, and it is wrapped to
 * enforce a platform rule this test runtime does not: `@cloudflare/vitest-pool-workers`
 * serves a whole test file from one I/O context, so a stub captured in one
 * `worker.fetch` is still usable in the next — measured, not assumed. That is
 * precisely why REQ-307's suite passed against a Worker that had already stopped
 * writing in production. {@link requestScoped} restores the rule: a stub handed
 * out during request N throws the runtime's own sentence from request N+1
 * onward, so a session that crosses a request boundary here crosses one for
 * real.
 */

const TENANT = 'bug149'

/** The library is untyped at this boundary, and the boundary is named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The namespace this deployment binds — the object under all of this. */
const objects = (): JunctionNamespace => (env as Untyped).SESSION_JUNCTION as JunctionNamespace

/** workerd's own sentence, verbatim, because a test for it should quote it. */
const CROSS_REQUEST =
  'Cannot perform I/O on behalf of a different request. I/O objects (such as ' +
  'streams, request/response bodies, and others) created in the context of one ' +
  "request handler cannot be accessed from a different request's handler. This " +
  'is a limitation of Cloudflare Workers which allows us to improve overall ' +
  'performance. (I/O type: OutgoingFactory)'

interface Requests {
  /** The binding the Worker is given. */
  namespace: JunctionNamespace
  /**
   * The `ExecutionContext` the Worker is given, collecting what it holds open.
   *
   * WITHOUT IT THERE IS NO REQUEST TO END. `ctx.waitUntil` is what keeps a
   * Worker request alive past the response — `streamTurn` registers the promise
   * that settles when the turn's `finally` has closed the ledger, flushed the
   * junction and flushed the audit — so a request's lifetime is the response
   * PLUS that promise. A suite that ended the request at the `done` frame would
   * be refusing the turn's own flush and calling the refusal a bug.
   */
  ctx: ExecutionContext
  /**
   * End the current request: every stub handed out so far is now refused.
   *
   * Awaits what the request held open first, for the reason {@link Requests.ctx}
   * gives.
   */
  next(): Promise<void>
  /**
   * End the current request WITHOUT letting it finish — the isolate went away.
   *
   * THE DIFFERENCE FROM {@link Requests.next} IS THE WHOLE OF WHAT A KILL IS. A
   * request that completes settles what it held open; an isolate that dies does
   * not, and its turn's `finally` never runs. Awaiting the held promise there
   * would be waiting for a turn that is never coming back.
   */
  abandon(): void
  /** Make the object itself unreachable — a durability failure, not a lifetime one. */
  unreachable(yes: boolean): void
}

/**
 * The real namespace, with workerd's request-scoping rule put back.
 *
 * A stub remembers the request it was born in. Calling it from a later one
 * throws what the runtime throws, which is what makes the first case below fail
 * against the Worker as it shipped.
 */
function requestScoped(): Requests {
  const real = objects()
  let request = 0
  let down = false
  let holding: Promise<unknown>[] = []
  const namespace: JunctionNamespace = {
    idFromName: (name) => real.idFromName(name),
    get: (id) => {
      const born = request
      const stub = real.get(id)
      const reach = (): void => {
        if (down) throw new Error('the Durable Object is unreachable')
        if (born !== request) throw new Error(CROSS_REQUEST)
      }
      // Forwarded by hand rather than by a `Proxy`: an RPC stub's properties are
      // not ordinary functions (`apply` on one is an RPC method call), so the
      // five verbs of the port are named here and passed straight through.
      return {
        since: (from: number, epoch: number) => (reach(), stub.since(from, epoch)),
        append: (text: string) => (reach(), stub.append(text)),
        replace: (text: string) => (reach(), stub.replace(text)),
        remove: () => (reach(), stub.remove()),
        writeMeta: (text: string) => (reach(), stub.writeMeta(text)),
      } as unknown as DurableObjectStub<SessionJunction>
    },
  }
  return {
    namespace,
    ctx: {
      waitUntil: (promise: Promise<unknown>) => {
        holding.push(promise)
      },
      passThroughOnException: () => {},
      props: {},
    } as unknown as ExecutionContext,
    next: async () => {
      const held = holding
      holding = []
      await Promise.all(held.map((promise) => promise.catch(() => {})))
      request += 1
    },
    abandon: () => {
      holding = []
      request += 1
    },
    unreachable: (yes: boolean) => {
      down = yes
    },
  }
}

function workerEnv(namespace: JunctionNamespace | undefined): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    SESSION_JUNCTION: namespace,
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as Env
}

const post = (path: string, body: unknown, requests: Requests): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(requests.namespace),
    requests.ctx,
  )

interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/** REQ-307's frame reader: frames one at a time, so a case can act mid-turn. */
function frameReader(response: Response): {
  next: () => Promise<Frame | null>
  drain: () => Promise<Frame[]>
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
  return { next, drain }
}

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  live: boolean
  interrupted?: { text: string; at: string; recorded: boolean }
}

/**
 * The junction's bytes, read from the object — through the REAL binding, not
 * the wrapped one. This is the observer, and an observer that could be refused
 * would be measuring itself.
 */
async function durableBytes(sessionId: string): Promise<string> {
  const ns = objects()
  const slice = await ns.get(ns.idFromName(sessionId)).since(0, 0)
  return new TextDecoder().decode(new Uint8Array(slice.bytes))
}

/**
 * The junction's bytes once `needle` is among them — the write-behind window,
 * waited out rather than assumed away (REQ-307's reasoning, unchanged): the
 * port is synchronous, so a durable write cannot be awaited inside `append` and
 * what the design buys is "durable within a round trip" rather than "durable
 * before append returns".
 */
async function durableOnce(sessionId: string, needle: string): Promise<string> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const text = await durableBytes(sessionId)
    if (text.includes(needle)) return text
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error(`${needle} never reached the junction for ${sessionId}`)
}

/** REQ-307's lease ageing: the state a restart leaves 30 seconds later, without the wait. */
async function ageTheLease(sessionId: string): Promise<void> {
  const ns = objects()
  const stub = ns.get(ns.idFromName(sessionId))
  const long = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  expect(long.length).toBe(24)
  await stub.replace((await durableBytes(sessionId)).replace(/("ts":")[^"]{24}(")/g, `$1${long}$2`))
}

/** The long-term transcript — a `chat_transcript` comment on the session's `chat` ticket. */
async function archived(sessionId: string): Promise<string> {
  const store: TicketStore = await ticketStoreFor(workerEnv(objects()), { businessId: TENANT })
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const chat = tickets.find((t) => (t.fields ?? {}).session_id === sessionId)
  if (!chat) return ''
  const { comments } = await store.comments({ uid: chat.uid })
  return comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')?.body ?? ''
}

/** The isolate going away: this host's per-isolate state is exactly what a cold start lacks. */
function isolateReplaced(): void {
  resetAiHost()
  resetChatHost()
}

describe('BUG-149 — the junction keeps writing past the first request', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    isolateReplaced()
    vi.restoreAllMocks()
  })

  it('test_UAT_FC_BUG-149_a_session_prepared_on_one_request_still_writes_on_the_next', async () => {
    // THE REPORTED DEFECT, stated as the acceptance states it: records reach the
    // object on requests N+1 and N+2, MEASURED BY READING THE OBJECT rather than
    // by the absence of an error. Before the fix the first turn below lands and
    // the second does not.
    const requests = requestScoped()
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('laterreq') })

    // Request 1 — open. The isolate's storage is built here, and this is the one
    // request the shipped Worker could write on.
    const opened = await post('/api/ai/session', { site }, requests)
    expect(opened.status).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    // Request 2 — a whole turn, on a stub that cannot be the one request 1 made.
    await requests.next()
    setModelClient(scriptedClient([says('The first answer.')]))
    await frameReader(await post('/api/ai/prompt', { sessionId, text: 'First question.' }, requests)).drain()
    const afterFirst = await durableOnce(sessionId, 'The first answer.')
    expect(afterFirst).toContain('First question.')

    // Request 3 — and again, because "it worked once more" is not the claim.
    await requests.next()
    setModelClient(scriptedClient([says('The second answer.')]))
    await frameReader(await post('/api/ai/prompt', { sessionId, text: 'Second question.' }, requests)).drain()
    const afterSecond = await durableOnce(sessionId, 'The second answer.')
    expect(afterSecond).toContain('Second question.')
    // AND THE STREAM IS ONE STREAM, not the second turn on its own: the mirror
    // and the object agree about everything before the cursor.
    expect(afterSecond).toContain('First question.')
    expect(afterSecond).toContain('The first answer.')
  })

  it('test_UAT_FC_BUG-149_an_ordinary_conversation_logs_no_cross_request_io_error', async () => {
    // THE DEV LOG, which is where this was visible for a day before anybody read
    // it: one `junction …: could not be prepared — Cannot perform I/O on behalf
    // of a different request` per prompt, from the second prompt onward.
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map((a) => String(a)).join(' '))
    })
    const requests = requestScoped()
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('noioerror') })
    const opened = await post('/api/ai/session', { site }, requests)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    for (const turn of ['One.', 'Two.', 'Three.']) {
      await requests.next()
      setModelClient(scriptedClient([says(`Answer to ${turn}`)]))
      await frameReader(await post('/api/ai/prompt', { sessionId, text: turn }, requests)).drain()
      await durableOnce(sessionId, `Answer to ${turn}`)
    }

    expect(errors.filter((line) => line.includes('Cannot perform I/O'))).toEqual([])
    // AND NOTHING ELSE WENT WRONG QUIETLY EITHER — no write was reported as
    // dropped, and the tier never announced itself RAM-only.
    expect(errors.filter((line) => line.includes('junction'))).toEqual([])
  })

  it('test_UAT_FC_BUG-149_a_turn_killed_on_a_later_request_is_still_recovered', async () => {
    // REQ-307'S WHOLE CLAIM, RE-ASSERTED ACROSS A REQUEST BOUNDARY. Its own suite
    // kills the isolate during the FIRST request a session ever sees, which is
    // the one case the shipped Worker handled — so the property it proved was
    // real and unreachable in production. The kill here is on request 2.
    const requests = requestScoped()
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('killedlater') })
    const opened = await post('/api/ai/session', { site }, requests)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    await requests.next()
    setModelClient(pacedClient('This much was said. ', 'never arrives'))
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Start on the margins.' }, requests),
    )
    await turn.next()
    // THE TURN'S RECORDS ARE DURABLE WHILE IT IS STILL OPEN, which is the whole
    // of REQ-307 and is exactly what a second request used to lose.
    const midTurn = await durableOnce(sessionId, 'This much was said.')
    expect(midTurn).toContain('Start on the margins.')
    expect(midTurn).not.toContain('turn_end')

    // THE ISOLATE IS GONE, so the request is abandoned rather than ended: its
    // `finally` never runs, there is no `turn_end`, no fold and no spend row.
    isolateReplaced()
    requests.abandon()
    await ageTheLease(sessionId)

    // THE ATTACH IS THE RECOVERY: a lapsed lease says the producer is gone, so
    // `_reconcile` closes the dangling turn `aborted` and folds it.
    const painted = (await (
      await post('/api/ai/session', { site }, requests)
    ).json()) as OpenedSession
    expect(painted.turns.map((t) => t.markdown)).toContain('Start on the margins.')
    expect(painted.turns.map((t) => t.markdown).join('\n')).toContain('This much was said.')

    const closed = await durableOnce(sessionId, '"kind":"turn_end"')
    expect(closed).toContain('"status":"aborted"')
    const transcript = await archived(sessionId)
    expect(transcript).toContain('Start on the margins.')
    expect(transcript).toContain('This much was said.')
  })

  it('test_UAT_FC_BUG-149_records_written_while_the_object_was_unreachable_reach_it_when_it_returns', async () => {
    // THE RECOVERY ARM. `adopted = false` used to mean "RAM-only, indefinitely,
    // and nobody is told"; it now means "RAM-only until the next request", and
    // the records written in between are pushed FORWARD to the object rather
    // than deleted by the adopt that finds it short.
    const requests = requestScoped()
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('backagain') })
    const opened = await post('/api/ai/session', { site }, requests)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    // Request 2, with the object down. The turn runs — a durability failure is
    // not a conversational one — and nothing reaches the object.
    await requests.next()
    requests.unreachable(true)
    setModelClient(scriptedClient([says('Said into the dark.')]))
    const frames = await frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Asked in the dark.' }, requests),
    ).drain()
    expect(frames.map((f) => f.content ?? '').join('')).toContain('Said into the dark.')
    expect(await durableBytes(sessionId)).not.toContain('Asked in the dark.')

    // Request 3, with the object back. The prepare that opens this turn is what
    // repairs the last one.
    await requests.next()
    requests.unreachable(false)
    setModelClient(scriptedClient([says('Said in the light.')]))
    await frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Asked in the light.' }, requests),
    ).drain()

    const recovered = await durableOnce(sessionId, 'Said in the light.')
    // THE TURN THAT WAS LOST IS IN THE OBJECT, in its place in the stream —
    // which is the assertion that the repair appended rather than adopted.
    expect(recovered).toContain('Asked in the dark.')
    expect(recovered).toContain('Said into the dark.')
    expect(recovered.indexOf('Asked in the dark.')).toBeLessThan(
      recovered.indexOf('Asked in the light.'),
    )
  })

  it('test_UAT_FC_BUG-149_an_unreachable_object_is_a_durability_failure_and_not_a_conversational_one', async () => {
    // THE DEGRADATION PATH, still non-fatal — and it is now the path taken only
    // when the object genuinely cannot be reached, rather than the path every
    // ordinary second request took.
    const requests = requestScoped()
    requests.unreachable(true)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('nevermind') })
    const opened = await post('/api/ai/session', { site }, requests)
    expect(opened.status).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    await requests.next()
    setModelClient(scriptedClient([says('Answered anyway.')]))
    const frames = await frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Ask anyway.' }, requests),
    ).drain()
    expect(frames.map((f) => f.content ?? '').join('')).toContain('Answered anyway.')

    // And the conversation replays, off the mirror, exactly as `memoryJunctions()`
    // would have — which is what this degrades TO rather than what it fails to.
    await requests.next()
    const painted = (await (
      await post('/api/ai/session', { site }, requests)
    ).json()) as OpenedSession
    expect(painted.turns.map((t) => t.markdown)).toContain('Ask anyway.')
  })
})
