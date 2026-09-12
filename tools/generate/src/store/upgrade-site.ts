import { upgradePageModules } from '@1stcontact/framework/worker'
import type { InstanceUpgrade, StoredInstance } from '@1stcontact/framework/worker'
import type { SiteStore, StoredPage } from './site-store'

/**
 * Carrying one site's stored module instances across contract version bumps
 * ([[BUG-85]]).
 *
 * WHY IT IS PORT-TO-PORT, for the same reason {@link ./import-site.importSite}
 * is and with more at stake. The store that orphaned an instance was **D1**,
 * and the only copy the bumping commit migrated was the filesystem fixture —
 * because that commit migrated by editing a file in the repo, and a migration
 * performed that way can only ever reach the fixtures. A repair expressed
 * against `node:fs` would have exactly that reach and would leave the real
 * defect in place. Expressed over {@link SiteStore} it runs wherever an adapter
 * does: the operator's `storage/sites/` tree in Node, and D1 inside the Worker
 * that holds the binding.
 *
 * IT IS READ-ONLY UNLESS ASKED. {@link UpgradeSiteOptions.write} is absent by
 * default, so the ordinary run reports and changes nothing. A facility that
 * rewrites live site data the first time somebody runs it is not one to hand an
 * operator — particularly this one, whose whole subject is data that turned out
 * to be different from what everybody believed.
 *
 * ITS DEFAULT MODE IS ALSO THE AUDIT. "Which stored instances no longer
 * resolve" and "what would an upgrade do" are the same question asked twice,
 * and answering it in one place is what stops the report and the repair
 * disagreeing about what is stale.
 */

export interface UpgradeSiteOptions {
  /**
   * Write the upgraded pages back. Absent means report only.
   *
   * When set, every changed page crosses in ONE {@link SiteWrite}, so against
   * the D1 adapter the whole site upgrades in a single `db.batch()`. A
   * half-applied upgrade is the worst of the three outcomes: some pages on the
   * new contract, some on the old, and nothing in the store to say which.
   */
  write?: boolean
  /**
   * The site version this upgrade was computed against, passed through as the
   * write's compare-and-set. Supply it when something else may be editing —
   * the builder, an AI turn — and the write is refused rather than clobbering.
   */
  expect?: number
}

/** One page's worth of upgrade, reported whether or not it was applied. */
export interface PageUpgrade {
  /** The page's store key, e.g. `home.json`. */
  name: string
  upgrades: InstanceUpgrade[]
}

export interface UpgradeSiteReport {
  slug: string
  /** Only pages that had something stale. A clean site reports an empty list. */
  pages: PageUpgrade[]
  /** Total stale instances found, across every page. */
  stale: number
  /** True when the report was applied to the store. */
  written: boolean
}

/**
 * Upgrade every stale module instance in `slug`'s draft.
 *
 * Throws rather than reporting when a migration is missing or produces an
 * instance its own contract rejects — those are defects in the catalog, not
 * states of the site, and a report listing them as findings would invite an
 * operator to work around a bug that belongs to whoever bumped the version.
 */
export async function upgradeSiteModules(
  store: SiteStore,
  slug: string,
  opts: UpgradeSiteOptions = {},
): Promise<UpgradeSiteReport> {
  if (!(await store.hasDraft(slug))) {
    throw new Error(`Site '${slug}' has no draft to upgrade.`)
  }

  const pages = await store.readPages(slug)
  const changed: StoredPage[] = []
  const report: PageUpgrade[] = []

  for (const { name, page } of pages) {
    const modules = page.modules
    // A page with no `modules` key at all is ordinary — an L1-only page — and
    // is not the same thing as one whose `modules` is malformed, which is the
    // store's problem and not an upgrade's to diagnose.
    if (!Array.isArray(modules)) continue

    const result = upgradePageModules(modules as StoredInstance[])
    if (result.upgrades.length === 0) continue

    report.push({ name, upgrades: result.upgrades })
    changed.push({ name, page: { ...page, modules: result.modules } })
  }

  const stale = report.reduce((n, p) => n + p.upgrades.length, 0)
  const written = opts.write === true && changed.length > 0
  if (written) {
    await store.write(slug, {
      pages: changed,
      ...(opts.expect === undefined ? {} : { expect: opts.expect }),
    })
  }

  return { slug, pages: report, stale, written }
}
