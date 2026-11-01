---
uid: report-dff9797b
id: REPORT-7415
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:48:11.587341+00:00'
updated_at: '2026-11-01T06:48:11.587341+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-2bd9d184.md` (REQ-175). File class: intent/bookkeeping ticket (2e). It was outside the sparse cone, so the conflict was only in the index. Rule applied: keep the superset / later status per fact. Resolved to the HEAD (ours) version and staged with `git add --sparse`.
  - Incoming (d3aa534c61, updated_at 2026-09-03T02:34): changed only two fields, `status: free_coded -> ready_to_reconcile` and `updated_at`.
  - HEAD (updated_at 2026-11-01T05:03): `status: free_and_reconciled`, `completed_at` set, `reconcile_sha d2da20f9...`, `bundled_in: bundle-fd009b93`, `working_sha_history` entries.
  - The two sides overlap only on `status` and `updated_at`. For both, HEAD has the later value: `free_and_reconciled` comes after `ready_to_reconcile` in the lifecycle, and its timestamp is 2 months newer. HEAD also adds fields the incoming side never touched. So HEAD is effectively a superset, and applying the incoming status would move the ticket backwards in its lifecycle.

## Incoming changes preserved

There are no code files in this conflict. The incoming change (status advanced to ready_to_reconcile) is already covered by HEAD, which has moved the request further, to free_and_reconciled. The commit is therefore redundant (BUG-1109/BUG-1122 shape), not discarded. The staged result has no diff against HEAD; finalize should detect this and skip the commit.
