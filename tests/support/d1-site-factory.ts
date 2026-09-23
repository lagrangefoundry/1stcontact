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
  // [[REQ-237]] — a business name is unique within the account that owns it.
  // Applied here for the same reason as every file above: `wrangler d1
  // migrations apply` runs it against every database this product has, and a
  // fixture that skipped it would let a suite write two rows the real database
  // would refuse.
  () => import('../../db/migrations/0007_business_name_unique.sql?raw'),
  // [[REQ-238]] — `site_domains`, the host→site mapping. Applied here for the
  // same reason as every file above, and this one is the sharpest case for it:
  // the unique index on `host` is the AUTHORITY that decides a race between two
  // claims, so a fixture that skipped it would let a suite claim one host twice
  // and prove the opposite of what the code does.
  () => import('../../db/migrations/0008_site_domains.sql?raw'),
  // [[BUG-93]] — `asset_grants.instance_id` renamed to `form_handle`, because a
  // grant names a form and a form is a page AND an instance on it. Applied here
  // for the same reason as every file above, and this one is load-bearing for
  // the fixture specifically: the baseline creates the column under its OLD
  // name, so a suite that skipped this file would build a schema whose column
  // the code no longer writes — every `grantFor` failing on a column nobody can
  // see from the code.
  () => import('../../db/migrations/0009_asset_grant_form_handle.sql?raw'),
  // [[REQ-257]] — `zones`, the DNS layer's floor. Applied here for the same
  // reason as every file above, and this one is load-bearing for the same reason
  // `0008` is: the UNIQUE index on `apex` is the AUTHORITY that decides a race
  // between two claims on one domain, so a fixture that skipped it would let a
  // suite record one apex twice and prove the opposite of what the code does.
  () => import('../../db/migrations/0010_zones.sql?raw'),
  // [[REQ-258]] — `site_domains.canonical`, which of a site's hosts is *the*
  // address. Applied here for the same reason as every file above, and this one
  // is load-bearing for the fixture specifically: it ADDS A COLUMN to a table
  // `0008` already created, so a suite that skipped it would build a schema
  // whose column the serving code reads and the fixture's database does not
  // have — every host resolution failing on a column nobody can see from the
  // code, which is exactly `0009`'s case one migration later.
  () => import('../../db/migrations/0011_site_domains_canonical.sql?raw'),
  // [[REQ-259]] — `sending_domains`, the state of the email toggle. Applied here
  // for every reason above, and one of its own: the surface reads this table on
  // every draw, so a suite that skipped it would fail on a missing table in the
  // route that answers *what does this business's domain section say* rather
  // than in the operation that writes it.
  () => import('../../db/migrations/0012_sending_domains.sql?raw'),
  // [[REQ-266]] — `site_revision_claims` and the immutability trigger on
  // `site_revisions`. Applied here for every reason above, and it is the most
  // load-bearing of the lot for this fixture: the store now CLAIMS a revision id
  // before it writes a byte and refuses one already claimed, so a suite that
  // skipped this file would fail every publish on a missing table — and the
  // trigger is the thing the ticket's first UAT asserts, which cannot be
  // asserted against a database that does not carry it.
  () => import('../../db/migrations/0013_revision_immutability.sql?raw'),
  // [[REQ-267]] / [[DOC-54]] §2.4 — the test gutter's `synthetic` / `run_id`
  // columns on the four tables the capture chain writes, and the run registry
  // the inbound marker is validated against. Applied here for the reason every
  // file above is: `wrangler d1 migrations apply` will run it against every
  // database this product has, and a fixture that skipped it would build a
  // schema WITHOUT columns every people read and every timeline read now name —
  // so every one of them would fail on an unknown column, which reads as a query
  // bug and is not one.
  () => import('../../db/migrations/0014_capture_gutter.sql?raw'),
  // [[REQ-267]] — inbound mail's own two: where a business's mail is forwarded
  // to, and the senders it has stopped wanting to triage.
  () => import('../../db/migrations/0015_inbound_mail.sql?raw'),
  // [[REQ-268]] — the two indexes collection reads. Applied here for every reason
  // above; it is the cheapest entry in the list for the fixture (an index changes
  // no result, only how it is found) and the most expensive one to omit from the
  // LIST, because it is what a collection read plans against.
  () => import('../../db/migrations/0016_gutter_collection.sql?raw'),
  // [[REQ-260]] — `dns_changes`, every DNS change and what it takes to undo one.
  // Applied here for every reason above, and one of its own: the undo is a
  // compare-and-swap over a set this table HOLDS, so a suite that skipped it
  // would fail on a missing table in the operation that records a change rather
  // than in the one that reverts it — and the claim the ticket's UATs actually
  // make is about what the second one does with what the first one wrote.
  () => import('../../db/migrations/0017_dns_changes.sql?raw'),
  // [[REQ-235]] — `log_records` and `log_floor`, the raw server-side event store
  // and the floor that tells a reader its window has been pruned. Applied here
  // for every reason above, and one of its own: the Worker's own `fetch` now
  // writes one record per invocation, so a suite that skipped this file would
  // fail on a missing table in EVERY request it made rather than in the one
  // assertion that is about logging.
  () => import('../../db/migrations/0018_activity_log.sql?raw'),
  // [[REQ-292]] — `turn_spend`, one row per measured turn of every conversation.
  // Applied here for every reason above, and one of its own: the chat host now
  // writes a row from the `finally` of EVERY turn it takes, so a suite that
  // skipped this file would fail on a missing table in the prompt route itself
  // rather than in the one assertion that is about spend — except that it would
  // not even do that, because the host swallows a meter failure on purpose. The
  // symptom would be a silently unmetered suite, which is worse.
  () => import('../../db/migrations/0019_turn_spend.sql?raw'),
  // [[REQ-304]] — `site_assets.digest`, an asset's content identity. Applied
  // here for every reason above, and one of its own: the store records a digest
  // on EVERY asset write and reads one back on every question about what a site
  // holds, so a suite that skipped this file would fail on an unknown column in
  // the first `asset add` it made and in every publish, diff and change count
  // thereafter — which reads as a query bug and is not one.
  () => import('../../db/migrations/0020_asset_digest.sql?raw'),
  // [[REQ-306]] — `turn_log`, one row per turn OPENED BEFORE THE TURN. Applied
  // here for every reason above, and one of its own: the prompt route now writes
  // a row before it returns its `Response`, so a suite that skipped this file
  // would fail on a missing table on the critical path of every turn — except
  // that it would not even do that, because the ledger swallows its own failure
  // on purpose. The symptom would be a suite in which nothing is ever recorded
  // as lost, which is indistinguishable from the feature working.
  // NUMBERED 0021 BECAUSE [[REQ-304]] TOOK 0020 while this branch was open, and
  // `wrangler d1 migrations apply` orders by filename: two files sharing a
  // number is an ordering the tool cannot resolve.
  // LAST IN THE LIST, which is what `atHead` below asks about.
  () => import('../../db/migrations/0021_turn_log.sql?raw'),
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
 * Whether the database already holds what the LAST migration leaves behind.
 *
 * IT ASKS ABOUT THE LAST FILE IN THE LIST, WHICHEVER THAT IS — today
 * [[REQ-306]]'s `idx_turn_log_tenant`, the turn ledger's per-tenant read. It used to
 * ask for `sites.kind`, which `0005` adds; once anything came after `0005`, a database
 * at `0005` would have answered "at head" and skipped the rest silently. So
 * this marker MOVES WITH THE LIST: a migration appended below without moving it
 * re-opens exactly that hole.
 *
 * `pragma_table_info` RATHER THAN `sqlite_master`, BECAUSE THE LAST FILE ADDS A
 * COLUMN. An `ALTER TABLE ADD COLUMN` leaves no row in `sqlite_master` to ask
 * about — the table's entry is unchanged — so the marker has to be read from the
 * table's shape. Both forms answer with an empty result rather than an error on
 * a database that has nothing at all, which is what lets one query serve both
 * "already migrated" and "nothing here yet".
 *
 * THE LAST STATEMENT OF THE LAST FILE, and not the first one. `0017` creates a
 * table and then two indexes; asking for the table would answer "at head" for a
 * database that got half way through the file, exactly as asking for the table
 * `0012`'s index guards would have. The marker has to move with the list — a
 * migration appended above without moving it re-opens that hole silently.
 *
 * AND `0014` MAKES THAT SHARPER THAN IT WAS ([[REQ-267]]). Every file up to it
 * was re-runnable or merely wasteful to re-run; that one is `ALTER TABLE ADD
 * COLUMN`, which is an ERROR the second time. So this check is now what stands
 * between a suite calling `applySchema` twice and a hard failure in setup.
 */
async function atHead(): Promise<boolean> {
  const { DB } = storeEnv()
  const row = await DB.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?")
    .bind('idx_turn_log_tenant')
    .first<{ name: string }>()
  return row !== null
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
