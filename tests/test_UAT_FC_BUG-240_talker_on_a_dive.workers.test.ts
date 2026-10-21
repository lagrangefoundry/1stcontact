import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { calls, says, sentText, systemText, type ModelRequest, type ModelStep, type ScriptedClient, type WireEvent } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-240]] — **a consultant round that goes to work without replying gets a
 * talker on the same message** (lagrange-framework REQ-215's host cue), so the
 * conversational part of a mixed message is answered within seconds; and the
 * worker is primed to answer first and not to repeat what the talker said.
 *
 * THE REAL WORKER, as in REQ-416's suite: the router, the session manager, the
 * junction (a Durable Object), the D1 ticket store and the SSE framing. The one
 * double is the Anthropic client, which tells the worker's requests from the
 * talker's by what the talker alone is told. The work's second request is held
 * until the talker has answered — the work is running for exactly that long.
 */

const BUSINESS = 'bug240-business'
const ASKED = 'The movement is good, we could have a little more — what’s next?'
const ANSWER = 'Next is colours and fonts. While that builds: what do clients say they love about the salon?'
const PASS = '[nothing to add]'
/** Words only the host's cue holds. */
const CUE_WORDS = 'has taken the building part of your client'

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
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug240') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const body = (await opened.json()) as { sessionId: string; talker?: unknown }
  expect(body.talker).toBe(true)
  return { site, sessionId: body.sessionId }
}

/** The conversation as a reload draws it. */
async function transcript(key: string): Promise<Array<{ role: string; markdown: string }>> {
  const opened = await post('/api/ai/session', { site: key })
  return ((await opened.json()) as { turns?: Array<{ role: string; markdown: string }> }).turns ?? []
}

/** Everything a request carries: the priming, the reminders and every message of the conversation. */
const everything = (req: ModelRequest): string => `${sentText(req)}\n${JSON.stringify(req.messages)}`

/** The talker is told it is one, every exchange (the framework's reminder). */
const isTalker = (req: ModelRequest): boolean => sentText(req).includes('You are the talker.')

/** Prose and then a tool call, in one response: a round that replies before it works. */
const saysThenCalls =
  (text: string, name: string, input: Record<string, unknown>): ModelStep =>
  (req) => [
    ...says(text)(req),
    ...calls(name, input)(req).map((e) => ({ ...e, index: 1 })),
  ]

/** The worker's script and the talker's, told apart per request; `hold` runs inside the worker's n-th. */
function forked(
  worker: ModelStep[],
  talker: ModelStep[],
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

const settle = (ms: number) => new Promise((r) => setTimeout(r, ms))

const STAGE = { stage: 'first_draft', state: 'in_progress' }

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-240 — a round that goes to work without replying gets a talker on the same message', () => {
  it('test_UAT_FC_BUG-240_a_round_whose_first_act_is_work_opens_one_cued_talker_that_answers_the_message', async () => {
    const { site: key, sessionId } = await site()
    const client = forked(
      [
        // THE DIVE: a work tool as the round's first act, nothing said.
        calls('set_stage', STAGE),
        // …and a second, still without a word: the same round, no second cue.
        calls('set_stage', STAGE),
        says('Movement added.'),
      ],
      [says(ANSWER)],
      async (n) => {
        if (n !== 1) return
        // Held until the talker has answered, so its exchange reaches the
        // worker's next call boundary.
        await until(() => client.talker.length >= 1)
        await settle(400)
      },
    )
    setModelClient(client)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: ASKED }))

    // ONE TALKER ROUND, CUED, whose reply rides the work's own stream.
    expect(client.talker).toHaveLength(1)
    const talk = stream.filter((f) => f.kind === 'talker')
    expect(talk[0]?.meta).toMatchObject({ event: 'start', cued: true })
    expect(talk[0]?.meta?.message_id).toBeUndefined()
    expect(talk.filter((f) => f.meta?.event === 'text').map((f) => f.content).join('')).toBe(ANSWER)
    expect(talk.at(-1)?.meta).toMatchObject({ event: 'done' })
    expect(talk.at(-1)?.meta?.passed).toBeUndefined()
    expect(stream.at(-1)?.kind).toBe('done')

    // THE TALKER SEES THE CLIENT'S MESSAGE and is cued to answer the rest of it.
    const told = everything(client.talker[0])
    expect(told).toContain(ASKED)
    expect(told).toContain(CUE_WORDS)
    expect(told).toContain('Answer anything else they asked')

    // THE CUE IS RECORDED NOWHERE: not in what the worker is told…
    for (const req of client.worker) expect(everything(req)).not.toContain(CUE_WORDS)
    // …which does carry the talker's reply, as handled, at its next call.
    expect(sentText(client.worker[2])).toContain('handled by the talker')
    expect(sentText(client.worker[2])).toContain(ANSWER)
    // …nor in the chat a reload draws, which keeps the client's message once.
    const turns = await transcript(key)
    const all = turns.map((t) => t.markdown).join('\n')
    expect(all).not.toContain(CUE_WORDS)
    expect(turns.filter((t) => t.role === 'user' && t.markdown.includes(ASKED))).toHaveLength(1)
    expect(all).toContain(ANSWER)
  })

  it('test_UAT_FC_BUG-240_a_round_that_replies_before_it_works_opens_no_talker', async () => {
    const { sessionId } = await site()
    const client = forked(
      [saysThenCalls('Next is colours and fonts. Adding a little more movement now.', 'set_stage', STAGE), says('Done.')],
      [says(ANSWER)],
      async (n) => {
        // The work runs long enough for the talker desk to have looked several times.
        if (n === 1) await settle(1_000)
      },
    )
    setModelClient(client)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: ASKED }))
    expect(client.talker).toHaveLength(0)
    expect(stream.filter((f) => f.kind === 'talker')).toEqual([])
  })

  it('test_UAT_FC_BUG-240_a_cued_talker_with_nothing_to_add_passes_and_nothing_is_shown', async () => {
    const { site: key, sessionId } = await site()
    const client = forked(
      [calls('set_stage', STAGE), says('Movement added.')],
      [says(PASS)],
      async (n) => {
        if (n !== 1) return
        await until(() => client.talker.length >= 1)
        await settle(400)
      },
    )
    setModelClient(client)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: 'Add a little more movement.' }))
    expect(client.talker).toHaveLength(1)
    const talk = stream.filter((f) => f.kind === 'talker')
    // THE ROUND PASSED: no text, and its end says so for the panel.
    expect(talk.filter((f) => f.meta?.event === 'text')).toEqual([])
    expect(talk.at(-1)?.meta).toMatchObject({ event: 'done', passed: true })
    // Nothing of it in the chat, and nothing of the cue.
    const all = (await transcript(key)).map((t) => t.markdown).join('\n')
    expect(all).not.toContain(PASS)
    expect(all).not.toContain(CUE_WORDS)
  })
})

describe('BUG-240 — the consultant answers first and does not repeat the talker', () => {
  it('test_UAT_FC_BUG-240_the_priming_carries_the_answer_first_and_no_repeat_rules', async () => {
    const { sessionId } = await site()
    const client = forked([says('Hello.')], [says('Hello.')], async () => {})
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Hi.' }))
    const priming = systemText(client.worker[0])
    expect(priming).toContain('## Answer before you build')
    expect(priming).toContain('answer the\nquestion in a line or two first, then start the work')
    expect(priming).toContain('do not\nsay again anything the talker already told them')
  })
})
