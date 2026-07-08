---
uid: acceptance_criterion-24b7e9a1
id: AC-457
type: acceptance_criterion
title: Module content is rejected when required fields are missing or list bounds
  are violated
created_by: xgd
created_at: '2026-07-08T19:29:58.555074+00:00'
updated_at: '2026-07-08T19:29:58.555074+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
Content validated against a module's content contract is rejected when a required field is missing or a bounded list field falls outside its declared size range, with each violation reported against the offending field name. Content within bounds and with all required fields present validates cleanly (no errors). Concretely, services-grid `items` must be 2..6 and contact-form `fields` must be 1..8.

## Verification
Validate services-grid content with 1 item and with 7 items and assert a field-located error for `items` in each case; validate with 3 items and assert no errors. Validate contact-form content missing the required `action` and assert a field-located error.
