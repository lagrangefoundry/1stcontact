---
uid: acceptance_criterion-ab81536c
id: AC-827
type: acceptance_criterion
title: A container's stagger spaces its revealing children by their position, a non-revealing
  child consumes no slot, and a child's own delay adds to its stagger share
created_by: xgd
created_at: '2026-08-06T02:04:36.642107+00:00'
updated_at: '2026-08-09T05:40:59.552923+00:00'
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
A container declaring a stagger interval presents its revealing children
arriving one after another rather than together: the first child arrives with no
added delay, the second after one interval, the third after two, and so on in
document order.

A child that declares no entrance does not consume a position in that count — a
decorative spacer sitting between two cards does not silently buy itself a slot
and push everything after it out of step.

A child that declares its own delay is presented with that delay *added* to its
stagger share, so a per-node delay tunes a stagger rather than fighting it.

A container declaring no stagger presents all of its revealing children with
only their own declared delays.

## Verification
Render a container carrying a stagger interval over a mix of revealing and
non-revealing children, one of which declares its own delay, and assert each
revealing child's presented delay equals its index among the *revealing*
children multiplied by the interval, plus its own declared delay. Assert the
non-revealing child shifts no sibling's delay, and that removing the stagger
leaves each child with only its own delay.