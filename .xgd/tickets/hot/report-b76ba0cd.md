---
uid: report-b76ba0cd
id: REPORT-2869
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:51:03.926472+00:00'
updated_at: '2026-08-31T08:51:03.926472+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-7bef34e0.md` — class **AA** (both added), intent/bookkeeping ticket (rule **2e**).
  Both sides created the file independently; the sides are byte-identical except that the
  incoming (free_coded) side carries one extra frontmatter field:
  `chat_comment: comment-5dcdad31`. The incoming side is therefore a **strict superset** of
  HEAD's version, so 2e's "keep the superset" branch applies directly — no per-fact timeline
  lookup was needed, because there is no fact that the two sides state differently.
  Resolved with `git checkout --theirs`, staged with `git add --sparse` (path is outside the
  sparse-checkout cone per DOC-986 §2/§4.1).

No other conflict-class entries were present: `git status --porcelain` reported exactly one
`AA` line and no `UU`/`DU`/`UD`/`AU`/`UA`/`DD` lines. No code, test, spec-ticket, or config
files were in conflict.

## Incoming changes preserved

- `.xgd/tickets/hot/request-7bef34e0.md` — **preserved in full.** The staged blob is
  `f5ec30fcb31015807486be4a4c05e3192c8e2d67`, which is byte-identical to stage 3 (the
  incoming side of the conflict). Nothing from the incoming commit
  `9eba894e9df8b44190761d60ddf570fdd63b2317` was dropped, and nothing from HEAD's version was
  lost either, since HEAD's content is wholly contained in the incoming version.
  `git diff --cached` against HEAD for this file is exactly one added line
  (`+  chat_comment: comment-5dcdad31`), matching the sole delta between the two sides.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No UAT test
files were involved.

## Git state

Only `checkout --theirs` and `add --sparse` were issued, each as the sole content of its own
call. The cherry-pick sequencer state (`CHERRY_PICK_HEAD` =
`9eba894e9df8b44190761d60ddf570fdd63b2317`) is untouched and still present for
`cherry_pick_finalize_resolution`.
