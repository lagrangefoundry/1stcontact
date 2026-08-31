---
uid: comment-22c2ff84
id: COMMENT-1764
type: comment
title: Comment on acceptance_criterion AC-924
created_by: xgd
created_at: '2026-08-31T11:35:07.149004+00:00'
updated_at: '2026-08-31T11:35:07.149004+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-1fd2d4da
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

The store-tree scoping of written keys went with the writer that produced it. The only writer of published bytes is now the builder's own publish, which writes only the account's real sites; the scratch store tree has no writer left.
