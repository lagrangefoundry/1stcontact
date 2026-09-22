/**
 * Every site on the platform, with who owns it and where it is reachable
 * ([[REQ-298]]).
 *
 * THE OPERATOR CONSOLE'S LEFT-HAND LIST, AND NOTHING ELSE READS IT. The question
 * is *what have we published, for whom* — asked across every business at once,
 * which is what makes it a platform read rather than a business one and is why
 * it sits behind the same gate and the same 404 as the meter.
 *
 * A SEPARATE READ FROM `tenantSpendLeague` AND DELIBERATELY NOT FOLDED INTO IT.
 * That one answers the meter and is ordered by it, so a business with no measured
 * turn is absent from it by the record's own rule — *nothing, never zero*. A site
 * with no spend must still appear HERE, because this is a directory and a
 * directory that quietly omitted the quiet ones would be read as complete. Adding
 * optional non-meter rows to the meter route is how one route acquires two
 * answers; the console joins the two by business id, which it can do because both
 * name a business the same way.
 *
 * EVERY JOIN IS A LEFT JOIN, for the reason the league gives about its own: a
 * site whose owning ACCOUNT has gone is exactly the row worth noticing, and an
 * inner join would drop it silently — so it reads as a site whose account is
 * named and unknown rather than as no site at all. `accounts` carries no foreign
 * key from `tenants` (`0001_baseline.sql` argues that deliberately), so this is
 * a reachable state and a UAT constructs it.
 *
 * THE JOIN TO `tenants` IS A LEFT JOIN TOO, AND THAT ONE IS DEFENCE AGAINST A
 * SCHEMA CHANGE RATHER THAN AGAINST TODAY'S DATA. `sites.tenant_id` IS a foreign
 * key, with `ON DELETE CASCADE`, so a site outliving its business is currently
 * impossible by construction — a deleted business takes its sites with it. What
 * an inner join would buy is nothing, and what it would cost is a directory that
 * silently shrinks the day that constraint is relaxed. The column is nullable in
 * the shape below for the same reason.
 *
 * THE ADDRESS COMES THROUGH `hostname.ts` AND IS NOT A SECOND READ OF
 * `site_domains`. That module is the one place the table is read
 * ({@link addressesOf}) and the one place *which host should a link wear* is
 * decided ({@link addressForLinks}) — a `SELECT ... FROM site_domains` written
 * here would be a second opinion about a fact the publish gate already refuses
 * on, free to disagree with it about whether a site is reachable.
 */

import { addressForLinks, addressesOf } from './hostname'
import type { IdentityEnv } from './identity'

/**
 * One site, as the console lists it.
 *
 * THE BUSINESS IS NAMED TWICE — by key and by label — because the key is what
 * the spend league is joined on and the label is what a person reads. A shape
 * carrying only the label could not be joined; one carrying only the key would
 * put our data model on a screen ([[REQ-180]] §3).
 */
export interface PlatformSite {
  /** The site's key — `sites.id`, which is what every other route names it by. */
  site: string
  /** The business that owns it — `sites.tenant_id`. */
  business: string
  /** Its label, or `null` where no `tenants` row answers. See the header. */
  businessName: string | null
  /**
   * The account the business belongs to, or `null`.
   *
   * `NULL` IS THE PLATFORM BUSINESS AND NOTHING ELSE, which `0001_baseline.sql`
   * says in terms. It is carried through as `null` rather than smoothed into a
   * blank so the surface can say *which* absence it is — 1st Contact's own site
   * has no owner account because it is nobody's customer, and that is a
   * different fact from an account row having gone missing.
   */
  ownerAccount: string | null
  /** The account's name, or `null` — `accounts.name` is itself nullable. */
  ownerAccountName: string | null
  /** The account's status, or `null` where no `accounts` row answers. */
  ownerAccountStatus: string | null
  /**
   * The host a link to this site should wear, or `null` for a site with none.
   *
   * THE WHOLE HOST, NEVER A LABEL, and never a URL. `hostname.ts` holds itself
   * to the first rule and this shape inherits it; the scheme is the reader's
   * business, and a column that stored one would have to be re-decided the day
   * anything but `https` is meaningful.
   *
   * `null` IS THE SAME FACT `POST /api/publish` REFUSES ON with
   * `NO_PUBLIC_ADDRESS` — both ask {@link addressesOf} and neither has an
   * opinion of its own — so the console and the refusal cannot come to disagree
   * about whether a site can be reached.
   */
  address: string | null
  /** When the site row was written. */
  createdAt: string
}

/** The columns one row is assembled from, as SQLite hands them back. */
interface SiteRow {
  site: string
  business: string
  business_name: string | null
  owner_account: string | null
  owner_account_name: string | null
  owner_account_status: string | null
  created_at: string
}

/**
 * Every customer-facing site on the platform, oldest business first.
 *
 * `kind = 'site'` AND NOT EVERY ROW IN THE TABLE. A portal is authored under the
 * same business ([[REQ-236]]'s `kind`) and is not the thing a public hostname
 * reaches — `siteOf` already draws that line for exactly this reason. Listing
 * portals would put a permanent *no public address* row beside every business,
 * which would bury the one signal this column exists to carry: the customer site
 * that was built and never published.
 *
 * THE ORDER HERE IS NOT THE ORDER ON SCREEN, and that is the division of labour
 * the ticket asks for. This read is ordered so it is stable and so a business's
 * sites arrive adjacent; the console orders by the business's cost over the
 * period it is showing, which is a property of the surface and of a window this
 * route knows nothing about.
 *
 * THE ADDRESSES ARE A FAN-OUT, ONE AT A TIME, on `tenantSpendLeague`'s own
 * reasoning: a Worker is bounded in how many subrequests it may make, and a
 * console read is a person looking at a table rather than a request on a hot
 * path — so the shape that cannot fall over as the platform grows is preferred
 * over the one that is briefly faster while it is small.
 */
export async function platformSites(env: IdentityEnv): Promise<PlatformSite[]> {
  const { results } = await env.DB.prepare(
    'SELECT s.id AS site, s.tenant_id AS business, s.created_at AS created_at, ' +
      't.name AS business_name, t.owner_account_id AS owner_account, ' +
      'a.name AS owner_account_name, a.status AS owner_account_status ' +
      'FROM sites s ' +
      'LEFT JOIN tenants t ON t.id = s.tenant_id ' +
      'LEFT JOIN accounts a ON a.id = t.owner_account_id ' +
      "WHERE s.kind = 'site' " +
      'ORDER BY s.tenant_id, s.created_at, s.id',
  ).all<SiteRow>()

  const sites: PlatformSite[] = []
  for (const row of results ?? []) {
    sites.push({
      site: row.site,
      business: row.business,
      businessName: row.business_name ?? null,
      ownerAccount: row.owner_account ?? null,
      ownerAccountName: row.owner_account_name ?? null,
      ownerAccountStatus: row.owner_account_status ?? null,
      address: addressForLinks(await addressesOf(env, row.site))?.host ?? null,
      createdAt: row.created_at,
    })
  }
  return sites
}
