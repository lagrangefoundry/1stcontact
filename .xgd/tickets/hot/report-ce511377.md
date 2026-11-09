---
uid: report-ce511377
id: REPORT-12026
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-44'
created_by: xgd
created_at: '2026-11-09T21:09:11.847922+00:00'
updated_at: '2026-11-09T21:09:11.847922+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-44
  conflict_sha: 486810a855c16653ab9bc06a82a3776ac48c6dd3
  conflict_files:
  - tests/reconciliation-builder-workspace-origin.test.ts
  - tests/support/scripted-model-client.ts
  - tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts
  - tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts
---

cherry-pick of 486810a855c16653ab9bc06a82a3776ac48c6dd3 conflicted on: tests/reconciliation-builder-workspace-origin.test.ts, tests/support/scripted-model-client.ts, tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts, tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts