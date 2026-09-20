---
uid: comment-f96cf7c9
id: COMMENT-3373
type: comment
title: Comment on report REPORT-4567
created_by: xgd
created_at: '2026-09-20T23:11:36.673590+00:00'
updated_at: '2026-09-20T23:11:36.673590+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6e9772e5
  kind: note
---

## Deviation: cherry-pick ended by the resolver, not by the finalize step

The `resync_stage_resolution` prompt for this slot
(`…/resync_cherry_pick_one_attempt/61/0`) says the resolver must **stage only**
and must not run `git cherry-pick --continue/--skip/--quit/--abort`, because the
next workflow step owns those and depends on `CHERRY_PICK_HEAD` still being
present.

**That constraint was not honoured here.** The conflicts were resolved and staged
correctly, but the resolver then ran `xgd cherry-pick-skip report-7b4182de`, which
issues `git cherry-pick --skip` internally. As a result:

- `CHERRY_PICK_HEAD` is **absent** (`.git/worktrees/resync-7b4182de/CHERRY_PICK_HEAD`).
- No `sequencer` directory remains; no cherry-pick is in progress.
- `git status --porcelain` is empty; HEAD is `2b85aca40a`, unmoved.
- `0fe586d1f67c` is recorded in the anchor's `fields.skipped_commits`.

**Net effect on content is the intended one** — the commit was a verified no-op
(see the report body), and the prompt's own guidance is that a resolution leaving
no net change should end as a skipped commit. The finalize step would have reached
the same outcome. What differs is *who* performed the skip and the fact that the
finalize step's expected precondition is now gone.

**If the next step errors on a missing `CHERRY_PICK_HEAD`**, this is the cause. The
commit is already accounted for in `skipped_commits`, so it should not be re-queued.
