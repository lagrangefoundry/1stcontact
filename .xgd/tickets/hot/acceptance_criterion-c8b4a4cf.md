---
uid: acceptance_criterion-c8b4a4cf
id: AC-2549
type: acceptance_criterion
title: width= on the material file route scales the picture down for delivery without
  touching the recipe, never enlarges, and never renders a capture member
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:59.345285+00:00'
updated_at: '2026-11-09T18:25:59.345285+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
`?width=<positive integer>` on the material file route serves the current picture scaled down to that width, with the aspect ratio kept. It never changes the stored recipe.

The parameter has no effect when:
- the requested width is at least the picture's current width (nothing is enlarged);
- it is not a positive integer;
- the request names a `member` of a capture bundle. A member is served as its stored bytes and never rendered.

## Verification
1. On a 1000px-wide picture, `?width=400` returns a 400px-wide image, and `list_image_edits` is unchanged afterwards.
2. `?width=2000` returns the picture at its own width.
3. A capture-bundle member fetched with `?width=` returns its stored bytes unchanged.
