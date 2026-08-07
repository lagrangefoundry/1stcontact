---
uid: acceptance_criterion-08d88be5
id: AC-913
type: acceptance_criterion
title: The apex address returns a holding response and never serves any site's snapshot
created_by: xgd
created_at: '2026-08-06T18:50:01.754987+00:00'
updated_at: '2026-08-07T22:18:30.583259+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request for the root address returns a plain text-typed holding response with a
success status, and serves no deployed site's content under any circumstances —
regardless of how many sites are deployed or which of them is published. Sites
are reachable only under their own addressing form, so nothing becomes publicly
visible at the root before the operator chooses to put something there.

## Verification

With at least one deployed and published site in the store, request the root
address and assert the success status, the plain text type and the holding body,
and that the body contains none of the deployed site's content. Assert the same
holds for the root with a query string and for the root of a store containing no
sites at all.