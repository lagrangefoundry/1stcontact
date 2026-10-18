import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PLAN_BOARD_PATH, PLAN_PATH, resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { calls, says, scriptedClient, sentText, turnTailText, type ModelRequest, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-408]] — **the story board on the wire**: the consultant pins notes in a
 * real turn, the client reacts, adds a note and chooses a headline through
 * `/api/plan/board`, nothing starts a turn, and the consultant hears all of it at
 * the start of her next one.
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/ai/session`,
 * `/api/ai/prompt`, `/api/plan`, `/api/plan/board` — through the Worker's own
 * `route`, against a real D1, the real ticket store the plan lives in and the
 * real session machinery. The one double is the Anthropic client.
 */

const BUSINESS = 'req408-business'

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

type BoardView = {
  themes: { id: string; name: string; colour: number; notes: { id: string; text: string; reaction?: string; by: string }[] }[]
  headline: { state: string; text?: string; options: string[] }
}

const boardOf = async (site: string): Promise<{ board: BoardView; drafted: boolean }> =>
  (await (await ask(`${PLAN_PATH}?site=${encodeURIComponent(site)}`)).json()) as { board: BoardView; drafted: boolean }

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-408 — the story board on the wire', () => {
  it('test_UAT_FC_REQ-408_the_client_acts_on_the_board_no_turn_starts_and_the_next_turn_hears_it', async () => {
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req408') })
    const opened = await post('/api/ai/session', { site })
    expect(opened.status).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    // A NEW SITE HAS NO DRAFT YET: the preview opens on the board.
    expect((await boardOf(site)).drafted).toBe(false)

    // THE CONSULTANT PINS, IN A REAL TURN, WITH THE TOOLS AND PRIMING SHE IS GIVEN.
    const first = await turn(sessionId, "My gran opened the salon in 1971, then my mum ran it, and now it's me.", [
      calls('pin_notes', {
        notes: [
          { text: 'Three generations of one family cut hair here', quote: "My gran opened the salon in 1971, then my mum ran it, and now it's me.", emoji: '👪', theme: 'Family' },
          { text: 'On the high street since 1971', quote: 'My gran opened the salon in 1971.', emoji: '📍', theme: 'The place' },
        ],
      }),
      says("I've put two of your sayings on the story board — heart the ones that are most you."),
    ])
    expect(first.seen[0].tools.map((t) => t.name)).toEqual(expect.arrayContaining(['pin_notes', 'reword_note', 'offer_headlines']))
    expect(sentText(first.seen[0])).toContain('## The story board')
    let { board } = await boardOf(site)
    const [family, place] = board.themes
    expect([family.name, place.name]).toEqual(['Family', 'The place'])
    const generations = family.notes[0].id
    const street = place.notes[0].id

    // THE MODEL IS WATCHING: anything the board does that started a turn would be a request here.
    const watching = scriptedClient([says('I should never have been asked.')])
    setModelClient(watching)
    expect((await post(PLAN_BOARD_PATH, { site, action: 'react', note: generations, reaction: 'heart' })).status).toBe(200)
    expect((await post(PLAN_BOARD_PATH, { site, action: 'react', note: street, reaction: 'down' })).status).toBe(200)
    expect((await post(PLAN_BOARD_PATH, { site, action: 'add', theme: family.id, text: 'My daughter starts in June' })).status).toBe(200)
    expect(watching.seen).toEqual([])
    // A NOTE THE BOARD DOES NOT HOLD IS A 404, and nothing changes.
    expect((await post(PLAN_BOARD_PATH, { site, action: 'react', note: 'n99', reaction: 'up' })).status).toBe(404)
    ;({ board } = await boardOf(site))
    expect(board.themes[0].notes.map((n) => [n.text, n.reaction ?? null, n.by])).toEqual([
      ['Three generations of one family cut hair here', 'heart', 'consultant'],
      ['My daughter starts in June', null, 'client'],
    ])

    // HER NEXT TURN HEARS IT — and she offers headlines from the hearted note.
    const second = await turn(sessionId, 'Done.', [
      calls('offer_headlines', { options: ['Three generations on one corner', 'Cut by family since 1971'], pick: 0, from: [generations] }),
      says('Here are two headlines to try.'),
    ])
    const told = turnTailText(second.seen[0])
    expect(told).toContain('Your client worked on the story board since your last turn (3 changes)')
    expect(told).toContain(`gave ${generations} "Three generations of one family cut hair here" ❤️`)
    expect(told).toContain('"My daughter starts in June" under Family')
    expect(told).toContain('Ask about each 👎')
    expect((await boardOf(site)).board.headline.options).toEqual(['Three generations on one corner', 'Cut by family since 1971'])

    // THE CLIENT CHOOSES; THE TURN AFTER HEARS ONLY THAT.
    expect((await post(PLAN_BOARD_PATH, { site, action: 'choose', option: 'Cut by family since 1971' })).status).toBe(200)
    const third = await turn(sessionId, 'That one.', [says('Good choice.')])
    const after = turnTailText(third.seen[0])
    expect(after).toContain('Your client worked on the story board since your last turn (1 change): chose the headline "Cut by family since 1971"')
    expect(after).toContain('headline chosen: "Cut by family since 1971"')
  })
})
