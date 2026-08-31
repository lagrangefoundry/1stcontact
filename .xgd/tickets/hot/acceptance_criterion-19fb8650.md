---
uid: acceptance_criterion-19fb8650
id: AC-1435
type: acceptance_criterion
title: Every row of the country derivation table is itself valid site configuration
  and resolves back to itself
created_by: xgd
created_at: '2026-08-31T12:28:44.010502+00:00'
updated_at: '2026-08-31T12:28:44.010502+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

Every row of the platform's country derivation table is itself a valid site
locale declaration, and resolving that country reproduces exactly that row.

For each supported country, a site declaring that country together with the row's
locale, currency and timezone validates; and resolving the country alone yields
that row's three values plus the direction its locale implies. The table covers
at least `IE`, `GB` and the default country `US`.

A mistyped zone, a lower-case currency or a malformed language tag in a row
therefore fails when the row is added, rather than when a customer in that
country signs up.

## Verification

Enumerate every country in the derivation table. For each, validate a site
definition declaring that country and the row's three values, and observe it is
valid. For each, resolve the country alone and compare the result against the row
plus the direction derived from its locale. Assert the three named countries are
present.
