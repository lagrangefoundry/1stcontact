---
uid: acceptance_criterion-f6ab65bb
id: AC-592
type: acceptance_criterion
title: One-sided box geometry is reported as a box mismatch, not a silent pass
created_by: xgd
created_at: '2026-07-13T20:13:38.776792+00:00'
updated_at: '2026-07-13T20:20:48.164897+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-79e068e5
  kind: behavior
  regression_only: false
---

## Criterion
When a reference object is paired with a reproduction object and box geometry is
present on exactly one side of the pair (the reproduction has a box but the
reference has none, or vice versa), the object's `box` parameter is reported as
a mismatch. It is NOT rendered as a match/OK, because the two sides were never
actually compared — position and width cannot be verified when one side has no
geometry.

## Verification
Compare a reference object that carries no box geometry against a matched
reproduction object that does. Assert the object's `box` parameter is flagged as
a mismatch (not shown as passing). Contrast with a pair where both sides carry
geometry, whose `box` reflects a real position/size comparison.