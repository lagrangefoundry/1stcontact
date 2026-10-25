---
uid: report-ff166a29
id: REPORT-6724
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:35:27.362532+00:00'
updated_at: '2026-10-25T23:35:27.362532+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-364445f8.md`: intent/bookkeeping ticket (2e), conflict was index-only because the path is outside the sparse checkout. Kept ours (HEAD) with `git checkout --ours` then `git add --sparse`.
  - Incoming (18da6ab5, "update bug bug-364445f8", 2026-09-02) changes only `updated_at` (to 21:13:03Z) and `last_field_updated` (to story_points). It changes no field values: `story_points: 3` is already present on both sides.
  - HEAD has the newer values for both of those fields (updated_at 2026-10-25T22:19:54Z, last_field_updated status, from the change to `bundled` with `bundled_in: bundle-5607a08d`). Per-fact, the later state wins, which is HEAD for every fact.

## Incoming changes preserved

No code files were involved. The incoming commit has no substantive change: its only effect, story_points=3, is already in HEAD. The staged result matches HEAD, so the commit is redundant and the finalize step should skip it. CHERRY_PICK_HEAD is still present.
