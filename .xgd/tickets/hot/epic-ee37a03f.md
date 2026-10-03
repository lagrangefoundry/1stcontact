---
uid: epic-ee37a03f
id: EPIC-23
type: epic
title: 'Identity: impersonation, multiple login emails, and delegate access'
created_by: martin-github@westhead.me
created_at: '2026-10-03T17:23:39.835613+00:00'
updated_at: '2026-10-03T19:06:58.613192+00:00'
completed_at: null
last_field_updated: status
status: underway
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

## 1. Impersonation → "open any business" from the console (platform operator only)

### Decision (2026-10-03): v1 is a console Open control, not full impersonation

The operator can already **enter** any business. `scope.ts:415` lets a
`platform_operator` resolve a scope for any business that has a grant and is
active, with no membership. What is missing is **navigation**:

- The business selector lists only `admission.businesses`, which comes from
  membership rows.
- The console lists every site and its business, but has no way to open the
  app in one.
- So there is no route by which the operator actually reaches someone else's
  business.

**What the operator gets:**

- **An Open control on every business in the platform console.** It is a link
  or button on each row of the console list (`builder/platform-sites.js`).
- Pressing it opens the builder app scoped to that business (`/b/<id>`). This
  is the same view the selector gives for an owned business.
- **Getting back is the existing selector.** It still lists the operator's own
  businesses, so switching back is one choice. The console stays reachable
  throughout, because the console gate reads the operator's own admission and
  that admission has not changed.
- **A visible reminder.** While the open business is one the operator holds no
  membership on, every page shows a banner: "You are in <business> as platform
  operator". It also offers a way back to their own business.
- **The selector shows the entered business.** That business is not in the
  operator's membership list. The selector shows it as the current entry,
  marked as entered rather than owned, until the operator switches away.

**What this deliberately is not:**

- It does not act as a **user**. The operator sees the **business** as it is,
  not a particular person's selector, profile portal or account pages.
- Entering through the bypass returns `role: null` (`scope.ts:412`). So
  **owner-gated controls stay closed in v1** while the operator is inside, for
  example adding or inviting contacts. These are the `ownsBusiness` checks at
  `router.ts:4015-4764`.
- **Target, after v1 (decided 2026-10-03): the platform operator can do
  everything in any business.** That includes every owner-gated control. v1
  ships navigation only. Opening the owner gates to the operator is a
  follow-up, and it must go through the hosting capability
  (`platform_operator`), not through a fake `owner` membership.
- **Audit.** Each entry to a business without a membership leaves an audit
  event: who entered it and when.

### Deferred: full user impersonation

Acting as a specific **user** is parked until the console Open control proves
insufficient. That means seeing their selector, their profile portal and their
account pages. If it comes back, these are the findings for it:

- Identity resolves cookie → session subject → primary email → `admit()`
  (`index.ts:463-518`). That chain is the seam where a subject would be
  substituted.
- `sessions` is a pinned copy of the `auth-passwordless` schema
  (`test_UAT_FC_REQ-202_passwordless_schema`). Impersonation state would need
  its own table, keyed by `origin_id`.
- The console gate and the impersonation controls must read the **actor**, not
  the subject. Otherwise impersonating locks the operator out of the console.

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
- **Primary (decided 2026-10-03):** exactly one address is primary
  (`idx_user_emails_one_primary`). The platform sends its mail there, and it is
  the address you are shown as. **It defaults to the first address you
  entered.** On the profile portal, a **Make primary** control next to each
  **validated** address lets you choose a different one. An unvalidated
  address cannot be made primary. You cannot remove the primary address until
  you have made another address primary.

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
  addresses, Make primary, and the last-validated rule, all enforced by the
  server.

## 3. Delegate access (contacts page)

### What the business owner gets

- **The flow:** the owner adds the person to their contacts, then invites them
  as a delegate.
  - Adding already exists. It is the **+** ("Add a contact") on the Contacts
    list (`builder/people.js:1082`, `/api/people/add`, `addContact`). It shows
    only to an owner of the business (`canInvite`).
  - **Open question:** the operator reported this as missing. Is the **+**
    not visible, not discoverable, or missing something it needs?
- On the **Contacts** tab, a **Make delegate** invite on a selected contact. It is a separate act
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
    their own**. A delegate acceptance writes the delegate membership **as
    well as** that. See "Everyone gets a starter business" below.
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
- **Delegation is to a business, not to an account.** A delegate holds a
  membership on one business. They gain nothing on the owner's **account**:
  not its billing, not the owner's profile, not the owner's other businesses.
  Within the delegated business they hold everything an owner holds, except
  delegation management.
- **Entitlement is the business's, not the person's.** A delegate enters a
  business under that business's grant ([[DOC-40]] §5 / REQ-184), never under
  their own.
- **Everyone gets a starter business, delegates included** (decided
  2026-10-03). Accepting a delegate invite runs the ordinary onboarding:
  `ensureOwnBusiness` creates the delegate's own account and starter business,
  **and** writes the delegate membership. The delegate's own business may never
  be paid for, and that is fine.
- **The selector says owned or delegated.** Every business in the switcher
  (`builder/business.js`) is visibly marked as **owned** or **delegated**. The
  data already arrives through `admission.businesses` → `businessesPayload`
  (`router.ts:2285`), which includes memberships of any role. The payload needs
  `role` added so the switcher can tell them apart.
- **Default business prefers a live delegated business.** When the app opens
  with no remembered business, it picks a delegated business over the
  delegate's own **if their own business is not published**. That way a
  delegate whose own starter business is untouched and unpaid lands in the
  business they came to run. A remembered selection still wins: the default
  only applies when nothing is remembered. "Published" means the business has
  at least one site that is live. The child ticket confirms the exact
  predicate against the publish model.
- **Future, not v1:** access per tab. Store the role so that per-tab grants can
  be added later without a migration of existing rows. Do not build per-tab
  access now.

### Open questions

- Business-scoped plan and payment controls: the business's plan, its
  payment method, and deleting the business. "Full access except delegation"
  would open them to delegates. None of them exists as a business-scoped
  control yet, so nothing in v1 has to decide. Revisit when billing lands.

## Interactions between the three

- An operator who uses the console's Open on a business sees that business,
  not anyone's delegate list. A delegate's selector is only visible as that
  delegate, which is the deferred full impersonation.
- Delegate invites go to an address. If that address is already a login email
  on an existing account (item 2), the membership attaches to that account
  rather than creating a new one.

## Children

- [[REQ-367]] — Platform console: open any business, with an operator banner
- [[REQ-368]] — Profile portal: multiple login emails, validation, and primary
- [[REQ-369]] — Contacts: delegate access to a business

The three can land independently. None blocks another.