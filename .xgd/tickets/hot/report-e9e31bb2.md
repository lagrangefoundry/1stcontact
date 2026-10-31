---
uid: report-e9e31bb2
id: REPORT-7078
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:39:36.142141+00:00'
updated_at: '2026-10-31T22:39:36.142141+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-34
  conflict_sha: 2470b440e36d913b3f7bb43ea46084e7c2ececbc
  conflict_files:
  - apps/control-app/src/ai.ts
  - package.json
  - tests/reconciliation-assistant-conversation-knowledge.test.ts
  - tests/reconciliation-beyond-l1-authoring.test.ts
  - tests/reconciliation-page-composition-surface.test.ts
  - tools/generate/src/cli/ai/host-core.ts
  - tools/generate/src/cli/ai/host.ts
---

cherry-pick of 2470b440e36d913b3f7bb43ea46084e7c2ececbc conflicted on: apps/control-app/src/ai.ts, package.json, tests/reconciliation-assistant-conversation-knowledge.test.ts, tests/reconciliation-beyond-l1-authoring.test.ts, tests/reconciliation-page-composition-surface.test.ts, tools/generate/src/cli/ai/host-core.ts, tools/generate/src/cli/ai/host.ts