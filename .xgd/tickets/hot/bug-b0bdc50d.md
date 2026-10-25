---
uid: bug-b0bdc50d
id: BUG-213
type: bug
title: place_on_site with `as` returns the existing asset instead of a renamed copy,
  so one image can't carry several crops
created_by: xgd
created_at: '2026-10-17T22:29:35.885091+00:00'
updated_at: '2026-10-18T00:13:00.490920+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-43c5011d
  epic_parent: epic-95bc3b15
  severity: medium
  commits:
  - working_sha: a0bab7616b839bec0f7f37f788a2fa9971a98824
    reconcile_sha: null
    main_sha: null
  - working_sha: 36153bd8f367ae0a1aad5c7ae5ec616cc0c3615c
    reconcile_sha: null
    main_sha: null
  version: 0.2.520
  story_points: 5
---

## What I was doing
I needed several differently cropped versions of one uploaded image, a montage of 6 photos. `edit_image` holds one recipe per picture, so the plan was: make several site copies of the same Library item, then give each its own crop.

## Calls
`place_on_site` with `item: "IMAGE-1"` and `as: "team-shopfront.png"`, then the same with 5 other `as` names, all in one parallel batch.

## Expected
Per the tool description: "If the name is already taken on the site it is renamed rather than overwritten... What came back tells you the name it actually got." With a new `as` name, I expected a new site asset under that name, 6 in total.

## Actual
All 6 calls returned `asset: "Bob-s-Salon_-Hair-Heart-Community.png"` and `src: "/assets/Bob-s-Salon_-Hair-Heart-Community.png"`, which is the asset already placed. `list_assets` still showed a single image. The `as` parameter seems to be ignored when the item is already placed.

## Impact
There's no way to get several crops of one upload. An uploaded contact sheet or montage can only appear whole, or with a single crop everywhere it is used.

## Suggestion (the gap, separately from the fix)
Either honour `as` by making a copy, or let `edit_image` / the picture element hold a per-placement crop, so one source can be framed differently in different places.



## Note (EPIC-19, 2026-10-17)

Two separate questions: (1) `place_on_site` must honour `as` — a new name gives a new site asset, as its description promises; that is the bug. (2) Whether a crop should belong to the placement (the picture element) rather than to the site asset is a design question; (1) alone is enough to unblock a montage.



## Agreed scope (2026-10-17)

Root cause: `promoteToSiteAsset` (`apps/control-app/src/material.ts`) treats any call for an item that already has a recorded placement on the site as a RE-placement and writes to the recorded name, discarding the requested name. `placed_as` also holds at most one entry per site, and a site file could not carry a crop of its own (`edit_image` refused it with `NOT_EDITABLE` and redirected to the Library item, whose recipe is then written over every copy).

The fix makes one Library item able to back several differently framed site files:

1. **`as` gives a new copy.** `place_on_site` with an `as` name that is not one of the item's existing site files on this site places a NEW site file under that name (renamed `-2`, `-3`… if the name is taken by anything else) and records it as an additional placement. The item's other placements are untouched. `as` naming one of the item's own existing site files on this site re-places that file. With no `as`, behaviour is as before: the item's first site file is re-placed, or a first placement is made under the client's filename.
2. **Several placements per site.** `placed_as` holds one `{ slug, name }` entry per site file; placing never drops another entry.
3. **Placing in parallel loses nothing.** Placements recorded concurrently (e.g. six `place_on_site` calls in one batch) all survive in `placed_as` — the record is written by compare-and-swap on the ticket version and retried.
4. **A placed site file can be edited on its own.** `edit_image` / `list_image_edits` accept a site file that was placed from a Library item. The recipe is a list over the Library item's ORIGINAL bytes (fractions are fractions of the original, not of the already-cropped site file), is stored on that placement (`placed_as[i].edits`), and re-renders that one site file only. `list_image_edits` on a placed site file reports its own recipe, or the item's when it has none.
5. **A Library edit reaches only the copies that follow it.** Editing the Library item re-renders every placement that has no recipe of its own; a placement with its own recipe keeps its framing.
6. **Site files with no recorded origin** (drawn, imported) remain `NOT_EDITABLE` — there is no original to keep a recipe over. (Out of scope.)

This supersedes BUG-126's "a placed site file is edited through its Library item" rule: editing a site file now frames that file alone.

## Test plan

`tests/test_UAT_FC_BUG-213_*.workers.test.ts` — through the real `library` and `image` surfaces over a real ticket store and site store:
- `as` with a new name yields a new asset under that name; the original placement and its bytes are unchanged; `placed_as` lists both.
- `as` naming the item's existing file re-places it (no new asset); no `as` still re-places the first file.
- six parallel `place_on_site` calls with distinct `as` names yield six assets and six `placed_as` entries.
- `edit_image` on one placed copy changes only that file's bytes; its dimensions are measured from the Library original; `list_image_edits` reports that copy's recipe.
- editing the Library item re-renders a following copy and leaves a self-framed copy unchanged.
- a site file with no origin is still refused `NOT_EDITABLE`.



## Found while implementing

3a. **Concurrent asset writes to one site no longer fail after landing.** The D1 site store's change journal read the counter and inserted at counter+1, so two placements running at once collided on `(site_id, at)` — after the asset bytes had already been written, so `place_on_site` reported failure for a file that was on the site. A journal append that loses its number to a concurrent one now reads again and takes the next (`tools/generate/src/store/d1r2-store.ts`). Covered by the six-in-a-batch UAT.

Superseded tests updated in place: BUG-126 AC7 (a placed file now answers `list_image_edits` with its own recipe, measured against the Library original) and REQ-219's site-file refusal (now: a site file with no recorded origin has no original to keep a recipe over).