---
uid: report-efcf18a0
id: REPORT-7912
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-01T23:55:27.508755+00:00'
updated_at: '2026-11-01T23:55:27.508755+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178): intent/bookkeeping ticket (2e), UU, index-only conflict (outside the sparse cone). Resolved with `git checkout --ours`; flagged for post-merge review, per the enrichment rule.
  - Incoming 1ccd778186 (2026-09-04 17:33) changed only lifecycle fields: `status` from free_coded to `ready_to_reconcile`, `updated_at` to 2026-09-05T00:33:53, and `last_field_updated` to `status`.
  - HEAD has `status: free_and_reconciled`, updated 2026-11-01. That is a later timestamp and a later lifecycle stage (ready_to_reconcile → reconciled), so HEAD wins on the same fact by the more-recent rule.

## Incoming changes preserved

Not a code file. The incoming commit's only change is a status advance that HEAD has already moved past. Applying it would set a reconciled ticket back to an earlier status. The staged diff vs HEAD is empty, and the finalize step will skip the commit.
