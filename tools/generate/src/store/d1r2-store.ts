import { assembleSite } from './assemble'
import type { LoadResult } from './assemble'
import { contentTypeOf } from './content-type'
import {
  assertWritableAssetNames,
  isUnsafeAssetName as isUnsafeName,
} from './asset-name'
import { newId } from './ids'
import type { ChangeSlice, JournalRecord } from './journal-model'
import { JOURNAL_WINDOW } from './journal-model'
import type {
  AssetStamp,
  RenditionSink,
  RevisionContent,
  RevisionEntry,
  SiteOutline,
  StoredSnapshot,
} from './revision-model'
import {
  PUBLISHED_ROOT,
  publishedOutPrefix,
  publishedSourcePrefix,
  RevisionExistsError,
  verifiedSnapshot,
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
 * column rather than a five-table rewrite plus an object copy.
 *
 * AND THE HANDLE STOPPED TRANSLATING ([[REQ-236]]). It used to resolve
 * slug -> `sites.id` under `WHERE tenant_id = ?`, so the same lookup did two
 * jobs: it undid a name, and it enforced the business. `sites.slug` is gone, so
 * the first job has nothing to do — a caller holds the key — and the second is
 * spelled out where it belongs, as `WHERE id = ? AND tenant_id = ?` on every
 * `sites` read and as the {@link OWNED} subquery on every child read. The
 * property is unchanged and one round-trip cheaper to state: a key this business
 * does not own selects nothing, which is the same answer a key nothing owns
 * gets.
 *
 * IT IS A REVISION STORE NOW (REQ-149). Metadata is D1 rows (`site_revisions`);
 * the frozen definition and the rendered output are R2 objects under
 * `sites/<siteKey>/rev/<NNNN>/`, which is the layout `public-site` already
 * reads.
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
 * use, which is what makes one column enough. The claim table and its refusal
 * are DELETED rather than relaxed, because with an opaque address there is
 * nothing left to claim. Per-business hostnames ([[DOC-45]] §5) remain the
 * readable answer and remain purely additive.
 *
 * AND THE SLUG ITSELF IS GONE ([[REQ-236]]). REQ-190 left it as an attribute
 * with a unique index — which is a key doing its job in a smaller room — and
 * every verb here opened by spending a lookup undoing it. [[DOC-45]] §6 is the
 * argument: the slug had two jobs, a URL-safe addressing token (which is the
 * key) and a human label for a site list (which does not exist, because a
 * business holds one site). Neither survives, so neither does the column.
 */

/**
 * What a site IS to this deployment, as the schema's `kind` column records it.
 *
 * A CLOSED ENUM THE CODE DECLARES, WHICH IS WHY IT IS NOT A SLUG WEARING A HAT
 * ([[REQ-236]]). Nobody types it, nothing displays it, and it addresses nothing
 * on its own — a site is still named by its key alone, and `kind` only narrows
 * {@link TenantSiteStore.siteKeys} when a caller is asking for a particular one.
 *
 * WHAT IT REPLACES. `/account` serves a portal a business may author into its
 * own store ([[REQ-183]]), and that portal was found under the reserved slug
 * `portal` — a magic name a customer could have collided with by calling their
 * own site `portal`, and one with nowhere to live once the column went.
 */
export type SiteKind = 'site' | 'portal'

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
  /** Which account this handle can see. Never inferred from a site key. */
  readonly tenantId: string
  /**
   * Mint an empty site and hand back its key, so `write` has something to write
   * to.
   *
   * The port has no create verb because no *command* creates a site — `1c new`
   * does, and it is `commands.ts`'s. This is the adapter's own admin surface,
   * the counterpart of the in-memory adapter's `seed`.
   *
   * IT RETURNS THE KEY, AND IT ALWAYS CREATES ([[REQ-236]]). It used to take a
   * slug, insert-or-ignore on it, and answer whether it had created anything —
   * a shape only a name makes possible. With the key minted here there is
   * nothing for a second call to collide WITH, so every call is a new site and
   * the answer a caller needs is which one.
   *
   * WHERE BUG-51's GUARD WENT. "Do not scaffold over a site that already
   * exists" used to be this verb's return value. It is now the caller's own
   * question, asked of {@link siteKeys} — which sees every site this business
   * holds rather than only a collision on one name — and answered before this is
   * called at all.
   */
  createDraft(kind?: SiteKind): Promise<string>
  /** Drop a site and its assets entirely, so `hasDraft` goes back to false. */
  forget(siteKey: string): Promise<void>
  /**
   * Every site key this business owns, sorted — and the ONLY way to learn one.
   *
   * THE BUSINESS-SCOPED ENUMERATION THE BARRIER RESTS ON. A site key is 128
   * random bits; with `siteKey(slug)` deleted ([[REQ-236]]) this is the one
   * statement that hands one out, and it carries `WHERE tenant_id = ?`. So a key
   * for another business's site is not something any caller can obtain from
   * here — which is the same property REQ-190 stated about the slug lookup,
   * moved to the verb that replaced it.
   *
   * `kind` NARROWS IT AND OMITTING IT MEANS EVERYTHING, which is not a default
   * chosen for convenience. The [[DOC-37]] erasure path reads these keys to
   * delete under `draft/<siteKey>/` and `sites/<siteKey>/rev/…` — prefixes with
   * no business in them, which is what makes a move copy nothing — and an
   * erasure that skipped a business's portal would leave its bytes behind.
   * Callers asking "which site is the customer's" pass `'site'`; callers asking
   * "everything this business owns" pass nothing.
   */
  siteKeys(kind?: SiteKind): Promise<string[]>
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
 * another process (`bin/copy-to-cloud` from a laptop) invalidates this correctly
 * too.
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
 * wrong. It also survives a move between businesses, which the old key could
 * not — and there is no longer a name for it to survive a rename of.
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
 * [[REQ-222]] — the same rule for a value that IS a path within `out/`.
 *
 * A delivery rendition is written at `assets/d/<sha>-<w>.jpg`, so the separator
 * {@link isUnsafeName} refuses outright is legitimate here and the question
 * becomes what the separator is allowed to join. An absolute path would compose
 * a key with a double slash that no reader resolves the way the writer meant, a
 * backslash is a separator to some readers and not others, and any `..`
 * component names a key outside the revision this publish is writing.
 */
function isUnsafePath(rel: string): boolean {
  if (rel === '' || rel.startsWith('/') || rel.includes('\\')) return true
  return rel.split('/').some((part) => part === '' || part === '.' || part === '..')
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
async function listObjects(bucket: R2Bucket, prefix: string): Promise<R2Object[]> {
  const objects: R2Object[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor })
    for (const object of page.objects) objects.push(object)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return objects
}

/** Every key under `prefix`, for the callers that want nothing else. */
async function listKeys(bucket: R2Bucket, prefix: string): Promise<string[]> {
  return (await listObjects(bucket, prefix)).map((object) => object.key)
}

/**
 * What a listing already knows about an object's content ([[REQ-303]]).
 *
 * THE ETAG IS THE POINT AND THE SIZE IS THE BACKSTOP. R2 records an etag at
 * `put` — the MD5 of the bytes that landed — so it changes whenever a byte
 * does, and it arrives in a `list()` alongside the key at no extra cost. A
 * listing that somehow carried no etag would still distinguish two objects of
 * different length rather than silently calling them equal.
 *
 * DRAFT AND REVISION STAMPS ARE COMPARABLE because a publish copies the draft's
 * bytes into the revision's prefix with a single `put` of the same content, and
 * the same bytes put the same way produce the same etag.
 */
function objectStamp(object: R2Object): string {
  return `${object.size}:${object.etag || '-'}`
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
 * Every verb below scopes its site by `tenantId`. That is not a convention a
 * reader has to trust: the value is captured here, once, no verb takes a tenant
 * argument, and every statement that touches a site row or a child row names it.
 *
 * WHAT REPLACED "TENANT IN EVERY QUERY" ([[REQ-190]], then [[REQ-236]]). Every
 * statement used to filter `tenant_id = ? AND slug = ?`, which put the business
 * in twenty-two places and the site's *name* in twenty-two more. REQ-190 turned
 * the name into a key behind one lookup; REQ-236 removed the name, and with it
 * the lookup — so what is left is the key the caller already holds and the
 * business it must belong to, in the same statement.
 *
 * A KEY IS NOT A CAPABILITY HERE, which is the distinction this file gets wrong
 * if it is read quickly. 128 random bits are unguessable, but unguessable is not
 * unforgeable: keys are the PUBLIC published address and travel in URLs, logs
 * and support tickets. So no verb takes one on trust — {@link OWNED} and
 * `WHERE id = ? AND tenant_id = ?` make a key from another business select
 * nothing, and the only statement that ever HANDS a key out
 * ({@link TenantSiteStore.siteKeys}) is itself business-scoped.
 *
 * AND IT COSTS ONE ROUND-TRIP FEWER THAN IT USED TO. The slug lookup was a
 * separate read before every child query; the check that replaced it is a
 * subquery inside the child query. `sites` is reached by its primary key either
 * way.
 */
function tenantStore(env: SiteStoreEnv, tenantId: string): TenantSiteStore {
  const { DB, SITES } = env

  /**
   * The R2 prefix holding one site's draft: `draft/<siteKey>/`.
   *
   * NO BUSINESS IN IT, and that is what makes a move copy nothing ([[REQ-190]]).
   * It used to be `draft/<tenant>/<slug>/`, so a site carried both the name it
   * might be renamed away from and the business it might be moved out of, in
   * every object key it owned. Erasure ([[DOC-37]]) reaches these objects by
   * enumerating the business's site keys and deleting under each — see
   * {@link TenantSiteStore.siteKeys} — rather than by one prefix sweep.
   */
  const draftPrefix = (siteKey: string): string => `draft/${siteKey}/`

  /** The R2 key for one draft asset. */
  const assetKey = (siteKey: string, name: string): string =>
    `${draftPrefix(siteKey)}assets/${name}`

  /**
   * The clause every child-table read is scoped by — the business barrier,
   * spelled as a subquery rather than as a preceding lookup ([[REQ-236]]).
   *
   * WHY IT IS NOT SIMPLY `site_id = ?`. Before REQ-236 a verb took a slug and
   * spent a lookup turning it into a key, and that lookup's `WHERE tenant_id = ?`
   * was where the barrier actually lived. The translation is gone — a caller
   * holds the key — but the barrier cannot go with it: the key now ARRIVES from
   * the caller, so a query that trusted it would read across businesses the
   * moment one leaked.
   *
   * SO THE CHECK MOVED INTO THE SAME STATEMENT, which costs one round-trip
   * fewer than the lookup it replaces rather than one more. `sites` is reached
   * by its primary key inside the subquery and the tenant is compared on the row
   * it finds, so a key belonging to another business selects nothing and the
   * outer query returns nothing — the same answer as a key that does not exist,
   * which is the only answer that discloses nothing.
   *
   * Binds two values, in this order: the site key, then the tenant.
   */
  const OWNED = 'site_id = (SELECT id FROM sites WHERE id = ? AND tenant_id = ?)'

  /**
   * The site row, by key, under this handle's business.
   *
   * The tenant comparison is the point of the statement now that the key is the
   * caller's: a key this business does not own reads back `null`, exactly as a
   * key nothing owns does.
   */
  const siteRow = (
    siteKey: string,
  ): Promise<{
    id: string
    site_json: string | null
    version: number
    counter: number
  } | null> =>
    DB.prepare(
      'SELECT id, site_json, version, counter FROM sites WHERE id = ? AND tenant_id = ?',
    )
      .bind(siteKey, tenantId)
      .first<{ id: string; site_json: string | null; version: number; counter: number }>()

  /** True when this business owns the site this key names. */
  const owns = async (siteKey: string): Promise<boolean> => {
    const row = await DB.prepare('SELECT id FROM sites WHERE id = ? AND tenant_id = ?')
      .bind(siteKey, tenantId)
      .first<{ id: string }>()
    return row !== null
  }

  const assetNames = async (siteKey: string): Promise<string[]> => {
    const { results } = await DB.prepare(
      `SELECT name FROM site_assets WHERE ${OWNED} ORDER BY name`,
    )
      .bind(siteKey, tenantId)
      .all<{ name: string }>()
    return (results ?? []).map((r) => r.name)
  }

  const readPagesOf = async (siteKey: string): Promise<StoredPage[]> => {
    const { results } = await DB.prepare(
      `SELECT name, page FROM site_pages WHERE ${OWNED} ORDER BY name`,
    )
      .bind(siteKey, tenantId)
      .all<{ name: string; page: string }>()
    return (results ?? []).map((r) => ({
      name: r.name,
      page: decode<Record<string, unknown>>(r.page),
    }))
  }

  return {
    tenantId,

    async createDraft(kind: SiteKind = 'site') {
      const now = new Date().toISOString()
      // THE KEY IS MINTED HERE, which is why `newId` had to move down into the
      // store ([[REQ-190]]): a site comes into existence at this statement and
      // nowhere else, so this is the only place its key can be decided.
      //
      // AND IT IS HANDED BACK, WHICH IS THE WHOLE SHAPE OF THE VERB NOW
      // ([[REQ-236]]). It used to take a slug and answer whether it had created
      // anything, because the caller already held the name it would address the
      // site by and `INSERT OR IGNORE` made a second call a no-op. With no slug
      // there is nothing to insert-or-ignore ON: every call creates a site, and
      // the caller cannot address the one it just made unless this returns its
      // key.
      //
      // WHAT REPLACES THE IDEMPOTENCE (BUG-51). "Do not scaffold over a site
      // that exists" was expressed as `createDraft`'s return value; it is now
      // expressed where it is actually meant — the caller asks
      // {@link TenantSiteStore.siteKeys} whether this business already holds one
      // and creates only when it does not. That is a stronger guard than the one
      // it replaces, which could only see a collision on the one NAME it
      // happened to pass.
      const id = newId('site')
      await DB.prepare(
        'INSERT INTO sites ' +
          '(id, tenant_id, kind, site_json, version, counter, created_at, updated_at) ' +
          'VALUES (?, ?, ?, NULL, 0, 0, ?, ?)',
      )
        .bind(id, tenantId, kind, now, now)
        .run()
      return id
    },

    async forget(siteKey) {
      if (!(await owns(siteKey))) return
      // BUG-37 — the memo goes first. A site recreated in this business is a NEW
      // key, so a stale entry could not be mistaken for it the way it could when
      // the memo was keyed by name — but the entry would still leak, and
      // dropping it is the same one line.
      ASSEMBLED.delete(siteKey)
      // R2 first: an orphaned object is invisible and costs storage, whereas an
      // asset row pointing at bytes that are already gone would read back as a
      // present asset with no content.
      for (const key of await listKeys(SITES, draftPrefix(siteKey))) await SITES.delete(key)
      // The child tables cascade from `sites` (see the baseline), but D1 only
      // enforces that with foreign keys on, so they are deleted explicitly rather
      // than assumed.
      const published = await listKeys(SITES, `${PUBLISHED_ROOT}/${siteKey}/`)
      for (const key of published) await SITES.delete(key)
      await DB.batch([
        DB.prepare('DELETE FROM site_changes WHERE site_id = ?').bind(siteKey),
        DB.prepare('DELETE FROM site_assets WHERE site_id = ?').bind(siteKey),
        DB.prepare('DELETE FROM site_pages WHERE site_id = ?').bind(siteKey),
        DB.prepare('DELETE FROM site_revisions WHERE site_id = ?').bind(siteKey),
        // [[REQ-266]] — the reservations go with the revisions they reserved. A
        // claim outliving its site would refuse an id to a site that no longer
        // exists, which is harmless until the row is the only thing keeping a
        // dropped site's key alive in a cascade nobody remembers writing.
        DB.prepare('DELETE FROM site_revision_claims WHERE site_id = ?').bind(siteKey),
        // Scoped to this tenant as well as to the key, so the statement reads as
        // what it is: a handle may only drop a site of its own business, even
        // holding a key it could not otherwise have obtained.
        DB.prepare('DELETE FROM sites WHERE id = ? AND tenant_id = ?').bind(siteKey, tenantId),
      ])
    },

    async siteKeys(kind) {
      const { results } =
        kind === undefined
          ? await DB.prepare('SELECT id FROM sites WHERE tenant_id = ? ORDER BY id')
              .bind(tenantId)
              .all<{ id: string }>()
          : await DB.prepare('SELECT id FROM sites WHERE tenant_id = ? AND kind = ? ORDER BY id')
              .bind(tenantId, kind)
              .all<{ id: string }>()
      return (results ?? []).map((r) => r.id)
    },

    async hasDraft(site) {
      return owns(site)
    },

    async readSiteJson(site) {
      const row = await siteRow(site)
      return row?.site_json ? decode<Record<string, unknown>>(row.site_json) : null
    },

    async readPages(site) {
      return readPagesOf(site)
    },

    async write(site, change: SiteWrite) {
      const row = await siteRow(site)
      if (!row) throw new Error(`No site '${site}' in this store.`)
      const siteId = row.id

      // NOTE what is deliberately NOT here: a version check against `row`. It
      // would be two round-trips away from the batch, so a writer could still
      // slip between them — it would refuse the easy cases and leave the hard
      // one open, which is the worst of both. The ONLY gate is the guard
      // statement inside the transaction below. That also makes the atomicity
      // claim testable: every refusal really does execute its writes and really
      // is rolled back, rather than being turned away before the batch is sent.

      // EVERY NAME IS CHECKED BEFORE THE FIRST BYTE, AND A BAD ONE THROWS
      // ([[REQ-246]]). Each of the two loops below used to skip an unsafe name
      // with `continue`, so the object was never written, the row was never
      // inserted, and `write` returned as though it had done what it was asked.
      // Bytes that vanish from a call that reports success are the failure mode
      // that costs the most to diagnose. Checking the whole set up here also
      // means a change set is one act: it cannot half-land.
      assertWritableAssetNames(change.assets)

      // R2 is written OUTSIDE the transaction, because it has none to join.
      // Bytes first, metadata second: an object with no row is invisible and
      // costs storage, whereas a row with no object is an asset that lists and
      // then 404s. Neither ordering is atomic across the two stores — that is a
      // property of R2, not a shortcut taken here — so the failure mode is
      // chosen rather than left to chance.
      for (const { name, bytes } of change.assets ?? []) {
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
              '(id, tenant_id, kind, site_json, version, counter, base_revision, created_at, updated_at) ' +
              'SELECT id, tenant_id, kind, site_json, version, counter, base_revision, created_at, updated_at ' +
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
          const current = await siteRow(site)
          throw new StoreConflictError(site, change.expect, current?.version ?? null)
        }
        throw err
      }
    },

    async listAssets(site) {
      return assetNames(site)
    },

    async readAsset(site, name) {
      // A READ ANSWERS `null`, WHERE A WRITE THROWS ([[REQ-246]]). The write is
      // being ASKED to store something and has to say it did not; a read is
      // being asked whether an asset is there, and for a name no asset can have
      // been stored under, "no" is the true answer rather than an error.
      if (isUnsafeName(name)) return null
      const row = await DB.prepare(`SELECT r2_key FROM site_assets WHERE ${OWNED} AND name = ?`)
        .bind(site, tenantId, name)
        .first<{ r2_key: string }>()
      if (!row) return null
      const object = await SITES.get(row.r2_key)
      if (!object) return null
      return new Uint8Array(await object.arrayBuffer())
    },

    async counter(site) {
      return (await siteRow(site))?.counter ?? 0
    },

    async appendChange(site, entry) {
      const row = await siteRow(site)
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

    async changesSince(site, since): Promise<ChangeSlice> {
      const row = await siteRow(site)
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

    async revisions(site): Promise<RevisionEntry[]> {
      const { results } = await DB.prepare(
        'SELECT id, published_at, published_by, message, based_on, changes, sha ' +
          `FROM site_revisions WHERE ${OWNED} ORDER BY id`,
      )
        .bind(site, tenantId)
        .all<RevisionRow>()
      return (results ?? []).map(rowToRevision)
    },

    /**
     * One past the highest id EITHER table has ever held ([[REQ-266]] §2).
     *
     * THE UNION IS THE WHOLE POINT. `site_revisions` records publishes that
     * COMPLETED; `site_revision_claims` records ids that were HANDED OUT, which
     * includes the one another publish reserved four milliseconds ago and is
     * writing into right now. Answering from the log alone would hand that id
     * out a second time and put two drafts' bytes into one prefix — the race
     * this ticket closes.
     *
     * A CLAIM THAT NEVER COMPLETED STILL COUNTS, and that is deliberate rather
     * than a leak. Forward-only numbering promises ids are never reused; a gap
     * in the sequence is what that promise looks like when a publish dies
     * halfway, and recycling the id would send the next writer into a prefix the
     * first one may already have put objects into.
     */
    async nextRevision(site): Promise<number> {
      const row = await DB.prepare(
        'SELECT MAX(id) AS highest FROM (' +
          `SELECT id FROM site_revisions WHERE ${OWNED} ` +
          'UNION ALL ' +
          `SELECT id FROM site_revision_claims WHERE ${OWNED}` +
          ')',
      )
        .bind(site, tenantId, site, tenantId)
        .first<{ highest: number | null }>()
      return (row?.highest ?? 0) + 1
    },

    /**
     * [[REQ-305]] — take the id, then open the derived channel.
     *
     * THE CLAIM MOVED HERE AND GOT EARLIER, which is a strengthening of
     * [[REQ-266]] §2 rather than a relocation of it. It used to be the first
     * thing `writeRevision` did, and that was the front of the write while the
     * write was one act. It is not one act any more: the delivery renditions are
     * written before the pages that name them exist ([[REQ-305]]), so the front
     * of the write is now this verb. A claim made at `writeRevision` would be a
     * claim made after the losing publish had already put a site's worth of
     * renditions into the winner's prefix.
     *
     * THE SINK IS A `put` PER RENDITION AND NOTHING ELSE. It holds no state, so
     * nothing accumulates on this side either — the byte array it is handed is
     * the caller's last reference to those bytes, and it is gone when the `put`
     * resolves.
     */
    async beginRevision(site, id): Promise<RenditionSink> {
      // OWNERSHIP IS PROVEN FIRST, before a single byte is written, and the key
      // every object is built from is the caller's own. There is no NAME to
      // claim any more ([[REQ-190]]): the published address IS this key, so no
      // other business can be publishing to it and there is nothing to refuse.
      // (The revision-id claim below is a different thing wearing the same word —
      // that one is about two publishes of THIS site, not two businesses.)
      if (!(await owns(site))) throw new Error(`No site '${site}' in this store.`)

      // [[REQ-266]] §3 — A PUBLISHED PREFIX IS NEVER WRITTEN INTO, checked before
      // the claim so that a caller arriving with an id it never minted is told
      // which of the two things went wrong. {@link writeRevision} asks the same
      // question again for the reason its own comment gives.
      const published = await DB.prepare(`SELECT id FROM site_revisions WHERE ${OWNED} AND id = ?`)
        .bind(site, tenantId, id)
        .first<{ id: number }>()
      if (published !== null) throw new RevisionExistsError(site, id, 'published')

      /*
       * [[REQ-266]] §2 — THE ID IS CLAIMED, IN A SEPARATE TABLE.
       *
       * `nextRevision` is a read, and everything after this is a write into the
       * prefix that read named. Two publishes of one site could interleave
       * between them, and the primary key that would eventually have caught it is
       * a whole revision's worth of objects away. Claiming here moves the refusal
       * to the front: the loser of the race fails having written nothing, so
       * there is no half-revision for anyone to discover later.
       *
       * THE FAILURE IS RE-READ RATHER THAN PATTERN-MATCHED ON ITS MESSAGE. D1
       * reports a constraint violation as a driver error whose text is not this
       * module's to depend on; asking the table whether the claim is there
       * answers the question the error was only evidence for. Anything else is
       * rethrown untouched, because a database that is down is not a revision
       * that is taken.
       */
      try {
        await DB.prepare(
          'INSERT INTO site_revision_claims (site_id, id, claimed_at) VALUES (?, ?, ?)',
        )
          .bind(site, id, new Date().toISOString())
          .run()
      } catch (err) {
        const claimed = await DB.prepare(
          `SELECT id FROM site_revision_claims WHERE ${OWNED} AND id = ?`,
        )
          .bind(site, tenantId, id)
          .first<{ id: number }>()
        if (claimed !== null) throw new RevisionExistsError(site, id, 'claimed')
        throw err
      }

      // [[REQ-222]] — the delivery renditions. Keys are composed from the path
      // the ladder chose, which is why `isUnsafePath` and not `isUnsafeName`
      // guards them: a rendition legitimately carries a `d/` segment, and what
      // must never reach a key is a component that climbs out of `out/`.
      const out = publishedOutPrefix(site, id)
      return async (rel: string, bytes: Uint8Array) => {
        if (isUnsafePath(rel)) return
        await SITES.put(`${out}/${rel}`, bytes as unknown as ArrayBuffer, {
          httpMetadata: { contentType: contentTypeOf(rel) },
        })
      }
    },

    async writeRevision(site, entry: RevisionEntry, content: RevisionContent) {
      // OWNERSHIP AND THE PUBLISHED-ID REFUSAL, ASKED AGAIN ([[REQ-266]] §3).
      // `beginRevision` asked both and claimed the id, and a publish always goes
      // through it — but this verb is what makes a revision EXIST, and the guard
      // that a published prefix is never written into belongs at the act it
      // protects as well as at the front of the sequence. Two indexed reads are
      // the price of a caller that skipped the front and would otherwise
      // overwrite a live revision one `put` at a time.
      if (!(await owns(site))) throw new Error(`No site '${site}' in this store.`)
      const published = await DB.prepare(
        `SELECT id FROM site_revisions WHERE ${OWNED} AND id = ?`,
      )
        .bind(site, tenantId, entry.id)
        .first<{ id: number }>()
      if (published !== null) throw new RevisionExistsError(site, entry.id, 'published')

      const source = publishedSourcePrefix(site, entry.id)
      const out = publishedOutPrefix(site, entry.id)

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
      // THE SAME REFUSAL AS `write`, FOR THE SAME REASON ([[REQ-246]]). A draft
      // cannot hold an unsafe name any more, so this cannot fire in practice —
      // but a publish that silently omitted an asset would render a revision
      // with a hole in it and report success, and "unreachable" is not a reason
      // to keep the shape that made that possible.
      assertWritableAssetNames(content.source.assets)

      for (const { name, bytes } of content.source.assets) {
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
          site,
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

    async readRevision(site, id): Promise<StoredSnapshot | null> {
      // `sha` COMES BACK WITH THE EXISTENCE CHECK ([[REQ-266]] §4). It is one
      // more column on a statement this function already ran, so verification
      // costs no round trip — the digest was computed, stored and never read,
      // and wiring it up is a wider SELECT and one comparison at the bottom.
      const row = await DB.prepare(`SELECT id, sha FROM site_revisions WHERE ${OWNED} AND id = ?`)
        .bind(site, tenantId, id)
        .first<{ id: number; sha: string }>()
      // The ROW vouches for the revision, never the bucket's key space. An
      // interrupted publish can leave objects behind; without a row they are
      // unreachable rather than quietly readable as a revision nobody finished.
      if (!row) return null

      const prefix = publishedSourcePrefix(site, id)
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

      // [[REQ-266]] §4 — WHAT CAME BACK IS WHAT WENT IN, OR NOTHING COMES BACK.
      // The row vouches for the revision's EXISTENCE and the objects carry its
      // content, and until now nothing compared the two. A bucket is reachable
      // by more than this store — an operator with credentials, a future
      // migration, a mistake — so "the objects under this prefix are the ones
      // the publish wrote" was a property of nobody having touched them.
      //
      // IT IS THE PATH THAT MATTERS BECAUSE EVERY OTHER PATH IS ON IT.
      // `checkoutRevision` reads a revision through here, which is the restore
      // this ticket exists for; so does the capture endpoint reading a form's
      // frozen definition, and so does the builder's revision preview.
      return verifiedSnapshot(site, id, row.sha, { siteJson, pages, assets })
    },

    /**
     * [[REQ-303]] — the draft with its assets stamped from R2's own listing.
     *
     * TWO QUERIES AND ONE LISTING, FLAT IN BYTES. The names come from
     * `site_assets`, which is what makes an asset EXIST in this store — an
     * object with no row is invisible, and the write path says why — and the
     * stamps come from one `list()` over the draft's prefix, which answers an
     * etag and a size per object without fetching one. A fifty-megabyte site and
     * an empty one cost the same here, which is the requirement.
     *
     * A ROW WITH NO OBJECT STAMPS AS ABSENT rather than throwing, on
     * `readDraftSnapshot`'s reasoning: the asset's bytes are gone, and reporting
     * the site as it actually is — the asset then reads as changed against the
     * revision that still holds it — is more use than a digest that refuses.
     */
    async draftOutline(site): Promise<SiteOutline> {
      const [row, pages, rows, objects] = await Promise.all([
        siteRow(site),
        readPagesOf(site),
        DB.prepare(`SELECT name, r2_key FROM site_assets WHERE ${OWNED} ORDER BY name`)
          .bind(site, tenantId)
          .all<{ name: string; r2_key: string }>(),
        listObjects(SITES, `${draftPrefix(site)}assets/`),
      ])
      const stamps = new Map(objects.map((object) => [object.key, objectStamp(object)]))
      return {
        siteJson: row?.site_json ? decode<Record<string, unknown>>(row.site_json) : null,
        pages,
        assets: (rows.results ?? []).map(
          (asset): AssetStamp => ({ name: asset.name, stamp: stamps.get(asset.r2_key) ?? '-' }),
        ),
      }
    },

    /**
     * [[REQ-303]] — the same shape for a published revision, and unverified.
     *
     * THE ROW STILL VOUCHES FOR THE REVISION, exactly as it does in
     * `readRevision`: objects an interrupted publish left behind are unreachable
     * without one rather than quietly readable as a revision nobody finished.
     * What is not done here is the digest comparison, and the port says why —
     * verification is over the frozen BYTES, which is the cost this verb exists
     * not to pay.
     */
    async revisionOutline(site, id): Promise<SiteOutline | null> {
      const row = await DB.prepare(`SELECT id FROM site_revisions WHERE ${OWNED} AND id = ?`)
        .bind(site, tenantId, id)
        .first<{ id: number }>()
      if (!row) return null

      const prefix = publishedSourcePrefix(site, id)
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

      const assets = (await listObjects(SITES, `${prefix}/assets/`))
        .map(
          (object): AssetStamp => ({
            name: object.key.slice(`${prefix}/assets/`.length),
            stamp: objectStamp(object),
          }),
        )
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

      return { siteJson, pages, assets }
    },

    async draftBase(site) {
      const row = await DB.prepare('SELECT base_revision FROM sites WHERE id = ? AND tenant_id = ?')
        .bind(site, tenantId)
        .first<{ base_revision: number | null }>()
      return row?.base_revision ?? null
    },

    async setDraftBase(site, id) {
      await DB.prepare('UPDATE sites SET base_revision = ? WHERE id = ? AND tenant_id = ?')
        .bind(id, site, tenantId)
        .run()
    },

    async version(site) {
      return (await siteRow(site))?.version ?? null
    },

    async loadDraft(site): Promise<DraftSnapshot | null> {
      const row = await siteRow(site)
      if (!row) return null

      // BUG-37 — the memo, checked against the version this request just read.
      const hit = ASSEMBLED.get(row.id)
      if (hit && hit.version === row.version) return { result: hit.result, stamp: `d1:${row.version}` }

      const pages = await readPagesOf(row.id)
      const result = assembleSite({
        slug: site,
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
