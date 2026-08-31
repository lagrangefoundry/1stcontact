---
uid: report-aa9e7da6
id: REPORT-2739
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:10:52.021536+00:00'
updated_at: '2026-08-31T06:10:52.021536+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-1404344e.md` — **AA** (both added), intent/bookkeeping
  ticket (rule 2b + 2e). Both sides are byte-identical except that the incoming
  (free_coded) side adds one field: `fields.chat_comment: comment-d1f8ff54`.
  Incoming is a strict superset, so the superset was kept
  (`git checkout --theirs` + `git add --sparse`; path is outside the
  sparse-checkout cone). No per-fact timeline lookup was needed — there is no
  fact that both sides changed differently, only a field one side never touched.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-1404344e.md` — verified: the staged blob is
  byte-identical to the incoming commit's version
  (`git diff --cached 9246ecf7 -- <path>` is empty). The incoming commit adds
  the file with 141 lines; the sole delta against the HEAD side
  (`+  chat_comment: comment-d1f8ff54`) is present in the resolution.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code, test, or UAT files were involved in this conflict.

Staging state: `M  .xgd/tickets/hot/bug-1404344e.md`, no conflict-class entries
remain. Cherry-pick sequencer state (CHERRY_PICK_HEAD) left intact for
cherry_pick_finalize_resolution.
