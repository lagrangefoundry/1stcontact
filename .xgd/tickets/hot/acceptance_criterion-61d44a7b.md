---
uid: acceptance_criterion-61d44a7b
id: AC-2540
type: acceptance_criterion
title: edit_image stores a valid recipe on the Library item, reports image/edits/original/size,
  and leaves the original bytes untouched
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:46.045283+00:00'
updated_at: '2026-11-09T18:25:46.045283+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
When the assistant calls `edit_image` on a Library picture with a valid recipe, the recipe is stored on that Library item and the original bytes are not changed. A valid recipe is an ordered list using only `crop`, `rotate`, `resize` and `adjust`.

The call answers with:
- `image`: the picture's name;
- `edits`: the complete recipe as stored, in the order given;
- `original`: `{width, height}` of the stored bytes;
- `size`: `{width, height}` the recipe produces.

## Verification
1. Upload a raster picture, then call `edit_image` with a two-operation recipe.
2. Assert the response carries all four fields, and that `edits` equals the list sent.
3. Call `list_image_edits` and assert it returns the same recipe.
4. Fetch the file route with `?original=1` and assert the bytes are byte-identical to the upload.
