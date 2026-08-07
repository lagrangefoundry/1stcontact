---
uid: acceptance_criterion-46d5804e
id: AC-964
type: acceptance_criterion
title: The workspace and everything it displays are reachable from a single origin,
  forwarded verbatim
created_by: xgd
created_at: '2026-08-07T01:44:09.731162+00:00'
updated_at: '2026-08-07T01:58:19.562213+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The workspace document, its components, its browser source, the rendered
channels and the workspace's operations are all reachable from one host, so the
frame showing a site is never a foreign document. A request made to that host is
answered with the origin's own status, content type and body unchanged — the
front reinterprets nothing.

## Verification

Drive the workspace host for a representative set of routes (the workspace
document, a component module, a rendered page, a listing response) and compare
each response's status, content type and body against the same route fetched
directly from the origin: identical in all three. Assert the frame's document URL
and the host's origin match, so no request is cross-origin.