---
uid: acceptance_criterion-ab58a7b1
id: AC-1380
type: acceptance_criterion
title: A newly published signing key is honoured without a restart
created_by: xgd
created_at: '2026-08-31T09:32:22.807355+00:00'
updated_at: '2026-08-31T09:32:22.807355+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

An identity signed by a key the gateway began publishing *after* the gate last
read the key set is admitted, without the deployment being restarted or
redeployed.

Key rotation is routine. A gate that reused a stale key set until it expired
would refuse every valid identity for that interval, and "valid identity,
refused" is an outage that reads to an operator like a break-in.

## Verification

Admit one request, so the gate has read and retained the current key set. Have
the gateway publish an additional signing key and issue an identity signed by
it. Present that identity to the same running gate and observe it is admitted —
no restart, no configuration change, no waiting out a cache interval.
