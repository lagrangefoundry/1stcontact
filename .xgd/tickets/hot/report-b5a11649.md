---
uid: report-b5a11649
id: REPORT-6333
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:57:50.476462+00:00'
updated_at: '2026-10-05T03:57:50.476462+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` (BUG-41), bookkeeping ticket (2e), resolved `--ours`, strict superset.
  Pick `dadea5a9b4` (2026-09-01 13:46:22) onto HEAD `7ef32ed2d6`. Base `44148bf6e0`, ours `f9b1247169` (== HEAD), theirs `e14b489d40`.
  Theirs moves draft→free_coding and adds title, full body and `severity: medium`. Ours carries all of that verbatim. `git diff :3: :2:` shows only later lifecycle fields on ours (`free_and_reconciled`, `completed_at`, `commits`, `version 0.2.35`, `story_points`, `bundled_in`), the 09-19 `updated_at` and the EOF newline.
  These are the same blobs as the reconcile-BUNDLE-29 resolution REPORT-6160.

## Incoming changes preserved

There are no code files. Every fact the incoming commit introduced is already present in HEAD, so the net change is zero (`git status --porcelain` is empty) and CHERRY_PICK_HEAD is intact.

## Forecast

Next picks: `370ff62593` and `04385bcaa1` are expected to go `--ours`. The 09-19 tip wins `updated_at` only.
