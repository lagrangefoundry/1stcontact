---
uid: comment-0a36cd54
id: COMMENT-483
type: comment
title: Comment on bug BUG-6
created_by: xgd
created_at: '2026-07-24T22:29:41.448117+00:00'
updated_at: '2026-07-24T22:29:41.448117+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-b9eb2e3a
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `a4eef9db46f9` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `fb2830bfa1de`.

Content is confirmed present on `xgd-working` but **not yet an ancestor of `main`** — status left as `free_coded` (still legitimately pending reconciliation). `fields.commits` corrected to the current, valid SHA(s) so the ticket is dispatchable again.

See BUG-863 (xgendev-main) for full recovery methodology.