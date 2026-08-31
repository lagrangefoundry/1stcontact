---
uid: acceptance_criterion-c4a49a1b
id: AC-1464
type: acceptance_criterion
title: Each capture's record of what its page requested contains only that page's
  own requests
created_by: xgd
created_at: '2026-08-31T22:53:32.700654+00:00'
updated_at: '2026-08-31T22:53:32.700654+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

A capture records every URL its page requested — issued or not, resolved or not
— and that record covers exactly one navigation. Two captures taken in sequence
from the same run each report only their own page's requests; neither carries
any part of the other's.

## Verification

Within one leased run, capture the same page twice as two separate captures.
Assert the second capture's requested-URL record has the same size and contents
as the first's did, rather than the union of both.

This is the one reuse that would be silent. That record is what the security
conformance dimension checks egress against, so a capture carrying a previous
page's requests would surface as a **clean verdict on a page that was not
clean** — a false answer, not a crash.
