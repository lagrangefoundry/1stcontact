---
uid: report-b14268d0
id: REPORT-6759
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-26T00:35:32.095414+00:00'
updated_at: '2026-10-26T00:35:32.095414+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md`: intent/bookkeeping ticket (rule 2e). The file is outside the sparse cone, so the conflict was index-only. Both sides changed only `updated_at`, `last_field_updated` and `status`.
  - HEAD: status `free_coded` -> `bundled`, adds `bundled_in: bundle-5607a08d`, updated_at 2026-10-25T22:19:54.
  - Incoming (41d6fc8, "update request request-3f8737f2"): status `free_coded` -> `ready_to_reconcile`, updated_at 2026-09-02T23:37:26.
  - Same fact changed differently on each side. Kept HEAD because it is the later state: the request was bundled into bundle-5607a08d after it reached ready_to_reconcile, so `bundled` supersedes `ready_to_reconcile`. Taking incoming would have moved the status backwards and dropped the bundle link. Staged with `git add --sparse`.

## Incoming changes preserved

No code files were involved. The incoming status change to `ready_to_reconcile` is already superseded by HEAD's later `bundled` state. This commit is redundant, not discarded, and the staged result is identical to HEAD (finalize will detect the empty diff).
