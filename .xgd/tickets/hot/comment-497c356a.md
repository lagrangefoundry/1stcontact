---
uid: comment-497c356a
id: COMMENT-1756
type: comment
title: Comment on acceptance_criterion AC-893
created_by: xgd
created_at: '2026-08-31T11:34:49.486913+00:00'
updated_at: '2026-08-31T11:34:49.486913+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-77bdb689
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

A snapshot's identity is no longer a digest of its contents. A revision is named by its number, every stored key and public URL is built from that, and the digest that remains on a revision entry is audit only — nothing resolves a revision by it. The property this criterion protected against redundant work survives in a different form: publishing an unchanged draft is a no-op that mints nothing, which is stated by its own criterion on this story.
