---
uid: report-4e1d35ed
id: REPORT-7285
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:33:50.433399+00:00'
updated_at: '2026-11-01T05:33:50.433399+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` (REQ-157). This is an intent/bookkeeping ticket (2e), resolved by the rule "one side is a strict superset, keep the superset (HEAD)". The conflict was index-only because the file is outside the sparse cone. I resolved it with `git checkout --ours` and `git add --sparse`.
  - The incoming commit d25cd43158 (2026-09-02 22:27) changes only `status: free_coded → ready_to_reconcile` and `updated_at`.
  - HEAD (2026-10-30) has the same facts at a later lifecycle stage: `status: free_and_reconciled` with `completed_at` set, a commits list with `reconcile_sha` populated, and `bundled_in: bundle-5607a08d`.

## Incoming changes preserved

There are no code files. The incoming change is a status transition that HEAD has already moved past (ready_to_reconcile → reconciled), so the commit is redundant rather than discarded. The staged diff against HEAD is empty, and the finalize step will skip the commit.
