---
uid: acceptance_criterion-2ec7e00e
id: AC-679
type: acceptance_criterion
title: footer copyright override renders a verbatim line replacing the generated copyright
created_by: xgd
created_at: '2026-07-19T03:35:02.401895+00:00'
updated_at: '2026-07-19T03:35:02.401895+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a footer is authored with a verbatim copyright string, the footer's copyright line renders exactly that string. When no override is provided, the footer renders the generated default line combining the year and the copyright holder (e.g. `© <year> <holder>`).

## Verification
Render a footer with a verbatim copyright override and confirm the rendered copyright line is exactly the provided string. Render a footer without the override and confirm the copyright line is the generated year-plus-holder default.
