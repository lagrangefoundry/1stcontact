---
uid: acceptance_criterion-8c6f8435
id: AC-680
type: acceptance_criterion
title: footer textColor renders the footer body/copyright in the given literal or
  role colour
created_by: xgd
created_at: '2026-07-19T03:35:06.308828+00:00'
updated_at: '2026-07-19T03:40:00.240719+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a footer is authored with `textColor` set to an absolute colour (`#hex`) or a palette role, the footer body/copyright text renders in that resolved colour instead of the surface default. With `textColor` unset, the footer text renders in the surface default colour.

## Verification
Render a footer with `textColor` as a `#hex` and as a palette role and confirm the copyright/body text renders in the resolved colour in each case; render without `textColor` and confirm the text uses the surface default.