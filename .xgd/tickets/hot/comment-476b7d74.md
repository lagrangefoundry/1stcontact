---
uid: comment-476b7d74
id: COMMENT-1758
type: comment
title: Comment on acceptance_criterion AC-896
created_by: xgd
created_at: '2026-08-31T11:34:53.925917+00:00'
updated_at: '2026-08-31T11:34:53.925917+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-5a097866
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

There is no published deploy channel and no stored live pointer. Publishing itself mints the revision and writes its bytes, and which revision is live is derived as the highest revision number rather than recorded — a stored pointer would be a second place for one fact to live. What a URL then serves belongs to the serving story in this capability.
