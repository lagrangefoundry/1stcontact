---
uid: comment-813a322e
id: COMMENT-1765
type: comment
title: Comment on acceptance_criterion AC-925
created_by: xgd
created_at: '2026-08-31T11:35:09.283954+00:00'
updated_at: '2026-08-31T11:35:09.283954+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-c996ef8e
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

The 'shipped but not publicly reachable' report went with the deploy command. There is no publish that ships to somewhere nothing serves — the servable/non-servable store-tree distinction had exactly one writer, and it has been deleted.
