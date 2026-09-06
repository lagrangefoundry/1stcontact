import { newId } from '../../../tools/generate/src/store/ids'
import { d1r2SiteStore, type SiteStoreEnv } from '../../../tools/generate/src/store/d1r2-store'
import { starterHomePage, starterSiteJson } from '../../../tools/generate/src/cli/scaffold'
// The event kinds and the insert builder, from the two modules that own them
// ([[REQ-195]]). `events.ts` declares its own narrow env type rather than
// importing `IdentityEnv` back from here, so this import is one-way.
import { CONTACT_CREATED } from './builder/contact-events.js'
import { contactEventInsert } from './events'
// The stage value from the module that names it, never a literal — see the
// same import in `people.ts` ([[DOC-44]] §3, [[REQ-188]]).
import { INVITED as PIPELINE_INVITED } from './builder/people-axes.js'

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
  /**
   * The PRIMARY address, joined from `user_emails` ([[REQ-191]]).
   *
   * NOT A COLUMN ON `users` ANY MORE, and the difference is the whole ticket. It
   * used to be one, under `UNIQUE (tenant_id, email)`, which made the address the
   * person: one human held exactly one, a second address was a second human who
   * could never be reconciled with the first, and changing it mutated the key
   * `admit` resolved them through. A person now holds as many addresses as they
   * have and keeps one key whichever of them they are reached at.
   *
   * IT SURVIVES ON THIS INTERFACE BECAUSE THIS INTERFACE IS A READ MODEL, not a
   * row. Every caller that shows a person shows one address, so the read carries
   * the primary one; a caller that wants all of them asks for all of them
   * ({@link emailsOf}).
   *
   * NULL IS REPRESENTABLE AND IS NOT AN ERROR. A contact reached only by phone
   * has no address at all ([[DOC-42]] §4.1) — the shape that column could not
   * hold, and the reason this one is nullable rather than defaulted to ''.
   */
  email: string | null
  /**
   * The ACCOUNT this contact belongs to ([[REQ-194]], [[DOC-42]] §6).
   *
   * NOT THE SAME NOUN AS `id`, and the difference is what this column exists to
   * hold. An account is the payer and the owner of businesses; a person is
   * somebody a business knows. They were one thing while `findAccount` returned a
   * `UserRow` and an entitlement's subject was a person's key, and one thing
   * cannot express what [[DOC-42]] §6 requires — an account with several people
   * on it.
   *
   * NEVER NULL. Every writer of a `users` row mints or names an account in the
   * same batch, so no reader has an absent case to handle. Two people on one
   * account is two rows carrying the same value here.
   */
  account_id: string
  status: string
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
 *
 * THERE IS NO `email` HERE ANY MORE ([[REQ-191]]). A grant used to carry one
 * beside `account_id`, which is a string foreign key to a person: the same
 * subject had two representations, an address change had two places to land, and
 * it could land in one. A grant names its subject by KEY.
 */
export interface EntitlementRow {
  id: string
  business_id: string | null
  account_id: string | null
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
   * AND THE VALUES READ `biz_…` NOW ([[REQ-194]]). They read `acct_…` while
   * `newId('acct')` minted them and the account had no table of its own, which was
   * defensible only for as long as nothing else could be an account id. Accounts
   * exist and carry keys, so the prefix was freed for the noun it names — REQ-190
   * was reminting every key anyway, which made this the cheap moment. An account id
   * and a business id are both opaque strings, so the type system is the only place
   * that confusion can be caught, and the field name is where it is caught.
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

/**
 * The one thing a refused visitor is told.
 *
 * IT ASSERTS NOTHING ENDED, and that is the whole of BUG-62's first half. The
 * sentence used to read *"your access to 1st Contact has ended"*, which is true
 * of `user_inactive` and false of `no_user` and `no_membership` — and
 * `no_membership` is not an edge case, it is what every invited contact hits
 * before they accept, so the false reading was the one most people saw. The cost
 * was not tone. "Ended" tells the reader they HAD something and lost it, so they
 * go looking for what they did wrong; the truthful answer is usually that they
 * are part-way through signing up. Those two readings lead to different actions
 * and only one of them is available.
 *
 * AND IT STILL NAMES NO REASON, which is the constraint that makes this one
 * sentence rather than five. A refusal that distinguished `no_user` from
 * `no_membership` is a membership oracle to anyone who can pass a one-time PIN,
 * which is anyone — see {@link DenialReason}. So the fix is a sentence TRUE OF
 * EVERY REASON WITHOUT NAMING WHICH, not a sentence per reason.
 *
 * IT IS ABOUT THE REQUEST, NOT THE PERSON. `index.ts` renders this for a scope
 * refusal too — an admitted operator who named a business that is not theirs —
 * and "you have no access to 1st Contact" would be false of exactly that reader.
 * "Cannot open this for you" is true of both paths, which is what lets the two
 * stay byte-identical without either of them lying.
 *
 * THE SECOND SENTENCE IS THE ONLY ACT AVAILABLE. Every reason in the union is
 * fixed by somebody at this end, so there is nothing else honest to suggest.
 */
export const DENIED_MESSAGE =
  '1st Contact cannot open this for you at the moment. ' +
  'Please get in touch and we will sort it out.'

/**
 * An opaque id, `<prefix>_<random>` — re-exported, not defined here ([[REQ-190]]).
 *
 * IT MOVED DOWN A LAYER, and had to. `sites` is keyed by a value the STORE mints
 * — `createDraft` is where a site comes into existence — and `control-app`
 * imports `tools/generate`, never the reverse. Leaving the minter up here would
 * have meant a second one down there, and *"a key is a surrogate the system
 * mints"* stops being a property the moment there are two of them.
 *
 * NOT DERIVED FROM ANYTHING A HUMAN CHOSE, and for a business that is a
 * durability property rather than a style. A business id appears in R2 keys
 * (`t/<tenant>/blob/…`) and in `/b/<id>/` URLs and is therefore permanent, so a
 * readable id is one rename request away from being a lie. The human label lives
 * in `tenants.name`, where it can change.
 */
export { newId }

/**
 * Email is compared CASEFOLDED, because `idx_user_emails_tenant_email` is not.
 *
 * SQLite's default collation is byte-exact, so `Sarah@example.com` and
 * `sarah@example.com` would be two rows and two people for one human — and the
 * second one would be created by an invite that looked like it had worked.
 * Normalising on the way in makes the index mean what it is there to mean.
 *
 * AND THE SCHEMA NOW REFUSES THE UNNORMALISED FORM OUTRIGHT ([[REQ-191]]).
 * `user_emails.email` carries `CHECK (email = lower(trim(email)))`, so a writer
 * that forgets this function fails at the write instead of quietly creating the
 * person `admit` will never find. This function stays because a caller still has
 * to normalise what it was TYPED before it can be compared — the check enforces
 * the invariant, it does not perform the conversion.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * The primary address, as a scalar subquery over `user_emails` ([[REQ-191]]).
 *
 * ONE DEFINITION SITE, exported because `people.ts` selects people too and a
 * second copy of this fragment is a second answer to "which address do we show".
 * It assumes the users table is aliased `u`, which every query using it does.
 *
 * IT FALLS BACK TO THE OLDEST ADDRESS rather than returning NULL when no row
 * carries the flag. The partial unique index guarantees AT MOST one primary and
 * says nothing about at least one, so a person holding addresses and no primary
 * is representable — and showing them nothing would be a blank cell where an
 * address they can actually be reached at exists.
 */
export const PRIMARY_EMAIL_SQL =
  '(SELECT pe.email FROM user_emails pe WHERE pe.user_id = u.id ' +
  'ORDER BY pe.is_primary DESC, pe.created_at ASC, pe.id ASC LIMIT 1)'

/**
 * The person this address reaches, within one business — ANY of their addresses,
 * not only the primary one ([[REQ-191]]).
 *
 * WHY ANY AND NOT PRIMARY. Resolving only the primary would mean a person
 * reached at their second address is a person the system cannot find, so the
 * front door would refuse them and the invite would create the duplicate this
 * whole ticket exists to prevent. The address table is the identity, and every
 * row in it is identity.
 *
 * Takes the tenant and the normalised address, in that order.
 */
export const USER_ID_BY_EMAIL_SQL =
  '(SELECT ue.user_id FROM user_emails ue WHERE ue.tenant_id = ? AND ue.email = ?)'

/** One address a person is reachable at. */
export interface UserEmailRow {
  id: string
  email: string
  is_primary: number
  created_at: string
}

/**
 * Every address one person holds, primary first.
 *
 * ORDERED THE SAME WAY {@link PRIMARY_EMAIL_SQL} PICKS, so the head of this list
 * is the address every other surface is showing. Two orderings would let the
 * detail panel disagree with the row above it about which address is theirs.
 */
export async function emailsOf(env: IdentityEnv, userId: string): Promise<UserEmailRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, email, is_primary, created_at FROM user_emails WHERE user_id = ? ' +
      'ORDER BY is_primary DESC, created_at ASC, id ASC',
  )
    .bind(userId)
    .all<UserEmailRow>()
  return results ?? []
}

/**
 * The statement that writes one address, as a statement rather than a call.
 *
 * A BUILDER SO IT CAN GO IN A BATCH. A person and their first address are one
 * fact arriving in two rows, and the two writers of it ({@link
 * ensurePlatformOperator} and `addContact`) both send them as a batch — a
 * person written without an address is a person nothing can find, which is a
 * worse state than the write having failed.
 *
 * IT NORMALISES rather than trusting the caller. The schema's CHECK would refuse
 * an unnormalised address anyway; doing it here means the refusal never has to
 * happen, and there is exactly one place that decides what is stored.
 */
export function userEmailInsert(
  env: IdentityEnv,
  spec: { userId: string; tenantId: string; email: string; primary?: boolean; now?: string },
): D1PreparedStatement {
  const now = spec.now ?? new Date().toISOString()
  return env.DB.prepare(
    'INSERT INTO user_emails (id, user_id, tenant_id, email, is_primary, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).bind(
    newId('eml'),
    spec.userId,
    spec.tenantId,
    normaliseEmail(spec.email),
    spec.primary === false ? 0 : 1,
    now,
    now,
  )
}

/**
 * An account — the payer, and the owner of businesses ([[REQ-194]], [[DOC-40]] §2).
 *
 * IT IS RELATIVE TO A BUSINESS, exactly the way a level is ([[DOC-42]] §6, §3).
 * Alice is an account of 1st Contact; Bob is an account of Alice's Plumbing. So
 * this row is tenant-scoped like every other identity row, and "an account" is
 * never shorthand for "a row in the platform's own tenant" — that reading is
 * [[DOC-40]] §2.1 rule 1's failure mode, and it is what the missing table was
 * causing in practice.
 *
 * `name` IS A BILLING LABEL AND IS USUALLY NULL TODAY. It is the entity a receipt
 * is addressed to, which is not a person's name; a contact's own name stays on
 * the contact. Nothing in v1 sets it except an invite that was given one.
 */
export interface AccountRow {
  id: string
  tenant_id: string
  name: string | null
  status: string
  created_at: string
  updated_at: string
}

/**
 * The statement that mints one account, as a statement rather than a call.
 *
 * A BUILDER SO IT CAN GO IN A BATCH, for the reason {@link userEmailInsert} is
 * one: a person, their address and their account are one fact arriving in three
 * rows, and a person written against an account that does not exist is a person
 * `users.account_id`'s foreign key refuses. Every writer of a `users` row sends
 * the three together.
 *
 * IT MINTS PER PERSON, WHICH IS v1 AND NOT THE MODEL. One contact, one account,
 * because nothing in the product joins a second person to an existing one yet
 * ([[REQ-194]]). Doing so is binding this account's id into another `users` row —
 * a row, not a migration — which is the property the table exists to buy.
 */
export function accountInsert(
  env: IdentityEnv,
  spec: { id: string; tenantId: string; name?: string | null; now?: string },
): D1PreparedStatement {
  const now = spec.now ?? new Date().toISOString()
  return env.DB.prepare(
    'INSERT INTO accounts (id, tenant_id, name, status, created_at, updated_at, fields) ' +
      "VALUES (?, ?, ?, 'active', ?, ?, '{}')",
  ).bind(spec.id, spec.tenantId, spec.name ?? null, now, now)
}

/** One account by key, or null. */
export async function accountById(
  env: IdentityEnv,
  accountId: string,
): Promise<AccountRow | null> {
  return env.DB.prepare(
    'SELECT id, tenant_id, name, status, created_at, updated_at FROM accounts WHERE id = ?',
  )
    .bind(accountId)
    .first<AccountRow>()
}

/**
 * Every person on one account, oldest first ([[REQ-194]]).
 *
 * IT RETURNS THE SET AND HAS NO `LIMIT 1`, which is the falsifier this ticket
 * names. v1 puts one contact on each account, so every caller sees a
 * single-element list — and the day a second is added, a caller that took the
 * head would silently have made one of the two people the account.
 */
export async function peopleOnAccount(
  env: IdentityEnv,
  accountId: string,
): Promise<string[]> {
  const { results } = await env.DB.prepare(
    'SELECT id FROM users WHERE account_id = ? ORDER BY created_at ASC, id ASC',
  )
    .bind(accountId)
    .all<{ id: string }>()
  return (results ?? []).map((r) => r.id)
}

/** What provisioning one business is told. */
export interface BusinessSpec {
  /**
   * The ACCOUNT that will own it ([[REQ-194]]) — `accounts.id`, not a person's.
   *
   * IT WAS `accountUserId` AND HELD A PERSON, which made the owner of a business
   * whoever happened to be passed rather than the payer, and made "an account
   * with two people" unrepresentable. The account owns; every person on it is
   * written an `owner` membership by this call, so one person behaves exactly as
   * before and two behave the way the model says.
   */
  accountId: string
  /** The business's human label, which `tenants.name` holds and may change. */
  name: string
  /**
   * A plan name, not a capability set ([[DOC-40]] §5).
   *
   * THERE IS NO `email` BESIDE IT ANY MORE ([[REQ-191]]). It used to be written
   * into `entitlements.email` as the claim key and the audit record of who a
   * grant was made to — a string foreign key to a person, which an address
   * change could leave pointing at nobody. Who a grant is for is `account_id`;
   * who made it is `granted_by`; and the membership this call writes in the same
   * batch is the record of whose business it is.
   */
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
  const accountId = (spec.accountId ?? '').trim()
  if (accountId === '') throw new Error('A business needs an account to belong to.')
  const name = spec.name.trim()
  if (name === '') throw new Error('A business needs a name.')

  // THE ACCOUNT IS READ BACK BEFORE ANYTHING IS WRITTEN ([[REQ-194]]). A business
  // whose `owner_account_id` names no row is a business with no payer, and
  // nothing downstream would notice: the switcher joins through `memberships`,
  // so the missing owner is invisible until somebody tries to bill it.
  const account = await accountById(env, accountId)
  if (!account) throw new Error('No such account.')

  // EVERY PERSON ON THE ACCOUNT, NOT THE FIRST ONE. v1 has exactly one, so this
  // is one membership — and it is written this way so that the second person an
  // account gains is an operator of its businesses by construction rather than
  // by a repair somebody has to remember. An account with nobody on it cannot
  // own a business, because nobody could open it.
  const people = await peopleOnAccount(env, accountId)
  if (people.length === 0) throw new Error('An account with nobody on it cannot own a business.')

  const now = new Date().toISOString()
  const businessId = newId('biz')

  // The tenant first: `forTenant` refuses an unregistered one, so a membership
  // pointing at a business the registry has never heard of would be a row that
  // can never be used — and `businessesFor`'s join drops it, so the switcher
  // would not even show what went wrong.
  await d1r2SiteStore(env).createTenant({ id: businessId, name })

  await env.DB.batch([
    // OWNERSHIP IS A COLUMN ON THE BUSINESS ([[REQ-194]]). It used to be inferred
    // from whichever membership row was written first, which answers a different
    // question — `memberships` says who may OPERATE, and an account may put
    // several people on one business. `createTenant` does not take this: it is
    // the site store's verb and the owner is an identity fact, so the registry
    // stays ignorant of accounts and this statement says the one thing it knows.
    env.DB.prepare('UPDATE tenants SET owner_account_id = ? WHERE id = ?').bind(
      accountId,
      businessId,
    ),
    ...people.map((userId) =>
      env.DB.prepare(
        'INSERT INTO memberships (id, user_id, business_id, role, status, granted_by, granted_at) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).bind(newId('mem'), userId, businessId, 'owner', 'active', spec.grantedBy ?? null, now),
    ),
    env.DB.prepare(
      // `account_id` IS LEFT UNSET, and that is the grant this writes rather than
      // an omission: provisioning gives a BUSINESS its capacity ([[REQ-184]]), and
      // naming a subject here would make the grant Alice's-personal rather than
      // Alice's-Plumbing's — invisible to every other member the day one is added.
      // [[REQ-194]] gave the column something real to point at and did not change
      // that: the capacity grant keeps its NULL subject and keeps its meaning.
      'INSERT INTO entitlements (id, business_id, plan, source, status, starts_at, ends_at, ' +
        'granted_by, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      newId('ent'),
      businessId,
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
 * The starter site, and why its slug is a WORD again ([[REQ-190]]).
 *
 * IT USED TO BE THE BUSINESS ID, and that was a workaround for the defect this
 * ticket removed. A published address was claimed globally — `published_sites`
 * was keyed by slug alone, because `/site/<slug>/` carried no business — so a
 * starter site with one name for everybody would have worked perfectly until the
 * SECOND account published, at which point it was refused for a reason its owner
 * could do nothing about. Naming every starter site after its own business id
 * dodged that by making the name unguessable, at the cost of an operator opening
 * the builder and finding their site called `biz_057f…`.
 *
 * The published address is the site's KEY now and the slug is an attribute,
 * unique only inside the business that owns it. So it can be the plain word it
 * always wanted to be: two businesses each have a site under the same name, both
 * publish it, and neither can see that the other exists.
 *
 * THE WORD IS `unnamed`, AND THAT IS A PROMPT RATHER THAN A DESCRIPTION. `home`
 * was the obvious candidate and is the wrong one: it reads as a decision somebody
 * made, so an operator has no reason to change it, and every account's one site
 * would sit under a name that says nothing about the business it belongs to —
 * which is the `biz_057f…` complaint again in a friendlier font. `unnamed` is
 * the one name that is *visibly* provisional, so the site asks to be named the
 * first time its owner looks at it.
 *
 * It is not reserved and nothing enforces it. An operator who keeps it keeps it;
 * the slug is an ordinary attribute and renaming it is one `UPDATE` (the move
 * this ticket's worked example is built on). What the word buys is that the
 * default is legible as a default.
 */
export const STARTER_SLUG = 'unnamed'

/**
 * What the starter site calls itself, distinct from {@link STARTER_SLUG} because
 * the two are different kinds of thing: the slug is a URL-safe attribute the
 * store addresses by, and this is prose that reaches a rendered `<title>`. Both
 * say the same word so the site reads as unnamed wherever it is looked at, and
 * they are separate so that fixing one's spelling never silently rewrites a key.
 */
export const STARTER_NAME = 'Unnamed'

async function createStarterSite(env: IdentityEnv, businessId: string): Promise<string> {
  const store = await d1r2SiteStore(env).forTenant(businessId)
  const slug = STARTER_SLUG
  // THE SCAFFOLD IS WRITTEN ONLY WHEN THE SITE DID NOT EXIST (BUG-51).
  //
  // `createDraft` has always been `INSERT OR IGNORE`, which made this pair LOOK
  // idempotent — and it is, right up to the `write`, which replaces `site.json`
  // and `home.json` unconditionally. So provisioning onto a slug that already
  // held a site replaced that site's content with a blank starter page while
  // leaving its journal, assets and version behind to say what used to be there.
  //
  // REACHABLE NOW, AND THAT IS THE CHANGE ([[REQ-190]]). While the starter slug
  // was the business id it could not collide with anything, so this branch was a
  // guard against a failure that could not happen. `unnamed` is a fixed slug per
  // business, exactly like `PORTAL_SLUG`, so provisioning twice into one business
  // — which `provisionBusiness` does not do today and a repair path might —
  // reaches it. It is here
  // because the `createDraft`-then-`write` pair IS the shape that destroyed a
  // site on the import route, and the illusion of safety is the same illusion in
  // both places; a reader who copies this function should copy the guarded form.
  //
  // A SITE THAT EXISTS IS LEFT ENTIRELY ALONE rather than merged with or
  // repaired. There is nothing to repair: the starter is one blank page whose
  // only purpose is to give a new account something to edit, and an account that
  // already has a site already has that.
  if (await store.createDraft(slug)) {
    await store.write(slug, {
      siteJson: starterSiteJson(slug, STARTER_NAME),
      pages: [{ name: 'home.json', page: starterHomePage(slug, STARTER_HEADING) }],
    })
  }
  return slug
}

/**
 * Refuse, and say why WHERE THE OPERATOR CAN READ IT (BUG-62).
 *
 * THE REASON USED TO REACH NOBODY BY DEFAULT. It was written by whichever caller
 * rendered the response — one line in `index.ts`, beside one `new Response` —
 * so the guarantee was a property of that call site rather than of the decision.
 * A second caller of {@link admit}, or a refusal added to it later, was a silent
 * one, and a silent refusal is the state this bug was filed from: an operator
 * locked out of their own deployment, with nothing in the running system saying
 * why. Deciding and recording are now the same statement, so a reason cannot be
 * computed without being reported.
 *
 * THERE IS NO DISCLOSURE RISK. The whole reason the VISITOR is told one thing
 * ({@link DENIED_MESSAGE}) is that they are unauthenticated and the distinction
 * would be a membership oracle. The operator reading the Worker's invocation log
 * is not the visitor, and the log is ours.
 *
 * STRUCTURED, IN THE SHAPE `router.ts` ALREADY USES —
 * `console.warn(JSON.stringify({ event, … }))` — so a refusal can be queried out
 * of the invocation logs `wrangler.toml` keeps every one of, rather than grepped
 * out of prose.
 *
 * `platformAdminSeed` IS THE FIELD THAT ANSWERS THE DIAGNOSIS THAT COST US ONE.
 * The lockout that produced this bug was a duplicated `PLATFORM_ADMINS` key in
 * `.dev.vars`: the address the operator signed in with was not the address the
 * deployment named, so the break-glass seed never fired and they were refused
 * `no_user`. The reason alone does not separate that from "this person was never
 * invited" — you have to go and read the configuration, which is exactly what the
 * log is meant to replace. This says whether THIS deployment names THIS address,
 * from the Worker's own output. It is a boolean about configuration the operator
 * already holds, not about any person, so it discloses nothing further.
 */
function denyAdmission(
  env: IdentityEnv,
  reason: DenialReason,
  email: string | null,
): Extract<Admission, { ok: false }> {
  console.warn(
    JSON.stringify({
      event: 'admission_denied',
      reason,
      email,
      platformAdminSeed: email !== null && isPlatformAdminSeed(env, email),
    }),
  )
  return { ok: false, reason, email }
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
  if (!email) return denyAdmission(env, 'no_email', null)
  const normalised = normaliseEmail(email)

  // Break glass, and then carry on down the ordinary path. The seed writes rows;
  // it does not produce an admission — so a holder is admitted by the same three
  // reads as everybody else, against rows that are now there. That is what makes
  // this a repair rather than a second authorisation path with its own bugs.
  if (isPlatformAdminSeed(env, normalised)) await ensurePlatformOperator(env, normalised)

  const user = await findUser(env, platformTenant, normalised)
  if (!user) return denyAdmission(env, 'no_user', normalised)

  const stamp = now.toISOString()
  await env.DB.prepare(
    'UPDATE users SET first_seen_at = COALESCE(first_seen_at, ?), last_seen_at = ?, ' +
      'updated_at = ? WHERE id = ?',
  )
    .bind(stamp, stamp, stamp, user.id)
    .run()

  // A suspended person is checked after the stamp and before anything else: it
  // is the one refusal that is about the PERSON rather than about their account.
  if (user.status !== 'active') return denyAdmission(env, 'user_inactive', normalised)

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
  if (businesses.length === 0) return denyAdmission(env, 'no_membership', normalised)

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
export const PLATFORM_BUSINESS_NAME = '1st Contact'

export async function ensurePlatformOperator(env: IdentityEnv, email: string): Promise<void> {
  const platformTenant = requirePlatformTenant(env)
  const normalised = normaliseEmail(email)
  if (normalised === '') throw new Error('A platform operator needs an email address.')
  const now = new Date().toISOString()

  // The business itself, in case this is a database being brought up from empty.
  // `forTenant` refuses an unregistered tenant, so a membership pointing at one
  // would be a row that can never be used — and `businessesFor`'s join drops it,
  // so the operator would be refused `no_membership` with the row sitting there.
  //
  // THE NAME IS NOT THE ID ([[REQ-190]]). It used to be `name: platformTenant`,
  // which was harmless while `TENANT_ID` was the word `1stcontact` and is a
  // business called `biz_51a6…` now that it is a key. The baseline seeds this
  // row with its real name; `INSERT OR IGNORE` leaves that alone, and this
  // constant is only what an empty database would otherwise be left showing.
  await d1r2SiteStore(env).createTenant({ id: platformTenant, name: PLATFORM_BUSINESS_NAME })

  // The person, and their address, which are one fact in two rows ([[REQ-191]]).
  //
  // THE ID IS RESOLVED FIRST AND THEN BOUND, where this used to be an
  // `INSERT ... WHERE NOT EXISTS` over `users.email`. There is no address on
  // `users` to test any more, and the two rows have to agree on a key that is
  // minted in JavaScript — so the existence question is asked once, of the table
  // that now answers it, and both inserts are bound to the same id. They go as a
  // BATCH: a person written without an address is a person nothing can find,
  // which is worse than the write having failed.
  //
  // IT IS STILL IDEMPOTENT, which is the property that matters here — every
  // admission by a holder runs this function, so "cheap when there is nothing to
  // do" is a requirement. A concurrent second run loses to
  // `idx_user_emails_tenant_email` rather than producing a second person, which
  // is the same outcome the old `WHERE NOT EXISTS` had against its index.
  //
  // `pipeline_stage` IS WRITTEN AND NOT LEFT TO THE DEFAULT ([[REQ-188]],
  // [[DOC-44]] §4). This insert stamps `invited_at`, so leaving the stage at
  // `lead` would produce the one row in the table whose stamp and whose stage
  // disagree — and a reader who noticed would be tempted to fix it by deriving
  // the stage from the stamp, which is precisely what the column exists to stop.
  // Nothing here touches `tos_accepted_at`: the seeded operator still has to
  // accept the terms like anybody else, which is the access axis and is theirs.
  //
  // AND THEIR ACCOUNT, WHICH IS THE THIRD ROW ([[REQ-194]]). An operator is a
  // contact like any other and belongs to an account like any other — the break
  // glass path writes exactly what an invite writes, or "break glass" would mean
  // "get a slightly different account". It does NOT make them the owner of the
  // platform business: `tenants.owner_account_id` is left null there, because who
  // owns 1st Contact must not mean who logged in first.
  const existing = await env.DB.prepare(
    `SELECT user_id FROM user_emails WHERE tenant_id = ? AND email = ?`,
  )
    .bind(platformTenant, normalised)
    .first<{ user_id: string }>()
  const userId = existing?.user_id ?? newId('usr')

  //
  // AND THE PROVENANCE EVENT GOES IN THE SAME BATCH ([[REQ-195]]). Every contact
  // this system makes says where it came from, and a seeded operator came from
  // `PLATFORM_ADMINS` — which is a genuinely different origin from an invite and
  // is worth being able to see months later. Inside the `if`, so the repair path
  // that runs on EVERY admission by a holder does not append an identical event
  // per request: this insert happens exactly when the person is created, which
  // is what makes it provenance rather than a heartbeat.
  if (!existing) {
    const accountId = newId('acct')
    await env.DB.batch([
      accountInsert(env, { id: accountId, tenantId: platformTenant, now }),
      env.DB.prepare(
        'INSERT INTO users (id, tenant_id, account_id, status, platform_operator, invited_at, ' +
          'pipeline_stage, created_at, updated_at, fields) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)',
      ).bind(userId, platformTenant, accountId, 'active', now, PIPELINE_INVITED, now, now, '{}'),
      userEmailInsert(env, { userId, tenantId: platformTenant, email: normalised, now }),
      contactEventInsert(env, {
        contactId: userId,
        businessId: platformTenant,
        kind: CONTACT_CREATED,
        detail: { via: 'platform_admins' },
        now,
      }),
    ])
  }

  // The hosting half, for a person who already had a row without it. Separate
  // from the insert above because the row may predate the var — an operator
  // invited as an ordinary customer and later named here must gain the column,
  // and an insert says nothing about a row that exists.
  await env.DB.prepare(
    'UPDATE users SET platform_operator = 1, updated_at = ? WHERE id = ? AND platform_operator = 0',
  )
    .bind(now, userId)
    .run()

  // The ownership half — the row this function exists for. Guarded by
  // `NOT EXISTS` so it agrees with a row an earlier run or an invite already
  // wrote rather than adding a second membership onto the same business.
  await env.DB.prepare(
    'INSERT INTO memberships (id, user_id, business_id, role, status, granted_by, granted_at) ' +
      "SELECT ?, ?, ?, 'owner', 'active', ?, ? WHERE NOT EXISTS (" +
      'SELECT 1 FROM memberships m WHERE m.user_id = ? AND m.business_id = ?)',
  )
    .bind(newId('mem'), userId, platformTenant, 'PLATFORM_ADMINS', now, userId, platformTenant)
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
    'INSERT INTO entitlements (id, business_id, plan, source, status, starts_at, ' +
      "ends_at, granted_by, note, created_at, updated_at) SELECT ?, ?, 'pro', 'admin_grant', " +
      "'active', ?, NULL, ?, ?, ?, ? WHERE NOT EXISTS (" +
      'SELECT 1 FROM entitlements WHERE business_id = ? AND account_id IS NULL ' +
      "AND status = 'active' AND starts_at <= ? AND (ends_at IS NULL OR ends_at > ?))",
  )
    .bind(
      newId('ent'),
      platformTenant,
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
 * The account an operator named, by an address one of its people logs in with
 * ([[REQ-180]], [[REQ-194]]).
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
 *
 * IT RETURNS AN ACCOUNT AND NOT A PERSON ([[REQ-194]]). It used to return a
 * `UserRow`, which is what "in code, an account IS a user" looked like at the one
 * call site that most needed the distinction — `provisionBusiness`, where the
 * value becomes the owner of a business. The address still reaches the person,
 * because an address is how a person is reached; what comes back is the account
 * that person belongs to.
 */
export async function findAccount(env: IdentityEnv, email: string): Promise<AccountRow | null> {
  const platformTenant = requirePlatformTenant(env)
  const normalised = normaliseEmail(email)
  if (normalised === '') return null
  const user = await findUser(env, platformTenant, normalised)
  if (!user) return null
  return accountById(env, user.account_id)
}

/**
 * The person, by the identity `user_emails` decides ([[DOC-40]] §2,
 * [[REQ-191]]).
 *
 * RESOLVED THROUGH THE ADDRESS TABLE, and through ANY address in it. This used
 * to be `WHERE tenant_id = ? AND email = ?` against a column on `users`, which
 * meant one human could be reached at exactly one address and a second one was a
 * second person. Matching any of them is what makes the second address reach the
 * first person — the property {@link USER_ID_BY_EMAIL_SQL} exists for.
 *
 * THE TENANT IS ASKED TWICE, deliberately. The subquery scopes the ADDRESS and
 * the outer clause scopes the PERSON, and an address row whose tenant disagreed
 * with its owner's would otherwise resolve across the barrier — which is the one
 * mistake a carried, denormalised `tenant_id` makes available.
 */
async function findUser(
  env: IdentityEnv,
  tenantId: string,
  email: string,
): Promise<UserRow | null> {
  return env.DB.prepare(
    `SELECT u.*, ${PRIMARY_EMAIL_SQL} AS email FROM users u ` +
      `WHERE u.tenant_id = ? AND u.id = ${USER_ID_BY_EMAIL_SQL}`,
  )
    .bind(tenantId, tenantId, email)
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
    'SELECT id, business_id, account_id, plan, source, status, starts_at, ends_at ' +
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
