---
uid: acceptance_criterion-bc7cc7f1
id: AC-1022
type: acceptance_criterion
title: The store answers from the command line without any editing gesture
created_by: xgd
created_at: '2026-08-07T04:30:06.593528+00:00'
updated_at: '2026-10-26T01:09:54.959760+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Asking a site for its assets from the command line succeeds without rendering a
page, opening any editing surface, or naming any region — the site alone is enough
input. It reports success and returns the site's assets as a list of entries, each
carrying id, handle, usage kind and present-on-disk — no descriptive text and no
declared-in-definition or registered field. The human-readable output prints one
line per asset (id, handle, kind) and never marks an asset `(unregistered)` or
otherwise as a lesser kind of asset. A site with no files answers with an empty
list (shown as "no assets") and still reports success — "this site has no assets"
is an answer, not a failure.

## Verification

On a site whose store holds several files, invoke the listing from the command
line with the site as its only input and assert it succeeds, returns every asset
with exactly that entry shape, and that the human output contains no
`(unregistered)` marker. Repeat on a site with no assets and assert an empty list
and a success result rather than an error.
