---
uid: comment-ba08739d
id: COMMENT-501
type: comment
title: Comment on request REQ-74
created_by: xgd
created_at: '2026-07-24T22:31:07.989467+00:00'
updated_at: '2026-07-24T22:31:07.989467+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-69ca5755
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `f2db6c7e118a, 5b3442d9d37d` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `34484eed596b, ef5f6508d89f`.

These re-authored commits are confirmed **ancestors of `main`** — the work was already reconciled at some point but this ticket was never flipped out of `free_coded`. Status corrected to `free_and_reconciled` and `fields.commits` updated to the current, valid SHA(s).

See BUG-863 (xgendev-main) for full recovery methodology.