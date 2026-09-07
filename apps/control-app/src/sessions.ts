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

/** Re-exported so a route can word an outcome without importing the component. */
export { PURPOSES, REDEEM_STATUS }

/** A live session, as the component hands one back. */
export interface Session {
  id: string
  subjectId: string
  expiresAt: string
  createdAt: string
  lastSeenAt: string
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
    await sendRecordedEmail(
      deps.store,
      {
        contactId: address.user_id,
        addressId: address.id,
        templateKey: rendered.templateKey,
        templateUid: rendered.templateUid,
        subject: rendered.subject,
        from: deps.from,
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
 * THE COMPONENT'S DEFAULTS ARE NOT OVERRIDDEN. Sign-in token 30 minutes, invite
 * token 30 days, session 90 days — [[CHAT-39]] settled exactly those, and
 * restating them here would be a second copy free to drift from the one the
 * component's own tests pin.
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
  } = {},
): Auth {
  return new PasswordlessAuth(env.DB, {
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
    ...(config.now ? { now: config.now } : {}),
  }) as Auth
}

/** Who a request's session cookie says is asking. */
export interface SignedIn {
  sessionId: string
  subjectId: string
  /** Their primary address — what `admit` takes. */
  email: string
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
  // session. The cookie survives the row by design (it is 90 days of opaque
  // bytes), so the row is what decides.
  const email = await primaryEmailOf(env, tenantId, session.subjectId)
  if (!email) return null
  return { sessionId: session.id, subjectId: session.subjectId, email }
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
