---
uid: acceptance_criterion-8c52eb75
id: AC-456
type: acceptance_criterion
title: contact-form JS enhancement surfaces an inline error on a failed response
created_by: xgd
created_at: '2026-07-08T19:29:55.919628+00:00'
updated_at: '2026-07-08T19:29:55.919628+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
When the enhanced submit receives a non-2xx response (or the request cannot be made), an error message is shown inline near the form and the visitor is not navigated away; the form remains present so the submission can be retried.

## Verification
With the enhancement attached and `fetch` mocked to return a non-2xx response, dispatch a submit; assert an inline error message becomes visible, the form is still present, and no navigation occurs.
