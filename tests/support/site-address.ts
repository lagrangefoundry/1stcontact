import { env } from 'cloudflare:test'
import { claimHostname, businessAddresses } from '../../apps/control-app/src/hostname'
import type { IdentityEnv } from '../../apps/control-app/src/identity'

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
