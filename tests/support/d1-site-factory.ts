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
 * Apply the schema — EVERY migration, in order.
 *
 * The migration files are imported as text and executed, rather than restated
 * here: a fixture with its own CREATE TABLEs proves the fixture's schema, and
 * would keep passing after the real migration drifted from it.
 *
 * THE LIST IS EXPLICIT (REQ-149). A glob would be tidier and would also be
 * unordered, and `0002` alters a table `0001` creates — so the one property that
 * must hold is the one a glob would leave to chance. Adding a migration means
 * adding a line here, which is a diff a reviewer sees.
 */
const MIGRATIONS = [
  () => import('../../db/migrations/0001_site_store.sql?raw'),
  () => import('../../db/migrations/0002_revisions.sql?raw'),
]

export async function applySchema(): Promise<void> {
  const { DB } = storeEnv()
  for (const load of MIGRATIONS) {
    const sql = (await load()).default as string
    // Comments are stripped BEFORE splitting on the terminator, not after: the
    // migration's prose explains a design and prose contains semicolons, so
    // splitting first cuts a comment in half and feeds SQLite the remainder.
    const statements = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    for (const statement of statements) await DB.prepare(statement).run()
  }
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
