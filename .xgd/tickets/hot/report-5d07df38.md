---
uid: report-5d07df38
id: REPORT-8248
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:54:35.536030+00:00'
updated_at: '2026-11-02T01:54:35.536030+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-704fe21e.md`: intent/bookkeeping ticket (rule 2e), UU, index-only (outside sparse cone). Both sides changed the same facts (`status`, `updated_at`). Kept HEAD (stage 2, blob 428f21ef): `status: bundled`, `bundled_in: bundle-5052a63c`, `updated_at: 2026-11-01T23:18:46`. Incoming 25d247017d (Sep 6 19:44:35) set `status: ready_to_reconcile`, which the ticket has since moved past (ready_to_reconcile → bundled). The file was restored to the worktree from the index so it no longer shows as an unstaged deletion.

## Incoming changes preserved

There are no code files. The incoming commit only changes status and updated_at on a bookkeeping ticket, and HEAD's later lifecycle state (bundled into bundle-5052a63c) already includes that step. The commit is therefore redundant, and the staged diff vs HEAD is empty by design (BUG-1109/1122). Finalize should detect this and skip.

## Arbitration of last resort (BUG-1460)

- `.xgd/tickets/hot/request-704fe21e.md`: `xgd working-timeline bundle-5052a63c request-704fe21e` failed for one side ("Ticket request-704fe21e not found in local, hot, cold"). Resolved at tier 1 using the available evidence: the HEAD-side intent bundle-5052a63c is positioned at 2026-09-06T19:46:19, after the incoming commit (19:44:35). HEAD's updated_at (2026-11-01) is also later, and `bundled` follows `ready_to_reconcile` in the lifecycle. The incoming side's status/updated_at were dropped. Flagged for post-merge review per the enrichment rule.
