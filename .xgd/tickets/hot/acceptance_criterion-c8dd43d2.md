---
uid: acceptance_criterion-c8dd43d2
id: AC-694
type: acceptance_criterion
title: Capture emits an advisory structural-hint sidecar of relationships and breakpoints
created_by: xgd
created_at: '2026-07-22T19:42:35.626073+00:00'
updated_at: '2026-07-22T19:49:50.359845+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
The same capture emits an advisory structural-hint sidecar reporting, per visible
element: ancestry (parent identifier), the parent's computed layout (display,
flex-direction, justify-content, gap, grid template columns), authored sizing unit
per axis (percent / fr / auto / clamp / viewport vs px), position mode, and a
sibling-repetition count; and, for the page, its real @media breakpoints in
ascending order.

## Verification
Capture a fixture whose layout uses a flex container with a percentage-sized child
and a real @media breakpoint; assert the sidecar reports the parent's layout mode
and justify-content, a percent sizing unit on the child, and the breakpoint value
in the ascending breakpoint list.