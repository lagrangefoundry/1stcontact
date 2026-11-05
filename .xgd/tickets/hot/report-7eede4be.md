---
uid: report-7eede4be
id: REPORT-11049
type: report
title: 'Report: cherry_pick_conflict for reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:47:33.099459+00:00'
updated_at: '2026-11-05T20:47:33.099459+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: cherry_pick_conflict
  subject_uid: reconcile-BUNDLE-38
  conflict_sha: 73302982b0b8c281621515fe8de35cbbc202667d
  conflict_files:
  - apps/control-app/src/mail.ts
  - apps/control-app/src/people.ts
  - tests/test_UAT_FC_REQ-186_invite.workers.test.ts
  - tests/test_UAT_FC_REQ-196_mail.workers.test.ts
---

cherry-pick of 73302982b0b8c281621515fe8de35cbbc202667d conflicted on: apps/control-app/src/mail.ts, apps/control-app/src/people.ts, tests/test_UAT_FC_REQ-186_invite.workers.test.ts, tests/test_UAT_FC_REQ-196_mail.workers.test.ts