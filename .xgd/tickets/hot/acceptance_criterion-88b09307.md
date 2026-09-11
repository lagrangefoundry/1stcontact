---
uid: acceptance_criterion-88b09307
id: AC-1375
type: acceptance_criterion
title: A granted identity is not refused by the gate
created_by: xgd
created_at: '2026-08-31T09:32:10.407084+00:00'
updated_at: '2026-09-10T04:34:08.204848+00:00'
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

A request carrying a currently-valid identity — issued by the configured
identity gateway, for this application's audience, signed by a key the gateway
publishes, and not expired — is **not refused by this gate**: it is not turned
away as unauthenticated, and what comes back is not one of the gate's own
refusals.

The criterion is that the gate is **not what stops the builder working**. It
does not require the builder to do anything in particular, and — since passing
this gate stopped being admission — it does not require the caller to be served
either. A verified identity establishes *who* the caller is; whether they may be
here is a separate decision taken behind this gate, and it is that decision's
criteria, not this one, that say what an entitled caller receives and what an
unentitled one does.

So the observable claim is stated exactly at the gate's own boundary: this
caller was let past it. Whatever answers next is somebody else's business, and
asserting a particular answer here would make the gate depend on the surface and
the check that both depend on the gate.

## Verification

Drive the deployed request handler with a request bearing a freshly issued,
correctly signed, correctly addressed identity, against a gateway whose signing
keys are reachable. Observe that the response is **not** an authorisation
refusal, and that its body does not carry the gate's own rejection text — the
plain-text shape the gate produces when it turns a caller away. Do not assert a
success status or the surface's content type: both belong to what lies behind
the gate.
