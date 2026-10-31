---
uid: report-cdb53bdc
id: REPORT-6969
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:31:31.370492+00:00'
updated_at: '2026-10-31T21:31:31.370492+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md`: intent/bookkeeping ticket (2e), conflict in the index only, outside the sparse cone. Kept the HEAD (ours) version, blob cd14a125. Then restored the skip-worktree bit.
  - Incoming 4394018c50 (2026-09-02) changed only `status: free_coded -> ready_to_reconcile` and `updated_at`.
  - HEAD has the same fields at a later lifecycle point: `status: free_and_reconciled`, `updated_at: 2026-09-19`, `completed_at: 2026-09-14`, plus `bundled_in: bundle-8e1807f6`.
  - Same fact changed differently on both sides. HEAD's change is clearly later by timestamp and by lifecycle position (reconciled comes after ready_to_reconcile). Per the enrichment rule, took the more recent side. Applying incoming would move a completed, bundled ticket back to ready_to_reconcile.
  - Flagged for post-merge review, as the enrichment rule requires (intent was unknown on both sides).

## Incoming changes preserved

No code files were in conflict. The incoming status/updated_at change is already superseded by HEAD's later state, so the staged result has no diff against HEAD for this file. That is a redundant commit, not a discard of developer code. The finalize step should detect the empty diff.
