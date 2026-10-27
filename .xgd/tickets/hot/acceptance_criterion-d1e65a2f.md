---
uid: acceptance_criterion-d1e65a2f
id: AC-2028
type: acceptance_criterion
title: A picture missing the field its kind needs is refused naming that field; a
  reference with no screenshot is refused naming it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:10.090328+00:00'
updated_at: '2026-10-27T20:44:33.739241+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A picture whose `kind` requires a field that is absent (`reference` without `bundle`, `revision` without `revision`, `url` without `url`) is refused, with a message naming both the kind and the missing field, and no browser is used. A `reference` naming a bundle the site does not hold is refused with a message naming that reference and telling the model to list the references. Neither refusal carries image bytes.

## Verification
Call `screenshot` with each of the three incomplete pictures and assert the refusal message contains the kind and the field name, with the browser double unused. Call with an unknown bundle and assert the refusal names it and points at listing references. Assert no PNG base64 appears in any refusal.

> Note: rewritten in place to the running behaviour by fix_plan report-9dd59176 (story-58b2cec4, iteration 2); the PICTURE_INVALID/NOT_FOUND code tokens and the unknown-revision clause were dropped because neither this branch nor xgd-working's tip implements them and REQ-157 does not require them.