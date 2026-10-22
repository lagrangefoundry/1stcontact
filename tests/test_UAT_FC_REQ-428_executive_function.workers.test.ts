import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { findPlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { configureDelegation } from '../tools/generate/src/cli/ai/delegation'
import type { PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import { calls, says, scriptedClient, sentText, type ModelRequest, type ScriptedClient, type WireEvent } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-428]] — **executive function, on the wire**: the host keeps count of the
 * replies that ask the client something and move nothing, and says so in the next
 * plan entry at three; and a request the client makes while a build runs is a
 * promise on the plan, which the build's hand-back does not leave hanging.
 *
 * THE REAL WORKER, as in REQ-416's and REQ-426's suites: router, session manager,
 * junction, D1 ticket store and SSE framing, with the Anthropic client the one
 * double. The client writes from INSIDE the worker's held model call, so the
 * talker here is a real talker round beside running work.
 */

const BUSINESS = 'req428-business'
const BAD_URL = 'http://127.0.0.1/admin'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: BUSINESS,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    SESSION_JUNCTION: (env as Record<string, unknown>).SESSION_JUNCTION,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const scope: Scope = { businessId: BUSINESS }
const deps: RouterDeps = {}

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    deps,
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

async function frames(response: Response): Promise<Frame[]> {
  const out: Frame[] = []
  for (const block of (await response.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req428') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

async function storedPlan(site: string): Promise<PlanFields> {
  return ((await findPlan(await ticketStoreFor(routerEnv() as never, scope), site))?.fields ?? {}) as unknown as PlanFields
}

const isTalker = (req: ModelRequest): boolean => sentText(req).includes('You are the talker.')

/** A client with the worker's script and the talker's, told apart per request. */
function forked(
  worker: Array<(req: ModelRequest) => WireEvent[]>,
  talker: Array<(req: ModelRequest) => WireEvent[]>,
  hold: (n: number) => Promise<void>,
): ScriptedClient & { worker: ModelRequest[]; talker: ModelRequest[] } {
  const seen: ModelRequest[] = []
  const workerSeen: ModelRequest[] = []
  const talkerSeen: ModelRequest[] = []
  return {
    seen,
    worker: workerSeen,
    talker: talkerSeen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        let events: WireEvent[]
        if (isTalker(req)) {
          talkerSeen.push(req)
          events = talker[Math.min(talkerSeen.length - 1, talker.length - 1)](req)
        } else {
          workerSeen.push(req)
          const n = workerSeen.length - 1
          await hold(n)
          events = worker[Math.min(n, worker.length - 1)](req)
        }
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  }
}

const until = async (ok: () => boolean, ms = 8_000): Promise<void> => {
  const end = Date.now() + ms
  while (!ok()) {
    if (Date.now() > end) throw new Error('timed out waiting')
    await new Promise((r) => setTimeout(r, 25))
  }
}

const WORK = [calls('capture_site', { url: BAD_URL }), calls('list_references', {}), says('Captured nothing.')]

const GEAR = 'You have asked 3 questions without moving anything — draft it with [?] gaps, put the facts on the panel as one batch, or propose.'
const CUE = 'your reply handed back while your client is still owed what they asked for during the build'

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-428 — executive function on the wire', () => {
  it('test_UAT_FC_REQ-428_three_question_only_replies_put_the_gear_change_line_in_the_next_notes_and_a_plan_write_clears_it', async () => {
    const { sessionId } = await site()
    const client = scriptedClient([
      says('For the top of your page: who hires you most often?'),
      says('And for the about section: how did you start welding?'),
      says('For the classes page: how many kids do you take?'),
      calls('set_task', { title: 'Draft the classes page' }),
      says("I've put the classes page on the plan, with the gaps marked [?]."),
      says('Thanks — that is all for now.'),
    ])
    setModelClient(client)
    for (const text of ['Hi!', 'Contractors mostly.', 'My dad taught me.', 'Ten.', 'Great.']) {
      await frames(await post('/api/ai/prompt', { sessionId, text }))
    }
    const [first, second, third, fourth, , sixth] = client.seen.map(sentText)
    // TWO, THEN THREE, QUESTIONS WITH NOTHING MOVED: the line arrives with the fourth turn.
    for (const before of [first, second, third]) expect(before).not.toContain('You have asked')
    expect(fourth).toContain(GEAR)
    // THE PLAN WRITE CLEARS IT.
    expect(sixth).not.toContain('You have asked')
  })

  it('test_UAT_FC_REQ-428_a_talker_records_a_mid_build_request_as_a_promise_and_the_hand_back_is_continued_naming_it', async () => {
    const { site: key, sessionId } = await site()
    const client = forked(
      [
        ...WORK,
        // The hand-back was continued: it starts the promised task and says so.
        calls('set_task', { task: 'buttons', status: 'doing' }),
        says('Starting on the bigger buttons now.'),
      ],
      [
        calls('set_task', { task: 'buttons', title: 'Bigger buttons', client_asked: 'Can you make the buttons bigger?' }),
        says('The buttons are next, straight after this.'),
      ],
      async (n) => {
        if (n !== 1) return
        await post('/api/ai/interpose', { sessionId, text: 'Can you make the buttons bigger?' })
        await until(() => client.talker.length >= 2)
        await new Promise((r) => setTimeout(r, 300))
      },
    )
    setModelClient(client)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: 'Have a look at this site for me.' }))

    // THE PROMISE IS ON THE PLAN, in the client's words, as the talker recorded it.
    // THE HAND-BACK WAS NOT THE END: the next worker request is the host's cue, naming it.
    const cued = client.worker.findIndex((req) => sentText(req).includes(CUE))
    expect(cued).toBe(WORK.length)
    expect(sentText(client.worker[cued])).toContain('- Bigger buttons')
    const task = ((await storedPlan(key)).tasks ?? []).find((t) => t.id === 'buttons')!
    expect(task).toMatchObject({ title: 'Bigger buttons', status: 'doing', asked: { quote: 'Can you make the buttons bigger?' } })
    // One request, one terminal event; and the cue is never the client's to read.
    expect(stream.filter((f) => f.kind === 'done')).toHaveLength(1)
    const said = stream.filter((f) => f.kind === 'text').map((f) => f.content).join('')
    expect(said).toContain('Starting on the bigger buttons now.')
    expect(said).not.toContain(CUE)
  })
})
