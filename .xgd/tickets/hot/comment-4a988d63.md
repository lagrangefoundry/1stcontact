---
uid: comment-4a988d63
id: COMMENT-1761
type: comment
title: Comment on acceptance_criterion AC-899
created_by: xgd
created_at: '2026-08-31T11:35:00.568092+00:00'
updated_at: '2026-08-31T11:35:00.568092+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-cff7798d
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

Prune has no home once the deploy command and its per-site index are gone: there is no index enumerating what is referenced, and bytes orphaned by an interrupted publish are unreachable because the recorded revision is what vouches for them. They cost storage and nothing else; collecting them is deferred to a maintenance route (REQ-149, out of scope).
