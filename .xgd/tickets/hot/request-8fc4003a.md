---
uid: request-8fc4003a
id: REQ-369
type: request
title: 'Contacts: delegate access to a business'
created_by: EPIC-23
created_at: '2026-10-03T18:32:49.444265+00:00'
updated_at: '2026-10-03T19:35:45.081360+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  epic_parent: epic-ee37a03f
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-738f3501
  commits:
  - working_sha: 2ab460e12d80925e4e52371d46b73c9a03d6f7cb
    reconcile_sha: null
    main_sha: null
  - working_sha: ac69e3071a4406ff626b3d50f3cdb4278dbe346d
    reconcile_sha: null
    main_sha: null
  version: 0.2.449
  story_points: 8
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

## Answer to the open question: the **+**

The **+** exists and works. It is drawn only when `canInvite` is true, and
`canInvite` was `ownsBusiness`, which is false for anyone holding no `owner`
membership on the open business. That includes the platform operator inside a
customer's business through the hosting bypass (`role: null`). Owners do see
it, but as a bare `+` glyph in the filter row, which is easy to miss.
Resolution:
- The **+** now reads **+ Add** (still titled "Add a contact"), so it can be
  found.
- It shows for owners **and delegates**, because adding contacts is not
  delegation management.
- Opening owner gates to the operator stays out of scope (REQ-367 / EPIC-23
  §1 follow-up).

## Design (implemented in this ticket)

**Role model.** `memberships.role = 'delegate'`. No migration: the column has
no CHECK constraint. `(user_id, business_id)` is unique, so re-inviting a
revoked delegate reinstates the same row: `revoked_at` cleared, `granted_at`
and `granted_by` restamped.

**Two predicates.**
- `ownsBusiness` (owner only) is unchanged. It is the gate for delegation
  management and for `ownsPlatformBusiness` (the console and fulfilment).
- New `operatesBusiness` (owner **or** delegate) is the gate for everything
  else that used to be owner-only. Reclassified: `/api/people/add`,
  `/api/people/invite` (GET and POST), `/api/people/record`,
  `/api/people/inbound/promote`, `/api/people/inbound/discard|restore`,
  `/api/business/name` and `/api/hostname/claim`.
- `canInvite` now answers `operatesBusiness`. A new `canDelegate` answers
  `ownsBusiness`.

**Make delegate** (`delegates.ts`, `POST /api/people/delegate {id}`, owner
only, 403 otherwise):
1. Read the contact in this business (scoped by tenant). Refuse if they have
   no primary address.
2. Resolve that address to a **platform-tenant** user. If there is none,
   create one with `addContact` in the platform tenant. That reuses the same
   account-minting path as every 1st Contact customer.
   - If the address already signs into an existing account, the membership
     attaches to that account.
   - Refuse if the platform user is withdrawn (`status != active`).
   - Refuse if they already own this business.
3. Write or reinstate the `delegate` membership on this business **at invite
   time**. Their access is the owner's act, and signing in through the link
   is how they reach it.
4. Mint an invite link in the **platform** tenant (`inviteUrlFor`).
5. Send the new `delegate` template. It is a fourth `TEMPLATE_KEYS` entry,
   business-neutral, and declares `cta_url` and `business`.
6. Record the message against the contact through `sendRecordedEmail`.

It does **not** move the contact's pipeline stage, because it is a different
act from the portal Invite.

**Revoke** (`POST /api/people/delegate/revoke {id}`, owner only): stamps
`memberships.revoked_at`. The row is kept. The business leaves the
delegate's selector on the next request, and a named request for it is
refused `not_a_member`.

**Status on the tab.**
- `/api/people` carries `canDelegate` and `delegates` (contact ids whose
  primary address is held by a live delegate).
- `/api/people/detail` carries `delegate: {status: 'active'|'revoked',
  grantedAt, revokedAt} | null`.
- A row is badged **delegate**. The detail pane has a **Delegate** section
  for owners, with **Make delegate** (confirm dialog) or **Revoke delegate**.

**Starter business for delegates.** Terms acceptance provisions through
`ensureOwnBusiness` when the person holds **no `owner` membership**. That
replaces "holds no membership at all", so a delegate who signs up still gets
their own account and starter business. `ensureOwnBusiness` stays idempotent
on `accountOwnsBusiness`.

**Selector.**
- `/api/businesses` entries carry `role` and `live`. `live` means the
  business has at least one site with a published revision (`site_revisions`
  row): the "published" predicate, confirmed against the publish model, where
  live is `MAX(site_revisions.id)`.
- The switcher labels each entry **owned** or **delegated**. An entry entered
  through the hosting bypass has `role: null` and is unmarked.

**Default business** (`resolveBusiness`):
1. A remembered selection still wins.
2. Otherwise, if the person holds any selectable delegated business:
   - if one of their **owned** businesses is live, open that owned business.
     This rule is stated explicitly rather than left to membership order,
     because a delegate membership granted before their own business existed
     sorts first.
   - else open a delegated business, preferring a live one.
3. Otherwise open the first selectable business, as before. Somebody who
   delegates nothing sees no change.

**Not changed.**
- Entitlement is still the business's own capacity grant (`admittedBusiness`),
  so a delegate enters under the business's grant.
- Account and portal surfaces read the person's own `account_id`, never
  memberships, so a delegate gains nothing on the owner's account.

## Test plan

New UATs `tests/test_UAT_FC_REQ-369_*`:

- **Workers suite** (real D1 and the deployed `worker.fetch`, with Access
  JWTs):
  - make delegate creates a platform user and a delegate membership, and
    mails one message from the `delegate` template
  - an address that already signs in attaches to the existing account
  - refusals: not an owner (a delegate cannot delegate), no primary address,
    already an owner
  - the delegate's admission lists the business with `role: delegate`
  - a delegate passes the reclassified gates (add contact) but not the
    delegate routes
  - accepting terms as a delegate provisions their own starter business and
    keeps the delegate membership
  - revoke stamps `revoked_at`, keeps the row and removes the business from
    the selector; re-inviting reinstates the row
  - `/api/businesses` carries `role` and `live`
- **jsdom suite**:
  - `resolveBusiness` default rule: remembered wins, delegated over an
    unpublished own business, own when published
  - the switcher marks entries owned or delegated
  - the Contacts tab shows the delegate badge and the Delegate section only
    when `canDelegate` is true

Existing assertions updated. Both are intended consequences of this ticket:
- `test_UAT_FC_REQ-197_render`: the closed template-key list gains
  `delegate`.
- `test_UAT_FC_REQ-194_no_permission_check_reads_role`: the role vocabulary is
  still declared only in `identity.ts`, but it now has a second value
  (`'delegate'`, declared once) and exactly two readers, `ownsBusiness` and
  `operatesBusiness`, both through `OWNER_ROLE`. A third reader still fails.

Already failing, and not caused by this ticket:
`test_UAT_FC_REQ-180_no_plan_or_billing_or_invoice_route_exists_in_the_builder`
fails on `xgd-working` because of an existing `/api/plan` route.

## Interaction with REQ-367 (merged alongside)

REQ-367 landed the operator's "entered" switcher entry while this ticket was
in flight. The two marks are combined in one `businessLabel`:
- An **entered** business shows only the entered suffix. The operator holds
  no role in it.
- Every membership entry shows **owned** or **delegated**, plus "access
  ended" when lapsed.

`businessesPayload` takes both `entered` (REQ-367) and `live` (this ticket).
