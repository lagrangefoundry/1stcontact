---
uid: request-8fc4003a
id: REQ-369
type: request
title: 'Contacts: delegate access to a business'
created_by: EPIC-23
created_at: '2026-10-03T18:32:49.444265+00:00'
updated_at: '2026-10-03T18:32:49.444265+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-ee37a03f
  priority: medium
  auto_merge_back: true
  needs_review: false
---

Child of [[EPIC-23]]. The epic holds the cross-feature context and the decisions log.

# Delegate access (contacts page)

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


## Test plan

UATs `test_UAT_FC_<TICKET-ID>_*`, one per rule above: the happy path, plus each refusal the body names.
