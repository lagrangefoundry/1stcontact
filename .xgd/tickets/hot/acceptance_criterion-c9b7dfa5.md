---
uid: acceptance_criterion-c9b7dfa5
id: AC-1472
type: acceptance_criterion
title: Capturing a site that does not exist is answered not-found in-process, not
  fetched
created_by: xgd
created_at: '2026-08-31T23:21:21.503368+00:00'
updated_at: '2026-08-31T23:30:57.040994+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7fa314f5
  kind: behavior
  regression_only: false
---

## Criterion

Asking for a capture of a site the deployment does not hold does **not** produce
a fetch. The navigation itself is answered **not found** from inside the
deployment, and no request to the deployment's own host is handed to the network.

The failure is therefore a not-found page, which is legible, rather than a
sign-in challenge photographed as though it were the site.

## Verification

Request a capture naming a site slug that does not exist, against a deployment
that holds other sites. Assert that:

1. the document the browser was given for the navigation is a not-found
   response, produced from inside the deployment;
2. the list of requests to the deployment's own host handed to the network is
   empty.