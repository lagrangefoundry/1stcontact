---
uid: report-5c9ed914
id: REPORT-6334
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:58:24.833587+00:00'
updated_at: '2026-10-05T03:58:24.833587+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (BUG-41), bookkeeping ticket (2e), resolved `--ours`, strict superset.
  Pick `370ff62593` (2026-09-01 13:49:57) onto HEAD `7ef32ed2d6`. Base `e14b489d40`, ours `f9b1247169` (== HEAD), theirs `c1b3b220d5`.
  Theirs moves free_coding→free_coded and adds `commits` and `version 0.2.35`. Ours carries both verbatim. `git diff :3: :2:` shows only later lifecycle fields on ours (`free_and_reconciled`, `completed_at`, `story_points`, `bundled_in`) and the 09-19 `updated_at`.
  These are the same blobs as the reconcile-BUNDLE-29 resolution REPORT-6163.

## Incoming changes preserved

There are no code files. Every fact the incoming commit introduced is already in HEAD, so the net change is zero (`git status --porcelain` is empty) and CHERRY_PICK_HEAD is intact.

## Forecast

Next pick: `04385bcaa1` (story_points) is expected to go `--ours`. The 09-19 tip wins `updated_at` only.
