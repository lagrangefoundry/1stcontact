---
uid: acceptance_criterion-7791f71b
id: AC-983
type: acceptance_criterion
title: 'One save is one change: a change map is applied whole or not at all, and never
  half-written'
created_by: xgd
created_at: '2026-08-07T02:02:17.629189+00:00'
updated_at: '2026-08-07T02:12:06.546005+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A change map is applied as a single atomic change however many fields it names.
A map in which any entry is unacceptable writes **nothing** — no field of it is
applied, and the site has zero modified files afterwards. A well-formed map
results in exactly one modified page document.

## Verification

On a clean draft, submit a change map whose first entry is valid and whose second
is not; assert the operation fails and that the site reports zero modified files
and the first field's old value still in place. Then submit a well-formed map and
assert exactly one page document is reported modified.