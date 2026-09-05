---
uid: request-95dffc48
id: REQ-184
type: request
title: The entitlement's subject is the account, and the column that says so holds
  a business
created_by: xgd
created_at: '2026-09-04T23:45:54.614655+00:00'
updated_at: '2026-09-05T00:12:49.877287+00:00'
completed_at: null
last_field_updated: story_points
status: free_coding
fields:
  priority: medium
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-134dbb7f
---

# The entitlement's subject is the account, and the column that says so holds a business

## The gap

[[DOC-42]] §6: **an entitlement grants an account access to a thing.** The
subject is the account; the business is the object.

`entitlements.account_id` (`db/migrations/0004_identity.sql:96`) held a **tenant
id**. [[DOC-40]] §5 said so outright — *"`account_id` here is a business"* — and
derived the payer by joining `memberships`. So the column named for the subject
held the object, and the subject had no column at all.

[[DOC-42]] §10.2 recorded this as an amendment owed. [[REQ-167]] wrote the schema
and is `bundled`, so it could not take it; none of the reopened tickets owns the
table. This one does.

## Two halves, and both landed

### The name was a live bug and is fixed

`account_id` tells the next hand to put an account id in it. They will, because
the name says to, and it would **half-work**: the row inserts, the grant attaches
to nothing that exists, and `bestActiveGrant` silently finds no grant for a
business that was supposed to have one. Nothing throws.

Renamed to `business_id`. This is not the migration [[REQ-180]] §3 declines to
buy — that argument is about `tenant_id`, which is correct and merely internal.
This column was *wrong*, and wrong in the direction that produces silent data
errors.

### The subject column landed too, because the migration was being written

The condition this ticket set was "only if the rename migration is being written
anyway and the cost is a line" — and [[DOC-42]] §10.2's own instruction was to
rename *"when the subject column lands, rather than twice."* Both are satisfied,
so both halves are in one migration.

`entitlements` now carries:

| column | holds | today |
| --- | --- | --- |
| `business_id` | the **object** — a tenant id | every grant names one |
| `account_id` | the **subject** — an account | `NULL` on every grant written so far |

The properties [[DOC-42]] §6 fixes, as implemented:

- **Per-business capacity and per-account access are different grants**, not one
  generalised. `account_id IS NULL` is a first-class value meaning *no account
  named*, which is a per-business capacity grant — "Alice's Plumbing holds a pro
  plan". That is what every pre-existing row is and what `provisionInvite` /
  `provisionBusiness` still write; naming a subject there would make a business's
  plan the inviter's personally, invisible to the second member the day one is
  added. The subject is an *addition*, never a replacement.
- **Neither kind satisfies the other's question**, and one column settles both
  directions. `bestActiveGrant` — the check deciding whether a business may be
  entered — reads `business_id = ? AND account_id IS NULL`, so a grant naming
  Bob's account against Alice's Plumbing cannot make Alice's Plumbing selectable
  for everyone holding a membership on it. `lapseFor` keeps the same condition,
  because a business whose only rows name an account has had no capacity grant
  made against it and `never_granted` is the true answer. The converse is free: a
  capacity grant has no subject, so an `account_id = ?` lookup can never match
  one.
- **The subject is the account, not the person.** One user is one account today;
  nothing asserts that the subject id *is* a user id, or multi-user accounts
  become a migration instead of a row.
- **"Account" is relative to the business** ([[DOC-42]] §6). Bob is an account of
  Alice's Plumbing. Nothing here is phrased as "a `users` row in the 1st Contact
  business", which would be platform-only vocabulary and break one level down.
- **No index on the subject yet**, deliberately. Nothing reads it — the case that
  will is one level down and does not exist. An index without a reader is a guess
  at the shape of a query nobody has written.

### `memberships.account_id` is renamed in the same migration

Not in the original scope, and required by it rather than tidying alongside it.
That column has always held a business ([[DOC-40]] §2 — *"only the word
changed"*), and leaving it alone was the right call while `account_id` meant
*business* everywhere. The moment `entitlements.account_id` starts meaning an
actual account, two adjacent tables carry the same column name with **opposite**
meanings — strictly worse than the state this ticket set out to fix, and exactly
the trap that produces a silently-empty query. It is also what the first
acceptance line below asks for literally.

`tenant_id` is untouched, per [[REQ-180]] §3, and so are the `acct_…` id VALUES —
those are opaque, permanent and present in R2 keys, so renaming them buys a data
migration for nothing.

### Two consequences of touching this code

- **[[REQ-180]]'s schema guardrail is narrowed.** It asserted that the string
  `business_id` appeared in no migration at all, as a proxy for "nothing renamed
  `tenant_id`". That proxy stops holding the moment a *different* column earns
  the name, so the claim is now made about `tenant_id` itself — a blanket ban on
  a word cannot tell a rename from a coincidence.
- **Expiry is re-proved.** The date arithmetic lives in the same `WHERE` clause
  the renamed column is in, so a rename that dropped a predicate on the way would
  leave every expired grant covering forever — silently, and only at a wall-clock
  time nobody chose. It is driven from both sides against a date the test sets.

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
- A grant may name an account and a business independently, and an account-subject
  grant does not satisfy a per-business capacity check or vice versa.
- [[DOC-40]] §5 and [[DOC-42]] §10.2 are updated to say which way it went, so the
  next reader does not re-derive it.

## Test plan

`tests/test_UAT_FC_REQ-184_entitlement_subject.workers.test.ts` — seven UATs in
workerd against real D1, with the deployed migration sequence applied in order
(`0004` writes `account_id` holding a business, `0005` seeds the operator's rows
through it, `0006` renames and adds the subject), so the rename is proved against
a database that already held those rows rather than against a schema created at
its destination:

- the columns each table actually has, read from `PRAGMA table_info` rather than
  from the migration text
- `0005`'s seeded membership and grant still readable under the new names, with
  `account_id` NULL
- provisioning writes capacity and names no subject
- three grants against one business — capacity, and two different accounts —
  readable apart
- an account-subject grant does not make a business selectable, and reports
  `never_granted` rather than `expired`
- a capacity grant does not answer an `account_id = ?` lookup, and adding one for
  that account changes nothing about whether the business may be entered
- expiry still expires, from both sides

Regression scope: the whole `workers` project plus the whole `node` project.
`tests/req115-builder-shell.test.ts` is the one that exercises the real
`wrangler d1 migrations apply --local` path end to end. Pre-existing failures in
the knowledge-base suites (`REQ-158/159/160/161/163/123/165`,
`bug32-webui-scope-rebrand`) reproduce identically on `xgd-working` and are
unrelated.
