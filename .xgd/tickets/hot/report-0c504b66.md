---
uid: report-0c504b66
id: REPORT-7909
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-01T23:54:36.829609+00:00'
updated_at: '2026-11-01T23:54:36.829609+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178): intent/bookkeeping ticket (2e), UU, index-only conflict (outside the sparse cone). Resolved with `git checkout --ours` because HEAD is the strict superset. Flagged for post-merge review, per the enrichment rule.
  - Incoming 19775c0327 (2026-09-04 17:25) changed three things: `updated_at` to 2026-09-05T00:25:00, `last_field_updated` to `body`, and it appended the body section "A fourth commit: REQ-184's UAT lost the same observable".
  - HEAD already contains that section verbatim (lines 399–412). HEAD's `updated_at` (2026-11-01) and `status: free_and_reconciled` are later.

## Incoming changes preserved

Not a code file. The incoming commit's substantive change (the appended body section) is already in HEAD, so this commit is redundant. The staged diff vs HEAD is empty, and the finalize step will skip the commit. The incoming timestamp and `last_field_updated` are older bookkeeping, which HEAD's later edit supersedes.
