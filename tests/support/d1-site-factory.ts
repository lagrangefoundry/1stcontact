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
 * gone with them; the list stays a list because REQ-192's seed will be the
 * second entry.
 */
const MIGRATIONS = [() => import('../../db/migrations/0001_baseline.sql?raw')]

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

export async function applySchema(): Promise<void> {
  for (const load of MIGRATIONS) await runMigration((await load()).default as string)
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

/** One site in D1 + R2, seeded identically to its filesystem and memory twins. */
export async function makeD1Site(
  options: SiteSeedOptions & { tenantId?: string } = {},
): Promise<SiteFixture> {
  const seed = siteSeed(options)
  const store = await tenantStore(options.tenantId ?? DEFAULT_TENANT)

  await store.createDraft(seed.slug)
  // One write, exactly as an import would do it — so the fixture exercises the
  // same path a real migration takes rather than a private back door.
  await store.write(seed.slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: Object.entries(seed.assets).map(([name, bytes]) => ({ name, bytes })),
  })

  return {
    slug: seed.slug,
    store,
    opts: { store, actor: options.actor },
    // No filesystem, and it says so — the same signal the memory fixture gives.
    cwd: null,
    dispose: () => store.forget(seed.slug),
  }
}
