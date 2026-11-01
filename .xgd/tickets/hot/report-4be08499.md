---
uid: report-4be08499
id: REPORT-7313
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:49:22.116294+00:00'
updated_at: '2026-11-01T05:49:22.116294+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-43ce519b.md` (REQ-174), class 2e (intent/bookkeeping ticket). Kept the HEAD side (`git checkout --ours`, then `git add --sparse`).
  - Hunk 1 (`updated_at` / `completed_at` / `status`): the same fields changed differently on each side. Took the later state per fact. Incoming c36b405ffd (2026-09-02) sets `status: free_coded`, `completed_at: null`. HEAD (c949617b26 / 432b94c4ee, 2026-10-30) sets `status: free_and_reconciled` with a completed_at. HEAD is later, and taking incoming would regress the ticket's lifecycle.
  - Hunk 2 (`bundled_in: bundle-5607a08d`): HEAD-only addition, so HEAD is a strict superset. Kept.

## Incoming changes preserved

No code files were involved. The incoming commit is a stale ticket-state snapshot (free_coded, Sep 2) that HEAD has already moved past (free_and_reconciled, Oct 30). Every fact it carries is either superseded by a later value on HEAD or already present. The resolution nets to no diff vs HEAD (redundant, not discarded). The finalize step should detect the empty staged diff and skip the commit.

## Notes

The conflict-intent enrichment said "intent unknown, take the more recent commit by timestamp". That agrees with the per-fact 2e resolution above. Flagged for post-merge review as the enrichment requested, but no action is expected.
