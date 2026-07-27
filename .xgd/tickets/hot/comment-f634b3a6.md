---
uid: comment-f634b3a6
id: COMMENT-485
type: comment
title: Comment on request REQ-91
created_by: xgd
created_at: '2026-07-24T22:29:51.651766+00:00'
updated_at: '2026-07-24T22:29:51.651766+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-42385423
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `d399062ff928` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `5bfed7049b9b`.

Content is confirmed present on `xgd-working` but **not yet an ancestor of `main`** — status left as `free_coded` (still legitimately pending reconciliation). `fields.commits` corrected to the current, valid SHA(s) so the ticket is dispatchable again.

See BUG-863 (xgendev-main) for full recovery methodology.