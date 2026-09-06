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
 *
 * A URL NAMES A SITE BY ITS KEY NOW ([[REQ-190]]). `/site/<slug>/` used to carry
 * a chosen name and no business, so a slug had to be unique across the entire
 * deployment for it to name one site — which is why there was a `published_sites`
 * table to claim it in, why two businesses could not both publish `home`, and why
 * the refusal told the second one that the first existed. The segment is the
 * site's own 128-bit key now: it names exactly one site by construction, so the
 * claim table is gone and the join with it.
 */
export interface SiteStore {
  /**
   * The R2 key prefix holding the site's live rendered output, or `null` when
   * the site does not exist or has never published.
   */
  resolve(siteKey: string): Promise<string | null>
  /** The revision id currently served as the site's published output, or `null`. */
  live(siteKey: string): Promise<number | null>
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
 * {@link SiteStore} over `site_revisions`.
 *
 * THE JOIN IS GONE, AND SO IS THE TABLE IT REACHED THROUGH ([[REQ-190]]).
 * Revisions used to be keyed `(tenant_id, slug, id)` while this Worker was
 * handed a slug with no business in it, so it read `published_sites` — a table
 * whose only job was to make the slug globally unique — to learn whose revisions
 * to serve. Both halves of that were the same defect: a chosen name doing a
 * key's job. Revisions are keyed `(site_id, id)` now and the URL carries the
 * site key, so one indexed read answers the question with nothing to reconcile.
 *
 * IT STILL CANNOT SERVE ACROSS THE BARRIER, by a stronger mechanism than the
 * join was. A site key is 128 random bits; a request that does not already have
 * one cannot produce one, and one that has it is naming a site whose owner
 * published it deliberately. Deleting a business cascades `sites` and
 * `site_revisions` with it, so an ended account stops serving for the same reason
 * it did when the claim row cascaded.
 *
 * One instance per request: the lookup is memoised for the life of the instance,
 * which collapses a request's several reads into one and keeps a single response
 * internally consistent, without ever serving a stale answer to the next request.
 */
export class D1SiteStore implements SiteStore {
  private readonly cache = new Map<string, Promise<number | null>>()

  constructor(private readonly db: SiteDatabase) {}

  async resolve(siteKey: string): Promise<string | null> {
    const live = await this.live(siteKey)
    if (live === null) return null
    // Built from the DATABASE's value, never from anything the URL supplied: the
    // only untrusted component that reaches a key is the site key, and the route
    // grammar has already refused anything that is not a plain name.
    return publishedOutPrefix(siteKey, live)
  }

  live(siteKey: string): Promise<number | null> {
    const cached = this.cache.get(siteKey)
    if (cached) return cached
    const pending = this.read(siteKey)
    this.cache.set(siteKey, pending)
    return pending
  }

  private async read(siteKey: string): Promise<number | null> {
    const row = await this.db
      .prepare('SELECT MAX(id) AS live FROM site_revisions WHERE site_id = ?')
      .bind(siteKey)
      .first<{ live: number | null }>()
    return row?.live ?? null
  }
}
