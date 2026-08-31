/**
 * story-e674c60a / AC-1449 — **a freshly deployed workspace serves.**
 *
 * THE OUTAGE THIS PINS DOWN. `bin/deploy` applies the migrations and seeds no
 * rows, so every new deployment had the schema and an empty `tenants` table.
 * `forTenant` refuses an unregistered account — correctly — so every read route
 * answered 503, the chrome's top-level `await` on `/api/sites` rejected, and the
 * operator got a boot guard instead of a builder. The one thing that could cure
 * it was `bin/publish`, because the import route opened the store through a
 * SECOND function that registered the account first: a deployment could not be
 * READ until somebody had WRITTEN to it from a laptop.
 *
 * WHY THIS RUNS IN workerd. The whole claim is about what a REAL D1 database
 * with no `tenants` row does to a REAL Worker's `fetch`. A node-side test of
 * `storeFor` against a hand-written stub would assert the stub's opinion of a
 * missing row — which is precisely the assumption that was wrong. So every case
 * drives `controlApp.fetch` and reads the accounts back through the store.
 *
 * EVERY CASE GETS ITS OWN ACCOUNT NAME. The bootstrap is a write and the
 * database is shared across the file, so a shared name would let the order the
 * cases run in decide which of them saw a fresh store — which is the one
 * property under test.
 *
 * THE ONE INSTRUMENT, AND WHY IT IS NOT A DOUBLE. `recordingDb` is a `Proxy`
 * over the REAL D1 binding that appends each statement's SQL to an array and
 * forwards the call unchanged. Nothing is simulated: SQLite executes every
 * query. It exists because the criterion's fourth property — "it costs nothing
 * once done" — is about work NOT performed, and the absence of a write is
 * invisible from a response body.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'

/** A name no earlier case can have registered. */
let n = 0
const freshTenant = (): string => `ac1449-${Date.now().toString(36)}-${n++}`

/**
 * The real D1 binding, with every statement's SQL recorded on the way past.
 * A `Proxy` rather than a hand-written object so a method added to `D1Database`
 * tomorrow keeps working instead of silently disappearing.
 */
function recordingDb(db: D1Database, sql: string[]): D1Database {
  return new Proxy(db, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown
      if (typeof value !== 'function') return value
      const fn = (value as (...args: unknown[]) => unknown).bind(target)
      if (prop === 'prepare' || prop === 'exec') {
        return (statement: string, ...rest: unknown[]) => {
          sql.push(statement)
          return fn(statement, ...rest)
        }
      }
      return fn
    },
  })
}

/** The bindings the Worker declares, as `wrangler.toml` declares them. */
function controlEnv(tenantId: string | undefined, db: D1Database = env.DB): ControlEnv {
  return {
    DB: db,
    SITES: env.SITES,
    TENANT_ID: tenantId,
    // The loopback dev server: Access is unconfigured, so the gate would refuse
    // every request. See `index.ts` on why this cannot open a deployed Worker.
    // Admission itself is AC-964's subject, not this criterion's.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      // Build artifacts, which are not built in this environment. Nothing below
      // reads one — AC-1400 owns those — so a marker keeps an accidental
      // fall-through visible rather than silent.
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as ControlEnv
}

const call = (
  path: string,
  tenantId: string | undefined,
  init?: RequestInit,
  db?: D1Database,
): Promise<Response> =>
  controlApp.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    controlEnv(tenantId, db),
  )

/** The store before an account is chosen — used only to read the accounts back. */
const root = () => d1r2SiteStore({ DB: env.DB, SITES: env.SITES })

const tenantRow = async (id: string) => (await root().listTenants()).find((t) => t.id === id)

const importBody = (slug: string) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    slug,
    siteJson: { name: slug },
    pages: [{ name: 'home.json', page: { kind: 'page' } }],
    assets: [],
  }),
})

const REGISTERS = /insert\s+or\s+ignore\s+into\s+tenants/i
const LOOKS_UP = /from\s+tenants\s+where\s+id/i

beforeAll(applySchema)

describe('story-e674c60a — a deployment with only the schema serves', () => {
  it('test_UAT_AC1449_a_cold_deployment_registers_its_configured_account_and_serves', async () => {
    // ── the cold start itself ────────────────────────────────────────────────
    // A database in the state `bin/deploy` leaves it: schema applied, nothing
    // written. This request is the first thing that has ever needed the store.
    const cold = freshTenant()
    const before = await root().listTenants()
    expect(await tenantRow(cold)).toBeUndefined()

    const listing = await call('/api/sites', cold)

    // The bug was 503 carrying `No tenant '<id>'.` — the boot guard's own text.
    // Success AND empty: a listing that answered 200 with somebody else's sites
    // would satisfy the status assertion and be a far worse failure.
    expect(listing.status).toBe(200)
    expect(await listing.json()).toEqual([])

    // ── exactly that account, and no other ───────────────────────────────────
    expect(await tenantRow(cold)).toMatchObject({ id: cold, status: 'active' })
    expect((await root().listTenants()).length).toBe(before.length + 1)

    // Nothing in a REQUEST can choose the name or reach a different one: it
    // comes from the deployment's own configuration. A request that tries to
    // name another account registers nothing and is still answered for `cold`.
    const intruder = freshTenant()
    const hijack = await call(`/api/sites?tenant=${intruder}`, cold, {
      headers: { 'x-tenant-id': intruder },
    })
    expect(hijack.status).toBe(200)
    expect(await tenantRow(intruder)).toBeUndefined()

    // ── any route that needs the store, not one privileged route ─────────────
    // The regression guard for having DELETED the second opener: the import
    // route used to carry the only registration in the system. A second, equally
    // fresh account, reached by a route that COPIES A SITE UP rather than reads.
    const viaImport = freshTenant()
    const imported = await call(`/api/import`, viaImport, importBody(`site-${viaImport}`))
    expect(imported.status).toBe(200)
    expect(await tenantRow(viaImport)).toMatchObject({ id: viaImport, status: 'active' })

    // ── it resolves *not yet*, never *no* ────────────────────────────────────
    // Self-healing must not reopen an account somebody closed. `createTenant` is
    // `INSERT OR IGNORE`, so a blind retry would fail anyway — but a refusal
    // that reads as an accident of the insert's flavour is not a decision.
    const closed = freshTenant()
    await root().createTenant({ id: closed, name: closed, status: 'suspended' })

    const refused = await call('/api/sites', closed)
    expect(refused.status).toBe(503)
    expect(await refused.text()).toContain('not active')
    expect(await tenantRow(closed)).toMatchObject({ id: closed, status: 'suspended' })

    // A deployment that names NO account registers nothing at all: there is no
    // name to register, and inventing one would let a misconfigured Worker read
    // and write into whichever account happened to carry it.
    const beforeUnset = await root().listTenants()
    const unset = await call('/api/sites', undefined)
    expect(unset.status).toBe(503)
    expect(await unset.text()).toContain('TENANT_ID is not configured')
    expect((await root().listTenants()).length).toBe(beforeUnset.length)

    // ── it costs nothing once done ───────────────────────────────────────────
    // The registration happens once in a store's life, not once per request.
    // Asserted on the SQL the real database actually executed, because "no write
    // was performed" cannot be observed from a response body.
    const coldSql: string[] = []
    const warmSql: string[] = []
    const paying = freshTenant()

    const first = await call('/api/sites', paying, undefined, recordingDb(env.DB, coldSql))
    expect(first.status).toBe(200)
    const second = await call('/api/sites', paying, undefined, recordingDb(env.DB, warmSql))
    expect(second.status).toBe(200)

    // The cold path registers, exactly once, and looks up either side of it.
    expect(coldSql.filter((s) => REGISTERS.test(s))).toHaveLength(1)
    // The ordinary request performs the SAME single account lookup it always did
    // and writes nothing.
    expect(warmSql.filter((s) => REGISTERS.test(s))).toHaveLength(0)
    expect(warmSql.filter((s) => LOOKS_UP.test(s))).toHaveLength(1)
  })
})
