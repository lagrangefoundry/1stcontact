---
uid: report-a3de69f4
id: REPORT-7441
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:06:55.811975+00:00'
updated_at: '2026-11-01T07:06:55.811975+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-8c5c0bb6.md` (REQ-168): class 2e (intent/bookkeeping ticket; UU, out of sparse cone, index-only conflict). Kept the HEAD (ours) side.
  - The markdown body is byte-identical on both sides; only frontmatter differs.
  - Ours: `status: bundled`, `updated_at: 2026-11-01T05:18:03Z`, adds `fields.bundled_in: bundle-94dbe947`.
  - Theirs (incoming e1923b31cc, "update request request-8c5c0bb6"): `status: free_coded`, `updated_at: 2026-09-03T03:28:54Z`. This is an older snapshot from before bundling.
  - Ours is a strict superset/advance of theirs (status progressed free_coded -> bundled, bundled_in added, same commits list). This matches 2e's "keep the superset" rule and the enrichment rule "take the more recent commit by timestamp". Ours is more recent by two months.
  - Staged ours (stage 2 blob) at stage 0. The skip-worktree bit is set because the path is outside the sparse cone.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only content for this file was the older `free_coded` status and the older `updated_at`, both superseded by HEAD's later bundling of the same request. The staged diff vs HEAD is empty. This commit is redundant on this branch, not discarded; finalize should detect the clean diff.

Flagged for post-merge review per the enrichment rule (intent unknown on one side), though the risk is low: the bodies are identical.
