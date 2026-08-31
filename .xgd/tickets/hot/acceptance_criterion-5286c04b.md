---
uid: acceptance_criterion-5286c04b
id: AC-965
type: acceptance_criterion
title: A deployment that names no account and one naming an account the store does
  not hold are reported as distinct, explanatory failures
created_by: xgd
created_at: '2026-08-07T01:44:14.144764+00:00'
updated_at: '2026-08-31T10:11:30.065588+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A workspace that cannot serve says which piece of configuration is missing, and
says it distinctly. When the deployment names no account for the store to be
opened against, the response names that setting and where it has to be declared,
at a status that marks the service as unavailable rather than the request as
bad. When an account is named but the store does not hold it — or holds it
inactive — the response reports that instead, and is distinguishable from the
unnamed case. Neither returns a blank page, and neither returns a success
status.

Two properties of this are what make it worth asserting rather than assuming:

- **The failure keeps its own status.** Opening the store happens only once a
  route needs it, which puts the failure inside the request handling rather than
  before it. It must still be reported as a configuration failure and must not be
  flattened into the generic "something went wrong on this request" answer that
  the same handler produces for an unexpected error.
- **It is a different answer from a refused caller.** A caller the gate did not
  admit is refused before any of this is reached, so the two are never confused:
  an operator told "you are not admitted" and an operator told "this deployment
  names no account" have entirely different things to do next.

## Verification

Ask the workspace, as an admitted caller, for a route that reads the store,
against a deployment that names no account: assert the status marks the service
as unavailable and the body names the missing setting. Repeat against a
deployment naming an account the store does not hold, and assert a report that
is distinguishable from the first — the failure must be attributable without
reading a log. Assert neither response is a success and neither body is empty.

Assert the same failure reaches the operator unchanged from a route that reads
the store deep inside its handling, not only from one that would fail
immediately: the point of the criterion is that deferring *when* the store opens
did not change *what* the failure is called.
