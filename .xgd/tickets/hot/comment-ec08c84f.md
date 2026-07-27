---
uid: comment-ec08c84f
id: COMMENT-489
type: comment
title: Comment on request REQ-87
created_by: xgd
created_at: '2026-07-24T22:30:11.333709+00:00'
updated_at: '2026-07-24T22:30:11.333709+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-84af044b
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `dd936736d5c1` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `6cb7e8c4a732`.

Content is confirmed present on `xgd-working` but **not yet an ancestor of `main`** — status left as `ready_to_reconcile` (still legitimately pending reconciliation). `fields.commits` corrected to the current, valid SHA(s) so the ticket is dispatchable again.

See BUG-863 (xgendev-main) for full recovery methodology.