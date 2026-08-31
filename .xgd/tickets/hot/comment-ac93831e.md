---
uid: comment-ac93831e
id: COMMENT-1763
type: comment
title: Comment on acceptance_criterion AC-901
created_by: xgd
created_at: '2026-08-31T11:35:04.962837+00:00'
updated_at: '2026-08-31T11:35:04.962837+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-b873d838
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

There is no deploy index to lose an update on. The record of what is published is the revision log in the database, where a revision row is written once and never updated, and the concurrent-writer case this criterion covered is replaced by the published-address claim, which is decided by the store's own uniqueness rather than by a compare-and-write in application code.
