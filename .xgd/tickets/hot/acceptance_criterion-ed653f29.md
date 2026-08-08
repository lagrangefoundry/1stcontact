---
uid: acceptance_criterion-ed653f29
id: AC-819
type: acceptance_criterion
title: A node declaring hover and focus deltas presents that changed paint on pointer-over
  and on keyboard focus, with one transition governing both the enter and the leave
  over only the properties the states change
created_by: xgd
created_at: '2026-08-06T02:02:43.910900+00:00'
updated_at: '2026-08-08T00:42:43.379331+00:00'
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
A published page whose node declares a hover state (for example a different
surface fill and text colour) and a focus state presents the declared values
when the pointer is over that node and when the node has keyboard focus, and
returns to its base paint when the pointer leaves or focus moves away.

A single transition, declared once for the node rather than inside either state,
applies on the node's settled presentation, so the change animates in *both*
directions over the declared duration and timing curve. The animated property
set is exactly the set of properties the declared states actually change — a
node whose only hover delta is a fill animates the fill and nothing else. The
page never animates every property indiscriminately (which would drag the
node's own responsive geometry into the animation).

Where no transition duration is declared, the state change is presented
immediately with no animation.

## Verification
Render a page containing a node with a declared transition, hover state and
focus state, and observe the published output: the hovered and keyboard-focused
presentations carry the declared values; the settled presentation carries the
transition with the declared duration and curve; the animated property list
names only the properties the states change and is never a blanket "everything".
Render the same node with the states declared but no duration and observe that
no animation is applied.