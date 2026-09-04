---
uid: acceptance_criterion-88b09307
id: AC-1375
type: acceptance_criterion
title: A currently-valid identity passes the gate, and what happens next is decided
  behind it
created_by: xgd
created_at: '2026-08-31T09:32:10.407084+00:00'
updated_at: '2026-09-04T06:05:07.070790+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

A request carrying a currently-valid identity — issued by the configured
identity gateway, for this application's audience, signed by a key the gateway
publishes, and not expired — **passes the gate**: it is met with none of the
gate's own refusals, and whatever answers it is produced behind the gate rather
than by the gate.

The criterion is that the gate is **not what stops the builder working**; it
does not require the builder, or anything else behind the gate, to do anything
in particular.

Passing the gate is not the same thing as being served. The identity gateway's
policy proves who the caller is and says nothing about whether they may be
here, so the verified identity is checked a second time behind the gate, and a
caller who is verified but not entitled is refused there. That refusal is not
one of the gate's, and this criterion neither requires nor forbids it — what
happens to a verified identity once it is past the gate is decided behind the
gate, and is asserted by the criteria that own that decision.

## Verification

Drive the deployed request handler with a request bearing a freshly issued,
correctly signed, correctly addressed identity, against a gateway whose signing
keys are reachable. Observe that the response is **not** an authorisation
failure and that its body is not one of the gate's own plain-text refusals —
neither the unverifiable-caller refusal nor the unconfigured-gate refusal.
Whatever answers instead belongs to what lies behind the gate and is not
asserted here.
