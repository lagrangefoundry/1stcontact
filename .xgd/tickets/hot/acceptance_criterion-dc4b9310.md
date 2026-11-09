---
uid: acceptance_criterion-dc4b9310
id: AC-2544
type: acceptance_criterion
title: A malformed recipe is refused with a reason naming the mistake, and the stored
  recipe is left unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:51.963508+00:00'
updated_at: '2026-11-09T18:25:51.963508+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
A recipe that is malformed on its own terms is refused with code REFUSED and a message naming what was wrong. The recipe is left exactly as it was. Each of these cases is refused:
- **Unknown operation**, including `flip`. The message names the requested op and lists the whole vocabulary.
- **Not an object.** An entry that is not an object, or a recipe that is not a list.
- **Negative crop inset.** The message says the crop reaches outside the picture.
- **Crop inset above 1.** The message says crops are fractions, not pixels.
- **Crop that leaves nothing.** `left + right ≥ 1`, or `top + bottom ≥ 1`.
- **Crop with every side 0 or absent.** It would trim nothing.
- **Rotate other than 90, 180 or 270.**
- **Resize naming neither width nor height**, or with a non-integer or < 1 size.
- **Adjust naming none of brightness, contrast or saturation**, or with a value outside 0–10. The message explains that 1 is unchanged.
- **Non-numeric parameter.**

A valid `adjust` with `saturation: 0` is accepted.

## Verification
Parameterised UAT:
1. Store a known recipe.
2. Call `edit_image` with each malformed case.
3. Assert a REFUSED result whose message contains the identifying phrase for that case.
4. Assert `list_image_edits` still returns the known recipe.

Separately, assert that `adjust saturation 0` is accepted.
