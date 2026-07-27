---
uid: comment-514a91d3
id: COMMENT-509
type: comment
title: Comment on request REQ-9
created_by: xgd
created_at: '2026-07-24T22:33:39.258735+00:00'
updated_at: '2026-07-24T22:33:39.258735+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-b19f2526
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA `f7ac42ce5e72` went stale — the object still exists (`git cat-file -t` succeeds) but is no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored it under a new SHA. An exact `git patch-id` match (byte-identical diff) identifies the re-authored commit: `0baf0db1f1`, which is also independently corroborated by bundle-f39884d2's own `orphan_commits` remap record from its 2026-07-09 reconcile.

This commit is confirmed an **ancestor of `main`** — the work was already reconciled via BUNDLE-2 (bundle-f39884d2, status=free_and_reconciled) but this member ticket was never flipped out of `free_coded`. Status corrected to `free_and_reconciled`, `bundled_in` set to `bundle-f39884d2`, and `fields.commits` updated to the current, valid SHA.

See BUG-863 (xgendev-main) for full recovery methodology.