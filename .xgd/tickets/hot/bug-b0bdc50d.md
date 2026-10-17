---
uid: bug-b0bdc50d
id: BUG-213
type: bug
title: place_on_site with `as` returns the existing asset instead of a renamed copy,
  so one image can't carry several crops
created_by: xgd
created_at: '2026-10-17T22:29:35.885091+00:00'
updated_at: '2026-10-17T22:47:53.070758+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-43c5011d
  epic_parent: epic-95bc3b15
  severity: medium
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