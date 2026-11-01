---
uid: report-b4ede753
id: REPORT-7331
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:58:39.799446+00:00'
updated_at: '2026-11-01T05:58:39.799446+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` — intent/bookkeeping ticket (class 2e; request ticket, outside sparse cone, index-only conflict). Resolved by keeping HEAD (ours, blob 0fed9f692b) in full. Skip-worktree bit restored so the file stays sparse.

## Incoming changes preserved

Incoming commit 67248766a3 (2026-09-02 23:24) changed only two frontmatter scalars: `status: ready_to_reconcile -> free_coded` and `updated_at`. Both fields were also changed on HEAD, so it is a same-fact conflict. HEAD's values come from a much later lifecycle point (`updated_at: 2026-10-30T21:51:53`, `completed_at: 2026-10-30T21:51:45`, `status: free_and_reconciled`, plus `bundled_in: bundle-5607a08d`, a populated `reconcile_sha`, and substantial body additions). The incoming status transition is an earlier step that HEAD's state already supersedes. Taking the later side per fact (2e / enrichment rule "take the more recent commit by timestamp") drops the incoming values. Result: no net diff vs HEAD, so the commit is redundant and finalize should skip it.

## Arbitration of last resort (BUG-1460)

- `.xgd/tickets/hot/request-3f8737f2.md`: resolved at tier 1 (most recent intent state). Evidence: HEAD records the ticket as completed and reconciled on 2026-10-30. Re-applying the 2026-09-02 `free_coded` status would regress the ticket's lifecycle. Incoming side (status/updated_at) dropped. Flagged for post-merge review per the enrichment rule.
