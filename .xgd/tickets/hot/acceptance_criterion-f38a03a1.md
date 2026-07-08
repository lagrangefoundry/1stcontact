---
uid: acceptance_criterion-f38a03a1
id: AC-450
type: acceptance_criterion
title: contact-form renders one labelled control per configured field
created_by: xgd
created_at: '2026-07-08T19:29:17.548825+00:00'
updated_at: '2026-07-08T19:29:17.548825+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
A contact-form renders one labelled input control for each configured field, in order. A field of type `textarea` renders a textarea; any other type (`text`, `email`, `tel`) renders an input whose type matches the field type. Each control's required state reflects the field's `required` flag, and each is associated with its label text.

## Verification
Render a contact-form configured with three fields (including one textarea and one email field); assert three labelled controls with the correct element type and matching input types.
