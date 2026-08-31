---
uid: acceptance_criterion-22527da3
id: AC-1439
type: acceptance_criterion
title: The minor-unit scale comes from the currency, never a fixed two
created_by: xgd
created_at: '2026-08-31T12:39:11.548498+00:00'
updated_at: '2026-08-31T12:47:21.017908+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

An amount expressed in a currency's smallest unit is scaled by that currency's
own minor-unit count when it is displayed.

- A currency with no minor unit renders the whole integer as the major amount —
  a four-figure minor-unit count reads as a four-figure price, not as a
  two-decimal fraction of one.
- A currency with three minor units renders three fractional places.
- A currency with two minor units renders two.

A fixed divisor is observably absent: the zero-minor-unit case would render a
hundredfold too small and the three-minor-unit case a thousandfold too large if
one were used.

## Verification

Format the identical minor-unit integer in a zero-minor-unit currency, a
three-minor-unit currency and a two-minor-unit currency, each in a locale that
uses it, and assert each output carries that currency's number of fractional
places and the correspondingly scaled major amount. Include a second
zero-minor-unit currency in a locale that groups digits differently, so the
claim is about the currency rather than about one locale.