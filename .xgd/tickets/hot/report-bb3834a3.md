---
uid: report-bb3834a3
id: REPORT-7353
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:11:17.823979+00:00'
updated_at: '2026-11-01T06:11:17.823979+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-631866be.md`: intent/bookkeeping ticket (2e), UU, index-only (outside the sparse cone). Rule: one side is a strict superset, so keep the superset. Resolved with `git checkout --ours`, then `git add --sparse`.
  - Incoming (2a5ab0cac7, 2026-09-02): status `free_coding` -> `free_coded`; added the `commits` block (working_sha 246333cbfe, version 0.2.48).
  - HEAD (2026-10-30): has the same `commits` block, plus status `free_and_reconciled`, `completed_at`, `bundled_in: bundle-5607a08d`, and the "What landed" / "Test plan" sections.
  - The two sides changed the same status field, and HEAD's value is the later lifecycle state (and the more recent by timestamp). Every other incoming change is already in HEAD.

## Incoming changes preserved

No code files were involved. The incoming commit's `commits` block is already in HEAD, unchanged. Its status `free_coded` was replaced by HEAD's later `free_and_reconciled`. The staged diff is empty versus HEAD, so the commit is redundant (BUG-1109/1122 shape), not discarded. The finalize step will skip it.
