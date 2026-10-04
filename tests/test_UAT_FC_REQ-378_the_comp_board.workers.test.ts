import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  PLAN_COMP_PATH,
  PLAN_PATH,
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { findPlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import type { PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import { HINTS_SCRIPT } from '../tools/generate/src/cli/capture/hints'
import { encodePng } from '../tools/generate/src/cli/png'
import {
  calls,
  says,
  scriptedClient,
  turnTailText,
  type ModelRequest,
  type ModelStep,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { CANNED_HINTS, run, signalsFor } from './support/fake-capture-driver'

/**
 * [[REQ-378]] — **the comp board: comparable sites, captured, on the plan panel,
 * with the client's likes and dislikes.**
 *
 * EVERY CASE DRIVES THE WORKER'S OWN ROUTES — `/api/plan`, `/api/plan/comp`,
 * `/api/material/file`, `/api/ai/session` and `/api/ai/prompt` — against a real
 * D1, the real ticket store, the real R2 reference bucket and the real capture
 * pipeline. Two doubles, both at genuinely external boundaries: the Anthropic
 * client, and the browser (a fake Puppeteer whose page answers the extraction
 * scripts with canned signals, so `capture_site` runs end to end).
 */

const BUSINESS = 'req378-business'
const COMP_URL = 'https://joes-plumbing.test/'
const COMP_HTML = '<html><head><title>Joe’s Plumbing</title></head><body><h1>Joe’s Plumbing</h1></body></html>'

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

function realPng(): Uint8Array {
  const data = new Uint8Array(8 * 8 * 3).fill(0x40)
  return encodePng({ data, width: 8, height: 8, channels: 3 })
}

/**
 * The browser: every page script answers the canned capture signals for the
 * viewport last applied, with one animated element and one hover transition, so
 * the capture records motion.
 */
const browser = fakeBrowser({
  png: realPng(),
  network: { [COMP_URL]: { body: COMP_HTML, contentType: 'text/html' } },
  evaluate: (script, viewport) => {
    if (script === HINTS_SCRIPT) return CANNED_HINTS
    const signals = signalsFor(viewport?.width ?? 1280)
    signals.title = 'Joe’s Plumbing'
    signals.bands[0].content.push(
      run({ text: 'Drain unblocking', box: { x: 20, y: 220, width: 300, height: 40 }, motion: 'animation' }),
      run({ text: 'Boiler repair', box: { x: 20, y: 280, width: 300, height: 40 }, motion: 'transition' }),
    )
    return signals
  },
})

const deps: RouterDeps = {
  launch: browser.launch,
  index: async () => async () => {},
  describeImage: async () => ({ text: 'A plumber.', model: 'stub/vision-1' }),
}

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

const tickets = (): Promise<TicketStore> => ticketStoreFor(routerEnv() as never, scope)

type BoardComp = {
  reference: string
  title: string
  url: string
  source: string
  likes: string[]
  dislikes: string[]
  motion: string | null
  desktop: string | null
  phone: string | null
}

async function board(site: string): Promise<BoardComp[]> {
  const res = await ask(`${PLAN_PATH}?site=${encodeURIComponent(site)}`)
  expect(res.status).toBe(200)
  return ((await res.json()) as { comps: BoardComp[] }).comps
}

async function storedComps(site: string): Promise<PlanFields['comps']> {
  const plan = await findPlan(await tickets(), site)
  return ((plan?.fields ?? {}) as unknown as PlanFields).comps ?? []
}

/** A site and an open one-to-one conversation about it. */
async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req378') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

async function turn(sessionId: string, text: string, steps: ModelStep[]): Promise<ModelRequest[]> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
  return client.seen
}

/** The reference uid the previous tool result named — what the model would read. */
const referenceIn = (req: ModelRequest): string => {
  const match = JSON.stringify(req.messages[req.messages.length - 1]).match(/reference-[0-9a-z]+/)
  expect(match, 'the capture names the reference it adopted').not.toBeNull()
  return match![0]
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-378 — the client adds a comp', () => {
  it('test_UAT_FC_REQ-378_a_client_url_is_captured_into_a_board_entry_with_a_hero_and_its_motion', async () => {
    const { site: key } = await site()
    const watching = scriptedClient([says('I should never have been asked.')])
    setModelClient(watching)

    const res = await post(PLAN_COMP_PATH, { site: key, action: 'add', url: COMP_URL })
    expect(res.status).toBe(200)
    const [comp] = ((await res.json()) as { comps: BoardComp[] }).comps
    expect(comp).toMatchObject({ title: 'Joe’s Plumbing', url: COMP_URL, source: 'client' })
    // The two widths the viewer toggles between, from the capture's own ladder.
    expect(comp.desktop).toBe('screenshot-1280.png')
    expect(comp.phone).toBe('screenshot-375.png')
    // What the capture recorded about motion, in words.
    expect(comp.motion).toMatch(/animation \(entrance or scroll-in\) on 1 element/)
    expect(comp.motion).toMatch(/hover transitions on 1 element/)

    // IT IS A CAPTURE: the existing `reference` ticket, in this business's store.
    const { ticket } = await (await tickets()).get({ uid: comp.reference })
    expect(ticket.type).toBe('reference')
    expect(ticket.fields).toMatchObject({ kind: 'capture', source_url: COMP_URL })
    expect(ticket.body).toContain('Motion: uses animation')

    // The hero thumbnail is served from the Library, as an image.
    const hero = await ask(`/api/material/file?uid=${encodeURIComponent(comp.reference)}&member=${comp.desktop}`)
    expect(hero.status).toBe(200)
    expect(hero.headers.get('content-type')).toContain('image/png')

    // The panel's read shows the same entry, and the plan holds who added it.
    expect((await board(key)).map((c) => c.reference)).toEqual([comp.reference])
    expect(await storedComps(key)).toMatchObject([{ reference: comp.reference, source: 'client' }])
    // No turn started.
    expect(watching.seen).toEqual([])
  })

  it('test_UAT_FC_REQ-378_an_address_that_cannot_be_captured_is_refused_and_nothing_is_added', async () => {
    const { site: key } = await site()
    const res = await post(PLAN_COMP_PATH, { site: key, action: 'add', url: 'http://127.0.0.1/admin' })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('REFUSED')
    expect(await board(key)).toEqual([])
  })
})

describe('REQ-378 — the consultant keeps the comp board', () => {
  it('test_UAT_FC_REQ-378_the_consultant_captures_adds_and_records_conventions_from_comps', async () => {
    const { site: key, sessionId } = await site()
    let reference = ''
    const seen = await turn(sessionId, 'Let us look at plumbers near me.', [
      calls('capture_site', { url: COMP_URL }),
      (req) => {
        reference = referenceIn(req)
        return calls('add_comp', { reference })(req)
      },
      (req) =>
        calls('note_comp', { reference, likes: ['phone number in three places'], dislikes: ['too many coupons'] })(req),
      (req) =>
        calls('set_decision', {
          decision: 'visual_concept',
          state: 'proposed',
          value: 'Dense services grid, phone in three places, reviews near the top, no coupons.',
          comps: [reference],
        })(req),
      says('Joe’s is on your board.'),
    ])
    // The grant: the comp board's operations are in the consultant's tool list.
    const offered = ((seen[0] as unknown as { tools?: { name: string }[] }).tools ?? []).map((t) => t.name)
    expect(offered).toEqual(expect.arrayContaining(['capture_site', 'add_comp', 'note_comp', 'remove_comp']))

    const [comp] = await board(key)
    expect(comp).toMatchObject({
      reference,
      source: 'consultant',
      likes: ['phone number in three places'],
      dislikes: ['too many coupons'],
    })
    // The notes are on the reference ticket itself.
    const { ticket } = await (await tickets()).get({ uid: reference })
    expect(ticket.fields).toMatchObject({ likes: ['phone number in three places'], dislikes: ['too many coupons'] })
    // The conventions are the visual_concept decision, linked to the comp.
    const plan = await findPlan(await tickets(), key)
    const concept = ((plan!.fields as unknown as PlanFields).decisions ?? []).find((d) => d.id === 'visual_concept')
    expect(concept).toMatchObject({ state: 'proposed', comps: [reference] })
    expect(concept!.value).toContain('Dense services grid')
  })

  it('test_UAT_FC_REQ-378_client_likes_and_dislikes_persist_on_the_reference_and_reach_the_next_turn', async () => {
    const { site: key, sessionId } = await site()
    const added = await post(PLAN_COMP_PATH, { site: key, action: 'add', url: COMP_URL })
    const [comp] = ((await added.json()) as { comps: BoardComp[] }).comps

    // The consultant's own first turn reads the board once; nothing is news yet.
    await turn(sessionId, 'Hello.', [says('Hello.')])

    const noted = await post(PLAN_COMP_PATH, {
      site: key,
      action: 'note',
      reference: comp.reference,
      likes: ['reviews near the top'],
      dislikes: ['the stock photo of a tap'],
    })
    expect(noted.status).toBe(200)
    expect(((await noted.json()) as { comps: BoardComp[] }).comps[0]).toMatchObject({
      likes: ['reviews near the top'],
      dislikes: ['the stock photo of a tap'],
    })
    // PERSISTED ON THE REFERENCE TICKET.
    const { ticket } = await (await tickets()).get({ uid: comp.reference })
    expect(ticket.fields).toMatchObject({ likes: ['reviews near the top'], dislikes: ['the stock photo of a tap'] })

    // AND THE CONSULTANT IS TOLD ON ITS NEXT TURN — once.
    const next = await turn(sessionId, 'What do you think?', [says('Noted.')])
    const told = turnTailText(next[0])
    expect(told).toContain('likes and dislikes on 1 comp')
    expect(told).toContain('"reviews near the top"')
    expect(told).toContain('"the stock photo of a tap"')
    const after = await turn(sessionId, 'And now?', [says('Still noted.')])
    expect(turnTailText(after[0])).not.toContain('likes and dislikes on')

    // Removing takes it off the board; the capture stays in the Library.
    const removed = await post(PLAN_COMP_PATH, { site: key, action: 'remove', reference: comp.reference })
    expect(((await removed.json()) as { comps: BoardComp[] }).comps).toEqual([])
    expect((await (await tickets()).get({ uid: comp.reference })).ticket.type).toBe('reference')
  })
})
