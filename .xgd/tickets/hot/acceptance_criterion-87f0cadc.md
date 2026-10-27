---
uid: acceptance_criterion-87f0cadc
id: AC-2033
type: acceptance_criterion
title: A picture still over the byte ceiling after reduction is refused, with what
  to do instead
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:21.107821+00:00'
updated_at: '2026-10-27T19:42:21.107821+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
If a picture is larger than 3 MiB after reduction, `screenshot` returns no image and is refused with a PICTURE_INVALID-class error whose message states the picture's byte size, the ceiling, and that the model should take it at a narrower viewport or compare instead.

## Verification
Feed a reduced-but-incompressible picture over 3 MiB through `screenshot` and assert the refusal, the absence of any image block, and that the message contains both byte counts and the suggested alternative.
