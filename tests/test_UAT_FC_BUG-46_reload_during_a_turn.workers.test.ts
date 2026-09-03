import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { pacedClient, says, scriptedClient } from './support/scripted-model-client'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * BUG-46 — **a browser reload during a turn no longer destroys that turn**.
 *
 * WHAT WAS WRONG, and why it read as nothing being wrong. An operator reloaded
 * the builder while a reply was arriving. The turn vanished from the
 * conversation — but its tool calls had already committed, so the site edits
 * were in the store. Side effects durable, transcript not.
 *
 * Three facts composed, and the third was this repo's. The archive lags by a
 * whole open turn on purpose (`closedPrefix`, lagrange-framework BUG-19 D1);
 * the Worker's junction is RAM in one isolate; and the page-load handler read
 * the ARCHIVE. So the entire duration of every turn was a window in which a
 * reload lost the turn, on a perfectly healthy isolate. It stayed invisible
 * because the turn was on screen — it had streamed, over a channel that never
 * touched storage — so nothing looked wrong until someone refreshed.
 *
 * WHY THESE TESTS PACE THE MODEL. The bug lives strictly between `turn_start`
 * and `turn_end`. A double that answers in one go never produces that state, so
 * a suite built on the instant client could assert every fix here and pass just
 * as well against the unfixed code. `pacedClient` holds the model open so
 * "during a turn" is somewhere a test can stand.
 *
 * The one double is the Anthropic client, as everywhere else here. The session
 * manager, the junction, the archive, the D1 ticket store and the SSE framing
 * are all the real thing.
 */

const TENANT = 'bug46'

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

/**
 * An `ExecutionContext` that KEEPS what it is handed, so a test can await it.
 *
 * This is the apparatus for the `waitUntil` half. In production the runtime is
 * what holds the isolate open past the response; here the collected promises ARE
 * the extension, and awaiting them is the test standing in for the runtime. A
 * fix that never calls `waitUntil` collects nothing.
 *
 * WHAT A TEST CANNOT DO HERE, stated because it decides the shape of the
 * assertions below. The defect is that a Worker may be torn down the instant the
 * response ends, killing an unregistered drain mid-flight. NOTHING TEARS AN
 * ISOLATE DOWN UNDER VITEST: an un-awaited drain simply carries on and finishes,
 * so "the transcript ended up archived" is true either way here and proves
 * nothing about production. A test asserting only that passes against the bug —
 * which this one did, until it was written the way it is now.
 *
 * So the property is split, and both halves are checked:
 *
 *   1. {@link held} — the route HANDED the runtime a promise. This is the half
 *      that is false on the unfixed code, where nothing threaded an
 *      `ExecutionContext` this far and `waitUntil` was called zero times.
 *   2. awaiting exactly those promises is SUFFICIENT for the turn to be durable,
 *      so nothing outside what was registered is load-bearing.
 *
 * Together those are the production guarantee, put as something observable in a
 * runtime that never evicts anything.
 */
function collectingCtx(): {
  ctx: ExecutionContext
  held: () => Promise<unknown>[]
  settled: () => Promise<unknown[]>
} {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      held.push(promise)
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, held: () => held, settled: () => Promise.all(held) }
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

/**
 * Read `data:` frames ONE AT A TIME, rather than draining the whole body.
 *
 * `await response.text()` cannot be used by any test here: it does not return
 * until the turn is over, and every claim below is about what is true while the
 * turn is still running. Pulling frames individually is what lets a test act
 * mid-turn — reload, reattach, or walk away.
 */
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

/** Everything the assistant said, concatenated, in one response's frames. */
const spoken = (frames: Frame[]): string =>
  frames
    .filter((f) => f.kind === 'text')
    .map((f) => f.content ?? '')
    .join('')

async function store(): Promise<TicketStore> {
  return ticketStoreFor(workerEnv(), { businessId: TENANT })
}

/** The archived session file for `sessionId` — the durable copy, or null. */
async function archivedTranscript(sessionId: string): Promise<string | null> {
  const { tickets } = await (await store()).query({ predicate: 'type=chat', limit: 'all' })
  const chat = tickets.find((t) => (t.fields ?? {}).session_id === sessionId)
  if (!chat) return null
  const { comments } = await (await store()).comments({ uid: chat.uid })
  return comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')?.body ?? null
}

async function seedSite(slug: string): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post('/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
}

/** Open a session for a fresh site and hand back both. */
async function openFor(prefix: string): Promise<{ slug: string; sessionId: string }> {
  const slug = nextSlug(prefix)
  await seedSite(slug)
  const opened = await post('/api/ai/session', { slug })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  return { slug, sessionId }
}

describe('BUG-46 — a reload during a turn keeps the turn', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-46_a_reload_mid_turn_still_shows_the_turn', async () => {
    // THE REPORTED FAILURE, reduced to its mechanism. The operator's reload is
    // a second `/api/ai/session` while the first turn is still open — the same
    // isolate, the same junction, exactly as a browser refresh produces.
    const { slug, sessionId } = await openFor('reload')
    const model = pacedClient('I have started editing. ', 'And now I am finished.')
    setModelClient(model)

    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Change the heading.' }))
    expect((await turn.next())?.content).toBe('I have started editing. ')

    // THE RELOAD. Nothing has closed the turn; the archive therefore does not
    // have it, and reading from the archive is what used to return a
    // conversation with the turn missing entirely.
    const reopened = await post('/api/ai/session', { slug })
    expect(reopened.status).toBe(200)
    const painted = (await reopened.json()) as {
      turns: { role: string; markdown: string }[]
      cursor: number
    }

    expect(painted.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(painted.turns[0].markdown).toBe('Change the heading.')
    // The half that had been said by the time the page loaded — and NOT the half
    // that had not, because it does not exist yet.
    expect(painted.turns[1].markdown).toBe('I have started editing. ')
    // The cursor is what makes the paint resumable; it is meaningless without it.
    expect(painted.cursor).toBeGreaterThan(0)

    // PROOF THAT THE ARCHIVE WOULD NOT HAVE ANSWERED THIS. Same instant, the
    // durable copy has nothing about this turn — which is correct behaviour for
    // the archive and was the wrong thing to render from.
    expect(await archivedTranscript(sessionId)).not.toContain('I have started editing.')

    model.release()
    expect(spoken(await turn.drain())).toBe('And now I am finished.')
  })

  it('test_UAT_FC_BUG-46_a_reattached_client_sees_the_rest_of_the_turn_exactly_once', async () => {
    // The fold is a still frame of something still moving. Painting it is right;
    // leaving the operator looking at a reply frozen mid-sentence is what sends
    // them back to reloading, which is how the turn was lost to begin with.
    const { slug, sessionId } = await openFor('rejoin')
    const model = pacedClient('The first half. ', 'The second half.')
    setModelClient(model)

    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Say two halves.' }))
    await turn.next()

    const painted = (await (await post('/api/ai/session', { slug })).json()) as {
      turns: { role: string; markdown: string }[]
      cursor: number
    }

    // THE REJOIN, from the cursor that transcript was folded at.
    const tail = frameReader(
      await post('/api/ai/reattach', { sessionId, cursor: painted.cursor }),
    )
    model.release()
    const tailed = await tail.drain()

    // NO GAP AND NO REPEAT. Painted plus tailed is the reply, once — which is
    // the property the cursor exists to buy, and the reason it travels with the
    // transcript rather than being fetched separately.
    expect(painted.turns[1].markdown + spoken(tailed)).toBe('The first half. The second half.')
    expect(spoken(tailed)).toBe('The second half.')
    expect(tailed.at(-1)?.kind).toBe('done')

    await turn.drain()
  })

  it('test_UAT_FC_BUG-46_a_cancelled_stream_still_archives_its_turn', async () => {
    // THE HALF THAT WOULD HAVE CAUGHT THE REPORTED INCIDENT. The turn's last act
    // is `turn_end` + a multi-round-trip drain to D1, and it starts after the
    // client has gone. Without `ctx.waitUntil` nothing holds the isolate open
    // for it, so the turn the operator watched arrive is never written down.
    const { sessionId } = await openFor('abort')
    const model = pacedClient('This much was said. ', 'This much was not.')
    setModelClient(model)

    const { ctx, held, settled } = collectingCtx()
    const turn = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Start talking.' }, ctx),
    )
    expect((await turn.next())?.content).toBe('This much was said. ')

    // THE ASSERTION THAT FAILS ON THE UNFIXED CODE. The route registered the
    // turn's completion with the runtime, so the isolate is under instruction to
    // stay alive for it. Before this ticket nothing threaded an
    // `ExecutionContext` into `streamTurn` and this count was zero — the comment
    // there said in as many words that `ctx.waitUntil` was not reachable.
    expect(held()).toHaveLength(1)

    // THE RELOAD, as the origin experiences it: the socket goes away mid-turn.
    await turn.cancel()
    // One more event, so the next `controller.enqueue` meets the cancelled
    // stream and throws — which is what runs the generator's `finally`.
    model.release()

    // Awaiting ONLY what was registered. Nothing else is awaited between here
    // and the assertions, so if the drain needed something outside the promise
    // handed to `waitUntil`, this would be reading a transcript that has not
    // been written yet.
    await settled()

    const archived = await archivedTranscript(sessionId)
    expect(archived).not.toBeNull()
    expect(archived).toContain('Start talking.')
    expect(archived).toContain('This much was said.')
  })

  it('test_UAT_FC_BUG-46_an_abandoned_turn_is_recorded_aborted_not_complete', async () => {
    // A turn cut short is RECORDED as cut short. The status rides the junction's
    // `turn_end` record rather than the archived session file — the file format
    // carries dialogue, not outcomes — so this reads it back through the
    // reattach route, which projects `turn_end` onto `done`.
    const { slug, sessionId } = await openFor('status')
    const model = pacedClient('Half a thought. ', 'The other half.')
    setModelClient(model)

    const { ctx, settled } = collectingCtx()
    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Begin.' }, ctx))
    await turn.next()

    const painted = (await (await post('/api/ai/session', { slug })).json()) as { cursor: number }
    await turn.cancel()
    model.release()
    await settled()

    const tailed = await frameReader(
      await post('/api/ai/reattach', { sessionId, cursor: painted.cursor }),
    ).drain()
    const done = tailed.at(-1)
    expect(done?.kind).toBe('done')
    expect(done?.meta?.status).toBe('aborted')
  })

  it('test_UAT_FC_BUG-46_reattach_refuses_a_request_with_no_cursor', async () => {
    // A MISSING CURSOR IS NOT ZERO. Defaulting it would replay the whole
    // conversation into a panel that has already painted it — duplication that
    // looks like the feature working.
    const { sessionId } = await openFor('nocursor')
    const missing = await post('/api/ai/reattach', { sessionId })
    expect(missing.status).toBe(400)
    expect(((await missing.json()) as { error: string }).error).toContain('cursor')

    const negative = await post('/api/ai/reattach', { sessionId, cursor: -1 })
    expect(negative.status).toBe(400)
  })

  it('test_UAT_FC_BUG-46_a_frozen_panel_still_renders_the_conversation', async () => {
    // The transcript read and the backend are INDEPENDENT failures, and reading
    // the junction must not have quietly coupled them: `transcript` touches no
    // backend, which is why it still runs ahead of `attach`. A builder with no
    // key owes the operator both the history and the reason it is frozen.
    const { slug, sessionId } = await openFor('frozen')
    setModelClient(scriptedClient([says('Noted, and written down.')]))
    const done = frameReader(
      await post('/api/ai/prompt', { sessionId, text: 'Remember this.' }),
    )
    expect((await done.drain()).at(-1)?.kind).toBe('done')

    // A COLD ISOLATE WITH NO KEY. Dropping the host state is the new-isolate
    // case, so there is no junction and `transcript` seeds one from the archive
    // — the path that makes DOC-21 §11's "one source with no splice" hold.
    resetAiHost()
    resetChatHost()
    const frozen = await worker.fetch(
      new Request('https://app.example/api/ai/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
      }),
      workerEnv({ ANTHROPIC_API_KEY: undefined }),
    )
    const session = (await frozen.json()) as {
      sessionId: string
      turns: { role: string; markdown: string }[]
      ready: boolean
      cursor: number
    }

    // THE WHOLE CONVERSATION, from a host that cannot take a turn. This is the
    // claim BUG-46 could have broken and the reason the transcript read stays
    // ahead of `attach`: seeding the junction from the archive reaches the
    // ticket store and nothing else, so no part of it depends on a backend
    // existing.
    expect(session.sessionId).toBe(sessionId)
    expect(session.turns.map((t) => t.markdown)).toEqual([
      'Remember this.',
      'Noted, and written down.',
    ])
    expect(session.cursor).toBeGreaterThan(0)

    // `ready` IS NOT ASSERTED HERE, and the omission is deliberate rather than
    // an oversight. In this runtime it comes back TRUE without a key: the
    // backend factory is lazy, so nothing between `openSession` and `attach`
    // ever tries to build one, and the failure surfaces on the first turn
    // instead. The Node host reports it at open time because its key comes from
    // `process.env` while the manager is being constructed.
    //
    // That divergence predates this ticket and is untouched by it — REQ-146's
    // own `a_missing_key_costs_a_turn_and_not_the_conversation` covers this
    // scenario and asserts exactly the same subset, for the same reason. Pinning
    // `ready: false` here would be asserting the Node host's behaviour against
    // the Worker and would fail on code nobody in this ticket changed.
  })
})
