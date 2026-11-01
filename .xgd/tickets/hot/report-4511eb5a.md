---
uid: report-4511eb5a
id: REPORT-7459
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:17:39.811016+00:00'
updated_at: '2026-11-01T07:17:39.811016+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179). File class: 2e, intent/bookkeeping ticket (a request ticket kept in the hot tier). It sits outside the sparse cone, so the conflict existed only in the index. Rule applied: one side is a strict superset, so keep the superset, which is OURS (HEAD). Resolved with `git checkout --ours` followed by `git add --sparse`.
  - Incoming `a56d736cfb` ("update request request-b813aa4a") is an older snapshot of the ticket: status `free_coded`, version 0.2.61, updated_at 2026-09-03, a single commit entry `6d25bf25`.
  - HEAD is the later state: status `bundled`, version 0.2.69, updated_at 2026-11-01. It has the commits `6d25bf25` and `5bace72f`, `depends_on: [REQ-178]`, `bundled_in: bundle-94dbe947`, `story_points: 4`, and the "Reopened 2026-09-04" amendment (lapsed-account switcher behaviour, DOC-42).
  - Every incoming fact is already in HEAD except the trailing-newline change, which is cosmetic. Taking incoming would have moved the status back from `bundled` to `free_coded` and dropped the amendment and the bundle linkage.

## Incoming changes preserved

There are no code files in this conflict. The incoming ticket change (the status advance to free_coded and the `6d25bf25` commit entry) is already in HEAD, which carries the later status and a superset of the commits list. The commit is redundant on this branch, not discarded: the staged diff against HEAD is empty, so finalize should skip it.
