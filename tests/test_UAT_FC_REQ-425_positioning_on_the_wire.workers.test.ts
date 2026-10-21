import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PLAN_BOARD_PATH, PLAN_PATH, resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { calls, says, scriptedClient, turnTailText, type ModelRequest, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-425]] — **the positioning card and readiness on the wire**: the consultant
 * sets the client's readiness and writes the card in real turns, the client hearts
 * the card through `/api/plan/board` without starting a turn, and the next turn's
 * per-turn entry carries both — readiness read back from the stored plan.
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES, through the Worker's own `route`,
 * against a real D1 and the real ticket store the plan lives in. The one double is
 * the Anthropic client.
 */

const BUSINESS = 'req425-business'

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
  route(new Request(`https://app.example${path}`, init), routerEnv(), scope, deps, {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext)

const post = (path: string, body: unknown): Promise<Response> =>
  ask(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

async function turn(sessionId: string, text: string, steps: ModelStep[]): Promise<{ seen: ModelRequest[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
  return { seen: client.seen }
}

type PlanView = {
  board: {
    themes: { notes: { id: string }[] }[]
    positioning: { state: string; heart: boolean; lines: { id: string; text: string }[] } | null
  }
}

const planOf = async (site: string): Promise<PlanView> =>
  (await (await ask(`${PLAN_PATH}?site=${encodeURIComponent(site)}`)).json()) as PlanView

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-425 — the positioning card and readiness on the wire', () => {
  it('test_UAT_FC_REQ-425_the_client_hearts_the_card_no_turn_starts_and_the_next_turn_carries_card_and_readiness', async () => {
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req425') })
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }

    const first = await turn(sessionId, 'What I do is beauty and strength — quality custom metalwork. I know exactly what the site should say.', [
      calls('pin_notes', {
        notes: [{ text: 'Beauty and strength in every weld', quote: 'What I do is beauty and strength — quality custom metalwork.', emoji: '🔥', theme: 'The work' }],
      }),
      calls('set_readiness', { messaging: 'knows_exactly' }),
      says('Pinned — heart it if it is you.'),
    ])
    expect(first.seen[0].tools.map((t) => t.name)).toEqual(expect.arrayContaining(['write_positioning', 'set_readiness']))
    const note = (await planOf(site)).board.themes[0].notes[0].id
    expect((await post(PLAN_BOARD_PATH, { site, action: 'react', note, reaction: 'heart' })).status).toBe(200)

    await turn(sessionId, 'Done.', [
      calls('write_positioning', {
        hearing: ['Craft you can see', 'Work that holds'],
        known_for: 'Beauty and Strength — quality custom metalwork',
        picks: [{ customer: 'Contractors', why: 'deciding who will pass inspection on time: certified, and takes the hard one-off job' }],
        from: [note],
      }),
      says('Here is what I am hearing.'),
    ])
    expect((await planOf(site)).board.positioning).toMatchObject({ state: 'written', heart: false })

    // THE CLIENT HEARTS IT: no turn starts.
    const watching = scriptedClient([says('I should never have been asked.')])
    setModelClient(watching)
    expect((await post(PLAN_BOARD_PATH, { site, action: 'heart_card' })).status).toBe(200)
    expect(watching.seen).toEqual([])
    expect((await planOf(site)).board.positioning).toMatchObject({ state: 'confirmed', heart: true })

    // THE NEXT TURN HEARS IT, AND CARRIES THE READINESS THE PLAN STORED.
    const next = await turn(sessionId, 'Yes, that is us.', [says('Good — headlines next.')])
    const told = turnTailText(next.seen[0])
    expect(told).toContain('hearted the positioning card')
    expect(told).toContain('positioning card confirmed')
    expect(told).toContain('Client readiness — messaging: knows exactly; look and feel: not judged yet')
  })
})
