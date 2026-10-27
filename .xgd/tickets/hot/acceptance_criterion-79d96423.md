---
uid: acceptance_criterion-79d96423
id: AC-2037
type: acceptance_criterion
title: compare anchors both pictures top-left, compares only their common rectangle,
  and reports that size
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:55.813321+00:00'
updated_at: '2026-10-27T20:46:55.813321+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
When the two pictures differ in size, `compare` does not refuse. It anchors both pictures at the top-left corner and compares only the rectangle they share: the smaller width by the smaller height. `size` reports that rectangle rather than either input's dimensions. Two pictures that are identical over the shared rectangle report a mean difference of 0, whatever lies outside it.

## Verification
Seed a 100×200 reference and serve an 80×150 draft of the same solid colour. Call `compare` with reference and draft. Assert `size` equals `{width: 80, height: 150}` and `meanDifference` equals 0.
