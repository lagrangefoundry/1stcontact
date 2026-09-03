import { guardAccess, type AccessEnv } from './access'
import { admit, DENIED_MESSAGE, type Admission, type IdentityEnv } from './identity'
import { route, type RouterEnv } from './router'
import { resolveScope, ScopeRefusedError, splitBusinessPrefix } from './scope'

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
    try {
      // The business the caller is ASKING for. Whether they may have it is
      // `resolveScope`'s question, and asking it here rather than in the router
      // is what keeps authorisation ahead of routing.
      const requested = splitBusinessPrefix(new URL(request.url).pathname).businessId

      // `admit`, OR NOTHING — gated on the SAME predicate that skips the gate,
      // not on a second condition that happens to agree with it today. Two
      // predicates that can drift is how a deployment ends up resolving a
      // loopback scope while enforcing a production gate, or the reverse.
      let admission: Admission | null = null
      if (!isUnconfiguredLocalDev(env)) {
        const gate = await guardAccess(request, env)
        if (!gate.ok) return gate.response

        admission = await admit(env, gate.email)
        if (!admission.ok) return denied(admission)
      }

      const scope = await resolveScope(env, admission, requested)
      return await route(request, env, scope, {}, ctx)
    } catch (err) {
      // A REFUSED TARGET IS A 403, NOT THE 503 BELOW. The caller named a business
      // they may not operate: an answer about them, not a configuration failure
      // an operator can act on. Dressing it as one would invite a retry that
      // fails identically forever, and would put someone else's business id in
      // front of an operator as though it were theirs to fix.
      if (err instanceof ScopeRefusedError) return refused(err)
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
