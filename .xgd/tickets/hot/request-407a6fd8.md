---
uid: request-407a6fd8
id: REQ-178
type: request
title: 'Identity: an account operates several businesses, not one'
created_by: xgd
created_at: '2026-09-02T23:15:32.712582+00:00'
updated_at: '2026-09-02T23:39:13.363213+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-be5ca689
---

# Identity: an account operates several businesses, not one

## The gap

[[DOC-40]] §2 splits two levels that this codebase had as one: an **account** is
the payer, a **business** is the tenant, and one account may own several
businesses. The schema already supports it — `memberships (user_id, account_id)`
is a join, and `account_id` has always held a tenant id — but `identity.ts` does
not.

`accountFor()` returns a single account id and `Admission` carries it singular:

```ts
type Admission =
  | { ok: true; user: UserRow; accountId: string; entitlement: EntitlementRow }
  | { ok: false; reason: DenialReason; email: string | null }
```

That is **the only place** the one-business-per-account assumption is baked into
shipped code. Everything else already has the right shape: `provisionInvite`
writes the builder user into the *platform* tenant and the business as a separate
`tenants` row, which is the recursion [[DOC-40]] §2.1 describes, already built.

## Admission returns the set

`admit()` returns every business the account may operate, each carrying its own
entitlement:

- memberships for the user, excluding rows with `revoked_at` set or `expires_at`
  in the past
- for each, `bestActiveGrant` against that business — §5's grant is per business,
  so plan and access move down from the admission to the business
- the business's `tenants.name`, because the switcher has to label it with
  something and the id is deliberately opaque

`ok` stays a property of the **person**. What varies per business is access.

## Denial becomes per business, and that is the behaviour change

Today a single lapsed entitlement denies the person. With several businesses that
is wrong: an account whose second business has lapsed must still reach the first.

- **No admissible business at all** — refuse as now, with `DENIED_MESSAGE`.
  `no_membership` and `no_entitlement` keep their meanings at the account level:
  they mean *none of them*, not *this one*.
- **Some admissible, some not** — admit, and still return the lapsed ones,
  marked and unselectable. A business that simply vanishes from the switcher is
  indistinguishable from one that was deleted, which is the wrong thing to tell
  someone whose card expired.

The person-level refusals keep their order and their precedence: `no_email`, then
`no_user`, then `user_inactive`, all decided before any business is looked at.

## Provisioning a second business

`provisionInvite` provisions an account **and** its first business ([[DOC-40]]
§4). A second business is the same rows minus the user — a `tenants` row, a
membership, an entitlement, one site — so it wants a sibling taking an existing
account:

```ts
provisionBusiness(env, { accountUserId, name }): Promise<...>
```

`provisionInvite` calls it rather than inlining the same writes, so the two paths
cannot drift into provisioning differently-shaped businesses. Self-serve creation
is later a second entry point onto this function, not new logic — the same
property [[DOC-40]] §4 claims for just-in-time provisioning.

## What this ticket does not own

- **Which business is selected**, and how a returning operator lands where they
  left — [[REQ-168]] owns resolution and reads what this produces.
- **The endpoint that lists them** for the switcher — [[REQ-180]].
- **The selector itself** — [[REQ-179]].

This ticket answers *which businesses may be operated*. Those answer *which one
is being operated now*, *how the browser learns about them*, and *how a person
picks*.

## Acceptance

- A successful `Admission` carries a non-empty list of businesses, each with its
  own entitlement and its `tenants.name`; a UAT covers an account with two.
- An account with one lapsed and one active business is **admitted**, and the
  lapsed business is present in the list and marked unselectable.
- An account with every business lapsed is refused with `no_entitlement`.
- A revoked or expired membership excludes its business from the list.
- `provisionInvite` and `provisionBusiness` produce the same business shape for
  the same inputs, asserted rather than assumed.
- No caller reads a singular `accountId` off `Admission` — the failure mode is
  one call site left behind, serving the first membership found to a person who
  selected the second.