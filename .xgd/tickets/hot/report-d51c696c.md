---
uid: report-d51c696c
id: REPORT-6720
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:30:35.312843+00:00'
updated_at: '2026-10-25T23:30:35.312843+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md`: intent/bookkeeping ticket (2e), resolved per fact. Kept OURS (stage 2, blob b0ba8eb8).
  - Incoming e6caaf8c ("update bug bug-364445f8") changes exactly one fact relative to base: a status transition from `draft` to `free_coding`, with `updated_at` 2026-09-02T21:04:50.
  - OURS already has a later transition on that same field: `status: bundled`, with `updated_at` 2026-10-25T22:19:54 and `bundled_in: bundle-5607a08d`.
  - Status is a lifecycle field (draft → free_coding → … → bundled), so the later-positioned state wins for this fact. The enrichment's "more recent commit by timestamp" rule points the same way.
  - Applying incoming would also have dropped the `commits`/`version`/`bundled_in` fields and the "What was implemented" and "Test plan" sections, none of which incoming touched relative to its base.
  - The path is outside the sparse cone, so the OURS blob was staged into the index via `git update-index --cacheinfo` and skip-worktree was set.

## Incoming changes preserved

- The incoming status change (`free_coding`) is superseded, not discarded. It is an earlier lifecycle step that HEAD has already moved past (`bundled`).
- The net staged diff against HEAD is empty: a redundant historical commit, left for finalize to skip. No `--skip` was run here.
- No code files were involved.

## Flag for post-merge review

The enrichment asked for this file to be flagged because the intent is unknown on one side. Risk is low, since the resolved content equals HEAD.
