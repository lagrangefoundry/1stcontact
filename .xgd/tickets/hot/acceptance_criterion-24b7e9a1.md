---
uid: acceptance_criterion-24b7e9a1
id: AC-457
type: acceptance_criterion
title: Module content is rejected when required fields are missing or list bounds
  are violated
created_by: xgd
created_at: '2026-07-08T19:29:58.555074+00:00'
updated_at: '2026-07-09T22:10:19.646157+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
Content validated against a module's content contract is rejected when the contract is violated at any depth, with each violation reported against a dotted/indexed field path. The contract supports enum fields (a `values` set) and nested `itemSchema` on list/object fields, and the validator recurses through `itemSchema` so the same rules apply at every level. Specifically it flags: a missing required field; a bounded list field outside its declared size range (services-grid `items` 2..6, contact-form `fields` 1..8; card `checklist` at most 8); and an enum field whose value is outside its declared set (e.g. a card `accent`, card `surface`, or `badge.variant` outside its allowed roles). Nested violations are reported with paths such as `items[0].badge.variant`. Content that satisfies the contract validates cleanly (no errors).

## Verification
Validate services-grid content with 1 item and with 7 items and assert a field-located error for `items` in each case; validate with 3 valid cards and assert no errors. Validate a card whose `accent` (or `badge.variant`) is outside its enum and assert an error reported at the nested path (e.g. `items[0].badge.variant`). Validate a card `badge` missing its required `label` and assert a `items[N].badge.label` error. Validate contact-form content missing the required `action` and assert a field-located error.
