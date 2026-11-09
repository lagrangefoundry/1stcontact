---
uid: acceptance_criterion-9834a044
id: AC-2514
type: acceptance_criterion
title: contact-form renders a checkbox field with a value, an associated label and
  no placeholder
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:37.408591+00:00'
updated_at: '2026-11-09T00:54:13.365437+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A `contact-form` may declare a field of type `checkbox`, alongside `text`, `email`, `tel` and `textarea`. The published form renders it as:
- an `<input type="checkbox">` with that field's name and a fixed value, so that a tick submits an answer
- an associated, invariant programmatic `<label for=…>`, with its wording visible beside the box
- no placeholder

The default form layout places the box and its wording in a row, with the box sized as an 18px control.

## Verification
Validate a form config with a checkbox field (expect no errors), then render it. Assert the checkbox input's name, type and value, the associated label and visible wording, the absence of a placeholder, and that the default preset validates as L1 with the checkbox control at 18px.