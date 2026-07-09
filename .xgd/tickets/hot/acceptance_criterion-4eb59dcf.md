---
uid: acceptance_criterion-4eb59dcf
id: AC-496
type: acceptance_criterion
title: Scalar content values include number and boolean
created_by: xgd
created_at: '2026-07-09T21:01:38.211360+00:00'
updated_at: '2026-07-09T21:01:38.211360+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
Scalar content values are not limited to strings: a `content` value may be a number or a boolean as well as a string, and each survives validation as its own primitive type rather than being coerced to text. A module authoring a boolean (e.g. a contact-form field's `required: true`) or a number (e.g. a field's `maxLength: 120`) validates successfully and the returned value carries the original boolean/number, not a stringified form.

## Verification
Submit a structurally valid site whose module content includes a boolean value and a number value. Assert the result reports success and that the returned value preserves the boolean as a boolean and the number as a number.
