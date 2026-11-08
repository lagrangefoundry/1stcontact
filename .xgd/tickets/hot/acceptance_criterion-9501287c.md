---
uid: acceptance_criterion-9501287c
id: AC-2450
type: acceptance_criterion
title: A captured flow that varies folds to one multi-run text node laid out in the
  flow root's box
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:29.373430+00:00'
updated_at: '2026-11-08T13:28:29.373430+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
When a captured inline flow's runs differ in fill, size, weight or slope (e.g. a headline with one coloured word), the fold produces a single L1 text node whose `text` is a run array (not a flattened string) with the words in flow order, and at least one run carrying axes. That node's geometry is the flow root's rectangle, not the box of any one fragment, and it carries no no-wrap width pin.

## Verification
Fold a capture containing a varying flow; assert one text node replaces the fragments, its runs concatenate to the flow's text, the varying run carries the differing axis, its rect equals the flow root's rect, and it has no no-wrap threshold.
