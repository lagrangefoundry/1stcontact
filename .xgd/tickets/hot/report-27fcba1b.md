---
uid: report-27fcba1b
id: REPORT-7037
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:14:01.363432+00:00'
updated_at: '2026-10-31T22:14:01.363432+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md` (BUG-47). File class: intent/bookkeeping ticket (2e). Rule: per-fact, keep the later state, which is HEAD / ours. The file is outside the sparse cone, so I resolved it with `git checkout --ours` and `git add --sparse`.

## Incoming changes preserved

The incoming commit e6caaf8c96 (2026-09-02 14:04) records an old status change: `status: draft -> free_coding`, `last_field_updated: created_at -> status` and `updated_at -> 2026-09-02T21:04:50`. HEAD has already moved those same fields on: `status: free_and_reconciled`, `last_field_updated: status`, `updated_at: 2026-10-30T21:51:53` and `completed_at: 2026-10-30`. HEAD also has `commits`/`version`/`bundled_in` and the "What was implemented" and "Test plan" sections. Applying the incoming values would roll the ticket back from reconciled to free_coding and delete that later content. The incoming commit is superseded by the later lifecycle state in HEAD, not discarded. The staged diff against HEAD is empty, so finalize is expected to skip the commit (per BUG-1109/BUG-1122).

Untouched: the unstaged edits to `.xgd/_changes/*` and the untracked `report-5f52de7d.md`.
