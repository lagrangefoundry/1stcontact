---
uid: request-3a87d4a1
id: REQ-190
type: request
title: 'Data is not a key: opaque keys across the schema, in one rebaseline'
created_by: xgd
created_at: '2026-09-05T21:12:40.298029+00:00'
updated_at: '2026-09-06T00:29:32.157161+00:00'
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


## The R2 buckets are emptied too — decided, 2026-09-05

The blast-radius section above names R2 as affected and an earlier draft stopped
there. Wiping D1 deletes every row that *references* an object; it deletes no
objects. So `t/1stcontact/blob/…` and `draft/1stcontact/<slug>/assets/…` survive
the rebaseline with nothing pointing at them.

**This is not just clutter, and that is why it needs saying.** [[DOC-37]] erasure
is implemented by deleting under a tenant prefix. After the re-key, an erasure
request resolves the contact's *new* business key and deletes under *that*
prefix — and objects sitting under the old one are untouched by it, permanently,
by a mechanism that reports success. A leftover that survives its own erasure path
is the worst shape this could take.

So both buckets are emptied as part of the wipe: `1stcontact-sites` and
`1stcontact-material`. Everything in them is disposable ([[CHAT-23]]) except the
`xgd` site's 9 assets, which live in the file-backed store at
`storage/sites/xgd/draft/assets/` and return with the re-push ([[REQ-192]]).

## Added acceptance

- no object survives the rebaseline under a prefix no row references
- an erasure request after the rebaseline reaches every object belonging to the
  contact, with none stranded under a pre-rebaseline prefix


## What the published address is — decided, 2026-09-05

The acceptance criteria above already decide this between them and it is worth
writing out, because it is the one place the sweep reaches outside the database.

`/site/<slug>/` carries no business ([[REQ-111]], `routes.ts`), so `public-site`
resolves a site from the slug alone — which is exactly why `published_sites` keys
on the slug **globally**, and why two businesses cannot both publish `home`. No
change to the keys fixes that on its own: as long as the public URL is a chosen
name, that name has to be unique across the deployment or it does not name
anything.

So **the published address becomes the site's key**. `/site/<siteId>/` — the same
opaque value the joins use, which is what *"the same key is used in joins and in
URLs, because it is unguessable in both"* already says. The slug stops being an
address and becomes what the rule says it is: an attribute, unique within its
business and free to change.

**This is already the status quo for every customer.** `createStarterSite`
(`identity.ts`) sets the starter slug to the business id precisely to dodge the
global claim, so every provisioned site's public URL is opaque today. What
changes is that it becomes the design rather than a workaround, and the operator's
own hand-named sites (`xgd`, `gigabytealchemy`) join them.

**The route grammar is untouched.** `SLUG_PATTERN` already admits the id's
character set; what moves is what the segment means. Per-business hostnames
([[DOC-12]] §9) remain the readable answer and remain purely additive.

`SlugClaimedError` and the claim it enforces are deleted, not relaxed — there is
nothing left to claim, and a refusal that told one business another already holds
a name was an existence oracle across the barrier.

## Only the site's own row names its business

The child tables — `site_pages`, `site_assets`, `site_changes`, `site_revisions`,
`published_sites` — carry `site_id` and **no `tenant_id`**. That is what makes the
worked example above an update of one column rather than a promise about one.

**Isolation moves one level in, and does not weaken.** The store still binds the
business into the handle at construction; what the handle now resolves is
slug → `site_id`, under `WHERE tenant_id = ?`. A site key is unguessable and is
obtainable only through a business-scoped lookup, so a query that reaches another
business's rows is not one somebody forgot to filter — it requires a key the
handle cannot produce.

## Ordinal is not identity

`site_revisions.id` and `site_changes.at` stay integers, and the rule above does
not reach them. Neither identifies anything: a revision id is a **position in a
sequence** — live is `MAX(id)` with no head pointer ([[DOC-12]] §4) and the
published layout is `rev/0001` — and `at` is the journal counter the window is
trimmed by. Randomising a position destroys the ordering that *is* its meaning.
`counters.value` is the same fact once more.

The rule is about identity. Where a number orders rather than names, it stays.

## `TENANT_ID` becomes a literal two files must agree on

Once the platform business's id is opaque, `wrangler.toml` and the baseline both
carry the same random constant, and nothing today would notice them disagreeing —
the symptom would be `UnknownTenantError` on every deployed request. A UAT pins
the value in `wrangler.toml` against the value the baseline seeds, in both the
`[vars]` and `[env.production.vars]` blocks.

The baseline seeds **the platform business row only** — no people, per the
decision above. `ensurePlatformOperator` writes the rest.

## The baseline is authored here and edited by its siblings

One file, `db/migrations/0001_baseline.sql`, replacing `0001`–`0009`. This ticket
authors it with the keys right and today's tables on it; [[REQ-191]], [[REQ-193]],
[[REQ-194]] and [[REQ-195]] **edit that file** rather than adding migrations after
it. Editing a baseline that has never been applied is not a second rebaseline —
which is what *"separable in review and in acceptance, not in deployment"* means
in practice.

`0009_pipeline_stage.sql` ([[REQ-188]]) landed after this ticket's table was
written and is folded in too, so the list is `0001`–`0009`.

The `acct_` prefix stays on business ids here. Freeing it is [[REQ-194]]'s
acceptance and its baseline edit; reminting it twice would be churn.

## Erasure enumerates, it does not sweep one prefix

The blast-radius section says the erasure path follows the new keys, and with the
site prefix no longer carrying a business the two obligations have to be stated
together:

- a site's objects live under `draft/<siteId>/…` and `sites/<siteId>/rev/…`, so a
  move copies nothing;
- erasure for a business reads that business's site ids from D1 and deletes under
  each, **and** under `t/<tenant>/blob/`, `t/<tenant>/ref/` and `kb/<tenant>/`,
  which stay business-prefixed because blobs and knowledge belong to the business
  rather than to a site.

Erasure is not implemented today — [[DOC-37]] is an obligation and the portal
explains it — so this settles the layout it will be built against rather than
changing a live path.

## `newId` moves down a layer

It lives in `identity.ts` (`apps/control-app`), and the store that must now mint
site keys lives in `tools/generate`, which `control-app` imports and never the
reverse. So `newId` moves into the store layer and `identity.ts` re-exports it —
one minter, not two, which is the property the rule depends on.

## A correction to the acceptance above

The last criterion still reads *"replaced by one baseline that includes
[[REQ-191]], [[REQ-193]] and the operator seed"*. The operator seed is dropped —
see the decision above — and the sibling tickets edit the baseline rather than
being written into it by this one. Restated:

- `0001`–`0009` are gone, replaced by one baseline that seeds no people and that
  [[REQ-191]], [[REQ-193]], [[REQ-194]] and [[REQ-195]] extend in place
