---
uid: acceptance_criterion-7fc21f0c
id: AC-1579
type: acceptance_criterion
title: A file given to 'put it on the site' with a site open is on that site when
  the answer returns, under a name it states
created_by: xgd
created_at: '2026-09-04T04:52:00.692864+00:00'
updated_at: '2026-09-04T04:52:00.692864+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

A file given to "put it on the site" while a site is open is in that site's asset library by the
time the request answers — not queued for a later step — and the answer names the asset name it was
stored under. The bytes are a copy held by the site itself, servable from the site, rather than a
pointer into the client's private material store, which the public site host cannot reach at all.
The material record remains in the client's library as well.

## Verification

Give a file to the site answer with a site open. Confirm the site's asset library now lists an asset
under the reported name, that fetching it returns the same bytes, and that the material record still
exists in the client's library.
