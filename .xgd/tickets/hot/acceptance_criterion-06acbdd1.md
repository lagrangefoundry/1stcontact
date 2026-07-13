---
uid: acceptance_criterion-06acbdd1
id: AC-612
type: acceptance_criterion
title: Subscales use the render's px vocabulary end-to-end (zero translation)
created_by: xgd
created_at: '2026-07-13T20:48:45.557107+00:00'
updated_at: '2026-07-13T20:57:03.728844+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
A subscale accepts exactly the six render style axes — font family, font size (px), font weight, colour, letter-spacing (px), line-height (px) — as literal px values (or theme-alias strings), with every axis optional. A type value read by the fidelity capture from a reference element is a valid subscale value without any unit conversion: it can be authored directly into a theme subscale (and into a per-instance style) and validates.

## Verification
Take a per-axis value as the capture reports it and confirm it is accepted as a subscale axis by the type-token contract without transformation; confirm a subscale carrying only a subset of axes validates.