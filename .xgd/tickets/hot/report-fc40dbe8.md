---
uid: report-fc40dbe8
id: REPORT-4110
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:11:12.450219+00:00'
updated_at: '2026-09-12T19:11:12.450219+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **AA (both added)**, intent/bookkeeping
  ticket (rule 2e, superset branch). Ours (HEAD) kept via
  `git checkout --ours` + `git add --sparse`.

  Ours is the ticket at `status: free_and_reconciled` with the real title
  ("Builder chat: every turn fails in the cloud with \"conversation is no
  longer open\""), full Symptom/Root cause/Fix/Test plan body, and fields
  `chat_comment`, `severity`, `commits`, `version`, `story_points`,
  `bundled_in`. Theirs is the original 18-line `create` stub: `title:
  Untitled`, body `(new ticket)`, `status: draft`, fields
  `auto_merge_back`/`needs_review`/`priority` only.

  Ours is a strict superset — every one of the stub's three fields is present
  in ours in evolved form, and no fact exists on the incoming side that is
  absent from ours. Ours is also the later-positioned side.

## Incoming changes preserved

Confirmed. The incoming commit (`4e5a8b2b`, "xgd(ticket): create bug
bug-a98fb3b0", Aug 24) is a pure creation of this one file — its entire
effect is "this ticket exists with uid `bug-a98fb3b0`, id `BUG-38`, type
`bug`, created_by `xgd`, created_at `2026-08-24T22:12:54.350656+00:00`, and
the three default fields." All of that is already present in HEAD.

This is the seeded-overlay case, not a discard. HEAD's history for the file is:

    cbdfed2e  xgd(ticket): seed_local_overlay bug bug-a98fb3b0
    01492336  xgd(ticket): update bug bug-a98fb3b0

There is no `create` commit in HEAD's history — the local overlay seed
introduced the ticket already populated, which is exactly why the cherry-pick
of the original `create` presents as add/add. The incoming commit's key
changes are present in HEAD via a different route, so per STEP 3 this is
redundant rather than discarded.

The staged diff vs HEAD is consequently empty. Per STEP 4 (BUG-1109/BUG-1122)
this is not a failure and `--skip` was not called; the cherry-pick sequencer
state (CHERRY_PICK_HEAD) is left intact for
`cherry_pick_finalize_resolution`.

No code/implementation files were in conflict. No test functions were deleted;
the BUG-1301 precedence exception was not invoked.
