---
uid: acceptance_criterion-ab58a7b1
id: AC-1380
type: acceptance_criterion
title: 'A newly published signing key is honoured without a restart: the rotated token
  is not refused as unsigned'
created_by: xgd
created_at: '2026-08-31T09:32:22.807355+00:00'
updated_at: '2026-09-10T04:34:13.579430+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

An identity signed by a key the gateway began publishing *after* the gate last
read the key set is **not refused as unsigned**, without the deployment being
restarted or redeployed: the refusal that names an unknown signing key is not
produced, and the caller is not turned away as unauthenticated.

Key rotation is routine. A gate that reused a stale key set until it expired
would refuse every valid identity for that interval, and "valid identity,
refused" is an outage that reads to an operator like a break-in.

The claim is about the gate's verdict on the rotated token, not about the
response the caller receives — what answers behind the gate is a separate
decision and is not asserted here.

## Verification

Let one request pass the gate, so the gate has read and retained the current key
set. Have the gateway publish an additional signing key and issue an identity
signed by it. Present that identity to the same running gate and observe that it
is not refused as unauthenticated and that no refusal names an unmatched signing
key — no restart, no configuration change, no waiting out a cache interval. The
warm-up request is likewise asserted only as "not refused": what it needs to
establish is that the key set was fetched, not what it was served.
