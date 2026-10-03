---
uid: epic-ee37a03f
id: EPIC-23
type: epic
title: 'Identity: impersonation, multiple login emails, and delegate access'
created_by: martin-github@westhead.me
created_at: '2026-10-03T17:23:39.835613+00:00'
updated_at: '2026-10-03T18:09:59.832229+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  priority: medium
  chat_comment: comment-7b97c125
---

# Who you are when you sign in: impersonation, extra login emails, delegates

Three related changes to the identity model. Each one separates **the person
signed in** from **what they may act on**. Today those are one fact.

1. **Impersonation.** The platform operator sees the platform exactly as a
   chosen user does.
2. **Multiple login emails.** An account owner adds and removes the addresses
   they can sign in with.
3. **Delegates.** A business owner invites someone else to run their business.

## 1. Impersonation (platform operator only)

### What the operator gets

- **Entry point: the platform console.** Today the console lists **sites**
  (`builder/platform-sites.js`, `GET /api/admin/sites`) and **no users**. This
  item adds a way to find a user: by email, or from a site's owning account. It
  also adds an **Impersonate** action on that user, which starts acting as them.
- **"As them" means everything resolves as that user.** That covers their
  business selector, their default business, their profile portal and every
  tab. It is more than entering one of their businesses. The `scope.ts`
  `platform_operator` bypass already lets the operator into any business, but
  as themselves with `role: null`. That is the gap this closes.
- **The operator keeps their own powers.** They keep the platform console and
  their `platform_operator` capability throughout. From inside an
  impersonation they can switch straight to another user or back to
  themselves, without signing out or sending a new magic link.
- **A banner on every page** while impersonating. It names the impersonated
  user and has a one-click **Stop impersonating** control. It appears on every
  control-app page, including the builder, the portal and the console. It
  cannot be dismissed.

### The model this implies

**Where it attaches.** Each request resolves identity as cookie → session
subject → primary email → `admit(env, email)` → `Admission` → `resolveScope`
(`index.ts:463-518`). Impersonation substitutes the subject between
`sessionIdentity` and `admit`. **It does not add a column to `sessions`.** That
table is a verbatim copy of the `auth-passwordless` component's schema, and
`test_UAT_FC_REQ-202_passwordless_schema` pins the copy. Impersonation state
lives in its own table instead, keyed by the session's `origin_id` so it
survives the 24-hour rotation:
`(origin_id, actor_id, subject_id, started_at, ended_at)`.

The session then carries two identities:

- the **actor**: the real signed-in person, always the operator here
- the **subject**: whom the request resolves as

Ordinary scope and business resolution read the subject. Two decisions read
the actor:

- the platform-console gate
- the right to start, switch or stop an impersonation

Today the console gate is `ownsPlatformBusiness(admission)`. Run against the
subject's admission, it would lock the operator out of the console the moment
they impersonate. Keeping the console means that gate evaluates the actor.

### Constraints

- **Who may impersonate:** holders of the hosting capability,
  `users.platform_operator` or `PLATFORM_ADMINS`. This is the one cross-account
  power the codebase already admits ([[DOC-42]] §8, [[REQ-185]]). It is not
  `memberships.role = owner` of the 1st Contact business. Owning a business does
  not confer reach into other people's accounts.
- **Audited.** Starting, switching and stopping each leave an audit event
  recording the actor and the subject. Writes made while impersonating are
  attributed to the actor acting as the subject, never to the subject alone. A
  customer-visible change must not read as though the customer made it.
- **No escalation through the subject.** An operator cannot impersonate a
  user and then use that user's session to impersonate a third person. Every
  impersonation decision reads the actor.
- **Ending an impersonation does not end the operator's sign-in.**
- **Out of scope: the public site.** `apps/public-site` reads the same cookie
  to check membership (`public-site/src/session.ts`). Impersonating there is
  not part of v1. It keeps resolving the actor.

### Open questions

- Should impersonation be **time-boxed** (auto-expiring after N hours)?
  [[DOC-40]] §6 and CHAT-23 prefer time-boxed, audited access. Proposal:
  impersonation lasts no longer than the operator's own session, with no
  separate timer in v1.
- Are any actions **refused while impersonating**? Candidates:
  - sending outbound mail as the customer
  - Stripe payment actions
  - deleting the account
  - adding or removing the customer's login emails

  Proposal: v1 refuses removing a login email and deleting the account. It
  allows everything else, and the audit trail covers it.

## 2. Multiple login emails (profile portal)

### What the account owner gets

- On the **profile portal**, a list of the addresses they can sign in with,
  with **Add** and **Remove**.
- A magic link sent to **any** address on the list signs into the same
  account.
- Each address shows whether it is **validated**. Validated means at least
  one sign-in has completed from that address.

### Rules

- **At least one validated address is always retained.** The remove control
  refuses to remove the last validated address, and so does the server.
- **An address belongs to one account only.** Adding an address that already
  signs into another account is refused. The wording must not confirm that the
  other account exists (existence oracle, see the `user_emails` comments).
- **Adding an address does not validate it.** An unvalidated address can
  receive a magic link. Signing in through that link is what validates it.
- **Primary:** one address stays primary (`idx_user_emails_one_primary`). It is
  where platform mail is sent. Open question: does the owner choose the
  primary, or is it always the first validated address?

### What already exists

- **Storage:** `user_emails` already holds many addresses per person, with one
  primary.
- **Sign-in:** `subjectFor` (`sessions.ts:348`) already signs in by **any**
  address in the platform tenant. So "a link to any listed address signs in"
  is already true for the server.

### What is missing

- **Validation tracking.** Nothing records verification per address.
  `login_tokens` does not store the address the link was sent to, so redeeming
  a link cannot tell which address was proved. This item needs:
  - the address recorded where the link is issued
  - a `user_emails.verified_at` column, stamped when that link is redeemed
- **The first self-edit surface on `/account`.** The profile portal
  (`portal.ts`, `packages/framework/src/modules/account-portal`) is read-only
  by design. Nobody can edit their own profile today. The only address-editing
  path is `setPersonRecord` (`people.ts:975`), which lets an owner rewrite a
  contact's **primary** address. This item adds add and remove for your own
  addresses, and the last-validated rule enforced by the server.

## 3. Delegate access (contacts page)

### What the business owner gets

- On the **Contacts** tab, a **Make delegate** invite. It is a separate act
  from the existing portal **Invite** ([[REQ-199]]). `invites.ts` is built on
  "two acts, two functions, no flag", and the delegate invite follows that.
- The invitee gets an email. They follow it and **sign in to the platform**,
  which creates their account if they have none. They then hold a
  **`delegate` membership** on the business.
- **Why this is not just the existing Invite with a role.** Three reasons:
  - A contact is a `users` row **in the inviting business's tenant**. Sign-in
    only resolves in the **platform** tenant (`signInTenant`). The delegate
    invite therefore resolves the contact's address to a **platform** user,
    creating one if needed, and the membership hangs off that user, not the
    contact row.
  - Today's invite writes **no membership**.
  - On acceptance, today's flow calls `ensureOwnBusiness`
    (`onboarding.ts:118`), which provisions the invitee a **new business of
    their own**. A delegate acceptance must write the delegate membership
    instead, and it must not provision a starter business.
- **V1 access is everything an owner has**, except managing delegates. A
  delegate cannot invite, list-manage or revoke delegates.
- The owner can **revoke** a delegate. Revoking sets `memberships.revoked_at`
  and does not delete the row ([[REQ-170]]'s keep-the-history rule).

### What the delegate gets

- In the **business selector**, the businesses they are a delegate of, beside
  any they own, marked as delegated. Switching works the same as for an owned
  business.

### Model notes

- `memberships.role` only ever holds `'owner'` today. Delegates are a new
  role value, `'delegate'`, not a new table. [[DOC-40]] §2 anticipates this:
  "several memberships against one business".
- **Owner-only gates.** Some routes are gated on `ownsBusiness(admission,
  business)` (`identity.ts:1493`, nine call sites in `router.ts`). Each one has
  to be classified: open to delegates, or delegation management that stays
  owner-only. **The 1st Contact business's fulfilment actions** (the console,
  `provisionBusiness`) stay owner-only. A delegate of 1st Contact does not get
  the console.
- **Entitlement is the business's, not the person's.** A delegate enters a
  business under that business's grant ([[DOC-40]] §5 / REQ-184). A delegate
  with no business of their own still needs an account, but no starter business.
  Open question: confirm that.
- **The selector** reads `admission.businesses` through `businessesPayload`
  (`router.ts:2285`). That data already includes memberships of any role. The
  payload needs `role` added so the switcher (`builder/business.js`) can mark
  delegated businesses.
- **Future, not v1:** access per tab. Store the role so that per-tab grants can
  be added later without a migration of existing rows. Do not build per-tab
  access now.

### Open questions

- Can a delegate see the **owner's account-level pages** (billing, the owner's
  profile)? Proposal: no. Delegation covers the business, not the owner's
  account.
- Can a delegate **delete the business**, or change its plan and payment?
  Proposal: v1 treats those as owner-only, alongside delegation management.

## Interactions between the three

- Impersonating a delegate shows the delegate's selector, with the delegated
  businesses in it.
- Delegate invites go to an address. If that address is already a login email
  on an existing account (item 2), the membership attaches to that account
  rather than creating a new one.

## Proposed children

Keep the ticket count small ([[REQ-170]]-style single tickets per feature):

- **REQ — Impersonation:** the actor/subject session, the console action, the
  banner, the audit trail
- **REQ — Login emails on the profile portal:** `verified_at`, add/remove, the
  last-validated rule
- **REQ — Delegates:** the `delegate` role, the contacts-tab invite and accept,
  the owner-gate audit, the selector

The three can land independently. None blocks another.
