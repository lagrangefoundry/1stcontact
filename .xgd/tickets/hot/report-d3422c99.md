---
uid: report-d3422c99
id: REPORT-3354
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:34:29.525518+00:00'
updated_at: '2026-09-02T20:34:29.525518+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket (rule **2e**,
  "one side is a strict superset of the other: keep the superset").
  Resolved to the HEAD-side blob via `git checkout --ours` (not a hand-edit, so no
  stale frontmatter is reintroduced), then `git add --sparse`.

  Detail: the incoming commit `1c5985f87d8b731585989ba7b2e87183d5731290`
  (`xgd(ticket): update bug bug-a98fb3b0`, 2026-08-24) changes exactly one line —
  it appends `chat_comment: comment-dd005f45` to `fields:` on a ticket that was
  otherwise still `status: draft` / `title: Untitled` / body `(new ticket)`.

  HEAD carries that same `chat_comment: comment-dd005f45` line with the identical
  value, plus everything the ticket subsequently accumulated: real title
  ("Builder chat: every turn fails in the cloud with 'conversation is no longer
  open'"), `status: free_and_reconciled`, `completed_at`, and the `severity`,
  `commits`, `version`, `story_points`, `bundled_in` fields, along with the full
  Symptom / Root cause / Fix / Test plan body.

  Git had in fact already auto-merged the incoming line (it sits outside the
  conflict markers at line 17); the residual conflict was purely HEAD's extra
  `fields:` entries against an empty incoming side. No fact was changed
  differently on the two sides, so no `xgd working-timeline` tiebreak was needed
  and no per-fact composition was required.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: **preserved.** The incoming commit's sole
  change, `chat_comment: comment-dd005f45`, is present verbatim in the resolved
  file at line 17. Verified with `git show 1c5985f8 -- <file>` (one-line diff)
  against the resolved working-tree file.

No hunks were dropped; the BUG-1301 precedence exception was not invoked, and no
UAT/code files were involved in this conflict.

## Note: resolution nets to no diff vs HEAD

`git diff --cached HEAD` is empty — this commit's effect (the `chat_comment`
field) already reached this branch through a later route, so replaying it adds
nothing. This is the BUG-1109/BUG-1122 redundant-commit case, **not** a discard:
per STEP 3 the two are told apart by whether the incoming commit's key change is
*present* in HEAD (redundant) or *absent* (discarded), and here it is present.

Per STEP 4, `--skip` was NOT called; the resolution is staged and the cherry-pick
sequencer state is untouched (`CHERRY_PICK_HEAD` still resolves to
`1c5985f87d8b731585989ba7b2e87183d5731290`) for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.
