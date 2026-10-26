---
uid: report-a1b506fd
id: REPORT-6756
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-26T00:31:50.094008+00:00'
updated_at: '2026-10-26T00:31:50.094008+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-46140599.md` (BUG-49): intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: one side is a strict superset, so I kept the superset (ours / HEAD). This also matches the enrichment rule ("take the more recent by timestamp"): ours is updated_at 2026-10-25T22:19:55, theirs is 2026-09-02T23:29:53.
  - Theirs (46d977cc55, "update bug bug-46140599") changed only the criterion-5 paragraph and the updated_at/last_field_updated bookkeeping, with status still `draft`.
  - Ours already contains that exact criterion-5 rewrite, plus the later status `bundled`, `commits`, `version: 0.2.47` and `bundled_in: bundle-5607a08d`.
  - Resolved with `git checkout --ours` and `git add --sparse`. The staged blob is d1bad356, the same as HEAD.

## Incoming changes preserved

No code files were involved. The only substantive change in the incoming commit is the criterion-5 body text, and it is already present word for word in HEAD's version. The commit is therefore redundant on this branch, not discarded. The staged diff vs HEAD is empty, so the finalize step should skip it.
