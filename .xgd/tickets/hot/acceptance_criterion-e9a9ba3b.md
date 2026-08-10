---
uid: acceptance_criterion-e9a9ba3b
id: AC-1031
type: acceptance_criterion
title: The draft-side channels answer from the origin with no rendered artifact on
  disk, and serving one writes nothing back
created_by: xgd
created_at: '2026-08-10T07:29:02.418541+00:00'
updated_at: '2026-08-10T07:39:50.117873+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

With no rendered output anywhere on disk for a site, the workspace origin still
answers for both of that site's draft-side channels — the ordinary rendering and
the editable one. A request returns the whole page: the document, the stylesheet
it references, and the site's own image assets, all over the same origin.

Serving a channel materialises nothing. After any number of requests there is
still no rendered artifact on disk — a request that quietly wrote the channel out
the first time would satisfy every other assertion here while reintroducing the
very artifact whose absence this criterion is about.

## Verification

Over a site whose definition is present and valid, delete every rendered output
on disk. For each draft-side channel, request the channel root and assert a
successful HTML document comes back, then request the stylesheet it references
and assert it resolves over the same origin with a stylesheet content type, then
request one of the site's assets and assert it is served. Finally assert the
rendered-output location still does not exist.