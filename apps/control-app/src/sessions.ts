import { PasswordlessAuth, PURPOSES, REDEEM_STATUS } from './generated/auth-passwordless'
import {
  normaliseEmail,
  requirePlatformTenant,
  PRIMARY_EMAIL_SQL,
  USER_ID_BY_EMAIL_SQL,
  type IdentityEnv,
} from './identity'
import type { SendEmail } from './mail'
import { sendRecordedEmail } from './messages'
import { copyOf, renderCopy, templateFor, type TemplateKey } from './templates'
import type { TicketStore } from './tickets'

/**
 * Passwordless sessions, wired ([[REQ-202]], design ref [[CHAT-39]]).
 *
 * The `auth-passwordless` component ([[REQ-134]]) owns the mechanism — mint an
 * opaque token, mail a link, redeem it once on a POST, hold a session in a
 * cookie — and owns its two tables. What it deliberately does NOT know is
 * anything product-specific, and it names the three things a host has to answer:
 *
 *   `resolveSubject(email)`             who is that, here?
 *   `sendLoginEmail({to, url, code})`   how does mail leave this building?
 *   `buildUrl({token, purpose})`        where does the emailed link point?
 *
 * This file is the whole of this deployment's answer to those three, and nothing
 * else in the repository constructs a {@link PasswordlessAuth}.
 *
 * THE TENANT IS NOT AMBIENT, AND THIS IS THE ONE QUESTION MOST ABLE TO DO HARM.
 * `idx_user_emails_tenant_email` is tenant-scoped deliberately ([[REQ-191]]): the
 * same address may be two different contacts in two businesses, so *resolve this
 * address to a subject* has no answer without a tenant — and a `resolveSubject`
 * that searched every tenant would be a cross-tenant identity leak wearing a
 * helper function. Every query below carries a `tenant_id`, and
 * {@link signInTenant} is the one place the tenant is decided.
 *
 * NOTHING HERE READS AN ADMISSION OR A SCOPE, and that is the point rather than
 * an omission. These routes are what an ANONYMOUS person calls in order to become
 * authenticated, so they run ahead of the Access gate, ahead of `admit` and ahead
 * of `resolveScope` — see `index.ts`. The tenant therefore has to come from
 * something the request carries on its own, which is its host.
 *
 * SENDING GOES THROUGH WHAT ALREADY EXISTS. {@link signInMailer} renders the
 * `signin` template ([[REQ-197]]), sends through the port [[REQ-196]] owns, and
 * records the message ([[REQ-198]]) — so a sign-in link appears in the contact's
 * history beside their invite, and a bounced sign-in address is as visible as a
 * bounced invite. There is no second sender here and there must never be one.
 */

/** Where a sign-in link lands, and the endpoint the address is posted to. */
export const SIGN_IN_PATH = '/sign-in'

/** Where a session is ended. */
export const SIGN_OUT_PATH = '/sign-out'

/**
 * How much sign-in mail one subject may be sent, and over what window.
 *
 * THE ISSUE ROUTE IS THE ONE ENDPOINT THAT CANNOT HAVE ACCESS CONTROLS — it is
 * what an anonymous person calls in order to become authenticated — so the cap is
 * the only control it has. It is per SUBJECT and not per address or per IP:
 * `recentTokenCount` is the primitive the component exposes for exactly this, and
 * counting anything the caller supplies would be counting something the caller
 * can vary.
 *
 * THE EXPOSURE THIS BOUNDS IS NUISANCE AND PROVIDER COST, not domain reputation:
 * an unknown address sends nothing at all, so the route is not an open relay and
 * the worst an attacker reaches is somebody they already know is a contact.
 * Turnstile is deliberately not here ([[REQ-202]]) — named so its absence is a
 * decision rather than an oversight.
 */
export const SIGNIN_RATE_WINDOW_MS = 60 * 60_000
export const SIGNIN_RATE_LIMIT = 5

/**
 * The three numbers rotation costs this deployment ([[REQ-231]], REQ-151
 * upstream), and the one it makes affordable.
 *
 * ROTATION SEPARATES TWO CLOCKS THAT USED TO BE ONE OBJECT. Before it, the
 * cookie's value WAS the session, so {@link SESSION_TTL_MS} chose two unrelated
 * things with one number — how long a stolen cookie stays useful, and how often
 * a person is mailed a link — and there is no value at which both are right.
 * They are separate now: `expires_at` is the sign-in interval and nothing moves
 * it, and the credential on the wire rolls underneath a session already live.
 *
 * WHICH IS WHY THE INTERVAL DOUBLES RATHER THAN THE OPPOSITE. 90 days was the
 * component's default and was chosen against the stolen-cookie window; that
 * window is governed by {@link SESSION_ROTATE_AFTER_MS} now, so 180 days halves
 * the emailed links without widening anything. Two things bound it and neither
 * is reached: the 400-day `Max-Age` cap Chrome and Safari enforce per RFC
 * 6265bis, and the one risk that really does scale with the interval — a cookie
 * lifted from a device its owner never uses again, which rotation cannot detect
 * because there is no second party to conflict with. `POST /sign-out` with
 * `everywhere` is the answer to that one, and it is why it exists.
 */
export const SESSION_TTL_MS = 180 * 24 * 60 * 60_000

/**
 * The CEILING on how long one credential serves a continuously active session.
 *
 * A CEILING AND NOT A CADENCE. Most rotations fire on the start of a visit,
 * well before this — somebody who opens the builder each morning replaces their
 * credential each morning. This is what bounds the other case: the tab left open
 * for a fortnight, which never goes quiet long enough to start a visit and would
 * otherwise carry one credential for the whole sign-in interval.
 *
 * A DAY, because the number this trades against is writes. Every rotation is an
 * INSERT plus an UPDATE plus a row `purgeExpired` later reaps, and a ceiling
 * short enough to fire on an ordinary working day's traffic would be paying that
 * repeatedly to shorten a window the visit rotation has already shortened.
 */
export const SESSION_ROTATE_AFTER_MS = 24 * 60 * 60_000

/**
 * P — how close to its end a session must be for the start of a visit to be
 * spent signing in again ([[REQ-231]]).
 *
 * THE PROBLEM THIS SOLVES IS NOT THE LENGTH OF THE INTERVAL, IT IS WHERE IT
 * LANDS. `expires_at` is a wall-clock instant and nothing moves it, so it
 * arrives whenever it arrives — which is, for somebody who uses the builder, in
 * the middle of using the builder. Being denied access mid-session is
 * [[ticket://lagrangefoundry/1stcontact/REQ-187]]'s unacceptable case, and a
 * longer interval does not remove it; it only makes it rarer and therefore more
 * surprising.
 *
 * SO THE DEADLINE IS MOVED TO THE ONE MOMENT IT COSTS NOTHING. `startsVisit` is
 * true on the first request after a period of silence — somebody who has just
 * arrived, with nothing half-finished — and a sign-in there is a redirect they
 * were expecting to navigate through anyway.
 *
 * TWO WEEKS, and the bound is on the small side rather than the large one. P is
 * also the fraction of the interval a person is asked to spend re-authenticating
 * early, so a large P is a shorter interval wearing a different name. Two weeks
 * out of 180 days is a little over a week of visits in which the prompt can fire
 * before the wall does, at a cost of ~8% of the interval.
 */
export const SESSION_PREEMPT_MS = 14 * 24 * 60 * 60_000

/** Re-exported so a route can word an outcome without importing the component. */
export { PURPOSES, REDEEM_STATUS }

/**
 * A live session, as the component hands one back.
 *
 * `id` IS THE BEARER AND NOT THE SIGN-IN ([[REQ-231]]). With rotation on the
 * cookie's value rolls underneath a session that is already live, so the id a
 * request arrived on is one credential in a chain rather than the identity of
 * the sign-in. `expiresAt` is the sign-in interval and is the only thing that
 * ends it; nothing — not activity, not rotation — ever moves it.
 */
export interface Session {
  id: string
  subjectId: string
  expiresAt: string
  createdAt: string
  lastSeenAt: string
  /**
   * This request is the first after the component's visit gap of silence.
   *
   * A FACT AND NOT AN INSTRUCTION. The component reports the visit and has no
   * opinion about it; {@link expiringWithinPreemption} is this deployment's
   * policy on top of it.
   */
  startsVisit?: boolean
  /**
   * A `Set-Cookie` THIS DEPLOYMENT IS OBLIGED TO SEND, when it is present.
   *
   * The server has rotated the credential. Drop this header and the browser
   * goes on presenting the id that was just retired, which resolves for one
   * grace window and then does not — signing
   * everybody out on a timer, from a line of code that looks like an omission
   * rather than a bug. {@link SignedIn} carries it out of here for exactly this
   * reason.
   */
  setCookie?: string
}

/** What one redemption did. */
export interface Redemption {
  status: string
  session?: Session
  setCookie?: string
}

/**
 * The component's surface, as this repository calls it.
 *
 * DECLARED HERE BECAUSE THE SHIM IS UNTYPED. `src/generated/auth-passwordless.d.ts`
 * is written by `1c assets` and says `any` for every export, which is right for a
 * generated file and wrong for thirty call sites. This interface is not a second
 * copy of the component — it is the subset this deployment uses, so a method that
 * moves upstream surfaces as a typecheck failure at the one place that names it.
 */
export interface Auth {
  issue(args: { email: string; purpose?: string; ttlMs?: number }): Promise<unknown>
  redeem(token: string): Promise<Redemption>
  resolveFromCookie(header: string | null | undefined): Promise<Session | null>
  endSession(sessionId: string): Promise<boolean>
  endSessionsForSubject(subjectId: string): Promise<number>
  cookieFor(session: { id: string; expiresAt: string }): string
  clearCookie(): string
  recentTokenCount(subjectId: string, sinceMs: number): Promise<number>
  purgeExpired(): Promise<PurgeReport>
}

/**
 * What one sweep took ([[REQ-231]]).
 *
 * THREE NUMBERS BECAUSE THEY ARE THREE FACTS. `sessions` is sign-ins that ran
 * out; `retired` is credentials that were REPLACED and have outlived the window
 * in which a replayed one is still evidence of theft. A rotating deployment's
 * second number is large and its first is not, and a log line that added them
 * together would hide the one that says whether rotation is working.
 */
export interface PurgeReport {
  tokens: number
  sessions: number
  retired: number
}

/** The message the component hands its mail port. */
export interface LoginEmail {
  to: string
  url: string
  code: string | null
}

export type SendLoginEmail = (message: LoginEmail) => Promise<void> | void

/**
 * The cookie this deployment issues sessions under.
 *
 * BOTH HALVES ARE CONFIGURATION AND NEITHER IS THE COMPONENT'S ([[REQ-134]]).
 * `apps/public-site` already reads a session cookie by exactly these two values
 * to choose which of `account-chrome`'s states to render ([[REQ-200]]), so the
 * builder and the apex share a session precisely when they agree about them —
 * which is why the names match `apps/public-site/wrangler.toml` character for
 * character rather than being derived.
 *
 * AN ABSENT DOMAIN IS HOST-ONLY AND IS THE RIGHT LOCAL DEFAULT. `wrangler dev`
 * serves on `127.0.0.1`, which is nobody's cookie domain; a host-only cookie
 * works there and reaches nothing else.
 */
export interface SessionCookieEnv {
  /** The cookie's name. Absent means this deployment issues no sessions. */
  SESSION_COOKIE_NAME?: string
  /**
   * The cookie's `Domain`, without a leading dot — the apex the builder and the
   * public site share. Absent yields a host-only cookie.
   */
  SESSION_COOKIE_DOMAIN?: string
}

/** Everything this module needs from the Worker's environment. */
export interface SessionEnv extends IdentityEnv, SessionCookieEnv {}

/** Refused because the deployment does not say what its session cookie is called. */
export class SessionsNotConfiguredError extends Error {
  readonly name = 'SessionsNotConfiguredError'
  constructor() {
    super(
      'SESSION_COOKIE_NAME is not configured, so this Worker cannot issue or read ' +
        'a session. Set it in apps/control-app/wrangler.toml, under [vars] for ' +
        '`wrangler dev` and again under [env.production.vars], which does not ' +
        'inherit it — and set it to the same value as apps/public-site, or the ' +
        'builder and the apex will not share a session.',
    )
  }
}

/** Whether this deployment issues sessions at all. */
export function sessionsConfigured(env: SessionEnv): boolean {
  return (env.SESSION_COOKIE_NAME ?? '').trim() !== ''
}

/**
 * The cookie attributes, or a refusal.
 *
 * `Secure`, `HttpOnly` and `SameSite=Lax` are the component's own defaults and
 * are deliberately not overridden: Lax rather than Strict because Strict
 * withholds the cookie on the navigation that follows a link out of a mail
 * client, which is the single most common way one of these sessions is first
 * used.
 */
export function sessionCookie(env: SessionEnv): { name: string; domain?: string } {
  const name = (env.SESSION_COOKIE_NAME ?? '').trim()
  if (name === '') throw new SessionsNotConfiguredError()
  const domain = (env.SESSION_COOKIE_DOMAIN ?? '').trim()
  return domain === '' ? { name } : { name, domain }
}

/**
 * The business a sign-in request resolves within.
 *
 * THE HOST DECIDES, AND TODAY THIS WORKER HAS ONE. `app.1stcontact.io` is the
 * only route this Worker is bound on ([[wrangler.toml]]), and that host names the
 * 1st Contact business — which is what `TENANT_ID` records ([[DOC-42]] §2, it is
 * deployment configuration and not a row). So the mapping is total and has one
 * entry, and this function is where a second entry goes when customer hosts
 * arrive ([[DOC-45]] §5's `site_domains`, which does not exist yet).
 *
 * IT TAKES THE HOST AND REFUSES AN EMPTY ONE rather than reading `TENANT_ID` at
 * the call site. A request with no host is not a request this Worker can resolve
 * a tenant for, and guessing one would be guessing whose contacts to mail.
 */
export function signInTenant(env: SessionEnv, host: string): string {
  if (host.trim() === '') {
    throw new SessionsNotConfiguredError()
  }
  return requirePlatformTenant(env)
}

/**
 * The URL an emailed link points at.
 *
 * A PATH SEGMENT AND NOT A QUERY STRING. Query strings are stripped, rewritten
 * and logged by more intermediaries than paths are, and a referrer carrying a
 * live credential in its query is the ordinary way one leaks. The token is the
 * whole credential, so it travels as the resource being requested.
 */
export function signInUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, '')}${SIGN_IN_PATH}/${encodeURIComponent(token)}`
}

/**
 * Address → the person it reaches, within ONE business.
 *
 * THROUGH THE ADDRESS TABLE AND THROUGH ANY ADDRESS IN IT ([[REQ-191]]). A person
 * reached at their second address is the same person, and resolving only the
 * primary would make the front door refuse somebody the system knows perfectly
 * well. {@link USER_ID_BY_EMAIL_SQL} is that lookup's single definition site and
 * is reused rather than restated.
 *
 * THE TENANT IS ASKED TWICE, deliberately, for the reason `findUser` gives: the
 * subquery scopes the ADDRESS and the outer clause scopes the PERSON, and an
 * address row whose tenant disagreed with its owner's would otherwise resolve
 * across the barrier.
 *
 * AN INACTIVE PERSON RESOLVES TO NOBODY. `admit` already refuses them
 * (`user_inactive`), so a link mailed to a suspended person is a link that cannot
 * be used — and mailing it anyway would be mail this business chose to send to
 * somebody it had just withdrawn. Refusing here means the withdrawal is complete:
 * no new link, and {@link endSessionsFor} takes the ones they hold.
 *
 * NULL IS NOT AN ERROR. It is the ordinary unknown-address case, and it is what
 * makes issuing indistinguishable for a known and an unknown address.
 */
export async function subjectFor(
  env: SessionEnv,
  tenantId: string,
  email: string,
): Promise<string | null> {
  const normalised = normaliseEmail(email)
  if (normalised === '' || tenantId === '') return null
  const row = await env.DB.prepare(
    `SELECT u.id AS id FROM users u ` +
      `WHERE u.tenant_id = ? AND u.status = 'active' AND u.id = ${USER_ID_BY_EMAIL_SQL}`,
  )
    .bind(tenantId, tenantId, normalised)
    .first<{ id: string }>()
  return row?.id ?? null
}

/**
 * The address a subject is reached at, for the one thing a session cannot carry.
 *
 * `subject_id` IS OPAQUE TO THE COMPONENT and is a `users.id` here, so a resolved
 * session names a person and not an address. `admit` takes an email — it is the
 * identity [[DOC-40]] §2 defines — so the session path has to produce one, and
 * {@link PRIMARY_EMAIL_SQL} is the same fragment every other surface shows an
 * address through. A second ordering here would let the builder greet somebody by
 * one address while the Contacts pane shows another.
 */
export async function primaryEmailOf(
  env: SessionEnv,
  tenantId: string,
  subjectId: string,
): Promise<string | null> {
  if (subjectId === '' || tenantId === '') return null
  const row = await env.DB.prepare(
    `SELECT ${PRIMARY_EMAIL_SQL} AS email FROM users u ` +
      `WHERE u.tenant_id = ? AND u.status = 'active' AND u.id = ?`,
  )
    .bind(tenantId, subjectId)
    .first<{ email: string | null }>()
  return row?.email ?? null
}

/** The address row a message is recorded against — the contact and which address. */
interface AddressRow {
  id: string
  user_id: string
}

async function addressRow(
  env: SessionEnv,
  tenantId: string,
  email: string,
): Promise<AddressRow | null> {
  return env.DB.prepare(
    'SELECT id, user_id FROM user_emails WHERE tenant_id = ? AND email = ?',
  )
    .bind(tenantId, normaliseEmail(email))
    .first<AddressRow>()
}

/**
 * The port this deployment answers `sendLoginEmail` with.
 *
 * IT IS NOT A SECOND SENDER. It renders the template ([[REQ-197]]), hands the
 * message to the port [[REQ-196]] owns, and records it ([[REQ-198]]) — the same
 * three modules, in the same order, that `invites.ts` composes. The template's
 * `{{cta_url}}` is the component's `url` and nothing else changes: the
 * placeholder contract still refuses a send whose token did not substitute.
 *
 * IT NEVER THROWS FOR A SEND THAT FAILED, on {@link sendRecordedEmail}'s own
 * rule — the failure is the thing being recorded. A REFUSED TEMPLATE does throw,
 * and the issue route swallows it into the same acknowledgement every caller gets
 * (see `sign-in.ts`): a template that refuses for a known address and an
 * acknowledgement for an unknown one would be the membership oracle `ISSUE_ACK`
 * exists to prevent, restored one layer up.
 */
export function signInMailer(deps: {
  env: SessionEnv
  tenantId: string
  store: TicketStore
  send: SendEmail
  /** The address to fall back to when the template names none ([[REQ-205]]). */
  from: string
  templateKey?: TemplateKey
}): SendLoginEmail {
  return async ({ to, url }) => {
    const address = await addressRow(deps.env, deps.tenantId, to)
    // Unreachable through `issue`, which only calls this port once
    // `resolveSubject` has found somebody — and finding somebody means an address
    // row matched. Refusing rather than recording against an empty contact keeps
    // that true if a later caller reaches for this port directly.
    if (!address) throw new UnknownAddressError(to)

    const rendered = renderCopy(copyOf(await templateFor(deps.store, deps.templateKey ?? 'signin')), {
      cta_url: url,
    })
    // THE TEMPLATE'S ADDRESS, ELSE THE DEPLOYMENT'S ([[REQ-205]]) — the same
    // resolution `invites.ts` makes, because it is the same question. The
    // sign-in template names none and therefore sends from `MAIL_FROM`, which is
    // the point of the fallback: one address per message type, not one per
    // deployment, and no template obliged to say so.
    const from = rendered.from?.trim() || deps.from
    await sendRecordedEmail(
      deps.store,
      {
        contactId: address.user_id,
        addressId: address.id,
        templateKey: rendered.templateKey,
        templateUid: rendered.templateUid,
        subject: rendered.subject,
        from,
        to,
        body: rendered.body,
      },
      deps.send,
    )
  }
}

/** Refused because no address row in this business carries that address. */
export class UnknownAddressError extends Error {
  readonly name = 'UnknownAddressError'
  constructor(readonly email: string) {
    super('No contact in this business holds that address.')
  }
}

/**
 * A configured {@link PasswordlessAuth} for one business.
 *
 * ONE INSTANCE PER RESOLVED TENANT, constructed where the tenant is already
 * known. There is no module-level instance and no cache: the tenant is a property
 * of the request, and an instance held across requests is an instance that
 * eventually answers for the wrong business.
 *
 * THE TWO WRITE PORTS DEFAULT TO REFUSALS RATHER THAN TO NO-OPS. A read path
 * ({@link sessionIdentity}, {@link endSessionsFor}) needs the session half and
 * has no business sending anything, and the component requires all three ports at
 * construction — so the ones a caller did not supply throw if they are ever
 * reached. A silent no-op there is an `issue` that reports success and mails
 * nobody, which is the failure this whole ticket exists to remove.
 *
 * TWO OF THE COMPONENT'S DEFAULTS ARE NOW OVERRIDDEN, AND THREE ARE NOT
 * ([[REQ-231]]). Token lifetimes are still the component's — sign-in 30 minutes,
 * invite 30 days, [[CHAT-39]] settled exactly those — and so are `visitGapMs`,
 * `graceMs` and `retiredRetentionMs`, which are the component's own race and
 * evidence windows and are not this deployment's to tune. What this deployment
 * chooses is {@link SESSION_ROTATE_AFTER_MS}, which is the OPT-IN, and
 * {@link SESSION_TTL_MS}, which is the number rotation makes affordable.
 *
 * OPTING IN IS A PROMISE, NOT A SETTING. `rotateAfterMs` is null upstream
 * precisely because a session carrying a `setCookie` is useless to a host that
 * drops it, and every caller written before rotation drops it. Setting it here is
 * this file saying *I send the cookie you give me* — which {@link SignedIn}
 * carries out and `index.ts` appends. Removing either of those two and leaving
 * this line is how a deployment signs everybody out on a 60-second timer.
 */
export function passwordlessFor(
  env: SessionEnv,
  tenantId: string,
  config: {
    sendLoginEmail?: SendLoginEmail
    /** The origin an emailed link points back at. Required to issue anything. */
    origin?: string
    /** Injectable clock, for suites that need to age a token. */
    now?: () => number
    /**
     * Rotation off, for a suite proving what this deployment does WITHOUT it.
     *
     * Not a mode and not a fallback: nothing in production passes it, and the
     * router has no branch on it. It exists so a UAT can state the difference
     * rotation makes rather than assert the same numbers twice.
     */
    rotateAfterMs?: number | null
  } = {},
): Auth {
  const settings: PasswordlessConfig = {
    resolveSubject: (email: string) => subjectFor(env, tenantId, email),
    sendLoginEmail:
      config.sendLoginEmail ??
      (() => {
        throw new Error('this PasswordlessAuth was built to read sessions, not to send mail')
      }),
    buildUrl: ({ token }: { token: string }) => {
      if (!config.origin) {
        throw new Error('this PasswordlessAuth was built without an origin to build links from')
      }
      return signInUrl(config.origin, token)
    },
    cookie: sessionCookie(env),
    sessionTtlMs: SESSION_TTL_MS,
    rotateAfterMs: config.rotateAfterMs === undefined ? SESSION_ROTATE_AFTER_MS : config.rotateAfterMs,
    ...(config.now ? { now: config.now } : {}),
  }
  return new PasswordlessAuth(env.DB, settings) as Auth
}

/**
 * The component's CONSTRUCTOR argument, as this repository fills it in.
 *
 * DECLARED FOR THE REASON {@link Auth} IS, AND IT MATTERS MORE HERE.
 * `src/generated/auth-passwordless.d.ts` says `any` for every export, so
 * `new PasswordlessAuth(db, { … })` typechecks whatever is in the braces —
 * including `rotateAfterMS`, `rotatesAfterMs`, or the right key on the wrong
 * object. A misspelling there is not a compile error, it is rotation silently
 * staying off: every session resolves, nothing carries a `setCookie`, and the
 * only symptom is a feature that quietly does nothing. Building the literal as
 * this type is what makes the spelling checked.
 *
 * THE THREE WINDOWS THIS DEPLOYMENT DOES NOT SET ARE DECLARED ANYWAY. They are
 * optional and absent from the literal above on purpose — but a field the type
 * does not name is a field the type would reject, so leaving them out would make
 * this declaration refuse the very change it exists to make safe.
 */
export interface PasswordlessConfig {
  resolveSubject: (email: string) => Promise<string | null>
  sendLoginEmail: SendLoginEmail
  buildUrl: (link: { token: string; purpose?: string }) => string
  cookie: { name: string; domain?: string }
  /** The sign-in interval. Written once at `startSession`; nothing moves it. */
  sessionTtlMs?: number
  /** Null disables rotation and everything that hangs off it. */
  rotateAfterMs?: number | null
  /** Silence after which the next request starts a visit. */
  visitGapMs?: number
  /** How long a retired id still resolves through to its successor. */
  graceMs?: number
  /** How long a retired row is kept as replay evidence before it is reaped. */
  retiredRetentionMs?: number
  now?: () => number
}

/** Who a request's session cookie says is asking. */
export interface SignedIn {
  sessionId: string
  subjectId: string
  /** Their primary address — what `admit` takes. */
  email: string
  /**
   * When this SIGN-IN ends — not when this credential does ([[REQ-231]]).
   *
   * Carried because {@link expiringWithinPreemption} is this deployment's policy
   * and policy needs the deadline. It is the same value before and after any
   * number of rotations.
   */
  expiresAt: string
  /** The first request of a visit — see {@link Session.startsVisit}. */
  startsVisit: boolean
  /**
   * THE HEADER `index.ts` IS OBLIGED TO APPEND, when it is here.
   *
   * `sessionIdentity` used to return three fields and discard the rest, which
   * was right for a component that had nothing else to say. This is the field
   * that changed that: the component has rotated the credential and the browser
   * does not know yet. See {@link Session.setCookie}.
   */
  setCookie?: string
}

/**
 * Whether this is the moment to spend on signing in again ([[REQ-231]]).
 *
 * BOTH HALVES, AND NEITHER ALONE. `startsVisit` without the deadline would
 * re-authenticate somebody at the start of every visit forever; the deadline
 * without `startsVisit` would fire on whatever request happened to be in flight,
 * which is the mid-task denial the whole feature exists to remove.
 *
 * IT ANSWERS AND DOES NOT ACT. Where the person is sent, and whether the request
 * is the kind that can be sent anywhere at all, are `index.ts`'s — this is the
 * question, in the one place both numbers are already in scope.
 */
export function expiringWithinPreemption(signedIn: SignedIn, now: number = Date.now()): boolean {
  if (!signedIn.startsVisit) return false
  const ends = Date.parse(signedIn.expiresAt)
  return Number.isFinite(ends) && ends - now <= SESSION_PREEMPT_MS
}

/**
 * The second producer of a verified identity ([[REQ-202]]).
 *
 * `admit` consumes a verified email and nothing else, so this is purely
 * additive: `index.ts` tries this first and falls back to the Access JWT. Both
 * produce the same verified email and nothing downstream — scope, the terms gate,
 * the portal — can tell which one answered.
 *
 * NULL WHEN SESSIONS ARE NOT CONFIGURED, rather than a refusal. A deployment that
 * has not set `SESSION_COOKIE_NAME` issues no sessions, so there is no session to
 * read and Access is the only producer — which is the state this repository was
 * in before this ticket and is a safe one. The issue and redeem routes refuse
 * loudly instead, because there the missing configuration is the whole request.
 */
export async function sessionIdentity(
  env: SessionEnv,
  tenantId: string,
  cookieHeader: string | null,
): Promise<SignedIn | null> {
  if (!sessionsConfigured(env)) return null
  if (tenantId === '') return null
  const auth = passwordlessFor(env, tenantId)
  const session = await auth.resolveFromCookie(cookieHeader)
  if (!session) return null
  // A session whose subject no longer resolves — withdrawn, or gone — is not a
  // session. The cookie survives the row by design (it is an opaque bearer with
  // its own `Max-Age`), so the row is what decides.
  const email = await primaryEmailOf(env, tenantId, session.subjectId)
  if (!email) return null
  // EVERY FIELD THE COMPONENT OFFERED, AND NOT THREE ([[REQ-231]]). `setCookie`
  // is an obligation rather than information, and a mapping that dropped it
  // would compile, pass every existing test, and sign the deployment out one
  // grace window after the first rotation.
  return {
    sessionId: session.id,
    subjectId: session.subjectId,
    email,
    expiresAt: session.expiresAt,
    startsVisit: session.startsVisit === true,
    ...(session.setCookie ? { setCookie: session.setCookie } : {}),
  }
}

/**
 * End every session one person holds.
 *
 * A SESSION OUTLIVING THE PERSON IT IDENTIFIES IS A LIVE CREDENTIAL ([[DOC-37]]).
 * There is no contact-deletion route in this deployment yet — erasure is a
 * request an operator answers, not a button — so this lands on the act that does
 * exist: withdrawing somebody's login (`setPersonStatus` to anything but
 * `active`). {@link subjectFor} then refuses them a fresh link and this takes the
 * ones they hold, which together are the whole of what withdrawal has to mean.
 *
 * IT IS TENANT-BLIND, AND CORRECTLY SO. `sessions.subject_id` is a `users.id`,
 * which is 128 random bits and globally unique, so there is no tenant to scope by
 * and no other person the id could reach. The caller has already established
 * which business the person belongs to.
 *
 * ZERO WHEN SESSIONS ARE NOT CONFIGURED, because a deployment that issues none
 * holds none.
 */
export async function endSessionsFor(env: SessionEnv, subjectId: string): Promise<number> {
  if (!sessionsConfigured(env) || subjectId === '') return 0
  return passwordlessFor(env, requirePlatformTenant(env)).endSessionsForSubject(subjectId)
}

/**
 * Reap what nothing else reaps ([[REQ-231]]).
 *
 * IT WAS SURVIVABLE TO CALL THIS FROM NOWHERE AND IT IS NOT ANY MORE. Before
 * rotation the only dead rows were sign-ins that had run out, at a rate of one
 * per person per interval; a rotating deployment writes one RETIRED row per
 * visit per person, every one of them carrying the chain's `expires_at` — so
 * without a sweep they survive to the end of the sign-in interval, which is now
 * 180 days. `purgeExpired` is the only sanctioned way to take them, because the
 * component owns the tables.
 *
 * WIRED TO THE CRON IN `index.ts`'s `scheduled`, which is the whole of why that
 * handler exists.
 *
 * TENANT-BLIND, AND CORRECTLY SO. Neither of the component's tables carries a
 * tenant — they are keyed by opaque token and session ids, and `subject_id` is
 * globally unique — so there is no per-business sweep to do and a loop over
 * tenants would be the same DELETE run N times.
 *
 * ZERO WHEN SESSIONS ARE NOT CONFIGURED, because a deployment that issues none
 * holds none. A refusal here would make the cron a red alarm on a deployment
 * that has simply not switched sign-in on.
 */
export async function purgeSessions(env: SessionEnv): Promise<PurgeReport> {
  if (!sessionsConfigured(env)) return { tokens: 0, sessions: 0, retired: 0 }
  return passwordlessFor(env, requirePlatformTenant(env)).purgeExpired()
}

/**
 * Mint an invite token and return the link, without sending anything.
 *
 * THE INVITE HAS ITS OWN SENDER AND IT IS `invites.ts`. That file renders the
 * `invite` template — including the copy the operator edited in the modal —
 * records the message and moves the pipeline, and it must stay the one thing that
 * does. So what the invite needs from this component is a TOKEN, and `issue` is
 * the only way to mint one: the mail port is where the URL is produced, so here
 * it captures the URL instead of delivering it.
 *
 * That is a use of the port rather than an abuse of it. The alternative was a
 * second minting path in this repository writing rows in a table the component
 * owns, which is the fork this whole arrangement exists to avoid.
 *
 * NULL FOR AN ADDRESS THAT RESOLVES TO NOBODY, which for an invite means the
 * contact has been withdrawn ({@link subjectFor} refuses an inactive person).
 * `invites.ts` turns that into a named refusal, because an operator who pressed
 * Invite on a suspended contact is owed the reason rather than a dead link.
 */
export async function inviteUrlFor(
  env: SessionEnv,
  tenantId: string,
  origin: string,
  email: string,
): Promise<string | null> {
  let url: string | null = null
  const auth = passwordlessFor(env, tenantId, {
    origin,
    sendLoginEmail: (message) => {
      url = message.url
    },
  })
  await auth.issue({ email, purpose: PURPOSES.INVITE })
  return url
}

/**
 * The per-contact link issuer `invites.ts` takes.
 *
 * A FUNCTION AND NOT A STRING, which is the shape change [[REQ-202]] makes to the
 * invite. `ctaUrl` used to be one constant for the whole send — the request's own
 * origin — because there was no token to build a link from; a link that carries
 * the person it was sent to cannot be one value shared by ten contacts.
 */
export type InviteUrlFor = (email: string) => Promise<string | null>

export function inviteUrlIssuer(
  env: SessionEnv,
  tenantId: string,
  origin: string,
): InviteUrlFor {
  return (email) => inviteUrlFor(env, tenantId, origin, email)
}

/**
 * The same answer, for a caller that holds a request rather than a tenant.
 *
 * THE CONFIGURED CHECK COMES FIRST, and that ordering is the whole reason this
 * wrapper exists rather than two lines at the call site. {@link signInTenant}
 * refuses a deployment with no `TENANT_ID` — correctly, because a sign-in route
 * that guessed one would be guessing whose contacts to mail — and `index.ts` runs
 * this on EVERY request, including on deployments that issue no sessions at all
 * and never asked to. Resolving the tenant before asking whether there are any
 * sessions to read turns "this deployment does not do passwordless" into a 503 on
 * every request, which is a lockout produced by a feature nobody switched on.
 */
export async function sessionIdentityFor(
  env: SessionEnv,
  request: Request,
): Promise<SignedIn | null> {
  if (!sessionsConfigured(env)) return null
  return sessionIdentity(
    env,
    signInTenant(env, new URL(request.url).hostname),
    request.headers.get('cookie'),
  )
}
