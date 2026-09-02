---
uid: comment-a645e389
id: COMMENT-472
type: comment
title: Comment on bug BUG-17
created_by: xgd
created_at: '2026-07-24T22:28:49.582871+00:00'
updated_at: '2026-07-24T22:28:49.582871+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-88dfa748
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA(s) `b3e14ab524d9` went stale — the objects still exist (`git cat-file -t` succeeds) but are no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored them under new SHAs. No `git patch-id` match was found (conflict-resolution changed the diff slightly), but an exact, unique commit-message match on `xgd-working`'s full history identifies the re-authored commit(s): `c49a28c918ef`.

Content is confirmed present on `xgd-working` but **not yet an ancestor of `main`** — status left as `free_coded` (still legitimately pending reconciliation). `fields.commits` corrected to the current, valid SHA(s) so the ticket is dispatchable again.

See BUG-863 (xgendev-main) for full recovery methodology.