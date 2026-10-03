---
uid: request-9533ae5a
id: REQ-368
type: request
title: 'Profile portal: multiple login emails, validation, and primary'
created_by: EPIC-23
created_at: '2026-10-03T18:32:40.956444+00:00'
updated_at: '2026-10-03T18:32:40.956444+00:00'
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

# Multiple login emails (profile portal)

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


## Test plan

UATs `test_UAT_FC_<TICKET-ID>_*`, one per rule above: the happy path, plus each refusal the body names.
