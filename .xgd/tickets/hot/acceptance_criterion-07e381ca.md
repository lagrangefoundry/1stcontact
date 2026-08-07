---
uid: acceptance_criterion-07e381ca
id: AC-1023
type: acceptance_criterion
title: The store answers from the builder's own origin with the same list, and a request
  without a site is refused as a caller fault
created_by: xgd
created_at: '2026-08-07T04:30:10.978017+00:00'
updated_at: '2026-08-07T04:36:49.590772+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

The same listing is reachable over the builder's origin, without opening a page or
an editing surface, and returns the same entries the command line returns for the
same site — one store with two ways in, not two stores. A request that omits the
site is answered as the caller's mistake: a client-error status, carrying a message
naming the missing input, rather than a server failure or an empty success.

## Verification

With the builder origin running over a seeded site, request the asset listing
directly and assert a success status and entries matching the command line's
answer for that site. Then request it with no site given and assert a client-error
status (400) with a message identifying the missing site.