---
uid: acceptance_criterion-17853e8b
id: AC-2073
type: acceptance_criterion
title: A write is not refused for a broken reference the stored page already carried,
  including when the change moves that reference to a different address
created_by: xgd
created_at: '2026-11-01T01:10:55.246236+00:00'
updated_at: '2026-11-01T01:10:55.246236+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

The broken-reference rule is on the write, not the page: a write may not introduce a font
family that resolves to nothing or an asset reference to an asset the site does not hold,
but it is not required to repair one the stored page already carried. A page that
arrived with such a reference — for instance from a reproduction whose source named a face
that could not be mirrored — can still be read, and any unrelated change to it is
accepted.

What counts as already carried is decided by the reference's value, not its address: a
change that inserts an element above an inherited broken reference, shifting its address,
is not refused for it. A page the write is creating has no prior version, so every broken
reference in it counts as introduced and is refused. A different broken reference
introduced by the same write is still refused.

## Verification

Store a page that already paints an unserved family with no generic fallback and
references a missing asset. Change an unrelated element's text: assert accepted. Insert a
new element before the element carrying the inherited reference (shifting its address):
assert accepted. In the same page, introduce a second, different unserved family: assert
refused naming the new family. Add a new page carrying a broken reference: assert
refused.