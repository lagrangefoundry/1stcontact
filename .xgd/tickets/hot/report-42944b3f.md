---
uid: report-42944b3f
id: REPORT-4838
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:15:06.025952+00:00'
updated_at: '2026-09-23T18:15:06.025952+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — UU on an intent/bookkeeping ticket
  (`bug-*`, STEP 2e). Resolution: kept HEAD in full, dropped the empty
  incoming block. Rationale: the incoming commit `235bdfc02d`
  ("xgd(ticket): update bug bug-034bf955") is a one-line diff adding
  `chat_comment: comment-77992e39`, and HEAD already carries that exact
  line. The conflict was purely contextual — HEAD's frontmatter has five
  further fields (`severity`, `commits`, `version`, `story_points`,
  `bundled_in`) and the full written-up ticket body, whereas the incoming
  side's base was still the `(new ticket)` stub. HEAD is therefore a strict
  superset of the incoming side ("one side a strict superset: keep the
  superset"), and is also the later intent (`updated_at: 2026-09-19T15:15`
  vs. the incoming commit's 2026-09-01 authorship). No per-fact conflict
  existed: no field was changed differently on the two sides.
  Staged with `git add --sparse` (path is outside the sparse-checkout cone
  on this resync branch, DOC-986 §2/§4.1).

The nine untracked `.xgd/tickets/cold/{comment,doc}-*.md` files were already
present before this step and are not conflicts; left untouched.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-034bf955.md` — CONFIRMED. `git show 235bdfc02d --
  .xgd/tickets/hot/bug-034bf955.md` is a single added line,
  `  chat_comment: comment-77992e39`; `git show
  :.xgd/tickets/hot/bug-034bf955.md` has that line at line 17. Nothing from
  the incoming commit was discarded.

No hunks were dropped under the BUG-1301 precedence exception; the exception
did not need to be invoked.

## Note for the next step

The staged tree now matches HEAD exactly for this path (the file does not
appear in `git status --porcelain`), so this cherry-pick has no net change.
Per STEP 4 this is left for Python's finalize step to detect and skip.
`CHERRY_PICK_HEAD` (`235bdfc02d07f5d924bdb77dff605d34781f86b0`) is intact;
no `--continue`/`--skip`/`--quit`/`--abort` was run.
