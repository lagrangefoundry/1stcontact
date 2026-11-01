---
uid: report-ce4634d3
id: REPORT-7387
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:30:43.952197+00:00'
updated_at: '2026-11-01T06:30:43.952197+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-2bd9d184.md` — intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Resolved with `git checkout --ours` + `git add --sparse`.
  - HEAD (ours) is a strict superset / later state of the incoming side: `status: free_and_reconciled` (vs incoming `free_coded`), `updated_at 2026-11-01T05:03:20` (vs incoming `2026-09-03T00:11:36`), `completed_at` set, second commit entry's `reconcile_sha: d2da20f9…`, `working_sha_history` fields, and `bundled_in: bundle-fd009b93`. The incoming side's only other delta is a missing trailing newline at EOF.
  - Rule applied: 2e "one side is a strict superset — keep the superset", consistent with the enrichment rule "take the more recent commit by timestamp" (HEAD is more recent). Flagged for post-merge review per enrichment.

## Incoming changes preserved

Incoming commit 18588e93ac ("xgd(ticket): update request request-2bd9d184") advanced the ticket to `free_coded` and added the `commits:` list / `version` fields. All of those facts are already present in HEAD, in a later lifecycle state (`free_and_reconciled`, with reconcile_sha filled in). Applying incoming would regress status and drop reconcile/bundle bookkeeping. The commit is redundant (its effect already landed via a later route — BUG-1109/BUG-1122 shape), so the staged result has no net diff vs HEAD; finalize should skip it. No code files involved.
