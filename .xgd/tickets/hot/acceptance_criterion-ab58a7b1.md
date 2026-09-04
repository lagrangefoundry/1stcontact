---
uid: acceptance_criterion-ab58a7b1
id: AC-1380
type: acceptance_criterion
title: A newly published signing key is honoured without a restart
created_by: xgd
created_at: '2026-08-31T09:32:22.807355+00:00'
updated_at: '2026-09-04T06:05:15.804413+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

An identity signed by a key the gateway began publishing *after* the gate last
read the key set passes the gate, without the deployment being restarted or
redeployed. In particular it is not refused as naming a signing key the gateway
does not publish.

Key rotation is routine. A gate that reused a stale key set until it expired
would refuse every valid identity for that interval, and "valid identity,
refused" is an outage that reads to an operator like a break-in.

## Verification

Present one request the gate verifies, so it has read and retained the current
key set. Have the gateway publish an additional signing key and issue an
identity signed by it. Present that identity to the same running gate and
observe it is not refused — no authorisation failure, and no message naming an
unmatched signing key — with no restart, no configuration change and no waiting
out a cache interval. What answers once the gate has passed it is decided behind
the gate and is not asserted here.
