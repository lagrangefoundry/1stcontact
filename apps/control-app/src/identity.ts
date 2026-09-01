import { d1r2SiteStore, type SiteStoreEnv } from '../../../tools/generate/src/store/d1r2-store'
import { starterHomePage, starterSiteJson } from '../../../tools/generate/src/cli/scaffold'

/**
 * Identity, accounts and entitlement (REQ-167) — [[DOC-40]].
 *
 * TWO OPERATIONS, AND THEY ARE DELIBERATELY ASYMMETRIC. {@link provisionInvite}
 * creates everything: the person, the account, the membership that joins them,
 * the grant that admits them, and something to edit when they arrive.
 * {@link admit} creates NOTHING — it is pure lookup, and a verified email with no
 * row behind it is refused rather than signed up. Self-signup is [[DOC-40]] §5's
 * later branch and its absence here is the feature: until it lands, the only way
 * into this system is for someone to have been invited into it.
 *
 * WHY THE ASYMMETRY IS WORTH STATING. The tempting shortcut is a login path that
 * "provisions on first sight", because it makes the invite optional and the demo
 * shorter. It also makes admission unbounded: anyone who can pass Cloudflare
 * Access's one-time-PIN — which is anyone with an email address, since the policy
 * is identity-only ([[DOC-40]] §3) — would have an account. The Access edge stopped
 * being the authorisation boundary the moment that policy was set; this file is
 * where the boundary moved to.
 *
 * ENTITLEMENT IS A GRANT, NOT A FLAG. An account accumulates grants over its life
 * and effective access is the best ACTIVE grant covering NOW ([[DOC-40]] §5), so
 * {@link admit} selects rather than reads. That is what lets trials,
 * subscriptions and a warning period land later without touching this schema or
 * this query's shape.
 */

/** Everything this module needs from the Worker's environment. */
export interface IdentityEnv extends SiteStoreEnv {
  /**
   * The PLATFORM's own tenant — where `users` rows for builder users live.
   *
   * Not the account being operated. That distinction is only latent today
   * (`store.ts` still serves this same tenant to everybody) and becomes load
   * bearing with [[REQ-168]], which is the ticket that moves the store's scope
   * onto the account resolved here.
   */
  TENANT_ID?: string
}

export class IdentityNotConfiguredError extends Error {
  readonly name = 'IdentityNotConfiguredError'
  constructor() {
    super(
      'TENANT_ID is not configured, so this Worker cannot say which tenant its ' +
        'users belong to and refuses to guess. Set it in apps/control-app/wrangler.toml, ' +
        'under [vars] for `wrangler dev` and again under [env.production.vars], ' +
        'which does not inherit it.',
    )
  }
}

/** A person, as this module reads them back. */
export interface UserRow {
  id: string
  tenant_id: string
  email: string
  status: string
  display_name: string | null
  platform_admin: number
  tos_version: string | null
  tos_accepted_at: string | null
  invited_at: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

/** One grant. `ends_at` null is open-ended. */
export interface EntitlementRow {
  id: string
  account_id: string | null
  email: string | null
  plan: string
  source: string
  status: string
  starts_at: string
  ends_at: string | null
}

/**
 * Why a caller was turned away.
 *
 * REPORTED TO THE OPERATOR, NEVER TO THE CALLER. The deny page says one thing to
 * everybody ([[DOC-40]] §5, and {@link DENIED_MESSAGE} below): distinguishing "no
 * such user" from "expired grant" in the response is an account-existence oracle
 * to anyone who can pass a one-time PIN, which is anyone. The distinction still
 * has to exist — an operator debugging a customer's "it says no" needs it — so it
 * exists here and reaches the log rather than the wire.
 */
export type DenialReason =
  | 'no_email'
  | 'no_user'
  | 'user_inactive'
  | 'no_membership'
  | 'no_entitlement'

export type Admission =
  | { ok: true; user: UserRow; accountId: string; entitlement: EntitlementRow }
  | { ok: false; reason: DenialReason; email: string | null }

/** The one thing a refused visitor is told. */
export const DENIED_MESSAGE =
  'Your access to 1st Contact has ended. Please get in touch and we will sort it out.'

/**
 * An opaque id, `<prefix>_<random>`.
 *
 * NOT DERIVED FROM ANYTHING A HUMAN CHOSE, and for accounts that is a durability
 * property rather than a style. A tenant id appears in R2 keys
 * (`t/<tenant>/blob/…`, `draft/<tenant>/<slug>/…`) and is therefore permanent,
 * so a readable id is one rename request away from being a lie. The human label
 * lives in `tenants.name`, where it can change.
 *
 * 16 bytes from `crypto.getRandomValues`, hex — the same amount of entropy a
 * UUIDv4 carries, without the hyphens that would make the id awkward in a key.
 */
export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}_${hex}`
}

/**
 * Email is compared CASEFOLDED, because `idx_users_tenant_email` is not.
 *
 * SQLite's default collation is byte-exact, so `Sarah@example.com` and
 * `sarah@example.com` would be two rows and two accounts for one person — and
 * the second one would be created by an invite that looked like it had worked.
 * Normalising on the way in makes the index mean what it is there to mean.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** What an invite is told to create. */
export interface Invite {
  email: string
  /** When the granted access ends. Omit for an open-ended grant. */
  endsAt?: string | null
  /** When it begins. Defaults to now. */
  startsAt?: string
  /** [[DOC-40]] §5 — a plan name, not a capability set. */
  plan?: string
  /** The account's human label, which `tenants.name` holds and may change. */
  accountName?: string
  displayName?: string
  /** Who made the grant, for the audit record. */
  grantedBy?: string
  note?: string
}

export interface InviteResult {
  /** False when the email was already known — see below. */
  created: boolean
  user: UserRow
  accountId: string
  /** The starter site's slug, on a fresh invite. */
  siteSlug: string | null
}

/**
 * The heading on the account's starter site.
 *
 * ONE BLANK PAGE, NOT A TEMPLATE AND NOT AN IMPORT ([[REQ-170]]). The point is
 * that a person logging in for the first time finds something to edit rather
 * than an empty tenant and a create-site flow that does not exist yet.
 */
export const STARTER_HEADING = 'Your 1stcontact site'

/**
 * Create the whole set: person, account, membership, grant, and a site.
 *
 * TRANSACTIONALLY WHERE D1 ALLOWS. The three identity rows go in one
 * `DB.batch()`, which D1 runs as a single transaction, so an account can never
 * exist with a user and no membership. The tenant row and the starter site are
 * separate writes because they go through the site store's own port rather than
 * through raw SQL — the failure that leaves is an account with no site, which an
 * operator can see and re-run, rather than a half-built membership graph that
 * nothing would report.
 *
 * RE-INVITING AN EXISTING EMAIL IS NOT A SECOND ACCOUNT. `idx_users_tenant_email`
 * would refuse it, and a constraint violation surfacing out of an admin console
 * as `UNIQUE constraint failed` is a worse answer than the true one. So the
 * existing user is looked up first and REPORTED — `created: false` — with the
 * account they already own.
 */
export async function provisionInvite(env: IdentityEnv, invite: Invite): Promise<InviteResult> {
  const platformTenant = requirePlatformTenant(env)
  const email = normaliseEmail(invite.email)
  if (email === '') throw new Error('An invite needs an email address.')

  const existing = await findUser(env, platformTenant, email)
  if (existing) {
    const accountId = await accountFor(env, existing.id)
    return { created: false, user: existing, accountId: accountId ?? '', siteSlug: null }
  }

  const now = new Date().toISOString()
  const userId = newId('usr')
  const accountId = newId('acct')
  const root = d1r2SiteStore(env)

  // The tenant first: `forTenant` refuses an unregistered one, so a membership
  // pointing at an account the registry has never heard of would be a row that
  // can never be used.
  await root.createTenant({ id: accountId, name: invite.accountName ?? email })

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO users (id, tenant_id, email, status, display_name, platform_admin, ' +
        'invited_at, created_at, updated_at, fields) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)',
    ).bind(userId, platformTenant, email, 'active', invite.displayName ?? null, now, now, now, '{}'),
    env.DB.prepare(
      'INSERT INTO memberships (id, user_id, account_id, role, status, granted_by, granted_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(newId('mem'), userId, accountId, 'owner', 'active', invite.grantedBy ?? null, now),
    env.DB.prepare(
      'INSERT INTO entitlements (id, account_id, email, plan, source, status, starts_at, ends_at, ' +
        'granted_by, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      newId('ent'),
      accountId,
      email,
      invite.plan ?? 'pro',
      'admin_grant',
      'active',
      invite.startsAt ?? now,
      invite.endsAt ?? null,
      invite.grantedBy ?? null,
      invite.note ?? null,
      now,
      now,
    ),
  ])

  const siteSlug = await createStarterSite(env, accountId)

  const user = await findUser(env, platformTenant, email)
  if (!user) throw new Error('The invited user was not readable back after provisioning.')
  return { created: true, user, accountId, siteSlug }
}

/**
 * The starter site, and why its slug is the ACCOUNT ID.
 *
 * A published address is claimed globally — `published_sites` is keyed by slug
 * alone, because `/site/<slug>/` is the public URL grammar and carries no tenant
 * ([[DOC-12]] §7, `0002_revisions.sql`). So a starter site called `home` for
 * everybody would work perfectly until the SECOND account published, at which
 * point it would be refused with `SlugClaimedError` for a reason its owner could
 * do nothing about. The account id is unique by construction, so the collision
 * cannot happen; per-tenant hostnames ([[DOC-12]] §9) are the readable answer and
 * are purely additive to this.
 */
async function createStarterSite(env: IdentityEnv, accountId: string): Promise<string> {
  const store = await d1r2SiteStore(env).forTenant(accountId)
  const slug = accountId
  await store.createDraft(slug)
  await store.write(slug, {
    siteJson: starterSiteJson(slug),
    pages: [{ name: 'home.json', page: starterHomePage(slug, STARTER_HEADING) }],
  })
  return slug
}

/**
 * Login: bind a verified email to an account, or refuse.
 *
 * NOTHING IS CREATED HERE. Every step is a read except the one stamp, and a
 * missing row at any step is a refusal rather than a repair. See the file header
 * for why that asymmetry is the whole design.
 *
 * THE STAMP HAPPENS BEFORE THE ADMISSION DECISION, deliberately. `last_seen_at`
 * records that this person came to the door, which is exactly as interesting when
 * they were turned away — an operator asking "did the customer whose grant
 * expired ever try?" is asking about the refused visit.
 */
export async function admit(
  env: IdentityEnv,
  email: string | null,
  now: Date = new Date(),
): Promise<Admission> {
  const platformTenant = requirePlatformTenant(env)
  // A service token carries `common_name` and no email ([[DOC-40]] §2 makes the
  // verified email the identity), so there is nothing to look a user up by.
  if (!email) return { ok: false, reason: 'no_email', email: null }
  const normalised = normaliseEmail(email)

  const user = await findUser(env, platformTenant, normalised)
  if (!user) return { ok: false, reason: 'no_user', email: normalised }

  const stamp = now.toISOString()
  await env.DB.prepare(
    'UPDATE users SET first_seen_at = COALESCE(first_seen_at, ?), last_seen_at = ?, ' +
      'updated_at = ? WHERE id = ?',
  )
    .bind(stamp, stamp, stamp, user.id)
    .run()

  // A suspended person is checked after the stamp and before anything else: it
  // is the one refusal that is about the PERSON rather than about their account.
  if (user.status !== 'active') return { ok: false, reason: 'user_inactive', email: normalised }

  const accountId = await accountFor(env, user.id, stamp)
  if (!accountId) return { ok: false, reason: 'no_membership', email: normalised }

  const entitlement = await bestActiveGrant(env, accountId, stamp)
  if (!entitlement) return { ok: false, reason: 'no_entitlement', email: normalised }

  return { ok: true, user: { ...user, first_seen_at: user.first_seen_at ?? stamp }, accountId, entitlement }
}

/** The person, by the identity the index decides ([[DOC-40]] §2). */
async function findUser(
  env: IdentityEnv,
  tenantId: string,
  email: string,
): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE tenant_id = ? AND email = ?')
    .bind(tenantId, email)
    .first<UserRow>()
}

/**
 * The account this person may operate.
 *
 * REVOKED AND EXPIRED REFUSE INDEPENDENTLY OF EACH OTHER. `revoked_at` is a
 * withdrawal someone made and holds whatever the dates say; `expires_at` is what
 * a time-boxed support grant ([[DOC-40]] §6) will use and holds whatever the
 * status says. Checking only one of them would make the other decorative.
 *
 * `ORDER BY granted_at` so a person holding two memberships resolves
 * deterministically rather than to whatever the query planner returned first.
 * One membership is the only shape provisioning creates today; several is what an
 * agency account will be, and a nondeterministic answer to "whose builder am I
 * in" is the worst possible way to discover that.
 */
async function accountFor(
  env: IdentityEnv,
  userId: string,
  now: string = new Date().toISOString(),
): Promise<string | null> {
  const row = await env.DB.prepare(
    'SELECT account_id FROM memberships WHERE user_id = ? AND status = ? AND revoked_at IS NULL ' +
      'AND (expires_at IS NULL OR expires_at > ?) ORDER BY granted_at, id LIMIT 1',
  )
    .bind(userId, 'active', now)
    .first<{ account_id: string }>()
  return row?.account_id ?? null
}

/**
 * The best active grant covering now ([[DOC-40]] §5) — a SELECTION, not a read.
 *
 * "Covering now" is the three conditions in the WHERE clause, and every one of
 * them is load bearing. `status = 'active'` excludes a revoked grant whatever its
 * dates say. `starts_at <= now` excludes a grant that has been written ahead of
 * time. `ends_at IS NULL OR ends_at > now` is EXPIRY, and it is the single most
 * likely silent failure in this ticket: a date-bounded grant whose expiry is
 * never evaluated is worse than an open-ended one, because it was promised as
 * bounded. A UAT drives it from both sides.
 *
 * "Best" is the grant that keeps access LONGEST — open-ended first, then the
 * latest `ends_at`. There is no plan ranking to order by, because there is one
 * plan; when billing lands and there are several, ordering will need to consult
 * the plan→capability map and this is the one function that changes.
 */
async function bestActiveGrant(
  env: IdentityEnv,
  accountId: string,
  now: string,
): Promise<EntitlementRow | null> {
  return env.DB.prepare(
    'SELECT id, account_id, email, plan, source, status, starts_at, ends_at FROM entitlements ' +
      'WHERE account_id = ? AND status = ? AND starts_at <= ? ' +
      'AND (ends_at IS NULL OR ends_at > ?) ' +
      'ORDER BY (ends_at IS NULL) DESC, ends_at DESC, starts_at DESC, id LIMIT 1',
  )
    .bind(accountId, 'active', now, now)
    .first<EntitlementRow>()
}

function requirePlatformTenant(env: IdentityEnv): string {
  const tenantId = (env.TENANT_ID ?? '').trim()
  if (tenantId === '') throw new IdentityNotConfiguredError()
  return tenantId
}
