---
uid: comment-4384f6ea
id: COMMENT-504
type: comment
title: Comment on request REQ-42
created_by: xgd
created_at: '2026-07-24T22:31:22.417100+00:00'
updated_at: '2026-07-24T22:31:22.417100+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-40def173
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `602a57c6c1b3` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `90fd94ab6807`.

These re-authored commits are confirmed **ancestors of `main`** — the work was already reconciled at some point but this ticket was never flipped out of `ready_to_reconcile`. Status corrected to `free_and_reconciled` and `fields.commits` updated to the current, valid SHA(s).

See BUG-863 (xgendev-main) for full recovery methodology.