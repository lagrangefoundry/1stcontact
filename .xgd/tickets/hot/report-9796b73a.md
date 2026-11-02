---
uid: report-9796b73a
id: REPORT-7940
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:07:05.046917+00:00'
updated_at: '2026-11-02T00:07:05.046917+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-93cc89ff.md`: intent/bookkeeping ticket (2e), UU, only in the index (outside the sparse cone). Rule: keep the superset/later fact, which is OURS (HEAD).
  - Base: status `free_coded`, updated_at 2026-09-05T01:53:46.
  - Incoming (826b77114f): only changes `status` -> `ready_to_reconcile`, `last_field_updated` -> status, `updated_at` -> 2026-09-05T01:57:45.
  - HEAD: status `free_and_reconciled` (a later lifecycle state, past `ready_to_reconcile`), `updated_at`/`completed_at` 2026-11-01, plus `reconcile_sha` for both commits and `working_sha_history` fields.
  - Both sides changed the same fields (status, updated_at, last_field_updated). The HEAD values are the later lifecycle position and the more recent timestamp, which also matches the enrichment rule "take the more recent commit by timestamp". The incoming commit touches no other fields.
  - Resolved by writing HEAD's blob (f6f8996d) at stage 0, then restoring skip-worktree. The staged diff vs HEAD is empty: this commit is redundant (BUG-1109/1122 shape) and the finalize step should skip it.

## Incoming changes preserved

Not a code file. The incoming commit's only effect (moving status to `ready_to_reconcile`) is already in HEAD's history: HEAD advanced through that state to `free_and_reconciled`. Nothing was discarded. The commit is redundant, not stale. No BUG-1301 drop.

Flag for post-merge review, per the enrichment rule: one or both sides had unknown intent.
