---
uid: acceptance_criterion-1c85b1cc
id: AC-662
type: acceptance_criterion
title: A length dial set to an absolute literal renders that exact length verbatim
created_by: xgd
created_at: '2026-07-19T03:10:16.511598+00:00'
updated_at: '2026-07-19T03:10:16.511598+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
---

## Criterion

When a site definition sets a length-typed dial — top/bottom spacing, gap, logo
size, content offset, content inset, panel padding, or content width, on any
spacing-bearing module (text-block, services-grid, contact-form, hero, header,
footer) — to an absolute length (a px number such as `80px` or `880`, a relative
unit such as `50%`/`5rem`/`3vw`, or a content keyword such as `fit-content`), the
published site applies that exact value to the corresponding CSS property, without
snapping to the nearest named step.

## Verification

Author a site setting each length dial to a distinct absolute value (mixing px,
relative, and content forms), build it, and confirm the rendered output applies each
value verbatim to its property (e.g. a `contentWidth: 880px` produces an 880px cap).
