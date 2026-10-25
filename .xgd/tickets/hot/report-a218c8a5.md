---
uid: report-a218c8a5
id: REPORT-6723
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:34:35.754925+00:00'
updated_at: '2026-10-25T23:34:35.754925+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md`: intent/bookkeeping ticket (2e), conflict was index-only because the path is outside the sparse checkout. Rule: one side is a strict superset, so keep the superset (ours/HEAD). Resolved with `git checkout --ours` then `git add --sparse`.
  - Incoming (fe7fa02c, "update bug bug-364445f8"): status free_coding -> free_coded, updated_at 2026-09-02T21:13:00Z, added `commits` [working_sha f929d426eb93cf9a23585c5d101eb9e60612fbd7] and `version: 0.2.43`.
  - HEAD: the same `commits` entry and `version: 0.2.43`, plus a later status (`bundled`), `bundled_in: bundle-5607a08d`, updated_at 2026-10-25T22:19:54Z. The body is the same on both sides.
  - HEAD contains every fact the incoming side adds, and every fact where they differ is newer on HEAD (status, timestamp).

## Incoming changes preserved

No code files were involved. The incoming ticket changes (commits entry, version) are already in HEAD. The incoming status `free_coded` has since been superseded by `bundled`. The staged result matches HEAD, so this cherry-pick is redundant (BUG-1109/BUG-1122 shape) and the finalize step should skip it. CHERRY_PICK_HEAD is still present.
