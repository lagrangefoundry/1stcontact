---
uid: report-2ebb5442
id: REPORT-7315
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:50:11.108878+00:00'
updated_at: '2026-11-01T05:50:11.108878+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md`: AA (both added), intent/bookkeeping ticket (BUG-49). Rule applied: 2b (one side strictly a superset) together with the enrichment's "take the more recent commit by timestamp" rule. Kept HEAD (ours) via `git checkout --ours` + `git add --sparse` (the path is outside the sparse cone).
  - Incoming `855700d8e6` ("create bug bug-46140599", 2026-09-02) is the initial empty draft: `title: Untitled`, `status: draft`, `completed_at: null`, no body, and only the base fields (auto_merge_back, needs_review, priority).
  - HEAD ("update bug bug-46140599", updated_at 2026-10-30) is the same ticket after its lifecycle finished: real title, `status: free_and_reconciled`, the same base fields plus chat_comment, commits, version, bundled_in, and the full description body.
  - Every fact on the incoming side is either identical in HEAD or was later superseded by HEAD. HEAD is the superset and also the later side.

## Incoming changes preserved

Not a code file. The incoming commit only creates the ticket's draft skeleton, and that creation already exists in HEAD's history in a later state. The resolution nets to no diff vs HEAD because the commit is redundant (BUG-1109/BUG-1122 shape), not because anything was discarded. Left for finalize to skip.

Flagged for post-merge review per the enrichment rule (intent unknown on one side), although the outcome is low-risk.
