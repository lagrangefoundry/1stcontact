import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { placeholderHomePage, STARTER_PLACEHOLDER, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import { applySchema, tenantStore } from './support/d1-site-factory'

/**
 * [[BUG-215]] — **the starter page is the grey page.** A business's seeded page
 * renders as the grey placeholder however many changes the client has made
 * before anything is built — an upload or a palette colour moves the change
 * counter and builds nothing — it never says "1st Contact", it cannot be
 * published, and the first section the consultant builds replaces it.
 *
 * The one double is the Anthropic client; the router, host, D1 store and
 * renderer are the real thing, as in REQ-403's suite this supersedes.
 */

const TENANT = 'bug215'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

function collectingCtx(): { ctx: ExecutionContext; settled: () => Promise<unknown[]> } {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      held.push(promise)
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, settled: () => Promise.all(held) }
}

const call = (path: string, init?: RequestInit, ctx?: ExecutionContext): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv(), ctx)

const post = (path: string, body: unknown, ctx?: ExecutionContext): Promise<Response> =>
  call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, ctx)

/** A business's site exactly as provisioning leaves it (`createStarterSite`). */
async function starterSite(name: string): Promise<string> {
  const store = await tenantStore(TENANT)
  const site = await store.createDraft('site')
  await store.write(site, {
    siteJson: starterSiteJson(site, name),
    pages: [{ name: 'home.json', page: placeholderHomePage(name) }],
  })
  return site
}

/** A client change that builds nothing: a palette colour, through the builder's own route. */
async function clientChange(site: string): Promise<void> {
  const res = await post('/api/palette', { site, op: 'add', name: 'brand', value: '#aa3355' })
  expect(res.status, await res.clone().text()).toBe(200)
}

beforeAll(async () => {
  await applySchema(env.DB)
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-215 — the starter page is the grey page', () => {
  it('test_UAT_FC_BUG-215_a_new_business_previews_the_grey_page_even_after_a_client_change', async () => {
    const site = await starterSite('Bob’s Salon')

    const fresh = await (await call(`/preview/${site}/draft/`)).text()
    expect(fresh).toContain(STARTER_PLACEHOLDER.slice(0, 20))
    expect(fresh).not.toMatch(/1st ?Contact/i)
    expect(fresh).not.toMatch(/<h1|<nav/i)

    // THE CLIENT CHANGES SOMETHING BEFORE ANYTHING IS BUILT: the counter moves,
    // and the preview is still the grey page.
    await clientChange(site)
    expect(await (await tenantStore(TENANT)).counter(site)).toBeGreaterThan(0)
    const after = await call(`/preview/${site}/draft/`)
    expect(after.status).toBe(200)
    const page = await after.text()
    expect(page).toContain(STARTER_PLACEHOLDER.slice(0, 20))
    expect(page).not.toMatch(/1st ?Contact/i)

    // AND THE SEEDED PAGE ITSELF SAYS NOTHING OF 1st Contact.
    const stored = await (await tenantStore(TENANT)).readPages(site)
    expect(JSON.stringify(stored)).not.toMatch(/1st ?Contact/i)
  })

  it('test_UAT_FC_BUG-215_publishing_only_the_starter_is_refused_even_after_a_client_change', async () => {
    const site = await starterSite('Hart Plumbing')
    await clientChange(site)
    const res = await post('/api/publish', { site })
    expect(res.status).toBe(409)
    expect(((await res.json()) as { code: string }).code).toBe('NOTHING_BUILT')
  })

  it('test_UAT_FC_BUG-215_once_the_consultant_builds_a_page_the_real_draft_previews', async () => {
    const site = await starterSite('Cole’s Bakery')
    configureDelegation({ ...delegationDocument, primary_writes: true })
    resetAiHost()
    resetChatHost()
    const { sessionId } = (await (await post('/api/ai/session', { site })).json()) as { sessionId: string }
    setModelClient(scriptedClient([calls('add_page', { page: 'services', title: 'Services' }), says('Added.')]))
    const { ctx, settled } = collectingCtx()
    const res = await post('/api/ai/prompt', { sessionId, text: 'Add a services page.' }, ctx)
    expect(res.status).toBe(200)
    await res.text()
    await settled()

    const built = await (await call(`/preview/${site}/draft/services`)).text()
    expect(built).toContain('<title>Services')
    expect(built).toContain('Services')
  })
})
