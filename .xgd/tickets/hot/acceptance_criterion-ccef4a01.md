---
uid: acceptance_criterion-ccef4a01
id: AC-455
type: acceptance_criterion
title: contact-form JS enhancement swaps in the success message on a successful response
created_by: xgd
created_at: '2026-07-08T19:29:53.243075+00:00'
updated_at: '2026-07-08T19:29:53.243075+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
When the enhanced submit receives a successful (2xx) response, the form is replaced in place by the configured success message (rendered from its markdown), without navigating away.

## Verification
With the enhancement attached and `fetch` mocked to return a 2xx response, dispatch a submit; assert the form is replaced by the success-message content and no navigation occurs.
