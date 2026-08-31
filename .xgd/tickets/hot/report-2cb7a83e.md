---
uid: report-2cb7a83e
id: REPORT-2997
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:24:46.857450+00:00'
updated_at: '2026-08-31T16:24:46.857450+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Conflict existed only in the index; the path is outside the sparse-checkout
  cone on this reconcile branch (DOC-986 §2/§4.1), so there were no working-tree
  markers. Resolved with `git checkout --ours` + `git add --sparse`.

  **Why ours:** ours is a strict superset of theirs, not a competing edit.
  - Merge base (`fec72d60`) is the freshly-seeded stub: `title: Untitled`,
    `status: draft`, body `(new ticket)`.
  - Incoming (`1c5985f8`, free_coded, `xgd(ticket): update bug bug-a98fb3b0`)
    changed exactly one line against that stub: `+  chat_comment: comment-dd005f45`.
  - Ours (HEAD, `xgd(ticket): seed_local_overlay bug bug-a98fb3b0`) carries the
    fully populated BUG-38 ticket — real title, `status: bundled`,
    `severity`/`commits`/`version`/`story_points`/`bundled_in` fields, and the
    full Symptom / Root cause / Fix / Test plan body — **and already contains
    `chat_comment: comment-dd005f45`**, the incoming side's only change.

  There is no fact changed differently on the two sides, so the per-fact
  timeline rule in 2e never engages: every field the incoming commit touches is
  present in ours with the identical value, and every other field is untouched
  on the incoming side. Keeping the superset loses nothing from either side and
  invents nothing.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — PRESERVED. The incoming commit's entire
  diff is the single line `chat_comment: comment-dd005f45`, which is present in
  the resolved (staged) blob `8645c567` under `fields:`. Verified with
  `git show 1c5985f8 -- <path>` against `git show :<path>`.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.

## Note for the finalize step

This resolution nets to **no diff vs HEAD** — the staged blob is byte-identical
to HEAD's, because the seed_local_overlay commit on the bundle branch already
landed the incoming commit's effect through a different route. Per STEP 4 this
is the redundant-commit case (BUG-1109/BUG-1122), not a discard: STEP 3's check
distinguishes them, and it confirms the incoming change is *present* in HEAD
rather than absent. `--skip` was deliberately NOT called; CHERRY_PICK_HEAD is
left intact for `cherry_pick_finalize_resolution` to handle.
