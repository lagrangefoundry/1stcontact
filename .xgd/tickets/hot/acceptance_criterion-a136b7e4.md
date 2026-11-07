---
uid: acceptance_criterion-a136b7e4
id: AC-911
type: acceptance_criterion
title: Repeat requests are answered without re-reading the store, while not-found
  responses are never retained
created_by: xgd
created_at: '2026-08-06T18:49:40.257733+00:00'
updated_at: '2026-11-07T06:57:16.466439+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A second anonymous request for a URL that previously returned successfully is
answered with the same status, headers and body without the underlying store being
read again. A not-found response is never retained: a URL that answered not-found
because nothing was published there begins serving as soon as a publish makes it
real, with no wait and no manual invalidation.

Two kinds of response sit outside this repeat-request cache by design (pinned in
the session cache-policy criterion): a response for a page carrying the account
chrome is never retained, and a request carrying a session for the host is never
answered from what was retained.

## Verification

Request a published asset twice, with no session, against an instrumented store and
assert the second response matches the first while recording no additional store
read. Request a URL that answers not-found, then request the identical URL again and
assert the store was read a second time — a retained not-found would show as no
further read. Request a URL for a site that has published nothing, assert
not-found, then publish to that address and request the identical URL again,
asserting it now serves successfully.
