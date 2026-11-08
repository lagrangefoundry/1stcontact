---
uid: acceptance_criterion-8fef7fe5
id: AC-2447
type: acceptance_criterion
title: A run with no axes of its own renders as bare text with no span
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:27.180218+00:00'
updated_at: '2026-11-08T13:28:27.180218+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
In a multi-run node, a run that has no axes (or an empty axes object) is emitted as bare text, not wrapped in a span. The node's markup is therefore the markup the same copy would produce as a plain string, plus exactly one span per run that carries a difference.

## Verification
Render a three-run node where only the middle run has axes; assert exactly one run span is emitted, wrapping the middle run's words, and the first and last runs' words are direct text of the node.
