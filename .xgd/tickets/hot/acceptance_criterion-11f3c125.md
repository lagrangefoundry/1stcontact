---
uid: acceptance_criterion-11f3c125
id: AC-2542
type: acceptance_criterion
title: 'edit_image replaces the recipe whole: omitted operations are removed, [] restores
  the original, an absent edits list is refused'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:48.804062+00:00'
updated_at: '2026-11-09T18:39:18.277149+00:00'
completed_at: null
last_field_updated: status
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
- A call that omits `edits` altogether (absent or null) is refused with a reason saying no list was given, and the existing recipe is left unchanged.

## Verification
1. Store a crop+rotate recipe, then send only the rotate, and assert `list_image_edits` returns only the rotate.
2. Send `[]` and assert an empty recipe; the file route then serves bytes identical to the original.
3. Store a recipe, call `edit_image` with no `edits` parameter, and assert a REFUSED result naming the missing list, with the recipe unchanged.