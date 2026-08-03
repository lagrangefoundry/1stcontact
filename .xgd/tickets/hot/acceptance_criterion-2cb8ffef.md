---
uid: acceptance_criterion-2cb8ffef
id: AC-750
type: acceptance_criterion
title: Each captured form control records its authored control type and its form's
  submission endpoint
created_by: xgd
created_at: '2026-08-03T00:25:15.234911+00:00'
updated_at: '2026-08-03T00:53:39.778999+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
For every visible form control a capture records, alongside its painted
geometry and accessible name, two behavioural facts that no painted value can
carry:
- the control's authored input type — a multi-line control and a selection
  control name themselves, a single-line control reports its authored type
  (defaulting to plain text when unstated), and a non-control element records
  none;
- the submission endpoint of the enclosing form, resolved to an absolute
  address. A control with no enclosing form, or a form declaring no endpoint,
  records none rather than a fabricated address.

## Verification
Capture a page with a form containing an email input, a plain text input and a
multi-line input, plus a control outside any form: each in-form control records
its distinct authored type and the form's resolved endpoint; the control outside
a form records no endpoint. A form declaring an empty endpoint records none.