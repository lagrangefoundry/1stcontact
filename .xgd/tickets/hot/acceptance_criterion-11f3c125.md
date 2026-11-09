---
uid: acceptance_criterion-11f3c125
id: AC-2542
type: acceptance_criterion
title: 'edit_image replaces the recipe whole: omitted operations are removed, [] restores
  the original, an absent edits list is refused'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:48.804062+00:00'
updated_at: '2026-11-09T20:22:52.053479+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
`edit_image` replaces the recipe whole:
- Operations absent from the list sent are removed from the picture.
- `edits: []` returns the picture to exactly its stored state.
- A call that omits `edits` altogether (absent or null) is refused with a reason naming the missing `edits` parameter, and the existing recipe is left unchanged. At the assistant's boundary this refusal comes from the tool declaration's required parameter (the framework's parameter error, `edit_image requires parameter 'edits'`), before the operation runs; it is not the operation's REFUSED code. The operation's own "no list of edits was given" refusal stands behind it only for a caller that bypasses the declaration.

## Verification
1. Store a crop+rotate recipe, then send only the rotate, and assert `list_image_edits` returns only the rotate.
2. Send `[]` and assert an empty recipe; the file route then serves bytes identical to the original.
3. Store a recipe, call `edit_image` through the assistant with no `edits` parameter and with `edits: null`, and assert each is an error naming the missing `edits` parameter, with the recipe unchanged.
