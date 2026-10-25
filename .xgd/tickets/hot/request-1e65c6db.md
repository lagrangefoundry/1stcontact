---
uid: request-1e65c6db
id: REQ-237
type: request
title: The business name is stored once, and may change at any time
created_by: EPIC-4
created_at: '2026-09-13T21:17:12.597808+00:00'
updated_at: '2026-09-14T03:04:59.940390+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  depends_on:
  - request-03519106
  epic_parent: epic-0728e1c5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d9800156
  commits:
  - working_sha: dc192d05e3d011e19d5c160cd7e141f5c2279098
    reconcile_sha: null
    main_sha: null
  - working_sha: b7e9c4db0899e32b41e7790ab2e5a62bbaf8bb89
    reconcile_sha: null
    main_sha: null
  - working_sha: 105070e305694c008d8bf97747add404b0adf4e7
    reconcile_sha: null
    main_sha: null
  version: 0.2.193
  story_points: 8
---

## What this is

The business name is stored in **one** place, `tenants.name`, and the customer
may change it whenever they like.

## What is wrong today

**There is no rename path at all.** `tenants.name` can change in principle —
[[REQ-190]] settled that the id is the key and the name an attribute — and
nothing anywhere offers it. Onboarding names a business `Unnamed business`
([[BUG-90]] defers asking for a real one to "the settings work", which is this),
and the customer has no way to correct it.

**And when it does change, nothing says what is now out of date.** That is the
second half of this ticket and the more interesting one.

## Two names that are allowed to differ

There are two strings holding a business's name, and it is tempting — it was
tempting for three turns of [[EPIC-4]]'s design discussion — to read them as
duplicated state to be collapsed. They are not.

| | What it is | How it changes |
| --- | --- | --- |
| `tenants.name` | What the business **is called**. The record. Stored exactly once, never rendered onto a site. | Freely, at any time, no consequence |
| `site.config.businessName` | What the **site says**. Authored content. | Only by an explicit site edit |

`site.config.businessName` has exactly one reader —
`tools/generate/src/render/render.ts:162` — where it is the fallback for a page's
HTML `<title>` when `seoMeta.title` is absent. It is not the visible name on the
page: the headline, the wordmark and every sentence naming the business are page
content, and nothing here touches them.

Look at what it sits beside in `siteConfigSchema`
(`packages/site-schema/src/schema.ts:923`): `tagline`, `contact.email`,
`contact.phone`, `contact.address`. That is a set of *things the site says about
the business*, every one of them authored. Reading one member of that set as a
cache of a database column, and the rest as content, is the error.

### So a rename does not touch the site

**A site change is always explicit.** Appearance has implications a rename cannot
anticipate, and the page title is among the most consequential strings on a site
— it is what a search result shows. A business renamed from `Foo` to `Bar` may
well want the site to follow, and it may equally be mid-rebrand, trading under
both, or correcting an internal label that was never the trading name. The
product does not get to assume.

What was missing was never a synchroniser. It is that **nothing tells the
customer the two have diverged**, which is what the effects report below supplies.

### The field is misnamed, which is what caused the confusion

`businessName` reads as "a copy of the business's name". It means "the name this
site gives the business". Renaming it — to say that it is the site's own title
text — is a site-definition format change touching the schema, `render.ts` and
three constructors (`scaffold.ts:41`, `repro.ts:160`, `portal.ts:237`), plus the
three `site.json` files under `storage/sites/`. Small, and it removes a trap that
has already cost one design discussion. **Open: whether to do it here or leave
the name and document it.**

## The name is internal, and it is not a key

It is what the business switcher and the Contacts tab show. Nothing addresses a
business by it — that is `tenants.id`, opaque and permanent ([[REQ-190]],
[[DOC-43]] §1) — and after [[REQ-236]] nothing derives an addressing token from
it either. So changing it is free: no redirect, no migration, no collision with
anything outside its own account.

It is emphatically **not** the public address. That is the `1stc.site` hostname,
which is global, first-come and final ([[DOC-45]] §7, [[REQ-238]]). The two names
sit on the same tab and have opposite lifecycles, and the settings assistant has
to be able to say which is which.

## Behaviour

### Uniqueness

- **A business name is unique within its owning account** — `tenants`
  `(owner_account_id, name)`. Two accounts may each hold a business called
  `Unnamed business`; one account may not hold two.
- **Compared on a normalised form**, case-folded and whitespace-collapsed, while
  what the customer typed is what is stored and shown. Exact-string uniqueness
  would admit `Cole's Bakery` beside `cole's bakery` and put two
  indistinguishable rows in one switcher, which is the failure the constraint
  exists to prevent.
- **The platform business is exempt.** `tenants.owner_account_id` is NULL for
  1st Contact and nothing else (`db/migrations/0001_baseline.sql:66-80`), and
  SQLite treats NULLs as distinct in a unique index. The exemption is therefore
  free — but it is *stated here as a decision* rather than left to be discovered
  as a property of the index.
- **The constraint is data integrity, not a UI guarantee.** Grants span accounts,
  so a person holding grants on two businesses owned by different accounts can
  still see two identical entries in the switcher. That is a
  disambiguation-on-display problem and is not solved here; claiming otherwise
  would be the more dangerous outcome.

### The default name

- **Provisioning a second business under one account does not collide on the
  default.** `UNNAMED_BUSINESS_NAME` is the fixed string `'Unnamed business'`
  (`apps/control-app/src/onboarding.ts`), so an account's second provision would
  otherwise trip the constraint above on a name the system chose for them — an
  error for something the customer did not do. A constraint the system itself can
  trip is a constraint that gets worked around.
- **The scheme is the base name, then `-1`, `-2`, and so on, first free wins.**
  The first business an account provisions is `Unnamed business`. If that name is
  taken the next is `Unnamed business-1`; if that is taken too, `Unnamed
  business-2`, and upward until one is free. The search is against the same
  normalised comparison the constraint uses, so it cannot propose a name the
  constraint will then refuse.
- **The suffix is not a count and nothing may read it as one.** It is whatever
  number was free at the time. An account that provisions three businesses and
  renames the middle one leaves a gap, and the gap is filled by the next
  provision — so `Unnamed business-2` does not mean "the third business" and
  never did.
- The word stays visibly provisional, which is [[REQ-190]]'s argument and is
  still right *for this name*: it costs nothing to change, so getting it
  approximately right costs nothing and leaving it blank costs something.
  [[BUG-90]] deferred the question of asking for a real one to "the settings
  work"; this is that work.

### Renaming

- **A rename reports its effects, and does not answer a boolean.** This is the
  whole of how a change that deliberately propagates to nothing stays safe: the
  caller — the form or the assistant — is told what is now inconsistent, and
  decides what to do about it.
  - the site still calls the business by its old name in `config.businessName`,
    and will go on doing so until somebody edits the site. **Not "until the next
    publish"** — publishing re-renders what the site says, and what it says has
    not changed;
  - page copy may *name* the business in prose the assistant wrote, which is
    authored text and can only be found and rewritten.
  - **Each of these is an offer, never an action.** The report is what lets the
    assistant say *"your site still calls you Foo — shall I change that too?"*
    and the settings pane show it as a thing to look at.
- **A rename publishes nothing.** Publication has its own meaning and its own
  moment; making a rename publish as a side effect would push a draft live that
  the customer never asked to release.
- **A rename has no addressing consequence.** After [[REQ-236]] nothing is
  derived from the name, so there is no slug to move, no session to orphan and no
  URL to change.

## Surface

This ticket declares its own operations in the settings surface, prose included
— the `overview`, the parameter descriptions and the refusals — because the tool
manual is *projected* from that declaration and a description written anywhere
else falls behind the operation it describes. `roles.ts` states the rule: a
hand-written inventory *"is worse than no inventory because the model believes
it."*

The refusals are where the judgement lives. "That name is already one of your
businesses" has to arrive at the moment of the collision, naming the other
business, because that is the only moment it is useful.

## Falsifiers

- A business name stored in two places.
- A rename that reports success and leaves a caller unable to learn what is now
  stale.
- A uniqueness comparison that admits two names a person would read as the same.



---

## Implementation

### The open question is answered: the field keeps its name

`config.businessName` is **not** renamed. The ticket's own estimate ("small") is
right about the code and wrong about the reach: the field is a *site-definition
format* key, so renaming it touches every `site.json` already stored in D1 in
every deployment, not only the three under `storage/sites/` — which makes it an
`upgrade-site.ts` migration rather than a rename, for a naming improvement, in a
ticket whose subject is the *other* name.

What the trap actually costs is a reader believing it is a cache. So the
correction is placed where that reader will meet it: a doc comment on the field
in `siteConfigSchema`, and the settings surface's `overview`, which says in the
model's own manual that the two names are allowed to differ. Both are checked by
a UAT.

### Where the name rule lives

`apps/control-app/src/business.ts` — new, and the counterpart of `names.ts` for a
person's name. It owns the comparison, the refusals, the default-name search and
the rename. Two spellings of "is this name free" is how the two come to disagree,
so there is one.

- `normaliseBusinessName` — the **storage** form: trimmed, internal whitespace
  collapsed, **case untouched**. Tidying and not folding. Applied at the door,
  which is what leaves the comparison with only case to fold.
- `businessNameKey` — the **comparison** form: the above, case-folded.
- `businessesOwnedBy` — the account's businesses. **A null account owns nothing**,
  which is the platform exemption written as a decision on the code side.
- `requireFreeBusinessName` — shared by provisioning and renaming.
- `availableBusinessName` — base, `-1`, `-2`, first free wins, in one query.
- `renameBusiness` — one `UPDATE`, then the effects report.

### The constraint is two rules, and the code's is never weaker

`db/migrations/0006_business_name_unique.sql` adds
`UNIQUE (owner_account_id, lower(name))`. SQLite's `lower()` folds ASCII only and
cannot collapse internal whitespace at all, so the index is deliberately the
**weaker** of the two: it is the integrity backstop, and the rule — Unicode
case-folding over an already-whitespace-collapsed name — is `business.ts`'s. Every
pair the index would refuse, the code refuses first and with a sentence naming
the other business. A UAT drives a raw `INSERT` past the code to prove the index
is really there.

### The effects report

`renameBusiness` returns `{ businessId, name, previousName, effects }` where
`effects` is:

| | |
| --- | --- |
| `siteKey` | the business's site, or null |
| `siteName` | what `config.businessName` says — **unchanged** |
| `siteNameDiffers` | true when that is not the new name |
| `pagesNamingPreviousName` | pages whose authored copy contains the old name |

Page copy is searched over the **serialised page definition**, because the
business's name can be in a heading, a link's text, alt text or SEO prose, and
walking the tree for "the places copy is allowed to live" would be a second,
quietly incomplete model of where copy lives. Names shorter than three characters
are not searched for: a list of every page is the same as no list.

### Two callers of one API, and one of them is REQ-239's

- **`POST /api/business/name`** (`BUSINESS_NAME_PATH`) — business-scoped, gated by
  `ownsBusiness` (the same gate `/api/people/record` carries: a `support`
  membership exists to help operate a business, not to re-label it). Returns the
  rename report. A taken name is **409 naming the other business**; an empty name
  is **400** — collapsing them would leave the pane unable to say which happened.
  The *settings pane itself* is [[REQ-239]]'s.
- **The `settings` surface** — `settings-surface.json` + `settings-core.ts`, with
  `read_business` / `rename_business`, two effect-homogeneous groups, and its
  grant travelling with it (not in `instances.json`, for the reason
  `image-core.ts` states). **It is declared here and composed by [[REQ-239]]**,
  which owns the settings role, the grant and the priming — the split [[EPIC-4]]
  states: *"the AI-facing declarations live in the capability tickets."*
  `business.ts`'s `businessSettings(env, businessId)` is the port implementation,
  ready for that wiring.

### The default name: where the uniquifier actually sits

`ensureOwnBusiness` is the one place the **product** chooses a business name, so
that is where `availableBusinessName` is called. `provisionBusiness` **refuses** a
taken name instead, because every other caller was given one by a person, and
silently storing `Cole's Bakery-1` for somebody who asked for `Cole's Bakery`
would be a lie about what happened.

### Two consequences elsewhere, recorded because they are behaviour changes

1. **An account can no longer hold two identically-named businesses**, and one
   existing UAT relied on that — [[REQ-178]]'s "invite and provision write the
   same shape" provisioned a second `By invite` onto the same account and compared
   `tenants.name` as part of the shape. The name is an *input* to both paths
   rather than part of the shape they write, so the second business is now named
   distinctly, the shape comparison drops `name`, and each name is asserted
   separately. The claim is unchanged.
2. **`tests/support/invite-account.ts` takes its fallback label through
   `availableBusinessName`.** That helper *chooses* the label when a suite gives
   none, and the one path that can collide is the re-invite repair — the same
   account seeded twice under a name no suite asked for twice. A name the product
   picks must never be the thing that fails.

### Reachability today

Onboarding's default is still the placeholder, and `ensureOwnBusiness` is
idempotent, so nothing in the product provisions a *second* default-named business
yet. The suffixing exists because the constraint does: a constraint the system
itself can trip is a constraint that gets worked around, and the day self-serve
business creation lands it must already be true.

## Test plan

`tests/test_UAT_FC_REQ-237_business_name.workers.test.ts` — real D1 with the
deployed migration list; the route cases drive the Worker's own `fetch` inside
workerd with a real RS256 Access token.

- **AC1 — unique within the owning account**: `Cole's Bakery` refuses
  `  cole's   BAKERY `, and the refusal names the other business; two accounts may
  each hold `Unnamed business`; the raw `INSERT` past the code is refused by the
  index; what was typed is what is stored and only stray whitespace is tidied.
- **AC2 — platform exemption**: two `owner_account_id IS NULL` businesses share a
  name.
- **AC3 — the default is always free**: base → `-1` → `-2`; a gap left by a rename
  is filled, so the suffix is not a count; signing up takes a free name.
- **AC4 — the rename reports its effects**: the site keeps saying the old name and
  the report says so; page copy naming the business is offered as pages to read,
  and a second rename finds nothing; correcting a name's case does not collide with
  itself; renaming onto a sibling is refused, names it, and writes nothing; an
  all-whitespace name is refused.
- **AC5 — nothing else moves**: no revision is written and the site key does not
  change.
- **AC6 — there is a rename path**: an owner renames through the Worker and the
  effects reach the browser; taken (409) and empty (400) are told apart; a
  non-owner is refused and nothing is written.

`tests/test_UAT_FC_REQ-237_settings_surface.test.ts` — the shipped declaration
through the framework's own validator, and the production operations over a
doubled port.

- The declaration validates with its travelling grant beside `l1` and `library`;
  reading is separable from changing; every group is effect-homogeneous; the grant
  is not in `instances.json`.
- The rename hands back offers rather than a boolean, under keys that say the site
  was not touched (`site_says`, `site_is_out_of_date`).
- An empty name never reaches the host; a conversation with no business is refused
  with the declared code; the surface does not pre-judge a collision it cannot see.
- It is its own surface, and its prose separates the record from what the site
  says, and both from the public address.

-