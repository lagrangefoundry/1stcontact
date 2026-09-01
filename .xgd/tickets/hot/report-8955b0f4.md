---
uid: report-8955b0f4
id: REPORT-3193
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:52:51.759212+00:00'
updated_at: '2026-09-01T02:52:51.759212+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Ours (HEAD, `xgd(ticket): seed_local_overlay bug bug-a98fb3b0` lineage) is a
  strict superset of theirs (incoming `1c5985f87d`, `xgd(ticket): update bug
  bug-a98fb3b0`). Base is the empty `(new ticket)` draft; the incoming commit's
  ENTIRE delta vs base is one added line, `chat_comment: comment-dd005f45`,
  which HEAD already contains verbatim (line 17) — git auto-merged it outside
  the conflict block. The conflict block itself is HEAD-only additions
  (`severity`, `commits`, `version`, `story_points`, `bundled_in`) against an
  empty incoming side, i.e. no competing fact on any field.
  Resolved with `git checkout --ours` (verified `:2:` blob is byte-identical to
  the HEAD blob — empty diff), staged with `git add --sparse` (path is outside
  the sparse-checkout cone, DOC-986 §2/§4.1).
  No timeline lookup was needed: there is no field changed differently on the
  two sides, so 2e's per-fact timeline rule never triggers.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: incoming's only change,
  `fields.chat_comment: comment-dd005f45`, is PRESENT in the resolved file at
  line 17. Confirmed by `git show 1c5985f87d -- <file>` (single `+` line) and
  `grep -n chat_comment` on the resolved working-tree file.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

## Net-diff note (BUG-1109/BUG-1122)

The resolution nets to no diff vs HEAD, because HEAD already carries the
incoming commit's effect through a different route. Per STEP 4 this is the
redundant-commit case, NOT the discarded-changes case — STEP 3's check passes:
the incoming change is present in HEAD, not merely absent. `--skip` was not
called; the cherry-pick sequencer state (`CHERRY_PICK_HEAD` =
`1c5985f87d8b731585989ba7b2e87183d5731290`) is intact for
`cherry_pick_finalize_resolution` to detect and handle.

Post-resolution `git status --porcelain` shows no conflict-class entries
(only pre-existing untracked `comment-*`/`report-*` ticket files).
