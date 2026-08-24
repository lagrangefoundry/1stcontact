import {
  d1r2SiteStore,
  UnknownTenantError,
  type TenantSiteStore,
} from '../../../tools/generate/src/store/d1r2-store'

/**
 * The Worker's store handle (REQ-145).
 *
 * ONE TENANT, NAMED IN CONFIGURATION. `d1r2SiteStore` hands back a root that can
 * do nothing until `forTenant` is called, and the tenant is *checked* there — an
 * unknown or inactive one is refused at construction rather than yielding a
 * handle that silently reads nothing. So the tenant has to come from somewhere,
 * and for now it comes from a var.
 *
 * WHY A VAR AND NOT THE ACCESS IDENTITY. Deriving the tenant from the verified
 * Access claims is where this ends up — the gate already proves who the caller
 * is (`access.ts`) — but that mapping is a piece of account modelling with no
 * second account to model against yet. A var is the honest interim: it says
 * "this deployment serves one tenant" out loud, in the file an operator reads,
 * instead of implying a multi-tenant routing decision that nothing implements.
 * Cross-tenant admin arrives with the ticket that needs it.
 *
 * FAIL LOUD ON A MISSING TENANT. An unset `TENANT_ID` is a deployment that
 * cannot serve anything, and it must say so. Defaulting to a well-known name
 * would be worse than useless: it would let a misconfigured Worker read and
 * WRITE into whichever tenant happened to carry that name.
 */

export interface StoreEnv {
  DB: D1Database
  SITES: R2Bucket
  /** The account this deployment serves. No default — see above. */
  TENANT_ID?: string
}

export class TenantNotConfiguredError extends Error {
  readonly name = 'TenantNotConfiguredError'
  constructor() {
    super(
      'TENANT_ID is not configured. This Worker serves one tenant and cannot ' +
        'infer which — set it in apps/control-app/wrangler.toml, under [vars] for ' +
        '`wrangler dev` and again under [env.production.vars], which does not inherit it.',
    )
  }
}

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
 * not a widening of what a Worker may create: `tenantId` comes from the
 * deployment's own `TENANT_ID`, so this can name exactly the account the
 * configuration already names and can reach no other. That was always the
 * argument for putting it on the import route; it is the same argument, applied
 * where its absence was the outage.
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
export async function storeFor(env: StoreEnv): Promise<TenantSiteStore> {
  const tenantId = (env.TENANT_ID ?? '').trim()
  if (tenantId === '') throw new TenantNotConfiguredError()
  const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  try {
    return await root.forTenant(tenantId)
  } catch (err) {
    if (!(err instanceof UnknownTenantError) || err.reason !== 'unknown') throw err
    await root.createTenant({ id: tenantId, name: tenantId })
    return root.forTenant(tenantId)
  }
}
