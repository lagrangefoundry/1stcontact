---
uid: comment-56c1f85a
id: COMMENT-1757
type: comment
title: Comment on acceptance_criterion AC-895
created_by: xgd
created_at: '2026-08-31T11:34:51.765231+00:00'
updated_at: '2026-08-31T11:34:51.765231+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-48e04041
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

There is no draft deploy channel. Draft preview snapshots and their shareable digest-addressed links were backed by the per-site index that has been deleted, so they were dropped rather than ported (REQ-149 D7); sharing a draft returns later as a builder control. The builder's own draft preview is unaffected and belongs to the builder workspace story.
