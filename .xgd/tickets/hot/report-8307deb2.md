---
uid: report-8307deb2
id: REPORT-4420
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:21:34.451098+00:00'
updated_at: '2026-09-19T12:21:34.451098+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU**, intent/bookkeeping ticket (rule 2e,
  "one side is a strict superset"). Index-only conflict: the path is outside the
  sparse-checkout cone (DOC-986 §2/§4.1), so there were no working-tree markers —
  the three stages existed only in the index. Resolved with
  `git checkout --ours` + `git add --sparse`.

  Sides:
  - base (stage 1) `c2fe8643` — the stub ticket: `title: Untitled`, `status: draft`,
    body `(new ticket)`.
  - ours (stage 2) `a67d8704`, from `xgd(ticket): seed_local_overlay bug bug-034bf955` —
    the fully populated BUG-42 ticket: real title, `status: bundled`,
    `completed_at`, `severity`, `commits`, `version: 0.2.36`, `story_points`,
    `bundled_in: bundle-8e1807f6`, **and `chat_comment: comment-77992e39`**, plus the
    full Symptom / Root cause / Fix / Test plan body.
  - theirs (stage 3) `79bb5d09`, from the incoming commit `235bdfc0`
    `xgd(ticket): update bug bug-034bf955` — base plus exactly one line:
    `chat_comment: comment-77992e39`.

  No fact is asserted differently on the two sides, so the per-fact timeline rule
  never engages: ours is a strict superset of theirs. Taking theirs would have
  reverted the ticket to the `Untitled` / `draft` stub, discarding every field and
  the entire body.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-034bf955.md` — the incoming commit `235bdfc0` changes exactly
  one line, `+  chat_comment: comment-77992e39`. That line is present verbatim in the
  resolved file (line 17, under `fields:`). No incoming hunk was dropped, and the
  BUG-1301 precedence exception was not needed or invoked.

## Note for the finalize step

The staged tree nets to no diff vs HEAD (`git diff --cached HEAD` is empty). This is
the redundant-commit case described in STEP 4, not a discard: the incoming commit's
key change is *present* in HEAD, having arrived there through the `seed_local_overlay`
commit on the ours side, which wrote the same `chat_comment` value along with the rest
of the ticket. Per instruction, `--skip` was NOT called; `CHERRY_PICK_HEAD`
(`235bdfc02d07f5d924bdb77dff605d34781f86b0`) is intact for
`cherry_pick_finalize_resolution`.
