---
uid: report-32aa44cf
id: REPORT-7665
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:57:44.301856+00:00'
updated_at: '2026-11-01T14:57:44.301856+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-8c5c0bb6.md` (REQ-168): intent/bookkeeping ticket, rule 2e (same field changed differently, so the later state wins per fact). The only conflict is the frontmatter lifecycle fields `updated_at`, `completed_at` and `status`. Incoming `eafca8f548` (2026-09-03) moved status `free_coded` → `ready_to_reconcile`. HEAD already has `free_and_reconciled`, `completed_at` 2026-11-01T13:58:41, `updated_at` 2026-11-01T13:58:45. HEAD's state is later in time and further along the lifecycle, so HEAD's values are kept. Staged with `git add --sparse` (outside the sparse cone).

## Incoming changes preserved

The incoming commit changes only those two lines (`updated_at` and `status`), and HEAD has since moved past them. The incoming status `ready_to_reconcile` is an earlier lifecycle step of the same ticket, not developer code. There is no code file in this conflict. The resolution has no diff against HEAD, so the commit is redundant (its effect is already covered by later lifecycle updates) and finalize can skip it.
