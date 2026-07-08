---
uid: acceptance_criterion-36a1eebf
id: AC-434
type: acceptance_criterion
title: Omitted token slots are filled from defaults so CSS always covers the full
  surface
created_by: xgd
created_at: '2026-07-08T19:20:09.030628+00:00'
updated_at: '2026-07-08T19:20:09.030628+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
When theme CSS is generated from a partial token set (some slots omitted, at any nesting depth), the output still declares a custom property for every slot: provided slots use the caller's values and omitted slots fall back to the framework's default value for that slot. The output is never missing a slot.

## Verification
Generate CSS from an input specifying only a subset of tokens (e.g. a couple of palette roles and one spacing key). Assert the overridden slots reflect the supplied values and that all remaining slots are present with their default values.
