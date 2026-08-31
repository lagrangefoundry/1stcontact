---
uid: acceptance_criterion-46d5804e
id: AC-964
type: acceptance_criterion
title: The workspace and everything it displays are reachable from one origin by an
  admitted caller, with nothing reinterpreted in between
created_by: xgd
created_at: '2026-08-07T01:44:09.731162+00:00'
updated_at: '2026-08-31T10:11:25.062164+00:00'
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

For an **admitted** caller, the workspace document, its components, its browser
source, the rendered channels and the workspace's operations are all reachable
from one host, and nothing is reinterpreted between the operator and the origin:
what arrives at the operator is the origin's own status, content type and body.
The frame showing a site is therefore never a foreign document — the frame's
document URL and the host's origin match, so no request the workspace makes is
cross-origin.

The qualification is load-bearing rather than decorative: the same host, asked
by a caller the access gate has **not** admitted, serves none of it. A refusal
arrives instead, and it carries none of the bytes the route would have produced
— for an operation, for a rendered channel, and for a build artifact alike. The
artifacts are the case worth stating, because they are the ones that could have
been answered by the asset layer before the origin ever saw the request.

This is stated about *one host and what an operator observes*, not about the
arrangement behind it, which is why it survived that arrangement changing: the
host is now the origin itself, with no forwarding front between them.

## Verification

Drive the workspace host as an admitted caller for a representative set of
routes — the workspace document, a component or build artifact, a rendered page,
a listing response — and assert each arrives with the status, content type and
body that route is defined to produce, and that the reference each response
makes to another of those routes resolves on the same host. Assert the frame's
document URL and the host's origin match, so no request is cross-origin.

Then repeat at least one route of each class as an **unadmitted** caller and
assert it is refused, and that the refusal body does not contain what the
admitted response contained. Include the build artifact explicitly: an artifact
served ahead of the gate would be served to anyone, so it is the assertion that
distinguishes "the origin runs first" from "the asset layer answers first".

There is no forwarding front to compare against any more, so the former
side-by-side comparison of host and origin responses no longer applies and must
not be restated as a route compared with itself.
