---
uid: acceptance_criterion-c8b6ac0a
id: AC-677
type: acceptance_criterion
title: contact-form submitInline renders a field and the submit button on one row
created_by: xgd
created_at: '2026-07-19T03:34:54.431161+00:00'
updated_at: '2026-07-19T03:34:54.431161+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a contact-form is authored with the inline-submit treatment enabled, the field and the submit button render together on a single row. With the treatment disabled or unset (default), the submit button renders on its own line below the fields.

## Verification
Render a contact-form with the inline-submit treatment enabled and confirm the field and submit button lay out on one row; render it disabled and confirm the button stacks below the fields.
