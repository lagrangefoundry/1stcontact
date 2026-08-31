---
uid: comment-5dfd791a
id: COMMENT-1762
type: comment
title: Comment on acceptance_criterion AC-900
created_by: xgd
created_at: '2026-08-31T11:35:02.683206+00:00'
updated_at: '2026-08-31T11:35:02.683206+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-bf89142e
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

The staged upload report belonged to the deleted deploy command. Publishing reports what a publish has: the revision minted or the existing one when nothing changed, the change count, and where the output landed — covered by the criteria on this story that describe publishing itself.
