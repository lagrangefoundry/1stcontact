import {
  d1r2SiteStore,
  UnknownTenantError,
  type TenantSiteStore,
} from '../../../tools/generate/src/store/d1r2-store'
import { UnscopedError, type Scope } from './scope'

/**
 * The Worker's store handle (REQ-145).
 *
 * ONE TENANT, CHOSEN BY THE CALLER'S IDENTITY (REQ-168). `d1r2SiteStore` hands
 * back a root that can do nothing until `forTenant` is called, and the tenant is
 * *checked* there — an unknown or inactive one is refused at construction rather
 * than yielding a handle that silently reads nothing. So the tenant has to come
 * from somewhere, and it comes from {@link Scope}.
 *
 * IT USED TO COME FROM A VAR, and the argument for that is worth keeping because
 * this file made it: with one account to model against, `TENANT_ID` said "this
 * deployment serves one tenant" out loud, in the file an operator reads, instead
 * of implying a multi-tenant routing decision that nothing implemented. The
 * prediction it ended on has now happened — [[REQ-167]] supplied the second
 * account, [[REQ-178]] supplied the set, and `scope.ts` is the mapping this
 * comment said would arrive with the ticket that needed it.
 *
 * NO DEFAULT, AND NO READ OF `TENANT_ID` LEFT HERE. The scope is a required
 * argument rather than an optional one with a fallback, because a fallback is
 * how one call site gets left behind reading the platform's own business and
 * serving its data into a customer's session. `scope.ts` is the single place
 * that var is still read, and only on the branch that has no identity at all.
 */

export interface StoreEnv {
  DB: D1Database
  SITES: R2Bucket
}

/**
 * Kept as a re-export because it is thrown on this file's behalf, one layer up.
 *
 * `TENANT_ID`'s absence is still a refusal and still says the same sentence — it
 * just belongs to the resolver now, which is the only thing that reads the var.
 * Exporting it from here as well keeps `router.ts`'s existing `instanceof` and
 * two UATs pointing at one class rather than at two that happen to agree.
 */
export { TenantNotConfiguredError } from './scope'

/**
 * The store for this request, with the configured tenant made to exist.
 *
 * WHAT WENT WRONG WITHOUT THIS (BUG-36). A freshly deployed builder was dead on
 * arrival. `bin/deploy` applies the migrations, so the schema was there and the
 * `tenants` table was empty — and `forTenant` refuses an unregistered tenant, as
 * it must. So every read 503'd, the chrome's top-level `await` on `/api/sites`
 * rejected, and nothing mounted: the operator got a boot guard rather than a
 * builder. The only cure was for someone to run `bin/publish` from a laptop,
 * because the import route opened the store through a SECOND function that
 * registered the tenant first. One deployment, one configured tenant, two
 * openers that disagreed about whether it existed.
 *
 * They are one opener now, and the registration is the read path's too. This is
 * not a widening of what a Worker may create: `tenantId` comes from the resolved
 * {@link Scope}, which `resolveScope` authorised against this caller's admission,
 * so it can name exactly the business they may already operate and can reach no
 * other. That was always the argument for putting it on the import route; it is
 * the same argument, applied where its absence was the outage.
 *
 * THE TENANT IS THE SCOPE'S, so this can name exactly the business the caller was
 * authorised for and can reach no other — which is the same argument the var
 * version made, resting on an authorisation check instead of on a deployment
 * having one tenant.
 *
 * ONLY ON `unknown`, NEVER ON `inactive`. A deactivated tenant is a decision
 * someone made, and self-healing past it would turn account suspension into a
 * suggestion. The reason is checked explicitly rather than relied upon to fail
 * again on the retry — `createTenant` is `INSERT OR IGNORE`, so an inactive row
 * survives it, but a guarantee that reads as an accident is not one.
 *
 * COLD PATH ONLY. The ordinary request finds the row on the first `forTenant`
 * and pays one indexed lookup by primary key, exactly as before; the create runs
 * once in a database's life. Registering unconditionally would put a write on
 * every request to buy nothing.
 *
 * Constructed per request rather than memoised per isolate: `forTenant` performs
 * the tenant check, and a handle cached across requests would carry a check made
 * against a tenant row that may since have been deactivated. The check is one
 * indexed lookup by primary key; caching it would trade a real guarantee for a
 * saving nobody measured.
 */
export async function storeFor(env: StoreEnv, scope: Scope): Promise<TenantSiteStore> {
  const tenantId = scope.businessId
  if (tenantId === '') throw new UnscopedError('storeFor')
  const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  try {
    return await root.forTenant(tenantId)
  } catch (err) {
    if (!(err instanceof UnknownTenantError) || err.reason !== 'unknown') throw err
    await root.createTenant({ id: tenantId, name: tenantId })
    return root.forTenant(tenantId)
  }
}
