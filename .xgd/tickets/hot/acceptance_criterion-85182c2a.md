---
uid: acceptance_criterion-85182c2a
id: AC-2545
type: acceptance_criterion
title: A recipe impossible for this picture's real pixels (enlarging resize, sub-pixel
  crop) is refused before any write
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:53.780141+00:00'
updated_at: '2026-11-09T18:25:53.780141+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
A recipe that is well formed but impossible for this particular picture is refused with code REFUSED before anything is written. The recipe is left unchanged. Two cases are refused:
- **Resize that enlarges.** A `resize` whose width or height exceeds the picture's dimensions at that point in the recipe, which already accounts for earlier crops. The message gives both the requested and the current size.
- **Crop that rounds to nothing.** A `crop` that rounds to less than one pixel of the picture at that point.

## Verification
1. On a 1000×500 picture, `[resize width 1200]` is refused.
2. `[crop left 0.5, resize width 800]` is refused, because the picture is 500 wide at that point. `[crop left 0.5, resize width 400]` is accepted.
3. On a tiny picture (e.g. 3×3), a crop whose fractions are legal but leave under one pixel is refused.
4. In every refused case, `list_image_edits` returns the prior recipe.
