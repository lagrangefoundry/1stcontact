---
uid: report-a017332f
id: REPORT-7455
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:15:28.002054+00:00'
updated_at: '2026-11-01T07:15:28.002054+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-da60b61b.md` (REQ-169, "Terms of service: accepted before the builder loads") — class 2e (intent/bookkeeping ticket; request type, lives in hot/ but is not a spec ticket). Rule applied: one side is a strict superset / later state → keep the superset (OURS / HEAD, blob 189e4c6f).
  - Incoming (2e6e671a31, "update request request-da60b61b"): status draft → free_coding, updated_at 2026-09-03T21:41:06, last_field_updated: status. Nothing else.
  - HEAD: status bundled, updated_at 2026-11-01T05:18:04, story_points 2, commits[] (f205968b, fe95f12f), version 0.2.62, bundled_in bundle-94dbe947, plus added design paragraph and "What was built" / "Test plan" sections.
  - The only overlapping facts (status, updated_at) are lifecycle progression: free_coding precedes bundled, and HEAD's timestamp is ~2 months later. Taking incoming would regress the ticket's status and drop the bundle linkage. HEAD already reflects (and supersedes) the incoming status transition.
  - Resolved in the index only (file is outside the sparse cone): `git update-index --cacheinfo` with HEAD's blob, skip-worktree bit restored.

## Incoming changes preserved

No code files were in conflict. The incoming commit's sole change (status advance to free_coding) is subsumed by HEAD's later status (bundled); the commit is redundant on this branch, so the staged result nets to no diff vs HEAD for this file. Finalize step should detect the empty diff and skip.

Untouched: unstaged xgd bookkeeping (`.xgd/_changes/log.ndjson`, `meta.json`, untracked `report-eba79287.md`) written by the conflict-report tooling — left for the orchestrator.
