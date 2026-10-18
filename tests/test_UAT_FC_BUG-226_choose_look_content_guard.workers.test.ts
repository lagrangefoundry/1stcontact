import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { findPlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import type { PlanDecision, PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import { calls, says, scriptedClient, type ScriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-226]] — **choosing a look never silently changes what the page says.**
 *
 * A builder restyling a look is scoped to the look's file, so nothing stopped it
 * rewording text or swapping a picture — and one cut off mid-run left exactly
 * that behind. `choose_look` used to carry it onto the real page. Now it compares
 * the look's words and pictures with the page's and refuses `CONTENT_CHANGED`,
 * listing what would change, until it is called again with
 * `content_changes_seen: true`. Styling alone never trips it.
 *
 * Driven through the worker's own routes — the consultant's `choose_look` in a
 * conversation — against a real D1, site store and ticket store. One double, at
 * the external boundary: the Anthropic client.
 */

const BUSINESS = 'bug226-business'

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

async function stored(site: string, id: string): Promise<Record<string, any>> {
  const pages = await (await tenantStore(BUSINESS)).readPages(site)
  const found = pages.find((p) => (p.page as { id?: string }).id === id)
  expect(found, `page ${id}`).toBeDefined()
  return found!.page as Record<string, any>
}

async function decisions(site: string): Promise<PlanDecision[]> {
  const held = await findPlan(await ticketStoreFor(routerEnv() as never, scope), site)
  return ((held?.fields ?? {}) as unknown as PlanFields).decisions ?? []
}

/** The team section the client verified: a headline, their words, two portraits. */
function document(opts: { ink?: string; portrait?: string; words?: string } = {}): Record<string, unknown> {
  return {
    widths: [1280],
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [
        { kind: 'text', id: 'headline', text: 'Meet the team', axes: { color: opts.ink ?? '#111111', fontSizePx: 40 } },
        {
          kind: 'text',
          id: 'about',
          text: opts.words ?? 'Bob has cut hair on this street for thirty years.',
          axes: { color: opts.ink ?? '#111111', fontSizePx: 18 },
        },
        { kind: 'image', id: 'bob', src: opts.portrait ?? 'https://images.example/bob.jpg', alt: 'Bob at his chair' },
        { kind: 'image', id: 'ann', src: 'https://images.example/ann.jpg', alt: 'Ann with a client' },
      ],
    },
  }
}

const page = (id: string, l1: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  id,
  slug: id,
  title: id === 'home' ? 'Home' : `Home — ${id}`,
  modules: [],
  l1,
  ...extra,
})

/** A home page with two looks: one only restyled, one whose content drifted. */
async function siteWithLooks(): Promise<string> {
  const look = (id: string, label: string, order: number, l1: Record<string, unknown>) =>
    page(id, l1, { alternative: { of: 'home', set: 'home-looks', label, order } })
  const { site } = await seedTenantSite(BUSINESS, {
    slug: nextSlug('bug226'),
    pages: {
      'home.json': page('home', document()),
      'home-navy.json': look('home-navy', 'Navy', 0, document({ ink: '#1b2a4a' })),
      'home-gold.json': look(
        'home-gold',
        'Gold',
        1,
        document({ ink: '#8a6d1d', portrait: 'https://images.example/stock-man.jpg', words: 'Bob has cut hair here.' }),
      ),
    },
  })
  return site
}

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

beforeAll(async () => {
  await applySchema()
})

/** One consultant turn that calls `choose_look`; answers what the tool returned. */
async function choose(site: string, input: Record<string, unknown>): Promise<string> {
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client: ScriptedClient = scriptedClient([calls('choose_look', input), says('Done.')])
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text: String(input.client_said) })
  expect(response.status).toBe(200)
  await response.text()
  for (const req of client.seen) {
    for (const message of req.messages) {
      if (!Array.isArray(message.content)) continue
      for (const block of message.content as { type?: string; content?: unknown }[]) {
        if (block.type === 'tool_result') return JSON.stringify(block.content)
      }
    }
  }
  throw new Error('choose_look returned nothing to the model')
}

describe('BUG-226 — choosing a look checks what it says against the page', () => {
  it('test_UAT_FC_BUG-226_a_look_that_only_restyled_the_page_is_chosen_without_question', async () => {
    const site = await siteWithLooks()
    const result = await choose(site, { look: 'home-navy', client_said: 'The navy one.' })

    expect(result).not.toContain('CONTENT_CHANGED')
    const home = await stored(site, 'home')
    expect(home.l1).toEqual((await stored(site, 'home-navy')).l1)
    expect(JSON.stringify(home.l1)).toContain('#1b2a4a')
    expect((await decisions(site)).find((d) => d.id === 'look-home-looks')).toMatchObject({ state: 'chosen', value: 'Navy' })
  })

  it('test_UAT_FC_BUG-226_a_look_whose_words_or_pictures_drifted_is_refused_with_the_differences', async () => {
    const site = await siteWithLooks()
    const before = await stored(site, 'home')
    const result = await choose(site, { look: 'home-gold', client_said: 'Gold, please.' })

    // Refused, saying exactly what would change: one picture, one piece of text.
    expect(result).toContain('CONTENT_CHANGED')
    expect(result).toContain('1 picture and 1 piece of text')
    expect(result).toContain('https://images.example/bob.jpg')
    expect(result).toContain('https://images.example/stock-man.jpg')
    expect(result).toContain('Bob has cut hair on this street for thirty years.')
    expect(result).toContain('Bob has cut hair here.')
    expect(result).toContain('content_changes_seen')

    // Nothing was written: the page, the looks and the plan are as they were.
    expect(await stored(site, 'home')).toEqual(before)
    expect((await stored(site, 'home-gold')).alternative.archived).toBeUndefined()
    expect((await decisions(site)).find((d) => d.id === 'look-home-looks')).toBeUndefined()
  })

  it('test_UAT_FC_BUG-226_once_the_client_has_seen_the_differences_the_look_is_chosen', async () => {
    const site = await siteWithLooks()
    const result = await choose(site, {
      look: 'home-gold',
      client_said: 'Yes, use the new picture and the shorter words.',
      content_changes_seen: true,
    })

    expect(result).not.toContain('CONTENT_CHANGED')
    const home = await stored(site, 'home')
    expect(home.l1).toEqual((await stored(site, 'home-gold')).l1)
    expect(JSON.stringify(home.l1)).toContain('https://images.example/stock-man.jpg')
    // The page as it was is still kept, so the change can be undone.
    expect(JSON.stringify((await stored(site, 'home-before')).l1)).toContain('https://images.example/bob.jpg')
    expect((await decisions(site)).find((d) => d.id === 'look-home-looks')).toMatchObject({ state: 'chosen', value: 'Gold' })
  })
})
