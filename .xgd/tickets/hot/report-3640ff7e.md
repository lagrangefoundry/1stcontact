---
uid: report-3640ff7e
id: REPORT-4853
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:50:32.905451+00:00'
updated_at: '2026-09-23T18:50:32.905451+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — UU, intent/bookkeeping ticket (bug,
  STEP 2e). HEAD side is a strict superset of the incoming side: the incoming
  commit `ad63102c` adds exactly one field line
  (`chat_comment: comment-ab9333e3`) to the `(new ticket)` stub, and HEAD
  already carries that exact line alongside the ticket's later-developed
  content (title, `status: free_and_reconciled`, `completed_at`, `severity`,
  `commits`, `version`, `bundled_in`, and the full Symptom / Root cause / Fix /
  Test plan body). Per 2e "one side a strict superset: keep the superset",
  resolved to HEAD (`git checkout --ours`), then staged with
  `git add --sparse`.

No other conflict classes (AA / DU / UD / AU / UA) were present. The nine `??`
entries under `.xgd/tickets/cold/` are pre-existing untracked files, not part
of this cherry-pick, and were left alone.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-360c5a44.md` — verified against
  `git show ad63102c9a65c65bd8e166a568d73321fb8e3d9f -- <file>`. The commit's
  entire delta is the single added line `chat_comment: comment-ab9333e3`.
  That line is present in the resolved file (line 16). Nothing from the
  incoming side was discarded.

No hunks were dropped under the BUG-1301 precedence exception; it did not
apply here.

## Note on net effect

The resolution is byte-identical to HEAD, so `git diff --cached` is empty.
This is expected: the incoming field had already landed in HEAD through an
earlier path. `--skip` was deliberately NOT called — the tree is staged and
the finalize step will detect the clean staged diff. `CHERRY_PICK_HEAD`
(`ad63102c9a65c65bd8e166a568d73321fb8e3d9f`) remains present.
