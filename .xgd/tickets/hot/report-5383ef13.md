---
uid: report-5383ef13
id: REPORT-7633
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:34:13.188819+00:00'
updated_at: '2026-11-01T14:34:13.188819+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-2bd9d184.md` (REQ-175): intent/bookkeeping ticket (2e). The only overlap was the status block (`updated_at`, `completed_at`, `last_field_updated`, `status`). HEAD's side was kept: `status: free_and_reconciled`, completed/updated 2026-11-01T05:03. The incoming side (d3aa534c61, 2026-09-03) had `status: ready_to_reconcile`, `completed_at: null`. Staged with `git add --sparse`. The rest of the file was identical on both sides.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only change was the 4-line status update above. That change is stale: HEAD already holds a later status for the same ticket, two months newer, and it moves the ticket past `ready_to_reconcile` to `free_and_reconciled`. Applying the incoming change would move REQ-175 backwards in its lifecycle. The resolution therefore has no diff against HEAD, so finalize should treat this as a redundant commit and skip it.

## Arbitration of last resort (BUG-1460)

- `.xgd/tickets/hot/request-2bd9d184.md`: the same fact (ticket status) changed differently on each side. Resolved by the enrichment rule "take the more recent commit by timestamp": HEAD (2026-11-01) beats incoming (2026-09-03). The incoming status block was dropped. Flagged for post-merge review as the enrichment rule asks, but low risk: a status lifecycle only moves forward, and the incoming value is an earlier stage.
