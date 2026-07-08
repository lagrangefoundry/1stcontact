---
uid: acceptance_criterion-1e3c6eb7
id: AC-451
type: acceptance_criterion
title: contact-form is a real POST form that submits to the configured action without
  JS
created_by: xgd
created_at: '2026-07-08T19:29:20.145307+00:00'
updated_at: '2026-07-08T19:29:20.145307+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
The contact-form is server-rendered as a real HTML form that submits without JavaScript: it uses an HTTP POST method and its submission target is the configured `action` URL, so submitting reloads the page against that endpoint.

## Verification
Render a contact-form with a configured action URL and assert the form element uses method POST and targets that exact action URL, with no dependency on client script to submit.
