---
uid: acceptance_criterion-08d88be5
id: AC-913
type: acceptance_criterion
title: The apex address returns a holding response and never serves any site's content
created_by: xgd
created_at: '2026-08-06T18:50:01.754987+00:00'
updated_at: '2026-08-31T11:54:39.185889+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request for the root address returns a plain text-typed holding response with a
success status, and serves no published site's content under any circumstances —
regardless of how many sites are published or which revision each of them calls
live. Sites are reachable only under their own addressing form, so nothing
becomes publicly visible at the root before the operator chooses to put
something there.

## Verification

With at least one published site in the store, request the root address and
assert the success status, the plain text type and the holding body, and that
the body contains none of the published site's content. Assert the same holds
for the root with a query string and for the root of a store containing no sites
at all.
