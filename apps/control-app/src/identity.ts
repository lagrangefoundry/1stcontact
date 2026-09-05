import { d1r2SiteStore, type SiteStoreEnv } from '../../../tools/generate/src/store/d1r2-store'
import { starterHomePage, starterSiteJson } from '../../../tools/generate/src/cli/scaffold'

/**
 * Identity, accounts and entitlement (REQ-167) — [[DOC-40]].
 *
 * TWO OPERATIONS, AND THEY ARE DELIBERATELY ASYMMETRIC.
 * {@link provisionBusiness} creates a business and everything that makes it
 * operable: the tenant, the membership that joins its owner to it, the grant
 * that admits them, and something to edit when they arrive.
 * {@link admit} creates NOTHING — it is pure lookup, and a verified email with no
 * row behind it is refused rather than signed up. Self-signup is [[DOC-40]] §5's
 * later branch and its absence here is the feature: until it lands, the only way
 * into this system is for someone to have been invited into it.
 *
 * THE PERSON IS NOT WRITTEN HERE, AND THAT SPLIT IS [[REQ-186]]'s. There used to
 * be a `provisionInvite` that wrote the person AND their first business in one
 * call, which reads as a convenience and is a model error: it can only ever
 * express a person who owns a business, so it cannot express Bob — a member of
 * a customer's business, with a portal and nothing to run ([[DOC-42]] §1). The
 * invite is a `users` row in the business the caller is in and lives in
 * `people.ts` beside the tab that performs it; provisioning a business is 1st
 * Contact's own product-fulfilment action and lives here. Composing the two is
 * what makes a level-1 customer, and keeping them apart is what makes level 2
 * expressible at all.
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
 * tenant, and the hard information barrier. `memberships (user_id, business_id)`
 * has always been a join and that column has always held a tenant id — it was
 * called `account_id` until [[REQ-184]] renamed it to say so — so the schema
 * carried this from the first migration; what did not was this module,
 * which resolved one membership and reported it singular. {@link admit} now
 * returns the SET ({@link AdmittedBusiness}), and {@link provisionBusiness}
 * adds one to an account that already exists.
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
  /**
   * BREAK GLASS — the addresses that may operate the 1st Contact business
   * whatever the database says ([[DOC-40]] §6).
   *
   * A comma-separated list of email addresses, EMPTY BY DEFAULT, for exactly one
   * situation: the rows that confer operation are missing, and the only way to
   * write them is through a system nobody can currently enter. [[REQ-185]] moved
   * ownership onto `memberships.role`, which put it BEHIND A ROW — and a missing
   * row is precisely the lockout §6's ambient flag exists to prevent. This var is
   * what keeps that promise once ownership is a row: it is deployment
   * configuration, so it works before any row exists, and it cannot be revoked by
   * the database it repairs.
   *
   * IT CONFERS BOTH HALVES, AND THAT IS NOT A RE-BUNDLING of what [[REQ-185]]
   * separated. The two capabilities stay separate WHERE THEY ARE READ — no
   * predicate answers both — and this var writes the two facts down separately:
   * {@link ensurePlatformOperator} leaves an `owner` membership on the 1st
   * Contact business AND sets `platform_operator` on the user, as two rows a
   * later reader can tell apart. A var that synthesised an admission in memory
   * would be the thing that re-bundles them, because nothing on disk would record
   * which half was being used.
   *
   * AND USING IT LEAVES THE ROWS BEHIND rather than standing in for them forever.
   * The seed is idempotent — the `WHERE NOT EXISTS` shape
   * `0005_operator_membership.sql` already uses — so the first admission repairs
   * the database and every later one finds what it would have written. Emptying
   * the var afterwards does not undo the repair, which is what makes this break
   * glass rather than a permanent second authorisation path.
   */
  PLATFORM_ADMINS?: string
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
  /**
   * May this person enter a business they hold no membership on ([[REQ-185]])?
   *
   * ONE CAPABILITY, NOT TWO. It was `platform_admin`, and it answered this
   * question AND "am I an owner of the 1st Contact business" — two questions with
   * nothing to do with each other ([[DOC-42]] §10.3). Ownership moved to
   * `memberships.role`, where every other business already expresses it. What is
   * left here is the one thing that is genuinely ours alone, and it is ours
   * because 1st Contact HOSTS the other businesses ([[DOC-42]] §8) rather than
   * because of any level or seniority.
   *
   * IT IS NOT A STATEMENT ABOUT OWNERSHIP, and the name is the guard. `scope.ts`
   * is its only reader; no control, page or route is gated on it, and none may
   * be — a surface that appears "because you are an admin" is [[DOC-40]] §2.1
   * rule 1's failure mode, and the two conditions [[DOC-42]] §7 actually
   * describes are {@link ownsPlatformBusiness}.
   */
  platform_operator: number
  tos_version: string | null
  tos_accepted_at: string | null
  invited_at: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

/**
 * One grant. `ends_at` null is open-ended.
 *
 * TWO IDS, AND THEY ARE NOT THE SAME NOUN ([[DOC-42]] §6, [[REQ-184]]). An
 * entitlement grants an ACCOUNT access to a THING: `account_id` is the subject
 * and `business_id` is the object. `0004` had one column called `account_id`
 * with the OBJECT in it, so the column named for the subject held the object and
 * the subject had no column at all; `0006` renames that one and adds this one.
 *
 * `account_id` NULL IS A FIRST-CLASS VALUE, not a missing one: it means the grant
 * names no account, which is a per-business CAPACITY grant — "this business holds
 * a pro plan". Every grant written today is one. A per-ACCOUNT grant ("Bob may
 * read Alice's paywalled pages") names both, and the two are DIFFERENT GRANTS
 * rather than one generalised — capacity must not require re-granting every
 * member as they join. {@link bestActiveGrant} is the capacity check and requires
 * the subject to be absent, so neither kind can satisfy the other's question.
 *
 * NOTHING MAY ASSERT THAT `account_id` IS A `users.id`. One user is one account
 * today; the day an account has two people on it, that assumption is a migration
 * rather than a row.
 */
export interface EntitlementRow {
  id: string
  business_id: string | null
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
 * `no_membership` IS ACCOUNT-LEVEL, NOT BUSINESS-LEVEL. It means *none of them*
 * — no live membership at all. A single lapsed business among several is not a
 * refusal; it comes back in the admission marked unselectable
 * ({@link AdmittedBusiness}).
 *
 * `no_entitlement` IS NO LONGER A REFUSAL, AND IS STILL A REASON ([[DOC-42]]
 * §10.1). Membership admits and entitlement does not, so an account whose every
 * grant has lapsed is admitted with nothing selectable rather than turned away —
 * see {@link admit}. The value stays in this union because the state stays worth
 * naming in the log an operator reads when a customer says "it says no", and
 * `index.ts` records it there when the resolver finds nothing to open. What
 * changed is that it never produces `ok: false`.
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
   * NAMED `businessId`, AND SINCE [[REQ-184]] SO IS THE COLUMN. It read
   * `account_id` in `0004` and always held a tenant id; `0006` renamed it, because
   * once `entitlements.account_id` started meaning an actual account, two adjacent
   * tables carrying that name with opposite meanings was worse than either alone.
   * The id VALUES still read `acct_…` and are left alone — they are opaque,
   * permanent and present in R2 keys, so renaming the prefix buys a data migration
   * for nothing ([[REQ-180]] §3). An account id and a business id are both opaque
   * strings, so the type system is the only place that confusion can be caught,
   * and the field name is where it is caught.
   */
  businessId: string
  /** `tenants.name` — the human label, which may change. */
  name: string
  /**
   * `memberships.role` — what this person is TO this business ([[REQ-185]]).
   *
   * `owner` for every business {@link provisionBusiness} creates; `support` is
   * what a time-boxed grant ([[DOC-40]] §6) will carry when there is a second
   * operator. UNCONSTRAINED TEXT, like `plan` and `status` on `entitlements` and
   * for the same reason 0004 gives: a role added when seats land must be a code
   * change and not a schema migration.
   *
   * NULL EXACTLY WHEN THERE IS NO MEMBERSHIP — which is the hosting bypass's
   * business ({@link admissibleBusiness}) and nothing else. That is what keeps
   * the two capabilities apart as a property of the data rather than as a rule
   * someone has to remember: entering a business you do not belong to never makes
   * you its owner, so {@link ownsBusiness} answers false about it.
   *
   * THE 1st CONTACT BUSINESS IS NOT A SPECIAL CASE OF IT. Owning it is an `owner`
   * row exactly like owning a salon, so this field reads `owner` for both and
   * nothing downstream can tell which is which.
   */
  role: string | null
  /** The best active grant covering now, or null when nothing covers it. */
  entitlement: EntitlementRow | null
  /** Whether this business may be entered. False exactly when there is no grant. */
  selectable: boolean
  /**
   * Why it may not be entered — present EXACTLY when `selectable` is false.
   *
   * The pair is computed from one answer ({@link bestActiveGrant} returning
   * null) rather than from two queries that could disagree, so there is no state
   * where a business is unselectable for no stated reason or carries a reason it
   * does not need. See {@link BusinessLapse}.
   */
  lapse: BusinessLapse | null
}

/**
 * Why a business lapsed ([[REQ-180]] §1) — and why saying so is not a leak.
 *
 * `DenialReason` IS THE OPPOSITE CASE, and the contrast is the whole argument.
 * That one never reaches the wire, because it answers "does an account exist for
 * this email" to anyone who can pass a one-time PIN — which is anyone. This one
 * is only ever computed for a business the caller ALREADY HOLDS A LIVE MEMBERSHIP
 * ON: `businessesFor` joins through `memberships`, so a business the caller has
 * nothing to do with is not in the answer to carry a reason. The reason is a fact
 * about the caller's own business, it is owed to them, and it discloses nothing
 * about anybody else's.
 *
 * WITHOUT IT, "your grant expired" AND "your grant was withdrawn" ARE THE SAME
 * SCREEN. [[REQ-179]] made a lapsed business distinguishable from a deleted one,
 * which is the first half; this is the second. One of those two states is fixed
 * by paying and the other by talking to us, and a person who cannot tell which
 * they are in will do neither.
 */
export type LapseReason =
  /** A grant covered this business and its end has passed. */
  | 'expired'
  /** A grant exists and was withdrawn — `status` is no longer `active`. */
  | 'revoked'
  /** A grant is written and has not started yet. */
  | 'not_yet'
  /** No grant was ever made against this business. */
  | 'never_granted'

export interface BusinessLapse {
  reason: LapseReason
  /**
   * When access ended — set for `expired` and null for everything else.
   *
   * ONE DATE FIELD AND NOT THREE. The date is load bearing for exactly one
   * reason: "your access ended" is a different sentence from "your access ended
   * on 1 August", and only the second one lets someone check it against what they
   * thought they had bought. `revoked` has no meaningful date to give — a
   * withdrawal is an act, and the row records no time for it — and `not_yet` and
   * `never_granted` have nothing that has ended. Carrying nullable fields for the
   * cases that do not have them would be three ways to render nothing.
   */
  endedAt: string | null
}

/**
 * ADMISSION CARRIES THE SET, and there is no singular `accountId` on it.
 *
 * The field was removed rather than kept beside the list, deliberately. A caller
 * left reading it would serve whichever business sorted first to a person who
 * had selected the second — a silent, plausible, wrong answer. Deleting it turns
 * every such call site into a compile error instead.
 *
 * `businesses` is non-empty on an `ok` admission. It MAY HOLD NO SELECTABLE
 * MEMBER: admission is a fact about the person's membership, and lapse is a fact
 * about each business's grant ([[DOC-42]] §4). A caller that needs one to enter
 * must consult `selectable` rather than reading `ok` as a promise of access —
 * which is what `scope.ts` does, and why it can answer "no business" rather than
 * throwing. Which one is being operated is [[REQ-168]]'s question, not this
 * one's.
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
 * Add one business to an account that already exists ([[DOC-40]] §4).
 *
 * EVERYTHING A BUSINESS IS, AND NOTHING A PERSON IS: a `tenants` row, a
 * membership joining them, an entitlement, and one site to edit. That is the
 * whole of what a business is, which is why it needs no schema it does not
 * already have — and why every entry point that makes one comes through here
 * rather than writing its own copy. The person it belongs to was invited
 * separately ([[REQ-186]]).
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
      'INSERT INTO memberships (id, user_id, business_id, role, status, granted_by, granted_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(newId('mem'), spec.accountUserId, businessId, 'owner', 'active', spec.grantedBy ?? null, now),
    env.DB.prepare(
      // `account_id` IS LEFT UNSET, and that is the grant this writes rather than
      // an omission: provisioning gives a BUSINESS its capacity ([[REQ-184]]), and
      // naming a subject here would make the grant Alice's-personal rather than
      // Alice's-Plumbing's — invisible to every other member the day one is added.
      'INSERT INTO entitlements (id, business_id, email, plan, source, status, starts_at, ends_at, ' +
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
  // THE SCAFFOLD IS WRITTEN ONLY WHEN THE SITE DID NOT EXIST (BUG-51).
  //
  // `createDraft` has always been `INSERT OR IGNORE`, which made this pair LOOK
  // idempotent — and it is, right up to the `write`, which replaces `site.json`
  // and `home.json` unconditionally. So provisioning onto a slug that already
  // held a site replaced that site's content with a blank starter page while
  // leaving its journal, assets and version behind to say what used to be there.
  //
  // NOT REACHABLE TODAY, AND SAID SO PLAINLY. `businessId` is `newId('acct')` —
  // 16 random bytes — so provisioning cannot collide with a slug that exists, and
  // this branch is a guard rather than a fix for a live failure. It is here
  // because the `createDraft`-then-`write` pair IS the shape that destroyed a
  // site on the import route, and the illusion of safety is the same illusion in
  // both places; a reader who copies this function should copy the guarded form.
  // It stops being hypothetical the moment [[REQ-183]] seeds the portal site at
  // provisioning time, because `PORTAL_SLUG` is a FIXED slug per tenant.
  //
  // A SITE THAT EXISTS IS LEFT ENTIRELY ALONE rather than merged with or
  // repaired. There is nothing to repair: the starter is one blank page whose
  // only purpose is to give a new account something to edit, and an account that
  // already has a site already has that.
  if (await store.createDraft(slug)) {
    await store.write(slug, {
      siteJson: starterSiteJson(slug),
      pages: [{ name: 'home.json', page: starterHomePage(slug, STARTER_HEADING) }],
    })
  }
  return slug
}

/**
 * Login: bind a verified email to an account, or refuse.
 *
 * NOTHING IS CREATED HERE FOR ANYONE THE DATABASE DECIDES ABOUT. Every step is a
 * read except the one stamp, and a missing row at any step is a refusal rather
 * than a repair. See the file header for why that asymmetry is the whole design.
 *
 * THE ONE EXCEPTION IS `PLATFORM_ADMINS`, AND IT IS NOT A CRACK IN THAT RULE.
 * The rule exists because admission must not be self-serve: the Access policy is
 * identity-only, so "provision on first sight" would give an account to anyone
 * who can receive an email. `PLATFORM_ADMINS` is not something a caller can
 * present — it is deployment configuration, set by whoever can deploy this
 * Worker, and a caller who could edit it could edit the database directly. So
 * the unbounded set the rule guards against is still empty, and what the seed
 * buys is [[DOC-40]] §6's promise that the break-glass capability "cannot lock
 * its holder out of the system that grants it" — a promise [[REQ-185]] would
 * otherwise have broken by moving ownership behind a `memberships` row.
 *
 * IT RUNS BEFORE `findUser`, because the lockout it repairs includes having no
 * `users` row at all. Seeding after the `no_user` refusal would fix every case
 * except the one a fresh database presents.
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

  // Break glass, and then carry on down the ordinary path. The seed writes rows;
  // it does not produce an admission — so a holder is admitted by the same three
  // reads as everybody else, against rows that are now there. That is what makes
  // this a repair rather than a second authorisation path with its own bugs.
  if (isPlatformAdminSeed(env, normalised)) await ensurePlatformOperator(env, normalised)

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
  //
  // MEMBERSHIP ADMITS; ENTITLEMENT DOES NOT ([[DOC-42]] §4, §5). No membership
  // anywhere is no relationship with anything, and there is nothing to admit
  // someone to — so that stays a refusal. A membership whose grant has lapsed is
  // a relationship that is still there, and refusing it removes the remedy along
  // with the access: the person cannot see what they were charged, cannot reach
  // the page where they would PAY — the only act that restores the grant — and
  // cannot reach their delete button, which [[DOC-37]] makes an obligation
  // rather than a feature. So an account with nothing selectable is ADMITTED,
  // and the set simply comes back with nothing selectable in it.
  const businesses = await businessesFor(env, user.id, stamp)
  if (businesses.length === 0) return { ok: false, reason: 'no_membership', email: normalised }

  return { ok: true, user: { ...user, first_seen_at: user.first_seen_at ?? stamp }, businesses }
}

/**
 * Is this address one the deployment named as break glass ([[DOC-40]] §6)?
 *
 * COMMA-SEPARATED AND CASEFOLDED, compared against the same {@link
 * normaliseEmail} the `users` index is written through — otherwise a var reading
 * `Martin@example.com` would name a person the database does not contain, and
 * the failure would be a lockout discovered at exactly the moment the var was
 * reached for.
 *
 * EMPTY IS THE DEFAULT AND MEANS NOBODY. An unset var must not open anything,
 * for the same reason `ACCESS_TEAM_DOMAIN` empty means deny: a capability that
 * switches on when configuration goes missing is the opposite of a control.
 */
function isPlatformAdminSeed(env: IdentityEnv, normalisedEmail: string): boolean {
  if (normalisedEmail === '') return false
  return (env.PLATFORM_ADMINS ?? '')
    .split(',')
    .map((entry) => normaliseEmail(entry))
    .filter((entry) => entry !== '')
    .includes(normalisedEmail)
}

/**
 * Write down what `PLATFORM_ADMINS` claims, so the database stops disagreeing.
 *
 * WHAT IT WRITES IS WHAT AN OPERATOR ALREADY HAS, and the shape is
 * `0005_operator_membership.sql`'s deliberately: the platform `tenants` row, the
 * person, an `owner` membership joining them to the 1st Contact business, and an
 * open-ended grant. That migration seeds one named operator at deploy time; this
 * seeds whoever the var names, at admission time, and the two must produce
 * indistinguishable rows or "break glass" would mean "get a slightly different
 * account".
 *
 * BOTH HALVES, WRITTEN SEPARATELY ([[REQ-185]]). The membership is the ownership
 * half and `platform_operator` is the hosting half, and they go in as two
 * independent facts rather than one flag — so a later reader asking "is this
 * person an owner here" and a later reader asking "may this person enter a
 * business they are not a member of" consult different rows, which is the whole
 * of what this ticket separated.
 *
 * IDEMPOTENT BY `WHERE NOT EXISTS`, NOT BY `INSERT OR IGNORE`, for the reason
 * 0005 states: `OR IGNORE` relies on a unique index over exactly the columns that
 * make the row a duplicate, and `entitlements` deliberately has none. Every
 * admission by a holder runs this, so "cheap when there is nothing to do" is a
 * requirement rather than a nicety — three `WHERE NOT EXISTS` inserts that match
 * nothing is what a steady state costs.
 *
 * IT DOES NOT CREATE A STARTER SITE, unlike {@link provisionBusiness}. The 1st
 * Contact business is not being provisioned here — it exists, and this is a
 * membership onto it. Writing a starter site into the platform's own business
 * every time an operator logged in would be a new site nobody asked for.
 *
 * NO GRANT IS OVERWRITTEN. The entitlement is inserted only when nothing active
 * covers the business, so a deployment that has deliberately dated the platform's
 * own grant keeps it rather than having it silently widened to open-ended by
 * whoever logged in next.
 */
export async function ensurePlatformOperator(env: IdentityEnv, email: string): Promise<void> {
  const platformTenant = requirePlatformTenant(env)
  const normalised = normaliseEmail(email)
  if (normalised === '') throw new Error('A platform operator needs an email address.')
  const now = new Date().toISOString()

  // The business itself, in case this is a database being brought up from empty.
  // `forTenant` refuses an unregistered tenant, so a membership pointing at one
  // would be a row that can never be used — and `businessesFor`'s join drops it,
  // so the operator would be refused `no_membership` with the row sitting there.
  await d1r2SiteStore(env).createTenant({ id: platformTenant, name: platformTenant })

  // The person. Casefolded on the way in for the reason `normaliseEmail` gives:
  // `idx_users_tenant_email` is byte-exact, so a differently-cased row would be a
  // second person this function would never find again.
  await env.DB.prepare(
    'INSERT INTO users (id, tenant_id, email, status, platform_operator, invited_at, ' +
      'created_at, updated_at, fields) SELECT ?, ?, ?, ?, 1, ?, ?, ?, ? ' +
      'WHERE NOT EXISTS (SELECT 1 FROM users WHERE tenant_id = ? AND email = ?)',
  )
    .bind(newId('usr'), platformTenant, normalised, 'active', now, now, now, '{}', platformTenant, normalised)
    .run()

  // The hosting half, for a person who already had a row without it. Separate
  // from the insert above because the row may predate the var — an operator
  // invited as an ordinary customer and later named here must gain the column,
  // and an `INSERT ... WHERE NOT EXISTS` says nothing about a row that exists.
  await env.DB.prepare(
    'UPDATE users SET platform_operator = 1, updated_at = ? WHERE tenant_id = ? AND email = ? ' +
      'AND platform_operator = 0',
  )
    .bind(now, platformTenant, normalised)
    .run()

  // The ownership half — the row this function exists for. Inserted FROM a select
  // over `users` rather than against an id computed above, so it agrees with a
  // row an earlier run or an invite already wrote.
  await env.DB.prepare(
    'INSERT INTO memberships (id, user_id, business_id, role, status, granted_by, granted_at) ' +
      "SELECT ?, u.id, ?, 'owner', 'active', ?, ? FROM users u " +
      'WHERE u.tenant_id = ? AND u.email = ? AND NOT EXISTS (' +
      'SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.business_id = ?)',
  )
    .bind(newId('mem'), platformTenant, 'PLATFORM_ADMINS', now, platformTenant, normalised, platformTenant)
    .run()

  // AND THE GRANT, WITHOUT WHICH THE MEMBERSHIP IS HALF A REPAIR. `admit` admits
  // a member whose grant has lapsed ([[REQ-184]]), so this is not the difference
  // between in and out — but a business with no covering grant is unselectable,
  // and `resolveScope` refuses it `no_entitlement`. Break glass that admitted its
  // holder to a business they could not open would not have repaired anything.
  //
  // Open-ended, and `account_id` LEFT NULL: this is a grant to the BUSINESS
  // ([[REQ-184]]), which is the kind `bestActiveGrant` selects. A dated grant on
  // the platform's own business would expire the operator out of their own
  // deployment at a wall-clock time nobody chose.
  await env.DB.prepare(
    'INSERT INTO entitlements (id, business_id, email, plan, source, status, starts_at, ' +
      "ends_at, granted_by, note, created_at, updated_at) SELECT ?, ?, ?, 'pro', 'admin_grant', " +
      "'active', ?, NULL, ?, ?, ?, ? WHERE NOT EXISTS (" +
      'SELECT 1 FROM entitlements WHERE business_id = ? AND account_id IS NULL ' +
      "AND status = 'active' AND starts_at <= ? AND (ends_at IS NULL OR ends_at > ?))",
  )
    .bind(
      newId('ent'),
      platformTenant,
      normalised,
      now,
      'PLATFORM_ADMINS',
      "The platform business's own capacity, seeded by PLATFORM_ADMINS ([[DOC-40]] §6).",
      now,
      now,
      platformTenant,
      now,
      now,
    )
    .run()
}

/**
 * The account an operator named, by the address it logs in with ([[REQ-180]]).
 *
 * IT EXISTS SO THAT NOTHING OUTSIDE THIS MODULE HAS TO KNOW WHERE ACCOUNTS LIVE.
 * "The platform's own tenant" is `TENANT_ID`, and [[REQ-168]] deliberately left
 * that variable exactly two readers — this file and `scope.ts` — because a third
 * one is how the platform's data ends up in a customer's session. An operator
 * route that looked the account up itself would be that third reader, so the
 * lookup is offered here instead and the caller passes an email.
 *
 * BY EMAIL AND NOT BY ID, because the operator has an email. The id is
 * `newId('usr')` — opaque by construction and never shown — so a route keyed on
 * it would be one nobody could use without first running a query this module does
 * not expose.
 *
 * NULL RATHER THAN A THROW. "No account with that address" is an ordinary answer
 * to an operator who mistyped one, and it is not a disclosure: reaching this
 * function at all requires owning the 1st Contact business
 * ({@link ownsPlatformBusiness}).
 */
export async function findAccount(env: IdentityEnv, email: string): Promise<UserRow | null> {
  const platformTenant = requirePlatformTenant(env)
  const normalised = normaliseEmail(email)
  if (normalised === '') return null
  return findUser(env, platformTenant, normalised)
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
    'SELECT m.business_id AS business_id, m.role AS role, t.name AS name FROM memberships m ' +
      'JOIN tenants t ON t.id = m.business_id ' +
      'WHERE m.user_id = ? AND m.status = ? AND m.revoked_at IS NULL ' +
      'AND (m.expires_at IS NULL OR m.expires_at > ?) ' +
      'AND t.status = ? ' +
      'ORDER BY m.granted_at, m.id',
  )
    .bind(userId, 'active', now, 'active')
    .all<{ business_id: string; role: string; name: string }>()

  const businesses: AdmittedBusiness[] = []
  for (const row of results ?? []) {
    businesses.push(await admittedBusiness(env, row.business_id, row.name, row.role, now))
  }
  return businesses
}

/**
 * Is this person an owner of that business ([[REQ-185]])?
 *
 * ONE QUESTION, ASKED THE SAME WAY FOR EVERY BUSINESS. It used to have two
 * answers depending on WHICH business was being asked about — `memberships.role`
 * for a customer's, `users.platform_admin` for 1st Contact's — and that asymmetry
 * is [[DOC-40]] §2.1 rule 1's named failure mode: a platform-only flag standing
 * in for a capability every business owner needs. Owning the 1st Contact business
 * is an `owner` row exactly like owning a salon, and this function cannot tell
 * the two apart because there is nothing to tell apart ([[DOC-42]] §7).
 *
 * IT READS THE ADMISSION AND TOUCHES NO TABLE. The admission already carries
 * every business this person may operate, each with its role, so asking the
 * database again would be a second answer that could disagree with the one
 * admission was decided from.
 *
 * IT IS NOT THE HOSTING BYPASS AND CANNOT BECOME IT. A business reached through
 * {@link admissibleBusiness} carries `role: null`, so entering a business you do
 * not belong to never makes you its owner. That is the separation this ticket
 * exists for, and it holds because of where the data comes from rather than
 * because two call sites agree.
 */
export function ownsBusiness(
  admission: Admission | null | undefined,
  businessId: string,
): boolean {
  if (!admission?.ok) return false
  return admission.businesses.some((b) => b.businessId === businessId && b.role === 'owner')
}

/**
 * Is this person an owner of the 1st Contact business ([[DOC-42]] §7)?
 *
 * THE GATE ON A PRODUCT-FULFILMENT CONTROL, and it is TWO CONDITIONS rather than
 * a privilege: *you are an owner of this business*, and *this business's product
 * is businesses*. Provisioning a business is 1st Contact filling an order — which
 * is why it writes a `tenants` row and therefore needs a gate at all. A customer
 * will have fulfilment actions of their own and they will look nothing like these.
 * Neither condition is the word "admin", and there is deliberately no generic
 * privileged-surface mechanism here for the next surface to reuse: the next one
 * asks these same two questions about whatever business it is for.
 *
 * "THIS BUSINESS'S PRODUCT IS BUSINESSES" IS `TENANT_ID` TODAY, which is why the
 * predicate lives in this module rather than at the route. [[REQ-168]] left that
 * variable exactly two readers — this file and `scope.ts` — because a third is
 * how the platform's data ends up in a customer's session, and a route resolving
 * the platform business for itself would be that third one.
 *
 * IT SAYS NOTHING ABOUT `platform_operator`, deliberately and permanently. A
 * holder of that column who owns no membership here is refused by this function,
 * which is the acceptance criterion that no single predicate answers both
 * questions.
 *
 * `boolean`, NOT A TYPE PREDICATE narrowing to a successful admission — which
 * compiles and would be wrong. True here does imply the admission succeeded, but
 * a predicate asserts the CONVERSE too, and false says nothing: an ordinary
 * customer is admitted and owns nothing here. TypeScript would then treat the
 * refusal branch as unreachable for an admitted caller, which is the one caller
 * that branch mostly serves.
 */
export function ownsPlatformBusiness(
  env: IdentityEnv,
  admission: Admission | null | undefined,
): boolean {
  return ownsBusiness(admission, requirePlatformTenant(env))
}

/**
 * One business's access, as the switcher and the account surface read it.
 *
 * THE THREE FIELDS ARE ONE DECISION, and this function is where it is made once.
 * `selectable` and `lapse` are both derived from whether {@link bestActiveGrant}
 * found anything, so a business cannot be unselectable with no reason or
 * selectable with one — the states that would make the account surface contradict
 * the switcher. Both entry points into the admissible set ({@link businessesFor}
 * and {@link admissibleBusiness}) go through here rather than assembling the
 * literal themselves, because the admin path showing a different answer from the
 * owner's is exactly the bug the support call cannot survive.
 *
 * THE LAPSE COSTS A QUERY THAT IS ONLY RUN WHEN IT IS NEEDED. A selectable
 * business has nothing to explain, so {@link lapseFor} is not called for one —
 * which is every business in the ordinary case.
 */
async function admittedBusiness(
  env: IdentityEnv,
  businessId: string,
  name: string,
  role: string | null,
  now: string,
): Promise<AdmittedBusiness> {
  const entitlement = await bestActiveGrant(env, businessId, now)
  return {
    businessId,
    name,
    role,
    entitlement,
    selectable: entitlement !== null,
    lapse: entitlement === null ? await lapseFor(env, businessId, now) : null,
  }
}

/**
 * Why a business with no covering grant has none.
 *
 * IT ASKS THE SAME TABLE {@link bestActiveGrant} ASKED, WITHOUT THE FILTERS. That
 * is the point: the filters are what turned four distinguishable situations into
 * one `null`, so the reason is recovered by looking at what the filters excluded
 * rather than by recording it somewhere at write time. Nothing has to be kept in
 * step, and a grant written by a path that does not exist yet is still explained.
 *
 * `account_id IS NULL` IS THE ONE CONDITION IT KEEPS, because that one is not a
 * filter — it is which KIND of grant this question is about ([[REQ-184]]). A
 * business whose only rows name an account has had no capacity grant made against
 * it, and `never_granted` is the true answer; treating a per-account grant as an
 * explanation would report "expired" about something that never applied.
 *
 * THE ORDER OF THE BRANCHES IS THE ORDER OF USEFULNESS TO THE PERSON READING IT.
 * A grant that has not started outranks one that has ended, because an account
 * holding both is one whose access is COMING BACK, and "your access ended" would
 * be true, unhelpful and the opposite of the news. A withdrawal outranks nothing:
 * it is what is left when no dated grant explains the state.
 *
 * THE LATEST `ends_at` IS THE ONE REPORTED, not the first. An account whose grant
 * was renewed twice has three expired rows and only the last one is the date its
 * access actually stopped; reporting an earlier one would be a true row and a
 * false answer.
 */
async function lapseFor(
  env: IdentityEnv,
  businessId: string,
  now: string,
): Promise<BusinessLapse> {
  const { results } = await env.DB.prepare(
    'SELECT status, starts_at, ends_at FROM entitlements WHERE business_id = ? ' +
      'AND account_id IS NULL',
  )
    .bind(businessId)
    .all<{ status: string; starts_at: string; ends_at: string | null }>()
  const grants = results ?? []
  if (grants.length === 0) return { reason: 'never_granted', endedAt: null }

  const active = grants.filter((g) => g.status === 'active')
  if (active.some((g) => g.starts_at > now)) return { reason: 'not_yet', endedAt: null }

  const ended = active
    .map((g) => g.ends_at)
    .filter((endsAt): endsAt is string => endsAt !== null && endsAt <= now)
  if (ended.length > 0) {
    return { reason: 'expired', endedAt: ended.reduce((a, b) => (a > b ? a : b)) }
  }

  // Every grant this business has is non-`active`. There is no fourth shape:
  // an `active` grant that neither starts in the future nor has ended is a
  // covering grant, and `bestActiveGrant` would have returned it.
  return { reason: 'revoked', endedAt: null }
}

/**
 * One business by id, WITHOUT consulting membership — the admin bypass's half.
 *
 * [[DOC-40]] §6's `platform_operator` is ambient by design: it has to work before
 * any membership row exists, or the column could not be used to repair the system
 * that grants it. So the bypass needs a way to reach a business that
 * {@link businessesFor} will never return, and this is it.
 *
 * IT IS THE HOSTING HALF AND ONLY THAT ([[REQ-185]]). The column that reaches
 * here once also meant "owner of the 1st Contact business"; that half is
 * `memberships.role` now, and nothing on this path consults it. Entering a
 * business you host is not owning it, which is why what comes back carries
 * `role: null`.
 *
 * IT BYPASSES MEMBERSHIP AND NOTHING ELSE. The tenant must still be registered
 * and ACTIVE, and the grant is still selected the ordinary way — an administrator
 * operating an expired account should see exactly what the customer sees, which
 * is the only way the support call ends with the right answer. `selectable` is
 * therefore computed here identically to the membership path rather than forced
 * true, so a lapsed business refuses an admin for the same reason and through the
 * same field it refuses its owner. That is not a resemblance maintained by hand:
 * both paths end in {@link admittedBusiness}, so the administrator and the owner
 * read one function's answer ([[REQ-180]]) — including the lapse reason, which is
 * the sentence the support call is about.
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
  // `role: null` — there IS no membership here, which is this path's whole
  // point. It is also what keeps [[REQ-185]]'s two capabilities apart: a business
  // reached through the hosting bypass leaves {@link ownsBusiness} answering
  // false about it, so the bypass can never be read back as ownership.
  return admittedBusiness(env, row.id, row.name, null, now)
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
 *
 * `account_id IS NULL` IS THE FOURTH CONDITION AND IT IS A KIND CHECK, NOT A
 * FILTER ([[REQ-184]], [[DOC-42]] §6). This function asks whether a BUSINESS may
 * be entered, which per-business CAPACITY answers and per-account access does
 * not: a grant naming Bob's account against Alice's Plumbing must not make
 * Alice's Plumbing selectable for everyone who holds a membership on it. The same
 * predicate settles the converse for free — a capacity grant has no subject, so
 * an `account_id = ?` lookup can never match one — which is why the two kinds are
 * kept apart by one column rather than by two tables or a `kind` enum.
 */
async function bestActiveGrant(
  env: IdentityEnv,
  businessId: string,
  now: string,
): Promise<EntitlementRow | null> {
  return env.DB.prepare(
    'SELECT id, business_id, account_id, email, plan, source, status, starts_at, ends_at ' +
      'FROM entitlements ' +
      'WHERE business_id = ? AND account_id IS NULL AND status = ? AND starts_at <= ? ' +
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
