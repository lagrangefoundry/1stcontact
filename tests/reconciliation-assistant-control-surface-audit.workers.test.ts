import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import {
  calls,
  modelSaw,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type WireEvent,
} from './support/scripted-model-client'

/**
 * **AC-1411 — the record of every call outlives the host that wrote it.**
 *
 * The companion file `reconciliation-assistant-control-surface.test.ts` carries
 * AC-1071…AC-1082 and AC-1142 against the host that runs on the operator's
 * machine, where the audit sink appends to a file and durability is the
 * filesystem's problem. AC-1411 is the criterion that cannot be established
 * there: in a Worker the isolate can be torn down the moment a response
 * completes, so "the trail survives" is a claim about R2 and about WHEN the
 * write happens, and both are only true or false inside workerd.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion below runs INSIDE workerd, through
 * the Worker's own `fetch`, against a real D1 database and a real R2 bucket. The
 * session manager, the role assembly, the tool loop, the tool handlers, the
 * `edit.ts` writes, the SSE framing and the audit trail are all the real thing,
 * and the trail is read back from the bucket rather than from any buffer.
 *
 * TWO DOUBLES, both at an external boundary and both stated:
 *
 *   - the Anthropic client, which is the network and is the seam the AI
 *     library's own backend is written to have injected. It speaks the STREAMING
 *     wire protocol the backend really consumes, via the shared transcription in
 *     `support/scripted-model-client` (BUG-39);
 *   - in the last case only, R2 itself, made to refuse writes under the `audit/`
 *     prefix. There is no other way to observe what a turn does when its durable
 *     write fails, and the criterion's closing sentence is exactly about that.
 *     Nothing internal is faked in either case.
 *
 * WHY THE `finally` IS THE SUBJECT. `router.ts` flushes the audit in a `finally`
 * INSIDE the stream, and argues in a comment that the placement "is the whole of
 * AC3 and is not incidental". The third and fourth cases below are that argument
 * made executable: a turn that dies part-way still leaves its records, and a
 * flush that fails does not take the operator's answer with it.
 */

const TENANT = 'ac1411'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (path: string, init?: RequestInit, overrides?: Partial<Env>): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    workerEnv(overrides),
  )

const post = (path: string, body: unknown, overrides?: Partial<Env>): Promise<Response> =>
  call(
    path,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    overrides,
  )

/** Read an SSE body back into the events the chat panel would see. */
async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

const textOf = (events: { kind: string; content?: string }[]): string =>
  events
    .filter((e) => e.kind === 'text')
    .map((e) => e.content ?? '')
    .join('')

/** One audit record, as it comes back OUT of R2 — the shape the trail is read in. */
interface StoredRecord {
  surface: string
  operation: string
  tool: string
  effect: string
  params: Record<string, unknown>
  policy: { decision: string; rule: string | null }
  outcome: { ok: boolean; error: string | null; resultBytes: number }
  session: string
  timestamp: string
}

/**
 * The session's whole trail, read from durable storage.
 *
 * One object per record is the write shape (`flushAudit`), so reading it back is
 * a prefix listing plus a `get` per key — no buffer, no host, nothing that was
 * alive when the records were made.
 */
async function trailFor(sessionId: string): Promise<StoredRecord[]> {
  const listed = await env.SITES.list({ prefix: `audit/${TENANT}/${sessionId}/` })
  const records: StoredRecord[] = []
  for (const object of listed.objects) {
    const body = await env.SITES.get(object.key)
    records.push(JSON.parse(await body!.text()) as StoredRecord)
  }
  return records
}

/**
 * The bucket, with writes under `audit/` refused and everything else real.
 *
 * Scoped to the prefix ON PURPOSE. A bucket that refused every write would make
 * the turn itself fail — the transcript archive writes under `chat/` and the
 * store writes under `draft/` — and the case would then pass while proving
 * nothing about the audit. The only failure injected is the one the criterion
 * names: "a failure to write the record".
 */
function auditWritesRefused(bucket: R2Bucket): R2Bucket {
  return new Proxy(bucket as object, {
    get(target, prop) {
      const value = Reflect.get(target, prop) as unknown
      if (prop === 'put') {
        return async (key: unknown, ...rest: unknown[]) => {
          if (typeof key === 'string' && key.startsWith('audit/')) {
            throw new Error('R2 refused the write: the audit prefix is unavailable.')
          }
          return (value as (...args: unknown[]) => unknown).apply(target, [key, ...rest])
        }
      }
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(target)
        : value
    },
  }) as unknown as R2Bucket
}

/**
 * A model answer that DIES part-way through the stream.
 *
 * The first event goes out, then the connection to the provider throws — which
 * is what an abandoned turn looks like from the host's side, and the only
 * failure a double at this boundary can honestly stage. The tool call that ran
 * on the previous request has already been recorded into the buffer by then, so
 * whether it reaches R2 is decided entirely by where the flush sits.
 */
const diesMidStream =
  (message: string): ModelStep =>
  () =>
    (async function* (): AsyncGenerator<WireEvent> {
      yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
      throw new Error(message)
    })()

/**
 * A double that answers PER TURN instead of from one shared script.
 *
 * The shared `scriptedClient` advances a single index, so two turns running at
 * the same time consume each other's steps and the case would be asserting
 * against whichever interleaving it happened to get. This one reads the request
 * it was handed — the page name out of the prompt, and whether the tool has
 * already run out of the transcript — so each turn gets its own answer no matter
 * what order the two arrive in. It is the same transcription of the wire
 * protocol either way: the events come from `calls` and `says`.
 */
function perTurnClient(): {
  seen: ModelRequest[]
  messages: { create: (req: ModelRequest) => Promise<AsyncGenerator<WireEvent>> }
} {
  const seen: ModelRequest[] = []
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        // A marker the priming cannot contain, so the page name is read from the
        // operator's own words and not from the first "page" in the role text.
        const page = /add-page::([a-z0-9-]+)/.exec(modelSaw(req))?.[1] ?? 'unknown'
        const alreadyCalled = JSON.stringify(req.messages).includes('add_page')
        const events = (
          alreadyCalled
            ? says(`Done — I added a page called "${page}".`)
            : calls('add_page', { page, title: `Page ${page}` })
        )(req) as WireEvent[]
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  }
}

/**
 * A site made only of L1, imported through the Worker's own route.
 *
 * Built from `siteSeed` — the scaffolder's own starter — rather than a fixture
 * written here: a hand-rolled definition would have to restate the schema, and
 * one that drifted from the validator would fail as "this draft does not
 * validate", which is a test asserting its own mistake.
 */
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

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('AC-1411 — the trail survives the host, the load and the failure', () => {
  it('test_UAT_AC1411_the_trail_survives_the_host_that_wrote_it', async () => {
    // Run a turn that CHANGES the site, then discard everything the host held
    // and read the trail back out of durable storage. What comes back has to be
    // the record in full — which operation, against what, allowed by whom and
    // with what outcome — because a record missing any of those is a hint rather
    // than evidence.
    const slug = nextSlug('survives')
    await seedSite(slug)
    const opened = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
    }

    setModelClient(
      scriptedClient([
        calls('add_page', { page: 'contact', title: 'Contact' }),
        says('Done — I added a page called "Contact".'),
      ]),
    )
    const turn = await post('/api/ai/prompt', {
      sessionId: opened.sessionId,
      text: 'Please add a contact page.',
    })
    expect(turn.status).toBe(200)
    const events = await frames(turn)
    expect(events.at(-1)?.kind).toBe('done')

    // THE RESTART. Every cache the host keeps goes, and the host with it — so
    // nothing that answers from here on can be answering from memory.
    resetAiHost()
    resetChatHost()
    setModelClient(null)

    const trail = await trailFor(opened.sessionId)
    const write = trail.find((record) => record.operation === 'add_page')
    expect(write, JSON.stringify(trail)).toBeDefined()
    expect(write!.surface).toBe('l1')
    expect(write!.effect).toBe('write')
    expect(write!.params.page).toBe('contact')
    expect(write!.policy.decision).toBe('allow')
    expect(write!.outcome.ok).toBe(true)
    expect(write!.session).toBe(opened.sessionId)
  })

  it('test_UAT_AC1411_two_turns_at_once_lose_none_of_each_others_records', async () => {
    // Two turns in flight together, each changing a different site, both
    // recorded. The count afterwards is the SUM — a fold, or a read-modify-write
    // of one shared object, would show fewer, and an audit that drops records
    // under load reads as evidence while being wrong.
    //
    // The delta is measured rather than the absolute count, so this stays a
    // statement about the two turns even if opening a session ever starts
    // recording something of its own.
    const alpha = nextSlug('concurrent-a')
    const beta = nextSlug('concurrent-b')
    await seedSite(alpha)
    await seedSite(beta)

    const first = (await (await post('/api/ai/session', { slug: alpha })).json()) as {
      sessionId: string
    }
    const second = (await (await post('/api/ai/session', { slug: beta })).json()) as {
      sessionId: string
    }
    const before =
      (await trailFor(first.sessionId)).length + (await trailFor(second.sessionId)).length

    setModelClient(perTurnClient())
    // Both responses come back before either body is read, so the two turns are
    // genuinely in flight together rather than one after the other.
    const [one, two] = await Promise.all([
      post('/api/ai/prompt', { sessionId: first.sessionId, text: 'Please add-page::alpha now.' }),
      post('/api/ai/prompt', { sessionId: second.sessionId, text: 'Please add-page::beta now.' }),
    ])
    const [framesOne, framesTwo] = await Promise.all([frames(one), frames(two)])
    expect(framesOne.at(-1)?.kind).toBe('done')
    expect(framesTwo.at(-1)?.kind).toBe('done')

    const after = [...(await trailFor(first.sessionId)), ...(await trailFor(second.sessionId))]
    expect(after.length - before).toBe(2)
    // And every record from each is there, not just the right number of them.
    const pages = after
      .filter((record) => record.operation === 'add_page')
      .map((record) => String(record.params.page))
      .sort()
    expect(pages).toEqual(['alpha', 'beta'])
  })

  it('test_UAT_AC1411_a_turn_that_dies_part_way_still_records_what_it_managed_to_do', async () => {
    // The tool call runs, and THEN the turn falls over. The records for what it
    // already did have to be in storage anyway: an audit that only survives
    // success is not an audit, and it is the flush's placement — inside the
    // stream, in a `finally` — that decides this and nothing else.
    const slug = nextSlug('abandoned')
    await seedSite(slug)
    const opened = (await (await post('/api/ai/session', { slug })).json()) as {
      sessionId: string
    }

    setModelClient(
      scriptedClient([
        calls('add_page', { page: 'notes', title: 'Notes' }),
        diesMidStream('the model connection dropped mid-turn'),
      ]),
    )
    const turn = await post('/api/ai/prompt', {
      sessionId: opened.sessionId,
      text: 'Please add a notes page.',
    })

    // The failure is a FRAME, not a torn connection: the status line went out
    // with the first byte, so the panel has to be told in the channel it is
    // already reading.
    expect(turn.status).toBe(200)
    const events = await frames(turn)
    expect(textOf(events)).toContain('mid-turn')
    expect(events.at(-1)?.kind).toBe('done')

    // Nothing the host held survives, and the record of the call it managed to
    // make is in R2 regardless of how the turn ended.
    resetAiHost()
    resetChatHost()
    setModelClient(null)

    const trail = await trailFor(opened.sessionId)
    const write = trail.find((record) => record.operation === 'add_page')
    expect(write, JSON.stringify(trail)).toBeDefined()
    expect(write!.params.page).toBe('notes')
    expect(write!.policy.decision).toBe('allow')
  })

  it('test_UAT_AC1411_a_failed_durable_write_does_not_also_fail_the_turn', async () => {
    // The trade, stated in `router.ts` and asserted here: if the audit cannot be
    // written the records are lost either way, and taking the operator's answer
    // with them helps nobody. So the turn completes, in full, and the only thing
    // missing afterwards is the trail.
    const slug = nextSlug('lossy-audit')
    await seedSite(slug)

    // The refusing bucket has to be in place when the host is BUILT — the chat
    // host is one per isolate and holds the bindings it was made with — so the
    // session is opened through it too.
    resetChatHost()
    resetAiHost()
    const refusing: Partial<Env> = { SITES: auditWritesRefused(env.SITES) }

    const opened = (await (await post('/api/ai/session', { slug }, refusing)).json()) as {
      sessionId: string
    }

    setModelClient(
      scriptedClient([
        calls('add_page', { page: 'diary', title: 'Diary' }),
        says('Done — the diary page is there.'),
      ]),
    )
    const turn = await post(
      '/api/ai/prompt',
      { sessionId: opened.sessionId, text: 'Please add a diary page.' },
      refusing,
    )

    // The answer the operator already had, intact: the status, the assistant's
    // own words, and a turn that ended rather than one that stopped.
    expect(turn.status).toBe(200)
    const events = await frames(turn)
    expect(textOf(events)).toContain('Done — the diary page is there.')
    expect(events.at(-1)?.kind).toBe('done')

    // And the cost, which is the declared one and not a silent one: the records
    // for that turn are gone.
    const listed = await env.SITES.list({ prefix: `audit/${TENANT}/${opened.sessionId}/` })
    expect(listed.objects).toHaveLength(0)
  })
})
