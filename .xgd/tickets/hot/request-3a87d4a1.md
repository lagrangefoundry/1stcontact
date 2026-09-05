---
uid: request-3a87d4a1
id: REQ-190
type: request
title: Identity is not a channel, and data is not a key
created_by: xgd
created_at: '2026-09-05T21:12:40.298029+00:00'
updated_at: '2026-09-05T21:18:36.775860+00:00'
completed_at: null
last_field_updated: body
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

## 3. Opaque random keys, one column

Every table's primary key is an **opaque random id** — 128 bits from a CSPRNG,
which is exactly what `newId` already mints (`identity.ts:357`,
`crypto.getRandomValues` over 16 bytes, hex, prefixed). No integer sequence.

**Random, not a digest.** "SHA" is worth pinning down, because a hash *of the
row's data* is data-as-key wearing a disguise: `sha256(email)` still changes when
the address changes, and still says two addresses are two people. What is wanted
is an identifier with no relationship to its contents at all. `newId` is that;
a content hash is not.

This collapses the two-column pattern an earlier draft of this ticket proposed.
An incrementing key cannot appear in a URL — `/b/2/`, `/b/3/` would probe every
other business on the deployment and turn a 403 into an existence check — so it
would have needed a second opaque column beside it for anything exposed. A key
that is already unguessable needs no second column: the same value is safe in a
join, in `/b/<id>/`, in an API response and in an R2 prefix.

The only cost is that a `TEXT PRIMARY KEY` is not SQLite's rowid, so it carries a
separate index. At this scale that is not a consideration, and it is the correct
trade against an enumerable key on a multi-tenant surface.

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

### Uniqueness: the key is global, the address is not

These are two different constraints and an earlier draft of this ticket ran them
together.

**The key is globally unique by construction.** `user_emails.id` is a random
128-bit id; it does not need a scope and cannot collide. Same for every other
table. Nothing about the key is per tenant.

**The address constraint stays per tenant, and the reason is isolation rather
than modelling.** `UNIQUE (tenant_id, email)` moves onto `user_emails`.

A global unique constraint on the *address* would mean one address is one human
across the whole deployment — and that is a linkage this product has already
decided against. [[DOC-42]] §1 has the same person as a member of 1st Contact and
a contact of Alice's Plumbing, as two unrelated rows, deliberately: [[CHAT-36]]
settled that contacts fragmenting across businesses is the feature, not the
defect. Making the address globally unique would:

- **break the recursion** — Alice's customer could not also be our customer, and
  [[DOC-42]] §1's own example stops being representable;
- **create an existence oracle across the tenant barrier** — an insert that fails
  tells Alice that some other business on the platform already knows that
  address. [[DOC-38]] §7.2 refuses a global content address for blob keys for
  precisely this reason, and an address is more identifying than a file.

So: global identifiers, tenant-scoped addresses. Switching the key type does not
change this, because the constraint being argued about is on the data, not the
key.

## 5. Decisions this needs before it starts

- **Rebaseline — decided, 2026-09-05.** There is no real data anywhere, so
  `0001`–`0008` are replaced by one baseline that creates the schema right rather
  than eight create-copy-drop-rename rebuilds. `wrangler d1 migrations apply`
  records what it has run, so this means **wiping the remote D1** rather than
  editing history. The local store is rebuilt by re-running the baseline and
  `0005`'s operator seed.
- **How far does the sweep go?** The identity half (§4, plus `entitlements.email`)
  is small and urgent. The `sites`/`slug` and `tenants.id` half is larger — it
  moves R2 key prefixes ([[DOC-38]] §7.2) and the erasure path depends on the
  tenant prefix ([[DOC-37]]). It may want to be its own ticket; it should not be
  quietly dropped, because `published_sites` is already colliding.
- **Phone.** The same shape answers [[DOC-42]] §4.1's other bullet. Either
  `user_emails` generalises to channels with a `kind`, or phone gets a sibling
  table. Not folded in here; named so it is a decision rather than an oversight.

## Acceptance

- every primary key is an opaque random id; no table's key is a value a human
  typed or chose, and none is a digest of the row's own data
- the same key is used in joins and in URLs, because it is unguessable in both
- a user holds several email addresses; exactly one is primary, enforced by a
  constraint and not by code
- an address resolves to exactly one user within a tenant, and the same address
  exists in two tenants as two unrelated people
- changing a person's primary address changes no key and no foreign key
- `entitlements` names its subject by key, not by email string
- addresses are stored casefolded and the constraint is what enforces it
- `admit` resolves identity through `user_emails`
