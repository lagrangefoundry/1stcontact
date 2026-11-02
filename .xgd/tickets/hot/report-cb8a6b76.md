---
uid: report-cb8a6b76
id: REPORT-8220
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:45:23.430410+00:00'
updated_at: '2026-11-02T01:45:23.430410+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-4a4ca4a1.md` — class 2e (intent/bookkeeping request ticket; sparse/index-only conflict). Rule: one side is a strict superset → keep superset (HEAD, blob d2ffd57ef5). Staged via `git checkout --ours` + `git add --sparse`.
  - Incoming 987f7782b0 (2026-09-06T19:32:52): story_points 3→5, last_field_updated→story_points, updated_at bump.
  - HEAD (updated_at 2026-11-01T23:18): already has story_points 5, plus later status `bundled`, `bundled_in: bundle-5052a63c`, same commits list/version. Body untouched on both sides.
  - Matches enrichment rule "take the more recent commit by timestamp" — HEAD is later. Flagged for post-merge review per that rule (intent unknown on HEAD side); no content risk expected.

## Incoming changes preserved

No code files. The incoming commit's only substantive fact (story_points: 5) is present in HEAD verbatim. Resolution nets to no diff vs HEAD because the change already landed (redundant), not because it was discarded.
