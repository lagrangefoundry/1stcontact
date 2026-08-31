---
uid: comment-d0f355df
id: COMMENT-1768
type: comment
title: Comment on acceptance_criterion AC-927
created_by: xgd
created_at: '2026-08-31T11:53:57.578941+00:00'
updated_at: '2026-08-31T11:53:57.578941+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-1fc3d687
  kind: change
---

Removed during reconciliation of BUNDLE-20 (REQ-149), plan item 8, on
2026-08-31.

This criterion asserted that a site present only in the *non-servable* store
tree is not-found on every URL the addressing scheme admits. Both halves of the
situation it guarded are gone:

- The operator-side deploy command that wrote to shared storage from a laptop —
  the only thing that could ever place bytes in the second tree — was deleted
  when publishing moved into the platform. The intent states this outright
  ("only the Worker writes now, and it only ever writes its own tenant's real
  sites"), so the second tree has no writer, and the criterion has no way to be
  set up, let alone falsified. Its evidence UAT was deleted with the command.
- What actually held the guarantee up — that a request contributes nothing to
  the storage root, so a key is composed from server-side constants plus values
  the record supplied — survives, in stronger form, and is now stated in AC-905
  (the record-authority criterion), which additionally asserts that the frozen
  definition shipped beside a revision's rendered output is unreachable at any
  URL the grammar admits.

Nothing is lost: the property moved to where it is provable, and the part that
was removed is the part that had no writer left to produce it.
