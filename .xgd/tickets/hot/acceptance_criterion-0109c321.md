---
uid: acceptance_criterion-0109c321
id: AC-885
type: acceptance_criterion
title: The region is deterministically rough and bounded by the reach the author declared,
  a roughness of zero is a plain circle, and the declared softness is the width of
  its feathered edge
created_by: xgd
created_at: '2026-08-06T18:09:40.197313+00:00'
updated_at: '2026-08-08T00:43:47.719731+00:00'
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
The region the accent is drawn inside is rough rather than circular: its outline
bulges and falls back around its circumference with no evident symmetry, and it is
the same rough outline every time the same definition is rendered.

Its declared reach is an outer bound. No part of the region extends beyond the
reach the definition asked for — a rougher outline eats inward rather than growing
outward — and every part of the region is contiguous with the point under the
cursor, so no fragment of accent floats free of the reader's hand.

The two dials behave as declared at their limits: a roughness of zero presents a
plain circle of the declared reach, and increasing roughness makes the outline
progressively more irregular. The declared softness is the width over which the
accent fades out at the region's edge, with zero being a hard cut.

## Verification
Render the same accented definition twice and assert the region's resting outline
is identical. Assert the outline's extent varies around its circumference and
that no part exceeds the declared reach. Assert every feature of the region
overlaps the cursor point. Render with roughness zero and assert the region is a
plain circle of the declared reach; render at a higher roughness and assert
greater variation. Render with two different softness values and assert the edge
fade spans the declared width in each.