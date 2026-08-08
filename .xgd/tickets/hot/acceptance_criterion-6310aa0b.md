---
uid: acceptance_criterion-6310aa0b
id: AC-828
type: acceptance_criterion
title: 'A node carrying both an entrance and interaction states keeps both: it arrives
  on scroll with its own timing and still responds to pointer and keyboard afterwards,
  and a node with interaction alone is presented exactly as before entrance motion
  existed'
created_by: xgd
created_at: '2026-08-06T02:04:52.544235+00:00'
updated_at: '2026-08-08T00:43:06.284431+00:00'
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
A node declaring both an entrance and a hover or focus state presents both
behaviours: it arrives on scroll over the entrance's own duration, curve and
delay, and once settled it still shows its hover and focus deltas over the
interaction's own duration and curve. Neither behaviour cancels the other, and
the entrance's movement and the state's movement do not overwrite one another —
a node lifting on hover after arriving is presented at the combined position.

The two behaviours' timings are presented together as one coherent animation
description on the node, each property keeping its own duration and delay, so a
node arriving with a 600ms entrance and hovering with a 160ms transition shows
each at its own speed.

A node declaring interaction states and no entrance is presented exactly as it
was before entrance motion existed in the substrate — adding this capability
changed nothing for pages that do not use it.

## Verification
Render a node with both an entrance and a hover state and assert: it presents
its pre-entrance appearance, arrives over the entrance timing, and then presents
the hover delta over the interaction timing — with both properties present in
the node's animation description carrying their own durations and delays. Assert
a node with interaction only produces output identical to the equivalent
rendered before entrance motion was introduced.