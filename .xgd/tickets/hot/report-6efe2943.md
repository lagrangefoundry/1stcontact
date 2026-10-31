---
uid: report-6efe2943
id: REPORT-7091
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:48:47.408558+00:00'
updated_at: '2026-10-31T22:48:47.408558+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md` (BUG-47) — intent/bookkeeping ticket (2e; enrichment rule: take the more recent commit by timestamp, flag for post-merge review). Single hunk: the same fields (`updated_at`, `completed_at`, `last_field_updated`, `status`) changed on both sides. Kept HEAD (ours): commit 09d9e705d7, 2026-10-30, `status: free_and_reconciled`, completed 2026-10-30T21:51:47Z. Dropped incoming: 2560e64cbe, 2026-09-02, `status: ready_to_reconcile`, `completed_at: null`. That is a stale earlier transition, and applying it would regress a completed ticket. No other fields were in conflict.

## Incoming changes preserved

No code files involved. The incoming commit only made an older status transition, which HEAD has since superseded. The resolution is identical to HEAD (no net diff), so finalize can treat this commit as redundant.

**Flag for post-merge review:** the enrichment rule asks for this file to be flagged.
