---
uid: acceptance_criterion-926f28e4
id: AC-446
type: acceptance_criterion
title: text-block content width is fixed by its variant, not a dial
created_by: xgd
created_at: '2026-07-08T19:28:52.017183+00:00'
updated_at: '2026-07-08T19:28:52.017183+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
The width of a text-block's content column is determined by its variant: the `prose` variant constrains content to the narrow container width, and the `landing` variant constrains it to the default container width. No dial changes this width.

## Verification
Render the same content under each variant and observe, via the published markup/stylesheet, that `prose` is bound to the narrow container width and `landing` to the default container width.
