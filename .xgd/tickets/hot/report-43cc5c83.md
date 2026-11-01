---
uid: report-43cc5c83
id: REPORT-7435
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:02:35.124660+00:00'
updated_at: '2026-11-01T07:02:35.124660+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-8c5c0bb6.md`: intent/bookkeeping ticket (2e, request). Outside the sparse cone, so the conflict existed only in the index. Rule: one side is a strict superset, so keep the superset (ours/HEAD, blob 553c6dd).
  - Incoming 07b8f1ba2c ("update request request-8c5c0bb6") changed two things: it appended the "## What the implementation added, and why" section and bumped `updated_at` to 2026-09-03T03:24.
  - HEAD already has that same section, word for word, plus newer frontmatter: `status: bundled`, `last_field_updated: status`, the `commits` list, `version: 0.2.59`, `bundled_in: bundle-94dbe947` and `updated_at` 2026-11-01. HEAD's `updated_at` is later, so it wins on that one shared field.
  - Resolved by setting the index entry to the ours blob (`git update-index --cacheinfo`) and restoring the skip-worktree bit. The staged diff against HEAD is empty, so this commit is redundant and finalize should skip it.

## Incoming changes preserved

- No code files were involved. The incoming commit's only substantive change, the appended body section, is already in HEAD verbatim, so it was redundant rather than discarded. The one difference is that the HEAD copy has no trailing newline.
