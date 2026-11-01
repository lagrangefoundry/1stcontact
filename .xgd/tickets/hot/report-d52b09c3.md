---
uid: report-d52b09c3
id: REPORT-7355
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:11:59.383434+00:00'
updated_at: '2026-11-01T06:11:59.383434+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-631866be.md`: intent/bookkeeping ticket (2e), UU, index-only (outside the sparse cone). Rule: one side is a strict superset, so keep the superset. Resolved with `git checkout --ours`, then `git add --sparse`.
  - Incoming (e7a9ab6, 2026-09-02 23:43): added the "What landed" and "Test plan" body sections, set `last_field_updated: body`, added a trailing newline.
  - HEAD (2026-10-30): already has both body sections, identical text, plus status `free_and_reconciled`, `completed_at`, and `bundled_in: bundle-5607a08d`.
  - Status, `updated_at`, `completed_at` and `last_field_updated` changed on both sides. HEAD's values are the later state (and the more recent by timestamp).

## Incoming changes preserved

No code files were involved. The incoming commit's body additions are already in HEAD, unchanged. The only things not carried over are its stale timestamp/status metadata, superseded by HEAD's later values, and a trailing newline at EOF (cosmetic). The staged diff is empty versus HEAD, so the commit is redundant (BUG-1109/1122 shape), not discarded.
