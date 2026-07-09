---
uid: acceptance_criterion-12c54fcd
id: AC-462
type: acceptance_criterion
title: Hidden content is excluded from the capture
created_by: xgd
created_at: '2026-07-09T20:12:21.051348+00:00'
updated_at: '2026-07-09T20:12:21.051348+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Content that is not visibly painted — an element with `display:none`, `visibility:hidden`, zero opacity, or an off-screen/closed drawer region — does not appear anywhere in the structured essence. Only what a user actually sees is captured.

## Verification
Capture a fixture containing a `display:none` block and an off-screen drawer, each carrying a unique sentinel string. Assert neither sentinel string appears anywhere in the serialized essence.
