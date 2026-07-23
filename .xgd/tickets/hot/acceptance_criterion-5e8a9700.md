---
uid: acceptance_criterion-5e8a9700
id: AC-648
type: acceptance_criterion
title: Produces N-way per-node table with default size columns
created_by: xgd
created_at: '2026-07-19T02:50:53.282543+00:00'
updated_at: '2026-07-23T10:49:37.999549+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Run against a capture bundle that persisted a multi-viewport ladder, with no size flags, the command produces a table with three size columns in order — mobile, tablet, desktop — and one row per DOM node. Each row identifies the node (its verbatim text, or its role for text-free nodes) and shows the node's captured value under each size column.

## Verification
Invoke `responsive-diff` on a fixture bundle whose ladder carries the mobile/tablet/desktop widths. Assert the output reports three size columns labelled mobile/tablet/desktop with their widths, and that a node known to exist in the capture appears as a row with a value in each column.