---
uid: report-0abf456f
id: REPORT-6680
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:40:18.681014+00:00'
updated_at: '2026-10-25T22:40:18.681014+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule applied: superset / more-recent-by-timestamp (per the enrichment resolution rule). Kept OURS (stage 2) whole.
  - Theirs (incoming 6b10dae335 "update bug bug-8dfa60ea"): the original draft, `updated_at 2026-09-01T22:36:25`, status `draft`, body = initial root-cause analysis + fix plan + test plan.
  - Ours (HEAD): `updated_at 2026-10-25T22:19:53`, status `bundled`, `bundled_in: bundle-5607a08d`, plus `commits`, `version`, `story_points`. Same title and `severity: high` as theirs. Body is a later rewrite covering everything in the draft (symptom, root causes, fixes, tests), plus the delivered behaviour, evidence, and the "Superseded in part by BUG-44" section.
  - Every fact in the incoming version is either carried in ours or was replaced in ours by a later edit, so ours is the effective superset.
  - Staged by writing the stage-2 blob to index stage 0 and setting skip-worktree to match the sparse checkout.

## Incoming changes preserved

No code files were in conflict. The incoming ticket edit (title + severity + initial body) is already reflected in HEAD's later version; the resolution nets to no diff vs HEAD. This is a redundant commit, not a discard: HEAD's ticket history already includes and supersedes this draft edit. Finalize should detect the empty staged diff and skip.

Flagged for post-merge review per the enrichment rule (intent unknown on one side).
