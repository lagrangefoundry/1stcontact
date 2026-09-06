---
uid: request-4a4ca4a1
id: REQ-194
type: request
title: The Account is a table, and a business is owned by one
created_by: xgd
created_at: '2026-09-05T22:45:59.255932+00:00'
updated_at: '2026-09-06T19:26:47.763992+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d079cf1f
---

# The Account is a table, and a business is owned by one

Part of the rebaseline. [[REQ-190]] owns the keys and the single baseline
migration; [[REQ-191]] owns addresses; this owns the noun that is missing
entirely.

## The gap

[[DOC-40]] §2 lists four nouns — Business, **Account**, User, Membership — and
[[DOC-42]] §6 says *"the subject is the account, not the person and not the
business. Today one user is one account; the model must not foreclose an account
with several users."*

There is no `accounts` table. The live schema is `tenants`, `sites`, `site_*`,
`published_sites`, `tickets`, `counters`, `users`, `memberships`, `entitlements`
— and the ownership relation is:

```
business  ←── memberships(user_id, business_id, role) ──  user
```

A business is owned by a **person**. The account is not modelled anywhere:

- `findAccount(env, email)` returns a `UserRow`; in code, an account *is* a user.
- `/api/businesses` returns `account: { name, email }`, which is that user's
  `display_name` and `email` — a person presented under the other noun's label.
- `entitlements.account_id` exists ([[REQ-184]], `0006`) and is **`NULL` on every
  row**, held open as the future subject with `NULL` meaning *a per-business
  capacity grant with no subject*. An empty chair, correctly labelled.

So the simplification is recorded rather than accidental. What is missing is
anywhere to put the noun when it stops being one person.

## The change

- **`accounts`** — a table. The payer, and the owner of businesses.
- **a contact belongs to an account** — the `account_id` column on the person.
- **a business is owned by an account**, not by whoever happens to hold the first
  membership row.
- **`entitlements.account_id` names a real account** — the subject is the
  account, which is what [[REQ-184]] reserved it for and what [[DOC-42]] §6
  requires. The lookup that reads it moves from the person id to the account key,
  and the column gains the index [[REQ-184]] deliberately declined while nothing
  read it. The per-business capacity grant provisioning writes keeps its `NULL`
  subject: a business's plan is the business's, not its inviter's personally.
- **`findAccount` answers with an account**, not with the `UserRow` that stood in
  for one — the value goes on to become a business's owner, which is where the
  simplification actually cost something.
- **`/api/businesses` says `person`** where it said `account`. The surface is
  still the account switcher, because that is the noun somebody looks for; what
  it names is the human who is signed in, and the payload stops calling them an
  account now that an account is a row.
- **the development fixture (`db/dev-seed.sql`) grows the accounts it needs** —
  four payers, one per seeded contact, and three businesses that all name Alice's
  account as their owner. That last part is the shape `owner_account_id` exists
  for and nothing reachable by clicking produces it.

`memberships (person, business, role)` **stays as it is**. It is not ownership
once the account owns; it is the relation that says which people may operate
which of the account's businesses. Keeping it per-business rather than
per-account is what preserves the property [[CHAT-36]] identified as a payoff —
*"membership is already per-site, which gets you 'this employee sees only the
salon site' for free"* — and matches [[DOC-42]] §4's Operator, *"may run this
business — owner, support, eventually staff"*.

## v1 is one contact per account, and no access restrictions

**The model supports several; the product ships one.** Provisioning creates an
account with exactly one person on it, as it effectively does today, and nothing
adds a second.

**Access restrictions are explicitly punted** (decided 2026-09-05, [[CHAT-23]]).
No permission checks, no role vocabulary beyond the `'owner'` the `role` column
already holds, no RBAC. The column is the foothold and stays a foothold. What
this ticket buys is that adding a second person later is a row rather than a
migration — which, given [[REQ-190]] is rebaselining now, is the difference
between a table definition and a second rebaseline.

**Falsifier:** a query that assumes one contact per account — `LIMIT 1` over an
account's people, or a foreign key pointing at a person where the payer is meant.

**Stated as behaviour, `provisionBusiness` writes a membership for EVERY person
on the owning account.** It is the falsifier's positive form: a `LIMIT 1` there
would silently make one of two people the account and leave the other unable to
open the business their account pays for. v1 never produces the two-person case,
so it is built by hand to be checked.

**`account_id` on the person is `NOT NULL`**, and that is the reason "belongs to
an account" needs no exceptions anywhere downstream. Every path that makes a
person mints an account beside them — the invite, and the break-glass operator —
so there is no row naming none and no reader with a missing case to handle. A
person written without one is refused by the schema rather than by a check
somebody has to remember.

## Two edges the ownership column does not have

**The platform business is owned by nobody.** 1st Contact is not somebody's
product — it is the business whose product is businesses ([[DOC-42]] §8) — so its
`owner_account_id` is null. Letting `ensurePlatformOperator` fill it would make
"who owns 1st Contact" mean "who logged in first", which is worse than saying
nothing. The operator still gets an account of their own, exactly like any
invited contact.

**Provisioning refuses an owner that does not exist, or one that holds nobody**,
before writing any row. A business with no payer is not broken in a way anything
would notice — the switcher joins through `memberships`, so it stays invisible
until somebody tries to bill it — which is precisely why the refusal has to be at
the write.

## The `acct_` prefix is on the wrong noun

`newId('acct')` mints **business** ids (`identity.ts`, `provisionBusiness`), so
`acct_uatwestheadme` and `acct_057f…` are businesses. The prefix predates
[[DOC-40]] §2 splitting the two nouns and will actively mislead once accounts
exist and carry ids of their own.

[[REQ-190]] is reminting every key, so this is the cheap moment: businesses take
a business prefix and `acct_` is freed for the thing it names.

## Acceptance

- `accounts` is a table with an opaque key ([[REQ-190]])
- a business names the account that owns it
- a person names the account they belong to
- an account may hold several people, and the schema needs no change to allow it
- provisioning creates one account with one person, and v1 adds no second
- `entitlements` names its subject by account key; the per-business capacity
  grant keeps its `NULL` subject and its meaning ([[REQ-184]])
- no permission check anywhere reads `role`
- no id prefixed `acct_` is a business
- `findAccount` returns an account, and the chrome is told who is signed in under
  the noun for a person
- the platform business names no owner; provisioning refuses an absent or empty
  one