import { mailerFor, mailFrom, type MailEnv, type SendEmail } from './mail'
import {
  passwordlessFor,
  REDEEM_STATUS,
  sessionCookie,
  sessionsConfigured,
  signInTenant,
  SIGN_IN_PATH,
  SIGN_OUT_PATH,
  signInMailer,
  subjectFor,
  SIGNIN_RATE_LIMIT,
  SIGNIN_RATE_WINDOW_MS,
  type SessionEnv,
} from './sessions'
import { ticketStoreFor, type TicketStoreEnv } from './tickets'

/**
 * The sign-in surface ([[REQ-202]], design ref [[CHAT-39]]).
 *
 * FOUR ROUTES, AND ALL FOUR RUN AHEAD OF THE ACCESS GATE. That is the whole
 * point of them: they are what an ANONYMOUS person calls in order to become
 * authenticated, so a sign-in endpoint behind the gate is a sign-in endpoint
 * nobody who needs it can reach. `index.ts` matches them before `guardAccess` for
 * the same reason it matches the delivery webhook there — and, as with the
 * webhook, the exemption is stated by an exact path-and-method match rather than
 * by a prefix, because a prefix here would be a way to reach anything under
 * `/sign-in/` unauthenticated.
 *
 *   GET  /sign-in           the address form
 *   POST /sign-in           issue a link — one frozen acknowledgement, always
 *   GET  /sign-in/<token>   the Continue page. Changes nothing; may be repeated
 *   POST /sign-in/<token>   redeem, set the cookie, and go in
 *   POST /sign-out          end this session
 *
 * REDEMPTION IS ON THE POST AND NEVER ON THE GET, which is the component's rule
 * and this file's reason for existing at all ([[REQ-134]]). Enterprise mail
 * scanners fetch every URL in a message to check it for malware, so a token
 * consumed on GET is consumed before the recipient clicks — intermittently,
 * silently, and worst for exactly the customers with the most locked-down mail.
 * So the emailed link lands on a page with one button, and nothing on a read path
 * touches `used_at`.
 *
 * THE THREE REFUSALS ARE WORDED, NOT PASSED THROUGH. `expired`, `used` and
 * `unknown` all render the same page, with the same words, at the same status:
 * tell the reader to request a fresh link, and put the form to request one right
 * there. A dead end at this exact point loses a person we have already persuaded,
 * and three different statuses would distinguish on the wire the three things the
 * copy deliberately does not distinguish.
 *
 * THE ISSUE ROUTE ANSWERS IDENTICALLY FOR A KNOWN AND AN UNKNOWN ADDRESS, and
 * that property is held here rather than assumed from the component. `ISSUE_ACK`
 * is one frozen value, so there is no field to forward — but a template that
 * refused, or a store that threw, would only ever happen for an address that
 * resolved, and an error page for known addresses is the membership oracle
 * `ISSUE_ACK` exists to prevent, restored one layer up. So this route catches
 * everything and acknowledges anyway.
 */

/** What the deployment needs for the routes below. */
export interface SignInEnv extends SessionEnv, TicketStoreEnv, MailEnv {}

export interface SignInDeps {
  /** The sender. Injected so a suite proves what was handed to the port. */
  send?: SendEmail
  fetch?: typeof fetch
  /** Injectable clock, in epoch ms, for a suite that needs to age a token. */
  now?: () => number
}

/**
 * The answer to a `POST /sign-in`, whoever the address belonged to.
 *
 * THE COMPONENT'S `ISSUE_ACK` RESTATED AS WIRE FORMAT, not imported: this is the
 * JSON body a browser reads, and the two are the same shape because the route
 * says so rather than because a value leaked through. `client.js` never reads it
 * at all ([[REQ-200]]) — the confirmation is shown when the request COMPLETES, at
 * any status — so this exists for a caller that is not the chrome.
 */
const ACK = { acknowledged: true }

/** How long a browser may cache the CORS preflight for the issue endpoint. */
const PREFLIGHT_MAX_AGE = '86400'

/**
 * The sign-in routes, or nothing when the path is not one of them.
 *
 * `undefined` RATHER THAN A 404, so `index.ts` can try this first and fall
 * through to the gate for everything else. A router that answered here would have
 * to know every other route in the system in order to know what to refuse.
 */
export async function handleSignIn(
  request: Request,
  env: SignInEnv,
  deps: SignInDeps = {},
): Promise<Response | undefined> {
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'

  if (path === SIGN_OUT_PATH) {
    if (request.method !== 'POST') return undefined
    return signOut(request, env)
  }

  if (path !== SIGN_IN_PATH && !path.startsWith(`${SIGN_IN_PATH}/`)) return undefined

  // A deployment that issues no sessions must not pretend to. 503 rather than
  // 404: the route exists and the configuration does not, and a 404 would send an
  // operator looking for a missing route.
  if (!sessionsConfigured(env)) {
    return page(503, shell('Sign in', '<p>Sign-in is not configured on this deployment.</p>'))
  }

  const token = path === SIGN_IN_PATH ? '' : decodeURIComponent(path.slice(SIGN_IN_PATH.length + 1))

  if (request.method === 'OPTIONS') return preflight(request, env)

  if (token === '') {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return page(200, shell('Sign in', askBody(SIGN_IN_PATH)))
    }
    if (request.method === 'POST') return issue(request, env, deps)
    return page(405, shell('Sign in', '<p>Send your address with POST.</p>'))
  }

  // A `/` inside the token is not a token — it is somebody walking the path
  // space, and the component would answer `unknown` for it anyway. Refusing here
  // keeps the shape of what a token is stated in one place.
  if (token.includes('/')) return page(404, shell('Sign in', deadBody()))

  if (request.method === 'GET' || request.method === 'HEAD') {
    // NOTHING IS READ AND NOTHING IS WRITTEN. The component offers exactly one
    // token-consuming method and no way to inspect a token without consuming it,
    // which is right: a GET that looked the token up to word this page would be a
    // read a scanner could turn into a probe, and a GET that consumed it is the
    // failure the POST exists to prevent. So the page states what it is for and
    // says nothing it would need a token lookup to know; whether the link still
    // works is answered on the POST, where it can be answered by using it.
    return page(200, shell('Sign in', continueBody(`${SIGN_IN_PATH}/${encodeURIComponent(token)}`)))
  }
  if (request.method === 'POST') return redeem(request, env, token)
  return page(405, shell('Sign in', '<p>Press Continue to finish signing in.</p>'))
}

/**
 * Mint a link and mail it — or do nothing, indistinguishably.
 *
 * THE RATE LIMIT IS CHECKED HERE AND NOT INSIDE THE PORT. `recentTokenCount` is
 * the primitive the component exposes for exactly this and it takes a subject, so
 * the route resolves the subject itself. Being over the cap produces the same
 * acknowledgement as being under it and as being nobody at all — three states,
 * one answer, which is the only shape that does not leak the first two.
 */
async function issue(request: Request, env: SignInEnv, deps: SignInDeps): Promise<Response> {
  const submission = await readAddress(request)
  const cors = corsHeaders(request, env)

  try {
    const tenantId = signInTenant(env, new URL(request.url).hostname)
    const subjectId = await subjectFor(env, tenantId, submission.email)
    if (subjectId) {
      const store = await ticketStoreFor(env, { businessId: tenantId })
      const from = mailFrom(env)
      const auth = passwordlessFor(env, tenantId, {
        origin: new URL(request.url).origin,
        now: deps.now,
        sendLoginEmail: signInMailer({
          env,
          tenantId,
          store,
          send: deps.send ?? mailerFor(env, { fetch: deps.fetch }),
          from,
          templateKey: 'signin',
        }),
      })
      const recent = await auth.recentTokenCount(subjectId, SIGNIN_RATE_WINDOW_MS)
      if (recent < SIGNIN_RATE_LIMIT) {
        await auth.issue({ email: submission.email })
      } else {
        console.warn(JSON.stringify({ event: 'signin_rate_limited', subjectId, recent }))
      }
    }
  } catch (err) {
    // SWALLOWED ON PURPOSE, and logged where the operator is. See the file
    // header: a failure that can only happen for a KNOWN address is a membership
    // oracle if the caller can see it. Anything genuinely wrong with this
    // deployment — an unconfigured `MAIL_FROM`, a template that refuses, a store
    // that will not open — is a fact about us and belongs in the invocation log.
    console.warn(
      JSON.stringify({
        event: 'signin_issue_failed',
        reason: err instanceof Error ? err.message : String(err),
      }),
    )
  }

  if (submission.form) {
    return page(200, shell('Check your email', sentBody()), cors)
  }
  return json(200, ACK, cors)
}

/**
 * Consume the token and go in.
 *
 * 303 AND NOT 200, because the browser has just POSTed: a 200 leaves the
 * redeemed URL in history as a POST target, and the reload that follows a back
 * button would re-post a token that is now used. See Other turns it into a GET of
 * somewhere useful.
 *
 * THE COOKIE IS THE COMPONENT'S OWN `Set-Cookie` VALUE, attributes and all. The
 * host owns those attributes ([[REQ-134]]) and supplies them at construction, so
 * composing a second header here would be a second answer to what a session
 * cookie looks like on this deployment.
 */
async function redeem(request: Request, env: SignInEnv, token: string): Promise<Response> {
  // LOGIN CSRF, refused cheaply. An attacker who holds a live token could
  // otherwise navigate somebody else's browser into THEIR session by posting this
  // form cross-site — the victim then works, believing it is their own account.
  // A same-origin check costs one header read; a browser sends `Origin` on every
  // cross-site form POST, and a request with no `Origin` at all is not one a
  // browser made from another page.
  const origin = request.headers.get('origin')
  if (origin !== null && origin !== new URL(request.url).origin) {
    return page(403, shell('Sign in', deadBody()))
  }

  const tenantId = signInTenant(env, new URL(request.url).hostname)
  const result = await passwordlessFor(env, tenantId).redeem(token)
  if (result.status !== REDEEM_STATUS.OK || !result.setCookie) {
    // ONE PAGE FOR ALL THREE REFUSALS — see the file header.
    return page(200, shell('Sign in', deadBody()))
  }
  return new Response(null, {
    status: 303,
    headers: {
      location: '/',
      'set-cookie': result.setCookie,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  })
}

/**
 * End this session and clear the cookie.
 *
 * BOTH HALVES, ALWAYS. Clearing the cookie without ending the row leaves a live
 * credential in whatever else holds it; ending the row without clearing the
 * cookie leaves the browser presenting a dead one on every request forever.
 *
 * IT SUCCEEDS FOR A CALLER WHO WAS NOT SIGNED IN. "Sign me out" has one correct
 * outcome and no failure mode worth reporting — and an endpoint that answered
 * differently for a live cookie would say whether the one presented was live.
 */
async function signOut(request: Request, env: SignInEnv): Promise<Response> {
  if (!sessionsConfigured(env)) return page(303, null, { location: SIGN_IN_PATH })
  const tenantId = signInTenant(env, new URL(request.url).hostname)
  const auth = passwordlessFor(env, tenantId)
  const session = await auth.resolveFromCookie(request.headers.get('cookie'))
  if (session) await auth.endSession(session.id)
  return new Response(null, {
    status: 303,
    headers: {
      location: SIGN_IN_PATH,
      'set-cookie': auth.clearCookie(),
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  })
}

/** The address, and whether it arrived as a form rather than as JSON. */
async function readAddress(request: Request): Promise<{ email: string; form: boolean }> {
  const type = (request.headers.get('content-type') ?? '').toLowerCase()
  const body = await request.text().catch(() => '')
  if (type.includes('application/json')) {
    try {
      const parsed = JSON.parse(body) as { email?: unknown }
      return { email: typeof parsed.email === 'string' ? parsed.email : '', form: false }
    } catch {
      return { email: '', form: false }
    }
  }
  // The no-JavaScript baseline. `account-chrome` renders a real
  // `<form method="post">` and its client script only UPGRADES that to a fetch
  // ([[REQ-200]]), so a form encoding is the shape this endpoint sees whenever
  // script has failed — which is exactly when it most needs to work.
  return { email: new URLSearchParams(body).get('email') ?? '', form: true }
}

// ── CORS, for the one endpoint that is posted to from another origin ─────────

/**
 * Whether this origin may post an address here.
 *
 * THE COOKIE DOMAIN IS THE RULE, and it is the only rule that is not a list
 * somebody has to maintain. A session issued for `1stcontact.io` is readable by
 * `app.1stcontact.io` and by the apex and by nothing else, so the set of origins
 * that could usefully ask this endpoint for one is exactly the set of hosts
 * inside that domain. `account-chrome` on the apex posts here ([[REQ-200]] sets
 * `signIn` to `https://app.1stcontact.io/sign-in`), and its client sends JSON —
 * which is a preflighted request, so without this the Sign In control fails in a
 * browser console and works nowhere.
 *
 * A DEPLOYMENT WITH NO COOKIE DOMAIN ALLOWS ONLY ITSELF. A host-only cookie
 * reaches one host, so there is no second origin with anything to gain.
 */
export function allowedOrigin(request: Request, env: SessionEnv): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  const self = new URL(request.url).origin
  if (origin === self) return origin
  let host: string
  try {
    host = new URL(origin).hostname.toLowerCase()
  } catch {
    return null
  }
  const domain = (env.SESSION_COOKIE_DOMAIN ?? '').replace(/^\./, '').trim().toLowerCase()
  if (domain === '') return null
  return host === domain || host.endsWith(`.${domain}`) ? origin : null
}

function corsHeaders(request: Request, env: SessionEnv): Record<string, string> {
  const origin = allowedOrigin(request, env)
  if (!origin) return {}
  return {
    'access-control-allow-origin': origin,
    // The chrome sends `credentials: 'same-origin'`, so this is not strictly
    // needed today — it is here because the answer to "may this origin read the
    // response" and the answer to "may it send the cookie" must not be able to
    // disagree, and `Vary` is what stops a cache answering one origin with
    // another's headers.
    'access-control-allow-credentials': 'true',
    vary: 'Origin',
  }
}

function preflight(request: Request, env: SessionEnv): Response {
  const cors = corsHeaders(request, env)
  if (Object.keys(cors).length === 0) return page(403, null)
  return new Response(null, {
    status: 204,
    headers: {
      ...cors,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': PREFLIGHT_MAX_AGE,
      'cache-control': 'no-store',
    },
  })
}

// ── the pages ────────────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * The one document these pages share.
 *
 * INLINE AND SELF-CONTAINED, on `terms.ts`'s precedent and for its reason: these
 * are served ahead of every gate, to a person who by definition has no session,
 * and a stylesheet fetched from a path the gate would refuse is a page that
 * arrives unstyled at the moment somebody is deciding whether to trust it.
 */
function shell(heading: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(heading)} &mdash; 1st Contact</title>
<style>
:root { color-scheme: light; }
body { margin: 0; background: #f4f2ee; color: #1d1b18;
  font: 16px/1.6 ui-serif, Georgia, "Times New Roman", serif; }
main { max-width: 30rem; margin: 0 auto; padding: 5rem 1.5rem 6rem; }
h1 { font-size: 1.75rem; letter-spacing: -0.01em; margin: 0 0 1.5rem; }
p { margin: 0 0 1.25rem; }
label { display: block; margin-bottom: 0.5rem;
  font: 500 0.8125rem/1.4 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.08em; text-transform: uppercase; color: #6b6459; }
input { width: 100%; box-sizing: border-box; padding: 0.75rem 0.9rem;
  border: 1px solid #ddd6ca; border-radius: 2px; background: #fffdf9;
  font: 1rem/1.4 ui-sans-serif, system-ui, sans-serif; }
button { margin-top: 1.5rem; padding: 0.85rem 2rem; border: 0; border-radius: 2px;
  background: #1d1b18; color: #fffdf9; cursor: pointer;
  font: 500 0.9375rem/1 ui-sans-serif, system-ui, sans-serif; }
.note { font: 0.875rem/1.5 ui-sans-serif, system-ui, sans-serif; color: #6b6459; }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(heading)}</h1>
${body}
</main>
</body>
</html>
`
}

/** The address form — the Sign In control, as a page rather than as a chrome. */
function askBody(action: string): string {
  return `<p>Enter the address you were contacted at and we will email you a link.
There is no password.</p>
<form method="post" action="${escapeHtml(action)}">
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email" required>
<button type="submit">Send me a link</button>
</form>`
}

/**
 * What a submitted address is told.
 *
 * THE SAME SENTENCE WHETHER OR NOT WE KNOW THE ADDRESS. It is the wording half of
 * the property `ISSUE_ACK` holds in the code, and it has to say something true of
 * both cases — so it says what WE did, not what will arrive.
 */
function sentBody(): string {
  return `<p>If that address belongs to a contact here, a sign-in link is on its way.</p>
<p class="note">The link is good for thirty minutes and can be used once.</p>`
}

/**
 * The emailed link's landing page.
 *
 * ONE BUTTON, AND IT POSTS. Everything about this page exists so that the token
 * is spent by a person rather than by a scanner; the copy says which service the
 * link is for, which is what somebody staring at a link from an email needs to
 * know before they press anything.
 */
function continueBody(action: string): string {
  return `<p>This link finishes signing you in to 1st Contact.</p>
<form method="post" action="${escapeHtml(action)}">
<button type="submit">Continue</button>
</form>
<p class="note">Nothing is used up until you press Continue.</p>`
}

/**
 * Expired, already used, or never ours — one page, one wording.
 *
 * IT OFFERS THE WAY OUT ON THE SPOT. A dead end here loses a person we have
 * already persuaded to click, and "ask your operator" is not a remedy somebody
 * reading their email at nine at night can act on.
 */
function deadBody(): string {
  return `<p>That link cannot be used. It may have expired, or it may already have been
used — sign-in links work once.</p>
${askBody(SIGN_IN_PATH)}`
}

function page(
  status: number,
  body: string | null,
  extra: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: {
      ...(body === null ? {} : { 'content-type': 'text/html; charset=utf-8' }),
      // Nothing on this surface may be cached or indexed: a cached Continue page
      // outlives its token, and an indexed one puts a live credential in a search
      // engine.
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      ...extra,
    },
  })
}

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  })
}
