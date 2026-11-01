---
uid: report-4377a00f
id: REPORT-7465
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:20:38.711925+00:00'
updated_at: '2026-11-01T07:20:38.711925+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-da60b61b.md` — intent/bookkeeping ticket (request; STEP 2e). Rule: strict superset → keep superset (HEAD/ours). Also consistent with the enrichment rule "take the more recent commit by timestamp": ours `updated_at` 2026-11-01T05:18:04 vs incoming 2026-09-03T21:55:15.
  - Incoming (c6959cca05) changed only: `updated_at`, `last_field_updated: body`, plus body additions (the "comparison is against the constant" paragraph, and the "What was built" / "Test plan" sections).
  - HEAD already contains all of those body additions verbatim, plus newer frontmatter (`status: bundled`, `story_points: 2`, `commits`, `version: 0.2.62`, `bundled_in: bundle-94dbe947`).
  - Resolved in-index (outside sparse cone) to HEAD blob 189e4c6f; skip-worktree bit restored. Net staged diff vs HEAD is empty — the incoming commit is redundant, so finalize should skip it as an empty commit.

## Incoming changes preserved

No code files. For the ticket: every body hunk from the incoming commit is already in HEAD, so nothing was discarded. Only the incoming's older `updated_at`/`last_field_updated`/`status: free_coding` frontmatter values were superseded by HEAD's later state.

## Notes for post-merge review

- HEAD's version of this ticket ends with a stray `-` line after "projects." (looks like a truncated `---`). It was already there before this conflict and is left as-is.
- Unrelated working-tree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `report-214ca059.md`) are not part of this cherry-pick and were left untouched.
