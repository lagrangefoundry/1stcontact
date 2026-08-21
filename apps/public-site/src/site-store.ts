import {
  PUBLISHED_ROOT,
  publishedOutPrefix,
} from '../../../tools/generate/src/store/revision-model'

/**
 * The seam between "which bytes does this URL name" and "where do those bytes
 * live" (REQ-111), now answered from D1 (REQ-149).
 *
 * THE SWAP THIS FILE ALWAYS PROMISED. Phase 1 read `sites/<slug>/manifest.json`,
 * an object `1c deploy` wrote from an operator's laptop, and the comment here
 * said phase 2 "answers from D1 by replacing the implementation and nothing
 * else". That is what happened: the interface is unchanged and no other part of
 * the Worker knows the truth moved.
 *
 * THE MANIFEST IS GONE, NOT DEMOTED. It was carrying four jobs — which revision
 * is live, vouching for a URL-supplied id, GC roots, and deploy's
 * already-deployed check — and D1 now holds all four. Keeping it as a cache
 * would have created exactly the thing REQ-149 set out to remove: one fact
 * recorded in two places, with no mechanism to keep them agreeing.
 *
 * NOT A HOT-PATH REGRESSION. `index.ts` stores every 200 in the edge Cache API,
 * so the store is touched on a cold miss and not otherwise; the read that used to
 * be one R2 GET is now one indexed D1 query, which is the cheaper of the two.
 *
 * LIVE IS DERIVED — `MAX(id)` over the revision log, never a stored pointer
 * (DOC-12 §4). There is nothing here that could disagree with the log it reads.
 */
export interface SiteStore {
  /**
   * The R2 key prefix holding the site's live rendered output, or `null` when
   * the site does not exist or has never published.
   */
  resolve(slug: string): Promise<string | null>
  /** The revision id currently served as the site's published output, or `null`. */
  live(slug: string): Promise<number | null>
}

/**
 * The only R2 root this Worker will ever address (BUG-31).
 *
 * Nothing here derives a root from a request, so no URL — however crafted — can
 * name a key outside it: unreachable by construction, not by a check that could
 * be missed. Re-exported from the store's own constant rather than restated, so
 * the reader and the writer cannot come to disagree about where bytes live.
 *
 * It is also the only root anything writes to now that `1c deploy` is gone
 * (REQ-149) — the Worker publishes its own tenant's sites and nothing else — so
 * the sandbox root the confinement guarded against has no writer either.
 */
export const SERVABLE_ROOT = PUBLISHED_ROOT

/** The D1 subset this store needs — narrow enough to fake in a UAT. */
export interface SiteDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): { first<T>(): Promise<T | null> }
  }
}

/**
 * {@link SiteStore} over the `published_sites` / `site_revisions` tables.
 *
 * WHY THE JOIN. Revisions are keyed `(tenant_id, slug, id)` because the draft
 * side is tenanted to the bone, and this Worker is handed a slug with no tenant
 * in it — `/site/<slug>/` is the public grammar and carries no account. So the
 * claim table, which is keyed by slug alone precisely because a published
 * address is global, is what says which account's revisions to read
 * (REQ-149 D2). A query that skipped it and matched on `slug` across every
 * tenant would serve whichever account happened to sort first.
 *
 * One instance per request: the lookup is memoised for the life of the instance,
 * which collapses a request's several reads into one and keeps a single response
 * internally consistent, without ever serving a stale answer to the next request.
 */
export class D1SiteStore implements SiteStore {
  private readonly cache = new Map<string, Promise<number | null>>()

  constructor(private readonly db: SiteDatabase) {}

  async resolve(slug: string): Promise<string | null> {
    const live = await this.live(slug)
    if (live === null) return null
    // Built from the DATABASE's value, never from anything the URL supplied: the
    // only untrusted component that reaches a key is the slug, and the route
    // grammar has already refused anything that is not a plain name.
    return publishedOutPrefix(slug, live)
  }

  live(slug: string): Promise<number | null> {
    const cached = this.cache.get(slug)
    if (cached) return cached
    const pending = this.read(slug)
    this.cache.set(slug, pending)
    return pending
  }

  private async read(slug: string): Promise<number | null> {
    const row = await this.db
      .prepare(
        'SELECT MAX(r.id) AS live FROM published_sites p ' +
          'JOIN site_revisions r ON r.tenant_id = p.tenant_id AND r.slug = p.slug ' +
          'WHERE p.slug = ?',
      )
      .bind(slug)
      .first<{ live: number | null }>()
    return row?.live ?? null
  }
}
