---
uid: acceptance_criterion-3e14ac35
id: AC-1376
type: acceptance_criterion
title: The identity is accepted from the forwarded header, the browser cookie, or
  an automation service identity
created_by: xgd
created_at: '2026-08-31T09:32:12.547116+00:00'
updated_at: '2026-08-31T09:41:08.356189+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

The same valid identity is admitted however it arrives:

- on the request header the identity gateway attaches to what it forwards;
- in the browser cookie the gateway sets, found among other unrelated cookies;
- as an **automation service identity**, which carries a machine name in place
  of a person's email address, and which is admitted on exactly the same terms
  as a human identity — same signature, audience, issuer and expiry checks.

When both the header and the cookie are present, the header is the one used: it
is what the gateway attaches to the request it forwards, and the cookie is the
copy the client controls.

## Verification

Present one valid identity three ways — header only; cookie only, surrounded by
other cookie pairs; and an identity whose subject is a machine name rather than
an email — and observe each is admitted. Then present a request carrying a valid
identity in the header and a different, stale value in the cookie, and observe
that the identity the gate acts on is the header's.