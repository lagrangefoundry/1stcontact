---
uid: report-c0a08021
id: REPORT-8049
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:42:52.501685+00:00'
updated_at: '2026-11-02T00:42:52.501685+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-37
  conflict_sha: 48a83cbabbee690d2c104b043ee49031fe2f2f28
  conflict_files:
  - apps/control-app/src/builder/people.js
  - apps/control-app/src/people.ts
  - apps/control-app/src/router.ts
  - package.json
  - tests/test_UAT_FC_BUG-54_person_record.test.ts
---

cherry-pick of 48a83cbabbee690d2c104b043ee49031fe2f2f28 conflicted on: apps/control-app/src/builder/people.js, apps/control-app/src/people.ts, apps/control-app/src/router.ts, package.json, tests/test_UAT_FC_BUG-54_person_record.test.ts