---
uid: report-58040ba0
id: REPORT-8125
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:12:37.589169+00:00'
updated_at: '2026-11-02T01:12:37.589169+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-37
  conflict_sha: 38249764f0051b68e33ba7401d4865ec1a11a77c
  conflict_files:
  - db/migrations/0003_ticket_store.sql
  - tests/support/local-d1.ts
  - tools/generate/src/store/d1r2-store.ts
---

cherry-pick of 38249764f0051b68e33ba7401d4865ec1a11a77c conflicted on: db/migrations/0003_ticket_store.sql, tests/support/local-d1.ts, tools/generate/src/store/d1r2-store.ts