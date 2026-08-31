---
uid: acceptance_criterion-9104b7ac
id: AC-1475
type: acceptance_criterion
title: A capture of a published site is fetched over the network like any other page
created_by: xgd
created_at: '2026-08-31T23:21:48.809665+00:00'
updated_at: '2026-08-31T23:21:48.809665+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7fa314f5
  kind: behavior
  regression_only: false
---

## Criterion

In-process fulfilment applies only where the deployment owns the host. A capture
of a published site — or of any address for which no host is owned — sends
**every** request to the network, including the navigation itself.

Published bytes live on a public host that no sign-in gate covers, so there is
nothing to avoid and nothing to substitute: the browser simply fetches the page
as any visitor would, and the picture is of what a visitor sees.

## Verification

Capture an ordinary public address through the deployment's capture path,
without naming an owned host. Assert that:

1. every request the page made, navigation included, was handed to the network;
2. no request was answered from inside the deployment;
3. image bytes are still returned.
