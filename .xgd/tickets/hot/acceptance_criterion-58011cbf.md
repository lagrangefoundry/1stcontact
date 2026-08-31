---
uid: acceptance_criterion-58011cbf
id: AC-1377
type: acceptance_criterion
title: An unverifiable caller is refused, told which check failed, and never reaches
  anything behind the gate
created_by: xgd
created_at: '2026-08-31T09:32:14.546124+00:00'
updated_at: '2026-08-31T09:32:14.546124+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

A configured gate refuses any caller whose identity it cannot verify, with an
authorisation failure that names which check failed, and it refuses **before**
anything behind the gate is reached — no route matched, no store opened, no
byte read, no upstream consulted.

Every distinct way a caller can arrive without an identity the gateway issued is
refused, and each is distinguishable by the reason given:

- no identity presented at all;
- something that is not a well-formed token;
- a token signed by a key that is not the gateway's;
- an unsigned token whose own header claims no algorithm is needed — the
  algorithm comes from the gateway's published keys, never from the token;
- a token issued for a **different application in the same team** — every
  application in a team is signed by the same keys, so the audience is what
  separates them and the signature alone does not;
- a token issued by a different team;
- an expired token;
- a token naming a signing key the gateway does not publish.

There is no configuration of a configured gate under which any of these is
admitted.

## Verification

Drive the request handler once per case above, minting each token for real
rather than using fixtures, so that a forged case is genuinely signed by a key
that is not the gateway's. For each, observe: an authorisation-failure status
(distinct from the unconfigured-gate status), a message matching the specific
check that failed, and that nothing behind the gate was consulted.
