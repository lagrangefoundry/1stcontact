---
uid: acceptance_criterion-be4510ae
id: AC-678
type: acceptance_criterion
title: contact-form submitColor paints the submit button fill with the given literal
  or role colour
created_by: xgd
created_at: '2026-07-19T03:34:58.522467+00:00'
updated_at: '2026-07-19T03:34:58.522467+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a contact-form is authored with `submitColor` set to an absolute colour (e.g. a `#hex`) or a palette role, the submit button's background fill renders in that resolved colour. With `submitColor` unset, the button retains its default treatment fill (unchanged).

## Verification
Render a contact-form with `submitColor` as a `#hex` and confirm the submit button background is that colour; render with a palette role and confirm the button background is the role's resolved colour; render with `submitColor` omitted and confirm the default button fill is unchanged.
