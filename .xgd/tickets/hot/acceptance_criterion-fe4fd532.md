---
uid: acceptance_criterion-fe4fd532
id: AC-1441
type: acceptance_criterion
title: An amount that is not a whole number of minor units, or a currency argument
  that is not an ISO 4217 code, is refused
created_by: xgd
created_at: '2026-08-31T12:39:13.430132+00:00'
updated_at: '2026-08-31T12:39:13.430132+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

Two inputs are rejected outright rather than formatted:

- An amount that is not a whole number of minor units. The failure names the
  requirement (an integer count of minor units) and reports the offending value.
- A currency argument that is not a three-letter ISO 4217 code. The failure
  names ISO 4217, reports the offending value, and states the expected argument
  order — because the currency and locale arguments are both strings and
  supplying them the wrong way round would otherwise render something
  plausible-looking rather than failing.

In both cases nothing is returned: the caller observes a failure, not a
best-effort string.

## Verification

Attempt to format a fractional amount and assert the failure names the integer
requirement. Attempt to format with the currency and locale arguments
transposed (a locale tag in the currency position) and assert the failure names
ISO 4217. Confirm no formatted value is produced in either case.
