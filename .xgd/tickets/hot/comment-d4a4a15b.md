---
uid: comment-d4a4a15b
id: COMMENT-497
type: comment
title: Comment on request REQ-75
created_by: xgd
created_at: '2026-07-24T22:30:48.677546+00:00'
updated_at: '2026-07-24T22:30:48.677546+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-2ca9551c
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `0b533d55ee31` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `4caffc0b775a`.

These re-authored commits are confirmed **ancestors of `main`** — the work was already reconciled at some point but this ticket was never flipped out of `ready_to_reconcile`. Status corrected to `free_and_reconciled` and `fields.commits` updated to the current, valid SHA(s).

See BUG-863 (xgendev-main) for full recovery methodology.