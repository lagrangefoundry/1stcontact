---
uid: request-3a87d4a1
id: REQ-190
type: request
title: 'Data is not a key: opaque keys across the schema, in one rebaseline'
created_by: xgd
created_at: '2026-09-05T21:12:40.298029+00:00'
updated_at: '2026-09-05T23:44:49.707300+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ed878559
---

---
uid: request-3a87d4a1
id: REQ-190
type: request
title: 'Data is not a key: opaque keys across the schema, in one rebaseline'
created_by: xgd
created_at: '2026-09-05T21:12:40.298029+00:00'
updated_at: '2026-09-05T23:30:32.412829+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ed878559
---

# Data is not a key: opaque keys across the schema, in one rebaseline

The address half of this ticket moved to [[REQ-191]]. What is left is the rule
and the sweep, and the single baseline both land in. [[CHAT-38]]'s name work is [[REQ-193]], and it joins the same baseline.

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

### `0005`'s operator seed is dropped, not carried — decided 2026-09-05

An earlier draft said the seed must survive into the baseline. It must not:
[[REQ-185]] made it redundant and nobody noticed.

`ensurePlatformOperator` (`identity.ts`) writes **all four** rows the seed writes
— the tenant, the `users` row, the membership and the entitlement — triggered by
the caller's address appearing in `PLATFORM_ADMINS`. That is a complete bootstrap
from deployment configuration, it works before any row exists, and it cannot be
revoked by the database it repairs, which is the whole of why [[DOC-40]] §6 put it
in a var. `0005` predates it and does the same job worse.

Worse in a specific way: it hardcodes one personal address into a migration that
runs in **every** environment, forever, including ones that address should never
be able to enter. Bootstrapping through the var costs one setting and one sign-in,
names whichever address is actually being used, and leaves nothing behind —
[[REQ-185]] already records that using it *writes* the membership, so the repair
outlives the var.

Carrying it forward would also be the legacy path CLAUDE.md forbids: two ways to
create the same four rows, one of them unreachable by anyone reading the code.

**So the baseline seeds no people at all.** To bring a deployment up: set
`PLATFORM_ADMINS` to the operator's address, sign in once, empty it again.

## Acceptance

- every primary key is an opaque random id; none is a value a human typed or
  chose, and none is a digest of the row's own data
- the same key is used in joins and in URLs, because it is unguessable in both
- a business can be renamed, and a site's slug can change, with no key rewritten
- two businesses can each publish a site called `home`
- R2 prefixes and the erasure path follow the new keys
- `0001`–`0008` are gone, replaced by one baseline that includes [[REQ-191]],
  [[REQ-193]] and the operator seed


## Moving a site between businesses is the worked example

Deferred to this ticket, 2026-09-05 ([[CHAT-23]]). `xgd.dev` was provisioned as a
second business on the operator's account while the `xgd` site it is named after
sat in `1stcontact`, where it was built when `TENANT_ID` decided everything.
`provisionBusiness` fills an order and has no notion of existing content, so
nothing moved — correctly. What was wanted is a second operation: move a site to
another business.

**Today that is a five-table rewrite plus an object-store copy.** `sites` is keyed
`(tenant_id, slug)` and the key propagates into `site_pages`, `site_assets`,
`site_changes`, `site_revisions` and `published_sites`, and into the R2 prefixes
`draft/<tenant>/<slug>/assets/…`. The owning business is baked into the key of
everything the site is made of, which is this ticket's whole thesis stated as a
task somebody actually wanted to do.

**After the rebaseline it is an update of one column** — the site's row names its
business by key, and nothing else records it. So the move tool is deliberately
not built first: it would be a migration written against a schema that is about
to be replaced, and its difficulty is the evidence for replacing it.

Left in place until then: the `xgd` site stays in `1stcontact` and `xgd.dev`
keeps its empty starter site.

Adds one acceptance criterion below.

- a site can be moved to another business by changing the business it names, with
  no row in another table rewritten and no R2 object copied


## The sweep is the whole schema — decided, 2026-09-05

An earlier draft left "how far does the sweep go" open, splitting the identity
half from the `sites`/`tenants` half. Closed ([[CHAT-23]]): it goes all the way,
in the one baseline. Data as an index will burn you eventually, and half a
rebaseline leaves the other half needing a second one.

## What lands in the baseline

One migration, authored once, containing every ticket in this cluster:

| | |
| --- | --- |
| [[REQ-190]] | opaque keys everywhere; the offenders in the table above |
| [[REQ-191]] | `user_emails`, and `users.email` dropped |
| [[REQ-193]] | the name table |
| [[REQ-194]] | `accounts`, and business ownership moved onto it |
| [[REQ-195]] | `contact_events` |
| [[REQ-188]] | the pipeline stage column |

[[REQ-192]] runs **after** it and seeds everything else.

They are separable in review and in acceptance, not in deployment: two
rebaselines for one schema change is the thing a rebaseline exists to avoid.