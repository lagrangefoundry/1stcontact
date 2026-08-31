---
uid: acceptance_criterion-88b09307
id: AC-1375
type: acceptance_criterion
title: A granted identity is admitted and receives the response of the surface behind
  the gate
created_by: xgd
created_at: '2026-08-31T09:32:10.407084+00:00'
updated_at: '2026-08-31T09:41:08.477529+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

A request carrying a currently-valid identity — issued by the configured
identity gateway, for this application's audience, signed by a key the gateway
publishes, and not expired — is admitted, and the caller receives whatever the
surface behind the gate answers.

The criterion is that the gate is **not what stops the builder working**; it
does not require the builder to do anything in particular. Whatever response the
surface currently produces is the correct outcome, provided it is that surface's
response and not a refusal.

## Verification

Drive the deployed request handler with a request bearing a freshly issued,
correctly signed, correctly addressed identity, against a gateway whose signing
keys are reachable. Observe that the response is a success response produced by
the surface behind the gate — not one of the gate's own refusals — and that its
body and content type are the surface's, not the gate's plain-text refusal
shape.