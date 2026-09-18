import { guardAccess, type AccessEnv } from './access'
import {
  EMAIL_WEBHOOK_PATH,
  handleEmailWebhook,
  type EmailWebhookEnv,
} from './email-webhook'
import {
  actingEmail,
  admit,
  DENIED_MESSAGE,
  type Admission,
  type DenialReason,
  type IdentityEnv,
} from './identity'
import { receiveMail, type InboundEnv } from './inbound'
import { type LeadEnv } from './lead'
import { route, type RouterEnv } from './router'
import { handleSignIn, type SignInEnv } from './sign-in'
import {
  expiringWithinPreemption,
  purgeSessions,
  sessionIdentityFor,
  SIGN_IN_PATH,
  type SignedIn,
} from './sessions'
import { NoBusinessError, resolveScope, ScopeRefusedError, splitBusinessPrefix } from './scope'
import { ACTIVITY_CRON, closeSessions } from './activity'
import { sweepSynthetic } from './gutter'
import { beginRequest, pruneRecords, type RequestLog } from './log'
import { guardTerms } from './terms'
import { ticketStoreFor } from './tickets'

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

export interface Env
  extends AccessEnv,
    RouterEnv,
    IdentityEnv,
    EmailWebhookEnv,
    SignInEnv,
    LeadEnv,
    InboundEnv {
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
 * Put the rotated credential on the way out ([[REQ-231]]).
 *
 * THE OBLIGATION THIS WHOLE TICKET TURNS ON. `resolveFromCookie` may rotate the
 * session it resolves — a new row, the same subject, the same `expires_at` — and
 * hand back the `Set-Cookie` that tells the browser. Dropping it does not fail:
 * the request succeeds, the response looks right, and the browser goes on
 * presenting an id the server retired. That id resolves for one grace window and
 * then does not, so the symptom is everybody signed out sixty seconds after
 * their first visit of the day, from an omission rather than from an error.
 *
 * SO IT IS APPLIED AT THE EXITS RATHER THAN AT THE ROTATION. The rotation is
 * known the moment `sessionIdentityFor` answers; the response is not built until
 * several branches later, and one of those branches is the `catch`. Wrapping
 * every exit is what makes "did we send it" answerable by reading one function
 * instead of by auditing eight returns.
 *
 * APPENDED AND NEVER SET. A route may already be setting a cookie of its own,
 * and `Set-Cookie` is the one header where a second value is a second cookie
 * rather than a replacement.
 *
 * THE RESPONSE IS REBUILT because the one a route returns may be immutable —
 * anything that came back from `env.ASSETS.fetch` is — and a silent
 * `TypeError: immutable` at this point would be the same signed-out-in-sixty-
 * seconds failure with a stack trace nobody reads.
 */
function withRotatedCookie(response: Response, setCookie: string | null): Response {
  if (!setCookie) return response
  const rebuilt = new Response(response.body, response)
  rebuilt.headers.append('set-cookie', setCookie)
  return rebuilt
}

/**
 * Whether this request is one a person could be sent to sign in ([[REQ-231]]).
 *
 * A TOP-LEVEL NAVIGATION AND NOTHING ELSE. Pre-emption answers 303 to the
 * sign-in page, which is the right answer for somebody who has just typed the
 * address and the wrong one for everything else a page fires: an XHR follows the
 * redirect and gets HTML where it expected JSON, an image gets a login form, and
 * an SSE stream simply ends. The failure is worse than the wall it replaces,
 * because it is silent.
 *
 * `Sec-Fetch-Mode: navigate` IS THE QUESTION, AND IT IS ASKED OF THE BROWSER
 * RATHER THAN OF THE PATH. Every browser this product supports sends it and no
 * page can forge it, so it distinguishes exactly the case that matters; a
 * path-shaped guess (`not /api/`, not an asset extension) would have to be kept
 * in step with the router forever. An old client sends nothing, which reads as
 * "not a navigation" — so the cost of the header being absent is that
 * pre-emption does not fire, and somebody meets the ordinary expiry they would
 * have met anyway.
 *
 * AND THE START OF A VISIT IS ALMOST ALWAYS A NAVIGATION, which is what makes
 * this cheap rather than lossy: a visit begins with silence ending, and silence
 * ends when somebody opens the page.
 */
function isNavigation(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  return (request.headers.get('sec-fetch-mode') ?? '') === 'navigate'
}

/**
 * Spend the start of a visit on signing in, rather than the middle of a task.
 *
 * IT DOES NOT END THE SESSION AND MUST NOT. The cookie is still live and still
 * theirs; what this does is offer the sign-in at the one moment it is free. A
 * person who backs out keeps working — their `last_seen_at` has just been
 * refreshed, so the next navigation does not start a visit and is not
 * intercepted. The prompt is therefore once per visit, and the ordinary expiry
 * is still underneath it as the real boundary.
 */
function preemptSignIn(setCookie: string | null): Response {
  return withRotatedCookie(
    new Response(null, {
      status: 303,
      headers: {
        location: SIGN_IN_PATH,
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex',
      },
    }),
    setCookie,
  )
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
 *
 * IT NO LONGER WRITES THE LOG LINE (BUG-62). `admit` records the reason at the
 * point it decides it, so a refusal is reported whoever renders it and whatever
 * refusals are added later. Writing it here as well would put two lines in the
 * log for one denial, and the second would be the one that could drift: this
 * function sees the admission and not the deployment, so it could never have
 * carried `platformAdminSeed`. The response is all that is left to make.
 */
function denied(): Response {
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
async function handleFetch(
  request: Request,
  env: Env,
  ctx: ExecutionContext | undefined,
  log: RequestLog,
): Promise<Response> {
  // DECLARED OUTSIDE THE `try` SO THE CATCH CAN READ IT. `NoBusinessError` is
  // thrown from inside the router, several frames down, and the one thing its
  // log line needs is who it happened to — which only exists here.
  let admission: Admission | null = null
  // AND THE SAME, FOR THE SAME REASON ([[REQ-231]]). The rotation is known
  // where the session is read; the response is built several branches later,
  // and one of those branches is the `catch` below. See
  // {@link withRotatedCookie}.
  let rotated: string | null = null
  try {
    /**
     * THE ONE ROUTE AHEAD OF THE GATE ([[REQ-198]]).
     *
     * Everything below this line is ordered so that no route can be reached
     * without a verified identity, and this is the single deliberate
     * exception: an email provider posting a bounce cannot present an Access
     * token, so a delivery webhook behind the gate is a delivery webhook that
     * never fires.
     *
     * WHAT REPLACES THE GATE IS THE SIGNATURE, and it is not weaker for being
     * different. `handleEmailWebhook` refuses before it parses, before it
     * looks anything up and before a store handle exists — the same shape as
     * the three checks below — and it fails closed when the secret is
     * unconfigured, so a deployment that forgot it is refused rather than
     * open.
     *
     * IT IS MATCHED ON PATH AND METHOD, EXACTLY. A prefix match here would be
     * a way to reach anything under `/api/email/` unauthenticated, which is
     * the kind of hole that is written once and found years later.
     *
     * THE HANDLER OWNS ITS OWN FRESHNESS HEADER, the same division `route`
     * keeps: every response it makes carries `no-store`, so wrapping it here
     * would be a second place the same header is decided.
     */
    if (
      new URL(request.url).pathname === EMAIL_WEBHOOK_PATH &&
      request.method === 'POST'
    ) {
      return (await handleEmailWebhook(request, env)).response
    }

    /**
     * THE SECOND SET AHEAD OF THE GATE ([[REQ-202]]), and the argument is the
     * webhook's argument for a different caller.
     *
     * These four routes are what an ANONYMOUS person calls in order to become
     * authenticated: a sign-in endpoint behind a gate is a sign-in endpoint
     * nobody who needs it can reach, and an invite link that lands behind
     * Cloudflare Access is an invite that challenges the invitee with a SECOND
     * one-time-PIN email before they have finished reading the first.
     *
     * WHAT REPLACES THE GATE IS THE TOKEN. Holding a link is the whole
     * credential ([[REQ-134]]): 256 bits used as a primary key, single-use,
     * enforced by a conditional UPDATE in the database rather than by code.
     * Nothing behind these paths reads a store handle, resolves a scope or
     * touches a site — the most a caller reaches is a session for a person the
     * database already knows.
     *
     * `handleSignIn` MATCHES ITS OWN PATHS AND ANSWERS `undefined` OTHERWISE,
     * so the exemption is exactly the four routes and cannot widen by a route
     * being added elsewhere. It owns its freshness headers, the same division
     * the webhook and the router keep.
     */
    const signIn = await handleSignIn(request, env, {})
    if (signIn) return signIn

    // The business the caller is ASKING for. Whether they may have it is
    // `resolveScope`'s question, and asking it here rather than in the router
    // is what keeps authorisation ahead of routing.
    const requested = splitBusinessPrefix(new URL(request.url).pathname).businessId

    // `admit`, OR NOTHING — gated on the SAME predicate that skips the gate,
    // not on a second condition that happens to agree with it today. Two
    // predicates that can drift is how a deployment ends up resolving a
    // loopback scope while enforcing a production gate, or the reverse.
    if (!isUnconfiguredLocalDev(env)) {
      /**
       * TWO PRODUCERS OF ONE FACT ([[REQ-202]]).
       *
       * `admit` consumes a verified email and nothing else, so a second way of
       * arriving at one is purely additive: a live session cookie and a valid
       * Access JWT produce the same value, and nothing downstream — `admit`,
       * scope, the terms gate, the portal — can tell which answered.
       *
       * THE SESSION IS TRIED FIRST, and Access is the fallback rather than the
       * legacy path. Access STAYS ([[CHAT-39]]): it is the operator's own route
       * in and the way back if this one breaks, so it is a second SUPPORTED
       * producer and not a mode being retired. Trying it second means a person
       * holding both is admitted by the cheaper of the two — one indexed row
       * against a signature check and a JWKS fetch.
       *
       * A COOKIE THAT RESOLVES TO NOBODY IS NOT AN ADMISSION AND NOT A
       * REFUSAL. `sessionIdentity` answers null for an expired session, a
       * withdrawn person and a deployment that issues no sessions alike, and
       * the request then meets the gate exactly as it did before this ticket.
       * Refusing here instead would make a stale cookie in some browser a
       * lockout from a builder Access would have let its holder into.
       */
      const signedIn: SignedIn | null = await sessionIdentityFor(env, request)
      let email: string | null
      if (signedIn) {
        // THE OBLIGATION, TAKEN BEFORE ANYTHING ELSE CAN RETURN ([[REQ-231]]).
        // Every exit below carries it from here, including the refusals and
        // the `catch` — because the rotation has already happened in the
        // database whatever this request goes on to answer, and a refusal that
        // dropped the header would retire the credential of the person it
        // refused.
        rotated = signedIn.setCookie ?? null
        // THE PRE-EMPTION, AND IT IS AHEAD OF `admit` DELIBERATELY. What it
        // offers is a fresh sign-in, which is worth offering to somebody whose
        // admission is about to be re-checked anyway — and running it after
        // `admit` would put a redirect behind a denial for the one person it
        // cannot help.
        if (expiringWithinPreemption(signedIn) && isNavigation(request)) {
          return preemptSignIn(rotated)
        }
        email = signedIn.email
      } else {
        const gate = await guardAccess(request, env)
        if (!gate.ok) return gate.response
        // `actingEmail` AND NOT `gate.email` ([[BUG-59]]). A human's own
        // address is returned unchanged, so this is the same call for
        // everyone who arrives at the gate; what it adds is that a SERVICE
        // TOKEN — which authenticates as a `common_name` and carries no
        // email — is resolved to the person whose automation it is, if the
        // deployment has said which. Unmapped, it comes back null and is
        // refused `no_email` exactly as before, so this widens nothing by
        // itself.
        //
        // ON THIS BRANCH AND NOT AFTER THE `if`, because a session is a
        // person by construction: `sessionIdentity` reads a row somebody
        // signed in to create, and a service token has no way to hold one.
        // Resolving above the join would ask a question that can only be
        // answered `null` there, and would imply a token might arrive
        // carrying a session cookie.
        //
        // AND HERE RATHER THAN INSIDE `admit`, which is the one place
        // admission is already decided: `admit`'s question is "may this
        // address in", and giving it a second question about tokens would put
        // two authorisations in one function.
        email = actingEmail(env, gate)
      }

      admission = await admit(env, email)
      if (!admission.ok) return withRotatedCookie(denied(), rotated)

      // Terms LAST of the identity checks, and inside this block rather than
      // after it: the dev-open branch has no admission at all, so there is no
      // person to have accepted anything and nothing to check.
      const terms = await guardTerms(request, env, admission)
      if (terms) return withRotatedCookie(terms, rotated)
    }

    const scope = await resolveScope(env, admission, requested)
    /*
     * WHAT THIS INVOCATION TURNED OUT TO BE ABOUT ([[REQ-235]] §2).
     *
     * BOUND HERE AND NOT PASSED AT CALL SITES, which is the whole of [[EPIC-1]]
     * REQ-157 B2: bind the tenant once, where the request is understood, and no
     * call site downstream is given the opportunity to omit it. Everything this
     * request goes on to log carries both, including the records it already
     * wrote — the log re-binds rather than freezing a base at construction,
     * because the gate, the session lookup and the resolver all run first.
     *
     * `actor` IS THE PERSON'S OWN KEY AND NOT THEIR ADDRESS. It is what session
     * inference folds on and what `contact_events` files a summary against, so
     * an email here would be a second name for a row that already has one — and
     * an address changes while a key does not.
     */
    log.bind({
      business: scope?.businessId ?? null,
      actor: admission?.ok ? admission.user.id : null,
    })
    // THE ADMISSION TRAVELS WITH THE SCOPE, and only one route reads it
    // ([[REQ-179]]). `/api/businesses` answers a question about the ACCOUNT —
    // which businesses may be operated — and that is the question `admit`
    // already answered here, ahead of routing. Handing the answer down is what
    // keeps it a single answer; asking again inside the router would need the
    // verified email the router is deliberately never given.
    return withRotatedCookie(await route(request, env, scope, { admission, log }, ctx), rotated)
  } catch (err) {
    // A REFUSED TARGET IS A 403, NOT THE 503 BELOW. The caller named a business
    // they may not operate: an answer about them, not a configuration failure
    // an operator can act on. Dressing it as one would invite a retry that
    // fails identically forever, and would put someone else's business id in
    // front of an operator as though it were theirs to fix.
    if (err instanceof ScopeRefusedError) return withRotatedCookie(refused(err), rotated)
    // THE SAME REASONING, ONE STEP EARLIER. The caller named no business and
    // holds none they may open — an answer about their account, not a
    // configuration failure. Before [[DOC-42]] §10.1 this was unreachable: the
    // account was refused at the door instead, which is the refusal that took
    // away the remedy along with the access.
    if (err instanceof NoBusinessError) return withRotatedCookie(noBusiness(admission), rotated)
    // Anything reaching here escaped the router's own handler, or the
    // admission check ahead of it — a store that could not be constructed, an
    // identity table that is not migrated, most likely a missing binding or an
    // unknown tenant. It is a configuration failure rather than a bad request,
    // and it says so in prose an operator can act on.
    const message = err instanceof Error ? err.message : String(err)
    return withRotatedCookie(
      uncacheable(
        new Response(message, {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      ),
      rotated,
    )
  }
}

/**
 * The Worker.
 *
 * `fetch` IS A WRAPPER NOW AND {@link handleFetch} IS THE HANDLER ([[REQ-235]]).
 * The split exists so that one record per invocation is written whichever way
 * the request leaves — the 403s, the terms interstitial, the refusals and the
 * outer `catch` included. Logging from inside the handler would have meant a
 * line at each of a dozen exits, and the exits that matter most to an operator
 * are exactly the ones somebody would forget.
 */
export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    /*
     * THE LOG IS OPENED BEFORE ANYTHING ELSE AND CLOSED AFTER EVERYTHING
     * ([[REQ-235]] §2). It mints the `trace_id` every record of this
     * invocation carries — which is the session linkage [[EPIC-1]] §41.5 asks
     * of this store — and it is what the handler binds the business and the
     * actor onto once those have been resolved.
     *
     * THE DRAIN IS IN A `finally`. A record buffered and never written is a
     * record that may as well not have been emitted, and the paths most worth
     * having one are the ones that threw.
     */
    const log = beginRequest(env, request)
    try {
      const response = await handleFetch(request, env, ctx, log)
      log.finish(response.status)
      return response
    } finally {
      // AWAITED, NOT REGISTERED WITH `ctx`. See `log.ts`'s `drain`: a record
      // written only when the platform keeps the isolate alive is a log with
      // holes in the invocations somebody is reading it to understand.
      await log.drain()
    }
  },

  /**
   * The cron ([[REQ-231]], [[REQ-268]]). Two sweeps now, on one schedule.
   *
   * WHY THERE IS A SCHEDULED HANDLER AT ALL NOW. `purgeExpired` is the only
   * sanctioned way to reap the component's two tables, and until this it was
   * called by nothing — survivable while the only dead rows were sign-ins that
   * had run out. Rotation changes the rate: one RETIRED row per visit per
   * person, each carrying its chain's `expires_at`, so an unswept table keeps
   * every credential anybody has ever been handed for the length of the sign-in
   * interval. The sweep is what makes the retention window (7 days of replay
   * evidence) mean anything.
   *
   * IT REPORTS RATHER THAN RETURNS. Nothing consumes a cron's value, so the
   * three counts go to the invocation log — which is the only place a question
   * like "is rotation actually firing" can be answered from, and where a sweep
   * that has quietly been taking nothing for a month is visible.
   *
   * IT DOES NOT SWALLOW A FAILURE. A throw here marks the invocation failed,
   * which is what makes a broken sweep visible in the dashboard rather than
   * only in a log line nobody reads.
   */
  async scheduled(event: ScheduledController, env: Env): Promise<void> {
    /*
     * THE SESSION CLOSER ([[REQ-235]] §3), AND IT RUNS ON EVERY TICK.
     *
     * IT IS WHY THERE IS A SECOND CRON EXPRESSION AT ALL. The daily one is the
     * right cadence for a sweep of dead credentials and leaked test rows;
     * it is the wrong cadence for a timeline, because a session ending at ten in
     * the morning would not appear on it until the following morning — eighteen
     * hours behind, which is not the feature that was asked for. So
     * {@link ACTIVITY_CRON} fires every ten minutes and this is what it is for.
     *
     * IT RUNS ON THE DAILY TICK TOO, deliberately. A closer that only ran on one
     * of two expressions would be a closer that stops the day somebody changes
     * which expression the platform delivers — and running it twice inside ten
     * minutes costs one query and writes nothing, because a session whose last
     * record is inside the timeout is left open by construction.
     */
    const closed = await closeSessions(env)
    console.log(JSON.stringify({ event: 'sessions_closed', cron: event.cron, ...closed }))

    /*
     * AND THE DAILY WORK IS SKIPPED ON THE FREQUENT TICK. Purging expired
     * credentials, sweeping the gutter and pruning the log are all sweeps over
     * whole tables whose horizons are measured in days; running them every ten
     * minutes would be 143 scans a day that can each take nothing.
     *
     * THE TEST IS FOR THE FREQUENT EXPRESSION RATHER THAN FOR THE DAILY ONE, so
     * that an invocation carrying neither — a platform that renamed the field, a
     * suite that constructed a controller — does the MORE complete thing rather
     * than the less. A sweep that ran when it need not have costs a scan; one
     * that silently stopped running looks exactly like a system with no garbage.
     */
    if (event.cron === ACTIVITY_CRON) return

    const purged = await purgeSessions(env)
    console.log(JSON.stringify({ event: 'sessions_purged', cron: event.cron, ...purged }))

    /*
     * THE SYNTHETIC SWEEP ([[REQ-268]] §4, [[DOC-54]] §2.7), under the same two
     * rules the sessions sweep above states and for the same reasons.
     *
     * IT REPORTS RATHER THAN RETURNS, and here that reporting is the FEATURE
     * rather than a diagnostic. If collection-by-run works, this takes nothing,
     * every time — so a non-zero count is a bug report saying a run leaked, and
     * the invocation log is the only place that report can appear. A garbage
     * collector that silently stopped looks exactly like a system with no
     * garbage; a line that says `0` every day is what distinguishes them.
     *
     * IT DOES NOT SWALLOW A FAILURE, which is what makes an implausible harvest
     * — the refusal `sweepSynthetic` raises rather than performing — visible as
     * a failed invocation rather than as a log line nobody reads.
     *
     * IT RUNS AFTER THE SESSIONS SWEEP AND NOT IN PARALLEL. A throw here must
     * not take down a purge that has nothing to do with the gutter, and the one
     * that already ran has already reported.
     */
    const collected = await sweepSynthetic(env)
    console.log(JSON.stringify({ event: 'synthetic_swept', cron: event.cron, ...collected }))

    /*
     * THE LOG'S OWN RETENTION ([[REQ-235]] §2, [[EPIC-1]] §40). A log that
     * accumulates without bound is a cost that arrives silently and later, which
     * is why the limit ships with the first commit rather than being added once
     * somebody notices the bill.
     *
     * IT REPORTS HOW FAR IT REACHED AS WELL AS WHAT IT TOOK. `pruned_through` is
     * what tells a reader whose cursor predates the window to start again rather
     * than be served a partial history it cannot tell from a complete one — so
     * the number is worth having in the invocation log when somebody is asking
     * why a reader reset.
     */
    const pruned = await pruneRecords(env)
    console.log(JSON.stringify({ event: 'log_pruned', cron: event.cron, ...pruned }))
  },

  /**
   * Inbound mail ([[REQ-267]], [[EPIC-13]]). Email Routing delivers here.
   *
   * IT IS A DOORWAY AND NOT A PIPELINE. Everything it does is `inbound.ts`'s,
   * which is what keeps *what a received message does* testable as a function —
   * driven with a message a suite composed, inside workerd, against a real
   * database — and leaves this file with only the wiring: the store opener the
   * pipeline is handed rather than imports, and the log line.
   *
   * IT DOES NOT THROW, AND `receiveMail` IS WRITTEN SO IT CANNOT. An exception
   * out of an email handler is a message the platform may redeliver, and a
   * redelivery after a ticket has already been written records the same message
   * twice. Every outcome — including a capture that failed and a forward that
   * failed — comes back as a value and goes to the invocation log, which is
   * where a question like *is capture actually working* is answered from.
   *
   * IT IS ON THE DEFAULT HANDLER AND NOT IN `worker.ts`. Nothing here needs a
   * workerd BUILT-IN — `ForwardableEmailMessage` is a type and types are erased
   * — so keeping it beside `fetch` leaves this module resolvable outside
   * workerd, which is what the sixty node-project suites that import it depend
   * on.
   */
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const outcome = await receiveMail(env, message, {
      openStore: (scope) => ticketStoreFor(env, scope),
    })
    console.log(JSON.stringify({ event: 'mail_received', ...outcome }))
  },
} satisfies ExportedHandler<Env>
