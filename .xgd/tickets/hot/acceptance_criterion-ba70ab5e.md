---
uid: acceptance_criterion-ba70ab5e
id: AC-1473
type: acceptance_criterion
title: A failure while producing the page is answered with a server error, never let
  through to the network
created_by: xgd
created_at: '2026-08-31T23:21:31.274012+00:00'
updated_at: '2026-08-31T23:30:56.931300+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7fa314f5
  kind: behavior
  regression_only: false
---

## Criterion

When producing the page for a request to the owned host fails, that request is
answered from inside the deployment with a **server-error response whose body
names the failure**. It is never passed through to the network.

Falling through on failure is the single outcome this mechanism exists to make
impossible: the fallen-through request lands on the sign-in gate and returns a
challenge document, and the capture records it as though it were the site. A
failure that is answered produces a legible broken page; a failure that is
passed through produces a confident wrong one.

## Verification

Capture a draft under conditions where producing the page raises — for example
a site whose stored definition cannot be rendered. Assert that:

1. the document the browser was given for that request is a server error, and
   its body carries the underlying failure's description rather than being
   empty or generic;
2. the request was **not** handed to the network — the list of requests to the
   deployment's own host that reached the network is still empty.

Assertion 2 is the one that matters and must be present: an implementation that
logged the error and continued would satisfy assertion 1 in spirit while
defeating the story.