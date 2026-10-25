---
uid: report-ea3df7fb
id: REPORT-6696
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:58:55.136593+00:00'
updated_at: '2026-10-25T22:58:55.136593+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (bug ticket; 2e intent/bookkeeping, index-only, outside the sparse cone). Rule applied: superset, plus the enrichment's "more recent by timestamp" rule. Kept OURS (`git checkout --ours`, then `git add --sparse`).
  - Theirs (9f43952b30, "update bug bug-8dfa60ea") changed only `status: free_coded -> ready_to_reconcile`, `last_field_updated: status`, `updated_at: 2026-09-02T01:49:42`, and removed the final newline. The body is otherwise identical to base.
  - Ours has `status: bundled`, `bundled_in: bundle-5607a08d` and `updated_at: 2026-10-25T22:19:53`, plus a reflowed body and the "Superseded in part by BUG-44" section.
  - Ours is the later timestamp and the later lifecycle state. Ours went through ready_to_reconcile and on to bundled, which already covers theirs. Taking theirs would move the status backwards and lose the BUG-44 section.
  - Flagged for post-merge review, as the enrichment rule asks (intent was unknown on one side).

## Incoming changes preserved

No code files were in conflict. The incoming change was a status transition that ours has already moved past (ready_to_reconcile -> bundled), so leaving it out is intended and nothing was discarded. The staged blob equals HEAD (fa5ea5a3), so this commit nets to no diff. Finalize should detect that and skip the commit.
