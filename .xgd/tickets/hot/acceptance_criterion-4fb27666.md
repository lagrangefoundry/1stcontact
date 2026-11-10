---
uid: acceptance_criterion-4fb27666
id: AC-2593
type: acceptance_criterion
title: A recorded asset name no longer on the site is reported as not replaced and
  never re-added; the edit still lands and other placements still update
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-10T00:04:53.811412+00:00'
updated_at: '2026-11-10T00:04:53.811412+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
If a picture's recorded asset name is **no longer on the site** (an operator deleted it, or a push overwrote the site), a recipe change does not put the picture back.

- Nothing is written to the site for that placement. The site's asset list is unchanged.
- The recipe change itself still succeeds and the new recipe is stored.
- On the client's recipe route, `republished` reports that placement with its `slug` and `name`, `replaced: false`, and an `error` saying the asset was not found.
- Other placements of the same material are still replaced and report `replaced: true`. One missing name does not stop the others.
- Through the assistant's `edit_image`, the missing name is likewise not re-added, and the edit succeeds.

## Verification
Through the platform's routes, against real D1, real R2 and the real local Images binding:
1. Promote a picture onto a site, then delete that asset from the site. Post a quarter-turn `rotate` recipe to the client's recipe route. The response is 200, the stored recipe is the new one, `republished` has one entry with `replaced: false` and an error, and the site's asset list still lacks the name.
2. Place the same picture on two sites and delete the asset from one. A recipe change reports `replaced: false` for that site and `replaced: true` for the other, whose asset now has the new render.
