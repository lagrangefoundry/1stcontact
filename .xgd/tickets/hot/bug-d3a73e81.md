---
uid: bug-d3a73e81
id: BUG-91
type: bug
title: 'Site builder: a stored module pinned to an older contract version dark-sites
  the preview'
created_by: martin-github@westhead.me
created_at: '2026-09-14T03:58:02.986258+00:00'
updated_at: '2026-09-14T17:51:39.895729+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-463798e9
  severity: high
  commits:
  - working_sha: c1d5734585b7cb28c85f19854e48774fc412a88b
    reconcile_sha: null
    main_sha: null
  version: 0.2.197
  story_points: 3
---

## Symptom

The builder's site preview pane shows nothing but an error:

```
Module not found in catalog: 'contact-form' v5. Known modules:
contact-form@7, carousel@3, account-portal@1, account-chrome@2.
```

Confirmed in the local D1 store: **five of six sites** hold at least one
`contact-form` instance pinned at v5, while the catalog ships v7.

```
site_62d3d0097bbc…  home.json        contact-form@5 (beta-form), account-chrome@2
site_d669b155d612…  home.json        contact-form@5 ×2
site_936dd7c92e5e…  home.json        contact-form@5 (enquiry)
site_bca807fc7cdd…  home.json        contact-form@5 (signup)
site_bca807fc7cdd…  whitepapers.json contact-form@5 (signup)
```

Every page carrying one of those instances refuses to render at all.

## Root cause

This is [[BUG-85]]'s failure, recurring. `contact-form` was bumped 5 → 6
([[REQ-241]]) and 6 → 7 ([[REQ-243]]). Both bumps were done correctly by the
letter of BUG-85 — `migrations[6]` and `migrations[7]` are declared and the
`missingMigrations` CI guard passes — and the repo fixtures under
`storage/sites/` were carried to v7. The live D1 store was not, because
*nothing carries it*: `upgradeSiteModules` is opt-in, driven by
`1c module upgrade --write` or `POST /api/modules/upgrade`, and neither runs
unless an operator remembers to run it.

So BUG-85 built the migration machinery and the guard that a bump declares one,
but left the last step — actually applying it to stored data — as a manual act
that the bumping commit has no way to perform (the store it must reach is D1,
which the commit cannot touch). The predictable consequence is the one BUG-85's
own doc comment names: *"a migration performed by editing files in the repo can
only ever reach the fixtures, and the live stores are structurally guaranteed to
be missed."* Two bumps later, the live stores were missed.

The render path then meets a v5 pin, asks the registry for `contact-form@5`,
and throws — a hard catalog miss for data the framework demonstrably knows how
to carry forward.

## Fix

**Upgrade stored module instances on load, in `assembleSite`.**

`assembleSite` (`tools/generate/src/store/assemble.ts`) is the single point
every adapter — filesystem, D1, in-memory — funnels a definition through on its
way to being a `LoadedSite`. It already holds a decision of exactly this shape:
REQ-114 resolves the palette overlay there, so that *a loaded site has literal
colours* and no consumer downstream can tell which form was authored. The same
reasoning applies to a version pin: **a loaded site has current-contract module
instances**, and the stored pin is a storage concern, not a render one.

Concretely, before `validateSite` runs, every page's `modules` list is carried
through `upgradePageModules`. Ordering is load-bearing:

- **Before `validateSite`**, so the definition that is structurally validated is
  the definition that renders, and so migration-authored slots (account-chrome
  v1 → v2 synthesises `sent` and `error` cards, borrowing the dialog's text
  colour, which may be a palette reference) are covered by the dangling-ref
  check.
- **Therefore before `resolveL1Palette`**, so any palette reference a migration
  carried into a new slot resolves like any other.

A module entry that is not shaped like an instance (`type` not a string,
`version` not an integer) is passed through untouched, so a malformed page still
gets `validateSite`'s structural error rather than an upgrade-path exception.
A `type` the catalog has never heard of is likewise left alone — `upgradePageModules`
already declines to have an opinion about it — and still reaches the render as
the same catalog miss it is today.

### This applies, it does not write

Nothing is written back to the store. The stored pin stays where it is until an
ordinary edit rewrites the page, or until an operator runs the existing
`1c module upgrade --write` / `POST /api/modules/upgrade`. That repair stays
exactly as BUG-85 built it — reported by default, applied only when asked — and
keeps reporting these instances as stale, which is correct: they are.

What changes is only that being stale no longer takes the site down. The
guarantee this buys is the one the CI guard was always implying but could not
deliver on its own: **because a bump cannot land without a declared migration
path, a stored instance can always be carried to the current contract — so the
render path should carry it rather than refuse it.**

### Why not just repair the data

Repairing the five sites fixes today and nothing else. The next bump orphans
every store again, silently, and the operator finds out when a page goes dark.
The data repair is available and unchanged; this makes it unnecessary as a
precondition for rendering.

## Test plan

`tests/test_UAT_FC_BUG-91_upgrade_on_load.test.ts`, over the in-memory store
(the port, for BUG-85's reason — a test written against `node:fs` would have the
same reach the broken migration did):

1. A site whose page holds a real `contact-form@5` instance — the exact shape in
   the live store — loads, and the loaded site's instance reads `version: 7`
   with v6's `assets` list and v7's `template` present.
2. That same site renders. Previously `renderSiteFiles` threw the catalog miss;
   now it produces HTML. This is the user-visible symptom, asserted directly.
3. Loading writes nothing: the store's pages still read `version: 5` afterwards,
   and `upgradeSiteModules` still reports them stale.
4. An instance already at the current version is returned untouched.
5. A page whose `modules` entry is malformed still comes back as a
   `validateSite` error rather than an exception from the upgrade path.