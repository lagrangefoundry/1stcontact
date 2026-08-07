---
uid: acceptance_criterion-46d5804e
id: AC-964
type: acceptance_criterion
title: The workspace and everything it displays are reachable from one origin, with
  nothing reinterpreted in between
created_by: xgd
created_at: '2026-08-07T01:44:09.731162+00:00'
updated_at: '2026-08-07T21:19:37.034969+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The workspace document, its components, its browser source, the rendered
channels and the workspace's operations are all reachable from one host, and
nothing is reinterpreted between the operator and the origin: what arrives at
the operator is the origin's own status, content type and body. The frame
showing a site is therefore never a foreign document — the frame's document URL
and the host's origin match, so no request the workspace makes is cross-origin.

This is stated about *one origin and what an operator observes*, not about a
proxy, so it holds unchanged whichever way the origin is arranged behind that
host (this story's Technical Context describes the current arrangement — a local
Node origin behind a verbatim edge front — as deliberate and temporary).

## Verification

Drive the workspace host for a representative set of routes (the workspace
document, a component module, a rendered page, a listing response) and assert
each arrives with the status, content type and body that route is defined to
produce, and that the reference each response makes to another of those routes
resolves on the same host. Assert the frame's document URL and the host's origin
match, so no request is cross-origin.

Additionally — **conditioned on a front being interposed** between the operator
and the origin, as it is today — fetch each of those routes from the origin
directly as well and assert the two responses are identical in status, content
type and body, so the front is proven to reinterpret nothing. When there is no
front and the host *is* the origin, this step no longer applies and must be
skipped with a stated reason, rather than degenerating into a route compared
with itself and passing vacuously.