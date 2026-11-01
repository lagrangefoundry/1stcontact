---
uid: report-9b4c0861
id: REPORT-7771
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:04:46.196579+00:00'
updated_at: '2026-11-01T16:04:46.196579+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51): intent/bookkeeping ticket (2e), UU, outside the sparse cone (conflict existed only in the index). Rule applied: **strict superset, keep the superset**, which is OURS (HEAD, stage 2, blob 4ef51f8a).
  - Base: draft stub with no `chat_comment`, title "Untitled", body "(new ticket)".
  - Incoming (8ad9c00bb9, "update bug bug-61165116"): changes base only by adding `fields.chat_comment: comment-cc47f70c`.
  - HEAD: already has `chat_comment: comment-cc47f70c` (same value), plus the full title and body, `status: bundled`, `severity`, `commits`, `version` and `bundled_in: bundle-39edf66d`.
  - Resolved in the index with `git update-index --cacheinfo` to the stage-2 blob, and the skip-worktree bit was restored to keep the sparse state.

## Incoming changes preserved

The incoming commit's only change (`chat_comment: comment-cc47f70c`) is present, with the same value, in the resolved version. Nothing was discarded. The resolution has no net diff vs HEAD because the commit is redundant on this branch, not discarded (STEP 4 / BUG-1109): finalize should detect the empty staged diff.

No code files were involved.
