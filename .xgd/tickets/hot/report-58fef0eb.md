---
uid: report-58fef0eb
id: REPORT-7357
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:13:17.736487+00:00'
updated_at: '2026-11-01T06:13:17.736487+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` (BUG-49): intent/bookkeeping ticket (2e). Only the frontmatter lifecycle fields conflicted (`updated_at`, `completed_at`, `status`). The body and `fields:` were the same on both sides. Kept HEAD for every conflicting fact, because HEAD's state is later on the timeline:
  - HEAD (2026-10-30T21:51:52): `status: free_and_reconciled`, with `completed_at` set
  - Incoming 29b4dae668 (2026-09-02T23:44:26): `free_coded` -> `ready_to_reconcile`, with `completed_at: null`

  The incoming change is an older step in a lifecycle that HEAD has already completed. Applying it would move the ticket's status backwards. This follows the enrichment's "more recent commit by timestamp" rule. Flagged for post-merge review as that rule requires. The resolved file is identical to HEAD, so the staged diff is empty and finalize can skip the commit.

## Incoming changes preserved

No code files were involved. The incoming commit's only effect, the `ready_to_reconcile` transition, is already contained in HEAD's later `free_and_reconciled` state, so nothing meaningful was discarded. The commit is redundant on this branch.
