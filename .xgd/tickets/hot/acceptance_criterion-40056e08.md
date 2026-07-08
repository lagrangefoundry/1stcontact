---
uid: acceptance_criterion-40056e08
id: AC-453
type: acceptance_criterion
title: contact-form renders a Turnstile mount point
created_by: xgd
created_at: '2026-07-08T19:29:47.636334+00:00'
updated_at: '2026-07-08T19:29:47.636334+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
The contact-form renders a dedicated mount-point element (marked with a Turnstile target hook) where an anti-spam widget can later attach. The form renders and functions normally whether or not the widget is present.

## Verification
Render a contact-form and assert a Turnstile-target mount element is present in the output while the form still renders its fields and submit control.
