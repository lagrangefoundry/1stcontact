---
uid: acceptance_criterion-8252449b
id: AC-886
type: acceptance_criterion
title: The region is stable while the pointer is still — costing no animation frames
  — deforms while it moves, and returns after the reader leaves the window and comes
  back
created_by: xgd
created_at: '2026-08-06T18:09:44.781388+00:00'
updated_at: '2026-08-09T05:41:32.772628+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
While the pointer is still, the region is completely stable: two observations of
the page taken apart from one another are identical, and the page schedules no
animation frames at all — stillness is met by the page not running rather than by
motion being damped.

While the pointer moves, the region deforms: its outline pulls apart and its edge
flickers, so marks near the boundary drop in and out of the accent colour as the
hand travels. The deformation scales with how fast the pointer is moving and
settles back to the stable rough outline once it stops. The centre of the region
does not flicker — only its edge.

The accent survives the reader's attention leaving and returning. It fades out
when the pointer leaves the window or the window loses focus, and it comes back
on the next pointer movement — every time, not only the first time in a session.

## Verification
Drive a pointer onto an accented page, park it, and assert two observations
several hundred milliseconds apart are identical and that no animation frames
were scheduled in between. Move the pointer and assert consecutive frames differ,
that the region's outline spreads measurably, and that its centre does not. Stop
and assert the outline returns to its resting extent. Take the window's focus
away and return it, move the pointer again, and assert the accent is presented —
then repeat the cycle and assert it is presented again.