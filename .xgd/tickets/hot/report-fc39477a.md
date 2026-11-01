---
uid: report-fc39477a
id: REPORT-7447
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:10:46.800181+00:00'
updated_at: '2026-11-01T07:10:46.800181+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-8c5c0bb6.md` (REQ-168): intent/bookkeeping ticket (2e). Kept HEAD/ours version (blob 553c6ddec1).
  - Incoming eafca8f548 (2026-09-03): status free_coded -> ready_to_reconcile, updated_at 2026-09-03T20:18:59.
  - Ours (2026-11-01): status free_coded -> bundled, updated_at 2026-11-01T05:18:03, added fields.bundled_in: bundle-94dbe947.
  - Same facts (status, updated_at) changed on both sides; ours is the later change (Nov 1 vs Sep 3) and `bundled` is the downstream lifecycle state of `ready_to_reconcile`. bundled_in (ours only) kept. Matches enrichment rule "take the more recent commit by timestamp".
  - Ticket is outside the sparse cone; resolved in index, then restored to worktree via `git checkout --ours`.

## Incoming changes preserved

No code files involved. The incoming commit's only change (status advance to ready_to_reconcile) is superseded by HEAD's later `bundled` status on the same ticket, so the staged result nets to no diff vs HEAD (redundant/stale commit — finalize step should skip it). Flag for post-merge review per enrichment rule: confirm REQ-168 status `bundled` / bundled_in bundle-94dbe947 is correct.

## Arbitration of last resort (BUG-1460)

- `.xgd/tickets/hot/request-8c5c0bb6.md`: tier 1 (most-recent intent). Evidence: incoming commit is a Sep 3 status transition; HEAD contains a Nov 1 transition of the same ticket to `bundled` within bundle-94dbe947 (the bundle being reconciled), which supersedes it. Incoming side dropped.
