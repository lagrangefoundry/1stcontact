import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { BUSINESS_SESSION_SCOPE, resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type Ticket } from '../apps/control-app/src/tickets'
import { findPlan } from '../apps/control-app/src/plan'
import { INBOX_FIELD, STOPS_FIELD } from '../apps/control-app/src/session-inbox'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { TALKER_ALLOW, TALKER_REFUSAL, TALKER_WITHHOLD } from '../tools/generate/src/cli/ai/roles'
import type { PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'
import imageSurface from '../tools/generate/src/cli/ai/image-surface.json'
import librarySurface from '../tools/generate/src/cli/ai/library-surface.json'
import fidelitySurface from '../tools/generate/src/cli/ai/fidelity-surface.json'
import dnsSurface from '../tools/generate/src/cli/ai/dns-surface.json'
import settingsSurface from '../tools/generate/src/cli/ai/settings-surface.json'
import planSurface from '../tools/generate/src/cli/ai/plan-surface.json'
import ledgerSurface from '../tools/generate/src/cli/ai/ledger-surface.json'
import {
  calls,
  metered,
  says,
  sentText,
  systemText,
  type ModelRequest,
  type ScriptedClient,
  type WireEvent,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-416]] — **while the consultant works, a message the client writes is
 * answered by a talker beside the work** (lagrange-framework REQ-210), and the
 * talker's job is discovery.
 *
 * THE REAL WORKER: the router, the session manager, the junction (a Durable Object
 * here, as in production), the D1 ticket store and the SSE framing. The one double
 * is the Anthropic client, which tells the worker's requests from the talker's by
 * what the talker alone is told. The client's message is posted from INSIDE the
 * worker's held model call — the only place a test can stand that is genuinely
 * "while the work is running" — and the talker's reply is read off the WORK'S
 * stream, because that is where it has to arrive: the talker lives in the isolate
 * the work runs in.
 */

const BUSINESS = 'req416-business'
const BAD_URL = 'http://127.0.0.1/admin'
const WROTE = 'I started cutting hair in my mum’s kitchen when I was sixteen.'
const REPLY = 'That’s going into the copy on the next pass. What made you open the salon itself?'

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

async function site(): Promise<{ site: string; sessionId: string; talker: unknown }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req416') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const body = (await opened.json()) as { sessionId: string; talker?: unknown }
  return { site, sessionId: body.sessionId, talker: body.talker }
}

async function chatTicket(sessionId: string): Promise<Ticket | null> {
  const store = await ticketStoreFor(routerEnv() as never, scope)
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  return tickets.find((t) => (t.fields ?? {}).session_id === sessionId) ?? null
}

async function storedPlan(site: string): Promise<PlanFields> {
  return ((await findPlan(await ticketStoreFor(routerEnv() as never, scope), site))?.fields ?? {}) as unknown as PlanFields
}

/** The talker is told it is one, every exchange (the framework's reminder). */
const isTalker = (req: ModelRequest): boolean => sentText(req).includes('You are the talker.')

/** What the tool results in a request say. */
const toolResults = (req: ModelRequest): string =>
  JSON.stringify(req.messages[req.messages.length - 1]?.content ?? '')

/**
 * A client with two conversations: the worker's script and the talker's, told
 * apart per request. `hold` runs inside the worker's n-th request before it is
 * answered — the work is running for exactly as long as it takes.
 */
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

type Declared = { operations?: { op: string; effect?: string }[] }

/**
 * [[BUG-235]] — every tool a declaration says writes the site or a stage. A write
 * on a surface that holds the site writes the site. The plan's and the ledger's
 * writes are the talker's to make — the story board, the questions, the record —
 * except the two plan operations that reach past the plan: the stage, and the
 * look a page is given.
 */
function siteWriters(): Set<string> {
  const writes = (d: Declared): string[] => (d.operations ?? []).filter((o) => o.effect === 'write').map((o) => o.op)
  const site = [l1Surface, imageSurface, librarySurface, fidelitySurface, dnsSurface, settingsSurface] as Declared[]
  const planWrites = writes(planSurface as Declared)
  expect(writes(ledgerSurface as Declared).length).toBeGreaterThan(0)
  const pastThePlan = ['set_stage', 'choose_look']
  for (const op of pastThePlan) expect(planWrites).toContain(op)
  return new Set([...site.flatMap(writes), ...pastThePlan])
}

const until = async (ok: () => boolean, ms = 8_000): Promise<void> => {
  const end = Date.now() + ms
  while (!ok()) {
    if (Date.now() > end) throw new Error('timed out waiting')
    await new Promise((r) => setTimeout(r, 25))
  }
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-416 — a message written while the consultant works is answered by a talker', () => {
  it('test_UAT_FC_REQ-416_a_message_mid_build_is_answered_by_a_talker_on_the_builds_own_stream', async () => {
    const { site: key, sessionId, talker } = await site()
    // THE PANEL IS TOLD: its composer sends to the talker while the work runs.
    expect(talker).toBe(true)

    let messageId = ''
    const client = forked(
      [
        // The work: a slow step, which sets the status the talker reports from…
        calls('capture_site', { url: BAD_URL }),
        // …then a read while the client talks, and its result.
        calls('list_references', {}),
        says('Captured nothing — that address is private.'),
      ],
      [
        // The talker tries to move the stage: refused, and the stage stays put.
        calls('set_stage', { stage: 'first_draft', state: 'in_progress' }),
        // It pins what the client said, naming its part of the story.
        calls('pin_notes', {
          notes: [
            {
              text: 'Started cutting hair in my mum’s kitchen at sixteen',
              quote: WROTE,
              emoji: '💇',
              theme: 'Beginnings',
              area: 'beginning',
            },
          ],
        }),
        says(REPLY),
      ],
      async (n) => {
        if (n !== 1) return
        // THE WORK IS RUNNING: the client writes now, from its own request.
        const res = await post('/api/ai/interpose', { sessionId, text: WROTE })
        messageId = ((await res.json()) as { messageId: string }).messageId
        // Held until the talker has answered, so its exchange is there at the
        // worker's next call boundary.
        await until(() => client.talker.length >= 3)
        await new Promise((r) => setTimeout(r, 300))
      },
    )
    setModelClient(client)
    const before = await storedPlan(key)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: 'Have a look at this site for me.' }))

    // THE REPLY RIDES THE WORK'S STREAM, as talker frames naming the message.
    const talk = stream.filter((f) => f.kind === 'talker')
    expect(talk[0]?.meta).toMatchObject({ event: 'start', message_id: messageId })
    expect(talk.filter((f) => f.meta?.event === 'text').map((f) => f.content).join('')).toBe(REPLY)
    expect(talk.at(-1)?.meta).toMatchObject({ event: 'done', message_id: messageId })
    // …and never as the work's own text.
    const said = stream.filter((f) => f.kind === 'text').map((f) => f.content).join('')
    expect(said).not.toContain('next pass')
    expect(stream.at(-1)?.kind).toBe('done')

    // THE TALKER IS TOLD ITS JOB: discovery, the story areas still missing, and the
    // worker's status for "how is it going?".
    const first = sentText(client.talker[0])
    expect(first).toContain('Your standing job')
    expect(first).toContain('Still missing from the story board: how it started; the craft or signature thing')
    expect(first).toContain('next pass')
    expect(first).toContain('The consultant is capturing')

    // A STAGE MOVE IS REFUSED in the client's terms, and the stage did not move.
    expect(toolResults(client.talker[1])).toContain(TALKER_REFUSAL)
    const after = await storedPlan(key)
    const firstDraft = (fields: PlanFields) => (fields.stages ?? []).find((s) => s.id === 'first_draft')?.state
    expect(firstDraft(after)).toBe(firstDraft(before) ?? 'not_started')
    expect(firstDraft(after)).not.toBe('in_progress')
    // A STORY-BOARD NOTE IS NOT: pinned, with its area.
    expect(toolResults(client.talker[2])).not.toContain(TALKER_REFUSAL)
    const notes = after.board?.notes ?? []
    expect(notes).toEqual([expect.objectContaining({ quote: WROTE, area: 'beginning', by: 'consultant' })])

    // THE WORKER IS TOLD AT ITS NEXT CALL what was said, as handled.
    const told = sentText(client.worker[2])
    expect(told).toContain('handled by the talker')
    expect(told).toContain(WROTE)

    // Nothing is left waiting, and the status the widget shows is the consultant's.
    expect(((await chatTicket(sessionId))?.fields ?? {})[INBOX_FIELD] ?? '').toBe('')
    const status = stream.filter((f) => f.kind === 'progress' && f.meta?.source === 'model')
    expect(status.map((f) => f.content)).toContain(`The consultant is capturing ${BAD_URL}`)
  })

  it('test_UAT_FC_REQ-416_a_talker_rounds_requests_are_metered_on_a_spend_row_of_their_own', async () => {
    const { sessionId } = await site()
    const client = forked(
      [
        metered({ input_tokens: 1000, output_tokens: 10 }, calls('capture_site', { url: BAD_URL })),
        metered({ input_tokens: 1100, output_tokens: 20 }, says('Captured nothing.')),
      ],
      [
        metered({ input_tokens: 300, output_tokens: 7 }, calls('read_plan', {})),
        metered({ input_tokens: 400, output_tokens: 9 }, says(REPLY)),
      ],
      async (n) => {
        if (n !== 1) return
        await post('/api/ai/interpose', { sessionId, text: WROTE })
        await until(() => client.talker.length >= 2)
        await new Promise((r) => setTimeout(r, 300))
      },
    )
    setModelClient(client)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: 'Have a look.' }))
    const talkerTurn = String(stream.find((f) => f.kind === 'talker')?.meta?.turn_id ?? '')
    expect(talkerTurn).not.toBe('')

    const { results } = await env.DB.prepare('SELECT * FROM turn_spend WHERE session_id = ? ORDER BY started_at, rowid')
      .bind(sessionId)
      .all<{ turn_id: string; role: string; outcome: string; requests: number; input_tokens: number; output_tokens: number }>()
    const rows = results ?? []
    // THE TALKER'S OWN ROW: its two requests and nothing of the worker's.
    const talked = rows.find((r) => r.turn_id === talkerTurn)
    expect(talked).toMatchObject({ role: 'consultant', outcome: 'complete', requests: 2, input_tokens: 700, output_tokens: 16 })
    // AND THE WORKER'S, unchanged by it: every request of the client message is
    // on exactly one row.
    const worked = rows.filter((r) => r.turn_id !== talkerTurn)
    expect(worked).toHaveLength(1)
    expect(worked[0]).toMatchObject({ requests: 2, input_tokens: 2100, output_tokens: 30 })
  })

  it('test_UAT_FC_REQ-416_every_tool_that_changes_the_draft_or_the_stage_is_withheld_from_the_talker', async () => {
    // EVERY TOOL THE CONSULTANT IS GRANTED IS CLASSIFIED, with its own writes off
    // (the shipped setting) and on — so a new tool cannot reach the talker by default.
    const withheld = new Set(TALKER_WITHHOLD)
    const allowed = new Set(TALKER_ALLOW)
    expect([...withheld].filter((t) => allowed.has(t))).toEqual([])
    for (const setting of [{ ...delegationDocument, enabled: true }, { ...delegationDocument, enabled: true, primary_writes: true }]) {
      configureDelegation(setting)
      resetAiHost()
      resetChatHost()
      const { sessionId } = await site()
      const client = forked([says('Hello.')], [says('Hello.')], async () => {})
      setModelClient(client)
      await frames(await post('/api/ai/prompt', { sessionId, text: 'Hi.' }))
      const granted = client.worker[0].tools.map((t) => t.name)
      expect(granted.length).toBeGreaterThan(20)
      expect(granted.filter((t) => !withheld.has(t) && !allowed.has(t))).toEqual([])
      // [[BUG-235]] — WHAT WRITES THE SITE OR A STAGE IS WITHHELD, read off each
      // granted tool's declared effect rather than a list kept beside it: a new
      // site-writing tool put on the allow list fails here.
      const mustWithhold = siteWriters()
      const leaked = granted.filter((t) => mustWithhold.has(t) && !withheld.has(t))
      expect(leaked).toEqual([])
      expect(granted.filter((t) => mustWithhold.has(t))).toContain('set_stage')
      // Delegate is the framework's, declared upstream: it is the build itself.
      expect(withheld.has('Delegate')).toBe(true)
      expect(granted).toContain('pin_notes')
      expect(granted).toContain('set_stage')
    }
  })

  it('test_UAT_FC_REQ-416_stop_building_stops_the_work_from_any_request', async () => {
    const { sessionId } = await site()
    let stopped: Response | null = null
    const client = forked(
      [calls('capture_site', { url: BAD_URL }), calls('list_references', {}), says('Should not be reached.')],
      [says('Hello.')],
      async (n) => {
        if (n !== 1) return
        // THE CLIENT PRESSES STOP BUILDING, from its own request.
        stopped = await post('/api/ai/stop', { sessionId })
        // Held long enough for the work's isolate to look.
        await new Promise((r) => setTimeout(r, 2_600))
      },
    )
    setModelClient(client)
    const stream = await frames(await post('/api/ai/prompt', { sessionId, text: 'Have a look.' }))
    expect(stopped!.status).toBe(200)
    expect(await stopped!.json()).toEqual({ stopping: true })
    // THE WORK STOPPED at its next boundary: no further call was made.
    expect(client.worker).toHaveLength(2)
    expect(stream.at(-1)).toMatchObject({ kind: 'done' })
    expect(String(stream.at(-1)?.meta?.status)).not.toBe('complete')
    // The request was taken, not left to stop the next turn.
    expect(((await chatTicket(sessionId))?.fields ?? {})[STOPS_FIELD] ?? '').toBe('')
  })

  it('test_UAT_FC_REQ-416_the_settings_assistant_has_no_talker', async () => {
    await seedTenantSite(BUSINESS, { slug: nextSlug('req416settings') })
    const opened = await post('/api/ai/session', { scope: BUSINESS_SESSION_SCOPE })
    expect(opened.status).toBe(200)
    const body = (await opened.json()) as { talker?: unknown; ready?: boolean }
    expect(body.talker).toBeUndefined()
  })
})

describe('REQ-416 — the consultant is primed to build sooner and discover while building', () => {
  it('test_UAT_FC_REQ-416_the_priming_carries_the_method_the_hand_over_question_and_the_expectations', async () => {
    const { sessionId } = await site()
    const client = forked([says('Hello.')], [says('Hello.')], async () => {})
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Hi.' }))
    const priming = systemText(client.worker[0])
    // The framework's fork explanation, for a role with a talker setting.
    expect(priming).toContain('the talker')
    // Build sooner, story later.
    expect(priming).toContain('## Build sooner, story later')
    expect(priming).toContain('start the first draft')
    expect(priming).toContain('Structure and look come')
    // The hand-over ends with a story question.
    expect(priming).toContain('While I build, tell me how the salon started.')
    // New story goes into the next pass, and the result names what was gathered.
    expect(priming).toContain('New story goes')
    expect(priming).toContain('into the next pass')
    expect(priming).toContain('name')
    // Expectations, set and reinforced at every hand-over.
    expect(priming).toContain('## Where things are')
    expect(priming).toContain('what they can change now and what waits for the')
    // Not a talker round: no talker reminder for the worker.
    expect(sentText(client.worker[0])).not.toContain('Your standing job')
  })
})
