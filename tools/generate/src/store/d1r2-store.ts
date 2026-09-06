import { assembleSite } from './assemble'
import type { LoadResult } from './assemble'
import { contentTypeOf } from './content-type'
import { newId } from './ids'
import type { ChangeSlice, JournalRecord } from './journal-model'
import { JOURNAL_WINDOW } from './journal-model'
import type { RevisionContent, RevisionEntry, StoredSnapshot } from './revision-model'
import {
  PUBLISHED_ROOT,
  publishedOutPrefix,
  publishedSourcePrefix,
} from './revision-model'
import type {
  DraftSnapshot,
  SiteStore,
  SiteWrite,
  StoredAsset,
  StoredPage,
} from './site-store'
import { StoreConflictError } from './site-store'

/**
 * {@link SiteStore} over Cloudflare D1 and R2 — REQ-143, DOC-12 §7 phase 2.
 *
 * THE SPLIT, AND WHY IT FALLS HERE. Page definitions and `site.json` are small,
 * structured and transactional, so they are D1 rows. Asset *bytes* are binary
 * and never belong in a database, so they are R2 objects and D1 holds only the
 * pointer. Revision snapshots stay in R2 too, where `1c deploy` already writes
 * them. This closes DOC-5's standing "D1, R2, or both?" as *both, split by kind*.
 *
 * WHAT THIS ADAPTER BUYS THAT THE FILESYSTEM ONE NEVER HAD. REQ-142 made a
 * multi-file change reach the store as ONE {@link SiteWrite}, and said plainly
 * that the filesystem adapter would keep applying it as a sequence of
 * `writeFileSync` calls. Here that same call becomes one `db.batch()`, which D1
 * runs in a transaction: `site.json` plus N pages either all land or none do.
 * That is a genuine improvement over the file-backed store, not parity — and it
 * arrives without a single caller changing, which is what the one-verb shape of
 * `SiteWrite` was for.
 *
 * TENANCY IS BOUND INTO THE HANDLE, NOT PASSED AT CALL SITES (DOC-10 §4.1). The
 * tenant is the account and is the hard information barrier; a site is an object
 * *inside* a tenant rather than a tenant of its own. So {@link d1r2SiteStore}
 * hands back a root that can do exactly one thing — {@link SiteStoreRoot.forTenant}
 * — and every verb on the resulting handle carries that tenant into its SQL
 * automatically. Reaching another account's data is not a query someone forgot
 * to filter; it requires deliberately constructing a second handle, which is
 * visible in a diff. An unknown or inactive tenant is refused at construction
 * with {@link UnknownTenantError}, so there is no such thing as a handle that
 * silently reads nothing.
 *
 * THE BARRIER MOVED ONE LEVEL IN AND DID NOT WEAKEN ([[REQ-190]]). The child
 * tables no longer carry `tenant_id` — a site's own row is the only place its
 * business is recorded, which is what makes moving a site an UPDATE of one
 * column rather than a five-table rewrite plus an object copy. What the handle
 * resolves is slug -> `sites.id`, under `WHERE tenant_id = ?`, and every verb
 * below goes through that resolution. A site key is 128 random bits and is
 * obtainable ONLY through that business-scoped lookup, so the property is the
 * same one stated about a key instead of about a filter: reaching another
 * business's rows needs a value this handle cannot produce.
 *
 * IT IS A REVISION STORE NOW (REQ-149). Metadata is D1 rows (`site_revisions`);
 * the frozen definition and the rendered output are R2 objects under
 * `sites/<slug>/rev/<NNNN>/`, which is the layout `public-site` already reads.
 * There is NO manifest object any more: D1 is the only record, and the live
 * revision is derived as the highest id rather than stored anywhere (DOC-12 §4).
 *
 * THE PUBLISHED ADDRESS IS THE SITE'S KEY ([[REQ-190]]). `/site/<slug>/` used to
 * be the public grammar, which meant `public-site` had to resolve a site from a
 * name with no business attached — so the slug had to be unique across the whole
 * deployment, claimed first-come in a `published_sites` table, and the customer
 * who published `home` second was told the name was taken. That refusal is an
 * existence oracle across the barrier, and the constraint behind it made the
 * slug a key: a *chosen* name doing a key's job.
 *
 * So the address is `/site/<siteId>/` — the same unguessable value the joins
 * use, which is what makes one column enough. The slug becomes what the rule
 * says it is: an attribute, unique inside its own business, free to change. The
 * claim table and its refusal are DELETED rather than relaxed, because with an
 * opaque address there is nothing left to claim. Per-business hostnames (DOC-12
 * §9) remain the readable answer and remain purely additive.
 */

/** The two bindings this adapter needs, named as the Workers declare them. */
export interface SiteStoreEnv {
  /** The D1 database holding tenants, sites, pages, asset metadata and changes. */
  DB: D1Database
  /** The R2 bucket holding asset bytes (and, already, deployed snapshots). */
  SITES: R2Bucket
}

/** A tenant as the registry holds it. */
export interface TenantRecord {
  id: string
  name: string
  status: string
}

/**
 * A handle was asked for against a tenant that does not exist, or is not active.
 *
 * Typed, and thrown at construction rather than tolerated, because the
 * alternative — a handle that reads nothing and writes into a tenant no one owns
 * — looks identical to "this account has no sites yet" at every call site that
 * would ever see it.
 */
export class UnknownTenantError extends Error {
  readonly name = 'UnknownTenantError'
  readonly tenantId: string
  /**
   * WHICH refusal this is, and the distinction is load-bearing (BUG-36).
   *
   * `unknown` means there is no row — a state a fresh database is in for every
   * tenant, including the one the deployment is configured to serve, and one a
   * caller that owns the configuration may legitimately resolve by registering
   * it. `inactive` means a row exists and someone deactivated it, which is a
   * decision no caller may undo by retrying. Collapsing the two into one
   * `UnknownTenantError` left the bootstrap unable to tell "not yet" from
   * "no", and a bootstrap that cannot tell them apart must either refuse a
   * fresh deployment or reopen a closed account.
   */
  readonly reason: 'unknown' | 'inactive'

  constructor(tenantId: string, reason: 'unknown' | 'inactive') {
    super(
      reason === 'unknown'
        ? `No tenant '${tenantId}'.`
        : `Tenant '${tenantId}' is not active.`,
    )
    this.tenantId = tenantId
    this.reason = reason
  }
}

/** The store before a tenant is chosen. It can do nothing else until one is. */
export interface SiteStoreRoot {
  /**
   * A store scoped to one tenant, for the lifetime of the handle.
   *
   * Async because the tenant is *checked* here — that check is the whole reason
   * the barrier holds, and deferring it to the first query would move the
   * failure to somewhere it reads as an empty result.
   */
  forTenant(tenantId: string): Promise<TenantSiteStore>
  /** Register a tenant. Idempotent on `id`. */
  createTenant(tenant: { id: string; name: string; status?: string }): Promise<void>
  /** Every registered tenant, by id. */
  listTenants(): Promise<TenantRecord[]>
}

/** A {@link SiteStore} bound to one tenant, plus the verbs that make a site exist. */
export interface TenantSiteStore extends SiteStore {
  /** Which account this handle can see. Never inferred from a slug. */
  readonly tenantId: string
  /**
   * Make an empty draft exist, so `write` has something to write to.
   *
   * The port has no create verb because no *command* creates a site — `1c new`
   * does, and it is `commands.ts`'s. This is the adapter's own admin surface,
   * the counterpart of the in-memory adapter's `seed`.
   *
   * RETURNS WHETHER IT CREATED ONE (BUG-51). The insert is `INSERT OR IGNORE`,
   * so this has always been safe on a slug that exists — and every caller then
   * followed it with a `write` that was not, which is how a starter scaffold
   * came to replace a built site. The information needed to stop that was
   * already here and was being thrown away. A caller that only wants to seed an
   * empty site now has one call to branch on, rather than a read-then-write it
   * has to remember to perform.
   */
  createDraft(slug: string): Promise<boolean>
  /**
   * The site's KEY, or `null` when this business holds no site by that slug.
   *
   * The one place a caller may learn a site's id, and the reason the barrier
   * still holds after the child tables stopped carrying a business ([[REQ-190]]):
   * the lookup is scoped to this handle's tenant, so a key for another
   * business's site is not something any caller can obtain from here.
   *
   * Callers need it because the key is the PUBLIC ADDRESS — `/site/<siteId>/` —
   * so anything building a published URL asks for it rather than passing the
   * slug it happens to hold.
   */
  siteKey(slug: string): Promise<string | null>
  /** Drop a site and its assets entirely, so `hasDraft` goes back to false. */
  forget(slug: string): Promise<void>
  /** The slugs this tenant holds a draft for, sorted. */
  slugs(): Promise<string[]>
  /**
   * Every site key this business owns — the erasure enumeration ([[REQ-190]]).
   *
   * WHAT IT IS FOR. A site's objects live under `draft/<siteId>/` and
   * `sites/<siteId>/rev/…`, with no business in either prefix, which is what
   * makes moving a site copy nothing. The cost of that is that a business's
   * objects are no longer under one prefix, so the [[DOC-37]] erasure path
   * cannot be a single sweep: it reads these keys and deletes under each, then
   * deletes the prefixes that ARE business-owned — `t/<tenant>/blob/`,
   * `t/<tenant>/ref/` and `kb/<tenant>/`, where blobs and knowledge belong to
   * the business rather than to any site.
   *
   * Separate from {@link slugs} deliberately. A slug is what the operator calls
   * a site and is the wrong thing to build a key from; this returns what the
   * keys are actually made of, and nothing displays it.
   */
  siteKeys(): Promise<string[]>
}

/**
 * The assembled draft, memoised per ISOLATE and keyed by the site's key — BUG-37.
 *
 * WHAT THIS IS FOR. `PreviewRenderer.file()` calls `loadDraft` on EVERY request,
 * before it consults its own render cache, and that ordering is deliberate: the
 * stamp check has to be a store read or a stale render could be served. So
 * `assembleSite` — which is `validateSite` over the whole definition — ran once
 * per preview byte. Measured in workerd against the real `xgd` site that is
 * 72-89ms of the ~78ms a preview request costs, against 2-3ms of D1 I/O and
 * 1-4ms of actual rendering. It was ~95% of the request, and no cache in the
 * previous design could avoid it.
 *
 * `version` IS THE INVALIDATION KEY, AND IT IS STILL READ PER REQUEST. `siteRow`
 * runs on every `loadDraft` (~1ms, primary-key lookup) and its `version` is
 * compared before the entry is used, so currency is proven by a live read rather
 * than assumed from a timer. What the hit skips is `readPages` + `assembleSite`.
 * Every draft mutation ends with `UPDATE sites SET version = version + 1`
 * — including asset writes, which `assembleSite` consumes as `assetFiles` — so
 * nothing that changes the assembled value leaves the version still. Because the
 * check is a D1 read rather than isolate state, a write from ANOTHER isolate or
 * another process (`bin/publish` from a laptop) invalidates this correctly too.
 *
 * IT CACHES DATA, NEVER A HANDLE, and that is what makes it safe where the
 * router's `PREVIEWS` WeakMap is not. A cached `PreviewRenderer` would hold the
 * store handle it was built with and read through a tenant check that predates
 * the request — the staleness `storeFor` refuses. Nothing here outlives a tenant
 * check: `forTenant` still runs per request, and a deactivated tenant is still
 * turned away before this map is ever reached.
 *
 * BOUNDED BY CONSTRUCTION. Keyed by the SITE'S OWN KEY and REPLACED when the
 * version moves, rather than keyed by version and accumulated — so it holds at
 * most one entry per site and cannot grow with edit count. That distinction is
 * the whole reason this is not itself a leak.
 *
 * THE KEY USED TO BE `(tenantId, slug)` and is now `sites.id` ([[REQ-190]]),
 * which removes the composition rather than changing it: a site key is globally
 * unique by construction, so there is no pair to join and no separator to get
 * wrong. It also survives a rename and a move, which the old key could not — a
 * memo keyed by a name would have gone stale the moment the name changed.
 */
const ASSEMBLED = new Map<string, { version: number; result: LoadResult }>()

/**
 * Drop a site's memo. For tests that need a cold assemble, and for `forget`,
 * which makes the cached value describe a site that no longer exists.
 */
export function resetAssembledCache(): void {
  ASSEMBLED.clear()
}

/** JSON, as every definition column holds it. */
function encode(value: unknown): string {
  return JSON.stringify(value)
}

function decode<T>(text: string): T {
  return JSON.parse(text) as T
}

/**
 * Names that must never reach a key.
 *
 * The filesystem adapter confines `readAsset` to the assets root so a `..` can
 * never climb out of it. R2 has no directories to climb, but a name carrying a
 * separator would still produce a key that a *later* listing or a rendered tree
 * would interpret as one — so the same names are refused here, and the answer is
 * the same `null` rather than a different failure mode per adapter.
 */
function isUnsafeName(name: string): boolean {
  return name.includes('/') || name.includes('\\') || name === '..' || name.startsWith('../')
}

/** One revision as `site_revisions` holds it. */
interface RevisionRow {
  id: number
  published_at: string
  published_by: string | null
  message: string
  based_on: number | null
  changes: string
  sha: string
}

function rowToRevision(row: RevisionRow): RevisionEntry {
  return {
    id: row.id,
    publishedAt: row.published_at,
    by: row.published_by,
    message: row.message,
    basedOn: row.based_on,
    changes: decode<RevisionEntry['changes']>(row.changes),
    sha: row.sha,
  }
}

/** Put UTF-8 text, typed. R2 stores bytes; the content type is metadata. */
async function putText(
  bucket: R2Bucket,
  key: string,
  body: string,
  contentType: string,
): Promise<void> {
  await bucket.put(key, new TextEncoder().encode(body) as unknown as ArrayBuffer, {
    httpMetadata: { contentType },
  })
}

/**
 * Every key under `prefix`, following the cursor.
 *
 * R2 truncates a listing, so a single `list()` would silently lose a page or an
 * asset from a large revision — and the loss would show up as a checkout that
 * quietly dropped files rather than as an error.
 */
async function listKeys(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const keys: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor })
    for (const object of page.objects) keys.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return keys
}

export function d1r2SiteStore(env: SiteStoreEnv): SiteStoreRoot {
  const { DB, SITES } = env

  return {
    async createTenant(tenant) {
      await DB.prepare(
        'INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES (?, ?, ?, ?)',
      )
        .bind(tenant.id, tenant.name, tenant.status ?? 'active', new Date().toISOString())
        .run()
    },

    async listTenants() {
      const { results } = await DB.prepare(
        'SELECT id, name, status FROM tenants ORDER BY id',
      ).all<TenantRecord>()
      return results ?? []
    },

    async forTenant(tenantId) {
      const row = await DB.prepare('SELECT id, name, status FROM tenants WHERE id = ?')
        .bind(tenantId)
        .first<TenantRecord>()
      if (!row) throw new UnknownTenantError(tenantId, 'unknown')
      if (row.status !== 'active') throw new UnknownTenantError(tenantId, 'inactive')
      return tenantStore(env, tenantId)
    },
  }
}
/**
 * Every verb below resolves its site through `tenantId`. That is not a
 * convention a reader has to trust: the value is captured here, once, no verb
 * takes a tenant argument, and the ONLY way a site key enters this closure is
 * {@link siteIdOf}, whose WHERE clause carries it.
 *
 * WHAT REPLACED "TENANT IN EVERY QUERY" ([[REQ-190]]). Every statement used to
 * filter `tenant_id = ? AND slug = ?`, which put the business in twenty-two
 * places and the site's *name* in twenty-two more. Now one lookup turns the
 * slug into the site's key and the rest of the SQL names only that. The
 * isolation argument is unchanged in strength and shorter to make: a key is 128
 * random bits, it is minted by `createDraft` and read by `siteIdOf`, and both
 * are inside a business-scoped statement.
 *
 * THE PRICE IS ONE ROUND-TRIP, AND IT IS NOT MEMOISED. `sites` is reached by a
 * unique index, so the lookup is the cheapest read D1 does — and a memo would
 * have to be invalidated by `createDraft` and `forget`, which is exactly the
 * kind of cache whose staleness reads as data belonging to a site that no longer
 * exists. The one hot path, `loadDraft`, resolves the row it already had to read
 * and passes the key down, so it costs nothing there.
 */
function tenantStore(env: SiteStoreEnv, tenantId: string): TenantSiteStore {
  const { DB, SITES } = env

  /**
   * The R2 prefix holding one site's draft: `draft/<siteId>/`.
   *
   * NO BUSINESS IN IT, and that is what makes a move copy nothing ([[REQ-190]]).
   * It used to be `draft/<tenant>/<slug>/`, so a site carried both the name it
   * might be renamed away from and the business it might be moved out of, in
   * every object key it owned. Erasure ([[DOC-37]]) reaches these objects by
   * enumerating the business's site ids and deleting under each — see
   * {@link TenantSiteStore.siteKeys} — rather than by one prefix sweep.
   */
  const draftPrefix = (siteId: string): string => `draft/${siteId}/`

  /** The R2 key for one draft asset. */
  const assetKey = (siteId: string, name: string): string =>
    `${draftPrefix(siteId)}assets/${name}`

  /**
   * The site row, keyed by the slug this business knows it as.
   *
   * `id` comes back with it because almost every caller needs both, and reading
   * them separately would be two round-trips for one row.
   */
  const siteRow = (
    slug: string,
  ): Promise<{
    id: string
    site_json: string | null
    version: number
    counter: number
  } | null> =>
    DB.prepare(
      'SELECT id, site_json, version, counter FROM sites WHERE tenant_id = ? AND slug = ?',
    )
      .bind(tenantId, slug)
      .first<{ id: string; site_json: string | null; version: number; counter: number }>()

  /** The site's key alone — the business-scoped lookup the barrier rests on. */
  const siteIdOf = async (slug: string): Promise<string | null> => {
    const row = await DB.prepare('SELECT id FROM sites WHERE tenant_id = ? AND slug = ?')
      .bind(tenantId, slug)
      .first<{ id: string }>()
    return row?.id ?? null
  }

  const assetNames = async (siteId: string): Promise<string[]> => {
    const { results } = await DB.prepare(
      'SELECT name FROM site_assets WHERE site_id = ? ORDER BY name',
    )
      .bind(siteId)
      .all<{ name: string }>()
    return (results ?? []).map((r) => r.name)
  }

  const readPagesOf = async (siteId: string): Promise<StoredPage[]> => {
    const { results } = await DB.prepare(
      'SELECT name, page FROM site_pages WHERE site_id = ? ORDER BY name',
    )
      .bind(siteId)
      .all<{ name: string; page: string }>()
    return (results ?? []).map((r) => ({
      name: r.name,
      page: decode<Record<string, unknown>>(r.page),
    }))
  }

  return {
    tenantId,

    async siteKey(slug) {
      return siteIdOf(slug)
    },

    async createDraft(slug) {
      const now = new Date().toISOString()
      // THE KEY IS MINTED HERE, which is why `newId` had to move down into the
      // store ([[REQ-190]]): a site comes into existence at this statement and
      // nowhere else, so this is the only place its key can be decided.
      //
      // `meta.changes` IS THE ANSWER, and it is D1's own count of rows the
      // statement wrote — 1 when the insert landed, 0 when `OR IGNORE` swallowed
      // it. Reading the row back instead would be a second round-trip and a
      // race: another writer could create the site between the check and the
      // insert, and the caller would be told it created something it did not.
      //
      // `OR IGNORE` STILL SWALLOWS THE DUPLICATE, but the constraint it fires on
      // is now `idx_sites_tenant_slug` rather than the primary key. That is the
      // same promise made about the right thing: a business may hold one site
      // per slug, and the id it would have been given is discarded unused.
      const { meta } = await DB.prepare(
        'INSERT OR IGNORE INTO sites ' +
          '(id, tenant_id, slug, site_json, version, counter, created_at, updated_at) ' +
          'VALUES (?, ?, ?, NULL, 0, 0, ?, ?)',
      )
        .bind(newId('site'), tenantId, slug, now, now)
        .run()
      return meta.changes > 0
    },

    async forget(slug) {
      const siteId = await siteIdOf(slug)
      if (siteId === null) return
      // BUG-37 — the memo goes first. A site recreated under the same slug is a
      // NEW key now, so a stale entry could not be mistaken for it the way it
      // could when the memo was keyed by name — but the entry would still leak,
      // and dropping it is the same one line.
      ASSEMBLED.delete(siteId)
      // R2 first: an orphaned object is invisible and costs storage, whereas an
      // asset row pointing at bytes that are already gone would read back as a
      // present asset with no content.
      for (const key of await listKeys(SITES, draftPrefix(siteId))) await SITES.delete(key)
      // The child tables cascade from `sites` (see the baseline), but D1 only
      // enforces that with foreign keys on, so they are deleted explicitly rather
      // than assumed.
      const published = await listKeys(SITES, `${PUBLISHED_ROOT}/${siteId}/`)
      for (const key of published) await SITES.delete(key)
      await DB.batch([
        DB.prepare('DELETE FROM site_changes WHERE site_id = ?').bind(siteId),
        DB.prepare('DELETE FROM site_assets WHERE site_id = ?').bind(siteId),
        DB.prepare('DELETE FROM site_pages WHERE site_id = ?').bind(siteId),
        DB.prepare('DELETE FROM site_revisions WHERE site_id = ?').bind(siteId),
        // Scoped to this tenant as well as to the key, so the statement reads as
        // what it is: a handle may only drop a site of its own business, even
        // holding a key it could not otherwise have obtained.
        DB.prepare('DELETE FROM sites WHERE id = ? AND tenant_id = ?').bind(siteId, tenantId),
      ])
    },

    async slugs() {
      const { results } = await DB.prepare(
        'SELECT slug FROM sites WHERE tenant_id = ? ORDER BY slug',
      )
        .bind(tenantId)
        .all<{ slug: string }>()
      return (results ?? []).map((r) => r.slug)
    },

    async siteKeys() {
      const { results } = await DB.prepare(
        'SELECT id FROM sites WHERE tenant_id = ? ORDER BY id',
      )
        .bind(tenantId)
        .all<{ id: string }>()
      return (results ?? []).map((r) => r.id)
    },

    async hasDraft(slug) {
      return (await siteIdOf(slug)) !== null
    },

    async readSiteJson(slug) {
      const row = await siteRow(slug)
      return row?.site_json ? decode<Record<string, unknown>>(row.site_json) : null
    },

    async readPages(slug) {
      const siteId = await siteIdOf(slug)
      if (siteId === null) return []
      return readPagesOf(siteId)
    },

    async write(slug, change: SiteWrite) {
      const row = await siteRow(slug)
      if (!row) throw new Error(`No site '${slug}' in this store.`)
      const siteId = row.id

      // NOTE what is deliberately NOT here: a version check against `row`. It
      // would be two round-trips away from the batch, so a writer could still
      // slip between them — it would refuse the easy cases and leave the hard
      // one open, which is the worst of both. The ONLY gate is the guard
      // statement inside the transaction below. That also makes the atomicity
      // claim testable: every refusal really does execute its writes and really
      // is rolled back, rather than being turned away before the batch is sent.

      // R2 is written OUTSIDE the transaction, because it has none to join.
      // Bytes first, metadata second: an object with no row is invisible and
      // costs storage, whereas a row with no object is an asset that lists and
      // then 404s. Neither ordering is atomic across the two stores — that is a
      // property of R2, not a shortcut taken here — so the failure mode is
      // chosen rather than left to chance.
      for (const { name, bytes } of change.assets ?? []) {
        if (isUnsafeName(name)) continue
        await SITES.put(assetKey(siteId, name), bytes as unknown as ArrayBuffer, {
          httpMetadata: { contentType: contentTypeOf(name) },
        })
      }

      const now = new Date().toISOString()
      const statements: D1PreparedStatement[] = []

      if (change.siteJson !== undefined) {
        statements.push(
          DB.prepare('UPDATE sites SET site_json = ? WHERE id = ?').bind(
            encode(change.siteJson),
            siteId,
          ),
        )
      }
      for (const { name, page } of change.pages ?? []) {
        statements.push(
          DB.prepare(
            'INSERT INTO site_pages (site_id, name, page) VALUES (?, ?, ?) ' +
              'ON CONFLICT (site_id, name) DO UPDATE SET page = excluded.page',
          ).bind(siteId, name, encode(page)),
        )
      }
      for (const name of change.removePages ?? []) {
        statements.push(
          DB.prepare('DELETE FROM site_pages WHERE site_id = ? AND name = ?').bind(siteId, name),
        )
      }
      for (const { name, bytes } of change.assets ?? []) {
        if (isUnsafeName(name)) continue
        statements.push(
          DB.prepare(
            'INSERT INTO site_assets (site_id, name, r2_key, content_type, size) ' +
              'VALUES (?, ?, ?, ?, ?) ON CONFLICT (site_id, name) DO UPDATE SET ' +
              'r2_key = excluded.r2_key, content_type = excluded.content_type, size = excluded.size',
          ).bind(siteId, name, assetKey(siteId, name), contentTypeOf(name), bytes.byteLength),
        )
      }
      for (const name of change.removeAssets ?? []) {
        statements.push(
          DB.prepare('DELETE FROM site_assets WHERE site_id = ? AND name = ?').bind(siteId, name),
        )
      }

      if (change.expect !== undefined) {
        // THE COMPARE-AND-SET, and it is deliberately the second-to-last
        // statement rather than the first.
        //
        // D1 runs a `batch()` in one transaction and rolls the whole thing back
        // if any statement throws. So the way to make a condition abort a batch
        // is to make the failing case throw — and the way to make a SELECT
        // throw is to insert what it finds into a table that already holds it.
        // When the version still matches, the SELECT returns no rows and this is
        // a no-op; when it does not, it re-inserts the site's own primary key,
        // SQLite refuses, and every statement above is undone.
        //
        // Placing it AFTER the writes is what makes the atomicity claim testable
        // through the public API: the page writes really do execute and really
        // are rolled back, rather than never running because a guard at the top
        // aborted first.
        statements.push(
          DB.prepare(
            'INSERT INTO sites ' +
              '(id, tenant_id, slug, site_json, version, counter, base_revision, created_at, updated_at) ' +
              'SELECT id, tenant_id, slug, site_json, version, counter, base_revision, created_at, updated_at ' +
              'FROM sites WHERE id = ? AND version <> ?',
          ).bind(siteId, change.expect),
        )
      }

      statements.push(
        DB.prepare('UPDATE sites SET version = version + 1, updated_at = ? WHERE id = ?').bind(
          now,
          siteId,
        ),
      )

      try {
        await DB.batch(statements)
      } catch (err) {
        if (change.expect !== undefined) {
          // The guard fired (or something else did while a guard was in play).
          // Either way the transaction rolled back, and the honest report is the
          // version the site actually holds now.
          const current = await siteRow(slug)
          throw new StoreConflictError(slug, change.expect, current?.version ?? null)
        }
        throw err
      }
    },

    async listAssets(slug) {
      const siteId = await siteIdOf(slug)
      if (siteId === null) return []
      return assetNames(siteId)
    },

    async readAsset(slug, name) {
      if (isUnsafeName(name)) return null
      const siteId = await siteIdOf(slug)
      if (siteId === null) return null
      const row = await DB.prepare(
        'SELECT r2_key FROM site_assets WHERE site_id = ? AND name = ?',
      )
        .bind(siteId, name)
        .first<{ r2_key: string }>()
      if (!row) return null
      const object = await SITES.get(row.r2_key)
      if (!object) return null
      return new Uint8Array(await object.arrayBuffer())
    },

    async counter(slug) {
      return (await siteRow(slug))?.counter ?? 0
    },

    async appendChange(slug, entry) {
      const row = await siteRow(slug)
      // Journalling never fails a write (see `journal.ts`): a site this store
      // does not hold reports the counter unmoved rather than throwing.
      if (!row) return 0
      const at = row.counter + 1
      const record: JournalRecord = { ...entry, at, ts: entry.ts ?? new Date().toISOString() }
      await DB.batch([
        DB.prepare('INSERT INTO site_changes (site_id, at, record) VALUES (?, ?, ?)').bind(
          row.id,
          at,
          encode(record),
        ),
        DB.prepare('UPDATE sites SET counter = ? WHERE id = ?').bind(at, row.id),
        // The window, enforced by deleting what aged out rather than by
        // rewriting a bounded blob — the arithmetic is `nextJournal`'s
        // `slice(-JOURNAL_WINDOW)`, expressed as the rows it would have dropped.
        DB.prepare('DELETE FROM site_changes WHERE site_id = ? AND at <= ?').bind(
          row.id,
          at - JOURNAL_WINDOW,
        ),
      ])
      return at
    },

    async changesSince(slug, since): Promise<ChangeSlice> {
      const row = await siteRow(slug)
      const counter = row?.counter ?? 0
      const from =
        typeof since === 'number' && Number.isFinite(since) ? Math.max(0, Math.trunc(since)) : 0
      const { results } = row
        ? await DB.prepare('SELECT at, record FROM site_changes WHERE site_id = ? ORDER BY at')
            .bind(row.id)
            .all<{ at: number; record: string }>()
        : { results: [] as { at: number; record: string }[] }
      const retained = results ?? []
      const changes = retained.filter((r) => r.at > from).map((r) => decode<JournalRecord>(r.record))
      // `sliceSince`'s rule, restated over rows: the oldest counter the window
      // can still speak for, or "the next write" when it holds nothing.
      const earliest = retained.length ? retained[0].at : counter + 1
      return { since: from, now: counter, truncated: earliest > from + 1, changes }
    },

    // -- revisions (REQ-149) -------------------------------------------------

    async revisions(slug): Promise<RevisionEntry[]> {
      const siteId = await siteIdOf(slug)
      if (siteId === null) return []
      const { results } = await DB.prepare(
        'SELECT id, published_at, published_by, message, based_on, changes, sha ' +
          'FROM site_revisions WHERE site_id = ? ORDER BY id',
      )
        .bind(siteId)
        .all<RevisionRow>()
      return (results ?? []).map(rowToRevision)
    },

    async writeRevision(slug, entry: RevisionEntry, content: RevisionContent) {
      // THE SITE'S KEY IS RESOLVED FIRST, before a single byte is written, and it
      // is what every key below is built from. There is no claim to make any more
      // ([[REQ-190]]): the published address IS this key, so no other business
      // can be publishing to it and there is nothing to be refused.
      const siteId = await siteIdOf(slug)
      if (siteId === null) throw new Error(`No site '${slug}' in this store.`)

      const source = publishedSourcePrefix(siteId, entry.id)
      const out = publishedOutPrefix(siteId, entry.id)

      // `source/` travels with `out/`, so what lands is a complete DOC-12
      // revision rather than only its render. D1 holds the MUTABLE draft; this is
      // the only copy of what the definition looked like at revision N, which is
      // what makes a checkout possible at all.
      if (content.source.siteJson !== null) {
        await putText(SITES, `${source}/site.json`, JSON.stringify(content.source.siteJson, null, 2), 'application/json')
      }
      for (const { name, page } of content.source.pages) {
        await putText(SITES, `${source}/pages/${name}`, JSON.stringify(page, null, 2), 'application/json')
      }
      for (const { name, bytes } of content.source.assets) {
        if (isUnsafeName(name)) continue
        await SITES.put(`${source}/assets/${name}`, bytes as unknown as ArrayBuffer, {
          httpMetadata: { contentType: contentTypeOf(name) },
        })
      }

      for (const [rel, text] of content.out) {
        await putText(SITES, `${out}/${rel}`, text, contentTypeOf(rel))
      }
      // The rendered tree carries the assets it references, exactly as the
      // filesystem writer copies `assets/` through — a published page whose
      // images resolved only while the draft still held them would be a site
      // that decays.
      for (const { name, bytes } of content.source.assets) {
        if (isUnsafeName(name)) continue
        await SITES.put(`${out}/assets/${name}`, bytes as unknown as ArrayBuffer, {
          httpMetadata: { contentType: contentTypeOf(name) },
        })
      }

      // LAST. The row is what makes the revision exist — `revisions()` reads it
      // and `liveRevisionOf` derives live from it — so writing it only after
      // every object has landed means the log can never name a revision that
      // serves a 404.
      await DB.prepare(
        'INSERT INTO site_revisions ' +
          '(site_id, id, published_at, published_by, message, based_on, changes, sha) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(
          siteId,
          entry.id,
          entry.publishedAt,
          entry.by,
          entry.message,
          entry.basedOn,
          encode(entry.changes),
          entry.sha,
        )
        .run()
    },

    async readRevision(slug, id): Promise<StoredSnapshot | null> {
      const siteId = await siteIdOf(slug)
      if (siteId === null) return null
      const row = await DB.prepare(
        'SELECT id FROM site_revisions WHERE site_id = ? AND id = ?',
      )
        .bind(siteId, id)
        .first<{ id: number }>()
      // The ROW vouches for the revision, never the bucket's key space. An
      // interrupted publish can leave objects behind; without a row they are
      // unreachable rather than quietly readable as a revision nobody finished.
      if (!row) return null

      const prefix = publishedSourcePrefix(siteId, id)
      const siteJsonObject = await SITES.get(`${prefix}/site.json`)
      const siteJson = siteJsonObject
        ? decode<Record<string, unknown>>(await siteJsonObject.text())
        : null

      const pages: StoredPage[] = []
      for (const key of await listKeys(SITES, `${prefix}/pages/`)) {
        const object = await SITES.get(key)
        if (!object) continue
        pages.push({
          name: key.slice(`${prefix}/pages/`.length),
          page: decode<Record<string, unknown>>(await object.text()),
        })
      }
      pages.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

      const assets: StoredAsset[] = []
      for (const key of await listKeys(SITES, `${prefix}/assets/`)) {
        const object = await SITES.get(key)
        if (!object) continue
        assets.push({
          name: key.slice(`${prefix}/assets/`.length),
          bytes: new Uint8Array(await object.arrayBuffer()),
        })
      }
      assets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

      return { siteJson, pages, assets }
    },

    async draftBase(slug) {
      const row = await DB.prepare(
        'SELECT base_revision FROM sites WHERE tenant_id = ? AND slug = ?',
      )
        .bind(tenantId, slug)
        .first<{ base_revision: number | null }>()
      return row?.base_revision ?? null
    },

    async setDraftBase(slug, id) {
      await DB.prepare('UPDATE sites SET base_revision = ? WHERE tenant_id = ? AND slug = ?')
        .bind(id, tenantId, slug)
        .run()
    },

    async version(slug) {
      return (await siteRow(slug))?.version ?? null
    },

    async loadDraft(slug): Promise<DraftSnapshot | null> {
      const row = await siteRow(slug)
      if (!row) return null

      // BUG-37 — the memo, checked against the version this request just read.
      const hit = ASSEMBLED.get(row.id)
      if (hit && hit.version === row.version) return { result: hit.result, stamp: `d1:${row.version}` }

      const pages = await readPagesOf(row.id)
      const result = assembleSite({
        slug,
        // Descriptive only — no request-time path reads it (see `LoadedSite`).
        sourceDir: `d1:${row.id}/draft`,
        base: row.site_json ? decode<Record<string, unknown>>(row.site_json) : {},
        pages: pages.map((p) => p.page),
        assetFiles: await assetNames(row.id),
      })
      ASSEMBLED.set(row.id, { version: row.version, result })
      return { result, stamp: `d1:${row.version}` }
    },
  }
}
