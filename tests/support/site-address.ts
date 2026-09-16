import { env } from 'cloudflare:test'
import {
  attachCustomHosts,
  claimHostname,
  businessAddresses,
  addressesOf,
  PLATFORM_APEX,
  type AddressKind,
  type SiteAddress,
} from '../../apps/control-app/src/hostname'
import type { IdentityEnv } from '../../apps/control-app/src/identity'
import { newId } from '../../tools/generate/src/store/ids'

/**
 * Give a business a public address, so its site can be published ([[REQ-238]]).
 *
 * WHY EVERY PUBLISH FIXTURE NEEDS ONE NOW. *"To go live a business needs a
 * `1stc.site` hostname, a custom domain, or both"* — so `POST /api/publish`
 * refuses a business that has never chosen one, and a suite whose subject is
 * something else entirely (the revision log, the streaming frames, the template
 * gate) has to get past that door before it can assert anything.
 *
 * IT CLAIMS THROUGH THE SHIPPED OPERATION AND NOT WITH AN `INSERT`. The row this
 * plants is the row a customer's claim plants, past the same syntactic rule, the
 * same reserved list and the same unique index — so a fixture cannot quietly
 * create an address the product could not have issued, which is precisely the
 * kind of fixture that keeps passing after the rule it was meant to respect has
 * changed.
 *
 * IDEMPOTENT, BECAUSE THE RULE IT RESPECTS SAYS SO. A business holds one
 * hostname, at a time, for good; a fixture calling this twice for one business
 * is asking *"make sure this business can publish"* rather than *"claim a second
 * one"*, and the second is refused by the product and must not be attempted
 * here.
 *
 * THE LABEL IS RANDOM AND IS NEVER ASSERTED ON. `1stc.site` is a global
 * first-come namespace and nothing is ever re-issued, so two fixtures sharing a
 * spelling would make the second of them fail depending on which ran first. A
 * test that cares WHICH hostname a business has claims it itself and asserts on
 * what it chose.
 */
export async function giveBusinessAnAddress(businessId: string): Promise<string> {
  const identity = { DB: env.DB, SITES: env.SITES } as unknown as IdentityEnv
  const held = await businessAddresses(identity, businessId)
  if (held.length > 0) return held[0].host
  const label = `uat${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`
  return (await claimHostname(identity, businessId, label)).host
}

/**
 * Give ONE SITE a public address, whichever kind ([[BUG-97]], [[REQ-238]]).
 *
 * WHY THIS ONE WRITES THE ROW AND {@link giveBusinessAnAddress} DOES NOT. That
 * one claims through the shipped operation, which is the right discipline and
 * cannot answer either of the two questions this file now has to:
 *
 *   - **A `custom` address is claimed through its own shipped operation now**
 *     ([[REQ-258]]). It had none when this helper was written — `kind: 'custom'`
 *     was declared and not implemented — so an insert was the only way to seed
 *     one. `attachCustomHosts` exists, so the custom branch below uses it, past
 *     the same syntactic rule, the same platform-apex refusal and the same
 *     unique index a real attachment goes through. What still cannot go through
 *     a shipped operation is the SERVING mechanism around it, and deliberately:
 *     a fixture that called `serveHostOnSite` would need a Cloudflare client,
 *     and a suite whose subject is a mailed link has no business holding one.
 *   - **`claimHostname` is scoped to the BUSINESS and refuses a second platform
 *     label**, by design — *"one hostname per business, at a time"*. A fixture
 *     seeding several sites in one tenant is asking a question about SITES, and
 *     the schema's own rule is per site: `idx_site_domains_site_platform` is
 *     `UNIQUE (site_id) WHERE kind = 'platform' AND status = 'active'`. So the row
 *     this plants is one the schema fully sanctions and the code deliberately
 *     declines to mint — which `0008`'s own comment records as the weaker of the
 *     two statements of the rule, and as the shape that becomes reachable the day
 *     a site selector lands.
 *
 * WHAT IT STILL WILL NOT DO IS INVENT A HOST THE PRODUCT COULD NOT ISSUE. A
 * platform address is composed the same way `hostFor` composes one — a label
 * under {@link PLATFORM_APEX} — so nothing here seeds an address under a domain
 * this product does not own.
 *
 * IDEMPOTENT PER SITE AND PER KIND, on `giveBusinessAnAddress`'s reasoning: a
 * caller asking twice is asking *"make sure this site has one"*.
 */
export async function giveSiteAnAddress(
  siteKey: string,
  kind: AddressKind = 'platform',
): Promise<SiteAddress> {
  const identity = { DB: env.DB, SITES: env.SITES } as unknown as IdentityEnv
  const held = (await addressesOf(identity, siteKey)).find((a) => a.kind === kind)
  if (held) return held

  // RANDOM, AND NEVER ASSERTED ON BY SPELLING. `1stc.site` is a global
  // first-come namespace and nothing is ever re-issued, so two fixtures sharing a
  // label would make the second fail depending on which ran first.
  const label = `uat${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`
  if (kind === 'custom') {
    const [attached] = await attachCustomHosts(identity, siteKey, {
      canonicalHost: `${label}.example.test`,
    })
    return attached
  }

  const host = `${label}.${PLATFORM_APEX}`
  // CANONICAL ONLY IF NOTHING ELSE ALREADY IS ([[REQ-258]]), which is the rule
  // `claimHostname` applies and is the one `idx_site_domains_site_canonical`
  // enforces. A fixture seeding a platform address onto a site that already
  // holds a custom one would otherwise be refused by the index — and the failure
  // would read as a broken helper rather than as the rule it is.
  const canonical = (await addressesOf(identity, siteKey)).every((a) => !a.canonical)
  const address: SiteAddress = { id: newId('dom'), siteKey, host, kind, canonical }
  await env.DB.prepare(
    "INSERT INTO site_domains (id, site_id, host, kind, status, canonical, created_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
  )
    .bind(address.id, siteKey, host, kind, canonical ? 1 : 0, new Date().toISOString())
    .run()
  return address
}
