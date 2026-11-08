---
uid: acceptance_criterion-64341594
id: AC-2457
type: acceptance_criterion
title: Text-height estimation over a multi-run node is consistent with the same copy
  as one run
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:34.277311+00:00'
updated_at: '2026-11-08T13:51:38.820283+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
The estimated natural height of a multi-run text node whose runs carry no size change equals the estimate for the same words as a plain string at the same width. A run set at a smaller `sizeScale` consumes less of the line than the same words at full size, so the estimate never exceeds that of the full-size single-run copy.

## Verification
Estimate heights for a plain string and its run-split equivalent (no scale) at several widths; assert equal. Estimate a node with a short lead run and a long (multi-line) run, once with the long run at full size and once at sizeScale 0.5; assert the scaled estimate is strictly less.