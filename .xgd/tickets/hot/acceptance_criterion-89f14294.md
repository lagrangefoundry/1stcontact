---
uid: acceptance_criterion-89f14294
id: AC-489
type: acceptance_criterion
title: A malformed or raw-CSS motion is rejected with a path-pointed validation error
created_by: xgd
created_at: '2026-07-09T20:51:59.404004+00:00'
updated_at: '2026-07-09T20:51:59.404004+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b13e15c5
  kind: behavior
  regression_only: false
---

## Criterion
Site validation fails, with an error that identifies the offending field's path, when a motion: uses a raw `cubic-bezier(...)` (or any non-enum) `easing`; uses a `type` or `trigger` outside the permitted set; carries a negative or non-integer `duration`/`delay`; or includes any additional (raw-CSS/style/keyframe) field beyond the permitted keys. Motion is structured-only — no raw-CSS escape hatch.

## Verification
Submit sites each violating one rule above and assert validation reports failure with a path pointing at the motion field. Assert that an added arbitrary property on the motion object (e.g. a raw style/css key) is likewise rejected.
