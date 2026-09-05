---
uid: request-3a87d4a1
id: REQ-190
type: request
title: 'Data is not a key: opaque keys across the schema, in one rebaseline'
created_by: xgd
created_at: '2026-09-05T21:12:40.298029+00:00'
updated_at: '2026-09-05T21:25:45.995580+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
---

# Data is not a key: opaque keys across the schema, in one rebaseline

The address half of this ticket moved to [[REQ-191]]. What is left is the rule
and the sweep, and the single baseline both land in. [[CHAT-38]]'s name work will
join the same baseline if it is ready in time.

## The rule

**No data field is ever a key.** A key is a surrogate the system mints and never
shows meaning through. Anything a human chose, typed, or might change — an
address, a slug, a business name — is an attribute, and attributes get renamed.

The address was the loudest instance ([[REQ-191]]) and it is not the only one.

## Where the rule is broken today

| Table | The data doing a key's job | What it costs |
| --- | --- | --- |
| `users` | `UNIQUE (tenant_id, email)` (`0004:69`) | one address per person — [[REQ-191]] |
| `entitlements` | `email` names the subject | a string foreign key to a person — [[REQ-191]] |
| `tenants` | `id` is a chosen name, `'1stcontact'` | a business can never be renamed; the value propagates into every `tenant_id`, into R2 prefixes (`t/<tenant>/blob/…`, `draft/<tenant>/<slug>/…`) and into `/b/<id>/` URLs |
| `sites` | `PRIMARY KEY (tenant_id, slug)` | renaming a site rewrites `site_pages`, `site_assets`, `site_changes`, `site_revisions`, `published_sites` and its R2 keys |
| `published_sites` | `slug TEXT PRIMARY KEY` — **globally** | two businesses cannot both publish a site called `home` |

**The last row is live, not hypothetical.** Since [[REQ-168]] every customer has
their own tenant, so the first two customers who choose the same slug collide —
and the collision is across the tenant barrier, which makes it a disclosure as
well as a bug.

## Opaque random keys, one column

Every primary key becomes an **opaque random id** — 128 bits from a CSPRNG, which
is what `newId` already mints (`identity.ts:357`: `crypto.getRandomValues` over
16 bytes, hex, prefixed). No integer sequence.

**Random, not a digest.** A hash *of the row's data* is data-as-key wearing a
disguise: `sha256(email)` still changes when the address changes and still says
two addresses are two people. What is wanted is an identifier with no
relationship to its contents at all.

**One column, not two.** An earlier draft proposed an integer surrogate plus a
separate opaque `public_id`, because an incrementing key cannot appear in a URL —
`/b/2/`, `/b/3/` would probe every other business on the deployment and turn a
403 into an existence check. A key that is already unguessable needs no second
column: the same value is safe in a join, in `/b/<id>/`, in an API response and
in an R2 prefix. The only cost is that a `TEXT PRIMARY KEY` is not SQLite's
rowid and carries a separate index, which at this scale is not a consideration.

## Names stay, as attributes

`tenants.id` stops being `'1stcontact'` and becomes an opaque id; the business is
*called* 1st Contact in `tenants.name`, where it can change. Same for a site: the
slug remains the thing in the URL of the published site and stops being the thing
rows are keyed by.

`TENANT_ID` is the one exception and it stays a name, because it is deployment
configuration rather than a row — [[REQ-180]] D5 and [[DOC-42]] §2 already
classify it that way. It will name the platform business's *key* rather than a
word after this ticket.

## The blast radius outside D1

Two prefixes embed keys that are about to change, and neither is in SQLite:

- **R2 object keys** — `t/<tenant>/blob/<sha256>` ([[DOC-38]] §7.2) and
  `draft/<tenant>/<slug>/assets/…`. The erasure obligation ([[DOC-37]]) is
  implemented by deleting under the tenant prefix, so this is a correctness path
  and not just a rename.
- **`/b/<businessId>/` URLs** ([[REQ-168]]), which are already opaque and stay
  opaque.

## Rebaseline — decided, 2026-09-05

There is no real data anywhere, so `0001`–`0008` are replaced by **one baseline**
that creates the schema right, rather than eight create-copy-drop-rename rebuilds
that D1 would need to alter a primary key in place.

`wrangler d1 migrations apply` records what it has run, so this means **wiping
the remote D1** rather than editing history. Local stores are rebuilt by running
the baseline and then [[REQ-192]].

`0005`'s operator seed is **not** test data and must survive: it is the row that
stops [[REQ-168]] locking the operator out of the live deployment. It becomes
part of the baseline, keyed the new way.

## Acceptance

- every primary key is an opaque random id; none is a value a human typed or
  chose, and none is a digest of the row's own data
- the same key is used in joins and in URLs, because it is unguessable in both
- a business can be renamed, and a site's slug can change, with no key rewritten
- two businesses can each publish a site called `home`
- R2 prefixes and the erasure path follow the new keys
- `0001`–`0008` are gone, replaced by one baseline that includes [[REQ-191]] and
  the operator seed
