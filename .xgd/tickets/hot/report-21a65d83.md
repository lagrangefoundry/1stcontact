---
uid: report-21a65d83
id: REPORT-5480
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:43:36.744270+00:00'
updated_at: '2026-09-29T05:43:36.744270+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Path sits outside the sparse-checkout cone (11% checkout),
  so staging used `git add --sparse`.

  Incoming (`235bdfc02d`, "xgd(ticket): update bug bug-034bf955") is a
  one-line addition against the ticket's stub state: `chat_comment:
  comment-77992e39` under `fields:`. Its base (stage 1) is the stub —
  `title: Untitled`, `status: draft`, body `(new ticket)`.

  HEAD is a strict superset of that intent: it already carries
  `chat_comment: comment-77992e39`, plus the fully written-up BUG-42
  ticket (`status: free_and_reconciled`, `severity`, `commits`,
  `version`, `story_points`, `bundled_in`, and the Symptom / Root cause /
  Fix / Test plan body).

  The conflict is therefore not competing facts — it is the same single
  fact, already present on ours, against a side that lacks every later
  field. Per 2e ("one side a strict superset: keep the superset"), kept
  HEAD in full. Resolved by deleting the conflict markers in place rather
  than `checkout --ours`, so the result is byte-identical to HEAD.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-034bf955.md` — confirmed. `git show
  235bdfc02d -- <path>` shows the commit's entire payload is the added
  line `  chat_comment: comment-77992e39`; `git show :<path>` has it at
  line 17. Nothing from the incoming side was discarded.

No hunks were dropped under the BUG-1301 precedence exception; no test
files were touched.

## Staging state

`git status --porcelain` is empty — no conflict classes remain, and the
staged tree matches HEAD (the incoming payload was already landed by an
earlier commit in this resync queue). CHERRY_PICK_HEAD is intact at
`235bdfc02d07f5d924bdb77dff605d34781f86b0`; the finalize step will see a
clean staged diff and skip the commit. No `cherry-pick --continue/--skip/
--quit/--abort` was run.
