---
uid: report-c37e0c2f
id: REPORT-6992
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:46:16.183478+00:00'
updated_at: '2026-10-31T21:46:16.183478+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-34
  conflict_sha: d46756fefa43ca8709acb13d64abccb2ac91d961
  conflict_files:
  - apps/control-app/src/material.ts
  - package.json
  - tests/reconciliation-site-asset-listing.test.ts
  - tests/test_UAT_FC_BUG-44_surface_tells_the_truth.test.ts
  - tools/generate/src/cli/ai/l1-surface.json
---

cherry-pick of d46756fefa43ca8709acb13d64abccb2ac91d961 conflicted on: apps/control-app/src/material.ts, package.json, tests/reconciliation-site-asset-listing.test.ts, tests/test_UAT_FC_BUG-44_surface_tells_the_truth.test.ts, tools/generate/src/cli/ai/l1-surface.json