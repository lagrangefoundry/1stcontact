---
uid: request-1e65c6db
id: REQ-237
type: request
title: The business name is stored once, and may change at any time
created_by: EPIC-4
created_at: '2026-09-13T21:17:12.597808+00:00'
updated_at: '2026-09-13T22:06:46.582944+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  depends_on:
  - request-03519106
  epic_parent: epic-0728e1c5
  auto_merge_back: true
  needs_review: false
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