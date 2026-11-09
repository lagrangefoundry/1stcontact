---
uid: acceptance_criterion-4a9e4fef
id: AC-2551
type: acceptance_criterion
title: 'Renditions are content-addressed per tenant outside the material keyspace:
  repeat requests do not re-transform and the keyspace the orphan sweep lists holds
  no rendition'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:26:02.344048+00:00'
updated_at: '2026-11-09T20:23:37.907516+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
A rendered picture is stored once and reused:
- Asking again for the same original, recipe and width returns the stored result without a second transform.
- Changing the recipe or the width produces a new render.

Stored renditions are:
- kept per tenant, under a rendition prefix of their own (`rendition/<tenant>/`);
- outside the material store's tenant keyspace (`t/<tenant>/`), the keyspace that store's orphan sweep lists. Listing that keyspace returns the picture's own blob and no rendition, so a rendition is never an input to the sweep.

The sweep itself belongs to the ticketing component and is not part of this repository, so this criterion is about where renditions are written, which is the property this repository controls; it does not claim to run the sweep.

## Verification
1. With a counting binding double and an R2 bucket, fetch the same edited picture twice and assert exactly one transform.
2. Change the width, and then the recipe, fetch again each time, and assert a new transform each time.
3. Assert every rendition object's key begins with `rendition/<tenant>/` and not with `t/<tenant>/`.
4. List the material store's `t/<tenant>/` keyspace and assert it holds the picture's blob and none of the rendition keys; assert a later fetch still performs no transform.
