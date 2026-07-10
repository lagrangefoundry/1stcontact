---
uid: acceptance_criterion-8f2806dc
id: AC-549
type: acceptance_criterion
title: Safety dimension fails a broken render and identifies each violation category
created_by: xgd
created_at: '2026-07-10T00:14:58.498706+00:00'
updated_at: '2026-07-10T00:14:58.498706+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a6962b23
  kind: behavior
  regression_only: false
---

## Criterion
In the default (safety) dimension, the check throws a conformance failure that enumerates every violation when a fixture exhibits any of: horizontal overflow (document scroll width exceeds the viewport width), an expected-content container collapsed to zero height, clipped text hidden by an overflow container, a console error, an uncaught page error, or a failed network request. Each enumerated violation identifies its category by a stable identifier (the same identifier the exemption mechanism matches on) and the fixture/viewport that produced it, checked at both a desktop and a mobile viewport.

## Verification
Mount deliberately-broken fixtures (horizontal overflow, a zero-height content container, an uncaught page error) through an injected test-only catalog and assert the thrown failure carries the matching category identifier for each broken fixture.
