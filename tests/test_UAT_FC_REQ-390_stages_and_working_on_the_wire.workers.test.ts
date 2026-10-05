import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PLAN_PATH, resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { PLAN_TYPE } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { seedPlan, type ShownStage } from '../tools/generate/src/cli/ai/plan-core'
import groupChat from '../tools/generate/src/cli/ai/group-chat.json'
import { calls, says, scriptedClient, type ModelStep, type ScriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-390]] — **the origin half of the stage tracker and the working line.**
 *
 * Through the Worker's own `route` — `/api/ai/session`, `/api/ai/prompt`,
 * `/api/plan` — against a real D1, the real ticket store and the real session and
 * delegation machinery. The one double is the Anthropic client, which is the
 * network.
 *
 * What is proved here: a slow operation puts a `working` frame on the turn's
 * stream, in the consultant's configured name, right behind the line that
 * announces it; and a plan stored with the old `phase` reaches the panel as
 * stages.
 */

const BUSINESS = 'req390-business'
const WORKER_MODEL = backendsDocument.claude_builder.model
const ENABLED = { ...delegationDocument, enabled: true }
/** The consultant's display name — configuration, never a constant. */
const CONSULTANT = groupChat.names.consultant

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

const ask = (path: string, init: RequestInit = {}): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, init),
    routerEnv(),
    scope,
    deps,
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

const post = (path: string, body: unknown): Promise<Response> =>
  ask(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

async function frames(response: Response): Promise<Frame[]> {
  const out: Frame[] = []
  for (const block of (await response.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

const tickets = (): Promise<TicketStore> => ticketStoreFor(routerEnv() as never, scope)

async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req390') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

/** One double, two conversations, told apart by the model they are addressed to. */
function twoSided(caller: ModelStep[], builder: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] = req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

async function turn(sessionId: string, text: string, client: ScriptedClient): Promise<Frame[]> {
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  return frames(response)
}

const NOTE = 'Building your home page now — it takes about ten minutes.'
const BUILDS: ModelStep[] = [
  calls('set_l1', { page: 'home', path: '0.0', node: { kind: 'text', text: 'Built for the trades', axes: { fontSizePx: 56 } } }),
  calls('ReportResult', { summary: 'Built the home page.', changed: ['home'] }),
  says('Reported.'),
]
/** A capture the guard refuses at once: a private address. Slow tool, fast failure. */
const BAD_URL = 'http://127.0.0.1/admin'

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-390 — the working line is told what is under way', () => {
  it('test_UAT_FC_REQ-390_a_delegate_and_a_slow_tool_each_put_a_working_frame_behind_their_announcement', async () => {
    configureDelegation(ENABLED)
    const { sessionId } = await site()

    // A DELEGATE: the consultant's note, after its name, with no estimate of its
    // own — the note says how long in words.
    const built = await turn(
      sessionId,
      'Build my site.',
      twoSided([calls('Delegate', { role: BUILDER_ROLE, goal: 'Build the home page.', note: NOTE }), says('Built.')], BUILDS),
    )
    const working = built.filter((f) => f.kind === 'working')
    expect(working).toHaveLength(1)
    expect(working[0].content).toBe(`${CONSULTANT} is building your home page now — it takes about ten minutes`)
    expect(working[0].meta?.estimate).toBeUndefined()
    const announcedAt = built.findIndex((f) => f.kind === 'text' && f.content.includes(NOTE))
    const workingAt = built.indexOf(working[0])
    const handOffAt = built.findIndex((f) => f.kind === 'tool_activity' && f.meta?.name === 'Delegate')
    expect(workingAt).toBe(announcedAt + 1)
    expect(workingAt).toBeLessThan(handOffAt)

    // A SLOW TOOL: its own words and its estimate in the short form.
    const captured = await turn(sessionId, 'Look at this site.', scriptedClient([calls('capture_site', { url: BAD_URL }), says('That one is private.')]))
    const slow = captured.filter((f) => f.kind === 'working')
    expect(slow).toEqual([{ kind: 'working', content: `${CONSULTANT} is capturing ${BAD_URL}`, meta: { estimate: 'about 5 min' } }])
    // AND NOTHING FROM AN EARLIER TURN IS REPEATED: one frame per announcement.
    expect(captured.some((f) => f.kind === 'working' && f.content.includes('home page'))).toBe(false)
  })
})

describe('REQ-390 — the stages replace the phase', () => {
  it('test_UAT_FC_REQ-390_a_plan_stored_with_a_legacy_phase_reaches_the_panel_as_stages', async () => {
    const { site: key } = await seedTenantSite(BUSINESS, { slug: nextSlug('req390') })
    // A PLAN AS IT WAS STORED BEFORE STAGES: `phase` and no `stages`.
    const { stages: _stages, ...legacy } = seedPlan(key).fields
    const store = await tickets()
    await store.create({
      type: PLAN_TYPE,
      title: `Site plan: ${key}`,
      fields: { ...legacy, phase: 'revision' },
      body: seedPlan(key).body,
    })

    const response = await ask(`${PLAN_PATH}?site=${encodeURIComponent(key)}`)
    expect(response.status).toBe(200)
    const { stages } = (await response.json()) as { stages: ShownStage[] }
    // `revision` IS REFINING: in progress, with every stage before it done.
    expect(stages.map((s) => [s.label, s.state])).toEqual([
      ['Getting to know you', 'done'],
      ['Looking at other sites', 'done'],
      ['First draft', 'done'],
      ['Refining', 'in_progress'],
      ['Colours & fonts', 'not_started'],
      ['Finishing touches', 'not_started'],
      ['Ready to publish', 'not_started'],
    ])
  })
})
