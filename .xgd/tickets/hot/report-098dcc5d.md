---
uid: report-098dcc5d
id: REPORT-7323
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:54:15.806801+00:00'
updated_at: '2026-11-01T05:54:15.806801+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md` (BUG-47) — intent/bookkeeping ticket (2e), outside sparse cone. Conflict was header-only: `updated_at`, `completed_at`, `status` (same fields changed differently on each side). Enrichment rule (intent unknown on both sides; identical subjects "xgd(ticket): update bug bug-364445f8") applied: take the more recent by timestamp.
  - Ours (HEAD): `status: free_and_reconciled`, `completed_at: 2026-10-30T21:51:47Z`, `updated_at: 2026-10-30T21:51:53Z`.
  - Theirs (2560e64cbe, authored 2026-09-02): `status: ready_to_reconcile`, `completed_at: null`, `updated_at: 2026-09-02T23:15:11Z`.
  - Kept HEAD (`git checkout --ours`, `git add --sparse`). Body and `fields:` merged cleanly / were identical.

## Incoming changes preserved

No code files involved. The incoming commit's only change (a 3-line status transition to `ready_to_reconcile` dated 2026-09-02) is stale: the ticket has since advanced through reconcile to `free_and_reconciled` (2026-10-30). Re-applying it would regress the lifecycle state. Resolution nets to no diff vs HEAD; finalize should detect the empty staged diff and skip the commit.

Flagged for post-merge review per enrichment rule (intent unknown on both sides).
