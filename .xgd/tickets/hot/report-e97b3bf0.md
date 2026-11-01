---
uid: report-e97b3bf0
id: REPORT-7695
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:14:39.048734+00:00'
updated_at: '2026-11-01T15:14:39.048734+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md`: intent/bookkeeping ticket (bug), rule 2e, plus the enrichment rule "take the more recent commit by timestamp". The conflict was index-only (outside the sparse cone), so I set the index to the HEAD-side blob cf3fa77680 and kept skip-worktree.
  - Both sides changed the same facts (`status`, `updated_at`, `last_field_updated`). Incoming 915ab2374b (updated_at 2026-09-04) moves `free_coded` -> `ready_to_reconcile`. HEAD (updated_at 2026-11-01) has `free_and_reconciled`, `completed_at` set, reconcile_sha recorded for all 3 commits, and `working_sha_history`.
  - HEAD is the later state and already went past `ready_to_reconcile`, so it supersedes the incoming change. Incoming has no other changes to merge (the commit touches only these 3 frontmatter lines).

## Incoming changes preserved

- There are no code files in this conflict. The incoming commit is a stale status transition that HEAD already superseded. The resolved index has no diff vs HEAD (redundant/superseded commit, per STEP 4; the finalize step will see the empty staged diff).
- Flagged for post-merge review per the enrichment rule (intent unknown on both sides).
