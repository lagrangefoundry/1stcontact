import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { findPlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { configureDelegation } from '../tools/generate/src/cli/ai/delegation'
import { TALKER_REFUSAL } from '../tools/generate/src/cli/ai/roles'
import type { PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import { calls, says, sentText, type ModelRequest, type ScriptedClient, type WireEvent } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-426]] — **the talker is a conversation strategist**: its talk moves the
 * site forward. Every question says what it is for; a section is drafted with its
 * gaps marked rather than asked one fact at a time; short facts go to the panel as
 * one batch; after two or three questions on a topic it changes gear; and it never
 * asks again what is already asked. Its per-exchange notes are the agenda — the
 * open decisions, most valuable first, with what each still needs, what is due,
 * and the questions already on the panel — not REQ-416's story areas.
 *
 * THE REAL WORKER, as in REQ-416's suite: router, session manager, junction, D1
 * ticket store and SSE framing, with the Anthropic client the one double. The
 * client writes from INSIDE the worker's held model call, so every talker request
 * here is a real talker round beside running work.
 */

const BUSINESS = 'req426-business'
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
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req426') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

async function storedPlan(site: string): Promise<PlanFields> {
  return ((await findPlan(await ticketStoreFor(routerEnv() as never, scope), site))?.fields ?? {}) as unknown as PlanFields
}

const isTalker = (req: ModelRequest): boolean => sentText(req).includes('You are the talker.')

/** What the tool results in a request say. */
const toolResults = (req: ModelRequest): string => JSON.stringify(req.messages[req.messages.length - 1]?.content ?? '')

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

/** The worker: a slow step the client talks beside, then its reply. */
const WORK = [calls('capture_site', { url: BAD_URL }), calls('list_references', {}), says('Captured nothing.')]

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-426 — the talker moves the site forward', () => {
  it('test_UAT_FC_REQ-426_the_talker_is_told_the_strategist_rules_and_the_open_decisions_with_what_each_needs', async () => {
    const { sessionId } = await site()
    const client = forked(WORK, [says('For the top of your page: who hires you most often?')], async (n) => {
      if (n !== 1) return
      await post('/api/ai/interpose', { sessionId, text: 'I run Saturday classes for kids too.' })
      await until(() => client.talker.length >= 1)
      await new Promise((r) => setTimeout(r, 300))
    })
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Have a look at this site for me.' }))

    const first = sentText(client.talker[0])
    // THE RULES: purpose-stated questions, draft with gaps, facts to the panel in one
    // batch, enough is enough, one warm follow-up, no repeats.
    expect(first).toContain('Use the time to move the site forward')
    expect(first).toContain('Every question says what it is for')
    expect(first).toContain('If you cannot name where the answer goes (a section, a page, a decision), do not ask it.')
    expect(first).toContain('the gaps marked [?]')
    expect(first).toContain('on the panel as one batch with set_ask')
    expect(first).toContain('After two or three questions on one topic')
    expect(first).toContain('one warm follow-up, then back to the decision')
    expect(first).toContain('a question already asked is pointed to, never asked again')
    // THE AGENDA: open decisions, most valuable first, each with what it needs —
    // the core story before the purpose questions, and nothing the looks settle.
    const open = first.slice(first.indexOf('Open decisions, most valuable first:'))
    expect(open).toContain('Core story: what the visitor should take away (needs talking it through)')
    expect(open).toContain("The site's job right now (needs a straight answer)")
    expect(open.indexOf('Core story')).toBeLessThan(open.indexOf("The site's job right now"))
    expect(open.split('\n')[0]).not.toContain('Visual concept')
    // …and what is due: the story board has nothing yet.
    expect(first).toContain('Due: nothing is pinned yet')
    // REQ-416's story-areas line is gone.
    expect(first).not.toContain('Still missing from the story board')
  })

  it('test_UAT_FC_REQ-426_a_talker_filling_a_section_puts_the_unknown_facts_on_the_panel_and_replies_with_a_draft', async () => {
    const { site: key, sessionId } = await site()
    const FACTS = [
      ['class_price', 'Class price — …', 'currency'],
      ['class_ages', 'Ages for the Saturday class — …', 'text'],
      ['class_size', 'Kids per class — …', 'number'],
      ['class_time', 'Saturday class times — …', 'text'],
      ['class_bring', 'What kids should bring — …', 'text'],
    ] as const
    const DRAFT =
      "For the classes page I'd cover what the class is, ages, price, what the kids make, safety and how to sign up. " +
      "Here's a first version: Saturday welding for kids aged [?], [?] a class, up to [?] kids, from [?]. " +
      "I've put the short facts on the panel above as one batch."
    let second = ''
    const client = forked(
      WORK,
      [
        ...FACTS.map(([ask, prompt, input]) => calls('set_ask', { ask, prompt, why: 'For the classes page.', input })),
        says(DRAFT),
        says('Those five are on the panel above — whenever suits you. Meanwhile, for the top of your page: who hires you most?'),
      ],
      async (n) => {
        if (n !== 1) return
        await post('/api/ai/interpose', { sessionId, text: 'Can you add a page for the kids classes?' })
        await until(() => client.talker.length >= FACTS.length + 1)
        await new Promise((r) => setTimeout(r, 300))
        await post('/api/ai/interpose', { sessionId, text: 'What else do you need for it?' })
        await until(() => client.talker.length >= FACTS.length + 2)
        second = sentText(client.talker[FACTS.length + 1])
        await new Promise((r) => setTimeout(r, 300))
      },
    )
    setModelClient(client)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: 'Build it.' }))

    // ALL FIVE FACTS ARE ON THE PANEL, none refused to the talker.
    for (const req of client.talker.slice(1, FACTS.length + 1)) expect(toolResults(req)).not.toContain(TALKER_REFUSAL)
    const asks = (await storedPlan(key)).asks ?? []
    expect(asks.filter((a) => a.status === 'open').map((a) => a.id)).toEqual(expect.arrayContaining(FACTS.map(([id]) => id)))
    // THE REPLY IS A DRAFT WITH GAPS, not five chat questions.
    const said = stream
      .filter((f) => f.kind === 'talker' && f.meta?.event === 'text')
      .map((f) => f.content)
      .join('')
    expect(said).toContain('Here\'s a first version: Saturday welding for kids aged [?]')
    // NEXT EXCHANGE, THE TALKER IS TOLD WHAT IS ALREADY ASKED — to point to, never
    // to ask again — and the open decisions it can move on to.
    expect(second).toContain('Already on the panel, waiting for them — point to these, never ask them again:')
    for (const [, prompt] of FACTS) expect(second).toContain(JSON.stringify(prompt))
    expect(second).toContain('Open decisions, most valuable first: Core story')
  })
})
