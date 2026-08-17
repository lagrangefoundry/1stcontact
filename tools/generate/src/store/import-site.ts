import type { SiteStore, SiteWrite, StoredAsset } from './site-store'

/**
 * Copy one site's draft from any {@link SiteStore} into any other (REQ-143).
 *
 * WHY IT IS PORT-TO-PORT AND NOT "SEED D1 FROM `storage/sites/`". The obvious
 * shape for the import path — read the operator's directory tree, INSERT the
 * rows — would have to know about both a filesystem and a database, so it could
 * only ever run in Node, and it would be a third place that encodes what a site
 * is made of. Expressed over the port it is neither: it reads through
 * {@link SiteStore} and writes through {@link SiteStore}, so it runs wherever
 * both adapters do, and it learns the shape of a site from the port rather than
 * restating it.
 *
 * What that buys immediately is the *test* for DOC-12 §7's migration: the same
 * function that will seed D1 from `storage/sites/` also copies a site between
 * two in-memory stores, so its correctness is checkable without a database and
 * its behaviour against a real one is the same code.
 *
 * ONE WRITE, DELIBERATELY. Everything — `site.json`, every page, every asset —
 * crosses as a single {@link SiteWrite}. Against the D1 adapter that is one
 * `db.batch()`, so an import either lands whole or not at all. An import that
 * half-landed would be worse than one that failed: the site would exist, would
 * validate as far as it went, and would be missing pages no one had a record of.
 */

/** What an import copied. */
export interface ImportSummary {
  slug: string
  /** True when the source held a `site.json`. */
  siteJson: boolean
  /** Page store keys copied, in load order. */
  pages: string[]
  /** Asset store keys copied, sorted. */
  assets: string[]
}

/**
 * Read `slug`'s whole draft out of `from` and write it into `to`.
 *
 * The destination must already hold the site — creating one is an adapter's own
 * admin verb (`createDraft`, `seed`), not something the port describes, and
 * inventing a create here would mean this function had to know which adapter it
 * was talking to. That is exactly the knowledge it exists without.
 */
export async function importSite(
  from: SiteStore,
  to: SiteStore,
  slug: string,
): Promise<ImportSummary> {
  if (!(await from.hasDraft(slug))) {
    throw new Error(`Site '${slug}' has no draft in the source store.`)
  }
  if (!(await to.hasDraft(slug))) {
    throw new Error(`Site '${slug}' does not exist in the destination store.`)
  }

  const siteJson = await from.readSiteJson(slug)
  const pages = await from.readPages(slug)
  const assetNames = await from.listAssets(slug)

  const assets: StoredAsset[] = []
  for (const name of assetNames) {
    const bytes = await from.readAsset(slug, name)
    // A name the source lists but cannot produce bytes for is a source-side
    // inconsistency, and copying a zero-length asset over it would bake that
    // inconsistency into the destination as a real, empty file.
    if (bytes === null) throw new Error(`Asset '${name}' is listed by the source but has no bytes.`)
    assets.push({ name, bytes })
  }

  const change: SiteWrite = {
    ...(siteJson === null ? {} : { siteJson }),
    pages,
    assets,
  }
  await to.write(slug, change)

  return {
    slug,
    siteJson: siteJson !== null,
    pages: pages.map((p) => p.name),
    assets: assets.map((a) => a.name),
  }
}
