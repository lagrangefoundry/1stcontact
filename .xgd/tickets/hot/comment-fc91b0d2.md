---
uid: comment-fc91b0d2
id: COMMENT-477
type: comment
title: Comment on bug BUG-12
created_by: xgd
created_at: '2026-07-24T22:29:12.496716+00:00'
updated_at: '2026-07-24T22:29:12.496716+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-61f43435
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `c78f27ae36b5` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `b0ad03b08ee2`.

Content is confirmed present on `xgd-working` but **not yet an ancestor of `main`** — status left as `ready_to_reconcile` (still legitimately pending reconciliation). `fields.commits` corrected to the current, valid SHA(s) so the ticket is dispatchable again.

See BUG-863 (xgendev-main) for full recovery methodology.