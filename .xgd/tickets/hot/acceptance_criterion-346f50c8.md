---
uid: acceptance_criterion-346f50c8
id: AC-488
type: acceptance_criterion
title: A well-formed motion on a module instance and on a layer child validates and
  round-trips
created_by: xgd
created_at: '2026-07-09T20:51:55.460388+00:00'
updated_at: '2026-07-09T20:51:55.460388+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b13e15c5
  kind: behavior
  regression_only: false
---

## Criterion
A module instance carrying a `motion` object with a valid `type` (fade|slide|scale|stagger), `trigger` (load|scroll|hover), optional integer-millisecond `duration`/`delay`, and optional named `easing` passes site validation. The same holds for a `motion` attached to a layer child (image or text). The accepted definition survives a validate/normalize round-trip unchanged.

## Verification
Validate a site whose module instance carries a fully-specified motion, and a second site whose layer child carries one; both validations succeed. Confirm the returned/normalized site preserves the motion fields (type, trigger, duration, delay, easing) exactly as supplied.
