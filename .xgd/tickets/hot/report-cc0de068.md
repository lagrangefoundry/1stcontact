---
uid: report-cc0de068
id: REPORT-8021
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:32:35.818057+00:00'
updated_at: '2026-11-02T00:32:35.818057+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-37
  conflict_sha: 5e7c7669515edb98097dbf40de8bcbf07b951c31
  conflict_files:
  - apps/control-app/src/builder/people.js
  - apps/control-app/src/people.ts
  - package.json
  - tests/test_UAT_FC_REQ-186_invite.workers.test.ts
  - tests/test_UAT_FC_REQ-186_invite_control.test.ts
---

cherry-pick of 5e7c7669515edb98097dbf40de8bcbf07b951c31 conflicted on: apps/control-app/src/builder/people.js, apps/control-app/src/people.ts, package.json, tests/test_UAT_FC_REQ-186_invite.workers.test.ts, tests/test_UAT_FC_REQ-186_invite_control.test.ts