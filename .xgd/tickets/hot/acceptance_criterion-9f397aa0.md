---
uid: acceptance_criterion-9f397aa0
id: AC-1450
type: acceptance_criterion
title: An automation caller presents the service-token pair, never the assertion header
  the gateway forwards
created_by: xgd
created_at: '2026-08-31T17:03:05.823184+00:00'
updated_at: '2026-08-31T17:13:35.705576+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

An automation caller copying a site up to a gated deployment presents the
service token as the **pair** the gateway accepts: a client-id header and a
client-secret header, both set on the import request.

It never sends the assertion header the gateway itself sets on the request it
forwards inward. That header is the far side's, carrying an identity the gateway
has already verified; a client presenting it inbound is asserting an identity it
has not proved, and is refused at the edge exactly as one presenting nothing is.
It is not sent as a fallback, an alternative, or a legacy mode — it is not sent.

A push made with no credential configured sends neither header, so the ordinary
loop against an ungated local origin acquires no credential requirement as a
side effect.

The credential is taken from the environment by default and may be overridden
per-invocation by explicit options; the environment is the ordinary path,
because a secret named on a command line lands in shell history.

## Verification

Push a site to a gated origin with a credential configured, and observe the
outgoing request carries the client-id and client-secret headers with the values
supplied, and carries no assertion header under any casing.

Push a site with no credential configured, and observe the outgoing request
carries neither credential header and is not refused for want of one.