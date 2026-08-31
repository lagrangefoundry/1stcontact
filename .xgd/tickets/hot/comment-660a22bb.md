---
uid: comment-660a22bb
id: COMMENT-1760
type: comment
title: Comment on acceptance_criterion AC-898
created_by: xgd
created_at: '2026-08-31T11:34:58.292223+00:00'
updated_at: '2026-08-31T11:34:58.292223+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-6d49fb75
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

The dry run was the deploy command's rehearsal of an upload plan. The command is deleted and publishing has no rehearsal mode.
