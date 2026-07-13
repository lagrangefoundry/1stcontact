---
uid: acceptance_criterion-9f5aea90
id: AC-624
type: acceptance_criterion
title: Headings map ATX levels 1-6 and carry inline runs
created_by: xgd
created_at: '2026-07-13T21:00:46.552690+00:00'
updated_at: '2026-07-13T21:00:46.552690+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
A heading block records a level 1 through 6 corresponding to `#` through `######`, and carries inline runs so heading text may itself be individually styled. Each level round-trips to the same level, and inline overrides within a heading survive the round-trip.

## Verification
Parse each of `#`…`######` and assert heading levels 1–6; round-trip a heading containing a styled run and assert both the level and the run's overrides are preserved.
