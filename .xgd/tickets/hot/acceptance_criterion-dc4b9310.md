---
uid: acceptance_criterion-dc4b9310
id: AC-2544
type: acceptance_criterion
title: A malformed recipe is refused with a reason naming the mistake, and the stored
  recipe is left unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:51.963508+00:00'
updated_at: '2026-11-09T20:22:53.004455+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
A recipe that is malformed on its own terms is refused with a message naming what was wrong, and the recipe is left exactly as it was.

Two kinds of mistake are refused at the assistant's boundary by the tool's declared parameter type (`edits`: a list of objects), before `edit_image` runs. They carry the framework's parameter error, which names the mistake, rather than the operation's REFUSED code:
- **Not an object.** An entry that is not an object (`'edits' entry N must be an object`).
- **Not a list.** A recipe that is not a list (`'edits' must be an array`).

Every other case reaches the operation and is refused with code REFUSED:
- **Unknown operation**, including `flip`. The message names the requested op and lists the whole vocabulary.
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
2. Call `edit_image` through the assistant with each malformed case.
3. Assert an error result whose message contains the identifying phrase for that case; for every case except the two declared-type cases, assert it is the operation's REFUSED result.
4. Assert `list_image_edits` still returns the known recipe.

Separately, assert that `adjust saturation 0` is accepted.
