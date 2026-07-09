---
uid: acceptance_criterion-bd1ce2e5
id: AC-511
type: acceptance_criterion
title: contact-form width dial groups consecutive half-width forms into one side-by-side
  row
created_by: xgd
created_at: '2026-07-09T22:11:14.295987+00:00'
updated_at: '2026-07-09T22:11:14.295987+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
contact-form exposes a `width` dial (`full` default, `half`). When two or more consecutive module bands carry `width: half`, the render pipeline groups them into a single shared row wrapper so they sit side by side as equal columns (e.g. a subscribe form beside a contact form), each relaxing its own inner container to fill its column; on narrow viewports the row stacks back to a single column. A single half-width band, and full-width bands, are unaffected. The row's structural CSS is assembled into the site stylesheet by the render pipeline (no raw CSS in the site definition).

## Verification
Render a page with two consecutive `width: half` contact-forms and assert both are wrapped in one shared row and render as two columns; assert the row stacks to one column at a narrow viewport. Render a single half-width form and assert it is not wrapped in a multi-column row. Assert the shared row CSS is present in the generated stylesheet.
