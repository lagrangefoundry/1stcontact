---
uid: report-2248a19b
id: REPORT-7659
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:53:41.172563+00:00'
updated_at: '2026-11-01T14:53:41.172563+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-8c5c0bb6.md` (REQ-168): intent/bookkeeping ticket (2e). HEAD side kept (`git checkout --ours`, `git add --sparse`); this file is outside the sparse cone.
  - Incoming e1923b31cc (2026-09-03) changed only frontmatter: status `draft` -> `free_coded`, `last_field_updated: status`, plus added `fields.commits` (two working_shas b4bc4cb0, db107b25) and `fields.version: 0.2.59`. It also dropped the trailing newline.
  - HEAD already has a strict superset: the same `commits` and `version` fields, plus a later lifecycle state (`status: free_and_reconciled`, `completed_at` 2026-11-01, `updated_at` 2026-11-01, `bundled_in: bundle-94dbe947`).
  - The conflicting facts (status, updated_at, completed_at, bundled_in) go to HEAD, which is the later position: free_and_reconciled comes after free_coded in the lifecycle, and the timestamps are two months newer. The body is identical on both sides.

## Incoming changes preserved

- No code files involved.
- The incoming commit's lasting additions (`fields.commits`, `fields.version`) are already in HEAD, so nothing is lost. Its status change to `free_coded` has been superseded by a later state on HEAD, so this commit is redundant rather than discarded.
- The staged diff against HEAD is empty; finalize should detect this and skip the commit.
