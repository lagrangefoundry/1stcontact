---
uid: report-037dec0f
id: REPORT-7789
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:15:48.791926+00:00'
updated_at: '2026-11-01T16:15:48.791926+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (UU), intent/bookkeeping ticket (rule 2e). The file is outside the sparse cone, so the conflict was only in the index. Both sides changed the same facts (`status`, `updated_at`), so this is a genuine per-fact conflict. Kept OURS (index blob 4ef51f8a):
  - Incoming 9545d0b50d (2026-09-05): `status: free_coded -> ready_to_reconcile`, `updated_at` 2026-09-05T18:58:40.
  - Ours (HEAD, 2026-11-01): `status: bundled`, `updated_at` 2026-11-01T14:13:51, plus the new field `fields.bundled_in: bundle-39edf66d`.
  - Ours is the more recent change by timestamp (the enrichment rule) and the later lifecycle state; bundled_in shows the ticket has already moved past ready_to_reconcile into this bundle. Taking incoming would move the status backwards and drop bundled_in. Flagged for post-merge review per the enrichment rule.
  - Net result: no diff vs HEAD for this commit. Finalize should detect the empty staged diff and skip the commit.

## Incoming changes preserved

No code files were involved. The incoming change (an older status transition) is superseded by HEAD's later status `bundled`, not discarded by mistake. HEAD has already moved the ticket past `ready_to_reconcile`.
