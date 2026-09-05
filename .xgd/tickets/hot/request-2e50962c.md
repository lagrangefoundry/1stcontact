---
uid: request-2e50962c
id: REQ-191
type: request
title: A person's email addresses are a table, not a column
created_by: xgd
created_at: '2026-09-05T21:25:16.063394+00:00'
updated_at: '2026-09-05T21:25:16.063394+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

# A person's email addresses are a table, not a column

Part of the schema rebaseline. [[REQ-190]] owns the keys and the single baseline
migration; this ticket owns the address shape and everything that reads it. They
land together — see *Sequencing* below. [[CHAT-38]] is the wider conversation
about how contacts are represented, and the name tickets coming out of it take
the same shape as this one.

## The defect

```sql
email TEXT NOT NULL
CREATE UNIQUE INDEX idx_users_tenant_email ON users (tenant_id, email)
```

The address is not an attribute of the person — it **is** the person. So one
human has exactly one address; a second address is a second human who can never
be reconciled with the first; and changing someone's address mutates the key
`admit` resolves them through.

This is the same defect [[DOC-42]] §4.1 records for phone — *"a contact reached
only by phone has no key and no column"*. One cause, several symptoms, and the
product is called 1st Contact.

## The shape

```
user_emails
  id          TEXT PRIMARY KEY   -- opaque random ([[REQ-190]])
  user_id     -> users(id)
  tenant_id   -- carried from the owning user, for the constraint below
  email       TEXT NOT NULL      -- stored casefolded
  is_primary  INTEGER NOT NULL DEFAULT 0
  created_at  TEXT NOT NULL
  updated_at  TEXT NOT NULL
```

`users.email` is dropped.

**`is_primary`, not `default`** — a reserved word in enough dialects to be worth
avoiding — and **exactly one per user enforced by a partial unique index**,
`CREATE UNIQUE INDEX … ON user_emails (user_id) WHERE is_primary = 1`. Not by
application code: an invariant the code maintains is an invariant that eventually
is not maintained.

**Casefolded by the schema, not by convention.** `normaliseEmail` is a function
anyone can forget to call and `idx_users_tenant_email` is byte-exact, so today a
differently-cased address is a second person `admit` never finds (`0005` records
this). Store the normalised form so the constraint enforces what the convention
intends.

## Uniqueness: the key is global, the address is not

Two different constraints, and they are easy to run together.

**The key is globally unique by construction** — `user_emails.id` is a random
128-bit id and needs no scope.

**The address constraint is per tenant**: `UNIQUE (tenant_id, email)`, moved off
`users` and onto this table. Making the *address* globally unique would mean one
address is one human across the whole deployment, which this product has already
decided against:

- it **breaks the recursion**. [[DOC-42]] §1 has the same person as a member of
  1st Contact and a contact of Alice's Plumbing, as two unrelated rows.
  [[CHAT-36]] settled that contacts fragmenting across businesses is the feature.
- it is an **existence oracle across the tenant barrier**. A failed insert would
  tell Alice that some other business on this platform already knows that
  address. [[DOC-38]] §7.2 refuses a global content address for blob keys for
  exactly this reason, and an address identifies a person more directly than a
  file does.

## What has to be rewired

- **`admit`** resolves identity through `user_emails` rather than `users.email`
  (`findUser`, `identity.ts`).
- **`entitlements.email`** stops naming its subject by address. It is a *string
  foreign key to a person* today, which means an address change has two places to
  land and can land in one. It names a key instead.
- **`peopleOf` / `personDetail`** return the primary address, and the detail
  panel can show the others.
- **The invite** ([[REQ-186]]) matches an existing person by any of their
  addresses, not only the primary one — otherwise inviting someone at their
  second address creates the duplicate this ticket exists to prevent.

## Not in scope

- **Phone.** The same shape answers [[DOC-42]] §4.1's other bullet, and
  [[CHAT-38]] is where the decision belongs — one `user_channels` table with a
  `kind`, or siblings per channel. Named so it is a decision rather than an
  oversight.
- **Names.** [[CHAT-38]] again; the name history table is the same pattern and
  will be its own ticket.
- **Editing addresses in the UI.** This ticket makes the model right; which
  surface adds and re-primaries an address is [[REQ-189]]'s territory or later.

## Sequencing

D1 cannot alter a primary key in place, so [[REQ-190]] replaces `0001`–`0008`
with one baseline. `user_emails` is created **in that baseline**, not by a
migration after it — two rebaselines for one schema change would be the thing
the rebaseline exists to avoid. This ticket is separable in review and in
acceptance, not in deployment.

## Acceptance

- a user holds several addresses; exactly one is primary, enforced by a
  constraint rather than by code
- an address resolves to exactly one user within a tenant
- the same address exists in two tenants as two unrelated people
- changing which address is primary changes no key and no foreign key
- addresses are stored casefolded and the constraint is what enforces it
- `admit` resolves identity through `user_emails`
- `entitlements` names its subject by key, not by address
- inviting a person at a secondary address matches the existing person and does
  not create a second one
