---
uid: report-93a197ee
id: REPORT-6972
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:33:17.561815+00:00'
updated_at: '2026-10-31T21:33:17.561815+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-34
  conflict_sha: 9805ee506e68fa9ac1bcb5d533a56d2ef9a5f139
  conflict_files:
  - apps/control-app/src/material.ts
  - package.json
  - tests/test_UAT_FC_REQ-130_beyond_l1.test.ts
  - tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts
  - tools/generate/src/cli/ai/l1-surface.json
  - tools/generate/src/cli/edit.ts
---

cherry-pick of 9805ee506e68fa9ac1bcb5d533a56d2ef9a5f139 conflicted on: apps/control-app/src/material.ts, package.json, tests/test_UAT_FC_REQ-130_beyond_l1.test.ts, tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts, tools/generate/src/cli/ai/l1-surface.json, tools/generate/src/cli/edit.ts