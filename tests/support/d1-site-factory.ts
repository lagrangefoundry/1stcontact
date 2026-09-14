import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../../tools/generate/src/store/d1r2-store'
import type {
  SiteStoreEnv,
  TenantSiteStore,
} from '../../tools/generate/src/store/d1r2-store'
import type { SiteFixture, SiteSeedOptions } from './site-seed'
import { siteSeed } from './site-seed'

/**
 * The same fixture as `site-factory.ts`, over real D1 and R2 (REQ-143).
 *
 * WHY IT IS A SEPARATE MODULE. `site-factory.ts` opens with `mkdtempSync`, so a
 * workerd suite cannot import it at all — not one symbol, not a type at runtime.
 * What the two must share is the *seed*, and they do: both call `siteSeed`, so
 * the three adapters are compared on the identical site rather than on three
 * hand-written approximations of one.
 *
 * NOTHING HERE IS A DOUBLE. `env.DB` and `env.SITES` are a real D1 database and
 * a real R2 bucket, supplied by `@cloudflare/vitest-pool-workers` inside workerd
 * — the runtime the deployed Worker will use. A test that passes here passes
 * because SQLite executed the SQL and R2 stored the bytes.
 */

/** The bindings the workerd project declares (see `vitest.workers.config.mts`). */
export function storeEnv(): SiteStoreEnv {
  return env as unknown as SiteStoreEnv
}

/**
 * Apply the schema — ONE baseline ([[REQ-190]]).
 *
 * The migration file is imported as text and executed, rather than restated
 * here: a fixture with its own CREATE TABLEs proves the fixture's schema, and
 * would keep passing after the real migration drifted from it.
 *
 * THE LIST USED TO BE NINE ENTRIES IN A DELIBERATE ORDER, and every comment on
 * it explained which later migration repaired something an earlier one had left
 * — `0003` adding the `config` column `0001` created `tenants` without, `0006`
 * having to run after `0005` because `0005` was written against the old column
 * names. D1 cannot alter a primary key in place, so re-keying `sites` the
 * incremental way would have added eight more such rebuilds carrying data that
 * does not exist. `0001`–`0009` are one file now and the ordering problem is
 * gone with them; the list stays a list because migrations landed after it.
 *
 * AND THE SECOND ENTRY IS WHY THIS IS STILL A LIST OF FILES RATHER THAN ONE
 * ([[REQ-231]]). `0002_session_rotation.sql` rebuilds `sessions` into the
 * rotation shape, and it is applied here for the reason every fixture applies
 * the real files: `wrangler d1 migrations apply` will run it against every
 * database this product has, including the fresh ones the baseline already put
 * in that shape. Running only the baseline here would leave the suite unable to
 * notice a second migration that a fresh database cannot survive — which is
 * exactly the failure mode a file of bare `ALTER TABLE ADD COLUMN` would have.
 */
const MIGRATIONS = [
  () => import('../../db/migrations/0001_baseline.sql?raw'),
  () => import('../../db/migrations/0002_session_rotation.sql?raw'),
  // [[REQ-233]] — the Contacts change-feed index, applied here for the reason
  // `0002` is: `wrangler d1 migrations apply` will run it against every database
  // this product has, including the fresh ones the baseline already indexed.
  () => import('../../db/migrations/0003_contact_change_cursor.sql?raw'),
  // [[REQ-240]] — the acceptance state table, applied here for the same reason:
  // the baseline declares it for a fresh database and this file is the half that
  // reaches the one already deployed.
  () => import('../../db/migrations/0004_user_acceptances.sql?raw'),
  // [[REQ-236]] — `sites.slug` retired, `sites.kind` added. Applied here for the
  // same reason as the three above, and this one earns the reason twice over: a
  // fixture that skipped it would build a schema WITH the column the store has
  // stopped writing, so every `createDraft` would fail on a `NOT NULL` the code
  // cannot see — which is precisely the fresh-database case this list exists to
  // keep honest.
  //
  // NUMBERED `0005` AND NOT `0004`. It was written as `0004` and REQ-240 landed
  // its own `0004` first; `wrangler d1 migrations apply` orders by filename, so
  // two files sharing a number is an ordering nobody declared. Renumbering is
  // free here because neither had been applied to a database anyone shares.
  () => import('../../db/migrations/0005_retire_site_slug.sql?raw'),
  // [[REQ-244]] — `asset_grants`, the per-contact download link. Applied here for
  // the same reason the four above are: the baseline declares it for a fresh
  // database and this file is the half that reaches the one already deployed.
  () => import('../../db/migrations/0006_asset_grants.sql?raw'),
]

/**
 * Split a migration into the statements D1 will be handed one at a time.
 *
 * COMMENTS ARE STRIPPED BEFORE THE TERMINATOR IS LOOKED FOR, not after: the
 * migration's prose explains a design and prose contains semicolons, so
 * splitting first cuts a comment in half and feeds SQLite the remainder.
 *
 * AND A SEMICOLON INSIDE `BEGIN ... END` IS NOT A TERMINATOR ([[REQ-195]]). A
 * trigger body is a compound statement carrying its own statements, each ended
 * by a semicolon — so a naive split hands SQLite `CREATE TRIGGER ... BEGIN
 * SELECT RAISE(ABORT, '...')` with no `END`, which is a syntax error, and then
 * a bare `END` after it. `wrangler d1 migrations apply` — the path that runs
 * this file in every real environment — already tracks `BEGIN`/`END` depth, so
 * without this the harness would refuse a migration production accepts, which
 * is the drift a hand-written schema in a test helper exists to avoid.
 */
export function splitStatements(sql: string): string[] {
  const body = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  const statements: string[] = []
  let current = ''
  let depth = 0
  for (const chunk of body.split(';')) {
    current += chunk
    // The keywords are counted on the text accumulated SO FAR, so a `BEGIN`
    // opened before this semicolon keeps the statement open across it. `END`
    // is matched with a word boundary, which `\bEND\b` gives without also
    // matching `APPEND` or a column called `ended_at`.
    const opens = (current.match(/\bBEGIN\b/gi) ?? []).length
    const closes = (current.match(/\bEND\b/gi) ?? []).length
    depth = opens - closes
    if (depth > 0) {
      current += ';'
      continue
    }
    const statement = current.trim()
    if (statement.length > 0) statements.push(statement)
    current = ''
  }
  const tail = current.trim()
  if (tail.length > 0) statements.push(tail)
  return statements
}

/**
 * Run one migration's SQL.
 *
 * IT USED TO BE EXPORTED, so a suite could re-apply a single migration and prove
 * a DATA migration's idempotence ([[REQ-168]]). There are no data migrations
 * left — the baseline seeds no people ([[REQ-190]]) — and no second file to
 * re-apply, so its only caller is `applySchema` below.
 */
async function runMigration(sql: string): Promise<void> {
  const { DB } = storeEnv()
  for (const statement of splitStatements(sql)) await DB.prepare(statement).run()
}

/**
 * Bring this isolate's database to head, and DO NOTHING when it is already there
 * ([[REQ-236]]).
 *
 * THE LIST STOPPED BEING RE-RUNNABLE AND THIS IS WHERE THAT IS ABSORBED.
 * Migrations 0001–0003 are written `IF NOT EXISTS` throughout, so calling this
 * twice was free and several suites do exactly that — one `beforeAll` per
 * `describe`, because storage persists across them inside one file. `0005`
 * cannot be written that way: it DROPS a column, and a second pass then reaches
 * `0001`'s `CREATE UNIQUE INDEX … (tenant_id, slug)` — which `IF NOT EXISTS` no
 * longer skips, because `0005` dropped that index — and fails on a column that
 * is gone. The symptom is a whole suite erroring in setup, which reads like a
 * broken fixture rather than a re-applied one.
 *
 * ASKED OF THE DATABASE RATHER THAN MEMOISED IN A MODULE VARIABLE. A module
 * variable records what THIS isolate did; the question that actually matters is
 * what the database currently HOLDS, and the two come apart the moment the pool
 * rolls storage back between suites. Reading the table's own shape is right
 * under either regime: at head it skips, and on a database that was reset it
 * finds nothing and applies the list from the top.
 */
export async function applySchema(): Promise<void> {
  if (await atHead()) return
  for (const load of MIGRATIONS) await runMigration((await load()).default as string)
}

/**
 * Whether `sites` already has the shape the last migration leaves it in.
 *
 * `kind` IS THE MARKER BECAUSE `0005` — THE LAST FILE IN THE LIST — IS WHAT ADDS IT, so its presence means
 * every statement in the list has run. `PRAGMA table_info` answers on a database
 * with no such table at all — an empty result, not an error — which is what lets
 * one query serve both "already migrated" and "nothing here yet".
 */
async function atHead(): Promise<boolean> {
  const { DB } = storeEnv()
  const columns = await DB.prepare('PRAGMA table_info(sites)').all<{ name: string }>()
  return (columns.results ?? []).some((column) => column.name === 'kind')
}

/** The tenant every fixture belongs to unless a test names another. */
export const DEFAULT_TENANT = 'tenant-default'

/** Register a tenant, so a handle can be taken for it. */
export async function ensureTenant(id = DEFAULT_TENANT, status = 'active'): Promise<void> {
  await d1r2SiteStore(storeEnv()).createTenant({ id, name: id, status })
}

/** A tenant-scoped handle, with the tenant registered first. */
export async function tenantStore(id = DEFAULT_TENANT): Promise<TenantSiteStore> {
  await ensureTenant(id)
  return d1r2SiteStore(storeEnv()).forTenant(id)
}

/**
 * Seed one site straight into a tenant's store and hand back its key
 * ([[REQ-236]]).
 *
 * WHY THIS EXISTS AND WHY IT IS NOT `POST /api/import`. A dozen suites used to
 * open by posting a payload to that route, which was a fine way to create a site
 * while a payload could NAME one. It cannot any more: the route resolves its own
 * target — the receiving business's single site — so two seeds in one tenant are
 * two writes to the same site, and a suite whose cases each expected their own
 * would silently share one. Seeding through the store is both what those suites
 * actually meant and one hop shorter.
 *
 * The suites that are genuinely ABOUT the import route (its rights gate, its
 * builder-changes refusal, its upgrade path) keep posting to it, because the
 * route is the thing under test there.
 */
export async function seedTenantSite(
  tenantId: string,
  options: SiteSeedOptions = {},
): Promise<{ site: string; seed: ReturnType<typeof siteSeed> }> {
  const seed = siteSeed(options)
  const store = await tenantStore(tenantId)
  const site = await store.createDraft()
  await store.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: Object.entries(seed.assets).map(([name, bytes]) => ({ name, bytes })),
  })
  return { site, seed }
}

/** One site in D1 + R2, seeded identically to its filesystem and memory twins. */
export async function makeD1Site(
  options: SiteSeedOptions & { tenantId?: string } = {},
): Promise<SiteFixture> {
  const seed = siteSeed(options)
  const store = await tenantStore(options.tenantId ?? DEFAULT_TENANT)

  // THE KEY THE STORE MINTS, NOT `seed.slug` ([[REQ-236]]). `SiteFixture.slug`
  // is "what this adapter calls the site" and always was — the filesystem twin
  // puts a directory there — so the field is unchanged and its value is now the
  // key, which is what every caller passes straight back into a store verb.
  // `seed.slug` still names the fixture's *content* (it reaches `site.json`'s
  // id and the starter page's prose), which is what makes two fixtures on one
  // tenant tellable apart when a test reads them.
  const site = await store.createDraft()
  // One write, exactly as an import would do it — so the fixture exercises the
  // same path a real migration takes rather than a private back door.
  await store.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: Object.entries(seed.assets).map(([name, bytes]) => ({ name, bytes })),
  })

  return {
    slug: site,
    name: seed.slug,
    store,
    opts: { store, actor: options.actor },
    // No filesystem, and it says so — the same signal the memory fixture gives.
    cwd: null,
    dispose: () => store.forget(site),
  }
}
