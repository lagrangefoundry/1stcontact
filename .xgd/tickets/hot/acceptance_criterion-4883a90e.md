---
uid: acceptance_criterion-4883a90e
id: AC-529
type: acceptance_criterion
title: Deltas are ranked so content and structural drift outrank measurement drift
created_by: xgd
created_at: '2026-07-09T22:58:58.300931+00:00'
updated_at: '2026-07-09T22:58:58.300931+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
When multiple deltas are found, the report orders them most-severe first by a fixed property ranking: a missing element ranks highest, then a text/casing delta, then colour, then gradient, then section overlay/scrim, then left-bar border, then font size, then content anchor, then font family, then font weight, then line-height, then left-padding, then letter-spacing. Deltas of equal severity retain document order.

## Verification
Diff a case that simultaneously produces deltas across several tiers (e.g. a missing element, a casing delta, a colour delta, and a line-height delta) and assert the report lists them in the specified severity order.
