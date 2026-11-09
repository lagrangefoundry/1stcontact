---
uid: acceptance_criterion-4a9e4fef
id: AC-2551
type: acceptance_criterion
title: 'Renditions are content-addressed per tenant outside the material keyspace:
  repeat requests do not re-transform and the orphan sweep never deletes them'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:26:02.344048+00:00'
updated_at: '2026-11-09T18:39:11.693790+00:00'
completed_at: null
last_field_updated: status
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
- kept per tenant, under a rendition prefix of their own;
- outside the material store's tenant keyspace, so the material store's orphan sweep never lists or deletes them.

## Verification
1. With a counting binding double and an R2 bucket, fetch the same edited picture twice and assert exactly one transform.
2. Change the recipe, fetch again, and assert a second transform.
3. Assert the rendition objects' keys begin with `rendition/<tenant>/` and not with `t/<tenant>/`.
4. Run the orphan sweep and assert the renditions still exist and a later fetch performs no transform.