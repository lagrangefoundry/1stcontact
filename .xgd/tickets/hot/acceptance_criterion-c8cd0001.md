---
uid: acceptance_criterion-c8cd0001
id: AC-2541
type: acceptance_criterion
title: list_image_edits returns the recipe in the edit_image shape; an unedited picture
  answers an empty list with size equal to original
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:47.167623+00:00'
updated_at: '2026-11-09T18:39:18.942583+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
`list_image_edits` answers in the same shape as `edit_image`: `image`, `edits`, `original` and `size`.

For a picture that has never been edited, it answers with:
- `edits: []`;
- `size` equal to `original`.

This is an ordinary answer, not an error.

## Verification
1. Call `list_image_edits` on a freshly uploaded picture.
2. Assert an empty `edits` list and identical `original` and `size`.
3. Edit the picture, call `list_image_edits` again, and assert it returns the stored recipe and the resulting `size`.