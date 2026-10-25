---
uid: report-d9cf3c5c
id: REPORT-6694
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:56:20.916923+00:00'
updated_at: '2026-10-25T22:56:20.916923+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e); kept our side as a strict superset. Incoming commit 3f7963de37 ("update bug bug-8dfa60ea", 2026-09-02T00:43:49) adds `story_points: 3` and replaces the pre-fix body with the "Behaviour delivered" / "What is mechanical" / "Evidence" / "Existing tests changed" / "Regression" sections and a new "role / republishable on a search hit" not-in-scope item. HEAD already has `story_points: 3` and all of those sections with the same text (unwrapped), plus the later state: status `bundled` (updated_at 2026-10-25), `bundled_in: bundle-5607a08d`, and the "Superseded in part by BUG-44" section. Resolved with `git checkout --ours` + `git add --sparse` (outside the sparse cone).

## Incoming changes preserved

There are no code files. Every incoming fact (story_points, the delivered-behaviour body, the extra not-in-scope bullet) is already in HEAD. The only incoming values not kept are `last_field_updated: story_points` and its 2026-09-02 updated_at; HEAD's later bookkeeping supersedes both. This is a redundant commit, not a discard: the staged result has no diff against HEAD.
