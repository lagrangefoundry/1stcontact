---
uid: acceptance_criterion-1ce43d04
id: AC-454
type: acceptance_criterion
title: contact-form JS enhancement intercepts submit and POSTs JSON to the action
created_by: xgd
created_at: '2026-07-08T19:29:50.206087+00:00'
updated_at: '2026-07-08T19:29:50.206087+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
When client enhancement is active, submitting the contact-form is intercepted (the default full-page navigation is prevented) and the form's named values are sent as a JSON POST request to the configured `action` URL, including the honeypot field.

## Verification
In a DOM with the enhancement attached and `fetch` mocked, dispatch a submit; assert default navigation is prevented and a POST to the action URL is made with a JSON body containing the submitted field values.
