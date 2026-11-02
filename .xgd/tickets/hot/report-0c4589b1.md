---
uid: report-0c4589b1
id: REPORT-8194
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:37:11.150946+00:00'
updated_at: '2026-11-02T01:37:11.150946+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-4a4ca4a1.md` — intent/bookkeeping ticket (2e), conflict only in the index (outside the sparse cone). Rule: one side is a strict superset, so it was kept. Resolved to HEAD's blob d2ffd57ef5 and the skip-worktree bit was kept, to match the sparse checkout.
  - Base → incoming (6354c999b4, "update request request-4a4ca4a1"): only `updated_at` 2026-09-06, `last_field_updated: status`, `status: draft → free_coding`.
  - Base → HEAD: `updated_at` 2026-11-01, `last_field_updated: status`, `status: bundled`, story_points 5, commits list, version 0.2.114, `bundled_in: bundle-5052a63c`, plus body additions.
  - The only overlap is the same three fields (updated_at, last_field_updated, status). HEAD's values are the later facts: the request moved on from free_coding to bundled in this bundle. Incoming adds nothing HEAD lacks.

## Incoming changes preserved

No code files are involved. The incoming commit is a stale status transition that HEAD already supersedes (HEAD's state is later in the request's lifecycle), so the resolution nets to no diff vs HEAD. This is a redundant commit, not discarded developer work. Finalize should detect the empty staged diff and skip it.
