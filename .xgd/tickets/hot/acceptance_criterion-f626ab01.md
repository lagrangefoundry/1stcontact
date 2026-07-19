---
uid: acceptance_criterion-f626ab01
id: AC-681
type: acceptance_criterion
title: footer linkColor renders the footer links in the given literal or role colour
created_by: xgd
created_at: '2026-07-19T03:35:10.151247+00:00'
updated_at: '2026-07-19T03:40:00.076567+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a footer is authored with `linkColor` set to an absolute colour (`#hex`) or a palette role, the footer navigation links render in that resolved colour instead of the surface default. With `linkColor` unset, the links render in the surface default colour.

## Verification
Render a footer with `linkColor` as a `#hex` and as a palette role and confirm the footer links render in the resolved colour in each case; render without `linkColor` and confirm the links use the surface default.