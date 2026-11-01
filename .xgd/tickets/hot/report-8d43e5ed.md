---
uid: report-8d43e5ed
id: REPORT-7656
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:50:57.092907+00:00'
updated_at: '2026-11-01T14:50:57.092907+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-36
  conflict_sha: 9af6bdf02e3842c50b325f04ce42bb7be914b888
  conflict_files:
  - apps/control-app/src/identity.ts
  - apps/control-app/src/index.ts
  - apps/control-app/src/router.ts
  - apps/control-app/src/scope.ts
  - apps/control-app/wrangler.toml
  - tests/support/d1-site-factory.ts
  - tests/test_UAT_FC_REQ-167_identity.workers.test.ts
  - tests/test_UAT_FC_REQ-168_scope.workers.test.ts
  - tests/test_UAT_FC_REQ-178_businesses.workers.test.ts
---

cherry-pick of 9af6bdf02e3842c50b325f04ce42bb7be914b888 conflicted on: apps/control-app/src/identity.ts, apps/control-app/src/index.ts, apps/control-app/src/router.ts, apps/control-app/src/scope.ts, apps/control-app/wrangler.toml, tests/support/d1-site-factory.ts, tests/test_UAT_FC_REQ-167_identity.workers.test.ts, tests/test_UAT_FC_REQ-168_scope.workers.test.ts, tests/test_UAT_FC_REQ-178_businesses.workers.test.ts