---
uid: acceptance_criterion-ab03e3b2
id: AC-2451
type: acceptance_criterion
title: A captured flow whose runs vary in nothing is left as separate nodes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:30.075093+00:00'
updated_at: '2026-11-08T13:28:30.075093+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
A captured inline flow whose runs all share the same fill, size, weight and slope is not rejoined: the fold emits the runs as separate text nodes exactly as it would without flow information. This includes a flow whose runs differ only in vertical alignment (baseline shift).

## Verification
Fold a capture with a multi-run flow of identical type, and one differing only in vertical-align; assert no run-array node is produced for either and each run remains its own node.
