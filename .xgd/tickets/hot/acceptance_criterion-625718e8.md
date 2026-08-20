---
uid: acceptance_criterion-625718e8
id: AC-1309
type: acceptance_criterion
title: resolveSurfaceGradient authors a gradient value into a panel surface fill,
  and no fill when under-specified
created_by: xgd
created_at: '2026-08-20T04:34:14.951994+00:00'
updated_at: '2026-08-20T05:03:48.566225+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The shared surface-gradient resolver (`resolveSurfaceGradient`) turns an authored gradient value into a panel/card surface fill declaration, independently of any module's render:

- Given a direction and **two or more** stops, it returns a `background-image: linear-gradient(...)` declaration carrying the resolved direction (a degrees literal emitted as `<n>deg`, a direction alias emitted as its keyword form) and the stop colours in painted order, each stop with its authored position or an evenly distributed one when no position was authored. The declaration is a surface fill — it supersedes the element's solid fill and carries no `background-clip: text` and no forced transparent text (that is the text-fill resolver's job, not this one's).
- Given **fewer than two** stops the value is under-specified and it returns an empty declaration (no fill), so the caller keeps its solid treatment.
- Stop colours are `#hex` literals only. A stop colour that is not a literal — including a palette-role name, which REQ-114 retired — drops the **whole** gradient to an empty declaration rather than emitting a partial sweep in a colour the author never chose.

## Verification
Call `resolveSurfaceGradient` directly with a gradient declaring a direction and two `#hex` stops; assert the returned string is a `background-image: linear-gradient(...)` declaration carrying the resolved direction and both stop colours in painted order, and that it contains no `background-clip` or `color:` clause. Call it with an authored stop position and assert the position is emitted verbatim; call it with unpositioned stops and assert the positions are distributed across 0–100%. Call it with a single stop and assert an empty string. Call it with a palette-role name as one stop colour and assert an empty string.