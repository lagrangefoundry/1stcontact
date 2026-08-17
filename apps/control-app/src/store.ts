import { d1r2SiteStore, type TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'

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
 * The store for this request.
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
  return d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(tenantId)
}

/**
 * The store for an IMPORT, with the configured tenant made to exist first.
 *
 * A fresh database has the schema and no rows, so `forTenant` correctly refuses
 * — there is genuinely no such tenant — and the very first `bin/publish` could
 * never land. Something has to create the row, and the choice is where.
 *
 * It is HERE, and it is bounded to `TENANT_ID`. This registers exactly the one
 * tenant the deployment is already configured to serve and can name no other, so
 * it cannot become a way to reach or create a second account; that is why it is
 * not on {@link storeFor}, where every read and write would inherit it and an
 * unknown tenant would stop being an error at all. A migration could not do it
 * either: migrations are schema, and which tenant a deployment serves is
 * configuration.
 *
 * Idempotent — `createTenant` is idempotent on id — so it is a no-op on every
 * import after the first.
 */
export async function storeForImport(env: StoreEnv): Promise<TenantSiteStore> {
  const tenantId = (env.TENANT_ID ?? '').trim()
  if (tenantId === '') throw new TenantNotConfiguredError()
  const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await root.createTenant({ id: tenantId, name: tenantId })
  return root.forTenant(tenantId)
}
