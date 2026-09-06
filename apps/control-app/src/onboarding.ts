import {
  accountOwnsBusiness,
  provisionBusiness,
  type BusinessResult,
  type IdentityEnv,
  type UserRow,
} from './identity'
import { currentNameOf } from './names'

/**
 * What signing up gets you (REQ-203) — [[DOC-42]] §10.1, [[CHAT-39]].
 *
 * THE HOOK, AND IT IS EXPLICITLY A PLACEHOLDER. 1st Contact is a site builder,
 * so an invitee who signs in and owns no business has nothing to be signed in
 * *to* — no site, no builder, no reason to have come. Signing up therefore
 * provisions one. A real onboarding flow asks what the business is called and
 * what it is for, and probably picks a starting point from the answers; none of
 * that exists, so until it does the invitee is dropped straight into the
 * builder. When that flow lands it takes this module's place AT THIS HOOK,
 * which is why the hook is a module of its own rather than four lines inside
 * `terms.ts`.
 *
 * IT CREATES NOTHING A PERSON IS. The account already exists — `addContact`
 * mints one alongside every contact, including a Lead nobody will ever bill,
 * precisely so there is no `users` row that names none — so this passes
 * `users.account_id` through and writes no `accounts` row. Minting a second
 * account here would give one person two and put the payer somewhere no reader
 * expects. That is this ticket's falsifier: an `INSERT INTO accounts` on this
 * path.
 *
 * AND IT COMPOSES RATHER THAN REIMPLEMENTS. {@link provisionBusiness} is the
 * whole of what a business is — the `tenants` row, an `owner` membership for
 * every person on the owning account, an entitlement, and a starter site — and
 * every entry point that makes one comes through it. This adds the two facts
 * that are specific to signing up: which account owns it, and what to call it
 * before anybody has been asked.
 */

/**
 * What a business is called before its owner has been asked.
 *
 * VISIBLY PROVISIONAL, on `STARTER_SLUG`'s argument. The operator sees this in
 * the Contacts tab before the invitee ever renames it, so a name that reads as a
 * decision somebody made — "My business", "New site" — gives nobody a reason to
 * change it. `tenants.name` is an attribute and may change ([[REQ-190]]), which
 * is what makes getting it approximately right cost nothing and leaving it blank
 * cost something.
 */
export const UNNAMED_BUSINESS_NAME = 'Unnamed business'

/**
 * The name to give the business a contact is signing up into.
 *
 * THEIR OWN DISPLAY NAME, WHERE THEY HAVE ONE. It is the only thing we know
 * about them at this point, and a business called "Sarah Jones" is a truer
 * placeholder than a generic one — it is at least about her. A contact with no
 * name, or whose name has been redacted to empty ([[DOC-37]]), gets
 * {@link UNNAMED_BUSINESS_NAME}.
 */
async function signupBusinessName(env: IdentityEnv, userId: string): Promise<string> {
  const name = await currentNameOf(env, userId)
  return (name?.displayName ?? '').trim() || UNNAMED_BUSINESS_NAME
}

/**
 * Give this contact's account a business, unless it already has one.
 *
 * IDEMPOTENT, AND THE REASON IS NOT HYPOTHETICAL. `needsAcceptance` compares
 * against `TERMS_VERSION`, so THE DAY THE TERMS CHANGE EVERY EXISTING MEMBER
 * RE-ACCEPTS — and a version of this that only ran on the accept route with no
 * condition would provision each of them a second business, with a second
 * starter site, on a document revision. So the guard is a condition and not a
 * comment, and its falsifier is a second acceptance producing a second business.
 *
 * THE COLUMN THAT ANSWERS IT IS `tenants.owner_account_id` ([[REQ-194]]), not a
 * membership. Membership says who may OPERATE a business and an account may put
 * several people on one; ownership is the column the business carries, and
 * "does this account own a business" is exactly the question being asked.
 *
 * NULL `owner_account_id` IS THE PLATFORM BUSINESS AND MATCHES NOBODY, which is
 * the schema's own rule and is what keeps this from mistaking the 1st Contact
 * business for somebody's product.
 *
 * THE GRANT IS OPEN-ENDED, AND `endsAt` IS PASSED RATHER THAN DEFAULTED. A dated
 * grant would expire somebody out of their own business at a wall-clock time
 * nobody chose, in the middle of the trial they were invited to — the same
 * reasoning the operator's own grant is written under. It is stated here rather
 * than left to {@link provisionBusiness}'s default so that changing that default
 * cannot silently date this one.
 *
 * IT RETURNS NULL WHEN IT DID NOTHING, rather than the business that was already
 * there. The caller's question is "did signing up have to provision", and
 * answering it with a business would make the no-op indistinguishable from the
 * act at every call site that logs or reports.
 */
export async function ensureOwnBusiness(
  env: IdentityEnv,
  user: Pick<UserRow, 'id' | 'account_id'>,
): Promise<BusinessResult | null> {
  const accountId = (user.account_id ?? '').trim()
  if (accountId === '') {
    throw new Error('A contact signing up must already belong to an account.')
  }

  // THE SAME QUESTION `admit` ASKS, through the same function ([[REQ-203]]).
  // Admission opens the terms gate for somebody exactly when signing up would
  // still give them a business, so if these two ever disagreed the door would
  // open onto a hook that does nothing.
  if (await accountOwnsBusiness(env, accountId)) return null

  return provisionBusiness(env, {
    accountId,
    name: await signupBusinessName(env, user.id),
    // Open-ended — see above.
    endsAt: null,
    note: 'Provisioned on sign-up.',
  })
}
