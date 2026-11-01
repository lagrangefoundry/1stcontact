---
uid: report-89ffa6ef
id: REPORT-7475
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:25:19.289298+00:00'
updated_at: '2026-11-01T07:25:19.289298+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md`: bookkeeping ticket (2e), UU, outside the sparse checkout (conflict existed only in the index). Rule: same fields (`status`, `updated_at`) changed differently on each side, so the more recent side wins (enrichment rule: newer commit by timestamp). HEAD's version kept (blob 7afcdf5c55), staged at stage 0 with skip-worktree set.
  - HEAD (756eaf4a54, 2026-10-31, "seed_local_overlay_batch ticket 12 tickets"): `status: bundled`, `updated_at 2026-11-01`, plus `fields.bundled_in: bundle-94dbe947`.
  - Incoming (915ab2374b, 2026-09-04, "update bug bug-cb59cc4a"): `status: free_coded -> ready_to_reconcile`, `updated_at 2026-09-04`.
  - HEAD already covers the incoming change: both set `last_field_updated: status`, and HEAD's status (`bundled`) comes after `ready_to_reconcile` and adds `bundled_in`. Applying the incoming status would move the ticket back from bundled.
  - FLAG FOR POST-MERGE REVIEW (enrichment: intent unknown on one or both sides).

## Incoming changes preserved

No code files were in conflict. The incoming change only touched ticket status and timestamp fields, and HEAD already has a later status for the same ticket. The staged diff against HEAD is empty, so this is a redundant commit (BUG-1109/BUG-1122 shape), not discarded developer code. The finalize step should detect the empty diff and skip it.
