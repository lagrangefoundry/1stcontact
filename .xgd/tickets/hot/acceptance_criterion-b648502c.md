---
uid: acceptance_criterion-b648502c
id: AC-477
type: acceptance_criterion
title: Malformed background values are rejected with a path pointing at the offending
  field
created_by: xgd
created_at: '2026-07-09T20:34:36.531520+00:00'
updated_at: '2026-07-09T20:34:36.531520+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
A background containing an invalid value fails validation, and the reported error identifies the offending field by its location path within the site (not a generic whole-object failure). Specifically:
- an overlay `color` that is not a hex color yields an error whose path points at the overlay color field
- an overlay `opacity` outside the 0..1 range yields an error whose path points at the overlay opacity field

## Verification
Validate a site whose module background has (a) a non-hex overlay color and (b) an opacity greater than 1. Assert validation fails in each case and that the returned errors include one whose path targets the specific offending field (`.../background/overlay/color` and `.../background/overlay/opacity` respectively).
