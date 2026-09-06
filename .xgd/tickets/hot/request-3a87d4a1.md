---
uid: request-3a87d4a1
id: REQ-190
type: request
title: 'Data is not a key: opaque keys across the schema, in one rebaseline'
created_by: xgd
created_at: '2026-09-05T21:12:40.298029+00:00'
updated_at: '2026-09-06T17:36:57.427789+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ed878559
  commits:
  - working_sha: 5c012c3758da8ff9369cb98ac706c69df44006a8
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: a007aabc451fa2fd8302efb4e9287bf6499c316a
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: e862cec72c416905656a920b9ec35906719650aa
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 19c5e62c64d9b7f75f7514af7342bbcf6f465767
    reconcile_sha: null
    main_sha: null
  version: 0.2.85
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


## What landed, and the consequences that needed saying

Written while free-coding, because each of these is behaviour a UAT asserts and
the body above did not name.

### The starter site is called `unnamed`, and the word is a prompt

`createStarterSite` set the starter slug to the BUSINESS ID — a workaround for
the global claim, so that no two customers could collide on a published name. It
cost every operator a builder whose only site was called `acct_057f…`. With the
claim gone the slug is unique only inside its business, so the starter is a plain
word again, and *"two businesses can each publish a site under the same starter
name"* is now the ordinary case rather than a hypothetical.

**Which word is a product decision, not a leftover.** `home` was the first
choice and is the wrong one: it reads as a name somebody picked, so nothing about
it asks to be changed, and every account's one site would then sit under a label
that says nothing about the business owning it — which is the `acct_057f…`
complaint again in a friendlier font. The starter is called **`unnamed`**,
because the one property the default needs is to be *visibly* a default: a site
called `unnamed` asks to be named the first time its owner looks at it.

**Both surfaces say it**, because an operator meets the site twice. The slug is
the URL-safe attribute the store addresses by and the builder lists; the site's
`config.businessName` is prose, and it is the `<title>` suffix on every rendered
page. So the slug is `unnamed` and the name is `Unnamed` — one word, two forms,
so the site does not read as provisional in one place and settled in the other.
They stay two constants rather than one derived from the other, so that changing
the prose can never silently rewrite a key.

**It is not the business's name either**, though provisioning knows it. A site is
not a business — an account will own several — and a name asserted on the
owner's behalf is still a name they never chose. That is the same objection as
`home`, reached from the other side.

**Nothing reserves the word and nothing enforces it.** The slug is an ordinary
attribute, so naming the site is the single `UPDATE` the move example above is
built on, and the site is fully addressable under its new name the moment that
lands. An operator who keeps `unnamed` keeps it.

**Consequence for the tests already written.** Every UAT that reached for a
provisioned business's starter site named it `'home'` inline. Those are fixtures
rather than assertions, so they read the constant now — what those tests actually
claim is that *every* account is provisioned under the *same* slug and no two
collide, which is true of any word. The two that assert a *list* of slugs also
changed order, because the store returns them sorted and `unnamed` is no longer
alphabetically first.

### A slug is unique INSIDE a business, and a move can collide

The other side of "never global". A slug still has to name at most one site
within the business that owns it, or the builder could not address one — so
`sites` carries `UNIQUE (tenant_id, slug)` and a move that would give the
destination two sites of the same name is refused **by the database**, not by a
check a caller could forget. The site stays where it was. That is the same
constraint the worked example meets: `xgd` moving into `xgd.dev` works because
`xgd` is free there, and would not if the destination already used the name.

### Dropping a site leaves no row and no object

The per-site half of the erasure obligation, and the verb that already performs
the enumeration described above. `forget` removes every child row, every object
under `draft/<siteId>/` and `sites/<siteId>/`, and the published address stops
answering.

### The prefix on a key is a reading aid

`site_…`, `acct_…`, `usr_…` say which table a value in a log came from. Nothing
parses one and nothing branches on one: two ids sharing a prefix are not related
and two with different prefixes are not ordered. Worth stating because a prefix
is the one part of an opaque key that looks like it means something — and
[[REQ-194]] is about to move `acct_` to a different noun, which only works
because nothing reads it.

### `site_pages` and `site_assets` keep `name` in their key

`(site_id, name)` is the one composite that survives, and `name` is not an
exception to the rule. It is a STORE KEY — `home.json`, `logo.svg` — which is how
the port addresses a page or an asset; it carries no directory component, and
renaming one is not an operation the product has. It is the unit of change the
file-backed store has always had, not a label somebody chose.

### The port gained two verbs, and `published_sites` is dropped entirely

- `TenantSiteStore.siteKey(slug)` is the one place a caller may learn a site's
  key, and its lookup is scoped to the handle's business — which is what the
  isolation argument rests on now that the child tables carry no business.
- `TenantSiteStore.siteKeys()` is the erasure enumeration.
- `published_sites` is **deleted, not re-keyed.** Its only job was making the
  slug globally unique; the one other fact it held, `first_published_at`, is the
  earliest row in `site_revisions`. A table that exists to enforce a constraint
  the rule forbids does not survive the rule.

### Two smaller consequences

- **`publicSiteUrl` takes a key**, and the builder's
  `/preview/<slug>/published` redirect now resolves the slug through the store
  first — so a slug this business does not hold is a 404 rather than a redirect
  to a URL that could only 404 one hop later.
- **The local builder transport keeps the slug as its key.** On the filesystem a
  site IS the directory `storage/sites/<slug>/`, there are no businesses to move
  between, and a rename is `mv`. The rule is about the multi-tenant database;
  the local authoring tier is unchanged.

### The one place the sweep is deliberately incomplete

`users.email` and `users.display_name` are still columns, and
`entitlements.email` still names a subject by address. They are [[REQ-191]]'s and
[[REQ-193]]'s, and both edit this baseline rather than following it — see the
convention above. The baseline says so at each of those columns, so a reader
meeting them does not take them for an oversight in this ticket.