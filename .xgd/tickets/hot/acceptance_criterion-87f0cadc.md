---
uid: acceptance_criterion-87f0cadc
id: AC-2033
type: acceptance_criterion
title: A picture still over the byte ceiling after reduction is refused, with what
  to do instead
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:21.107821+00:00'
updated_at: '2026-10-27T20:13:15.170481+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
If a picture is larger than 3 MiB after reduction, `screenshot` returns no image and is refused with a message that states the picture's byte size, the ceiling, and that the model should take it at a narrower viewport or compare instead.

## Verification
Feed a reduced-but-incompressible picture over 3 MiB through `screenshot` and assert the refusal, the absence of any image block, and that the message contains both byte counts and the suggested alternative.

> Note: rewritten in place to the running behaviour by fix_plan report-9dd59176 (story-58b2cec4, iteration 2); "PICTURE_INVALID-class" was dropped because neither this branch nor xgd-working's tip attaches a code to picture refusals and REQ-157 does not require one.
