---
uid: request-95dffc48
id: REQ-184
type: request
title: The entitlement's subject is the account, and the column that says so holds
  a business
created_by: xgd
created_at: '2026-09-04T23:45:54.614655+00:00'
updated_at: '2026-09-04T23:58:19.272584+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-134dbb7f
---

# The entitlement's subject is the account, and the column that says so holds a business

## The gap

[[DOC-42]] §6: **an entitlement grants an account access to a thing.** The
subject is the account; the business is the object.

`entitlements.account_id` (`db/migrations/0004_identity.sql:96`) holds a **tenant
id**. [[DOC-40]] §5 says so outright — *"`account_id` here is a business"* — and
derives the payer by joining `memberships`. So the column named for the subject
holds the object, and the subject has no column at all.

[[DOC-42]] §10.2 records this as an amendment owed. [[REQ-167]] wrote the schema
and is `bundled`, so it cannot take it; none of the reopened tickets owns the
table. This one does.

## Two halves, and only one of them is urgent

### The name is a live bug and should be fixed now

`account_id` tells the next hand to put an account id in it. They will, because
the name says to, and it will **half-work**: the row inserts, the grant attaches
to nothing that exists, and `bestActiveGrant` silently finds no grant for a
business that was supposed to have one. Nothing throws.

Rename to `business_id`. This is not the migration [[REQ-180]] §3 declines to
buy — that argument is about `tenant_id`, which is correct and merely internal.
This column is *wrong*, and it is wrong in the direction that produces silent
data errors.

The blast radius is small and known: `EntitlementRow`, `bestActiveGrant`,
`businessesFor`, `admissibleBusiness`, `provisionBusiness`, the two indexes at
`0004:117-118`, and `0005_operator_membership.sql:85`'s seed insert.

### `memberships.account_id` has the same bug and is fixed in the same migration

`memberships (user_id, account_id)` also holds a **tenant id** under an account
name (`0004:68`), with two indexes on it (`0004:76-77`). It is the same error for
the same reason: a membership joins a **person** to a **business**, so the subject
is `user_id` and the object is the business.

Splitting the two renames across two migrations would leave the codebase saying
`account_id` in one table and `business_id` in the other for however long
separates them, which is worse than either name used consistently. Both tables,
one migration.

This also settles an ordering question: [[REQ-185]] writes a new `memberships`
row, so it must run **after** this rename rather than beside it.

### The subject column can wait for a consumer, and should say so

Adding an account subject with nothing reading it is speculative work. The case
that needs it is one level down and does not exist yet: **two members of one
business, one paying for gated content and one not** — unrepresentable while the
grant *is* the business.

So this ticket adds the column only if the rename migration is being written
anyway and the cost is a line, and otherwise records the shape and defers.
Either way the properties [[DOC-42]] §6 fixes must be written down before someone
generalises in the wrong direction:

- **Per-business capacity and per-account access are different grants**, not one
  generalised. "This business holds a pro plan" must not require re-granting
  every member as they join, so the subject is an *addition*, never a
  replacement.
- **The subject is the account, not the person.** One user is one account today;
  nothing may assert that the subject id *is* a user id, or multi-user accounts
  become a migration instead of a row.
- **"Account" is relative to the business** ([[DOC-42]] §6). Bob is an account of
  Alice's Plumbing. A definition phrased as "a `users` row in the 1st Contact
  business" is platform-only vocabulary and breaks one level down.

## Ordering

**Not blocked — ordered.** Work lands on `working`, where [[REQ-178]]'s and
[[REQ-179]]'s free-coded commits already sit, so there is no branch to wait for.
What matters is only that this precedes anything that writes new readers of the
column.

**It should come before [[REQ-170]]'s entitlement editor.** That editor adds
readers; renaming afterwards means writing them twice. The rename is small and
mechanical, so paying it first is cheap.

## Not in scope

- **The paywall itself.** This is the record that makes it representable, not the
  feature.
- **`subscriptions`, billing, and anything that writes grants automatically** —
  [[DOC-40]] §5 defers payment and this changes none of it.
- **`tenant_id` anywhere.** Untouched, per [[REQ-180]] §3.

## Acceptance

- No column named for an account holds a business id.
- Every reader of the renamed column is updated, and the migration is applied to
  a database holding [[REQ-167]]'s and `0005`'s existing rows without losing a
  grant — asserted against real D1, not assumed.
- If the subject column lands, a grant may name an account and a business
  independently, and an account-subject grant does not satisfy a per-business
  capacity check or vice versa.
- Whatever is decided about the subject column, [[DOC-40]] §5 and [[DOC-42]] §10.2
  are updated to say which way it went, so the next reader does not re-derive it.