import { guardAccess, type AccessEnv } from './access'
import {
  admit,
  DENIED_MESSAGE,
  type Admission,
  type DenialReason,
  type IdentityEnv,
} from './identity'
import { route, type RouterEnv } from './router'
import { NoBusinessError, resolveScope, ScopeRefusedError, splitBusinessPrefix } from './scope'
import { guardTerms } from './terms'

/**
 * `app.1stcontact.io` — the control app, and the builder itself (REQ-145).
 *
 * WHAT THIS WORKER USED TO BE. A pure proxy: it forwarded every request to a
 * Node origin (`1c builder`, a 700-line `node:http` server) and owned no
 * routing. The origin held the routes because it held the things a Worker could
 * not reach — the site definitions on the operator's disk, the webui components
 * in an out-of-repo package store, and a Vite/Astro transform for the render.
 *
 * All three are gone. The definitions live in D1 and R2 (REQ-143), the browser
 * assets are a build artifact served by the assets binding (`1c assets`), and
 * the render is `renderL1Document` — pure string templating with no Astro
 * involvement for a site made of L1, which is every site here but one. So the
 * origin is this Worker, and `1c builder` starts `wrangler dev` rather than a
 * second implementation of the same routes.
 *
 * THE ORDER BELOW IS THE SECURITY PROPERTY. Access is checked FIRST, before a
 * store handle exists and before a path is examined, so there is no route — not
 * a new one, not a mistyped one — that can be reached without a verified
 * identity. See `access.ts` for why the Worker verifies at all when Access
 * already enforces at the edge.
 *
 * AND A VERIFIED IDENTITY IS NO LONGER ADMISSION (REQ-167). The Access policy is
 * identity-only ([[DOC-40]] §3) — one-time PIN, any email — so passing the gate
 * proves who someone is and says nothing about whether they may be here. The
 * second check is `admit`, and it sits in exactly the same place and for exactly
 * the same reason: before a store handle exists, before a path is examined, so no
 * route can be reached by someone who was merely able to receive an email.
 *
 * AND ADMISSION IS NOT YET A SCOPE (REQ-168). `admit` answers *which businesses
 * may be operated*; `resolveScope` answers *which one this request operates on*,
 * and those are different questions the moment an account holds more than one
 * ([[DOC-40]] §2). They were the same value for exactly as long as there was one
 * business per account — which is why this handler used to call `admit`, check
 * `ok`, and then hand `route` an env and no scope at all, leaving every read in
 * the system on the deployment's own `TENANT_ID`.
 *
 * THE THIRD STEP SITS WHERE THE OTHER TWO DO, for the third time for the same
 * reason: before a store handle exists and before a path is examined.
 *
 * AND A FOURTH, BETWEEN ADMISSION AND SCOPE (REQ-169). Being admitted is not the
 * same as having agreed to the terms under which the account is operated
 * ([[DOC-40]] §4), and the agreement is a property of the PERSON — so it is
 * checked once `admit` has produced one and before `resolveScope` has chosen a
 * business, because refusing over a business the caller has not yet been shown
 * would be answering the wrong question. It is in `fetch` for the same reason the
 * other three are: a session that has not accepted must be refused every asset
 * and every API route, not merely un-navigated-to.
 */

export interface Env extends AccessEnv, RouterEnv, IdentityEnv {
  /**
   * LOCAL DEVELOPMENT ONLY, and only when Access is unconfigured.
   *
   * `wrangler dev` serves on `127.0.0.1`, which no Access policy fronts, so the
   * gate — which fails closed, correctly — would refuse every request an
   * operator made to their own builder. This var is the honest way to say "this
   * is the loopback dev server", and it is deliberately shaped so that it cannot
   * open a deployed Worker:
   *
   *   1. it only applies when ACCESS_TEAM_DOMAIN / ACCESS_AUD are BOTH empty, so
   *      a configured deployment ignores it entirely;
   *   2. it is declared under top-level [vars] — which `wrangler dev` reads and
   *      `wrangler deploy --env production` does NOT, because a named
   *      environment inherits no vars — and is absent from
   *      [env.production.vars];
   *   3. a UAT asserts (2), so restoring it there fails the build rather than
   *      the audit.
   *
   * Opening production therefore takes two independent mistakes, which is the
   * same standard REQ-147 set for `workers_dev`.
   */
  ACCESS_DEV_OPEN?: string
}

/**
 * True when this is the loopback dev server and Access has nothing to check.
 * Both halves are required; either alone denies.
 */
function isUnconfiguredLocalDev(env: Env): boolean {
  const configured =
    (env.ACCESS_TEAM_DOMAIN ?? '').trim() !== '' || (env.ACCESS_AUD ?? '').trim() !== ''
  return !configured && (env.ACCESS_DEV_OPEN ?? '').trim() === '1'
}

/**
 * The freshness directive is the ROUTER's, not this file's — see `router.ts`.
 * It was here first, which left the Node transport (which calls `route()`
 * directly) serving uncached-but-unmarked bytes: a per-host restatement is as
 * forgettable as a per-route one.
 *
 * What remains here is the failure this file alone can produce: a store that
 * could not be constructed, before any route ran.
 */
function uncacheable(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('cache-control', 'no-store, must-revalidate')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

/**
 * The refusal a caller who is not entitled receives.
 *
 * ONE MESSAGE FOR EVERY REASON. "No such user" and "expired grant" need
 * different fixes and would be genuinely more helpful stated separately — and
 * separating them turns this endpoint into an account-existence oracle for
 * anyone who can pass a one-time PIN, which is anyone with an email address. So
 * the difference goes to the log, where the operator is, and not to the wire,
 * where the visitor is ([[DOC-40]] §5).
 *
 * 403 RATHER THAN 401. A 401 says "authenticate", and the caller already did —
 * Access verified them. Sending them back round the login loop would produce the
 * same token and the same refusal, forever.
 */
function denied(admission: Extract<Admission, { ok: false }>): Response {
  // The distinction, stated where an operator can find it. Structured rather
  // than prose so it can be queried out of the invocation logs `wrangler.toml`
  // keeps every one of.
  console.warn(
    JSON.stringify({ event: 'admission_denied', reason: admission.reason, email: admission.email }),
  )
  return new Response(DENIED_MESSAGE, {
    status: 403,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  })
}

/**
 * The refusal a caller who named someone else's business receives.
 *
 * THE SAME ONE MESSAGE, for the reason {@link denied} states: "no such business",
 * "you are not a member" and "that grant lapsed" need different fixes and would
 * be genuinely more useful stated apart — and stating them apart turns this into
 * an existence oracle over every business in the system, to anyone who can pass a
 * one-time PIN, which is anyone. The reason goes to the invocation log, where the
 * operator is, and not to the wire, where the visitor is.
 */
function refused(err: ScopeRefusedError): Response {
  console.warn(
    JSON.stringify({ event: 'scope_refused', reason: err.reason, business: err.businessId }),
  )
  return new Response(DENIED_MESSAGE, {
    status: 403,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  })
}

/**
 * What a route needing a business tells an account that has none.
 *
 * NOT {@link DENIED_MESSAGE}, and the difference is the reason that message is
 * the shape it is. `DENIED_MESSAGE` says one thing to everybody because the
 * caller might not be anybody — telling a refused visitor which of "no such
 * account" and "expired grant" they hit is an account-existence oracle to
 * anyone who can pass a one-time PIN. Nobody reaches THIS message without a live
 * membership ([[DOC-42]] §4), so it is a fact about the reader's own account,
 * owed to them, and disclosing nothing about anybody else's — the same argument
 * `BusinessLapse` is carried on the wire under.
 *
 * IT POINTS AT THE SWITCHER RATHER THAN EXPLAINING. The per-business reason is
 * already on `/api/businesses` and already rendered ([[REQ-179]], [[REQ-180]]
 * §1), so restating it here would be a second copy of a sentence that can
 * disagree with the first. This is the fallback an API caller sees; the screen
 * is where the answer lives.
 *
 * 403 AND NOT 402. "Payment required" is the honest status and there is nothing
 * to pay with yet ([[REQ-183]] owns the surface), so it would name a remedy this
 * deployment cannot offer.
 */
const NO_BUSINESS_MESSAGE =
  'No business on this account can be opened at the moment. The business ' +
  'switcher lists each one and says why.'

/**
 * The refusal an admitted account with nothing selectable receives.
 *
 * LOGGED AS `no_entitlement`, which is why that {@link DenialReason} value
 * survives the change that stopped it refusing ([[DOC-42]] §10.1). The state it
 * names is unchanged and still the first thing an operator needs when a customer
 * says "it says no"; what moved is where it is recorded — off the admission
 * decision, which now admits, and onto the resolver, which is where the
 * consequence is.
 */
function noBusiness(admission: Admission | null): Response {
  console.warn(
    JSON.stringify({
      event: 'no_business',
      reason: 'no_entitlement' satisfies DenialReason,
      email: admission?.ok ? admission.user.email : null,
    }),
  )
  return new Response(NO_BUSINESS_MESSAGE, {
    status: 403,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  })
}

/**
 * `ctx` IS TAKEN AND PASSED ON (BUG-46), and this is the only place it exists.
 *
 * `ExecutionContext` is given to the fetch handler and to nothing else, so a
 * route that needs to outlive its response can only get it by being handed it
 * from here. `/api/ai/prompt` needs exactly that: a turn's last act is to append
 * `turn_end` and drain the junction to D1, and an operator who reloads mid-reply
 * cancels the SSE while that drain is still going. Before this it died with the
 * request — the tool calls had committed, so the site changed and the
 * conversation did not.
 *
 * It is threaded rather than reached for because there is nothing to reach for:
 * the router has hosts with no execution context at all (the Node transport in
 * `builder.ts`), which is why `route` takes it optionally and degrades to the
 * old behaviour without it.
 *
 * OPTIONAL HERE TOO, for the same reason and one more. workerd always supplies
 * it, so in production this is never absent; but this handler is also called
 * directly by the suites, and a required parameter would make every one of them
 * construct a context to exercise a route that has nothing to do with one. The
 * tests that care about the drain pass a real one and assert on it — which is
 * the distinction worth keeping visible, rather than burying it in ceremony at
 * three dozen call sites that do not.
 */
export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    // DECLARED OUTSIDE THE `try` SO THE CATCH CAN READ IT. `NoBusinessError` is
    // thrown from inside the router, several frames down, and the one thing its
    // log line needs is who it happened to — which only exists here.
    let admission: Admission | null = null
    try {
      // The business the caller is ASKING for. Whether they may have it is
      // `resolveScope`'s question, and asking it here rather than in the router
      // is what keeps authorisation ahead of routing.
      const requested = splitBusinessPrefix(new URL(request.url).pathname).businessId

      // `admit`, OR NOTHING — gated on the SAME predicate that skips the gate,
      // not on a second condition that happens to agree with it today. Two
      // predicates that can drift is how a deployment ends up resolving a
      // loopback scope while enforcing a production gate, or the reverse.
      if (!isUnconfiguredLocalDev(env)) {
        const gate = await guardAccess(request, env)
        if (!gate.ok) return gate.response

        admission = await admit(env, gate.email)
        if (!admission.ok) return denied(admission)

        // Terms LAST of the identity checks, and inside this block rather than
        // after it: the dev-open branch has no admission at all, so there is no
        // person to have accepted anything and nothing to check.
        const terms = await guardTerms(request, env, admission)
        if (terms) return terms
      }

      const scope = await resolveScope(env, admission, requested)
      // THE ADMISSION TRAVELS WITH THE SCOPE, and only one route reads it
      // ([[REQ-179]]). `/api/businesses` answers a question about the ACCOUNT —
      // which businesses may be operated — and that is the question `admit`
      // already answered here, ahead of routing. Handing the answer down is what
      // keeps it a single answer; asking again inside the router would need the
      // verified email the router is deliberately never given.
      return await route(request, env, scope, { admission }, ctx)
    } catch (err) {
      // A REFUSED TARGET IS A 403, NOT THE 503 BELOW. The caller named a business
      // they may not operate: an answer about them, not a configuration failure
      // an operator can act on. Dressing it as one would invite a retry that
      // fails identically forever, and would put someone else's business id in
      // front of an operator as though it were theirs to fix.
      if (err instanceof ScopeRefusedError) return refused(err)
      // THE SAME REASONING, ONE STEP EARLIER. The caller named no business and
      // holds none they may open — an answer about their account, not a
      // configuration failure. Before [[DOC-42]] §10.1 this was unreachable: the
      // account was refused at the door instead, which is the refusal that took
      // away the remedy along with the access.
      if (err instanceof NoBusinessError) return noBusiness(admission)
      // Anything reaching here escaped the router's own handler, or the
      // admission check ahead of it — a store that could not be constructed, an
      // identity table that is not migrated, most likely a missing binding or an
      // unknown tenant. It is a configuration failure rather than a bad request,
      // and it says so in prose an operator can act on.
      const message = err instanceof Error ? err.message : String(err)
      return uncacheable(
        new Response(message, {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      )
    }
  },
} satisfies ExportedHandler<Env>
