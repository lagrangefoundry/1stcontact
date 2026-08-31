---
uid: comment-c4154772
id: COMMENT-1766
type: comment
title: Comment on acceptance_criterion AC-926
created_by: xgd
created_at: '2026-08-31T11:35:11.494789+00:00'
updated_at: '2026-08-31T11:35:11.494789+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-1d90d433
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

The per-store-tree deploy index no longer exists. The record of what is published is the revision log in the database, keyed by account and site, and a published address is claimed by the first account to publish it — which is the guarantee this criterion was reaching for, made by the store rather than by a layout.
