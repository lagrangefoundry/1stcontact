import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'

/**
 * BUG-36 — a freshly deployed builder boots against an empty database.
 *
 * THE OUTAGE THESE PIN DOWN. `bin/deploy` applies the migrations and seeds no
 * rows, so a new deployment had the schema and an empty `tenants` table.
 * `forTenant` refuses an unregistered tenant — correctly — so every read route
 * answered 503, the chrome's top-level `await` on `/api/sites` rejected, and
 * the operator got a boot guard instead of a builder. The one thing that could
 * fix it was `bin/publish`, because the import route opened the store through a
 * SECOND function that registered the tenant first. A deployment could not be
 * read until someone had written to it from a laptop.
 *
 * WHY THESE RUN IN WORKERD. The whole claim is about what a REAL D1 database
 * with no `tenants` row does to a REAL Worker's `fetch`. A node-side test of
 * `storeFor` against a stub would assert the stub's opinion of a missing row —
 * which is exactly the assumption that was wrong. So each case drives
 * `controlApp.fetch` and reads the tenant table back through the store.
 *
 * EVERY CASE GETS ITS OWN TENANT ID. The database is shared across the file and
 * the bootstrap is a write; a shared id would leave case order deciding whether
 * a tenant was "fresh", which is the one property under test.
 */

let n = 0
const freshTenant = (): string => `bug36-${Date.now().toString(36)}-${n++}`

function controlEnv(tenantId: string | undefined): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: tenantId,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as ControlEnv
}

const call = (
  path: string,
  tenantId: string | undefined,
  init?: RequestInit,
): Promise<Response> =>
  controlApp.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    controlEnv(tenantId),
  )

const root = () => d1r2SiteStore({ DB: env.DB, SITES: env.SITES })

const tenantRow = async (id: string) =>
  (await root().listTenants()).find((t) => t.id === id)

beforeAll(applySchema)

describe('BUG-36 — the builder boots before anything has been published to it', () => {
  it('test_UAT_FC_BUG-36_a_fresh_database_serves_an_empty_site_list', async () => {
    const tenantId = freshTenant()
    expect(await tenantRow(tenantId)).toBeUndefined()

    const res = await call('/api/sites', tenantId)

    // The bug was 503 with `No tenant '<id>'.` — the boot guard's exact text.
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('test_UAT_FC_BUG-36_reading_registers_the_configured_tenant_and_no_other', async () => {
    const tenantId = freshTenant()
    const before = await root().listTenants()

    await call('/api/sites', tenantId)

    // Registered, active, and named by the configuration rather than by the
    // request — the property that keeps this from being a way to reach or mint
    // a second account.
    expect(await tenantRow(tenantId)).toMatchObject({ id: tenantId, status: 'active' })
    const after = await root().listTenants()
    expect(after.length).toBe(before.length + 1)
  })

  it('test_UAT_FC_BUG-36_an_import_still_lands_on_a_fresh_database', async () => {
    // The regression guard for having DELETED the second opener: the import
    // route used to carry the only registration in the system.
    const tenantId = freshTenant()
    const res = await call('/api/import', tenantId, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: `imported-${tenantId}`,
        siteJson: { name: 'imported' },
        pages: [{ name: 'home.json', page: { kind: 'page' } }],
        assets: [],
      }),
    })

    expect(res.status).toBe(200)
    expect(await tenantRow(tenantId)).toMatchObject({ id: tenantId, status: 'active' })
  })

  it('test_UAT_FC_BUG-36_a_deactivated_tenant_stays_refused', async () => {
    // Self-healing must not reopen an account somebody closed. `createTenant`
    // is INSERT OR IGNORE, so a retry would fail anyway — but the refusal is
    // meant to be a decision, not a side effect of the insert's flavour.
    const tenantId = freshTenant()
    await root().createTenant({ id: tenantId, name: tenantId, status: 'suspended' })

    const res = await call('/api/sites', tenantId)

    expect(res.status).toBe(503)
    expect(await res.text()).toContain('not active')
    expect(await tenantRow(tenantId)).toMatchObject({ status: 'suspended' })
  })

  it('test_UAT_FC_BUG-36_an_unset_tenant_id_is_still_a_configuration_error', async () => {
    // The bootstrap resolves "no row for the configured tenant". It must not
    // resolve "no configured tenant" — there is no name to register, and
    // inventing one would let a misconfigured Worker write into whichever
    // account happened to carry it.
    const res = await call('/api/sites', undefined)

    expect(res.status).toBe(503)
    expect(await res.text()).toContain('TENANT_ID is not configured')
  })
})
