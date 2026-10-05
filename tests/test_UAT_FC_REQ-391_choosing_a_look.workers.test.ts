import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { findPlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import type { PlanDecision, PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { calls, says, scriptedClient, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-391]] — **choosing a look is one action, and it is recorded.**
 *
 * EVERY CASE DRIVES THE WORKER'S OWN ROUTES — `/api/pages/choose` for the
 * client's "Choose this one", and `/api/ai/session` + `/api/ai/prompt` for the
 * consultant's `choose_look` — against a real D1, the real site store and the
 * real ticket store. One double, at a genuinely external boundary: the
 * Anthropic client.
 *
 * THE SET IS SEEDED, not made through a turn: in this deployment construction is
 * commissioned, so `make_alternatives` is the builder worker's, and the set's
 * making is proven by the node suite beside this one. What is under test here is
 * the choice — what a later reader finds on the page, in the listing and in the
 * plan.
 */

const BUSINESS = 'req391-business'

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
const deps: RouterDeps = { index: async () => async () => {} }

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

type Row = { id: string; slug: string; alternative?: { set: string; label: string; archived?: boolean } }

async function listing(site: string): Promise<Row[]> {
  const res = await ask(`/api/pages?site=${encodeURIComponent(site)}`)
  expect(res.status).toBe(200)
  return ((await res.json()) as { pages: Row[] }).pages
}

/** One page as the store holds it — the definition, not a projection. */
async function stored(site: string, id: string): Promise<Record<string, any>> {
  const pages = await (await tenantStore(BUSINESS)).readPages(site)
  const found = pages.find((p) => (p.page as { id?: string }).id === id)
  expect(found, `page ${id}`).toBeDefined()
  return found!.page as Record<string, any>
}

async function plan(site: string): Promise<{ decisions: PlanDecision[]; body: string }> {
  const held = await findPlan(await ticketStoreFor(routerEnv() as never, scope), site)
  return { decisions: ((held?.fields ?? {}) as unknown as PlanFields).decisions ?? [], body: held?.body ?? '' }
}

/** A home page whose headline says which version it is. */
const page = (slug: string, id: string, heading: string, extra: Record<string, unknown> = {}) => ({
  ...starterHomePage(slug, heading),
  id,
  slug: id,
  title: id === 'home' ? 'Home' : `Home — ${heading}`,
  ...extra,
})

/** A site whose home page has a set of three looks. */
async function siteWithLooks(): Promise<string> {
  const slug = nextSlug('req391')
  const look = (id: string, label: string, order: number) =>
    page(slug, id, label, { alternative: { of: 'home', set: 'home-looks', label, description: `The ${label} look`, order } })
  const { site } = await seedTenantSite(BUSINESS, {
    slug,
    pages: {
      'home.json': page(slug, 'home', 'The page as it was', {
        seoMeta: { title: 'Charlie’s Plumbing', description: 'Plumbers in Hove' },
      }),
      'home-workwear.json': look('home-workwear', 'Workwear', 0),
      'home-coastal.json': look('home-coastal', 'Coastal', 1),
      'home-trade.json': look('home-trade', 'Trade', 2),
    },
  })
  return site
}

async function turn(sessionId: string, text: string, steps: ModelStep[]): Promise<void> {
  setModelClient(scriptedClient(steps))
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-391 — "Choose this one"', () => {
  it('test_UAT_FC_REQ-391_choose_this_one_replaces_the_page_records_the_decision_and_archives_the_rest', async () => {
    const site = await siteWithLooks()
    const res = await post('/api/pages/choose', { site, look: 'home-coastal' })
    expect(res.status).toBe(200)
    expect(((await res.json()) as { choice: unknown }).choice).toMatchObject({
      page: 'home',
      set: 'home-looks',
      chosen: 'Coastal',
      rejected: ['Workwear', 'Trade'],
    })

    // The page takes the look's content and keeps its own identity.
    const home = await stored(site, 'home')
    expect(home.l1).toEqual((await stored(site, 'home-coastal')).l1)
    expect(JSON.stringify(home.l1)).toContain('Coastal')
    expect(home).toMatchObject({ id: 'home', slug: 'home', title: 'Home', seoMeta: { title: 'Charlie’s Plumbing' } })
    expect(home.alternative).toBeUndefined()

    // Every look is archived — out of the carousel, still in the site — and the
    // page as it was is kept as one more.
    const after = await listing(site)
    expect(after.filter((p) => p.alternative && !p.alternative.archived)).toEqual([])
    expect(after.filter((p) => p.alternative).map((p) => p.alternative!.label).sort()).toEqual([
      'Before Coastal',
      'Coastal',
      'Trade',
      'Workwear',
    ])
    expect(JSON.stringify((await stored(site, 'home-before')).l1)).toContain('The page as it was')

    // The decision is in the plan, settled, with the set and the looks not chosen.
    const { decisions, body } = await plan(site)
    const decision = decisions.find((d) => d.id === 'look-home-looks')
    expect(decision).toMatchObject({ state: 'chosen', value: 'Coastal', compared: true })
    expect(decision!.answer!.quote).toContain('Coastal')
    expect(body).toContain('**Set:** home-looks · **Not chosen:** Workwear, Trade')
  })

  it('test_UAT_FC_REQ-391_choosing_the_before_look_puts_the_page_back', async () => {
    const site = await siteWithLooks()
    expect((await post('/api/pages/choose', { site, look: 'home-workwear' })).status).toBe(200)
    expect(JSON.stringify((await stored(site, 'home')).l1)).toContain('Workwear')

    expect((await post('/api/pages/choose', { site, look: 'home-before' })).status).toBe(200)
    expect(JSON.stringify((await stored(site, 'home')).l1)).toContain('The page as it was')
    expect((await plan(site)).decisions.find((d) => d.id === 'look-home-looks')).toMatchObject({
      state: 'chosen',
      value: 'Before Workwear',
    })
  })

  it('test_UAT_FC_REQ-391_only_a_look_can_be_chosen', async () => {
    const site = await siteWithLooks()
    const res = await post('/api/pages/choose', { site, look: 'home' })
    expect(res.status).toBe(400)
    expect(await res.text()).toContain('is not a look')
    expect(JSON.stringify((await stored(site, 'home')).l1)).toContain('The page as it was')
  })
})

describe('REQ-391 — the consultant chooses on the client’s say-so', () => {
  it('test_UAT_FC_REQ-391_choose_look_puts_the_look_on_the_page_and_records_the_clients_words', async () => {
    const site = await siteWithLooks()
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }
    await turn(sessionId, 'Go with workwear.', [
      calls('choose_look', { look: 'home-workwear', client_said: 'Go with workwear.' }),
      says('Done — Workwear is now your home page.'),
    ])

    expect(JSON.stringify((await stored(site, 'home')).l1)).toContain('Workwear')
    const decision = (await plan(site)).decisions.find((d) => d.id === 'look-home-looks')
    expect(decision).toMatchObject({ state: 'chosen', value: 'Workwear' })
    expect(decision!.answer!.quote).toBe('Go with workwear.')
  })
})
