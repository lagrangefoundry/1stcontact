---
uid: report-c65161bc
id: REPORT-4751
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:58:28.918995+00:00'
updated_at: '2026-09-21T14:58:28.918995+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, intent/bookkeeping ticket
  (STEP 2e). Both sides are `xgd(ticket): update bug bug-3ade1af4`
  commits. The incoming commit (0170f868e2) is a single-line field
  addition (`chat_comment: comment-94979ef7`) against a base where the
  ticket body was still `(new ticket)`; git applied that line cleanly.
  The conflicted hunk was structural, not a competing fact: HEAD's side
  carried the ticket's later-accumulated fields (`severity`,
  `story_points`, `commits`, `version`, `bundled_in`) where the incoming
  commit's base had nothing at all. Non-overlapping fields, so per 2e
  both sides were applied: HEAD's field set retained in full, incoming's
  `chat_comment` retained above it. No field was changed differently on
  both sides, so the later-positioned-intent tiebreak was not needed and
  nothing was dropped from either side.

  Resolved out-of-cone via `git add --sparse` (DOC-986 §2/§4.1 — ticket
  paths are outside the sparse-checkout cone on resync branches).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-3ade1af4.md` — confirmed. `git show 0170f868e2`
  shows the commit's sole change is `+  chat_comment: comment-94979ef7`;
  `git show :.xgd/tickets/hot/bug-3ade1af4.md` shows that exact line
  present in the staged index version at line 17, directly under
  `priority: medium`. No hunks were dropped; the BUG-1301 precedence
  exception was not invoked.

## Note for the finalize step

`git status --porcelain` is empty: the resolved tree is byte-identical to
HEAD, because the incoming commit's only addition (`chat_comment`) was
already present on the HEAD side. This cherry-pick is therefore empty.
Per STEP 4 no `--skip` was issued here — staging is complete and
CHERRY_PICK_HEAD (0170f868e2) is intact for Python's finalize step, which
will detect the clean staged diff and skip the commit.
