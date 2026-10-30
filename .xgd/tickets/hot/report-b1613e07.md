---
uid: report-b1613e07
id: REPORT-4572
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:27:00.804362+00:00'
updated_at: '2026-09-20T23:27:00.804362+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (class 2e).
  Incoming (`1c5985f87d`, "xgd(ticket): update bug bug-a98fb3b0") adds exactly
  one field to `fields:` — `chat_comment: comment-dd005f45` — against the
  ticket's original draft state (`title: Untitled`, `status: draft`, body
  `(new ticket)`).
  HEAD is a far later state of the same ticket (real title, `status:
  free_and_reconciled`, full symptom/root-cause/fix/test-plan body, plus
  `severity`, `commits`, `version`, `story_points`, `bundled_in`) and **already
  contains `chat_comment: comment-dd005f45`**.
  Rule applied: 2e strict-superset — HEAD's `fields:` block is a superset of
  incoming's; kept the superset. No fact is changed differently on the two
  sides, so no per-fact timeline arbitration was needed. The conflict hunk
  covered only the frontmatter `fields:` region; the body merged cleanly to
  HEAD's full text.
  Staged with `git add --sparse` (path is outside the 11% sparse-checkout cone,
  per DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: the sole incoming change,
  `chat_comment: comment-dd005f45`, is present in the staged index version
  (verified via `git show :.xgd/tickets/hot/bug-a98fb3b0.md` — line 17 of the
  frontmatter). Nothing from the incoming side was discarded.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply
to this conflict. No UAT test files were involved.

## Staging state

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain and the
resolution is byte-identical to HEAD (expected, since incoming's content was
already integrated). CHERRY_PICK_HEAD is left in place untouched — the
cherry-pick was NOT continued, skipped, quit, or aborted. Python's finalize
step will observe the clean staged diff and skip the commit.
