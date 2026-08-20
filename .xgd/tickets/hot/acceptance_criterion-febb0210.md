---
uid: acceptance_criterion-febb0210
id: AC-1340
type: acceptance_criterion
title: An unpublished site answers indistinguishably from an unknown one, in status
  and body, and a difference fails the check
created_by: xgd
created_at: '2026-08-20T05:31:41.608660+00:00'
updated_at: '2026-08-20T15:29:25.571136+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A site that exists but has published nothing must be **indistinguishable** from a site that does not
exist: the smoke check compares a request for a known-but-unpublished site against one for a slug
nothing will ever deploy and requires identical response status **and identical response body**. A
difference in either fails the check, with a message stating that the difference tells a stranger
the site exists.

When the site under test does have a live revision there is nothing to compare, and the check says
so as a passing detail rather than asserting on a comparison it cannot make.

## Verification

Point the check at an origin where the named site has published nothing: both requests answer
not-found with byte-identical bodies and the check passes. Change the origin so the unpublished
site answers a not-found body naming it: the check fails and its message says the difference
reveals the site's existence. Point it at an origin where the named site is published: the check
passes reporting that there was nothing to compare.