---
uid: acceptance_criterion-e34fd0c5
id: AC-452
type: acceptance_criterion
title: contact-form includes a hidden honeypot field
created_by: xgd
created_at: '2026-07-08T19:29:22.722138+00:00'
updated_at: '2026-07-08T19:29:22.722138+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
The contact-form renders a honeypot text field that is visually hidden from users (removed from tab order and excluded from autocomplete) but is submitted with the form so a downstream handler can reject submissions where it is filled.

## Verification
Render a contact-form and assert a named honeypot input is present, hidden from users, and outside the tab order (e.g. negative tabindex, autocomplete off).
