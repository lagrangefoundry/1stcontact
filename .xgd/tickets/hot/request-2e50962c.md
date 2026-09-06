---
uid: request-2e50962c
id: REQ-191
type: request
title: A person's email addresses are a table, not a column
created_by: xgd
created_at: '2026-09-05T21:25:16.063394+00:00'
updated_at: '2026-09-06T18:28:11.674327+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4ea78701
  commits:
  - working_sha: 0b89a18e8f5f1c2211f1e8825eda8c5c6a968eff
    reconcile_sha: null
    main_sha: null
  version: 0.2.86
---

# A person's email addresses are a table, not a column

Part of the schema rebaseline. [[REQ-190]] owns the keys and the single baseline
migration; this ticket owns the address shape and everything that reads it. They
land together — see *Sequencing* below. [[CHAT-38]] is the wider conversation
about how contacts are represented; [[REQ-193]] came out of it and takes the
same shape as this one.

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

## Not in scope — but now decided

[[CHAT-38]] settled these on 2026-09-05. Recorded here because this ticket is
where they were flagged as open; none of them changes the shape above.

- **Phone is a sibling table, not a generic `user_channels`.** Email and phone
  are the same shape — a normalised routing string with a uniqueness constraint
  that means something — but a postal address is a compound with no such
  constraint, so one table with a `kind` column would carry columns two of its
  three kinds never use. Keep the *pattern* uniform — opaque key, foreign key by
  key, `is_primary`, invariant enforced by a partial unique index — and let the
  tables differ. `user_phones` stores the E.164 form beside the authored one, for
  the same reason this table casefolds, and carries a `kind`, because SMS reaches
  a mobile and not a landline. That is a capability distinction, not decoration.
- **Names take this shape with one axis removed.** A person has several addresses
  at once and exactly one name at a time, so the name table has no `is_primary`
  and the same partial unique index enforces *one current* instead of *one
  primary*. That is [[REQ-193]], landing in the same baseline.
- **Postal addresses are deferred, and deliberately under-structured when they
  arrive.** An authored multi-line block plus exactly two structured fields:
  `country` (ISO-3166-1 alpha-2), because [[DOC-34]] makes it the single input to
  locale, currency and legal obligation, and `postcode`, because it is the part
  that gets validated. Street, city and region are display-only, and structuring
  them buys nothing until some capability queries them.
- **Editing addresses in the UI.** Unchanged: this ticket makes the model right;
  which surface adds an address and re-primaries it is [[REQ-189]]'s territory or
  later.

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


## What landed

The shape above, plus the decisions the implementation had to make. Each of
these has a UAT, so each of them is recorded here.

### The schema

`user_emails` is in `0001_baseline.sql`, edited in place. Casefolding is enforced
by `CHECK (email = lower(trim(email)) AND email <> '')` — a forgotten
`normaliseEmail` is now a failed write rather than a person `admit` will never
find. `is_primary` is *at most* one per person, by partial unique index; zero is
representable, and is what a contact with no address at all holds. `user_emails`
declares `FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE`, so
erasure ([[DOC-37]]) reaches a person's addresses without a second sweep.

`users.email`, `idx_users_tenant_email`, `entitlements.email` and
`idx_entitlements_email` are all gone.

### The address is nullable, because a contact may hold none

`UserRow.email` and `Person.email` survive as **read-model** fields carrying the
PRIMARY address, joined rather than selected — every surface that shows a person
shows one address. Both are `string | null`: a contact reached only by phone is
the shape [[DOC-42]] §4.1 names and the column could not represent, and
defaulting it to `''` would hide that. `BusinessesPayload.account.email` is
nullable for the same reason; the chrome already renders whichever of name and
address it has.

The primary is resolved with a fallback to the oldest address, so a person
holding addresses and no primary shows one they can actually be reached at
rather than a blank cell.

### `admit` presents the primary, whichever address was used

Resolution matches ANY address; the admission then carries the primary one, so
the chrome shows a person one identity rather than whichever address they
happened to type.

### Correcting an address rewrites the primary row

`setPersonRecord` owns *who somebody is*, so an address correction rewrites the
primary `user_emails` row rather than adding a second one — leaving the wrong
address behind as a second identity would keep resolving the person the
correction was meant to stop resolving. It inserts when there is no primary row
to rewrite, which is how a phone-only contact gains an address. Nothing here adds
a second address; that surface is [[REQ-189]]'s territory or later, as above.

The duplicate-address refusal now names `user_emails`; left pointing at `users`
it would have matched nothing and reported a typo to the operator as a 500.

### The person and their first address are written as one batch

`invitePerson` and `ensurePlatformOperator` both write `users` and `user_emails`
in a single `DB.batch`. A person written without an address is a person nothing
can find — not the front door, not the next invite — which is a worse state than
the write having failed. `ensurePlatformOperator` resolves the person's key from
`user_emails` first and binds both inserts to it, replacing an
`INSERT ... WHERE NOT EXISTS` over a column that no longer exists; it stays
idempotent, which matters because every admission by a holder runs it.

### `provisionBusiness` takes no address

`BusinessSpec.email` is removed along with the column it fed. Who a grant is for
is `account_id`; who made it is `granted_by`; and the membership written in the
same batch is the record of whose business it is.

### The detail pane shows the other addresses, read-only

`personDetail` returns `emails` — every address, primary first — and the pane
renders the non-primary ones under an *Other addresses* heading that appears
only when there are some. Without it a second address exists in the database and
nowhere on screen, which is the state that lets an operator invite one human
twice. There is no control in it, because nothing in the product adds or
re-primaries an address yet.

### Two assertions elsewhere had to change

[[REQ-167]]'s *plan and status carry no check constraint* was written file-wide,
which was true while nothing anywhere declared a CHECK and says more than that
ticket meant. It is narrowed to the `entitlements` table: `user_emails.email`
declares one deliberately, and it is about normalisation rather than a closed set
of allowed values. [[REQ-190]]'s single-opaque-key census gains `user_emails` —
the rule restated, not an exception to it.

### Test fixtures

Seeding a contact is two rows now, so `tests/support/contact.ts` holds the one
copy of it. Four suites had their own single-`INSERT` version; four copies of a
two-row write is four places for one of them to be forgotten, and the failure is
quiet — a person with no address reads as an admission bug rather than as a
fixture that wrote half a contact.