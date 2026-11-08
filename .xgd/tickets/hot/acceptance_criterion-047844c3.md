---
uid: acceptance_criterion-047844c3
id: AC-2452
type: acceptance_criterion
title: A rejoined node takes its own axes from the flow's longest run, ties going
  to the earlier run
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:30.769528+00:00'
updated_at: '2026-11-08T13:28:30.769528+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
When the fold rejoins a flow, the node-level axes (family, measure, alignment, per-width size track) come from the run with the most (trimmed) characters, not the first run. When two runs tie for longest, the earlier one wins.

## Verification
Fold a flow that opens with a short emphasised run in a different face followed by a long plain run; assert the node's axes match the long run. Fold a flow with two equally long runs; assert the node's axes match the first of them.
