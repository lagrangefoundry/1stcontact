---
uid: report-ed8e4f03
id: REPORT-8110
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:07:11.561310+00:00'
updated_at: '2026-11-02T01:07:11.561310+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-37
  conflict_sha: 798310c3632ee0f06930b0de01a9768f5cad8784
  conflict_files:
  - apps/control-app/src/knowledge.ts
  - apps/control-app/src/session-knowledge.ts
  - apps/control-app/src/system-knowledge.ts
  - tests/test_UAT_FC_REQ-123_system_kb.test.ts
  - tools/generate/src/cli/kb.ts
---

cherry-pick of 798310c3632ee0f06930b0de01a9768f5cad8784 conflicted on: apps/control-app/src/knowledge.ts, apps/control-app/src/session-knowledge.ts, apps/control-app/src/system-knowledge.ts, tests/test_UAT_FC_REQ-123_system_kb.test.ts, tools/generate/src/cli/kb.ts