---
uid: acceptance_criterion-c996ef8e
id: AC-925
type: acceptance_criterion
title: A deploy from the non-servable store tree reports no shareable URL, and says
  why
created_by: xgd
created_at: '2026-08-06T20:15:40.605878+00:00'
updated_at: '2026-08-16T07:23:27.635135+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A deploy whose site came from the store tree nothing serves returns no shareable
URL — not an empty string, not a URL that would 404, but an explicit absence —
and its human-readable report ends in the snapshot's storage prefix followed by a
statement that the snapshot is not publicly reachable. The upload, the content
addressing and the index update are otherwise exactly what a servable deploy
does. The command's own help says the same thing, and points at the workaround
for exercising the serving path: use a throwaway slug in the servable tree.

## Verification

Deploy a site from the non-servable tree and assert that the result carries no
URL, that the last line of the formatted report names the snapshot's storage
prefix rather than an origin, and that it carries the not-publicly-reachable
note. Assert the corresponding servable-tree deploy of the same site still ends
in its URL.