---
uid: report-e7a65839
id: REPORT-8188
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:34:21.451367+00:00'
updated_at: '2026-11-02T01:34:21.451367+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-4a4ca4a1.md` (REQ-194). File class: 2e, intent/bookkeeping ticket. Rule: keep the superset. Resolved with `git checkout --ours`, then `git add --sparse`. The incoming commit 81241812 (2026-09-06) only adds `fields.chat_comment: comment-d079cf1f`, plus a trailing-newline change at EOF. HEAD already has that same field, and on top of it the later status `bundled`, `bundled_in: bundle-5052a63c`, the commits list, `version`, `story_points: 5`, and the expanded body and acceptance list. HEAD is a strict superset.

## Incoming changes preserved

- `chat_comment: comment-d079cf1f` is in the resolved file, which is identical to HEAD. The resolution has no staged diff against HEAD: the commit is redundant, not discarded (BUG-1109/BUG-1122 shape). The only incoming change not kept is the dropped trailing newline at EOF, which is whitespace only.
- No other paths were staged. `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json` and the untracked `.xgd/tickets/hot/report-e756ce32.md` are outside 81241812's diff and were left untouched and unstaged.
