import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
// IMPORTED, NOT READ. workerd has no filesystem, so the Node suites' `fs.readFileSync`
// of this fixture cannot work here; Vite inlines the JSON at transform time instead.
import ORPHAN from './fixtures/bug85/account-chrome-v1-orphan.json'

/**
 * [[BUG-85]] 2d — `POST /api/modules/upgrade`, the half of the upgrade pass
 * that can reach D1.
 *
 * WHY THIS SUITE EXISTS AND THE NODE ONE IS NOT ENOUGH. The store that
 * orphaned an instance was **D1**. The bumping commit migrated the filesystem
 * fixture and nothing else, because it migrated by editing a file in the repo —
 * and a migration performed that way can only ever reach the fixtures. A
 * facility proved only against the in-memory store would repeat precisely that
 * mistake at one remove: green everywhere except where the data lives.
 *
 * So these assertions run inside workerd, through the Worker's own `fetch`,
 * against the real D1 the deployed Worker uses, with the schema applied from
 * `db/migrations` — and the orphan they upgrade is the instance lifted out of
 * 1st Contact's own draft while this bug was being diagnosed.
 */

const TENANT = 'bug85'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    // Loopback dev-open, as every other workerd suite here does it: Access is
    // unconfigured in the test runtime and would otherwise refuse every request
    // before the route under test ran.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv())

const upgrade = (body: Record<string, unknown>): Promise<Response> =>
  call('/api/modules/upgrade', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

/** A site in D1 whose home page carries the real v1 orphan. */
async function siteWithOrphan(): Promise<string> {
  const slug = nextSlug()
  const seed = siteSeed({ slug })
  const res = await call('/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug,
      siteJson: seed.siteJson,
      pages: [
        {
          name: 'home.json',
          page: { id: 'home', slug: 'home', modules: [structuredClone(ORPHAN)] },
        },
      ],
      assets: [],
    }),
  })
  expect(res.status, 'seeding the orphan through /api/import').toBe(200)
  return slug
}

/** The stored instance, read back through the store the Worker writes with. */
async function storedInstance(slug: string): Promise<Record<string, unknown>> {
  const pages = await tenantStore(TENANT).then((s) => s.readPages(slug))
  const home = pages.find((p) => p.name === 'home.json')!
  return (home.page.modules as Record<string, unknown>[])[0]
}

beforeAll(async () => {
  await applySchema()
  await ensureTenant(TENANT)
})

describe('BUG-85 2d — POST /api/modules/upgrade', () => {
  it('reports the orphan in D1 and writes nothing by default', async () => {
    const slug = await siteWithOrphan()
    const before = await storedInstance(slug)

    const res = await upgrade({ slug })
    expect(res.status).toBe(200)
    const report = (await res.json()) as {
      stale: number
      written: boolean
      pages: { name: string; upgrades: Record<string, unknown>[] }[]
    }

    expect(report.stale).toBe(1)
    expect(report.written).toBe(false)
    expect(report.pages[0].upgrades[0]).toMatchObject({
      id: 'signin',
      type: 'account-chrome',
      from: 1,
      to: 2,
      droppedConfigKeys: ['account'],
    })
    // Read back through the store, because "wrote nothing" is a claim about D1
    // and not about the response body.
    expect(await storedInstance(slug)).toEqual(before)
  })

  it('writes the upgrade into D1 when asked', async () => {
    const slug = await siteWithOrphan()

    const res = await upgrade({ slug, write: true })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ stale: 1, written: true })

    const after = await storedInstance(slug)
    expect(after.version).toBe(2)
    expect(Object.keys(after.slots as object).sort()).toEqual([
      'businesses',
      'dialog',
      'error',
      'sent',
      'signedIn',
      'signedOut',
    ])
    expect(after.config).not.toHaveProperty('sentMessage')
    expect(after.config).not.toHaveProperty('account')
  })

  it('is a no-op the second time, so the route is safe to re-run', async () => {
    const slug = await siteWithOrphan()
    expect((await upgrade({ slug, write: true })).status).toBe(200)
    const settled = await storedInstance(slug)

    const again = await upgrade({ slug, write: true })
    expect(await again.json()).toMatchObject({ stale: 0, written: false })
    expect(await storedInstance(slug)).toEqual(settled)
  })

  it('refuses a request with no slug', async () => {
    const res = await upgrade({})
    expect(res.status).toBe(400)
  })
})
