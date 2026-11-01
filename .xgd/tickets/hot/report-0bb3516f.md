---
uid: report-0bb3516f
id: REPORT-7679
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:06:32.673613+00:00'
updated_at: '2026-11-01T15:06:32.673613+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179): intent/bookkeeping ticket (2e), rule "same field changed differently, take the later side", per fact. The file was outside the sparse cone, so it was resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming 3fcdda9f40 (2026-09-03 21:43:43Z) changes only `story_points` 2 -> 3, plus the matching `updated_at` / `last_field_updated: story_points`.
  - HEAD has `story_points: 4`, `updated_at` 2026-11-01T13:58:45Z, `status: free_and_reconciled`. HEAD's value is a later revision of the same fact, so HEAD was kept.

## Incoming changes preserved

There are no code files. The incoming commit's one fact (story_points=3) has been superseded by HEAD's later story_points=4. The commit is redundant on this branch, and the staged result has no diff vs HEAD.
