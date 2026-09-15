import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * [[REQ-248]] UATs — **the listing reaches the builder over the wire**.
 *
 * The derivation is asserted against the store in
 * `test_UAT_FC_REQ-248_page_reach`; this is the other half of the same claim —
 * that the answer travels. It runs INSIDE workerd, through the Worker's own
 * `fetch`, against a real D1 and R2, because "the control can list the site's
 * pages" is a claim about a deployed route rather than about a function.
 *
 * Acceptance covered:
 *
 *   AC-1  every page reaches the control, including one nothing points at
 *   AC-2  and the mark travels with it, per row
 */

let businessSeq = 0
const nextBusiness = (): string => `req248-${(businessSeq += 1)}`

function workerEnv(tenant: string): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  }
}

const call = (tenant: string, path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    workerEnv(tenant),
  )

/** A link, as a node takes one: a role any subtree may carry, not a node kind. */
function linkTo(href: string): Record<string, unknown> {
  return { kind: 'text', id: `link-${href.replace(/\W+/g, '-')}`, text: href, link: { href } }
}

/**
 * A three-page site: the home page, one it links to, and one nothing points at.
 *
 * Built from the scaffolder's own starter rather than a hand-written definition,
 * for the reason every other fixture here is — a definition that drifts from the
 * validator fails as "this draft does not validate", which is a test asserting
 * its own mistake.
 */
function threePageSite() {
  const seed = siteSeed({ slug: nextSlug() })
  const home = seed.pages['home.json'] as Record<string, unknown>
  const l1 = home.l1 as Record<string, unknown>
  const root = l1.root as Record<string, unknown>
  const derived = (id: string, title: string) => ({
    ...home,
    id,
    slug: id,
    title,
    seoMeta: { title, description: title },
  })
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: [
      {
        name: 'home.json',
        page: {
          ...home,
          l1: { ...l1, root: { ...root, children: [...(root.children as unknown[]), linkTo('/about')] } },
        },
      },
      { name: 'about.json', page: derived('about', 'About us') },
      { name: 'terms.json', page: derived('terms', 'Terms') },
    ],
    assets: [] as { name: string; base64: string }[],
  }
}

interface Row {
  id: string
  slug: string
  title: string
  reachable: boolean
}

describe('REQ-248 — /api/pages', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-248_the_route_lists_every_page_with_its_reach', async () => {
    const tenant = nextBusiness()
    const imported = await call(tenant, '/api/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(threePageSite()),
    })
    expect(imported.status).toBe(200)
    const site = ((await imported.json()) as { site: string }).site

    const res = await call(tenant, `/api/pages?site=${encodeURIComponent(site)}`)
    expect(res.status).toBe(200)
    const { pages } = (await res.json()) as { pages: Row[] }

    // AC-1 — the page nothing links to is in the answer the control draws from.
    expect(pages.map((p) => p.id).sort()).toEqual(['about', 'home', 'terms'])
    // AC-2 — and the mark is per row, so the control states it without asking a
    // second question about each page.
    expect(Object.fromEntries(pages.map((p) => [p.id, p.reachable]))).toEqual({
      home: true,
      about: true,
      terms: false,
    })
    // Named by something an operator recognises, which is what the control lists
    // rows by.
    expect(pages.find((p) => p.id === 'about')?.title).toBe('About us')
  })

  it('test_UAT_FC_REQ-248_the_route_refuses_a_request_that_names_no_site', async () => {
    const res = await call(nextBusiness(), '/api/pages')
    expect(res.status).toBe(400)
    expect((await res.json<{ error: string }>()).error).toContain('site')
  })
})
