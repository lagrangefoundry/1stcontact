---
uid: comment-0687c704
id: COMMENT-508
type: comment
title: Comment on request REQ-11
created_by: xgd
created_at: '2026-07-24T22:33:16.072191+00:00'
updated_at: '2026-07-24T22:33:16.072191+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-53c276dd
  kind: note
---

**BUG-863 stale-commit recovery**

Original `fields.commits` SHA `44149639452c` went stale — the object still exists (`git cat-file -t` succeeds) but is no longer an ancestor of `main` or `xgd-working`, because repeated resync rebase cycles re-authored it under a new SHA. An exact `git patch-id` match (byte-identical diff) identifies the re-authored commit: `a1dea25179`, which is also independently corroborated by bundle-f39884d2's own `orphan_commits` remap record from its 2026-07-09 reconcile.

This commit is confirmed an **ancestor of `main`** — the work was already reconciled via BUNDLE-2 (bundle-f39884d2, status=free_and_reconciled) but this member ticket was never flipped out of `free_coded`. Status corrected to `free_and_reconciled`, `bundled_in` set to `bundle-f39884d2`, and `fields.commits` updated to the current, valid SHA.

See BUG-863 (xgendev-main) for full recovery methodology.