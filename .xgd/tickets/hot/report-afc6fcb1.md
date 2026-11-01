---
uid: report-afc6fcb1
id: REPORT-7463
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:19:19.100629+00:00'
updated_at: '2026-11-01T07:19:19.100629+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179). File class: 2e, intent/bookkeeping ticket (a request ticket in the hot tier). It is outside the sparse cone, so the conflict was index-only. Rule applied: the same field was changed differently on each side, so keep the later intent's value. That is OURS (HEAD). Resolved with `git checkout --ours` followed by `git add --sparse`.
  - Incoming `8157e6b677` ("update request request-b813aa4a", 2026-09-03 14:49) changes one fact: `status` from `free_coded` to `ready_to_reconcile`. It also touches `updated_at` and `last_field_updated`.
  - HEAD has `status: bundled` (updated_at 2026-11-01, v0.2.69, bundled_in bundle-94dbe947). HEAD's own "Reopened 2026-09-04" section records that the ticket was "Moved back to `draft` from `ready_to_reconcile`" and later re-advanced to bundled. So the incoming status is an earlier point on a path HEAD has already passed.
  - No other part of the ticket is changed by the incoming commit.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only substantive change, an intermediate status transition, has already been superseded in HEAD. The commit is redundant on this branch, not discarded: the staged diff against HEAD is empty.
