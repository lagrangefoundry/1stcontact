import {
  admissibleBusiness,
  type Admission,
  type AdmittedBusiness,
  type IdentityEnv,
} from './identity'

/**
 * Which business this request operates on (REQ-168) — [[DOC-40]] §2.
 *
 * THE ONE PLACE THE ANSWER IS DECIDED. `TENANT_ID` used to be it: a deployment
 * variable, read in five places, serving every logged-in person the same tenant.
 * That was the honest interim `store.ts` argued for while there was one account
 * to model; [[REQ-167]] supplied the second and [[REQ-178]] supplied the set, so
 * the var stops being the answer to "whose site am I editing" and becomes what it
 * always meant underneath — the PLATFORM's own business, where `users` rows live.
 *
 * The failure this file exists to prevent is one site left behind: a reader still
 * on the var, quietly serving the platform's data into a customer's session. A
 * UAT asserts `env.TENANT_ID` has no reader outside this module and
 * `identity.ts`, so a sixth one cannot reappear unnoticed.
 *
 * A BUSINESS IS A TENANT, and the vocabulary here is deliberate. `tenant` is
 * internal — schema columns, R2 keys, store handles; *Business* is what a person
 * reads ([[REQ-180]] §3). The columns say `account_id` and the ids read `acct_…`,
 * and both have always held a tenant id; those are left alone because they are
 * opaque, permanent and in R2 keys, but nothing here repeats the confusion.
 */

/**
 * The scope, and why it is not a discriminated union.
 *
 * A previous draft wrote `{ kind: 'tenant'; id: string }`. A single-variant union
 * guards against a second variant that [[DOC-40]] §7 argues will never exist —
 * the parked operations assistant is a tenant-SWITCHING design, holding one
 * ordinary scoped handle at a time — while leaving unguarded the mix-up that can
 * actually happen: an account id and a business id are both opaque strings, and
 * `memberships.account_id` holds a business. Naming the field puts the type
 * system where the live confusion is.
 */
export interface Scope {
  businessId: string
}

/** Why a target was refused. Reaches the log; never the wire — see below. */
export type ScopeRefusal = 'unknown_business' | 'not_a_member' | 'no_entitlement'

/**
 * The caller named a business they may not operate.
 *
 * ONE REFUSAL FOR THREE REASONS, on the wire. "No such business", "you are not a
 * member" and "that grant lapsed" need different fixes and would genuinely be
 * more useful stated apart — and stating them apart turns this into an existence
 * oracle over every business in the system, to anyone who can pass a one-time
 * PIN. So the reason travels on the error, where {@link Response} handling can log
 * it for an operator, and the caller is told one thing. Same rule, same reason,
 * as `identity.ts`'s {@link DENIED_MESSAGE}.
 *
 * IT IS NOT A FALLBACK. Resolving an unauthorised target to something the caller
 * *can* reach would turn an authorisation failure into a confusing success in
 * someone else's business — the operator sees a builder, believes it is the one
 * they asked for, and edits the wrong site. Refusing is the only answer that
 * cannot be misread.
 */
export class ScopeRefusedError extends Error {
  readonly name = 'ScopeRefusedError'
  constructor(
    readonly reason: ScopeRefusal,
    readonly businessId: string,
  ) {
    super(`This account may not operate business '${businessId}' (${reason}).`)
  }
}

/**
 * `TENANT_ID` is unset on the one path that still needs it.
 *
 * The same message `store.ts` carried, kept verbatim because operators and two
 * UATs read it. A defaulted tenant id would be worse than useless: a
 * misconfigured Worker with write access to whichever account happened to carry
 * that name.
 */
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
 * An opener was handed a scope with no business in it.
 *
 * `resolveScope` cannot produce one — every branch either returns a business id
 * it read out of an admission or throws — so reaching this is a programming
 * error rather than a configuration one, and it is named differently from
 * {@link TenantNotConfiguredError} for exactly that reason. Telling an operator
 * to check `wrangler.toml` because a caller constructed `{ businessId: '' }` by
 * hand would send them to fix something that is not broken.
 *
 * IT IS STILL CHECKED, at each opener, because the alternative is a store handle
 * scoped to the empty string: `forTenant('')` looks up a tenant nobody
 * registered, so the failure would surface as "unknown tenant" and read as a
 * missing migration.
 */
export class UnscopedError extends Error {
  readonly name = 'UnscopedError'
  constructor(readonly opener: string) {
    super(
      `${opener} was given a scope with no business id. A scope comes from ` +
        '`resolveScope`, which never produces an empty one — something constructed ' +
        'this by hand.',
    )
  }
}

/** The prefix a request names its business with. */
const BUSINESS_PREFIX = '/b/'

/**
 * Split `/b/<businessId>/…` off the front of a path.
 *
 * WHY A PATH PREFIX AND NOT A HEADER. Three of `builder/api.js`'s functions do
 * not fetch anything — they return a URL the BROWSER loads: `previewUrl` into an
 * `<iframe src>`, `assetUrl` into the image picker's `<img src>`,
 * `materialFileUrl` into the Library's `<img>`/`<a>`. A browser attaches no
 * custom header to those and offers no hook to make it, so a header would leave
 * exactly the surfaces that render a customer's own content unscoped.
 *
 * WHY NOT A QUERY PARAMETER, which is the same shape and looks cheaper.
 * `/preview/<slug>/<channel>/…` serves the rendered page AND the page's own asset
 * bytes, and the render emits those references document-relative
 * (`relativizeUrl`, REQ-109). A relative sub-resource DROPS THE QUERY STRING —
 * so every image inside every preview would arrive unscoped and fall through to
 * the fallback, producing one business's page rendered with another's assets and
 * nothing anywhere to say so. A path prefix is inherited by relative
 * sub-resources by construction, and that inheritance is the whole reason it is
 * the answer rather than a matter of taste.
 *
 * OPTIONAL, AND ABSENT IS ORDINARY. Nothing sends it yet — [[REQ-179]]'s switcher
 * is what will — so every existing client keeps working and resolves through the
 * fallback below. That is what lets this ticket land ahead of the switcher and
 * still be correct.
 *
 * The id is decoded but NOT validated here. Whether it names a business this
 * caller may operate is an authorisation question and belongs in
 * {@link resolveScope}, which is the only place that can answer it.
 */
export function splitBusinessPrefix(pathname: string): {
  businessId: string | null
  path: string
} {
  if (!pathname.startsWith(BUSINESS_PREFIX)) return { businessId: null, path: pathname }
  const rest = pathname.slice(BUSINESS_PREFIX.length)
  const slash = rest.indexOf('/')
  // `/b/<id>` with no trailing slash names a business and no path; the route
  // table expects a leading slash on everything, so it gets `/`.
  const raw = slash === -1 ? rest : rest.slice(0, slash)
  const path = slash === -1 ? '/' : rest.slice(slash)
  if (raw === '') return { businessId: null, path: pathname }
  return { businessId: decodeURIComponent(raw), path }
}

/**
 * Resolve the business this request operates on.
 *
 * TAKES AN ADMISSION OR NOTHING, and the `null` is not a convenience. `index.ts`
 * skips both the Access gate and `admit` when `isUnconfiguredLocalDev` holds —
 * ten whole-Worker suites take that path, four more call `route()` directly and
 * never enter `index.ts` at all, and `1c builder`'s Node transport cannot call
 * `admit` even in principle because its `D1Database` is a `Proxy` that throws on
 * every access. On that path there is no token, no verified email and no
 * admissible set, so there is nothing for a fallback to choose FROM.
 *
 * SO THE DEV-OPEN BRANCH ANSWERS FROM `TENANT_ID`, and this is the last reader of
 * that var outside `identity.ts`. It lives inside the resolver, which is exactly
 * where the "no reader outside the resolver" UAT permits one. It cannot open a
 * deployed Worker: the caller gates it on the SAME `isUnconfiguredLocalDev`
 * predicate that skipped the gate — not a second condition that happens to agree
 * today — and that predicate requires both Access vars empty while
 * `wrangler.toml` sets them. Two independent mistakes, which is the standard
 * [[REQ-147]] set for `ACCESS_DEV_OPEN`.
 *
 * A TARGET IS IGNORED ON THAT BRANCH, deliberately. There is no identity to
 * authorise it against, and honouring it would make the loopback door the one
 * place a business is chosen without anyone checking — a shape that reads as a
 * feature and would eventually be relied upon.
 *
 * WITH AN ADMISSION, THE TARGET IS AUTHORISED AGAINST THE SET and never through
 * `accountFor`-style "first membership wins": [[REQ-178]] deleted the singular
 * `accountId` precisely so that no caller could serve whichever business sorted
 * first to a person who had selected the second.
 *
 * NO TARGET RESOLVES TO THE FIRST ADMISSIBLE BUSINESS. An earlier draft said "the
 * operator's last selection", which cannot be served: [[REQ-179]] keeps the
 * selection in browser storage, so a request with no target is by definition one
 * where browser storage did not reach the Worker. Nor does it need to be. `/` is
 * answered at the top of the route table, above the store, from a `chromeHtml()`
 * that takes no arguments — the first load needs no scope at all, and the first
 * request that does is an API call the chrome makes AFTER reading its own
 * storage. With the prefix above, a bookmarked deep link carries its business
 * too. What is left is a bare API caller, for which "the first one you may
 * operate" is the only answer that does not require inventing state.
 *
 * Never to `env.TENANT_ID` — that would serve the platform's own data into a
 * customer's session, which is the failure this whole file exists to prevent.
 */
export async function resolveScope(
  env: IdentityEnv,
  admission: Admission | null,
  requestedBusinessId?: string | null,
): Promise<Scope> {
  if (admission === null || !admission.ok) {
    const tenantId = (env.TENANT_ID ?? '').trim()
    if (tenantId === '') throw new TenantNotConfiguredError()
    return { businessId: tenantId }
  }

  const requested = (requestedBusinessId ?? '').trim()
  if (requested === '') return { businessId: firstAdmissible(admission.businesses).businessId }

  const held = admission.businesses.find((b) => b.businessId === requested)
  if (held) {
    if (!held.selectable) throw new ScopeRefusedError('no_entitlement', requested)
    return { businessId: held.businessId }
  }

  // THE BYPASS IS OVER MEMBERSHIP ONLY ([[DOC-40]] §6). `platform_admin` is
  // ambient so that it works before any membership exists and cannot lock its
  // holder out — but an administrator operating an expired account must see what
  // the customer sees, so the grant is still required, and a deactivated business
  // is still refused. It does not grant platform scope: what comes back is an
  // ordinary business handle, indistinguishable from the owner's.
  if (admission.user.platform_admin) {
    const business = await admissibleBusiness(env, requested)
    if (!business) throw new ScopeRefusedError('unknown_business', requested)
    if (!business.selectable) throw new ScopeRefusedError('no_entitlement', requested)
    return { businessId: business.businessId }
  }

  throw new ScopeRefusedError('not_a_member', requested)
}

/**
 * The first business the caller may actually enter.
 *
 * `businesses` is ordered by `granted_at` and holds lapsed members too — they are
 * returned so the switcher can show "your grant expired" rather than making a
 * lapsed business indistinguishable from a deleted one. So "first" has to mean
 * first SELECTABLE, or an account whose oldest business lapsed would resolve to
 * the one thing it cannot open.
 *
 * `admit` guarantees at least one selectable member on an `ok` admission — that
 * pair of conditions IS its decision — so the throw is a broken invariant rather
 * than a reachable state, and says so.
 */
function firstAdmissible(businesses: AdmittedBusiness[]): AdmittedBusiness {
  const business = businesses.find((b) => b.selectable)
  if (!business) {
    throw new Error(
      'An admitted account resolved to no selectable business. `admit` promises at ' +
        'least one; something has widened its success case without widening this.',
    )
  }
  return business
}
