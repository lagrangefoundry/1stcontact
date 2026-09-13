---
uid: request-1e65c6db
id: REQ-237
type: request
title: The business name is stored once, and may change at any time
created_by: EPIC-4
created_at: '2026-09-13T21:17:12.597808+00:00'
updated_at: '2026-09-13T21:17:12.597808+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  depends_on:
  - REQ-236
  epic_parent: epic-0728e1c5
  auto_merge_back: true
  needs_review: false
---

## What this is

The business name is stored in **one** place, `tenants.name`, and the customer
may change it whenever they like.

## What is wrong today

It is stored twice. `createStarterSite` writes the business's name into the site
definition at provision — `starterSiteJson(slug, businessName)`,
`apps/control-app/src/identity.ts:936` — and `render.ts:162` reads it back out of
`site.config.businessName` for the page `<title>`. That copy is taken once and
never synchronised, so the two are free to diverge from the first rename onward,
and nothing anywhere notices.

There is also no rename path at all. `tenants.name` can change in principle
([[REQ-190]]: the id is the key, the name is an attribute) and nothing offers it.

## The decision

**`tenants.name` is the store. The site definition stops carrying a copy.**

`config.businessName` leaves the stored site definition — dropped from
`packages/site-schema/src/schema.ts:924` — and becomes a **render-time input**
supplied by the caller from `tenants.name`. The renderer stays a pure function of
what it is handed; what changes is where the caller gets one of its arguments.

The alternative — keep the field and have this API write through to it on every
rename — was rejected for being *more* complexity rather than less: it adds a
sync path, a divergence state, and a "is this draft stale" question, to preserve
a second copy whose only reader is a page title.

Known callers that construct the field and will supply it instead:
`tools/generate/src/cli/scaffold.ts:41`, `tools/generate/src/cli/repro.ts:160`,
`apps/control-app/src/portal.ts:237`.

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
  trip the constraint above on a name the system chose for them. A discriminator
  is appended at provision. A constraint that the system itself can trip is a
  constraint that gets worked around.
- The word stays visibly provisional, which is [[REQ-190]]'s argument and is
  still right *for this name*: it costs nothing to change, so getting it
  approximately right costs nothing and leaving it blank costs something.
  [[BUG-90]] deferred the question of asking for a real one to "the settings
  work"; this is that work.

### Renaming

- **A rename reports its effects, and does not answer a boolean.** The caller —
  the form or the assistant — receives what changed and what is now out of date:
  - the site's published pages still carry the old name in their `<title>` and
    will until the site is published again;
  - page copy may *name* the business in prose the assistant wrote, which is
    authored text and can never be synchronised — it can only be found and
    rewritten.
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
