---
uid: acceptance_criterion-d1e65a2f
id: AC-2028
type: acceptance_criterion
title: A picture missing the field its kind needs is refused naming that field; an
  unknown bundle or revision is not found
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:10.090328+00:00'
updated_at: '2026-10-27T19:42:10.090328+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A picture whose `kind` requires a field that is absent (`reference` without `bundle`, `revision` without `revision`, `url` without `url`) is refused with the PICTURE_INVALID error whose message names both the kind and the missing field, and no browser is used. A `reference` naming a bundle the site does not hold, or a `revision` naming one that does not exist, is refused with NOT_FOUND.

## Verification
Call `screenshot` with each of the three incomplete pictures and assert the PICTURE_INVALID code and a message containing the kind and field name, with the browser double unused. Call with an unknown bundle and an unknown revision id and assert NOT_FOUND.
