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
 *
 * AN ACCOUNT OPERATES SEVERAL BUSINESSES, NOT ONE ([[DOC-40]] §2). The *account*
 * is the payer — a `users` row in the platform's own tenant. A *business* is the
 * tenant, and the hard information barrier. `memberships (user_id, account_id)`
 * has always been a join and `account_id` has always held a tenant id, so the
 * schema carried this from the first migration; what did not was this module,
 * which resolved one membership and reported it singular. {@link admit} now
 * returns the SET ({@link AdmittedBusiness}), and {@link provisionBusiness} is
 * the sibling of {@link provisionInvite} that adds one to an account that
 * already exists.
 *
 * `ok` IS A PROPERTY OF THE PERSON; ACCESS IS A PROPERTY OF THE BUSINESS. A
 * single lapsed grant used to refuse the person, which with several businesses
 * turns one expired card into a lockout from every other business they run.
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
 *
 * `no_membership` AND `no_entitlement` ARE ACCOUNT-LEVEL, NOT BUSINESS-LEVEL.
 * They mean *none of them* — no live membership at all, or no live membership
 * that carries a grant. A single lapsed business among several is not a refusal;
 * it comes back in the admission marked unselectable ({@link AdmittedBusiness}).
 */
export type DenialReason =
  | 'no_email'
  | 'no_user'
  | 'user_inactive'
  | 'no_membership'
  | 'no_entitlement'

/**
 * One business this account may operate, as a switcher needs it.
 *
 * THE ENTITLEMENT HANGS HERE, not off the admission, because [[DOC-40]] §5's
 * grant is per business: an account running three businesses holds three grants
 * and three meters, and receives one invoice, because invoicing rolls up by
 * payer and the payer is the account.
 *
 * A LAPSED BUSINESS IS STILL RETURNED — `entitlement` null, `selectable` false.
 * Dropping it from the list would make "your grant expired" and "this business
 * was deleted" the same observation, which is the wrong thing to show someone
 * who is one payment away from getting back in.
 *
 * THE NAME IS CARRIED BECAUSE THE ID CANNOT BE SHOWN. {@link newId} is
 * deliberately opaque and permanent — it appears in R2 keys — so `tenants.name`
 * is the only thing there is to label a business with.
 */
export interface AdmittedBusiness {
  /**
   * The business's tenant id. Opaque and permanent; never a label.
   *
   * NAMED `businessId` THOUGH THE COLUMN IS `account_id` ([[REQ-168]]). The
   * column has always held a tenant id, and the ids themselves read `acct_…`,
   * so the SQL says "account" and means "business" throughout. The column and
   * the prefix are left alone — they are opaque, permanent and present in R2
   * keys, and renaming either buys a migration for nothing ([[REQ-180]] §3) —
   * but nothing in TypeScript repeats the mistake, because an account id and a
   * business id are both opaque strings and the type system is the only place
   * that confusion can be caught.
   */
  businessId: string
  /** `tenants.name` — the human label, which may change. */
  name: string
  /** The best active grant covering now, or null when nothing covers it. */
  entitlement: EntitlementRow | null
  /** Whether this business may be entered. False exactly when there is no grant. */
  selectable: boolean
}

/**
 * ADMISSION CARRIES THE SET, and there is no singular `accountId` on it.
 *
 * The field was removed rather than kept beside the list, deliberately. A caller
 * left reading it would serve whichever business sorted first to a person who
 * had selected the second — a silent, plausible, wrong answer. Deleting it turns
 * every such call site into a compile error instead.
 *
 * `businesses` is non-empty on an `ok` admission and holds at least one
 * selectable member; that pair of conditions IS the admission decision.
 * Which one is being operated is [[REQ-168]]'s question, not this one's.
 */
export type Admission =
  | { ok: true; user: UserRow; businesses: AdmittedBusiness[] }
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
  /**
   * The business this call provisioned, or — when the person already existed
   * with businesses — the first one they hold.
   *
   * SINGULAR HERE AND PLURAL ON {@link Admission}, and the asymmetry is the
   * point. An invite provisions ONE business ([[DOC-40]] §4), so reporting one
   * id is reporting what happened. Admission answers a different question —
   * which businesses may be operated — and a singular answer there would be a
   * guess.
   *
   * Named for what it holds ([[REQ-168]]) — see {@link AdmittedBusiness.businessId}.
   */
  businessId: string
  /** The starter site's slug, when this call provisioned a business. */
  siteSlug: string | null
}

/** What provisioning one business is told. */
export interface BusinessSpec {
  /**
   * The account that will own it — a `users` row in the PLATFORM's tenant,
   * which is what [[DOC-40]] §2.1 means by 1st Contact being its own tenant.
   */
  accountUserId: string
  /** The business's human label, which `tenants.name` holds and may change. */
  name: string
  /**
   * The address the grant was made to. [[DOC-40]] §5's entitlement carries both
   * an account and an email: the email is the claim key for a grant made before
   * an account exists, and the audit record of who it was made to.
   */
  email?: string | null
  /** A plan name, not a capability set ([[DOC-40]] §5). */
  plan?: string
  /** When the grant begins. Defaults to now. */
  startsAt?: string
  /** When it ends. Omit for an open-ended grant. */
  endsAt?: string | null
  grantedBy?: string
  note?: string
}

/** The business one call provisioned. */
export interface BusinessResult {
  businessId: string
  name: string
  siteSlug: string
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
 * THE BUSINESS IS {@link provisionBusiness}'S JOB, NOT THIS FUNCTION'S. An
 * invite is a person plus their first business, and a second business is the
 * same rows minus the person ([[DOC-40]] §4) — so the rows live in one place and
 * both entry points call it. Inlining them here is what would let the two paths
 * drift into provisioning differently-shaped businesses, which is a divergence
 * nothing would report until a self-serve business behaved unlike an invited
 * one.
 *
 * TRANSACTIONALLY WHERE D1 ALLOWS, AND THE BATCH IS NOW THE BUSINESS. Membership
 * and grant go in one `DB.batch()`, so a business can never exist that nobody
 * may operate or that carries no access. The user row is written first and
 * separately, because it belongs to the person rather than to any one business.
 * The failure that leaves is a person with no business — visible, because they
 * are refused `no_membership`, and REPAIRABLE, because re-inviting them
 * provisions one (below).
 *
 * RE-INVITING AN EXISTING EMAIL IS NOT A SECOND ACCOUNT. `idx_users_tenant_email`
 * would refuse it, and a constraint violation surfacing out of an admin console
 * as `UNIQUE constraint failed` is a worse answer than the true one. So the
 * existing user is looked up first and REPORTED — `created: false` — with the
 * business they already hold. A re-invite of someone holding NO live business
 * provisions one, which is the repair above; it is not a second account, because
 * the account is the person and the person already existed.
 */
export async function provisionInvite(env: IdentityEnv, invite: Invite): Promise<InviteResult> {
  const platformTenant = requirePlatformTenant(env)
  const email = normaliseEmail(invite.email)
  if (email === '') throw new Error('An invite needs an email address.')

  const spec = (accountUserId: string): BusinessSpec => ({
    accountUserId,
    name: invite.accountName ?? email,
    email,
    plan: invite.plan,
    startsAt: invite.startsAt,
    endsAt: invite.endsAt,
    grantedBy: invite.grantedBy,
    note: invite.note,
  })

  const existing = await findUser(env, platformTenant, email)
  if (existing) {
    const held = await businessesFor(env, existing.id)
    if (held.length > 0) {
      return { created: false, user: existing, businessId: held[0].businessId, siteSlug: null }
    }
    const repaired = await provisionBusiness(env, spec(existing.id))
    return { created: false, user: existing, businessId: repaired.businessId, siteSlug: repaired.siteSlug }
  }

  const now = new Date().toISOString()
  const userId = newId('usr')

  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, display_name, platform_admin, ' +
      'invited_at, created_at, updated_at, fields) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)',
  )
    .bind(userId, platformTenant, email, 'active', invite.displayName ?? null, now, now, now, '{}')
    .run()

  const business = await provisionBusiness(env, spec(userId))

  const user = await findUser(env, platformTenant, email)
  if (!user) throw new Error('The invited user was not readable back after provisioning.')
  return { created: true, user, businessId: business.businessId, siteSlug: business.siteSlug }
}

/**
 * Add one business to an account that already exists ([[DOC-40]] §4).
 *
 * THE SAME ROWS AN INVITE WRITES, MINUS THE PERSON: a `tenants` row, a
 * membership joining them, an entitlement, and one site to edit. That is the
 * whole of what a second business is, which is why it needs no schema it does
 * not already have — and why {@link provisionInvite} calls this rather than
 * writing its own copy.
 *
 * SELF-SERVE CREATION IS A SECOND ENTRY POINT ONTO THIS FUNCTION, not new logic
 * — the same property [[DOC-40]] §4 claims for just-in-time provisioning. A
 * business created from the builder and a business created by an invite must be
 * indistinguishable afterwards, because everything downstream reads them the
 * same way.
 *
 * ROLE IS `owner` AND NOT A PARAMETER. Every business this function creates is
 * created for the person who will own it; a `support` membership ([[DOC-40]] §6)
 * is granted against an EXISTING business and is therefore a different
 * operation, not an argument to this one.
 */
export async function provisionBusiness(
  env: IdentityEnv,
  spec: BusinessSpec,
): Promise<BusinessResult> {
  if (spec.accountUserId.trim() === '') throw new Error('A business needs an account to belong to.')
  const name = spec.name.trim()
  if (name === '') throw new Error('A business needs a name.')

  const now = new Date().toISOString()
  const businessId = newId('acct')

  // The tenant first: `forTenant` refuses an unregistered one, so a membership
  // pointing at a business the registry has never heard of would be a row that
  // can never be used — and `businessesFor`'s join drops it, so the switcher
  // would not even show what went wrong.
  await d1r2SiteStore(env).createTenant({ id: businessId, name })

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO memberships (id, user_id, account_id, role, status, granted_by, granted_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(newId('mem'), spec.accountUserId, businessId, 'owner', 'active', spec.grantedBy ?? null, now),
    env.DB.prepare(
      'INSERT INTO entitlements (id, account_id, email, plan, source, status, starts_at, ends_at, ' +
        'granted_by, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      newId('ent'),
      businessId,
      spec.email ?? null,
      spec.plan ?? 'pro',
      'admin_grant',
      'active',
      spec.startsAt ?? now,
      spec.endsAt ?? null,
      spec.grantedBy ?? null,
      spec.note ?? null,
      now,
      now,
    ),
  ])

  const siteSlug = await createStarterSite(env, businessId)
  return { businessId, name, siteSlug }
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
async function createStarterSite(env: IdentityEnv, businessId: string): Promise<string> {
  const store = await d1r2SiteStore(env).forTenant(businessId)
  const slug = businessId
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

  // Every business, then the decision — not the first business, then the
  // decision. The two orders differ exactly when an account holds several and
  // one of them has lapsed, which is the case this ticket exists for.
  const businesses = await businessesFor(env, user.id, stamp)
  if (businesses.length === 0) return { ok: false, reason: 'no_membership', email: normalised }
  if (!businesses.some((business) => business.selectable)) {
    return { ok: false, reason: 'no_entitlement', email: normalised }
  }

  return { ok: true, user: { ...user, first_seen_at: user.first_seen_at ?? stamp }, businesses }
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
 * Every business this person may operate, each with its own access.
 *
 * REVOKED AND EXPIRED EXCLUDE INDEPENDENTLY OF EACH OTHER. `revoked_at` is a
 * withdrawal someone made and holds whatever the dates say; `expires_at` is what
 * a time-boxed support grant ([[DOC-40]] §6) will use and holds whatever the
 * status says. Checking only one of them would make the other decorative. Both
 * remove the business from the list ENTIRELY rather than marking it
 * unselectable: a withdrawn membership is not a lapsed grant, and showing it
 * would tell a former employee which businesses they used to be able to reach.
 *
 * THE JOIN ONTO `tenants` IS ALSO AN INTEGRITY GUARD. A membership pointing at a
 * business the registry has never heard of is a row `forTenant` would refuse
 * anyway, so an inner join drops it here rather than producing a switcher entry
 * that throws when it is picked.
 *
 * `t.status = 'active'` IS THE SAME GUARD, ONE STEP FURTHER ([[REQ-168]]). A
 * DEACTIVATED business would otherwise come back `selectable: true` whenever its
 * grant is still live — and then `forTenant` refuses it, `storeFor` rethrows,
 * and the caller gets a 503 from a switcher entry that looked ordinary. That was
 * invisible while there was one always-active tenant; with a set it is an entry
 * that fails when it is clicked. The predicate belongs in the same query rather
 * than in a check beside it, so the admissible set cannot offer something the
 * store will refuse. `forTenant` is unchanged and stays the structural check.
 *
 * `ORDER BY granted_at, id` so the list is stable across calls rather than being
 * whatever the query planner returned first. Order is presentation, not
 * selection — nothing downstream may read `[0]` as "the" business.
 */
async function businessesFor(
  env: IdentityEnv,
  userId: string,
  now: string = new Date().toISOString(),
): Promise<AdmittedBusiness[]> {
  const { results } = await env.DB.prepare(
    'SELECT m.account_id AS account_id, t.name AS name FROM memberships m ' +
      'JOIN tenants t ON t.id = m.account_id ' +
      'WHERE m.user_id = ? AND m.status = ? AND m.revoked_at IS NULL ' +
      'AND (m.expires_at IS NULL OR m.expires_at > ?) ' +
      'AND t.status = ? ' +
      'ORDER BY m.granted_at, m.id',
  )
    .bind(userId, 'active', now, 'active')
    .all<{ account_id: string; name: string }>()

  const businesses: AdmittedBusiness[] = []
  for (const row of results ?? []) {
    const entitlement = await bestActiveGrant(env, row.account_id, now)
    businesses.push({
      businessId: row.account_id,
      name: row.name,
      entitlement,
      selectable: entitlement !== null,
    })
  }
  return businesses
}

/**
 * One business by id, WITHOUT consulting membership — the admin bypass's half.
 *
 * [[DOC-40]] §6's `platform_admin` is ambient by design: it has to work before
 * any membership row exists, or the flag could not be used to repair the system
 * that grants it. So the bypass needs a way to reach a business that
 * {@link businessesFor} will never return, and this is it.
 *
 * IT BYPASSES MEMBERSHIP AND NOTHING ELSE. The tenant must still be registered
 * and ACTIVE, and the grant is still selected the ordinary way — an administrator
 * operating an expired account should see exactly what the customer sees, which
 * is the only way the support call ends with the right answer. `selectable` is
 * therefore computed here identically to the membership path rather than forced
 * true, so a lapsed business refuses an admin for the same reason and through the
 * same field it refuses its owner.
 *
 * `null` FOR AN UNKNOWN OR DEACTIVATED BUSINESS, which the caller turns into the
 * same refusal an unauthorised target gets. Distinguishing them on the wire would
 * make this an existence oracle over every business in the system, held open by
 * whoever most recently had the flag.
 */
export async function admissibleBusiness(
  env: IdentityEnv,
  businessId: string,
  now: string = new Date().toISOString(),
): Promise<AdmittedBusiness | null> {
  const row = await env.DB.prepare('SELECT id, name FROM tenants WHERE id = ? AND status = ?')
    .bind(businessId, 'active')
    .first<{ id: string; name: string }>()
  if (!row) return null
  const entitlement = await bestActiveGrant(env, businessId, now)
  return { businessId: row.id, name: row.name, entitlement, selectable: entitlement !== null }
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
  businessId: string,
  now: string,
): Promise<EntitlementRow | null> {
  return env.DB.prepare(
    'SELECT id, account_id, email, plan, source, status, starts_at, ends_at FROM entitlements ' +
      'WHERE account_id = ? AND status = ? AND starts_at <= ? ' +
      'AND (ends_at IS NULL OR ends_at > ?) ' +
      'ORDER BY (ends_at IS NULL) DESC, ends_at DESC, starts_at DESC, id LIMIT 1',
  )
    .bind(businessId, 'active', now, now)
    .first<EntitlementRow>()
}

function requirePlatformTenant(env: IdentityEnv): string {
  const tenantId = (env.TENANT_ID ?? '').trim()
  if (tenantId === '') throw new IdentityNotConfiguredError()
  return tenantId
}
