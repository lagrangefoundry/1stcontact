---
uid: acceptance_criterion-a0cb5f07
id: AC-2582
type: acceptance_criterion
title: place_on_site copies a republishable item to draft assets and returns the /assets
  handle, description and placed_on
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:47.021123+00:00'
updated_at: '2026-11-09T23:18:47.021123+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

`place_on_site` on a republishable item copies the item's bytes into the draft assets of the site this conversation is about, and returns:
- `item`: the catalogue name
- `asset`: the name the bytes landed under, which is the client's filename by default or the trimmed `as` value when one is given
- `src`: exactly `/assets/<asset>`
- `size`: the number of bytes copied
- `description`: the item's recorded description
- `placed_on`: re-read after placing, so it includes this site

After the call:
- the site's asset listing contains `<asset>`;
- the item's `placed_on` includes this site;
- `list_library` with `placed: true` includes the item.

The site's published (public) output is unchanged by placing.

## Verification

Seed an owned, republishable image with filename `logo.png` and a description. Call `place_on_site` with `{item: <name>}`. Assert that `asset` is `logo.png`, that `src` is `/assets/logo.png`, that `size` equals the byte length, that `description` matches the recorded description, and that `placed_on` contains the session slug.

Then assert that the draft asset store holds `logo.png`, that `list_library` with `placed: true` lists the item, and that the published site is unchanged.

Repeat with `as: 'hero.png'` and assert that the asset is stored as `hero.png`.
