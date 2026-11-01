---
uid: report-6c991a54
id: REPORT-7913
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-01T23:55:46.141434+00:00'
updated_at: '2026-11-01T23:55:46.141434+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-37
  conflict_sha: 2103d2e63b88301c65af56727f1bc99be3f1b1fe
  conflict_files:
  - apps/control-app/src/identity.ts
  - apps/control-app/src/router.ts
  - apps/control-app/wrangler.toml
  - tests/support/d1-site-factory.ts
  - tests/test_UAT_FC_REQ-180_admin_adds_a_business.workers.test.ts
  - tests/test_UAT_FC_REQ-185_platform_operator.workers.test.ts
---

cherry-pick of 2103d2e63b88301c65af56727f1bc99be3f1b1fe conflicted on: apps/control-app/src/identity.ts, apps/control-app/src/router.ts, apps/control-app/wrangler.toml, tests/support/d1-site-factory.ts, tests/test_UAT_FC_REQ-180_admin_adds_a_business.workers.test.ts, tests/test_UAT_FC_REQ-185_platform_operator.workers.test.ts