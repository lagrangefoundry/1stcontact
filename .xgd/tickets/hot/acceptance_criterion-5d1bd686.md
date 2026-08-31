---
uid: acceptance_criterion-5d1bd686
id: AC-1470
type: acceptance_criterion
title: 'The owned host is owned outright: every request to it is answered in-process
  and none reaches the network'
created_by: xgd
created_at: '2026-08-31T23:21:05.524810+00:00'
updated_at: '2026-08-31T23:30:57.259078+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7fa314f5
  kind: behavior
  regression_only: false
---

## Criterion

While capturing the deployment's own output, the deployment **owns its host
outright**. The rule is per-host, not per-path:

- Every request the page makes to that host — the navigation itself and every
  subresource it pulls — is answered from inside the deployment.
- A path on that host that nothing authored is answered **not found**, in
  process. This includes paths the draft channels have nothing at: a favicon, a
  build asset, a stray absolute link, or an address under the channel prefix
  naming a channel that does not exist.
- The count of requests addressed to that host that were handed to the network
  is **zero** — by any route, for any path.

A per-path rule is explicitly not sufficient: each unowned path that escaped
would land on the sign-in gate and come back as a challenge document the capture
would faithfully record.

## Verification

Capture a draft whose page requests its own relative assets, and arrange for the
page to additionally request two paths on the same host that nothing authored
(for example a favicon and a build-asset path). Then assert:

1. no request whose host is the deployment's own host was handed to the network
   — the list is empty, not merely short;
2. both unauthored paths were answered not-found from inside the deployment;
3. the page did request its own relative assets and they resolved against the
   real host, confirming the page kept a real origin rather than being handed a
   document with none.