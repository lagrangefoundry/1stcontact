---
uid: request-3a87d4a1
id: REQ-190
type: request
title: Identity is not a channel, and data is not a key
created_by: xgd
created_at: '2026-09-05T21:12:40.298029+00:00'
updated_at: '2026-09-05T21:12:40.298029+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
---

# Identity is not a channel, and data is not a key

Now, while the only rows anywhere are test data. Every fix below is cheap today
and a migration with customer data in it tomorrow.

## 1. The rule

**No data field is ever a key.** A key is a surrogate the system mints and never
shows meaning through. Anything a human chose, typed, or might change — an email,
a slug, a business name — is an attribute, and attributes get renamed.

The email is the proof. `idx_users_tenant_email` makes the address the identity,
so a person *is* their address: two addresses is two people who can never be
reconciled, and changing the primary address mutates the identity key that
`admit` resolves through. This is the same defect [[DOC-42]] §4.1 already records
for phone — *"a contact reached only by phone has no key and no column"*. One
cause, two symptoms.

## 2. Where the rule is broken today

| Table | The data doing a key's job | What it costs |
| --- | --- | --- |
| `users` | `UNIQUE (tenant_id, email)` (`0004:69`) | one address per person; renaming rewrites identity |
| `entitlements` | `email` as the subject (`0004`) | a **string** foreign key to a person; two places to change an address |
| `tenants` | `id` is a chosen name — `'1stcontact'` | a business can never be renamed; the value propagates into every `tenant_id`, into R2 prefixes (`t/<tenant>/blob/…`, `draft/<tenant>/<slug>/…`) and into `/b/<id>/` URLs |
| `sites` | `PRIMARY KEY (tenant_id, slug)` | renaming a site rewrites `site_pages`, `site_assets`, `site_changes`, `site_revisions`, `published_sites` and its R2 keys |
| `published_sites` | `slug TEXT PRIMARY KEY` — **globally** | two businesses cannot both publish a site called `home`. A cross-tenant collision, live today |

That last row is not a future cost. Since [[REQ-168]] every customer has their own
tenant, and the first two customers to pick the same slug collide.

## 3. Surrogate keys, and a caveat worth taking

Every table gets an integer surrogate primary key — in SQLite, `INTEGER PRIMARY
KEY`, which *is* the rowid and increments without `AUTOINCREMENT`'s extra table
and monotonicity cost. Existing keys become plain unique constraints where the
uniqueness is still wanted.

**But an incrementing key must not be the one in the URL.** `/b/<businessId>/`
and `/b/<id>/api/…` are reachable by customers. An integer there is an
enumeration oracle: `/b/2/`, `/b/3/` probes every other business on the
deployment and turns a 403 into an existence check. Today `newId('acct')` mints
random hex, which is safe to expose by accident.

So the pattern is **two columns, not one**: an integer surrogate for joins, and a
separate random opaque `public_id` for anything that appears in a URL, an API
response, or an R2 key. That satisfies the rule — neither is a data field — and
keeps the property the current ids have by luck.

## 4. Emails become a table

```
user_emails
  id          INTEGER PRIMARY KEY
  user_id     -> users(id)
  email       TEXT NOT NULL      -- stored casefolded, see below
  is_primary  INTEGER NOT NULL DEFAULT 0
  created_at  TEXT NOT NULL
  updated_at  TEXT NOT NULL
```

- **Many per user, one user per address.** `users.email` is dropped.
- **`is_primary` rather than `default`**, which is a reserved word in enough
  dialects to be worth avoiding. Exactly one per user, enforced by a partial
  unique index — `CREATE UNIQUE INDEX … ON user_emails (user_id) WHERE
  is_primary = 1` — rather than by application code, because "the invariant the
  code maintains" is the invariant that eventually is not maintained.
- **Casefolded on the way in.** `normaliseEmail` is convention today and
  `idx_users_tenant_email` is byte-exact, so a differently-cased row is a second
  person `admit` never finds (`0005` records this). The table stores the
  normalised form so the constraint enforces what the convention intends.
- `admit`'s `findUser` resolves through this table instead of `users.email`.

### One correction to the brief: uniqueness is per tenant, not global

"Each email points to exactly one user" is right **within a tenant** and must not
be global. [[DOC-42]] §1 has the same human as a member of 1st Contact *and* a
contact of Alice's Plumbing — two `users` rows in two tenants, deliberately,
because a contact belongs to the business that knows them. A global unique
constraint would make the second one impossible and break the recursion the whole
model rests on.

So: `UNIQUE (tenant_id, email)` moves onto `user_emails`, carrying the tenant
through from the owning user.

## 5. Decisions this needs before it starts

- **Rebaseline or migrate?** D1/SQLite cannot alter a primary key in place;
  changing one means create-copy-drop-rename per table. With only test data, a
  single new baseline that drops and recreates is far cleaner than eight
  table rebuilds — but `wrangler d1 migrations apply` records what it has run, so
  a rebaseline means wiping the remote D1 rather than editing history.
  **Recommend: rebaseline, and wipe.**
- **How far does the sweep go?** The identity half (§4, plus `entitlements.email`)
  is small and urgent. The `sites`/`slug` and `tenants.id` half is larger — it
  moves R2 key prefixes ([[DOC-38]] §7.2) and the erasure path depends on the
  tenant prefix ([[DOC-37]]). It may want to be its own ticket; it should not be
  quietly dropped, because `published_sites` is already colliding.
- **Phone.** The same shape answers [[DOC-42]] §4.1's other bullet. Either
  `user_emails` generalises to channels with a `kind`, or phone gets a sibling
  table. Not folded in here; named so it is a decision rather than an oversight.

## Acceptance

- no table's primary key is a value a human typed or chose
- anything appearing in a URL, an API response or an R2 key is an opaque
  `public_id`, never the integer surrogate
- a user holds several email addresses; exactly one is primary, enforced by a
  constraint and not by code
- an address resolves to exactly one user within a tenant, and the same address
  may exist in two tenants as two people
- changing a person's primary address changes no key and no foreign key
- `entitlements` names its subject by key, not by email string
- addresses are stored casefolded and the constraint is what enforces it
- `admit` resolves identity through `user_emails`
