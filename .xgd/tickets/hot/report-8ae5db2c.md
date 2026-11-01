---
uid: report-8ae5db2c
id: REPORT-7681
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:07:18.518595+00:00'
updated_at: '2026-11-01T15:07:18.518595+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179): intent/bookkeeping ticket (2e), rule "same field changed differently, take the later side", per fact. The file was outside the sparse cone, so it was resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming 8157e6b677 (2026-09-03 21:49:59Z) changes only `status` free_coded -> ready_to_reconcile, plus the matching `updated_at` / `last_field_updated`.
  - HEAD has `status: free_and_reconciled`, `updated_at` 2026-11-01T13:58:45Z. That is the same field at a later lifecycle point, which this ticket's reconcile already advanced past ready_to_reconcile. HEAD was kept.

## Incoming changes preserved

There are no code files. The incoming commit's one fact (status=ready_to_reconcile) has been superseded by HEAD's later status. The commit is redundant on this branch, and the staged result has no diff vs HEAD.
