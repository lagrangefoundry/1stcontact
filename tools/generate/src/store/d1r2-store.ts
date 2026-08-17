import { assembleSite } from './assemble'
import { contentTypeOf } from './content-type'
import type { ChangeSlice, JournalRecord } from './journal-model'
import { JOURNAL_WINDOW } from './journal-model'
import type {
  DraftSnapshot,
  PendingChanges,
  SiteStore,
  SiteWrite,
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
 * WHAT IT DELIBERATELY IS NOT. Not a revision store. `pendingChanges` reports
 * every file as `added` against no base revision — the only state a store with
 * no revisions can be in — exactly as the in-memory adapter does. Publish and
 * checkout are `commands.ts`'s and are still file-backed (DOC-12 §4); moving
 * them is a later ticket, and pretending here would be worse than saying so.
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

  constructor(tenantId: string, reason: 'unknown' | 'inactive') {
    super(
      reason === 'unknown'
        ? `No tenant '${tenantId}'.`
        : `Tenant '${tenantId}' is not active.`,
    )
    this.tenantId = tenantId
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
   */
  createDraft(slug: string): Promise<void>
  /** Drop a site and its assets entirely, so `hasDraft` goes back to false. */
  forget(slug: string): Promise<void>
  /** The slugs this tenant holds a draft for, sorted. */
  slugs(): Promise<string[]>
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
 * Every verb below carries `tenantId` into its SQL. That is not a convention a
 * reader has to trust: the value is captured here, once, and no verb takes a
 * tenant argument, so there is no call site at which the wrong one could be
 * passed.
 */
function tenantStore(env: SiteStoreEnv, tenantId: string): TenantSiteStore {
  const { DB, SITES } = env

  /** The R2 key for one asset. Tenant-first, so a prefix listing is per-account. */
  const assetKey = (slug: string, name: string): string =>
    `draft/${tenantId}/${slug}/assets/${name}`

  const siteRow = (
    slug: string,
  ): Promise<{ site_json: string | null; version: number; counter: number } | null> =>
    DB.prepare('SELECT site_json, version, counter FROM sites WHERE tenant_id = ? AND slug = ?')
      .bind(tenantId, slug)
      .first<{ site_json: string | null; version: number; counter: number }>()

  const pageNames = async (slug: string): Promise<string[]> => {
    const { results } = await DB.prepare(
      'SELECT name FROM site_pages WHERE tenant_id = ? AND slug = ? ORDER BY name',
    )
      .bind(tenantId, slug)
      .all<{ name: string }>()
    return (results ?? []).map((r) => r.name)
  }

  const assetNames = async (slug: string): Promise<string[]> => {
    const { results } = await DB.prepare(
      'SELECT name FROM site_assets WHERE tenant_id = ? AND slug = ? ORDER BY name',
    )
      .bind(tenantId, slug)
      .all<{ name: string }>()
    return (results ?? []).map((r) => r.name)
  }

  return {
    tenantId,

    async createDraft(slug) {
      const now = new Date().toISOString()
      await DB.prepare(
        'INSERT OR IGNORE INTO sites (tenant_id, slug, site_json, version, counter, created_at, updated_at) ' +
          'VALUES (?, ?, NULL, 0, 0, ?, ?)',
      )
        .bind(tenantId, slug, now, now)
        .run()
    },

    async forget(slug) {
      // R2 first: an orphaned object is invisible and costs storage, whereas an
      // asset row pointing at bytes that are already gone would read back as a
      // present asset with no content.
      const listed = await SITES.list({ prefix: `draft/${tenantId}/${slug}/` })
      for (const object of listed.objects) await SITES.delete(object.key)
      // The child tables cascade from `sites` (see the migration), so one delete
      // is the whole site — but D1 only enforces that with foreign keys on, so
      // they are deleted explicitly rather than assumed.
      await DB.batch([
        DB.prepare('DELETE FROM site_changes WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
        DB.prepare('DELETE FROM site_assets WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
        DB.prepare('DELETE FROM site_pages WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
        DB.prepare('DELETE FROM sites WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
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

    async hasDraft(slug) {
      return (await siteRow(slug)) !== null
    },

    async readSiteJson(slug) {
      const row = await siteRow(slug)
      return row?.site_json ? decode<Record<string, unknown>>(row.site_json) : null
    },

    async readPages(slug) {
      const { results } = await DB.prepare(
        'SELECT name, page FROM site_pages WHERE tenant_id = ? AND slug = ? ORDER BY name',
      )
        .bind(tenantId, slug)
        .all<{ name: string; page: string }>()
      const pages: StoredPage[] = (results ?? []).map((r) => ({
        name: r.name,
        page: decode<Record<string, unknown>>(r.page),
      }))
      return pages
    },

    async write(slug, change: SiteWrite) {
      const row = await siteRow(slug)
      if (!row) throw new Error(`No site '${slug}' in this store.`)

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
        await SITES.put(assetKey(slug, name), bytes as unknown as ArrayBuffer, {
          httpMetadata: { contentType: contentTypeOf(name) },
        })
      }

      const now = new Date().toISOString()
      const statements: D1PreparedStatement[] = []

      if (change.siteJson !== undefined) {
        statements.push(
          DB.prepare('UPDATE sites SET site_json = ? WHERE tenant_id = ? AND slug = ?').bind(
            encode(change.siteJson),
            tenantId,
            slug,
          ),
        )
      }
      for (const { name, page } of change.pages ?? []) {
        statements.push(
          DB.prepare(
            'INSERT INTO site_pages (tenant_id, slug, name, page) VALUES (?, ?, ?, ?) ' +
              'ON CONFLICT (tenant_id, slug, name) DO UPDATE SET page = excluded.page',
          ).bind(tenantId, slug, name, encode(page)),
        )
      }
      for (const name of change.removePages ?? []) {
        statements.push(
          DB.prepare(
            'DELETE FROM site_pages WHERE tenant_id = ? AND slug = ? AND name = ?',
          ).bind(tenantId, slug, name),
        )
      }
      for (const { name, bytes } of change.assets ?? []) {
        if (isUnsafeName(name)) continue
        statements.push(
          DB.prepare(
            'INSERT INTO site_assets (tenant_id, slug, name, r2_key, content_type, size) ' +
              'VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (tenant_id, slug, name) DO UPDATE SET ' +
              'r2_key = excluded.r2_key, content_type = excluded.content_type, size = excluded.size',
          ).bind(
            tenantId,
            slug,
            name,
            assetKey(slug, name),
            contentTypeOf(name),
            bytes.byteLength,
          ),
        )
      }
      for (const name of change.removeAssets ?? []) {
        statements.push(
          DB.prepare(
            'DELETE FROM site_assets WHERE tenant_id = ? AND slug = ? AND name = ?',
          ).bind(tenantId, slug, name),
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
            'INSERT INTO sites (tenant_id, slug, site_json, version, counter, created_at, updated_at) ' +
              'SELECT tenant_id, slug, site_json, version, counter, created_at, updated_at FROM sites ' +
              'WHERE tenant_id = ? AND slug = ? AND version <> ?',
          ).bind(tenantId, slug, change.expect),
        )
      }

      statements.push(
        DB.prepare(
          'UPDATE sites SET version = version + 1, updated_at = ? WHERE tenant_id = ? AND slug = ?',
        ).bind(now, tenantId, slug),
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
      return assetNames(slug)
    },

    async readAsset(slug, name) {
      if (isUnsafeName(name)) return null
      const row = await DB.prepare(
        'SELECT r2_key FROM site_assets WHERE tenant_id = ? AND slug = ? AND name = ?',
      )
        .bind(tenantId, slug, name)
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
        DB.prepare(
          'INSERT INTO site_changes (tenant_id, slug, at, record) VALUES (?, ?, ?, ?)',
        ).bind(tenantId, slug, at, encode(record)),
        DB.prepare('UPDATE sites SET counter = ? WHERE tenant_id = ? AND slug = ?').bind(
          at,
          tenantId,
          slug,
        ),
        // The window, enforced by deleting what aged out rather than by
        // rewriting a bounded blob — the arithmetic is `nextJournal`'s
        // `slice(-JOURNAL_WINDOW)`, expressed as the rows it would have dropped.
        DB.prepare(
          'DELETE FROM site_changes WHERE tenant_id = ? AND slug = ? AND at <= ?',
        ).bind(tenantId, slug, at - JOURNAL_WINDOW),
      ])
      return at
    },

    async changesSince(slug, since): Promise<ChangeSlice> {
      const row = await siteRow(slug)
      const counter = row?.counter ?? 0
      const from =
        typeof since === 'number' && Number.isFinite(since) ? Math.max(0, Math.trunc(since)) : 0
      const { results } = await DB.prepare(
        'SELECT at, record FROM site_changes WHERE tenant_id = ? AND slug = ? ORDER BY at',
      )
        .bind(tenantId, slug)
        .all<{ at: number; record: string }>()
      const retained = results ?? []
      const changes = retained.filter((r) => r.at > from).map((r) => decode<JournalRecord>(r.record))
      // `sliceSince`'s rule, restated over rows: the oldest counter the window
      // can still speak for, or "the next write" when it holds nothing.
      const earliest = retained.length ? retained[0].at : counter + 1
      return { since: from, now: counter, truncated: earliest > from + 1, changes }
    },

    async pendingChanges(slug): Promise<PendingChanges> {
      const row = await siteRow(slug)
      if (!row) return { baseRevision: null, added: [], modified: [], removed: [] }
      const added = [
        ...(row.site_json ? ['site.json'] : []),
        ...(await pageNames(slug)).map((name) => `pages/${name}`),
        ...(await assetNames(slug)).map((name) => `assets/${name}`),
      ].sort()
      return { baseRevision: null, added, modified: [], removed: [] }
    },

    async version(slug) {
      return (await siteRow(slug))?.version ?? null
    },

    async loadDraft(slug): Promise<DraftSnapshot | null> {
      const row = await siteRow(slug)
      if (!row) return null
      const pages = await this.readPages(slug)
      const result = assembleSite({
        slug,
        // Descriptive only — no request-time path reads it (see `LoadedSite`).
        sourceDir: `d1:${tenantId}/${slug}/draft`,
        base: row.site_json ? decode<Record<string, unknown>>(row.site_json) : {},
        pages: pages.map((p) => p.page),
        assetFiles: await assetNames(slug),
      })
      return { result, stamp: `d1:${row.version}` }
    },
  }
}
