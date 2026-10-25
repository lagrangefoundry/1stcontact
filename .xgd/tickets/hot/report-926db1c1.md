---
uid: report-926db1c1
id: REPORT-6693
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:55:37.515696+00:00'
updated_at: '2026-10-25T22:55:37.515696+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e); kept our side as a strict superset. The incoming commit 2f771ca6e2 ("update bug bug-8dfa60ea") only changes the frontmatter against the merge base: status free_coding -> free_coded, updated_at 2026-09-02, adds `commits` (working_sha fd6aa2bf39) and `version: 0.2.41`. Its body is byte-identical to the base. HEAD already carries the same `commits` and `version` values, plus the later state: status `bundled` (updated_at 2026-10-25), `bundled_in: bundle-5607a08d`, `story_points: 3`, and the rewritten body including the "Superseded in part by BUG-44" section. Resolved with `git checkout --ours` + `git add --sparse` (the file is outside the sparse cone).

## Incoming changes preserved

There are no code files. Every fact the incoming commit changed (the commits entry, version) is already in HEAD with identical values. The only incoming value not kept is status `free_coded`, which HEAD's later `bundled` status supersedes. This is a redundant commit, not a discard: the staged result has no diff against HEAD, so finalize should skip it.
