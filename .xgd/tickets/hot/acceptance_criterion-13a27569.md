---
uid: acceptance_criterion-13a27569
id: AC-551
type: acceptance_criterion
title: Declared exemption suppresses a specific check while other violations still
  fail
created_by: xgd
created_at: '2026-07-10T00:15:27.419864+00:00'
updated_at: '2026-07-10T00:15:27.419864+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a6962b23
  kind: behavior
  regression_only: false
---

## Criterion
A conformance run may declare a list of check-category identifiers a fixture legitimately opts out of. A violation whose identifier is in that list does not fail the run, while any non-excepted violation still causes the run to throw. This is the exemption mechanism a fixture uses to declare a deliberate, reasoned deviation.

## Verification
Run a fixture that produces a known violation both without and with that violation's category identifier in the exemption list: assert it throws when not excepted, and passes when the identifier is excepted; confirm an unrelated non-excepted violation still fails.
